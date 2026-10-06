import {getStore} from '@netlify/blobs';
import {getUser,admin,verifyRequestOrigin} from '@netlify/identity';
import {defaults,validate} from '../cms-schema.mjs';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(data,status=200)=>Response.json(data,{status,headers});
export default async function(request){
 try{
 const url=new URL(request.url);
 const production=['pockyasianrestaurant.com.au','www.pockyasianrestaurant.com.au','peppy-narwhal-c1d12b.netlify.app'].includes(url.hostname);
 const store=getStore({name:production?'pocky-content-v1':'pocky-preview-v1',consistency:'strong'});
 if(request.method==='GET'){
  const key=url.searchParams.get('menu');
  if(key){if(!/^[a-f0-9-]{36}$/.test(key))return json({error:'Not found'},404);const data=await store.get(`menus/${key}`,{type:'arrayBuffer'});return data?new Response(data,{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':'inline; filename="pocky-menu.pdf"'}}):json({error:'Menu not found'},404);}
  const current=await store.getWithMetadata('content',{type:'json'});
  return json({content:current?.data||defaults,version:current?.etag||null});
 }
 if(request.method!=='PUT'&&request.method!=='POST')return json({error:'Method not allowed'},405);
 verifyRequestOrigin(request);
 const user=await getUser(); if(!user)return json({error:'Please sign in.'},401);
 // Read current permissions to avoid accepting a revoked editor's old JWT roles.
 const editor=await admin.getUser(user.id);if(!editor.roles?.includes('content-editor'))return json({error:'This account does not have content editor access.'},403);
 if(request.method==='POST'){
  if(request.headers.get('Content-Type')?.split(';')[0]!=='application/pdf')return json({error:'Upload a PDF menu.'},400);
  if(Number(request.headers.get('Content-Length'))>4000000)return json({error:'PDF must be smaller than 4 MB.'},413);
  const data=await request.arrayBuffer();if(data.byteLength>4000000||data.byteLength<5)return json({error:'PDF must be smaller than 4 MB.'},413);
  if(new TextDecoder().decode(data.slice(0,5))!=='%PDF-')return json({error:'This file is not a PDF.'},400);
  const id=crypto.randomUUID();await store.set(`menus/${id}`,data);return json({url:`/api/cms?menu=${id}`});
 }
 if(Number(request.headers.get('Content-Length'))>50000)return json({error:'Content is too large.'},413);
 const raw=await request.text();if(raw.length>50000)return json({error:'Content is too large.'},413);
 let payload,content;try{payload=JSON.parse(raw);content=validate(payload.content);}catch(e){return json({error:e.message},400);}
 if(payload.version!==null&&typeof payload.version!=='string')return json({error:'Reload the editor before publishing.'},400);
 const current=await store.getWithMetadata('content',{type:'json'});
 if((current?.etag||null)!==payload.version)return json({error:'Someone else published changes. Reload this page before trying again.'},409);
 // Keep a private copy of the previous published version for the designer.
 if(current)await store.setJSON(`history/${crypto.randomUUID()}`,current.data,{metadata:{savedAt:new Date().toISOString()}});
 const result=await store.setJSON('content',content,payload.version?{onlyIfMatch:payload.version}:{onlyIfNew:true});
 if(!result.modified)return json({error:'Someone else published changes. Reload this page before trying again.'},409);
 return json({content,version:result.etag});
 }catch(error){console.error('CMS request failed',error.name);return json({error:error.status===403?'Request denied. Open the editor on this website.':'The editor service is unavailable. Your changes have not been published.'},error.status===403?403:503);}
}
export const config={path:'/api/cms'};
