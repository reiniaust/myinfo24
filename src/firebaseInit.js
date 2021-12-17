import firebase from 'firebase'
import 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyC_Tq0r4xJlJIxpomh-aScKezWoK1g99zY',
    authDomain: 'myinfo24.firebaseapp.com',
    projectId: 'myinfo24',
    storageBucket: 'myinfo24.appspot.com',
    messagingSenderId: '747886337818',
    appId: '1:747886337818:web:b76d7d5bea04b44201d6a3',
    measurementId: 'G-9VJN7EEYLP'
}

const firebaseApp = firebase.initializeApp(firebaseConfig)
export default firebaseApp.firestore()
