import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

// Isolated developer QA: never attach to a user browser or read its profile.
// The temporary profile contains a synthetic Key only and is removed below.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {version}=JSON.parse(await readFile(path.join(root,'extension','manifest.json'),'utf8'));
const qa=path.join(root,'artifacts',`SuperX-${version}-key-storage`);
await mkdir(qa,{recursive:true});
if(!process.env.SUPERX_NODE_MODULES)throw new Error('Set SUPERX_NODE_MODULES to the bundled workspace node_modules directory.');
const requireBundled=createRequire(path.join(path.resolve(process.env.SUPERX_NODE_MODULES),'__key_store_check__.cjs'));
const {chromium}=requireBundled('playwright');
const executablePath=process.env.SUPERX_EDGE_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const moduleSource=await readFile(path.join(root,'extension','key-store.js'));
const profile=await mkdtemp(path.join(qa,'isolated-profile-'));
const report={version,environment:'isolated headless Edge with actual WebCrypto and IndexedDB',
  data:'Synthetic API Key only. No paid API calls, user profile access, or installed-extension acceptance.',checks:[]};
const server=createServer((req,res)=>{
  if(req.url==='/key-store.js'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end(moduleSource);}
  else if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end('<!doctype html><html><head><title>SuperX isolated key-storage QA</title></head><body></body></html>');}
  else{res.writeHead(404);res.end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const base=`http://127.0.0.1:${server.address().port}`;
let context;
async function openProfile(){
  context=await chromium.launchPersistentContext(profile,{executablePath,headless:true,serviceWorkers:'block',
    args:['--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run']});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const page=await context.newPage();await page.goto(base);await page.addScriptTag({url:`${base}/key-store.js`});return page;
}
try{
  let page=await openProfile();
  const first=await page.evaluate(async()=>{
    const raw='synthetic-api-key-for-superx-storage-qa';
    const envelope=await SuperXKeyStore.seal(raw),second=await SuperXKeyStore.seal(raw);
    if(await SuperXKeyStore.open(envelope)!==raw)throw new Error('Initial roundtrip failed.');
    const serialized=JSON.stringify(envelope);
    if(serialized.includes(raw))throw new Error('Plaintext present in envelope.');
    localStorage.setItem('syntheticCipher',serialized);
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('superx-key-store');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Cannot inspect isolated IndexedDB.'));});
    const keys=await new Promise((resolve,reject)=>{const tx=db.transaction('keys','readonly'),r=tx.objectStore('keys').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Cannot inspect isolated key metadata.'));});db.close();
    if(keys.length!==1||keys[0].extractable!==false)throw new Error('Persisted key is not nonextractable.');
    let exportRejected=false;try{await crypto.subtle.exportKey('raw',keys[0]);}catch{exportRejected=true;}
    return {cipherOnly:true,freshIV:envelope.iv!==second.iv,nonextractable:keys[0].extractable===false,exportRejected};
  });
  assert.ok(Object.values(first).every(Boolean));report.checks.push({name:'actual-IndexedDB-and-WebCrypto',...first});
  await context.close();context=null;
  page=await openProfile();
  const restarted=await page.evaluate(async()=>{
    const raw='synthetic-api-key-for-superx-storage-qa';
    const cipher=JSON.parse(localStorage.getItem('syntheticCipher'));
    const ready=await SuperXKeyStore.open(cipher)===raw;
    const workerSource=`importScripts(${JSON.stringify(location.origin+'/key-store.js')});onmessage=async event=>{try{postMessage({ok:await SuperXKeyStore.open(event.data)==='synthetic-api-key-for-superx-storage-qa'});}catch{postMessage({ok:false});}};`;
    const workerURL=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));
    const worker=new Worker(workerURL);
    const workerReady=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Worker check timed out.')),5000);worker.onmessage=event=>{clearTimeout(timeout);resolve(event.data.ok);};worker.onerror=()=>{clearTimeout(timeout);reject(new Error('Isolated worker failed.'));};worker.postMessage(cipher);});
    worker.terminate();URL.revokeObjectURL(workerURL);
    let tamperRejected=false;const tampered={...cipher,iv:'AAAAAAAAAAAAAAAA'};
    try{await SuperXKeyStore.open(tampered);}catch(error){tamperRejected=!error.message.includes(raw);}
    await SuperXKeyStore.clear();
    let deletedKeyRejected=false;try{await SuperXKeyStore.open(cipher);}catch{deletedKeyRejected=true;}
    const replacement=await SuperXKeyStore.seal('synthetic-replacement-for-superx-storage-qa');
    const replacementReady=await SuperXKeyStore.open(replacement)==='synthetic-replacement-for-superx-storage-qa';
    let oldCipherRejected=false;try{await SuperXKeyStore.open(cipher);}catch{oldCipherRejected=true;}
    await SuperXKeyStore.clear();localStorage.clear();
    return {readyAfterBrowserRestart:ready,workerReady,tamperRejected,deletedKeyRejected,replacementReady,oldCipherRejected};
  });
  assert.ok(Object.values(restarted).every(Boolean));report.checks.push({name:'browser-restart-worker-and-clearing',...restarted});
  report.success=true;
}finally{
  if(context)await context.close();
  await new Promise(resolve=>server.close(resolve));
  const relative=path.relative(qa,profile);
  if(!relative||path.isAbsolute(relative)||relative==='..'||relative.startsWith(`..${path.sep}`))throw new Error('Refuse cleanup outside the isolated QA directory.');
  await rm(profile,{recursive:true,force:true});
}
await writeFile(path.join(qa,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Actual browser Key storage check passed (${report.checks.length} groups); temporary synthetic profile removed.`);
