#!/usr/bin/env node

/**
 * Script to generate defaults.js from preference definitions
 * This ensures consistency between the TypeScript prefs module and the defaults.js file
 */

// Import required modules
const fs = require('fs');
const path = require('path');

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
function generateDefaultsJS() {
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

// Ensure the prefs directory exists
const prefsDir = path.join(__dirname, '..', 'addon', 'prefs');
if (!fs.existsSync(prefsDir)) {
  fs.mkdirSync(prefsDir, { recursive: true });
}

// Write the generated content to defaults.js
const defaultsPath = path.join(prefsDir, 'defaults.js');
const content = generateDefaultsJS();
fs.writeFileSync(defaultsPath, content);

console.log(`Generated ${defaultsPath} with ${Object.keys(prefsDefaults).length} preferences`);