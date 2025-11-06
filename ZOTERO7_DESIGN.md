# ZotFile+ for Zotero 7 - Design Document

## Project Goal

Create a lightweight Zotero 7 plugin that provides **advanced file organization features** that complement ZotMoov and native Zotero 7 capabilities.

## Scope - What to Include

### ✅ Core Features (High Value, Unique)

1. **Advanced Wildcard System**
   - Complex filename patterns: `{%a_}{%y_}{%t}` → `Author_2023_Title.pdf`
   - Support for 20+ built-in wildcards (author, year, title, journal, etc.)
   - Custom user-defined wildcards via JSON
   - Conditional logic and nested wildcards
   - Operations (truncate, uppercase, regex, etc.)

2. **Smart Batch Renaming**
   - Rename multiple attachments at once
   - Preview before rename
   - Undo capability
   - Progress tracking

3. **Intelligent Title Processing**
   - Smart truncation (punctuation-aware)
   - Diacritic removal
   - Case conversion
   - Character sanitization
   - Configurable max length

4. **Collection-Based Organization**
   - Use collection path in filenames: `{%c}`
   - Nested collection support

5. **Author Name Formatting**
   - Multiple author handling
   - Et al support
   - Initials, last names, combinations
   - Configurable delimiters

### ❌ Out of Scope (Covered by Others)

- **Tablet sync** → ZotMoov has this
- **File moving/copying** → ZotMoov handles this
- **Linked attachment management** → ZotMoov + Zotero 7 native
- **PDF annotation extraction** → Zotero 7 native
- **Automatic file attachment** → Zotero 7 native

## Architecture

### Zotero 7 Plugin Structure

```
zotfile-plus/
├── manifest.json          # Plugin metadata (WebExtension-style)
├── bootstrap.js           # Plugin lifecycle (startup, shutdown)
├── content/
│   ├── wildcards.js       # Wildcard parsing and replacement engine
│   ├── renamer.js         # Batch rename operations
│   ├── formatter.js       # String formatting utilities
│   └── ui.js              # UI integration
├── locale/                # Translations
│   ├── en-US/
│   ├── de-DE/
│   └── fr-FR/
├── prefs/
│   └── defaults.js        # Default preferences
└── content/
    ├── options.html       # Preferences UI
    └── rename-dialog.html # Batch rename preview dialog
```

### Key Technical Decisions

1. **Use Zotero 7 Plugin API**
   - Bootstrap plugin format (not XUL overlay)
   - React for UI (Zotero 7 standard)
   - Zotero.Item, Zotero.Attachments APIs

2. **Modular Design**
   - Wildcard engine is standalone (could be reused)
   - No dependencies on file I/O (let ZotMoov handle that)
   - Pure metadata → filename transformation

3. **Integration Points**
   - Context menu: "Rename with ZotFile+ Pattern"
   - Bulk operations: Select multiple items → rename all attachments
   - Preferences: Custom wildcard patterns

## Core Modules

### 1. Wildcard Engine (`wildcards.js`)

**Responsibilities:**
- Parse wildcard patterns like `{%a_}{%y_}{%t}`
- Replace wildcards with item metadata
- Support conditional logic: `{%a|%d}` (author OR editor)
- Apply operations: `{%t50}` (truncate title to 50 chars)
- Load custom wildcards from JSON

**API:**
```javascript
class WildcardEngine {
  constructor(customWildcards = {})
  replaceWildcard(item, pattern)
  loadCustomWildcards(json)
  getAvailableWildcards()
}
```

### 2. Formatter (`formatter.js`)

**Responsibilities:**
- Format author names (last, first, initials, etc.)
- Truncate titles intelligently
- Remove diacritics
- Sanitize filenames
- Case conversion

**API:**
```javascript
class Formatter {
  formatAuthors(item, options)
  truncateTitle(title, maxLength, smartTruncate)
  removeDiacritics(text)
  sanitizeFilename(text)
  toCase(text, caseType)  // lower, upper, title
}
```

### 3. Renamer (`renamer.js`)

**Responsibilities:**
- Batch rename attachments
- Preview changes before applying
- Track rename history for undo
- Handle errors gracefully

