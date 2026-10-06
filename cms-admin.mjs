import {login,logout,getUser,handleAuthCallback,acceptInvite,recoverPassword,requestPasswordRecovery,refreshSession,onAuthChange} from '@netlify/identity';
import {validate,activeAnnouncements} from './cms-schema.mjs';
const $=s=>document.querySelector(s);let content,version,dirty=false,busy=false,user,authMode='login',authToken='';
function status(message,error=false){$('#status').textContent=message;$('#status').classList.toggle('error',error);}
function changed(){dirty=true;$('#save-state').textContent='Unpublished changes';}
function setBusy(value){busy=value;document.querySelectorAll('#editor button, #editor input, #editor textarea').forEach(e=>e.disabled=value);}
async function api(options={}){await refreshSession();const response=await fetch('/api/cms',{...options,cache:'no-store'});let data;try{data=await response.json();}catch{throw Error('The editor service is unavailable. Please try again.');}if(!response.ok)throw Error(data.error||'Request failed.');return data;}
async function openEditor(){
 user=await getUser();$('#login-panel').hidden=!!user;$('#logout').hidden=!user;$('#editor').hidden=true;
 if(!user){status('');return;}
 if(!user.roles?.includes('content-editor')){status('Your account needs content editor access. Ask your website designer to assign the content-editor role.',true);return;}
 try{const data=await api();content=data.content;version=data.version;dirty=false;$('#session-email').textContent=user.email;fill();$('#history-tab').hidden=user.id!==auditorID;$('#editor').hidden=false;status('Ready. Changes go live when you publish.');}catch(e){status(e.message,true);}
}
const auditorID='04e28a21-e1e1-4675-9a9c-c2f21abcd47e';
let historyEvents=[],uploadEvents=[],historyNext=null;
function fill(){document.querySelectorAll('[data-field]').forEach(el=>{el.value=content[el.dataset.field];});menuLinks();renderCards();$('#save-state').textContent='All changes published';}
function menuLinks(){$('#menu-link').href=content.menu;$('#kids-menu-link').href=content.kidsMenu;}
function field(card,label,key,a,{type='text',max=800}={}){const id=`${key}-${a.id}`,l=document.createElement('label'),input=document.createElement(type==='textarea'?'textarea':'input');l.htmlFor=id;l.textContent=label;input.id=id;if(type!=='textarea')input.type=type;input.maxLength=max;input.value=type==='datetime-local'?a[key]?.slice(0,16)||'':a[key];input.addEventListener('input',()=>{a[key]=type==='datetime-local'?(input.value?input.value+':00+10:00':''):input.value;changed();});card.append(l,input);return input;}
function renderCards(){
 const list=$('#announcements-list');list.replaceChildren();
 if(!content.announcements.length){const p=document.createElement('p');p.textContent='No announcements yet. Add a message or choose a starting point above.';list.append(p);}
 for(const a of content.announcements){
 const card=document.createElement('section');card.className='announcement-card';const row=document.createElement('div');row.className='row';row.style.justifyContent='space-between';const toggle=document.createElement('label');toggle.className='toggle';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=a.enabled;checkbox.addEventListener('change',()=>{a.enabled=checkbox.checked;changed();});toggle.append(checkbox,document.createTextNode('Enabled'));
 const tag=document.createElement('span');tag.className='tag';tag.textContent=!a.enabled?'Off':activeAnnouncements([a]).length?'Live after publishing':a.end&&Date.parse(a.end)<=Date.now()?'Expired':'Scheduled';row.append(toggle,tag);card.append(row);
 field(card,'Banner and popup title','title',a,{max:100});field(card,'Popup message','message',a,{type:'textarea',max:800});field(card,'Button label (optional)','button',a,{max:40});field(card,'Booking link (optional, begins with https://)','link',a,{type:'url',max:500});
 const dates=document.createElement('div');dates.className='columns';for(const [key,label] of [['start','Show from'],['end','Hide after']]){const group=document.createElement('div');field(group,label+' · AEST',key,a,{type:'datetime-local'});dates.append(group);}card.append(dates);
 const remove=document.createElement('button');remove.type='button';remove.textContent='Remove announcement';remove.style.marginTop='1rem';remove.onclick=()=>{content.announcements=content.announcements.filter(x=>x.id!==a.id);changed();renderCards();};card.append(remove);list.append(card);
 }
}
function add(){
 if(content.announcements.length>=20){status('You can have up to 20 announcements.',true);return;}
 content.announcements.push({id:crypto.randomUUID(),enabled:false,title:'New announcement',message:'',button:'',link:'',start:'',end:''});changed();renderCards();status('Announcement added as off. Edit it, enable it, preview, then publish.');
}
$('#add-announcement').onclick=()=>add();
document.querySelectorAll('[data-field]').forEach(el=>el.addEventListener('input',()=>{content[el.dataset.field]=el.value;changed();}));
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-current',String(x===b)));document.querySelectorAll('[data-panel]').forEach(x=>x.hidden=x.dataset.panel!==b.dataset.tab);if(b.dataset.tab==='history')loadHistory();});
document.querySelectorAll('[data-menu]').forEach(input=>input.onchange=async()=>{const file=input.files[0];if(!file)return;if(file.size>4000000){status('Choose a PDF smaller than 4 MB.',true);input.value='';return;}setBusy(true);status('Uploading menu…');try{const data=await api({method:'POST',headers:{'Content-Type':'application/pdf'},body:file});content[input.dataset.menu]=data.url;menuLinks();changed();status('Menu uploaded. Preview or publish to make it live.');}catch(e){status(e.message,true);}finally{input.value='';setBusy(false);}});
$('#publish').onclick=async()=>{if(busy)return;let clean;try{clean=validate(content);}catch(e){status(e.message,true);return;}setBusy(true);status('Publishing…');try{const data=await api({method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:clean,version})});content=data.content;version=data.version;dirty=false;fill();status('Published. Your website has been updated.');}catch(e){status(e.message,true);}finally{setBusy(false);}};
$('#preview').onclick=async()=>{
 try{const c=validate(content);const response=await fetch('/',{cache:'no-store'});if(!response.ok)throw Error('Preview could not load.');const doc=new DOMParser().parseFromString(await response.text(),'text/html');doc.querySelectorAll('script,noscript').forEach(e=>e.remove());doc.querySelectorAll('[onclick]').forEach(e=>e.removeAttribute('onclick'));
 doc.querySelector('.footer-text').textContent=`${c.address} | Dinner: ${c.dinner} | Lunch: ${c.lunch} | ${c.note}`;doc.querySelector('#modalTitle').textContent=c.signupTitle;doc.querySelectorAll('.menu-modal-option').forEach((a,i)=>a.href=i?c.kidsMenu:c.menu);
 const items=c.announcements.filter(a=>a.enabled);if(items.length){const bar=doc.createElement('div');bar.id='announcement-area';bar.textContent=items.map(a=>a.title+' · View details').join(' / ');doc.body.prepend(bar);const a=items[0],popup=doc.createElement('div');popup.style.cssText='position:fixed;inset:0;background:#0008;display:grid;place-items:center;z-index:9000';const panel=doc.createElement('div');panel.style.cssText='background:#ffce07;width:min(92vw,520px);padding:2rem;text-align:center;max-height:90vh;overflow:auto';const h=doc.createElement('h2');h.textContent=a.title;const p=doc.createElement('p');p.style.cssText='white-space:pre-line;margin:1rem 0';p.textContent=a.message;panel.append(h,p);if(a.link){const button=doc.createElement('span');button.className='announcement-cta';button.textContent=a.button||'Book a table';panel.append(button);}popup.append(panel);doc.body.append(popup);}
 $('#preview-frame').srcdoc='<!doctype html>'+doc.documentElement.outerHTML;$('#preview-dialog').showModal();
 }catch(e){status(e.message,true);}
};
$('#close-preview').onclick=()=>$('#preview-dialog').close();
$('#logout').onclick=async()=>{if(dirty&&!confirm('Discard your unpublished changes and sign out?'))return;await logout();dirty=false;content=null;await openEditor();};
$('#login-form').onsubmit=async e=>{e.preventDefault();$('#login-button').disabled=true;try{const password=$('#login-password').value;if(authMode!=='login'&&password.length<12)throw Error('Use at least 12 characters for your new password.');if(authMode==='invite')await acceptInvite(authToken,password);else if(authMode==='recovery')await recoverPassword(authToken,password);else await login($('#login-email').value.trim(),password);$('#login-password').value='';authMode='login';await openEditor();}catch(e){status(e.message||'Could not sign in.',true);}finally{$('#login-button').disabled=false;}};
$('#forgot').onclick=async()=>{const email=$('#login-email').value.trim();if(!email){status('Enter your email address first.',true);$('#login-email').focus();return;}try{await requestPasswordRecovery(email);status('If this email has an editor account, a recovery link has been sent.');}catch(e){status(e.message,true);}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
onAuthChange(event=>{if(event==='logout'){$('#editor').hidden=true;$('#login-panel').hidden=false;$('#logout').hidden=true;}});
try{
 const hash=new URLSearchParams(location.hash.slice(1));
 if(hash.has('invite_token')||hash.has('recovery_token')){authMode=hash.has('invite_token')?'invite':'recovery';authToken=hash.get(authMode==='invite'?'invite_token':'recovery_token');history.replaceState(null,'','/admin');$('#login-panel').hidden=false;$('#email-field').hidden=true;$('#login-email').required=false;$('#forgot').hidden=true;$('#login-password').autocomplete='new-password';$('#login-title').textContent=authMode==='invite'?'Set up your editor account':'Reset your password';$('#login-help').textContent='Choose a password of at least 12 characters.';$('#login-button').textContent='Set password';status('');}
 else{await handleAuthCallback();await openEditor();}
}catch(e){$('#login-panel').hidden=false;status('Editor login is not available yet. Please contact your website designer.',true);}

const fieldNames={address:'Address',dinner:'Dinner hours',lunch:'Lunch hours',note:'Reservation note',orderTitle:'Ordering heading',orderNote:'Ordering information',signupTitle:'Mailing list heading',menu:'Main menu',kidsMenu:'Kids menu',announcements:'Announcements'};
async function loadHistory(older=false){
 try{status('Loading history…');await refreshSession();
 const result=await fetch('/api/cms?audit=1'+(older&&historyNext?'&cursor='+encodeURIComponent(historyNext):''),{cache:'no-store'});
 const data=await result.json();if(!result.ok)throw Error(data.error||'History could not load.');
 historyEvents=older?[...historyEvents,...data.events]:data.events;uploadEvents=data.uploads;historyNext=data.next;renderHistory();status('History loaded.');
 }catch(e){status(e.message,true);}
}
function renderHistory(){
 const list=$('#history-list');list.replaceChildren();
 const events=[...historyEvents,...uploadEvents].sort((a,b)=>b.at.localeCompare(a.at));
 if(!events.length){const p=document.createElement('p');p.textContent='No recorded changes yet. New publications and uploads will appear here.';list.append(p);}
 for(const event of events){const d=document.createElement('details'),summary=document.createElement('summary');
 summary.textContent=`${new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeStyle:'short',timeZone:'Australia/Brisbane'}).format(new Date(event.at))} AEST · ${event.actor.email||event.actor.id} · ${event.action==='publish'?'Published changes':'Uploaded PDF'}`;d.append(summary);
 const identity=document.createElement('p');identity.className='muted';identity.textContent='Account ID: '+event.actor.id;d.append(identity);
 if(event.action==='publish'){
  const changed=Object.keys(fieldNames).filter(key=>JSON.stringify(event.before[key])!==JSON.stringify(event.after[key]));
  if(!changed.length){const p=document.createElement('p');p.textContent='Published without content changes.';d.append(p);}
  for(const key of changed){const heading=document.createElement('h3');heading.textContent=fieldNames[key];const pre=document.createElement('pre');const value=v=>typeof v==='string'?v:JSON.stringify(v,null,2);pre.textContent='Before:\n'+value(event.before[key])+'\n\nAfter:\n'+value(event.after[key]);d.append(heading,pre);}
 }else{const p=document.createElement('p');p.textContent=`PDF uploaded (${event.bytes.toLocaleString()} bytes). Uploading alone does not publish the menu.`;const link=document.createElement('a');link.href=event.url;link.target='_blank';link.rel='noopener';link.textContent='View uploaded PDF';d.append(p,link);}list.append(d);
 }
 $('#older-history').hidden=!historyNext;$('#export-history').disabled=!events.length;
}
$('#refresh-history').onclick=()=>loadHistory();$('#older-history').onclick=()=>loadHistory(true);
$('#export-history').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({exportedAt:new Date().toISOString(),publications:historyEvents,uploads:uploadEvents,next:historyNext},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pocky-change-log.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
