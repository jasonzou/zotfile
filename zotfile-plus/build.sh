#!/bin/bash
# Manual build script for ZotFile+

set -e

echo "🔨 Building ZotFile+ manually..."
echo ""

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build zotfile-plus.xpi

# Create build directory
echo "📁 Creating build directory..."
mkdir -p build

# Copy addon files
echo "📦 Copying addon files..."
cp -r addon/* build/

# Create XPI
echo "🎁 Creating XPI package..."
cd build
zip -r ../zotfile-plus.xpi * -x "*.DS_Store" -x "*.git*"
cd ..

# Show results
echo ""
echo "✅ Build complete!"
echo ""
ls -lh zotfile-plus.xpi
echo ""
echo "📊 XPI contents:"
unzip -l zotfile-plus.xpi | head -20
echo ""
echo "🚀 Install in Zotero 7:"
echo "   Tools → Add-ons → Install from File → Select zotfile-plus.xpi"
echo ""
