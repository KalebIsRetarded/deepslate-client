/* ==========================================================================
   DEEPSLATE CLIENT - CENTRAL CONFIGURATION
   This is the ONLY place the game destination is set. Visitors cannot see
   or edit it in the interface, and it is never saved in their browser.
   (Anyone who opens browser DevTools can still see this file - that is
   unavoidable for any static website. See README.md.)
   ========================================================================== */
window.DEEPSLATE_CONFIG = {
  APP_VERSION: "0.3.0",

  // The only Minecraft version this launcher supports.
  VERSION: "1.21.11",

  // Where the Play button sends players.
  //   ""                      -> game engine NOT connected (Play shows a notice)
  //   "https://example.com/"  -> an https:// page you are allowed to host/use
  //   "/game/index.html"      -> a game build you upload inside this project
  GAME_URL: "",

  // Only set supportsModLoading to true if your game engine actually
  // implements the Deepslate mod handshake described in README.md.
  ENGINE: {
    name: "Not connected",
    supportsModLoading: false
  },

  /* MOD CATALOG
     status "compatible": a real mod file built for your game engine, placed
                          in /mods/ (e.g. file: "mods/zoom.js"). It can only
                          be switched on when ENGINE.supportsModLoading is true.
     status "demo":       a demonstration entry. It has NO file and does NOT
                          change the game. Ordinary Java Edition mods (Fabric,
                          Forge, NeoForge .jar files) do NOT work in a browser
                          client.
     Currently every entry is a demo - there are no real mod files yet. */
  MODS: [
    { id: "zoom",       name: "Zoom",          category: "Utility",  status: "demo", desc: "Hold a key to zoom the camera." },
    { id: "fps-hud",    name: "FPS Counter",   category: "HUD",      status: "demo", desc: "Shows frames per second on screen." },
    { id: "keystrokes", name: "Keystrokes",    category: "HUD",      status: "demo", desc: "Displays pressed movement keys and mouse buttons." },
    { id: "fullbright", name: "Fullbright",    category: "Visual",   status: "demo", desc: "Makes dark areas easier to see." },
    { id: "cps",        name: "CPS Counter",   category: "HUD",      status: "demo", desc: "Shows clicks per second." },
    { id: "coords",     name: "Coordinates HUD", category: "HUD",    status: "demo", desc: "Always-visible XYZ position readout." }
    /* Example of a REAL entry once your engine supports it:
    { id: "my-mod", name: "My Mod", category: "Utility", status: "compatible",
      file: "mods/my-mod.js", desc: "What it does." } */
  ]
};
