window.DEEPSLATE_CONFIG = {
  APP_VERSION: "0.6.0",
  VERSION: "1.21.11",
  DEFAULT_VERSION: "1.21.11",

  VERSIONS: [
    { id: "1.21.11", label: "1.21.11 (Latest)", url: "/game/index.html" },
    { id: "1.8.8",   label: "1.8.8 PvP (WASM)", url: "/game/index.html" }
  ],

  GAME_URL: "/game/index.html",

  ENGINE: {
    name: "Deepslate Web Engine",
    supportsModLoading: true
  },

  FEATURED_SERVERS: [
    { name: "ArchMC Network",  ip: "wss://mc.arch.lol",  version: "1.8 - 1.21" },
    { name: "ZythMC Practice", ip: "wss://play.zyth.me", version: "1.8.8" }
  ],

  MODS: [
    {
      id: "fps-boost",
      name: "Sodium",
      category: "Performance",
      code: "SO",
      image: "mods/sodium.png",
      desc: "Performance improvements."
    },
    {
      id: "iris",
      name: "Iris Shaders",
      category: "Visuals",
      code: "IR",
      image: "mods/iris.png",
      desc: "Shader support."
    },
    {
      id: "zoom",
      name: "ZoomX Smooth",
      category: "Utility",
      code: "ZM",
      image: "mods/zoom.png",
      desc: "Smooth zoom with scroll adjustment."
    },
    {
      id: "hitboxes",
      name: "Combat Hitboxes",
      category: "PvP",
      code: "HB",
      image: "mods/hitboxes.png",
      desc: "Custom entity hitbox rendering."
    },
    {
      id: "armor-hud",
      name: "Uku's Armor HUD",
      category: "HUD",
      code: "AR",
      image: "mods/armor-hud.png",
      desc: "Shows armor durability."
    },
    {
      id: "fullbright",
      name: "Fullbright & Clear",
      category: "Visuals",
      code: "FB",
      image: "mods/fullbright.png",
      desc: "Fullbright and visual improvements."
    }
  ]
};
