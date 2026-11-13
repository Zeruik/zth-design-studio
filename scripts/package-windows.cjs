// Windows scanners can briefly hold a newly renamed large executable open.
// Retry only the packaging-time ASAR integrity write on an open/sharing error;
// never disable integrity validation or change Windows security settings.
const integrity = require('app-builder-lib/out/electron/electronWin.js');
const original = integrity.addWinAsarIntegrity;
integrity.addWinAsarIntegrity = async (...args) => {
  for (let attempt = 0; ; attempt++) {
    try { return await original(...args); }
    catch (error) {
      if (attempt >= 10 || error.syscall !== 'open' || !['UNKNOWN', 'EBUSY', 'EPERM', 'EACCES'].includes(error.code)) throw error;
      if (attempt === 0) console.log('Waiting for the temporary Windows executable sharing lock…');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};
const { build, Platform, Arch } = require('electron-builder');
build({ targets: Platform.WINDOWS.createTarget(['dir'], Arch.x64), publish: 'never' })
  .catch(error => { console.error(error); process.exitCode = 1; });
