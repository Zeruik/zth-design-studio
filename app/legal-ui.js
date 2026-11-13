'use strict';
(() => {
  const documents = window.ZTH_LEGAL_DOCUMENTS;
  const about = document.querySelector('[data-settings-panel="about"]');
  if (!about || !documents?.length) return;
  const entry = document.createElement('button');
  entry.type = 'button';
  entry.id = 'legalNoticesBtn';
  entry.textContent = '许可与隐私 / Licenses & privacy';
  about.append(entry);

  const dialog = document.createElement('dialog');
  dialog.id = 'legalDialog';
  dialog.className = 'legal-dialog';
  dialog.setAttribute('aria-labelledby', 'legalTitle');
  dialog.innerHTML = '<div class="dialog-title"><div><small>ZTH DESIGN STUDIO</small><h2 id="legalTitle">许可与隐私 / Licenses & privacy</h2></div><button type="button" aria-label="关闭许可与隐私 / Close" autofocus>×</button></div><p class="muted">这些说明随应用保存在本机，可离线阅读。</p><label class="legal-selector">阅读内容 / Document<select id="legalDocument"></select></label><pre id="legalText" tabindex="0" aria-label="许可正文 / Document text"></pre>';
  const select = dialog.querySelector('select');
  const content = dialog.querySelector('pre');
  documents.forEach(doc => {
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = doc.title;
    select.append(option);
  });
  function showDocument() {
    content.textContent = documents.find(doc => doc.id === select.value).text;
    content.scrollTop = 0;
  }
  select.addEventListener('change', showDocument);
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  document.body.append(dialog);
  showDocument();
  entry.addEventListener('click', () => dialog.showModal());
})();
