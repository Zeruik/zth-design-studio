'use strict';
// getRandomValues is available in bundled custom-scheme WebViews too.
if(!crypto.randomUUID){crypto.randomUUID=()=>{const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;return Array.from(bytes,(v,i)=>([4,6,8,10].includes(i)?'-':'')+v.toString(16).padStart(2,'0')).join('');};}
