import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');assert(!/__ASSETS__|__STYLE__|__UI__/.test(html));assert(!html.includes('data:image/png;base64,'));
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g))assert(fs.existsSync(path.join(dist,m[1].split('?')[0])),m[1]);
const assets=JSON.parse(fs.readFileSync(path.join(dist,'assets/characters.json'),'utf8'));assert.equal(Object.keys(assets.characters).length,69);for(const c of Object.values(assets.characters))assert(fs.existsSync(path.join(dist,c.body)));
for(const name of ['ui.js','engine.js','data.js','web-platform.js','web-boot.js','art.js','assets.js'])new Function(fs.readFileSync(path.join(dist,name),'utf8'));
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g))assert(!m[1].startsWith('/'),'Use relative paths for GitHub Pages: '+m[1]);
assert(fs.existsSync(path.join(dist,'.nojekyll')));assert(fs.existsSync(path.join(root,'.github/workflows/pages.yml')));console.log('Static build checked: 69 sprites, scripts, links and GitHub Pages paths');
