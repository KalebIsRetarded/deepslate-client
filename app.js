
/* ==========================================================================
   DEEPSLATE CLIENT - COMPLETE APP.JS
   Chromium-Style Interface & Launcher
   ========================================================================== */

(function () {
  "use strict";

  var C = window.DEEPSLATE_CONFIG || {};
  var KEY = "deepslate.v5";

  var ACCENTS = {
    periwinkle: "#a594f9",
    green: "#3ddc97",
    blue: "#4aa8ff",
    orange: "#ffa94d"
  };

  function first(arr) {
    return Array.isArray(arr) && arr.length ? arr[0] : null;
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function h(tag, props) {
    var e = document.createElement(tag);
    var kids = Array.prototype.slice.call(arguments, 2);

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

    setTimeout(function () {
      t.remove();
    }, 3000);
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast("Copied: " + text);
      });
    } else {
      toast("IP: " + text);
    }
  }

  function defaults() {
    var i = {
      id: uid(),
      name: "My instance 1",
      version: C.DEFAULT_VERSION || C.VERSION || "1.21.11",
      mods: {
        "fps-boost": true,
        "zoom": true
      }
    };

    return {
      instances: [i],
      active: i.id,

      servers: (C.FEATURED_SERVERS || [{
        name: "ArchMC Network",
        ip: "wss://mc.arch.lol",
        version: "1.8 - 1.21"
      }]).map(function (s) {
        return {
          id: uid(),
          name: s.name,
          ip: s.ip,
          version: s.version || "1.8 - 1.21"
        };
      }),

      friends: [
        { name: "maz_35", status: "Online · Lobby" },
        { name: "DeepslateBot", status: "In-Game · Bedwars" }
      ],

      messages: [],
      streak: 1,
      modFilter: "All",
      modSearch: "",
      wardrobePose: "Idle",
      wardrobeModel: "Classic",
      settingsTab: "My account",

      profile: {
        name: "Crux",
        email: "",
        status: "",
        cape: "deepslate"
      },

      settings: {
        accent: "periwinkle",
        launchMode: "inline",
        performanceMode: false
      }
    };
  }

  var S = (function () {
    var d = defaults();

    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");

      if (raw && typeof raw === "object") {
        Object.keys(d).forEach(function (k) {
          if (raw[k] != null) d[k] = raw[k];
        });

        d.settings = Object.assign(defaults().settings, raw.settings || {});
        d.profile = Object.assign(defaults().profile, raw.profile || {});
      }
    } catch (e) {}

    if (!Array.isArray(d.instances) || !d.instances.length) {
      var x = defaults();
      d.instances = x.instances;
      d.active = x.active;
    }

    if (!d.instances.some(function (i) {
      return i.id === d.active;
    })) {
      d.active = first(d.instances).id;
    }

    return d;
  })();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {}
  }

  function inst() {
    var found = S.instances.filter(function (i) {
      return i.id === S.active;
    });

    return first(found) || first(S.instances);
  }

  function resolveGameUrl(verId) {
    var id = verId || inst().version || C.DEFAULT_VERSION || C.VERSION;

    var found = first((C.VERSIONS || []).filter(function (v) {
      return v.id === id;
    }));

    var raw = ((found && found.url) || C.GAME_URL || "").trim();

    if (!raw) return null;

    try {
      return new URL(raw, location.href);
    } catch (e) {
      return null;
    }
  }

  /* =========================
     GAME LAUNCHER
     ========================= */

  function launch(opts) {
    opts = opts || {};

    var verId = opts.version || inst().version || C.DEFAULT_VERSION || "1.21.11";
    var u = resolveGameUrl(verId);

    if (!u) {
      var close = function () {
        bg.remove();
      };

      var bg = h("div", {
        class: "modal-bg",
        onclick: function (e) {
          if (e.target === bg) close();
        }
      },
        h("div", { class: "modal" },

          h("h3", { style: "margin-bottom:8px;" },
            "Engine Ready · Waiting for Game Files"
          ),

          h("p", {
            style: "color:var(--muted);font-size:13px;line-height:1.5;margin-bottom:14px;"
          },
            "Instance ",
            h("b", { style: "color:#fff;" }, inst().name),
            " (" + verId + ") is ready. Upload your Eaglercraft/WASM build into ",
            h("code", null, "/game/index.html"),
            " and set ",
            h("code", null, "GAME_URL"),
            " in ",
            h("code", null, "config.js"),
            "."
          ),

          h("div", { style: "text-align:right;" },
            h("button", {
              class: "btn primary",
              onclick: close
            }, "OK")
          )
        )
      );

      document.getElementById("overlay").append(bg);
      return;
    }

    var m = inst().mods || {};

    var activeMods = (C.MODS || [])
      .filter(function (x) {
        return m[x.id];
      })
      .map(function (x) {
        return x.id;
      });

    u.searchParams.set("deepslateVersion", verId);
    u.searchParams.set("username", S.profile.name || "Player");

    if (activeMods.length) {
      u.searchParams.set("deepslateMods", activeMods.join(","));
    }

    if (opts.serverIp) {
      u.searchParams.set("server", opts.serverIp);
    }

    if (S.settings.launchMode === "tab") {
      window.open(u.href, "_blank", "noopener");
      return;
    }

    var ov = document.getElementById("overlay");

    var frame = h("iframe", {
      src: u.href,
      allow: "fullscreen; autoplay; gamepad; pointer-lock",
      allowfullscreen: true
    });

    var g = h("div", { class: "game" },

      h("div", { class: "bar" },

        h("button", {
          class: "btn",
          onclick: function () {
            g.remove();
          }
        }, "← Exit"),

        h("b", {
          style: "flex:1;font-size:12px;color:var(--muted);"
        }, "Deepslate " + verId + " · " + inst().name),

        h("button", {
          class: "btn",
          onclick: function () {
            if (g.requestFullscreen) g.requestFullscreen();
          }
        }, "Fullscreen")
      ),

      frame
    );

    ov.append(g);
  }

  /* =========================
     PAGE DEFINITIONS
     ========================= */

  var pages = {};

  /* =========================
     HOME
     ========================= */

  pages.home = function () {
    var activeInst = inst();

    var modCount = Object.keys(activeInst.mods || {}).filter(function (k) {
      return activeInst.mods[k];
    }).length;

    var topServer = first(S.servers) || {
      ip: "wss://mc.arch.lol"
    };

    function openInstanceMenu() {
      var close = function () {
        bg.remove();
      };

      var nameIn = h("input", {
        type: "text",
        placeholder: "New instance name...",
        style: "flex:1;"
      });

      var verSel = h("select", null,
        (C.VERSIONS || [{
          id: "1.21.11",
          label: "1.21.11"
        }]).map(function (v) {
          return h("option", {
            value: v.id
          }, v.label);
        })
      );

      var bg = h("div", {
        class: "modal-bg",
        onclick: function (e) {
          if (e.target === bg) close();
        }
      },

        h("div", { class: "modal" },

          h("h3", { style: "margin-bottom:12px;" },
            "Switch or Create Instance"
          ),

          h("div", {
            style: "display:flex;flex-direction:column;gap:8px;margin-bottom:14px;"
          },

            S.instances.map(function (item) {
              var isSel = item.id === S.active;

              return h("div", {
                style:
                  "display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;background:var(--panel-2);border:1px solid " +
                  (isSel ? "var(--accent)" : "var(--border)") +
                  ";cursor:pointer;",

                onclick: function () {
                  S.active = item.id;
                  save();
                  close();
                  render();
                }
              },

                h("div", null,
                  h("b", null, item.name),
                  h("small", {
                    style: "display:block;color:var(--muted);"
                  }, "Version " + item.version)
                ),

                isSel
                  ? h("span", {
                      style: "color:var(--accent);font-size:12px;font-weight:700;"
                    }, "ACTIVE")
                  : null
              );
            })
          ),

          h("div", {
            style: "display:flex;gap:8px;"
          },

            nameIn,
            verSel,

            h("button", {
              class: "btn primary",

              onclick: function () {
                if (!nameIn.value.trim()) return;

                var n = {
                  id: uid(),
                  name: nameIn.value.trim(),
                  version: verSel.value,
                  mods: {
                    "fps-boost": true
                  }
                };

                S.instances.push(n);
                S.active = n.id;

                save();
                close();
                render();
              }
            }, "+ Add")
          )
        )
      );

      document.getElementById("overlay").append(bg);
    }

    return h("div", null,

      h("section", { class: "cr-hero" },

        h("div", {
          class: "cr-float",
          style: "width:95px;height:95px;top:24px;left:6%;transform:rotate(-12deg);"
        }),

        h("div", {
          class: "cr-float",
          style: "width:110px;height:110px;top:32px;right:8%;transform:rotate(16deg);"
        }),

        h("div", { class: "cr-inst-label" },
          activeInst.name
        ),

        h("div", { class: "play-split" },

          h("button", {
            class: "play-main",
            onclick: function () {
              launch();
            }
          },

            h("strong", null,
              "PLAY " + (activeInst.version || "1.21.11")
            ),

            h("span", null,
              "STANDARD ENGINE · READY"
            )
          ),

          h("button", {
            class: "play-drop",
            onclick: openInstanceMenu
          }, "⌄")
        ),

        h("div", { class: "hero-sub" },

          modCount + " mods on · ",

          h("a", {
            href: "#/mods"
          }, "Manage mods"),

          "   ·   ",

          h("a", {
            href: "#",
            onclick: function (e) {
              e.preventDefault();
              launch({ serverIp: topServer.ip });
            }
          }, "Rejoin " + topServer.ip)
        ),

        h("div", { class: "hero-stats" },

          h("span", null,
            h("b", null, "27"),
            " playing right now"
          ),

          h("span", null,
            h("b", null, "1,000"),
            " in the last 24 hours"
          )
        )
      ),

      h("div", { class: "partner-bar" },

        h("div", { class: "partner-left" },

          h("div", { class: "partner-icon" }, "🗄️"),

          h("div", null,

            h("b", {
              style: "display:block;font-size:14px;"
            }, "Top servers"),

            h("small", {
              style: "color:var(--muted);"
            }, "Featured community servers ready for one-click join.")
          )
        ),

        h("a", {
          class: "btn",
          href: "#/servers"
        }, "Browse servers")
      ),

      h("div", { class: "home-bottom" },

        h("div", null,

          h("h3", {
            style: "font-size:15px;"
          }, "Recent news"),

          h("div", { class: "news-grid" },

            h("div", { class: "card" },

              h("small", {
                style: "color:var(--muted);"
              }, "Nov 8"),

              h("b", {
                style: "display:block;margin:6px 0;"
              }, "Chromium-style UI"),

              h("p", {
                style: "font-size:12.5px;color:var(--muted);"
              }, "Top navigation, instance switcher, mod browser, and wardrobe.")
            ),

            h("div", { class: "card" },

              h("small", {
                style: "color:var(--muted);"
              }, "Nov 5"),

              h("b", {
                style: "display:block;margin:6px 0;"
              }, "Offline bundle export"),

              h("p", {
                style: "font-size:12.5px;color:var(--muted);"
              }, "Download your setup backup from Settings.")
            ),

            h("div", { class: "card" },

              h("small", {
                style: "color:var(--muted);"
              }, "Nov 1"),

              h("b", {
                style: "display:block;margin:6px 0;"
              }, "Sodium & HUD presets"),

              h("p", {
                style: "font-size:12.5px;color:var(--muted);"
              }, "Toggle FPS Boost, Keystrokes, Zoom, and Hitboxes.")
            )
          )
        ),

        h("div", { class: "card" },

          h("div", {
            style: "display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;"
          },

            h("div", null,

              h("b", null, "Live players"),

              h("small", {
                style: "display:block;color:var(--muted);"
              }, "In Deepslate right now")
            ),

            h("span", {
              style: "font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--green);"
            }, "27")
          ),

          h("svg", {
            viewBox: "0 0 240 64",
            style: "width:100%;height:64px;overflow:visible;"
          },

            h("polyline", {
              fill: "none",
              stroke: "#3ddc97",
              "stroke-width": "2.5",
              points: "0,54 30,52 60,48 90,50 120,34 145,44 170,18 195,38 220,24 240,14"
            })
          )
        )
      )
    );
  };

  /* =========================
     MOD BROWSER
     ========================= */

  pages.mods = function () {
    var activeInst = inst();
    activeInst.mods = activeInst.mods || {};

    var cats = [
      "All",
      "Performance",
      "Visual",
      "HUD",
      "PvP",
      "Utility"
    ];

    var allMods = C.MODS || [];

    var filtered = allMods.filter(function (m) {
      var catOk =
        S.modFilter === "All" ||
        (m.category || "").toLowerCase() === S.modFilter.toLowerCase();

      var qOk =
        !S.modSearch ||
        m.name.toLowerCase().indexOf(S.modSearch.toLowerCase()) !== -1;

      return catOk && qOk;
    });

    var searchIn = h("input", {
      type: "text",
      value: S.modSearch,
      placeholder: "Search mods...",

      oninput: function () {
        S.modSearch = searchIn.value;
        render();
      }
    });

    return h("div", null,

      h("div", { class: "mods-header" },

        h("h2", {
          style: "font-size:18px;"
        }, "Browse mods")
      ),

      h("div", { class: "filter-row" },

        searchIn,

        cats.map(function (c) {
          return h("button", {

            class: "chip-btn" +
              (S.modFilter === c ? " active" : ""),

            onclick: function () {
              S.modFilter = c;
              render();
            }

          }, c);
        })
      ),

      h("div", { class: "mods-grid" },

        filtered.map(function (m) {
          var added = !!activeInst.mods[m.id];

          return h("div", { class: "mod-card" },

            h("div", { class: "mod-top" },

              h("div", null,

                h("b", {
                  style: "font-size:14px;"
                }, m.name),

                h("small", {
                  style: "display:block;color:var(--muted);font-size:11.5px;"
                }, m.category)
              ),

              h("button", {

                class: "btn " + (added ? "added" : ""),

                onclick: function () {
                  activeInst.mods[m.id] = !added;
                  save();
                  render();
                }

              }, added ? "✓ Added" : "+ Add")
            ),

            h("p", {
              style: "font-size:12.5px;color:var(--muted);"
            }, m.desc)
          );
        })
      )
    );
  };

  /* =========================
     CLIPS
     ========================= */

  pages.clips = function () {
    return h("div", {
      class: "card",
      style: "text-align:center;padding:56px 24px;"
    },

      h("h3", {
        style: "margin-bottom:6px;"
      }, "No replay clips yet"),

      h("p", {
        style: "color:var(--muted);font-size:13.5px;margin-bottom:16px;"
      }, "Press F9 in-game to capture highlights."),

      h("button", {
        class: "btn primary",
        onclick: function () {
          launch();
        }
      }, "Launch Game")
    );
  };

  /* =========================
     SOCIAL
     ========================= */

  pages.social = function () {
    var msgIn = h("input", {
      type: "text",
      placeholder: "Send a message...",
      style: "flex:1;"
    });

    return h("div", { class: "social-layout" },

      h("div", { class: "social-side" },

        h("b", null, "Messages"),

        S.friends.map(function (f) {
          return h("div", {
            style: "padding:9px 10px;border-radius:8px;background:var(--panel-2);"
          },

            h("b", {
              style: "font-size:13px;display:block;"
            }, f.name),

            h("small", {
              style: "color:var(--green);font-size:11px;"
            }, f.status)
          );
        })
      ),

      h("div", { class: "social-main" },

        S.messages.map(function (m) {
          return h("div", {
            class: "card",
            style: "width:100%;max-width:440px;text-align:left;margin-bottom:8px;"
          },

            h("b", {
              style: "color:var(--accent);font-size:12px;"
            }, m.from),

            h("p", null, m.text)
          );
        }),

        h("div", {
          style: "display:flex;gap:8px;width:100%;max-width:440px;"
        },

          msgIn,

          h("button", {
            class: "btn primary",

            onclick: function () {
              if (!msgIn.value.trim()) return;

              S.messages.push({
                from: S.profile.name,
                text: msgIn.value.trim()
              });

              msgIn.value = "";

              save();
              render();
            }

          }, "Send")
        )
      )
    );
  };

  /* =========================
     WARDROBE
     ========================= */

  pages.wardrobe = function () {
    var poses = [
      "Idle",
      "Walk",
      "Run",
      "Wave",
      "Crouch",
      "Dance"
    ];

    var importIn = h("input", {
      type: "text",
      placeholder: "Minecraft username",
      style: "flex:1;"
    });

    var skinUrl =
      "https://mc-heads.net/avatar/" +
      encodeURIComponent(S.profile.name || "Steve") +
      "/180";

    return h("div", { class: "wardrobe-layout" },

      h("div", { class: "wardrobe-stage" },

        h("span", {
          style: "background:rgba(0,0,0,0.5);padding:4px 12px;border-radius:6px;font-weight:700;font-size:13px;"
        }, S.profile.name),

        h("img", {
          src: skinUrl,
          alt: "Skin",
          style: "height:240px;image-rendering:pixelated;"
        }),

        h("div", { class: "pose-bar" },

          poses.map(function (p) {
            return h("button", {

              class: "pose-btn" +
                (S.wardrobePose === p ? " active" : ""),

              onclick: function () {
                S.wardrobePose = p;
                render();
              }

            }, p);
          })
        )
      ),

      h("div", {
        class: "card",
        style: "display:flex;flex-direction:column;gap:14px;"
      },

        h("b", null, "Import Skin"),

        h("div", {
          style: "display:flex;gap:8px;"
        },

          importIn,

          h("button", {
            class: "btn primary",

            onclick: function () {
              if (!importIn.value.trim()) return;

              S.profile.name = importIn.value.trim();

              save();
              syncTopbar();
              render();
            }

          }, "Import")
        )
      )
    );
  };

  /* =========================
     SERVERS
     ========================= */

  pages.servers = function () {
    var nameIn = h("input", {
      type: "text",
      placeholder: "Server name"
    });

    var ipIn = h("input", {
      type: "text",
      placeholder: "Server IP"
    });

    return h("div", null,

      h("div", {
        class: "card",
        style: "display:flex;gap:10px;margin-bottom:16px;"
      },

        nameIn,
        ipIn,

        h("button", {
          class: "btn primary",

          onclick: function () {
            if (!ipIn.value.trim()) return;

            S.servers.unshift({
              id: uid(),
              name: nameIn.value.trim() || ipIn.value.trim(),
              ip: ipIn.value.trim(),
              version: "1.8 - 1.21"
            });

            save();
            render();
          }

        }, "+ Add")
      ),

      S.servers.map(function (srv) {
        return h("div", {
          class: "card",
          style: "display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"
        },

          h("div", null,

            h("b", null, srv.name),

            h("small", {
              style: "display:block;color:var(--muted);"
            }, srv.ip)
          ),

          h("div", {
            style: "display:flex;gap:8px;"
          },

            h("button", {
              class: "btn",
              onclick: function () {
                copy(srv.ip);
              }
            }, "Copy"),

            h("button", {
              class: "btn primary",
              onclick: function () {
                launch({ serverIp: srv.ip });
              }
            }, "▶ Join")
          )
        );
      })
    );
  };

  /* =========================
     SETTINGS
     ========================= */

  pages.settings = function () {
    var nameIn = h("input", {
      type: "text",
      value: S.profile.name
    });

    return h("div", { class: "card" },

      h("h3", {
        style: "margin-bottom:14px;"
      }, "Settings"),

      h("div", { class: "setting-row" },

        h("b", null, "Username"),

        h("div", {
          style: "display:flex;gap:8px;"
        },

          nameIn,

          h("button", {
            class: "btn",

            onclick: function () {
              S.profile.name = nameIn.value.trim() || "Player";

              save();
              syncTopbar();

              toast("Saved");
            }

          }, "Save")
        )
      ),

      h("div", { class: "setting-row" },

        h("b", null, "Accent"),

        h("div", {
          style: "display:flex;gap:6px;"
        },

          Object.keys(ACCENTS).map(function (k) {
            return h("button", {

              class: "btn" +
                (S.settings.accent === k ? " primary" : ""),

              onclick: function () {
                S.settings.accent = k;

                applyTheme();
                save();
                render();
              }

            }, k);
          })
        )
      )
    );
  };

  /* =========================
     THEME
     ========================= */

  function applyTheme() {
    document.documentElement.style.setProperty(
      "--accent",
      ACCENTS[S.settings.accent] || ACCENTS.periwinkle
    );
  }

  /* =========================
     TOPBAR
     ========================= */

  function syncTopbar() {
    var u = document.getElementById("navUsername");
    var a = document.getElementById("navAvatar");
    var st = document.getElementById("streakPill");

    if (u) {
      u.textContent = S.profile.name || "Player";
    }

    if (a) {
      a.src =
        "https://mc-heads.net/avatar/" +
        encodeURIComponent(S.profile.name || "Steve") +
        "/24";
    }

    if (st) {
      st.textContent = "🔥 " + (S.streak || 1);
    }
  }

  /* =========================
     PAGE RENDERING
     ========================= */

  function render() {
    var route = (location.hash || "#/home").replace(/^#\//, "");

    if (!pages[route]) {
      route = "home";
    }

    document.querySelectorAll("#topnav a").forEach(function (a) {
      a.classList.toggle(
        "active",
        a.getAttribute("data-route") === route
      );
    });

    var view = document.getElementById("view");

    if (view) {
      view.innerHTML = "";
      view.append(pages[route]());
    }

    syncTopbar();
  }

  /* =========================
     INITIALIZATION
     ========================= */

  window.addEventListener("hashchange", render);

  applyTheme();
  render();

})();
