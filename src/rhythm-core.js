(function(root){
'use strict';
const songs=[
 {id:'starlight',name:'星灯排练',subtitle:'轻快合成器 · 第一场 Live',bpm:108,bars:18,roots:[60,57,65,67],pattern:[0,4,7,4,12,7,4,2],lanes:[0,1,2,1,3,2,1,0],color:'#efacc1'},
 {id:'neon',name:'霓虹回声',subtitle:'电子律动 · 夜色里的节拍',bpm:120,bars:20,roots:[57,53,60,55],pattern:[0,3,7,10,7,3,12,7],lanes:[1,2,0,3,2,1,3,0],color:'#8bd2ce'},
 {id:'midnight',name:'午夜合奏',subtitle:'摇滚鼓点 · 最后一首安可',bpm:132,bars:22,roots:[62,58,65,60],pattern:[0,7,3,10,12,7,10,3],lanes:[0,2,1,3,0,3,2,1],color:'#c6b2ed'}
];
const getSong=id=>songs.find(s=>s.id===id),difficultyName=d=>d==='hard'?'困难':'普通';
function chart(id,difficulty='normal'){
 const song=getSong(id);if(!song||!['normal','hard'].includes(difficulty))throw Error('Unknown song or difficulty');
 const beat=60/song.bpm,lead=beat*4,notes=[],busy=[0,0,0,0],hard=difficulty==='hard';
 const add=(lane,time,length=0)=>{if(busy[lane]>time-.22)return false;notes.push({id:notes.length,lane,time,length,end:time+length});busy[lane]=time+length;return true;};
 for(let step=0;step<song.bars*8;step++){
  if(!hard&&step%2)continue;
  const bar=Math.floor(step/8),slot=step%8;if(slot===7&&bar%2===1)continue;
  const time=lead+step*beat/2,lane=song.lanes[(step+Math.floor(bar/4))%8];
  const length=slot===4&&bar%4===1?beat*(hard?1:1.5):0;
  add(lane,time,length);
  if(slot===0&&bar%4===(hard?2:3))add((lane+2)%4,time,0);
 }
 const duration=(song.bars*4+8)*beat;
 return {song,difficulty,beat,lead,duration,notes,units:notes.reduce((n,x)=>n+(x.length?2:1),0)};
}
const weights={perfect:1,great:.75,good:.4,miss:0};
function grade(delta){const n=Math.abs(delta);return n<=.045?'perfect':n<=.09?'great':n<=.15?'good':'miss';}
class Session{
 constructor(id,difficulty='normal'){
  Object.assign(this,chart(id,difficulty));this.notes=this.notes.map(n=>({...n,head:null,tail:null,held:false}));
  this.counts={perfect:0,great:0,good:0,miss:0};this.combo=0;this.maxCombo=0;this.judged=0;this.energy=0;this.encores=0;this.feedback=[];this.time=0;
 }
 award(note,part,result){if(note[part]!==null)return;note[part]=result;this.counts[result]++;this.judged++;if(result==='miss')this.combo=0;else{this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);this.energy=Math.min(100,this.energy+250/this.units*weights[result]);}this.feedback.push({lane:note.lane,result,combo:this.combo,time:this.time});}
 update(time){this.time=time;for(const n of this.notes){if(n.head===null&&time>n.time+.15){this.award(n,'head','miss');if(n.length)this.award(n,'tail','miss');}if(n.length&&n.head!==null&&n.head!=='miss'&&n.tail===null&&time>=n.end){this.award(n,'tail',n.held?'perfect':'miss');n.held=false;}}}
 press(lane,time){this.update(time);if(!Number.isInteger(lane)||lane<0||lane>3)return false;const holding=this.notes.find(n=>n.lane===lane&&n.length&&n.head&&n.head!=='miss'&&n.tail===null);if(holding){holding.held=true;return false;}
  const n=this.notes.filter(n=>n.lane===lane&&n.head===null&&Math.abs(time-n.time)<=.15).sort((a,b)=>Math.abs(time-a.time)-Math.abs(time-b.time))[0];if(!n)return false;
  this.award(n,'head',grade(time-n.time));if(n.length)n.held=true;return true;
 }
 release(lane,time){this.update(time);for(const n of this.notes)if(n.lane===lane&&n.held&&n.tail===null){n.held=false;this.award(n,'tail',time<n.end-.15?'miss':grade(time-n.end));}}
 encore(){if(this.energy<100)return false;this.energy-=100;this.encores++;return true;}
 summary(){const accuracy=(this.counts.perfect+this.counts.great*.75+this.counts.good*.4)/this.units;return {song:this.song.id,difficulty:this.difficulty,units:this.units,counts:{...this.counts},accuracy,score:Math.round(accuracy*1000000),maxCombo:this.maxCombo,fullCombo:this.judged===this.units&&this.counts.miss===0,allPerfect:this.counts.perfect===this.units,encores:this.encores};}
}
function validate(raw,id,difficulty){
 const c=chart(id,difficulty);if(!raw||raw.song!==id||raw.difficulty!==difficulty||raw.units!==c.units)return null;
 const counts={};for(const key of Object.keys(weights)){const n=raw.counts?.[key];if(!Number.isInteger(n)||n<0||n>c.units)return null;counts[key]=n;}
 if(Object.values(counts).reduce((a,b)=>a+b,0)!==c.units||!Number.isInteger(raw.maxCombo)||raw.maxCombo<0||raw.maxCombo>c.units-counts.miss)return null;
 const accuracy=(counts.perfect+counts.great*.75+counts.good*.4)/c.units,encores=Math.max(0,Math.min(2,Math.floor(Number(raw.encores)||0),Math.floor(accuracy*2.5+1e-8)));
 return {song:id,difficulty,units:c.units,counts,accuracy,score:Math.round(accuracy*1000000),maxCombo:raw.maxCombo,encores,fullCombo:counts.miss===0,allPerfect:counts.perfect===c.units,bonusRate:Math.min(.3,accuracy*.25+encores*.025)};
}
const api={songs,getSong,difficultyName,chart,grade,Session,validate};if(typeof module!=='undefined')module.exports=api;else root.RhythmRules=api;
})(typeof window!=='undefined'?window:globalThis);
