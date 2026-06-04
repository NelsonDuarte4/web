// --- CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBG3AtCYrmytxkflVyY7fjS4H3hFtTISPY",
    authDomain: "juego-ce64b.firebaseapp.com",
    databaseURL: "https://juego-ce64b-default-rtdb.firebaseio.com",
    projectId: "juego-ce64b",
    storageBucket: "juego-ce64b.firebasestorage.app",
    messagingSenderId: "91540193723",
    appId: "1:91540193723:web:40c37fe91e3c1ad86e049e"
};

firebase.initializeApp(firebaseConfig);
// Usamos window.db para asegurar que game.js tenga acceso total al estar en archivos separados
window.db = firebase.database();