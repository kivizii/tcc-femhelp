/**
 * Contatos de confiança — CRUD.
 */
window.FH = window.FH || {};

window.FH.listContacts = async function () {
  const user = window.FH.getCurrentUser();
  if (!user) return [];

  if (window.FH.demoMode) {
    return window.FH.storage.get(`contacts_${user.uid}`, []);
  }

  const { collection, getDocs, query, orderBy } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  const snap = await getDocs(
    query(collection(window.FH.db, "users", user.uid, "contacts"), orderBy("name"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

window.FH.addContact = async function (contact) {
  const user = window.FH.getCurrentUser();
  if (!user) throw new Error("Faça login para cadastrar contatos.");

  const data = {
    name: contact.name.trim(),
    phone: contact.phone.trim(),
    type: contact.type || "outro",
    notifyOnSos: contact.notifyOnSos !== false,
    createdAt: new Date().toISOString(),
  };

  if (window.FH.demoMode) {
    const contacts = window.FH.storage.get(`contacts_${user.uid}`, []);
    const id = "c_" + Date.now();
    contacts.push({ id, ...data });
    window.FH.storage.set(`contacts_${user.uid}`, contacts);
    return { id, ...data };
  }

  const { collection, addDoc, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  const ref = await addDoc(collection(window.FH.db, "users", user.uid, "contacts"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data };
};

window.FH.updateContact = async function (id, contact) {
  const user = window.FH.getCurrentUser();
  if (!user) throw new Error("Faça login.");

  if (window.FH.demoMode) {
    const contacts = window.FH.storage.get(`contacts_${user.uid}`, []);
    const idx = contacts.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Contato não encontrado.");
    contacts[idx] = { ...contacts[idx], ...contact };
    window.FH.storage.set(`contacts_${user.uid}`, contacts);
    return contacts[idx];
  }

  const { doc, updateDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  await updateDoc(doc(window.FH.db, "users", user.uid, "contacts", id), contact);
};

window.FH.deleteContact = async function (id) {
  const user = window.FH.getCurrentUser();
  if (!user) throw new Error("Faça login.");

  if (window.FH.demoMode) {
    const contacts = window.FH.storage.get(`contacts_${user.uid}`, []);
    window.FH.storage.set(
      `contacts_${user.uid}`,
      contacts.filter((c) => c.id !== id)
    );
    return;
  }

  const { doc, deleteDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  await deleteDoc(doc(window.FH.db, "users", user.uid, "contacts", id));
};

window.FH.getPreferences = async function () {
  const user = window.FH.getCurrentUser();
  if (!user) return {};

  if (window.FH.demoMode) {
    return window.FH.storage.get(`prefs_${user.uid}`, {
      quickExitEnabled: true,
      locationShareMinutes: 30,
    });
  }

  const { doc, getDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  const snap = await getDoc(doc(window.FH.db, "users", user.uid, "preferences", "main"));
  return snap.exists() ? snap.data() : {};
};

window.FH.savePreferences = async function (prefs) {
  const user = window.FH.getCurrentUser();
  if (!user) throw new Error("Faça login.");

  if (window.FH.demoMode) {
    window.FH.storage.set(`prefs_${user.uid}`, prefs);
    return;
  }

  const { doc, setDoc, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  await setDoc(
    doc(window.FH.db, "users", user.uid, "preferences", "main"),
    { ...prefs, updatedAt: serverTimestamp() },
    { merge: true }
  );
};

window.FH.initContactsPage = function () {
  const listEl = document.getElementById("contact-list");
  const form = document.getElementById("contact-form");
  const formTitle = document.getElementById("form-title");
  const editIdInput = document.getElementById("contact-edit-id");
  const cancelBtn = document.getElementById("contact-cancel");

  if (!listEl || !form) return;

  window.FH.requireAuth(window.location.pathname);

  async function renderList() {
    const contacts = await window.FH.listContacts();
    if (contacts.length === 0) {
      listEl.innerHTML = '<p class="text-muted">Nenhum contato cadastrado. Adicione alguém de confiança abaixo.</p>';
      return;
    }
    listEl.innerHTML = `<ul class="contact-list">${contacts
      .map(
        (c) => `
      <li class="contact-item">
        <div class="contact-item__info">
          <strong>${escapeHtml(c.name)}</strong>
          <span>${escapeHtml(c.phone)} · ${escapeHtml(c.type)}${c.notifyOnSos !== false ? " · 🔔 SOS" : ""}</span>
        </div>
        <div class="contact-item__actions">
          <button type="button" class="btn btn--sm btn--ghost" data-edit="${c.id}">Editar</button>
          <button type="button" class="btn btn--sm btn--ghost" data-delete="${c.id}">Excluir</button>
        </div>
      </li>`
      )
      .join("")}</ul>`;

    listEl.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const contacts = await window.FH.listContacts();
        const c = contacts.find((x) => x.id === btn.dataset.edit);
        if (!c) return;
        editIdInput.value = c.id;
        form.name.value = c.name;
        form.phone.value = c.phone;
        form.type.value = c.type;
        form.notifyOnSos.checked = c.notifyOnSos !== false;
        if (formTitle) formTitle.textContent = "Editar contato";
        if (cancelBtn) cancelBtn.classList.remove("hidden");
        form.scrollIntoView({ behavior: "smooth" });
      });
    });

    listEl.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir este contato?")) return;
        await window.FH.deleteContact(btn.dataset.delete);
        renderList();
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function resetForm() {
    form.reset();
    editIdInput.value = "";
    if (formTitle) formTitle.textContent = "Novo contato";
    if (cancelBtn) cancelBtn.classList.add("hidden");
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetForm);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("contact-form-error");
    errEl?.classList.add("hidden");

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const type = form.type.value;
    const notifyOnSos = form.notifyOnSos.checked;

    if (!name) {
      showError("Nome é obrigatório.");
      return;
    }
    if (!window.FH.validatePhone(phone)) {
      showError("Telefone inválido. Use DDD + número.");
      return;
    }

    try {
      const editId = editIdInput.value;
      if (editId) {
        await window.FH.updateContact(editId, { name, phone, type, notifyOnSos });
      } else {
        await window.FH.addContact({ name, phone, type, notifyOnSos });
      }
      resetForm();
      renderList();
    } catch (err) {
      showError(err.message);
    }
  });

  function showError(msg) {
    const errEl = document.getElementById("contact-form-error");
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.remove("hidden");
    }
  }

  renderList();
};

document.addEventListener("femhelp:ready", () => {
  if (document.body.dataset.page === "contacts") {
    window.FH.initContactsPage();
  }
});
