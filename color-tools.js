'use strict';
(function(root){
  const normalize=value=>/^#?[0-9a-f]{6}$/i.test(String(value).trim())?'#'+String(value).trim().replace('#','').toLowerCase():null;
  function fromRGB(values){if(values.length!==3||values.some(v=>String(v).trim()===''||!Number.isInteger(Number(v))||Number(v)<0||Number(v)>255))return null;return '#'+values.map(v=>Number(v).toString(16).padStart(2,'0')).join('');}
  const recent=(list,color)=>[color,...list.filter(c=>c!==color)].filter(c=>normalize(c)).slice(0,5);
  root.ZTH_COLORS={normalize,fromRGB,recent};
  if(typeof module!=='undefined')module.exports=root.ZTH_COLORS;
  if(typeof document==='undefined')return;
  const $=id=>document.getElementById(id);let target,colors=[];
  try{colors=JSON.parse(localStorage.getItem('zth-recent-colors')||'[]').filter(c=>normalize(c)).slice(0,5);}catch{}
  const dialog=document.createElement('dialog');dialog.id='colorDialog';
  dialog.innerHTML='<form method="dialog"><div class="dialog-title"><h2>自定义颜色</h2><button aria-label="关闭">×</button></div><label>色谱<input type="color" id="colorSpectrum"></label><label>HEX<input id="colorHex" maxlength="7" placeholder="#7352dc" spellcheck="false"></label><div class="rgb-fields"><label>R<input id="colorR" inputmode="numeric" type="number" min="0" max="255"></label><label>G<input id="colorG" inputmode="numeric" type="number" min="0" max="255"></label><label>B<input id="colorB" inputmode="numeric" type="number" min="0" max="255"></label></div><p id="colorError" role="alert"></p><h4>最近使用的 5 个颜色</h4><div id="recentColors" class="recent-colors"></div><button type="button" id="applyColor" class="primary wide">应用颜色</button></form>';
  document.body.append(dialog);
  function set(c){$('colorHex').value=c;$('colorSpectrum').value=c;['R','G','B'].forEach((k,i)=>$('color'+k).value=parseInt(c.slice(1+i*2,3+i*2),16));$('colorError').textContent='';$('applyColor').disabled=false;}
  function invalid(){ $('colorError').textContent='请输入 6 位 HEX，或 0–255 的 RGB 整数。';$('applyColor').disabled=true;}
  $('colorHex').oninput=()=>{const c=normalize($('colorHex').value);c?set(c):invalid();};
  for(const k of ['R','G','B'])$('color'+k).oninput=()=>{const c=fromRGB(['R','G','B'].map(k=>$('color'+k).value));if(!c)return invalid();$('colorHex').value=c;$('colorSpectrum').value=c;$('colorError').textContent='';$('applyColor').disabled=false;};
  $('colorSpectrum').oninput=()=>set($('colorSpectrum').value);
  function render(){const list=$('recentColors');list.replaceChildren();if(!colors.length){list.textContent='选择颜色后，它会出现在这里。';return;}colors.forEach(c=>{const b=document.createElement('button');b.type='button';b.style.setProperty('--swatch',c);b.textContent=c;b.setAttribute('aria-label','使用颜色 '+c);b.onclick=()=>set(c);list.append(b);});}
  function open(el){target=el;set(normalize(el.value)||'#000000');render();dialog.showModal();}
  document.addEventListener('click',e=>{const el=e.target;if(el.matches('input[type=color]')&&!dialog.contains(el)){e.preventDefault();open(el);}});
  $('applyColor').onclick=()=>{const c=normalize($('colorHex').value);if(!c||!target?.isConnected)return;target.value=c;target.dispatchEvent(new Event('change',{bubbles:true}));colors=recent(colors,c);try{localStorage.setItem('zth-recent-colors',JSON.stringify(colors));}catch{}dialog.close();};
  root.ZTH_COLORS.open=open;
})(typeof window==='undefined'?globalThis:window);
