"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.handleOAuthCallback = exports.generateAuthUrl = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const googleapis_1 = require("googleapis");
const billing_1 = require("./billing");
const getOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID || functions.config().google?.client_id;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || functions.config().google?.client_secret;
    const projectId = process.env.GCLOUD_PROJECT || 'ai-lead-qualification-agent';
    const region = 'us-central1';
    let redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!redirectUri) {
        if (process.env.FUNCTIONS_EMULATOR === 'true') {
            redirectUri = `http://localhost:5001/${projectId}/${region}/handleOAuthCallback`;
        }
        else {
            redirectUri = `https://${region}-${projectId}.cloudfunctions.net/handleOAuthCallback`;
        }
    }
    if (!clientId || !clientSecret) {
        throw new functions.https.HttpsError('failed-precondition', 'Google OAuth Client ID and Secret are not configured in the backend environment variables.');
    }
    return new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
};
exports.generateAuthUrl = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const oauth2Client = getOAuthClient();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Force consent screen to ensure refresh token is returned
        scope: ['https://www.googleapis.com/auth/gmail.send'],
        state: context.auth.uid // Pass user UID as state
    });
    return { url };
});
exports.handleOAuthCallback = functions.https.onRequest(async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).send('');
        return;
    }
    res.set('Access-Control-Allow-Origin', '*');
    const code = req.query.code;
    const state = req.query.state; // This is the user's UID
    if (!code || !state) {
        res.status(400).send('Missing authorization code or state.');
        return;
    }
    try {
        const oauth2Client = getOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.refresh_token) {
            functions.logger.warn(`No refresh token returned for user ${state}. Consent prompt may have been bypassed.`);
        }
        const db = admin.firestore();
        const integrationData = {
            connectedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (tokens.refresh_token) {
            integrationData.refresh_token = tokens.refresh_token;
        }
        if (tokens.access_token) {
            integrationData.access_token = tokens.access_token;
        }
        if (tokens.expiry_date) {
            integrationData.expiry_date = tokens.expiry_date;
        }
        // Try to get Gmail address
        try {
            oauth2Client.setCredentials(tokens);
            const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
            const profile = await gmail.users.getProfile({ userId: 'me' });
            if (profile.data.emailAddress) {
                integrationData.email = profile.data.emailAddress;
            }
        }
        catch (profileErr) {
            functions.logger.error('Failed to fetch Gmail profile:', profileErr);
        }
        await db.collection('users').doc(state).collection('integrations').doc('google').set(integrationData, { merge: true });
        const projectId = process.env.GCLOUD_PROJECT || 'ai-lead-qualification-agent';
        const redirectHost = process.env.FUNCTIONS_EMULATOR === 'true'
            ? 'http://localhost:3000'
            : `https://${projectId}.web.app`;
        res.redirect(`${redirectHost}/dashboard`);
    }
    catch (error) {
        functions.logger.error('OAuth token exchange failed:', error);
        res.status(500).send(`Authentication failed: ${error.message}`);
    }
});
exports.sendEmail = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const userId = context.auth.uid;
    const { to, subject, body, threadId, previousMessageId } = data;
    if (!to || !subject || !body) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing parameters: to, subject, or body.');
    }
    // Deduct 1000 tokens for email send
    await (0, billing_1.checkAndIncrementTokens)(userId, 1000);
    const db = admin.firestore();
    const integrationRef = db.collection('users').doc(userId).collection('integrations').doc('google');
    const integrationSnap = await integrationRef.get();
    if (!integrationSnap.exists || !integrationSnap.data()?.refresh_token) {
        throw new functions.https.HttpsError('permission-denied', 'UNAUTHORIZED: Gmail integration is not connected or missing refresh token.');
    }
    const { refresh_token } = integrationSnap.data();
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token });
    try {
        const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
        // Inject 1x1 tracking pixel before signature or at the end of the body
        const projectId = process.env.GCLOUD_PROJECT || 'ai-lead-qualification-agent';
        // Dynamic tracking URL
        let trackingUrl = `https://us-central1-${projectId}.cloudfunctions.net/trackOpen`;
        if (process.env.FUNCTIONS_EMULATOR === 'true') {
            trackingUrl = `http://localhost:5001/${projectId}/us-central1/trackOpen`;
        }
        // Find lead ID from the caller (passed in data) or search by matching 'to' email
        let leadId = data.leadId;
        if (!leadId) {
            const leadsSnap = await db.collection('users').doc(userId).collection('leads').where('email', '==', to).limit(1).get();
            if (!leadsSnap.empty) {
                leadId = leadsSnap.docs[0].id;
            }
        }
        let trackedBody = body;
        if (leadId) {
            const pixelTag = `<img src="${trackingUrl}?leadId=${leadId}&userId=${userId}" width="1" height="1" style="display:none;" />`;
            trackedBody = `${body}\r\n${pixelTag}`;
        }
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            'Content-Type: text/html; charset="UTF-8"',
            'MIME-Version: 1.0',
        ];
        if (threadId) {
            if (previousMessageId) {
                messageParts.push(`In-Reply-To: ${previousMessageId}`);
                messageParts.push(`References: ${previousMessageId}`);
            }
            messageParts.push(`Thread-Id: ${threadId}`);
        }
        messageParts.push('');
        messageParts.push(trackedBody);
        const message = messageParts.join('\r\n');
        const encodedEmail = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedEmail,
                threadId: threadId || undefined
            }
        });
        return {
            id: response.data.id,
            threadId: response.data.threadId,
            labelIds: response.data.labelIds,
            sentMessageId: response.data.id
        };
    }
    catch (error) {
        functions.logger.error('Failed to send email via Gmail API:', error);
        if (error.message && (error.message.includes('invalid_grant') || error.message.includes('token expired') || error.status === 401)) {
            throw new functions.https.HttpsError('permission-denied', 'UNAUTHORIZED: Gmail credentials have expired or are invalid. Please reconnect.');
        }
        throw new functions.https.HttpsError('internal', `Failed to send email via Gmail API: ${error.message}`);
    }
});
//# sourceMappingURL=gmail.js.map