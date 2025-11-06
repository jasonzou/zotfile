/**
 * ZotFile+ Main Initialization
 * Entry point for the ZotFile+ plugin
 */

if (typeof Zotero === 'undefined') {
  throw new Error('Zotero is not defined');
}

if (!Zotero.ZotFilePlus) {
  Zotero.ZotFilePlus = {
    /**
     * Initialize the ZotFilePlus plugin
     */
    init: async function() {
      try {
        Zotero.debug('ZotFile+ Initializing...');
        
        // Create instances of the core modules
        const wildcardEngine = new ZotFilePlus_WildcardEngine();
        const formatter = new ZotFilePlus_Formatter();
        const renamer = new ZotFilePlus_Renamer(wildcardEngine, formatter);
        
        // Load custom wildcards from preferences
        const customWildcardsJSON = Zotero.Prefs.get('extensions.zotfileplus.customWildcards');
        if (customWildcardsJSON) {
          try {
            const customWildcards = JSON.parse(customWildcardsJSON);
            wildcardEngine.loadCustomWildcards(customWildcards);
          } catch (e) {
            Zotero.debug('Error loading custom wildcards: ' + e);
          }
        }
        
        // Initialize UI
        const ui = new ZotFilePlus_UI(renamer);
        await ui.init();
        
        // Store references for later use
        this.wildcardEngine = wildcardEngine;
        this.formatter = formatter;
        this.renamer = renamer;
        this.ui = ui;
        
        Zotero.debug('ZotFile+ Initialized successfully');
      } catch (e) {
        Zotero.logError('Failed to initialize ZotFilePlus: ' + e);
        Zotero.logError(e.stack);
        throw e;
      }
    },
    
    /**
     * Shutdown the plugin
     */
    shutdown: function() {
      if (this.ui) {
        this.ui.cleanup();
      }
      Zotero.debug('ZotFile+ Shutdown');
    }
  };
}

// Auto-initialize when Zotero is ready
if (typeof Zotero === 'object' && Zotero.uiReady) {
  Zotero.ZotFilePlus.init();
} else {
  // Wait for Zotero to be ready
  window.addEventListener('load', function(e) {
    if (Zotero) {
      Zotero.ZotFilePlus.init();
    }
  }, false);
}