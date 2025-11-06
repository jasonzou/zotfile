# ZotFile+ for Zotero 7

**Advanced file renaming and organization for Zotero 7**

ZotFile+ is a modern, lightweight Zotero 7 plugin that provides powerful wildcard-based batch renaming capabilities. It's designed to work alongside [ZotMoov](https://github.com/wileyyugioh/zotmoov) to give you complete control over your attachment organization.

## What is ZotFile+?

ZotFile+ focuses on **advanced file renaming** - it takes ZotFile's beloved wildcard system and brings it to Zotero 7. While ZotMoov handles moving and organizing files, ZotFile+ gives them meaningful, consistent names.

### What ZotFile+ Does

✅ **Advanced Wildcard Renaming**
- Use patterns like `{%a_}{%y_}{%t}` → `Smith_2023_Machine_Learning.pdf`
- 20+ built-in wildcards for author, year, title, journal, etc.
- Custom user-defined wildcards via JSON
- Conditional logic: `{%a|%d}` (use author OR editor)

✅ **Smart Batch Operations**
- Rename hundreds of files at once
- Preview changes before applying
- Undo support for mistakes

✅ **Intelligent Processing**
- Smart title truncation (respects punctuation)
- Diacritic removal (café → cafe)
- Case conversion and blank replacement
- Character sanitization for cross-platform compatibility

### What ZotFile+ Doesn't Do

❌ **File Moving** → Use ZotMoov for this
❌ **Tablet Sync** → ZotMoov has this feature
❌ **PDF Annotation Extraction** → Built into Zotero 7
❌ **Linked Attachment Management** → ZotMoov + Zotero 7 native

## Why ZotFile+ + ZotMoov?

These two plugins complement each other perfectly:

1. **ZotFile+** gives files meaningful names: `Smith_2023_Machine_Learning.pdf`
2. **ZotMoov** moves them to your organized folder structure: `/Papers/AI/Smith_2023_Machine_Learning.pdf`

Together, they replicate ZotFile's core file organization features on Zotero 7.

## Installation

### From XPI File

