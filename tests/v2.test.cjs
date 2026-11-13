'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const colors = require('../app/color-tools.js');
const { templates } = require('../app/templates.js');

test('custom colors accept RGB endpoints and hexadecimal input without accepting invalid channels', () => {
  assert.equal(colors.normalize('  #A1b2C3  '), '#a1b2c3');
  assert.equal(colors.normalize('00FF80'), '#00ff80');
  assert.equal(colors.fromRGB(['0', '128', '255']), '#0080ff');
  assert.equal(colors.fromRGB([255, 0, 0]), '#ff0000');
  for (const value of ['#fff', '#11223344', '#12345g', '', 'red']) {
    assert.equal(colors.normalize(value), null, value);
  }
  for (const channels of [['', 2, 3], [' ', 2, 3], [-1, 2, 3], [256, 2, 3], [1.5, 2, 3], ['NaN', 2, 3], [1, 2], [1, 2, 3, 4]]) {
    assert.equal(colors.fromRGB(channels), null, JSON.stringify(channels));
  }
});

test('recent colors retain five choices and move reused colors to the front without mutation', () => {
  let history = [];
  const choices = ['#010101', '#020202', '#030303', '#040404', '#050505', '#060606'];
  for (const color of choices) history = colors.recent(history, color);
  assert.deepEqual(history, choices.slice(1).reverse());
  const before = [...history];
  assert.deepEqual(colors.recent(history, '#030303'), ['#030303', '#060606', '#050505', '#040404', '#020202']);
  assert.deepEqual(history, before);
});

test('editing a template scene never changes its original or another copy', () => {
  for (const template of templates) {
    const original = template.build();
    const expected = JSON.stringify(original);
    const copy = template.build();
    copy.width = 777;
    copy.background = '#123456';
    if (copy.objects.length) {
      copy.objects[0].left = 999;
      copy.objects[0].text = 'User artwork';
      if (copy.objects[0].children?.length) copy.objects[0].children[0].fill = '#ff0000';
    }
    copy.objects.push({ kind: 'text', text: 'Personal element' });
    assert.equal(JSON.stringify(original), expected, `${template.id}: copies must not share objects`);
    assert.equal(JSON.stringify(template.build()), expected, `${template.id}: original must remain repeatable`);
  }
});

function project(id, name, at = '2026-11-13T08:00:00.000Z') {
  return {
    format: 'zthpmsj', schema: 1, workId: id, name, savedAt: at, activePage: 0,
    pages: [{ width: 1080, height: 1440, canvas: { objects: [{ type: 'Textbox', text: name }] } }],
    fonts: [{ family: 'ZTH Sans', src: 'data:font/woff2;base64,AABBCC' }]
  };
}

