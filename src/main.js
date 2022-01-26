import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import './registerServiceWorker'
import router from './router'
import firebase from 'firebase/app'
import DatetimePicker from 'vuetify-datetime-picker'

Vue.use(DatetimePicker)

Vue.config.productionTip = false

const firebaseConfig = {
  apiKey: 'AIzaSyC_Tq0r4xJlJIxpomh-aScKezWoK1g99zY',
  authDomain: 'myinfo24.firebaseapp.com',
  projectId: 'myinfo24',
  storageBucket: 'myinfo24.appspot.com',
  messagingSenderId: '747886337818',
  appId: '1:747886337818:web:4ad165a3a7a476bd01d6a3',
  measurementId: 'G-NHHGMHZ7B6'
}
firebase.initializeApp(firebaseConfig)

new Vue({
  vuetify,
  router,
  render: h => h(App)
}).$mount('#app')
