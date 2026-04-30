import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyChRdZtXApVKGIm0oKwwGSQZpX0B4vZpCg",
  authDomain: "cheonain-rental.firebaseapp.com",
  projectId: "cheonain-rental",
  storageBucket: "cheonain-rental.firebasestorage.app",
  messagingSenderId: "769329125127",
  appId: "1:769329125127:web:7361670244919de3d597a2"
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app, "gs://cheonain-rental.firebasestorage.app");
export const db = getFirestore(app);
