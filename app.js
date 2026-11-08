
(function () {
  "use strict";
  var C = window.DEEPSLATE_CONFIG || {};
  var KEY = "deepslate.v21";
  var OWNER_USER = "cruxisdumb";
  var ACCENTS = { periwinkle: "#a594f9", green: "#3ddc97", blue: "#4aa8ff", orange: "#ffa94d" };
  var route = "home";
  var skinViewer = null;

  var DEFAULT_MODS = [
    { id: "fps-boost", name: "Sodium", category: "Performance", code: "SO", desc: "Performance improvements." },
    { id: "iris", name: "Iris Shaders", category: "Visuals", code: "IR", desc: "Shader support." },
    { id: "zoom", name: "ZoomX Smooth", category: "Utility", code: "ZM", desc: "Smooth zoom with scroll adjustment." },
    { id: "hitboxes", name: "Combat Hitboxes", category: "PvP", code: "HB", desc: "Custom entity hitbox rendering." },
    { id: "armor-hud", name: "Uku's Armor HUD", category: "HUD", code: "AR", desc: "Shows armor durability." },
    { id: "fullbright", name: "Fullbright & Clear", category: "Visuals", code: "FB", desc: "Fullbright and visual improvements." }
  ];

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function isOwner(name) { return String(name || "").trim().toLowerCase() === OWNER_USER; }

  function h(t, p) {
    var e = document.createElement(t);
    var kids = Array.prototype.slice.call(arguments, 2);
    Object.keys(p || {}).forEach(function (k) {
      if (k === "class") e.className = p[k];
      else if (k.indexOf("on") === 0 && typeof p[k] === "function") e.addEventListener(k.slice(2), p[k]);
      else e.setAttribute(k, p[k]);
    });
    kids.forEach(function (c) {
      if (Array.isArray(c)) c.forEach(function (x) { if (x != null && x !== false) e.append(x.nodeType ? x : document.createTextNode(String(x))); });
      else if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return e;
  }

  function rankBadge(name) {
    if (!isOwner(name)) return null;
    return h("span", {
      style: "font-family:var(--font-mono);font-size:10px;font-weight:800;letter-spacing:0.06em;padding:2px 6px;border-radius:5px;background:rgba(244,63,94,0.18);color:#fb7185;border:1px solid rgba(244,63,94,0.4);margin-left:6px;vertical-align:middle;"
    }, "OWNER");
  }

  function toast(msg) {
    var box = document.getElementById("toasts");
    if (!box) return;
    var t = h("div", { class: "toast" }, msg);
    box.append(t);
    setTimeout(function () { t.remove(); }, 2800);
  }

  function showModal(title, body, btns) {
    var ov = document.getElementById("overlay");
    if (!ov) return;
    var bg;
    var close = function () { if (bg && bg.parentNode) bg.remove(); };
    bg = h("div", {
      style: "position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:2500;padding:20px;",
      onclick: function (e) { if (e.target === bg) close(); }
    }, h("div", { style: "background:var(--panel);border:1px solid var(--border-hi);border-radius:14px;padding:22px;max-width:400px;width:100%;" },
      h("h3", { style: "font-size:16px;margin-bottom:10px;" }, title), body,
      h("div", { style: "display:flex;justify-content:flex-end;gap:8px;margin-top:16px;" }, btns(close))
    ));
    ov.append(bg);
  }

  function editField(title, val, ph, onSave) {
    var inp = h("input", { type: "text", value: val || "", placeholder: ph || "", style: "width:100%;" });
    showModal(title, inp, function (close) {
      return [
        h("button", { class: "btn", onclick: close }, "Cancel"),
        h("button", { class: "btn primary", onclick: function () { onSave(inp.value); close(); } }, "Save")
      ];
    });
    setTimeout(function () { inp.focus(); inp.select(); }, 20);
  }

  function makeProfile(name) {
    return {
      id: uid(),
      name: name || "Player",
      email: "",
      status: "",
      bio: "",
      banner: isOwner(name) ? "#f43f5e" : "#a594f9",
      model: "Classic",
      skin: "",
      friends: [{ name: "CruxIsDumb", note: "Client Owner" }]
    };
  }

  var defProf = makeProfile("Player");
  var S = JSON.parse(localStorage.getItem(KEY) || "null") || {
    profiles: [defProf],
    activeProfileId: defProf.id,
    accent: "periwinkle", styleMode: "Minimal", extraDark: false,
    version: C.DEFAULT_VERSION || "1.21.11", inst: "My instance 1",
    mods: { "fps-boost": true, "zoom": true }, filter: "All", search: "",
    servers: [{ name: "ArchMC", ip: "wss://mc.arch.lol" }, { name: "ZythMC", ip: "wss://play.zyth.me" }],
    pose: "Idle", stTab: "My account",
    prefs: { friendReq: true, whoAdd: "Everyone", whoMsg: "Friends", showOnline: true, showServer: true, dnd: false, popups: true, btnSound: true, perfMode: false }
  };
  if (!Array.isArray(S.profiles) || !S.profiles.length) {
    var fallback = makeProfile("Player");
    S.profiles = [fallback];
    S.activeProfileId = fallback.id;
  }
  if (!S.prefs) S.prefs = {};
  if (!S.mods) S.mods = {};
  if (!S.servers) S.servers = [];

  function prof() {
    var match = S.profiles.filter(function (p) { return p.id === S.activeProfileId; });
    return match.length ? match.slice(0, 1).pop() : S.profiles.slice(0, 1).pop();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function go(r) { route = r; render(); }

  function toggle(k) {
    return h("button", { class: "st-toggle" + (S.prefs[k] ? " on" : ""), onclick: function () { S.prefs[k] = !S.prefs[k]; save(); render(); } });
  }
  function seg(k, opts) {
    return h("div", { class: "st-seg" }, opts.map(function (o) {
      return h("button", { class: S.prefs[k] === o ? "active" : "", onclick: function () { S.prefs[k] = o; save(); render(); } }, o);
    }));
  }
  function row(t, sub, ctrl) {
    return h("div", { class: "setting-row" }, h("div", null, h("b", { style: "font-size:13.5px;display:block;" }, t), sub ? h("small", { style: "color:var(--muted);font-size:12px;" }, sub) : null), ctrl);
  }

  function launch(ip) {
    var url = (C.GAME_URL || "").trim();
    if (!url) {
      showModal("Engine Ready", h("p", { style: "color:var(--muted);font-size:13px;" }, "Deepslate " + S.version + " (" + prof().name + ")" + (ip ? " -> " + ip : "") + " is ready. Set GAME_URL in config.js to '/game/index.html' to play."),
        function (close) { return [h("button", { class: "btn primary", onclick: close }, "Got it")]; });
      return;
    }
    var g = h("div", { class: "game" },
      h("div", { class: "bar" }, h("button", { class: "btn", onclick: function () { g.remove(); } }, "Exit"), h("b", null, "Deepslate " + S.version + " · " + prof().name)),
      h("iframe", { src: url, allow: "fullscreen; autoplay; gamepad; pointer-lock", allowfullscreen: "true" })
    );
    document.getElementById("overlay").append(g);
  }

  function modIconNode(m) {
    var code = m.code || m.name.slice(0, 2).toUpperCase();
    var box = h("div", { class: "mod-icon", style: "font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--accent);overflow:hidden;" }, code);
    if (m.image) {
      var img = h("img", {
        src: m.image,
        alt: m.name,
        style: "width:100%;height:100%;object-fit:cover;image-rendering:pixelated;",
        onerror: function () { box.innerHTML = ""; box.textContent = code; }
      });
      box.innerHTML = "";
      box.append(img);
    }
    return box;
  }

  var pages = {
    home: function () {
      var count = Object.keys(S.mods).filter(function (k) { return S.mods[k]; }).length;
      return h("div", null,
        h("section", { class: "cr-hero" },
          h("div", { class: "cr-inst-label" }, (S.inst || "MY INSTANCE 1").toUpperCase()),
          h("div", { class: "play-split" },
            h("button", { class: "play-main", onclick: function () { launch(); } }, h("strong", null, "PLAY " + S.version), h("span", null, (S.prefs.perfMode ? "PERFORMANCE" : "STANDARD") + " ENGINE · READY")),
            h("button", { class: "play-drop", onclick: function () { S.version = S.version === "1.21.11" ? "1.8.8" : "1.21.11"; save(); toast("Version: " + S.version); render(); } }, "⌄")
          ),
          h("div", { class: "hero-sub" }, count + " mods on · ", h("a", { href: "#", onclick: function (e) { e.preventDefault(); go("mods"); } }, "Manage mods"), " · ", h("a", { href: "#", onclick: function (e) { e.preventDefault(); go("servers"); } }, "Servers")),
          h("div", { class: "hero-stats" }, h("span", null, h("b", null, "27"), " playing right now"), h("span", null, h("b", null, "1,000"), " in the last 24 hours"))
        ),
        h("div", { class: "partner-bar" },
          h("div", null, h("b", null, "Top servers"), h("small", { style: "display:block;color:var(--muted);" }, "Featured community servers ready for one-click join.")),
          h("button", { class: "btn", onclick: function () { go("servers"); } }, "Browse servers")
        )
      );
    },
    mods: function () {
      var all = (Array.isArray(C.MODS) && C.MODS.length) ? C.MODS : DEFAULT_MODS;
      var cats = ["All", "Performance", "Visuals", "HUD", "PvP", "Utility", "Libraries"];
      var list = all.filter(function (m) {
        return (S.filter === "All" || m.category === S.filter) && (!S.search || m.name.toLowerCase().indexOf(S.search.toLowerCase()) !== -1);
      });
      var srch = h("input", { value: S.search || "", placeholder: "Search " + all.length + " mods", oninput: function () { S.search = srch.value; render(); } });
      return h("div", null,
        h("div", { class: "mods-header" }, h("h2", { style: "font-size:18px;" }, "Browse mods")),
        h("div", { class: "filter-row" }, srch, cats.map(function (c) {
          return h("button", { class: "chip-btn" + (S.filter === c ? " active" : ""), onclick: function () { S.filter = c; render(); } }, c);
        })),
        h("div", { class: "mods-grid" }, list.map(function (m) {
          var on = !!S.mods[m.id];
          return h("div", { class: "mod-card" },
            h("div", { class: "mod-top" },
Use code with caution.
h("div", { style: "display:flex;gap:10px;align-items:center;" },
modIconNode(m),
h("div", null, h("b", null, m.name), h("small", { style: "display:block;color:var(--muted);" }, m.category))
),
h("button", { class: "btn " + (on ? "added" : ""), onclick: function () { S.mods[m.id] = !on; save(); toast((!on ? "Added " : "Removed ") + m.name); render(); } }, on ? "Added" : "+ Add")
),
h("p", { style: "font-size:12.5px;color:var(--muted);margin-top:8px;" }, m.desc)
);
}))
);
},
wardrobe: function () {
var pCur = prof();
if (skinViewer && typeof skinViewer.dispose === "function") { try { skinViewer.dispose(); } catch (e) {} skinViewer = null; }
var canvas = h("canvas", { width: "280", height: "360", style: "cursor:grab;" });
if (window.skinview3d) {
skinViewer = new window.skinview3d.SkinViewer({ canvas: canvas, width: 280, height: 360 });
if (pCur.skin) skinViewer.loadSkin(pCur.skin);
skinViewer.controls.enableRotate = true; skinViewer.controls.enableZoom = true;
skinViewer.playerObject.skin.modelType = pCur.model === "Slim" ? "slim" : "default";
skinViewer.animation = new window.skinview3d.IdleAnimation();
}
var fileIn = h("input", { type: "file", accept: "image/png", style: "display:none;", onchange: function (e) {
var f = e.target.files.item(0); if (!f) return;
var r = new FileReader(); r.onload = function () { pCur.skin = r.result; save(); toast("Skin updated"); render(); }; r.readAsDataURL(f);
}});
return h("div", { class: "wardrobe-layout" },
h("div", { class: "wardrobe-stage" },
h("div", null, h("b", null, pCur.name), rankBadge(pCur.name)),
canvas,
h("div", { class: "pose-bar" }, ["Idle", "Walk", "Run", "Wave", "Crouch"].map(function (p) {
return h("button", { class: "pose-btn" + (S.pose === p ? " active" : ""), onclick: function () { S.pose = p; render(); } }, p);
}))
),
h("div", { class: "card", style: "display:flex;flex-direction:column;gap:14px;" },
h("b", null, "Skin"), fileIn,
h("button", { class: "btn", onclick: function () { fileIn.click(); } }, "Upload 64x64 PNG"),
h("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px;" }, ["Classic", "Slim"].map(function (m) {
return h("button", { class: "btn" + (pCur.model === m ? " primary" : ""), onclick: function () { pCur.model = m; save(); render(); } }, m);
}))
)
);
},
servers: function () {
return h("div", null, S.servers.map(function (s) {
return h("div", { class: "card", style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;" },
h("div", null, h("b", null, s.name), h("small", { style: "display:block;color:var(--muted);" }, s.ip)),
h("button", { class: "btn primary", onclick: function () { launch(s.ip); } }, "Join")
);
}));
},
settings: function () {
var pCur = prof();
if (!Array.isArray(pCur.friends)) pCur.friends = [];
var tabs = ["My account", "Profiles", "Friends", "Devices", "Privacy & safety", "Notifications", "Sound", "Appearance", "Game & sync", "Your data"];
var bioIn = h("textarea", { rows: "3", placeholder: "Write a short bio...", style: "width:100%;background:var(--bg);border:1px solid var(--border-hi);color:#fff;padding:10px;border-radius:8px;font-family:inherit;font-size:13px;" }, pCur.bio || "");
var banners = ["#a594f9", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6"];
var body = null;
if (S.stTab === "My account") {
body = h("div", null,
h("div", { class: "st-section", style: "border-top:4px solid " + pCur.banner + ";display:flex;justify-content:space-between;align-items:center;" },
h("div", { style: "display:flex;gap:12px;align-items:center;" },
h("img", { src: "favicon.svg", style: "width:42px;height:42px;" }),
h("div", null,
h("div", null, h("b", { style: "font-size:16px;" }, pCur.name), rankBadge(pCur.name)),
h("small", { style: "display:block;color:var(--muted);" }, isOwner(pCur.name) ? "Verified Client Owner" : "Deepslate profile")
)
),
h("button", { class: "btn", onclick: function () { go("wardrobe"); } }, "Wardrobe")
),
h("div", { class: "st-section" },
row("Username", pCur.name, h("button", { class: "btn", onclick: function () {
editField("Change username", pCur.name, "Enter your username", function (v) {
if (v.trim()) {
pCur.name = v.trim();
if (isOwner(pCur.name)) pCur.banner = "#f43f5e";
save(); toast("Username saved"); render();
}
});
} }, "Change")),
row("Email", pCur.email || "Not added", h("button", { class: "btn", onclick: function () { editField("Email", pCur.email, "you@example.com", function (v) { pCur.email = v.trim(); save(); toast("Email saved"); render(); }); } }, pCur.email ? "Edit" : "Add")),
row("Status", pCur.status || "No status set", h("button", { class: "btn", onclick: function () { editField("Status", pCur.status, "What are you playing?", function (v) { pCur.status = v.trim(); save(); toast("Status saved"); render(); }); } }, "Set status")),
h("div", { style: "padding:12px 0;" }, h("b", { style: "font-size:13.5px;display:block;margin-bottom:6px;" }, "Bio"), bioIn,
h("div", { style: "text-align:right;margin-top:8px;" }, h("button", { class: "btn", onclick: function () { pCur.bio = bioIn.value; save(); toast("Bio saved"); } }, "Save bio"))),
h("div", { class: "banner-swatches" }, banners.map(function (c) {
return h("button", { class: "swatch" + (pCur.banner === c ? " active" : ""), style: "background:" + c + ";", onclick: function () { pCur.banner = c; save(); render(); } });
}))
)
);
} else if (S.stTab === "Profiles") {
body = h("div", null,
h("div", { class: "st-section", style: "display:flex;justify-content:space-between;align-items:center;" },
h("div", null, h("b", null, "Create a new profile"), h("small", { style: "display:block;color:var(--muted);" }, "Switch accounts anytime with separate skins and friends.")),
h("button", { class: "btn primary", onclick: function () {
editField("Create new profile", "", "Profile username", function (v) {
if (!v.trim()) return;
var np = makeProfile(v.trim());
S.profiles.push(np);
S.activeProfileId = np.id;
save(); toast("Created profile: " + np.name); render();
});
} }, "+ New Profile")
),
h("div", { class: "st-section" },
S.profiles.map(function (item) {
var active = item.id === pCur.id;
return row(
h("span", null, item.name, rankBadge(item.name)),
active ? "Currently active profile" : "Saved local profile",
h("div", { style: "display:flex;gap:8px;" },
!active ? h("button", { class: "btn primary", onclick: function () { S.activeProfileId = item.id; save(); toast("Switched to " + item.name); render(); } }, "Switch") : h("span", { style: "font-size:12px;color:var(--green);font-weight:700;padding:6px 8px;" }, "Active"),
S.profiles.length > 1 ? h("button", { class: "btn danger", onclick: function () {
S.profiles = S.profiles.filter(function (x) { return x.id !== item.id; });
if (S.activeProfileId === item.id) S.activeProfileId = S.profiles.slice(0, 1).pop().id;
save(); toast("Removed profile"); render();
} }, "Remove") : null
)
);
})
)
);
} else if (S.stTab === "Friends") {
var addIn = h("input", { type: "text", placeholder: "Add player by username...", style: "flex:1;" });
body = h("div", null,
h("div", { class: "st-section", style: "display:flex;gap:8px;" },
addIn,
h("button", { class: "btn primary", onclick: function () {
var target = addIn.value.trim();
if (!target) return;
if (pCur.friends.some(function (f) { return f.name.toLowerCase() === target.toLowerCase(); })) {
toast("Already added");
return;
}
pCur.friends.push({ name: target, note: isOwner(target) ? "Client Owner" : "Friend" });
save(); toast("Added " + target); render();
} }, "+ Add Player")
),
h("div", { class: "st-section" },
pCur.friends.length ? pCur.friends.map(function (f) {
return row(
h("span", null, f.name, rankBadge(f.name)),
f.note || "Friend",
h("button", { class: "btn", onclick: function () {
pCur.friends = pCur.friends.filter(function (x) { return x.name !== f.name; });
save(); toast("Removed " + f.name); render();
} }, "Remove")
);
}) : h("small", { style: "color:var(--muted);" }, "No players added yet.")
)
);
} else if (S.stTab === "Devices") {
body = h("div", { class: "st-section" }, h("b", null, "Chrome on Chromebook · This device"));
} else if (S.stTab === "Privacy & safety") {
body = h("div", { class: "st-section" }, row("Friend requests", "Allow incoming requests", toggle("friendReq")), row("Who can add you", "", seg("whoAdd", ["Everyone", "Friends of friends"])), row("Show when online", "", toggle("showOnline")));
} else if (S.stTab === "Notifications") {
body = h("div", { class: "st-section" }, row("Do not disturb", "Mute pop-up alerts", toggle("dnd")), row("Pop-up notifications", "Show toast alerts", toggle("popups")));
} else if (S.stTab === "Sound") {
body = h("div", { class: "st-section" }, row("Button sounds", "UI click feedback", toggle("btnSound")));
} else if (S.stTab === "Appearance") {
body = h("div", { class: "st-section" },
h("div", { class: "style-cards", style: "margin-bottom:14px;" }, ["Minimal", "Glass", "Classic"].map(function (st) {
return h("button", { class: "style-card" + (S.styleMode === st ? " active" : ""), onclick: function () { S.styleMode = st; save(); render(); } }, h("b", null, st));
})),
row("Extra dark", "Pure black OLED background", h("button", { class: "st-toggle" + (S.extraDark ? " on" : ""), onclick: function () { S.extraDark = !S.extraDark; save(); render(); } })),
row("Accent color", "", h("div", { style: "display:flex;gap:6px;" }, Object.keys(ACCENTS).map(function (k) {
return h("button", { class: "btn" + (S.accent === k ? " primary" : ""), onclick: function () { S.accent = k; save(); render(); } }, k);
})))
);
} else if (S.stTab === "Game & sync") {
body = h("div", { class: "st-section" },
row("Performance mode", "Higher FPS on Chromebooks", toggle("perfMode")),
row("Offline client", "Download standalone HTML backup", h("button", { class: "btn", onclick: function () {
var a = h("a", { href: URL.createObjectURL(new Blob(["" + JSON.stringify(S, null, 2) + ""], { type: "text/html" })), download: "deepslate-offline.html" });
document.body.append(a); a.click(); a.remove(); toast("Downloaded offline HTML");
} }, "Download"))
);
} else {
body = h("div", { class: "st-section" },
row("Account JSON", "Download your settings and mods", h("button", { class: "btn", onclick: function () {
var a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: "application/json" })), download: "deepslate-data.json" });
document.body.append(a); a.click(); a.remove(); toast("Downloaded JSON");
} }, "Download")),
row("Reset data", "Clear all local profiles and settings", h("button", { class: "btn danger", onclick: function () {
showModal("Reset all data?", h("p", { style: "color:var(--muted);font-size:13px;" }, "This clears all profiles, skins, and mod preferences."), function (close) {
return [h("button", { class: "btn", onclick: close }, "Cancel"), h("button", { class: "btn danger", onclick: function () { localStorage.removeItem(KEY); location.reload(); } }, "Reset")];
});
} }, "Delete all data"))
);
}
return h("div", { class: "settings-layout" },
h("div", { class: "settings-nav" },
h("div", { class: "st-user-card" },
h("img", { src: "favicon.svg" }),
h("div", null,
h("div", null, h("b", { style: "font-size:13.5px;" }, pCur.name), rankBadge(pCur.name)),
h("small", { style: "color:var(--muted);font-size:11.5px;" }, "Deepslate account")
)
),
tabs.map(function (t) { return h("button", { class: S.stTab === t ? "active" : "", onclick: function () { S.stTab = t; render(); } }, t); })
),
h("div", null, h("h2", { style: "font-size:20px;margin-bottom:14px;" }, S.stTab), body)
);
}
};
function render() {
var pCur = prof();
document.documentElement.style.setProperty("--accent", ACCENTS[S.accent] || ACCENTS.periwinkle);
document.body.classList.toggle("extra-dark", !!S.extraDark);
document.body.classList.toggle("theme-glass", S.styleMode === "Glass");
var r = pages[route] ? route : "home";
document.querySelectorAll("#topnav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-route") === r); });
var v = document.getElementById("view");
if (v) { v.innerHTML = ""; v.append(pagesr); }
var u = document.getElementById("navUsername");
if (u) {
u.innerHTML = "";
u.append(document.createTextNode(pCur.name), rankBadge(pCur.name));
}
}
document.querySelectorAll("[data-route]").forEach(function (el) { el.addEventListener("click", function (e) { e.preventDefault(); go(el.getAttribute("data-route")); }); });
var cmd = document.getElementById("commandHint");
if (cmd) cmd.addEventListener("click", function () { go("mods"); });
render();
})();
