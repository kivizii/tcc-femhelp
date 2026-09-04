/**
 * SOS — botão de emergência com confirmação e registro.
 */
window.FH = window.FH || {};

window.FH.getContactsForSos = async function () {
  const contacts = await window.FH.listContacts();
  return contacts.filter((c) => c.notifyOnSos !== false);
};

window.FH.triggerSos = async function ({ latitude, longitude } = {}) {
  const user = window.FH.getCurrentUser();
  if (!user) throw new Error("Faça login para acionar o SOS.");

  const contacts = await window.FH.getContactsForSos();
  const event = {
    id: "sos_" + Date.now(),
    triggeredAt: new Date().toISOString(),
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    status: "active",
    notifiedContacts: contacts.map((c) => c.id),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };

  if (window.FH.demoMode) {
    const events = window.FH.storage.get(`sos_${user.uid}`, []);
    events.unshift(event);
    window.FH.storage.set(`sos_${user.uid}`, events);
    return { event, contacts };
  }

  const { collection, addDoc, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );

  const ref = await addDoc(
    collection(window.FH.db, "users", user.uid, "sos_events"),
    {
      triggeredAt: serverTimestamp(),
      latitude: event.latitude,
      longitude: event.longitude,
      status: "active",
      notifiedContacts: event.notifiedContacts,
      expiresAt: event.expiresAt,
    }
  );
  event.id = ref.id;
  return { event, contacts };
};

window.FH.getCurrentLocation = function () {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não suportada neste dispositivo."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

window.FH.showSosModal = function (onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "sos-modal-title");
  overlay.innerHTML = `
    <div class="modal">
      <h2 class="modal__title" id="sos-modal-title">Confirmar emergência?</h2>
      <p class="modal__text">Seus contatos de confiança serão alertados e sua localização poderá ser compartilhada.</p>
      <div class="modal__actions">
        <button type="button" class="btn btn--sos" id="sos-confirm">Sim, preciso de ajuda</button>
        <button type="button" class="btn btn--ghost btn--block" id="sos-cancel">Cancelar</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();

  overlay.querySelector("#sos-cancel").addEventListener("click", close);
  overlay.querySelector("#sos-confirm").addEventListener("click", () => {
    close();
    onConfirm();
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  document.body.appendChild(overlay);
  overlay.querySelector("#sos-confirm").focus();
};

window.FH.initSosPage = function () {
  const btn = document.getElementById("btn-sos-trigger");
  const statusEl = document.getElementById("sos-status");
  const locationEl = document.getElementById("sos-location");
  const timerEl = document.getElementById("sos-timer");
  const notifiedEl = document.getElementById("sos-notified");

  if (!btn) return;

  window.FH.requireAuth(window.location.pathname);

  let timerInterval = null;

  function startTimer(expiresAt) {
    if (timerInterval) clearInterval(timerInterval);
    const end = new Date(expiresAt).getTime();

    function tick() {
      const remaining = Math.max(0, end - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      if (timerEl) {
        timerEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      }
      if (remaining <= 0 && timerInterval) {
        clearInterval(timerInterval);
        if (statusEl) statusEl.textContent = "Compartilhamento de localização encerrado.";
      }
    }

    tick();
    timerInterval = setInterval(tick, 1000);
  }

  btn.addEventListener("click", () => {
    window.FH.showSosModal(async () => {
      btn.disabled = true;
      btn.textContent = "Acionando...";

      let coords = {};
      try {
        coords = await window.FH.getCurrentLocation();
        if (locationEl) {
          locationEl.textContent = `Lat: ${coords.latitude.toFixed(5)}, Lng: ${coords.longitude.toFixed(5)}`;
          locationEl.classList.remove("hidden");
        }
      } catch {
        if (locationEl) {
          locationEl.textContent = "Localização indisponível — alerta enviado sem coordenadas.";
          locationEl.classList.remove("hidden");
        }
      }

      try {
        const { event, contacts } = await window.FH.triggerSos(coords);
        if (statusEl) {
          statusEl.innerHTML = `<div class="sos-status"><div class="sos-status__icon">${window.FH.icon("check", "icon icon--status")}</div><p><strong>SOS acionado com sucesso.</strong></p><p class="text-muted">Seus contatos foram notificados.</p></div>`;
        }
        if (notifiedEl) {
          notifiedEl.innerHTML =
            contacts.length > 0
              ? `<p><strong>Contatos notificados:</strong></p><ul>${contacts.map((c) => `<li>${c.name} — ${c.phone}</li>`).join("")}</ul>`
              : "<p class='alert alert--warning'>Nenhum contato cadastrado para notificação. <a href='" +
                window.FH.asset("contacts/index.html") +
                "'>Cadastrar contatos</a></p>";
          notifiedEl.classList.remove("hidden");
        }
        startTimer(event.expiresAt);
      } catch (err) {
        alert(err.message || "Erro ao acionar SOS.");
      } finally {
        btn.disabled = false;
        btn.textContent = "Acionar SOS";
      }
    });
  });
};

document.addEventListener("femhelp:ready", () => {
  if (document.body.dataset.page === "sos") {
    window.FH.initSosPage();
  }
});
