(()=>{
const loading=document.getElementById('web-loading'),status=document.getElementById('web-load-status'),progress=document.getElementById('web-load-progress');
function fail(message){status.textContent=message;status.className='boot-error';document.getElementById('web-retry').hidden=false;}
window.addEventListener('error',e=>{if(e.filename)fail('加载遇到了问题，请刷新后再试。');});
const timer=setInterval(()=>{progress.value=PixelArt.progress?.loaded||0;progress.max=PixelArt.progress?.total||69;status.textContent='正在准备角色与舞台 '+progress.value+' / '+progress.max;if(PixelArt.progress?.failed.length){clearInterval(timer);fail('部分角色加载失败，请检查网络后重试。');}else if(DesktopGame.isReady()&&(WebPlatform.active||WebPlatform.locked)){clearInterval(timer);loading.hidden=true;}},100);
setTimeout(()=>{if(!loading.hidden)fail('还在加载中，可以稍等片刻，或检查网络后重试。');},30000);
})();
