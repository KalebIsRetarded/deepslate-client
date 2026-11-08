/* Deepslate Client - app logic. No backend, no external requests. */
(function () {
  "use strict";
  var C = window.DEEPSLATE_CONFIG;
  var KEY = "deepslate.v3";
  var ACCENTS = { green: "#3ddc97", blue: "#4aa8ff", purple: "#a78bfa", orange: "#ffa94d" };

  /* ---------- tiny helpers ---------- */
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
    var t = h("div", { class: "toast" }, msg);
    document.getElementById("toasts").append(t);
    setTimeout(function () { t.remove(); }, 3200);
  }
  function copy(text) {
    function fallback() {
      var ta = h("textarea", { style: "position:fixed;opacity:0" }); ta.value = text;
      document.body.append(ta); ta.select();
      try { document.execCommand("copy"); toast("Copied to clipboard"); } catch (e) { toast("Could not copy"); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(text).then(function () { toast("Copied to clipboard"); }, fallback);
    else fallback();
  }

  /* ---------- state (stored only in this browser; contains NO game URL) ---------- */
  function defaults() {
    var i = { id: uid(), name: "Default Instance", mods: {} };
    return { instances: [i], active: i.id, modpacks: [], servers: [], activity: [],
      profile: { name: "Guest", about: "" },
      settings: { accent: "green", reduceMotion: false, launchMode: "inline", confirmDeletes: true } };
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
    if (!Array.isArray(d.instances) || !d.instances.length) { var x = defaults(); d.instances = x.instances; d.active = x.active; }
    if (!d.instances.some(function (i) { return i.id === d.active; })) d.active = d.instances[0].id;
    return d;
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Browser storage is unavailable - changes will not be kept."); } }
  function log(text) { S.activity.unshift({ t: Date.now(), text: text }); S.activity = S.activity.slice(0, 8); save(); }
  function inst() { return S.instances.filter(function (i) { return i.id === S.active; })[0]; }
  function confirmDel(msg) { return !S.settings.confirmDeletes || window.confirm(msg); }

  /* ---------- game connection (configured in config.js only) ---------- */
  function gameUrl() {
    var raw = (C.GAME_URL || "").trim();
    if (!raw) return null;
    try {
      var u = new URL(raw, location.href);
      if (u.origin !== location.origin && u.protocol !== "https:") return null;
      return u;
    } catch (e) { return null; }
  }
  function engineReady() { return !!gameUrl(); }
  function modsEnabledForGame() {
    if (!C.ENGINE.supportsModLoading) return [];
    var m = inst().mods;
    return C.MODS.filter(function (x) { return x.status === "compatible" && x.file && m[x.id]; });
  }
  function launch() {
    var u = gameUrl();
    if (!u) return notConnected();
    var mods = modsEnabledForGame();
    u.searchParams.set("deepslateVersion", C.VERSION);
    if (mods.length) u.searchParams.set("deepslateMods", mods.map(function (m) { return m.id; }).join(","));
    log("Launched Minecraft " + C.VERSION + " (" + inst().name + ")");
    if (S.settings.launchMode === "tab") { window.open(u.href, "_blank", "noopener"); return; }
    showGame(u, mods);
  }
  function notConnected() {
    var close = function () { bg.remove(); };
    var bg = h("div", { class: "modal-bg", onclick: function (e) { if (e.target === bg) close(); } },
      h("div", { class: "modal", role: "dialog", "aria-modal": "true" },
        h("h3", null, "Game engine not connected yet"),
        h("p", null, "Deepslate Client is not able to run Minecraft " + C.VERSION + " right now. Nothing has been downloaded or started."),
        h("p", null, "Your settings, instances, mods and servers are still saved and will be ready when the game engine is connected."),
        h("div", { class: "acts" }, h("button", { class: "btn primary", onclick: close }, "OK"))));
    document.getElementById("overlay").append(bg);
  }
  function showGame(u, mods) {
    var ov = document.getElementById("overlay");
    var frame = h("iframe", { src: u.href, title: "Minecraft " + C.VERSION, allow: "fullscreen; autoplay; gamepad; clipboard-write; pointer-lock", allowfullscreen: true });
    if (mods.length) frame.addEventListener("load", function () {
      try { frame.contentWindow.postMessage({ type: "deepslate:mods", version: C.VERSION,
        mods: mods.map(function (m) { return { id: m.id, file: m.file }; }) }, u.origin); } catch (e) {}
    });
    var g = h("div", { class: "game" },
      h("div", { class: "bar" },
        h("button", { class: "btn sm", onclick: function () { g.remove(); } }, "← Exit game"),
        h("b", null, "Minecraft " + C.VERSION + " · " + inst().name),
        h("button", { class: "btn sm", onclick: function () { if (g.requestFullscreen) g.requestFullscreen(); } }, "Fullscreen"),
        h("a", { class: "btn sm", href: u.href, target: "_blank", rel: "noopener" }, "Open in new tab")),
      frame);
    ov.append(g);
  }

  /* ---------- pages ---------- */
  var pages = {};

  pages.home = function () {
    var enabled = Object.keys(inst().mods).filter(function (k) { return inst().mods[k]; }).length;
    var sel = h("select", { "aria-label": "Instance", onchange: function () { S.active = sel.value; save(); toast("Instance: " + inst().name); render(); } },
      S.instances.map(function (i) { return h("option", { value: i.id, selected: i.id === S.active }, i.name); }));
    return h("div", null,
      h("section", { class: "hero" },
        h("div", { class: "logo" }, svgLogo(84)),
        h("h2", null, "DEEP", h("span", null, "SLATE")),
        h("p", null, "A dark, fast Minecraft launcher for your browser. Version " + C.VERSION + " only."),
        h("button", { class: "play", onclick: launch }, "▶ PLAY"),
        h("div", { class: "hero-row" },
          h("span", { class: "chip" }, "Minecraft " + C.VERSION),
          h("span", { class: "chip" }, "Instance:"), sel)),
      !engineReady() ? h("div", { class: "banner" }, h("b", null, "Game engine not connected. "), "The launcher interface is ready, but Minecraft cannot be played until a game engine is connected. Pressing Play will not start a game yet.") : null,
      h("div", { class: "grid g3" },
        stat(enabled, "mods switched on (preference)"), stat(S.servers.length, "saved servers"), stat(S.instances.length, "instances")),
      h("h3", { style: "margin:24px 0 10px" }, "Recent activity"),
      S.activity.length ? h("div", { class: "list" }, S.activity.map(function (a) {
        return h("div", { class: "row" }, h("div", { class: "grow" }, a.text, h("small", null, new Date(a.t).toLocaleString())));
      })) : h("div", { class: "empty" }, "No activity yet. Real launches and changes will appear here."));
  };
  function stat(n, label) { return h("div", { class: "card stat" }, h("b", null, n), h("span", null, label)); }
  function svgLogo(s) {
    var d = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    d.setAttribute("viewBox", "0 0 64 64"); d.setAttribute("width", s); d.setAttribute("height", s);
    d.innerHTML = '<path d="M32 6 56 19v26L32 58 8 45V19z" fill="#232938" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/><path d="M32 6v26m0 0 24-13M32 32 8 19m24 13v26" stroke="var(--accent)" stroke-width="2" opacity=".5"/>';
    return d;
  }

  pages.instances = function () {
    var name = h("input", { type: "text", placeholder: "Instance name", maxlength: "40", "aria-label": "Instance name" });
    var add = function () {
      var n = name.value.trim(); if (!n) return toast("Enter a name first.");
      S.instances.push({ id: uid(), name: n, mods: {} }); save(); log("Created instance " + n); render();
    };
    return h("div", null, head("Instances", "Separate profiles. Each instance keeps its own mod switches."),
      h("div", { class: "form", style: "grid-template-columns:1fr auto" }, name, h("button", { class: "btn primary", onclick: add }, "＋ New instance")),
      h("div", { class: "list" }, S.instances.map(function (i) {
        var on = i.id === S.active, n = Object.keys(i.mods).filter(function (k) { return i.mods[k]; }).length;
        return h("div", { class: "row" },
          h("div", { class: "grow" }, h("b", null, i.name), h("small", null, "Minecraft " + C.VERSION + " · " + n + " mods switched on")),
          on ? h("span", { class: "tag compat" }, "ACTIVE") : null,
          h("div", { class: "acts" },
            on ? null : h("button", { class: "btn sm", onclick: function () { S.active = i.id; save(); render(); } }, "Make active"),
            h("button", { class: "btn sm", onclick: function () {
              var v = window.prompt("Rename instance", i.name); if (v && v.trim()) { i.name = v.trim().slice(0, 40); save(); render(); } } }, "Rename"),
            h("button", { class: "btn sm danger", disabled: S.instances.length < 2, onclick: function () {
              if (!confirmDel('Delete instance "' + i.name + '"?')) return;
              S.instances = S.instances.filter(function (x) { return x.id !== i.id; });
              if (S.active === i.id) S.active = S.instances[0].id; save(); render(); } }, "Delete")));
      })));
  };

  pages.mods = function () {
    var filter = "all", q = "";
    var box = h("div"), search = h("input", { type: "search", placeholder: "Search mods…", "aria-label": "Search mods" });
    var real = C.MODS.filter(function (m) { return m.status === "compatible"; }).length;
    function draw() {
      box.replaceChildren();
      var items = C.MODS.filter(function (m) {
        return (filter === "all" || m.status === filter) && (m.name + " " + m.desc + " " + m.category).toLowerCase().indexOf(q) > -1;
      });
      if (!items.length) { box.append(h("div", { class: "empty" }, filter === "compatible" && !real ? "No compatible mods are included yet. Only real mod files built for the game engine appear here." : "No mods match.")); return; }
      var list = h("div", { class: "list" });
      items.forEach(function (m) {
        var compat = m.status === "compatible", locked = compat && !(C.ENGINE.supportsModLoading && engineReady());
        var sw = h("input", { type: "checkbox", "aria-label": "Switch " + m.name, checked: !!inst().mods[m.id], disabled: locked,
          onchange: function () { inst().mods[m.id] = sw.checked; save(); log((sw.checked ? "Switched on " : "Switched off ") + m.name + (compat ? "" : " (demo, preference only)")); } });
        list.append(h("div", { class: "row" },
          h("div", { class: "grow" }, h("b", null, m.name), h("small", null, m.desc + " · " + m.category),
            h("small", null, compat ? (locked ? "Locked: the game engine does not support mod loading yet." : "Loads into the game when you press Play.")
                                    : "Demonstration entry: saves your preference only. It has no mod file and does not change the game.")),
          h("span", { class: "tag " + (compat ? "compat" : "demo") }, compat ? "COMPATIBLE" : "DEMO"),
          h("label", { class: "switch" }, sw, h("span"))));
      });
      box.append(list);
    }
    search.addEventListener("input", function () { q = search.value.toLowerCase(); draw(); });
    var tabs = h("div", { class: "tabs" });
    [["all", "All"], ["compatible", "Compatible"], ["demo", "Demo"]].forEach(function (t) {
      var b = h("button", { class: "btn" + (t[0] === filter ? " on" : ""), onclick: function () {
        filter = t[0]; Array.prototype.forEach.call(tabs.querySelectorAll("button"), function (x) { x.classList.remove("on"); }); b.classList.add("on"); draw(); } }, t[1]);
      tabs.append(b);
    });
    tabs.append(search);
    draw();
    return h("div", null, head("Mod Library", "Switches apply to your active instance: " + inst().name),
      h("div", { class: "banner" + (real && C.ENGINE.supportsModLoading ? " ok" : "") },
        h("b", null, "Please read: "), "Ordinary Java Edition mods (Fabric, Forge, NeoForge .jar files) do not work in a browser client. Only mods built for the connected game engine can load, and only when that engine supports mod loading. Entries marked ", h("b", null, "DEMO"),
        " are placeholders. ", real ? "" : "There are currently 0 compatible mods and mod loading is " + (C.ENGINE.supportsModLoading ? "enabled." : "not enabled.")),
      tabs, box);
  };

  pages.modpacks = function () {
    var name = h("input", { type: "text", placeholder: "Modpack name", maxlength: "40", "aria-label": "Modpack name" });
    var picked = {};
    var checks = h("div", { class: "checks" }, C.MODS.map(function (m) {
      var c = h("input", { type: "checkbox", onchange: function () { picked[m.id] = c.checked; } });
      return h("label", null, c, m.name + (m.status === "demo" ? " (demo)" : ""));
    }));
    function create() {
      var n = name.value.trim(); if (!n) return toast("Enter a name first.");
      var ids = Object.keys(picked).filter(function (k) { return picked[k]; });
      if (!ids.length) return toast("Pick at least one mod.");
      S.modpacks.push({ id: uid(), name: n, mods: ids }); save(); log("Created modpack " + n); render();
    }
    return h("div", null, head("Modpacks", "Saved groups of mods you can apply to your active instance."),
      h("div", { class: "card", style: "margin-bottom:18px" }, h("label", { class: "f" }, "New modpack"), name, checks,
        h("button", { class: "btn primary", onclick: create }, "＋ Create modpack")),
      S.modpacks.length ? h("div", { class: "list" }, S.modpacks.map(function (p) {
        return h("div", { class: "row" },
          h("div", { class: "grow" }, h("b", null, p.name), h("small", null, p.mods.map(function (id) { var m = C.MODS.filter(function (x) { return x.id === id; })[0]; return m ? m.name : id; }).join(", "))),
          h("div", { class: "acts" },
            h("button", { class: "btn sm", onclick: function () {
              var m = inst().mods; p.mods.forEach(function (id) { m[id] = true; }); save(); log("Applied modpack " + p.name); toast("Applied to " + inst().name); } }, "Apply to instance"),
            h("button", { class: "btn sm danger", onclick: function () {
              if (!confirmDel('Delete modpack "' + p.name + '"?')) return;
              S.modpacks = S.modpacks.filter(function (x) { return x.id !== p.id; }); save(); render(); } }, "Delete")));
      })) : h("div", { class: "empty" }, "No modpacks yet."));
  };

  pages.servers = function () {
    var editing = null;
    var n = h("input", { type: "text", placeholder: "My server", maxlength: "40", "aria-label": "Server name" });
    var a = h("input", { type: "text", placeholder: "play.example.com or wss://example.com", maxlength: "200", "aria-label": "Server address", autocapitalize: "off", spellcheck: "false" });
    var btn = h("button", { class: "btn primary" }, "＋ Save server");
    var listBox = h("div");
    var ADDR = /^(wss?:\/\/)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]*[a-z0-9])?(:\d{1,5})?(\/[^\s]*)?$/i;
    btn.addEventListener("click", function () {
      var name = n.value.trim(), addr = a.value.trim();
      if (!name || !addr) return toast("Enter both a name and an address.");
      if (!ADDR.test(addr)) return toast("That does not look like a valid server address.");
      if (editing) { var s = S.servers.filter(function (x) { return x.id === editing; })[0]; if (s) { s.name = name; s.address = addr; } }
      else { S.servers.push({ id: uid(), name: name, address: addr }); log("Saved server " + name); }
      editing = null; n.value = ""; a.value = ""; btn.textContent = "＋ Save server"; save(); draw(); toast("Server saved");
    });
    function draw() {
      listBox.replaceChildren();
      if (!S.servers.length) return listBox.append(h("div", { class: "empty" }, "No servers saved yet."));
      listBox.append(h("div", { class: "list" }, S.servers.map(function (s) {
        return h("div", { class: "row" },
          h("div", { class: "grow" }, h("b", null, s.name), h("small", null, s.address)),
          h("div", { class: "acts" },
            h("button", { class: "btn sm", onclick: function () { copy(s.address); } }, "Copy address"),
            h("button", { class: "btn sm", onclick: function () { editing = s.id; n.value = s.name; a.value = s.address; btn.textContent = "Update server"; n.focus(); } }, "Edit"),
            h("button", { class: "btn sm danger", onclick: function () {
              if (!confirmDel('Remove "' + s.name + '"?')) return;
              S.servers = S.servers.filter(function (x) { return x.id !== s.id; }); save(); draw(); } }, "Remove")));
      })));
    }
    draw();
    return h("div", null, head("Servers", "Save multiplayer addresses, then copy them into the game's multiplayer screen."),
      h("div", { class: "banner" }, "Saved addresses are stored in this browser only. Deepslate does not check whether a server is online, and joining happens inside the game once a game engine is connected."),
      h("div", { class: "form" }, h("div", null, h("label", { class: "f" }, "Server name"), n), h("div", null, h("label", { class: "f" }, "Server address"), a), btn),
      listBox);
  };

  pages.profile = function () {
    var n = h("input", { type: "text", maxlength: "24", value: S.profile.name, "aria-label": "Display name" });
    var ab = h("textarea", { rows: "3", maxlength: "200", "aria-label": "About me" }); ab.value = S.profile.about;
    return h("div", null, head("Profile", "A local display name for this launcher."),
      h("div", { class: "card", style: "max-width:560px" },
        h("label", { class: "f" }, "Display name"), n, h("label", { class: "f", style: "margin-top:12px" }, "About me"), ab,
        h("p", { class: "sub", style: "margin:12px 0" }, "This is not a Minecraft or Microsoft account and is not used to sign in anywhere."),
        h("button", { class: "btn primary", onclick: function () { S.profile.name = n.value.trim() || "Guest"; S.profile.about = ab.value.trim(); save(); toast("Profile saved"); } }, "Save profile")));
  };

  pages.settings = function () {
    function row(title, sub, ctrl) { return h("div", { class: "setting" }, h("div", { class: "grow" }, title, h("small", null, sub)), ctrl); }
    function toggle(key, after) {
      var c = h("input", { type: "checkbox", checked: !!S.settings[key], "aria-label": key, onchange: function () { S.settings[key] = c.checked; save(); if (after) after(); } });
      return h("label", { class: "switch" }, c, h("span"));
    }
    var sw = h("div", { class: "swatches" }, Object.keys(ACCENTS).map(function (k) {
      return h("button", { class: "sw" + (S.settings.accent === k ? " on" : ""), "aria-label": k + " accent", style: "background:" + ACCENTS[k],
        onclick: function () { S.settings.accent = k; save(); applyPrefs(); render(); } });
    }));
    var mode = h("select", { "aria-label": "Launch mode", onchange: function () { S.settings.launchMode = mode.value; save(); } },
      h("option", { value: "inline", selected: S.settings.launchMode === "inline" }, "Inside Deepslate"),
      h("option", { value: "tab", selected: S.settings.launchMode === "tab" }, "New browser tab"));
    mode.style.width = "190px";
    return h("div", null, head("Settings", "Normal launcher preferences."),
      h("div", { class: "card", style: "margin-bottom:16px" }, h("h3", null, "Appearance"),
        row("Accent color", "Used for buttons and highlights.", sw),
        row("Reduce motion", "Turns off animations and transitions.", toggle("reduceMotion", applyPrefs))),
      h("div", { class: "card", style: "margin-bottom:16px" }, h("h3", null, "Launching"),
        row("Open the game", "Where Play opens the game.", mode),
        row("Confirm before deleting", "Ask before removing instances, modpacks and servers.", toggle("confirmDeletes"))),
      h("div", { class: "card", style: "margin-bottom:16px" }, h("h3", null, "About"),
        row("Deepslate Client", "Launcher version", h("span", { class: "chip" }, C.APP_VERSION)),
        row("Minecraft version", "This launcher supports one version only.", h("span", { class: "chip" }, C.VERSION)),
        row("Game engine", "Connected by the site owner.", h("span", { class: "chip" }, engineReady() ? C.ENGINE.name : "Not connected"))),
      h("div", { class: "card" }, h("h3", null, "Storage"),
        row("Reset local data", "Deletes instances, mod switches, modpacks, servers, profile and settings from this browser.",
          h("button", { class: "btn danger", onclick: function () {
            if (!window.confirm("Reset ALL Deepslate data in this browser?")) return;
            try { localStorage.removeItem(KEY); } catch (e) {} location.hash = "#/home"; location.reload(); } }, "Reset"))));
  };

  function head(t, s) { return h("div", null, h("h2", null, t), h("p", { class: "sub" }, s)); }

  /* ---------- router ---------- */
  var TITLES = { home: "Home", instances: "Instances", mods: "Mod Library", modpacks: "Modpacks", servers: "Servers", profile: "Profile", settings: "Settings" };
  function route() { var r = (location.hash.replace(/^#\/?/, "") || "home"); return pages[r] ? r : "home"; }
  function render() {
    var r = route(), v = document.getElementById("view");
    v.replaceChildren(pages[r]());
    document.getElementById("pageTitle").textContent = TITLES[r];
    document.title = TITLES[r] + " · Deepslate Client";
    Array.prototype.forEach.call(document.querySelectorAll("nav a"), function (a) { a.classList.toggle("on", a.dataset.route === r); });
    var p = document.getElementById("statusPill");
    p.textContent = engineReady() ? "Minecraft " + C.VERSION + " · engine connected" : "Minecraft " + C.VERSION + " · engine not connected";
    p.classList.toggle("ok", engineReady());
    closeMenu();
  }
  function applyPrefs() {
    document.documentElement.style.setProperty("--accent", ACCENTS[S.settings.accent] || ACCENTS.green);
    document.body.classList.toggle("reduce", !!S.settings.reduceMotion);
  }
  function closeMenu() { document.getElementById("side").classList.remove("open"); document.getElementById("scrim").classList.remove("show"); }
  document.getElementById("menuBtn").addEventListener("click", function () {
    document.getElementById("side").classList.add("open"); document.getElementById("scrim").classList.add("show"); });
  document.getElementById("scrim").addEventListener("click", closeMenu);
  window.addEventListener("hashchange", function () { render(); window.scrollTo(0, 0); });
  applyPrefs(); render();
})();
