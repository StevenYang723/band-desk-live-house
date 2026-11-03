(function(root){
'use strict';
const assets=root.ArtAssets,images={},progress={loaded:0,total:Object.keys(assets.characters).length,failed:[],loading:false,revision:0};
let loaded=false,batch=null;
const attempts={},wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function loadImage(id){return new Promise(resolve=>{
 const im=new Image(),attempt=attempts[id]=(attempts[id]||0)+1;
 let done=false;
 const finish=ok=>{if(done)return;done=true;clearTimeout(timeout);im.onload=im.onerror=null;if(ok){images[id]=im;progress.loaded++;progress.revision++;}else im.removeAttribute('src');resolve(ok);};
 const timeout=setTimeout(()=>finish(false),20000);
 im.onload=()=>finish(im.naturalWidth>0);im.onerror=()=>finish(false);
 // A failed response may be cached; retry only this asset with a fresh URL.
 const url=assets.characters[id].body;
 im.src=attempt===1?url:url+(url.includes('?')?'&':'?')+'retry='+attempt+'-'+Date.now();
});}
function loadBatch(ids){
 if(batch)return batch;
 if(!ids.length)return Promise.resolve();
 progress.loading=true;progress.failed=[];let next=0;
 async function worker(){while(next<ids.length){const id=ids[next++];if(images[id])continue;let ok=false;
  for(let attempt=0;attempt<3&&!ok;attempt++){if(attempt)await wait(750*attempt);ok=await loadImage(id);}
  if(!ok)progress.failed.push(id);
 }}
 batch=Promise.all(Array.from({length:Math.min(4,ids.length)},worker)).finally(()=>{progress.loading=false;batch=null;});
 return batch;
}
function retry(){return batch||loadBatch(Object.keys(assets.characters).filter(id=>!images[id]));}
const ready=retry().then(()=>{loaded=true;});
root.addEventListener?.('online',()=>{if(progress.failed.length)retry();});
const D=root.GameData,outline='#202338',skin='#f7d9c4',skinShade='#dfb6a4';
function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function pixline(g,x1,y1,x2,y2,c,w=1){const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));for(let i=0;i<=steps;i++)rect(g,x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps,w,w,c);}
function star(g,x,y,c,size=1){rect(g,x-1*size,y-4*size,2*size,8*size,c);rect(g,x-4*size,y-1*size,8*size,2*size,c);rect(g,x-2*size,y-2*size,4*size,4*size,c);}
function shade(hex,n){const a=hex.replace('#','');return '#'+[0,2,4].map(i=>Math.max(0,Math.min(255,parseInt(a.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');}
function instrument(g,type,x,y,color='#f589ac',scale=1,beat=0){g.save();g.translate(Math.round(x),Math.round(y));g.scale(scale,scale);const r=(x,y,w,h,c)=>rect(g,x,y,w,h,c);const l=(a,b,c,d,e,f=1)=>pixline(g,a,b,c,d,e,f);
 if(type==='guitar'||type==='bass'){r(1,14,3,7,outline);r(4,11,9,13,outline);r(0,17,15,5,outline);r(2,15,11,7,color);r(5,12,7,12,color);r(3,16,6,3,shade(color,35));l(10,16,23,3,outline,4);l(11,16,24,3,'#ba945e',2);l(11,16,24,3,'#ead2a8');r(23,0,4,5,outline);r(24,1,2,4,color);r(7,17,3,3,'#f8e3d2');r(9,19,2,2,outline);r(5,21,3,1,'#f8d3a1');if(type==='bass')r(3,15,1,8,'#9de3df');}
 else if(type==='drums'){r(3,8,21,15,outline);r(5,9,17,12,color);r(8,8,11,2,'#f9d4ca');r(9,13,8,8,'#e9dfd0');r(11,15,4,4,outline);r(1,5,9,5,'#e9dfd0');r(2,7,8,6,color);r(18,5,9,6,'#e9dfd0');r(18,8,8,5,color);r(-4,3,11,2,'#ffcf81');r(24,2,10,2,'#ffcf81');l(1,5,1,23,'#9b9cba');l(28,4,28,22,'#9b9cba');l(3,23,-1,26,'#747d97');l(27,22,31,25,'#747d97');}
 else if(type==='keys'||type==='dj'){r(-1,10,31,11,outline);r(0,11,29,8,type==='keys'?'#e9e8ec':'#5a596c');if(type==='keys'){for(let i=0;i<13;i++)r(i*2+1,14,1,5,'#8f91a7');for(let i=0;i<9;i++)r(i*3+1,12,2,4,outline);}else{for(const x of [5,20]){r(x-3,12,8,6,outline);r(x-1,13,4,4,'#a2b3ca');r(x,14,2,2,color);}r(13,12,2,6,color);}r(1,9,27,1,color);l(5,21,22,28,'#747d97',2);l(24,21,7,28,'#747d97',2);}
 else if(type==='violin'){r(4,10,7,12,outline);r(2,13,11,6,outline);r(4,11,7,10,'#ce8e59');r(5,15,5,2,outline);l(7,13,16,1,'#a76c48',2);l(0,9,22,21,'#ecd2a0');r(5,18,4,1,'#f0c68b');}
 else if(type==='mic'){r(11,2,6,6,outline);r(12,2,4,4,'#c1c9d8');r(13,6,2,5,color);r(13,11,1,14,'#9da5bd');r(7,25,13,2,outline);}
 else if(type==='monitor'){l(3,17,3,7,outline,3);l(3,7,10,2,outline,3);l(10,2,21,4,outline,3);l(21,4,24,18,outline,3);r(1,14,6,9,color);r(21,14,6,9,color);r(7,17,2,5,'#f8e8d1');r(19,17,2,5,'#f8e8d1');}
 else if(type==='pedal'){r(6,3,16,23,outline);r(8,5,12,18,color);r(10,7,3,3,outline);r(16,7,2,3,'#ffdd84');r(10,14,8,5,shade(color,-30));r(12,20,4,2,'#e6d7c2');}
 else if(type==='coin'){r(5,3,17,21,'#b57e40');r(3,6,21,15,'#eab762');r(6,5,15,17,'#fbd985');r(11,7,4,12,'#bc823e');r(9,10,8,2,'#bc823e');r(9,15,8,2,'#bc823e');}
 else if(type==='case'){r(2,7,25,18,outline);r(4,9,21,14,'#a97c5f');r(10,3,10,5,outline);r(12,5,6,3,'#f1c889');r(4,14,21,2,'#f1c889');r(13,13,4,5,'#f9dd93');}
 else if(type==='ticket'){r(2,6,24,16,'#d47b9a');r(4,8,20,12,'#f4b3c5');r(18,8,1,12,'#b96e91');star(g,11,14,'#fff0ce');}
 else if(type==='note'){r(9,3,3,17,color);r(12,3,11,3,color);r(21,4,3,16,color);r(4,18,8,5,color);r(16,18,8,5,color);}
 else star(g,14,14,color,2);
 g.restore();}
function character(g,id,x,y,scale=1,time=0,perform=false,portrait=false){const im=images[id];if(!im){g.save();rect(g,x+3,y+36,58,58,'#29384e');g.textAlign='center';g.fillStyle='#e4cfb4';g.font='9px PixelUI, sans-serif';g.fillText(D.byChar[id]?.name||'',x+32,y+61,54);g.font='8px PixelUI, sans-serif';g.fillText('立绘加载中',x+32,y+78,54);g.restore();return;}const bob=perform?Math.round(Math.sin(time*4+D.byChar[id].index)):0;const h=96*scale,w=im.width/im.height*h;g.save();g.imageSmoothingEnabled=false;g.drawImage(im,Math.round(x+32-w/2),Math.round(y+96-h+bob),w,h);g.restore();}
function iconCanvas(canvas,type,color){if(!canvas)return;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,canvas.width,canvas.height);g.save();g.scale(canvas.width/32,canvas.height/32);instrument(g,type,2,2,color||'#f3b2ca',.9);g.restore();}
function avatar(canvas,id){const g=canvas.getContext('2d'),c=D.byChar[id],im=images[id];g.imageSmoothingEnabled=false;g.clearRect(0,0,canvas.width,canvas.height);if(!c)return;g.fillStyle='#252f47';g.fillRect(0,0,canvas.width,canvas.height);g.fillStyle=D.byBand[c.band].color+'30';for(let y=0;y<canvas.height;y+=8)g.fillRect(0,y,canvas.width,1);if(im){const head=assets.characters[id].head||{x:12,y:0,w:40,h:40};g.drawImage(im,head.x,head.y,head.w,head.h,0,0,canvas.width,canvas.height);}}
function stage(canvas,engine,seconds,effects=[]){const g=canvas.getContext('2d'),s=engine.s,venue=D.venues[s.venue],w=360,h=260;g.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);g.imageSmoothingEnabled=false;g.clearRect(0,0,w,h);const r=(x,y,w,h,c)=>rect(g,x,y,w,h,c),t=seconds,accent=D.byBand[D.byChar[s.team[0]]?.band]?.color||'#72b9ed';
 r(0,0,w,h,'#15192e');r(0,0,360,105,s.venue<2?'#27334d':'#242139');
 if(s.venue<2||s.venue>=6){for(let i=0;i<37;i++){const x=(i*79+23)%360,y=(i*37+9)%90;r(x,y,i%4===0?2:1,1,(i%3===0&&Math.sin(t+i)>0)?'#fce6b6':'#6d83a8');}r(298,12,18,18,'#d9d8c0');r(293,9,17,17,'#27334d');for(let i=0;i<9;i++){let x=i*44,hh=18+(i*17)%36;r(x,102-hh,38,hh,'#191f38');for(let y=105-hh;y<99;y+=9)for(let xx=x+6;xx<x+34;xx+=9)r(xx,y,3,4,(i+xx)%3===0?'#d1ab80':'#4a5372');}}
 else{for(let y=5;y<122;y+=12){r(0,y,360,1,'#302c42');for(let x=(y%24?0:12);x<360;x+=24)r(x,y,1,12,'#302c42');}r(14,33,29,42,'#4d334c');r(17,36,23,35,'#dda2a5');r(20,40,17,2,'#623c5b');r(21,48,14,17,'#8b5b7b');r(320,28,25,36,'#2a3e51');r(323,31,19,30,'#88b7c1');}
 // Rig, moving lights, layered curtains, LED wall and wooden riser.
 r(9,5,6,175,'#14182a');r(345,5,6,175,'#14182a');r(9,8,342,6,'#747482');r(9,10,342,2,'#25263c');for(let x=20;x<348;x+=18){pixline(g,x,7,x+13,15,'#90909c');r(x,9,2,2,'#bab1b0');}
 for(const [i,x] of [45,110,245,310].entries()){const dest=180+Math.sin(t*.6+i)*150;g.fillStyle=(i%2?'#75c7dc':'#ed98cc')+'12';g.beginPath();g.moveTo(x-5,18);g.lineTo(dest-45,188);g.lineTo(dest+45,188);g.lineTo(x+5,18);g.fill();r(x-7,14,15,9,'#171b29');r(x-5,21,11,3,i%2?'#97e3dc':'#f7b2ca');}
 r(85,37,190,66,'#141625');r(89,41,182,58,'#31334d');r(92,44,176,52,'#202c43');for(let yy=48;yy<95;yy+=4)r(94,yy,172,1,'#2c3a54');g.textAlign='center';g.font='20px Pixel10, monospace';g.fillStyle='#d8bfe2';g.fillText(s.tour?'DREAM TOUR':D.byBand[D.byChar[s.team[0]]?.band]?.name||'LIVE HOUSE',180,66);g.font='8px Consolas, monospace';g.fillStyle='#89cfd2';g.fillText('B A N G   D R E A M',180,81);star(g,104,64,accent);star(g,255,64,accent);
 for(let x=101;x<260;x+=8){const bh=5+Math.abs(Math.sin(t*3+x))*8;r(x,93-bh,4,bh,shade(accent,-50));}
 r(18,131,324,73,'#51435a');r(20,134,320,64,'#554657');for(let y=141;y<201;y+=12){r(20,y,320,1,'#746075');for(let x=(y%24?20:45);x<340;x+=52)r(x,y-11,1,11,'#675367');}r(15,199,330,6,'#b48c8c');r(19,205,322,5,'#725368');r(25,210,310,6,'#382e43');for(let x=29;x<335;x+=12)r(x,202,6,2,x%24?accent:'#d4bc83');
 // Loudspeaker stacks and amp cables.
 for(const x of [22,309]){r(x,88,29,82,'#101525');r(x+2,90,25,76,'#343247');for(const yy of [102,140]){r(x+5,yy-7,19,20,'#151a2b');r(x+8,yy-4,13,14,'#292b3e');r(x+12,yy,5,5,'#111523');}r(x+4,92,3,2,'#e5bd87');}pixline(g,66,193,51,199,'#1b1b2d');pixline(g,51,199,122,199,'#1b1b2d');
 const team=s.started?s.team:D.bandMembers('mygo'),positions=team.length===2?[[110,109],[210,109]]:[[148,113],[34,99],[262,99],[206,65],[92,65]];
 const order=team.map((id,i)=>({id,i,pos:positions[i]||[180,130]})).sort((a,b)=>a.pos[1]-b.pos[1]);
 for(const {id,i,pos:[x,y]}of order){g.globalAlpha=.3;r(x+9,y+95,47,4,'#101423');g.globalAlpha=1;const active=effects.some(e=>e.type==='skill'&&e.index===i&&e.life>0);if(active){g.fillStyle=accent+'30';g.fillRect(x+3,y+5,58,88);star(g,x+2,y+10,'#ffe4a9');}character(g,id,x,y,i<3?1.30:1.15,t,!s.paused&&!s.tour?.choices);}
 r(0,225,360,35,'#121526');for(let row=0;row<2;row++)for(let i=0;i<19;i++){const x=i*21+row*9,y=219+row*17+Math.sin(t*3+i)*2;r(x-4,y,9,9,'#282a41');r(x-7,y+8,15,16,'#25273b');const dx=Math.sin(t*4+i)*4;pixline(g,x+7,y+3,x+10+dx,y-12,'#7f627f',2);rect(g,x+9+dx,y-16,2,6,[accent,'#7edbd5','#f5d68c'][i%3]);}
 for(const e of effects){if(e.life<=0)continue;if(e.type==='skill'){const pos=positions[e.index];if(!pos)continue;g.textAlign='center';g.font='bold 8px Microsoft YaHei';g.fillStyle=e.crit?'#fff1b1':'#b6f0e8';g.fillText(e.crit?'PERFECT':'♪',pos[0]+32,Math.max(26,pos[1]-(e.index<3?32:19)-(1-e.life/2)*12));}if(e.type==='encore'){g.font='bold 25px Consolas';g.textAlign='center';g.fillStyle='#211d37';g.fillText('ENCORE!',182,124);g.fillStyle='#f9dc94';g.fillText('ENCORE!',180,122);for(let i=0;i<15;i++){r((i*37+t*18)%360,50+((i*27+t*23)%130),2,3,[accent,'#b2e6df','#f9dc94'][i%3]);}}}
 if(s.paused){g.fillStyle='#181b32aa';g.fillRect(0,0,w,h);g.textAlign='center';g.font='bold 16px Microsoft YaHei';g.fillStyle='#f7e2c6';g.fillText('演出暂停',180,127);}
}
function rhythmStage(canvas,engine,t,effects=[]){
 const g=canvas.getContext('2d'),s=engine.s,w=360,h=80,team=s.team,accent=D.byBand[D.byChar[team[0]]?.band]?.color||'#8bd2ce';g.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);g.imageSmoothingEnabled=false;g.fillStyle='#192438';g.fillRect(0,0,w,h);
 for(let x=0;x<w;x+=12){g.fillStyle=x%24?'#233147':'#28354c';g.fillRect(x,0,12,63);}g.fillStyle='#70596d';g.fillRect(0,65,w,13);g.fillStyle='#b39098';g.fillRect(0,65,w,2);
 team.forEach((id,i)=>{const center=w*(i+.5)/team.length,active=effects.some(e=>e.type==='skill'&&e.index===i);g.fillStyle=accent+(active?'40':'15');g.beginPath();g.moveTo(center-5,0);g.lineTo(center-30,65);g.lineTo(center+30,65);g.lineTo(center+5,0);g.fill();character(g,id,center-32,-24,.65,t,true);g.fillStyle=active?'#fff0b9':accent;g.fillRect(center-13,74,26,2);});
 if(effects.some(e=>e.type==='encore')){g.fillStyle='#ffe3ae';for(let i=0;i<18;i++)g.fillRect((i*43+t*40)%w,(i*23+t*30)%h,2,3);}
}
root.PixelArt={ready,progress,retry,source:id=>images[id]?.src||assets.characters[id].body,isReady:()=>loaded,character,avatar,iconCanvas,stage,rhythmStage,instrument,star};
})(window);