// The editor's persistence boundary is emulated here. Browser QA separately checks
// actual IndexedDB and page reloads; these checks target save ordering and isolation.
function historyFixture(initial = project('work-a', 'First artwork'),cryptoRuntime=webcrypto) {
  const copy = value => value === undefined ? undefined : structuredClone(value);
  const database = new Map();
  const elements = new Map();
  const messages = [];
  let current = copy(initial);
  let failureKey,blockedWrite;
  const element = () => ({
    children: [], value: '', textContent: '',
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    addEventListener() {}, showModal() {}, close() {}
  });
  const document = {
    body: { classList: { remove() {} } },
    getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
    createElement: element
  };
  const editor = {
    canvas: { getWidth: () => 1080, toDataURL: () => 'data:image/png;base64,thumbnail' },
    getProject: () => ({...current, name:document.getElementById('projectName').value}),
    dbGet: async key => copy(database.get(key)),
    dbPut: async (key, value) => {
      if (key === failureKey) { failureKey = undefined; throw Error('Simulated storage failure'); }
      if(key===blockedWrite?.key){const gate=blockedWrite;blockedWrite=undefined;gate.started();await gate.released;}
      database.set(key, copy(value));
    },
    loadProject: async doc => { current = copy(doc); document.getElementById('projectName').value=current.name; },
    download: async () => {},
    changed() {},
    toast: message => messages.push(message)
  };
  document.getElementById('projectName').value=current.name;
  const context = vm.createContext({
    ZTH_EDITOR: editor, document, window: {}, crypto: cryptoRuntime, TextEncoder, Blob
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../app/works.js'), 'utf8'), context, { filename: 'works.js' });
  return {
    api: context.window.ZTH_WORKS, database, messages, elements,
    setProject: doc => { current = copy(doc); document.getElementById('projectName').value=current.name; },
    getProject: () => copy(current),
    failNextWrite: key => { failureKey = key; },
    blockNextWrite(key) {
      let started,release;
      const entered=new Promise(resolve=>{started=resolve;}),released=new Promise(resolve=>{release=resolve;});
      blockedWrite={key,started,released};return {entered,release};
    }
  };
}

test('queued saves capture each artwork before the active canvas changes and share embedded fonts', async () => {
  const fixture = historyFixture();
  const before = fixture.getProject();
  const saveA = fixture.api.save(true);
  fixture.setProject(project('work-b', 'Second artwork', '2026-11-13T08:01:00.000Z'));
  const saveB = fixture.api.save(true);
  await Promise.all([saveA, saveB]);
  const a = fixture.database.get('work:work-a');
  const b = fixture.database.get('work:work-b');
  assert.equal(a.document.pages[0].canvas.objects[0].text, 'First artwork');
  assert.equal(b.document.pages[0].canvas.objects[0].text, 'Second artwork');
  assert.deepEqual(fixture.database.get('works-index').map(item => item.id), ['work-b', 'work-a']);
  assert.equal(a.document.fontKey, b.document.fontKey);
  assert.equal([...fixture.database.keys()].filter(key => key.startsWith('font:')).length, 1);
  assert.equal(a.document.fonts, undefined);
  assert.ok(before.fonts[0].src, 'compacting history must not remove the editor font');
  assert.equal(fixture.database.get('autosave').workId,'work-b','the last queued artwork is the reload target');
});

test('saving from the works dialog reads its current name even without a blur event', async () => {
  const fixture = historyFixture();
  fixture.elements.get('workName').value='  Renamed without blur  ';
  await fixture.elements.get('saveLocalWork').onclick();
  assert.equal(fixture.elements.get('projectName').value, 'Renamed without blur');
  assert.equal(fixture.database.get('work:work-a').document.name, 'Renamed without blur');
  assert.equal(fixture.database.get('works-index')[0].name, 'Renamed without blur');
  assert.equal(fixture.database.get('autosave').name,'Renamed without blur','manual save resolves only after its startup snapshot is written');
});

test('restoring a saved artwork preserves the outgoing document and its font', async () => {
  const fixture = historyFixture();
  await fixture.api.save(true);
  const saved = fixture.database.get('work:work-a').document;
  fixture.setProject(project('work-b', 'Unsaved current canvas'));
  await fixture.api.openDocument(saved);
  assert.equal(fixture.getProject().workId, 'work-a');
  assert.equal(fixture.getProject().fonts[0].src, 'data:font/woff2;base64,AABBCC');
  assert.equal(fixture.database.get('work:work-b').document.name, 'Unsaved current canvas');
  assert.equal(fixture.database.get('work:work-b').revisions.length, 1);
  assert.equal(fixture.database.get('work:work-a').revisions.length, 1);
  const reloaded=fixture.database.get('autosave');
  assert.equal(reloaded.workId,'work-a','immediate reload restores the selected artwork without a debounce');
  assert.equal(reloaded.pages[0].canvas.objects[0].text,'First artwork');
  assert.equal(reloaded.fonts[0].src,'data:font/woff2;base64,AABBCC');
});

test('manual history retains ten independent checkpoints while autosave keeps the current draft', async () => {
  const fixture = historyFixture();
  for (let version = 0; version < 12; version++) {
    fixture.setProject(project('work-a', `Version ${version}`, `2026-11-13T08:${String(version).padStart(2, '0')}:00.000Z`));
    await fixture.api.save(true);
  }
  fixture.setProject(project('work-a', 'Latest draft'));
  await fixture.api.save();
  const item = fixture.database.get('work:work-a');
  assert.equal(item.document.name, 'Latest draft');
  assert.equal(item.revisions.length, 10);
  assert.equal(item.revisions[0].document.name, 'Version 11');
  assert.equal(item.revisions[9].document.name, 'Version 2');
  assert.equal(fixture.database.get('works-index').length, 1);
});

test('a rejected storage write does not poison later saves or replace another artwork', async () => {
  const fixture = historyFixture();
  await fixture.api.save(true);
  fixture.setProject(project('work-b', 'Retry artwork'));
  fixture.failNextWrite('work:work-b');
  await assert.rejects(fixture.api.save(true), /Simulated storage failure/);
  assert.equal(fixture.database.get('works-index').length, 1);
  assert.equal(fixture.database.get('work:work-a').document.name, 'First artwork');
  await fixture.api.save(true);
  assert.equal(fixture.database.get('work:work-b').document.name, 'Retry artwork');
  assert.equal(fixture.database.get('work:work-b').revisions.length, 1);
  assert.equal(fixture.database.get('works-index').length, 2);
});

test('an old queued checkpoint cannot overwrite the reload target after the canvas switches',async()=>{
  const fixture=historyFixture();await fixture.api.save(true);
  const gate=fixture.blockNextWrite('work:work-a'),oldSave=fixture.api.save(true);
  await gate.entered;
  const newArtwork=project('work-b','New active artwork');fixture.setProject(newArtwork);
  fixture.database.set('autosave',structuredClone(newArtwork));
  gate.release();await oldSave;
  assert.equal(fixture.database.get('autosave').workId,'work-b');
  assert.equal(fixture.database.get('work:work-a').revisions.length,2,'the old checkpoint remains in history');
});

test('edits made during a pending checkpoint remain the reload target while the checkpoint stays immutable',async()=>{
  const fixture=historyFixture();
  const gate=fixture.blockNextWrite('work:work-a'),save=fixture.api.save(true);await gate.entered;
  fixture.setProject(project('work-a','Edited while saving'));
  gate.release();await save;
  assert.equal(fixture.database.get('work:work-a').revisions[0].document.name,'First artwork');
  assert.equal(fixture.database.get('autosave').name,'Edited while saving');
  assert.equal(fixture.database.get('autosave').pages[0].canvas.objects[0].text,'Edited while saving');
});

test('failure to persist the reload snapshot rejects saving and the next retry recovers',async()=>{
  const fixture=historyFixture();fixture.failNextWrite('autosave');
  await assert.rejects(fixture.api.save(true),/Simulated storage failure/);
  assert.equal(fixture.database.has('autosave'),false);
  await fixture.api.save(true);
  assert.equal(fixture.database.get('autosave').workId,'work-a');
});

test('native schemes without Web Crypto retain embedded fonts and can save and restore history',async()=>{
  for(const cryptoRuntime of [{},null,{subtle:{digest:async()=>{throw Error('Crypto unavailable for this scheme');}}}]){
    const fixture=historyFixture(project('work-a','Native artwork'),cryptoRuntime);
    await fixture.api.save(true);
    const saved=fixture.database.get('work:work-a').document;
    assert.equal(saved.fontKey,undefined);
    assert.equal(saved.fonts[0].src,'data:font/woff2;base64,AABBCC');
    fixture.setProject(project('work-b','Another artwork'));
    await fixture.api.openDocument(saved);
    assert.equal(fixture.getProject().workId,'work-a');
    assert.equal(fixture.database.get('autosave').fonts[0].src,'data:font/woff2;base64,AABBCC');
    assert.equal([...fixture.database.keys()].filter(key=>key.startsWith('font:')).length,0);
  }
});
