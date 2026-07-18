import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAndProUser() {
  const targetUid = 'GU32lmtFrRaTwwL2z6WiYPS5Vtd2';
  const ref = doc(db, 'users', targetUid);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) {
    console.log('User does not exist in users collection. Creating...');
    await setDoc(ref, { email: 'unknown@example.com', role: 'pro' });
    console.log('User created with pro role.');
  } else {
    console.log('User exists. Current data:', snap.data());
    await setDoc(ref, { role: 'pro' }, { merge: true });
    console.log('User updated to pro.');
  }
  process.exit(0);
}

checkAndProUser().catch(console.error);
