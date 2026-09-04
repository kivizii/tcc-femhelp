/**
 * Bootstrap — carrega assets com caminho relativo correto.
 * Uso: <script src="js/bootstrap.js" data-depth="0"></script>
 * depth = número de níveis abaixo de public/ (0 = index.html, 1 = auth/login.html)
 */
(function () {
  const script = document.currentScript;
  const depth = parseInt(script?.dataset?.depth || "0", 10);
  const root = depth === 0 ? "" : "../".repeat(depth);

  window.FH = {
    root,
    asset(path) {
      return root + path;
    },
    depth,
  };

  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/svg+xml";
  favicon.href = root + "assets/favicon.svg";
  document.head.appendChild(favicon);

  const styles = ["css/tokens.css", "css/base.css", "css/components.css"];
  styles.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = root + href;
    document.head.appendChild(link);
  });

  const modules = script?.dataset?.modules;
  const extraScripts = modules ? modules.split(",").map((s) => s.trim()) : [];

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = root + src;
      el.onload = resolve;
      el.onerror = reject;
      document.head.appendChild(el);
    });

  const coreScripts = [
    "js/firebase-config.js",
    "js/icons.js",
    "js/nav.js",
    "js/quick-exit.js",
    "js/auth.js",
  ];

  (async () => {
    try {
      for (const src of coreScripts) {
        await loadScript(src);
      }
      for (const src of extraScripts) {
        await loadScript(src);
      }
      if (typeof window.FH.onReady === "function") {
        window.FH.onReady();
      }
      document.dispatchEvent(new CustomEvent("femhelp:ready"));
    } catch (err) {
      console.error("FEMHELP bootstrap error:", err);
    }
  })();
})();
