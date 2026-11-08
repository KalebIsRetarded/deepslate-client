(function () {
  "use strict";
  var C = window.DEEPSLATE_CONFIG || {};
  var KEY = "deepslate.v22";
  var OWNER = "cruxisdumb";
  var ACCENTS = { periwinkle: "#a594f9", green: "#3ddc97", blue: "#4aa8ff", orange: "#ffa94d" };
  var route = "home";
  var viewer = null;

  var DEFAULT_MODS = [
    { id: "fps-boost", name: "Sodium", category: "Performance", code: "SO", desc: "Performance improvements." },
    { id: "iris", name: "Iris Shaders", category: "Visuals", code: "IR", desc: "Shader support." },
    { id: "zoom", name: "ZoomX Smooth", category: "Utility", code: "ZM", desc: "Smooth zoom with scroll adjustment." },
    { id: "hitboxes", name: "Combat Hitboxes", category: "PvP", code: "HB", desc: "Custom entity hitbox rendering." },
    { id: "armor-hud", name: "Uku's Armor HUD", category: "HUD", code: "AR", desc: "Shows armor durability." },
    { id: "fullbright", name: "Fullbright & Clear", category: "Visuals", code: "FB", desc: "Fullbright and visual improvements." }
  ];

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function isOwner(n) { return String(n || "").trim().toLowerCase() === OWNER; }

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

  function badge(n) {
    if (!isOwner(n)) return null;
    return h("span", { style: "font-family:var(--font-mono);font-size:10px;font-weight:800;padding:2px 6px;border-radius:5px;background:rgba(244,63,94,0.2);color:#fb7185;border:1px solid rgba(244,63,94,0.4);margin-left:6px;" }, "OWNER");
  }

  function toast(msg) {
    var box = document.getElementById("toasts");
    if (!box) return;
    var t = h("div", { class: "toast" }, msg);
    box.append(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  function modal(title, body, btns) {
    var ov = document.getElementById("overlay");
    if (!ov) return;
    var bg;
    var close = function () { if (bg) bg.remove(); };
    bg = h("div", { style: "position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:2500;padding:20px;", onclick: function (e) { if (e.target === bg) close(); } },
      h("div", { style: "background:var(--panel);border:1px solid var(--border-hi);border-radius:14px;padding:22px;max-width:400px;width:100%;" },
        h("h3", { style: "font-size:16px;margin-bottom:10px;" }, title), body,
        h("div", { style: "display:flex;justify-content:flex-end;gap:8px;margin-top:16px;" }, btns(close))
      )
    );
    ov.append(bg);
  }

  function ask(title, val, ph, cb) {
    var inp = h("input", { type: "text", value: val || "", placeholder: ph || "", style: "width:100%;" });
    modal(title, inp, function (close) {
      return [h("button", { class: "btn", onclick: close }, "Cancel"), h("button", { class: "btn primary", onclick: function () { cb(inp.value); close(); } }, "Save")];
    });
    setTimeout(function () { inp.focus(); inp.select(); }, 20);
  }

  function makeProf(name) {
    return { id: uid(), name: name || "Player", email: "", status: "", bio: "", banner: isOwner(name) ? "#f43f5e" : "#a594f9", model: "Classic", skin: "", friends: [{ name: "CruxIsDumb", note: "Client Owner" }] };
  }

  var p0 = makeProf("Player");
  var S = JSON.parse(localStorage.getItem(KEY) || "null") || {
    profiles: [p0], activeId: p0.id, accent: "periwinkle", styleMode: "Minimal", extraDark: false,
    version: C.DEFAULT_VERSION || "1.21.11", inst: "My instance 1", mods: { "fps-boost": true, "zoom": true },
    filter: "All", search: "", servers: [{ name: "ArchMC", ip: "wss://mc.arch.lol" }, { name: "ZythMC", ip: "wss://play.zyth.me" }],
    pose: "Idle", stTab: "My account", prefs: { friendReq: true, whoAdd: "Everyone", showOnline: true, dnd: false, popups: true, btnSound: true, perfMode: false }
  };
  if (!Array.isArray(S.profiles) || !S.profiles.length) { var x = makeProf("Player"); S.profiles = [x]; S.activeId = x.id; }
  function prof() { return S.profiles.filter(function (p) { return p.id === S.activeId; }).pop() || S.profiles.slice(0, 1).pop(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function go(r) { route = r; render(); }

  function toggle(k) { return h("button", { class: "st-toggle" + (S.prefs[k] ? " on" : ""), onclick: function () { S.prefs[k] = !S.prefs[k]; save(); render(); } }); }
  function row(t, sub, ctrl) { return h("div", { class: "setting-row" }, h("div", null, h("b", { style: "font-size:13.5px;display:block;" }, t), sub ? h("small", { style: "color:var(--muted);font-size:12px;" }, sub) : null), ctrl); }

  function launch(ip) {
    var url = (C.GAME_URL || "").trim();
    if (!url) {
      modal("Engine Ready", h("p", { style: "color:var(--muted);font-size:13px;" }, "Deepslate " + S.version + " (" + prof().name + ")" + (ip ? " -> " + ip : "") + " is ready. Set GAME_URL in config.js to '/game/index.html'."),
        function (close) { return [h("button", { class: "btn primary", onclick: close }, "Got it")]; });
      return;
    }
    var g = h("div", { class: "game" },
      h("div", { class: "bar" }, h("button", { class: "btn", onclick: function () { g.remove(); } }, "Exit"), h("b", null, "Deepslate " + S.version)),
      h("iframe", { src: url, allow: "fullscreen; autoplay; gamepad; pointer-lock", allowfullscreen: "true" })
    );
    document.getElementById("overlay").append(g);
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
      var cats = ["All", "Performance", "Visuals", "HUD", "PvP", "Utility"];
      var list = all.filter(function (m) { return (S.filter === "All" || m.category === S.filter) && (!S.search || m.name.toLowerCase().indexOf(S.search.toLowerCase()) !== -1); });
      var srch = h("input", { value: S.search || "", placeholder: "Search mods", oninput: function () { S.search = srch.value; render(); } });
      return h("div", null,
        h("div", { class: "mods-header" }, h("h2", { style: "font-size:18px;" }, "Browse mods")),
        h("div", { class: "filter-row" }, srch, cats.map(function (c) { return h("button", { class: "chip-btn" + (S.filter === c ? " active" : ""), onclick: function () { S.filter = c; render(); } }, c); })),
        h("div", { class: "mods-grid" }, list.map(function (m) {
          var on = !!S.mods[m.id];
          var code = m.code || m.name.slice(0, 2).toUpperCase();
          var icon = h("div", { class: "mod-icon", style: "font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--accent);overflow:hidden;" }, code);
          if (m.image) {
            var img = h("img", { src: m.image, style: "width:100%;height:100%;object-fit:cover;image-rendering:pixelated;", onerror: function () { icon.innerHTML = ""; icon.textContent = code; } });
            icon.innerHTML = ""; icon.append(img);
          }
          return h("div", { class: "mod-card" },
            h("div", { class: "mod-top" },
              h("div", { style: "display:flex;gap:10px;align-items:center;" }, icon, h("div", null, h("b", null, m.name), h("small", { style: "display:block;color:var(--muted);" }, m.category))),
              h("button", { class: "btn " + (on ? "added" : ""), onclick: function () { S.mods[m.id] = !on; save(); toast((!on ? "Added " : "Removed ") + m.name); render(); } }, on ? "Added" : "+ Add")
            ),
            h("p", { style: "font-size:12.5px;color:var(--muted);margin-top:8px;" }, m.desc)
          );
        }))
      );
    },
    wardrobe: function () {
      var p = prof();
      if (viewer && viewer.dispose) { try { viewer.dispose(); } catch (e) {} viewer = null; }
      var canvas = h("canvas", { width: "280", height: "360", style: "cursor:grab;" });
      if (window.skinview3d) {
Use code with caution.
viewer = new window.skinview3d.SkinViewer({ canvas: canvas, width: 280, height: 360 });
if (p.skin) viewer.loadSkin(p.skin);
viewer.controls.enableRotate = true; viewer.controls.enableZoom = true;
viewer.playerObject.skin.modelType = p.model === "Slim" ? "slim" : "default";
viewer.animation = new window.skinview3d.IdleAnimation();
}
var fileIn = h("input", { type: "file", accept: "image/png", style: "display:none;", onchange: function (e) {
var f = e.target.files.item(0); if (!f) return;
var r = new FileReader(); r.onload = function () { p.skin = r.result; save(); toast("Skin updated"); render(); }; r.readAsDataURL(f);
}});
return h("div", { class: "wardrobe-layout" },
h("div", { class: "wardrobe-stage" }, h("div", null, h("b", null, p.name), badge(p.name)), canvas,
h("div", { class: "pose-bar" }, ["Idle", "Walk", "Run", "Wave", "Crouch"].map(function (x) { return h("button", { class: "pose-btn" + (S.pose === x ? " active" : ""), onclick: function () { S.pose = x; render(); } }, x); }))
),
h("div", { class: "card", style: "display:flex;flex-direction:column;gap:14px;" }, h("b", null, "Skin"), fileIn,
h("button", { class: "btn", onclick: function () { fileIn.click(); } }, "Upload 64x64 PNG"),
h("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px;" }, ["Classic", "Slim"].map(function (m) {
return h("button", { class: "btn" + (p.model === m ? " primary" : ""), onclick: function () { p.model = m; save(); render(); } }, m);
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
var p = prof();
if (!Array.isArray(p.friends)) p.friends = [];
var tabs = ["My account", "Profiles", "Friends", "Appearance", "Game & sync", "Your data"];
var body = null;
if (S.stTab === "My account") {
var bioIn = h("textarea", { rows: "2", placeholder: "Write a bio...", style: "width:100%;background:var(--bg);border:1px solid var(--border-hi);color:#fff;padding:8px;border-radius:8px;font-family:inherit;" }, p.bio || "");
body = h("div", { class: "st-section", style: "border-top:4px solid " + p.banner + ";" },
row(h("span", null, "Username: ", p.name, badge(p.name)), "Shown in-game and in Wardrobe", h("button", { class: "btn", onclick: function () {
ask("Change username", p.name, "Username", function (v) { if (v.trim()) { p.name = v.trim(); if (isOwner(p.name)) p.banner = "#f43f5e"; save(); toast("Saved"); render(); } });
} }, "Change")),
row("Status", p.status || "No status set", h("button", { class: "btn", onclick: function () { ask("Set status", p.status, "Playing Bedwars...", function (v) { p.status = v.trim(); save(); toast("Saved"); render(); }); } }, "Set")),
h("div", { style: "padding:10px 0;" }, bioIn, h("button", { class: "btn", style: "margin-top:6px;", onclick: function () { p.bio = bioIn.value; save(); toast("Bio saved"); } }, "Save bio"))
);
} else if (S.stTab === "Profiles") {
body = h("div", { class: "st-section" },
h("div", { style: "margin-bottom:12px;" }, h("button", { class: "btn primary", onclick: function () {
ask("New profile", "", "Profile name", function (v) { if (!v.trim()) return; var np = makeProf(v.trim()); S.profiles.push(np); S.activeId = np.id; save(); render(); });
} }, "+ Create Profile")),
S.profiles.map(function (it) {
var act = it.id === p.id;
return row(h("span", null, it.name, badge(it.name)), act ? "Active profile" : "Saved profile",
h("div", { style: "display:flex;gap:6px;" },
!act ? h("button", { class: "btn primary", onclick: function () { S.activeId = it.id; save(); render(); } }, "Switch") : null,
S.profiles.length > 1 ? h("button", { class: "btn danger", onclick: function () { S.profiles = S.profiles.filter(function (x) { return x.id !== it.id; }); if (S.activeId === it.id) S.activeId = S.profiles.slice(0, 1).pop().id; save(); render(); } }, "Remove") : null
)
);
})
);
} else if (S.stTab === "Friends") {
var fIn = h("input", { placeholder: "Add player username...", style: "flex:1;" });
body = h("div", { class: "st-section" },
h("div", { style: "display:flex;gap:8px;margin-bottom:12px;" }, fIn, h("button", { class: "btn primary", onclick: function () {
var t = fIn.value.trim(); if (!t) return;
p.friends.push({ name: t, note: isOwner(t) ? "Client Owner" : "Friend" }); save(); toast("Added " + t); render();
} }, "+ Add")),
p.friends.map(function (f) {
return row(h("span", null, f.name, badge(f.name)), f.note || "Friend", h("button", { class: "btn", onclick: function () { p.friends = p.friends.filter(function (x) { return x.name !== f.name; }); save(); render(); } }, "Remove"));
})
);
} else if (S.stTab === "Appearance") {
body = h("div", { class: "st-section" },
row("Extra dark", "Pure black OLED background", h("button", { class: "st-toggle" + (S.extraDark ? " on" : ""), onclick: function () { S.extraDark = !S.extraDark; save(); render(); } })),
row("Accent color", "", h("div", { style: "display:flex;gap:6px;" }, Object.keys(ACCENTS).map(function (k) {
return h("button", { class: "btn" + (S.accent === k ? " primary" : ""), onclick: function () { S.accent = k; save(); render(); } }, k);
})))
);
} else if (S.stTab === "Game & sync") {
body = h("div", { class: "st-section" }, row("Performance mode", "Higher FPS on Chromebooks", toggle("perfMode")));
} else {
body = h("div", { class: "st-section" }, row("Reset all data", "Clear profiles and settings", h("button", { class: "btn danger", onclick: function () { localStorage.removeItem(KEY); location.reload(); } }, "Reset")));
}
return h("div", { class: "settings-layout" },
h("div", { class: "settings-nav" }, tabs.map(function (t) { return h("button", { class: S.stTab === t ? "active" : "", onclick: function () { S.stTab = t; render(); } }, t); })),
h("div", null, h("h2", { style: "font-size:20px;margin-bottom:14px;" }, S.stTab), body)
);
}
};
function render() {
var p = prof();
document.documentElement.style.setProperty("--accent", ACCENTS[S.accent] || ACCENTS.periwinkle);
document.body.classList.toggle("extra-dark", !!S.extraDark);
var r = pages[route] ? route : "home";
document.querySelectorAll("#topnav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-route") === r); });
var v = document.getElementById("view");
if (v) { v.innerHTML = ""; v.append(pagesr); }
var u = document.getElementById("navUsername");
if (u) { u.innerHTML = ""; u.append(document.createTextNode(p.name), badge(p.name)); }
}
document.querySelectorAll("[data-route]").forEach(function (el) { el.addEventListener("click", function (e) { e.preventDefault(); go(el.getAttribute("data-route")); }); });
var cmd = document.getElementById("commandHint");
if (cmd) cmd.addEventListener("click", function () { go("mods"); });
render();
})();
