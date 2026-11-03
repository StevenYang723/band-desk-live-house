const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),R=require('../src/rhythm-core.js');
let ctx,source,clock=0,serial=0;const timers=new Map(),contexts=[];
class Context{
 constructor(){contexts.push(this);ctx=this;this.currentTime=0;this.destination={};this.state='suspended';this.resumes=0;}
 async resume(){this.resumes++;this.state='running';}
 async close(){this.state='closed';}
 createGain(){return {connect(){},disconnect(){},gain:{value:0,setTargetAtTime(v){this.value=v;}}};}
 createBuffer(channels,length,rate){return {duration:length/rate,copyToChannel(data){let peak=0,power=0;for(const v of data){assert(Number.isFinite(v));peak=Math.max(peak,Math.abs(v));power+=v*v;}assert(peak>.1&&peak<=1);assert(power/data.length>.0001);}};}
 createBufferSource(){source={connect(){},disconnect(){},start(at,offset){this.at=at;this.offset=offset;},stop(){this.stopped=true;}};return source;}
}
const window={AudioContext:Context};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../src/rhythm-audio.js'),'utf8'),{window,performance:{now:()=>clock},setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)});
(async()=>{
 const audio=new window.RhythmAudio();let old=null;
 for(const song of [...R.songs,R.songs[2],R.songs[2],R.songs[0]]){
  assert(await audio.prepare(song,.5));assert.notEqual(ctx,old);if(old)assert.equal(old.state,'closed');old=ctx;
  assert(Math.abs(audio.buffer.duration-R.chart(song.id).duration)<1/22050);assert(await audio.play());assert.equal(ctx.resumes,1,'Do not request a second resume on an already running context');
  ctx.currentTime+=5;assert(Math.abs(audio.time()-4.88)<1e-6);audio.pause();const at=audio.time();ctx.currentTime+=50;assert.equal(audio.time(),at);assert(await audio.play());assert.equal(source.offset,at);ctx.currentTime+=1;assert(Math.abs(audio.time()-(at+.88))<1e-6);audio.stop();assert.equal(audio.time(),0);
 }
 assert.equal(audio.buffers.size,3,'Cached songs survive output-context replacement');
 let resume;ctx.state='suspended';ctx.resume=()=>new Promise(resolve=>{resume=()=>{ctx.state='running';resolve();};});const pending=audio.play();audio.stop();resume();assert.equal(await pending,false);assert.equal(audio.running,false);assert.equal(audio.source,null);assert.equal(timers.size,0);
 // Model the reported no-music/4-countdown failure: browser never resolves resume.
 ctx.state='suspended';ctx.resume=()=>new Promise(()=>{});const stalled=audio.play();const rejected=assert.rejects(stalled,/伴奏未能启动/);assert.equal(timers.size,1);[...timers.values()][0]();await rejected;assert.equal(audio.running,false);assert.equal(timers.size,0);
 assert(await audio.prepare(R.songs[0],.5));assert(await audio.play());ctx.currentTime=3;assert(audio.time()>2);audio.stop();
 console.log('Audio checks passed: music samples, fresh output clocks for consecutive/repeated songs, cached buffers, pause/resume, async cancellation, bounded browser resume timeout and retry.');
})().catch(e=>{console.error(e);process.exitCode=1;});
