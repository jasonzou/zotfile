# ZotFile+ Preferences Guide

## Opening Preferences

**Three ways to open:**
1. **From menu:** Right-click item → ZotFile+ → ZotFile+ Preferences...
2. **From Add-ons:** Tools → Add-ons → ZotFile+ → Preferences button
3. **Keyboard:** (After opening Zotero → Tools → Add-ons → ZotFile+)

## Preference Categories

### 1. Rename Pattern

**Default Pattern**
- The pattern used for renaming files
- Default: `{%a_}{%y_}{%t}`
- Wildcards available:
  - `%a` - Author last names
  - `%y` - Year
  - `%t` - Title (formatted)
  - `%j` - Journal/publication
  - `%v` - Volume
  - `%e` - Issue
  - `%p` - Publisher
  - `%c` - Collection path

**Examples:**
```
{%a_}{%y_}{%t}        → Smith_2023_Machine_Learning.pdf
{%a_}{%y}_{%j}        → Smith_2023_Nature.pdf
{%y}/{%a}_{%t}        → 2023/Smith_Machine_Learning.pdf
```

### 2. Title Formatting

**Maximum Title Length** (10-500)
- Maximum characters for title in filename
- Default: 80
- Longer titles are truncated

**Truncate After Punctuation** ✓
- If enabled, truncate title after `: . ? !`
- Example: "Title: Subtitle Here" → "Title"
- Default: Enabled

**Smart Truncation** ✓
- If enabled, break at word boundaries
- Prevents: "Machine_Lear..." (breaks mid-word)
- Produces: "Machine_Learning..." (breaks at space)
- Default: Enabled

### 3. Author Formatting

**Maximum Authors** (1-20)
- How many authors to include in filename
- Default: 3
- If more authors exist, adds "et al"

**Truncate Authors** ✓
- If enabled, limit authors to Maximum Authors
- If disabled, include all authors
- Default: Enabled

**Add "et al"** ✓
- Add "et al" when authors are truncated
- Only active if "Truncate Authors" is enabled
- Default: Enabled

**"et al" String**
- Text to use for "et al"
- Default: ` et al` (with leading space)
- Examples: `& al`, `...`, `+`

**Author Delimiter**
- Character(s) to separate multiple authors
- Default: `_`
- Examples:
  - `_` → Smith_Jones_Brown
  - `-` → Smith-Jones-Brown
  - `, ` → Smith, Jones, Brown

### 4. Text Processing

**Remove Diacritics** □
- Convert accented characters to plain ASCII
- Examples:
  - ä → a
  - é → e
  - ñ → n
  - ü → u
- Default: Disabled
- **When to enable:** If your filesystem doesn't support Unicode well

**Remove Periods** □
- Remove all `.` characters from filename
- Example: "Dr. Smith" → "Dr Smith"
- Default: Disabled
- **When to enable:** If periods cause issues with your file system

**Replace Blanks with "_"** □
- Replace all spaces with underscores
- Example: "Machine Learning" → "Machine_Learning"
- Default: Disabled
- **When to enable:** Preference for no spaces in filenames

**Convert to Lowercase** □
- Convert entire filename to lowercase
- Example: "Smith" → "smith"
- Default: Disabled
- **When to enable:** Consistent lowercase naming convention

### 5. Custom Wildcards (Advanced)

Define your own wildcards in JSON format.

**Format:**
```json
{
  "k": "DOI",
  "u": "url",
  "n": "note"
}
```

**Usage:**
After defining `"k": "DOI"`, you can use `{%k}` in your pattern to insert the DOI field.

**Advanced Example:**
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

This creates:
- `%k` - Raw DOI value
- `%K` - DOI with `/` replaced by `-`

## Saving Preferences

1. **Save Button** - Saves all preferences and closes dialog
2. **Cancel Button** - Closes dialog without saving
3. **Reset to Defaults Button** - Resets all fields to default values (requires Save to apply)

**Note:** After saving, the plugin automatically reloads to apply your changes!

## Common Preference Combinations

### Academic Papers (Default)
```
Pattern: {%a_}{%y_}{%t}
Max Title: 80
Truncate Title: ✓
Smart Truncate: ✓
Max Authors: 3
Add "et al": ✓
```
**Result:** `Smith_2023_Machine_Learning_Applications_in_Healthcare.pdf`

### Journal Articles (Short)
```
Pattern: {%a_}{%y}_{%j}
Max Title: 60
Max Authors: 2
```
**Result:** `Smith_Jones_2023_Nature.pdf`

### Collection-Based Organization
```
Pattern: {%c}/{%a}_{%y}
```
**Result:** `Research/AI/Smith_2023.pdf`

### Minimal Filenames
```
Pattern: {%a}_{%y}
Max Authors: 1
```
**Result:** `Smith_2023.pdf`

### Everything Lowercase, No Spaces
```
Pattern: {%a_}{%y_}{%t}
Replace Blanks: ✓
Lowercase: ✓
Max Title: 60
```
**Result:** `smith_2023_machine_learning_applications.pdf`

