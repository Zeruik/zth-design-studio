# Third-party and artwork notices

| Component | Version | License | Primary source |
|---|---|---|---|
| Electron | 45.3.1 | MIT plus bundled Chromium/Node notices | https://github.com/electron/electron |
| Fabric.js | 7.4.0 | MIT | https://github.com/fabricjs/fabric.js |
| Lucide | 1.72.0 | ISC; retained Feather-derived icon notices | https://github.com/lucide-icons/lucide |
| PDF.js | 5.4.394 | Apache-2.0 | https://github.com/mozilla/pdf.js |
| JSZip | 3.10.1 | MIT | https://github.com/Stuk/jszip |
| node-qrcode | 1.5.4 | MIT | https://github.com/soldair/node-qrcode |
| jsPDF | 4.2.1 | MIT | https://github.com/parallax/jsPDF |
| Noto Sans SC | Google Fonts variable source | SIL Open Font License | https://github.com/google/fonts/tree/main/ofl/notosanssc |
| ZCOOL XiaoWei | 1.000 | SIL Open Font License 1.1 | https://github.com/google/fonts/tree/main/ofl/zcoolxiaowei |
| Ma Shan Zheng | 2.003 | SIL Open Font License 1.1 | https://github.com/google/fonts/tree/main/ofl/mashanzheng |
| Roboto Mono | 3.001, variable weight 100–700 | SIL Open Font License 1.1 | https://github.com/google/fonts/tree/main/ofl/robotomono |
| NSIS | 3.0.4.1 toolchain | zlib/libpng and component licenses | https://nsis.sourceforge.io/ |

Copies of browser-library license notices are in `app/vendor/licenses/`. Noto's OFL is in `app/assets/fonts/OFL.txt`. The default font is renamed ZTH Sans for local application selection; the underlying OFL license remains unchanged.

The three additional fonts are downloaded from the official Google Fonts repository and converted from TTF to WOFF2 with fontTools 4.68.0 / Brotli 1.2.1. No glyphs are removed; all original names, copyright and license metadata are retained. The original license texts are `ZCOOLXiaoWei-OFL.txt`, `MaShanZheng-OFL.txt`, and `RobotoMono-OFL.txt` in `app/assets/fonts/`. `SOURCES.json` records source URLs, versions, coverage counts and SHA-256 hashes. Roboto Mono covers Latin and other alphabetic scripts, not Chinese. The app loads these local files without a font-service request; portable projects and SVG exports embed only bundled families used by their content. System fonts are not redistributed.

The studio and club logos were provided by the user. Their artwork and marks are not relicensed under MIT. Generated workshop/product photography and the gradient app icon were created for this project. No full reference recruitment poster is used as an editable-template background. The geometric editorial template uses original text and shape objects.

The color-removal implementation uses fixed-range color distance and connected flood fill, inspired by the documented behavior of OpenCV floodFill and Photopea's Tolerance/Contiguous controls. It does not copy Photopea source, reverse-engineer its application or include a segmentation model.

Primary references: https://docs.opencv.org/doc/doxygen/html/d7/d1b/group__imgproc__misc.html ; https://www.photopea.com/learn/advanced-selecting ; https://www.canva.com/help/download-file-types/ ; https://developer.android.com/develop/ui/views/layout/webapps/load-local-content
