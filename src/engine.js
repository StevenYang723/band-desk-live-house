(function(root){
'use strict';
const D=typeof module!=='undefined'?require('./data.js'):root.GameData;
const copy=o=>JSON.parse(JSON.stringify(o));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const integer=(x,a,b,def=a)=>Number.isFinite(x)?Math.floor(clamp(x,a,b)):def;
const R=D.recruitment;
const RH=typeof module!=='undefined'?require('./rhythm-core.js'):root.RhythmRules;
const TR=typeof module!=='undefined'?require('./tour-rules.js'):root.TourRules;
const TE=typeof module!=='undefined'?require('./tour-engine.js'):root.TourEngine;
const DAY=86400000,DAY_OFFSET=8*3600000;
const dayKey=ms=>String(Math.floor((ms+DAY_OFFSET)/DAY));
const ratingFor=ratio=>ratio>=1.8?'SS':ratio>=1.25?'S':ratio>=.90?'A':ratio>=.55?'B':'C';
const rewardFactor={C:.65,B:1,A:1.35,S:1.8,SS:2.5};
const qualityOdds={C:[.30,.65,.89,.985],B:[.24,.59,.86,.98],A:[.15,.45,.78,.96],S:[.08,.30,.65,.92],SS:[.03,.15,.47,.86]};
const newMember=()=>({bond:0,skill:1,skillPoints:0,gear:{},enhance:{main:0,acc1:0,acc2:0}});
const defaults=()=>({schemaVersion:4,appId:'band-desk',savedAt:Date.now(),started:false,coins:300,fame:0,parts:0,skinTokens:0,recruitCount:0,recruitHistory:[],time:0,shows:0,venue:0,rank:0,train:1,facility:0,offlineLevel:0,offlineUsage:{},offlineClaimedAt:0,pendingResult:null,settlementRemaining:0,auto:true,paused:false,sound:false,team:[],owned:[],members:{},items:[],serial:0,progress:0,heat:0,cooldowns:[],skillCounts:{},encoreCD:0,encoreCount:0,focusType:'all',wish:'tomori',pity:0,preset:'steady',autoSalvage:true,autoPush:false,best:{},lastResults:[],totalCoins:0,tour:null,tourClears:0,collections:[],support:null,sideTeam:[],sideProgress:0,sideShows:0,slot:0,loadouts:{},reroll:null,events:[],rhythmSettings:{song:'starlight',difficulty:'normal',offset:0,volume:.65},rhythmRecords:{},rhythmRun:null,stamina:{value:120,at:Date.now()},expedition:null,tourScreen:false,rng:(Date.now()>>>0)||65719});
class Engine{
 constructor(){this.s=defaults();this.fx=[];this.revision=0;this.offline=null;this.teamCache=null;}
 rand(){let x=this.s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.s.rng=x>>>0;return this.s.rng/4294967296;}
 pick(xs){return xs[Math.floor(this.rand()*xs.length)];}
 touch(){this.revision++;this.teamCache=null;}
 note(text,kind='info'){this.s.events.unshift({text,kind,time:this.s.time});this.s.events=this.s.events.slice(0,24);this.fx.push({type:'notice',text,kind});}
 start(band){if(this.s.started||!D.byBand[band]?.main)return false;this.s.started=true;this.s.team=D.bandMembers(band);for(const id of this.s.team){this.s.owned.push(id);this.s.members[id]=newMember();const it=this.makeItem(0,D.byChar[id].type,1);this.s.items.push(it);this.s.members[id].gear.main=it.id;}
 this.s.wish=D.chars.find(c=>!this.s.owned.includes(c.id)).id;this.resetShow();this.note('开演！'+D.byBand[band].name+' 已加入事务所','rare');this.touch();return true;}
 makeItem(tier=this.s.venue,type=null,quality=null,bound=null){
  const r=this.rand();quality=quality??(r<.30?0:r<.65?1:r<.89?2:r<.985?3:4);
  let slot='main';if(!type){if(this.rand()<.22){type=this.pick(['monitor','pedal','charm']);slot='acc';}else type=this.s.focusType==='all'?this.pick(Object.keys(D.roles)):this.s.focusType;}
  if(['monitor','pedal','charm'].includes(type))slot='acc';
  const level=Math.max(1,1+tier*5+this.s.rank*3+Math.floor(this.rand()*5));
  const n=Math.min(4,quality);const keys=[...D.affixes].sort(()=>0);const aff=[];
  while(aff.length<n){const a=keys.splice(Math.floor(this.rand()*keys.length),1)[0];aff.push({key:a.id,value:Math.round((3+this.rand()*6+quality*2)*10)/10,locked:false});}
  const prefix=this.pick(['星屑','月光','琉璃','晨曦','暮色','回响','星轨','绯色']);
  const name=bound?D.byChar[bound].skill:prefix+'·'+(D.roles[type]?.[0]||{monitor:'耳返',pedal:'效果器',charm:'舞台徽章'}[type]);
  return {id:'eq'+(++this.s.serial),type,slot,level,quality,base:Math.round((10+level*3)*(1+quality*.24)*(slot==='acc'?.45:1)),aff,bound,name,locked:!!bound};
 }
 item(id){return this.s.items.find(i=>i.id===id);}
 used(id){return Object.values(this.s.members).some(m=>Object.values(m.gear).includes(id));}
 itemPower(it,enhance=0,charId=''){return it?Math.round(it.base*(1+enhance*.08)*(it.bound===charId?1.25:1)):0;}
 memberStats(id){const c=D.byChar[id],m=this.s.members[id];if(!c||!m)return null;let power=28+this.s.train*4+Math.floor(m.bond/25)*2+m.skill*2;const mods={};let affinity=0;
  for(const slot of ['main','acc1','acc2']){const it=this.item(m.gear[slot]);if(!it)continue;power+=this.itemPower(it,m.enhance[slot],id);for(const a of it.aff)mods[a.key]=(mods[a.key]||0)+a.value/100;if(it.bound===id){affinity++;mods[D.roles[c.type][1]]=(mods[D.roles[c.type][1]]||0)+.18;}}
  mods[c.passiveKey]=(mods[c.passiveKey]||0)+.03;return {power,mods,affinity,skill:m.skill};}
 stats(team=this.s.team){if(team===this.s.team&&this.teamCache)return this.teamCache;const mods={heat:0,solo:0,ensemble:0,income:0,speed:0,encore:0,crit:.05,precision:0,drop:0,duet:0,fans:0,steady:0,tempo:0};let power=0;const counts={};const mem=[];
  for(const id of team){const c=D.byChar[id],m=this.memberStats(id);if(!c||!m)continue;mem.push(m);power+=m.power;counts[c.band]=(counts[c.band]||0)+1;for(const[k,v]of Object.entries(m.mods))mods[k]=(mods[k]||0)+v;}
  const full=[];for(const[b,n]of Object.entries(counts)){if(n>=3){mods.heat+=n>=5?.25:.12;if(n>=5)full.push(b);}}
  for(const b of ['glitter','chispa','sumimi','crychic'])if(D.bandMembers(b).every(id=>team.includes(id))){if(!full.includes(b)){full.push(b);mods.heat+=.25;}}
  for(const b of full){switch(D.byBand[b].effect){case'encore':mods.encore+=.25;break;case'steady':mods.steady+=.3;break;case'income':mods.income+=.20;break;case'precision':mods.crit+=.15;mods.precision+=.15;break;case'fans':mods.fans+=.4;break;case'harmony':mods.ensemble+=.3;break;case'speed':mods.speed+=.15;break;case'resonance':mods.ensemble+=.25;break;case'finale':mods.finale=.65;break;case'inspire':mods.solo+=.22;mods.crit+=.08;break;case'melody':mods.ensemble+=.2;mods.heat+=.08;break;case'relay':mods.solo+=.2;mods.speed+=.08;}}
  if(this.s.support==='marina')mods.income+=.08;if(this.s.support==='owner')mods.heat+=.08;if(this.s.support==='rira')mods.speed+=.06;
  if(this.s.tour&&team===this.s.team)for(const id of this.s.tour.buffs){const b=D.inspirations.find(x=>x.id===id);if(b)mods[b.key]=(mods[b.key]||0)+b.value;if(id==='improv')mods.heat-=.08;if(id==='encore')mods.income-=.1;}
  power=Math.round(power*(1+this.s.facility*.06));const result={power,mods,full,mem};if(team===this.s.team)this.teamCache=result;return result;
 }
 target(){const v=D.venues[this.s.venue];return Math.round(v.target*(1+this.s.rank*.55)*(this.s.tour?1+this.s.tour.node*.035:1));}
 duration(){return D.venues[this.s.venue].duration;}
 rating(){return ratingFor(this.s.heat/this.target());}
 rewardQuality(rating){const r=this.rand(),q=qualityOdds[rating]||qualityOdds.C;const i=q.findIndex(limit=>r<limit);return i<0?4:i;}
 continueShow(){if(!this.s.pendingResult)return false;this.s.pendingResult=null;this.s.settlementRemaining=0;this.touch();return true;}
 resetShow(){this.s.progress=0;this.s.heat=0;this.s.encoreCount=0;this.s.cooldowns=this.s.team.map((id,i)=>4+i*1.3);this.s.skillCounts={};this.touch();}
 skill(index,manual=false){const id=this.s.team[index],c=D.byChar[id];if(!c||this.s.cooldowns[index]>0||this.s.paused||this.s.pendingResult||!this.s.started||this.s.tourScreen)return false;const st=this.stats(),m=this.memberStats(id),key=D.roles[c.type][1];const crit=this.rand()<Math.min(.65,st.mods.crit+st.mods.precision*.3);const prefer=D.venues[this.s.venue].preference===key?1.18:1;
  let add=m.power*.42*(1+m.skill*.08)*(1+(st.mods[key]||0))*prefer*(crit?1.65:1)*(manual?1.12:1)*(index<2?1+(st.mods.duet||0):1);
  this.s.heat+=add;this.s.cooldowns[index]=Math.max(5,(12+c.index%4)*(1-Math.min(.55,st.mods.speed)));this.s.skillCounts[id]=(this.s.skillCounts[id]||0)+1;
  if(m.affinity&&this.s.skillCounts[id]%3===0){this.s.heat+=m.power*.55;this.fx.push({type:'skill',index,text:'适配合奏',crit:true});}else this.fx.push({type:'skill',index,text:(crit?'PERFECT · ':'')+c.skill,crit});return true;
 }
 encore(manual=false){if(this.s.tourScreen||!this.s.started||this.s.paused||this.s.pendingResult||this.s.encoreCD>0)return false;const st=this.stats();this.s.heat+=st.power*.32*(1+st.mods.encore)*(manual?1.12:1);this.s.encoreCD=20;this.s.encoreCount++;this.fx.push({type:'encore',text:'ENCORE!'});return true;}
 tick(dt){if(!this.s.started||this.s.paused||this.s.rhythmRun||this.s.tourScreen)return;
  if(this.s.pendingResult){if(this.s.auto&&!this.s.pendingResult.rhythm){this.s.settlementRemaining=Math.max(0,this.s.settlementRemaining-dt);if(this.s.settlementRemaining<=0)this.continueShow();}return;}
  this.s.time+=dt;const st=this.stats(),v=D.venues[this.s.venue];this.s.progress+=dt;
  let late=(st.mods.finale&&this.s.progress>v.duration*.7)?st.mods.finale:0;
  const steady=st.mods.steady*(this.s.progress/v.duration);this.s.heat+=dt*st.power*.020*(1+st.mods.heat+late+steady);
  this.s.encoreCD=Math.max(0,this.s.encoreCD-dt);this.s.cooldowns=this.s.cooldowns.map(c=>Math.max(0,c-dt));
  if(this.s.auto){for(let i=0;i<this.s.team.length;i++)if(this.s.cooldowns[i]<=0)this.skill(i);if(this.s.encoreCD<=0&&this.s.progress>v.duration*.5)this.encore();}
  if(this.s.tour?.choices&&this.s.auto){this.s.tour.choiceTime+=dt;if(this.s.tour.choiceTime>=8)this.chooseInspiration(this.autoChoice());}
  if(this.s.tour?.routeChoices&&this.s.auto){this.s.tour.routeTime+=dt;if(this.s.tour.routeTime>=6)this.chooseRoute(this.s.preset==='money'?'market':this.s.preset==='gear'?'workshop':'stage');}
  if(this.s.sideTeam.length){this.s.sideProgress+=dt;if(this.s.sideProgress>=60){this.s.sideProgress-=60;const money=Math.round(this.stats(this.s.sideTeam).power*.18*(1+this.s.facility*.1));this.s.coins+=money;this.s.totalCoins+=money;this.s.sideShows++;}}
  if(this.s.progress>=v.duration)this.finish();
 }
 advance(seconds){let left=clamp(Number(seconds)||0,0,3600);while(left>0){const n=Math.min(.25,left);this.tick(n);left-=n;}this.s.coins=Math.min(this.s.coins,9e12);if(this.fx.length>60)this.fx=this.fx.slice(-60);}
 addItem(it){if(this.s.autoSalvage&&it.quality===0&&!it.bound&&this.s.items.length>=18){this.s.parts+=2+it.level;return false;}
  if(this.s.items.length>=350){const discard=this.s.items.filter(x=>!x.locked&&!x.bound&&!this.used(x.id)).sort((a,b)=>a.quality-b.quality||a.level-b.level)[0];if(discard)this.salvage(discard.id,true);else{this.s.parts+=Math.ceil(it.base/2);this.note('仓库已满，新掉落折算为零件，请整理仓库');return false;}}
  this.s.items.unshift(it);this.fx.push({type:'loot',item:it});return true;}
 finish(){const s=this.s;if(s.pendingResult)return;const stable=this.offlineCandidates()[0];if(stable)s.offlineRecord={venue:Number(stable[0]),...copy(stable[1])};const vi=s.venue,v=D.venues[vi],st=this.stats(),rating=this.rating(),heat=s.heat,target=this.target(),before={coins:s.coins,fame:s.fame,parts:s.parts};
  let coins=Math.round(v.coins*(1+s.rank*.25)*rewardFactor[rating]*(1+st.mods.income)*(1+s.encoreCount*.04*(1+st.mods.encore)));
  if(s.tour?.route==='market')coins=Math.round(coins*1.35);coins+=(s.support==='asuka'?100:0)+(this.rand()<st.mods.fans?100:0);const fame=Math.max(2,Math.round(v.rep*rewardFactor[rating]));s.coins+=coins;s.totalCoins+=coins;s.fame+=fame;s.shows++;
  for(const id of s.team)s.members[id].bond+=1;s.pity++;let bound=null,q=null,type=null;const drops=[];
  const award=it=>{const parts=s.parts,kept=this.addItem(it);drops.push({...copy(it),kept,parts:s.parts-parts});};
  if(s.pity>=20&&D.byChar[s.wish]){bound=s.wish;q=3;type=D.byChar[bound].type;s.pity=0;}
  else if(this.rand()<.035){bound=s.wish;q=3;type=D.byChar[bound]?.type;}
  else if(s.focusType==='all'&&this.rand()<.55)type=v.drop;
  const it=this.makeItem(vi,type,q??this.rewardQuality(rating),bound);award(it);
  if(this.rand()<st.mods.drop+(s.tour?.route==='workshop'?.25:0))award(this.makeItem(vi,null,this.rewardQuality(rating)));
  let b=s.best[vi];if(!b||b.balanceVersion!==2||b.rank!==s.rank)b={count:0,coins:0,fame:0,rating:'C',heat:0,rank:s.rank,balanceVersion:2};b.count++;
  if(heat>=b.heat){b.coins=coins;b.fame=fame;b.rating=rating;b.heat=heat;}s.best[vi]=b;
  let tourClear=false;
  if(s.tour){s.tour.node++;s.tour.coins+=coins;if(s.tour.node%3===0&&s.tour.node<12){s.tour.choices=this.rollChoices();s.tour.choiceTime=0;s.tour.routeChoices=true;s.tour.routeTime=0;this.note('巡演休息站 · 选择下一段路线与灵感');}if(s.tour.node>=12){tourClear=true;s.tourClears++;s.parts+=100+vi*25;s.fame+=100;const trophy='tour'+vi;if(!s.collections.includes(trophy))s.collections.push(trophy);award(this.makeItem(vi,D.byChar[s.wish]?.type,4,s.wish));s.tour=null;}}
  const result={show:s.shows,venue:v.name,venueIndex:vi,rank:s.rank,rating,heat:Math.round(heat),target,coins:s.coins-before.coins,fame:s.fame-before.fame,parts:s.parts-before.parts,item:it.name,quality:it.quality,drops,tourClear};
  s.lastResults.unshift(result);s.lastResults=s.lastResults.slice(0,15);
  if(s.autoPush&&!s.tour&&vi<7&&s.fame>=D.venues[vi+1].fame&&rating==='SS'){s.venue++;this.note('自动推进到 '+D.venues[s.venue].name);}
  this.resetShow();s.pendingResult=result;s.settlementRemaining=3;this.fx.push({type:'result',...result});this.touch();
 }

 beginRhythm(song,difficulty){
  const s=this.s;if(!s.started||s.pendingResult||s.rhythmRun||!RH.getSong(song)||!['normal','hard'].includes(difficulty)||s.tour?.choices||s.tour?.routeChoices)return false;
  const token=String(Date.now())+'-'+this.rand().toString(36).slice(2);s.rhythmRun={token,song,difficulty};this.touch();return token;
 }
 cancelRhythm(token){if(!this.s.rhythmRun||this.s.rhythmRun.token!==token)return false;this.s.rhythmRun=null;this.touch();return true;}
 finishRhythm(token,raw){
  const s=this.s,run=s.rhythmRun;if(!run||run.token!==token)return false;const result=RH.validate(raw,run.song,run.difficulty);if(!result)return false;
  s.rhythmRun=null;const auto=s.auto,paused=s.paused;s.auto=true;s.paused=false;this.resetShow();this.advance(this.duration());s.auto=auto;s.paused=paused;
  const reward=s.pendingResult;if(!reward)return false;
  // Keep offline records on the ordinary performance reward, before the manual bonus.
  const bonusCoins=Math.round(reward.coins*result.bonusRate),bonusFame=Math.round(reward.fame*result.bonusRate);s.coins=Math.min(9e12,s.coins+bonusCoins);s.totalCoins+=bonusCoins;s.fame+=bonusFame;reward.coins+=bonusCoins;reward.fame+=bonusFame;
  const key=run.song+':'+run.difficulty,old=s.rhythmRecords[key],record={score:Math.max(old?.score||0,result.score),maxCombo:Math.max(old?.maxCombo||0,result.maxCombo),fullCombo:!!old?.fullCombo||result.fullCombo,allPerfect:!!old?.allPerfect||result.allPerfect,plays:(old?.plays||0)+1};s.rhythmRecords[key]=record;
  reward.rhythm={...result,bonusCoins,bonusFame,newRecord:!old||result.score>old.score};this.touch();return reward;
 }
 selectVenue(i){if(!Number.isInteger(i)||!D.venues[i]||this.s.fame<D.venues[i].fame||this.s.tour)return false;this.s.venue=i;this.resetShow();return true;}
 setRank(n){if(this.s.fame<10500)return false;this.s.rank=integer(n,0,50);this.resetShow();return true;}
 recruitCost(count=1){return [1,10].includes(count)?R.coinCost*count:null;}
 awardMember(id){const s=this.s,c=D.byChar[id];if(!c)return false;
  if(s.owned.includes(id)){const m=s.members[id],max=m.skill>=R.maxSkill;if(max){s.skinTokens=Math.min(9e12,s.skinTokens+R.duplicatePoints*R.skinPerPoint);}else m.skillPoints+=R.duplicatePoints;this.touch();return {id,kind:max?'skin':'points',amount:R.duplicatePoints*(max?R.skinPerPoint:1)};}
  s.owned.push(id);s.members[id]=newMember();const it=this.makeItem(s.venue,c.type,1);if(this.addItem(it))s.members[id].gear.main=it.id;this.touch();return {id,kind:'new',amount:1};
 }
 recruit(count=1){const s=this.s,cost=this.recruitCost(count);if(!s.started||cost===null||s.coins<cost)return false;s.coins-=cost;const results=[];for(let i=0;i<count;i++)results.push(this.awardMember(this.pick(D.chars).id));s.recruitCount+=count;s.recruitHistory=results;const fresh=results.filter(r=>r.kind==='new').length;this.note('金币招募 '+count+' 次 · 新成员 '+fresh+' 位 · 重复成员 '+(count-fresh)+' 位','rare');this.touch();return copy(results);}
 assign(id,index,side=false){const s=this.s;if(!s.owned.includes(id)||s.tour)return false;const team=side?s.sideTeam:s.team,other=side?s.team:s.sideTeam;if(side&&s.fame<1000)return false;if(other.includes(id))return false;if(index<0||index>4)return false;const old=team[index],existing=team.indexOf(id);if(existing>=0)team[existing]=old;team[index]=id;const filtered=team.filter(Boolean);if(side)s.sideTeam=[...new Set(filtered)];else s.team=[...new Set(filtered)];this.resetShow();return true;}
 useBand(id){const ids=D.bandMembers(id);if(this.s.tour||!ids.every(x=>this.s.owned.includes(x)))return false;this.s.team=ids;this.s.sideTeam=this.s.sideTeam.filter(x=>!ids.includes(x));this.resetShow();return true;}
 equip(id,charId,slot){const s=this.s,it=this.item(id),c=D.byChar[charId],m=s.members[charId];if(!it||!c||!m||s.tour)return false;if(it.slot==='main'){slot='main';if(it.type!==c.type)return false;}else if(!['acc1','acc2'].includes(slot))return false;
  for(const cm of Object.values(s.members))for(const k of Object.keys(cm.gear))if(cm.gear[k]===id)delete cm.gear[k];m.gear[slot]=id;this.touch();return true;}
 enhance(charId,slot){const m=this.s.members[charId];if(!m||!m.gear[slot]||this.s.tour)return false;const l=m.enhance[slot]||0,cost=60+40*l*l;if(l>=30||this.s.coins<cost)return false;this.s.coins-=cost;m.enhance[slot]=l+1;this.touch();return true;}
 salvage(id,quiet=false){const it=this.item(id);if(!it||it.locked||it.bound||this.used(id)||this.s.reroll?.item===id)return false;const parts=2+it.level*(it.quality+1);this.s.parts+=parts;this.s.items=this.s.items.filter(i=>i.id!==id);if(!quiet)this.note('已分解 · 零件 +'+parts);this.touch();return true;}
 salvageAll(){let n=0;for(const it of [...this.s.items])if(it.quality<=1&&this.salvage(it.id,true))n++;this.note('分解 '+n+' 件普通与精良装备');return n;}
 reroll(id){const it=this.item(id);if(!it||!it.aff.length||this.s.reroll||this.s.tour)return false;const locked=it.aff.filter(a=>a.locked).length,cost=12+locked*20;if(locked===it.aff.length||this.s.parts<cost)return false;this.s.parts-=cost;const existing=new Set(it.aff.filter(a=>a.locked).map(a=>a.key));const candidates=it.aff.map(a=>{if(a.locked)return copy(a);const pool=D.affixes.filter(x=>!existing.has(x.id)),key=this.pick(pool).id;existing.add(key);return {key,value:Math.round((3+this.rand()*9+it.quality*2)*10)/10,locked:false};});this.s.reroll={item:id,aff:candidates};this.touch();return true;}
 acceptReroll(yes){const r=this.s.reroll;if(!r)return false;const it=this.item(r.item);if(it&&yes)it.aff=r.aff;this.s.reroll=null;this.touch();return true;}
 craft(){if(this.s.parts<180||!D.byChar[this.s.wish])return false;this.s.parts-=180;const it=this.makeItem(this.s.venue,D.byChar[this.s.wish].type,2,this.s.wish);this.addItem(it);this.touch();return true;}
 trainCost(){return 100+Math.round(Math.pow(this.s.train,1.7)*45);}
 train(){const cost=this.trainCost();if(this.s.coins<cost||this.s.train>=100)return false;this.s.coins-=cost;this.s.train++;this.touch();return true;}
 skillCost(id){const m=this.s.members[id];return m&&m.skill<R.maxSkill?m.skill*R.skillStep:null;}
 skillUp(id){const m=this.s.members[id],cost=this.skillCost(id);if(cost===null||m.skillPoints<cost)return false;m.skillPoints-=cost;m.skill++;if(m.skill===R.maxSkill&&m.skillPoints>0){const extra=m.skillPoints*R.skinPerPoint;this.s.skinTokens=Math.min(9e12,this.s.skinTokens+extra);m.skillPoints=0;this.note(D.byChar[id].name+' 技能满级 · 剩余技能点转为 '+extra+' 皮肤币','rare');}this.touch();return true;}
 upgradeFacility(){const cost=500*Math.pow(this.s.facility+1,2);if(this.s.coins<cost||this.s.facility>=15)return false;this.s.coins-=cost;this.s.facility++;this.touch();return true;}
 offlineUpgrade(){const cost=1500*(this.s.offlineLevel+1);if(!this.offlineUnlocked()||this.s.coins<cost||this.s.offlineLevel>=6)return false;this.s.coins-=cost;this.s.offlineLevel++;this.touch();return true;}
 support(id){const c=D.supports.find(x=>x.id===id);if(!c||this.s.fame<c.fame)return false;this.s.support=id;this.touch();return true;}
 rollChoices(){const pool=[...D.inspirations],r=[];while(r.length<3)r.push(pool.splice(Math.floor(this.rand()*pool.length),1)[0].id);return r;}
 startTour(){if(this.s.fame<300||this.s.tour||!this.s.started)return false;this.s.tour={node:0,buffs:[],choices:this.rollChoices(),choiceTime:0,routeChoices:false,routeTime:0,route:'stage',coins:0};this.resetShow();this.note('巡演启程 · 选择第一份舞台灵感');return true;}
 chooseInspiration(id){const t=this.s.tour;if(!t||!t.choices?.includes(id))return false;t.buffs.push(id);t.choices=null;this.touch();return true;}
 autoChoice(){const choices=this.s.tour?.choices||[];const pref={money:['merch','encore'],gear:['gear','focus'],score:['improv','chorus','duet'],steady:['steady','rhythm','chorus']}[this.s.preset]||[];return pref.find(id=>choices.includes(id))||choices[0];}
 chooseRoute(id){const t=this.s.tour;if(!t?.routeChoices||!['stage','market','workshop'].includes(id))return false;t.route=id;t.routeChoices=false;this.touch();return true;}
 endTour(){if(!this.s.tour)return false;this.s.tour=null;this.resetShow();this.note('巡演已结束，已结算的奖励全部保留');return true;}
 saveLoadout(name){this.s.loadouts[name]={team:[...this.s.team],gear:Object.fromEntries(this.s.team.map(id=>[id,copy(this.s.members[id].gear)])),focusType:this.s.focusType};this.note('已保存 '+name+' 配装');this.touch();}
 loadLoadout(name){const l=this.s.loadouts[name];if(!l||this.s.tour)return false;this.s.team=l.team.filter(id=>this.s.owned.includes(id));this.s.sideTeam=this.s.sideTeam.filter(id=>!this.s.team.includes(id));for(const id of this.s.team)for(const[slot,item]of Object.entries(l.gear[id]||{}))if(this.item(item))this.equip(item,id,slot);this.s.focusType=l.focusType;this.resetShow();return true;}
 snapshot(){return copy({...this.s,savedAt:Date.now()});}
 restore(value,applyOffline=true){try{const x=copy(value);if(![2,3,4].includes(x.schemaVersion)||x.appId!=='band-desk'||!Array.isArray(x.owned)||!Array.isArray(x.team)||!Array.isArray(x.items)||!x.members||typeof x.members!=='object')return false;
  const s={...defaults(),...x};for(const k of ['coins','fame','parts','skinTokens','recruitCount','time','shows','totalCoins','sideShows'])s[k]=integer(s[k],0,9e12,0);const migratedCoins=x.schemaVersion===2?integer(x.invites,0,9e10,0)*R.legacyInviteCoins:0;s.coins=Math.min(9e12,s.coins+migratedCoins);s.schemaVersion=4;delete s.invites;s.recruitHistory=(Array.isArray(x.recruitHistory)?x.recruitHistory:[]).slice(0,10).filter(r=>r&&D.byChar[r.id]&&['new','points','skin'].includes(r.kind)).map(r=>({id:r.id,kind:r.kind,amount:integer(r.amount,1,1000,1)}));s.time=clamp(Number(x.time)||0,0,9e12);s.venue=integer(s.venue,0,7);s.rank=integer(s.rank,0,50);s.train=integer(s.train,1,100);s.facility=integer(s.facility,0,15);s.offlineLevel=integer(s.offlineLevel,0,6);s.serial=integer(s.serial,0,1e9);s.rng=integer(s.rng,1,4294967295,65719);s.pity=integer(s.pity,0,19);s.owned=[...new Set(s.owned.filter(id=>D.byChar[id]))];s.team=[...new Set(s.team.filter(id=>s.owned.includes(id)))].slice(0,5);s.sideTeam=[...new Set((s.sideTeam||[]).filter(id=>s.owned.includes(id)&&!s.team.includes(id)))].slice(0,5);if(s.started&&!s.team.length)return false;
  s.items=s.items.slice(0,350).filter(it=>it&&/^eq\d+$/.test(it.id)&&Number.isFinite(it.base)&&(D.roles[it.type]||['monitor','pedal','charm'].includes(it.type))).map(it=>({...it,name:String(it.name).slice(0,60),level:integer(it.level,1,300),quality:integer(it.quality,0,4),base:integer(it.base,1,20000),bound:D.byChar[it.bound]?it.bound:null,locked:it.locked===true,slot:D.roles[it.type]?'main':'acc',aff:(it.aff||[]).slice(0,4).filter(a=>D.affixes.some(z=>z.id===a.key)).map(a=>({key:a.key,value:clamp(Number(a.value)||3,0,40),locked:!!a.locked}))}));
  const seen=new Set();s.items=s.items.filter(i=>!seen.has(i.id)&&seen.add(i.id));s.serial=Math.max(s.serial,0,...s.items.map(i=>Number(i.id.slice(2))));const assigned=new Set();const members={};for(const id of s.owned){const m=s.members[id]||{},gear={},enhance={};for(const slot of ['main','acc1','acc2']){const it=s.items.find(i=>i.id===m.gear?.[slot]);if(it&&!assigned.has(it.id)&&(slot==='main'?it.type===D.byChar[id].type:it.slot==='acc')){gear[slot]=it.id;assigned.add(it.id);}enhance[slot]=integer(m.enhance?.[slot],0,30);}const skill=integer(m.skill,1,R.maxSkill,1),points=integer(m.skillPoints,0,9e12,0);if(skill===R.maxSkill)s.skinTokens=Math.min(9e12,s.skinTokens+points*R.skinPerPoint);members[id]={bond:integer(m.bond,0,1e8),skill,skillPoints:skill===R.maxSkill?0:points,gear,enhance};}s.members=members;
  if(!D.byChar[s.wish])s.wish='tomori';if(s.focusType!=='all'&&!D.roles[s.focusType])s.focusType='all';s.progress=clamp(Number(s.progress)||0,0,D.venues[s.venue].duration);s.heat=clamp(Number(s.heat)||0,0,1e12);s.cooldowns=s.team.map((id,i)=>clamp(Number(s.cooldowns?.[i])||0,0,30));s.encoreCD=clamp(Number(s.encoreCD)||0,0,20);s.encoreCount=integer(s.encoreCount,0,100);s.sideProgress=clamp(Number(s.sideProgress)||0,0,60);s.events=Array.isArray(s.events)?s.events.slice(0,24):[];s.lastResults=Array.isArray(s.lastResults)?s.lastResults.slice(0,15):[];s.collections=Array.isArray(s.collections)?s.collections.slice(0,80):[];s.skillCounts=s.skillCounts&&typeof s.skillCounts==='object'?s.skillCounts:{};s.best=s.best&&typeof s.best==='object'?s.best:{};s.loadouts=s.loadouts&&typeof s.loadouts==='object'?s.loadouts:{};
  if(s.tour){const t=s.tour;s.tour={node:integer(t.node,0,11),buffs:(t.buffs||[]).filter(id=>D.inspirations.some(i=>i.id===id)).slice(0,12),choices:Array.isArray(t.choices)?t.choices.filter(id=>D.inspirations.some(i=>i.id===id)).slice(0,3):null,choiceTime:0,routeChoices:!!t.routeChoices,routeTime:0,route:['stage','market','workshop'].includes(t.route)?t.route:'stage',coins:integer(t.coins,0,9e12)};}
  if(s.reroll&&(!s.items.some(i=>i.id===s.reroll.item)||!Array.isArray(s.reroll.aff)))s.reroll=null;
  const today=Number(dayKey(Date.now()));s.offlineUsage=Object.fromEntries(Object.entries(s.offlineUsage||{}).filter(([day])=>/^\d+$/.test(day)&&Number(day)>=today-1&&Number(day)<=today).map(([day,used])=>[day,clamp(Number(used)||0,0,86400)]));s.offlineClaimedAt=clamp(Number(s.offlineClaimedAt)||0,0,Date.now());
  for(const result of s.lastResults){if(!result?.rhythm)continue;const r=result.rhythm,valid=RH.getSong(r.song)&&['normal','hard'].includes(r.difficulty)?RH.validate(r,r.song,r.difficulty):null;result.rhythm=valid?{...valid,bonusCoins:integer(r.bonusCoins,0,9e12),bonusFame:integer(r.bonusFame,0,9e12),newRecord:!!r.newRecord}:null;}
  s.pendingResult=s.pendingResult&&Number.isInteger(s.pendingResult.show)&&s.pendingResult.show===s.shows?s.lastResults.find(r=>r.show===s.shows)||null:null;s.settlementRemaining=s.pendingResult?clamp(Number(s.settlementRemaining)||0,0,3):0;
  const interruptedRhythm=!!s.rhythmRun;s.rhythmRun=null;const settings=s.rhythmSettings||{};s.rhythmSettings={song:RH.getSong(settings.song)?settings.song:'starlight',difficulty:settings.difficulty==='hard'?'hard':'normal',offset:integer(settings.offset,-200,200,0),volume:clamp(Number.isFinite(settings.volume)?settings.volume:.65,0,1)};
  const records={};for(const song of RH.songs)for(const level of ['normal','hard']){const key=song.id+':'+level,r=s.rhythmRecords?.[key];if(!r)continue;records[key]={score:integer(r.score,0,1000000),maxCombo:integer(r.maxCombo,0,RH.chart(song.id,level).units),fullCombo:!!r.fullCombo,allPerfect:!!r.allPerfect,plays:integer(r.plays,0,1e9)};}s.rhythmRecords=records;
  if(interruptedRhythm){s.offlineClaimedAt=Date.now();applyOffline=false;}
  this.s=s;this.restoreExpedition();this.touch();this.fx=[];this.offline=null;if(migratedCoins)this.note('招募更新 · 旧邀请进度已折算为 '+migratedCoins+' 金币','rare');if(applyOffline)this.offlineCredit(Number(x.savedAt)||Date.now());return true;
 }catch{return false;}}
 offlineCandidates(){const record=this.s.offlineRecord;return [...Object.entries(this.s.best),...(record?[[record.venue,record]]:[])].filter(([i,b])=>D.venues[i]&&b&&b.count>=3&&['A','S','SS'].includes(b.rating)&&Number.isFinite(b.coins)&&Number.isFinite(b.fame)).sort((a,b)=>b[1].coins/(D.venues[b[0]].duration+3)-a[1].coins/(D.venues[a[0]].duration+3));}
 offlineUnlocked(){return this.offlineCandidates().length>0;}
 offlineHours(){return 6+this.s.offlineLevel*3;}
 offlineRemaining(now=Date.now()){return Math.max(0,this.offlineHours()*3600-(this.s.offlineUsage[dayKey(now)]||0));}
 offlineCredit(savedAt,now=Date.now()){const s=this.s;this.offline=null;if(!s.started||s.paused||!s.auto||s.rhythmRun||s.tourScreen)return;
  const from=Math.max(Number(savedAt)||now,s.offlineClaimedAt||0,now-DAY),elapsed=Math.max(0,now-from)/1000;if(elapsed<60)return;
  const candidates=this.offlineCandidates();if(!candidates.length){s.offlineClaimedAt=now;return;}
  const [vi,b]=candidates[0],v=D.venues[vi],cycle=v.duration+3,cap=this.offlineHours()*3600;let cursor=from,count=0,seconds=0;
  while(cursor<now){const day=dayKey(cursor),end=Math.min(now,(Number(day)+1)*DAY-DAY_OFFSET),available=Math.min((end-cursor)/1000,Math.max(0,cap-(s.offlineUsage[day]||0))),n=Math.floor(available/cycle),used=n*cycle;s.offlineUsage[day]=(s.offlineUsage[day]||0)+used;seconds+=used;count+=n;cursor=end;}
  s.offlineClaimedAt=now;const today=Number(dayKey(now));s.offlineUsage=Object.fromEntries(Object.entries(s.offlineUsage).filter(([day])=>Number(day)>=today-1&&Number(day)<=today));
  if(!count){this.offline={seconds:0,count:0,coins:0,fame:0,parts:0,drops:0,remaining:this.offlineRemaining(now),quotaReached:true};this.touch();return;}
  const coins=Math.floor(count*b.coins*.75),fame=Math.floor(count*b.fame*.5),partsBefore=s.parts;s.coins+=coins;s.totalCoins+=coins;s.fame+=fame;s.parts+=count*2;
  const old=s.venue,oldRank=s.rank;s.venue=Number(vi);s.rank=Number.isInteger(b.rank)?b.rank:0;const drops=Math.min(24,Math.floor(count/6));for(let i=0;i<drops;i++)this.addItem(this.makeItem(Number(vi),null,this.rewardQuality(b.rating)));s.venue=old;s.rank=oldRank;s.savedAt=now;
  if(s.pendingResult)this.continueShow();this.offline={seconds,count,coins,fame,parts:s.parts-partsBefore,drops,remaining:this.offlineRemaining(now),quotaReached:seconds<elapsed-cycle};this.note('离线演出完成 · 收入 +'+coins,'rare');this.touch();
 }

}
TE.install(Engine,TR,D);
if(typeof module!=='undefined')module.exports=Engine;else root.GameEngine=Engine;
})(typeof window==='undefined'?globalThis:window);
