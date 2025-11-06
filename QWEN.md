# ZotFile and ZotFile+ Project Context

## Project Overview

**ZotFile** is a popular Zotero plugin that provides advanced PDF management capabilities, including automatic renaming, moving, and attaching PDFs to Zotero items, syncing PDFs to mobile readers, and extracting annotations from PDF files.

**ZotFile+** is a modern, lightweight Zotero 7 plugin that focuses specifically on advanced file renaming capabilities using wildcard patterns. It's designed to work alongside ZotMoov to provide complete file organization functionality for Zotero 7.

## Project Structure

```
zotfile/
├── chrome/                 # Legacy ZotFile XUL interface components
├── defaults/               # Default preferences
├── docs/                   # Documentation
├── zotfile-plus/           # Modern Zotero 7 plugin
│   ├── bootstrap.js        # Plugin lifecycle management
│   ├── content/
│   │   ├── wildcards.js    # Wildcard parsing engine
│   │   ├── formatter.js    # String formatting utilities
│   │   ├── renamer.js      # Batch rename operations
│   │   └── ui.js           # UI integration
│   ├── locale/             # Translations
│   ├── prefs/              # Default preferences
│   ├── manifest.json       # Plugin manifest
│   └── README.md
├── install.rdf            # Legacy ZotFile extension metadata
├── chrome.manifest        # Legacy ZotFile manifest
├── Makefile               # Build script
└── readme.md              # Main project documentation
```

## Key Technologies

- **Zotero 7 Plugin API**: Bootstrap-style plugin using modern Zotero 7 APIs
- **JavaScript**: Core plugin implementation
- **XUL**: Legacy interface components for ZotFile
- **WebExtension manifest v2**: ZotFile+ plugin manifest

## ZotFile+ Key Features

### Advanced Wildcard System
- Complex filename patterns: `{%a_}{%y_}{%t}` → `Author_2023_Title.pdf`
- 20+ built-in wildcards (author, year, title, journal, etc.)
- Custom user-defined wildcards via JSON
- Conditional logic and nested wildcards
- Operations (truncate, uppercase, regex, etc.)

### Smart Batch Operations
- Rename multiple attachments at once
- Preview changes before applying
- Undo capability
- Progress tracking

### Intelligent Processing
- Smart title truncation (punctuation-aware)
- Diacritic removal
- Case conversion
- Character sanitization
- Configurable max length

### Author Name Formatting
- Multiple author handling
- Et al support
- Initials, last names, combinations
- Configurable delimiters

## Building and Running

### For ZotFile+ (Zotero 7):
```bash
# Navigate to zotfile-plus directory
cd zotfile-plus

# Build using Makefile
make build
# Creates zotfile-plus.xpi file

# Alternative: build with verbose output
make build_verbose

# Other useful commands:
make clean          # Clean build artifacts
make info           # View build information
make validate       # Validate manifest.json
make version        # Print version from manifest
make install        # Instructions for installing

# Install in Zotero
# Tools → Add-ons → gear icon → Install Add-on From File
```

### For Legacy ZotFile:
```bash
# Build using Makefile
make
# Creates zotfile.xpi file
```

### Manual Build:
```bash
# Recreate .zip file containing all files at root level
# install.rdf and chrome directory need to be at root of .zip
# Rename the file to .xpi and install in Zotero
```

## Development Conventions

### Plugin Architecture
- **Bootstrap plugin**: Modern Zotero 7 plugin format (not XUL overlay)
- **Modular design**: Wildcard engine is standalone and reusable
- **React for UI**: Follows Zotero 7 standard (though basic XUL used in current version)

### Core Modules

1. **Wildcard Engine** (`wildcards.js`)
   - Parses wildcard patterns like `{%a_}{%y_}{%t}`
   - Replaces wildcards with item metadata
   - Supports conditional logic: `{%a|%d}` (author OR editor)
   - Applies operations: `{%t50}` (truncate title to 50 chars)

2. **Formatter** (`formatter.js`)
   - Formats author names, titles, and other text
   - Truncates titles intelligently
   - Removes diacritics
   - Sanitizes filenames

3. **Renamer** (`renamer.js`)
   - Batch rename attachments
   - Preview changes before applying
   - Track rename history for undo
   - Handle errors gracefully

4. **UI Integration** (`ui.js`)
   - Adds context menu items
   - Shows rename preview dialog
   - Manages preferences interface

### Wildcard System

#### Built-in Wildcards:
- `%a` - author (last names)
- `%A` - first author initial
- `%F` - first author last name + first name
- `%I` - first author initials
- `%y` - year
- `%t` - title (formatted and truncated)
- `%h` - short title
- `%j` - publication title (journal)
- `%s` - journal abbreviation
- `%p` - publisher
- `%w` - context-aware field
- `%v` - volume
- `%e` - issue
- `%f` - pages
- `%c` - collection path
- `%T` - item type

#### Operations:
- `{%t50}` - Truncate to 50 characters
- `{%t.upper}` - Convert to uppercase
- `{%a|%d}` - Use author, fallback to editor

### Context Menu Integration:
```
Right-click attachment → ZotFile+ →
  ├─ Rename with Pattern
  ├─ Batch Rename Selected
  └─ Configure Patterns...
```

### Preferences Integration:
ZotFile+ provides preferences in two ways:
1. **Extension Settings**: Accessible via gear icon when viewing ZotFile+ in Zotero's Extensions
2. **Zotero Preferences**: Integrated pane in Zotero's main Preferences dialog under the Extensions section

Preferences include:
- Default rename pattern configuration
- Title formatting options (max length, truncation options)
- Author formatting controls (max authors, delimiters, et al handling)
- Text processing options (diacritics removal, case conversion, etc.)
- Custom wildcards definition (JSON-based)

## Project Status

- **ZotFile**: Currently not actively developed and maintained; updates are extremely rare
- **ZotFile+**: Actively maintained plugin for Zotero 7, designed to work with ZotMoov

## Workflow Integration

ZotFile+ is designed to work alongside ZotMoov:
1. **ZotFile+** gives files meaningful names: `Smith_2023_Machine_Learning.pdf`
2. **ZotMoov** moves them to organized folder structure: `/Papers/AI/Smith_2023_Machine_Learning.pdf`

Together, they replicate ZotFile's core file organization features on Zotero 7.

## Migration Path

ZotFile+ is 100% compatible with ZotFile wildcard patterns:
- Your old patterns work as-is: `{%a_}{%y_}{%t}` means exactly the same thing
- Custom wildcards from ZotFile JSON files can be imported
- Designed as a replacement for ZotFile on Zotero 7