const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),assets=JSON.parse(fs.readFileSync(path.join(root,'assets/characters.json'))),artCode=fs.readFileSync(path.join(root,'dist/art.js'),'utf8');
function loader(outcome){
 const requests=[],attempts={},events={};let active=0,peak=0;
 class Image{
  set src(url){this.url=url;const id=/characters\/([^/.?]+)\.png/.exec(url)[1],attempt=attempts[id]=(attempts[id]||0)+1;requests.push({id,url});active++;peak=Math.max(peak,active);this.active=true;
   const result=outcome(id,attempt);if(result==='hang')return;
   this.timer=setTimeout(()=>{this.stop();this.naturalWidth=result==='ok'?100:0;this.width=100;this.height=300;if(result==='ok')this.onload?.();else this.onerror?.();},1);
  }
  get src(){return this.url;}
  stop(){if(this.active){active--;this.active=false;}clearTimeout(this.timer);}
  removeAttribute(){this.stop();}
 }
 const window={ArtAssets:assets,GameData:require('../src/data.js'),addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(artCode,{window,Image,setTimeout:(fn,ms)=>setTimeout(fn,Math.max(1,ms/1000)),clearTimeout,Date,console});
 return {art:window.PixelArt,requests,attempts,events,get peak(){return peak;}};
}
function boot(art,{active=true,locked=false}={}){
 class Element{constructor(){this.hidden=false;this.children=[];this.attrs={};}after(el){this.afterElement=el;}append(...els){this.children.push(...els);}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}}
 const elements=Object.fromEntries(['web-loading','web-load-status','web-load-progress','web-retry'].map(id=>[id,new Element()]));
 const body=new Element(),events={},timers=[];let update,refreshes=0;
 const window={PixelArt:art,WebPlatform:{active,locked},DesktopGame:{refreshArt:()=>refreshes++},addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(fs.readFileSync(path.join(root,'dist/web-boot.js'),'utf8'),{window,document:{getElementById:id=>elements[id],createElement:()=>new Element(),body},setInterval:fn=>update=fn,setTimeout:fn=>timers.push(fn),location:{reload(){throw Error('Image retries must not reload the page');}}});
 return {elements,warning:body.children[0],later:elements['web-retry'].afterElement,update,events,timers,get refreshes(){return refreshes;}};
}
(async()=>{
 const healthy=loader(()=> 'ok');await healthy.art.ready;assert.equal(healthy.art.progress.loaded,69);assert(healthy.peak<=4);assert.equal(healthy.requests.length,69);
 const intermittent=loader((id,n)=>id==='tomori'&&n===1||id==='anon'&&n<3?'error':'ok');await intermittent.art.ready;
 assert.equal(intermittent.art.progress.loaded,69);assert.equal(intermittent.art.progress.failed.length,0);assert.equal(intermittent.attempts.tomori,2);assert.equal(intermittent.attempts.anon,3);assert.match(intermittent.art.source('anon'),/\?retry=3-/);assert(intermittent.peak<=4);
 let recovered=false;const failed=loader(id=>!recovered&&['tomori','anon'].includes(id)?'error':'ok');await failed.art.ready;
 assert.equal(failed.art.progress.loaded,67);assert.equal(failed.art.progress.failed.length,2);assert(failed.art.isReady());
 const ui=boot(failed.art);assert(ui.elements['web-loading'].hidden);assert(!ui.warning.hidden);assert.match(ui.warning.children[0].textContent,/2 位/);
 const before=failed.requests.length;recovered=true;ui.warning.children[1].onclick();const pending=failed.art.retry();assert.equal(failed.art.retry(),pending);await pending;ui.update();
 assert.equal(failed.requests.length-before,2);assert.equal(failed.art.progress.loaded,69);assert.equal(failed.art.progress.failed.length,0);assert(ui.warning.hidden);assert(ui.refreshes>=2);
 const hung=loader(id=>id==='tomori'?'hang':'ok');await hung.art.ready;assert(hung.art.isReady());assert.equal(hung.art.progress.loaded,68);assert.equal(hung.attempts.tomori,3);assert.deepEqual(Array.from(hung.art.progress.failed),['tomori']);
 let online=false;const offline=loader(id=>id==='anon'&&!online?'error':'ok');await offline.art.ready;online=true;offline.events.online();await offline.art.retry();assert.equal(offline.art.progress.loaded,69);
 const slow=boot({progress:{loaded:1,total:69,failed:[],loading:true,revision:1},isReady:()=>false});assert(!slow.elements['web-loading'].hidden);slow.timers.forEach(fn=>fn());assert(!slow.later.hidden);slow.later.onclick();assert(slow.elements['web-loading'].hidden);assert(!slow.warning.hidden);
 const locked=boot(healthy.art,{active:false,locked:true});assert(locked.elements['web-loading'].hidden);assert(locked.warning.hidden);
 console.log('Loading checks passed: 69 assets, max 4 requests, transient retries, permanent failure, targeted recovery, timeout, reconnect, slow connection and tab lock.');
})().catch(error=>{console.error(error);process.exitCode=1;});
