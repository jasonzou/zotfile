# Installing ZotFile+ for Zotero 7

## ✅ Plugin Built Successfully!

**File:** `zotfile-plus.xpi` (12 KB)
**Location:** `/Users/jason/playground/zotfile/zotfile-plus/`

## Installation Steps

### 1. Open Zotero 7

Make sure you have Zotero 7.0 or later installed.

### 2. Install the Plugin

1. In Zotero, go to: **Tools → Add-ons**
2. Click the **gear icon** (⚙️) in the top-right
3. Select **Install Add-on From File...**
4. Navigate to: `/Users/jason/playground/zotfile/zotfile-plus/zotfile-plus.xpi`
5. Click **Open**
6. Click **Install Now** when prompted
7. **Restart Zotero**

### 3. Verify Installation

After restarting Zotero:

1. Go to **Tools → Add-ons**
2. You should see **"ZotFile+ v1.0.0"** in the list
3. Right-click on any item in your library
4. You should see **"ZotFile+"** in the context menu

## First Steps

### Test Basic Renaming

1. Select an item with an attachment
2. Right-click → **ZotFile+** → **Rename with Pattern...**
3. Try the pattern: `{%a_}{%y_}{%t}`
4. Click through the preview
5. Your file should be renamed!

### Set Your Default Pattern

1. **Tools → Add-ons**
2. Click **ZotFile+** → **Preferences**
3. Set your default rename pattern (e.g., `{%a_}{%y_}{%t}`)
4. Configure other options as desired

### Common Patterns to Try

```
{%a_}{%y_}{%t}
→ Smith_2023_Machine_Learning.pdf

{%a_}{%y}_{%j}
→ Smith_2023_Nature.pdf

{%y}/{%a}_{%t}
→ 2023/Smith_Machine_Learning.pdf
```

## Troubleshooting

### Plugin Won't Install

**Error:** "This add-on could not be installed"

**Solutions:**
- Make sure you have Zotero **7.0+** (not 6.x)
- Try restarting Zotero first
- Check: **Tools → Developer → Error Console** for error messages

### Menu Item Not Showing

**Issue:** Can't find ZotFile+ in right-click menu

**Solutions:**
- Restart Zotero after installation
- Check **Tools → Add-ons** - ZotFile+ should be enabled
- Try right-clicking on a **regular item** (not a note or attachment)

### Pattern Not Working

**Issue:** Pattern like `{%a_}{%y_}{%t}` produces empty filename

**Solutions:**
- Make sure the item has author, year, and title metadata
- Try a simpler pattern first: `{%a}_{%y}`
- Use conditional wildcards: `{%a|%d}` (author OR editor)

## What's Included

The plugin provides:

✅ **20+ Wildcards** - `%a` (author), `%y` (year), `%t` (title), etc.
✅ **Batch Renaming** - Rename hundreds of files at once
✅ **Preview** - See changes before applying
✅ **Undo** - Revert last rename operation
✅ **Custom Wildcards** - Define your own via JSON
✅ **Smart Formatting** - Title truncation, diacritic removal, etc.

## Next Steps

1. **Read the full guide:** `zotfile-plus/README.md`
2. **For ZotFile users:** See `zotfile-plus/MIGRATION_GUIDE.md`
3. **Install ZotMoov** for file moving/tablet sync (complements ZotFile+)

## Getting Help

- **Documentation:** Check `zotfile-plus/README.md`
- **Issues:** Create an issue on GitHub
- **Questions:** Zotero Forums

---

**Enjoy your organized library!** 🎉
