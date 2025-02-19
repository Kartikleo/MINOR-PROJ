import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    
    apiKey: "AIzaSyAJqj61-_YBecILOmMWXemo9B_aYnAXEcY",
    authDomain: "webc-8908a.firebaseapp.com",
    projectId: "webc-8908a",
    storageBucket: "webc-8908a.appspot.com",
    messagingSenderId: "30904511705",
    appId: "1:30904511705:web:d8111cdf2fda58940b62c8",
    measurementId: "G-5737G7JSMG"
	
	
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export { db, auth };
