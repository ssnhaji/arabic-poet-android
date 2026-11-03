const $=id=>document.getElementById(id);
const cv=document.createElement('canvas').getContext('2d');
let M=null;

const DIAC=/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/;
const isD=c=>DIAC.test(c);

const DUAL=new Set('بتثجحخسشصضطظعغفقكلمنهيئیک');
const LET=new Set([...DUAL,...'ادذرزوةءأإآؤٱ']);

const W={
س:6,ش:6,ص:6,ض:6,ف:4,ق:4,ك:4,ک:4,ل:4,
ب:3,ت:3,ث:3,ن:3,ي:3,ئ:3,ی:3,م:3,ع:3,
غ:3,ح:3,ج:3,خ:3,ه:2,ط:2,ظ:2
};

const fmtNum=(n,s,f)=>
(f||'{n}').replace('{n}',s==='ar'?
String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]):
String(n));

const SAMPLE=`قِفا نبكِ من ذكرى حبيبٍ ومنزلِ | بسِقطِ اللِّوى بين الدَّخولِ فحَومَلِ
فتوضِحَ فالمِقراةِ لم يعفُ رسمُها | لما نسجتْها من جنوبٍ وشمألِ

على قَدرِ أهلِ العزمِ تأتي العزائمُ | وتأتي على قَدرِ الكرامِ المكارمُ
وتعظُمُ في عينِ الصغيرِ صغارُها | وتصغُرُ في عينِ العظيمِ العظائمُ

الخيلُ والليلُ والبيداءُ تعرفُني | والسيفُ والرمحُ والقرطاسُ والقلمُ
وللأوطانِ في دمِ كلِّ حرٍّ | يدٌ سلفتْ ودينٌ مستحقُّ`;

function slots(w){
 const ch=[...w],b=[];
 ch.forEach((c,i)=>{
  if(!isD(c)&&c!=='\u0640')b.push(i)
 });

 if(b.length<3)return[];
 if(b.map(i=>ch[i]).join('').includes('لله'))return[];

 const out=[];

 for(let k=0;k<b.length-1;k++){
  const c=ch[b[k]],n=ch[b[k+1]];

  if(!DUAL.has(c)||!LET.has(n))continue;
  if(c==='ل'&&'اأإآٱ'.includes(n))continue;

  let j=b[k]+1;
  while(j<ch.length&&isD(ch[j]))j++;

  if(ch[j]==='\u0640')continue;

  out.push({
   p:j,
   s:(W[c]||1)+(k===b.length-2?2:0)-(k===0?2:0)
  });
 }

 return out;
}

const nat=t=>cv.measureText(t).width;

const mbox=document.createElement('div');

mbox.style.cssText=
"position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none";

document.body.appendChild(mbox);

let mfont='';

function domW(texts){
 const fr=document.createDocumentFragment();

 const el=texts.map(t=>{
  const e=document.createElement('span');

  e.style.cssText=
  `display:inline-block;white-space:pre;direction:rtl;font:${mfont};font-kerning:normal;font-feature-settings:"calt" 1,"kern" 1`;

  e.textContent=t;
  fr.appendChild(e);

  return e;
 });

 mbox.appendChild(fr);

 const w=el.map(e=>e.getBoundingClientRect().width);

 mbox.textContent='';

 return w;
}

function build(words,ins){
 return words.map((w,i)=>{
  if(!ins[i].length)return w;

  const ch=[...w];

  [...ins[i]].sort((a,b)=>b-a).forEach(p=>{
   ch.splice(p,0,'\u0640');
  });

  return ch.join('');
 }).join(' ');
}

function fit(text,Tc,o){
 const words=text.split(' ');
 const sp=words.length-1;
 const ins=words.map(()=>[]);
 const sl=words.map(slots);

 const maxPer=Math.max(1,Math.round(o.str/100*4));

 const cap=({
  smart:.12,
  mixed:.4,
  space:.9
 }[o.method])*o.size;

 let k=0;

 function run(maxP,tgt){
  const cand=[];

  sl.forEach((q0,wi)=>{
   const used=[...ins[wi]];

   [...q0].sort((x,y)=>y.s-x.s).forEach(q=>{
    if(used.length<maxP&&used.every(u=>Math.abs(u-q.p)>1)){
     used.push(q.p);
     cand.push({
      wi,
      p:q.p,
      s:q.s,
      t:used.length-1
     });
    }
   });
  });

  cand.sort((x,y)=>x.t-y.t||y.s-x.s);

  for(const c of cand){
   ins[c.wi].push(c.p);

   if(nat(build(words,ins))>tgt+.3){
    ins[c.wi].pop();
    break;
   }

   k++;
  }
 }

 const w0=nat(text);

 if(o.method!=='space'&&o.str>0&&w0<Tc){
  run(maxPer,o.method==='mixed'?w0+(Tc-w0)*.6:Tc);

  const wc=nat(build(words,ins));

  if(sp&&(Tc-wc)/sp>cap)run(maxPer+2,Tc);
 }

 return{
  text:build(words,ins),
  k,
  cap
 };
}

