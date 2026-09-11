/**
 * Carrega conteúdo estático de data/content.json.
 */
window.FH = window.FH || {};

const CONTENT_JSON_VERSION = 3;

window.FH.loadContent = async function () {
  const url = `${window.FH.asset("data/content.json")}?v=${CONTENT_JSON_VERSION}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar o conteúdo.");
  return res.json();
};

function filterItems(items, options = {}) {
  const { filterKey, filterValue } = options;
  if (!filterKey || !filterValue || filterValue === "all") return items;
  return items.filter((i) => i.category === filterValue || i.type === filterValue);
}

window.FH.renderCardGrid = function (containerId, items, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const list = filterItems(items, options);

  if (list.length === 0) {
    container.innerHTML = '<p class="text-muted">Nenhum item encontrado.</p>';
    return;
  }

  container.innerHTML = `<div class="card-grid">${list
    .map((item) => {
      const hasLink = item.link && item.link !== "#";
      return `
    <article class="card">
      <h3 class="card__title">${escapeHtml(item.title)}</h3>
      <p class="card__text">${escapeHtml(item.description)}</p>
      ${item.source ? `<p class="card__text text-muted">Por ${escapeHtml(item.source)}</p>` : ""}
      ${item.tag ? `<span class="tag">${escapeHtml(item.tag)}</span>` : ""}
      ${hasLink ? `<a href="${escapeHtml(item.link)}" class="btn btn--sm btn--primary mt-md" target="_blank" rel="noopener">Acessar</a>` : ""}
    </article>`;
    })
    .join("")}</div>`;
};

window.FH.renderCourseBlocks = function (containerId, items, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const list = filterItems(items, options);

  if (list.length === 0) {
    container.innerHTML = '<p class="text-muted">Nenhum curso encontrado.</p>';
    return;
  }

  container.innerHTML = `<div class="course-block-list">${list
    .map((item) => {
      const links = Array.isArray(item.links) ? item.links : [];
      const linksHtml = links
        .filter((entry) => entry.url && entry.url !== "#")
        .map((entry) => {
          const isVideo = entry.type === "video";
          const isCourse = entry.type === "course";
          const label = entry.label || (isVideo ? "Assistir no YouTube" : "Ver formação completa");
          const className = isCourse
            ? "course-link course-link--secondary"
            : "course-link course-link--video";
          return `<a href="${escapeHtml(entry.url)}" class="${className}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
        })
        .join("");

      return `
    <article class="course-block card">
      <h3 class="course-block__title">${escapeHtml(item.title)}</h3>
      <p class="course-block__text">${escapeHtml(item.description)}</p>
      ${item.source ? `<p class="course-block__source text-muted">Por ${escapeHtml(item.source)}</p>` : ""}
      ${item.tag ? `<span class="tag">${escapeHtml(item.tag)}</span>` : ""}
      ${linksHtml ? `<div class="course-block__links">${linksHtml}</div>` : ""}
    </article>`;
    })
    .join("")}</div>`;
};

window.FH.initFilterTags = function (tagContainerId, items, onFilter) {
  const container = document.getElementById(tagContainerId);
  if (!container) return;

  const categories = ["all", ...new Set(items.map((i) => i.category || i.type).filter(Boolean))];
  container.innerHTML = categories
    .map(
      (cat) =>
        `<button type="button" class="tag${cat === "all" ? " tag--active" : ""}" data-filter="${cat}">${
          cat === "all" ? "Todos" : cat
        }</button>`
    )
    .join("");

  container.querySelectorAll(".tag").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".tag").forEach((t) => t.classList.remove("tag--active"));
      btn.classList.add("tag--active");
      onFilter(btn.dataset.filter);
    });
  });
};

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

window.FH.initContentPage = async function (type, containerId, tagContainerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<p class="text-muted">Carregando...</p>';
  }

  try {
    const data = await window.FH.loadContent();
    const items = data[type] || [];
    const render =
      type === "cursos"
        ? (filter) => window.FH.renderCourseBlocks(containerId, items, { filterKey: "category", filterValue: filter })
        : (filter) => window.FH.renderCardGrid(containerId, items, { filterKey: "category", filterValue: filter });

    if (tagContainerId) {
      window.FH.initFilterTags(tagContainerId, items, render);
    }
    render("all");
  } catch (err) {
    console.error("FEMHELP: erro ao carregar conteúdo", err);
    if (container) {
      container.innerHTML =
        '<p class="form-error">Não foi possível carregar os cursos. Verifique sua conexão e recarregue a página.</p>';
    }
  }
};

document.addEventListener("femhelp:ready", () => {
  const page = document.body.dataset.page;
  if (page === "videos") window.FH.initContentPage("videos", "content-grid", "filter-tags");
  if (page === "cursos") window.FH.initContentPage("cursos", "content-grid", "filter-tags");
  if (page === "empregos") window.FH.initContentPage("empregos", "content-grid", "filter-tags");
});
