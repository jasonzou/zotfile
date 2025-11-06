/**
 * ZotFile+ XUL Preferences Panel JavaScript
 */

if (typeof Zotero == 'undefined') {
    var Zotero = {};
}

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
     * Initialize preferences when the dialog loads
     */
    window.ZotFilePlus_Prefs_Init = function() {
        Zotero.debug('[ZotFile+ XUL Prefs] Initializing XUL preferences panel');
        
        try {
            // Set up live preview or other initialization
            for (const [key, config] of Object.entries(prefFields)) {
                const element = document.getElementById(key);
                if (element) {
                    // Ensure live updates work properly with XUL preferences system
                    element.addEventListener('command', onPreferenceChanged);
                }
            }
            
            Zotero.debug('[ZotFile+ XUL Prefs] Preferences panel initialized');
        } catch (e) {
            Zotero.debug('[ZotFile+ XUL Prefs] Error initializing preferences: ' + e);
            Zotero.logError(e);
        }
    };

    /**
     * Handle preference changes
     */
    function onPreferenceChanged(event) {
        const element = event.target;
        const prefId = element.getAttribute('preference');
        if (!prefId) return;
        
        Zotero.debug('[ZotFile+ XUL Prefs] Preference changed: ' + prefId);
        
        // Validate JSON for custom wildcards
        if (element.id === 'customWildcards') {
            try {
                const value = element.value;
                if (value.trim() && value.trim() !== '{}') {
                    JSON.parse(value);
                }
            } catch (e) {
                alert('Invalid JSON in Custom Wildcards:\n\n' + e.message);
                // Consider reverting to previous value or highlighting error
            }
        }
    }
    
    /**
     * Validate preferences before saving (if needed)
     */
    window.ZotFilePlus_Prefs_Validate = function() {
        const customWildcardsEl = document.getElementById('customWildcards');
        if (customWildcardsEl) {
            try {
                const value = customWildcardsEl.value;
                if (value.trim() && value.trim() !== '{}') {
                    JSON.parse(value);
                }
                return true;
            } catch (e) {
                alert('Invalid JSON in Custom Wildcards:\n\n' + e.message);
                return false;
            }
        }
        return true;
    };
})();