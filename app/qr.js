import QRCode from './vendor/qrcode.mjs';
// QR quiet zones need at least four modules on every side.
window.makeQR=(text,colors={})=>QRCode.toDataURL(text,{width:700,margin:4,errorCorrectionLevel:'M',color:{dark:(colors.dark||'#142c4a')+'ff',light:(colors.light||'#ffffff')+'ff'}});
