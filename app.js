```javascript
/* Deepslate Client — persistent launcher + game shell */
(function () {
  "use strict";

  var C = window.DEEPSLATE_CONFIG || {};
  var STORAGE_KEY = "deepslate.v27";
  var OWNER = "cruxisdumb";
  var ACCENTS = {
    periwinkle: "#a594f9",
    green: "#3ddc97",
    blue: "#4aa8ff",
    orange: "#ffa94d"
  };

  var route = "home";
  var gameStarted = false;
  var gameFrame = null;
  var gameHost = null;

  var DEFAULT_MODS = Array.isArray(C.MODS) && C.MODS.length ? C.MODS : [
    { id: "fps-boost", name: "Sodium", category: "Performance", code: "SO", desc: "Performance improvements." },
    { id: "iris", name: "Iris Shaders", category: "Visuals", code: "IR", desc: "Shader support." },
    { id: "zoom", name: "ZoomX Smooth", category: "Utility", code: "ZM", desc: "Smooth zoom with scroll adjustment." },
    { id: "hitboxes", name: "Combat Hitboxes", category: "PvP", code: "HB", desc: "Custom entity hitbox rendering." },
    { id: "armor-hud", name: "Uku's Armor HUD", category: "HUD", code: "AR", desc: "Shows armor durability." },
    { id: "fullbright", name: "Fullbright & Clear", category: "Visuals", code: "FB", desc: "Fullbright and visual improvements." }
  ];

  function element(tag, attrs) {
    var node = document.createElement(tag);
    var children = Array.prototype.slice.call(arguments, 2);

    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];

      if (key === "class") node.className = value;
      else if (key === "style" && typeof value === "object") {
        Object.keys(value).forEach(function (styleKey) {
          node.style[styleKey] = value[styleKey];
        });
      } else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2), value);
      } else if (key === "checked" || key === "disabled" || key === "selected") {
        node[key] = !!value;
      } else if (value !== null && value !== undefined) {
        node.setAttribute(key, String(value));
      }
    });

    children.forEach(function add(child) {
      if (Array.isArray(child)) child.forEach(add);
      else if (child !== null && child !== undefined && child !== false) {
        node.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
      }
    });

    return node;
  }

  function makeProfile(name) {
    return {
      id: Math.random().toString(36).slice(2, 9),
      name: name || "Player",
      status: "",
      bio: "",
      model: "Classic",
      skin: "",
      friends: [{ name: "CruxIsDumb", note: "Client Owner" }]
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY) ||
                localStorage.getItem("deepslate.v26");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  var firstProfile = makeProfile("Player");
  var S = loadState() || {
    profiles: [firstProfile],
    activeId: firstProfile.id,
    accent: "periwinkle",
    extraDark: false,
    version: C.DEFAULT_VERSION || "1.21.11",
    inst: "My instance 1",
    mods: { "fps-boost": true, zoom: true },
    filter: "All",
    search: "",
    servers: Array.isArray(C.FEATURED_SERVERS)
      ? C.FEATURED_SERVERS.map(function (server) {
          return { name: server.name, ip: server.ip };
        })
      : [],
    pose: "Idle",
    stTab: "My account",
    perfMode: false
  };

  if (!Array.isArray(S.profiles) || !S.profiles.length) {
    S.profiles = [firstProfile];
    S.activeId = firstProfile.id;
  }

  if (!S.mods || typeof S.mods !== "object") S.mods = {};
  if (!Array.isArray(S.servers)) S.servers = [];
  if (!S.version) S.version = C.DEFAULT_VERSION || "1.21.11";
  if (!ACCENTS[S.accent]) S.accent = "periwinkle";

  function profile() {
    for (var i = 0; i < S.profiles.length; i++) {
      if (S.profiles[i].id === S.activeId) return S.profiles[i];
    }
    S.activeId = S.profiles[0].id;
    return S.profiles[0];
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
    } catch (error) {
      toast("Could not save settings in this browser.");
    }
  }

  function toast(message) {
    var host = document.getElementById("toasts");
    if (!host) return;

    var item = element("div", { class: "toast", role: "status" }, message);
    host.appendChild(item);

    window.setTimeout(function () {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 2800);
  }

  function modal(title, content, buttons) {
    var overlay = document.getElementById("overlay");
    if (!overlay) return;

    var backdrop;

    function close() {
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    }

    backdrop = element("div", {
      class: "ds-modal-backdrop",
      onclick: function (event) {
        if (event.target === backdrop) close();
      }
    },
      element("section", {
        class: "ds-modal",
        role: "dialog",
        "aria-modal": "true"
      },
        element("h2", {}, title),
        content,
        element("div", { class: "ds-modal-actions" }, buttons(close))
      )
    );

    overlay.appendChild(backdrop);
  }

  function ask(title, current, placeholder, callback) {
    var input = element("input", {
      class: "ds-modal-input",
      type: "text",
      value: current || "",
      placeholder: placeholder || ""
    });

    modal(title, input, function (close) {
      return [
        element("button", {
          class: "btn",
          type: "button",
          onclick: close
        }, "Cancel"),

        element("button", {
          class: "btn primary",
          type: "button",
          onclick: function () {
            callback(input.value);
            close();
          }
        }, "Save")
      ];
    });

    window.setTimeout(function () {
      input.focus();
      input.select();
    }, 30);
  }

  function getGameUrl(serverIp) {
    var base = String(C.GAME_URL || "").trim();
    if (!base) return "";

    var params = new URLSearchParams();
    params.set("deepslateVersion", S.version);
    params.set("username", profile().name);

    params.set(
      "deepslateMods",
      Object.keys(S.mods).filter(function (id) {
        return !!S.mods[id];
      }).join(",")
    );

    if (serverIp) params.set("server", serverIp);

    return base +
      (base.indexOf("?") === -1 ? "?" : "&") +
      params.toString();
  }

  /*
   * The game iframe is created ONCE.
   * Navigation never destroys or recreates it.
   */
  function buildGameShell() {
    if (gameHost) return;

    gameHost = element("section", {
      id: "deepslateGameHost",
      class: "ds-game-host is-hidden"
    });

    var gameBar = element("div", { class: "ds-game-bar" },
      element("div", { class: "ds-game-title" },
        element("span", { class: "ds-live-dot" }),
        element("strong", {}, "Deepslate Game"),
        element("small", { id: "dsGameVersion" }, S.version)
      ),

      element("div", { class: "ds-game-actions" },
        element("button", {
          class: "btn",
          type: "button",
          onclick: function () {
            go("home");
          }
        }, "Back to launcher"),

        element("button", {
          class: "btn",
          type: "button",
          onclick: function () {
            if (gameFrame && gameFrame.contentWindow) {
              gameFrame.contentWindow.location.reload();
            }
          }
        }, "Reload game"),

        element("button", {
          class: "btn primary",
          type: "button",
          onclick: function () {
            if (gameFrame && gameFrame.requestFullscreen) {
              gameFrame.requestFullscreen().catch(function () {
                toast("Fullscreen is unavailable.");
              });
            }
          }
        }, "Fullscreen")
      )
    );

    gameFrame = element("iframe", {
      id: "deepslateGameFrame",
      title: "Deepslate Minecraft game",
      allow: "fullscreen; autoplay; gamepad; pointer-lock",
      allowfullscreen: "true",
      referrerpolicy: "strict-origin-when-cross-origin"
    });

    gameHost.appendChild(gameBar);
    gameHost.appendChild(gameFrame);
    document.body.appendChild(gameHost);
  }

  function showGame(visible) {
    buildGameShell();

    gameHost.classList.toggle("is-hidden", !visible);
    gameHost.setAttribute("aria-hidden", visible ? "false" : "true");

    var view = document.getElementById("view");
    if (view) view.style.display = visible ? "none" : "";

    if (visible) {
      var label = document.getElementById("dsGameVersion");
      if (label) label.textContent = S.version;
    }
  }

  function launch(serverIp) {
    var url = getGameUrl(serverIp);

    if (!url) {
      modal(
        "Game engine not configured",
        element("p", { class: "ds-muted" },
          "Set GAME_URL in config.js to your actual Eaglercraft client, for example /game/index.html."
        ),
        function (close) {
          return [
            element("button", {
              class: "btn primary",
              type: "button",
              onclick: close
            }, "Got it")
          ];
        }
      );
      return;
    }

    buildGameShell();

    if (!gameStarted || serverIp) {
      gameFrame.src = url;
      gameStarted = true;
    }

    showGame(true);
    route = "game";
    updateNavigation();
  }

  function updateNavigation() {
    var buttons = document.querySelectorAll("[data-route]");

    Array.prototype.forEach.call(buttons, function (button) {
      var active = button.getAttribute("data-route") === route;
      button.classList.toggle("active", active);

      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    var username = document.getElementById("navUsername");
    if (username) username.textContent = profile().name;
  }

  function go(nextRoute) {
    if (!pages[nextRoute] && nextRoute !== "game") nextRoute = "home";

    route = nextRoute;

    if (route === "game") {
      if (!gameStarted) {
        showGame(false);
        route = "home";
        toast("Press Play to start the game.");
      } else {
        showGame(true);
      }
    } else {
      showGame(false);
      render();
    }

    updateNavigation();
  }

  function heading(title, subtitle, action) {
    return element("div", { class: "ds-section-heading" },
      element("div", {},
        element("p", { class: "ds-eyebrow" }, "DEEPSLATE CLIENT"),
        element("h1", {}, title),
        subtitle ? element("p", { class: "ds-muted" }, subtitle) : null
      ),
      action || null
    );
  }

  function card(title, description, content) {
    return element("section", { class: "card ds-panel" },
      title ? element("h3", {}, title) : null,
      description ? element("p", {
        class: "ds-muted ds-card-description"
      }, description) : null,
      content || null
    );
  }

  function homePage() {
    var enabledCount = Object.keys(S.mods).filter(function (id) {
      return S.mods[id];
    }).length;

    var versions = Array.isArray(C.VERSIONS) && C.VERSIONS.length
      ? C.VERSIONS
      : [{ id: C.DEFAULT_VERSION || "1.21.11", label: C.DEFAULT_VERSION || "1.21.11" }];

    var versionSelect = element("select", {
      class: "ds-version-select",
      "aria-label": "Minecraft version",
      onchange: function (event) {
        S.version = event.target.value;
        save();
        toast("Version set to " + S.version);
      }
    });

    versions.forEach(function (version) {
      versionSelect.appendChild(element("option", {
        value: version.id,
        selected: version.id === S.version
      }, version.label || version.id));
    });

    return element("div", { class: "ds-page" },
      element("section", { class: "ds-home-hero" },
        element("div", { class: "ds-home-copy" },
          element("p", { class: "ds-eyebrow" }, "YOUR GAME. YOUR WAY."),
          element("h1", {},
            "Welcome to ",
            element("span", {}, "Deepslate.")
          ),
          element("p", { class: "ds-hero-description" },
            "Your Minecraft client, launcher, mods and servers — all in one place."
          ),

          element("div", { class: "ds-launch-controls" },
            element("button", {
              class: "ds-play-button",
              type: "button",
              onclick: function () { launch(); }
            },
              element("span", { class: "ds-play-icon" }, "▶"),
              element("span", {}, "PLAY NOW")
            ),
            versionSelect
          ),

          element("div", { class: "ds-hero-meta" },
            element("span", {}, "● Client ready"),
            element("span", {}, enabledCount + " mods enabled"),
            element("span", {}, "Profile: " + profile().name)
          )
        ),

        element("div", {
          class: "ds-hero-art",
          "aria-hidden": "true"
        },
          element("div", { class: "ds-art-orbit ds-orbit-one" }),
          element("div", { class: "ds-art-orbit ds-orbit-two" }),
          element("div", { class: "ds-cube" },
            element("span", { class: "cube-top" }),
            element("span", { class: "cube-left" }),
            element("span", { class: "cube-right" })
          ),
          element("span", { class: "ds-art-caption" }, "BUILD · EXPLORE · PLAY")
        )
      ),

      element("div", { class: "ds-quick-grid" },
        quickCard("⌘", "Mod Library", "Manage your client setup", "mods"),
        quickCard("◎", "Servers", "Manage your server list", "servers"),
        quickCard("◇", "Wardrobe", "Customize your player", "wardrobe")
      ),

      element("div", { class: "ds-home-lower" },
        card("Your instance", "Your game files are hosted with this website.",
          element("div", { class: "ds-instance-row" },
            element("div", {},
              element("strong", {}, S.inst || "My instance 1"),
              element("small", {}, "Minecraft " + S.version)
            ),
            element("span", { class: "ds-status-tag" }, "READY")
          )
        ),

        card("Quick settings", "Your current client configuration.",
          element("div", { class: "ds-stat-list" },
            stat("Performance mode", S.perfMode ? "On" : "Off"),
            stat("Enabled mods", String(enabledCount)),
            stat("Active profile", profile().name)
          )
        )
      )
    );
  }

  function quickCard(symbol, title, description, destination) {
    return element("button", {
      class: "ds-quick-card",
      type: "button",
      onclick: function () { go(destination); }
    },
      element("span", { class: "ds-quick-icon" }, symbol),
      element("strong", {}, title),
      element("small", {}, description),
      element("b", {}, "OPEN →")
    );
  }

  function stat(label, value) {
    return element("div", {},
      element("span", {}, label),
      element("strong", {}, value)
    );
  }

  function modsPage() {
    var categories = ["All", "Performance", "Visuals", "Utility", "PvP", "HUD"];
    var wrap = element("div", { class: "ds-page" });

    wrap.appendChild(heading(
      "Mod library",
      "Choose the features you want in your client.",
      element("span", { class: "ds-count-tag" }, DEFAULT_MODS.length + " available")
    ));

    var search = element("input", {
      class: "ds-search-input",
      type: "search",
      placeholder: "Search mods...",
      value: S.search || "",
      oninput: function (event) {
        S.search = event.target.value;
        renderModsList(list);
      }
    });

    var filters = element("div", { class: "ds-filter-row" });

    categories.forEach(function (category) {
      filters.appendChild(element("button", {
        class: "chip-btn" + (S.filter === category ? " active" : ""),
        type: "button",
        onclick: function () {
          S.filter = category;
          render();
        }
      }, category));
    });

    wrap.appendChild(element("div", { class: "ds-toolbar" }, search, filters));

    var list = element("div", { class: "ds-mod-grid" });
    wrap.appendChild(list);
    renderModsList(list);

    return wrap;
  }

  function renderModsList(target) {
    if (!target) return;
    target.textContent = "";

    var query = String(S.search || "").toLowerCase();

    var filtered = DEFAULT_MODS.filter(function (mod) {
      var categoryMatch = S.filter === "All" || mod.category === S.filter;
      var searchMatch = !query ||
        mod.name.toLowerCase().indexOf(query) !== -1 ||
        String(mod.desc || "").toLowerCase().indexOf(query) !== -1;

      return categoryMatch && searchMatch;
    });

    if (!filtered.length) {
      target.appendChild(element("div", {
        class: "card ds-empty-state"
      }, "No mods match that search."));
      return;
    }

    filtered.forEach(function (mod) {
      var enabled = !!S.mods[mod.id];

      target.appendChild(element("article", {
        class: "ds-mod-card"
      },
        element("div", { class: "ds-mod-card-top" },
          element("span", { class: "ds-mod-icon" },
            mod.code || mod.name.slice(0, 2).toUpperCase()
          ),
          element("span", { class: "ds-category-tag" }, mod.category)
        ),

        element("h3", {}, mod.name),
        element("p", { class: "ds-muted" }, mod.desc || "Client modification."),

        element("div", { class: "ds-mod-card-bottom" },
          element("span", {
            class: enabled ? "ds-enabled-label" : "ds-disabled-label"
          }, enabled ? "● Enabled" : "○ Disabled"),

          element("button", {
            class: "btn" + (enabled ? " added" : " primary"),
            type: "button",
            onclick: function () {
              S.mods[mod.id] = !enabled;
              save();
              toast(mod.name + (S.mods[mod.id] ? " enabled" : " disabled"));
              render();
            }
          }, enabled ? "Disable" : "Enable")
        )
      ));
    });
  }

  function wardrobePage() {
    var p = profile();
    var preview = element("div", { class: "ds-skin-preview" });

    if (p.skin) {
      preview.appendChild(element("img", {
        src: p.skin,
        alt: "Current Minecraft skin preview"
      }));
    } else {
      preview.appendChild(element("div", {
        class: "ds-skin-placeholder"
      },
        element("span", {}, "▧"),
        element("small", {}, "NO CUSTOM SKIN")
      ));
    }

    var fileInput = element("input", {
      type: "file",
      accept: "image/png",
      class: "ds-file-input",
      onchange: function (event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
          toast("Please choose a skin PNG under 2 MB.");
          return;
        }

        var reader = new FileReader();

        reader.onload = function () {
          var image = new Image();

          image.onload = function () {
            if (image.width !== 64 || image.height !== 64) {
              toast("Minecraft skins must be 64 × 64 PNG files.");
              return;
            }

            p.skin = reader.result;
            save();
            toast("Skin saved to this profile.");
            render();
          };

          image.onerror = function () {
            toast("That image could not be opened.");
          };

          image.src = reader.result;
        };

        reader.readAsDataURL(file);
      }
    });

    return element("div", { class: "ds-page" },
      heading("Wardrobe", "Customize the appearance saved to your profile."),

      element("div", { class: "ds-wardrobe-layout" },
        element("section", { class: "ds-wardrobe-stage" },
          preview,
          element("span", { class: "ds-muted" }, "Skin preview")
        ),

        element("section", { class: "card ds-wardrobe-controls" },
          element("p", { class: "ds-eyebrow" }, "PLAYER PROFILE"),
          element("h2", {}, p.name),
          element("p", { class: "ds-muted" },
            "Upload a standard 64 × 64 Minecraft skin PNG."
          ),
          fileInput,

          element("button", {
            class: "btn primary",
            type: "button",
            onclick: function () { fileInput.click(); }
          }, "Upload skin"),

          p.skin ? element("button", {
            class: "btn",
            type: "button",
            onclick: function () {
              p.skin = "";
              save();
              render();
              toast("Skin reset.");
            }
          }, "Remove custom skin") : null
        )
      )
    );
  }

  function settingsPage() {
    var p = profile();

    var accentButtons = Object.keys(ACCENTS).map(function (key) {
      return element("button", {
        class: "ds-accent-swatch" + (S.accent === key ? " selected" : ""),
        type: "button",
        title: key,
        "aria-label": key + " accent",
        style: { background: ACCENTS[key] },
        onclick: function () {
          S.accent = key;
          save();
          render();
        }
      });
    });

    return element("div", { class: "ds-page" },
      heading("Settings", "Manage your Deepslate profile and preferences."),

      element("div", { class: "ds-settings-grid" },

        card("Player profile", "Your local in-client identity.",
          element("div", { class: "ds-setting-row" },
            element("div", {},
              element("strong", {}, p.name),
              element("small", {}, "Username")
            ),

            element("button", {
              class: "btn",
              type: "button",
              onclick: function () {
                ask("Change username", p.name, "Enter a username", function (value) {
                  value = value.trim().slice(0, 16);
                  if (!value) return toast("Username cannot be empty.");
                  p.name = value;
                  save();
                  render();
                });
              }
            }, "Edit")
          )
        ),

        card("Client preferences", "Stored in this browser.",
          element("div", { class: "ds-setting-row" },
            element("div", {},
              element("strong", {}, "Performance mode"),
              element("small", {}, "Use the lightweight client layout")
            ),

            element("button", {
              class: "btn" + (S.perfMode ? " primary" : ""),
              type: "button",
              onclick: function () {
                S.perfMode = !S.perfMode;
                save();
                render();
              }
            }, S.perfMode ? "Enabled" : "Disabled")
          ),

          element("div", { class: "ds-setting-row" },
            element("div", {},
              element("strong", {}, "Accent color"),
              element("small", {}, "Choose your interface highlight")
            ),
            element("div", { class: "ds-accent-list" }, accentButtons)
          )
        ),

        card("Game session", "The game stays loaded while you use the launcher.",
          element("div", { class: "ds-setting-row" },
            element("div", {},
              element("strong", {}, "Game status"),
              element("small", {}, gameStarted ? "Game loaded this session" : "Not started yet")
            ),

            element("button", {
              class: "btn primary",
              type: "button",
              onclick: function () {
                if (gameStarted) go("game");
                else launch();
              }
            }, gameStarted ? "Return to game" : "Start game")
          )
        )
      )
    );
  }

  function serversPage() {
    var list = element("div", { class: "ds-server-list" });

    S.servers.forEach(function (server, index) {
      list.appendChild(element("article", {
        class: "ds-server-card"
      },
        element("div", { class: "ds-server-symbol" }, "◎"),

        element("div", { class: "ds-server-info" },
          element("strong", {}, server.name),
          element("small", {}, server.ip)
        ),

        element("button", {
          class: "btn primary",
          type: "button",
          onclick: function () { launch(server.ip); }
        }, "Join"),

        element("button", {
          class: "btn danger",
          type: "button",
          onclick: function () {
            S.servers.splice(index, 1);
            save();
            render();
          }
        }, "Remove")
      ));
    });

    if (!S.servers.length) {
      list.appendChild(element("div", {
        class: "card ds-empty-state"
      }, "No saved servers yet. Add one to get started."));
    }

    return element("div", { class: "ds-page" },
      heading(
        "Servers",
        "Save your favorite multiplayer destinations.",

        element("button", {
          class: "btn primary",
          type: "button",
          onclick: function () {
            ask("Add a server", "", "Server address (wss://...)", function (address) {
              address = address.trim();
              if (!address) return;

              var name = address.replace(/^wss?:\/\//, "").split("/")[0];
              S.servers.push({ name: name, ip: address });
              save();
              render();
            });
          }
        }, "+ Add server")
      ),
      list
    );
  }

  var pages = {
    home: homePage,
    mods: modsPage,
    wardrobe: wardrobePage,
    settings: settingsPage,
    servers: serversPage
  };

  function render() {
    if (route === "game") return;

    var view = document.getElementById("view");
    if (!view) return;

    view.textContent = "";
    view.appendChild((pages[route] || pages.home)());

    document.documentElement.style.setProperty(
      "--accent",
      ACCENTS[S.accent] || ACCENTS.periwinkle
    );

    document.body.classList.toggle("extra-dark", !!S.extraDark);
    updateNavigation();
  }

  function ensureGameNav() {
    var nav = document.getElementById("topnav");
    if (!nav || nav.querySelector('[data-route="game"]')) return;

    nav.appendChild(element("button", {
      type: "button",
      "data-route": "game"
    }, "Game"));
  }

  function openSearch() {
    ask("Search Deepslate", "", "Search mods, servers, settings...", function (query) {
      query = query.trim().toLowerCase();
      if (!query) return;

      if (query.indexOf("server") !== -1) go("servers");
      else if (query.indexOf("skin") !== -1 || query.indexOf("wardrobe") !== -1) go("wardrobe");
      else if (query.indexOf("setting") !== -1) go("settings");
      else if (query.indexOf("game") !== -1 || query.indexOf("play") !== -1) {
        if (gameStarted) go("game");
        else launch();
      } else {
        S.search = query;
        S.filter = "All";
        go("mods");
      }
    });
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest("[data-route]");
    if (!target) return;

    event.preventDefault();
    go(target.getAttribute("data-route"));
  });

  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }

    if (event.key === "Escape" && route === "game" && !document.fullscreenElement) {
      go("home");
    }
  });

  function init() {
    ensureGameNav();
    buildGameShell();
    render();

    var searchButton = document.getElementById("commandHint");
    if (searchButton) {
      searchButton.addEventListener("click", openSearch);
    }

    save();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
```
