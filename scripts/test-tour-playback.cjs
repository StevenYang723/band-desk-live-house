const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const T=require('../src/tour-rules.js'),R=require('../src/rhythm-core.js'),D=require('../src/data.js'),E=require('../src/engine.js');
function harness(){
 let clock=0,serial=0,panel=null,nextContext='normal';const raf=new Map(),timers=new Map(),contexts=[],notices=[],events={};
 class Element{
  constructor(){this.children=[];this.dataset={};this.hidden=false;this.disabled=false;this.inert=false;this.isConnected=true;this.textContent='';this.listeners={};this.parts=new Map();this.style={setProperty(){}};this.classList={toggle(){}};}
  setAttribute(){}replaceChildren(text){this.textContent=text;}focus(){document.activeElement=this;}matches(){return false;}
  append(el){this.children.push(el);panel=el;}remove(){this.isConnected=false;panel=null;}addEventListener(name,fn){this.listeners[name]=fn;}
  set innerHTML(html){this.html=html;this.parts.clear();this.members=Array.from(html.matchAll(/data-member="(\d)"/g),m=>{const b=new Element();b.dataset.member=m[1];return b;});}
  querySelector(selector){
   const tour=/^\[data-tour="(.+)"\]$/.exec(selector);if(tour&&!this.html?.includes('data-tour="'+tour[1]+'"'))return null;
   const member=/^\[data-member="(\d)"\]$/.exec(selector);if(member)return this.members[Number(member[1])];
   if(!this.parts.has(selector)){const el=new Element();if(selector==='.tour-pause')el.hidden=true;this.parts.set(selector,el);}return this.parts.get(selector);
  }
  querySelectorAll(selector){return selector==='[data-member]'?this.members:[];}
 }
 const game=new Element(),document={hidden:false,activeElement:new Element(),getElementById:()=>game,createElement:()=>new Element(),addEventListener:(n,fn)=>events[n]=fn};
 class Context{
  constructor(){this.currentTime=0;this.state='suspended';this.mode=nextContext;nextContext='normal';this.destination={};contexts.push(this);}
  resume(){if(this.mode==='hang')return new Promise(resolve=>{this.resolveResume=()=>{this.state='running';resolve();};});this.state='running';return Promise.resolve();}
  close(){this.state='closed';return Promise.resolve();}
  createGain(){return {connect(){},disconnect(){},gain:{value:0,setTargetAtTime(){}}};}
  createBuffer(c,length,rate){return {duration:length/rate,copyToChannel(){}};}
  createBufferSource(){return {connect(){},disconnect(){},start(){},stop(){}};}
 }
 const sandbox={document,performance:{now:()=>clock},TourRules:T,RhythmRules:R,GameData:D,PixelArt:{source:id=>id+'.png'},AudioContext:Context,addEventListener:(n,fn)=>events[n]=fn,
  requestAnimationFrame:fn=>{const id=++serial;raf.set(id,fn);return id;},cancelAnimationFrame:id=>raf.delete(id),setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id)};
 sandbox.window=sandbox;vm.createContext(sandbox);for(const file of ['rhythm-audio.js','rhythm-game.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),sandbox);
 const e=new E();e.start('mygo');e.s.fame=800;e.s.coins=5000;e.s.rng=168124;e.s.stamina={value:120,at:Date.now()};
 const settle=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
 async function click(action,id){panel.listeners.click({target:{closest:()=>({dataset:{tour:action,id}})}});await settle();}
 async function step(ms=100){clock+=ms;for(const c of contexts)if(c.state==='running'&&!c.frozen)c.currentTime+=ms/1000;for(const [id,t]of timers)if(t.at<=clock){timers.delete(id);t.fn();}for(const [id,fn]of [...raf]){raf.delete(id);fn(clock);}await settle();}
 async function finish(){for(let i=0;i<500&&e.s.expedition.status==='playing';i++){await step(100);const x=e.s.expedition;if(x.status!=='playing')break;const n=e.tourNode(),chart=T.chart(n.song,n.type,x.seed+n.row*13+n.col),ctx=contexts.at(-1);for(const note of chart.notes){const at=ctx.currentTime-.12;if(!x.session.results[note.id]&&at>=note.time&&at-note.time<.14)events.keydown({code:'Digit'+(note.member+1),key:String(note.member+1),target:document.activeElement,preventDefault(){},stopImmediatePropagation(){}});}}assert.equal(e.s.expedition.status,'reward');assert(e.s.expedition.reward.rhythm.accuracy>.95);}
 async function next(){await click('continue');if(e.s.expedition.status==='choice')await click('relic',e.s.expedition.offers[0]);const n=T.available(e.s.expedition).find(n=>['live','elite','boss'].includes(n.type));assert(n);await click('node',n.id);}
 sandbox.TourGame.open({engine:e,persist:()=>e.snapshot(),refresh(){},notice:text=>notices.push(text)});
 return {e,contexts,notices,click,step,finish,next,settle,api:sandbox.TourGame,get panel(){return panel;},get context(){return contexts.at(-1);},hangNext(){nextContext='hang';}};
}
(async()=>{
 const h=harness();await h.click('new');await h.click('node','0-1');await h.click('play');assert(h.api.playing);await h.finish();const first=h.context;
 await h.next();await h.click('play');assert.notEqual(h.context,first);assert.equal(first.state,'closed');await h.step(3000);assert.equal(h.panel.querySelector('.tour-countdown').textContent,'');await h.finish();assert.equal(h.e.s.expedition.path.length,2);
 // The output device stops advancing between songs: no stuck countdown or lost stamina.
 await h.next();await h.click('play');h.context.frozen=true;const stamina=h.e.s.stamina.value,judgements=JSON.stringify(h.e.s.expedition.session.results);await h.step(2700);assert(!h.api.playing);assert.equal(h.panel.querySelector('.tour-pause').hidden,false);assert.equal(h.e.s.stamina.value,stamina);assert.equal(JSON.stringify(h.e.s.expedition.session.results),judgements);const stuck=h.context;
 await h.click('resume');assert(h.api.playing);assert.notEqual(h.context,stuck);await h.step(1000);assert(h.e.s.expedition.session.elapsed>0);await h.click('exit');
 const f=harness();await f.click('new');await f.click('node','0-1');await f.click('play');await f.finish();await f.next();f.hangNext();await f.click('play');const cost=f.e.s.stamina.value;assert(!f.api.playing);await f.step(2600);assert(!f.api.playing);assert(f.notices.some(x=>x.includes('伴奏未能启动')));assert.equal(f.e.s.expedition.session.elapsed,0);assert.equal(f.e.s.stamina.value,cost);assert(f.panel.querySelector('[data-tour="play"]'));await f.click('play');assert(f.api.playing);await f.step(1000);assert.equal(f.e.s.stamina.value,cost);
 // Leaving during an unresolved start must not resurrect the old scene.
 await f.click('exit');f.api.open({engine:f.e,persist(){},refresh(){},notice(){}});f.hangNext();await f.click('play');const pending=f.context;await f.click('exit');pending.resolveResume();await f.settle();assert(!f.api.active);assert(!f.api.playing);assert.equal(f.panel,null);
 console.log('Tour playback checks passed: two full consecutive songs, countdown progress, output-clock interruption/recovery, second-song startup timeout/retry, no extra stamina cost, cancellation on exit.');
})().catch(error=>{console.error(error);process.exitCode=1;});
