/* Deepslate Client - Complete Chromium-style Launcher Logic */
(function () {
  "use strict";
  var C = window.DEEPSLATE_CONFIG || {};
  var KEY = "deepslate.v4";
  var ACCENTS = { green: "#3ddc97", blue: "#4aa8ff", purple: "#a78bfa", orange: "#ffa94d" };

  /* ---------- tiny DOM & UI helpers ---------- */
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function h(tag, props) {
    var e = document.createElement(tag), kids = Array.prototype.slice.call(arguments, 2);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (k === "class") e.className = v;
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), v);
      else if (k === "checked" || k === "value" || k === "disabled") e[k] = v;
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, v);
    });
    (function add(list) {
      list.forEach(function (c) {
        if (Array.isArray(c)) return add(c);
        if (c == null || c === false) return;
        e.append(c.nodeType ? c : document.createTextNode(String(c)));
      });
    })(kids);
    return e;
  }

  function toast(msg) {
    var box = document.getElementById("toasts");
    if (!box) return;
    var t = h("div", { class: "toast" }, msg);
    box.append(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function copy(text) {
    function fallback() {
      var ta = h("textarea", { style: "position:fixed;opacity:0" }); ta.value = text;
      document.body.append(ta); ta.select();
      try { document.execCommand("copy"); toast("Copied: " + text); } catch (e) { toast("Could not copy"); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(text).then(function () { toast("Copied: " + text); }, fallback);
    else fallback();
  }

  /* ---------- persistent browser state ---------- */
  function defaults() {
    var i = {
      id: uid(),
      name: "Chromium PvP Profile",
      version: C.DEFAULT_VERSION || C.VERSION || "1.21.11",
      mods: { "fps-boost": true, "zoom": true, "fps-hud": true }
    };
    return {
      instances: [i],
      active: i.id,
      modpacks: [
        { id: "mp-pvp", name: "Competitive PvP Pack", desc: "Sodium FPS, Keystrokes, CPS, Armor HUD & Hitboxes", mods: ["fps-boost", "keystrokes", "cps", "armor-hud", "hitboxes"] },
        { id: "mp-fps", name: "Ultra Chromebook FPS", desc: "Maximum frame rate optimization for low-end devices", mods: ["fps-boost", "fps-hud"] },
        { id: "mp-survival", name: "Clean Survival+", desc: "Zoom, Fullbright, and FPS HUD without clutter", mods: ["fps-boost", "zoom", "fullbright", "fps-hud"] }
      ],
      servers: (C.FEATURED_SERVERS || []).map(function (s) {
        return { id: uid(), name: s.name, ip: s.ip, version: s.version || "1.8 - 1.21", featured: true };
      }),
      activity: [],
      streak: { count: 1, lastDay: new Date().toDateString() },
      profile: { name: "DeepslatePlayer", cape: "deepslate", about: "Playing in the browser." },
      settings: { accent: "green", reduceMotion: false, performanceMode: false, launchMode: "inline", confirmDeletes: true }
    };
  }

  var S = (function () {
    var d = defaults();
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && typeof raw === "object") {
        Object.keys(d).forEach(function (k) { if (raw[k] != null) d[k] = raw[k]; });
        d.settings = Object.assign(defaults().settings, raw.settings || {});
        d.profile = Object.assign(defaults().profile, raw.profile || {});
      }
    } catch (e) {}
    if (!Array.isArray(d.instances) || !d.instances.length) {
      var x = defaults(); d.instances = x.instances; d.active = x.active;
    }
    if (!d.instances.some(function (i) { return i.id === d.active; })) {
      d.active = d.instances[0].id;
    }
    return d;
  })();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Storage unavailable"); }
  }
  function log(text) {
    S.activity.unshift({ t: Date.now(), text: text });
    S.activity = S.activity.slice(0, 10);
    save();
  }
  function inst() {
    var matches = S.instances.filter(function (i) { return i.id === S.active; });
    return matches[0] || S.instances[0];
  }
  function confirmDel(msg) {
    return !S.settings.confirmDeletes || window.confirm(msg);
  }

  /* ---------- game connection & Chromium launch bubble ---------- */
  function getVersionObj(verId) {
    var id = verId || inst().version || C.DEFAULT_VERSION || C.VERSION;
    var found = (C.VERSIONS || []).filter(function (v) { return v.id === id; });
    return found[0] || { id: id, label: id, url: C.GAME_URL || "" };
  }

  function resolveGameUrl(verId) {
    var vObj = getVersionObj(verId);
    var raw = (vObj.url || C.GAME_URL || "").trim();
    if (!raw) return null;
    try {
      var u = new URL(raw, location.href);
      if (u.origin !== location.origin && u.protocol !== "https:") return null;
      return u;
    } catch (e) { return null; }
  }

  function engineReady() {
    return !!resolveGameUrl();
  }

  function modsEnabledForGame() {
    if (!C.ENGINE || !C.ENGINE.supportsModLoading) return [];
    var m = inst().mods || {};
    return (C.MODS || []).filter(function (x) { return x.status === "compatible" && m[x.id]; });
  }

  function launch(opts) {
    opts = opts || {};
    var verId = opts.version || inst().version || C.DEFAULT_VERSION || C.VERSION;
    var u = resolveGameUrl(verId);
    if (!u) return notConnected(verId, opts.serverIp);

    var mods = modsEnabledForGame();
    u.searchParams.set("deepslateVersion", verId);
    u.searchParams.set("username", S.profile.name || "Player");
    if (mods.length) u.searchParams.set("deepslateMods", mods.map(function (m) { return m.id; }).join(","));
    if (opts.serverIp) u.searchParams.set("server", opts.serverIp);

    var start = Date.now();
    var bubble = h("div", {
      style: "position:fixed;bottom:20px;right:20px;z-index:9999;background:#11171a;border:1px solid #2b3940;padding:12px 16px;border-radius:12px;display:flex;align-items:center;gap:12px;box-shadow:0 12px 32px rgba(0,0,0,.6);color:#fff;font-size:13px;"
    },
      h("span", { style: "width:10px;height:10px;border-radius:50%;background:var(--accent,#3ddc97);display:inline-block;" }),
      h("div", null,
        h("b", { style: "display:block;" }, "Launching " + inst().name + " (" + verId + ")"),
        h("small", { id: "dsLaunchTimer", style: "color:#90a4ae;" }, "Preparing WASM assets... 0.0s")
      )
    );
    document.body.append(bubble);

    var timer = setInterval(function () {
      var elapsed = ((Date.now() - start) / 1000).toFixed(1);
      var el = document.getElementById("dsLaunchTimer");
      if (el) el.textContent = "Loading engine & " + mods.length + " mods... " + elapsed + "s";
    }, 100);

    setTimeout(function () {
      clearInterval(timer);
      bubble.remove();
      log("Launched Minecraft " + verId + (opts.serverIp ? " -> " + opts.serverIp : " (" + inst().name + ")"));
      if (S.settings.launchMode === "tab") {
        window.open(u.href, "_blank", "noopener");
      } else {
        showGame(u, mods, verId);
      }
    }, 1100);
  }

  function notConnected(verId, serverIp) {
    var close = function () { bg.remove(); };
    var bg = h("div", { class: "modal-bg", onclick: function (e) { if (e.target === bg) close(); } },
      h("div", { class: "modal", role: "dialog", "aria-modal": "true" },
        h("h3", null, "Game engine build not linked yet"),
        h("p", null, "Your launcher, " + modsEnabledForGame().length + " active mods, and profile (" + S.profile.name + ") are ready for Minecraft " + verId + (serverIp ? " (" + serverIp + ")" : "") + "."),
        h("p", null, "To make Play boot the game in-browser, upload your Eaglercraft/WASM build into /game/ in your repo and set url: \"/game/index.html\" in config.js."),
        h("div", { class: "acts" }, h("button", { class: "btn primary", onclick: close }, "Got it"))
      )
    );
    document.getElementById("overlay").append(bg);
  }

  function showGame(u, mods, verId) {
    var ov = document.getElementById("overlay");
    var frame = h("iframe", {
      src: u.href,
      title: "Minecraft " + verId,
      allow: "fullscreen; autoplay; gamepad; clipboard-write; pointer-lock",
      allowfullscreen: true
    });
    frame.addEventListener("load", function () {
      try {
        frame.contentWindow.postMessage({
          type: "deepslate:init",
          version: verId,
          username: S.profile.name,
          cape: S.profile.cape,
          mods: mods.map(function (m) { return m.id; })
        }, u.origin);
      } catch (e) {}
    });
    var g = h("div", { class: "game" },
      h("div", { class: "bar" },
        h("button", { class: "btn sm", onclick: function () { g.remove(); } }, "← Exit to Launcher"),
        h("b", null, "Minecraft " + verId + " · " + inst().name + " (" + mods.length + " mods)"),
        h("button", { class: "btn sm", onclick: function () { if (g.requestFullscreen) g.requestFullscreen(); } }, "Fullscreen"),
        h("a", { class: "btn sm", href: u.href, target: "_blank", rel: "noopener" }, "New Tab")
      ),
      frame
    );
    ov.append(g);
  }

  function exportOfflineHtml() {
    var snapshot = JSON.stringify(S);
    var openScript = "<" + "script>";
    var closeScript = "<" + "/script>";
    var html = "<!doctype html><html><head><meta charset='utf-8'><title>Deepslate Client Offline</title></head>" +
      "<body style='background:#0a0e10;color:#fff;font-family:sans-serif;padding:2rem;'>" +
      "<h2>Deepslate Client — Offline Backup</h2>" +
      "<p>Player: <b>" + S.profile.name + "</b> · Instance: <b>" + inst().name + "</b></p>" +
      "<p>Your instances, mod toggles, and server list are embedded below.</p>" +
Use code with caution.
"" + JSON.stringify(S, null, 2) + "" +
openScript + "localStorage.setItem('" + KEY + "'," + JSON.stringify(snapshot) + ");" + closeScript +
"";
var blob = new Blob([html], { type: "text/html" });
var a = h("a", { href: URL.createObjectURL(blob), download: "deepslate-offline-" + (C.APP_VERSION || "0.4.0") + ".html" });
document.body.append(a);
a.click();
a.remove();
toast("Exported offline client HTML");
}
/* ---------- pages ---------- */
var pages = {};
pages.home = function () {
var activeInst = inst();
var enabledCount = Object.keys(activeInst.mods || {}).filter(function (k) { return activeInst.mods[k]; }).length;
var instSel = h("select", {
"aria-label": "Instance",
onchange: function () { S.active = instSel.value; save(); toast("Switched to " + inst().name); render(); }
}, S.instances.map(function (i) {
return h("option", { value: i.id, selected: i.id === S.active }, i.name);
}));
var verSel = h("select", {
"aria-label": "Minecraft Version",
onchange: function () { activeInst.version = verSel.value; save(); toast("Version: " + verSel.value); render(); }
}, (C.VERSIONS || [{ id: C.VERSION || "1.21.11", label: C.VERSION || "1.21.11" }]).map(function (v) {
return h("option", { value: v.id, selected: v.id === (activeInst.version || C.DEFAULT_VERSION) }, v.label);
}));
return h("div", null,
h("section", { class: "hero" },
h("div", { class: "logo" }, svgLogo(76)),
h("h2", null, "DEEP", h("span", null, "SLATE")),
h("p", null, "Browser-based Minecraft client with instant mod toggles and one-click server join."),
h("button", { class: "play", onclick: function () { launch(); } }, "▶ PLAY " + (activeInst.version || C.DEFAULT_VERSION || "1.21.11")),
h("div", { class: "hero-row" },
h("span", { class: "chip" }, "Version:"), verSel,
h("span", { class: "chip" }, "Profile:"), instSel,
h("button", { class: "btn sm", onclick: exportOfflineHtml }, "↓ Offline HTML")
)
),
!engineReady() ? h("div", { class: "banner" },
h("b", null, "Engine link pending: "),
"Set your hosted Eaglercraft/WASM build path in ", h("code", null, "config.js"), " to boot directly in this tab."
) : null,
h("div", { class: "grid g3" },
stat(enabledCount + " / " + (C.MODS || []).length, "active client mods"),
stat(S.servers.length, "quick-join servers"),
stat(S.streak.count + " day" + (S.streak.count === 1 ? "" : "s"), "play streak")
),
h("h3", { style: "margin:24px 0 10px" }, "Quick-Join Servers"),
h("div", { class: "list" }, S.servers.slice(0, 3).map(function (srv) {
return h("div", { class: "row" },
h("div", { class: "grow" }, h("b", null, srv.name), h("small", null, srv.ip + " · " + srv.version)),
h("button", { class: "btn sm", onclick: function () { copy(srv.ip); } }, "Copy IP"),
h("button", { class: "btn sm primary", onclick: function () { launch({ serverIp: srv.ip }); } }, "▶ Join")
);
})),
h("h3", { style: "margin:24px 0 10px" }, "Recent activity"),
S.activity.length ? h("div", { class: "list" }, S.activity.map(function (a) {
return h("div", { class: "row" }, h("div", { class: "grow" }, a.text, h("small", null, new Date(a.t).toLocaleString())));
})) : h("div", { class: "empty" }, "No activity yet. Launches and mod changes appear here.")
);
};
pages.instances = function () {
var nameIn = h("input", { type: "text", placeholder: "New profile name (e.g. Bedwars 1.8.8)" });
var verIn = h("select", null, (C.VERSIONS || [{ id: C.VERSION || "1.21.11", label: C.VERSION || "1.21.11" }]).map(function (v) {
return h("option", { value: v.id }, v.label);
}));
function createInst() {
var n = nameIn.value.trim();
if (!n) return toast("Enter an instance name");
var item = { id: uid(), name: n, version: verIn.value, mods: { "fps-boost": true } };
S.instances.push(item);
S.active = item.id;
log("Created instance: " + n);
render();
}
return h("div", null,
h("div", { class: "card", style: "margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;" },
nameIn, verIn,
h("button", { class: "btn primary", onclick: createInst }, "+ Create Instance")
),
h("div", { class: "list" }, S.instances.map(function (i) {
var isAct = i.id === S.active;
var modCount = Object.keys(i.mods || {}).filter(function (k) { return i.mods[k]; }).length;
return h("div", { class: "row" },
h("div", { class: "grow" },
h("b", null, i.name + (isAct ? " (Active)" : "")),
h("small", null, "Version " + (i.version || C.DEFAULT_VERSION) + " · " + modCount + " mods enabled")
),
!isAct ? h("button", { class: "btn sm", onclick: function () { S.active = i.id; save(); render(); } }, "Select") : null,
h("button", { class: "btn sm primary", onclick: function () { S.active = i.id; save(); launch(); } }, "▶ Play"),
S.instances.length > 1 ? h("button", {
class: "btn sm",
onclick: function () {
if (!confirmDel("Delete " + i.name + "?")) return;
S.instances = S.instances.filter(function (x) { return x.id !== i.id; });
if (S.active === i.id) S.active = S.instances[0].id;
save(); render();
}
}, "Delete") : null
);
}))
);
};
pages.mods = function () {
var activeInst = inst();
activeInst.mods = activeInst.mods || {};
return h("div", null,
h("p", { style: "margin-bottom:14px;opacity:.85" },
"Toggle built-in client modules for ", h("b", null, activeInst.name), ". Changes save automatically."
),
h("div", { class: "grid g3" }, (C.MODS || []).map(function (m) {
var on = !!activeInst.mods[m.id];
return h("div", { class: "card", style: "display:flex;flex-direction:column;justify-content:space-between;gap:12px;" },
h("div", null,
h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;" },
h("b", null, m.name),
h("span", { class: "chip" }, m.category)
),
h("p", { style: "font-size:13px;opacity:.8;margin:0;" }, m.desc)
),
h("button", {
class: "btn sm" + (on ? " primary" : ""),
onclick: function () {
activeInst.mods[m.id] = !on;
log((!on ? "Enabled " : "Disabled ") + m.name);
render();
}
}, on ? "✓ Enabled" : "Enable Module")
);
}))
);
};
pages.modpacks = function () {
return h("div", null,
h("p", { style: "margin-bottom:14px;opacity:.85" }, "One-click presets that configure your active instance's mods."),
h("div", { class: "grid g3" }, S.modpacks.map(function (mp) {
return h("div", { class: "card", style: "display:flex;flex-direction:column;justify-content:space-between;gap:12px;" },
h("div", null,
h("b", null, mp.name),
h("p", { style: "font-size:13px;opacity:.8;margin:6px 0;" }, mp.desc),
h("small", null, mp.mods.length + " included mods")
),
h("button", {
class: "btn sm primary",
onclick: function () {
var nextMods = {};
mp.mods.forEach(function (id) { nextMods[id] = true; });
inst().mods = nextMods;
log("Applied modpack: " + mp.name);
toast("Applied " + mp.name + " to " + inst().name);
render();
}
}, "Apply to " + inst().name)
);
}))
);
};
pages.servers = function () {
var nameIn = h("input", { type: "text", placeholder: "Server Name" });
var ipIn = h("input", { type: "text", placeholder: "Server IP (e.g. play.hypixel.net)" });
function addServer() {
var ip = ipIn.value.trim();
if (!ip) return toast("Enter a server IP");
S.servers.unshift({ id: uid(), name: nameIn.value.trim() || ip, ip: ip, version: inst().version || "1.21.11" });
log("Added server: " + ip);
render();
}
return h("div", null,
h("div", { class: "card", style: "margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;" },
nameIn, ipIn,
h("button", { class: "btn primary", onclick: addServer }, "+ Add Server")
),
h("div", { class: "list" }, S.servers.map(function (srv) {
var shareLink = location.origin + location.pathname + "?play=" + encodeURIComponent(srv.ip);
return h("div", { class: "row" },
h("div", { class: "grow" },
h("b", null, srv.name),
h("small", null, srv.ip + " · " + srv.version)
),
h("button", { class: "btn sm", onclick: function () { copy(shareLink); } }, "Share Link"),
h("button", { class: "btn sm", onclick: function () { copy(srv.ip); } }, "Copy IP"),
h("button", { class: "btn sm primary", onclick: function () { launch({ serverIp: srv.ip }); } }, "▶ Play"),
!srv.featured ? h("button", {
class: "btn sm",
onclick: function () {
S.servers = S.servers.filter(function (x) { return x.id !== srv.id; });
save(); render();
}
}, "×") : null
);
}))
);
};
pages.profile = function () {
var nameIn = h("input", { type: "text", value: S.profile.name, placeholder: "In-game username" });
var capeSel = h("select", null,
["deepslate", "chromium-dark", "emerald", "migrator", "none"].map(function (c) {
return h("option", { value: c, selected: S.profile.cape === c }, "Cape: " + c.toUpperCase());
})
);
var skinUrl = "mc-heads.net" + encodeURIComponent(S.profile.name || "Steve") + "/140";
return h("div", { class: "grid g2" },
h("div", { class: "card", style: "text-align:center;" },
h("img", { src: skinUrl, alt: "Player skin preview", style: "height:180px;margin:0 auto 12px;image-rendering:pixelated;" }),
h("h3", null, S.profile.name),
h("small", null, "Selected Cape: " + (S.profile.cape || "none").toUpperCase())
),
h("div", { class: "card", style: "display:flex;flex-direction:column;gap:12px;" },
h("h3", null, "Wardrobe & Identity"),
h("label", null, "Username"), nameIn,
h("label", null, "Client Cape"), capeSel,
h("button", {
class: "btn primary",
onclick: function () {
S.profile.name = nameIn.value.trim() || "Player";
S.profile.cape = capeSel.value;
log("Updated profile: " + S.profile.name);
toast("Profile & Wardrobe saved");
render();
}
}, "Save Profile")
)
);
};
pages.settings = function () {
return h("div", { class: "list" },
h("div", { class: "row" },
h("div", { class: "grow" }, h("b", null, "Accent Color"), h("small", null, "Customize launcher highlight theme")),
Object.keys(ACCENTS).map(function (k) {
return h("button", {
class: "btn sm" + (S.settings.accent === k ? " primary" : ""),
onclick: function () { S.settings.accent = k; applyTheme(); save(); render(); }
}, k.toUpperCase());
})
),
h("div", { class: "row" },
h("div", { class: "grow" }, h("b", null, "Launch Mode"), h("small", null, "Open game inside launcher overlay or a new browser tab")),
h("button", {
class: "btn sm",
onclick: function () {
S.settings.launchMode = S.settings.launchMode === "inline" ? "tab" : "inline";
save(); render();
}
}, S.settings.launchMode === "inline" ? "Inline Overlay" : "New Tab")
),
h("div", { class: "row" },
h("div", { class: "grow" }, h("b", null, "Chromebook Performance Mode"), h("small", null, "Disables ambient blur effects for higher FPS")),
h("button", {
class: "btn sm" + (S.settings.performanceMode ? " primary" : ""),
onclick: function () {
S.settings.performanceMode = !S.settings.performanceMode;
applyTheme(); save(); render();
}
}, S.settings.performanceMode ? "ON" : "OFF")
),
h("div", { class: "row" },
h("div", { class: "grow" }, h("b", null, "Offline Client Bundle"), h("small", null, "Download a standalone HTML snapshot of your setup")),
h("button", { class: "btn sm primary", onclick: exportOfflineHtml }, "Download .HTML")
)
);
};
function stat(n, label) { return h("div", { class: "card stat" }, h("b", null, n), h("span", null, label)); }
function svgLogo(s) {
return h("img", {
src: "minecraft.wiki",
alt: "Deepslate",
style: "width:" + s + "px;height:" + s + "px;image-rendering:pixelated;"
});
}
/* ---------- Command Palette (Cmd+K / Ctrl+K) ---------- */
function openCommandPalette() {
var close = function () { bg.remove(); };
var input = h("input", { type: "text", placeholder: "Type a command (Play, Mods, Servers, Export)...", autofocus: true });
var actions = [
{ label: "▶ Launch Active Instance (" + inst().name + ")", run: function () { close(); launch(); } },
{ label: "🧩 Toggle Client Mods", run: function () { close(); location.hash = "#/mods"; } },
{ label: "🌐 Browse & Join Servers", run: function () { close(); location.hash = "#/servers"; } },
{ label: "🧥 Open Wardrobe & Skin Preview", run: function () { close(); location.hash = "#/profile"; } },
{ label: "↓ Download Offline HTML Client", run: function () { close(); exportOfflineHtml(); } }
];
var list = h("div", { class: "list", style: "margin-top:12px;" });
function draw(q) {
list.innerHTML = "";
actions.filter(function (a) { return a.label.toLowerCase().indexOf((q || "").toLowerCase()) !== -1; })
.forEach(function (a) {
list.append(h("div", { class: "row", style: "cursor:pointer;", onclick: a.run }, h("b", null, a.label)));
});
}
input.addEventListener("input", function () { draw(input.value); });
draw("");
var bg = h("div", { class: "modal-bg", onclick: function (e) { if (e.target === bg) close(); } },
h("div", { class: "modal" }, input, list)
);
document.getElementById("overlay").append(bg);
setTimeout(function () { input.focus(); }, 20);
}
/* ---------- Router & Boot ---------- */
var TITLES = {
home: "Overview",
instances: "Instances",
mods: "Mod Library",
modpacks: "Modpacks",
servers: "Servers",
profile: "Wardrobe & Profile",
settings: "Settings"
};
function applyTheme() {
var col = ACCENTS[S.settings.accent] || ACCENTS.green;
document.documentElement.style.setProperty("--accent", col);
document.querySelectorAll(".ambient").forEach(function (el) {
el.style.display = S.settings.performanceMode ? "none" : "";
});
}
function render() {
var route = (location.hash || "#/home").replace(/^#//, "");
if (!pages[route]) route = "home";
var titleEl = document.getElementById("pageTitle");
if (titleEl) titleEl.textContent = TITLES[route] || "Overview";
var pill = document.getElementById("statusPill");
if (pill) pill.textContent = engineReady() ? "ENGINE READY" : "UI READY";
document.querySelectorAll("#side nav a").forEach(function (a) {
a.classList.toggle("active", a.getAttribute("data-route") === route);
});
var view = document.getElementById("view");
if (view) {
view.innerHTML = "";
view.append(pagesroute);
}
}
var side = document.getElementById("side");
var scrim = document.getElementById("scrim");
var menuBtn = document.getElementById("menuBtn");
if (menuBtn && side && scrim) {
menuBtn.addEventListener("click", function () { side.classList.add("open"); scrim.classList.add("open"); });
scrim.addEventListener("click", function () { side.classList.remove("open"); scrim.classList.remove("open"); });
}
var cmdBtn = document.getElementById("commandHint");
if (cmdBtn) cmdBtn.addEventListener("click", openCommandPalette);
document.addEventListener("keydown", function (e) {
if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
e.preventDefault();
openCommandPalette();
}
});
window.addEventListener("hashchange", render);
applyTheme();
render();
var params = new URLSearchParams(location.search);
var playIp = params.get("play");
if (playIp) {
setTimeout(function () { launch({ serverIp: playIp }); }, 350);
}
})();
