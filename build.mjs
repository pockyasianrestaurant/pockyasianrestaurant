import {mkdir, readdir, copyFile, rm} from 'node:fs/promises';
import {build} from 'esbuild';
await rm('dist',{recursive:true,force:true}); await mkdir('dist');
for(const f of await readdir('.')) if(/\.(html|svg|png|jpg|pdf|css)$/i.test(f)) await copyFile(f,`dist/${f}`);
await build({entryPoints:['cms-admin.mjs','cms-public.mjs'],bundle:true,format:'esm',platform:'browser',outdir:'dist',entryNames:'[name]',minify:true});
