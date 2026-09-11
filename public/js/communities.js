/**
 * Comunidades de chat — listagem, criação (demo) e painel centralizado.
 */
window.FH = window.FH || {};

const COMMUNITIES_JSON_VERSION = 1;
const USER_COMMUNITIES_KEY = "user_communities";
const DEFAULT_ROOM_ID = "amizade";

let communitiesCache = null;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function slugify(name) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
  return `${base || "comunidade"}-${Date.now()}`;
}

window.FH.getRoomFromUrl = function () {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") || DEFAULT_ROOM_ID;
};

window.FH.getChatUrl = function (roomId) {
  return `${window.FH.asset("community/chat.html")}?room=${encodeURIComponent(roomId)}`;
};

window.FH.loadCommunities = async function () {
  if (communitiesCache) return communitiesCache;

  const url = `${window.FH.asset("data/communities.json")}?v=${COMMUNITIES_JSON_VERSION}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar as comunidades.");

  const data = await res.json();
  const curated = data.communities || [];
  const userCreated = window.FH.storage.get(USER_COMMUNITIES_KEY, []);

  const seen = new Set(curated.map((c) => c.id));
  const merged = [...curated];
  userCreated.forEach((c) => {
    if (!seen.has(c.id)) {
      merged.push(c);
      seen.add(c.id);
    }
  });

  communitiesCache = merged;
  return merged;
};

window.FH.getCommunityById = async function (roomId) {
  const list = await window.FH.loadCommunities();
  return list.find((c) => c.id === roomId) || null;
};

window.FH.createCommunity = function ({ name, description, type }) {
  const trimmedName = (name || "").trim();
  if (trimmedName.length < 3) {
    throw new Error("O nome da comunidade deve ter pelo menos 3 caracteres.");
  }

  const community = {
    id: slugify(trimmedName),
    name: trimmedName,
    description: (description || "").trim() || "Comunidade criada por uma usuária",
    type: type === "alert" ? "alert" : "chat",
    icon: type === "alert" ? "alert" : "chat",
    userCreated: true,
    seedMessages: [],
  };

  const userCommunities = window.FH.storage.get(USER_COMMUNITIES_KEY, []);
  userCommunities.push(community);
  window.FH.storage.set(USER_COMMUNITIES_KEY, userCommunities);
  communitiesCache = null;

  return community;
};

function renderCommunityItem(community, activeRoomId, variant) {
  const isActive = activeRoomId === community.id;
  const isAlert = community.type === "alert";
  const iconName = community.icon || (isAlert ? "alert" : "chat");
  const isCompact = variant === "compact";

  if (isCompact) {
    return `
      <a
        href="${window.FH.getChatUrl(community.id)}"
        class="community-pill${isActive ? " community-pill--active" : ""}${isAlert ? " community-pill--alert" : ""}"
        ${isActive ? 'aria-current="page"' : ""}
      >
        ${escapeHtml(community.name)}
      </a>`;
  }

  return `
    <a
      href="${window.FH.getChatUrl(community.id)}"
      class="community-item${isActive ? " community-item--active" : ""}${isAlert ? " community-item--alert" : ""}"
      ${isActive ? 'aria-current="page"' : ""}
    >
      <span class="community-item__icon">${window.FH.icon(iconName, "icon icon--shortcut", 20)}</span>
      <span class="community-item__body">
        <span class="community-item__name">${escapeHtml(community.name)}</span>
        <span class="community-item__desc">${escapeHtml(community.description)}</span>
      </span>
      ${isAlert ? '<span class="community-item__badge">Alerta</span>' : ""}
    </a>`;
}

function renderCreateFormFields() {
  return `
    <form id="community-create-form" class="community-create__form">
      <div class="form-group">
        <label class="form-label" for="community-name">Nome</label>
        <input class="form-input" type="text" id="community-name" required minlength="3" maxlength="60" placeholder="Ex.: Grupo de estudos">
      </div>
      <div class="form-group">
        <label class="form-label" for="community-description">Descrição</label>
        <input class="form-input" type="text" id="community-description" maxlength="120" placeholder="Breve descrição do grupo">
      </div>
      <div class="form-group">
        <label class="form-label" for="community-type">Tipo</label>
        <select class="form-input" id="community-type">
          <option value="chat">Conversa</option>
          <option value="alert">Alerta</option>
        </select>
      </div>
      <p class="form-error" id="community-create-error" role="alert"></p>
      <button type="submit" class="btn btn--primary btn--block">Criar e entrar</button>
    </form>`;
}

function renderCreateSection(toggleLabel, toggleClass = "btn btn--ghost btn--block community-create__toggle") {
  return `
    <div class="community-create">
      <button type="button" class="${toggleClass}" id="community-create-toggle" aria-expanded="false" aria-controls="community-create-form-wrap">
        ${toggleLabel}
      </button>
      <div class="community-create__form-wrap" id="community-create-form-wrap" hidden>
        ${renderCreateFormFields()}
      </div>
    </div>`;
}

function bindCreateForm(container) {
  const toggleBtn = container.querySelector("#community-create-toggle");
  const formWrap = container.querySelector("#community-create-form-wrap");
  const form = container.querySelector("#community-create-form");
  const errorEl = container.querySelector("#community-create-error");

  if (!toggleBtn || !formWrap || !form) return;

  toggleBtn.addEventListener("click", () => {
    const open = formWrap.hidden;
    formWrap.hidden = !open;
    toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) form.querySelector("#community-name")?.focus();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (errorEl) errorEl.textContent = "";

    const user = window.FH.getCurrentUser();
    if (!user) {
      const redirect = window.location.pathname + window.location.search;
      window.location.href =
        window.FH.asset("auth/login.html") + "?redirect=" + encodeURIComponent(redirect);
      return;
    }

    const name = form.querySelector("#community-name")?.value || "";
    const description = form.querySelector("#community-description")?.value || "";
    const type = form.querySelector("#community-type")?.value || "chat";

    try {
      const community = window.FH.createCommunity({ name, description, type });
      window.location.href = window.FH.getChatUrl(community.id);
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message || "Não foi possível criar a comunidade.";
    }
  });
}

window.FH.renderCommunitiesPanel = async function (container, options = {}) {
  if (!container) return;

  const {
    activeRoomId = null,
    showCreateForm = true,
    variant = "full",
  } = options;

  container.innerHTML = '<p class="text-muted communities-panel__loading">Carregando comunidades...</p>';

  try {
    const communities = await window.FH.loadCommunities();
    const itemsHtml = communities
      .map((c) => renderCommunityItem(c, activeRoomId, variant))
      .join("");

    if (variant === "compact") {
      const createRow = showCreateForm
        ? `<button type="button" class="btn btn--sm btn--ghost community-create__toggle" id="community-create-toggle" aria-expanded="false" aria-controls="community-create-form-wrap">+ Nova</button>`
        : "";
      const createForm = showCreateForm
        ? `<div class="community-create community-create--compact"><div class="community-create__form-wrap" id="community-create-form-wrap" hidden>${renderCreateFormFields()}</div></div>`
        : "";

      container.innerHTML = `
        <div class="communities-panel communities-panel--compact">
          <div class="communities-panel__compact-row">
            <nav class="communities-panel__list communities-panel__list--compact" aria-label="Salas de chat">
              ${itemsHtml}
            </nav>
            ${createRow}
          </div>
          ${createForm}
        </div>`;
    } else {
      const createSection = showCreateForm ? renderCreateSection("+ Criar comunidade") : "";

      container.innerHTML = `
        <div class="communities-panel communities-panel--full">
          <p class="communities-panel__subtitle">Converse, faça amizades e receba alertas</p>
          <nav class="communities-panel__list communities-panel__list--full" aria-label="Lista de comunidades">
            ${itemsHtml}
          </nav>
          ${createSection}
        </div>`;
    }

    bindCreateForm(container);
  } catch (err) {
    container.innerHTML = `<p class="text-muted">${escapeHtml(err.message || "Erro ao carregar comunidades.")}</p>`;
  }
};

document.addEventListener("femhelp:ready", async () => {
  const panel = document.getElementById("communities-panel");
  if (!panel) return;

  const isChatPage = document.body.dataset.page === "chat";
  await window.FH.renderCommunitiesPanel(panel, {
    activeRoomId: isChatPage ? window.FH.getRoomFromUrl() : null,
    showCreateForm: true,
    variant: isChatPage ? "compact" : "full",
  });
});