**API:**
```javascript
class Renamer {
  previewRename(items, pattern)  // → Array<{item, oldName, newName}>
  applyRename(items, pattern)
  undo()
}
```

### 4. UI Integration (`ui.js`)

**Responsibilities:**
- Add context menu items
- Show rename preview dialog
- Preferences interface
- Progress notifications

## Wildcard System Details

### Built-in Wildcards

From ZotFile, supporting:
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
- `%w` - context-aware: publisher/journal/court/etc
- `%v` - volume
- `%e` - issue
- `%f` - pages
- `%c` - collection path
- `%T` - item type

### Operations

- `{%t50}` - Truncate to 50 characters
- `{%t.upper}` - Convert to uppercase
- `{%a|%d}` - Use author, fallback to editor
- Custom operations via JSON config

### Custom Wildcards

Users can define custom wildcards in JSON:
```json
{
  "k": "DOI",
  "K": {
    "field": "DOI",
    "operations": [
      {"function": "replace", "pattern": "/", "replacement": "-"}
    ]
  }
}
```

## User Interface

### Context Menu
```
Right-click attachment → ZotFile+ →
  ├─ Rename with Pattern
  ├─ Batch Rename Selected
  └─ Configure Patterns...
```

### Rename Preview Dialog
```
┌─ Rename Preview ────────────────────────┐
│ Pattern: {%a_}{%y_}{%t}                 │
│                                          │
│ ✓ Smith 2023 Paper.pdf                  │
│   Old: attachment.pdf                    │
│   New: Smith_2023_Understanding.pdf      │
│                                          │
│ ✓ Jones 2024 Article.pdf                │
│   Old: download.pdf                      │
│   New: Jones_2024_Machine_Learning.pdf   │
│                                          │
│ [ Cancel ]  [ Apply (2 files) ]         │
└──────────────────────────────────────────┘
```

### Preferences
- Default rename pattern
- Custom wildcards (JSON editor)
- Formatting options (truncation, case, etc.)
- Preview with sample item

## Compatibility

**Works with:**
- Zotero 7.0+
- ZotMoov (complementary - ZotFile+ renames, ZotMoov moves)
- Attanger
- Native Zotero features

**Migration path:**
- Users can keep their existing wildcard patterns from ZotFile
- Custom wildcards from old ZotFile JSON files can be imported

## Implementation Plan

### Phase 1: Core Wildcard Engine
- Build wildcard parser
- Implement 20+ built-in wildcards
- Add operations (truncate, case, regex)
- Unit tests

### Phase 2: Formatter Module
- Author name formatting
- Title truncation
- Character sanitization
- Diacritic removal

### Phase 3: Renamer + UI
- Batch rename logic
- Preview dialog
- Context menu integration
- Progress notifications

### Phase 4: Preferences & Polish
- Settings UI
- Custom wildcard editor
- Documentation
- Examples and presets

## Benefits Over ZotFile

1. **Works with Zotero 7** - Native plugin, no compatibility issues
2. **Focused** - Does one thing well (advanced renaming)
3. **Complements ZotMoov** - You rename with ZotFile+, move with ZotMoov
4. **Modern** - Uses React, proper Zotero 7 APIs
5. **Lightweight** - No tablet sync complexity
6. **Maintained** - Active development for Zotero 7

## Example Workflows

### With ZotMoov
1. Import PDF → Zotero adds to library
2. Use ZotFile+ to rename: `Smith_2023_Machine_Learning.pdf`
3. Use ZotMoov to move to external folder structure

### Standalone
1. Import messy PDFs with names like `download (3).pdf`
2. Select all → Batch rename with pattern
3. All files now have consistent, meaningful names

## File Size Estimate

- Core plugin: ~50KB (minified)
- UI components: ~30KB
- Total: < 100KB (tiny!)

## Testing Strategy

1. **Unit tests** for wildcard engine
2. **Integration tests** with sample Zotero library
3. **Manual testing** with ZotMoov installed
4. **Edge cases**: Unicode, long titles, missing metadata

## Success Metrics

- Can rename 1000+ files in < 5 seconds
- 100% wildcard compatibility with ZotFile
- Works seamlessly alongside ZotMoov
- Positive user feedback on forums
