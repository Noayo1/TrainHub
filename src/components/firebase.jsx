import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCKiwr8xDA6twoaaVEvDbFCh0CekWYg8Zc",
  authDomain: "sportweb-3605c.firebaseapp.com",
  projectId: "sportweb-3605c",
  storageBucket: "sportweb-3605c.firebasestorage.app",
  messagingSenderId: "648301473979",
  appId: "1:648301473979:web:046655e7483c8f6fea399e",
  measurementId: "G-E9MYNR7M7N",
  databaseURL:
    "https://sportweb-3605c-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { auth, storage };
export default database;
