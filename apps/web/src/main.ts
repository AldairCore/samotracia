import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { handleRedirectCallback } from './spotify/auth';

async function bootstrap() {
  if (window.location.pathname === '/callback') {
    await handleRedirectCallback();
    window.history.replaceState(null, '', '/');
  }
  createApp(App).mount('#app');
}

bootstrap();
