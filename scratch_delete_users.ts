import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function deleteAllNonAdmins() {
  try {
    console.log('Logging in as admin...');
    await signInWithEmailAndPassword(auth, 'archrevenues@gmail.com', 'Shiv@321');
    console.log('Logged in successfully!');
    
    console.log('Fetching users...');
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    let deletedCount = 0;
    for (const u of users) {
      if (u.role !== 'admin') {
        console.log('Deleting user:', u.id, u.email);
        await deleteDoc(doc(db, 'users', u.id));
        deletedCount++;
      } else {
        console.log('Skipping admin:', u.id, u.email);
      }
    }
    
    console.log('Successfully deleted ' + deletedCount + ' non-admin users.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

deleteAllNonAdmins();
