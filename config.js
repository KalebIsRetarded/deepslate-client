window.DEEPSLATE_CONFIG = {
  APP_VERSION: "0.5.0",
  VERSION: "1.21.11",
  DEFAULT_VERSION: "1.21.11",
  VERSIONS: [
    { id: "1.21.11", label: "1.21.11 (Latest)", url: "" },
    { id: "1.8.8",   label: "1.8.8 PvP (WASM)", url: "" }
  ],
  GAME_URL: "",
  ENGINE: { name: "Deepslate Web Engine", supportsModLoading: true },
  FEATURED_SERVERS: [
    { name: "ArchMC Network",  ip: "wss://mc.arch.lol",  version: "1.8 - 1.21" },
    { name: "ZythMC Practice", ip: "wss://play.zyth.me", version: "1.8.8" }
  ],
  MODS: [
    { id: "fps-boost",   name: "Sodium",               author: "Deepslate",    category: "Performance", icon: "🟩", color: "#22c55e", desc: "Sodium-style video settings built for the browser, on the game's own renderer for maximum FPS." },
    { id: "iris",        name: "Iris Shaders",         author: "IrisShaders",  category: "Visuals",     icon: "🌈", color: "#3b82f6", tag: "Experimental", dep: "Needs Sodium (added for you)", warn: "Heavy: about 2-3x lower FPS", desc: "Load shader packs like Complementary in the browser." },
    { id: "shade",       name: "Shade & Saturation",   author: "Cortex",       category: "Visuals",     icon: "🎚️", color: "#eab308", dep: "Needs Sodium (added for you)", desc: "Sliders for block shading and colour saturation." },
    { id: "replay",      name: "Deepslate Replay",     author: "Deepslate",    category: "Utility",     icon: "▶️", color: "#ef4444", desc: "Record your games and watch them back from any angle. F9 records." },
    { id: "zoom",        name: "ZoomX Smooth",         author: "spunkyinsaan", category: "Utility",     icon: "🔍", color: "#06b6d4", desc: "Smooth zoom with scroll adjustment. Hold C or Z to zoom." },
    { id: "hitboxes",    name: "Combat Hitboxes",      author: "sootysplash",  category: "PvP",         icon: "🎯", color: "#f43f5e", desc: "Custom entity hitbox rendering for timing hits and reach." },
    { id: "armor-hud",   name: "Uku's Armor HUD",      author: "uku",          category: "HUD",         icon: "🛡️", color: "#10b981", dep: "Needs ukulib (added for you)", desc: "Shows your armor durability next to the hotbar." },
    { id: "appleskin",   name: "AppleSkin",            author: "squeek502",    category: "HUD",         icon: "🍎", color: "#ef4444", desc: "Shows hunger, saturation, and exhaustion values on the HUD." },
    { id: "litematica",  name: "Litematica",           author: "masa",         category: "Utility",     icon: "📐", color: "#8b5cf6", dep: "Needs MaLiLib (added for you)", desc: "Load schematics as a ghost build and place it block by block." },
    { id: "fullbright",  name: "Fullbright & Clear",   author: "Deepslate",    category: "Visuals",     icon: "☀️", color: "#f59e0b", desc: "Fullbright, low fire and shield, and no pumpkin blur." },
    { id: "fps-hud",     name: "FPS & CPS Counter",    author: "Deepslate",    category: "HUD",         icon: "⚡", color: "#a594f9", desc: "Displays real-time frames and clicks per second on screen." },
    { id: "ukulib",      name: "ukulib",               author: "uku",          category: "Libraries",   icon: "📦", color: "#6366f1", desc: "Library and config screens for uku's HUD and PvP mods." }
  ]
};
