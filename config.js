/* ==========================================================================
   DEEPSLATE CLIENT - CENTRAL CONFIGURATION
   This is the ONLY place the game destination is set. Visitors cannot see
   or edit it in the interface, and it is never saved in their browser.
   ========================================================================== */
window.DEEPSLATE_CONFIG = {
  APP_VERSION: "0.4.0",

  // Default Minecraft version (kept for backward compatibility with current app.js)
  VERSION: "1.21.11",
  DEFAULT_VERSION: "1.21.11",

  // Multi-version engine presets (like Chromium Client's version selector)
  VERSIONS: [
    { id: "1.21.11", label: "1.21.11 (Latest)", url: "", tag: "Modern" },
    { id: "1.8.8",   label: "1.8.8 PvP (WASM)", url: "", tag: "Competitive" },
    { id: "1.12.2",  label: "1.12.2 Modded",    url: "", tag: "Classic" }
  ],

  // Where the Play button sends players.
  //   ""                      -> game engine NOT connected (Play shows a notice)
  //   "https://example.com"  -> an https:// page you are allowed to host/use
  //   "/game/index.html"      -> a game build you upload inside this project
  GAME_URL: "",

  ENGINE: {
    name: "Deepslate Web Engine",
    supportsModLoading: true
  },

  // Pre-populated featured servers (users can also add their own)
  FEATURED_SERVERS: [
    { name: "ArchMC Network",  ip: "mc.arch.lol",    version: "1.8 - 1.21", featured: true },
    { name: "ZythMC Practice", ip: "play.zyth.me",   version: "1.8.8",      featured: true },
    { name: "Aeon Network",    ip: "aeonnetwork.gg", version: "1.8 - 1.20", featured: true }
  ],

  // Toggleable client modules (ready to pass to your game iframe)
  MODS: [
    { id: "fps-boost",  name: "Sodium FPS Boost", category: "Performance", status: "compatible", desc: "Optimizes chunk rendering and entity culling." },
    { id: "zoom",       name: "OptiFine Zoom",    category: "Utility",     status: "compatible", desc: "Hold C to smoothly zoom the camera." },
    { id: "fps-hud",    name: "FPS Counter",      category: "HUD",         status: "compatible", desc: "Displays real-time frames per second." },
    { id: "keystrokes", name: "Keystrokes HUD",   category: "HUD",         status: "compatible", desc: "Shows WASD, Space, and LMB/RMB clicks." },
    { id: "fullbright", name: "Fullbright",       category: "Visual",      status: "compatible", desc: "Maxes gamma so caves are always lit." },
    { id: "cps",        name: "CPS Counter",      category: "HUD",         status: "compatible", desc: "Tracks left and right clicks per second." },
    { id: "armor-hud",  name: "Armor Status",     category: "HUD",         status: "compatible", desc: "Displays equipped armor durability on screen." },
    { id: "hitboxes",   name: "Clean Hitboxes",   category: "PvP",         status: "compatible", desc: "Toggles crisp entity bounding boxes." }
  ]
};
