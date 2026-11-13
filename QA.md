# 2.0 validation / 验证记录

Date: 2026-11-13. Tests report observed behavior, not certification of every phone or imported file.

## Automated regression coverage

`npm test` checks portable-project limits, malformed input, connected color removal, layout bounds, template copy isolation, RGB/HEX validation and five-color recency, history snapshots, font deduplication/fallback, storage failures, stale save queues, immediate reload after restoration, locked text and images, multi-selection locks, QR replacement geometry and asynchronous dialog races.

`qa/brand-transparency-v2.json` records actual source pixels: all seven original marks have fully transparent outer image edges after processing. Saturated core pixels in the color logos remain unchanged. This is an asset-specific matte extraction, not general image segmentation.

## Browser checks

- Editor opened with the bundled Chinese font and actual Fabric canvas.
- RGB 18/144/220 applied to selected text; the quick-selection bar and custom picker worked.
- Local project name saved without requiring a blur event. Multiple works and manual version lists remained available after reload.
- A QR placeholder was replaced by entering `https://github.com/Zeruik/zth-design-studio` from the selection menu. The final 1080×1440 PNG export was decoded with jsQR; its payload matched exactly. See `qa/qr-decode-v2.json`.
- Mobile portrait 390×844 and landscape 844×390 were checked. Document width equalled viewport width (no page-level horizontal overflow); landscape used a vertical tool rail and retained its canvas.
- All eight additional template layouts were rendered with ZTH Sans; text objects stayed inside their canvas. This check does not assert that arbitrary user text will fit.
- Transparent logos were visually inspected against checkerboard, charcoal and orange. Light marks require a contrasting dark background; dark marks require a light background.
- Original template factories remained independent of edited copies. There are 25 templates in total.

Screenshots and development-only fixture pages are kept locally, excluded from the distributed editor. Test artwork is not shipped as user history.

## Native packaging

- Windows: NSIS wizard contains language selection, license, install directory, shortcuts and uninstall steps. Final installer build and UI observations are recorded in the release handoff.
- Android: manifest versionCode 2/versionName 2.0.0; minimum Android 9. System bars, cutout and keyboard insets are handled in the native container. Rotation keeps the same WebView. APK signature and ZIP contents are checked during build.
- iOS: native WKWebView project, Files export bridge, safe-area layout and orientation support. The GitHub Actions simulator job verifies compilation. Simulator artifacts are not iPhone install packages. An Apple signing team is needed for a device IPA.

## Limits still requiring device acceptance

- Physical Android install, Files picker/save, touch scaling, system status/gesture areas and rotation across vendors.
- iPhone/iPad signed install, WebView persistence, Files import/export and physical safe areas.
- Windows install/upgrade/uninstall and shell association across different accounts and non-default locations beyond the recorded local checks.
- Complex real-world PPTX/PDF/SVG fidelity. PDF export is flattened; PPTX importer supports only basic content.

Android 1.0 preview signing material was not recovered. Version 2.0 uses a persistently stored private key outside the repository; direct upgrade over the old preview cannot be guaranteed. Export projects before replacing an installation.
