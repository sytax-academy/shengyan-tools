const fs=require('fs'),path=require('path');
const targets=JSON.parse(process.argv[2]);
const out='audit_harness/results/extracted';
fs.mkdirSync(out,{recursive:true});
const rep=[];
for(const t of targets){
  const src=fs.readFileSync(t.file,'utf8');
  // scripts
  const sre=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;let m,i=0,jsTotal=0;const scripts=[];
  while((m=sre.exec(src))){const attrs=m[1],body=m[2];i++;
    const isJSON=/type\s*=\s*["']?application\/json/i.test(attrs);
    const isModule=/type\s*=\s*["']?module/i.test(attrs);
    const hasSrc=/\bsrc\s*=/i.test(attrs);
    const f=path.join(out,`${t.id}_script${i}.js`);
    if(!hasSrc&&!isJSON){fs.writeFileSync(f,body);jsTotal+=body.length;}
    scripts.push({i,attrs:attrs.trim(),bytes:body.length,isJSON,isModule,hasSrc,startOffset:m.index,file:(!hasSrc&&!isJSON)?f:null});
  }
  const cre=/<style\b([^>]*)>([\s\S]*?)<\/style>/gi;let c,j=0,cssTotal=0;const styles=[];
  const cssParts=[];
  while((c=cre.exec(src))){j++;cssTotal+=c[2].length;styles.push({j,bytes:c[2].length});cssParts.push(c[2]);}
  fs.writeFileSync(path.join(out,`${t.id}_all.css`),cssParts.join('\n/*---BLOCK---*/\n'));
  rep.push({id:t.id,file:t.file,bytes:src.length,jsTotal,cssTotal,htmlOnly:src.length-jsTotal-cssTotal,scripts,styles});
}
fs.writeFileSync('audit_harness/results/extract_report.json',JSON.stringify(rep,null,2));
for(const r of rep){console.log(`${r.id}: total=${r.bytes} js=${r.jsTotal} css=${r.cssTotal} html=${r.htmlOnly} scripts=${r.scripts.length} styles=${r.styles.length}`);
 r.scripts.forEach(s=>console.log(`   script${s.i} attrs='${s.attrs}' bytes=${s.bytes} json=${s.isJSON} module=${s.isModule} src=${s.hasSrc}`));}
