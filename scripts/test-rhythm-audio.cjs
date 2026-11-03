const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),R=require('../src/rhythm-core.js');
let ctx,source;
class Context{
 constructor(){ctx=this;this.currentTime=0;this.destination={};}
 async resume(){}
 createGain(){return {connect(){},gain:{value:0,setTargetAtTime(v){this.value=v;}}};}
 createBuffer(channels,length,rate){return {duration:length/rate,copyToChannel(data){let peak=0,power=0;for(const v of data){assert(Number.isFinite(v));peak=Math.max(peak,Math.abs(v));power+=v*v;}assert(peak>.1&&peak<=1);assert(power/data.length>.0001);}};}
 createBufferSource(){source={connect(){},start(at,offset){this.at=at;this.offset=offset;},stop(){this.stopped=true;}};return source;}
}
const window={AudioContext:Context};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../src/rhythm-audio.js'),'utf8'),{window,performance:{now:()=>0}});
(async()=>{const audio=new window.RhythmAudio();for(const song of R.songs){await audio.prepare(song,.5);assert(Math.abs(audio.buffer.duration-R.chart(song.id).duration)<1/22050);await audio.play();ctx.currentTime+=5;assert(Math.abs(audio.time()-4.88)<1e-6);audio.pause();const at=audio.time();ctx.currentTime+=50;assert.equal(audio.time(),at);await audio.play();assert.equal(source.offset,at);ctx.currentTime+=1;assert(Math.abs(audio.time()-(at+.88))<1e-6);audio.stop();assert.equal(audio.time(),0);}
 let resume;ctx.resume=()=>new Promise(resolve=>{resume=resolve;});const pending=audio.play();audio.stop();resume();await pending;assert.equal(audio.running,false);assert.equal(audio.source,null);
 console.log('Original music audio checks passed: three audible finite waveforms, chart duration match, shared audio clock, pause, sample-offset resume and cancel during async resume.');})().catch(e=>{console.error(e);process.exitCode=1;});
