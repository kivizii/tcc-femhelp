/**
 * Autenticação — Firebase Auth ou modo demo (localStorage).
 */
window.FH = window.FH || {};

window.FH.getCurrentUser = function () {
  if (window.FH.demoMode) {
    return window.FH.storage.get("currentUser", null);
  }
  const user = window.FH.auth?.currentUser;
  if (!user) return null;
  return { uid: user.uid, email: user.email, displayName: user.displayName || "" };
};

window.FH.onAuthChange = function (callback) {
  if (window.FH.demoMode) {
    callback(window.FH.getCurrentUser());
    return () => {};
  }
  return import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js").then(
    ({ onAuthStateChanged }) => onAuthStateChanged(window.FH.auth, callback)
  );
};

window.FH.register = async function ({ email, password, displayName }) {
  if (window.FH.demoMode) {
    const users = window.FH.storage.get("users", {});
    if (users[email]) throw new Error("E-mail já cadastrado.");
    const uid = "demo_" + Date.now();
    users[email] = { uid, email, displayName, password };
    window.FH.storage.set("users", users);
    const current = { uid, email, displayName };
    window.FH.storage.set("currentUser", current);
    return current;
  }

  const { createUserWithEmailAndPassword, updateProfile } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
  );
  const { doc, setDoc, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );

  const cred = await createUserWithEmailAndPassword(window.FH.auth, email, password);
  await updateProfile(cred.user, { displayName });
  await setDoc(doc(window.FH.db, "users", cred.user.uid), {
    email,
    displayName,
    createdAt: serverTimestamp(),
  });
  return { uid: cred.user.uid, email, displayName };
};

window.FH.login = async function ({ email, password }) {
  if (window.FH.demoMode) {
    const users = window.FH.storage.get("users", {});
    const user = users[email];
    if (!user || user.password !== password) throw new Error("E-mail ou senha incorretos.");
    const current = { uid: user.uid, email: user.email, displayName: user.displayName };
    window.FH.storage.set("currentUser", current);
    return current;
  }

  const { signInWithEmailAndPassword } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
  );
  const cred = await signInWithEmailAndPassword(window.FH.auth, email, password);
  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName || "",
  };
};

window.FH.logout = async function () {
  if (window.FH.demoMode) {
    window.FH.storage.remove("currentUser");
    return;
  }
  const { signOut } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
  );
  await signOut(window.FH.auth);
};

window.FH.requireAuth = function (redirectTo) {
  const user = window.FH.getCurrentUser();
  if (!user) {
    const loginUrl = window.FH.asset("auth/login.html");
    const params = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : "";
    window.location.href = loginUrl + params;
    return null;
  }
  return user;
};

window.FH.updateHeaderAuth = function () {
  const slot = document.getElementById("header-auth-slot");
  if (!slot) return;

  const user = window.FH.getCurrentUser();
  if (user) {
    slot.innerHTML = `<a href="${window.FH.asset("settings.html")}" class="btn btn--sm btn--ghost">${user.displayName || "Conta"}</a>`;
  } else {
    slot.innerHTML = `<a href="${window.FH.asset("auth/login.html")}" class="btn btn--sm btn--primary">Entrar</a>`;
  }
};

document.addEventListener("femhelp:ready", () => {
  window.FH.onAuthChange(() => window.FH.updateHeaderAuth());
});

window.FH.validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
window.FH.validatePhone = (phone) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
};
