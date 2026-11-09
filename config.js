(function () {
  "use strict";

  window.DEEPSLATE_CONFIG = {
    name: "Deepslate Client",
    version: "1.0.0",
    minecraftVersion: "1.21.11",

    /*
      GAME URL
      Where the Eaglercraft game page lives.

      Option A (same site):   "client/game.html"
        -> put the game file at client/game.html next to index.html.
        -> NOTE: Cloudflare Pages refuses any single file over 25 MiB,
           and your game file is about 44 MiB, so Option A will NOT
           deploy on Cloudflare Pages.

      Option B (other host):  "https://your-name.github.io/deepslate-game/game.html"
        -> host the game file somewhere with a bigger file limit
           (GitHub Pages allows 100 MB per file) and paste the full
           https:// address here.
    */
    gameUrl: "client/game.html",

    accent: "#9b8cff",
    background: "#0b0d12",

    storageKey: "deepslate.client.v1",

    supabaseUrl: "https://yeeuecqqoxhfufebbzrv.supabase.co",
    supabaseAnonKey: "sb_publishable_M9ExQ6S8KlpxIsdcxISZEg_KMtq9cST"
  };
})();
