const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const D=require('../src/data.js'),E=require('../src/engine.js');
function harness(reduced=false){
 let current=null,now=0,serial=0;const scheduled=new Map();
 class Element{
  constructor(){this.inert=false;this.isConnected=true;this.disabled=false;this.dataset={};this.attrs={};this.children=[];this.classes=new Set();this.classList={add:(...names)=>names.forEach(n=>this.classes.add(n)),contains:name=>this.classes.has(name)};}
  setAttribute(key,value){this.attrs[key]=value;}getAttribute(key){return this.attrs[key];}
  focus(){document.activeElement=this;}append(el){this.children.push(el);current=el;}
  remove(){this.isConnected=false;game.children=game.children.filter(el=>el!==this);current=null;}
  addEventListener(name,callback){this[name]=callback;}
  set innerHTML(value){this.html=value;this.parts=Object.fromEntries(['.ra-status','.ra-count','.ra-next','.ra-skip'].map(key=>[key,new Element()]));this.parts['.ra-next'].disabled=true;this.cards=Array.from(value.matchAll(/<article class="ra-card /g),()=>new Element());}
  querySelector(selector){return this.parts[selector];}querySelectorAll(){return this.cards;}
 }
 const game=new Element(),normal=new Element(),alreadyInert=new Element(),close=new Element();alreadyInert.inert=true;game.children=[normal,alreadyInert];
 const document={activeElement:close,createElement:()=>new Element(),getElementById:id=>id==='game'?game:close};
 const window={GameData:D,PixelArt:{source:id=>'assets/characters/'+id+'.png'},matchMedia:()=>({matches:reduced})};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/recruit-animation.js'),'utf8'),{window,document,setTimeout:(fn,delay)=>{const id=++serial;scheduled.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>scheduled.delete(id)});
 function advance(ms){const end=now+ms;while(true){const event=[...scheduled].filter(([,item])=>item.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!event)break;scheduled.delete(event[0]);now=event[1].at;event[1].fn();}now=end;}
 return {api:window.RecruitAnimation,normal,alreadyInert,advance,scheduled,get scene(){return current;},get focus(){return document.activeElement;}};
}
const one=[{id:'kasumi',kind:'new',amount:1}],ten=Array.from({length:10},(_,i)=>({id:D.chars[i].id,kind:['new','points','skin'][i%3],amount:10}));
const h=harness();let completed=0;
assert(h.api.play(one,{onDone:()=>completed++}));assert(h.api.active);assert(h.normal.inert);assert.equal(h.api.play(ten),false);assert.equal(h.scene.cards.length,1);
h.advance(800);assert(h.scene.classList.contains('ra-open'));h.advance(950);assert.equal(h.scene.cards[0].getAttribute('aria-hidden'),'false');assert.equal(h.scene.querySelector('.ra-next').disabled,false);assert.equal(h.focus,h.scene.querySelector('.ra-next'));
h.scene.querySelector('.ra-next').onclick();h.api.finish();assert.equal(completed,1);assert(!h.api.active);assert(!h.normal.inert);assert(h.alreadyInert.inert);assert.equal(h.scheduled.size,0);
h.api.play(ten,{onDone:()=>completed++});h.scene.querySelector('.ra-skip').onclick();h.advance(10000);assert.equal(completed,2);assert(!h.api.active);
h.api.play(ten,{onDone:()=>completed++});h.advance(1150);assert.equal(h.scene.cards.filter(el=>el.classList.contains('ra-revealed')).length,1);h.advance(190);assert.equal(h.scene.cards.filter(el=>el.classList.contains('ra-revealed')).length,2);
h.scene.keydown({key:'Enter',preventDefault(){},stopPropagation(){}});assert.equal(h.scene.cards.filter(el=>el.classList.contains('ra-revealed')).length,10);assert.equal(h.scheduled.size,0);
h.scene.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(completed,3);assert(!h.normal.inert);
const r=harness(true);r.api.play(ten);assert(r.scene.classList.contains('ra-complete'));assert.equal(r.scheduled.size,0);r.api.finish();
// Closing/skipping/replaying the presentation never changes committed recruitment.
const engine=new E();engine.start('mygo');engine.s.coins=6000;const results=engine.recruit(10),save=JSON.stringify(engine.snapshot());const before={coins:engine.s.coins,count:engine.s.recruitCount,history:JSON.stringify(engine.s.recruitHistory)};
for(let i=0;i<3;i++){h.api.play(results);h.api.finish();}
assert.equal(engine.s.coins,before.coins);assert.equal(engine.s.recruitCount,before.count);assert.equal(JSON.stringify(engine.s.recruitHistory),before.history);const restored=new E();assert(restored.restore(JSON.parse(save),false));assert.equal(restored.s.coins,3000);assert.equal(restored.s.recruitHistory.length,10);
console.log('Recruit animation checks passed: single, ten sequential cards, duplicate click guard, skip, keyboard, reduced motion, timer/inert cleanup and saved reward stability.');
