/**
 * Carrega conteúdo estático de data/content.json.
 */
window.FH = window.FH || {};

window.FH.loadContent = async function () {
  const res = await fetch(window.FH.asset("data/content.json"));
  if (!res.ok) throw new Error("Não foi possível carregar o conteúdo.");
  return res.json();
};

window.FH.renderCardGrid = function (containerId, items, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { filterKey, filterValue } = options;
  let list = items;
  if (filterKey && filterValue && filterValue !== "all") {
    list = items.filter((i) => i.category === filterValue || i.type === filterValue);
  }

  if (list.length === 0) {
    container.innerHTML = '<p class="text-muted">Nenhum item encontrado.</p>';
    return;
  }

  container.innerHTML = `<div class="card-grid">${list
    .map(
      (item) => `
    <article class="card">
      <h3 class="card__title">${escapeHtml(item.title)}</h3>
      <p class="card__text">${escapeHtml(item.description)}</p>
      ${item.tag ? `<span class="tag">${escapeHtml(item.tag)}</span>` : ""}
      ${item.link ? `<a href="${escapeHtml(item.link)}" class="btn btn--sm btn--primary mt-md" target="_blank" rel="noopener">Acessar</a>` : ""}
    </article>`
    )
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
  const data = await window.FH.loadContent();
  const items = data[type] || [];

  const render = (filter) => window.FH.renderCardGrid(containerId, items, { filterKey: "category", filterValue: filter });

  if (tagContainerId) {
    window.FH.initFilterTags(tagContainerId, items, render);
  }
  render("all");
};

document.addEventListener("femhelp:ready", () => {
  const page = document.body.dataset.page;
  if (page === "videos") window.FH.initContentPage("videos", "content-grid", "filter-tags");
  if (page === "cursos") window.FH.initContentPage("cursos", "content-grid", "filter-tags");
  if (page === "empregos") window.FH.initContentPage("empregos", "content-grid", "filter-tags");
});
