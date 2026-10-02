import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, setDoc, doc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setProForEmail(email: string) {
  console.log(`Searching for user with email: ${email}`);
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);

  if (snap.empty) {
    console.log(`No user document found for ${email} in users collection directly. Checking auth or creating default...`);
  } else {
    for (const d of snap.docs) {
      console.log(`Found user ${d.id}:`, d.data());
      await updateDoc(doc(db, 'users', d.id), { role: 'pro' });
      // Also update usage limit if present
      await setDoc(doc(db, 'users', d.id, 'usage', 'tokens'), { limit: 250000 }, { merge: true });
      console.log(`Successfully upgraded user ${d.id} (${email}) to Pro tier (250,000 token limit)!`);
    }
  }
  process.exit(0);
}

setProForEmail('trovetech9@gmail.com').catch(console.error);