function layout(){
 const sy=$('sym').value==='*custom'?
 $('symc').value.trim():$('sym').value;

 const o={
  sep:$('sep').value||'|',
  size:+$('size').value,
  gap:+$('gap').value,
  bgap:+$('bgap').value,
  method:$('method').value,
  str:+$('kash').value,
  font:$('font').value,
  num:$('num').value,
  numf:$('numf').value,
  sym:sy,
  bg:$('bg').value,
  ink:$('ink').value
 };

 cv.font=mfont=`${o.size}px ${o.font}`;

 const rows=[];
 let blank=false;

 $('src').value.split('\n').forEach(l=>{
  l=l.trim();

  if(!l){
   blank=true;
   return;
  }

  const p=l.split(o.sep)
   .map(x=>x.trim().replace(/\s+/g,' '))
   .filter(Boolean);

  const st=blank&&rows.length>0;
  blank=false;

  rows.push(
   p.length>=2?
   {a:p[0],b:p.slice(1).join(' '),st}:
   {solo:p[0],st}
  );
 });

 const bay=rows.filter(r=>r.a);
 bay.forEach((r,i)=>r.n=i+1);

 const solos=rows.filter(r=>r.solo);

 const nt=bay.flatMap(r=>[r.a,r.b]);

 const w1=domW([...nt,...solos.map(r=>r.solo)]);

 let T1=0,T2=0,sd=0,sc2=0;

 bay.forEach((r,i)=>{
  const a=w1[2*i],b=w1[2*i+1];

  T1=Math.max(T1,a);
  T2=Math.max(T2,b);

  sd+=a+b;
  sc2+=nat(r.a)+nat(r.b);
 });

 T1=Math.ceil(T1);
 T2=Math.ceil(T2);

 const rho=sc2?sd/sc2:1;

 solos.forEach((r,i)=>{
  r.sw=w1[nt.length+i];
 });

 bay.forEach(r=>{
  r.fa=fit(r.a,T1/rho,o);
  r.fb=fit(r.b,T2/rho,o);
 });

 const w2=domW(bay.flatMap(r=>[r.fa.text,r.fb.text]));

 let ks=0,bad=0,mx=0;

 bay.forEach((r,i)=>{
  [[r.fa,T1,w2[2*i]],[r.fb,T2,w2[2*i+1]]].forEach(([f,T,w])=>{
   const sp=f.text.split(' ').length-1;

   f.ws=sp?
    Math.min(f.cap*2.5,Math.max(0,(T-w)/sp)):0;

   f.res=T-(w+f.ws*sp);
   ks+=f.k;
  });

  const d=Math.max(Math.abs(r.fa.res),Math.abs(r.fb.res));

  if(d>1.5)bad++;

  mx=Math.max(mx,d);
 });

 let numW=0;

 if(o.num!=='none'&&bay.length){
  cv.font=`${o.size*.75}px ${o.font}`;

  numW=Math.ceil(
   Math.max(...bay.map(r=>nat(fmtNum(r.n,o.num,o.numf))))+
   o.size*.7
  );

  cv.font=mfont;
 }

 const tot=Math.max(
  T1+o.gap+T2,
  Math.ceil(Math.max(0,...solos.map(r=>r.sw)))
 );

 return{
  o,rows,T1,T2,total:tot,numW,
  EW:tot+2*numW,
  bay:bay.length,ks,bad,mx
 };
}

function fitView(){
 if(!M)return;
 render();
}

const lh=o=>Math.round(o.size*1.9);

