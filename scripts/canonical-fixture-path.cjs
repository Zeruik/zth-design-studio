'use strict';
const fs=require('node:fs'),path=require('node:path');
// Resolve existing ancestor aliases (including Windows 8.3 names), then append
// the still-missing suffix without creating the proposed installation target.
module.exports=function canonicalFixturePath(value){
 let current=path.resolve(value);const suffix=[];
 for(;;){
  try{return path.join(fs.realpathSync.native(current),...suffix);}
  catch(error){if(error.code!=='ENOENT')throw error;const parent=path.dirname(current);if(parent===current)throw error;suffix.unshift(path.basename(current));current=parent;}
 }
};
