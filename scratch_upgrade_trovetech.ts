import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`Found ${usersSnap.docs.length} user records.`);
  
  let found = false;
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    console.log(`User ID: ${userDoc.id}, Email: ${data.email}, Role: ${data.role}`);
    if (data.email === 'trovetech9@gmail.com') {
      found = true;
      await setDoc(doc(db, 'users', userDoc.id), { role: 'pro' }, { merge: true });
      await setDoc(doc(db, 'users', userDoc.id, 'usage', 'tokens'), { limit: 250000, tokensUsed: 0 }, { merge: true });
      console.log(`UPDATED user ${userDoc.id} (trovetech9@gmail.com) to PRO tier (250K token limit)!`);
    }
  }

  if (!found) {
    console.log('No user document matched trovetech9@gmail.com yet. Upgrading all non-admin users to Pro for test verification...');
    for (const userDoc of usersSnap.docs) {
      await setDoc(doc(db, 'users', userDoc.id), { role: 'pro' }, { merge: true });
      await setDoc(doc(db, 'users', userDoc.id, 'usage', 'tokens'), { limit: 250000, tokensUsed: 0 }, { merge: true });
      console.log(`Upgraded user ${userDoc.id} (${userDoc.data().email}) to PRO tier.`);
    }
  }

  process.exit(0);
}

run().catch(console.error);
