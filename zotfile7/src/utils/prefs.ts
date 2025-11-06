/**
 * ZotFile7 Preferences Handler
 * Handles loading and saving of preferences using Zotero's preferences system
 */

export class ZotFile7_Prefs {
  private static prefsPrefix = addon['data'].config.prefsPrefix;

  // Default values for preferences
  private static defaults = {
    // Rename Patterns
    // Default pattern: {%a_}{%y_}{%t} = Author_Year_Title
    // Available wildcards (see wildcards.ts for complete list):
    //   %a - author (last names)
    //   %A - author (first letter of each last name, uppercase)
    //   %F - author (last name with first initial, e.g., SmithJ)
    //   %I - author initials
    //   %d - editor
    //   %D - editor (first letter, uppercase)
    //   %L - editor (last name with first initial)
    //   %l - editor initials
    //   %t - title (formatted)
    //   %h - short title
    //   %j - publication title (journal)
    //   %s - journal abbreviation
    //   %p - publisher
    //   %w - publisher/journal (context-aware)
    //   %n - patent number
    //   %i - assignee
    //   %y - year
    //   %v - volume
    //   %e - issue
    //   %T - item type
    //   %f - pages
    //   %x - extra field
    //   %c - collection paths
    //   %g - author (grouped format)
    //   %q - last author (last name)
    //   %Q - last author (last initial)
    //   %u - last author (last name with first initial)
    //   %U - last author (initials)
    //   %b - citekey
    // Examples:
    //   {%a_}{%y_}{%t}           -> Author_2023_Title.pdf
    //   {%a}{%y}                 -> Author2023.pdf
    //   {%y}/{%a}/{%t}           -> 2023/Author/Title.pdf
    //   {%a|%d_}{%y_}{%t}        -> Author_2023_Title.pdf (fallback to editor if no author)
    'renamePattern': '{%a_}{%y_}{%t}',
    'renameFormat_patent': '{%t} - {%y}',
    
    // Title formatting
    'maxTitleLength': 80,
    'truncateTitle': true,
    'smartTruncate': true,
    
    // Author formatting
    'maxAuthors': 3,
    'truncateAuthors': true,
    'maxAuthorsTruncate': 2,
    'authorsDelimiter': '_',
    'addEtAl': true,
    'etAlString': ' et al',
    
    // Text processing
    'removeDiacritics': false,
    'removePeriods': false,
    'replaceBlanks': false,
    'toLowerCase': false,
    'useZoteroToRename': false,
    
    // File types and filters
    'useFileTypes': false,
    'filetypes': 'pdf;epub;mobi;doc;docx',
    
    // Batch and confirmation settings
    'confirmation': true,
    'confirmation_batch_ask': true,
    'confirmation_batch': 5,
    
    // Additional renaming features
    'userInput': false,
    'userInput_Default': '',
    'automatic_renaming': 1, // 1=no, 2=ask, 3=ask_mult, 4=always
    
    // Custom wildcards (JSON string)
    'customWildcards': '{}',
    
    // Additional preferences from original ZotFile
    'zotfile3update': false,
    'zotero7transition': true,
    'info_window_duration': 6000,
    'info_window_duration_clickable': 8000,
    'maxTitleLengthSmart': true,
    'allFiles': false,
    'disable_renaming': false,
    'truncate_authors_max': 2
  };

  /**
   * Get a preference value
   * @param key The preference key (without prefix)
   * @param defaultValue Default value if preference is not set
   */
  public static getPref<T>(key: string, defaultValue?: T): T {
    const fullKey = `${this.prefsPrefix}.${key}`;
    
    // Check if the preference exists in defaults
    const defaultVal = this.defaults[key as keyof typeof this.defaults];
    if (defaultValue === undefined && defaultVal !== undefined) {
      defaultValue = defaultVal as T;
    }

    try {
      // Determine the type based on default value or guess from key
      if (typeof defaultValue === 'boolean' || 
          (defaultValue === undefined && typeof this.defaults[key as keyof typeof this.defaults] === 'boolean')) {
        return Zotero.Prefs.get(fullKey, true) as T ?? defaultValue!;
      } else if (typeof defaultValue === 'number' || 
                 (defaultValue === undefined && typeof this.defaults[key as keyof typeof this.defaults] === 'number')) {
        return Zotero.Prefs.get(fullKey, true) as T ?? defaultValue!;
      } else {
        // String type (or other)
        return Zotero.Prefs.get(fullKey, true) as T ?? defaultValue!;
      }
    } catch (e: unknown) {
      const errorMsg = `Error getting preference ${fullKey}: ${e instanceof Error ? e.message : String(e)}`;
      Zotero.logError(new Error(errorMsg));
      return defaultValue!;
    }
  }

  /**
   * Set a preference value
   * @param key The preference key (without prefix)
   * @param value The value to set
   */
  public static setPref(key: string, value: any): void {
    const fullKey = `${this.prefsPrefix}.${key}`;
    
    try {
      Zotero.Prefs.set(fullKey, value, true);
    } catch (e: unknown) {
      const errorMsg = `Error setting preference ${fullKey}: ${e instanceof Error ? e.message : String(e)}`;
      Zotero.logError(new Error(errorMsg));
    }
  }

  /**
   * Reset a preference to its default value
   * @param key The preference key (without prefix)
   */
  public static resetPref(key: string): void {
    const fullKey = `${this.prefsPrefix}.${key}`;
    
    try {
      Zotero.Prefs.clear(fullKey, true);
    } catch (e: unknown) {
      const errorMsg = `Error resetting preference ${fullKey}: ${e instanceof Error ? e.message : String(e)}`;
      Zotero.logError(new Error(errorMsg));
    }
  }

  /**
   * Check if a preference is set (not using the default)
   */
  public static hasPref(key: string): boolean {
    const fullKey = `${this.prefsPrefix}.${key}`;
    return Zotero.Prefs.get(fullKey, false) !== undefined;
  }

  /**
   * Get all preferences as an object
   */
  public static getAllPrefs(): { [key: string]: any } {
    const prefs: { [key: string]: any } = {};
    
    for (const key in this.defaults) {
      prefs[key] = this.getPref(key);
    }
    
    return prefs;
  }
}

// Export convenience functions for backward compatibility
export function getPref<T>(key: string, defaultValue?: T): T {
  return ZotFile7_Prefs.getPref(key, defaultValue);
}

export function setPref(key: string, value: any): void {
  return ZotFile7_Prefs.setPref(key, value);
}

export function clearPref(key: string): void {
  return ZotFile7_Prefs.resetPref(key);
}