# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZotFile is a Zotero extension for advanced PDF management. It provides:
- Automatic PDF renaming, moving, and attachment management
- Tablet sync (syncing PDFs to mobile devices like iPads)
- PDF annotation extraction from PDF files

**Status**: Not actively maintained. Updates are rare.

**Target Platform**: Zotero 5-6 (supports legacy Firefox extension format with XUL/XPI)

## Build Commands

```bash
# Build the extension (.xpi file)
make

# The build process:
# 1. Extracts version from install.rdf
# 2. Creates zotfile-{version}-fx.xpi by zipping required files
# 3. Output: zotfile-X.X.X-fx.xpi
```

## Extension Architecture

This is a legacy Firefox/Zotero extension using:
- **XUL overlays** to extend Zotero's UI (chrome://zotfile/content/overlay.xul)
- **RDF manifest** (install.rdf) for extension metadata
- **Chrome manifest** (chrome.manifest) for resource registration
- **Preferences system** using Firefox/Mozilla preferences API

### Core Modules

All JavaScript modules are under `chrome/content/zotfile/`:

- **zotfile.js**: Main entry point. Initializes `Zotero.ZotFile` namespace, handles version upgrades, sets up folder separators, and orchestrates other modules.

- **tablet.js** (`Zotero.ZotFile.Tablet`): Manages tablet sync functionality. Handles:
  - Moving PDFs to/from tablet directories
  - Tag-based tracking (_tablet, _tablet_modified tags)
  - Sync status management

- **pdfAnnotations.js** (`Zotero.ZotFile.pdfAnnotations`): PDF annotation extraction using two methods:
  - **pdf.js** (JavaScript): Renders PDFs in hidden browser, extracts annotations via `extract.html`/`extract.js`
  - **poppler** (native): Uses external ExtractPDFAnnotations binary on Mac for faster extraction

- **wildcards.js** (`Zotero.ZotFile.Wildcards`): Filename generation using wildcards (e.g., `{%a_}{%y_}{%t}` → `Author_2023_Title.pdf`). Supports:
  - Author names, year, title, collection names
  - Truncation, abbreviation, conditional logic
  - User-defined custom wildcards

- **ui.js**: User interface integration with Zotero. Adds context menus, handles user interactions.

- **utils.js** (`Zotero.ZotFile.Utils`): Common utilities (array operations, file operations, etc.).

- **notifier.js**: Integrates with Zotero's notifier system to respond to item changes.

- **ProgressWindow.js**: Custom progress window UI for long-running operations.

### Extension Integration

- **Overlay**: `overlay.xul` overlays Zotero's main pane (`zoteroPane.xul`), adding menu items and keyboard shortcuts
- **Preferences**: `options.xul` provides settings UI, registered via install.rdf
- **Localization**: Multi-language support in `chrome/locale/` (en-US, de-DE, fr-FR, it-IT)

### Key Design Patterns

1. **Namespace pattern**: All code under `Zotero.ZotFile` namespace to avoid conflicts
2. **Promise-based async**: Uses `Zotero.Promise.coroutine` for async operations
3. **Zotero API integration**: Leverages `Zotero.Items`, `Zotero.File`, etc.
4. **Preference-driven**: Heavily configurable via Mozilla preferences API

## Development Notes

### XPI Structure

The .xpi file is a ZIP containing:
```
install.rdf          # Extension metadata
chrome.manifest      # Resource mappings
chrome/              # Extension code
  content/zotfile/   # JavaScript and XUL
  locale/            # Translations
  skin/              # CSS and images
defaults/            # Default preferences
```

### Zotero API

This extension uses the Zotero JavaScript API extensively:
- Documentation: http://www.zotero.org/support/dev/client_coding/javascript_api
- Key APIs: `Zotero.Items`, `Zotero.File`, `OS.File`, `Components.utils`

### PDF Extraction Architecture

Two-tier system:
1. **pdf.js in hidden browser**: Cross-platform, slower, renders PDF in `extract.html`
2. **poppler tool**: Mac-only, faster, binary stored in Zotero data directory under `ExtractPDFAnnotations/`

Selection logic in `pdfAnnotations.js:popplerExtractorSupported`.

### Version Compatibility

- Current target: Zotero 5-6
- Zotero 7 uses WebExtensions (incompatible format)
- Code contains commented-out `zotero7transition()` for future migration
- Check `this.isZotero6OrLater` flag for version-specific behavior

### Common Patterns

**File operations:**
```javascript
OS.File.exists(path)
Zotero.File.copyDirectory(source, dest)
```

**Preference access:**
```javascript
Zotero.ZotFile.getPref('pref.name')
Zotero.ZotFile.setPref('pref.name', value)
```

**Item manipulation:**
```javascript
var item = Zotero.Items.get(itemID);
item.addTag(tagName);
await item.saveTx();
```

## Debugging

Since this is a Zotero extension:
1. Changes require rebuilding the .xpi with `make`
2. Install new .xpi in Zotero: Tools → Add-ons → Install Add-on From File
3. Restart Zotero to load changes
4. Use Zotero's JavaScript console for debugging: Tools → Developer → Run JavaScript

## Important Constraints

- **No npm/package.json**: This is not a Node.js project
- **XUL/XPI format**: Legacy Firefox extension technology (pre-WebExtensions)
- **No modern JS features**: Limited to JavaScript features available in Firefox 60 ESR
- **Synchronous code common**: Older codebase uses some synchronous patterns despite async APIs

## Zotero 7 Port - ZotFile+

A modern, focused port for Zotero 7 exists in `zotfile-plus/`:

**Scope:** Advanced file renaming only (complements ZotMoov for file moving)

**Key Features:**
- Full wildcard system compatibility with original ZotFile
- Batch renaming with preview and undo
- Smart title truncation and formatting
- Custom wildcard definitions
- Modern Zotero 7 plugin architecture (bootstrap format)

**Architecture:** See [ZOTERO7_DESIGN.md](ZOTERO7_DESIGN.md) for detailed design documentation.

**Out of Scope:** Tablet sync (use ZotMoov), file moving (use ZotMoov), PDF extraction (native in Zotero 7)

**Build:**
```bash
cd zotfile-plus
zip -r zotfile-plus.xpi * -x "*.git*" -x "*.DS_Store"
# Install .xpi in Zotero 7: Tools → Add-ons → Install from File
```
