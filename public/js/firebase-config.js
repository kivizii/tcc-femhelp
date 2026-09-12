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
    try {
      localStorage.setItem(DEMO_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(DEMO_PREFIX + key);
      return true;
    } catch {
      return false;
    }
  },
};

window.FH.resetDemoData = function () {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(DEMO_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
  if (typeof window.FH.clearCommunitiesCache === "function") {
    window.FH.clearCommunitiesCache();
  }
};

window.FH.clearDemoLogins = function () {
  window.FH.storage.remove("users");
  window.FH.storage.remove("currentUser");
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(DEMO_PREFIX + "profile_")) {
      localStorage.removeItem(key);
    }
  }
};

(function consumeDemoQueryFlags() {
  const search = window.location.search || "";
  if (!/[?&]clearLogins(?:&|=|$)/.test(search) && !search.startsWith("?clearLogins")) {
    return;
  }
  window.FH.clearDemoLogins();
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("clearLogins");
    const query = url.searchParams.toString();
    window.history.replaceState({}, "", url.pathname + (query ? "?" + query : "") + url.hash);
  } catch {
    /* file:// may block replaceState */
  }
  console.info("FEMHELP: logins de teste apagados.");
})();

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