1. Download the latest `zotfile-plus.xpi` from [Releases](https://github.com/zotfile-community/zotfile-plus/releases)
2. In Zotero 7: Tools → Add-ons → gear icon → Install Add-on From File
3. Select the downloaded `.xpi` file
4. Restart Zotero

### From Source

```bash
cd zotfile-plus
zip -r zotfile-plus.xpi * -x "*.git*" -x "*.DS_Store"
# Install the .xpi file in Zotero
```

## Quick Start

### Basic Renaming

1. Select one or more items in your library
2. Right-click → ZotFile+ → Rename with Pattern...
3. Enter a pattern like: `{%a_}{%y_}{%t}`
4. Preview the changes and click Apply

### Common Patterns

```
{%a_}{%y_}{%t}
→ Smith_2023_Machine_Learning_Applications.pdf

{%a_}{%y}_{%j}
→ Smith_2023_Nature.pdf

{%y}/{%a}/{%t}
→ 2023/Smith/Machine_Learning_Applications.pdf

{%a|%d}_{%y}_{%t}
→ Smith_2023_Title.pdf (uses editor if no author)
```

## Wildcard Reference

### Author & Editor Wildcards

| Wildcard | Description | Example |
|----------|-------------|---------|
| `%a` | Author last names | `Smith_Jones` |
| `%A` | First author initial | `S` |
| `%F` | First author full name | `Smith John` |
| `%I` | First author initials | `SJD` |
| `%d` | Editor (same format as author) | `Brown` |

### Date Wildcards

| Wildcard | Description | Example |
|----------|-------------|---------|
| `%y` | Year | `2023` |

### Title & Publication Wildcards

| Wildcard | Description | Example |
|----------|-------------|---------|
| `%t` | Title (formatted) | `Machine_Learning` |
| `%h` | Short title | `ML_Methods` |
| `%j` | Publication/Journal | `Nature` |
| `%s` | Journal abbreviation | `Nat.` |
| `%p` | Publisher | `Springer` |

### Other Metadata

| Wildcard | Description | Example |
|----------|-------------|---------|
| `%v` | Volume | `42` |
| `%e` | Issue | `3` |
| `%f` | Pages | `123-145` |
| `%T` | Item type | `Journal Article` |
| `%c` | Collection path | `Research/AI` |
| `%w` | Context-aware field* | `Nature` (journal) or `MIT Press` (publisher) |

*`%w` adapts based on item type: journal for articles, court for cases, publisher for books, etc.

### Conditional Wildcards

Use `|` for fallback:

```
{%a|%d}  # Use author, or editor if no author
{%s|%j}  # Use abbreviation, or full journal name if no abbreviation
```

### Suffixes

Add underscores or other separators:

```
{%a_}    # Adds "_" only if author exists
{%y_}    # Adds "_" only if year exists
{%a - }  # Adds " - " only if author exists
```

## Custom Wildcards

Define your own wildcards in Preferences → ZotFile+ → Custom Wildcards:

```json
{
  "k": "DOI",
  "K": {
    "field": "DOI",
    "operations": [
      {"function": "replace", "pattern": "/", "replacement": "-"}
    ]
  },
  "u": "url",
  "m": {
    "field": "title",
    "operations": [
      {"function": "truncate", "length": 20}
    ]
  }
}
```

Then use like: `{%k}` for DOI, `{%u}` for URL, etc.

## Configuration

### Preferences

Access via: Tools → Add-ons → ZotFile+ → Preferences

**General:**
- Default rename pattern
- Maximum title length (default: 80)
- Smart truncation (truncate at word boundaries)

**Author Formatting:**
- Maximum authors to include (default: 3)
- Add "et al" for truncated authors
- Author delimiter (default: `_`)

**Text Processing:**
- Remove diacritics (ä → a)
- Remove periods
- Replace blanks with underscores
- Convert to lowercase

**Custom Wildcards:**
- JSON editor for custom wildcard definitions

### Default Pattern

Set your preferred pattern in preferences. This is used for:
- Batch Rename Selected (quick rename without prompting)
- Auto-rename on import (if enabled)

## Workflow Examples

### Example 1: Research Paper Organization

**Goal:** Organize papers by author and year

**Steps:**
1. Import PDFs into Zotero (let Zotero extract metadata)
2. Select all imported items
3. ZotFile+ → Rename with Pattern: `{%a_}{%y_}{%t}`
4. Use ZotMoov to move to: `/Papers/{%y}/{%a}/`

**Result:**
```
/Papers/2023/Smith/Smith_2023_Machine_Learning_Applications.pdf
/Papers/2023/Jones/Jones_2023_Deep_Neural_Networks.pdf
/Papers/2024/Brown/Brown_2024_Transformer_Architecture.pdf
```

### Example 2: Legal Documents

**Goal:** Organize by case name and court

**Steps:**
1. Pattern: `{%y}_{%t}_{%w}`
2. `%w` will use the court name for case items

**Result:**
```
2023_Roe_v_Wade_Supreme_Court.pdf
2024_Smith_v_Jones_District_Court.pdf
```

### Example 3: Clean Up Messy Downloads

**Goal:** Fix badly named PDFs

**Before:**
```
download.pdf
attachment (3).pdf
1234567.pdf
```

**Steps:**
1. Let Zotero match metadata
2. Select all → ZotFile+ → Batch Rename Selected

**After:**
```
Smith_2023_Machine_Learning.pdf
Jones_2024_Deep_Learning.pdf
Brown_2023_Neural_Networks.pdf
```

## Troubleshooting

### "No changes" message

**Cause:** Your pattern produces the same filenames

**Fix:**
- Check wildcards are correct (e.g., `%a` not `%author`)
- Verify items have required metadata
- Try a simpler pattern first: `{%a}_{%y}`

### Empty filename generated

**Cause:** Items missing critical metadata

**Fix:**
- Check items have authors, title, etc.
- Use conditional wildcards: `{%a|%d}` (author OR editor)
- Use ZotMoov's fallback pattern

### Special characters in filenames

**Cause:** Metadata contains `/`, `\`, `:`, etc.

**Fix:** ZotFile+ automatically sanitizes these characters. If issues persist, enable "Remove diacritics" in preferences.

### Undo not working

**Cause:** Undo only keeps last 10 operations

**Fix:** Use immediately after a mistake, or restore from Zotero backups

## Comparison with ZotFile

### What's the Same ✅

- Wildcard system (100% compatible patterns)
- Batch renaming
- Smart title truncation
- Author formatting
- Custom wildcards

### What's Different 🔄

- **Zotero 7 compatible** (ZotFile only works on Zotero 6)
- **Focused**: Does renaming only, not file moving
- **Works with ZotMoov**: Complementary, not competitive
- **Modern codebase**: Built for Zotero 7's plugin API
- **No tablet sync**: Use ZotMoov for this

### Migration from ZotFile

1. **Install ZotFile+ and ZotMoov**
2. **Import custom wildcards**: Copy your wildcards JSON from ZotFile preferences
3. **Set default pattern**: Copy your rename pattern from ZotFile
4. **Configure preferences**: Match your old ZotFile settings
5. **Test**: Try renaming a few items first

Your old patterns will work as-is! `{%a_}{%y_}{%t}` means exactly the same thing.

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/zotfile-community/zotfile-plus.git
cd zotfile-plus

# Build XPI
zip -r zotfile-plus.xpi * -x "*.git*" -x "*.DS_Store" -x "node_modules/*"

# Install in Zotero
# Tools → Add-ons → Install from File
```

### Project Structure

```
zotfile-plus/
├── manifest.json              # Plugin metadata
├── bootstrap.js               # Plugin lifecycle
├── content/
│   ├── wildcards.js          # Wildcard engine (core logic)
│   ├── formatter.js          # String formatting utilities
│   ├── renamer.js            # Batch rename operations
│   └── ui.js                 # UI integration
├── locale/                   # Translations
└── prefs/                    # Default preferences
```

### Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Test with Zotero 7
4. Submit a pull request

**Priority areas:**
- Additional wildcards
- UI improvements
- Translations
- Bug fixes

## Support

- **Issues**: [GitHub Issues](https://github.com/zotfile-community/zotfile-plus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zotfile-community/zotfile-plus/discussions)
- **Zotero Forums**: [ZotFile+ thread](https://forums.zotero.org/)

## Credits

ZotFile+ is inspired by and compatible with [ZotFile](https://github.com/jlegewie/zotfile) by Joscha Legewie. The wildcard system is based on ZotFile's proven design, modernized for Zotero 7.

Built to work alongside [ZotMoov](https://github.com/wileyyugioh/zotmoov) by wileyyugioh.

## License

GNU General Public License v3.0

## Changelog

### v1.0.0 (Initial Release)

- ✅ Complete wildcard system (20+ wildcards)
- ✅ Batch renaming with preview
- ✅ Undo support
- ✅ Custom wildcards
- ✅ Smart title processing
- ✅ Context menu integration
- ✅ Zotero 7 compatibility
