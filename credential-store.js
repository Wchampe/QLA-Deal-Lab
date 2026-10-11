 'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
function transform(input,decrypt=false){
 if(process.platform!=='win32')throw Error('Local encrypted key storage requires Windows; use the BRAVE_API_KEY environment variable.');
 const code=decrypt?"$ErrorActionPreference='Stop'; $s=ConvertTo-SecureString ([Console]::In.ReadToEnd()); [Console]::Write(([System.Net.NetworkCredential]::new('', $s)).Password)":"$ErrorActionPreference='Stop'; $s=ConvertTo-SecureString -String ([Console]::In.ReadToEnd()) -AsPlainText -Force; [Console]::Write((ConvertFrom-SecureString $s))";
 const r=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',code],{input,encoding:'utf8',windowsHide:true,timeout:15000,maxBuffer:65536});
 if(r.error||r.status!==0||!r.stdout.trim())throw Error('Windows could not access encrypted search credentials. Re-enter the key under this Windows account.');return r.stdout.trim();
}
function createStore(file=path.join(__dirname,'private','brave-key.dpapi')){let cached,loadError='';return {
 get(){const env=process.env.BRAVE_API_KEY||process.env.BRAVE_SEARCH_API_KEY;if(env)return env.trim();if(cached!==undefined)return cached;try{cached=fs.existsSync(file)?transform(fs.readFileSync(file,'utf8'),true):'';}catch{loadError='Saved search key could not be decrypted. Re-enter it on this computer.';cached='';}return cached;},
 status(){return {configured:!!this.get(),storage:process.env.BRAVE_API_KEY||process.env.BRAVE_SEARCH_API_KEY?'environment':'Windows encrypted local file',error:loadError};},
 save(key){if(typeof key!=='string'||!/^[A-Za-z0-9_\-]{10,300}$/.test(key.trim()))throw Error('Enter a valid Brave API key.');const value=key.trim(),encrypted=transform(value);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',encrypted,{mode:0o600});fs.renameSync(file+'.tmp',file);cached=value;loadError='';return {configured:true};}
 };}
module.exports={createStore};
