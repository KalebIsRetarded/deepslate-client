
(function () {
  "use strict";

  try {
    var C = window.DEEPSLATE_CONFIG || {};
    var KEY = "deepslate.v14";

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
        icon: "🟩",
        desc: "Sodium-style video settings built for maximum browser FPS."
      },
      {
        id: "iris",
        name: "Iris Shaders",
        author: "IrisShaders",
        category: "Visuals",
        icon: "🌈",
        dep: "Needs Sodium (added for you)",
        desc: "Load shader packs in the browser."
      },
      {
        id: "zoom",
        name: "ZoomX Smooth",
        author: "spunkyinsaan",
        category: "Utility",
        icon: "🔍",
        desc: "Smooth zoom with scroll adjustment. Hold C to zoom."
      },
      {
        id: "hitboxes",
        name: "Combat Hitboxes",
        author: "sootysplash",
        category: "PvP",
        icon: "🎯",
        desc: "Custom entity hitbox rendering for timing hits and reach."
      },
      {
        id: "armor-hud",
        name: "Uku's Armor HUD",
        author: "uku",
        category: "HUD",
        icon: "🛡️",
        desc: "Shows your armor durability next to the hotbar."
      },
      {
        id: "fullbright",
        name: "Fullbright & Clear",
        author: "Deepslate",
        category: "Visuals",
        icon: "☀️",
        desc: "Fullbright, low fire and shield, and no pumpkin blur."
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
            child.nodeType ? child : document.createTextNode(String(child))
          );
        }
      });

      return element;
    }

    var S = null;

    try {
      S = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (error) {}

    if (!S || typeof S !== "object") {
      S = {
        name: "Crux",
        accent: "periwinkle",
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
        skin: ""
      };
    }

    if (!S.mods) S.mods = {};
    if (!S.servers) S.servers = [];

    function save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(S));
      } catch (error) {}
    }

    function go(newRoute) {
      route = newRoute;
      render();
    }

    function launch(ip) {
      var url = (C.GAME_URL || "").trim();

      if (!url) {
        alert(
          "Set GAME_URL in config.js (e.g. '/game/index.html') to launch " +
          S.version +
          (ip ? " (" + ip + ")" : "") +
          "."
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
            "← Exit"
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

            h(
              "div",
              { class: "cr-inst-label" },
              (S.inst || "MY INSTANCE 1").toUpperCase()
            ),

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
                h("span", null, "STANDARD ENGINE · READY")
              ),

              h(
                "button",
                {
                  class: "play-drop",
                  onclick: function () {
                    S.version =
                      S.version === "1.21.11" ? "1.8.8" : "1.21.11";
                    save();
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
                  onclick: function (event) {
                    event.preventDefault();
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
                  onclick: function (event) {
                    event.preventDefault();
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
                {
                  style: "display:block;color:var(--muted);"
                },
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
        var all =
          Array.isArray(C.MODS) && C.MODS.length
            ? C.MODS
            : DEFAULT_MODS;

        var categories = [
          "All",
          "Performance",
          "Visuals",
          "HUD",
          "PvP",
          "Utility",
          "Libraries"
        ];

        var list = all.filter(function (mod) {
          return (
            (S.filter === "All" || mod.category === S.filter) &&
            (!S.search ||
              mod.name.toLowerCase().indexOf(S.search.toLowerCase()) !== -1)
          );
        });

        var searchInput;

        searchInput = h("input", {
          value: S.search || "",
          placeholder: "Search " + all.length + " mods",
          oninput: function () {
            S.search = searchInput.value;
            render();
          }
        });

        return h(
          "div",
          null,

          h(
            "div",
            { class: "mods-header" },
            h("h2", { style: "font-size:18px;" }, "Browse mods")
          ),

          h(
            "div",
            { class: "mod-featured" },

            h(
              "div",
              {
                style: "display:flex;gap:14px;align-items:center;"
              },

              h(
                "div",
                {
                  class: "mod-icon",
                  style: "width:50px;height:50px;font-size:24px;"
                },
                "💎"
              ),

              h(
                "div",
                null,
                h("b", null, "Deepslate Visuals "),

                h(
                  "span",
                  {
                    style: "font-size:11px;background:rgba(255,255,255,0.1);padding:2px 7px;border-radius:5px;"
                  },
                  "Official"
                ),

                h(
                  "p",
                  {
                    style: "font-size:12.5px;color:var(--muted);margin-top:4px;"
                  },
                  "Custom skies, glass armor, smooth HUD, motion blur and more."
                )
              )
            ),

            h(
              "button",
              {
                class: "btn primary",
                onclick: function () {
                  S.mods["fps-boost"] = true;
                  S.mods["fullbright"] = true;
                  save();
                  render();
                }
              },
              "+ Add to " + (S.inst || "Instance")
            )
          ),

          h(
            "div",
            { class: "filter-row" },

            searchInput,

            categories.map(function (category) {
              return h(
                "button",
                {
                  class:
                    "chip-btn" +
                    (S.filter === category ? " active" : ""),
                  onclick: function () {
                    S.filter = category;
                    render();
                  }
                },
                category
              );
            })
          ),

          h(
            "div",
            { class: "mods-grid" },

            list.map(function (mod) {
              var enabled = !!S.mods[mod.id];

              return h(
                "div",
                { class: "mod-card" },

                h(
                  "div",
                  null,

                  h(
                    "div",
                    { class: "mod-top" },

                    h(
                      "div",
                      {
                        style: "display:flex;gap:10px;align-items:center;"
                      },

                      h(
                        "div",
                        { class: "mod-icon" },
                        mod.icon || "🧩"
                      ),

                      h(
                        "div",
                        null,
                        h(
                          "b",
                          { style: "font-size:14px;" },
                          mod.name
                        ),

                        h(
                          "small",
                          {
                            style: "display:block;color:var(--muted);font-size:11.5px;"
                          },
                          "by " +
                            (mod.author || "Deepslate") +
                            " · " +
                            mod.category
                        )
                      )
                    ),

                    h(
                      "button",
                      {
                        class: "btn " + (enabled ? "added" : ""),
                        onclick: function () {
                          S.mods[mod.id] = !enabled;
                          save();
                          render();
                        }
                      },
                      enabled ? "✓ Added" : "+ Add"
                    )
                  ),

                  h(
                    "p",
                    {
                      style: "font-size:12.5px;color:var(--muted);margin-top:10px;"
                    },
                    mod.desc
                  )
                )
              );
            })
          )
        );
      },

      wardrobe: function () {
        var canvas = h("canvas", {
          width: "280",
          height: "360",
          style: "cursor:grab;"
        });

        if (window.skinview3d) {
          try {
            var viewer = new window.skinview3d.SkinViewer({
              canvas: canvas,
              width: 280,
              height: 360
            });

            if (S.skin) viewer.loadSkin(S.skin);

            viewer.controls.enableRotate = true;
            viewer.controls.enableZoom = true;

            viewer.playerObject.skin.modelType =
              S.model === "Slim" ? "slim" : "default";

            viewer.animation =
              new window.skinview3d.IdleAnimation();
          } catch (error) {
            console.error("Skin viewer error:", error);
          }
        }

        var fileInput = h("input", {
          type: "file",
          accept: "image/png",
          style: "display:none;",

          onchange: function (event) {
            var file = event.target.files.item(0);
            if (!file) return;

            var reader = new FileReader();

            reader.onload = function () {
              S.skin = reader.result;
              save();
              render();
            };

            reader.readAsDataURL(file);
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

              ["Idle", "Walk", "Run", "Wave", "Crouch"].map(function (pose) {
                return h(
                  "button",
                  {
                    class:
                      "pose-btn" +
                      (S.pose === pose ? " active" : ""),
                    onclick: function () {
                      S.pose = pose;
                      render();
                    }
                  },
                  pose
                );
              })
            )
          ),

          h(
            "div",
            {
              class: "card",
              style: "display:flex;flex-direction:column;gap:14px;"
            },

            h("b", null, "Skin"),
            fileInput,

            h(
              "button",
              {
                class: "btn",
                onclick: function () {
                  fileInput.click();
                }
              },
              "↑ Upload 64×64 PNG"
            ),

            h(
              "div",
              {
                style: "display:grid;grid-template-columns:1fr 1fr;gap:8px;"
              },

              ["Classic", "Slim"].map(function (model) {
                return h(
                  "button",
                  {
                    class:
                      "btn" +
                      (S.model === model ? " primary" : ""),
                    onclick: function () {
                      S.model = model;
                      save();
                      render();
                    }
                  },
                  model
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

          (S.servers || []).map(function (server) {
            return h(
              "div",
              {
                class: "card",
                style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"
              },

              h(
                "div",
                null,
                h("b", null, server.name),
                h(
                  "small",
                  {
                    style: "display:block;color:var(--muted);"
                  },
                  server.ip
                )
              ),

              h(
                "button",
                {
                  class: "btn primary",
                  onclick: function () {
                    launch(server.ip);
                  }
                },
                "▶ Join"
              )
            );
          })
        );
      },

      settings: function () {
        var usernameInput = h("input", {
          value: S.name || "Crux"
        });

        return h(
          "div",
          { class: "card" },

          h(
            "div",
            { class: "setting-row" },

            h("b", null, "Username"),

            h(
              "div",
              { style: "display:flex;gap:8px;" },

              usernameInput,

              h(
                "button",
                {
                  class: "btn",
                  onclick: function () {
                    S.name = usernameInput.value || "Crux";
                    save();
                    render();
                  }
                },
                "Save"
              )
            )
          ),

          h(
            "div",
            { class: "setting-row" },

            h("b", null, "Accent"),

            h(
              "div",
              { style: "display:flex;gap:6px;" },

              Object.keys(ACCENTS).map(function (key) {
                return h(
                  "button",
                  {
                    class:
                      "btn" +
                      (S.accent === key ? " primary" : ""),
                    onclick: function () {
                      S.accent = key;
                      save();
                      render();
                    }
                  },
                  key
                );
              })
            )
          )
        );
      }
    };

    function render() {
      document.documentElement.style.setProperty(
        "--accent",
        ACCENTS[S.accent] || ACCENTS.periwinkle
      );

      var currentRoute = pages[route] ? route : "home";

      document.querySelectorAll("#topnav a").forEach(function (link) {
        link.classList.toggle(
          "active",
          link.getAttribute("data-route") === currentRoute
        );
      });

      var view = document.getElementById("view");

      if (view) {
        view.innerHTML = "";

        // FIX: Render the actual page instead of the undefined "pagesr".
        view.append(pages[currentRoute]());
      }

      var username = document.getElementById("navUsername");

      if (username) {
        username.textContent = S.name || "Player";
      }
    }

    document.querySelectorAll("[data-route]").forEach(function (element) {
      element.addEventListener("click", function (event) {
        event.preventDefault();
        go(element.getAttribute("data-route"));
      });
    });

    var commandButton = document.getElementById("commandHint");

    if (commandButton) {
      commandButton.addEventListener("click", function () {
        go("mods");
      });
    }

    render();

  } catch (error) {
    console.error("Deepslate Client error:", error);

    var view = document.getElementById("view") || document.body;

    view.innerHTML = "";

    var errorMessage = document.createElement("p");
    errorMessage.style.color = "#ff6b6b";
    errorMessage.textContent =
      "Deepslate Client error: " + error.message;

    view.append(errorMessage);
  }
})();
