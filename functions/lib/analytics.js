"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackOpen = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.trackOpen = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }
    const leadId = req.query.leadId;
    const userId = req.query.userId;
    if (!leadId || !userId) {
        functions.logger.warn('trackOpen called with missing parameters (leadId or userId).');
        sendPixel(res);
        return;
    }
    try {
        const db = admin.firestore();
        const leadRef = db.collection('users').doc(userId).collection('leads').doc(leadId);
        const leadSnap = await leadRef.get();
        if (leadSnap.exists) {
            const leadData = leadSnap.data();
            const activities = leadData.activities || [];
            const newActivity = {
                id: `open-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                action: 'Email Opened',
                timestamp: new Date()
            };
            const analytics = leadData.analytics || { sent: 0, opens: 0, replies: 0 };
            await leadRef.update({
                activities: [newActivity, ...activities],
                analytics: {
                    ...analytics,
                    opens: (analytics.opens || 0) + 1
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            functions.logger.info(`Tracked email open for lead ${leadId} under user ${userId}`);
        }
        else {
            functions.logger.warn(`Lead ${leadId} not found under user ${userId} to track open.`);
        }
    }
    catch (error) {
        functions.logger.error('Error tracking email open:', error);
    }
    sendPixel(res);
});
function sendPixel(res) {
    // 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    res.end(pixel);
}
//# sourceMappingURL=analytics.js.map