(function () {
  "use strict";

  try {
    var C = window.DEEPSLATE_CONFIG || {};
    var KEY = "deepslate.v16";

    var ACCENTS = {
      periwinkle: "#a594f9",
      green: "#3ddc97",
      blue: "#4aa8ff",
      orange: "#ffa94d"
    };

    var route = "home";

    var DEFAULT_MODS = [
      {
        id: "fps-boost",
        name: "Sodium",
        author: "Deepslate",
        category: "Performance",
        code: "SO",
        desc: "Performance improvements."
      },
      {
        id: "iris",
        name: "Iris Shaders",
        author: "IrisShaders",
        category: "Visuals",
        code: "IR",
        desc: "Shader support."
      },
      {
        id: "zoom",
        name: "ZoomX Smooth",
        author: "Deepslate",
        category: "Utility",
        code: "ZM",
        desc: "Smooth zoom with scroll adjustment."
      },
      {
        id: "hitboxes",
        name: "Combat Hitboxes",
        author: "Deepslate",
        category: "PvP",
        code: "HB",
        desc: "Custom entity hitbox rendering."
      },
      {
        id: "armor-hud",
        name: "Uku's Armor HUD",
        author: "uku",
        category: "HUD",
        code: "AR",
        desc: "Shows armor durability."
      },
      {
        id: "fullbright",
        name: "Fullbright & Clear",
        author: "Deepslate",
        category: "Visuals",
        code: "FB",
        desc: "Fullbright and visual improvements."
      }
    ];

    function h(tag, props) {
      var element = document.createElement(tag);
      var children = Array.prototype.slice.call(arguments, 2);

      Object.keys(props || {}).forEach(function (key) {
        if (key === "class") {
          element.className = props[key];
        } else if (key.indexOf("on") === 0) {
          element.addEventListener(key.slice(2), props[key]);
        } else {
          element.setAttribute(key, props[key]);
        }
      });

      children.forEach(function (child) {
        if (Array.isArray(child)) {
          child.forEach(function (item) {
            if (item) element.append(item);
          });
        } else if (child != null && child !== false) {
          element.append(
            child.nodeType
              ? child
              : document.createTextNode(String(child))
          );
        }
      });

      return element;
    }

    function toast(msg) {
      var box = document.getElementById("toasts");
      if (!box) return;
      var t = h("div", { class: "toast" }, msg);
      box.append(t);
      setTimeout(function () {
        t.remove();
      }, 3000);
    }

    function openModal(title, bodyNodes, actions) {
      var ov = document.getElementById("overlay");
      if (!ov) return;
      var close = function () {
        bg.remove();
      };
      var bg = h(
        "div",
        {
          style: "position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:2500;padding:20px;",
          onclick: function (e) {
            if (e.target === bg) close();
          }
        },
        h(
          "div",
          {
            style: "background:var(--panel);border:1px solid var(--border-hi);border-radius:14px;padding:22px;max-width:420px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,0.7);"
          },
          h("h3", { style: "font-size:16px;margin-bottom:10px;" }, title),
          bodyNodes,
          h(
            "div",
            { style: "display:flex;justify-content:flex-end;gap:8px;margin-top:16px;" },
            actions(close)
          )
        )
      );
      ov.append(bg);
    }

    function promptModal(title, label, initialVal, placeholder, onSave) {
      var inp = h("input", {
        type: "text",
        value: initialVal || "",
        placeholder: placeholder || "",
        style: "width:100%;margin-top:6px;"
      });
      openModal(
        title,
        h(
          "div",
          null,
          h("small", { style: "color:var(--muted);font-size:12.5px;" }, label),
          inp
        ),
        function (close) {
          return [
            h("button", { class: "btn", onclick: close }, "Cancel"),
            h(
              "button",
              {
                class: "btn primary",
                onclick: function () {
                  onSave(inp.value);
                  close();
                }
              },
              "Save"
            )
          ];
        }
      );
      setTimeout(function () {
        inp.focus();
        inp.select();
      }, 20);
    }

    var S = null;
    try {
      S = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (error) {
      console.warn("Could not load saved settings:", error);
    }

    if (!S || typeof S !== "object") {
      S = {
        name: "Crux",
        email: "",
        status: "",
        bio: "PvP main, builder, always down for bedwars",
        banner: "#a594f9",
        accent: "periwinkle",
        styleMode: "Minimal",
        extraDark: false,
        version: C.DEFAULT_VERSION || "1.21.11",
        inst: "My instance 1",
        mods: {
          "fps-boost": true,
          "zoom": true
        },
        filter: "All",
        search: "",
        servers: [
          { name: "ArchMC", ip: "wss://mc.arch.lol" },
          { name: "ZythMC", ip: "wss://play.zyth.me" }
        ],
        pose: "Idle",
        model: "Classic",
        skin: "",
        stTab: "My account",
        prefs: {
          friendReq: true,
          whoAdd: "Everyone",
          whoMsg: "Friends",
          showOnline: true,
          showServer: true,
          dnd: false,
          popups: true,
          btnSound: true,
          perfMode: false
        }
      };
    }

    S.prefs = S.prefs || {};
    S.mods = S.mods || {};
    S.servers = S.servers || [];

    var DEFAULT_PREFS = {
      friendReq: true,
      whoAdd: "Everyone",
      whoMsg: "Friends",
      showOnline: true,
      showServer: true,
      dnd: false,
      popups: true,
      btnSound: true,
      perfMode: false
    };

    Object.keys(DEFAULT_PREFS).forEach(function (key) {
      if (typeof S.prefs[key] === "undefined") {
        S.prefs[key] = DEFAULT_PREFS[key];
      }
    });

    if (!S.name) S.name = "Crux";
    if (!S.accent) S.accent = "periwinkle";
    if (!S.banner) S.banner = "#a594f9";
    if (!S.version) S.version = C.DEFAULT_VERSION || "1.21.11";
    if (!S.inst) S.inst = "My instance 1";
    if (!S.stTab) S.stTab = "My account";

    function save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(S));
      } catch (error) {
        console.warn("Could not save settings:", error);
      }
    }

    function go(newRoute) {
      route = newRoute;
      render();
    }

    function toggleSwitch(key) {
      return h("button", {
        class: "st-toggle" + (S.prefs[key] ? " on" : ""),
        type: "button",
        "aria-pressed": String(!!S.prefs[key]),
        onclick: function () {
          S.prefs[key] = !S.prefs[key];
          save();
          render();
        }
      });
    }

    function segControl(key, options) {
      return h(
        "div",
        { class: "st-seg" },
        options.map(function (option) {
          return h(
            "button",
            {
              type: "button",
              class: S.prefs[key] === option ? "active" : "",
              onclick: function () {
                S.prefs[key] = option;
                save();
                render();
              }
            },
            option
          );
        })
      );
    }

    function row(title, subtitle, control) {
      return h(
        "div",
        { class: "setting-row" },
        h(
          "div",
          null,
          h("b", { style: "font-size:13.5px;display:block;" }, title),
          subtitle
            ? h("small", { style: "color:var(--muted);font-size:12px;" }, subtitle)
            : null
        ),
        control
      );
    }

    function launch(ip) {
      var url = (C.GAME_URL || "").trim();

      if (!url) {
        openModal(
          "Engine Ready",
          h(
            "p",
            { style: "color:var(--muted);font-size:13px;line-height:1.5;" },
            "Deepslate " +
              S.version +
              (ip ? " (" + ip + ")" : "") +
              " is configured. Set GAME_URL in config.js (e.g. '/game/index.html') to launch inside this tab."
          ),
          function (close) {
            return [h("button", { class: "btn primary", onclick: close }, "Got it")];
          }
        );
        return;
      }

      var game = h(
        "div",
        { class: "game" },
        h(
          "div",
          { class: "bar" },
          h(
            "button",
            {
              class: "btn",
              onclick: function () {
                game.remove();
              }
            },
            "Exit"
          ),
          h("b", null, "Deepslate " + S.version)
        ),
        h("iframe", {
          src: url,
          allow: "fullscreen; autoplay; gamepad; pointer-lock",
          allowfullscreen: "true"
        })
      );

      document.getElementById("overlay").append(game);
    }

    function downloadFile(filename, content, type) {
      var blob = new Blob([content], { type: type });
      var url = URL.createObjectURL(blob);
      var link = h("a", { href: url, download: filename });
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
    }

    function exportOfflineHtml() {
      var html =
        "<!doctype html>" +
        "<html><body style='background:#0b0b0e;color:#fff;font-family:sans-serif;padding:2rem;'>" +
        "<h2>Deepslate Client Offline Backup</h2>" +
        "<pre>" +
        JSON.stringify(S, null, 2) +
        "</pre></body></html>";

Use code with caution.
downloadFile("deepslate-client-offline.html", html, "text/html");
toast("Offline client downloaded");
}
var pages = {
home: function () {
var count = Object.keys(S.mods).filter(function (key) {
return S.mods[key];
}).length;
return h(
"div",
null,
h(
"section",
{ class: "cr-hero" },
h("div", { class: "cr-inst-label" }, S.inst.toUpperCase()),
h(
"div",
{ class: "play-split" },
h(
"button",
{
class: "play-main",
onclick: function () {
launch();
}
},
h("strong", null, "PLAY " + S.version),
h(
"span",
null,
(S.prefs.perfMode ? "PERFORMANCE" : "STANDARD") + " ENGINE · READY"
)
),
h(
"button",
{
class: "play-drop",
onclick: function () {
S.version = S.version === "1.21.11" ? "1.8.8" : "1.21.11";
save();
toast("Switched to " + S.version);
render();
}
},
"⌄"
)
),
h(
"div",
{ class: "hero-sub" },
count + " mods on · ",
h(
"a",
{
href: "#",
onclick: function (e) {
e.preventDefault();
go("mods");
}
},
"Manage mods"
),
" · ",
h(
"a",
{
href: "#",
onclick: function (e) {
e.preventDefault();
go("servers");
}
},
"Servers"
)
),
h(
"div",
{ class: "hero-stats" },
h("span", null, h("b", null, "27"), " playing right now"),
h("span", null, h("b", null, "1,000"), " in the last 24 hours")
)
),
h(
"div",
{ class: "partner-bar" },
h(
"div",
null,
h("b", null, "Top servers"),
h(
"small",
{ style: "display:block;color:var(--muted);" },
"Featured community servers ready for one-click join."
)
),
h(
"button",
{
class: "btn",
onclick: function () {
go("servers");
}
},
"Browse servers"
)
)
);
},
mods: function () {
var all = Array.isArray(C.MODS) && C.MODS.length ? C.MODS : DEFAULT_MODS;
var cats = ["All", "Performance", "Visuals", "HUD", "PvP", "Utility", "Libraries"];
var list = all.filter(function (m) {
var catMatch = S.filter === "All" || m.category === S.filter;
var searchMatch =
!S.search ||
m.name.toLowerCase().indexOf(S.search.toLowerCase()) !== -1 ||
(m.desc && m.desc.toLowerCase().indexOf(S.search.toLowerCase()) !== -1);
return catMatch && searchMatch;
});
var srch = h("input", {
value: S.search,
placeholder: "Search " + all.length + " mods",
oninput: function () {
S.search = srch.value;
render();
}
});
return h(
"div",
null,
h("div", { class: "mods-header" }, h("h2", { style: "font-size:18px;" }, "Browse mods")),
h(
"div",
{ class: "filter-row" },
srch,
cats.map(function (c) {
return h(
"button",
{
class: "chip-btn" + (S.filter === c ? " active" : ""),
onclick: function () {
S.filter = c;
render();
}
},
c
);
})
),
h(
"div",
{ class: "mods-grid" },
list.map(function (m) {
var on = !!S.mods[m.id];
var badgeText = m.code || m.name.slice(0, 2).toUpperCase();
return h(
"div",
{ class: "mod-card" },
h(
"div",
{ class: "mod-top" },
h(
"div",
{ style: "display:flex;gap:10px;align-items:center;" },
m.image
? h("img", {
src: m.image,
alt: m.name,
style: "width:42px;height:42px;border-radius:10px;object-fit:cover;"
})
: h(
"div",
{
class: "mod-icon",
style: "font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--accent);"
},
badgeText
),
h(
"div",
null,
h("b", null, m.name),
h("small", { style: "display:block;color:var(--muted);" }, m.category)
)
),
h(
"button",
{
class: "btn " + (on ? "added" : ""),
onclick: function () {
S.mods[m.id] = !on;
save();
toast((!on ? "Added " : "Removed ") + m.name);
render();
}
},
on ? "Added" : "+ Add"
)
),
h("p", { style: "font-size:12.5px;color:var(--muted);margin-top:8px;" }, m.desc)
);
})
)
);
},
wardrobe: function () {
var canvas = h("canvas", { width: "280", height: "360", style: "cursor:grab;" });
if (window.skinview3d) {
var viewer = new window.skinview3d.SkinViewer({ canvas: canvas, width: 280, height: 360 });
if (S.skin) viewer.loadSkin(S.skin);
viewer.controls.enableRotate = true;
viewer.controls.enableZoom = true;
viewer.playerObject.skin.modelType = S.model === "Slim" ? "slim" : "default";
viewer.animation = new window.skinview3d.IdleAnimation();
}
var fileIn = h("input", {
type: "file",
accept: "image/png",
style: "display:none;",
onchange: function (e) {
var f = e.target.files.item(0);
if (!f) return;
var r = new FileReader();
r.onload = function () {
S.skin = r.result;
save();
toast("Skin updated");
render();
};
r.readAsDataURL(f);
}
});
return h(
"div",
{ class: "wardrobe-layout" },
h(
"div",
{ class: "wardrobe-stage" },
h("b", null, S.name),
canvas,
h(
"div",
{ class: "pose-bar" },
["Idle", "Walk", "Run", "Wave", "Crouch"].map(function (p) {
return h(
"button",
{
class: "pose-btn" + (S.pose === p ? " active" : ""),
onclick: function () {
S.pose = p;
render();
}
},
p
);
})
)
),
h(
"div",
{ class: "card", style: "display:flex;flex-direction:column;gap:14px;" },
h("b", null, "Skin"),
fileIn,
h(
"button",
{
class: "btn",
onclick: function () {
fileIn.click();
}
},
"Upload 64x64 PNG"
),
h(
"div",
{ style: "display:grid;grid-template-columns:1fr 1fr;gap:8px;" },
["Classic", "Slim"].map(function (m) {
return h(
"button",
{
class: "btn" + (S.model === m ? " primary" : ""),
onclick: function () {
S.model = m;
save();
render();
}
},
m
);
})
)
)
);
},
servers: function () {
return h(
"div",
null,
S.servers.map(function (s) {
return h(
"div",
{
class: "card",
style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"
},
h(
"div",
null,
h("b", null, s.name),
h("small", { style: "display:block;color:var(--muted);" }, s.ip)
),
h(
"button",
{
class: "btn primary",
onclick: function () {
launch(s.ip);
}
},
"Join"
)
);
})
);
},
settings: function () {
var tabs = [
{ id: "My account", sub: "Your name, email and profile." },
{ id: "Devices", sub: "Everywhere you're signed in, including the game." },
{ id: "Privacy & safety", sub: "Who can reach you across devices and in-game." },
{ id: "Notifications", sub: "Pop-ups and sounds on this device." },
{ id: "Sound", sub: "Button sounds in the launcher on this device." },
{ id: "Appearance", sub: "How the launcher looks on this device." },
{ id: "Game & sync", sub: "How the game runs, and what follows you between devices." },
{ id: "Your data", sub: "Take a copy of your account, or delete it for good." }
];
var cur =
tabs.filter(function (t) {
return t.id === S.stTab;
}).pop() || tabs.slice(0, 1).pop();
var bioIn = h(
"textarea",
{
rows: "3",
style: "width:100%;background:var(--bg);border:1px solid var(--border-hi);color:#fff;padding:10px;border-radius:8px;font-family:inherit;font-size:13px;"
},
S.bio || ""
);
var banners = ["#a594f9", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6"];
var bodies = {
"My account": function () {
return h(
"div",
null,
h(
"div",
{
class: "st-section",
style: "border-top:4px solid " + S.banner + ";display:flex;justify-content:space-between;align-items:center;"
},
h(
"div",
{ style: "display:flex;gap:12px;align-items:center;" },
h("img", { src: "favicon.svg", style: "width:42px;height:42px;" }),
h(
"div",
null,
h("b", { style: "font-size:16px;" }, S.name),
h("small", { style: "display:block;color:var(--muted);" }, "Joined November 5, 2026")
)
),
h(
"button",
{
class: "btn",
onclick: function () {
go("wardrobe");
}
},
"Wardrobe"
)
),
h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "Sign-in details"),
row(
"Username",
S.name + " · shown in-game and in Wardrobe",
h(
"button",
{
class: "btn",
onclick: function () {
promptModal("Change username", "Enter your new display name:", S.name, "Username", function (val) {
if (val.trim()) {
S.name = val.trim();
save();
toast("Username updated to " + S.name);
render();
}
});
}
},
"Change"
)
),
row(
"Email",
S.email || "Not added. Add one for account recovery.",
h(
"button",
{
class: "btn",
onclick: function () {
promptModal("Account email", "Enter your email address:", S.email, "you@example.com", function (val) {
S.email = val.trim();
save();
toast("Email saved");
render();
});
}
},
S.email ? "Edit email" : "Add email"
)
)
),
h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "Profile"),
row(
"Status",
S.status || "No status set. Tell friends what you're up to.",
h(
"button",
{
class: "btn",
onclick: function () {
promptModal("Set status", "What are you playing right now?", S.status, "Grinding Bedwars...", function (val) {
S.status = val.trim();
save();
toast("Status updated");
render();
});
}
},
"Set status"
)
),
h(
"div",
{ style: "padding:12px 0;border-bottom:1px solid var(--border);" },
h("b", { style: "font-size:13.5px;display:block;margin-bottom:6px;" }, "Bio"),
bioIn,
h(
"div",
{ style: "text-align:right;margin-top:8px;" },
h(
"button",
{
class: "btn",
onclick: function () {
S.bio = bioIn.value;
save();
toast("Bio saved");
}
},
"Save bio"
)
)
),
h(
"div",
{ style: "padding-top:12px;" },
h("b", { style: "font-size:13.5px;display:block;margin-bottom:8px;" }, "Banner"),
h(
"div",
{ class: "banner-swatches" },
banners.map(function (col) {
return h("button", {
class: "swatch" + (S.banner === col ? " active" : ""),
style: "background:" + col + ";",
onclick: function () {
S.banner = col;
save();
render();
}
});
})
)
)
)
);
},
"Devices": function () {
return h(
"div",
{ class: "st-section" },
h(
"div",
{ style: "display:flex;align-items:center;gap:12px;" },
h(
"div",
{
style: "width:36px;height:36px;border-radius:8px;background:var(--panel-2);display:grid;place-items:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--accent);"
},
"OS"
),
h(
"div",
null,
h("b", null, "Chrome on Chromebook "),
h(
"span",
{
style: "font-size:11px;background:rgba(61,220,151,0.16);color:#3ddc97;padding:2px 7px;border-radius:5px;"
},
"This device"
),
h(
"small",
{ style: "display:block;color:var(--muted);margin-top:3px;" },
"Active now · signed in Nov 5, 2026"
)
)
)
);
},
"Privacy & safety": function () {
return h(
"div",
null,
h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "Friends & Messages"),
row("Friend requests", "People can send you friend requests.", toggleSwitch("friendReq")),
row(
"Who can add you",
"Friends of friends means someone you both know.",
segControl("whoAdd", ["Everyone", "Friends of friends"])
),
row("Who can message you", "Only friends can message you.", segControl("whoMsg", ["Friends", "Everyone"]))
),
h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "Online status"),
row(
"Show when I'm online",
"Friends see when you're online and what you're playing.",
toggleSwitch("showOnline")
),
row("Show which server I'm on", "Friends can press Join to play with you.", toggleSwitch("showServer"))
)
);
},
"Notifications": function () {
return h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "General"),
row("Do not disturb", "No pop-ups or sounds. Messages still arrive.", toggleSwitch("dnd")),
row("Pop-up notifications", "New messages appear in the bottom right.", toggleSwitch("popups"))
);
},
"Sound": function () {
return h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "Interface"),
row("Button sounds", "Soft clicks when you press buttons and switches.", toggleSwitch("btnSound"))
);
},
"Appearance": function () {
return h(
"div",
null,
h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "Style"),
h(
"div",
{ class: "style-cards" },
[
{ id: "Minimal", sub: "Top bar, big Play button, plain dark" },
{ id: "Glass", sub: "Frosted panels over subtle glow" },
{ id: "Classic", sub: "Solid dark panels" }
].map(function (st) {
return h(
"button",
{
class: "style-card" + (S.styleMode === st.id ? " active" : ""),
onclick: function () {
S.styleMode = st.id;
save();
render();
}
},
h("b", { style: "display:block;margin-bottom:4px;" }, st.id),
h("small", { style: "color:var(--muted);font-size:11.5px;" }, st.sub)
);
})
)
),
h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "Background & Accent"),
row(
"Extra dark",
"Pure black background. Looks great on OLED screens.",
h("button", {
class: "st-toggle" + (S.extraDark ? " on" : ""),
onclick: function () {
S.extraDark = !S.extraDark;
save();
render();
}
})
),
row(
"Accent color",
"Choose launcher highlight tint.",
h(
"div",
{ style: "display:flex;gap:6px;" },
Object.keys(ACCENTS).map(function (k) {
return h(
"button",
{
class: "btn" + (S.accent === k ? " primary" : ""),
onclick: function () {
S.accent = k;
save();
render();
}
},
k
);
})
)
)
)
);
},
"Game & sync": function () {
return h(
"div",
null,
h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "Game"),
row("Performance mode", "Lower resolution and smoother chunk loading for more FPS.", toggleSwitch("perfMode")),
row(
"Skin and cape",
"Pick your look and see it move in 3D.",
h(
"button",
{
class: "btn",
onclick: function () {
go("wardrobe");
}
},
"Open Wardrobe"
)
)
),
h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "About"),
h(
"p",
{ style: "font-size:12.5px;color:var(--muted);margin-bottom:12px;" },
"Deepslate Client · Minecraft " + S.version + " · Browser Web Engine"
),
h("button", { class: "btn", onclick: exportOfflineHtml }, "Download the client")
)
);
},
"Your data": function () {
return h(
"div",
null,
h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "Download your data"),
row(
"Account copy",
"Your profile, settings, mods, and servers as one JSON file.",
h(
"button",
{
class: "btn",
onclick: function () {
downloadFile("deepslate-account-data.json", JSON.stringify(S, null, 2), "application/json");
toast("Account JSON downloaded");
}
},
"Download"
)
)
),
h(
"div",
{ class: "st-section" },
h("div", { class: "st-sec-title" }, "Delete account"),
h(
"p",
{ style: "font-size:12.5px;color:var(--muted);margin-bottom:12px;" },
"Clears your local profile, saved servers, and mod preferences from this browser."
),
h(
"button",
{
class: "btn danger",
onclick: function () {
openModal(
"Delete local account?",
h(
"p",
{ style: "color:var(--muted);font-size:13px;" },
"This will reset your username, bio, skin, and mod preferences on this device."
),
function (close) {
return [
h("button", { class: "btn", onclick: close }, "Cancel"),
h(
"button",
{
class: "btn danger",
onclick: function () {
localStorage.removeItem(KEY);
location.reload();
}
},
"Delete everything"
)
];
}
);
}
},
"Delete my account"
)
)
);
}
};
return h(
"div",
{ class: "settings-layout" },
h(
"div",
{ class: "settings-nav" },
h(
"div",
{ class: "st-user-card" },
h("img", { src: "favicon.svg", alt: "" }),
h(
"div",
null,
h("b", { style: "font-size:13.5px;display:block;" }, S.name),
h("small", { style: "color:var(--muted);font-size:11.5px;" }, "Deepslate account")
)
),
tabs.map(function (t) {
return h(
"button",
{
class: S.stTab === t.id ? "active" : "",
onclick: function () {
S.stTab = t.id;
render();
}
},
t.id
);
})
),
h(
"div",
null,
h("h2", { style: "font-size:20px;margin-bottom:4px;" }, cur.id),
h("p", { style: "color:var(--muted);font-size:13px;margin-bottom:18px;" }, cur.sub),
(bodies[cur.id] || bodies["My account"])()
)
);
}
};
function render() {
document.documentElement.style.setProperty("--accent", ACCENTS[S.accent] || ACCENTS.periwinkle);
document.body.classList.toggle("extra-dark", !!S.extraDark);
document.body.classList.toggle("theme-glass", S.styleMode === "Glass");
var r = pages[route] ? route : "home";
document.querySelectorAll("#topnav a").forEach(function (a) {
a.classList.toggle("active", a.getAttribute("data-route") === r);
});
var v = document.getElementById("view");
if (v) {
v.innerHTML = "";
v.append(pagesr);
}
var u = document.getElementById("navUsername");
if (u) u.textContent = S.name;
}
document.querySelectorAll("[data-route]").forEach(function (el) {
el.addEventListener("click", function (e) {
e.preventDefault();
go(el.getAttribute("data-route"));
});
});
var cmd = document.getElementById("commandHint");
if (cmd) {
cmd.addEventListener("click", function () {
go("mods");
});
}
render();
} catch (err) {
var box = document.getElementById("view") || document.body;
box.innerHTML = "Error: " + err.message + "";
}
})();
