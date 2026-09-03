/**
 * Chat feminino — UI com mensagens em localStorage (mock).
 */
window.FH = window.FH || {};

window.FH.initChatPage = function () {
  const user = window.FH.requireAuth(window.location.pathname);
  if (!user) return;

  const listEl = document.getElementById("chat-messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  if (!listEl || !form) return;

  const STORAGE_KEY = "chat_messages";

  const seedMessages = [
    { author: "Ana", text: "Você não está sozinha. Estamos aqui para ouvir.", own: false },
    { author: "Marina", text: "Alguém já passou por situação parecida e pode compartilhar?", own: false },
  ];

  function getMessages() {
    return window.FH.storage.get(STORAGE_KEY, seedMessages);
  }

  function saveMessages(msgs) {
    window.FH.storage.set(STORAGE_KEY, msgs);
  }

  function render() {
    const msgs = getMessages();
    listEl.innerHTML = msgs
      .map(
        (m) => `
      <div class="message-bubble message-bubble--${m.own ? "own" : "other"}">
        <div class="message-bubble__author">${m.author}</div>
        ${m.text}
      </div>`
      )
      .join("");
    listEl.scrollTop = listEl.scrollHeight;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const msgs = getMessages();
    msgs.push({ author: user.displayName || "Você", text, own: true });
    saveMessages(msgs);
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
