/**
 * Configuração Firebase + modo demonstração (localStorage).
 */
window.FH = window.FH || {};

window.FH.firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

window.FH.demoMode = true;
window.FH.db = null;
window.FH.auth = null;

const DEMO_PREFIX = "femhelp_demo_";

window.FH.storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(DEMO_PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(DEMO_PREFIX + key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(DEMO_PREFIX + key);
  },
};

async function initFirebase() {
  const config = window.FH.firebaseConfig;
  const hasConfig = config.apiKey && config.projectId;

  if (!hasConfig) {
    console.info("FEMHELP: modo demonstração (localStorage). Configure firebase-config.local.js para Firebase real.");
    window.FH.demoMode = true;
    return;
  }

  try {
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"
    );
    const { getAuth } = await import(
      "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
    );
    const { getFirestore } = await import(
      "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
    );

    const app = initializeApp(config);
    window.FH.auth = getAuth(app);
    window.FH.db = getFirestore(app);
    window.FH.demoMode = false;
    console.info("FEMHELP: Firebase conectado.");
  } catch (err) {
    console.warn("FEMHELP: Firebase indisponível, usando modo demo.", err);
    window.FH.demoMode = true;
  }
}

window.FH.initFirebase = initFirebase;
initFirebase();
