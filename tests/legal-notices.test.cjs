'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
test('every package receives the same complete original legal notices', () => {
  execFileSync(process.execPath, ['scripts/sync-legal.cjs', '--check'], {cwd:root, windowsHide:true});
  const context = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'app/legal-data.js'),'utf8'),context);
  const docs = context.window.ZTH_LEGAL_DOCUMENTS;
  assert.equal(docs.length,4);
  for(const doc of docs) assert.equal(doc.text,fs.readFileSync(path.join(root,'app/legal',doc.file),'utf8').replace(/\r\n/g,'\n'));
  assert.equal(docs[2].text,fs.readFileSync(path.join(root,'LICENSE'),'utf8').replace(/\r\n/g,'\n'));
  const notices = docs[3].text;
  for(const folder of ['app/vendor/licenses','app/assets/fonts']) for(const name of fs.readdirSync(path.join(root,folder))) {
    if(!name.endsWith('.txt'))continue;
    assert.ok(notices.includes(fs.readFileSync(path.join(root,folder,name),'utf8').replace(/\r\n/g,'\n')),name);
  }
});
test('legal viewer and raw notice copies are available in the offline cache', () => {
  const worker = fs.readFileSync(path.join(root,'app/sw.js'),'utf8');
  const index = fs.readFileSync(path.join(root,'app/index.html'),'utf8');
  for(const file of ['legal-data.js','legal-ui.js','legal.css',...fs.readdirSync(path.join(root,'app/legal')).map(n=>'legal/'+n)]) assert.ok(worker.includes("'./"+file+"'"),file);
  for(const file of ['legal-data.js','legal-ui.js','legal.css']) assert.ok(index.includes('"'+file+'"'),file);
});
