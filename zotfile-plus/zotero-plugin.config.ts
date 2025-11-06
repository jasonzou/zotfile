import { defineConfig } from "zotero-plugin-scaffold";

export default defineConfig({
  name: "ZotFile+",
  fullName: "ZotFile+ for Zotero 7",
  platform: {
    darwin: {
      xhtml: "chrome://zotfileplus/content/preferences.xhtml",
    },
    linux: {
      xhtml: "chrome://zotfileplus/content/preferences.xhtml",
    },
    win32: {
      xhtml: "chrome://zotfileplus/content/preferences.xhtml",
    },
  },
  build: {
    assets: [
      "addon/**/*.*",
      "content/**/*.*",
      "prefs/**/*.*",
      "chrome.manifest",
      // Exclude sources
      "!src/**/*.*",
      "!*.ts",
      "!*.tsx",
      "!tsconfig.json",
      "!zotero-plugin.config.ts",
      "!*.log",
      "!node_modules/**/*.*",
      "!dist/**/*.*",
      "!release/**/*.*",
      // Include dependencies
      "node_modules/**/zotero-plugin-toolkit/**/*.*",
    ],
  },
});
