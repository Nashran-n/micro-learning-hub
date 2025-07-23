import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore,Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBCS1fSthBi4KPWrCgHBaWv0F8gWXRomoM",
  authDomain: "micro-learning-hub.firebaseapp.com",
  projectId: "micro-learning-hub",
  storageBucket: "micro-learning-hub.firebasestorage.app",
  messagingSenderId: "520447284682",
  appId: "1:520447284682:web:794ed78f0712a3c23c2b33",
  measurementId: "G-JRPJSGYBYX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
 export const auth = getAuth(app);
 export { Timestamp };