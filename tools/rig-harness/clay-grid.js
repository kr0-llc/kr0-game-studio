/* Clay pose grids for the clay-repaint experiment (games/metr0niks/research/2026-10-29-iso-sprite-workflows.md, "Recommended experiment").
   Renders 12 walk poses as flat grey silhouettes with black outlines (one per rig part, in draw order) into a 4 x 3 grid at
   1536 x 1024 with thin black cell borders, figure two thirds of the cell height, feet on one baseline per cell.
   front: the lab's Tim-o v4 rig (timo4, walk mode) through the Puppet Rigging Lab page.  back: the back-3/4 v2.1-style parts
   (puppet/atlas-back34.webp + rig-back34.js) walked with the review page's walk.js maths.
   node tools/rig-harness/clay-grid.js [--out tools/rig-harness/out/clay] */
const fs=require("fs"),path=require("path"),{chromium}=require("playwright");
const ROOT=path.resolve(__dirname,"..",".."),PAGE=path.join(ROOT,"games/metr0niks/artifacts/puppet-rigging-lab/puppet-rigging-lab.html");
const args=process.argv.slice(2),get=(k,d)=>{const i=args.indexOf("--"+k);return i>=0?args[i+1]:d};
const out=path.resolve(get("out",path.join(__dirname,"out","clay")));fs.mkdirSync(out,{recursive:true});
const GW=1536,GH=1024,COLS=4,ROWS=3,CW=GW/COLS,CH=GH/ROWS,FIG=2/3,BASE=.9,GREY="#a8a8a8",INK="#000";
/* turn a transparent layer into clay: grey fill, 2 px black rim */
const CLAY=`function clay(lc){const W=lc.width,H=lc.height,x=lc.getContext("2d"),id=x.getImageData(0,0,W,H),d=id.data,m=new Uint8Array(W*H);
  for(let q=0;q<W*H;q++)m[q]=d[q*4+3]>60?1:0;
  for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){const q=y*W+xx;if(!m[q]){d[q*4+3]=0;continue}let edge=false;
    for(let ey=-2;ey<=2&&!edge;ey++)for(let ex=-2;ex<=2;ex++){const X=xx+ex,Y=y+ey;if(X<0||Y<0||X>=W||Y>=H||!m[Y*W+X]){edge=true;break}}
    const v=edge?0:168;d[q*4]=v;d[q*4+1]=v;d[q*4+2]=v;d[q*4+3]=255}
  x.putImageData(id,0,0);return lc}`;
