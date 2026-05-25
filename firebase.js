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

  apiKey: "AIza....",

  authDomain:
    "kismy-reminder.firebaseapp.com",

  projectId:
    "kismy-reminder",

  storageBucket:
    "kismy-reminder.firebasestorage.app",

  messagingSenderId:
    "147258225533",

  appId:
    "1:147258225533:web:..."
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
