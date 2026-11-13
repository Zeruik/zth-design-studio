/* Original editable templates. Every shape and text item becomes a separate canvas object. */
(function(root){
const font='ZTH Sans';
const text=(value,x,y,size=36,fill='#181a20',extra={})=>({kind:'text',text:value,left:x,top:y,fontSize:size,fill,width:920,fontFamily:font,lineHeight:1.18,...extra});
const rect=(x,y,w,h,fill,extra={})=>({kind:'rect',left:x,top:y,width:w,height:h,fill,...extra});
const circle=(x,y,r,fill,extra={})=>({kind:'circle',left:x,top:y,radius:r,fill,...extra});
const path=(d,fill,extra={})=>({kind:'path',path:d,fill,...extra});
const line=(x,y,x2,y2,color='#181a20',width=2)=>({kind:'line',points:[x,y,x2,y2],stroke:color,strokeWidth:width});
const photo=(src,x,y,w,h)=>({kind:'image',src,left:x,top:y,boxW:w,boxH:h});
const brand=(white=false,x=82,y=64,w=300)=>photo(white?'assets/01-81899.png':'assets/02-81900.png',x,y,w,w*.4);
const foot=(color='#242424')=>[line(82,1296,998,1296,color),text('ZEROTOHAND STUDIO',82,1320,21,color,{width:500,charSpacing:130}),text('DESIGN / BUILD / SHARE',660,1320,16,color,{width:350,textAlign:'right',charSpacing:50})];
function editorial(){let objects=[text('ZEROTOHAND STUDIO',62,30,28,'#171715',{fontFamily:'Arial',fontWeight:'bold',width:600}),text('OPEN STUDIO / 01',683,30,26,'#171715',{fontFamily:'Arial',fontWeight:'bold',width:337,textAlign:'right'}),text('把想法，\n做成真的。',57,99,133,'#151513',{fontWeight:'bold',width:960,lineHeight:1.03}),text('造物开放日',62,423,38,'#171715',{fontWeight:'bold'}),text('MAKE IDEAS REAL',64,463,31,'#171715',{fontFamily:'Arial',fontWeight:'bold'})];
for(const x of [145,310,540,770,935])objects.push(line(x,525,x,1145,'#b0a99d',1));for(const y of [545,670,850,1025,1135])objects.push(line(62,y,1018,y,'#b0a99d',1));objects.push(circle(210,490,330,'transparent',{stroke:'#6b665d',strokeWidth:1.4}),line(62,525,1018,1135,'#6b665d',1.2),line(62,1135,1018,525,'#6b665d',1.2));
const polygon=(d,fill)=>path(d,fill,{stroke:'#20201c',strokeWidth:1.5,strokeLineJoin:'round'});
objects.push(polygon('M 540 510 L 835 680 L 745 732 L 540 614 L 335 732 L 245 680 Z','#f76b2d'),polygon('M 245 680 L 335 732 L 335 915 L 245 967 Z','#f26227'),polygon('M 245 967 L 540 1137 L 540 1033 L 335 915 Z','#f76b2d'),polygon('M 540 1137 L 835 967 L 745 915 L 540 1033 Z','#ea5821'),polygon('M 835 680 L 835 967 L 745 915 L 745 732 Z','#ed5c22'),polygon('M 540 614 L 540 849 L 630 797 L 630 562 Z','#ed5c22'),polygon('M 335 915 L 745 679 L 835 731 L 425 967 Z','#ff7a37'),polygon('M 425 967 L 630 1085 L 720 1033 L 425 863 Z','#ed5c22'),text('DESIGN / BUILD / SHARE',62,1218,43,'#171715',{fontFamily:'Arial',fontWeight:'bold',width:960}),line(62,1194,1018,1194,'#171715',3),text('设计 · 制造 · 分享',62,1280,33,'#171715',{fontWeight:'bold'}),text('2026.12.06 / 14:00–17:00',62,1353,25,'#171715',{fontFamily:'Arial',fontWeight:'bold'}),text('赋形造物工作室',685,1351,25,'#171715',{width:335,textAlign:'right',fontWeight:'bold'}));return {width:1080,height:1440,background:'#f7f3eb',objects};}
const groups=[['⚙','机械结构','机械设计 · 结构优化\n原型制作 · 3D 打印'],['▣','电子硬件','电路设计 · 传感器应用\n嵌入式开发 · 机器人'],['〈/〉','编程开发','Python · C/C++\n算法 · 上位机 · APP'],['✦','艺术设计','工业设计 · 视觉设计\n建模渲染 · 交互体验'],['◈','运营宣传','新媒体运营 · 活动策划\n视频制作 · 品牌传播'],['♧','项目管理','项目统筹 · 团队协作\n赛事组织 · 资源对接']];
function recruitment(){let o=[photo('assets/workshop.jpg',570,1060,510,600),rect(0,0,1080,1060,'#fbfcf3'),path('M 0 0 L 390 0 L 300 62 L 0 125 Z','#eaf1d4'),path('M 760 0 L 1080 0 L 1080 160 Z','#a1c641'),{...photo('assets/07-81868.png',60,45,130,145),cropX:88,cropY:156,width:190,height:195},text('向阳科创工作室',218,70,38,'#142230',{fontWeight:'bold',width:610}),text('XIANGYANG INNOVATION STUDIO',220,126,17,'#314d5d',{width:620,charSpacing:60}),text('创新 · 实践 · 成长 · 未来',220,171,20,'#385d76',{width:600,charSpacing:140}),text('用创新\n点亮更多可能',820,70,26,'#15354c',{width:220,textAlign:'center'}),text('向阳科创工作室',58,262,80,'#111b22',{fontWeight:'bold',width:960,skewX:-7}),text('招新启幕！',55,365,139,'#0964ca',{fontWeight:'bold',width:1000,skewX:-7}),path('M 60 536 Q 430 490 890 513 L 680 526 Q 380 532 60 548 Z','#a0c637'),rect(60,570,730,65,'#6d9e20',{skewX:-10}),text('面向全校所有学院、所有专业开放！',86,586,30,'#ffffff',{fontWeight:'bold',width:710}),rect(808,570,210,65,'#ffc723',{skewX:-10}),text('不限基础！',827,586,30,'#121b2c',{fontWeight:'bold',width:205}),text('我们在做什么？',62,667,33,'#122548',{fontWeight:'bold'})];
groups.forEach((g,i)=>{let x=60+(i%3)*326,y=728+Math.floor(i/3)*172,c=['#77a523','#0068d6','#f2a017','#8b62c2','#10a6b4','#e6b60b'][i];o.push(rect(x,y,308,153,'#ffffff',{rx:12,ry:12,stroke:'#e2e5da',strokeWidth:1}),circle(x+18,y+18,25,c),text(g[0],x+22,y+23,27,'#ffffff',{width:45,textAlign:'center'}),text(g[1],x+78,y+23,26,'#112547',{fontWeight:'bold',width:212}),text(g[2],x+20,y+81,19,'#30445b',{width:275,lineHeight:1.4}));});
o.push(text('招新点位',62,1091,31,'#102952',{fontWeight:'bold'}),rect(60,1140,450,54,'#fffffff0',{rx:7,ry:7,stroke:'#8dbb41',strokeWidth:2}),text('教学楼 A504  /  A519',79,1150,28,'#132c51',{width:430,fontWeight:'bold'}),rect(60,1224,515,217,'#ffffffee',{rx:12,ry:12}),text('从好奇，到创造。',83,1244,40,'#142d50',{width:480,fontWeight:'bold'}),text('无论你是科创小白，还是技能大佬，\n我们寻找愿意沉下心做科创的同行者。',85,1312,22,'#324863',{width:465,lineHeight:1.55}),{kind:'group',left:60,top:1475,name:'二维码占位',role:'qr',children:[rect(0,0,150,150,'#ffffff',{stroke:'#8dbb41',strokeWidth:3}),text('上传你的\n真实二维码',15,45,21,'#648d2b',{width:120,textAlign:'center'})]},text('扫码加入我们',241,1501,30,'#11294e',{width:320,fontWeight:'bold'}),text('期待与你在向阳相遇！',244,1560,20,'#304763',{width:310}),text('XIANGYANG INNOVATION STUDIO',60,1690,17,'#688598',{width:900,charSpacing:130}),path('M 0 1800 L 0 1730 L 170 1800 Z','#1484d8'),path('M 1080 1800 L 780 1800 L 1080 1675 Z','#8fbd36'));
return {width:1080,height:1800,background:'#f8fbef',objects:o};}
function lecture(){return {width:1080,height:1440,background:'#172d54',objects:[text('ZTH / KNOWLEDGE SERIES',80,80,23,'#c1d1ed',{charSpacing:130}),rect(80,155,80,7,'#e8fd7b'),text('从零开始\n理解机器人',72,215,112,'#ffffff',{fontWeight:'bold',width:960,lineHeight:1.12}),text('ROBOTICS\nFOR EVERYONE',80,555,61,'#e8fd7b',{fontWeight:'bold',width:900}),circle(690,740,200,'transparent',{stroke:'#52698b',strokeWidth:2}),circle(760,810,130,'transparent',{stroke:'#8a9db9',strokeWidth:2}),line(600,940,1005,940,'#8a9db9'),line(890,690,890,1180,'#8a9db9'),rect(80,850,570,324,'#223e68',{rx:12,ry:12}),text('公开讲座 / OPEN TALK',110,888,24,'#e8fd7b',{width:510}),text('结构 × 电控 × 代码\n一次讲清机器人如何运动',110,957,34,'#ffffff',{width:510,lineHeight:1.5}),text('12.12  SAT.\n14:00 — 16:00',80,1237,26,'#ffffff',{width:500}),text('赋形造物工作室\n零基础友好 · 欢迎交流',650,1244,23,'#c1d1ed',{width:350,textAlign:'right'})]};}
function exhibition(){let o=[text('FORM\nFOLLOWS\nCURIOSITY.',65,130,105,'#20201e',{fontFamily:'Arial',fontWeight:'bold',width:950,lineHeight:1}),text('好奇，赋形。',72,538,38,'#20201e'),text('STUDENT PROJECT SHOWCASE / 2026',75,80,19,'#20201e',{charSpacing:90}),rect(75,690,930,380,'#c4c9ff'),circle(355,730,130,'#f66e50'),rect(485,798,185,185,'#272945',{angle:20}),circle(200,925,55,'#fbf5a1'),text('学生作品展',75,1130,59,'#20201e',{fontWeight:'bold'}),text('机械 / 电子 / 设计 / 编程\n让每一个想法，都有被看见的机会。',78,1220,26,'#57574e',{width:920,lineHeight:1.6}),text('ZeroToHand Studio',78,1350,23,'#20201e')];return {width:1080,height:1440,background:'#f2f0e8',objects:o};}
function workshop(){return {width:1080,height:1440,background:'#eee8df',objects:[photo('assets/workshop.jpg',0,0,1080,760),rect(0,760,1080,680,'#eee8df'),text('HANDS ON / MINDS OPEN',72,815,20,'#655d54',{charSpacing:160}),text('造物\n进行时',68,870,112,'#292b27',{width:960,fontWeight:'bold',lineHeight:1}),text('周末原型工作坊',72,1130,34,'#292b27'),line(72,1220,1008,1220,'#b5ada0'),text('3D 打印 × 电子制作 × 创意设计',72,1250,26,'#615b51'),text('每一个原型，都是向前的一小步。',72,1316,23,'#615b51'),text('ZTH STUDIO',768,1380,19,'#292b27',{width:240})]};}
function schedule(){let o=[text('DESIGN WEEK',72,75,22,'#2d4c43',{charSpacing:180}),text('一周，\n让创意发生。',67,170,102,'#183d32',{width:960,fontWeight:'bold',lineHeight:1.1}),text('工作室活动日历 / DECEMBER 2026',75,442,23,'#537468',{width:960}),rect(72,535,936,650,'#ffffff',{rx:15,ry:15})];[['MON','01','创意共创','从观察到问题定义'],['WED','03','技能分享','建模、渲染与快速原型'],['FRI','05','开放交流','带上你的作品和问题'],['SUN','07','成果展示','让想法彼此碰撞']].forEach((a,i)=>{let y=575+i*148;o.push(text(a[0],103,y,20,'#668074',{width:110}),text(a[1],98,y+29,53,'#183d32',{width:120,fontFamily:'Arial',fontWeight:'bold'}),text(a[2],282,y+4,33,'#183d32',{width:650,fontWeight:'bold'}),text(a[3],284,y+57,23,'#668074',{width:650}));if(i<3)o.push(line(102,y+123,978,y+123,'#e4ebe6'));});o.push(text('保持好奇，欢迎来坐。',75,1250,38,'#183d32'),text('ZERO TO HAND / IDEAS TO LIFE',75,1350,20,'#668074',{charSpacing:120}));return {width:1080,height:1440,background:'#e6eee4',objects:o};}
function portfolio(){return {width:1080,height:1440,background:'#161617',objects:[text('MADE\nWITH\nINTENT.',65,160,138,'#f8f6f2',{fontFamily:'Arial',fontWeight:'bold',width:950,lineHeight:.94}),text('有想法，更有行动。',75,650,40,'#d8d0c7'),rect(75,795,930,340,'#ed7448',{rx:5,ry:5}),text('01',110,810,232,'#26211f',{fontFamily:'Arial',fontWeight:'bold',width:500}),text('作品档案\nPROJECT ARCHIVE',650,977,27,'#26211f',{width:320}),text('从问题出发\n以作品作答',75,1220,35,'#f8f6f2',{width:600,lineHeight:1.4}),text('ZTH / 2026',780,1330,23,'#bcb7b0',{width:230,textAlign:'right'})]};}
function projectBoard(){let o=[text('ZTH / PROJECT BRIEF',65,60,23,'#316453',{charSpacing:150}),text('把问题，\n变成可验证的设计。',60,155,84,'#183d32',{width:950,fontWeight:'bold',lineHeight:1.1}),text('项目展示 · 从研究到原型',65,382,28,'#678071',{width:950}),photo('assets/workshop.jpg',65,472,950,460)];[['01 研究问题','描述现实场景中的具体问题，\n说明研究对象与使用需求。'],['02 设计方案','展示核心结构与关键参数，\n解释方案如何回应问题。'],['03 实验验证','设置对照条件与评价指标，\n使用实际数据检验效果。'],['04 下一步','总结发现、局限与改进方向，\n让每轮迭代都有明确目标。']].forEach((a,i)=>{let x=65+(i%2)*490,y=990+Math.floor(i/2)*175;o.push(rect(x,y,460,150,'#ffffff',{rx:12,ry:12}),text(a[0],x+20,y+17,28,'#183d32',{width:425,fontWeight:'bold'}),text(a[1],x+20,y+66,21,'#678071',{width:425,lineHeight:1.4}));});o.push(text('ZEROTOHAND STUDIO / RESEARCH INTO REALITY',65,1380,18,'#678071',{width:950,charSpacing:60}));return {width:1080,height:1440,background:'#edf2e8',objects:o};}
function infoCards(){let o=[text('STUDIO / ESSENTIAL GUIDE',65,65,22,'#74658d',{charSpacing:140}),text('新成员，\n从这里开始。',60,170,100,'#302746',{fontWeight:'bold',width:950,lineHeight:1.1}),text('一份关于参与、协作与成长的小指南',65,437,27,'#74658d')];[['找到兴趣','机械、电控、编程、设计、运营。\n选择想深入了解的方向。'],['认识伙伴','带上好奇心来工作室交流，\n了解正在进行的真实项目。'],['动手试试','从一个小任务开始，\n把想法变成可展示的成果。'],['一起成长','记录过程、分享经验，\n让每一次合作都有新的收获。']].forEach((a,i)=>{let y=550+i*180;o.push(rect(65,y,950,158,i%2?'#e8ddf5':'#ffffff',{rx:12,ry:12}),text('0'+(i+1),95,y+28,66,'#9878c6',{width:135,fontFamily:'Arial',fontWeight:'bold'}),text(a[0],260,y+22,31,'#302746',{width:700,fontWeight:'bold'}),text(a[1],263,y+78,23,'#74658d',{width:690,lineHeight:1.35}));});o.push(text('一起，把热爱变成能力。',65,1325,32,'#302746'));return {width:1080,height:1440,background:'#f4eff8',objects:o};}
function productTemplate(){return {width:1440,height:1440,background:'#efedf2',objects:[{...photo('assets/robot-product.jpg',160,0,1120,1120),name:'产品图片槽 · 可替换',role:'photo',imageSlot:true},rect(1140,65,225,225,'#212032',{rx:18,ry:18,locked:true,lockMovementX:true,lockMovementY:true,lockScalingX:true,lockScalingY:true,lockRotation:true,hasControls:false,name:'固定品牌底板'}),{...photo('assets/05-81892.png',1160,85,185,185),colorKey:true,name:'固定 LOGO · 已抠背景',role:'logo',locked:true,lockMovementX:true,lockMovementY:true,lockScalingX:true,lockScalingY:true,lockRotation:true,hasControls:false},rect(0,1120,1440,320,'#f7f5f8'),text('FORM TO FUNCTION',80,1160,23,'#625c70',{width:800,charSpacing:170}),text('让创造，触手可及。',75,1220,68,'#242032',{width:1280,fontWeight:'bold'}),text('ZEROTOHAND STUDIO / PRODUCT SERIES 01',80,1315,22,'#625c70',{width:1280,charSpacing:90})]};}
function blank(){return {width:1080,height:1440,background:'#ffffff',objects:[]};}

// Each format has its own composition rather than a stretched portrait layout.
function screenLandscape(){return {width:1920,height:1080,background:'#eeeae2',objects:[
 text('ZEROTOHAND / OPEN STUDIO',96,70,25,'#37362e',{width:1200,charSpacing:120}),
 text('把想法\n做成真的。',88,222,156,'#20231e',{width:1030,fontWeight:'bold',lineHeight:1.08}),
 text('设计 · 制造 · 分享',96,660,40,'#53584c',{width:900}),
 rect(1130,180,600,600,'#ea693b',{rx:20,ry:20}),
 circle(1205,255,225,'#f4db88'),rect(1320,366,220,220,'#224d42',{angle:18}),
 line(96,870,1824,870,'#b2b5a7',2),
 text('开放日 / 欢迎带上你的好奇心',96,920,32,'#20231e',{width:1100}),
 text('时间与地点 · 点击填写',1300,925,25,'#53584c',{width:520,textAlign:'right'})]};}
function squareNotice(){return {width:1080,height:1080,background:'#e9efdf',objects:[
 text('STUDIO / NEWS',70,62,24,'#49684f',{width:800,charSpacing:160}),
 text('新的一期，\n一起动手。',64,165,108,'#183c2b',{width:940,fontWeight:'bold',lineHeight:1.12}),
 rect(70,468,940,360,'#ffffff',{rx:22,ry:22}),
 text('周末造物工作坊',104,505,50,'#183c2b',{width:870,fontWeight:'bold'}),
 text('从一个小原型开始，\n认识工具、尝试制作、分享你的发现。',108,599,31,'#55735b',{width:850,lineHeight:1.6}),
 circle(861,737,28,'#e6a84b'),
 text('日期 / 地点 · 点击填写',72,898,28,'#183c2b',{width:920}),
 text('ZEROTOHAND STUDIO',72,994,20,'#55735b',{width:920,charSpacing:160})]};}
function storyPortrait(){return {width:1080,height:1920,background:'#181f2b',objects:[
 text('ZTH / WEEKEND WORKSHOP',76,92,24,'#e6c592',{width:930,charSpacing:110}),
 text('保持好奇\n开始创造',68,254,142,'#fff5e8',{width:950,fontWeight:'bold',lineHeight:1.14}),
 text('从零出发，也有无限可能。',77,655,36,'#c1c7d2',{width:930}),
 {...photo('assets/workshop.jpg',76,805,928,640),name:'工作坊照片 · 可替换',imageSlot:true},
 rect(76,1514,928,264,'#f0c47d',{rx:16,ry:16}),
 text('周末原型工作坊',110,1550,48,'#202633',{width:850,fontWeight:'bold'}),
 text('时间 · 地点 · 报名方式\n点击文字填写你的活动信息',114,1635,29,'#4a443c',{width:840,lineHeight:1.5}),
 text('DESIGN / BUILD / SHARE',78,1835,23,'#c1c7d2',{width:930,charSpacing:160})]};}
function wideBanner(){return {width:1500,height:500,background:'#ebe4f1',objects:[
 rect(1030,0,470,500,'#644694'),circle(1122,80,160,'#d6c4ee'),
 path('M 1140 180 L 1330 100 L 1390 280 L 1200 360 Z','#ec9d73'),
 text('ZEROTOHAND / CREATIVE LAB',64,55,19,'#6a547d',{width:900,charSpacing:100}),
 text('让灵感，落地生长。',58,150,77,'#332441',{width:940,fontWeight:'bold'}),
 text('工作室开放日 · 设计与制作的碰撞',64,286,29,'#6a547d',{width:910}),
 text('时间 / 地点 · 点击填写',66,407,22,'#332441',{width:900})]};}
function paperA4(){return {width:2480,height:3508,background:'#f6f3ed',objects:[
 text('ZEROTOHAND / PROJECT JOURNAL',164,155,44,'#6c6b63',{width:2150,charSpacing:130}),
 line(164,255,2316,255,'#a8aca2',3),
 text('一个问题，\n一份设计答案。',146,395,210,'#24372e',{width:2170,fontWeight:'bold',lineHeight:1.12}),
 text('项目研究与实践记录',164,950,64,'#6c6b63',{width:2150}),
 {...photo('assets/workshop.jpg',164,1120,2152,1100),name:'项目展示照片 · 可替换',imageSlot:true},
 rect(164,2350,1035,690,'#e6ece2',{rx:24,ry:24}),
 rect(1280,2350,1036,690,'#e9e3d6',{rx:24,ry:24}),
 text('01 / 研究与方案',213,2410,61,'#24372e',{width:920,fontWeight:'bold'}),
 text('写下你观察到的问题。\n描述目标人群和使用场景。\n介绍设计思路与核心结构。',219,2550,46,'#59645b',{width:915,lineHeight:1.75}),
 text('02 / 验证与迭代',1329,2410,61,'#24372e',{width:920,fontWeight:'bold'}),
 text('记录测试方法与真实结果。\n说明方案的优势和局限。\n列出下一步的改进计划。',1335,2550,46,'#59645b',{width:915,lineHeight:1.75}),
 line(164,3205,2316,3205,'#a8aca2',3),
 text('项目名称 / 作者 / 日期 · 点击填写',164,3265,49,'#24372e',{width:2150}),
 text('RESEARCH / PROTOTYPE / LEARN',164,3375,32,'#6c6b63',{width:2150,charSpacing:130})]};}
function recruitmentLandscape(){return {width:1600,height:900,background:'#f6f9ee',objects:[
 rect(0,0,565,900,'#1c594c'),
 text('一起\n把热爱\n做成作品',57,165,100,'#fcf9de',{width:455,fontWeight:'bold',lineHeight:1.2}),
 text('JOIN THE STUDIO',62,765,23,'#cee6ce',{width:440,charSpacing:80}),
 text('工作室招新',635,78,70,'#203a32',{width:895,fontWeight:'bold'}),
 text('不限专业，欢迎愿意动手的你。',640,186,28,'#688073',{width:890}),
 ...[['机械与制作','结构设计 · 模型制作'],['电子与编程','电路开发 · 机器人'],['视觉与传播','平面设计 · 内容表达']].flatMap((a,i)=>[
  rect(638,284+i*154,892,128,'#e6eee0',{rx:12,ry:12}),
  text('0'+(i+1),664,312+i*154,49,'#7c9a59',{width:125,fontWeight:'bold'}),
  text(a[0],810,305+i*154,33,'#203a32',{width:680,fontWeight:'bold'}),
  text(a[1],812,359+i*154,22,'#688073',{width:680})]),
 text('报名方式 / 联系方式 · 点击填写',641,803,25,'#203a32',{width:885})]};}
function postcard(){return {width:1480,height:1050,background:'#f1ede5',objects:[
 {...photo('assets/robot-product.jpg',0,0,740,1050),name:'作品图片 · 可替换',imageSlot:true},
 text('STUDIO / COLLECTION',804,83,20,'#827563',{width:610,charSpacing:100}),
 text('让创造\n触手可及',796,228,99,'#332f28',{width:610,fontWeight:'bold',lineHeight:1.17}),
 line(806,525,1405,525,'#b7ac97',2),
 text('从概念，到原型。\n记录每一次动手的成果。',807,585,32,'#827563',{width:590,lineHeight:1.6}),
 text('作品名称 · 点击填写',805,827,31,'#332f28',{width:600,fontWeight:'bold'}),
 text('ZEROTOHAND STUDIO',807,946,20,'#827563',{width:600,charSpacing:100})]};}
function socialPortrait(){return {width:1080,height:1350,background:'#ffebe0',objects:[
 text('IDEAS / IN PROGRESS',70,62,21,'#92604b',{width:940,charSpacing:150}),
 text('好想法，\n值得被看见。',64,170,107,'#4d2b24',{width:945,fontWeight:'bold',lineHeight:1.1}),
 rect(70,490,940,570,'#c96b48',{rx:18,ry:18}),
 circle(210,575,198,'#ffe0a4'),rect(550,660,185,185,'#543843',{angle:18}),
 text('工作室作品分享',72,1130,42,'#4d2b24',{width:930,fontWeight:'bold'}),
 text('设计 / 电子 / 机械 / 编程',74,1210,27,'#92604b',{width:930}),
 text('ZEROTOHAND STUDIO',74,1292,18,'#92604b',{width:930,charSpacing:100})]};}
const templates=[['open-day','造物开放日','活动',editorial],['recruit','向阳 · 内容招新','招新',recruitment],['talk','机器人公开课','讲座',lecture],['show','好奇，赋形','展览',exhibition],['workshop','周末原型工作坊','活动',workshop],['schedule','工作室活动日历','内容',schedule],['portfolio','作品档案','展览',portfolio],['product','产品图 · 固定品牌角标','品牌',productTemplate],['brief','项目研究展板','内容',projectBoard],['guide','新成员指南','内容',infoCards],['blank','空白画布','基础',blank]] .map(([id,name,category,build])=>({id,name,category,build}));
// Curated palette alternatives retain their own editable originals.
[['sunny','向阳 · 明亮招新','招新',recruitment,'#0964ca','#026e85'],['violet','灵感 · 紫色作品展','展览',exhibition,'#c4c9ff','#c7b6e9'],['coral','开放日 · 珊瑚红','活动',editorial,'#f26536','#d95156'],['research-blue','研究展板 · 海蓝','内容',projectBoard,'#183d32','#173f6b'],['guide-coral','成员指南 · 杏色','内容',infoCards,'#e8ddf5','#f4dccb'],['mint','清爽 · 活动日历','内容',schedule,'#e6eee4','#e2eef2']].forEach(([id,name,category,fn,from,to])=>templates.push({id,name,category,build:()=>{let s=fn();return JSON.parse(JSON.stringify(s).replaceAll(from,to));}}));
[
 ['screen-landscape','开放日 · 横屏 16:9','活动',screenLandscape],
 ['square-notice','工作坊 · 方形公告','活动',squareNotice],
 ['story-portrait','保持好奇 · 竖屏 9:16','活动',storyPortrait],
 ['wide-banner','灵感生长 · 宽幅横幅','品牌',wideBanner],
 ['paper-a4','项目手记 · A4 印刷','内容',paperA4],
 ['recruit-landscape','一起创造 · 横版招新','招新',recruitmentLandscape],
 ['postcard-landscape','作品明信片 · 横版','展览',postcard],
 ['social-portrait','好想法 · 社交竖图 4:5','展览',socialPortrait]
].forEach(([id,name,category,build])=>templates.push({id,name,category,build}));
// 4.0 originals: every format is composed for its actual reading distance and use.
// Explicit text widths allow QA to check both glyph ink and wrapping.
const T=(value,x,y,size,w,color='#202a35',extra={})=>text(value,x,y,size,color,{width:w,strokeWidth:0,role:size>=60?'title':'body',...extra});
const scene=(width,height,background,objects)=>({width,height,background,objects});
const tag=(value,x,y,w,color='#52606a')=>T(value,x,y,22,w,color,{fontFamily:/^[\x00-\x7f]*$/.test(value)?'Roboto Mono':font,charSpacing:30});
const v4=[
 ['agenda-screen','论坛日程 · 会场大屏','活动','会议日程',()=>scene(1920,1080,'#f2f4ee',[
  rect(0,0,640,1080,'#193c35'),tag('STUDIO / FORUM',74,72,500,'#b9d5c5'),T('共创\n下一步',70,240,126,500,'#ffffff',{fontWeight:'bold'}),T('主题论坛 · 日程表',76,628,34,490,'#c8dfcf'),T('日期 / 会场\n点击填写',76,874,27,490,'#c8dfcf',{lineHeight:1.5}),
  ...[['13:30','签到与交流','欢迎与同行者相识'],['14:00','主题分享','从真实问题走向设计'],['15:00','圆桌讨论','观点碰撞，分享实践'],['16:00','开放问答','带走一个可以开始的行动']].flatMap((r,i)=>{const y=118+i*218;return[tag(r[0],710,y+4,180,'#29745d'),T(r[1],958,y,48,830,'#203e34',{fontWeight:'bold'}),T(r[2],961,y+82,30,810,'#64796b'),line(710,y+164,1810,y+164,'#cdd6c9',2)];})
 ]),{copyTips:['标题建议 4–8 字；议程每项用动词或明确主题。','替换示例时间，并核对各环节间隔。'],layoutTips:'左栏承载活动身份，右栏按时间顺序阅读。'}],
 ['pitch-cover','项目提案 · 演示封面','内容','演示提案',()=>scene(1920,1080,'#192438',[
  rect(1250,0,670,1080,'#d7eea8'),circle(1350,240,185,'#86b79d'),rect(1460,455,230,230,'#315665',{angle:13}),tag('PROJECT / PROPOSAL',98,76,1050,'#afc0d3'),T('从问题出发\n向答案靠近',88,263,116,1100,'#ffffff',{fontWeight:'bold',lineHeight:1.12}),T('项目名称 / 一句话价值说明',100,650,38,1040,'#b6c6d9'),line(100,845,1160,845,'#5a6a80',2),T('汇报人 · 团队 · 日期',100,903,28,1050,'#b6c6d9'),tag('01 / START',1330,930,520,'#254439')
 ]),{copyTips:['主标题写项目要解决的具体问题。','副标题说明对象或价值；作者与日期放在底部。'],layoutTips:'左侧文字与右侧几何留白分区，适合投屏开场。'}],
 ['research-slide','研究摘要 · 三栏汇报','内容','研究汇报',()=>scene(1920,1080,'#f7f5f0',[
  tag('RESEARCH / SUMMARY',90,56,1600),T('让结论，有依据。',84,126,88,1730,'#283d50',{fontWeight:'bold'}),T('研究主题 · 将长段说明压缩成三个关键部分',92,263,30,1730,'#677788'),
  ...[['01','问题','我们观察到什么？\n对象是谁，场景是什么？','写出一个可验证的问题。'],['02','方法','我们怎样进行测试？\n对照、样本与指标是什么？','只保留与结论相关的方法。'],['03','发现','结果支持什么判断？\n还有哪些局限与下一步？','使用真实数据与清晰单位。']].flatMap((r,i)=>{const x=90+i*590;return[rect(x,376,560,526,i===2?'#dce9db':'#e7ebed',{rx:18,ry:18}),tag(r[0],x+32,410,480,'#536b5e'),T(r[1],x+30,472,62,480,'#293e50',{fontWeight:'bold'}),T(r[2],x+32,588,29,480,'#526577',{lineHeight:1.65}),T(r[3],x+32,800,24,480,'#526577')];}),T('作者 / 团队 / 数据来源 · 点击填写',92,975,26,1710,'#677788')
 ]),{copyTips:['每栏只表达一个结论，正文建议 2–4 行。','数据必须填写来源，避免使用示例数值作结论。'],layoutTips:'等宽三栏便于对照问题、方法与发现。'}],
 ['quote-square','一句话 · 金句分享','内容','观点分享',()=>scene(1080,1080,'#f3eee4',[
  tag('NOTES / 01',72,66,900,'#8d7259'),T('“',65,180,170,270,'#d7b38a',{fontFamily:'ZCOOL XiaoWei'}),T('好的设计，\n从认真观察\n生活开始。',95,340,82,880,'#4b3a2e',{fontFamily:'ZCOOL XiaoWei',lineHeight:1.3}),line(98,810,980,810,'#c9bca8',2),T('作者 / 出处 · 点击填写',98,867,27,870,'#826d5b'),tag('OBSERVE / THINK / MAKE',98,994,880,'#826d5b')
 ]),{copyTips:['引文建议不超过 30 字，手动分成 2–4 行。','填写真实作者与出处；原创内容可标注个人笔记。'],layoutTips:'大引号建立视觉焦点，正文保持宽松行距。'}],
 ['metric-square','数据亮点 · 单指标卡','内容','数据展示',()=>scene(1080,1080,'#e7eff4',[
  tag('PROJECT / KEY RESULT',70,60,930,'#43637b'),T('这一次，我们做到了',64,160,60,940,'#183b56',{fontWeight:'bold'}),rect(70,307,940,476,'#163c59',{rx:22,ry:22}),T('85',110,365,244,570,'#ffffff',{fontFamily:'Roboto Mono',fontWeight:'bold'}),T('%',700,500,88,220,'#bcdfc4'),T('指标名称 · 请替换示例数据',112,699,28,830,'#c6dce9'),T('用一行解释指标的含义与比较基准。',72,854,31,940,'#3f5e74'),T('统计范围 / 日期 / 来源 · 点击填写',72,968,23,930,'#617b8d')
 ]),{copyTips:['85% 是排版占位，请换成已核实的数值。','同时写清单位、统计区间、比较基准与来源。'],layoutTips:'单指标卡只强调一个数字，不堆叠无关结论。'}],
 ['launch-square','新品发布 · 产品信息卡','品牌','产品发布',()=>scene(1200,1200,'#f6efe9',[
  tag('NEW / IN THE STUDIO',70,56,1060,'#8c6655'),T('小巧，也有大想法。',64,136,69,1070,'#442e29',{fontWeight:'bold'}),rect(70,276,1060,555,'#e6cbb7',{rx:22,ry:22}),circle(329,350,190,'#f8ecd9'),rect(453,420,288,248,'#6c7b6b',{rx:28,ry:28}),rect(508,480,178,42,'#dbe9d5',{rx:8,ry:8}),T('产品名称',72,888,55,1000,'#442e29',{fontWeight:'bold'}),T('一句话说明用途 / 三个特点 / 了解方式',74,980,29,1050,'#8c6655'),tag('DESIGN / EDITION 01',74,1110,1040,'#8c6655')
 ]),{copyTips:['产品名称建议 4–10 字；特点用短语表达。','中部几何为示意构图，可删除后放入自己的透明产品图。'],layoutTips:'上方提出价值，中部展示主体，底部承接行动信息。'}],
 ['event-ticket','活动入场券 · 宽票根','活动','入场凭证',()=>scene(1800,600,'#f7f3e8',[
  rect(0,0,72,600,'#d45c40'),rect(1370,0,430,600,'#233f43'),tag('ADMISSION / OPEN DAY',130,52,1140,'#9a614b'),T('把好奇，带进现场。',122,155,88,1160,'#233f43',{fontWeight:'bold'}),T('活动名称 · 普通入场',132,303,36,1110,'#6c7165'),T('日期 / 时间 / 场地 · 点击填写',132,445,29,1130,'#6c7165'),line(1320,52,1320,548,'#aaa38e',2),T('NO.',1420,62,28,320,'#afc2b8',{fontFamily:'Roboto Mono'}),T('001',1416,124,96,330,'#f4f0dc',{fontFamily:'Roboto Mono'}),rect(1470,285,230,230,'#ffffff'),T('二维码\n上传替换',1490,349,31,190,'#53685f',{textAlign:'center',role:'qr'})
 ]),{copyTips:['核对票号、时间、地点与入场规则。','右侧为二维码位置示意，删除占位后生成真实二维码。'],layoutTips:'信息区与票根区分开，便于查看和核验。'}],
 ['business-landscape','工作名片 · 横版','品牌','联系方式',()=>scene(1063,638,'#f5f0e6',[
  rect(0,0,358,638,'#2c4a40'),circle(79,155,100,'#d9e5bd'),T('ZTH',93,212,65,240,'#2c4a40',{fontWeight:'bold'}),tag('STUDIO',80,469,230,'#d9e5bd'),T('你的姓名',415,82,57,575,'#2c4a40',{fontWeight:'bold'}),T('职位 / 专业方向',420,174,24,560,'#7a8071'),line(420,270,990,270,'#b7bead',2),T('电话：请填写\n邮箱：请填写\n地址：请填写',420,323,27,555,'#4d6657',{lineHeight:1.8}),T('让想法成为作品',420,557,22,555,'#7a8071')
 ]),{sizeLabel:'名片约 90 × 54 mm（300 ppi）',copyTips:['姓名与联系信息是重点，避免放入长段介绍。','正式印刷前确认成品尺寸、出血与裁切安全距离。'],exportTip:'约 90 × 54 mm / 300 ppi 参考；此画布未附加出血，按印厂要求另设出血与裁切。'}],
 ['business-portrait','个人名片 · 竖版','品牌','联系方式',()=>scene(638,1063,'#f1e6df',[
  rect(44,44,550,975,'transparent',{stroke:'#ac8a75',strokeWidth:2}),tag('DESIGNER',88,92,470,'#9a6d54'),T('你的\n姓名',81,219,100,475,'#4c332b',{fontFamily:'ZCOOL XiaoWei',lineHeight:1.15}),T('视觉设计 / 创意实践',88,520,28,465,'#9a6d54'),line(88,621,550,621,'#bc9d88',2),T('电话：请填写\n邮箱：请填写\n作品集：请填写',88,680,25,460,'#755343',{lineHeight:1.8}),T('保持好奇，认真创造。',88,937,22,460,'#9a6d54')
 ]),{sizeLabel:'竖名片约 54 × 90 mm（300 ppi）',copyTips:['姓名可分两行；长邮箱应降低字号或增加宽度。','作品集网址使用短地址，并测试是否可正常访问。'],exportTip:'约 54 × 90 mm / 300 ppi 参考；交印前按供应商要求设置出血。'}],
 ['flyer-a5','周末市集 · A5 传单','活动','活动宣传',()=>scene(1748,2480,'#fff0db',[
  tag('WEEKEND / MARKET',116,100,1500,'#a05b3e'),T('让手作\n遇见生活',98,272,184,1530,'#683c2e',{fontFamily:'ZCOOL XiaoWei',lineHeight:1.15}),T('创意市集 · 周末见',118,818,60,1500,'#a05b3e'),circle(198,1100,320,'#d98a55'),rect(830,1130,500,540,'#658878',{rx:30,ry:30,angle:7}),circle(1110,1460,170,'#f5cf75'),line(118,1910,1630,1910,'#bc9479',3),T('日期 / 时间 / 场地',120,1990,58,1490,'#683c2e',{fontWeight:'bold'}),T('参与方式与更多信息 · 点击填写',120,2140,43,1500,'#a05b3e'),tag('HANDMADE / LOCAL / TOGETHER',120,2358,1500,'#a05b3e')
 ]),{sizeLabel:'A5 竖版 · 1748 × 2480 px',copyTips:['标题控制在 8 字左右；活动信息集中在底部。','抽象几何可换成摊位或手作产品照片。'],exportTip:'A5 约 148 × 210 mm（300 ppi）；PNG 可保留清晰文字，印刷前确认出血和色彩要求。'}],
 ['certificate-wide','荣誉证书 · 横向 A4','内容','证书表彰',()=>scene(3508,2480,'#f9f5e9',[
  rect(100,100,3308,2280,'transparent',{stroke:'#b49855',strokeWidth:8}),rect(140,140,3228,2200,'transparent',{stroke:'#d2c398',strokeWidth:2}),T('CERTIFICATE OF APPRECIATION',300,280,50,2900,'#9a8249',{textAlign:'center',fontFamily:'Roboto Mono'}),T('荣誉证书',300,500,196,2900,'#51462f',{fontFamily:'ZCOOL XiaoWei',textAlign:'center'}),T('颁发给：你的姓名',360,950,95,2780,'#51462f',{textAlign:'center'}),line(950,1150,2558,1150,'#c2af7c',3),T('感谢你在项目中的投入、协作与创造。\n愿这份好奇与热爱，继续带来新的可能。',480,1295,65,2540,'#827353',{textAlign:'center',lineHeight:1.7}),T('颁发单位：请填写',400,2020,50,1350,'#827353'),T('日期：请填写',2050,2020,50,1050,'#827353',{textAlign:'right'}),T('本证书为模板示例，请填写真实活动与颁发信息。',400,2220,31,2700,'#9a8b69',{textAlign:'center'})
 ]),{sizeLabel:'A4 横版 · 3508 × 2480 px',copyTips:['姓名、事由、颁发单位与日期务必核对。','无需保留底部示例说明时可以删除该文字。'],layoutTips:'左右对称构图，以姓名和荣誉为中心。'}],
 ['menu-a4','咖啡与轻食 · A4 菜单','品牌','菜单价目',()=>scene(2480,3508,'#f1eadc',[
  T('GOOD\nAFTERNOON',150,170,160,2160,'#3d4c3d',{fontFamily:'ZCOOL XiaoWei',lineHeight:1.05}),T('午后菜单 / MENU',160,620,55,2160,'#8a836b'),
  ...[['COFFEE','咖啡','经典美式','拿铁咖啡','手冲单品'],['LIGHT BITES','轻食','时令沙拉','烘烤三明治','今日甜点']].flatMap((r,i)=>{let x=160+i*1120;return[tag(r[0],x,900,1000,'#8a836b'),T(r[1],x,1000,92,990,'#3d4c3d',{fontWeight:'bold'}),...r.slice(2).flatMap((v,j)=>[T(v,x,1280+j*390,58,950,'#3d4c3d'),T('简介 / 配料 · 点击填写',x,1380+j*390,36,950,'#8a836b'),T('价格：请填写',x,1470+j*390,35,950,'#8a836b'),line(x,1570+j*390,x+980,1570+j*390,'#c5bda9',2)])];}),rect(160,2670,2160,430,'#dce2cc',{rx:22,ry:22}),T('今日推荐',215,2730,66,2040,'#3d4c3d',{fontWeight:'bold'}),T('写下推荐组合、供应时间与饮食提示。',220,2870,43,2040,'#6f785c'),T('店名 / 营业时间 / 联系方式 · 点击填写',165,3270,40,2150,'#8a836b')
 ]),{copyTips:['价格需核对；过敏原与配料信息应真实准确。','每个品类先写 3 项，保留阅读间距。'],layoutTips:'两栏品类与底部推荐区建立清晰层级。'}],
 ['resume-a4','个人介绍 · A4 简历','内容','个人履历',()=>scene(2480,3508,'#ffffff',[
  rect(0,0,760,3508,'#e6edf0'),T('你的\n姓名',110,190,136,570,'#243e50',{fontWeight:'bold'}),T('求职方向 / 专业',116,625,42,545,'#678093'),line(115,790,640,790,'#a9bdc7',3),T('联系信息',115,905,55,540,'#243e50',{fontWeight:'bold'}),T('电话：请填写\n邮箱：请填写\n所在城市：请填写',118,1030,35,520,'#587183',{lineHeight:1.8}),T('专业技能',115,1510,55,540,'#243e50',{fontWeight:'bold'}),T('技能一 / 工具名称\n技能二 / 工具名称\n技能三 / 工具名称',118,1640,35,520,'#587183',{lineHeight:1.8}),
  ...[['个人简介','用 2–3 行介绍你的方向与能力。\n突出与目标岗位相关的经验。'],['教育经历','学校 / 专业 / 起止时间\n写明与目标岗位相关的课程或成果。'],['项目经历','项目名称 / 个人职责 / 时间\n描述实际行动，并用证据说明结果。'],['更多经历','实习、志愿活动或作品集链接\n优先选择能够体现能力的内容。']].flatMap((r,i)=>{const y=210+i*780;return[T(r[0],880,y,70,1450,'#243e50',{fontWeight:'bold'}),rect(880,y+114,1360,5,'#b6cbd5'),T(r[1],884,y+185,45,1360,'#587183',{lineHeight:1.75})];})
 ]),{copyTips:['联系方式可用较小字号，但必须可读。','项目经历优先写职责、行动与结果，避免空泛评价。'],layoutTips:'窄栏放身份和技能，宽栏展示经历。'}],
 ['onboarding-long','入门指南 · 信息长图','内容','流程指南',()=>scene(1080,2700,'#eef1e7',[
  tag('WELCOME / FIRST STEPS',72,60,930,'#6a7f5c'),T('第一次来，\n从这里开始。',65,180,99,945,'#2d4937',{fontWeight:'bold'}),T('把参与方式讲清楚，让新伙伴更容易开始。',75,470,29,930,'#6a7f5c'),
  ...[['01','找到方向','看看正在进行的项目，\n选一个你想了解的主题。'],['02','认识伙伴','介绍自己的兴趣与经验，\n约一次轻松的交流。'],['03','认领任务','从一个清楚的小任务开始，\n确认目标、时间与协作方式。'],['04','动手记录','记录过程与遇到的问题，\n让每次尝试都有迹可循。'],['05','分享成果','展示作品，也分享经验。\n下一步，我们一起讨论。']].flatMap((r,i)=>{const y=650+i*350;return[rect(70,y,940,305,i%2?'#dee7d4':'#ffffff',{rx:20,ry:20}),T(r[0],100,y+46,65,170,'#88a06f',{fontFamily:'Roboto Mono'}),T(r[1],300,y+43,44,650,'#2d4937',{fontWeight:'bold'}),T(r[2],303,y+136,29,640,'#6a7f5c',{lineHeight:1.6})];}),T('联系方式 / 参与入口 · 点击填写',75,2530,29,930,'#2d4937'),tag('START SMALL / KEEP GOING',75,2630,930,'#6a7f5c')
 ]),{copyTips:['每步说明一件事，正文建议不超过 40 字。','长图底部提供可以执行的联系或参与入口。'],layoutTips:'编号建立纵向阅读节奏，卡片之间保留呼吸感。'}],
 ['project-timeline','项目里程碑 · 长图','内容','进度规划',()=>scene(1080,2400,'#f3edf5',[
  tag('PROJECT / ROADMAP',72,62,930,'#876d93'),T('每一步，\n都向前一点。',66,181,99,940,'#493753',{fontWeight:'bold'}),T('项目名称 / 计划周期 · 点击填写',74,479,29,930,'#876d93'),line(154,685,154,2080,'#b7a4c8',6),
  ...[['第一阶段','明确问题','调研场景、梳理需求\n写出可验证的目标'],['第二阶段','提出方案','比较不同路径\n选择一条开始制作'],['第三阶段','制作测试','完成最小原型\n记录测试与反馈'],['第四阶段','迭代分享','改进关键问题\n整理过程与成果']].flatMap((r,i)=>{const y=650+i*360;return[circle(128,y+35,26,'#8b6ba5'),tag(r[0],225,y,760,'#876d93'),T(r[1],222,y+58,51,760,'#493753',{fontWeight:'bold'}),T(r[2],226,y+155,31,750,'#876d93',{lineHeight:1.6})];}),rect(72,2165,936,143,'#d9cbe6',{rx:16,ry:16}),T('负责人 / 本周重点 · 点击填写',103,2216,30,865,'#493753')
 ]),{copyTips:['阶段名称尽量短，任务描述使用动词。','时间和负责人需与实际计划一致。'],layoutTips:'时间轴只表达顺序，不暗示阶段耗时相同。'}],
 ['spec-portrait','产品规格 · 竖版说明卡','品牌','产品说明',()=>scene(1200,1600,'#e9eff1',[
  tag('PRODUCT / FIELD NOTES',74,62,1050,'#5d7988'),T('为真实场景而设计',68,164,76,1060,'#254351',{fontWeight:'bold'}),rect(75,327,1050,495,'#d0dfe2',{rx:18,ry:18}),rect(371,405,430,320,'#486975',{rx:40,ry:40}),circle(500,486,80,'#f0c17d'),T('产品名称 / 版本',76,891,48,1040,'#254351',{fontWeight:'bold'}),
  ...[['尺寸','填写长 × 宽 × 高'],['材质','填写主要材质'],['功能','填写核心功能'],['适用场景','填写使用条件']].flatMap((r,i)=>{const y=1010+i*115;return[T(r[0],78,y,29,285,'#5d7988'),T(r[1],370,y,29,740,'#254351'),line(78,y+72,1120,y+72,'#bdcfd6',2)];}),T('参数仅为占位说明；请按实物填写。',78,1515,22,1040,'#5d7988')
 ]),{copyTips:['参数保留单位，避免只写数字。','示意图可以替换为自己的产品图或结构图。'],layoutTips:'上方介绍主体，下方用两列清晰列出参数。'}],
 ['promotion-portrait','限时活动 · 社交推广','活动','活动推广',()=>scene(1080,1350,'#f8e8dd',[
  rect(0,0,1080,140,'#9a4737'),T('STUDIO / SPECIAL EVENT',65,49,26,950,'#f8e8dd',{fontFamily:'Roboto Mono'}),T('给喜欢的事，\n留一点时间。',64,232,94,950,'#713b30',{fontWeight:'bold'}),circle(742,555,125,'#eab16c'),rect(70,630,940,350,'#fff7ed',{rx:24,ry:24}),T('活动名称',105,678,56,865,'#713b30',{fontWeight:'bold'}),T('活动内容 / 参与条件\n费用或优惠规则 · 请填写',110,780,31,850,'#a16a54',{lineHeight:1.6}),T('时间 / 地点 / 联系方式',73,1060,32,930,'#713b30'),T('报名方式或二维码 · 请填写',73,1152,27,930,'#a16a54'),tag('MAKE TIME / MAKE SOMETHING',73,1275,930,'#a16a54')
 ]),{copyTips:['推广内容写清适用范围、时间与参与条件。','不要保留未经确认的价格或优惠表述。'],layoutTips:'标题负责吸引注意，浅色信息区负责解释活动。'}],
 ['invitation-story','相聚邀请 · 手机竖屏','活动','邀请通知',()=>scene(1080,1920,'#eef0e4',[
  rect(52,52,976,1816,'transparent',{stroke:'#a9b495',strokeWidth:2}),tag('YOU ARE INVITED',100,128,880,'#7d8d6e'),T('来，一起\n聊聊创意。',87,358,132,900,'#3e5640',{fontFamily:'Ma Shan Zheng',lineHeight:1.22}),circle(161,974,190,'#d3d9bb'),circle(550,1086,140,'#c3cdb1'),line(104,1435,976,1435,'#a9b495',2),T('工作室交流晚会',104,1499,46,870,'#3e5640',{fontWeight:'bold'}),T('日期 / 时间 / 地点\n联系人 / 参与方式',108,1604,31,860,'#7d8d6e',{lineHeight:1.7}),tag('BRING YOUR IDEAS',108,1798,860,'#7d8d6e')
 ]),{copyTips:['主标题使用自然邀请语，保持 2–3 行。','在手机预览中确认底部参与信息清晰。'],layoutTips:'书写字体只用于主标题，细节信息使用清晰黑体。'}],
 ['contact-location','找到我们 · 地址信息卡','品牌','地点导览',()=>scene(1200,800,'#f5f4ed',[
  rect(0,0,500,800,'#dce7de'),line(55,188,445,188,'#a4b9ac',20),line(130,55,130,745,'#a4b9ac',20),line(55,580,445,580,'#a4b9ac',20),line(370,55,370,745,'#a4b9ac',20),circle(196,286,56,'#cc7351'),T('ZTH',196,307,29,112,'#ffffff',{textAlign:'center',fontWeight:'bold'}),T('地图示意 · 请替换',63,696,23,375,'#698375'),tag('VISIT / THE STUDIO',560,62,570,'#698375'),T('从这里，\n开始相遇。',552,168,73,580,'#2c4c3d',{fontWeight:'bold'}),T('地址：请填写\n开放时间：请填写\n联系方式：请填写',562,433,29,560,'#698375',{lineHeight:1.75}),T('到访前请先确认开放安排。',562,707,23,560,'#698375')
 ]),{copyTips:['示意地图不可直接作为实际导航，请替换真实位置图。','写明楼栋、楼层、门牌及必要的到访说明。'],layoutTips:'左侧视觉导览与右侧文字信息各自成区。'}],
 ['checklist-page','活动筹备 · 清单卡','内容','任务清单',()=>scene(1080,1440,'#fff7df',[
  tag('READY / SET / GO',72,60,930,'#897844'),T('准备好，\n让活动发生。',64,176,100,950,'#4f4b31',{fontWeight:'bold'}),T('活动名称 / 负责人 · 点击填写',74,466,28,930,'#897844'),
  ...['确认时间、场地与参与人数','准备物料、设备与备用方案','核对宣传信息与报名方式','安排人员分工与现场指引','记录反馈与后续改进事项'].flatMap((v,i)=>{const y=622+i*135;return[rect(77,y+2,43,43,'transparent',{stroke:'#8e8959',strokeWidth:3,rx:6,ry:6}),T(v,156,y,30,842,'#4f4b31'),line(156,y+77,1000,y+77,'#d8ce9f',2)];}),T('每一项完成后，记得打勾。',76,1346,24,930,'#897844')
 ]),{copyTips:['用可以检查完成状态的动作来写任务。','补充截止时间和负责人，避免只有模糊事项。'],layoutTips:'复选框、文字与分隔线保持一致的左侧对齐。'}],
 ['timetable-wide','课程安排 · 横版周计划','内容','课程排期',()=>scene(1600,1000,'#edf1f5',[
  tag('WEEKLY / PLAN',74,48,1450,'#6b7f94'),T('把学习，安排得刚刚好。',68,122,71,1460,'#2b4862',{fontWeight:'bold'}),T('日期范围 / 班级或团队 · 点击填写',76,247,28,1450,'#6b7f94'),
  ...[['周一','阅读 / 调研','笔记整理'],['周二','技能练习','小组讨论'],['周三','原型制作','记录问题'],['周四','测试 / 修改','反馈交流'],['周五','成果分享','下周计划']].flatMap((r,i)=>{const x=75+i*294;return[rect(x,363,272,455,'#ffffff',{rx:16,ry:16}),T(r[0],x+18,397,39,236,'#2b4862',{textAlign:'center',fontWeight:'bold'}),line(x+20,477,x+252,477,'#d8e2eb',2),T(r[1],x+20,540,27,232,'#6b7f94',{textAlign:'center'}),T(r[2],x+20,666,27,232,'#6b7f94',{textAlign:'center'})];}),T('给临时变化留出空间，也给自己留出休息。',76,907,28,1440,'#6b7f94')
 ]),{copyTips:['每天保留 1–2 个重点，避免把计划写满。','这是排期示例，请按实际课程替换。'],layoutTips:'五个等宽栏按工作日阅读，适合横屏分享。'}],
 ['comparison-wide','方案对比 · 双栏信息','内容','方案对比',()=>scene(1600,1000,'#f5f1ed',[
  tag('OPTIONS / COMPARE',74,48,1450,'#8a796d'),T('看清差异，再做选择。',68,126,75,1460,'#4b423c',{fontWeight:'bold'}),
  ...[['方案 A','#e2e8dc','适合的场景','优势与实现条件','成本与主要局限'],['方案 B','#e7e1eb','适合的场景','优势与实现条件','成本与主要局限']].flatMap((r,i)=>{const x=76+i*750;return[rect(x,340,698,493,r[1],{rx:20,ry:20}),T(r[0],x+34,380,57,630,'#4b423c',{fontWeight:'bold'}),...r.slice(2).map((v,j)=>T(v+' · 请填写',x+38,506+j*97,29,620,'#7c7067'))];}),T('比较基于相同指标；结论应说明适用条件。',78,909,29,1440,'#8a796d')
 ]),{copyTips:['两栏使用相同指标，避免选择性比较。','优势与局限都要保留，结论注明适用场景。'],layoutTips:'双栏面积相等，让对比信息容易逐行扫描。'}],
 ['audio-cover','创作对谈 · 播客封面','品牌','音频封面',()=>scene(1400,1400,'#24253b',[
  tag('STUDIO / CONVERSATIONS',85,76,1220,'#b7b6d1'),T('把想法\n说出来',75,245,160,1230,'#f7e5bb',{fontWeight:'bold',lineHeight:1.1}),
  ...[130,220,355,460,280,180,380,520,320,195,110].map((h,i)=>rect(88+i*114,1040-h/2,48,h,i%2?'#c6b7e8':'#ecae8d',{rx:24,ry:24})),T('嘉宾 / 本期主题 · 点击填写',88,1278,32,1220,'#b7b6d1')
 ]),{copyTips:['封面主标题建议 4–8 字，缩小后仍需看清。','底部只放本期主题或嘉宾，详细介绍留在节目文案。'],layoutTips:'声波图形建立音频联想，大字保证缩略图辨识度。'}],
 ['reading-note','读书摘记 · 知识卡','内容','阅读笔记',()=>scene(1080,1440,'#eee8df',[
  tag('READING / FIELD NOTES',72,61,930,'#897969'),T('读过之后，\n留下一个想法。',65,180,96,950,'#4d4338',{fontFamily:'ZCOOL XiaoWei',lineHeight:1.15}),T('书名 / 作者 / 阅读日期',75,473,28,930,'#897969'),
  ...[['一句话概括','用自己的话说清本章的核心观点。'],['一个触动','记录让你停下来思考的内容。'],['一次应用','下一次遇到类似问题，你准备怎样做？']].flatMap((r,i)=>{const y=615+i*225;return[rect(72,y,936,196,i===1?'#e0d7c8':'#f8f5ef',{rx:12,ry:12}),T(r[0],103,y+30,37,870,'#4d4338',{fontWeight:'bold'}),T(r[1],106,y+108,27,862,'#897969')];}),T('引用原文时，请注明页码与来源。',76,1331,23,930,'#897969')
 ]),{copyTips:['用自己的话概括，避免把长段原文直接塞进卡片。','引用需标注出处和页码；单张卡片只围绕一个主题。'],layoutTips:'三个问题帮助从理解走向应用。'}]
];
v4.forEach(([id,name,category,purpose,build,details])=>templates.push({id,name,category,purpose,build,...details,edition:4}));
const purposes={活动:'活动宣传',招新:'成员招募',讲座:'知识讲座',展览:'作品展示',品牌:'品牌传播',内容:'内容说明',基础:'自由创作'};
const gcd=(a,b)=>b?gcd(b,a%b):a;
for(const t of templates){const s=t.build(),g=gcd(s.width,s.height);Object.assign(t,{
 width:s.width,height:s.height,ratio:(s.width/g)+':'+(s.height/g),orientation:s.width===s.height?'square':s.width>s.height?'landscape':'portrait',
 purpose:t.purpose||purposes[t.category]||'自由创作',sizeLabel:t.sizeLabel||s.width+' × '+s.height+' px',
 copyTips:t.copyTips||['先替换标题、日期、地点和联系方式。','标题表达一个重点；正文保留简短句子，修改后检查换行。'],
 layoutTips:t.layoutTips||'保持主要信息与装饰元素分区，留出外边距和文字间距。',
 exportTip:t.exportTip||(s.width>=2480||s.height>=3508?'画布为像素尺寸；交印前请确认成品大小、出血和色彩要求。':'屏幕分享可用 PNG 保留文字边缘；照片为主可用 JPG。按实际显示尺寸检查清晰度。')
 });}
root.ZTH_TEMPLATES=templates;root.ZTH_SCENE={text,rect,circle,path,line,photo};if(typeof module!=='undefined')module.exports={templates};
})(typeof window==='undefined'?globalThis:window);
