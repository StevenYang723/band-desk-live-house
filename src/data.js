(function(root){
'use strict';
const bands=[
 ['pop','Poppin’Party','星之连携','#ff558f','连携产生额外热度，整队安可收益提升','encore'],
 ['after','Afterglow','暮色节拍','#ef525b','稳定演奏叠加热度，长场演出收益提升','steady'],
 ['pastel','Pastel＊Palettes','闪耀应援','#7bd7c4','应援转为额外演出收入','income'],
 ['rose','Roselia','极致演奏','#9d83f3','精准演奏提升评价与技能爆发','precision'],
 ['hello','Hello, Happy World!','微笑魔法','#ffce65','观众互动有 40% 概率额外获得 100 金币','fans'],
 ['mor','Morfonica','和声蝶舞','#8fbdf4','和声逐层累积，后半场增益更强','harmony'],
 ['ras','RAISE A SUILEN','电流脉冲','#65dfcc','技能冷却缩短，节拍连续爆发','speed'],
 ['mygo','MyGO!!!!!','迷途共鸣','#6db8ee','积累共鸣，合奏产生更多热度','resonance'],
 ['ave','Ave Mujica','月下终章','#d05776','开场蓄势，终章演奏大幅增强','finale'],
 ['mew','夢限大みゅーたいぷ','灵感宇宙','#c49af4','技能随机灵感提升下一次演奏','inspire'],
 ['mills','millsage','旋律祝福','#9bcf9b','键盘与主唱相互强化，旋律叠加','melody'],
 ['ikka','一家Dumb Rock!','律动家族','#efb264','双主唱与全队接力产生额外热度','relay'],
 ['glitter','Glitter*Green','青春回声','#79ca90','特别演出的稳定热度提高','steady'],
 ['chispa','CHiSPA','再次相遇','#ed9e76','连携演奏提高演出评价','resonance'],
 ['sumimi','sumimi','双星舞台','#e9a4d4','双人编制激活应援收入加成','income'],
 ['crychic','CRYCHIC','记忆合奏','#91b9c8','五人重聚激活共鸣加成','resonance']
].map(([id,name,tag,color,desc,effect],i)=>({id,name,tag,color,desc,effect,index:i,main:i<12}));
// Hair colour, silhouette and instrument are independently defined for every performer.
const raw=[
 ['pop','kasumi','户山香澄','guitar','Gt. & Vo.','#885744','star','星之心跳'],
 ['pop','tae','花园多惠','guitar','Gt.','#343146','long','月兔旋律'],
 ['pop','rimi','牛込里美','bass','Ba.','#584057','bob','巧克力低音'],
 ['pop','saaya','山吹沙绫','drums','Dr.','#ad7444','pony','温暖鼓点'],
 ['pop','arisa','市谷有咲','keys','Key.','#eac17d','twins','庭院和弦'],
 ['after','ran','美竹兰','guitar','Gt. & Vo.','#35313b','streak','不变的夕阳'],
 ['after','moca','青叶摩卡','guitar','Gt.','#b8b8c9','bob','慢调即兴'],
 ['after','himari','上原绯玛丽','bass','Ba.','#e491ad','wave','跃动低音'],
 ['after','tomoe','宇田川巴','drums','Dr.','#a94e58','long','赤色节拍'],
 ['after','tsugumi','羽泽鸫','keys','Key.','#916844','bob','日常的温度'],
 ['pastel','aya','丸山彩','mic','Vo.','#ef9fbb','twins','彩色聚光灯'],
 ['pastel','hina','冰川日菜','guitar','Gt.','#86ccc5','bob','噜♪的灵感'],
 ['pastel','chisato','白鹭千圣','bass','Ba.','#e7d397','long','白鹭弦语'],
 ['pastel','maya','大和麻弥','drums','Dr.','#727861','glasses','器材专家'],
 ['pastel','eve','若宫伊芙','keys','Key.','#d6cfe6','long','武士道和声'],
 ['rose','yukina','凑友希那','mic','Vo.','#b8b4cf','long','冰蓝咏叹'],
 ['rose','sayo','冰川纱夜','guitar','Gt.','#79b9b9','long','精准弧光'],
 ['rose','lisa','今井莉莎','bass','Ba.','#ba7661','wave','温柔支点'],
 ['rose','ako','宇田川亚子','drums','Dr.','#a97ec7','twins','暗黑狂想'],
 ['rose','rinko','白金燐子','keys','Key.','#363447','long','静谧琴语'],
 ['hello','kokoro','弦卷心','mic','Vo.','#f2d680','wave','世界的微笑'],
 ['hello','kaoru','濑田薰','guitar','Gt.','#a18ac1','long','儚い独奏'],
 ['hello','hagumi','北泽育美','bass','Ba.','#df9a61','bob','活力全开'],
 ['hello','kanon','松原花音','drums','Dr.','#9acadd','wave','海月节拍'],
 ['hello','misaki','奥泽美咲','dj','DJ','#554744','bear','米歇尔派对'],
 ['mor','mashiro','仓田真白','mic','Vo.','#8aa9cf','bob','透明之歌'],
 ['mor','toko','桐谷透子','guitar','Gt.','#c882a9','long','闪光话题'],
 ['mor','nanami','广町七深','bass','Ba.','#c4bad6','twins','藏起的天才'],
 ['mor','tsukushi','二叶筑紫','drums','Dr.','#a76b59','pony','小小领队'],
 ['mor','rui','八潮瑠唯','violin','Vn.','#3c4d66','long','理性的蝶翼'],
 ['ras','layer','和奏瑞依','bass','Ba. & Vo.','#34313e','long','LAYER 重低音'],
 ['ras','lock','朝日六花','guitar','Gt.','#776353','glasses','LOCK 全力拨弦'],
 ['ras','masking','佐藤益木','drums','Dr.','#d5be79','long','MASKING 狂鼓'],
 ['ras','pareo','鳰原令王那','keys','Key.','#f0accc','twins','PAREO 彩虹键'],
 ['ras','chu2','珠手知由','dj','DJ','#e7cc8c','twins','CHU² DROP'],
 ['mygo','tomori','高松灯','mic','Vo.','#938c82','bob','诗歌与星石'],
 ['mygo','anon','千早爱音','guitar','Gt.','#e9acbc','long','闪亮第一步'],
 ['mygo','rana','要乐奈','guitar','Gt.','#dce6df','cat','猫步即兴'],
 ['mygo','soyo','长崎素世','bass','Ba.','#c9a17d','wave','柔弦共鸣'],
 ['mygo','taki','椎名立希','drums','Dr.','#45404f','short','真挚鼓动'],
 ['ave','uika','三角初华','guitar','Gt. & Vo.','#e4cb8f','long','Doloris 月光'],
 ['ave','mutsumi','若叶睦','guitar','Gt.','#a5bda0','bob','Mortis 静默'],
 ['ave','umiri','八幡海铃','bass','Ba.','#51607d','bob','Timoris 深潮'],
 ['ave','nyamu','祐天寺若麦','drums','Dr.','#ad91bd','bob','Amoris 脉动'],
 ['ave','sakiko','丰川祥子','keys','Key.','#8fbcd3','twins','Oblivion 终章'],
 ['mew','arale','仲町あられ','mic','Vo.','#ecb8a2','wave','梦与现实'],
 ['mew','nonoka','宮永ののか','guitar','Gt.','#e3c99c','twins','跃迁音符'],
 ['mew','ritsu','峰月律','guitar','Gt.','#646d86','short','月面独奏'],
 ['mew','miyako','藤都子','keys','Key.','#ad9bc3','long','绘梦和弦'],
 ['mew','yuno','千石ユノ','dj','DJ & Mp.','#84c7c4','twins','宇宙采样'],
 ['mills','hotaru','汐見蛍','keys','Key. & Vo.','#c7b1d1','long','天使旋律'],
 ['mills','natsume','伊沢なつめ','guitar','Gt.','#874952','pony','炽热弦光'],
 ['mills','nagi','琴平凪','guitar','Gt.','#a9bdc6','bob','无风之音'],
 ['mills','mahoro','浜崎まほろ','bass','Ba.','#d5af8f','wave','幸福低音'],
 ['mills','tomoka','和泉朋花','drums','Dr.','#71778b','short','祝福节拍'],
 ['ikka','raika','須賀蕾叶','guitar','Gt. & Vo.','#cb8662','pony','家族开场'],
 ['ikka','miku','馬橋心玖','guitar','Gt. & Vo.','#8b677c','long','轮唱之约'],
 ['ikka','yomogi','矢倉蓬咲','bass','Ba.','#8d9c68','wave','律动根音'],
 ['ikka','chieri','梅里ちえり','drums','Dr.','#d59b9b','twins','欢聚鼓点'],
 ['ikka','shizuku','四宮寧月','keys','Key.','#8fabb4','long','月之琴键'],
 ['glitter','yuri','牛込百合','guitar','Gt. & Vo.','#98716a','long','青绿回声'],
 ['glitter','rii','鹈泽莉','bass','Ba.','#b1a183','short','青绿低音'],
 ['glitter','hinako','二十骑日菜子','drums','Dr.','#d89c71','twins','青绿节拍'],
 ['glitter','nana','鳄部七菜','keys','Key.','#796173','glasses','青绿和弦'],
 ['chispa','natsuki','海野夏希','guitar','Gt. & Vo.','#bd7864','pony','再相逢'],
 ['chispa','fumika','森文华','bass','Ba.','#6f6c78','long','青春低音'],
 ['chispa','mayu','川端真结','keys','Key.','#45414c','twins','校园和弦'],
 ['chispa','satomi','大湖里实','drums','Dr.','#8b6572','short','起点鼓声'],
 ['sumimi','mana','纯田真奈','mic','Vo.','#e9bb9a','twins','甜甜双星']
];
const roles={guitar:['吉他','solo'],bass:['贝斯','steady'],drums:['鼓','tempo'],keys:['键盘','ensemble'],violin:['小提琴','precision'],dj:['DJ 设备','encore'],mic:['麦克风','fans']};
const chars=raw.map(([band,id,name,type,role,hair,style,skill],i)=>({id,name,band,type,role,hair,style,skill,index:i,eyes:['#7898c5','#b780bf','#87b89c','#bd8d62'][i%4],passive:['演出收入 +3%','热度产出 +3%','技能冷却 -3%','安可收益 +3%','精准演奏 +3%'][i%5],passiveKey:['income','heat','speed','encore','precision'][i%5]}));
const bandMembers=id=>id==='crychic'?['tomori','mutsumi','soyo','taki','sakiko']:id==='sumimi'?['uika','mana']:chars.filter(c=>c.band===id).map(c=>c.id);
const venues=[
 ['street','星灯街角','街头演出',0,1200,38,75,8,'income','guitar','#e8ac7a'],
 ['school','花咲川文化祭','校园舞台',80,1850,40,110,12,'fans','mic','#f0a3bd'],
 ['circle','CiRCLE 专场','Live House',260,2800,42,160,18,'ensemble','keys','#72ceb9'],
 ['ring','RiNG 夜场','Live House',650,4100,44,230,25,'solo','guitar','#80b9f3'],
 ['space','SPACE 回响','乐队挑战',1400,5900,46,330,36,'steady','bass','#bb97e2'],
 ['dub','dub 地下舞台','乐队挑战',2800,8400,48,460,50,'tempo','drums','#e575a0'],
 ['festival','星空音乐节','音乐节',5500,11800,50,650,70,'encore','dj','#edcb72'],
 ['arena','银河大舞台','全国巡演',10500,16500,52,950,100,'precision','violin','#9dc6f4']
].map(([id,name,kind,fame,target,duration,coins,rep,preference,drop,color],i)=>({id,name,kind,fame,target,duration,coins,rep,preference,drop,color,index:i}));
const qualities=[['普通','#a0abc1'],['精良','#75d7b5'],['稀有','#7eb7ff'],['史诗','#c492fa'],['传说','#ffd17a']];
const affixes=[
 ['solo','即兴触发','即兴热度提升'],['heat','渐入佳境','持续热度提升'],['ensemble','舞台磁场','合奏热度提升'],['crit','精准弧光','精准触发概率提升'],['income','人气周边','演出收入提升'],['speed','节拍加速','技能冷却缩短'],['encore','返场回声','安可收益提升']
].map(([id,name,desc])=>({id,name,desc}));
const inspirations=[
 {id:'chorus',name:'全场大合唱',text:'合奏热度 +35%',key:'ensemble',value:.35,icon:'mic'},
 {id:'improv',name:'即兴之夜',text:'独奏热度 +50% · 基础热度 -8%',key:'solo',value:.5,icon:'guitar'},
 {id:'duet',name:'双人聚光灯',text:'前两名成员技能热度 +45%',key:'duet',value:.45,icon:'star'},
 {id:'encore',name:'返场狂热',text:'安可收益 +60% · 普通收入 -10%',key:'encore',value:.6,icon:'ticket'},
 {id:'rhythm',name:'电流节拍',text:'技能冷却缩短 18%',key:'speed',value:.18,icon:'drums'},
 {id:'merch',name:'人气售卖处',text:'本局演出收入 +40%',key:'income',value:.4,icon:'coin'},
 {id:'focus',name:'静心调音',text:'精准概率 +20%',key:'crit',value:.2,icon:'keys'},
 {id:'gear',name:'后台宝箱',text:'本局额外乐器掉落概率 +45%',key:'drop',value:.45,icon:'case'},
 {id:'steady',name:'稳定合奏',text:'基础热度 +22%',key:'heat',value:.22,icon:'note'}
];
const supports=[{id:'marina',name:'月岛麻里奈',role:'演出接待',text:'演出收入 +8%',key:'income',fame:180},{id:'asuka',name:'户山明日香',role:'演出助理',text:'每场演出金币额外 +100',key:'tip',fame:500},{id:'owner',name:'都筑诗船',role:'舞台指导',text:'热度产出 +8%',key:'heat',fame:1200},{id:'rira',name:'乐奈的特别茶点',role:'后台补给',text:'技能冷却缩短 6%',key:'speed',fame:2200}];
const recruitment=Object.freeze({coinCost:300,duplicatePoints:10,skillStep:10,maxSkill:10,skinPerPoint:1,legacyInviteCoins:100});
const api={recruitment,bands,chars,roles,venues,qualities,affixes,inspirations,supports,bandMembers,byChar:Object.fromEntries(chars.map(c=>[c.id,c])),byBand:Object.fromEntries(bands.map(b=>[b.id,b]))};
if(typeof module!=='undefined')module.exports=api;else root.GameData=api;
})(typeof window==='undefined'?globalThis:window);
