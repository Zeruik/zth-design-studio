/* Original vector artwork drawn on a 64-unit grid. No remote assets or icon fonts. */
(function(root){
'use strict';
const categories=['基础形状','方向箭头','常用符号','工具与制造','沟通与信息','图表与装饰'];
const items=[];
function item(category,id,name,path,filled=false,keywords=''){items.push(Object.freeze({category,id,name,path,filled,keywords}));}
const add=(category,rows)=>rows.forEach(row=>item(category,...row));
add(categories[0],[
 ['square','正方形','M8 8 H56 V56 H8 Z',true,'rectangle 方块 矩形'],
 ['rounded','圆角矩形','M14 10 H50 Q56 10 56 16 V48 Q56 54 50 54 H14 Q8 54 8 48 V16 Q8 10 14 10 Z',true,'rectangle'],
 ['circle','圆形','M32 6 A26 26 0 1 1 31.99 6 Z',true,'circle 圆点'],
 ['triangle','三角形','M32 6 L60 56 H4 Z',true,'triangle'],
 ['diamond','菱形','M32 4 L60 32 L32 60 L4 32 Z',true,'diamond'],
 ['hexagon','六边形','M18 6 H46 L61 32 L46 58 H18 L3 32 Z',true,'hexagon'],
 ['star','五角星','M32 4 L40 23 L61 25 L45 39 L50 60 L32 48 L14 60 L19 39 L3 25 L24 23 Z',true,'star'],
 ['heart','爱心','M32 57 C22 48 5 36 5 20 C5 3 25 2 32 16 C39 2 59 3 59 20 C59 36 42 48 32 57 Z',true,'heart 喜欢']
]);
add(categories[1],[
 ['arrow-right','向右箭头','M4 24 H37 V10 L61 32 L37 54 V40 H4 Z',true,'right'],
 ['arrow-left','向左箭头','M60 24 H27 V10 L3 32 L27 54 V40 H60 Z',true,'left'],
 ['arrow-up','向上箭头','M24 60 V27 H10 L32 3 L54 27 H40 V60 Z',true,'up'],
 ['arrow-down','向下箭头','M24 4 V37 H10 L32 61 L54 37 H40 V4 Z',true,'down'],
 ['arrow-both','双向箭头','M3 32 L21 14 V25 H43 V14 L61 32 L43 50 V39 H21 V50 Z',true,'双头 双向 horizontal'],
 ['arrow-turn','转弯箭头','M8 55 V30 Q8 14 24 14 H51 M39 4 L52 14 L39 25',false,'转向 return'],
 ['arrow-cycle','循环箭头','M52 21 A23 23 0 0 0 10 25 M52 6 V22 H37 M12 43 A23 23 0 0 0 54 39 M12 58 V42 H27',false,'刷新 cycle repeat'],
 ['chevrons','双重指引','M12 10 L34 32 L12 54 M32 10 L54 32 L32 54',false,'chevron next 下一步']
]);
add(categories[2],[
 ['check','对勾','M7 33 L24 50 L57 13',false,'check 完成 成功'],
 ['cross','叉号','M12 12 L52 52 M52 12 L12 52',false,'close 删除 错误'],
 ['plus','加号','M32 7 V57 M7 32 H57',false,'plus 添加'],
 ['minus','减号','M8 32 H56',false,'minus'],
 ['warning','警告','M32 5 L61 56 H3 Z M32 23 V36 M32 46 L32 47',false,'warning 注意'],
 ['information','信息','M32 5 A27 27 0 1 1 31.99 5 M32 27 V47 M32 17 L32 18',false,'info 帮助'],
 ['pin','位置标记','M32 59 C25 47 10 35 10 23 A22 22 0 1 1 54 23 C54 35 39 47 32 59 Z M32 15 A8 8 0 1 1 31.99 15',false,'地图 location 地点'],
 ['sparkle','闪光','M32 3 L40 24 L61 32 L40 40 L32 61 L24 40 L3 32 L24 24 Z',true,'sparkle 灵感']
]);
add(categories[3],[
 ['wrench','扳手','M46 5 L37 14 L41 23 L50 27 L59 18 C63 33 50 42 39 36 L17 58 Q12 62 7 57 Q2 52 6 47 L28 25 C22 14 31 1 46 5 Z',false,'维修 wrench'],
 ['hammer','锤子','M11 4 H38 L53 19 L43 29 L31 17 H11 Z M33 24 L49 40 L30 59 L18 47 Z',false,'hammer 制造'],
 ['screwdriver','螺丝刀','M46 4 L60 18 L50 28 L45 27 L31 41 M24 34 L38 48 L25 61 L11 47 Z M44 26 L38 20 L47 11',false,'screwdriver 装配'],
 ['ruler','直尺','M5 16 H59 V48 H5 Z M14 16 V29 M24 16 V25 M34 16 V29 M44 16 V25 M54 16 V29',false,'ruler 尺寸 测量'],
 ['gear','齿轮','M25 4 H39 L41 13 L48 17 L57 15 L63 27 L56 33 L56 41 L61 48 L51 59 L43 55 L35 59 L30 63 L18 58 L18 49 L12 43 L3 42 L1 29 L9 24 L12 17 L12 9 Z M32 23 A10 10 0 1 1 31.99 23',false,'gear 设置 机械'],
 ['brush','画笔','M31 34 L52 5 Q58 1 62 7 L40 39 Z M29 36 C12 32 20 55 5 57 C28 66 43 50 37 41 Z',false,'brush 绘画 艺术'],
 ['code','代码','M21 13 L4 32 L21 51 M43 13 L60 32 L43 51 M38 7 L26 57',false,'code 编程'],
 ['printer','打印机','M16 21 V5 H48 V21 M16 43 H7 V21 H57 V43 H48 M16 35 H48 V59 H16 Z M45 28 H49',false,'printer 打印 制作']
]);
add(categories[4],[
 ['chat','对话气泡','M10 6 H54 Q60 6 60 12 V40 Q60 46 54 46 H26 L9 59 V46 Q4 45 4 39 V12 Q4 6 10 6 Z M16 21 H48 M16 31 H38',false,'chat 留言'],
 ['mail','信封','M5 12 H59 V52 H5 Z M5 12 L32 34 L59 12 M5 52 L23 31 M59 52 L41 31',false,'email 邮件 联系'],
 ['calendar','日历','M8 12 H56 V58 H8 Z M8 25 H56 M19 5 V18 M45 5 V18 M18 35 H23 M31 35 H36 M44 35 H49 M18 46 H23 M31 46 H36',false,'calendar 日期 活动'],
 ['camera','相机','M6 17 H18 L23 9 H41 L46 17 H58 V55 H6 Z M32 24 A12 12 0 1 1 31.99 24 M49 24 H52',false,'camera 照片'],
 ['home','房屋','M3 29 L32 5 L61 29 M11 24 V58 H53 V24 M25 58 V38 H39 V58',false,'home 主页'],
 ['person','人物','M32 5 A12 12 0 1 1 31.99 5 M8 59 V50 Q8 34 24 34 H40 Q56 34 56 50 V59 Z',false,'user 用户 成员'],
 ['clock','时钟','M32 5 A27 27 0 1 1 31.99 5 M32 15 V32 L45 40',false,'clock 时间'],
 ['book','书本','M32 13 Q20 5 5 10 V53 Q20 48 32 56 Q44 48 59 53 V10 Q44 5 32 13 V56',false,'book 学习 知识']
]);
add(categories[5],[
 ['chart','柱状图','M5 5 V59 H60 M15 48 V31 H23 V48 Z M31 48 V20 H39 V48 Z M47 48 V9 H55 V48 Z',false,'chart 统计 数据'],
 ['trend','增长曲线','M5 5 V59 H60 M12 46 L27 31 L38 39 L58 13 M45 13 H58 V26',false,'trend 图表 趋势'],
 ['target','目标','M32 4 A28 28 0 1 1 31.99 4 M32 15 A17 17 0 1 1 31.99 15 M32 26 A6 6 0 1 1 31.99 26',false,'target 同心圆'],
 ['globe','地球','M32 5 A27 27 0 1 1 31.99 5 M5 32 H59 M32 5 C12 23 12 41 32 59 C52 41 52 23 32 5 Z',false,'globe 网络 世界'],
 ['cloud','云朵','M16 51 C0 51 0 30 14 27 C10 7 40 1 46 24 C64 18 67 51 49 51 Z',false,'cloud 天空'],
 ['leaf','叶片','M6 58 C1 23 13 7 58 5 C57 49 42 62 6 58 Z M6 58 L44 20 M22 42 L21 25 M22 42 L40 43',false,'leaf 绿色 环保'],
 ['burst','爆炸贴','M32 2 L39 14 L53 8 L51 23 L63 32 L51 40 L56 55 L41 51 L32 63 L24 51 L8 56 L13 40 L1 32 L14 24 L8 9 L24 14 Z',true,'burst 徽章 促销'],
 ['ticket','票券','M5 13 H59 V25 C47 25 47 39 59 39 V51 H5 V39 C17 39 17 25 5 25 Z M23 19 V23 M23 29 V35 M23 41 V45',false,'ticket 入场券']
]);
function search(query='',category='全部'){
 const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return items.filter(i=>(category==='全部'||i.category===category)&&terms.every(t=>(i.name+' '+i.keywords+' '+i.id).toLowerCase().includes(t)));
}
function create(id,F,color='#7352dc'){
 const i=items.find(i=>i.id===id);if(!i)throw Error('Unknown vector element');
 return new F.Path(i.path,{fill:i.filled?color:null,stroke:i.filled?null:color,strokeWidth:i.filled?0:3,strokeLineCap:'round',strokeLineJoin:'round',name:i.name,role:'other',elementPaint:i.filled?'fill':'stroke'});
}
function render(body){
 const E=root.ZTH_EDITOR,F=root.fabric,searchBox=document.createElement('input'),chips=document.createElement('div'),grid=document.createElement('div'),status=document.createElement('p');
 searchBox.type='search';searchBox.className='search';searchBox.placeholder='搜索箭头、工具、符号…';searchBox.setAttribute('aria-label','搜索矢量元素');
 chips.className='chips element-categories';chips.setAttribute('aria-label','元素分类');grid.className='vector-grid';status.className='library-note';status.setAttribute('role','status');
 let category='全部';
 function show(){grid.replaceChildren();const result=search(searchBox.value,category);status.textContent=result.length+' 个可改色矢量元素 · 可缩放、旋转和描边';for(const i of result){const button=document.createElement('button');button.type='button';button.className='vector-item';button.title=i.name;button.setAttribute('aria-label','添加'+i.name);const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS('http://www.w3.org/2000/svg','path');svg.setAttribute('viewBox','-3 -3 70 70');svg.setAttribute('aria-hidden','true');path.setAttribute('d',i.path);path.setAttribute('fill',i.filled?'currentColor':'none');path.setAttribute('stroke',i.filled?'none':'currentColor');path.setAttribute('stroke-width','3');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);const label=document.createElement('span');label.textContent=i.name;button.append(svg,label);button.onclick=()=>{const size=E.getSize(),o=create(i.id,F),edge=Math.min(240,Math.min(size.width,size.height)*.25);o.scaleToWidth(edge);o.set({left:(size.width-o.getScaledWidth())/2,top:(size.height-o.getScaledHeight())/2});E.add(o);};grid.append(button);}if(!result.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='没有找到，试试“箭头”或“工具”。';grid.append(empty);}}
 for(const c of ['全部',...categories]){const b=document.createElement('button');b.type='button';b.className='chip'+(c===category?' active':'');b.textContent=c;b.setAttribute('aria-pressed',String(c===category));b.onclick=()=>{category=c;for(const chip of chips.children){chip.classList.toggle('active',chip===b);chip.setAttribute('aria-pressed',String(chip===b));}show();};chips.append(b);}
 searchBox.oninput=show;body.append(searchBox,chips,grid,status);show();
}
root.ZTH_ELEMENTS={items:Object.freeze(items),categories:Object.freeze(categories),search,create,render};
if(typeof module!=='undefined')module.exports=root.ZTH_ELEMENTS;
if(root.fabric)root.fabric.FabricObject.customProperties=[...new Set([...root.fabric.FabricObject.customProperties,'elementPaint'])];
})(typeof window==='undefined'?globalThis:window);
