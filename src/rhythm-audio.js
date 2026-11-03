/* Three original arrangements, rendered locally. Music and notes share one audio clock. */
(()=>{
'use strict';
const sampleRate=22050;
function compose(song){
 const beat=60/song.bpm,lead=beat*4,duration=(song.bars*4+8)*beat,data=new Float32Array(Math.ceil(duration*sampleRate));let random=8371;
 const noise=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/2147483648-1;};
 function tone(time,seconds,midi,gain,kind){const from=Math.round(time*sampleRate),length=Math.ceil(seconds*sampleRate),freq=440*Math.pow(2,(midi-69)/12);
  for(let i=0;i<length&&from+i<data.length;i++){const t=i/sampleRate,p=2*Math.PI*freq*t,env=Math.min(1,t/.008)*Math.pow(Math.max(0,1-i/length),kind==='pad'?1:2);const wave=Math.sin(p)+(kind==='bass'?.28:.22)*Math.sin(2*p)+.1*Math.sin(3*p);data[from+i]+=wave*env*gain;}}
 function drum(time,kind,gain){const from=Math.round(time*sampleRate),seconds=kind==='kick'?.23:kind==='snare'?.13:.04,length=Math.round(seconds*sampleRate);for(let i=0;i<length&&from+i<data.length;i++){const t=i/sampleRate,env=Math.exp(-t/(seconds/5));let value=kind==='kick'?Math.sin(2*Math.PI*(45*t+5*(1-Math.exp(-t*25)))):noise()*(kind==='snare'?.8:1);if(kind==='snare')value+=.25*Math.sin(2*Math.PI*180*t);data[from+i]+=value*env*gain;}}
 for(let i=0;i<4;i++)tone(i*beat,.07,i===0?88:81,.11,'lead');
 for(let b=0;b<song.bars;b++){const start=lead+b*4*beat,root=song.roots[b%4];
  for(const interval of [0,song.id==='starlight'?4:3,7])tone(start,beat*3.8,root+interval,.035,'pad');
  for(let q=0;q<4;q++){drum(start+q*beat,q%2?'snare':'kick',q%2?.15:.27);tone(start+q*beat,beat*.8,root-24+(q===3?7:0),.13,'bass');}
  for(let s=0;s<8;s++){drum(start+s*beat/2,'hat',s%2?.045:.065);if(s===7&&b%2===1)continue;tone(start+s*beat/2,beat*(s===4&&b%4===1?1.4:.42),root+12+song.pattern[s],song.id==='midnight'?.12:.095,'lead');}
 }
 const end=lead+song.bars*4*beat;for(const interval of [0,4,7])tone(end,beat*3.6,song.roots[0]+interval,.05,'pad');
 let peak=.8;for(const v of data)peak=Math.max(peak,Math.abs(v));for(let i=0;i<data.length;i++)data[i]=Math.tanh(data[i]/peak)*.85;
 return data;
}
class Audio{
 constructor(){this.context=null;this.buffers=new Map();this.source=null;this.offset=0;this.anchor=0;this.running=false;this.generation=0;}
 async ready(context){if(context.state==='running')return;let timer;try{await Promise.race([context.resume(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('伴奏未能启动，请点击继续重试。')),2500);})]);}finally{clearTimeout(timer);}if(context.state!=='running')throw Error('伴奏未能启动，请点击继续重试。');}
 async prepare(song,volume){
  // A new track gets a fresh output clock. Keep decoded buffers, not an idle
  // context whose output may have been suspended after the previous song.
  this.stop();const previous=this.context;this.context=null;this.gain?.disconnect();if(previous&&previous.state!=='closed')previous.close().catch(()=>{});
  const Type=window.AudioContext||window.webkitAudioContext;if(!Type)throw Error('此浏览器不支持伴奏播放，请使用桌面版或较新的浏览器。');const context=this.context=new Type(),ticket=this.generation;this.gain=context.createGain();this.gain.connect(context.destination);this.gain.gain.value=volume;
  await this.ready(context);if(ticket!==this.generation||context!==this.context)return false;
  if(!this.buffers.has(song.id)){const samples=compose(song),buffer=this.context.createBuffer(1,samples.length,sampleRate);buffer.copyToChannel(samples,0);this.buffers.set(song.id,buffer);}this.buffer=this.buffers.get(song.id);this.offset=0;
  return true;
 }
 audibleTime(){const c=this.context,stamp=c.getOutputTimestamp?.();if(stamp?.contextTime>0&&stamp.performanceTime>0)return Math.min(c.currentTime,stamp.contextTime+(performance.now()-stamp.performanceTime)/1000);return c.currentTime;}
 time(){return this.running?Math.max(0,this.audibleTime()-this.anchor):this.offset;}
 async play(){if(this.running)this.pause();const owner=++this.generation,context=this.context;await this.ready(context);if(owner!==this.generation||context!==this.context)return false;const when=context.currentTime+.12;this.anchor=when-this.offset;this.source=context.createBufferSource();this.source.buffer=this.buffer;this.source.connect(this.gain);this.source.start(when,Math.min(this.offset,this.buffer.duration-.01));this.running=true;return true;}
 pause(){this.generation++;if(!this.running)return;this.offset=this.time();this.running=false;try{this.source.stop();this.source.disconnect();}catch{}this.source=null;}
 stop(){this.pause();this.offset=0;}
 volume(value){if(this.gain)this.gain.gain.setTargetAtTime(value,this.context.currentTime,.02);}
}
window.RhythmAudio=Audio;
})();
