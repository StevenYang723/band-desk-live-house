/* Browser lifecycle, local saves and portable save files. No server-side player data. */
(()=>{
'use strict';
const KEY='band-desk-v2',BACKUP=KEY+'-backup',LEASE=KEY+'-active-tab';
const tabId=crypto.randomUUID?.()||String(Date.now())+Math.random();
let api=null,active=false,locked=false,lastAt=Date.now(),awaySince=0,pendingImport=null,storageOK=true,fallbackLease=false;
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Math.floor(n).toLocaleString('zh-CN');
function read(key){try{return localStorage.getItem(key);}catch{storageOK=false;return null;}}
function write(key,value){try{localStorage.setItem(key,value);return true;}catch{storageOK=false;return false;}}
function decode(raw){let s=typeof raw==='string'?JSON.parse(raw):raw;if(s&&typeof s.Payload==='string')s=JSON.parse(s.Payload);const probe=new GameEngine();if(!probe.restore(s,false))throw Error('这不是有效的桌角 Live House 存档。');return s;}
function owns(){if(!active)return false;if(fallbackLease&&storageOK&&read(LEASE)!==tabId){block();return false;}return true;}
function persist(){if(!api||!owns()||!api.E.s.started)return false;const old=read(KEY);if(old){try{decode(old);if(!write(BACKUP,old))throw Error('backup');}catch{}}
 const snapshot=api.E.snapshot();if(awaySince)snapshot.savedAt=awaySince;const ok=write(KEY,JSON.stringify(snapshot));api.setSaveStatus(ok);return ok;
}
function block(){active=false;locked=true;document.getElementById('web-tab-warning').hidden=false;document.getElementById('web-loading').hidden=true;document.getElementById('game').inert=true;}
function initialize(){let message='';const original=read(KEY),backup=read(BACKUP);for(const raw of [original,backup]){if(!raw)continue;try{const s=decode(raw);if(!api.E.restore(s))throw Error('restore');if(raw!==original)message='已从上一份备份恢复进度';break;}catch{message='存档无法读取，可以在存档管理中导入备份';}}
 active=true;lastAt=Date.now();awaySince=document.hidden?lastAt:0;api.refresh();if(message)api.notice(message,6);if(!storageOK)api.notice('浏览器无法保存进度，请在离开前导出存档。',8);if(api.E.s.started)persist();
}
function connect(callbacks){api=callbacks;try{const k=KEY+'-probe';localStorage.setItem(k,'1');localStorage.removeItem(k);}catch{storageOK=false;}
 if(navigator.locks){navigator.locks.request('band-desk-live-house-save',{ifAvailable:true},async lock=>{if(!lock){block();return;}initialize();await new Promise(()=>{});}).catch(()=>claimFallback());}else claimFallback();
 setInterval(()=>{if(active&&!document.hidden)persist();},5000);
 document.addEventListener('visibilitychange',()=>document.hidden?suspend():resume());window.addEventListener('pagehide',suspend);window.addEventListener('pageshow',e=>{if(e.persisted)resume();});window.addEventListener('beforeunload',()=>persist());
 window.addEventListener('storage',e=>{if(fallbackLease&&e.key===LEASE&&e.newValue!==tabId)block();});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-web-action]');if(!b||b.disabled)return;const a=b.dataset.webAction;if(a==='export')exportSave();if(a==='import')document.getElementById('web-save-file').click();if(a==='confirm-import')confirmImport();if(a==='cancel-import'){pendingImport=null;api.open('websave');}if(a==='fullscreen')fullscreen();if(a==='reload')location.reload();});
 document.getElementById('web-save-file').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>2*1024*1024)throw Error('存档文件不能超过 2 MB。');prepareImport(await file.text());}catch(err){api.notice(err.message||'无法读取这个存档。',6);}});
}
function claimFallback(){fallbackLease=true;write(LEASE,tabId);initialize();}
function settle(since,now=Date.now()){const e=api.E,seconds=Math.max(0,(now-since)/1000);if(!e.s.auto||e.s.paused||!e.s.started)return;
 if(seconds>=60){e.offline=null;e.offlineCredit(since);api.refresh();}else if(seconds>0){e.advance(seconds);api.refresh();}
}
function suspend(){if(!owns()||awaySince)return;awaySince=Date.now();lastAt=awaySince;persist();api.setBackground(true);}
function resume(){if(!owns())return;const now=Date.now(),since=awaySince||lastAt;awaySince=0;settle(since,now);lastAt=now;api.setBackground(false);persist();}
function tick(){if(!api||!owns()||document.hidden)return;const now=Date.now(),gap=Math.max(0,(now-lastAt)/1000);if(gap>5)settle(lastAt,now);else api.E.advance(gap);lastAt=now;}
function saveText(){return JSON.stringify(api.E.snapshot(),null,2);}
function exportSave(){if(!owns())return;persist();const a=document.createElement('a'),url=URL.createObjectURL(new Blob([saveText()],{type:'application/json'}));a.href=url;a.download='BandDesk-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);api.notice('存档已导出，可以用它在另一台设备继续玩。',4);}
function prepareImport(raw){if(!owns())return false;const s=decode(raw),probe=new GameEngine();if(!probe.restore(s))throw Error('这个存档包含无法读取的数据。');pendingImport=probe.snapshot();api.open('websave');return true;}
function confirmImport(){if(!pendingImport||!owns())return false;const before=api.E.snapshot();if(!api.E.restore(pendingImport,false))return false;write(KEY+'-before-import',JSON.stringify(before));pendingImport=null;lastAt=Date.now();api.refresh();persist();api.open('websave');api.notice('已导入存档，原进度保留了一份本地备份。',5);return true;}
function panelHtml(){const s=api.E.s;if(pendingImport)return `<div class="panel-card"><h3>导入这份存档？</h3><p>将替换当前浏览器里的进度。你也可以先导出当前存档。</p><div class="statrow"><span>成员 / 已完成演出</span><b>${pendingImport.owned.length} 位 / ${pendingImport.shows} 场</b></div><div class="statrow"><span>金币 / 皮肤币</span><b>${money(pendingImport.coins)} / ${money(pendingImport.skinTokens)}</b></div></div><div class="row"><button class="btn pink grow" data-web-action="confirm-import">导入并继续</button><button class="btn ghost grow" data-web-action="cancel-import">取消</button></div><div class="spacer"></div><button class="btn ghost wide" data-web-action="export">先导出当前进度</button>`;
 return `<div class="panel-card"><h3>进度保存在这台设备</h3><p>每 5 秒、重要操作后和离开页面时自动保存。换浏览器、清除网站数据或使用无痕模式时，请先导出存档。本站不上传你的游戏进度，也不自动跨设备同步。</p><div class="statrow"><span>成员 / 演出</span><b>${s.owned.length} / ${s.shows} 场</b></div><div class="statrow"><span>皮肤币</span><b>${money(s.skinTokens)}</b></div></div><div class="row"><button class="btn pink grow" data-web-action="export">导出存档</button><button class="btn grow" data-web-action="import">导入存档</button></div><p class="feature-note">支持网页版导出的 JSON，也兼容桌面版的 save.json。存档只在当前设备读取。</p><div class="panel-card"><h3>切到后台之后</h3><p>自动模式下，返回页面时会结算离开期间的收益。同一舞台完成至少 3 场、最佳评价达到 A 后开启离线结算，初始每天 6 小时，每级增加 3 小时，最多每天 24 小时。北京时间 0 点刷新，重复离线共用当天剩余额度，最多补算最近 24 小时。暂停和手动模式不结算离线收益。</p></div><div class="panel-card"><h3>手机与电脑都能玩</h3><p>手机竖屏直接游玩；电脑可拖小浏览器窗口放在桌角。窗口置顶请使用桌面版。键盘 1–5 放技能，空格安可。</p></div><p class="feature-note">BanG Dream! 非官方同人小游戏。角色及企划相关权利属于原权利方。</p>`;
}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else api.notice('这个浏览器不支持全屏，可使用浏览器菜单。');}catch{api.notice('可以通过浏览器菜单进入全屏。');}}
function command(type){if(type==='save')persist();if(type==='pin')fullscreen();if(type==='close'){persist();pendingImport=null;api.open('websave');}}
window.WebPlatform={connect,tick,persist,command,panelHtml,saveText,prepareImport,confirmImport,suspend,resume,get active(){return active},get locked(){return locked}};
})();
