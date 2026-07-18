import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testQuery() {
  try {
    console.log('Logging in...');
    await signInWithEmailAndPassword(auth, 'testA_1781589145905@example.com', 'Test1234!');
    console.log('Logged in successfully!');
    
    console.log('Testing query on system_logs...');
    const q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    console.log('Query succeeded! Found documents:', snap.size);
    
    process.exit(0);
  } catch (err) {
    console.error('Query failed with error:', err);
    process.exit(1);
  }
}

testQuery();
