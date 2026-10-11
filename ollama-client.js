'use strict';
const fs=require('node:fs'),path=require('node:path');
const BASE_URL='http://127.0.0.1:11434',DEFAULT_MODEL='qwen38-local:latest';
// R1 always reasons before its answer; reserve space for both within the context window.
function predictionLimit(model,answerTokens){return /(?:^|\/)deepseek-r1(?::|$)/i.test(model)?Math.max(4096,answerTokens*3):answerTokens;}
function createClient({fetch:fetchImpl,model,configFile=path.join(__dirname,'private','ollama.json')}={}){
 let selected='';
 try{const saved=JSON.parse(fs.readFileSync(configFile,'utf8'));if(typeof saved.model==='string')selected=saved.model.trim();}catch{}
 // An explicit startup setting overrides the saved preference until the user selects another model.
 selected=(model??process.env.QLA_MODEL)?.trim()||selected;
 async function status(){
  const result={connected:false,ready:false,model:selected,models:[],error:''};
  if(process.env.QLA_DISABLE_OLLAMA==='1'){
   result.error='Local Ollama is disabled for this hosted service.';
   return result;
  }
  try{
   const response=await (fetchImpl||globalThis.fetch)(BASE_URL+'/api/tags',{signal:AbortSignal.timeout(3000)});
   if(!response.ok){result.error='Ollama returned HTTP '+response.status+'. Restart Ollama, then refresh models.';return result;}
   const body=await response.json();
   if(!Array.isArray(body.models))throw Error('Invalid model list');
   result.connected=true;
   result.models=[...new Map(body.models.filter(m=>typeof m?.name==='string'&&m.name.trim()).map(m=>[m.name,{name:m.name,size:m.size||0,parameterSize:m.details?.parameter_size||'',quantization:m.details?.quantization_level||''}])).values()].sort((a,b)=>a.name.localeCompare(b.name));
   const names=result.models.map(m=>m.name);
   result.model=selected?(names.find(n=>n===selected||n===selected+':latest')||selected):(names.includes(DEFAULT_MODEL)?DEFAULT_MODEL:names[0]||'');
   result.ready=names.includes(result.model);
   if(!names.length)result.error='Ollama is running but has no installed models. Check its model folder, then refresh models.';
   else if(!result.ready)result.error='The selected model ('+result.model+') is not installed. Choose an installed model below.';
  }catch{result.error='Cannot reach Ollama. Open Start.cmd to start it, then refresh models.';}
  return result;
 }
 async function requireModel(){const current=await status();if(!current.ready)throw Error(current.error);return current.model;}
 async function selectModel(value){
  if(typeof value!=='string'||!value.trim()||value.length>200)throw Error('Choose an installed Ollama model.');
  const name=value.trim(),current=await status();
  if(!current.connected)throw Error(current.error);
  if(!current.models.some(m=>m.name===name))throw Error('That model is not installed in Ollama. Refresh models and choose one from the list.');
  try{fs.mkdirSync(path.dirname(configFile),{recursive:true});fs.writeFileSync(configFile+'.tmp',JSON.stringify({model:name},null,2)+'\n');fs.renameSync(configFile+'.tmp',configFile);}catch{throw Error('Could not save the Ollama model preference. Check write access to the project private folder.');}
  selected=name;
  return {...current,model:name,ready:true,error:''};
 }
 return {status,requireModel,selectModel};
}
module.exports={BASE_URL,DEFAULT_MODEL,predictionLimit,createClient,client:createClient()};
