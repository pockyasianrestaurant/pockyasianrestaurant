export const defaults = {
 address:'Shop 1, 4 Maple Street, Maleny', dinner:'Wed – Sun, 4:30pm – late', lunch:'Fri & Sun, 11:30am – 2:30pm',
 note:'Reservations recommended, walk-ins welcome.', orderTitle:'Online ordering information',
 orderNote:'Subject to availability.\nDuring busy periods, online ordering may become unavailable.\n\nWalk-in takeaway orders are welcomed.\nAllow up to 30 minutes wait time.',
 signupTitle:'Keep me updated on Pocky Asian Restaurant',
 menu:'/POCKY_MENU_July_2026.pdf', kidsMenu:'/POCKY_KIDSMENU_July_2026.pdf',
 announcements:[]
};
export const bookingURL='https://bookings.obeeapp.com/pockyasianrestaurant';
const lengths={address:180,dinner:180,lunch:180,note:250,orderTitle:100,orderNote:1500,signupTitle:150};
function text(value,max,label){if(typeof value!=='string'||value.length>max) throw Error(`${label} must be text of at most ${max} characters.`);return value.trim();}
export function safeLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
export function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid content.');
 const out={}; for(const [key,max] of Object.entries(lengths))out[key]=text(value[key],max,key);
 for(const key of ['menu','kidsMenu']){const link=text(value[key],250,key); if(!/^\/(?:POCKY_[A-Za-z0-9_]+\.pdf|api\/cms\?menu=[a-f0-9-]{36})$/.test(link))throw Error('Choose a menu uploaded through this editor.');out[key]=link;}
 if(!Array.isArray(value.announcements)||value.announcements.length>20)throw Error('Use up to 20 announcements.');
 out.announcements=value.announcements.map(a=>{
 const item={id:text(a.id,36,'ID'),enabled:a.enabled,title:text(a.title,100,'Announcement title'),message:text(a.message,800,'Message'),button:text(a.button,40,'Button label'),link:text(a.link,500,'Booking link'),start:text(a.start,30,'Start date'),end:text(a.end,30,'End date')};
 if(!/^[a-f0-9-]{36}$/.test(item.id)||typeof item.enabled!=='boolean')throw Error('Invalid announcement.');
 if(!item.title)throw Error('Give each announcement a title.');
 if(item.link&&!safeLink(item.link))throw Error('Booking links must begin with https://.');
 for(const key of ['start','end'])if(item[key]&&(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:00\+10:00$/.test(item[key])||!Number.isFinite(Date.parse(item[key]))))throw Error('Choose a valid date and time.');
 if(item.start&&item.end&&Date.parse(item.end)<=Date.parse(item.start))throw Error('End time must be after start time.');
 return item;
 });
 if(new Set(out.announcements.map(a=>a.id)).size!==out.announcements.length)throw Error('Duplicate announcement.');
 return out;
}
export function activeAnnouncements(items,now=Date.now()){return items.filter(a=>a.enabled&&(!a.start||Date.parse(a.start)<=now)&&(!a.end||now<Date.parse(a.end)));}
