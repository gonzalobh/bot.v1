// ═══════════════════════════════════════════════════════════════════
// Firebase Configuration Module - OPTIMIZADO
// ═══════════════════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC2c3S_NtouIjHPrk5LM5c0DQoTWyBrzH4",
  authDomain: "timbre-c9547.firebaseapp.com",
  databaseURL: "https://timbre-c9547-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "timbre-c9547",
  storageBucket: "timbre-c9547.firebasestorage.app",
  messagingSenderId: "127064655657",
  appId: "1:127064655657:web:a4e99dcbc6ab33f32c1938"
};

// Inicializar Firebase solo una vez
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

// Exportar referencias globales
window.db = firebase.database();
window.auth = firebase.auth();
window.storage = firebase.storage();

console.log('✅ Firebase initialized');
