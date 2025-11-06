/**
 * ZotFile+ Wildcard Engine
 * Parses and replaces wildcard patterns in filenames
 * Based on ZotFile's wildcard system, modernized for Zotero 7
 */

class ZotFilePlus_WildcardEngine {
  constructor() {
    this.builtinWildcards = this.getBuiltinWildcards();
    this.customWildcards = {};
  }

  /**
   * Get built-in wildcard definitions
   * Based on ZotFile's wildcard system
   */
  getBuiltinWildcards() {
    return {
      // Author wildcards
      'a': { field: 'author', processor: 'formatAuthors' },
      'A': { field: 'author', processor: 'formatAuthors', operation: 'firstInitial' },
      'F': { field: 'author', processor: 'formatAuthorsLastF' },
      'I': { field: 'author', processor: 'formatAuthorsInitials' },

      // Editor wildcards
      'd': { field: 'editor', processor: 'formatAuthors' },
      'D': { field: 'editor', processor: 'formatAuthors', operation: 'firstInitial' },
      'L': { field: 'editor', processor: 'formatAuthorsLastF' },
      'l': { field: 'editor', processor: 'formatAuthorsInitials' },

      // Title wildcards
      't': { field: 'title', processor: 'formatTitle' },
      'h': { field: 'shortTitle', fallback: 'title', processor: 'formatTitle' },

      // Publication wildcards
      'j': { field: 'publicationTitle' },
      's': { field: 'journalAbbreviation', fallback: 'publicationTitle' },
      'p': { field: 'publisher' },

      // Context-aware wildcard
      'w': { processor: 'getContextField' },

      // Date wildcards
      'y': { field: 'date', operation: 'extractYear' },

      // Other metadata
      'v': { field: 'volume' },
      'e': { field: 'issue' },
      'f': { field: 'pages' },
      'T': { field: 'itemType', processor: 'getItemTypeName' },
      'c': { processor: 'getCollectionPath' },
      'x': { field: 'extra' }
    };
  }

  /**
   * Load custom wildcard definitions from JSON
   */
  loadCustomWildcards(customDefs) {
    this.customWildcards = customDefs || {};
  }

  /**
   * Get all available wildcards (built-in + custom)
   */
  getAvailableWildcards() {
    return {
      ...this.builtinWildcards,
      ...this.customWildcards
    };
  }

  /**
   * Main method: Replace wildcards in a pattern with item data
   * @param {Zotero.Item} item - The Zotero item
   * @param {string} pattern - Pattern like "{%a_}{%y_}{%t}"
   * @returns {string} - Processed filename
   */
  replaceWildcard(item, pattern) {
    if (!pattern) return '';

    let result = pattern;

    // Find all wildcard patterns: {%X...}
    const wildcardRegex = /\{%([a-zA-Z])([^}]*)\}/g;
    let match;

    while ((match = wildcardRegex.exec(pattern)) !== null) {
      const fullMatch = match[0];  // e.g., "{%a_}"
      const wildcardKey = match[1]; // e.g., "a"
      const suffix = match[2];       // e.g., "_"

      const value = this.getWildcardValue(item, wildcardKey);

      // Replace wildcard with value + suffix (if value exists)
      if (value && value.trim() !== '') {
        result = result.replace(fullMatch, value + suffix);
      } else {
        // Remove wildcard if no value
        result = result.replace(fullMatch, '');
      }
    }

    // Handle conditional wildcards: {%a|%d} - author OR editor
    result = this.replaceConditionalWildcards(item, result);

