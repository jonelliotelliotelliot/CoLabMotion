# CoLab Motion

After Effects panel (CEP) for CoLab motion work. Forked from Wave Motion v1.7.2.

## Install

1. Download the latest `CoLabMotion-v*.zxp` from the
   [Releases](../../releases/latest) page.
2. Install it with a ZXP installer, such as
   [ZXPInstaller](https://zxpinstaller.com) or aescripts' ZXP Installer.
3. Fully quit and relaunch After Effects, then open
   **Window > Extensions > CoLab Motion**.

The extension is self-signed, which is expected. It installs alongside Wave
Motion without conflicting.

## Build

Requires Adobe's `ZXPSignCmd` (macOS 64-bit, from
[Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD)),
saved next to `build.sh` as `ZXPSignCmd-64bit`. It isn't committed. A
self-signed certificate is created on the first build; it isn't committed either.

```bash
./build.sh
```

Produces `dist/CoLabMotion-v<version>.zxp`. Before building a new release, bump
the version in all three places (the script refuses to build if they differ):

- `src/CSXS/manifest.xml`: `ExtensionBundleVersion` and `Extension Version`
- `src/jsx/colab-motion.jsx`: `CONFIG.version`
- `src/index.html`: `const VERSION`

After installing, fully quit and relaunch After Effects. AE caches the `.jsx`
for the whole session.

## Adding importable assets

1. Add or update comps in `src/elements/colab-elements.aep`.
2. Add an entry to `COMP_DEFS` in `src/index.html`:
   - `label`: text shown in the dropdown
   - `name`: the comp's exact name in the `.aep`
   - `fit`: `"contain"` (fit inside the active comp), `"cover"` (fill it), or omit for 100%
   - `collapse`: `true` to collapse transformations (keeps vectors crisp when scaled)

Imported comps land centred in the active comp, above the selected layer, with
only the items they depend on moved into a "CoLab Motion Assets" folder.

## Debugging

The status bar at the bottom of the panel shows each action's result.
For more, open `http://localhost:8089` in Chrome while AE is running.

## Credits

Cursor icons adapted from the Noun Project (CC BY 3.0): "point" by GreenHill
and "Cursor" by Icon Queen. Without a Noun Project Pro licence, CC BY requires
crediting the creators wherever the icons are used.

## ExtendScript rule

The `.jsx` runs in AE's ES3 engine. Don't use `Array.isArray`, `.map`,
`.forEach`, `.filter`, array `.indexOf`, `.trim`, `Object.keys` or `.bind`;
`build.sh` blocks most of them.
