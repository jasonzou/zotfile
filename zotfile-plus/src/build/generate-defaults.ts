/**
 * ZotFile+ Preference Defaults Generator
 * This file generates the defaults.js file for Zotero preferences
 */

// Define the preference defaults
const prefsDefaults = {
  // Rename Patterns
  'renamePattern': '{%a_}{%y_}{%t}',
  'renameFormat_patent': '{%t} - {%y}',

  // Title formatting
  'maxTitleLength': 80,
  'truncateTitle': true,
  'smartTruncate': true,
  'maxTitleLengthSmart': true,

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
  'allFiles': false,

  // Batch and confirmation settings
  'confirmation': true,
  'confirmation_batch_ask': true,
  'confirmation_batch': 5,

  // Additional renaming features
  'userInput': false,
  'userInput_Default': '',
  'automatic_renaming': 1, // 1=no, 2=ask, 3=ask_mult, 4=always
  'disable_renaming': false,

  // Custom wildcards (JSON string)
  'customWildcards': '{}',

  // Additional preferences from original ZotFile
  'zotfile3update': false,
  'zotero7transition': true,
  'info_window_duration': 6000,
  'info_window_duration_clickable': 8000,
  'truncate_authors_max': 2
};

// Generate the defaults.js content
function generateDefaultsJS(): string {
  let content = '';
  
  // Add each preference with proper formatting
  for (const [key, value] of Object.entries(prefsDefaults)) {
    if (typeof value === 'string') {
      content += `pref("extensions.zotfileplus.${key}", "${value}");\n`;
    } else if (typeof value === 'number') {
      content += `pref("extensions.zotfileplus.${key}", ${value});\n`;
    } else if (typeof value === 'boolean') {
      content += `pref("extensions.zotfileplus.${key}", ${value});\n`;
    }
  }
  
  return content;
}

// Export the function for use in build process
export { generateDefaultsJS, prefsDefaults };