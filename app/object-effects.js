(function(root){
'use strict';
const type=o=>String(o?.type||'').toLowerCase();
const isText=o=>['textbox','i-text','text'].includes(type(o));
const children=o=>o?.getObjects?.()||[];
function leaves(o){const members=children(o);return members.length?members.flatMap(leaves):o?[o]:[];}
function locked(o){return !!o&&(!!o.locked||children(o).some(locked));}
function dirty(o){o.set('dirty',true);if(o.group)dirty(o.group);o.setCoords();}
function relayout(o){children(o).forEach(relayout);if(children(o).length)o.triggerLayout?.();o.setCoords();}
function paint(target,key,value){
 if(!target||locked(target)||!['ink','fill','stroke','strokeWidth','paintFirst'].includes(key))return false;
 if(key==='strokeWidth'&&(!Number.isFinite(value)||value<0||value>100))return false;
 for(const o of leaves(target)){
  if(type(o)==='image'&&(key==='fill'||key==='ink'))continue;
  const actual=key==='ink'?((o.elementPaint==='stroke'||type(o)==='line')&&(!o.fill||o.fill==='transparent')?'stroke':'fill'):key;
  o.set(actual,value);
  if(key==='strokeWidth'||key==='stroke')o.set({strokeLineJoin:'round',strokeLineCap:'round'});
  dirty(o);
 }
 if(key==='strokeWidth')relayout(target);
 return true;
}
function noFill(target){
 if(!target||locked(target))return false;
 for(const o of leaves(target)){if(type(o)!=='image'){o.set('fill',null);dirty(o);}}
 return true;
}
function textBackground(target,value){
 if(!target||locked(target))return false;
 for(const o of leaves(target).filter(isText)){o.set('textBackgroundColor',value);dirty(o);}
 return true;
}
const shadowDefaults={color:'rgba(0,0,0,0.25)',blur:16,offsetX:6,offsetY:8,affectStroke:true,nonScaling:false};
const shadowTargets=o=>type(o)==='activeselection'?children(o):[o];
function objectBackground(target,value){
 if(!target||locked(target))return false;
 for(const o of shadowTargets(target)){o.set('backgroundColor',value);dirty(o);}
 return true;
}
function shadow(target,patch,F){
 if(!target||locked(target))return false;
 for(const key of ['blur','offsetX','offsetY'])if(key in patch&&(!Number.isFinite(patch[key])||Math.abs(patch[key])>200||key==='blur'&&patch[key]<0))return false;
 if('alpha' in patch&&(!Number.isFinite(patch.alpha)||patch.alpha<0||patch.alpha>1))return false;
 for(const o of shadowTargets(target)){
  if(patch.enabled===false){o.set('shadow',null);dirty(o);continue;}
  const values={...shadowDefaults,...(o.shadow?.toObject?.()||o.shadow||{})};
  for(const key of ['blur','offsetX','offsetY'])if(key in patch)values[key]=patch[key];
  const color=new F.Color(patch.color||values.color);
  color.setAlpha('alpha' in patch?patch.alpha:new F.Color(values.color).getAlpha());
  values.color=color.toRgba();o.set('shadow',new F.Shadow(values));dirty(o);
 }
 return true;
}
const api={leaves,locked,paint,noFill,textBackground,objectBackground,shadow};root.ZTH_EFFECTS=api;
if(typeof module!=='undefined')module.exports=api;
if(typeof document==='undefined')return;
const E=root.ZTH_EDITOR,F=root.fabric,$=id=>document.getElementById(id);
const hex=value=>'#'+new F.Color(typeof value==='string'?value:'#000000').toHex();
const panel=document.createElement('div');panel.className='object-effects';panel.id='objectEffects';
panel.innerHTML=`<h4>填充与描边</h4>
 <div class="effect-actions"><button type="button" id="effectNoFill">无填充</button><button type="button" id="effectNoStroke">无描边</button></div>
 <label>描边顺序<select id="effectPaintFirst"><option value="stroke">描边在后 · 保持文字清晰</option><option value="fill">描边在前</option></select></label>
 <label class="check"><input type="checkbox" id="effectObjectBackground">元素底色（矩形范围）</label><label>元素底色颜色<input type="color" id="effectObjectBackgroundColor" value="#fff1bd"></label>
 <div id="effectTextPanel"><label class="check"><input type="checkbox" id="effectTextBackground">文字底色</label><label>文字底色颜色<input type="color" id="effectTextBackgroundColor" value="#fff1bd"></label></div>
 <h4>投影</h4><label class="check"><input type="checkbox" id="effectShadow">启用投影</label>
 <div id="effectShadowFields"><label>投影颜色<input type="color" id="effectShadowColor" value="#000000"></label>
 <div class="pair"><label>浓度 %<input type="number" id="effectShadowAlpha" min="0" max="100" value="25"></label><label>模糊 px<input type="number" id="effectShadowBlur" min="0" max="200" value="16"></label></div>
 <div class="pair"><label>水平偏移 px<input type="number" id="effectShadowX" min="-200" max="200" value="6"></label><label>垂直偏移 px<input type="number" id="effectShadowY" min="-200" max="200" value="8"></label></div></div>
 <p id="effectSelectionNote" class="muted"></p>`;
$('strokeWidth').closest('label').insertAdjacentElement('afterend',panel);
function update(fn){const o=E.canvas.getActiveObject();if(!E.canEdit(o))return;if(!fn(o)){E.toast('请输入有效的样式数值');api.refresh();return;}E.canvas.requestRenderAll();E.changed();api.refresh();}
function number(id,min,max){const raw=$(id).value.trim(),n=Number(raw);return raw!==''&&Number.isFinite(n)&&n>=min&&n<=max?n:NaN;}
// The shared RGB/HEX dialog discovers these native color inputs automatically.
$('fillColor').onchange=()=>update(o=>paint(o,'fill',$('fillColor').value));
$('strokeColor').onchange=()=>update(o=>paint(o,'stroke',$('strokeColor').value));
$('strokeWidth').onchange=()=>update(o=>paint(o,'strokeWidth',number('strokeWidth',0,100)));
$('effectPaintFirst').onchange=()=>update(o=>paint(o,'paintFirst',$('effectPaintFirst').value));
$('effectNoFill').onclick=()=>update(noFill);
$('effectNoStroke').onclick=()=>update(o=>paint(o,'strokeWidth',0));
$('effectObjectBackground').onchange=()=>update(o=>objectBackground(o,$('effectObjectBackground').checked?$('effectObjectBackgroundColor').value:''));
$('effectObjectBackgroundColor').onchange=()=>update(o=>objectBackground(o,$('effectObjectBackgroundColor').value));
$('effectTextBackground').onchange=()=>update(o=>textBackground(o,$('effectTextBackground').checked?$('effectTextBackgroundColor').value:''));
$('effectTextBackgroundColor').onchange=()=>update(o=>textBackground(o,$('effectTextBackgroundColor').value));
$('effectShadow').onchange=()=>update(o=>shadow(o,{enabled:$('effectShadow').checked},F));
$('effectShadowColor').onchange=()=>update(o=>shadow(o,{color:$('effectShadowColor').value},F));
$('effectShadowAlpha').onchange=()=>update(o=>shadow(o,{alpha:number('effectShadowAlpha',0,100)/100},F));
for(const [id,key,min] of [['effectShadowBlur','blur',0],['effectShadowX','offsetX',-200],['effectShadowY','offsetY',-200]])$(id).onchange=()=>update(o=>shadow(o,{[key]:number(id,min,200)},F));
api.refresh=()=>{
 const o=E.canvas.getActiveObject();if(!o)return;
 const all=leaves(o),first=all[0],texts=all.filter(isText),blocked=locked(o);
 const isInk=(first.elementPaint==='stroke'||type(first)==='line')&&(!first.fill||first.fill==='transparent');
 $('fillColor').value=hex(first.fill);
 $('quickColor').value=hex(isInk?first.stroke:first.fill);
 $('strokeColor').value=hex(first.stroke);$('strokeWidth').value=first.strokeWidth||0;
 $('effectTextPanel').hidden=!texts.length;
 const background=shadowTargets(o)[0]?.backgroundColor;$('effectObjectBackground').checked=!!background;
 if(background)$('effectObjectBackgroundColor').value=hex(background);
 $('effectTextBackground').checked=!!texts[0]?.textBackgroundColor;
 if(texts[0]?.textBackgroundColor)$('effectTextBackgroundColor').value='#'+new F.Color(texts[0].textBackgroundColor).toHex();
 $('effectPaintFirst').value=first.paintFirst||'fill';
 const firstShadow=shadowTargets(o)[0]?.shadow;$('effectShadow').checked=!!firstShadow;
 const values={...shadowDefaults,...(firstShadow?.toObject?.()||firstShadow||{})},color=new F.Color(values.color);
 $('effectShadowColor').value='#'+color.toHex();$('effectShadowAlpha').value=Math.round(color.getAlpha()*100);
 $('effectShadowBlur').value=values.blur;$('effectShadowX').value=values.offsetX;$('effectShadowY').value=values.offsetY;
 $('effectShadowFields').hidden=!firstShadow;
 $('effectSelectionNote').textContent=blocked?'元素已锁定，请先解锁。':all.length>1?'显示首个元素的样式；修改的字段应用到整组或所有选中元素。':'投影随元素一起缩放，保存与导出会保留样式。';
 panel.querySelectorAll('input,select,button').forEach(el=>el.disabled=blocked);
};
E.canvas.on('selection:created',api.refresh);E.canvas.on('selection:updated',api.refresh);E.canvas.on('object:modified',api.refresh);api.refresh();
})(typeof window==='undefined'?globalThis:window);
