import admin from 'firebase-admin';
import * as serviceAccount from '../serviceAccountKey.json';

const firebaseAPP = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as unknown as string)
});

export default firebaseAPP;
