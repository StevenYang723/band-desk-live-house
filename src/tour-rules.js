(function(root){
'use strict';
const RH=typeof module!=='undefined'?require('./rhythm-core.js'):root.RhythmRules;
const stamina={max:120,entry:20,miss:1,recoveryMs:120000};
const places={live:{name:'街角演出',icon:'mic',color:'#8fcdbd'},elite:{name:'挑战舞台',icon:'star',color:'#d58eaa'},boss:{name:'终场 Live',icon:'crown',color:'#e7bb75'},rest:{name:'休息站',icon:'cup',color:'#99cbb3'},shop:{name:'周边商店',icon:'shop',color:'#e3bf87'},workshop:{name:'乐器工坊',icon:'tool',color:'#a7bed7'},event:{name:'旅途事件',icon:'event',color:'#bea9d5'},chest:{name:'应援礼物',icon:'gift',color:'#dfacbd'}};
const relics=[
 {id:'soft',name:'柔光节拍',text:'所有判定窗口扩大 40 ms。',max:2,icon:'note'},
 {id:'preview',name:'从容呼吸',text:'光圈提前 0.4 秒出现，更早看到下一拍。',max:2,icon:'eye'},
 {id:'ear',name:'返听校准',text:'PERFECT 判定额外扩大 40 ms。',max:2,icon:'headset'},
 {id:'shield',name:'后台照应',text:'每场前 2 次 MISS 不消耗体力，仍计入准确率。',max:2,icon:'shield'},
 {id:'recovery',name:'谢幕补给',text:'每场演出结束恢复 5 点体力。',max:2,icon:'cup'},
 {id:'income',name:'周边热卖',text:'本轮演出金币收益增加 20%。',max:3,icon:'coin'},
 {id:'power',name:'暖场合奏',text:'本轮演出基础演奏力增加 15%。',max:3,icon:'guitar'},
 {id:'perfect',name:'心意相通',text:'每场结算时，每 10 个 PERFECT 恢复 2 点体力。',max:2,icon:'heart'}
];
const getRelic=id=>relics.find(r=>r.id===id);
function effects(ids=[]){const count=id=>ids.filter(x=>x===id).length,wide=count('soft')*.04;return {perfect:Math.min(.30,.14+wide+count('ear')*.04),great:Math.min(.42,.26+wide+count('ear')*.02),good:Math.min(.56,.40+wide),preview:1.5+count('preview')*.4,shield:count('shield')*2,heal:count('recovery')*5,income:count('income')*.2,power:count('power')*.15,perfectHeal:count('perfect')*2};}
function random(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function map(seed){const rand=random(seed),rows=[['live','live','live'],['event','live','chest'],['live','elite','live'],['rest','shop','workshop'],['live','event','elite'],['rest','chest','workshop'],['elite','live','event'],['shop','rest','workshop'],['live','elite','event'],['rest','chest','shop'],['elite','live','elite']];const nodes=[];
 rows.forEach((types,row)=>{types=[...types];for(let i=2;i>0;i--){const j=Math.floor(rand()*(i+1));[types[i],types[j]]=[types[j],types[i]];}types.forEach((type,col)=>nodes.push({id:row+'-'+col,row,col,type,song:RH.songs[Math.floor(rand()*RH.songs.length)].id,links:row===10?['11-1']:[0,1,2].filter(c=>Math.abs(c-col)<=1).map(c=>(row+1)+'-'+c)}));});nodes.push({id:'11-1',row:11,col:1,type:'boss',song:'midnight',links:[]});return nodes;
}
function available(expedition){const nodes=map(expedition.seed);if(expedition.status!=='map')return [];const last=nodes.find(n=>n.id===expedition.path.at(-1));return nodes.filter(n=>last?last.links.includes(n.id):n.row===0);}
function chart(songId,kind='live',seed=1){const song=RH.getSong(songId);if(!song)throw Error('Unknown tour song');const beat=60/song.bpm,lead=beat*4,notes=[],rand=random(seed),dense=kind==='elite'||kind==='boss';let last=-1;
 for(let b=0;b<song.bars*4;b++){if(!dense&&b%2)continue;if(dense&&b%8===7)continue;let member=Math.floor(rand()*5);if(member===last)member=(member+1+Math.floor(rand()*4))%5;last=member;notes.push({id:notes.length,member,time:lead+b*beat});}
 return {song:songId,kind,seed,beat,lead,duration:(song.bars*4+8)*beat,notes};
}
const grades=['perfect','great','good','miss'],weights={perfect:1,great:.8,good:.5,miss:0};
class Session{
 constructor(song,kind,seed,relicIds=[],saved=null){Object.assign(this,chart(song,kind,seed));this.rules=effects(relicIds);this.notes=this.notes.map(n=>({...n,result:null}));this.elapsed=0;this.feedback=[];this.combo=0;this.maxCombo=0;this.counts={perfect:0,great:0,good:0,miss:0};if(saved){const valid=validate(saved,song,kind,seed);if(!valid)throw Error('Invalid saved performance');this.elapsed=valid.elapsed;this.notes.forEach((n,i)=>n.result=valid.results[i]);this.recount();}}
 recount(){this.counts={perfect:0,great:0,good:0,miss:0};this.combo=0;this.maxCombo=0;for(const n of this.notes){if(!n.result)continue;this.counts[n.result]++;this.combo=n.result==='miss'?0:this.combo+1;this.maxCombo=Math.max(this.maxCombo,this.combo);}}
 award(n,result){if(n.result)return false;n.result=result;this.recount();this.feedback.push({member:n.member,result,combo:this.combo});return true;}
 update(time){this.elapsed=Math.max(this.elapsed,Math.min(this.duration+.6,time));for(const n of this.notes)if(!n.result&&time>n.time+this.rules.good)this.award(n,'miss');}
 press(member,time){this.update(time);const n=this.notes.filter(n=>n.member===member&&!n.result&&Math.abs(n.time-time)<=this.rules.good).sort((a,b)=>Math.abs(a.time-time)-Math.abs(b.time-time))[0];if(!n)return false;const delta=Math.abs(n.time-time);return this.award(n,delta<=this.rules.perfect?'perfect':delta<=this.rules.great?'great':'good');}
 snapshot(){return {elapsed:this.elapsed,results:this.notes.map(n=>n.result)};}
 summary(){const judged=Object.values(this.counts).reduce((a,b)=>a+b,0),weighted=grades.reduce((n,g)=>n+this.counts[g]*weights[g],0);return {counts:{...this.counts},units:this.notes.length,accuracy:weighted/this.notes.length,liveAccuracy:judged?weighted/judged:1,score:Math.round(weighted/this.notes.length*1e6),combo:this.combo,maxCombo:this.maxCombo,fullCombo:judged===this.notes.length&&!this.counts.miss,allPerfect:this.counts.perfect===this.notes.length};}
}
function validate(raw,song,kind,seed){const c=chart(song,kind,seed);if(!raw||!Number.isFinite(raw.elapsed)||raw.elapsed<0||raw.elapsed>c.duration+.61||!Array.isArray(raw.results)||raw.results.length!==c.notes.length||raw.results.some(x=>x!==null&&!grades.includes(x)))return null;return {elapsed:raw.elapsed,results:[...raw.results]};}
const api={stamina,places,relics,getRelic,effects,random,map,available,chart,Session,validate};if(typeof module!=='undefined')module.exports=api;else root.TourRules=api;
})(typeof window==='undefined'?globalThis:window);
