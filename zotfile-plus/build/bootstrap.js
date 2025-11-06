/**
 * ZotFile+ Bootstrap
 * Bootstrap file for Zotero plugin
 */

// Components
const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

// Import necessary modules
Cu.import('resource://gre/modules/Services.jsm');

/**
 * Install hook
 */
function install(data, reason) {
  // Nothing needed for install in modern Zotero plugins
}

/**
 * Startup hook
 */
function startup(data, reason) {
  // Load the main modules in the correct dependency order
  try {
    // Load core modules first
    Services.scriptloader.loadSubScript(
      data.resourceURI.spec + 'content/wildcards.js',
      null,
      'UTF-8'
    );
    Services.scriptloader.loadSubScript(
      data.resourceURI.spec + 'content/formatter.js',
      null,
      'UTF-8'
    );
    Services.scriptloader.loadSubScript(
      data.resourceURI.spec + 'content/renamer.js',
      null,
      'UTF-8'
    );
    
    // Load UI module
    Services.scriptloader.loadSubScript(
      data.resourceURI.spec + 'content/ui.js',
      null,
      'UTF-8'
    );
    
    // Initialize the plugin
    if (typeof Zotero.ZotFilePlus !== 'undefined' && Zotero.ZotFilePlus.init) {
      Zotero.ZotFilePlus.init();
    }
  } catch (e) {
    Cu.reportError("Failed to load ZotFile+ scripts: " + e);
    Cu.reportError(e.stack);
    throw e;
  }
}

/**
 * Shutdown hook
 */
function shutdown(data, reason) {
  if (reason === APP_SHUTDOWN) {
    return;
  }
  
  // Close any open windows/dialogs
  const windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    const win = windows.getNext();
    if (win.Zotero && win.Zotero.ZotFilePlus) {
      try {
        if (typeof win.Zotero.ZotFilePlus.shutdown === 'function') {
          win.Zotero.ZotFilePlus.shutdown();
        }
      } catch (e) {
        Cu.reportError("Error shutting down ZotFilePlus: " + e);
      }
    }
  }

  // Unload the scripts in reverse order
  try {
    // Try to shutdown the plugin if initialized
    if (Zotero.ZotFilePlus && typeof Zotero.ZotFilePlus.shutdown === 'function') {
      Zotero.ZotFilePlus.shutdown();
    }
    
    // Unload each module in reverse order
    Services.scriptloader.unloadSubScript(
      data.resourceURI.spec + 'content/ui.js'
    );
    Services.scriptloader.unloadSubScript(
      data.resourceURI.spec + 'content/renamer.js'
    );
    Services.scriptloader.unloadSubScript(
      data.resourceURI.spec + 'content/formatter.js'
    );
    Services.scriptloader.unloadSubScript(
      data.resourceURI.spec + 'content/wildcards.js'
    );
  } catch (e) {
    Cu.reportError("Error unloading ZotFilePlus scripts: " + e);
  }
}

/**
 * Upgrade hook
 */
function upgrade(data, reason) {
  // Handle upgrade logic if needed
}