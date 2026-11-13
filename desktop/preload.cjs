const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('zthDesktop',{ready:()=>ipcRenderer.send('zth:ready'),font:name=>ipcRenderer.invoke('zth:font',name),onProject:cb=>ipcRenderer.on('zth:project',(_,text)=>cb(text)),save:p=>ipcRenderer.invoke('zth:save',p),environment:()=>ipcRenderer.invoke('zth:environment')});
