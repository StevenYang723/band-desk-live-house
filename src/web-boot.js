(()=>{
'use strict';
const loading=document.getElementById('web-loading'),status=document.getElementById('web-load-status'),progress=document.getElementById('web-load-progress'),retry=document.getElementById('web-retry');
const later=document.createElement('button');later.className='btn ghost wide';later.textContent='先进入游戏，立绘继续加载';later.hidden=true;retry.after(later);
const warning=document.createElement('aside');warning.id='web-art-warning';warning.hidden=true;warning.setAttribute('role','status');
const detail=document.createElement('span'),retryArt=document.createElement('button');retryArt.className='btn small';retryArt.textContent='重试立绘';warning.append(detail,retryArt);document.body.append(warning);
let fatal=false,slow=false,lastRevision=-1;
function fail(message){fatal=true;status.textContent=message;status.className='boot-error';retry.textContent='重新加载';retry.hidden=false;later.hidden=true;}
function coreReady(){return window.DesktopGame&&(window.WebPlatform?.active||window.WebPlatform?.locked);}
function retryImages(){window.PixelArt?.retry();update();}
// Retry images in place: retain downloaded sprites, current progress and saves.
retry.removeAttribute('data-web-action');retry.onclick=()=>{if(fatal)location.reload();else retryImages();};
retryArt.onclick=retryImages;later.onclick=()=>{if(coreReady()){loading.hidden=true;update();}};
window.addEventListener('error',e=>{if(e.filename&&!loading.hidden)fail('游戏程序未能启动，请重新加载。');});
function update(){
 const art=window.PixelArt,p=art?.progress;
 if(!p){if(slow)fail('游戏资源尚未载入，请重新加载。');return;}
 if(slow&&(!window.DesktopGame||!window.WebPlatform))fail('游戏程序未能载入，请重新加载。');
 progress.value=p.loaded;progress.max=p.total;
 if(!fatal){
  status.className='';status.textContent='正在准备角色与舞台 '+p.loaded+' / '+p.total+(p.failed.length?' · 正在尝试恢复立绘':'');
  retry.textContent='重试未加载的立绘';retry.hidden=p.loading||!p.failed.length;
  later.hidden=!slow||!coreReady();
  // A missing optional sprite must never permanently block the whole game.
  if(coreReady()&&art.isReady())loading.hidden=true;
 }
 warning.hidden=!loading.hidden||!coreReady()||window.WebPlatform?.locked||p.loaded===p.total;
 if(!warning.hidden){detail.textContent=p.loading?'角色立绘加载中 '+p.loaded+' / '+p.total:'还有 '+(p.total-p.loaded)+' 位成员的立绘待加载';retryArt.hidden=p.loading;}
 if(p.revision!==lastRevision){lastRevision=p.revision;window.DesktopGame?.refreshArt();}
}
setInterval(update,250);setTimeout(()=>{slow=true;update();},8000);update();
})();
