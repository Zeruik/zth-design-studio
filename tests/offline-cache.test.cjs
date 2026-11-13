'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
test('offline install works when directory listing is disabled and navigation falls back to the cached entry', async () => {
  const handlers = {}, cached = new Set();
  let keys = [];
  const context = {
    URL, fetch:async () => {throw Error('offline');},
    self:{location:{origin:'https://example.test'},addEventListener:(n,f)=>handlers[n]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}}},
    caches:{open:async()=>({addAll:async files=>{assert.ok(!files.includes('./'),'directory URL need not serve an index');files.forEach(f=>cached.add(f));}}),keys:async()=>keys,delete:async()=>{},match:async value=>cached.has(value)?{body:value}:undefined}
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../app/sw.js'),'utf8'),context);
  let work;
  handlers.install({waitUntil:p=>work=p});await work;
  for(const file of ['./index.html','./legal-data.js','./legal/PRIVACY.txt'])assert.ok(cached.has(file));
  handlers.fetch({request:{method:'GET',url:'https://example.test/app/',mode:'navigate'},respondWith:p=>work=p});
  assert.equal((await work).body,'./index.html');
  handlers.fetch({request:{method:'GET',url:'https://example.test/app/missing.png',mode:'no-cors'},respondWith:p=>work=p});
  assert.equal(await work,undefined,'missing resources must not receive HTML');
});
