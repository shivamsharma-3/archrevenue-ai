/**
 * FIRESTORE LIVE SCHEMA DIAGNOSTIC
 * =================================
 * Paste this entire script into the browser DevTools console
 * while logged in at http://localhost:3000
 *
 * It reads data using YOUR authenticated session — no admin key needed.
 * It does NOT write, modify, or delete anything.
 */

(async () => {
  // ── 1. Grab firebase internals from the running app ──────────────────────
  // Vite exposes modules via import.meta, but from the console we reach them
  // through the global __firebase_app__ that Firebase SDK registers.
  const { getFirestore, collection, getDocs, doc, getDoc, query, limit } =
    await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js').catch(() => null)
    || {};

  // Try to grab the already-initialized app from the page context
  // (Firebase registers its apps in a global registry)
  let db;
  try {
    // Method 1: grab from Vite's module cache via a global the app exposes
    // The app uses: import { db } from '../lib/firebase'
    // We can't reach ESM internals directly, so we use a workaround:
    // Re-initialize using the known config (read-only, no secrets).
    const { initializeApp, getApps, getApp } = await import(
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'
    );
    const { getFirestore: gfs } = await import(
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
    );
    const { getAuth } = await import(
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
    );

    const CONFIG = {
      projectId: "ai-lead-qualification-agent",
      appId: "1:1087076032985:web:169c727f30926e2788b9c8",
      apiKey: "AIzaSyC5DEp1NvXP6gZypjOOxeneUSMyH9ueIco",
      authDomain: "ai-lead-qualification-agent.firebaseapp.com",
      storageBucket: "ai-lead-qualification-agent.firebasestorage.app",
      messagingSenderId: "1087076032985",
    };

    // Re-use existing app if already initialized, otherwise init a new one
    const existingApps = getApps();
    const app = existingApps.length > 0 ? getApp() : initializeApp(CONFIG);
    db = gfs(app);
    const auth = getAuth(app);

    const user = auth.currentUser;
    if (!user) {
      console.error('❌ Not authenticated. Please log in first at localhost:3000.');
      return;
    }

    console.log('\n══════════════════════════════════════════════');
    console.log('  FIRESTORE LIVE SCHEMA DIAGNOSTIC');
    console.log('══════════════════════════════════════════════');
    console.log(`  Auth User: ${user.email}`);
    console.log(`  UID:       ${user.uid}`);
    console.log('══════════════════════════════════════════════\n');

    const { collection: col, getDocs: gd, doc: d, getDoc: gdoc, query: q, limit: lim, where: wh, orderBy: ob } = await import(
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
    );

    // ── 2. LEADS COLLECTION ANALYSIS ─────────────────────────────────────────
    console.log('📁 SCANNING: leads collection...');
    const leadsSnap = await gd(col(db, 'leads'));
    const allLeads = leadsSnap.docs.map(d => d.data());

    const hasUserId   = allLeads.filter(l => l.userId   !== undefined);
    const hasSellerId = allLeads.filter(l => l.sellerId !== undefined);
    const hasBoth     = allLeads.filter(l => l.userId !== undefined && l.sellerId !== undefined);
    const hasNeither  = allLeads.filter(l => l.userId === undefined && l.sellerId === undefined);
    const myLeads     = allLeads.filter(l => l.userId === user.uid || l.sellerId === user.uid);

    console.log('\n── LEADS COLLECTION RESULTS ──────────────────');
    console.log(`  Total documents:        ${allLeads.length}`);
    console.log(`  Have 'userId' field:    ${hasUserId.length}`);
    console.log(`  Have 'sellerId' field:  ${hasSellerId.length}`);
    console.log(`  Have BOTH fields:       ${hasBoth.length}`);
    console.log(`  Have NEITHER:           ${hasNeither.length}`);
    console.log(`  Belong to current user: ${myLeads.length}`);

    if (hasBoth.length > 0) {
      console.log('\n  ⚠️  Documents with BOTH userId AND sellerId:');
      hasBoth.slice(0, 2).forEach((l, i) => {
        console.log(`    [${i+1}] userId=${l.userId}, sellerId=${l.sellerId}, fullName=${l.fullName}`);
      });
    }

    // Sample lead document
    if (allLeads.length > 0) {
      const sampleLead = allLeads[0];
      console.log('\n── SAMPLE LEAD DOCUMENT (first doc, top-level keys) ───');
      console.log('  Keys:', Object.keys(sampleLead).sort().join(', '));
      console.log('  Ownership fields:');
      console.log('    userId:   ', sampleLead.userId   ?? '(not present)');
      console.log('    sellerId: ', sampleLead.sellerId ?? '(not present)');
      console.log('    userEmail:', sampleLead.userEmail ?? '(not present)');
      console.log('    status:   ', sampleLead.status   ?? '(not present)');
      console.log('    fullName: ', sampleLead.fullName ?? '(not present)');
      console.log('\n  Full document snapshot:');
      console.log(JSON.stringify(sampleLead, (k, v) => {
        // Truncate long values for readability
        if (typeof v === 'string' && v.length > 80) return v.slice(0, 80) + '…';
        return v;
      }, 2));
    } else {
      console.log('\n  ℹ️  No leads documents found (collection may be empty or access denied).');
    }

    // ── 3. SELLER_PROFILES COLLECTION CHECK ──────────────────────────────────
    console.log('\n── CHECKING: seller_profiles (old flat collection) ───');
    try {
      const spSnap = await gd(col(db, 'seller_profiles'));
      if (spSnap.empty) {
        console.log('  ✅ seller_profiles collection: EMPTY or does not exist');
        console.log('     (0 documents found — safe, no orphaned data)');
      } else {
        console.log(`  ⚠️  seller_profiles collection EXISTS with ${spSnap.size} document(s)!`);
        spSnap.docs.forEach((d, i) => {
          const data = d.data();
          console.log(`\n  Document [${i+1}] ID: ${d.id}`);
          console.log('  Keys:', Object.keys(data).join(', '));
          console.log('  companyName:', data.companyName ?? '(missing)');
          console.log('  setupComplete:', data.setupComplete ?? '(missing)');
        });
      }
    } catch (err) {
      console.log('  ℹ️  seller_profiles: Permission denied or collection missing');
      console.log('  Error:', err.code, err.message);
    }

    // ── 4. CURRENT USER'S PROFILE ─────────────────────────────────────────────
    console.log('\n── CHECKING: users/{uid}/profile/main ───────────────');
    try {
      const profileSnap = await gdoc(d(db, 'users', user.uid, 'profile', 'main'));
      if (profileSnap.exists()) {
        const p = profileSnap.data();
        console.log('  ✅ Profile EXISTS at users/{uid}/profile/main');
        console.log('  companyName:   ', p.companyName   ?? '(missing)');
        console.log('  primaryOffer:  ', p.primaryOffer  ?? '(missing)');
        console.log('  setupComplete: ', p.setupComplete ?? '(missing)');
        console.log('  updatedAt:     ', p.updatedAt     ?? '(missing)');
        console.log('\n  Full profile keys:', Object.keys(p).sort().join(', '));
      } else {
        console.log('  ❌ NO profile found at users/{uid}/profile/main');
        console.log('     → Profile wizard WILL appear on next login');
      }
    } catch (err) {
      console.log('  ❌ Error reading profile:', err.code, err.message);
    }

    // ── 5. TOKEN USAGE CHECK ──────────────────────────────────────────────────
    console.log('\n── CHECKING: users/{uid}/usage/tokens ───────────────');
    try {
      const usageSnap = await gdoc(d(db, 'users', user.uid, 'usage', 'tokens'));
      if (usageSnap.exists()) {
        const u = usageSnap.data();
        console.log('  ✅ Token usage document EXISTS');
        console.log('  tokensUsed:', u.tokensUsed ?? '(missing)');
        console.log('  limit:     ', u.limit      ?? '(missing)');
      } else {
        console.log('  ℹ️  No token usage document yet (will be created on first AI action)');
      }
    } catch (err) {
      console.log('  ❌ Error reading token usage:', err.code, err.message);
    }

    // ── 6. VERDICT ────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════');
    console.log('  DIAGNOSTIC VERDICT');
    console.log('══════════════════════════════════════════════');

    if (hasUserId.length > hasSellerId.length) {
      console.log('  🟢 DOMINANT FIELD: userId');
      console.log('     Recommendation: standardize entire codebase on userId + userEmail');
      console.log('     AppLayout.tsx needs to be updated (currently uses sellerId)');
    } else if (hasSellerId.length > hasUserId.length) {
      console.log('  🟡 DOMINANT FIELD: sellerId');
      console.log('     Recommendation: data migration required before code change');
      console.log('     Need to rename sellerId → userId on all existing documents');
    } else if (allLeads.length === 0) {
      console.log('  ⚪ NO LEADS in database — safe to standardize on userId');
    } else {
      console.log('  🟠 SPLIT / EQUAL — manual review required');
    }

    console.log('\n  Copy this output and share it for the migration decision.');
    console.log('══════════════════════════════════════════════\n');

  } catch (outerErr) {
    console.error('Script error:', outerErr);
  }
})();
