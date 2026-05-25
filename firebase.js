import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {

  apiKey: "YOUR_API_KEY",

  authDomain:
    "YOUR_PROJECT.firebaseapp.com",

  projectId:
    "YOUR_PROJECT_ID",

  storageBucket:
    "YOUR_PROJECT.appspot.com",

  messagingSenderId:
    "YOUR_SENDER_ID",

  appId:
    "YOUR_APP_ID"
};

const app =
  initializeApp(firebaseConfig);

export const db =
  getFirestore(app);

export const remindersRef =
  collection(db, "kismy-reminders");

export {
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query
};
