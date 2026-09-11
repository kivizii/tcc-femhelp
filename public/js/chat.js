/**
 * Chat feminino — UI com mensagens em localStorage (mock), multi-sala.
 */
window.FH = window.FH || {};

const DEFAULT_ROOM_ID = "amizade";
const LEGACY_STORAGE_KEY = "chat_messages";

function messagesStorageKey(roomId) {
  return `chat_messages_${roomId}`;
}

function migrateLegacyMessages(roomId) {
  const legacy = window.FH.storage.get(LEGACY_STORAGE_KEY, null);
  if (!legacy || !Array.isArray(legacy) || legacy.length === 0) return;

  const key = messagesStorageKey(roomId);
  const existing = window.FH.storage.get(key, null);
  if (!existing || existing.length === 0) {
    window.FH.storage.set(key, legacy);
  }
  window.FH.storage.remove(LEGACY_STORAGE_KEY);
}

window.FH.initChatPage = async function () {
  const user = window.FH.requireAuth(window.location.pathname + window.location.search);
  if (!user) return;

  const listEl = document.getElementById("chat-messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const titleEl = document.getElementById("chat-room-title");
  const subtitleEl = document.getElementById("chat-room-subtitle");
  if (!listEl || !form) return;

  const roomId = window.FH.getRoomFromUrl?.() || DEFAULT_ROOM_ID;
  migrateLegacyMessages(DEFAULT_ROOM_ID);

  let community = null;
  try {
    community = await window.FH.getCommunityById(roomId);
  } catch {
    /* fallback abaixo */
  }

  const roomName = community?.name || "Chat feminino";
  const roomDescription = community?.description || "Converse com segurança. Você não está sozinha.";
  const seedMessages = community?.seedMessages || [
    { author: "Ana", text: "Você não está sozinha. Estamos aqui para ouvir.", own: false },
  ];

  if (titleEl) titleEl.textContent = roomName;
  if (subtitleEl) subtitleEl.textContent = roomDescription;
  document.title = `${roomName} — FEMHELP`;

  const storageKey = messagesStorageKey(roomId);

  function getMessages() {
    const stored = window.FH.storage.get(storageKey, null);
    if (stored && stored.length > 0) return stored;
    return seedMessages;
  }

  function saveMessages(msgs) {
    window.FH.storage.set(storageKey, msgs);
  }

  function render() {
    const msgs = getMessages();
    listEl.innerHTML = msgs
      .map(
        (m) => `
      <div class="message-bubble message-bubble--${m.own ? "own" : "other"}">
        <div class="message-bubble__author">${escapeHtml(m.author)}</div>
        ${escapeHtml(m.text)}
      </div>`
      )
      .join("");
    listEl.scrollTop = listEl.scrollHeight;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const msgs = getMessages();
    const persisted = window.FH.storage.get(storageKey, null);
    const base = persisted && persisted.length > 0 ? persisted : [...msgs];
    base.push({ author: user.displayName || "Você", text, own: true });
    saveMessages(base);
    input.value = "";
    render();
  });

  render();
};

document.addEventListener("femhelp:ready", () => {
  if (document.body.dataset.page === "chat") {
    window.FH.initChatPage();
  }
});
