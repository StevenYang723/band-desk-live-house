/* Presentation only. Recruitment and saving finish before this scene starts. */
(()=>{
'use strict';
let scene=null,timers=[],restoreInert=[],complete=null,previousFocus=null,done=false;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=r=>r.kind==='new'?'新成员加入':r.kind==='points'?'技能点 +'+r.amount:'皮肤币 +'+r.amount;
function cancelTimers(){timers.forEach(clearTimeout);timers=[];}
function later(fn,ms){timers.push(setTimeout(()=>{if(scene)fn();},ms));}
function finish(){
 if(!scene)return;
 cancelTimers();scene.remove();scene=null;
 restoreInert.forEach(([el,inert])=>{el.inert=inert;});restoreInert=[];
 const callback=complete;complete=null;callback?.();
 const focus=previousFocus?.isConnected?previousFocus:document.getElementById('modal-close');focus?.focus();previousFocus=null;
}
function revealAll(){
 if(!scene||done)return;cancelTimers();
 scene.classList.add('ra-open');scene.querySelectorAll('.ra-card').forEach(el=>{el.classList.add('ra-revealed');el.setAttribute('aria-hidden','false');});
 showComplete();
}
function showComplete(){
 if(!scene||done)return;done=true;scene.classList.add('ra-complete');
 scene.querySelector('.ra-status').textContent='全员到场';scene.querySelector('.ra-count').textContent=scene.dataset.total+' / '+scene.dataset.total;
 const next=scene.querySelector('.ra-next');next.disabled=false;next.textContent='查看招募结果';scene.querySelector('.ra-skip').textContent='查看结果';next.focus();
}
function play(results,{onDone,draw,tone}={}){
 if(scene||!results?.length)return false;
 const D=window.GameData,A=window.PixelArt,many=results.length>1,reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 done=false;complete=onDone;previousFocus=document.activeElement;
 scene=document.createElement('section');scene.id='recruit-animation';scene.className='ra-scene'+(many?' ra-many':' ra-single');scene.dataset.total=String(results.length);
 scene.setAttribute('role','dialog');scene.setAttribute('aria-modal','true');scene.setAttribute('aria-labelledby','ra-title');
 const cards=results.map((r,i)=>{const c=D.byChar[r.id],b=D.byBand[c.band];return `<article class="ra-card ${r.kind}" aria-hidden="true" style="--band:${b.color};--order:${i}"><div class="ra-card-back" aria-hidden="true"><span>♪</span><b>${String(i+1).padStart(2,'0')}</b></div><div class="ra-card-face"><span class="ra-tag">${r.kind==='new'?'NEW':r.kind==='points'?'ENCORE':'MAX'}</span><img data-character="${r.id}" src="${esc(A.source(r.id))}" alt="${esc(c.name)}"><div class="ra-card-name"><small>${esc(b.name)}</small><b>${esc(c.name)}</b><span>${label(r)}</span></div></div></article>`;}).join('');
 scene.innerHTML=`<header class="ra-header"><div><small>MEMBER AUDITION</small><h2 id="ra-title">${many?'十份邀请，一起登台':'下一位，准备登台'}</h2></div><button type="button" class="btn ghost small ra-skip">跳过动画</button></header><div class="ra-stage"><div class="ra-lamps" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="ra-light" aria-hidden="true"></div><div class="ra-sparkles" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i style="--spark:${i}">✦</i>`).join('')}</div><div class="ra-cards">${cards}</div><div class="ra-curtain ra-left" aria-hidden="true"></div><div class="ra-curtain ra-right" aria-hidden="true"></div><div class="ra-ticket" aria-hidden="true"><small>LIVE HOUSE</small><canvas width="64" height="64" data-icon="ticket"></canvas><b>招募邀请</b><span>${many?'10 MEMBERS':'1 MEMBER'}</span><i></i></div></div><footer class="ra-footer"><div class="ra-progress"><span class="ra-status" role="status" aria-live="polite">演出邀请已送达…</span><b class="ra-count">0 / ${results.length}</b></div><button type="button" class="btn pink wide ra-next" disabled>等待成员登台</button><small>招募已结算</small></footer>`;
 const game=document.getElementById('game');restoreInert=Array.from(game.children,el=>[el,el.inert]);restoreInert.forEach(([el])=>{el.inert=true;});game.append(scene);
 scene.querySelector('.ra-skip').onclick=finish;scene.querySelector('.ra-next').onclick=()=>{if(done)finish();};
 scene.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();finish();}
  else if(event.key==='Tab'){event.preventDefault();const buttons=[scene.querySelector('.ra-skip'),scene.querySelector('.ra-next')].filter(el=>!el.disabled);buttons[(buttons.indexOf(document.activeElement)+1)%buttons.length].focus();}
  else if(event.code==='Space'||event.key==='Enter'){event.preventDefault();event.stopPropagation();if(done)finish();else revealAll();}
 });
 draw?.(scene);scene.querySelector('.ra-skip').focus();
 if(reduced){scene.classList.add('ra-reduced');revealAll();return true;}
 later(()=>{scene.classList.add('ra-open');scene.querySelector('.ra-status').textContent=many?'成员陆续登台…':'聚光灯亮起…';tone?.(440,.09);},800);
 const elements=Array.from(scene.querySelectorAll('.ra-card'));
 elements.forEach((el,i)=>later(()=>{el.classList.add('ra-revealed');el.setAttribute('aria-hidden','false');scene.querySelector('.ra-count').textContent=(i+1)+' / '+results.length;tone?.((results[i].kind==='new'?660:440)+(i%5)*55,.06);},1150+i*190));
 later(showComplete,1150+(results.length-1)*190+600);
 return true;
}
window.RecruitAnimation={play,finish,get active(){return !!scene;}};
})();
