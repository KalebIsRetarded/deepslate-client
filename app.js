(function () {
  "use strict";
  var C = window.DEEPSLATE_CONFIG || {};
  var KEY = "deepslate.v13";
  var ACCENTS = { periwinkle: "#a594f9", green: "#3ddc97", blue: "#4aa8ff", orange: "#ffa94d" };
  var route = "home";

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

  var S = JSON.parse(localStorage.getItem(KEY) || "null") || {
    name: "Crux", accent: "periwinkle", version: C.DEFAULT_VERSION || "1.21.11",
    inst: "My instance 1", mods: { "fps-boost": true, "zoom": true },
    filter: "All", search: "",
    servers: [{ name: "ArchMC", ip: "wss://mc.arch.lol" }, { name: "ZythMC", ip: "wss://play.zyth.me" }],
    pose: "Idle", model: "Classic", skin: ""
  };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function go(r) { route = r; render(); }

  function launch(ip) {
    var url = (C.GAME_URL || "").trim();
    if (!url) return alert("Set GAME_URL in config.js (e.g. '/game/index.html') to launch " + S.version + (ip ? " (" + ip + ")" : "") + ".");
    var g = h("div", { class: "game" },
      h("div", { class: "bar" }, h("button", { class: "btn", onclick: function () { g.remove(); } }, "← Exit"), h("b", null, "Deepslate " + S.version)),
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
            h("button", { class: "play-main", onclick: function () { launch(); } }, h("strong", null, "PLAY " + S.version), h("span", null, "STANDARD ENGINE · READY")),
            h("button", { class: "play-drop", onclick: function () { S.version = S.version === "1.21.11" ? "1.8.8" : "1.21.11"; save(); render(); } }, "⌄")
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
      var all = C.MODS || [];
      var cats = ["All", "Performance", "Visuals", "HUD", "PvP", "Utility", "Libraries"];
      var list = all.filter(function (m) {
        return (S.filter === "All" || m.category === S.filter) && (!S.search || m.name.toLowerCase().indexOf(S.search.toLowerCase()) !== -1);
      });
      var srch = h("input", { value: S.search, placeholder: "Search " + all.length + " mods", oninput: function () { S.search = srch.value; render(); } });
      var sel = h("select", { onchange: function (e) { S.inst = e.target.value; save(); render(); } },
        ["My instance 1", "PvP 1.8.8", "Survival+"].map(function (n) { return h("option", { value: n, selected: S.inst === n }, n); })
      );
      return h("div", null,
        h("div", { class: "mods-header" }, h("h2", { style: "font-size:18px;" }, "Browse mods"), h("div", { style: "display:flex;gap:8px;align-items:center;" }, h("span", { style: "font-size:12px;color:var(--muted);" }, "Adding to"), sel)),
        h("div", { class: "mod-featured" },
          h("div", { style: "display:flex;gap:14px;align-items:center;" },
            h("div", { class: "mod-icon", style: "width:50px;height:50px;font-size:24px;" }, "💎"),
            h("div", null, h("b", null, "Deepslate Visuals "), h("span", { style: "font-size:11px;background:rgba(255,255,255,0.1);padding:2px 7px;border-radius:5px;" }, "Official"), h("p", { style: "font-size:12.5px;color:var(--muted);margin-top:4px;" }, "Custom skies, glass armor, smooth HUD, motion blur and more."))
          ),
          h("button", { class: "btn primary", onclick: function () { S.mods["fps-boost"] = true; S.mods["fullbright"] = true; save(); render(); } }, "+ Add to " + S.inst)
        ),
        h("div", { class: "filter-row" }, srch, cats.map(function (c) {
          return h("button", { class: "chip-btn" + (S.filter === c ? " active" : ""), onclick: function () { S.filter = c; render(); } }, c);
        })),
        h("div", { class: "mods-grid" }, list.map(function (m) {
          var on = !!S.mods[m.id];
          return h("div", { class: "mod-card" },
            h("div", null,
              h("div", { class: "mod-top" },
                h("div", { style: "display:flex;gap:10px;align-items:center;" },
                  h("div", { class: "mod-icon" }, m.icon || "🧩"),
                  h("div", null, h("b", { style: "font-size:14px;" }, m.name), h("small", { style: "display:block;color:var(--muted);font-size:11.5px;" }, "by " + (m.author || "Deepslate") + " · " + m.category))
                ),
                h("button", { class: "btn " + (on ? "added" : ""), onclick: function () { S.mods[m.id] = !on; save(); render(); } }, on ? "✓ Added" : "+ Add")
              ),
              h("p", { style: "font-size:12.5px;color:var(--muted);margin-top:10px;" }, m.desc),
              m.dep ? h("small", { style: "display:block;color:var(--muted);font-size:11px;margin-top:6px;" }, m.dep) : null
            )
          );
        }))
      );
    },
    wardrobe: function () {
      var canvas = h("canvas", { width: "280", height: "360", style: "cursor:grab;" });
      var viewer = null;
      if (window.skinview3d) {
        viewer = new window.skinview3d.SkinViewer({ canvas: canvas, width: 280, height: 360 });
        if (S.skin) viewer.loadSkin(S.skin);
        viewer.controls.enableRotate = true;
        viewer.controls.enableZoom = true;
        viewer.playerObject.skin.modelType = S.model === "Slim" ? "slim" : "default";
        viewer.animation = new window.skinview3d.IdleAnimation();
      }
      var fileIn = h("input", { type: "file", accept: "image/png", style: "display:none;", onchange: function (e) {
        var f = e.target.files.item(0); if (!f) return;
        var r = new FileReader(); r.onload = function () { S.skin = r.result; save(); render(); }; r.readAsDataURL(f);
      }});
      return h("div", { class: "wardrobe-layout" },
        h("div", { class: "wardrobe-stage" },
          h("b", null, S.name), canvas,
          h("div", { class: "pose-bar" }, ["Idle", "Walk", "Run", "Wave", "Crouch"].map(function (p) {
            return h("button", { class: "pose-btn" + (S.pose === p ? " active" : ""), onclick: function () { S.pose = p; render(); } }, p);
          }))
        ),
        h("div", { class: "card", style: "display:flex;flex-direction:column;gap:14px;" },
          h("b", null, "Skin"), fileIn,
          h("button", { class: "btn", onclick: function () { fileIn.click(); } }, "↑ Upload 64×64 PNG"),
          h("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px;" }, ["Classic", "Slim"].map(function (m) {
            return h("button", { class: "btn" + (S.model === m ? " primary" : ""), onclick: function () { S.model = m; save(); render(); } }, m);
          }))
        )
      );
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
    var r = pages[route] ? route : "home";
    document.querySelectorAll("#topnav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-route") === r); });
    var v = document.getElementById("view");
    if (v) { v.innerHTML = ""; v.append(pages[r]()); }
    var u = document.getElementById("navUsername");
    if (u) u.textContent = S.name;
  }

  document.querySelectorAll("[data-route]").forEach(function (el) {
Use code with caution.
el.addEventListener("click", function (e) { e.preventDefault(); go(el.getAttribute("data-route")); });
});
var cmd = document.getElementById("commandHint");
if (cmd) cmd.addEventListener("click", function () { go("mods"); });
render();
})();
