import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCIIHmG29_5C6K89YJEUexW-55tDxyogTE',
  appId: '1:514841805310:web:c23d5b2891c16f9c37c0af',
  messagingSenderId: '514841805310',
  projectId: 'dacha-annonce',
  authDomain: 'dacha-annonce.firebaseapp.com',
  storageBucket: 'dacha-annonce.firebasestorage.app',
  measurementId: 'G-RRQR0XL28M',
};

export const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
