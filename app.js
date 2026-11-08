(function () {
  "use strict";
  var C = window.DEEPSLATE_CONFIG || {};
  var KEY = "deepslate.v7";
  var ACCENTS = { periwinkle: "#a594f9", green: "#3ddc97", blue: "#4aa8ff", orange: "#ffa94d" };

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
    mods: { "fps-boost": true, "zoom": true },
    servers: [{ name: "ArchMC", ip: "wss://mc.arch.lol" }, { name: "ZythMC", ip: "wss://play.zyth.me" }],
    messages: [], pose: "Idle"
  };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

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
          h("div", { class: "cr-inst-label" }, "MY INSTANCE 1"),
          h("div", { class: "play-split" },
            h("button", { class: "play-main", onclick: function () { launch(); } }, h("strong", null, "PLAY " + S.version), h("span", null, "STANDARD ENGINE · READY")),
            h("button", { class: "play-drop", onclick: function () { S.version = S.version === "1.21.11" ? "1.8.8" : "1.21.11"; save(); render(); } }, "⌄")
          ),
          h("div", { class: "hero-sub" }, count + " mods on · ", h("a", { href: "#/mods" }, "Manage mods"), " · ", h("a", { href: "#/servers" }, "Servers")),
          h("div", { class: "hero-stats" }, h("span", null, h("b", null, "27"), " playing right now"), h("span", null, h("b", null, "1,000"), " in the last 24 hours"))
        ),
        h("div", { class: "partner-bar" },
          h("div", null, h("b", null, "Top servers"), h("small", { style: "display:block;color:var(--muted);" }, "Featured community servers ready for one-click join.")),
          h("a", { class: "btn", href: "#/servers" }, "Browse servers")
        )
      );
    },
    mods: function () {
      return h("div", { class: "mods-grid" }, (C.MODS || []).map(function (m) {
        var on = !!S.mods[m.id];
        return h("div", { class: "mod-card" },
          h("div", { class: "mod-top" }, h("div", null, h("b", null, m.name), h("small", { style: "display:block;color:var(--muted);" }, m.category)),
            h("button", { class: "btn " + (on ? "added" : ""), onclick: function () { S.mods[m.id] = !on; save(); render(); } }, on ? "✓ Added" : "+ Add")),
          h("p", { style: "font-size:12.5px;color:var(--muted);" }, m.desc)
        );
      }));
    },
    clips: function () { return h("div", { class: "card", style: "text-align:center;padding:48px;" }, h("h3", null, "No replay clips yet"), h("p", { style: "color:var(--muted);margin-top:6px;" }, "Press F9 in-game to capture highlights.")); },
    social: function () {
      var inp = h("input", { placeholder: "Send a message..." });
      return h("div", { class: "card" },
        h("h3", { style: "margin-bottom:12px;" }, "Messages"),
        S.messages.map(function (m) { return h("p", { style: "margin-bottom:6px;" }, h("b", { style: "color:var(--accent);" }, m.from + ": "), m.text); }),
        h("div", { style: "display:flex;gap:8px;margin-top:12px;" }, inp, h("button", { class: "btn primary", onclick: function () { if (!inp.value) return; S.messages.push({ from: S.name, text: inp.value }); inp.value = ""; save(); render(); } }, "Send"))
      );
    },
    wardrobe: function () {
      var inp = h("input", { placeholder: "Minecraft username" });
      return h("div", { class: "wardrobe-layout" },
        h("div", { class: "wardrobe-stage" },
          h("b", null, S.name),
          h("img", { src: "favicon.svg", style: "height:140px;margin:20px 0;" }),
          h("div", { class: "pose-bar" }, ["Idle", "Walk", "Run", "Wave", "Crouch"].map(function (p) {
            return h("button", { class: "pose-btn" + (S.pose === p ? " active" : ""), onclick: function () { S.pose = p; render(); } }, p);
          }))
        ),
        h("div", { class: "card" }, h("b", null, "Player Identity"), h("div", { style: "display:flex;gap:8px;margin-top:10px;" }, inp, h("button", { class: "btn primary", onclick: function () { if (!inp.value) return; S.name = inp.value; save(); render(); } }, "Save")))
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
    var route = (location.hash || "#/home").replace(/^#\//, "");
    if (!pages[route]) route = "home";
    document.querySelectorAll("#topnav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-route") === route); });
    var v = document.getElementById("view");
    if (v) { v.innerHTML = ""; v.append(pages[route]()); }
    var u = document.getElementById("navUsername");
    if (u) u.textContent = S.name;
  }

  window.addEventListener("hashchange", render);
  render();
})();
