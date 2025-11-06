// Global variables defined by Zotero
declare const _globalThis: {
  [key: string]: any;
  Zotero?: _ZoteroTypes.Zotero;
  ZoteroPane?: _ZoteroTypes.ZoteroPane;
  window?: Window;
  addon?: any;
  ztoolkit?: ZToolkit;
};

declare const Zotero: _ZoteroTypes.Zotero;
declare const ZoteroPane: _ZoteroTypes.ZoteroPane;

// addon instance
declare const addon: {
  data: {
    config: {
      addonID: string;
      addonRef: string;
      addonInstance: string;
      [key: string]: any;
    };
    ztoolkit: ZToolkit;
    [key: string]: any;
  };
  [key: string]: any;
};

// Global environment
declare const __env__: "development" | "production";

// zotero-plugin-toolkit
type ZToolkit = import("zotero-plugin-toolkit").ZoteroToolkit;