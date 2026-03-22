import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBLGoPqhNgUlPv6HASHRt8yFeGpE4YRdH8",
  authDomain: "ai-studio-applet-webapp-2a87d.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-2a87d",
  storageBucket: "ai-studio-applet-webapp-2a87d.firebasestorage.app",
  messagingSenderId: "106739510629",
  appId: "1:106739510629:web:69e7557c4543bca3a7858c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();
