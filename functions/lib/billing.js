"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onSubscriptionChange = void 0;
exports.checkAndIncrementTokens = checkAndIncrementTokens;
const functions = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
exports.onSubscriptionChange = functions.firestore
    .document('customers/{userId}/subscriptions/{subscriptionId}')
    .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const db = (0, firestore_1.getFirestore)();
    if (!change.after.exists) {
        // Downgrade to standard free limit
        await db.collection('users').doc(userId).collection('usage').doc('tokens').set({
            limit: 50000,
            lastUpdated: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
        return;
    }
    const subData = change.after.data();
    const status = subData?.status;
    if (status === 'active' || status === 'trialing') {
        // Grant a large limit or unlimited for paid subscriptions
        await db.collection('users').doc(userId).collection('usage').doc('tokens').set({
            limit: 999999999,
            lastUpdated: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    else {
        await db.collection('users').doc(userId).collection('usage').doc('tokens').set({
            limit: 50000,
            lastUpdated: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
    }
});
/**
 * Server-side token validation transaction.
 * Checks usage limit and increments tokensUsed.
 * Throws a HttpsError if limit is reached/exceeded.
 */
async function checkAndIncrementTokens(userId, amount) {
    const db = (0, firestore_1.getFirestore)();
    const usageRef = db.collection('users').doc(userId).collection('usage').doc('tokens');
    await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(usageRef);
        let tokensUsed = 0;
        let limit = 50000;
        if (snap.exists) {
            const data = snap.data();
            tokensUsed = data?.tokensUsed || 0;
            limit = data?.limit ?? 50000;
        }
        else {
            transaction.set(usageRef, {
                tokensUsed: 0,
                limit: 50000,
                lastUpdated: firestore_1.FieldValue.serverTimestamp()
            });
        }
        if (tokensUsed >= limit) {
            throw new functions.https.HttpsError('resource-exhausted', `Token limit exceeded. You have used ${tokensUsed} / ${limit} tokens. Please upgrade your subscription.`);
        }
        transaction.update(usageRef, {
            tokensUsed: tokensUsed + amount,
            lastUpdated: firestore_1.FieldValue.serverTimestamp()
        });
    });
}
//# sourceMappingURL=billing.js.map