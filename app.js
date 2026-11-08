(function () {
  "use strict";

  const C = window.DEEPSLATE_CONFIG || {};
  const STORAGE_KEY = C.storageKey || "deepslate.client.v1";
  const pageContent = document.getElementById("page-content");
  const gameStage = document.getElementById("game-stage");
  const gameFrameWrap = document.getElementById("game-frame-wrap");
  const toastContainer = document.getElementById("toast-container");

  const ACCENTS = {
    purple: "#9b8cff",
    blue: "#5ba9ff",
    green: "#54d69a",
    orange: "#ffa45e",
    pink: "#f17fc1",
    cyan: "#56d9df"
  };

  const DEFAULT_MODS = [
    {
      id: "fps-display",
      name: "FPS Display",
      description: "Show your current frames per second.",
      category: "Performance",
      enabled: true
    },
    {
      id: "coordinates",
      name: "Coordinates",
      description: "Display your current world coordinates.",
      category: "HUD",
      enabled: true
    },
    {
      id: "keystrokes",
      name: "Keystrokes",
      description: "Show your movement and input keys.",
      category: "HUD",
      enabled: false
    },
    {
      id: "armor-status",
      name: "Armor Status",
      description: "View your equipped armor status.",
      category: "HUD",
      enabled: false
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "A convenient zoom preference.",
      category: "Utility",
      enabled: false
    },
    {
      id: "fullbright",
      name: "Fullbright",
      description: "A brightness preference for supported clients.",
      category: "Visual",
      enabled: false
    },
    {
      id: "crosshair",
      name: "Crosshair Customizer",
      description: "Customize your crosshair preference.",
      category: "Visual",
      enabled: false
    },
    {
      id: "hitboxes",
      name: "Hitbox Display",
      description: "A display preference for supported clients.",
      category: "Utility",
      enabled: false
    }
  ];

  const DEFAULT_SERVERS = [
    {
      id: "featured-1",
      name: "Your Favorite Server",
      address: "Add your server address",
      featured: true
    }
  ];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

      return {
        accent: saved.accent || "purple",
        mods: Array.isArray(saved.mods) ? saved.mods : DEFAULT_MODS,
        servers: Array.isArray(saved.servers) ? saved.servers : DEFAULT_SERVERS,
        username: saved.username || "Player",
        browserUrl: saved.browserUrl || "https://example.com"
      };
    } catch (error) {
      return {
        accent: "purple",
        mods: DEFAULT_MODS,
        servers: DEFAULT_SERVERS,
        username: "Player",
        browserUrl: "https://example.com"
      };
    }
  }

  const state = loadState();
  let currentRoute = "home";

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      toast("Could not save preferences in this browser.");
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  function toast(message) {
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    toastContainer.appendChild(item);

    window.setTimeout(function () {
      item.remove();
    }, 2600);
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

  function hexToRGBA(hex, alpha) {
    const value = hex.replace("#", "");
    const number = parseInt(value, 16);
    const red = (number >> 16) & 255;
    const green = (number >> 8) & 255;
    const blue = number & 255;

    return "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
  }

  function setRoute(route) {
    const validRoutes = [
      "home", "play", "mods", "wardrobe", "servers",
      "social", "browser", "performance", "settings"
    ];

    if (!validRoutes.includes(route)) return;

    currentRoute = route;

    document.querySelectorAll("[data-route]").forEach(function (button) {
      button.classList.toggle(
        "active",
        button.dataset.route === route
      );
    });

    if (route === "play") {
      pageContent.hidden = true;
      gameStage.hidden = false;
      return;
    }

    gameStage.hidden = true;
    pageContent.hidden = false;
    renderRoute();
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

    const renderer = renderers[currentRoute];

    if (renderer) {
      pageContent.innerHTML = renderer();
    }
  }

  function renderHome() {
    const enabledMods = state.mods.filter(function (mod) {
      return mod.enabled;
    }).length;

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
            <p>
              A customizable Minecraft environment with your mods,
              servers, cosmetics, and preferences all together.
            </p>
            <div class="hero-actions">
              <button class="button" data-action="play">Play Minecraft &nbsp; →</button>
              <button class="button secondary" data-route="mods">Explore Mods</button>
            </div>
          </div>
        </section>

        <div class="section-heading">
          <h2>Your workspace</h2>
          <span class="muted">Quick overview</span>
        </div>

        <div class="grid">
          <div class="panel">
            <div class="stat-label">GAME VERSION</div>
            <div class="stat-value">1.21.11</div>
            <div class="stat-label">Minecraft client</div>
          </div>
          <div class="panel">
            <div class="stat-label">ENABLED MODS</div>
            <div class="stat-value">${enabledMods}</div>
            <div class="stat-label">Saved preferences</div>
          </div>
          <div class="panel">
            <div class="stat-label">SAVED SERVERS</div>
            <div class="stat-value">${state.servers.length}</div>
            <div class="stat-label">Your server list</div>
          </div>
        </div>

        <div class="section-heading">
          <h2>Explore Deepslate</h2>
        </div>

        <div class="grid">
          <div class="panel feature-card">
            <div class="feature-icon">▦</div>
            <div>
              <strong>Mod Library</strong>
              <span>Manage your saved mod preferences.</span>
            </div>
          </div>
          <div class="panel feature-card">
            <div class="feature-icon">◇</div>
            <div>
              <strong>Wardrobe</strong>
              <span>Your cosmetics and appearance space.</span>
            </div>
          </div>
          <div class="panel feature-card">
            <div class="feature-icon">◎</div>
            <div>
              <strong>Multiplayer</strong>
              <span>Keep your favorite servers together.</span>
            </div>
          </div>
        </div>

        <div class="section-heading">
          <h2>Getting started</h2>
        </div>

        <div class="panel">
          <div class="list">
            <div class="list-row">
              <div>
                <strong>Customize your launcher</strong>
                <p>Choose an accent color and make Deepslate yours.</p>
              </div>
              <button class="small-button" data-route="settings">Open settings</button>
            </div>
            <div class="list-row">
              <div>
                <strong>Build your mod collection</strong>
                <p>Choose which preferences you want enabled.</p>
              </div>
              <button class="small-button" data-route="mods">View mods</button>
            </div>
            <div class="list-row">
              <div>
                <strong>Add your favorite servers</strong>
                <p>Save server addresses for quick access.</p>
              </div>
              <button class="small-button" data-route="servers">Manage servers</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMods() {
    const categories = ["All", "HUD", "Performance", "Utility", "Visual"];

    return `
      <div class="page">
        ${heading(
          "CUSTOMIZE YOUR GAME",
          "Mod Library",
          "Manage your add-on preferences and build your ideal setup."
        )}

        <div class="grid">
          <div class="panel">
            <div class="stat-label">AVAILABLE ENTRIES</div>
            <div class="stat-value">${state.mods.length}</div>
          </div>
          <div class="panel">
            <div class="stat-label">ENABLED</div>
            <div class="stat-value">${state.mods.filter(m => m.enabled).length}</div>
          </div>
          <div class="panel">
            <div class="stat-label">GAME VERSION</div>
            <div class="stat-value">1.21.11</div>
          </div>
        </div>

        <div class="section-heading">
          <h2>Installed preferences</h2>
          <span class="pill">LOCAL SETTINGS</span>
        </div>

        <div class="list">
          ${state.mods.map(function (mod) {
            return `
              <div class="list-row">
                <div>
                  <strong>${escapeHTML(mod.name)}</strong>
                  <p>${escapeHTML(mod.description)} · ${escapeHTML(mod.category)}</p>
                </div>
                <button
                  class="toggle ${mod.enabled ? "on" : ""}"
                  data-action="toggle-mod"
                  data-id="${escapeHTML(mod.id)}"
                  aria-label="Toggle ${escapeHTML(mod.name)}"
                  aria-pressed="${mod.enabled}">
                </button>
              </div>
            `;
          }).join("")}
        </div>

        <p class="muted" style="margin-top:18px">
          These are saved launcher preferences. Actual mod installation and
          game-side effects require a compatible Minecraft runtime integration.
        </p>
      </div>
    `;
  }

  function renderWardrobe() {
    return `
      <div class="page">
        ${heading(
          "MAKE IT YOURS",
          "Wardrobe",
          "Your place for skins, capes, and player customization."
        )}

        <div class="grid two">
          <div class="panel" style="text-align:center;padding:35px 20px">
            <div style="font-size:70px;margin-bottom:15px">🧍</div>
            <h2>Player appearance</h2>
            <p class="muted">Your character preview will appear here when a skin source is connected.</p>
            <button class="button secondary" data-action="wardrobe-preview">Preview appearance</button>
          </div>
          <div class="panel">
            <div class="eyebrow">YOUR COLLECTION</div>
            <h2>Cosmetics</h2>
            <div class="list">
              <div class="list-row">
                <div>
                  <strong>Skins</strong>
                  <p>Manage your player skins.</p>
                </div>
                <span class="pill">COMING SOON</span>
              </div>
              <div class="list-row">
                <div>
                  <strong>Capes</strong>
                  <p>View your available capes.</p>
                </div>
                <span class="pill">COMING SOON</span>
              </div>
              <div class="list-row">
                <div>
                  <strong>Accessories</strong>
                  <p>Additional appearance options.</p>
                </div>
                <span class="pill">COMING SOON</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderServers() {
    return `
      <div class="page">
        ${heading(
          "MULTIPLAYER",
          "Your Servers",
          "Keep your favorite Minecraft servers organized.",
          '<button class="button" data-action="add-server">＋ Add Server</button>'
        )}

        <div class="section-heading">
          <h2>Saved servers</h2>
          <span class="muted">${state.servers.length} saved</span>
        </div>

        <div class="list">
          ${state.servers.length ? state.servers.map(function (server) {
            return `
              <div class="list-row">
                <div>
                  <strong>${escapeHTML(server.name)}</strong>
                  <p>${escapeHTML(server.address)}</p>
                </div>
                <div style="display:flex;gap:7px;align-items:center">
                  <button class="small-button" data-action="copy-server" data-id="${escapeHTML(server.id)}">Copy address</button>
                  <button class="small-button" data-action="remove-server" data-id="${escapeHTML(server.id)}">Remove</button>
                </div>
              </div>
            `;
          }).join("") : '<div class="empty-state">No servers saved yet. Add your first server to get started.</div>'}
        </div>

        <p class="muted" style="margin-top:18px">
          This list stores server addresses in your browser. Live status and
          joining require support from the connected game client.
        </p>
      </div>
    `;
  }

  function renderSocial() {
    return `
      <div class="page">
        ${heading(
          "PLAY TOGETHER",
          "Social",
          "A future home for friends, messages, and multiplayer groups."
        )}

        <div class="grid two">
          <div class="panel">
            <div class="feature-icon">♧</div>
            <h2>Friends</h2>
            <p class="muted">Friend lists and player presence will be available when a social service is connected.</p>
            <span class="pill">NOT CONNECTED</span>
          </div>
          <div class="panel">
            <div class="feature-icon">✉</div>
            <h2>Messages</h2>
            <p class="muted">A future space for direct messages and group conversations.</p>
            <span class="pill">NOT CONNECTED</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderBrowser() {
    return `
      <div class="page">
        ${heading(
          "YOUR WEB SPACE",
          "Browser",
          "Open useful websites alongside your launcher."
        )}

        <div class="panel">
          <form id="browser-form" class="list">
            <label class="muted" for="browser-url">Website address</label>
            <input
              class="input"
              id="browser-url"
              type="url"
              placeholder="https://example.com"
              value="${escapeHTML(state.browserUrl)}"
              required
            >
            <div>
              <button class="button" type="submit">Open website ↗</button>
            </div>
          </form>
        </div>

        <div class="section-heading">
          <h2>Quick links</h2>
        </div>
        <div class="grid">
          <div class="panel feature-card">
            <div class="feature-icon">M</div>
            <div><strong>Minecraft</strong><span>Official website</span></div>
          </div>
          <div class="panel feature-card">
            <div class="feature-icon">G</div>
            <div><strong>GitHub</strong><span>Project development</span></div>
          </div>
          <div class="panel feature-card">
            <div class="feature-icon">D</div>
            <div><strong>Deepslate</strong><span>Your launcher</span></div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPerformance() {
    return `
      <div class="page">
        ${heading(
          "OPTIMIZE YOUR EXPERIENCE",
          "Performance",
          "Your performance dashboard and launcher-side preferences."
        )}

        <div class="grid">
          <div class="panel">
            <div class="stat-label">GAME VERSION</div>
            <div class="stat-value">1.21.11</div>
            <div class="stat-label">Selected client</div>
          </div>
          <div class="panel">
            <div class="stat-label">PERFORMANCE MODS</div>
            <div class="stat-value">${state.mods.filter(m => m.enabled && m.category === "Performance").length}</div>
            <div class="stat-label">Enabled preferences</div>
          </div>
          <div class="panel">
            <div class="stat-label">RUNTIME STATUS</div>
            <div class="stat-value" style="font-size:19px">Not connected</div>
            <div class="stat-label">Waiting for game integration</div>
          </div>
        </div>

        <div class="section-heading">
          <h2>Performance preferences</h2>
        </div>

        <div class="list">
          <div class="list-row">
            <div><strong>FPS Display</strong><p>Show FPS when supported by the game client.</p></div>
            <span class="pill">MOD LIBRARY</span>
          </div>
          <div class="list-row">
            <div><strong>Performance Profile</strong><p>Choose a launcher preference profile.</p></div>
            <span class="pill">COMING SOON</span>
          </div>
          <div class="list-row">
            <div><strong>Live Statistics</strong><p>Runtime FPS and memory statistics require game integration.</p></div>
            <span class="pill">NOT CONNECTED</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderSettings() {
    return `
      <div class="page">
        ${heading(
          "MAKE DEEPSLATE YOURS",
          "Settings",
          "Customize your launcher experience."
        )}

        <div class="grid two">
          <div class="panel">
            <h2>Appearance</h2>
            <p class="muted">Choose your launcher accent color.</p>
            <div class="color-options">
              ${Object.entries(ACCENTS).map(function (entry) {
                return `
                  <button
                    class="color-choice ${state.accent === entry[0] ? "selected" : ""}"
                    style="background:${entry[1]}"
                    data-action="accent"
                    data-color="${entry[0]}"
                    title="${entry[0]}">
                  </button>
                `;
              }).join("")}
            </div>
          </div>

          <div class="panel">
            <h2>Player profile</h2>
            <p class="muted">Change the local display name shown in the launcher.</p>
            <form id="profile-form" class="list">
              <input
                class="input"
                id="profile-name"
                maxlength="16"
                value="${escapeHTML(state.username)}"
                placeholder="Player name"
                required
              >
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
              <div class="list-row">
                <div><strong>Launcher version</strong><p>${escapeHTML(C.version || "1.0.0")}</p></div>
              </div>
              <div class="list-row">
                <div><strong>Minecraft version</strong><p>1.21.11</p></div>
              </div>
              <div class="list-row">
                <div><strong>Storage</strong><p>Browser local storage</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

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
    const mod = state.mods.find(function (item) {
      return item.id === id;
    });

    if (!mod) return;

    mod.enabled = !mod.enabled;
    saveState();
    renderRoute();
    toast(mod.name + (mod.enabled ? " enabled." : " disabled."));
  }

  function copyServer(id) {
    const server = state.servers.find(function (item) {
      return item.id === id;
    });

    if (!server) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(server.address)
        .then(function () {
          toast("Server address copied.");
        })
        .catch(function () {
          toast("Could not copy address.");
        });
    } else {
      toast("Clipboard access is unavailable.");
    }
  }

  function removeServer(id) {
    const server = state.servers.find(function (item) {
      return item.id === id;
    });

    if (!server) return;
    if (!window.confirm("Remove " + server.name + "?")) return;

    state.servers = state.servers.filter(function (item) {
      return item.id !== id;
    });

    saveState();
    renderRoute();
    toast("Server removed.");
  }

  function exportSettings() {
    const file = new Blob(
      [JSON.stringify(state, null, 2)],
      { type: "application/json" }
    );

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

        if (!imported || typeof imported !== "object") {
          throw new Error("Invalid settings");
        }

        if (Array.isArray(imported.mods)) {
          state.mods = imported.mods;
        }

        if (Array.isArray(imported.servers)) {
          state.servers = imported.servers;
        }

        if (typeof imported.username === "string") {
          state.username = imported.username.slice(0, 16);
        }

        if (ACCENTS[imported.accent]) {
          state.accent = imported.accent;
        }

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
        connectGame();
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

      case "wardrobe-preview":
        toast("The wardrobe preview is awaiting skin integration.");
        break;
    }
  });

  document.addEventListener("submit", function (event) {
    if (event.target.id === "profile-form") {
      event.preventDefault();

      const input = document.getElementById("profile-name");
      const value = input.value.trim();

      if (!value) return;

      state.username = value.slice(0, 16);
      saveState();

      const profileName = document.querySelector(".profile-info strong");
      if (profileName) profileName.textContent = state.username;

      toast("Profile updated.");
    }

    if (event.target.id === "browser-form") {
      event.preventDefault();

      const input = document.getElementById("browser-url");
      let url = input.value.trim();

      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }

      try {
        const parsed = new URL(url);

        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          throw new Error("Invalid protocol");
        }

        state.browserUrl = parsed.href;
        saveState();
        window.open(parsed.href, "_blank", "noopener,noreferrer");
      } catch (error) {
        toast("Enter a valid website address.");
      }
    }
  });

  document.getElementById("import-file").addEventListener("change", function (event) {
    const file = event.target.files && event.target.files[0];

    if (file) {
      importSettings(file);
    }

    event.target.value = "";
  });

  document.getElementById("reload-game").addEventListener("click", reloadGame);

  document.getElementById("search-button").addEventListener("click", function () {
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

    const match = routes.find(function (item) {
      return item[1].includes(query.toLowerCase().trim());
    });

    if (match) {
      setRoute(match[0]);
    } else {
      toast("No matching section found.");
    }
  });

  // Apply the saved theme and load the initial screen.
  setAccent(state.accent);

  const profileName = document.querySelector(".profile-info strong");
  if (profileName) {
    profileName.textContent = state.username;
  }

  setRoute("home");
})();
