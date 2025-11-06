/**
 * ZotFile+ Formatter
 * Handles string formatting operations for filenames
 * - Author name formatting
 * - Title truncation
 * - Character sanitization
 * - Diacritic removal
 */

class ZotFilePlus_Formatter {
  constructor() {
    // Get preferences or use defaults
    this.prefs = {
      maxTitleLength: this.getPref('maxTitleLength', 80),
      truncateTitle: this.getPref('truncateTitle', true),
      smartTruncate: this.getPref('smartTruncate', true),
      maxAuthors: this.getPref('maxAuthors', 3),
      truncateAuthors: this.getPref('truncateAuthors', true),
      authorsDelimiter: this.getPref('authorsDelimiter', '_'),
      addEtAl: this.getPref('addEtAl', true),
      etAlString: this.getPref('etAlString', ' et al'),
      removeDiacritics: this.getPref('removeDiacritics', false),
      removePeriods: this.getPref('removePeriods', false),
      replaceBlanks: this.getPref('replaceBlanks', false),
      toLowerCase: this.getPref('toLowerCase', false)
    };
  }

  /**
   * Get preference value
   */
  getPref(key, defaultValue) {
    return Zotero.Prefs.get(`extensions.zotfileplus.${key}`, true) || defaultValue;
  }

  /**
   * Format author names for filename
   * @param {Zotero.Item} item
   * @param {string} creatorType - 'author' or 'editor'
   * @param {string} operation - Optional operation like 'firstInitial'
   * @returns {string} - Formatted author string
   */
  formatAuthors(item, creatorType = 'author', operation = null) {
    const creators = item.getCreators();
    const creatorTypeID = Zotero.CreatorTypes.getID(creatorType);

    // Filter for relevant creator type
    const relevantCreators = creators.filter(c => c.creatorTypeID === creatorTypeID);

    if (relevantCreators.length === 0) return '';

    // Handle single author
    if (operation === 'firstInitial' && relevantCreators.length > 0) {
      const firstAuthor = relevantCreators[0];
      const lastName = firstAuthor.lastName || '';
      return lastName.charAt(0).toUpperCase();
    }

    // Determine how many authors to include
    let numAuthors = relevantCreators.length;
    let addEtAl = false;

    if (this.prefs.truncateAuthors && numAuthors > this.prefs.maxAuthors) {
      numAuthors = this.prefs.maxAuthors;
      addEtAl = this.prefs.addEtAl;
    }

    // Format each author's last name
    const authorNames = relevantCreators.slice(0, numAuthors).map(creator => {
      return creator.lastName || creator.name || '';
    });

    // Join with delimiter
    let result = authorNames.join(this.prefs.authorsDelimiter);

    // Add et al if needed
    if (addEtAl) {
      result += this.prefs.etAlString;
    }

    return result;
  }

  /**
   * Format authors as "LastName FirstName"
   */
  formatAuthorsLastF(item, creatorType = 'author') {
    const creators = item.getCreators();
    const creatorTypeID = Zotero.CreatorTypes.getID(creatorType);
    const relevantCreators = creators.filter(c => c.creatorTypeID === creatorTypeID);

    if (relevantCreators.length === 0) return '';

    const firstAuthor = relevantCreators[0];
    const lastName = firstAuthor.lastName || '';
    const firstName = firstAuthor.firstName || '';

    return `${lastName} ${firstName}`.trim();
  }

  /**
   * Format authors as initials (e.g., "JDS" for John Doe Smith)
   */
  formatAuthorsInitials(item, creatorType = 'author') {
    const creators = item.getCreators();
    const creatorTypeID = Zotero.CreatorTypes.getID(creatorType);
    const relevantCreators = creators.filter(c => c.creatorTypeID === creatorTypeID);

    if (relevantCreators.length === 0) return '';

    const firstAuthor = relevantCreators[0];
    const lastName = firstAuthor.lastName || '';
    const firstName = firstAuthor.firstName || '';

    const lastInitial = lastName.charAt(0).toUpperCase();
    const firstInitials = firstName.split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .join('');

    return lastInitial + firstInitials;
  }

  /**
   * Format title for filename
   * @param {Zotero.Item} item
   * @returns {string} - Formatted title
   */
  formatTitle(item) {
    let title = item.getField('title', false, true) || '';

    // Truncate title after punctuation if enabled
    if (this.prefs.truncateTitle) {
      const truncateMatch = title.match(/^[^:.?!]+/);
      if (truncateMatch) {
        title = truncateMatch[0];
      }
    }

    // Truncate to max length
    if (title.length > this.prefs.maxTitleLength) {
      title = this.truncateString(title, this.prefs.maxTitleLength, this.prefs.smartTruncate);
    }

    // Remove trailing punctuation
    title = title.replace(/[:.?!\/\\><*|]+$/, '');

    // Apply formatting options
    title = this.sanitizeFilename(title);

    if (this.prefs.removeDiacritics) {
      title = this.removeDiacritics(title);
    }

    if (this.prefs.removePeriods) {
      title = title.replace(/\./g, '');
    }

    if (this.prefs.replaceBlanks) {
      title = title.replace(/ /g, '_');
    }

    if (this.prefs.toLowerCase) {
      title = title.toLowerCase();
    }

    return title.trim();
  }

  /**
   * Truncate string intelligently
   * @param {string} text
   * @param {number} maxLength
   * @param {boolean} smart - If true, truncate at word boundary
   * @returns {string}
   */
  truncateString(text, maxLength, smart = true) {
    if (text.length <= maxLength) return text;

    let truncated = text.substring(0, maxLength);

    if (smart) {
      // Truncate at last space to avoid breaking words
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 0) {
        truncated = truncated.substring(0, lastSpace);
      }
    }

    return truncated.trim();
  }

  /**
   * Remove diacritics from text
   * Uses Zotero's built-in function if available
   */
  removeDiacritics(text) {
    if (Zotero.Utilities.removeDiacritics) {
      return Zotero.Utilities.removeDiacritics(text);
    }

    // Fallback: normalize to NFD and remove combining marks
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Sanitize filename - remove/replace invalid characters
   * @param {string} filename
   * @returns {string}
   */
  sanitizeFilename(filename) {
    // Remove invalid filename characters
    filename = filename.replace(/[\/\\?*:|"<>]/g, '');

    // Replace multiple spaces with single space
    filename = filename.replace(/\s+/g, ' ');

    // Remove leading/trailing spaces
    filename = filename.trim();

    return filename;
  }

  /**
   * Convert to specific case
   * @param {string} text
   * @param {string} caseType - 'lower', 'upper', 'title'
   * @returns {string}
   */
  toCase(text, caseType) {
    switch (caseType) {
      case 'lower':
        return text.toLowerCase();
      case 'upper':
        return text.toUpperCase();
      case 'title':
        return this.toTitleCase(text);
      default:
        return text;
    }
  }

  /**
   * Convert to title case
   */
  toTitleCase(text) {
    const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'of', 'on', 'or', 'the', 'to', 'via'];

    return text.toLowerCase().split(' ').map((word, index) => {
      // Always capitalize first and last word
      if (index === 0 || !smallWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    }).join(' ');
  }
}
