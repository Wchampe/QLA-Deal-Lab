'use strict';
let ollamaState=null,ollamaBusy=false;
function ollamaPanel(){
 const offline=location.protocol==='file:',s=ollamaState,models=s?.models||[];
 const message=offline?'Open Start.cmd, then use the local workbench to connect to Ollama.':s?.ready?'Ready: '+s.model:s?.error||'Checking Ollama…';
 return `<section id="ollamaPanel" class="card"><h2>Local AI model</h2><p id="ollamaStatus" role="status">${esc(message)}</p><p class="sub">One selected model powers the specialist agents and filing analysis.</p><button id="refreshOllama" class="secondary" ${offline||ollamaBusy?'disabled':''}>${ollamaBusy?'Connecting…':'Refresh models'}</button><details ${s&&!s.ready&&models.length?'open':''}><summary>Change model${models.length?' · '+models.length+' installed':''}</summary><div class="toolbar"><label>Installed Ollama model<select id="ollamaModel" ${offline||ollamaBusy||!models.length?'disabled':''}>${!s?.ready?'<option value="">Choose an installed model</option>':''}${models.map(m=>`<option value="${esc(m.name)}" ${m.name===s?.model?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label><button id="useOllamaModel" ${offline||ollamaBusy||!models.length?'disabled':''}>Use model</button></div><p class="sub">The selection is saved for this workbench and applies to new analyses. Installed models are loaded when used.</p></details></section>`;
}
function updateOllamaPanel(){if($('ollamaPanel'))$('ollamaPanel').outerHTML=ollamaPanel();}
function acceptOllamaStatus(status){
 ollamaState=status||{connected:false,ready:false,models:[],error:'Restart Start.cmd, then refresh to enable the model connection.'};
 $('connection').textContent=!serverReady?'Offline tools · server unavailable':ollamaState.ready?'Local AI · '+ollamaState.model:ollamaState.connected?'Local server · choose a model':'Local server · Ollama unavailable';
 if(typeof filingsConnection!=='undefined'&&filingsConnection){filingsConnection={...filingsConnection,model:ollamaState.model,aiReady:ollamaState.ready,aiError:ollamaState.error};if($('filingsConnection'))$('filingsConnection').textContent=filingsSetupText();}
 updateOllamaPanel();
}
async function refreshOllama(){
 if(ollamaBusy||location.protocol==='file:')return;
 ollamaBusy=true;updateOllamaPanel();
 try{const result=await api('/api/ollama');serverReady=true;acceptOllamaStatus(result);}
 catch{serverReady=false;acceptOllamaStatus({connected:false,ready:false,models:[],error:'Local server unavailable. Open Start.cmd, then refresh models.'});}
 finally{ollamaBusy=false;updateOllamaPanel();}
}
async function useOllamaModel(){
 if(ollamaBusy)return;const model=$('ollamaModel')?.value;
 if(!model)throw Error('Choose an installed model first.');
 ollamaBusy=true;updateOllamaPanel();
 try{const result=await api('/api/config/ollama',{model});serverReady=true;acceptOllamaStatus(result);notify('Local AI model saved: '+result.model,true);}
 finally{ollamaBusy=false;updateOllamaPanel();}
}
