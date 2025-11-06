import { ZoteroToolkit } from "zotero-plugin-toolkit";
import config from "../../package.json";

export function createZToolkit(): ZToolkit {
  const _ztoolkit = new ZoteroToolkit();
  // Register addon's basic information
  (_ztoolkit as any).basic.register(config);
  // Register other APIs
  // _ztoolkit.ui.register();
  // _ztoolkit.PreferencePane.register(config.prefsPrefix, config.addonRef);
  return _ztoolkit;
}