(function () {
  "use strict";

  const C = window.DEEPSLATE_CONFIG || {};
  const STORAGE_KEY = C.storageKey || "deepslate.client.v1";

  const pageContent = document.getElementById("page-content");
  const gameStage = document.getElementById("game-stage");
  const gameFrameWrap = document.getElementById("game-frame-wrap");
  const toastContainer = document.getElementById("toast-container");

  if (!pageContent || !gameStage || !gameFrameWrap) {
    console.error("Deepslate: Required HTML elements are missing.");
    return;
  }

  const ACCENTS = {
    purple: "#9b8cff",
    blue: "#5ba9ff",
    green: "#54d69a",
    orange: "#ffa45e",
    pink: "#f17fc1",
    cyan: "#56d9df"
  };

  const DEFAULT_MODS = [
    { id: "fps-display", name: "FPS Display", description: "Show your current frames per second.", category: "Performance", enabled: true },
    { id: "coordinates", name: "Coordinates", description: "Display your current world coordinates.", category: "HUD", enabled: true },
    { id: "keystrokes", name: "Keystrokes", description: "Show your movement and input keys.", category: "HUD", enabled: false },
    { id: "armor-status", name: "Armor Status", description: "View your equipped armor status.", category: "HUD", enabled: false },
    { id: "zoom", name: "Zoom", description: "A convenient zoom preference.", category: "Utility", enabled: false },
    { id: "fullbright", name: "Fullbright", description: "A brightness preference for supported clients.", category: "Visual", enabled: false },
    { id: "crosshair", name: "Crosshair Customizer", description: "Customize your crosshair preference.", category: "Visual", enabled: false },
    { id: "hitboxes", name: "Hitbox Display", description: "A display preference for supported clients.", category: "Utility", enabled: false }
  ];

  const DEFAULT_SERVERS = [
    { id: "featured-1", name: "Your Favorite Server", address: "Add your server address", featured: true }
  ];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

      return {
        accent: saved.accent || "purple",
        mods: Array.isArray(saved.mods) ? saved.mods : DEFAULT_MODS.map(m => ({ ...m })),
        servers: Array.isArray(saved.servers) ? saved.servers : DEFAULT_SERVERS.map(s => ({ ...s })),
        username: saved.username || "Player",
        browserUrl: saved.browserUrl || "https://example.com",
        skin: saved.skin || null,
        offline: saved.offline !== false
      };
    } catch (error) {
      return {
        accent: "purple",
        mods: DEFAULT_MODS.map(m => ({ ...m })),
        servers: DEFAULT_SERVERS.map(s => ({ ...s })),
        username: "Player",
        browserUrl: "https://example.com",
        skin: null,
        offline: true
      };
    }
  }

  const state = loadState();
  let currentRoute = "home";
  let skinViewer = null;
  let supabase = null;
  let currentUser = null;
  let socialRefreshTimer = null;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      toast("Storage is full. Your changes could not be saved.");
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function toast(message) {
    if (!toastContainer) return;

    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    toastContainer.appendChild(item);

    window.setTimeout(() => item.remove(), 3000);
  }

  function hexToRGBA(hex, alpha) {
    const value = hex.replace("#", "");
    const number = parseInt(value, 16);

    return "rgba(" +
      ((number >> 16) & 255) + "," +
      ((number >> 8) & 255) + "," +
      (number & 255) + "," + alpha + ")";
  }

  function setAccent(accent) {
    if (!ACCENTS[accent]) return;

    state.accent = accent;
    document.documentElement.style.setProperty("--accent", ACCENTS[accent]);
    document.documentElement.style.setProperty(
      "--accent-soft",
      hexToRGBA(ACCENTS[accent], 0.14)
    );

    saveState();
  }

  function heading(eyebrow, title, description, action) {
    return `
      <div class="page-heading">
        <div>
          <div class="eyebrow">${eyebrow}</div>
          <h1>${title}</h1>
          <p class="page-description">${description}</p>
        </div>
        ${action || ""}
      </div>
    `;
  }

  function setRoute(route) {
    const validRoutes = [
      "home", "play", "mods", "wardrobe", "servers",
      "social", "browser", "performance", "settings"
    ];

    if (!validRoutes.includes(route)) return;

    currentRoute = route;

    document.querySelectorAll("[data-route]").forEach(button => {
      button.classList.toggle("active", button.dataset.route === route);
    });

    if (route === "play") {
      pageContent.hidden = true;
      gameStage.hidden = false;
      connectGame();
      return;
    }

    gameStage.hidden = true;
    pageContent.hidden = false;
    renderRoute();
  }

  function renderRoute() {
    const renderers = {
      home: renderHome,
      mods: renderMods,
      wardrobe: renderWardrobe,
      servers: renderServers,
      social: renderSocial,
      browser: renderBrowser,
      performance: renderPerformance,
      settings: renderSettings
    };

    if (renderers[currentRoute]) {
      pageContent.innerHTML = renderers[currentRoute]();
    }

    if (currentRoute === "wardrobe") {
      initializeWardrobe();
    }

    if (currentRoute === "social") {
      initializeSocial();
    }
  }

  function renderHome() {
    const enabledMods = state.mods.filter(mod => mod.enabled).length;

    return `
      <div class="page">
        ${heading(
          "YOUR MINECRAFT SPACE",
          "Welcome to Deepslate.",
          "Your Minecraft experience starts here. Everything you need, in one place.",
          '<button class="button" data-action="play">▶ &nbsp; Launch Minecraft</button>'
        )}

        <section class="hero">
          <div class="hero-content">
            <div class="eyebrow">DEEPSLATE CLIENT • 1.21.11</div>
            <h1>A better way to play.</h1>
            <p>A customizable Minecraft environment with your mods, servers, cosmetics, and preferences all together.</p>
            <div class="hero-actions">
              <button class="button" data-action="play">Play Minecraft &nbsp; →</button>
              <button class="button secondary" data-route="mods">Explore Mods</button>
            </div>
          </div>
        </section>

        <div class="section-heading"><h2>Your workspace</h2><span class="muted">Quick overview</span></div>

        <div class="grid">
          <div class="panel"><div class="stat-label">GAME VERSION</div><div class="stat-value">1.21.11</div><div class="stat-label">Minecraft client</div></div>
          <div class="panel"><div class="stat-label">ENABLED MODS</div><div class="stat-value">${enabledMods}</div><div class="stat-label">Saved preferences</div></div>
          <div class="panel"><div class="stat-label">SAVED SERVERS</div><div class="stat-value">${state.servers.length}</div><div class="stat-label">Your server list</div></div>
        </div>

        <div class="section-heading"><h2>Explore Deepslate</h2></div>

        <div class="grid">
          <div class="panel feature-card" data-route="mods"><div class="feature-icon">▦</div><div><strong>Mod Library</strong><span>Manage your saved mod preferences.</span></div></div>
          <div class="panel feature-card" data-route="wardrobe"><div class="feature-icon">◇</div><div><strong>Wardrobe</strong><span>Customize your player skin.</span></div></div>
          <div class="panel feature-card" data-route="servers"><div class="feature-icon">◎</div><div><strong>Multiplayer</strong><span>Keep your favorite servers together.</span></div></div>
        </div>

        <div class="section-heading"><h2>Getting started</h2></div>

        <div class="panel">
          <div class="list">
            <div class="list-row"><div><strong>Customize your launcher</strong><p>Choose an accent color and make Deepslate yours.</p></div><button class="small-button" data-route="settings">Open settings</button></div>
            <div class="list-row"><div><strong>Build your mod collection</strong><p>Choose which preferences you want enabled.</p></div><button class="small-button" data-route="mods">View mods</button></div>
            <div class="list-row"><div><strong>Add your favorite servers</strong><p>Save server addresses for quick access.</p></div><button class="small-button" data-route="servers">Manage servers</button></div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMods() {
    return `
      <div class="page">
        ${heading("CUSTOMIZE YOUR GAME", "Mod Library", "Manage your add-on preferences and build your ideal setup.")}

        <div class="grid">
          <div class="panel"><div class="stat-label">AVAILABLE ENTRIES</div><div class="stat-value">${state.mods.length}</div></div>
          <div class="panel"><div class="stat-label">ENABLED</div><div class="stat-value">${state.mods.filter(m => m.enabled).length}</div></div>
          <div class="panel"><div class="stat-label">GAME VERSION</div><div class="stat-value">1.21.11</div></div>
        </div>

        <div class="section-heading"><h2>Installed preferences</h2><span class="pill">LOCAL SETTINGS</span></div>

        <div class="list">
          ${state.mods.map(mod => `
            <div class="list-row">
              <div><strong>${escapeHTML(mod.name)}</strong><p>${escapeHTML(mod.description)} · ${escapeHTML(mod.category)}</p></div>
              <button class="toggle ${mod.enabled ? "on" : ""}" data-action="toggle-mod" data-id="${escapeHTML(mod.id)}" aria-label="Toggle ${escapeHTML(mod.name)}" aria-pressed="${mod.enabled}"></button>
            </div>
          `).join("")}
        </div>

        <p class="muted" style="margin-top:18px">These are saved launcher preferences. Actual mod installation requires a compatible Minecraft runtime integration.</p>
      </div>
    `;
  }

  /* WARDROBE */

  function createGraySkin() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#92979e";
    ctx.fillRect(0, 0, 64, 64);

    return canvas.toDataURL("image/png");
  }

  function renderWardrobe() {
    return `
      <div class="page">
        ${heading("MAKE IT YOURS", "Wardrobe", "Upload and preview your Minecraft player skin.")}

        <div class="grid two wardrobe-layout">
          <div class="panel wardrobe-preview-panel">
            <div class="eyebrow">PLAYER PREVIEW</div>

            <div id="skin-viewer-container" style="
              width:100%;
              height:390px;
              min-height:320px;
              display:flex;
              align-items:center;
              justify-content:center;
              overflow:hidden;
              position:relative;
              background:radial-gradient(ellipse at center,rgba(255,255,255,.055),transparent 70%);
              border-radius:14px;
              margin:15px 0;
            ">
              <canvas id="skin-viewer" style="width:100%;height:100%;display:block"></canvas>
              <div id="skin-viewer-fallback" hidden style="font-size:12px;color:var(--muted)">
                3D preview is loading...
              </div>
            </div>

            <div style="display:flex;justify-content:center;gap:9px;flex-wrap:wrap">
              <button class="small-button" data-action="skin-reset-camera">Reset view</button>
              <button class="small-button" data-action="skin-rotate">Rotate</button>
            </div>

            <p class="muted" style="text-align:center;margin-top:12px">
              Drag to rotate. Scroll to zoom.
            </p>
          </div>

          <div class="panel">
            <div class="eyebrow">YOUR SKIN</div>
            <h2>${state.skin ? "Custom skin uploaded" : "No skin uploaded"}</h2>
            <p class="muted">
              ${state.skin
                ? "Your custom skin is currently being used in the preview."
                : "This is your default plain gray character. Upload a Minecraft skin to customize it."}
            </p>

            <div class="list" style="margin-top:22px">
              <label class="button" for="skin-upload" style="text-align:center;cursor:pointer">
                ↑ &nbsp; Upload Minecraft Skin
              </label>
              <input id="skin-upload" type="file" accept="image/png" hidden>

              <button class="button secondary" data-action="remove-skin" ${state.skin ? "" : "disabled"}>
                Remove Skin
              </button>
            </div>

            <div class="section-heading"><h2>Skin requirements</h2></div>
            <div class="list">
              <div class="list-row"><div><strong>File format</strong><p>PNG image</p></div><span class="pill">PNG</span></div>
              <div class="list-row"><div><strong>Dimensions</strong><p>64 × 64 pixels</p></div><span class="pill">64×64</span></div>
              <div class="list-row"><div><strong>Default model</strong><p>Plain gray Minecraft character</p></div><span class="pill">GRAY</span></div>
            </div>

            <p class="muted" style="margin-top:18px;font-size:12px">
              Your uploaded skin is saved in this browser. Account synchronization can be connected later.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-deepslate-skinview]');
      if (existing) {
        if (window.skinview3d) return resolve();
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = url;
      script.dataset.deepslateSkinview = "true";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function initializeWardrobe() {
    const canvas = document.getElementById("skin-viewer");
    if (!canvas) return;

    if (skinViewer) {
      try {
        skinViewer.dispose();
      } catch (error) {}
      skinViewer = null;
    }

    try {
      await loadScript("https://cdn.jsdelivr.net/npm/skinview3d@3.4.1/bundles/skinview3d.bundle.js");

      if (currentRoute !== "wardrobe" || !document.getElementById("skin-viewer")) return;
      if (!window.skinview3d) throw new Error("Skin viewer library unavailable.");

      const skinTexture = state.skin || createGraySkin();

      skinViewer = new window.skinview3d.SkinViewer({
        canvas: canvas,
        width: canvas.clientWidth || 400,
        height: canvas.clientHeight || 390,
        skin: skinTexture
      });

      skinViewer.zoom = 0.9;
      skinViewer.fov = 50;
      skinViewer.autoRotate = true;
      skinViewer.autoRotateSpeed = 0.5;

      if (skinViewer.controls) {
        skinViewer.controls.enableRotate = true;
        skinViewer.controls.enableZoom = true;
        skinViewer.controls.enablePan = false;
      }

      window.addEventListener("resize", resizeSkinViewer);
    } catch (error) {
      const fallback = document.getElementById("skin-viewer-fallback");
      if (fallback) {
        fallback.hidden = false;
        fallback.textContent = "Could not load the 3D preview. Check your internet connection.";
      }
      console.error("Deepslate wardrobe:", error);
    }
  }

  function resizeSkinViewer() {
    if (!skinViewer) return;

    const canvas = document.getElementById("skin-viewer");
    if (!canvas) return;

    skinViewer.setSize(
      canvas.clientWidth || 400,
      canvas.clientHeight || 390
    );
  }

  function uploadSkin(file) {
    if (!file || file.type !== "image/png") {
      toast("Please choose a PNG skin.");
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = function () {
      if (image.width !== 64 || image.height !== 64) {
        URL.revokeObjectURL(objectUrl);
        toast("Your skin must be exactly 64 × 64 pixels.");
        return;
      }

      const reader = new FileReader();

      reader.onload = function () {
        state.skin = reader.result;
        saveState();
        renderRoute();
        toast("Minecraft skin uploaded.");
      };

      reader.onerror = function () {
        toast("Could not read that skin.");
      };

      reader.readAsDataURL(file);
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      toast("That image could not be opened.");
    };

    image.src = objectUrl;
  }

  /* SERVERS */

  function renderServers() {
    return `
      <div class="page">
        ${heading("MULTIPLAYER", "Your Servers", "Keep your favorite Minecraft servers organized.", '<button class="button" data-action="add-server">＋ Add Server</button>')}
        <div class="section-heading"><h2>Saved servers</h2><span class="muted">${state.servers.length} saved</span></div>
        <div class="list">
          ${state.servers.length ? state.servers.map(server => `
            <div class="list-row">
              <div><strong>${escapeHTML(server.name)}</strong><p>${escapeHTML(server.address)}</p></div>
              <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
                <button class="small-button" data-action="copy-server" data-id="${escapeHTML(server.id)}">Copy address</button>
                <button class="small-button" data-action="remove-server" data-id="${escapeHTML(server.id)}">Remove</button>
              </div>
            </div>
          `).join("") : '<div class="empty-state">No servers saved yet. Add your first server to get started.</div>'}
        </div>
        <p class="muted" style="margin-top:18px">Live status and joining require support from the connected game client.</p>
      </div>
    `;
  }

  /* SOCIAL AND ACCOUNTS */

  function renderSocial() {
    return `
      <div class="page">
        ${heading("PLAY TOGETHER", "Social", "Create an account to connect with friends.")}

        <div class="panel" style="margin-bottom:18px">
          <div class="eyebrow">YOUR ACCOUNT</div>
          <div id="account-area">${renderAccountArea()}</div>
        </div>

        <div class="grid two">
          <div class="panel">
            <h2>Friends</h2>
            <p class="muted">Find players and manage friend requests.</p>
            <div id="friends-area">
              ${currentUser
                ? '<div class="list"><input class="input" id="friend-search" placeholder="Search username"><button class="button" data-action="search-friends">Find player</button><div id="friend-results"></div><div id="friend-list"></div></div>'
                : '<p class="muted">Log in to use friends.</p>'}
            </div>
          </div>

          <div class="panel">
            <h2>Messages</h2>
            <p class="muted">Private conversations with your friends.</p>
            <div id="messages-area">
              ${currentUser ? '<div id="conversation-list" class="list"></div><div id="conversation-view"></div>' : '<p class="muted">Log in to use messages.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAccountArea() {
    if (currentUser) {
      return `
        <div class="list">
          <div class="list-row">
            <div><strong>${escapeHTML(currentUser.email || "Signed in")}</strong><p>Online account connected</p></div>
            <span class="pill">SIGNED IN</span>
          </div>
          <button class="button secondary" data-action="logout">Log out</button>
        </div>
      `;
    }

    if (!supabase) {
      return `
        <p class="muted">Account services are not connected yet. You can use Deepslate offline while the online account service is being configured.</p>
        <span class="pill">OFFLINE MODE</span>
        <p class="muted" style="margin-top:12px">Your local profile is <strong>${escapeHTML(state.username)}</strong>.</p>
      `;
    }

    return `
      <div class="grid two">
        <form id="signup-form" class="list">
          <h3>Create account</h3>
          <input class="input" name="username" maxlength="16" placeholder="Username" required>
          <input class="input" name="email" type="email" placeholder="Email address" required>
          <input class="input" name="password" type="password" minlength="8" placeholder="Password (8+ characters)" required>
          <button class="button" type="submit">Create account</button>
        </form>

        <form id="login-form" class="list">
          <h3>Log in</h3>
          <input class="input" name="email" type="email" placeholder="Email address" required>
          <input class="input" name="password" type="password" placeholder="Password" required>
          <button class="button secondary" type="submit">Log in</button>
        </form>
      </div>
      <p class="muted" style="margin-top:12px">Your password is handled by the authentication provider and is never saved in launcher storage.</p>
    `;
  }

  async function initializeSupabase() {
    const url = String(C.supabaseUrl || "").trim();
    const key = String(C.supabaseAnonKey || "").trim();

    if (!url || !key || url.includes("YOUR_") || key.includes("YOUR_")) {
      supabase = null;
      return;
    }

    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      if (!window.supabase || !window.supabase.createClient) {
        throw new Error("Supabase library unavailable.");
      }

      supabase = window.supabase.createClient(url, key);

      const result = await supabase.auth.getSession();
      currentUser = result.data && result.data.session
        ? result.data.session.user
        : null;

      supabase.auth.onAuthStateChange((_event, session) => {
        currentUser = session ? session.user : null;

        if (currentRoute === "social") {
          renderRoute();
        }
      });
    } catch (error) {
      console.error("Deepslate account setup:", error);
      supabase = null;
    }
  }

  async function signUp(form) {
    if (!supabase) {
      toast("Online accounts are not configured yet.");
      return;
    }

    const username = form.elements.username.value.trim();
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
      toast("Username must be 3–16 letters, numbers, or underscores.");
      return;
    }

    if (password.length < 8) {
      toast("Password must be at least 8 characters.");
      return;
    }

    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username }
      }
    });

    if (result.error) {
      toast(result.error.message);
      return;
    }

    toast("Account created. Check your email if confirmation is required.");
  }

  async function logIn(form) {
    if (!supabase) {
      toast("Online accounts are not configured yet.");
      return;
    }

    const result = await supabase.auth.signInWithPassword({
      email: form.elements.email.value.trim(),
      password: form.elements.password.value
    });

    if (result.error) {
      toast(result.error.message);
      return;
    }

    currentUser = result.data.user;
    toast("Logged in successfully.");
    renderRoute();
  }

  async function logOut() {
    if (!supabase) return;

    const result = await supabase.auth.signOut();

    if (result.error) {
      toast(result.error.message);
      return;
    }

    currentUser = null;
    toast("You have logged out.");
    renderRoute();
  }

  /* BROWSER */

  function renderBrowser() {
    return `
      <div class="page">
        ${heading("YOUR WEB SPACE", "Browser", "Open useful websites alongside your launcher.")}
        <div class="panel">
          <form id="browser-form" class="list">
            <label class="muted" for="browser-url">Website address</label>
            <input class="input" id="browser-url" type="url" placeholder="https://example.com" value="${escapeHTML(state.browserUrl)}" required>
            <div><button class="button" type="submit">Open website ↗</button></div>
          </form>
        </div>
        <div class="section-heading"><h2>Quick links</h2></div>
        <div class="grid">
          <div class="panel feature-card" data-action="quick-link" data-url="https://minecraft.net"><div class="feature-icon">M</div><div><strong>Minecraft</strong><span>Official website</span></div></div>
          <div class="panel feature-card" data-action="quick-link" data-url="https://github.com"><div class="feature-icon">G</div><div><strong>GitHub</strong><span>Project development</span></div></div>
          <div class="panel feature-card" data-action="quick-link" data-url="https://deepslate-client.pages.dev"><div class="feature-icon">D</div><div><strong>Deepslate</strong><span>Your launcher</span></div></div>
        </div>
      </div>
    `;
  }

  function renderPerformance() {
    return `
      <div class="page">
        ${heading("OPTIMIZE YOUR EXPERIENCE", "Performance", "Your performance dashboard and launcher-side preferences.")}
        <div class="grid">
          <div class="panel"><div class="stat-label">GAME VERSION</div><div class="stat-value">1.21.11</div><div class="stat-label">Selected client</div></div>
          <div class="panel"><div class="stat-label">PERFORMANCE MODS</div><div class="stat-value">${state.mods.filter(m => m.enabled && m.category === "Performance").length}</div><div class="stat-label">Enabled preferences</div></div>
          <div class="panel"><div class="stat-label">RUNTIME STATUS</div><div class="stat-value" style="font-size:19px">Not connected</div><div class="stat-label">Waiting for game integration</div></div>
        </div>
        <div class="section-heading"><h2>Performance preferences</h2></div>
        <div class="list">
          <div class="list-row"><div><strong>FPS Display</strong><p>Show FPS when supported by the game client.</p></div><span class="pill">MOD LIBRARY</span></div>
          <div class="list-row"><div><strong>Performance Profile</strong><p>Choose a launcher preference profile.</p></div><span class="pill">COMING SOON</span></div>
          <div class="list-row"><div><strong>Live Statistics</strong><p>Runtime FPS and memory statistics require game integration.</p></div><span class="pill">NOT CONNECTED</span></div>
        </div>
      </div>
    `;
  }

  function renderSettings() {
    return `
      <div class="page">
        ${heading("MAKE DEEPSLATE YOURS", "Settings", "Customize your launcher experience.")}
        <div class="grid two">
          <div class="panel">
            <h2>Appearance</h2>
            <p class="muted">Choose your launcher accent color.</p>
            <div class="color-options">
              ${Object.entries(ACCENTS).map(entry => `
                <button class="color-choice ${state.accent === entry[0] ? "selected" : ""}" style="background:${entry[1]}" data-action="accent" data-color="${entry[0]}" title="${entry[0]}"></button>
              `).join("")}
            </div>
          </div>

          <div class="panel">
            <h2>Player profile</h2>
            <p class="muted">Change your local display name.</p>
            <form id="profile-form" class="list">
              <input class="input" id="profile-name" maxlength="16" value="${escapeHTML(state.username)}" placeholder="Player name" required>
              <button class="button" type="submit">Save profile</button>
            </form>
          </div>

          <div class="panel">
            <h2>Data management</h2>
            <p class="muted">Export or restore your launcher preferences.</p>
            <div class="list">
              <button class="button secondary" data-action="export">Export settings</button>
              <button class="button secondary" data-action="import">Import settings</button>
              <button class="button secondary" data-action="reset">Reset launcher preferences</button>
              <input type="file" id="import-file" accept="application/json" hidden>
            </div>
          </div>

          <div class="panel">
            <h2>About Deepslate</h2>
            <div class="list">
              <div class="list-row"><div><strong>Launcher version</strong><p>${escapeHTML(C.version || "1.0.0")}</p></div></div>
              <div class="list-row"><div><strong>Minecraft version</strong><p>1.21.11</p></div></div>
              <div class="list-row"><div><strong>Storage</strong><p>Browser local storage</p></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* SERVER ACTIONS */

  function addServer() {
    const name = window.prompt("Enter a name for this server:");
    if (!name || !name.trim()) return;

    const address = window.prompt("Enter the server address:");
    if (!address || !address.trim()) return;

    state.servers.push({
      id: "server-" + Date.now(),
      name: name.trim().slice(0, 50),
      address: address.trim().slice(0, 200),
      featured: false
    });

    saveState();
    renderRoute();
    toast("Server saved.");
  }

  function toggleMod(id) {
    const mod = state.mods.find(item => item.id === id);
    if (!mod) return;

    mod.enabled = !mod.enabled;
    saveState();
    renderRoute();
    toast(mod.name + (mod.enabled ? " enabled." : " disabled."));
  }

  function copyServer(id) {
    const server = state.servers.find(item => item.id === id);
    if (!server) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(server.address)
        .then(() => toast("Server address copied."))
        .catch(() => toast("Could not copy address."));
    } else {
      toast("Clipboard access is unavailable.");
    }
  }

  function removeServer(id) {
    const server = state.servers.find(item => item.id === id);
    if (!server || !window.confirm("Remove " + server.name + "?")) return;

    state.servers = state.servers.filter(item => item.id !== id);
    saveState();
    renderRoute();
    toast("Server removed.");
  }

  /* SETTINGS */

  function exportSettings() {
    const file = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "deepslate-settings.json";
    link.click();

    URL.revokeObjectURL(url);
    toast("Settings exported.");
  }

  function importSettings(file) {
    const reader = new FileReader();

    reader.onload = function () {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported || typeof imported !== "object") throw new Error("Invalid settings");

        if (Array.isArray(imported.mods)) state.mods = imported.mods;
        if (Array.isArray(imported.servers)) state.servers = imported.servers;
        if (typeof imported.username === "string") state.username = imported.username.slice(0, 16);
        if (ACCENTS[imported.accent]) state.accent = imported.accent;

        saveState();
        setAccent(state.accent);
        renderRoute();
        toast("Settings imported.");
      } catch (error) {
        toast("That settings file could not be imported.");
      }
    };

    reader.readAsText(file);
  }

  /* GAME */

  function connectGame() {
    const url = String(C.gameUrl || "").trim();

    if (!url) {
      toast("The Minecraft game URL has not been configured yet.");
      return;
    }

    let parsed;

    try {
      parsed = new URL(url);
    } catch (error) {
      toast("The configured game URL is invalid.");
      return;
    }

    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      toast("The game URL must use HTTPS.");
      return;
    }

    if (!gameFrameWrap.querySelector("iframe")) {
      const frame = document.createElement("iframe");
      frame.className = "game-frame";
      frame.title = "Deepslate Minecraft Game";
      frame.allow = "fullscreen; autoplay; gamepad";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.src = parsed.href;

      gameFrameWrap.innerHTML = "";
      gameFrameWrap.appendChild(frame);
    }
  }

  function reloadGame() {
    const frame = gameFrameWrap.querySelector("iframe");

    if (frame) {
      frame.src = frame.src;
      toast("Game reloaded.");
    } else {
      connectGame();
    }
  }

  /* SOCIAL HELPERS */

  async function initializeSocial() {
    if (!currentUser || !supabase) return;

    const list = document.getElementById("friend-list");
    if (!list) return;

    list.innerHTML = '<p class="muted">Loading friends...</p>';

    const result = await supabase
      .from("friendships")
      .select("id, friend:profiles!friendships_friend_id_fkey(id, username)")
      .eq("user_id", currentUser.id);

    if (result.error) {
      list.innerHTML = '<p class="muted">Friends database is not set up yet.</p>';
      return;
    }

    if (!result.data.length) {
      list.innerHTML = '<p class="muted">No friends yet. Search for a username above.</p>';
      return;
    }

    list.innerHTML = result.data.map(row => `
      <div class="list-row">
        <strong>${escapeHTML(row.friend && row.friend.username || "Player")}</strong>
        <button class="small-button" data-action="open-chat" data-friend="${escapeHTML(row.friend.id)}" data-name="${escapeHTML(row.friend.username)}">Message</button>
      </div>
    `).join("");

    const conversations = document.getElementById("conversation-list");
    if (conversations) {
      conversations.innerHTML = '<p class="muted">Select a friend to start a conversation.</p>';
    }
  }

  async function searchFriends() {
    if (!supabase || !currentUser) return;

    const input = document.getElementById("friend-search");
    const results = document.getElementById("friend-results");
    if (!input || !results) return;

    const username = input.value.trim();
    if (username.length < 3) {
      toast("Enter at least 3 characters.");
      return;
    }

    results.innerHTML = '<p class="muted">Searching...</p>';

    const result = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", username)
      .neq("id", currentUser.id)
      .limit(10);

    if (result.error) {
      results.innerHTML = '<p class="muted">Could not search players. The profiles database may not be set up yet.</p>';
      return;
    }

    if (!result.data.length) {
      results.innerHTML = '<p class="muted">No player found with that username.</p>';
      return;
    }

    results.innerHTML = result.data.map(profile => `
      <div class="list-row">
        <strong>${escapeHTML(profile.username)}</strong>
        <button class="small-button" data-action="send-friend" data-id="${escapeHTML(profile.id)}">Add friend</button>
      </div>
    `).join("");
  }

  async function sendFriendRequest(id) {
    if (!supabase || !currentUser) return;

    const result = await supabase.from("friend_requests").insert({
      sender_id: currentUser.id,
      receiver_id: id,
      status: "pending"
    });

    if (result.error) {
      toast(result.error.message);
      return;
    }

    toast("Friend request sent.");
  }

  async function openChat(friendId, friendName) {
    if (!supabase || !currentUser) return;

    const area = document.getElementById("conversation-view");
    if (!area) return;

    area.innerHTML = `
      <div class="section-heading"><h3>${escapeHTML(friendName)}</h3></div>
      <div id="chat-messages" class="list" style="max-height:280px;overflow:auto"></div>
      <form id="chat-form" class="list">
        <input class="input" name="message" maxlength="2000" placeholder="Write a message..." required>
        <button class="button" type="submit">Send message</button>
      </form>
    `;

    area.dataset.friendId = friendId;
    await loadMessages(friendId);

    const form = document.getElementById("chat-form");
    form.addEventListener("submit", async event => {
      event.preventDefault();

      const message = form.elements.message.value.trim();
      if (!message) return;

      const result = await supabase.from("messages").insert({
        sender_id: currentUser.id,
        receiver_id: friendId,
        content: message
      });

      if (result.error) {
        toast(result.error.message);
        return;
      }

      form.reset();
      await loadMessages(friendId);
    });
  }

  async function loadMessages(friendId) {
    if (!supabase || !currentUser) return;

    const box = document.getElementById("chat-messages");
    if (!box) return;

    const result = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .or(
        "and(sender_id.eq." + currentUser.id + ",receiver_id.eq." + friendId + ")," +
        "and(sender_id.eq." + friendId + ",receiver_id.eq." + currentUser.id + ")"
      )
      .order("created_at", { ascending: true })
      .limit(100);

    if (result.error) {
      box.innerHTML = '<p class="muted">Messages database is not set up yet.</p>';
      return;
    }

    box.innerHTML = result.data.map(message => `
      <div class="panel" style="padding:10px">
        <strong>${message.sender_id === currentUser.id ? "You" : "Friend"}</strong>
        <p>${escapeHTML(message.content)}</p>
      </div>
    `).join("") || '<p class="muted">No messages yet. Say hello!</p>';

    box.scrollTop = box.scrollHeight;
  }

  /* EVENTS */

  document.addEventListener("click", function (event) {
    const routeButton = event.target.closest("[data-route]");

    if (routeButton) {
      setRoute(routeButton.dataset.route);
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.action;

    switch (action) {
      case "play":
        setRoute("play");
        break;

      case "toggle-mod":
        toggleMod(actionButton.dataset.id);
        break;

      case "add-server":
        addServer();
        break;

      case "remove-server":
        removeServer(actionButton.dataset.id);
        break;

      case "copy-server":
        copyServer(actionButton.dataset.id);
        break;

      case "accent":
        setAccent(actionButton.dataset.color);
        renderRoute();
        toast("Accent color updated.");
        break;

      case "export":
        exportSettings();
        break;

      case "import":
        document.getElementById("import-file").click();
        break;

      case "reset":
        if (window.confirm("Reset all saved Deepslate preferences?")) {
          localStorage.removeItem(STORAGE_KEY);
          window.location.reload();
        }
        break;

      case "remove-skin":
        state.skin = null;
        saveState();
        renderRoute();
        toast("Returned to the plain gray skin.");
        break;

      case "skin-reset-camera":
        if (skinViewer) {
          skinViewer.camera.position.set(0, 0, 35);
          skinViewer.autoRotate = false;
          toast("View reset.");
        }
        break;

      case "skin-rotate":
        if (skinViewer) {
          skinViewer.autoRotate = !skinViewer.autoRotate;
          toast(skinViewer.autoRotate ? "Rotation enabled." : "Rotation paused.");
        }
        break;

      case "quick-link":
        window.open(actionButton.dataset.url, "_blank", "noopener,noreferrer");
        break;

      case "search-friends":
        searchFriends();
        break;

      case "send-friend":
        sendFriendRequest(actionButton.dataset.id);
        break;

      case "open-chat":
        openChat(actionButton.dataset.friend, actionButton.dataset.name);
        break;

      case "logout":
        logOut();
        break;
    }
  });

  document.addEventListener("submit", function (event) {
    const form = event.target;

    if (form.id === "profile-form") {
      event.preventDefault();

      const value = document.getElementById("profile-name").value.trim();
      if (!value) return;

      state.username = value.slice(0, 16);
      saveState();

      const profileName = document.querySelector(".profile-info strong");
      if (profileName) profileName.textContent = state.username;

      toast("Profile updated.");
    }

    if (form.id === "browser-form") {
      event.preventDefault();

      let url = document.getElementById("browser-url").value.trim();

      if (!/^https?:\/\//i.test(url)) url = "https://" + url;

      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();

        state.browserUrl = parsed.href;
        saveState();
        window.open(parsed.href, "_blank", "noopener,noreferrer");
      } catch (error) {
        toast("Enter a valid website address.");
      }
    }

    if (form.id === "signup-form") {
      event.preventDefault();
      signUp(form);
    }

    if (form.id === "login-form") {
      event.preventDefault();
      logIn(form);
    }
  });

  document.addEventListener("change", function (event) {
    if (event.target.id === "skin-upload") {
      const file = event.target.files && event.target.files[0];
      if (file) uploadSkin(file);
      event.target.value = "";
    }

    if (event.target.id === "import-file") {
      const file = event.target.files && event.target.files[0];
      if (file) importSettings(file);
      event.target.value = "";
    }
  });

  const reloadButton = document.getElementById("reload-game");
  if (reloadButton) reloadButton.addEventListener("click", reloadGame);

  const searchButton = document.getElementById("search-button");
  if (searchButton) {
    searchButton.addEventListener("click", function () {
      const query = window.prompt("Search Deepslate sections:");
      if (!query) return;

      const routes = [
        ["home", "home dashboard"],
        ["play", "play minecraft game"],
        ["mods", "mods mod library"],
        ["wardrobe", "wardrobe skins capes cosmetics"],
        ["servers", "servers multiplayer"],
        ["social", "social friends messages"],
        ["browser", "browser websites"],
        ["performance", "performance fps"],
        ["settings", "settings preferences"]
      ];

      const normalized = query.toLowerCase().trim();
      const match = routes.find(item => item[1].includes(normalized) || item[0] === normalized);

      if (match) setRoute(match[0]);
      else toast("No matching section found.");
    });
  }

  /* STARTUP */

  setAccent(state.accent);

  const profileName = document.querySelector(".profile-info strong");
  if (profileName) profileName.textContent = state.username;

  setRoute("home");
  initializeSupabase();
})();
