(function () {
  "use strict";
  var C = window.DEEPSLATE_CONFIG || {};
  var KEY = "deepslate.v17";
  var ACCENTS = { periwinkle: "#a594f9", green: "#3ddc97", blue: "#4aa8ff", orange: "#ffa94d" };
  var route = "home";

  var DEFAULT_MODS = [
    { id: "fps-boost", name: "Sodium", category: "Performance", code: "SO", desc: "Performance improvements." },
    { id: "iris", name: "Iris Shaders", category: "Visuals", code: "IR", desc: "Shader support." },
    { id: "zoom", name: "ZoomX Smooth", category: "Utility", code: "ZM", desc: "Smooth zoom with scroll adjustment." },
    { id: "hitboxes", name: "Combat Hitboxes", category: "PvP", code: "HB", desc: "Custom entity hitbox rendering." },
    { id: "armor-hud", name: "Uku's Armor HUD", category: "HUD", code: "AR", desc: "Shows armor durability." },
    { id: "fullbright", name: "Fullbright & Clear", category: "Visuals", code: "FB", desc: "Fullbright and visual improvements." }
  ];

  function h(t, p) {
    var e = document.createElement(t);
    var kids = Array.prototype.slice.call(arguments, 2);
    Object.keys(p || {}).forEach(function (k) {
      if (k === "class") e.className = p[k];
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), p[k]);
      else e.setAttribute(k, p[k]);
    });
    kids.forEach(function (c) {
      if (Array.isArray(c)) c.forEach(function (x) { if (x) e.append(x); });
      else if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return e;
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
    var close = function () { bg.remove(); };
    var bg = h("div", {
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

  var S = JSON.parse(localStorage.getItem(KEY) || "null") || {
    name: "Crux", email: "", status: "", bio: "PvP main, builder, always down for bedwars",
    banner: "#a594f9", accent: "periwinkle", styleMode: "Minimal", extraDark: false,
    version: C.DEFAULT_VERSION || "1.21.11", inst: "My instance 1",
    mods: { "fps-boost": true, "zoom": true }, filter: "All", search: "",
    servers: [{ name: "ArchMC", ip: "wss://mc.arch.lol" }, { name: "ZythMC", ip: "wss://play.zyth.me" }],
    pose: "Idle", model: "Classic", skin: "", stTab: "My account",
    prefs: { friendReq: true, whoAdd: "Everyone", whoMsg: "Friends", showOnline: true, showServer: true, dnd: false, popups: true, btnSound: true, perfMode: false }
  };
  if (!S.prefs) S.prefs = {};
  if (!S.mods) S.mods = {};
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
      showModal("Engine Ready", h("p", { style: "color:var(--muted);font-size:13px;" }, "Deepslate " + S.version + (ip ? " (" + ip + ")" : "") + " is ready. Set GAME_URL in config.js to '/game/index.html' to play."),
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
          h("div", { class: "cr-inst-label" }, S.inst.toUpperCase()),
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
      var srch = h("input", { value: S.search, placeholder: "Search " + all.length + " mods", oninput: function () { S.search = srch.value; render(); } });
      return h("div", null,
        h("div", { class: "mods-header" }, h("h2", { style: "font-size:18px;" }, "Browse mods")),
        h("div", { class: "filter-row" }, srch, cats.map(function (c) {
          return h("button", { class: "chip-btn" + (S.filter === c ? " active" : ""), onclick: function () { S.filter = c; render(); } }, c);
        })),
        h("div", { class: "mods-grid" }, list.map(function (m) {
          var on = !!S.mods[m.id];
          return h("div", { class: "mod-card" },
            h("div", { class: "mod-top" },
              h("div", { style: "display:flex;gap:10px;align-items:center;" },
                m.image ? h("img", { src: m.image, style: "width:42px;height:42px;border-radius:10px;" }) : h("div", { class: "mod-icon", style: "font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--accent);" }, m.code || m.name.slice(0, 2).toUpperCase()),
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
      var canvas = h("canvas", { width: "280", height: "360", style: "cursor:grab;" });
      if (window.skinview3d) {
        var viewer = new window.skinview3d.SkinViewer({ canvas: canvas, width: 280, height: 360 });
        if (S.skin) viewer.loadSkin(S.skin);
        viewer.controls.enableRotate = true; viewer.controls.enableZoom = true;
        viewer.playerObject.skin.modelType = S.model === "Slim" ? "slim" : "default";
        viewer.animation = new window.skinview3d.IdleAnimation();
      }
      var fileIn = h("input", { type: "file", accept: "image/png", style: "display:none;", onchange: function (e) {
        var f = e.target.files.item(0); if (!f) return;
        var r = new FileReader(); r.onload = function () { S.skin = r.result; save(); toast("Skin updated"); render(); }; r.readAsDataURL(f);
      }});
      return h("div", { class: "wardrobe-layout" },
        h("div", { class: "wardrobe-stage" }, h("b", null, S.name), canvas,
          h("div", { class: "pose-bar" }, ["Idle", "Walk", "Run", "Wave", "Crouch"].map(function (p) {
Use code with caution.
return h("button", { class: "pose-btn" + (S.pose === p ? " active" : ""), onclick: function () { S.pose = p; render(); } }, p);
}))
),
h("div", { class: "card", style: "display:flex;flex-direction:column;gap:14px;" },
h("b", null, "Skin"), fileIn,
h("button", { class: "btn", onclick: function () { fileIn.click(); } }, "Upload 64x64 PNG"),
h("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px;" }, ["Classic", "Slim"].map(function (m) {
return h("button", { class: "btn" + (S.model === m ? " primary" : ""), onclick: function () { S.model = m; save(); render(); } }, m);
}))
)
);
},
servers: function () {
return h("div", null, (S.servers || []).map(function (s) {
return h("div", { class: "card", style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;" },
h("div", null, h("b", null, s.name), h("small", { style: "display:block;color:var(--muted);" }, s.ip)),
h("button", { class: "btn primary", onclick: function () { launch(s.ip); } }, "Join")
);
}));
},
settings: function () {
var tabs = ["My account", "Devices", "Privacy & safety", "Notifications", "Sound", "Appearance", "Game & sync", "Your data"];
var bioIn = h("textarea", { rows: "3", style: "width:100%;background:var(--bg);border:1px solid var(--border-hi);color:#fff;padding:10px;border-radius:8px;font-family:inherit;font-size:13px;" }, S.bio || "");
var banners = ["#a594f9", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6"];
var body = null;
if (S.stTab === "My account") {
body = h("div", null,
h("div", { class: "st-section", style: "border-top:4px solid " + S.banner + ";display:flex;justify-content:space-between;align-items:center;" },
h("div", { style: "display:flex;gap:12px;align-items:center;" }, h("img", { src: "favicon.svg", style: "width:42px;height:42px;" }), h("div", null, h("b", { style: "font-size:16px;" }, S.name), h("small", { style: "display:block;color:var(--muted);" }, "Deepslate profile"))),
h("button", { class: "btn", onclick: function () { go("wardrobe"); } }, "Wardrobe")
),
h("div", { class: "st-section" },
row("Username", S.name, h("button", { class: "btn", onclick: function () { editField("Change username", S.name, "Username", function (v) { if (v.trim()) { S.name = v.trim(); save(); toast("Username saved"); render(); } }); } }, "Change")),
row("Email", S.email || "Not added", h("button", { class: "btn", onclick: function () { editField("Email", S.email, "you@example.com", function (v) { S.email = v.trim(); save(); toast("Email saved"); render(); }); } }, S.email ? "Edit" : "Add")),
row("Status", S.status || "No status set", h("button", { class: "btn", onclick: function () { editField("Status", S.status, "Playing Bedwars...", function (v) { S.status = v.trim(); save(); toast("Status saved"); render(); }); } }, "Set status")),
h("div", { style: "padding:12px 0;" }, h("b", { style: "font-size:13.5px;display:block;margin-bottom:6px;" }, "Bio"), bioIn,
h("div", { style: "text-align:right;margin-top:8px;" }, h("button", { class: "btn", onclick: function () { S.bio = bioIn.value; save(); toast("Bio saved"); } }, "Save bio"))),
h("div", { class: "banner-swatches" }, banners.map(function (c) {
return h("button", { class: "swatch" + (S.banner === c ? " active" : ""), style: "background:" + c + ";", onclick: function () { S.banner = c; save(); render(); } });
}))
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
row("Reset data", "Clear local profile and settings", h("button", { class: "btn danger", onclick: function () {
showModal("Reset all data?", h("p", { style: "color:var(--muted);font-size:13px;" }, "This clears your username, skin, and mod preferences."), function (close) {
return [h("button", { class: "btn", onclick: close }, "Cancel"), h("button", { class: "btn danger", onclick: function () { localStorage.removeItem(KEY); location.reload(); } }, "Reset")];
});
} }, "Delete my account"))
);
}
return h("div", { class: "settings-layout" },
h("div", { class: "settings-nav" },
h("div", { class: "st-user-card" }, h("img", { src: "favicon.svg" }), h("div", null, h("b", { style: "font-size:13.5px;display:block;" }, S.name), h("small", { style: "color:var(--muted);font-size:11.5px;" }, "Deepslate account"))),
tabs.map(function (t) { return h("button", { class: S.stTab === t ? "active" : "", onclick: function () { S.stTab = t; render(); } }, t); })
),
h("div", null, h("h2", { style: "font-size:20px;margin-bottom:14px;" }, S.stTab), body)
);
}
};
function render() {
document.documentElement.style.setProperty("--accent", ACCENTS[S.accent] || ACCENTS.periwinkle);
document.body.classList.toggle("extra-dark", !!S.extraDark);
document.body.classList.toggle("theme-glass", S.styleMode === "Glass");
var r = pages[route] ? route : "home";
document.querySelectorAll("#topnav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-route") === r); });
var v = document.getElementById("view");
if (v) { v.innerHTML = ""; v.append(pagesr); }
var u = document.getElementById("navUsername");
if (u) u.textContent = S.name;
}
document.querySelectorAll("[data-route]").forEach(function (el) { el.addEventListener("click", function (e) { e.preventDefault(); go(el.getAttribute("data-route")); }); });
var cmd = document.getElementById("commandHint");
if (cmd) cmd.addEventListener("click", function () { go("mods"); });
render();
})();