function render(){
 M=layout();

 const{o,rows,T1,T2,total,EW,numW}=M;

 const P=$('poem');

 P.innerHTML='';

 $('sheet').style.setProperty('--paper',o.bg);
 $('sheet').style.setProperty('--poem',o.ink);

 P.style.cssText=
 `width:${EW}px;font:${o.size}px/${lh(o)}px ${o.font}`;

 rows.forEach(r=>{
  const d=document.createElement('div');

  d.style.marginTop=
   (r.st?o.bgap*1.8+o.bgap:o.bgap)+'px';

  if(r.solo){
   d.className='solo';
   d.textContent=r.solo;
  }else{
   d.className='row';

   d.style.padding='0 '+numW+'px';
   d.style.position='relative';
   d.style.justifyContent='center';

   if(numW){
    const nn=document.createElement('span');

    nn.textContent=fmtNum(r.n,o.num,o.numf);

    nn.style.cssText=
    `position:absolute;right:0;top:0;width:${numW}px;text-align:center;color:#9a8a70;font-size:.75em`;

    d.appendChild(nn);
   }

   [[r.fa,T1],0,[r.fb,T2]].forEach(it=>{
    if(!it){
     const ge=document.createElement('span');

     ge.style.cssText=
     `flex:none;width:${o.gap}px;text-align:center;opacity:.55;font-size:.7em`;

     ge.textContent=o.sym;

     d.appendChild(ge);

     return;
    }

    const[f,T]=it;

    const s=document.createElement('span');

    s.className='m';
    s.style.width=T+'px';
    s.style.wordSpacing=f.ws+'px';
    s.textContent=f.text;

    d.appendChild(s);
   });
  }

  P.appendChild(d);
 });

 const avail=$('sheet').clientWidth-40;
 const sc=Math.min(1,avail/EW);

 const F=$('frame');

 P.style.transform=`scale(${sc})`;

 F.style.width=EW*sc+'px';
 F.style.height=P.offsetHeight*sc+'px';

 $('kv').textContent=$('kash').value+'%';
 $('sv').textContent=o.size;
 $('gv').textContent=o.gap;
 $('bv').textContent=o.bgap;

 $('stats').innerHTML=
 `عدد الأبيات: ${M.bay}<br>
 عرض عمود الشطر الأول: ${T1}px · الثاني: ${T2}px · الفاصل: ${o.gap}px<br>
 مواضع التطويل المستخدمة: ${M.ks}<br>
 أسطر لم يكتمل عرضها (ضمن حدود الأمان): ${M.bad}
 ${M.bad?` — أكبر فرق ${M.mx.toFixed(1)}px (زِد التطويل أو اختر «المختلطة»):`:' ✓'}`;
}

let pend=0;

const sched=imm=>{
 clearTimeout(pend);

 pend=setTimeout(async()=>{
  try{
   await Promise.race([
    document.fonts.load(`${$('size').value}px ${$('font').value}`,'بسم الله'),
    new Promise(r=>setTimeout(r,1200))
   ]);
  }catch(e){}

  render();
  save();

 },imm===true?0:140);
};

['src','sep','font','size','gap','bgap','method','kash','num','numf','sym','symc','bg','ink']
.forEach(i=>$(i).addEventListener('input',sched));

$('sample').onclick=()=>{
 $('src').value=SAMPLE;
 sched();
};

$('strip').onclick=()=>{
 $('src').value=$('src').value.replace(
 /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,''
 );
 sched();
};

