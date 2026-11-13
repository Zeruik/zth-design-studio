/* Offline design notes and pixel-size presets. All advice is available locally. */
(function(root){
'use strict';
const gcd=(a,b)=>b?gcd(b,a%b):a;
function ratio(width,height){const g=gcd(width,height);return width/g+':'+height/g;}
function orientation(width,height){return width===height?'square':width>height?'landscape':'portrait';}
const sizeRows=[
 ['social-square','方形社交图',1080,1080,'屏幕','活动公告、作品分享、头像封面'],
 ['social-portrait','竖版社交图',1080,1350,'屏幕','社交平台信息流、作品介绍'],
 ['poster-portrait','常用竖版海报',1080,1440,'屏幕','活动、讲座、社团招新'],
 ['story','手机全屏',1080,1920,'屏幕','手机竖屏邀请、故事海报'],
 ['slide','演示大屏',1920,1080,'屏幕','演示封面、会场屏幕、横版视频'],
 ['landscape-card','横版信息卡',1200,800,'屏幕','地址导览、信息摘要'],
 ['comparison','横向双栏',1600,1000,'屏幕','方案对比、工作周计划'],
 ['banner','宽幅横幅',1500,500,'屏幕','网页横幅、活动主题图'],
 ['ticket','长条票券',1800,600,'屏幕','入场券、课程券、活动票根'],
 ['infographic','流程长图',1080,2700,'屏幕','新手指南、步骤说明、知识整理'],
 ['audio','音频封面',1400,1400,'屏幕','播客封面、栏目封面'],
 ['product','产品说明',1200,1600,'屏幕','产品规格与功能介绍'],
 ['a4','A4 竖版',2480,3508,'印刷','项目手记、简历、菜单',210,297],
 ['a4-wide','A4 横版',3508,2480,'印刷','证书、横向说明页',297,210],
 ['a5','A5 竖版',1748,2480,'印刷','活动传单、小册单页',148,210],
 ['a5-wide','A5 横版',2480,1748,'印刷','邀请函、宣传单页',210,148],
 ['a3','A3 竖版',3508,4961,'印刷','展板、宣传海报',297,420],
 ['business','横版名片',1063,638,'印刷','个人名片、工作室联系卡',90,54],
 ['business-tall','竖版名片',638,1063,'印刷','个人品牌、作品集联系卡',54,90],
 ['postcard','明信片',1748,1181,'印刷','纪念卡、感谢卡、产品寄语',148,100]
];
const sizes=sizeRows.map(([id,name,width,height,category,usage,mmWidth,mmHeight])=>Object.freeze({id,name,width,height,category,usage,ratio:ratio(width,height),orientation:orientation(width,height),...(mmWidth?{mmWidth,mmHeight,ppi:300}:{}),exportTip:mmWidth?'像素按 300 ppi 约算，不含出血；印刷前确认成品尺寸、出血与色彩要求。':'按实际用途核对像素尺寸；PNG 适合文字和透明背景，JPG 适合照片。'}));
const lessons=[
 {id:'hierarchy',category:'排版',title:'先让读者看见重点',summary:'一张设计只设一个主重点，再安排说明与行动信息。',steps:['主标题回答：这是什么？','副标题回答：为什么值得关注？','时间、地点、联系或报名方式集中放置。','缩到手机宽度检查：第一眼还能看懂主题吗？'],related:['poster-portrait','slide']},
 {id:'alignment',category:'排版',title:'用对齐整理关系',summary:'先选一条主对齐线，再安排文字、图片与卡片。',steps:['同一组信息的左边缘保持一致。','标题与正文不必同字号，但要有共同的对齐基准。','需要居中的证书或邀请函，可统一使用中心线。','检查每个卡片的内边距是否一致。'],related:['comparison','a4']},
 {id:'spacing',category:'排版',title:'间距也在传达信息',summary:'相关的信息靠近，独立的信息拉开距离。',steps:['先确定页边距，再安排内容区域。','标题与所属正文的间距，小于两组内容之间的间距。','让装饰与文字保持距离，避免线条穿过正文。','信息太多时拆成多页，不靠极小字号硬塞。'],related:['infographic','poster-portrait']},
 {id:'type',category:'文字',title:'字体如何搭配',summary:'用清晰的正文字体，配合一款有性格的标题字体。',steps:['黑体适合正文、参数、联系方式等需要快速辨认的信息。','艺术体和书写体优先用于短标题。','英文等宽字体适合编号、时间、代码和短标签。','替换文字后检查自动换行，特别是长邮箱与英文词。'],related:['business','slide']},
 {id:'copy',category:'文字',title:'把文字写得容易扫描',summary:'标题说主题，正文讲事实，末尾给行动。',steps:['尽量使用具体对象和动作，避免只有抽象口号。','长段落拆成短句；列表项目保持相近长度。','数字附上单位，日期明确到足够精确的范围。','示例价格、数据、姓名与二维码都需要替换。'],related:['social-square','product']},
 {id:'contrast',category:'颜色',title:'先检查可读性，再加颜色',summary:'背景和文字拉开明暗差异，辅助色用来强调关系。',steps:['不要只依靠红绿等颜色区分状态，同时加上文字或符号。','照片背景较杂时，加入纯色信息区或适度底色。','把画面缩小，检查浅色细字是否还能看清。','常用色可以保留在最近颜色中，减少无目的的换色。'],related:['audio','social-square']},
 {id:'palette',category:'颜色',title:'建立少而明确的色彩角色',summary:'先分配背景、正文与强调色，再决定具体色值。',steps:['背景色负责承托内容。','正文色应适合长时间阅读。','强调色用于关键数字、按钮或少量装饰。','同一组卡片重复使用相同的色彩角色。'],related:['comparison','poster-portrait']},
 {id:'images',category:'图像',title:'替换图片时检查什么',summary:'图片内容、裁切与清晰度一起决定最终效果。',steps:['照片、PNG 和 JPG 是位图，放大后清晰度受原有像素限制。','编辑器内的文字与矢量图形可以继续调整轮廓、尺寸和颜色。','照片裁切后，确认人物和产品主体没有被截断。','LOGO 保留完整比例与透明背景，检查去底后文字和细节是否完整。','替换图片槽后重新核对边缘与版面遮挡，并在实际输出尺寸检查。'],related:['product','postcard']},
 {id:'icons',category:'图像',title:'让图标帮助解释内容',summary:'图标表达短而熟悉的概念，文字负责消除歧义。',steps:['同一排图标使用接近的视觉大小与描边粗细。','开放线条图标通常用描边色；无填充可保留内部透明。','对象不透明度会影响整个元素，底色与填充是两个不同的设置。','阴影用于分离主体与背景，避免模糊范围盖住小字或相邻图标。','复杂内容附一个简短标签，不要让装饰挤占重要文字。'],related:['landscape-card','infographic']},
 {id:'screen-size',category:'输出',title:'屏幕设计先看像素',summary:'输出像素与显示比例决定屏幕上的内容范围。',steps:['先选择横版、竖版或方形，再开始排版。','按手机、投屏或网页的实际显示区域预览。','长图在手机上会缩小，正文应保持清楚。','导出倍率增加像素数量，但不会让原本模糊的照片恢复细节。'],related:['story','slide','infographic']},
 {id:'print-size',category:'输出',title:'印刷尺寸与像素的关系',summary:'物理尺寸 = 像素 ÷ ppi；常用 300 ppi 作为印刷参考。',steps:['本面板的印刷尺寸按 300 ppi 约算，像素取整数。','增加 ppi 而不增加像素时，可印刷的物理尺寸会变小。','最终分辨率、纸张与颜色要求以印刷服务方为准。','这里显示的毫米尺寸不会自动成为导出文件的印刷设置。'],related:['a4','a5','business'],source:{title:'Adobe：印刷分辨率与像素尺寸',url:'https://helpx.adobe.com/photoshop/desktop/crop-resize-transform/resize-adjust-resolution/printed-image-resolution.html'}},
 {id:'bleed',category:'输出',title:'出血和安全距离',summary:'出血延伸到裁切线外；文字与 LOGO 应留在安全区域。',steps:['面板预设是成品参考尺寸，不自动附加出血。','满版背景需要按印厂要求向裁切线外延伸。','重要文字、二维码与 LOGO 不要紧贴裁切边。','当前导出不会自动添加印刷裁切标记，交印前确认要求。'],related:['business','postcard','a4'],source:{title:'Adobe：裁切标记与出血',url:'https://helpx.adobe.com/illustrator/using/printers-marks-bleeds.html'}},
 {id:'formats',category:'输出',title:'选对导出格式',summary:'PNG、JPG、SVG 和 PDF 适合不同的交付方式。',steps:['PNG 支持透明背景，适合文字、图形与 LOGO。','JPG 不支持透明背景，适合照片类分享。','SVG 适合保留矢量结构；外部软件的字体与效果显示可能不同。','当前 PDF 按页面图像输出，交付前检查实际尺寸和清晰度。'],related:['poster-portrait','product','a4']},
 {id:'review',category:'检查',title:'发布前的五分钟检查',summary:'核对信息、视觉与文件，减少返工。',steps:['核对名称、日期、地点、价格、联系方式。','检查文字是否溢出、被遮挡或出现意外换行。','二维码四周保留至少 4 个模块宽的空白，不裁掉留白，也不叠放装饰。','用实际设备扫描最终导出的二维码，确认内容、目标与尺寸都可用。','保存可编辑工程，再导出需要的文件；重新打开导出结果查看。'],related:['social-square','poster-portrait','ticket'],source:{title:'DENSO WAVE：二维码区域与留白',url:'https://www.qrcode.com/en/howto/code.html'}}
];
function searchSizes(query='',category='全部'){const q=String(query).trim().toLowerCase();return sizes.filter(p=>(category==='全部'||p.category===category)&&[p.name,p.usage,p.ratio,p.width+'',p.height+''].join(' ').toLowerCase().includes(q));}
function searchLessons(query='',category='全部'){const q=String(query).trim().toLowerCase();return lessons.filter(p=>(category==='全部'||p.category===category)&&[p.title,p.summary,p.category,...p.steps].join(' ').toLowerCase().includes(q));}
function matchesTemplate(t,{query='',category='全部',orientation:shape='all',purpose='全部'}={}){
 const w=t.width||t.document?.pages?.[0]?.width,h=t.height||t.document?.pages?.[0]?.height;
 return(category==='全部'||t.category===category)&&(purpose==='全部'||t.purpose===purpose)&&(shape==='all'||shape==='long'&&h/w>=2||shape==='wide'&&w/h>=2||shape===orientation(w,h))&&[t.name,t.category,t.purpose,t.sizeLabel,t.ratio,w,h].join(' ').toLowerCase().includes(String(query).trim().toLowerCase());
}
function render(body,{onSelectSize}={}){
 if(!body||!root.document)return;
 const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n;};
 const shell=el('section','template-v4-guides'),tabs=el('div','template-v4-tabs'),search=el('input','search'),filter=el('select','template-v4-select'),list=el('div','template-v4-guide-list'),count=el('p','library-note');
 search.type='search';search.placeholder='搜索知识、用途或尺寸';search.setAttribute('aria-label','搜索设计知识与尺寸');filter.setAttribute('aria-label','筛选知识或尺寸分类');count.setAttribute('aria-live','polite');let mode='sizes';
 const sizeTab=el('button','','常用尺寸'),guideTab=el('button','','设计知识');for(const b of [sizeTab,guideTab]){b.type='button';tabs.append(b);}
 const updateFilter=()=>{filter.replaceChildren();const groups=mode==='sizes'?['全部','屏幕','印刷']:['全部',...new Set(lessons.map(l=>l.category))];for(const value of groups){const option=el('option','',value);option.value=value;filter.append(option);}draw();};
 const choose=p=>{if(!onSelectSize)return;Promise.resolve(onSelectSize({...p})).catch(e=>root.ZTH_EDITOR?.toast('操作失败：'+e.message));};
 function draw(){list.replaceChildren();sizeTab.setAttribute('aria-pressed',String(mode==='sizes'));guideTab.setAttribute('aria-pressed',String(mode==='lessons'));const rows=mode==='sizes'?searchSizes(search.value,filter.value):searchLessons(search.value,filter.value);count.textContent=rows.length+' 项'+(mode==='sizes'?'尺寸参考':'设计知识');
  if(!rows.length)list.append(el('p','library-note','没有匹配内容，试试其他关键词。'));
  for(const row of rows){const card=el('article','template-v4-guide-card');card.append(el('h3','',row.name||row.title));
   if(mode==='sizes'){const shape=el('div','template-v4-size-shape'),scale=Math.min(65/row.height,160/row.width);shape.style.width=Math.round(row.width*scale)+'px';shape.style.height=Math.round(row.height*scale)+'px';shape.setAttribute('aria-hidden','true');card.append(shape,el('p','template-v4-dimensions',row.width+' × '+row.height+' px · '+row.ratio),el('p','',row.usage));if(row.mmWidth)card.append(el('p','library-note','约 '+row.mmWidth+' × '+row.mmHeight+' mm · '+row.ppi+' ppi'));card.append(el('p','library-note',row.exportTip));if(onSelectSize){const b=el('button','wide','使用此尺寸');b.type='button';b.onclick=()=>choose(row);card.append(b);}}
   else{card.append(el('p','',row.summary));const steps=el('ol','');for(const text of row.steps)steps.append(el('li','',text));card.append(steps);if(row.related?.length){const related=el('div','template-v4-related');for(const key of row.related){const preset=sizes.find(s=>s.id===key);if(!preset)continue;const b=el(onSelectSize?'button':'span','chip',preset.name);if(onSelectSize){b.type='button';b.onclick=()=>choose(preset);}related.append(b);}card.append(related);}if(row.source){const a=el('a','template-v4-source',row.source.title+' ↗');a.href=row.source.url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}}
   list.append(card);
  }
 }
 sizeTab.onclick=()=>{mode='sizes';updateFilter();};guideTab.onclick=()=>{mode='lessons';updateFilter();};search.oninput=draw;filter.onchange=draw;shell.append(tabs,search,filter,count,list);body.append(shell);updateFilter();
}
root.ZTH_DESIGN_GUIDES={sizes,lessons,ratio,orientation,searchSizes,searchLessons,matchesTemplate,render};
if(typeof module!=='undefined')module.exports=root.ZTH_DESIGN_GUIDES;
})(typeof window==='undefined'?globalThis:window);
