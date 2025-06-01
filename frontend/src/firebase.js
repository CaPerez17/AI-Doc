import { initializeApp } from 'firebase/app';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey:           import.meta.env.VITE_FB_API_KEY || "demo-api-key",
  authDomain:       import.meta.env.VITE_FB_AUTH_DOMAIN || "gressusapp.firebaseapp.com",
  projectId:        import.meta.env.VITE_FB_PROJECT_ID || "gressusapp",
  storageBucket:    import.meta.env.VITE_FB_STORAGE_BUCKET || "gressusapp.appspot.com",
  messagingSenderId:import.meta.env.VITE_FB_SENDER_ID || "123456789",
  appId:            import.meta.env.VITE_FB_APP_ID || "demo-app-id",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Conectar al emulador de Storage si estamos en desarrollo
if (import.meta.env.DEV || window.location.hostname === 'localhost') {
  try {
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.log('Storage emulator already connected or not available:', error.message);
  }
}

export { storage }; 