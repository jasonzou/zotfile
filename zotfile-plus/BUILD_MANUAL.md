# Manual Build Instructions

## Issue

The `npm run build` command is failing due to zotero-plugin-scaffold configuration issues:
```
ERROR: ENOENT: no such file or directory, open '.scaffold/build/addon/manifest.json'
```

## Manual Build Solution

Until the scaffold configuration is fixed, use this manual build process:

### Quick Build

```bash
cd /Users/jason/playground/zotfile/zotfile-plus

# Clean previous build
rm -rf build zotfile-plus.xpi

# Copy addon files to build directory
mkdir -p build
cp -r addon/* build/

# Create XPI
cd build
zip -r ../zotfile-plus.xpi * -x "*.DS_Store"
cd ..

# Verify
ls -lh zotfile-plus.xpi
unzip -l zotfile-plus.xpi
```

### What Gets Included

The XPI will contain:
- `manifest.json` - Plugin metadata
- `bootstrap.js` - Loader (points to compiled code)
- `preferences.xhtml` - Preferences dialog (✅ with fixes!)
- `content/` - Static assets
- `prefs/` - Default preferences

### Where's the Compiled Code?

The TypeScript source in `src/` needs to be compiled to JavaScript and placed in the build. The current `addon/bootstrap.js` likely needs to reference the compiled output.

## Fixing the Build System

To fix `npm run build`, you need to:

1. **Check scaffold documentation** for correct config format
2. **Update zotero-plugin.config.ts** with proper build settings
3. **Ensure TypeScript compiles** to the right location
4. **Fix asset copying** so manifest.json ends up in the right place

## Current Status

- ✅ Source code fixed (all critical bugs resolved)
- ✅ Manual XPI can be created
- ⚠️ Automated build needs configuration fix
- ⚠️ TypeScript compilation not integrated

## Temporary Workflow

For now, after making changes:

1. Edit TypeScript files in `src/`
2. Manually compile or copy to `addon/`
3. Run manual build script above
4. Test XPI in Zotero 7

## Files That Need Updating

To fully integrate the build:

1. `zotero-plugin.config.ts` - Build configuration
2. `tsconfig.json` - Output directory
3. `addon/bootstrap.js` - May need to load compiled modules
4. `.gitignore` - Add build artifacts

## Next Steps

1. Read zotero-plugin-scaffold documentation
2. Find working example configs
3. Update configuration
4. Test `npm run build`
5. Integrate TypeScript compilation

---

Generated: November 5, 2025
