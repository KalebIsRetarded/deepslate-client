(function () {
  "use strict";
  var C = window.DEEPSLATE_CONFIG || {};
  var KEY = "deepslate.v12";
  var ACCENTS = { periwinkle: "#a594f9", green: "#3ddc97", blue: "#4aa8ff", orange: "#ffa94d" };
  var currentRoute = "home";

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

  function defaultSkinDataUrl() {
    var c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#52525b"; ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#71717a"; ctx.fillRect(8, 8, 8, 8);
    ctx.fillStyle = "#18181b"; ctx.fillRect(9, 11, 2, 1); ctx.fillRect(13, 11, 2, 1);
    ctx.fillStyle = "#3f3f46"; ctx.fillRect(20, 20, 8, 12); ctx.fillRect(44, 20, 4, 12); ctx.fillRect(36, 52, 4, 12);
    return c.toDataURL("image/png");
  }

  var S = JSON.parse(localStorage.getItem(KEY) || "null") || {
    name: "Crux", accent: "periwinkle", version: C.DEFAULT_VERSION || "1.21.11",
    instanceName: "My instance 1",
    mods: { "fps-boost": true, "zoom": true },
    modFilter: "All", modSearch: "",
    servers: [{ name: "ArchMC", ip: "wss://mc.arch.lol" }, { name: "ZythMC", ip: "wss://play.zyth.me" }],
    pose: "Idle", model: "Classic", wardrobeTab: "Skin", skinData: "", capeData: "", recentSkins: []
  };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function go(route) { currentRoute = route; render(); }

  function launch(ip) {
    var url = (C.GAME_URL || "").trim();
    if (!url) return alert("Set GAME_URL in config.js (e.g. '/game/index.html') to boot Minecraft " + S.version + (ip ? " (" + ip + ")" : "") + ".");
    var ov = document.getElementById("overlay");
    var g = h("div", { class: "game" },
      h("div", { class: "bar" }, h("button", { class: "btn", onclick: function () { g.remove(); } }, "← Exit"), h("b", null, "Deepslate " + S.version)),
      h("iframe", { src: url, allow: "fullscreen; autoplay; gamepad; pointer-lock", allowfullscreen: "true" })
    );
    ov.append(g);
  }

  var pages = {
    home: function () {
      var count = Object.keys(S.mods).filter(function (k) { return S.mods[k]; }).length;
      return h("div", null,
        h("section", { class: "cr-hero" },
          h("div", { class: "cr-inst-label" }, S.instanceName.toUpperCase()),
          h("div", { class: "play-split" },
            h("button", { class: "play-main", onclick: function () { launch(); } }, h("strong", null, "PLAY " + S.version), h("span", null, "STANDARD ENGINE · READY")),
            h("button", { class: "play-drop", onclick: function () { S.version = S.version === "1.21.11" ? "1.8.8" : "1.21.11"; save(); render(); } }, "⌄")
          ),
          h("div", { class: "hero-sub" },
            count + " mods on · ",
            h("a", { href: "#", onclick: function (e) { e.preventDefault(); go("mods"); } }, "Manage mods"),
            " · ",
            h("a", { href: "#", onclick: function (e) { e.preventDefault(); go("servers"); } }, "Servers")
          ),
          h("div", { class: "hero-stats" }, h("span", null, h("b", null, "27"), " playing right now"), h("span", null, h("b", null, "1,000"), " in the last 24 hours"))
        ),
        h("div", { class: "partner-bar" },
          h("div", null, h("b", null, "Top servers"), h("small", { style: "display:block;color:var(--muted);" }, "Featured community servers ready for one-click join.")),
          h("button", { class: "btn", onclick: function () { go("servers"); } }, "Browse servers")
        )
      );
    },
    mods: function () {
      var allMods = C.MODS || [];
      var cats = [
        { id: "All", dot: null },
        { id: "Performance", dot: "#22c55e" },
        { id: "Visuals", dot: "#3b82f6" },
        { id: "HUD", dot: "#a594f9" },
        { id: "PvP", dot: "#f43f5e" },
        { id: "Utility", dot: "#eab308" },
        { id: "Libraries", dot: "#8b5cf6" }
      ];
      var filtered = allMods.filter(function (m) {
        var cOk = S.modFilter === "All" || (m.category || "").toLowerCase() === S.modFilter.toLowerCase();
        var qOk = !S.modSearch || m.name.toLowerCase().indexOf(S.modSearch.toLowerCase()) !== -1 || m.desc.toLowerCase().indexOf(S.modSearch.toLowerCase()) !== -1;
        return cOk && qOk;
      });

      var schemIn = h("input", { type: "file", accept: ".litematic,.schem", style: "display:none;", onchange: function () { alert("Schematic queued for Litematica!"); } });
      var instSel = h("select", { onchange: function (e) { S.instanceName = e.target.value; save(); render(); } },
        ["My instance 1", "PvP 1.8.8 Profile", "Survival+ Profile"].map(function (n) {
          return h("option", { value: n, selected: S.instanceName === n }, n);
        })
      );

      var searchIn = h("input", {
        type: "text", value: S.modSearch, placeholder: "Search " + allMods.length + " mods",
        style: "width:220px;",
        oninput: function () {
          S.modSearch = searchIn.value;
          var pos = searchIn.selectionStart;
          render();
          var next = document.getElementById("modSearchBox");
          if (next) { next.focus(); next.setSelectionRange(pos, pos); }
        }
      });
      searchIn.id = "modSearchBox";

      var visualsOn = !!S.mods["fps-boost"] && !!S.mods["fullbright"];

      return h("div", null,
        schemIn,
        h("div", { class: "mods-header" },
          h("h2", { style: "font-size:18px;" }, "Browse mods"),
          h("div", { style: "display:flex;align-items:center;gap:10px;flex-wrap:wrap;" },
            h("button", { class: "btn", onclick: function () { schemIn.click(); } }, "↑ Schematics"),
            h("span", { style: "font-size:12.5px;color:var(--muted);" }, "Adding to"),
            instSel
          )
        ),
        h("div", { class: "mod-featured" },
          h("div", { style: "display:flex;align-items:center;gap:16px;" },
            h("div", { class: "mod-icon", style: "width:54px;height:54px;font-size:26px;background:rgba(165,148,249,0.18);border:1px solid rgba(165,148,249,0.35);" }, "💎"),
            h("div", null,
              h("div", { style: "display:flex;align-items:center;gap:8px;" },
                h("b", { style: "font-size:16px;" }, "Deepslate Visuals"),
                h("span", { style: "font-size:11px;background:rgba(255,255,255,0.1);color:#e2e8f0;padding:2px 8px;border-radius:6px;font-weight:600;" }, "Official")
              ),
              h("small", { style: "display:block;color:var(--muted);font-size:12px;margin-top:2px;" }, "by Deepslate · Right Shift opens the menu"),
              h("p", { style: "font-size:13px;color:#cbd5e1;margin-top:6px;" }, "Official Deepslate Client visuals: custom skies, glass armor, smooth HUD, motion blur and more.")
            )
          ),
          h("div", { style: "display:flex;flex-direction:column;align-items:flex-end;gap:6px;" },
            h("button", {
              class: "btn primary",
              onclick: function () {
                S.mods["fps-boost"] = true; S.mods["fullbright"] = true; S.mods["fps-hud"] = true;
                save(); render();
              }
            }, visualsOn ? "✓ Added to " + S.instanceName : "+ Add to " + S.instanceName),
            h("small", { style: "color:var(--muted);font-size:11px;cursor:pointer;", onclick: function () { alert("Browser bundle active — no .jar needed!"); } }, "↓ Download .jar (Java)")
          )
        ),
        h("div", { class: "filter-row" },
          searchIn,
          cats.map(function (c) {
            var act = S.modFilter === c.id;
            return h("button", {
              class: "chip-btn" + (act ? " active" : ""),
              style: "display:inline-flex;align-items:center;gap:6px;",
              onclick: function () { S.modFilter = c.id; render(); }
            },
              c.dot ? h("span", { style: "width:7px;height:7px;border-radius:50%;background:" + c.dot + ";display:inline-block;" }) : null,
              c.id
            );
          })
        ),
        h("div", { class: "mods-grid" }, filtered.map(function (m) {
          var on = !!S.mods[m.id];
          return h("div", { class: "mod-card" },
            h("div", null,
              h("div", { class: "mod-top" },
                h("div", { style: "display:flex;gap:12px;align-items:flex-start;" },
                  h("div", { class: "mod-icon", style: "border:1px solid rgba(255,255,255,0.08);" }, m.icon || "🧩"),
                  h("div", null,
                    h("b", { style: "font-size:14px;display:block;" }, m.name),
                    m.tag ? h("span", { style: "display:inline-block;font-size:10px;background:rgba(234,179,8,0.16);color:#facc15;padding:1px 6px;border-radius:4px;margin:3px 0;font-weight:700;" }, m.tag) : null,
                    h("small", { style: "display:block;color:var(--muted);font-size:11.5px;" }, "by " + (m.author || "Deepslate") + " · " + m.category)
                  )
                ),
                h("button", {
                  class: "btn " + (on ? "added" : ""),
                  style: !on ? "background:rgba(165,148,249,0.16);color:#c4b5fd;border-color:rgba(165,148,249,0.3);" : "",
                  onclick: function () {
                    S.mods[m.id] = !on;
                    if (!on && m.dep && m.dep.indexOf("Sodium") !== -1) S.mods["fps-boost"] = true;
                    if (!on && m.dep && m.dep.indexOf("ukulib") !== -1) S.mods["ukulib"] = true;
                    save(); render();
Use code with caution.
}
}, on ? "✓ Added" : "+ Add")
),
h("p", { style: "font-size:12.5px;color:#a1a1aa;line-height:1.45;margin-top:10px;" }, m.desc),
m.dep ? h("small", { style: "display:block;color:var(--muted);font-size:11px;margin-top:8px;" }, m.dep) : null,
m.warn ? h("small", { style: "display:block;color:#f59e0b;font-size:11px;margin-top:4px;font-weight:600;" }, m.warn) : null
)
);
}))
);
},
wardrobe: function () {
var wrap = h("div", { class: "wardrobe-layout" });
var viewer = null;
var stage = h("div", { class: "wardrobe-stage" },
h("div", { style: "width:100%;display:flex;justify-content:space-between;align-items:center;" },
h("div", null, h("b", null, "Wardrobe"), h("small", { style: "display:block;color:var(--muted);font-size:11.5px;" }, "Drag to turn · scroll to zoom")),
h("span", { style: "background:rgba(0,0,0,0.5);padding:4px 12px;border-radius:6px;font-weight:700;font-size:13px;" }, S.name),
h("div", { style: "display:flex;gap:6px;" },
h("button", { class: "btn", onclick: function () { if (viewer) { viewer.playerObject.rotation.y = 0; viewer.zoom = 0.9; } } }, "↺"),
h("button", { class: "btn", onclick: function () { if (viewer) viewer.autoRotate = !viewer.autoRotate; } }, "⟳")
)
)
);
var canvas = h("canvas", { width: "300", height: "380", style: "cursor:grab;" });
stage.append(canvas);
var activeSkin = S.skinData || defaultSkinDataUrl();
if (window.skinview3d) {
viewer = new window.skinview3d.SkinViewer({ canvas: canvas, width: 300, height: 380, skin: activeSkin });
if (S.capeData) viewer.loadCape(S.capeData);
viewer.controls.enableRotate = true;
viewer.controls.enableZoom = true;
viewer.playerObject.skin.modelType = S.model === "Slim" ? "slim" : "default";
viewer.animation = new window.skinview3d.IdleAnimation();
}
var poses = {
Idle: function () { return new window.skinview3d.IdleAnimation(); },
Walk: function () { return new window.skinview3d.WalkingAnimation(); },
Run: function () { return new window.skinview3d.RunningAnimation(); },
Wave: function () { return new window.skinview3d.WaveAnimation(); },
Crouch: function () { return new window.skinview3d.CrouchAnimation(); },
Dance: function () { var a = new window.skinview3d.WalkingAnimation(); a.speed = 2.4; return a; }
};
stage.append(h("div", { class: "pose-bar" }, Object.keys(poses).map(function (p) {
return h("button", {
class: "pose-btn" + (S.pose === p ? " active" : ""),
onclick: function () {
S.pose = p;
if (viewer && poses[p]) viewer.animation = posesp;
stage.querySelectorAll(".pose-btn").forEach(function (b) { b.classList.toggle("active", b.textContent === p); });
}
}, p);
})));
var skinFile = h("input", {
type: "file", accept: "image/png", style: "display:none;",
onchange: function (e) {
var f = e.target.files.item(0);
if (!f) return;
var r = new FileReader();
r.onload = function () { S.skinData = r.result; save(); render(); };
r.readAsDataURL(f);
}
});
var sidebar = h("div", { class: "card", style: "display:flex;flex-direction:column;gap:16px;" },
h("b", { style: "border-bottom:1px solid var(--border);padding-bottom:10px;" }, "Skin"),
skinFile,
h("div", {
style: "border:1px dashed var(--border-hi);border-radius:10px;padding:20px 14px;text-align:center;cursor:pointer;",
onclick: function () { skinFile.click(); }
},
h("div", { style: "font-size:18px;margin-bottom:4px;" }, "↑"),
h("b", { style: "font-size:13px;display:block;" }, "Upload a skin"),
h("small", { style: "color:var(--muted);font-size:11.5px;" }, "Click to browse 64×64 PNG skins")
),
h("div", null,
h("small", { style: "font-family:var(--font-mono);color:var(--muted);display:block;margin-bottom:6px;font-size:10.5px;" }, "MODEL"),
h("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px;" }, ["Classic", "Slim"].map(function (m) {
return h("button", {
class: "btn" + (S.model === m ? " primary" : ""),
style: "justify-content:center;",
onclick: function () { S.model = m; save(); render(); }
}, m);
}))
)
);
wrap.append(stage, sidebar);
return wrap;
},
servers: function () {
return h("div", null, S.servers.map(function (s) {
return h("div", { class: "card", style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;" },
h("div", null, h("b", null, s.name), h("small", { style: "display:block;color:var(--muted);" }, s.ip)),
h("button", { class: "btn primary", onclick: function () { launch(s.ip); } }, "▶ Join")
);
}));
},
settings: function () {
var inp = h("input", { value: S.name });
return h("div", { class: "card" },
h("div", { class: "setting-row" }, h("b", null, "Username"), h("div", { style: "display:flex;gap:8px;" }, inp, h("button", { class: "btn", onclick: function () { S.name = inp.value || "Crux"; save(); render(); } }, "Save"))),
h("div", { class: "setting-row" }, h("b", null, "Accent"), h("div", { style: "display:flex;gap:6px;" }, Object.keys(ACCENTS).map(function (k) {
return h("button", { class: "btn" + (S.accent === k ? " primary" : ""), onclick: function () { S.accent = k; save(); render(); } }, k);
})))
);
}
};
function render() {
document.documentElement.style.setProperty("--accent", ACCENTS[S.accent] || ACCENTS.periwinkle);
var route = pages[currentRoute] ? currentRoute : "home";
document.querySelectorAll("#topnav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-route") === route); });
var v = document.getElementById("view");
if (v) { v.innerHTML = ""; v.append(pagesroute); }
var u = document.getElementById("navUsername");
if (u) u.textContent = S.name;
}
document.querySelectorAll("[data-route]").forEach(function (el) {
el.addEventListener("click", function (e) { e.preventDefault(); go(el.getAttribute("data-route")); });
});
var cmdBtn = document.getElementById("commandHint");
if (cmdBtn) cmdBtn.addEventListener("click", function () { go("mods"); });
render();
})();
