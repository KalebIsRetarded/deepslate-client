/* Deepslate Client — Complete Chromium UI + Persistent Game Shell */
(function () {
  "use strict";

  var C = window.DEEPSLATE_CONFIG || {};
  var STORAGE_KEY = "deepslate.v27";
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
    { id: "fps-boost", name: "Sodium", category: "Performance", code: "SO", author: "Deepslate", desc: "Sodium-style video settings built for the browser." },
    { id: "iris", name: "Iris Shaders", category: "Visuals", code: "IR", author: "IrisShaders", desc: "Load shader packs like Complementary." },
    { id: "zoom", name: "ZoomX Smooth", category: "Utility", code: "ZM", author: "spunky", desc: "Smooth zoom. Press C or Z to zoom." },
    { id: "hitboxes", name: "Combat Hitboxes", category: "PvP", code: "HB", author: "sootysplash", desc: "Hitbox rendering for timing hits and reach." },
    { id: "armor-hud", name: "Uku's Armor HUD", category: "HUD", code: "AR", author: "uku", desc: "Shows your armor next to the hotbar, with durability." },
    { id: "fullbright", name: "Fullbright & Clear", category: "Visuals", code: "FB", author: "Deepslate", desc: "Fullbright, low fire and shield, and clear water." }
  ];

  var NEWS_ITEMS = [
    {
      date: "Nov 08",
      title: "New Chromium launcher",
      body: "A brand new launcher design with quick search (Ctrl+K), instance selector, mod browser, and wardrobe.",
      author: "cruxisdumb"
    },
    {
      date: "Nov 05",
      title: "Web Engine 1.21.11",
      body: "Play the latest version or switch to 1.8.8 PvP (WASM) right from the version dropdown next to Play.",
      author: "cruxisdumb"
    },
    {
      date: "Nov 01",
      title: "One-click mods",
      body: "Enable Sodium, Iris Shaders, ZoomX Smooth, and Combat Hitboxes before launching your session.",
      author: "cruxisdumb"
    }
  ];

  function el(tag, attrs) {
    var node = document.createElement(tag);
    var children = Array.prototype.slice.call(arguments, 2);

    Object.keys(attrs || {}).forEach(function (key) {
      var val = attrs[key];
      if (key === "class") node.className = val;
      else if (key === "style" && typeof val === "object") {
        Object.keys(val).forEach(function (sk) { node.style[sk] = val[sk]; });
      } else if (key.slice(0, 2) === "on" && typeof val === "function") {
        node.addEventListener(key.slice(2), val);
      } else if (val !== null && val !== undefined && val !== false) {
        node.setAttribute(key, String(val));
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
      model: "Classic",
      friends: [{ name: "CruxIsDumb", note: "Client Owner" }]
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
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
    inst: "MY INSTANCE 1",
    mods: { "fps-boost": true, zoom: true },
    filter: "All",
    search: "",
    servers: Array.isArray(C.FEATURED_SERVERS)
      ? C.FEATURED_SERVERS.map(function (srv) {
          return { name: srv.name, ip: srv.ip, version: srv.version || "1.8 - 1.21" };
        })
      : [],
    pose: "Idle",
    stTab: "My account"
  };

  if (!Array.isArray(S.profiles) || !S.profiles.length) {
    S.profiles = [firstProfile];
    S.activeId = firstProfile.id;
  }
  if (!S.mods || typeof S.mods !== "object") S.mods = {};
  if (!Array.isArray(S.servers)) S.servers = [];

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
    } catch (e) {}
  }

  function applyTheme() {
    var color = ACCENTS[S.accent] || ACCENTS.periwinkle;
    document.documentElement.style.setProperty("--accent", color);
    document.body.classList.toggle("extra-dark", !!S.extraDark);

    var p = profile();
    var navUser = document.getElementById("navUsername");
    var navAv = document.getElementById("navAvatar");
    if (navUser) navUser.textContent = p.name;
    if (navAv) navAv.textContent = (p.name || "P").charAt(0).toUpperCase();
  }

  function toast(msg) {
    var host = document.getElementById("toasts");
    if (!host) return;
    var item = el("div", { class: "toast", role: "status" }, msg);
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
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }
    backdrop = el("div", {
      class: "ds-modal-backdrop",
      onclick: function (e) { if (e.target === backdrop) close(); }
    },
      el("section", { class: "ds-modal", role: "dialog" },
        el("h2", {}, title),
        content,
        el("div", { class: "ds-modal-actions" }, buttons(close))
      )
    );
    overlay.appendChild(backdrop);
  }

  function ask(title, current, placeholder, cb) {
    var input = el("input", {
      class: "ds-modal-input",
      type: "text",
      value: current || "",
      placeholder: placeholder || ""
    });
    modal(title, input, function (close) {
      return [
        el("button", { class: "btn", type: "button", onclick: close }, "Cancel"),
        el("button", {
          class: "btn primary",
          type: "button",
          onclick: function () { cb(input.value); close(); }
        }, "Save")
      ];
    });
    window.setTimeout(function () { input.focus(); input.select(); }, 30);
  }

  function enabledModCount() {
    return Object.keys(S.mods).filter(function (k) { return !!S.mods[k]; }).length;
  }

  function getGameUrl(serverIp) {
    var base = String(C.GAME_URL || "/game/index.html").trim();
    var params = new URLSearchParams();
    params.set("deepslateVersion", S.version);
    params.set("username", profile().name);
    params.set("deepslateMods", Object.keys(S.mods).filter(function (id) { return !!S.mods[id]; }).join(","));
    if (serverIp) params.set("server", serverIp);
    return base + (base.indexOf("?") === -1 ? "?" : "&") + params.toString();
  }

  function buildGameShell() {
    if (gameHost) return;
    gameHost = el("section", { id: "deepslateGameHost", class: "ds-game-host is-hidden" });

    var gameBar = el("div", { class: "ds-game-bar" },
      el("div", { class: "ds-game-title" },
        el("span", { class: "ds-live-dot" }),
        el("strong", {}, "Deepslate Game"),
        el("small", { id: "dsGameVersion", style: { color: "var(--muted)" } }, S.version)
      ),
      el("div", { class: "ds-game-actions" },
        el("button", { class: "btn", type: "button", onclick: function () { go("home"); } }, "Back to launcher"),
        el("button", {
          class: "btn",
          type: "button",
          onclick: function () {
            if (gameFrame && gameFrame.contentWindow) gameFrame.contentWindow.location.reload();
          }
        }, "Reload game"),
        el("button", {
          class: "btn primary",
          type: "button",
          onclick: function () {
            if (gameFrame && gameFrame.requestFullscreen) {
              gameFrame.requestFullscreen().catch(function () { toast("Fullscreen is unavailable."); });
            }
          }
        }, "Fullscreen")
      )
    );

    gameFrame = el("iframe", {
      id: "deepslateGameFrame",
      title: "Deepslate Minecraft game",
      allow: "fullscreen; autoplay; gamepad; pointer-lock",
      allowfullscreen: "true"
    });

    gameHost.appendChild(gameBar);
    gameHost.appendChild(gameFrame);
    document.body.appendChild(gameHost);
  }

  function launchGame(serverIp) {
    buildGameShell();
    var verLabel = document.getElementById("dsGameVersion");
    if (verLabel) verLabel.textContent = S.version;
    gameFrame.src = getGameUrl(serverIp);
    gameStarted = true;
    gameHost.classList.remove("is-hidden");
    toast("Launching Deepslate " + S.version + (serverIp ? " (" + serverIp + ")" : "") + "...");
  }

  function openVersionPicker() {
    var versions = Array.isArray(C.VERSIONS) && C.VERSIONS.length ? C.VERSIONS : [
      { id: "1.21.11", label: "1.21.11 (Latest)" },
      { id: "1.8.8", label: "1.8.8 PvP (WASM)" }
    ];

    var list = el("div", { style: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" } },
      versions.map(function (v) {
        var active = S.version === v.id;
        return el("button", {
          class: active ? "btn primary" : "btn",
          type: "button",
          style: { justifyContent: "space-between", width: "100%" },
          onclick: function () {
            S.version = v.id;
            save();
            render();
            var ov = document.getElementById("overlay");
            if (ov) ov.innerHTML = "";
            toast("Switched to " + v.label);
          }
        },
          el("span", {}, v.label),
          el("span", {}, active ? "Selected" : "")
Use code with caution.
);
})
);
modal("Select Game Version", list, function (close) {
return [el("button", { class: "btn", type: "button", onclick: close }, "Close")];
});
}
/* ========================================================================
VIEWS
======================================================================== */
function renderHome() {
var firstServer = S.servers[0];
var modCount = enabledModCount();
var hero = el("section", { class: "cr-hero" },
el("div", { class: "cr-inst-label" }, S.inst),
el("div", { class: "play-split" },
el("button", {
class: "play-main",
type: "button",
onclick: function () { launchGame(); }
},
el("strong", {}, gameStarted ? "RESUME " + S.version : "PLAY " + S.version),
el("span", {}, (C.ENGINE && C.ENGINE.name ? C.ENGINE.name.toUpperCase() : "DEEPSLATE ENGINE") + " • READY")
),
el("button", {
class: "play-drop",
type: "button",
"aria-label": "Change version",
onclick: openVersionPicker
}, "▾")
),
el("div", { class: "hero-sublinks" },
el("button", {
class: "hero-link-btn",
type: "button",
onclick: function () { go("mods"); }
}, modCount + (modCount === 1 ? " mod on" : " mods on") + " · Manage mods"),
firstServer ? el("button", {
class: "hero-link-btn",
type: "button",
onclick: function () { launchGame(firstServer.ip); }
}, "Rejoin " + firstServer.ip) : null
),
el("div", { class: "hero-stats" },
el("span", {}, el("b", {}, "29"), " playing right now"),
el("span", {}, el("b", {}, "965"), " in the last 24 hours")
)
);
var topServers = el("section", { class: "top-servers-bar" },
el("div", { class: "top-servers-left" },
el("div", { class: "server-badge-icon" }, "⊞"),
el("div", {},
el("strong", {}, "Top servers"),
el("span", {}, "Featured partner servers ready for one-click join.")
)
),
el("button", {
class: "btn primary",
type: "button",
onclick: function () { go("servers"); }
}, "Browse servers")
);
var newsCol = el("div", {},
el("div", { class: "section-head" },
el("h2", {}, "Recent news"),
el("span", {}, "Updates, new features, events")
),
el("div", { class: "news-grid" },
NEWS_ITEMS.map(function (item) {
return el("article", { class: "news-card" },
el("div", {},
el("div", { class: "news-date" }, item.date),
el("h3", {}, item.title),
el("p", {}, item.body)
),
el("div", { class: "news-foot" },
el("span", {}, "Posted by " + item.author),
el("button", {
class: "btn pill",
type: "button",
onclick: function () {
modal(item.title, el("p", { style: { color: "var(--muted)", lineHeight: "1.6", marginBottom: "16px" } }, item.body), function (close) {
return [el("button", { class: "btn primary", type: "button", onclick: close }, "Done")];
});
}
}, "Read more")
)
);
})
)
);
var sparkSvg = document.createElementNS("w3.org", "svg");
sparkSvg.setAttribute("viewBox", "0 0 260 54");
sparkSvg.setAttribute("class", "sparkline-box");
var path = document.createElementNS("w3.org", "path");
path.setAttribute("d", "M0,38 Q25,22 50,35 T100,26 T150,34 T200,20 T260,12");
path.setAttribute("fill", "none");
path.setAttribute("stroke", "#3ddc97");
path.setAttribute("stroke-width", "2.5");
sparkSvg.appendChild(path);
var p = profile();
var sideCol = el("aside", { class: "home-sidebar" },
el("div", { class: "side-card" },
el("div", { class: "live-head" },
el("div", {},
el("strong", {}, "Live players"),
el("span", {}, "In Deepslate right now")
),
el("div", { class: "live-count" }, "29")
),
sparkSvg,
el("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--muted-2)" } },
el("span", {}, "24h ago"),
el("span", {}, "965 played"),
el("span", {}, "Now")
)
),
el("div", { class: "side-card" },
el("div", { class: "friends-head" },
el("span", {}, "Friends online"),
el("span", { style: { color: "var(--muted)" } }, String(p.friends.length))
),
el("div", { class: "friends-list" },
p.friends.map(function (f) {
return el("div", { class: "friend-row" },
el("strong", {}, f.name),
el("span", { style: { color: "var(--green)", fontSize: "11px" } }, f.note || "Online")
);
})
),
el("button", {
class: "btn",
type: "button",
style: { width: "100%" },
onclick: function () {
ask("Add friend", "", "Enter player username", function (name) {
if (!name.trim()) return;
p.friends.push({ name: name.trim(), note: "Added" });
save();
render();
toast("Added " + name.trim());
});
}
}, "Find friends")
)
);
var strip = el("section", {},
el("div", { class: "section-head" },
el("h2", {}, DEFAULT_MODS.length + " mods, one click each"),
el("span", {}, "PvP tweaks, HUDs, shaders, performance and more")
),
el("div", { class: "mods-strip" },
DEFAULT_MODS.map(function (m) {
return el("div", {
class: "strip-card",
onclick: function () { go("mods"); }
},
el("div", { class: "mod-icon-box" }, m.code || m.name.slice(0, 2).toUpperCase()),
el("strong", {}, m.name)
);
})
)
);
return [
hero,
topServers,
el("div", { class: "home-grid" }, newsCol, sideCol),
strip
];
}
function renderMods() {
var categories = ["All", "Performance", "Visuals", "HUD", "PvP", "Utility"];
var q = (S.search || "").toLowerCase();
var filtered = DEFAULT_MODS.filter(function (m) {
var matchCat = S.filter === "All" || m.category === S.filter;
var matchText = !q || m.name.toLowerCase().indexOf(q) !== -1 || m.desc.toLowerCase().indexOf(q) !== -1;
return matchCat && matchText;
});
var header = el("div", { class: "section-head" },
el("h2", {}, "Browse mods"),
el("span", {}, "Adding to " + S.inst)
);
var banner = el("div", { class: "featured-mod-banner" },
el("div", { class: "featured-mod-info" },
el("div", { class: "featured-mod-icon" }, "DS"),
el("div", {},
el("strong", { style: { fontSize: "16px" } }, "Deepslate Visuals", el("span", { class: "tag-badge" }, "Official")),
el("p", { style: { color: "var(--muted)", fontSize: "12.5px", marginTop: "4px" } }, "Official Deepslate Client visuals: custom skies, clear glass, smooth HUD, and motion blur.")
)
),
el("button", {
class: S.mods["fullbright"] ? "btn added" : "btn primary",
type: "button",
onclick: function () {
S.mods["fullbright"] = !S.mods["fullbright"];
save();
render();
toast(S.mods["fullbright"] ? "Added Deepslate Visuals" : "Removed Deepslate Visuals");
}
}, S.mods["fullbright"] ? "✓ Added" : "+ Add to Instance")
);
var searchBox = el("input", {
class: "search-input",
type: "search",
value: S.search,
placeholder: "Search " + DEFAULT_MODS.length + " mods...",
oninput: function (e) {
S.search = e.target.value;
render();
}
});
var toolbar = el("div", { class: "mods-toolbar" },
searchBox,
el("div", { class: "filter-pills" },
categories.map(function (cat) {
return el("button", {
class: "filter-pill" + (S.filter === cat ? " active" : ""),
type: "button",
onclick: function () {
S.filter = cat;
render();
}
}, cat);
})
)
);
var grid = el("div", { class: "mods-grid" },
filtered.map(function (m) {
var added = !!S.mods[m.id];
return el("article", { class: "mod-card" },
el("div", {},
el("div", { class: "mod-card-top" },
el("div", { class: "mod-card-title" },
el("div", { class: "mod-icon-box" }, m.code || m.name.slice(0, 2).toUpperCase()),
el("div", {},
el("strong", {}, m.name),
el("small", {}, "by " + (m.author || "Deepslate") + " · " + m.category)
)
),
el("button", {
class: added ? "btn added" : "btn primary",
type: "button",
onclick: function () {
S.mods[m.id] = !added;
save();
render();
toast((!added ? "Enabled " : "Disabled ") + m.name);
}
}, added ? "✓ Added" : "+ Add")
),
el("p", { style: { marginTop: "12px" } }, m.desc)
)
);
})
);
return [header, banner, toolbar, grid];
}
function renderServers() {
var top = el("div", { class: "section-head" },
el("h2", {}, "Multiplayer servers"),
el("button", {
class: "btn primary",
type: "button",
onclick: function () {
ask("Add server IP", "", "wss://example.com", function (ip) {
if (!ip.trim()) return;
S.servers.push({ name: ip.trim(), ip: ip.trim(), version: S.version });
save();
render();
toast("Server added");
});
}
}, "+ Add server")
);
var list = el("div", { class: "servers-grid" },
S.servers.map(function (srv, idx) {
return el("div", { class: "server-card" },
el("div", {},
el("strong", { style: { display: "block", fontSize: "14px" } }, srv.name),
el("span", { style: { color: "var(--muted)", fontSize: "12px", fontFamily: "var(--font-mono)" } }, srv.ip)
),
el("div", { style: { display: "flex", gap: "8px" } },
el("button", {
class: "btn primary",
type: "button",
onclick: function () { launchGame(srv.ip); }
}, "Join"),
idx > 1 ? el("button", {
class: "btn danger",
type: "button",
onclick: function () {
S.servers.splice(idx, 1);
save();
render();
}
}, "×") : null
)
);
})
);
return [top, list];
}
function renderWardrobe() {
var p = profile();
var poses = ["Idle", "Walk", "Run", "Wave", "Crouch", "Dance"];
var slim = p.model === "Slim";
var figure = el("div", { class: "skin-figure pose-" + S.pose },
el("div", { class: "mc-head" }),
el("div", { class: "mc-torso-row" },
el("div", { class: "mc-arm" + (slim ? " slim" : "") }),
el("div", { class: "mc-body" }),
el("div", { class: "mc-arm" + (slim ? " slim" : "") })
),
el("div", { class: "mc-legs" },
el("div", { class: "mc-leg" }),
el("div", { class: "mc-leg" })
)
);
var stage = el("div", { class: "wardrobe-stage" },
el("strong", { style: { fontSize: "14px" } }, p.name),
figure,
el("div", { class: "pose-bar" },
poses.map(function (pose) {
return el("button", {
class: S.pose === pose ? "active" : "",
type: "button",
onclick: function () {
S.pose = pose;
save();
render();
}
}, pose);
})
)
);
var panel = el("aside", { class: "wardrobe-panel" },
el("div", {},
el("strong", { style: { display: "block", marginBottom: "8px" } }, "Upload a skin"),
el("div", {
class: "upload-drop",
onclick: function () { toast("Select a 64x64 PNG skin file."); }
}, "Click to upload PNG skin (64x64)")
),
el("div", {},
el("strong", { style: { display: "block", marginBottom: "8px", fontSize: "11px", color: "var(--muted)", letterSpacing: ".08em" } }, "MODEL"),
el("div", { class: "model-toggle" },
["Classic", "Slim"].map(function (m) {
return el("button", {
class: p.model === m ? "active" : "",
type: "button",
onclick: function () {
p.model = m;
save();
render();
toast("Model set to " + m);
}
}, m + (m === "Classic" ? " (4px)" : " (3px)"));
})
)
),
el("div", { style: { marginTop: "auto", fontSize: "12px", color: "var(--green)" } },
"✓ Saved. Friends see it in game too."
)
);
return [
el("div", { class: "section-head" },
el("h2", {}, "Wardrobe"),
el("span", {}, "Customize your character model and pose")
),
el("div", { class: "wardrobe-layout" }, stage, panel)
];
}
function renderSettings() {
var p = profile();
var tabs = ["My account", "Appearance", "Game & sync", "Your data"];
var nav = el("aside", { class: "settings-nav" },
el("div", { class: "settings-user-card" },
el("div", { class: "avatar-head", style: { width: "34px", height: "34px", fontSize: "15px" } }, p.name.charAt(0).toUpperCase()),
el("div", {},
el("strong", { style: { display: "block", fontSize: "13.5px" } }, p.name),
el("span", { style: { fontSize: "11.5px", color: "var(--muted)" } }, "Deepslate account")
)
),
tabs.map(function (t) {
return el("button", {
class: S.stTab === t ? "active" : "",
type: "button",
onclick: function () {
S.stTab = t;
save();
render();
}
}, t);
})
);
var content = [];
if (S.stTab === "My account") {
content.push(
el("div", { class: "section-head" }, el("h2", {}, "My account"), el("span", {}, "Manage your profile")),
el("div", { class: "settings-card" },
el("div", { class: "settings-row" },
el("div", {},
el("strong", {}, "Username"),
el("p", {}, "Currently signed in as " + p.name)
),
el("button", {
class: "btn",
type: "button",
onclick: function () {
ask("Change username", p.name, "Username", function (val) {
if (!val.trim()) return;
p.name = val.trim();
save();
applyTheme();
render();
toast("Username updated");
});
}
}, "Edit")
)
)
);
} else if (S.stTab === "Appearance") {
content.push(
el("div", { class: "section-head" }, el("h2", {}, "Appearance"), el("span", {}, "Theme & accent colors")),
el("div", { class: "settings-card" },
el("h3", {}, "Accent color"),
el("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
Object.keys(ACCENTS).map(function (key) {
return el("button", {
class: S.accent === key ? "btn primary" : "btn",
type: "button",
onclick: function () {
S.accent = key;
save();
applyTheme();
render();
}
}, key.charAt(0).toUpperCase() + key.slice(1));
})
)
),
el("div", { class: "settings-card" },
el("div", { class: "settings-row" },
el("div", {},
el("strong", {}, "OLED Pure Black Mode"),
el("p", {}, "Use pure black backgrounds across the launcher.")
),
el("button", {
class: S.extraDark ? "btn primary" : "btn",
type: "button",
onclick: function () {
S.extraDark = !S.extraDark;
save();
applyTheme();
render();
}
}, S.extraDark ? "On" : "Off")
)
)
);
} else if (S.stTab === "Game & sync") {
content.push(
el("div", { class: "section-head" }, el("h2", {}, "Game & sync"), el("span", {}, "Instance and engine settings")),
el("div", { class: "settings-card" },
el("div", { class: "settings-row" },
el("div", {},
el("strong", {}, "Instance name"),
el("p", {}, S.inst)
),
el("button", {
class: "btn",
type: "button",
onclick: function () {
ask("Rename instance", S.inst, "MY INSTANCE 1", function (val) {
if (!val.trim()) return;
S.inst = val.trim().toUpperCase();
save();
render();
});
}
}, "Rename")
)
)
);
} else {
content.push(
el("div", { class: "section-head" }, el("h2", {}, "Your data"), el("span", {}, "Take a copy of your account, or reset it.")),
el("div", { class: "settings-card" },
el("h3", {}, "Download your data"),
el("div", { class: "settings-row" },
el("div", {},
el("strong", {}, "Account copy"),
el("p", {}, "Your profile, settings, friends, and enabled mods as one JSON file.")
),
el("button", {
class: "btn",
type: "button",
onclick: function () {
var blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
var url = URL.createObjectURL(blob);
var a = document.createElement("a");
a.href = url;
a.download = "deepslate-account-backup.json";
a.click();
URL.revokeObjectURL(url);
toast("Downloaded account backup");
}
}, "Download")
)
),
el("div", { class: "settings-card" },
el("h3", {}, "Reset launcher data"),
el("p", { style: { color: "var(--muted)", fontSize: "12.5px", marginBottom: "14px" } }, "Clears your local profile, saved servers, and mod selections in this browser."),
el("button", {
class: "btn danger",
type: "button",
onclick: function () {
localStorage.removeItem(STORAGE_KEY);
location.reload();
}
}, "Reset my data")
)
);
}
return [el("div", { class: "settings-layout" }, nav, el("div", {}, content))];
}
/* ========================================================================
NAVIGATION & RENDER LOOP
======================================================================== */
function go(nextRoute) {
route = nextRoute || "home";
if (gameHost) gameHost.classList.add("is-hidden");
var buttons = document.querySelectorAll("[data-route]");
for (var i = 0; i < buttons.length; i++) {
var btn = buttons[i];
if (btn.closest("#topnav")) {
btn.classList.toggle("active", btn.getAttribute("data-route") === route);
}
}
render();
}
function render() {
var view = document.getElementById("view");
if (!view) return;
view.innerHTML = "";
var nodes = [];
if (route === "mods") nodes = renderMods();
else if (route === "servers") nodes = renderServers();
else if (route === "wardrobe") nodes = renderWardrobe();
else if (route === "settings") nodes = renderSettings();
else nodes = renderHome();
nodes.forEach(function (n) {
if (n) view.appendChild(n);
});
}
function init() {
applyTheme();
document.addEventListener("click", function (e) {
var target = e.target.closest("[data-route]");
if (target) {
go(target.getAttribute("data-route"));
}
});
var searchBtn = document.getElementById("commandHint");
if (searchBtn) {
searchBtn.addEventListener("click", function () {
go("mods");
window.setTimeout(function () {
var input = document.querySelector(".search-input");
if (input) input.focus();
}, 40);
});
}
document.addEventListener("keydown", function (e) {
if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
e.preventDefault();
go("mods");
window.setTimeout(function () {
var input = document.querySelector(".search-input");
if (input) input.focus();
}, 40);
}
});
go("home");
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init);
} else {
init();
}
})();
