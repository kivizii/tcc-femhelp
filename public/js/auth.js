/**
 * Autenticação — Firebase Auth ou modo demo (localStorage).
 */
window.FH = window.FH || {};

function assertCpfValid(cpf) {
  if (!window.FH.validateCpf?.(cpf)) {
    throw new Error("CPF inválido.");
  }
  return window.FH.normalizeCpf(cpf);
}

function findDemoUserByCpf(users, cpf) {
  const normalized = window.FH.normalizeCpf(cpf);
  return Object.values(users).find((user) => user.cpf === normalized) || null;
}

window.FH.getCurrentUser = function () {
  if (window.FH.demoMode) {
    return window.FH.storage.get("currentUser", null);
  }
  const user = window.FH.auth?.currentUser;
  if (!user) return null;
  const profile = window.FH.storage.get(`profile_${user.uid}`, {});
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || profile.displayName || "",
    cpf: profile.cpf || "",
  };
};

async function hydrateFirebaseProfile(user) {
  if (!user || window.FH.demoMode) return;
  const cached = window.FH.storage.get(`profile_${user.uid}`, null);
  if (cached?.cpf) return;

  const { doc, getDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  const snap = await getDoc(doc(window.FH.db, "users", user.uid));
  if (!snap.exists()) return;

  const data = snap.data();
  window.FH.storage.set(`profile_${user.uid}`, {
    displayName: data.displayName || user.displayName || "",
    cpf: data.cpf || "",
    isWoman: data.isWoman,
  });
}

window.FH.onAuthChange = function (callback) {
  if (window.FH.demoMode) {
    callback(window.FH.getCurrentUser());
    return () => {};
  }
  return import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js").then(
    ({ onAuthStateChanged }) =>
      onAuthStateChanged(window.FH.auth, async (user) => {
        if (user) await hydrateFirebaseProfile(user);
        callback(window.FH.getCurrentUser());
      })
  );
};

window.FH.register = async function ({ cpf, email, password, displayName, isWoman }) {
  if (!isWoman) {
    throw new Error("Este espaço é exclusivo para mulheres.");
  }

  const normalizedCpf = assertCpfValid(cpf);
  const normalizedEmail = email.trim().toLowerCase();

  if (window.FH.demoMode) {
    const users = window.FH.storage.get("users", {});
    if (users[normalizedEmail]) throw new Error("E-mail já cadastrado.");
    if (findDemoUserByCpf(users, normalizedCpf)) throw new Error("CPF já cadastrado.");

    const uid = "demo_" + Date.now();
    users[normalizedEmail] = {
      uid,
      email: normalizedEmail,
      displayName,
      password,
      cpf: normalizedCpf,
      isWoman: true,
    };
    window.FH.storage.set("users", users);
    const current = { uid, email: normalizedEmail, displayName, cpf: normalizedCpf, isWoman: true };
    window.FH.storage.set("currentUser", current);
    return current;
  }

  const { createUserWithEmailAndPassword, updateProfile } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
  );
  const { doc, setDoc, getDocs, collection, query, where, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );

  const existing = await getDocs(query(collection(window.FH.db, "users"), where("cpf", "==", normalizedCpf)));
  if (!existing.empty) throw new Error("CPF já cadastrado.");

  const cred = await createUserWithEmailAndPassword(window.FH.auth, normalizedEmail, password);
  await updateProfile(cred.user, { displayName });
  await setDoc(doc(window.FH.db, "users", cred.user.uid), {
    email: normalizedEmail,
    displayName,
    cpf: normalizedCpf,
    isWoman: true,
    createdAt: serverTimestamp(),
  });
  window.FH.storage.set(`profile_${cred.user.uid}`, {
    displayName,
    cpf: normalizedCpf,
    isWoman: true,
  });
  return { uid: cred.user.uid, email: normalizedEmail, displayName, cpf: normalizedCpf, isWoman: true };
};

window.FH.login = async function ({ cpf, email, password }) {
  const normalizedCpf = assertCpfValid(cpf);
  const normalizedEmail = email.trim().toLowerCase();

  if (!window.FH.validateEmail(normalizedEmail)) {
    throw new Error("E-mail inválido.");
  }

  if (window.FH.demoMode) {
    const users = window.FH.storage.get("users", {});
    const user = users[normalizedEmail];
    if (!user || user.password !== password) {
      throw new Error("CPF, e-mail ou senha incorretos.");
    }
    if (!user.cpf) {
      throw new Error("Conta antiga sem CPF. Cadastre-se novamente com CPF.");
    }
    if (user.cpf !== normalizedCpf) {
      throw new Error("CPF não confere com este e-mail.");
    }
    if (!user.isWoman) {
      throw new Error("Este espaço é exclusivo para mulheres.");
    }
    const current = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      cpf: user.cpf,
      isWoman: true,
    };
    window.FH.storage.set("currentUser", current);
    return current;
  }

  const { signInWithEmailAndPassword, signOut } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
  );
  const { doc, getDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );

  const cred = await signInWithEmailAndPassword(window.FH.auth, normalizedEmail, password);
  const profileSnap = await getDoc(doc(window.FH.db, "users", cred.user.uid));
  const profile = profileSnap.exists() ? profileSnap.data() : null;

  if (!profile?.cpf) {
    await signOut(window.FH.auth);
    throw new Error("Conta antiga sem CPF. Cadastre-se novamente com CPF.");
  }
  if (profile.cpf !== normalizedCpf) {
    await signOut(window.FH.auth);
    throw new Error("CPF não confere com este e-mail.");
  }
  if (!profile.isWoman) {
    await signOut(window.FH.auth);
    throw new Error("Este espaço é exclusivo para mulheres.");
  }

  window.FH.storage.set(`profile_${cred.user.uid}`, {
    displayName: profile.displayName || cred.user.displayName || "",
    cpf: profile.cpf,
    isWoman: true,
  });

  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: profile.displayName || cred.user.displayName || "",
    cpf: profile.cpf,
    isWoman: true,
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