(async()=>{
  const b=await chromium.launch(),p=await b.newPage({viewport:{width:1600,height:1100}});
  const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(PAGE,"utf8")+'</body></html>');
  await p.waitForFunction(()=>window.__lab&&window.__lab.ready()&&window.__lab.img.complete);
  /* ---- front 3/4: timo4 walk ---- */
  const front=await p.evaluate(async({CLAY,GW,GH,COLS,ROWS,CW,CH,FIG,BASE,INK})=>{
    eval(CLAY);const L=window.__lab;L.setRig("timo4");const rig="timo4",g=L.RIGS[rig],D=L.CUR;
    const bb=L.opBounds(D,L.rigOps(D,rig,L.pose(g.kind,"rest",0))),zoom=CH*FIG/(bb.y1-bb.y0);
    const grid=document.createElement("canvas");grid.width=GW;grid.height=GH;const gc=grid.getContext("2d");gc.fillStyle="#fff";gc.fillRect(0,0,GW,GH);
    const heights=[],feet=[];
    for(let i=0;i<12;i++){const col=i%COLS,row=(i/COLS)|0,cx=col*CW+CW/2,gy=row*CH+CH*BASE;
      const P=L.pose(g.kind,"walk",i/12*8);P.ph=i/12*2*Math.PI;const ops=L.rigOps(D,rig,P),view=new DOMMatrix().translate(cx-(bb.x0+bb.x1)/2*zoom,gy).scale(zoom,zoom);
      let y0=1e9,y1=-1e9;
      ops.forEach(o=>{const lc=document.createElement("canvas");lc.width=GW;lc.height=GH;L.drawOp(lc.getContext("2d"),view,o,D,1);clay(lc);gc.setTransform(1,0,0,1,0,0);gc.drawImage(lc,0,0)});
      const d=gc.getImageData(col*CW,row*CH,CW,CH).data;for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){const q=(y*CW+x)*4;if(d[q]<250||d[q+1]<250||d[q+2]<250){if(y<y0)y0=y;if(y>y1)y1=y}}
      heights.push(y1-y0);feet.push(y1)}
    gc.setTransform(1,0,0,1,0,0);gc.strokeStyle=INK;gc.lineWidth=3;for(let c=1;c<COLS;c++){gc.beginPath();gc.moveTo(c*CW,0);gc.lineTo(c*CW,GH);gc.stroke()}for(let r=1;r<ROWS;r++){gc.beginPath();gc.moveTo(0,r*CH);gc.lineTo(GW,r*CH);gc.stroke()}
    return {png:grid.toDataURL("image/png"),heights,feet,zoom}},{CLAY,GW,GH,COLS,ROWS,CW,CH,FIG,BASE,INK});
  fs.writeFileSync(path.join(out,"front-grid.png"),Buffer.from(front.png.split(",")[1],"base64"));
  console.log("front: heights",front.heights.join(" "),"feet",front.feet.join(" "));
  /* ---- back 3/4: walk.js maths on the back parts ---- */
  const atlas="data:image/webp;base64,"+fs.readFileSync(path.join(ROOT,"art/metr0niks/characters/tim-o/puppet/atlas-back34.webp")).toString("base64");
  const rigjs=fs.readFileSync(path.join(ROOT,"art/metr0niks/characters/tim-o/puppet/rig-back34.js"),"utf8");
  const back=await p.evaluate(async({CLAY,atlas,rigjs,GW,GH,COLS,ROWS,CW,CH,FIG,BASE,INK})=>{
    eval(CLAY);eval(rigjs);const A=window.TIMO_RIG_BACK,img=new Image();img.src=atlas;await new Promise(r=>img.onload=r);
    const S={A,img};
    function spr(ctx,n,x,y,r,sc){const s=A.sprites[n],k=1/A.store,w=s.w*k,h=s.h*k;ctx.save();ctx.translate(x,y);if(r)ctx.rotate(r);ctx.scale(sc||1,sc||1);if(s.rot)ctx.rotate(s.rot);ctx.drawImage(img,s.x,s.y,s.w,s.h,-s.pivot[0]*w,-s.pivot[1]*h,w,h);ctx.restore()}
    function joint(n,j){const s=A.sprites[n],k=1/A.store,p=s.joints[j];return {x:(p[0]-s.pivot[0])*s.w*k,y:(p[1]-s.pivot[1])*s.h*k}}
    /* one pose as a list of draw calls [name,x,y,rot,scale] in rig px, ground at (0,0): the review page's walk.js "back" branch */
    function poseOps(ph){const LK=.82,kn=joint("p_thigh","knee"),tl=Math.hypot(kn.x,kn.y)*LK,sh=A.sprites.p_shin,sl=(1-sh.pivot[1])*sh.h/A.store*LK;
      const bob=Math.abs(Math.sin(ph))*3,lean=.05,hipY=-(tl+sl)*.93-bob,ty=hipY-joint("p_torso","hipF").y,ops=[];
      const leg=(side,p)=>{const hip=joint("p_torso",side),a1=Math.sin(p)*.42,a2=a1-Math.max(0,Math.cos(p))*.55;const hx=hip.x,hy=ty+hip.y,kx=hx-Math.sin(a1)*tl,ky=hy+Math.cos(a1)*tl;ops.push(["p_thigh",hx,hy,a1,LK],["p_shin",kx,ky,a2,LK])};
      const armAng=-.38,sw=Math.sin(ph)*.05,arm=(side,n,a,s)=>{const j=joint("p_torso",side);ops.push([n,j.x,ty+j.y,a,s])};
      arm("armB","p_armL",armAng-sw,.9);leg("hipB",ph+Math.PI);leg("hipF",ph);ops.push(["p_torso",0,ty,lean,1]);const pk=joint("p_torso","pack");ops.push(["p_pack",pk.x,ty+pk.y,lean,.82]);arm("armF","p_armR",armAng+sw,1);return ops}
    /* bounds of the rest pose to set the zoom */
    const probe=document.createElement("canvas");probe.width=600;probe.height=600;const pc=probe.getContext("2d");pc.setTransform(1,0,0,1,300,560);poseOps(0).forEach(o=>spr(pc,o[0],o[1],o[2],o[3],o[4]));
    let d=pc.getImageData(0,0,600,600).data,y0=1e9,y1=-1e9,x0=1e9,x1=-1e9;for(let y=0;y<600;y++)for(let x=0;x<600;x++)if(d[(y*600+x)*4+3]>60){if(y<y0)y0=y;if(y>y1)y1=y;if(x<x0)x0=x;if(x>x1)x1=x}
    const zoom=CH*FIG/(y1-y0),cxo=((x0+x1)/2-300);
    const grid=document.createElement("canvas");grid.width=GW;grid.height=GH;const gc=grid.getContext("2d");gc.fillStyle="#fff";gc.fillRect(0,0,GW,GH);
    const heights=[],feet=[];
    for(let i=0;i<12;i++){const col=i%COLS,row=(i/COLS)|0,cx=col*CW+CW/2-cxo*zoom,gy=row*CH+CH*BASE,ph=i/12*2*Math.PI;
      poseOps(ph).forEach(o=>{const lc=document.createElement("canvas");lc.width=GW;lc.height=GH;const c=lc.getContext("2d");c.setTransform(zoom,0,0,zoom,cx,gy);spr(c,o[0],o[1],o[2],o[3],o[4]);clay(lc);gc.setTransform(1,0,0,1,0,0);gc.drawImage(lc,0,0)});
      const dd=gc.getImageData(col*CW,row*CH,CW,CH).data;let a=1e9,b=-1e9;for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){const q=(y*CW+x)*4;if(dd[q]<250||dd[q+1]<250||dd[q+2]<250){if(y<a)a=y;if(y>b)b=y}}heights.push(b-a);feet.push(b)}
    gc.setTransform(1,0,0,1,0,0);gc.strokeStyle=INK;gc.lineWidth=3;for(let c=1;c<COLS;c++){gc.beginPath();gc.moveTo(c*CW,0);gc.lineTo(c*CW,GH);gc.stroke()}for(let r=1;r<ROWS;r++){gc.beginPath();gc.moveTo(0,r*CH);gc.lineTo(GW,r*CH);gc.stroke()}
    return {png:grid.toDataURL("image/png"),heights,feet,zoom}},{CLAY,atlas,rigjs,GW,GH,COLS,ROWS,CW,CH,FIG,BASE,INK});
  fs.writeFileSync(path.join(out,"back-grid.png"),Buffer.from(back.png.split(",")[1],"base64"));
  console.log("back: heights",back.heights.join(" "),"feet",back.feet.join(" "));
  if(errs.length)console.log("page errors",errs);
  await b.close();
})();
