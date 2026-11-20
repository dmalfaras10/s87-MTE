import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import 'notyf/notyf.min.css';
import './assets/main.css'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router';

import Landing from './pages/Landing.vue'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import Workouts from './pages/Workout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Landing',
      component: Landing
    },
    {
      path: '/register',
      name: 'Register',
      component: Register
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/workouts',
      name: 'Workouts',
      component: Workouts
    },                   
  ] 
});


const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app');