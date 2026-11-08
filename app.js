(function () {
  "use strict";
  var C = window.DEEPSLATE_CONFIG || {};
  var KEY = "deepslate.v26";
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
    setTimeout(function () { t.remove(); }, 2500);
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
    return { id: uid(), name: name || "Player", status: "", bio: "", model: "Classic", skin: "", friends: [{ name: "CruxIsDumb", note: "Client Owner" }] };
  }

  var p0 = makeProf("Player");
  var S = JSON.parse(localStorage.getItem(KEY) || "null") || {
    profiles: [p0], activeId: p0.id, accent: "periwinkle", extraDark: false,
    version: C.DEFAULT_VERSION || "1.21.11", inst: "My instance 1", mods: { "fps-boost": true, "zoom": true },
    filter: "All", search: "", servers: [{ name: "ArchMC", ip: "wss://mc.arch.lol" }, { name: "ZythMC", ip: "wss://play.zyth.me" }],
    pose: "Idle", stTab: "My account", perfMode: false
  };
  if (!Array.isArray(S.profiles) || !S.profiles.length) { var x = makeProf("Player"); S.profiles = [x]; S.activeId = x.id; }
  function prof() { return S.profiles.filter(function (p) { return p.id === S.activeId; }).pop() || S.profiles.slice(0, 1).pop(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function go(r) { route = r; render(); }

  function launch(ip) {
    var url = (C.GAME_URL || "").trim();
    if (!url) {
      modal("Engine Ready", h("p", { style: "color:var(--muted);font-size:13px;" }, "Deepslate " + S.version + " (" + prof().name + ")" + (ip ? " -> " + ip : "") + " is ready. Set GAME_URL in config.js to '/game/index.html'."),
        function (close) { return [h("button", { class: "btn primary", onclick: close }, "Got it")]; });
      return;
    }
    var mOn = Object.keys(S.mods).filter(function (k) { return S.mods[k]; }).join(",");
    var fullUrl = url + "?deepslateVersion=" + encodeURIComponent(S.version) + "&username=" + encodeURIComponent(prof().name) + "&deepslateMods=" + encodeURIComponent(mOn) + (ip ? "&server=" + encodeURIComponent(ip) : "");
    var g = h("div", { class: "game" },
      h("div", { class: "bar" }, h("button", { class: "btn", onclick: function () { g.remove(); } }, "Exit"), h("b", null, "Deepslate " + S.version + " · " + prof().name)),
      h("iframe", { src: fullUrl, allow: "fullscreen; autoplay; gamepad; pointer-lock", allowfullscreen: "true" })
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
            h("button", { class: "play-main", onclick: function () { launch(); } }, h("strong", null, "PLAY " + S.version), h("span", null, (S.perfMode ? "PERFORMANCE" : "STANDARD") + " ENGINE · READY")),
            h("button", { class: "play-drop", onclick: function () { S.version = S.version === "1.21.11" ? "1.8.8" : "1.21.11"; save(); toast("Version: " + S.version); render(); } }, "⌄")
          ),
          h("div", { class: "hero-sub" }, count + " mods on · ", h("button", { onclick: function () { go("mods"); } }, "Manage mods"), " · ", h("button", { onclick: function () { go("servers"); } }, "Servers")),
          h("div", { class: "hero-stats" }, h("span", null, h("b", null, "27"), " playing right now"), h("span", null, h("b", null, "1,000"), " in the last 24 hours"))
        ),
        h("div", { class: "partner-bar" },
          h("div", null, h("b", null, "Top servers"), h("small", { style: "display:block;color:var(--muted);" }, "Featured community servers ready for one-click join.")),
          h("button", { class: "btn", onclick: function () { go("servers"); } }, "Browse servers")
        ),
        h("div", { class: "home-bottom" },
          h("div", null,
            h("h3", { style: "font-size:15px;margin-bottom:10px;" }, "Recent news"),
            h("div", { class: "news-grid" },
              h("div", { class: "card" }, h("small", { style: "color:var(--muted);" }, "Nov 8"), h("b", { style: "display:block;margin:6px 0;" }, "Deepslate Launcher"), h("p", { style: "font-size:12.5px;color:var(--muted);" }, "Single-page launcher with mod toggles, 3D wardrobe, and profiles.")),
              h("div", { class: "card" }, h("small", { style: "color:var(--muted);" }, "Nov 5"), h("b", { style: "display:block;margin:6px 0;" }, "Chromebook Ready"), h("p", { style: "font-size:12.5px;color:var(--muted);" }, "Enable Performance mode in Settings for smoother frame rates.")),
              h("div", { class: "card" }, h("small", { style: "color:var(--muted);" }, "Nov 1"), h("b", { style: "display:block;margin:6px 0;" }, "Custom Skins"), h("p", { style: "font-size:12.5px;color:var(--muted);" }, "Upload any 64x64 PNG skin in the Wardrobe tab."))
            )
          ),
          h("div", { style: "display:flex;flex-direction:column;gap:12px;" },
            h("div", { class: "card" },
              h("div", { style: "display:flex;justify-content:space-between;align-items:center;" },
                h("b", null, "Live players"),
                h("span", { style: "color:var(--green,#3ddc97);font-weight:800;" }, "27")
              ),
              h("small", { style: "color:var(--muted);" }, "In Deepslate right now")
            ),
            h("div", { class: "card" },
              h("b", { style: "display:block;margin-bottom:6px;" }, "Friends"),
              prof().friends.map(function (f) {
                return h("div", { style: "font-size:12.5px;display:flex;align-items:center;justify-content:space-between;padding:4px 0;" },
                  h("span", null, f.name, badge(f.name)),
                  h("small", { style: "color:var(--muted);" }, f.note || "Online")
                );
              })
            )
          )
        ),
        h("div", { class: "card", style: "margin-top:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;" },
          h("div", null,
            h("b", { style: "font-size:15px;" }, DEFAULT_MODS.length + " built-in mods, one click each"),
            h("small", { style: "display:block;color:var(--muted);" }, "Performance, shaders, PvP hitboxes, and HUD tweaks.")
          ),
          h("button", { class: "btn primary", onclick: function () { go("mods"); } }, "Open Mods")
        )
      );
    },

    mods: function () {
      var cats = ["All", "Performance", "Visuals", "Utility", "PvP", "HUD"];
      var list = DEFAULT_MODS.filter(function (m) {
Use code with caution.
var matchCat = S.filter === "All" || m.category === S.filter;
var matchSearch = !S.search || m.name.toLowerCase().indexOf(S.search.toLowerCase()) !== -1;
return matchCat && matchSearch;
});
return h("div", null,
h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;" },
h("h2", { style: "font-size:20px;" }, "Mods"),
h("input", {
type: "text",
placeholder: "Search mods...",
value: S.search,
oninput: function (e) { S.search = e.target.value; render(); }
})
),
h("div", { style: "display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;" },
cats.map(function (c) {
return h("button", {
class: "btn" + (S.filter === c ? " primary" : ""),
onclick: function () { S.filter = c; render(); }
}, c);
})
),
h("div", { class: "news-grid" },
list.map(function (m) {
var active = !!S.mods[m.id];
return h("div", { class: "card", style: "display:flex;flex-direction:column;justify-content:space-between;gap:12px;" },
h("div", null,
h("div", { style: "display:flex;justify-content:space-between;align-items:center;" },
h("b", null, m.name),
h("small", { style: "color:var(--muted);" }, m.category)
),
h("p", { style: "font-size:12.5px;color:var(--muted);margin-top:6px;" }, m.desc)
),
h("button", {
class: "btn" + (active ? " primary" : ""),
onclick: function () {
S.mods[m.id] = !active;
save();
toast(m.name + (S.mods[m.id] ? " enabled" : " disabled"));
render();
}
}, active ? "Enabled" : "Disabled")
);
})
)
);
},
wardrobe: function () {
var p = prof();
var canvas = h("canvas", { width: "260", height: "340", style: "background:rgba(255,255,255,0.02);border-radius:12px;" });
setTimeout(function () {
if (window.skinview3d) {
viewer = new window.skinview3d.SkinViewer({
canvas: canvas,
width: 260,
height: 340,
skin: p.skin || "minecraft.net"
});
}
}, 20);
var fileInp = h("input", {
type: "file",
accept: "image/png",
style: "display:none;",
onchange: function (e) {
var f = e.target.files[0];
if (!f) return;
var r = new FileReader();
r.onload = function () {
p.skin = r.result;
save();
toast("Skin updated!");
render();
};
r.readAsDataURL(f);
}
});
return h("div", { style: "display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;" },
h("div", { class: "card", style: "text-align:center;" }, canvas),
h("div", { class: "card", style: "flex:1;min-width:260px;" },
h("h2", { style: "font-size:18px;margin-bottom:8px;" }, "Wardrobe · ", p.name, badge(p.name)),
h("p", { style: "font-size:13px;color:var(--muted);margin-bottom:16px;" }, "Upload a 64x64 Minecraft PNG skin to preview and use in-game."),
fileInp,
h("div", { style: "display:flex;gap:10px;flex-wrap:wrap;" },
h("button", { class: "btn primary", onclick: function () { fileInp.click(); } }, "Upload Skin PNG"),
p.skin ? h("button", { class: "btn", onclick: function () { p.skin = ""; save(); toast("Reset to default skin"); render(); } }, "Reset Skin") : null
)
)
);
},
settings: function () {
var p = prof();
return h("div", { style: "display:flex;flex-direction:column;gap:16px;max-width:600px;" },
h("div", { class: "card" },
h("h3", { style: "margin-bottom:10px;" }, "Profile"),
h("div", { style: "display:flex;justify-content:space-between;align-items:center;" },
h("div", null, h("b", null, p.name), badge(p.name)),
h("button", {
class: "btn",
onclick: function () {
ask("Change Username", p.name, "Username", function (val) {
if (val.trim()) { p.name = val.trim(); save(); render(); }
});
}
}, "Edit Name")
)
),
h("div", { class: "card" },
h("h3", { style: "margin-bottom:10px;" }, "Client Settings"),
h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;" },
h("span", null, "Performance Mode"),
h("button", {
class: "btn" + (S.perfMode ? " primary" : ""),
onclick: function () { S.perfMode = !S.perfMode; save(); render(); }
}, S.perfMode ? "On" : "Off")
),
h("div", { style: "display:flex;justify-content:space-between;align-items:center;" },
h("span", null, "Accent Color"),
h("div", { style: "display:flex;gap:8px;" },
Object.keys(ACCENTS).map(function (k) {
return h("button", {
style: "width:22px;height:22px;border-radius:50%;border:2px solid " + (S.accent === k ? "#fff" : "transparent") + ";background:" + ACCENTS[k] + ";cursor:pointer;",
onclick: function () { S.accent = k; save(); render(); }
});
})
)
)
)
);
},
servers: function () {
return h("div", null,
h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;" },
h("h2", { style: "font-size:20px;" }, "Servers"),
h("button", {
class: "btn primary",
onclick: function () {
ask("Add Server IP", "", "wss://example.com", function (ip) {
if (ip.trim()) {
S.servers.push({ name: ip.trim(), ip: ip.trim() });
save();
render();
}
});
}
}, "+ Add Server")
),
h("div", { style: "display:flex;flex-direction:column;gap:10px;" },
S.servers.map(function (srv, idx) {
return h("div", { class: "card", style: "display:flex;justify-content:space-between;align-items:center;" },
h("div", null,
h("b", { style: "display:block;" }, srv.name),
h("small", { style: "color:var(--muted);" }, srv.ip)
),
h("div", { style: "display:flex;gap:8px;" },
h("button", { class: "btn primary", onclick: function () { launch(srv.ip); } }, "Join"),
h("button", { class: "btn", onclick: function () { S.servers.splice(idx, 1); save(); render(); } }, "Remove")
)
);
})
)
);
}
};
function render() {
var accentHex = ACCENTS[S.accent] || ACCENTS.periwinkle;
document.documentElement.style.setProperty("--accent", accentHex);
var uEl = document.getElementById("navUsername");
if (uEl) uEl.textContent = prof().name;
var navBtns = document.querySelectorAll("[data-route]");
navBtns.forEach(function (btn) {
if (btn.getAttribute("data-route") === route) btn.classList.add("active");
else btn.classList.remove("active");
});
var view = document.getElementById("view");
if (!view) return;
view.innerHTML = "";
var pageFn = pages[route] || pages.home;
view.append(pageFn());
}
document.addEventListener("click", function (e) {
var btn = e.target.closest("[data-route]");
if (btn) {
e.preventDefault();
go(btn.getAttribute("data-route"));
}
});
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", render);
} else {
render();
}
})();
