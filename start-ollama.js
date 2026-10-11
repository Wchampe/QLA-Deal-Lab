'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process');
const {BASE_URL}=require('./ollama-client');
async function connected(){try{return (await fetch(BASE_URL+'/api/tags',{signal:AbortSignal.timeout(1500)})).ok;}catch{return false;}}
async function launch(binary,logDir){
 const stdout=path.join(logDir,'ollama-stdout.log'),stderr=path.join(logDir,'ollama-stderr.log');
 const env={...process.env,OLLAMA_HOST:'127.0.0.1:11434'};
 if(process.platform==='win32'){
  // A detached/console-less Ollama makes its GPU probes and model runners open
  // their own visible consoles. Give Ollama a hidden console they can inherit.
  // Pass paths as environment values, never interpolate them into shell code.
  const code="$ErrorActionPreference='Stop'; Start-Process -FilePath $env:QLA_OLLAMA_BINARY -ArgumentList 'serve' -WindowStyle Hidden -RedirectStandardOutput $env:QLA_OLLAMA_STDOUT -RedirectStandardError $env:QLA_OLLAMA_STDERR";
  const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',code],{
   // Inherited pipe handles would keep spawnSync waiting for Ollama to exit.
   windowsHide:true,stdio:'ignore',timeout:15000,
   env:{...env,QLA_OLLAMA_BINARY:binary,QLA_OLLAMA_STDOUT:stdout,QLA_OLLAMA_STDERR:stderr}
  });
  if(result.error||result.status!==0)throw Error('Could not start hidden Ollama. Check that Ollama is installed and the private log folder is writable.');
  return ()=>true; // Readiness is checked through Ollama's local API below.
 }
 const out=fs.openSync(stdout,'a'),err=fs.openSync(stderr,'a');
 let child;
 try{
  child=spawn(binary,['serve'],{detached:true,env,stdio:['ignore',out,err]});
  await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
  child.unref();
 }finally{fs.closeSync(out);fs.closeSync(err);}
 return ()=>child.exitCode===null;
}
async function start(){
 if(await connected()){console.log('Ollama connected.');return;}
 const installed=path.join(process.env.LOCALAPPDATA||'','Programs','Ollama','ollama.exe');
 const binary=fs.existsSync(installed)?installed:'ollama';
 const logDir=path.join(__dirname,'private');fs.mkdirSync(logDir,{recursive:true});
 const running=await launch(binary,logDir);
 for(let attempt=0;attempt<20;attempt++){
  if(await connected()){console.log('Ollama started. Models: '+(process.env.OLLAMA_MODELS||'default Ollama folder'));return;}
  if(!running())break;
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 throw Error('Ollama did not become ready. Check private/ollama-stderr.log, then use Refresh models in the app.');
}
start().catch(error=>{console.error('Local AI startup: '+error.message);console.error('The workbench will still open for offline tools.');process.exitCode=1;});
