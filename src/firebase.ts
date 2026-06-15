import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAAwElt4r0nT2GKObyP3IGsXCJGpzNbD3c',
  authDomain: 'pixel-puzzle-with-friends.firebaseapp.com',
  projectId: 'pixel-puzzle-with-friends',
  storageBucket: 'pixel-puzzle-with-friends.firebasestorage.app',
  messagingSenderId: '377990937875',
  appId: '1:377990937875:web:878ba2b7faf983d1fa6ee6',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