### Non-ASCII Safe
```
Pattern: {%a_}{%y_}{%t}
Remove Diacritics: ✓
Max Title: 80
```
**Result:** `Muller_2023_Uber_Machine_Learning.pdf` (ü → u, Ü → U)

## Troubleshooting

### Preferences Not Saving
**Symptoms:** Changes revert after closing dialog

**Solutions:**
1. Check Error Console for errors:
   ```
   Tools → Developer → Error Console
   Filter: "ZotFile+ Prefs"
   ```
2. Make sure you clicked "Save" not "Cancel"
3. Check custom wildcards JSON is valid

### Custom Wildcards Not Working
**Symptoms:** Error when saving or wildcards don't appear

**Check JSON validity:**
```json
// GOOD:
{"k": "DOI", "u": "url"}

// BAD (missing quotes):
{k: "DOI", u: "url"}

// BAD (trailing comma):
{"k": "DOI", "u": "url",}
```

**Test JSON:**
1. Copy your JSON
2. Paste into online JSON validator
3. Fix any errors
4. Paste back into preferences

### Dialog Won't Open
**Check console:**
```
Tools → Developer → Error Console
Look for: [ZotFile+] ERROR opening preferences
```

**Solutions:**
1. Restart Zotero
2. Reinstall plugin
3. Check file exists: `content/preferences.html`

### Changes Don't Apply to Renames
**Issue:** Saved preferences but renames still use old settings

**Solution:**
1. Save preferences
2. Restart Zotero (or wait a moment)
3. Try renaming again
4. Check console for: `[ZotFile+ Prefs] Plugin modules reloaded`

## Testing Your Settings

### Quick Test
1. Change "Default Pattern" to something simple: `{%a}_{%y}`
2. Click Save
3. Right-click item → ZotFile+ → Rename with Pattern...
4. Dialog should show your new pattern as default
5. Verify rename uses new pattern

### Test Each Setting
1. **Title Length:**
   - Set Max Title Length to 20
   - Rename item with long title
   - Verify truncated to ~20 characters

2. **Authors:**
   - Set Max Authors to 1
   - Rename item with multiple authors
   - Verify only 1 author + "et al" appears

3. **Text Processing:**
   - Enable "Remove Diacritics"
   - Rename item with author "Müller"
   - Verify becomes "Muller"

## Default Values Reference

| Setting | Default Value |
|---------|--------------|
| Pattern | `{%a_}{%y_}{%t}` |
| Max Title Length | 80 |
| Truncate Title | ✓ Enabled |
| Smart Truncate | ✓ Enabled |
| Max Authors | 3 |
| Truncate Authors | ✓ Enabled |
| Add "et al" | ✓ Enabled |
| "et al" String | ` et al` |
| Author Delimiter | `_` |
| Remove Diacritics | □ Disabled |
| Remove Periods | □ Disabled |
| Replace Blanks | □ Disabled |
| Lowercase | □ Disabled |
| Custom Wildcards | `{}` (empty) |

## Advanced Tips

### Pattern Testing
1. Open preferences
2. Note current pattern
3. Test various patterns without saving:
   - Enter pattern
   - Cancel (don't save)
   - Test with "Rename with Pattern..." (enter manually)
4. Once you find perfect pattern, save it in preferences

### Backup Your Settings
Your preferences are stored in Zotero's profile. To backup:

**Export (manual):**
1. Open preferences
2. Copy your custom pattern
3. Copy custom wildcards JSON
4. Save to text file

**Restore:**
1. Open preferences
2. Paste pattern and wildcards
3. Save

### Multiple Patterns
While you can only have one default pattern, you can:
1. Use "Rename with Pattern..." to enter custom patterns
2. Change default pattern for different projects
3. Use custom wildcards to create pattern variations

## FAQ

**Q: Do I need to restart Zotero after changing preferences?**
A: No, changes apply immediately after clicking Save.

**Q: Can I have different patterns for different item types?**
A: Not currently. Use "Rename with Pattern..." to manually enter different patterns.

**Q: What if my pattern produces duplicate filenames?**
A: ZotFile+ will rename files even if names are duplicates. Use unique patterns like `{%a_}{%y_}{%t}`.

**Q: Can I use custom wildcards in the default pattern?**
A: Yes! Define custom wildcard `%k`, then use it: `{%a_}{%y_}{%k}`.

**Q: How do I see all available wildcards?**
A: They're listed in the preferences dialog and in README.md.

**Q: Can I export my settings to share with colleagues?**
A: Yes, copy your pattern and custom wildcards JSON and share those strings.

## Getting Help

**If preferences aren't working:**
1. Check Error Console: `Tools → Developer → Error Console`
2. Filter for: `ZotFile+ Prefs`
3. Look for errors
4. Report issues with console logs

**Documentation:**
- [README.md](README.md) - Full user guide
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [TESTING.md](TESTING.md) - Test suite
