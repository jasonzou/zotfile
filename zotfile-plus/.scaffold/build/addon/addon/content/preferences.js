/**
 * ZotFile+ Preferences Dialog JavaScript
 */

(function() {
    'use strict';

    const prefPrefix = 'extensions.zotfileplus.';

    // Preference field mappings
    const prefFields = {
        // Text inputs
        'renamePattern': { type: 'string', default: '{%a_}{%y_}{%t}' },
        'renameFormat_patent': { type: 'string', default: '{%t} - {%y}' },
        'etAlString': { type: 'string', default: ' et al' },
        'authorsDelimiter': { type: 'string', default: '_' },
        'customWildcards': { type: 'string', default: '{}' },
        'filetypes': { type: 'string', default: 'pdf;epub;mobi;doc;docx' },
        'userInput_Default': { type: 'string', default: '' },

        // Number inputs
        'maxTitleLength': { type: 'int', default: 80 },
        'maxAuthors': { type: 'int', default: 3 },
        'maxAuthorsTruncate': { type: 'int', default: 2 },
        'confirmation_batch': { type: 'int', default: 5 },
        'automatic_renaming': { type: 'int', default: 1 },
        'info_window_duration': { type: 'int', default: 6000 },
        'info_window_duration_clickable': { type: 'int', default: 8000 },
        'truncate_authors_max': { type: 'int', default: 2 },

        // Checkboxes
        'truncateTitle': { type: 'bool', default: true },
        'smartTruncate': { type: 'bool', default: true },
        'maxTitleLengthSmart': { type: 'bool', default: true },
        'truncateAuthors': { type: 'bool', default: true },
        'addEtAl': { type: 'bool', default: true },
        'removeDiacritics': { type: 'bool', default: false },
        'removePeriods': { type: 'bool', default: false },
        'replaceBlanks': { type: 'bool', default: false },
        'toLowerCase': { type: 'bool', default: false },
        'useZoteroToRename': { type: 'bool', default: false },
        'useFileTypes': { type: 'bool', default: false },
        'allFiles': { type: 'bool', default: false },
        'confirmation': { type: 'bool', default: true },
        'confirmation_batch_ask': { type: 'bool', default: true },
        'userInput': { type: 'bool', default: false },
        'disable_renaming': { type: 'bool', default: false },
        'zotfile3update': { type: 'bool', default: false },
        'zotero7transition': { type: 'bool', default: true }
    };

    /**
     * Get preference value
     */
    function getPref(key) {
        try {
            const pref = prefFields[key];
            if (!pref) return null;

            const fullKey = prefPrefix + key;

            switch (pref.type) {
                case 'bool':
                    return Zotero.Prefs.get(fullKey, true) !== undefined
                        ? Zotero.Prefs.get(fullKey, true)
                        : pref.default;
                case 'int':
                    return Zotero.Prefs.get(fullKey, true) !== undefined
                        ? Zotero.Prefs.get(fullKey, true)
                        : pref.default;
                case 'string':
                    const value = Zotero.Prefs.get(fullKey, true);
                    return value !== undefined ? value : pref.default;
                default:
                    return pref.default;
            }
        } catch (e) {
            console.error('[ZotFile+ Prefs] Error getting pref ' + key + ':', e);
            return prefFields[key].default;
        }
    }

    /**
     * Set preference value
     */
    function setPref(key, value) {
        try {
            const fullKey = prefPrefix + key;
            Zotero.Prefs.set(fullKey, value, true);
            Zotero.debug('[ZotFile+ Prefs] Set ' + key + ' = ' + value);
        } catch (e) {
            console.error('[ZotFile+ Prefs] Error setting pref ' + key + ':', e);
        }
    }

    /**
     * Load all preferences from Zotero into the form
     */
    function loadPreferences() {
        Zotero.debug('[ZotFile+ Prefs] Loading preferences...');

        for (const [key, config] of Object.entries(prefFields)) {
            const element = document.getElementById(key);
            if (!element) {
                console.warn('[ZotFile+ Prefs] Element not found: ' + key);
                continue;
            }

            const value = getPref(key);
            Zotero.debug('[ZotFile+ Prefs] Loading ' + key + ' = ' + value);

            if (config.type === 'bool') {
                element.checked = value;
            } else if (element.tagName === 'SELECT') {
                // Handle select elements specially
                element.value = value;
            } else {
                element.value = value;
            }
        }

        Zotero.debug('[ZotFile+ Prefs] Preferences loaded');
    }

    /**
     * Save all preferences from the form to Zotero
     */
    function savePreferences() {
        Zotero.debug('[ZotFile+ Prefs] Saving preferences...');

        try {
            for (const [key, config] of Object.entries(prefFields)) {
                const element = document.getElementById(key);
                if (!element) {
                    console.warn('[ZotFile+ Prefs] Element not found: ' + key);
                    continue;
                }

                let value;
                if (config.type === 'bool') {
                    value = element.checked;
                } else if (config.type === 'int') {
                    if (element.tagName === 'SELECT') {
                        // For select elements, always treat as integer
                        value = parseInt(element.value, 10);
                    } else {
                        value = parseInt(element.value, 10);
                    }
                    if (isNaN(value)) {
                        value = config.default;
                    }
                } else {
                    value = element.value;
                }

                setPref(key, value);
            }

            // Validate JSON for custom wildcards
            const customWildcardsEl = document.getElementById('customWildcards');
            if (customWildcardsEl && customWildcardsEl.value.trim()) {
                try {
                    JSON.parse(customWildcardsEl.value);
                } catch (e) {
                    alert('Invalid JSON in Custom Wildcards:\n\n' + e.message);
                    return false;
                }
            }

            Zotero.debug('[ZotFile+ Prefs] Preferences saved successfully');

            // Reload plugin to apply changes
            try {
                // Access global ZotFilePlus object
                const mainWindow = Services.wm.getMostRecentWindow('navigator:browser');
                if (mainWindow && mainWindow.ZotFilePlus) {
                    Zotero.debug('[ZotFile+ Prefs] Reloading custom wildcards...');
                    mainWindow.ZotFilePlus.loadCustomWildcards();
                    // Reinitialize formatter with new prefs
                    mainWindow.ZotFilePlus.Formatter = new mainWindow.ZotFilePlus_Formatter();
                    Zotero.debug('[ZotFile+ Prefs] Plugin modules reloaded');
                }
            } catch (e) {
                Zotero.debug('[ZotFile+ Prefs] Note: Could not reload plugin modules: ' + e.message);
                // Not critical, preferences are saved
            }

            return true;
        } catch (e) {
            console.error('[ZotFile+ Prefs] Error saving preferences:', e);
            alert('Error saving preferences:\n\n' + e.message);
            return false;
        }
    }

    /**
     * Reset all preferences to defaults
     */
    function resetPreferences() {
        if (!confirm('Reset all preferences to default values?')) {
            return;
        }

        Zotero.debug('[ZotFile+ Prefs] Resetting to defaults...');

        for (const [key, config] of Object.entries(prefFields)) {
            const element = document.getElementById(key);
            if (!element) continue;

            if (config.type === 'bool') {
                element.checked = config.default;
            } else {
                element.value = config.default;
            }
        }

        Zotero.debug('[ZotFile+ Prefs] Reset complete (not saved yet)');
        alert('Preferences reset to defaults. Click Save to apply.');
    }

    /**
     * Initialize the preferences dialog
     */
    function init() {
        Zotero.debug('[ZotFile+ Prefs] Initializing preferences dialog');

        // Load current preferences
        loadPreferences();

        // Setup button handlers
        document.getElementById('saveButton').addEventListener('click', () => {
            if (savePreferences()) {
                window.close();
            }
        });

        document.getElementById('cancelButton').addEventListener('click', () => {
            window.close();
        });

        document.getElementById('resetButton').addEventListener('click', () => {
            resetPreferences();
        });

        // Enable/disable dependent checkboxes
        document.getElementById('truncateAuthors').addEventListener('change', (e) => {
            const addEtAlEl = document.getElementById('addEtAl');
            addEtAlEl.disabled = !e.target.checked;
        });

        // Format JSON on blur for custom wildcards
        document.getElementById('customWildcards').addEventListener('blur', (e) => {
            const value = e.target.value.trim();
            if (value && value !== '{}') {
                try {
                    const parsed = JSON.parse(value);
                    e.target.value = JSON.stringify(parsed, null, 2);
                } catch (err) {
                    // Leave as-is if invalid, will show error on save
                }
            }
        });

        Zotero.debug('[ZotFile+ Prefs] Initialization complete');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
