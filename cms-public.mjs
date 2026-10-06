import {activeAnnouncements,safeLink} from './cms-schema.mjs';
const authHash=/#(?:invite_token|recovery_token|confirmation_token|access_token)=/;
if(authHash.test(location.hash))location.replace('/admin'+location.hash);
export function applyContent(c){
 const footer=document.querySelector('.footer-text');if(footer)footer.textContent=`${c.address} | Dinner: ${c.dinner} | Lunch: ${c.lunch} | ${c.note}`;
 document.querySelectorAll('.menu-modal-option').forEach((a,i)=>a.href=i?c.kidsMenu:c.menu);
 const body=document.querySelector('.order-info-modal-body');
 if(body){body.replaceChildren();const title=document.createElement('strong');title.id='orderInfoModalTitle';title.textContent=c.orderTitle;body.append(title);for(const line of [`Lunch: ${c.lunch}`,`Dinner: ${c.dinner}`,c.orderNote]){const p=document.createElement('p');p.style.cssText='white-space:pre-line;margin-top:1rem';p.textContent=line;body.append(p);}}
 const signup=document.getElementById('modalTitle');if(signup)signup.textContent=c.signupTitle;
}
export function renderAnnouncements(items,{preview=false}={}){
 const existing=document.getElementById('announcement-area');existing?.remove();document.getElementById('pocky-announcement')?.remove();
 if(!items.length)return;
 const banner=document.createElement('div');banner.id='announcement-area';banner.setAttribute('aria-label','Restaurant announcements');
 const dialog=document.createElement('dialog');dialog.id='pocky-announcement';dialog.setAttribute('aria-labelledby','announcement-title');
 let previousFocus;
 function show(a){
 previousFocus=document.activeElement;dialog.replaceChildren();
 const close=document.createElement('button');close.className='announcement-close';close.textContent='×';close.setAttribute('aria-label','Close announcement');close.onclick=()=>dialog.close();
 const heading=document.createElement('h2');heading.id='announcement-title';heading.textContent=a.title;
 const p=document.createElement('p');p.textContent=a.message;
 dialog.append(close,heading,p);
 if(a.link&&safeLink(a.link)){const link=document.createElement('a');link.href=a.link;link.textContent=a.button||'Book a table';link.className='announcement-cta';link.target='_blank';link.rel='noopener';dialog.append(link);}
 if(!dialog.open)dialog.showModal();close.focus();
 }
 dialog.addEventListener('close',()=>{document.body.style.overflow='';previousFocus?.focus();});
 dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 for(const a of items){const button=document.createElement('button');button.type='button';button.textContent=a.title+' · View details';button.onclick=()=>{show(a);document.body.style.overflow='hidden';};banner.append(button);}
 document.body.prepend(banner);document.body.append(dialog);
 const first=items[0],key='pocky-announcement:'+JSON.stringify(first);
 let dismissed=false;try{dismissed=sessionStorage.getItem(key)==='seen';}catch{}
 if(preview||!dismissed){show(first);document.body.style.overflow='hidden';if(!preview)try{sessionStorage.setItem(key,'seen');}catch{}}
}
async function load(){
 try{const r=await fetch('/api/cms',{cache:'no-store'});if(!r.ok)return;const {content}=await r.json();applyContent(content);let signature='';const refresh=()=>{const active=activeAnnouncements(content.announcements);const next=JSON.stringify(active);if(next!==signature){signature=next;renderAnnouncements(active);}};refresh();setInterval(refresh,30000);}catch{}
}
if(!location.pathname.startsWith('/admin'))load();