    return result;
  }

  /**
   * Get value for a single wildcard
   */
  getWildcardValue(item, key) {
    const wildcards = this.getAvailableWildcards();
    const def = wildcards[key];

    if (!def) {
      Zotero.debug(`[ZotFile+] Unknown wildcard: %${key}`);
      return '';
    }

    // If it's a simple field reference
    if (typeof def === 'string') {
      return item.getField(def, false, true) || '';
    }

    // If it's a complex definition
    if (typeof def === 'object') {
      // Use custom processor if defined
      if (def.processor) {
        return this.runProcessor(item, def.processor, def);
      }

      // Get field value
      let value = '';
      if (def.field) {
        value = item.getField(def.field, false, true) || '';
        // Try fallback if main field is empty
        if (!value && def.fallback) {
          value = item.getField(def.fallback, false, true) || '';
        }
      }

      // Apply operation if specified
      if (def.operation && value) {
        value = this.applyOperation(value, def.operation);
      }

      return value;
    }

    return '';
  }

  /**
   * Handle conditional wildcards like {%a|%d} (author OR editor)
   */
  replaceConditionalWildcards(item, pattern) {
    const conditionalRegex = /\{%([a-zA-Z])\|%([a-zA-Z])\}/g;
    let result = pattern;

    result = result.replace(conditionalRegex, (match, key1, key2) => {
      const value1 = this.getWildcardValue(item, key1);
      if (value1 && value1.trim() !== '') return value1;

      const value2 = this.getWildcardValue(item, key2);
      return value2 || '';
    });

    return result;
  }

  /**
   * Apply operations to values (e.g., extract year from date)
   */
  applyOperation(value, operation) {
    switch (operation) {
      case 'extractYear':
        const yearMatch = value.match(/\d{4}/);
        return yearMatch ? yearMatch[0] : '';

      case 'firstInitial':
        return value.charAt(0).toUpperCase();

      case 'uppercase':
        return value.toUpperCase();

      case 'lowercase':
        return value.toLowerCase();

      default:
        return value;
    }
  }

  /**
   * Run a custom processor function
   */
  runProcessor(item, processorName, def) {
    switch (processorName) {
      case 'formatAuthors':
        return ZotFilePlus.Formatter.formatAuthors(item, 'author', def.operation);

      case 'formatAuthorsLastF':
        return ZotFilePlus.Formatter.formatAuthorsLastF(item, 'author');

      case 'formatAuthorsInitials':
        return ZotFilePlus.Formatter.formatAuthorsInitials(item, 'author');

      case 'formatTitle':
        return ZotFilePlus.Formatter.formatTitle(item);

      case 'getItemTypeName':
        return Zotero.ItemTypes.getLocalizedString(item.itemTypeID);

      case 'getCollectionPath':
        return this.getCollectionPath(item);

      case 'getContextField':
        return this.getContextField(item);

      default:
        Zotero.debug(`[ZotFile+] Unknown processor: ${processorName}`);
        return '';
    }
  }

  /**
   * Get collection path for item
   */
  getCollectionPath(item) {
    const collections = item.getCollections();
    if (collections.length === 0) return '';

    // Get first collection
    const collection = Zotero.Collections.get(collections[0]);
    if (!collection) return '';

    // Build path
    const path = [];
    let current = collection;
    while (current) {
      path.unshift(current.name);
      const parentKey = current.parentKey;
      current = parentKey ? Zotero.Collections.getByLibraryAndKey(current.libraryID, parentKey) : null;
    }

    return path.join('/');
  }

  /**
   * Get context-aware field based on item type
   */
  getContextField(item) {
    const itemTypeName = Zotero.ItemTypes.getName(item.itemTypeID);

    const contextMap = {
      'audioRecording': 'label',
      'bill': 'legislativeBody',
      'case': 'court',
      'computerProgram': 'company',
      'film': 'distributor',
      'journalArticle': 'publicationTitle',
      'magazineArticle': 'publicationTitle',
      'newspaperArticle': 'publicationTitle',
      'patent': 'issuingAuthority',
      'presentation': 'meetingName',
      'radioBroadcast': 'network',
      'report': 'institution',
      'thesis': 'university',
      'tvBroadcast': 'network'
    };

    const field = contextMap[itemTypeName] || 'publisher';
    return item.getField(field, false, true) || '';
  }
}