$('punc').onclick=()=>{
 const sep=$('sep').value||'|';

 const P=/[\u060C\u061B\u061F\u066A-\u066D\u06D4\u06DD\u06DE\uFD3E\uFD3F.,:;?!"'`“”‘’«»„‹›()\[\]{}<>…—–\-_*\/\\~^=+&%#@$]/g;

 $('src').value=$('src').value.split('\n')
 .map(l=>l.split(sep)
 .map(x=>x.replace(P,'').replace(/\s+/g,' ').trim())
 .join(l.includes(sep)?' '+sep+' ':''))
 .join('\n');

 sched();
};

window.addEventListener('resize',()=>{
 requestAnimationFrame(fitView);
});

if(window.ResizeObserver){
 new ResizeObserver(()=>{
  requestAnimationFrame(fitView);
 }).observe($('sheet'));
}

if(document.fonts){
 document.fonts.addEventListener('loadingdone',sched);
}

/* التصدير */

const dl=(blob,name)=>{
 const a=document.createElement('a');

 a.href=URL.createObjectURL(blob);
 a.download=name;

 document.body.appendChild(a);
 a.click();

 setTimeout(()=>{
  URL.revokeObjectURL(a.href);
  a.remove();
 },1500);
};

$('bprint').onclick=()=>{
 render();
 window.print();
};

$('bcopy').onclick=async()=>{
 const t=M.rows.map(r=>
  (r.solo||r.fa.text+'\t'+r.fb.text)
 ).join('\n');

 try{
  await navigator.clipboard.writeText(t);
  $('bcopy').textContent='تم النسخ ✓';
 }catch(e){
  $('src').select();
  $('bcopy').textContent='تعذّر النسخ';
 }

 setTimeout(()=>$('bcopy').textContent='نسخ النص',1800);
};

function paint(sub,W,H,k,S,padY){
 const{o,T1,T2,EW,numW}=M;
 const L=lh(o)*k;

 const c=document.createElement('canvas');

 c.width=Math.round(W*S);
 c.height=Math.round(H*S);

 const x=c.getContext('2d');

 x.scale(S,S);

 x.fillStyle=o.bg;
 x.fillRect(0,0,W,H);

 x.fillStyle=o.ink;
 x.direction='rtl';
 x.textAlign='center';
 x.textBaseline='middle';
 x.font=`${o.size*k}px ${o.font}`;

 const left=(W-EW*k)/2;
 const right=left+(EW-numW)*k;

 let y=padY;

 sub.forEach((r,i)=>{
  if(i)y+=gapOf(r,o)*k;

  if(r.solo){
   x.wordSpacing='0px';
   x.fillText(r.solo,left+EW*k/2,y+L/2);
  }else{
   x.wordSpacing=(r.fa.ws*k)+'px';
   x.fillText(r.fa.text,right-T1*k/2,y+L/2);

   x.wordSpacing=(r.fb.ws*k)+'px';
   x.fillText(r.fb.text,right-(T1+o.gap+T2/2)*k,y+L/2);

   if(o.sym){
    x.wordSpacing='0px';
    x.globalAlpha=.55;
    x.font=`${o.size*.7*k}px ${o.font}`;

    x.fillText(o.sym,right-(T1+o.gap/2)*k,y+L/2);

    x.globalAlpha=1;
    x.font=`${o.size*k}px ${o.font}`;
   }

   if(numW){
    x.wordSpacing='0px';
    x.fillStyle='#9a8a70';
    x.font=`${o.size*.75*k}px ${o.font}`;

    x.fillText(fmtNum(r.n,o.num,o.numf),right+numW*k/2,y+L/2);

    x.fillStyle=o.ink;
    x.font=`${o.size*k}px ${o.font}`;
   }
  }

  y+=L;
 });

 return c;
}

const gapOf=(r,o)=>r.st?o.bgap*2.8:o.bgap;

$('bpng').onclick=async()=>{
 await document.fonts.load(`${M.o.size}px ${M.o.font}`,'بسم');

 const pad=60,{o,rows,EW}=M;

 let H=pad*2;

 rows.forEach((r,i)=>{
  H+=lh(o)+(i?gapOf(r,o):0);
 });

 paint(rows,EW+pad*2,H,1,3,pad)
 .toBlob(b=>dl(b,'poem.png'),'image/png');
};

$('bpdf').onclick=async()=>{
 await document.fonts.load(`${M.o.size}px ${M.o.font}`,'بسم');

 const{o,rows,EW}=M;

 const W=794,H=1123,mx=70,my=80,S=2.5;

 const k=Math.min(1,(W-mx*2)/EW);
 const L=lh(o)*k;

 const pages=[];
 let cur=[],y=0;

 rows.forEach(r=>{
  const g=cur.length?gapOf(r,o)*k:0;

  if(cur.length&&y+g+L>H-my*2){
   pages.push(cur);
   cur=[];
   y=0;
  }

  y+=(cur.length?gapOf(r,o)*k:0)+L;
  cur.push(r);
 });

 if(cur.length)pages.push(cur);

 const imgs=pages.map(sub=>{
  const u=paint(sub,W,H,k,S,my)
  .toDataURL('image/jpeg',0.95).split(',')[1];

  const bin=atob(u);
  const b=new Uint8Array(bin.length);

  for(let i=0;i<bin.length;i++){
   b[i]=bin.charCodeAt(i);
  }

  return{
   b,
   w:Math.round(W*S),
   h:Math.round(H*S)
  };
 });

 dl(pdf(imgs),'poem.pdf');
};

function pdf(imgs){
 const enc=new TextEncoder();
 const ch=[],off=[];
 let len=0;

 const add=b=>{
  if(typeof b==='string')b=enc.encode(b);
  ch.push(b);
  len+=b.length;
 };

 const obj=(n,body)=>{
  off[n]=len;
  add(n+' 0 obj\n');
  body.forEach(add);
  add('\nendobj\n');
 };

 const n=imgs.length,N=2+3*n;

 add('%PDF-1.4\n');

 obj(1,['<</Type/Catalog/Pages 2 0 R>>']);

 obj(2,[
  `<</Type/Pages/Count ${n}/Kids [${imgs.map((_,i)=>(3+3*i)+' 0 R').join(' ')}]>>`
 ]);

 imgs.forEach((im,i)=>{
  const pg=3+3*i;
  const ct=pg+1;
  const ig=pg+2;

  const cs='q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';

  obj(pg,[
   `<</Type/Page/Parent 2 0 R/MediaBox [0 0 595.28 841.89]/Resources<</XObject<</Im0 ${ig} 0 R>>>>/Contents ${ct} 0 R>>`
  ]);

  obj(ct,[
   `<</Length ${cs.length}>>\nstream\n${cs}\nendstream`
  ]);

  obj(ig,[
   `<</Type/XObject/Subtype/Image/Width ${im.w}/Height ${im.h}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${im.b.length}>>\nstream\n`,
   im.b,
   '\nendstream'
  ]);
 });

 const xo=len;

 add(`xref\n0 ${N+1}\n0000000000 65535 f \n`);

 for(let i=1;i<=N;i++){
  add(String(off[i]).padStart(10,'0')+' 00000 n \n');
 }

 add(`trailer\n<</Size ${N+1}/Root 1 0 R>>\nstartxref\n${xo}\n%%EOF`);

 return new Blob(ch,{type:'application/pdf'});
}

/* تصدير Word */

const esc=s=>s.replace(/&/g,'&amp;')
 .replace(/</g,'&lt;')
 .replace(/>/g,'&gt;');

const tw=px=>Math.round(px*15);

function runs(text,o,fillN){
 const f=o.font.split(',')[0].replace(/"/g,'');
 const z=Math.round(o.size*1.5);

 let x=`<w:r><w:rPr><w:rFonts w:ascii="${f}" w:hAnsi="${f}" w:cs="${f}"/><w:sz w:val="${z}"/><w:szCs w:val="${z}"/><w:rtl/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;

 if(fillN){
  x+=`<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="FFFFFF"/><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr><w:t xml:space="preserve"> ${'W'.repeat(fillN)}</w:t></w:r>`;
 }

 return x;
}

function docx(){
 const{o,rows,T1,T2,numW}=M;
 const g=o.gap;
 const after=tw(o.bgap);

 const c1=Math.ceil(T1*1.06);
 const c2=Math.ceil(T2*1.06);

 const total=c1+g+c2+2*numW;
 const ncol=numW?2:0;

 const fill=px=>Math.floor(px*0.75*0.8/0.94);

 const cell=(w,span,inner,aft,jc,tiny)=>
 `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span?`<w:gridSpan w:val="${span}"/>`:''}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:bidi/><w:spacing w:before="0" w:after="${aft}" w:line="360" w:lineRule="auto"/><w:jc w:val="${jc}"/>${tiny?'<w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr>':''}</w:pPr>${inner}</w:p></w:tc>`;

 let tr='';

 rows.forEach(r=>{
  const aft=after+(r.st?Math.round(after*1.8):0);
  let c='';

  if(r.solo){
   c=cell(tw(total),3+ncol,runs(r.solo,o,0),aft,'center',false);
  }else{
   if(numW){
    c+=cell(tw(numW),0,runs(fmtNum(r.n,o.num,o.numf),o,0),aft,'center',false);
   }

   c+=cell(tw(c1),0,runs(r.fa.text,o,fill(c1)),aft,'both',true)
   +cell(tw(g),0,o.sym?runs(o.sym,o,0):'',aft,'center',false)
   +cell(tw(c2),0,runs(r.fb.text,o,fill(c2)),aft,'both',true);

   if(numW){
    c+=cell(tw(numW),0,'',aft,'center',false);
   }
  }

  tr+=`<w:tr><w:trPr><w:cantSplit/></w:trPr>${c}</w:tr>`;
 });

 const nc=numW?`<w:gridCol w:w="${tw(numW)}"/>`:'';

 const pw=Math.max(11906,tw(total)+2268);

 const body=`<w:tbl><w:tblPr><w:bidiVisual/><w:tblW w:w="${tw(total)}" w:type="dxa"/><w:jc w:val="center"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${nc}<w:gridCol w:w="${tw(c1)}"/><w:gridCol w:w="${tw(g)}"/><w:gridCol w:w="${tw(c2)}"/>${nc}</w:tblGrid>${tr}</w:tbl><w:p/>`;

 const xml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="${pw}" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/><w:bidi/></w:sectPr></w:body></w:document>`;

 return zip({
  '[Content_Types].xml':
  `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,

  '_rels/.rels':
  `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,

  'word/document.xml':xml
 });
}

const CT=(()=>{
 const t=[];

 for(let n=0;n<256;n++){
  let c=n;

  for(let k=0;k<8;k++){
   c=c&1?0xEDB88320^(c>>>1):c>>>1;
  }

  t[n]=c>>>0;
 }

 return t;
})();

const crc=b=>{
 let c=-1;

 for(let i=0;i<b.length;i++){
  c=CT[(c^b[i])&255]^(c>>>8);
 }

 return(c^-1)>>>0;
};

function zip(files){
 const enc=new TextEncoder();
 const parts=[],cen=[];
 let off=0;

 for(const[name,txt]of Object.entries(files)){
  const nb=enc.encode(name);
  const d=enc.encode(txt);
  const c=crc(d);

  const h=new DataView(new ArrayBuffer(30));

  h.setUint32(0,0x04034b50,true);
  h.setUint16(4,20,true);
  h.setUint16(6,0x800,true);
  h.setUint16(10,0,true);
  h.setUint16(12,33,true);

  h.setUint32(14,c,true);
  h.setUint32(18,d.length,true);
  h.setUint32(22,d.length,true);
  h.setUint16(26,nb.length,true);

  parts.push(h.buffer,nb,d);

  const e=new DataView(new ArrayBuffer(46));

  e.setUint32(0,0x02014b50,true);
  e.setUint16(4,20,true);
  e.setUint16(6,20,true);
  e.setUint16(8,0x800,true);
  e.setUint16(14,33,true);

  e.setUint32(16,c,true);
  e.setUint32(20,d.length,true);
  e.setUint32(24,d.length,true);
  e.setUint16(28,nb.length,true);
  e.setUint32(42,off,true);

  cen.push(e.buffer,nb);

  off+=30+nb.length+d.length;
 }

 const csz=cen.reduce((a,b)=>a+b.byteLength,0);
 const n=Object.keys(files).length;

 const z=new DataView(new ArrayBuffer(22));

 z.setUint32(0,0x06054b50,true);
 z.setUint16(8,n,true);
 z.setUint16(10,n,true);
 z.setUint32(12,csz,true);
 z.setUint32(16,off,true);

 return new Blob(
  [...parts,...cen,z.buffer],
  {type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
 );
}

$('bword').onclick=()=>{
 dl(docx(),'poem.docx');
};

/* حفظ الإعدادات */

const IDS=[
'src','sep','font','size','gap','bgap','method',
'kash','num','numf','sym','symc','bg','ink'
];

function save(){
 try{
  localStorage.setItem(
   'pf1',
   JSON.stringify(Object.fromEntries(IDS.map(i=>[i,$(i).value])))
  );
 }catch(e){}
}

function load(){
 try{
  const d=JSON.parse(localStorage.getItem('pf1')||'null');

  if(d){
   IDS.forEach(i=>{
    if(d[i]!=null)$(i).value=d[i];
   });
  }
 }catch(e){}
}

$('reset').onclick=()=>{
 try{
  localStorage.removeItem('pf1');
 }catch(e){}

 location.reload();
};

$('theme').onchange=()=>{
 const v=$('theme').value;

 if(v){
  const[b,i]=v.split(',');

  $('bg').value=b;
  $('ink').value=i;

  sched();
 }
};

const symUI=()=>{
 $('symc').style.display=
 $('sym').value==='*custom'?'block':'none';
};

$('sym').addEventListener('input',symUI);

const main=document.querySelector('main');

$('tedit').onclick=()=>{
 main.dataset.v='edit';

 $('tedit').classList.add('on');
 $('tview').classList.remove('on');
};

$('tview').onclick=()=>{
 main.dataset.v='view';

 $('tview').classList.add('on');
 $('tedit').classList.remove('on');

 requestAnimationFrame(()=>sched(true));
};

load();

if(!$('src').value.trim()){
 $('src').value=SAMPLE;
}

symUI();
sched(true);
