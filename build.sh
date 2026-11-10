#!/bin/bash
# Builds and signs dist/CoLabMotion-v<version>.zxp from src/.
# Usage: ./build.sh   (bump the version in the 3 places listed below first)
set -euo pipefail
cd "$(dirname "$0")"

SIGN=./ZXPSignCmd-64bit
CERT=colab_certificate.p12
CERT_PASS=colab   # self-signed, local-only certificate

# The version lives in three places; they must agree.
VERSION=$(sed -n 's/.*ExtensionBundleVersion="\([^"]*\)".*/\1/p' src/CSXS/manifest.xml)
grep -q "Extension Id=\"com.colabmotion.panel.main\" Version=\"$VERSION\"" src/CSXS/manifest.xml \
    || { echo "manifest.xml: Extension Version doesn't match ExtensionBundleVersion $VERSION"; exit 1; }
grep -q "version: \"$VERSION\"" src/jsx/colab-motion.jsx \
    || { echo "colab-motion.jsx: CONFIG.version isn't $VERSION"; exit 1; }
grep -q "const VERSION = '$VERSION'" src/index.html \
    || { echo "index.html: VERSION isn't $VERSION"; exit 1; }

# After Effects' ExtendScript is ES3. These ES5+ methods are missing on some
# installs and fail at runtime with "Function X is undefined".
if grep -nE 'Array\.isArray|\.map\(|\.forEach\(|\.filter\(|\.reduce\(|\.some\(|\.every\(|\.trim\(|Object\.keys|\.bind\(' src/jsx/colab-motion.jsx \
    | grep -vE '^[0-9]+:[[:space:]]*(\*|//|/\*)'; then
    echo "ES5+ method found in colab-motion.jsx (see above). Use plain loops / instanceof Array."
    exit 1
fi

# Syntax check: parse only, so ExtendScript globals like `app` don't matter.
if command -v node >/dev/null; then
    node -e "new Function(require('fs').readFileSync(process.argv[1], 'utf8'))" src/jsx/colab-motion.jsx \
        || { echo "Syntax error in colab-motion.jsx"; exit 1; }
fi

if [ ! -x "$SIGN" ]; then
    echo "Missing $SIGN. Download ZXPSignCmd (macOS 64-bit) from"
    echo "https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD, put it"
    echo "next to build.sh as ZXPSignCmd-64bit, then: chmod +x ZXPSignCmd-64bit"
    exit 1
fi

if [ ! -f "$CERT" ]; then
    echo "Creating self-signed certificate $CERT"
    "$SIGN" -selfSignedCert CA ON "CoLab" "CoLab Motion" "$CERT_PASS" "$CERT"
fi

find src -name .DS_Store -delete
mkdir -p dist
OUT="dist/CoLabMotion-v$VERSION.zxp"
rm -f "$OUT"
"$SIGN" -sign src "$OUT" "$CERT" "$CERT_PASS"
echo "Built $OUT"
