#!/usr/bin/env node
/* Rig harness: renders a puppet rig from the Puppet Rigging Lab page headlessly and measures joint fit.

   node tools/rig-harness/render.js --rig timo3 [--override rig.json] [--out dir] [--modes rest,walk,aim,stress] [--frames 8] [--zoom N, default fits the rest pose]
                                    [--dots] [--csv] [--no-sheet] [--capR 7] [--holeR 12] [--sliverMax 40]

   --override  JSON {"<sprite>": {"pivot":[u,v], "joints":{"name":[u,v]}, "rot":r}} applied on top of the rig data
   Writes <out>/<mode>-<i>.png (the puppet alone, pivots and joints drawn when --dots), <out>/parts/<sprite>.png (each part at store size),
   <out>/contact-<mode>.png (all frames of a mode side by side, unless --no-sheet), <out>/fit.csv (one row per joint per frame, with --csv),
   and <out>/report.json: per frame, per drawn part, the part's placed box and ink box (canvas px), its pivot/joint world positions, plus "fit" numbers:
     capExposure: for each child part, the share of its pivot cap circle (radius capR px, default 7) NOT overlapped by any other part
                  (0 = the cap sits fully on another part, 1 = the cap touches nothing: looks detached)
     socketGap:   for each parent joint, the distance from the joint to the nearest opaque pixel of the child near its pivot (0 when touching)
     jointFit[j]: for each parent joint that has a child: which part is drawn on top, hole (transparent pixels within holeR rig px of the joint
                  that touch both parent and child ink: a notch or sliver), enclosed (those of them that are sealed holes, unreachable from the
                  outside through transparent pixels), sliver (hole pixels that lie in a sealed region of at most sliverMax rig px²: a crack between
                  the two parts, as opposed to an open notch or the background between two limbs), overhang (share of the TOP part's ink in the cap disc that sits outside
                  the bottom part), peek (share of the BOTTOM part's ink in the cap disc that the top part does not cover), offset (px between the
                  joint and the child's pivot, 0 unless the rig code places the child off the joint, like the pack)
     jointHits[j]: for a joint with no child (muzzle, tip, glow, eye): other parts whose ink covers that point (hits), those of them drawn on top
                  of the owning part (over: they visibly hide the mark), and whether the point is below the ground line
   Canvas px = rig px * zoom (zoom is in the report). Needs the built page games/metr0niks/artifacts/puppet-rigging-lab/puppet-rigging-lab.html and Playwright. */
const fs=require("fs"),path=require("path");
const {chromium}=require("playwright");
const args=process.argv.slice(2),get=(k,d)=>{const i=args.indexOf("--"+k);return i<0?d:args[i+1]};const has=k=>args.includes("--"+k);
const ROOT=path.resolve(__dirname,"..","..");
const PAGE=path.join(ROOT,"games","metr0niks","artifacts","puppet-rigging-lab","puppet-rigging-lab.html");
const rig=get("rig","timo3"),out=get("out",path.join(ROOT,"tools","rig-harness","out",rig)),modes=get("modes","rest,walk,aim,stress").split(","),
  frames=+get("frames",8),zoom=+get("zoom",0),capR=+get("capR",7),holeR=+get("holeR",12),sliverMax=+get("sliverMax",40),override=get("override",null),dots=has("dots"),csv=has("csv"),sheet=!has("no-sheet");
(async()=>{
  fs.mkdirSync(path.join(out,"parts"),{recursive:true});
  const b=await chromium.launch(),p=await b.newPage({viewport:{width:900,height:700}});
  const errs=[];p.on("pageerror",e=>errs.push(e.message));
  const html=fs.readFileSync(PAGE,"utf8");
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
  await p.waitForFunction(()=>window.__lab&&window.__lab.ready()&&window.__lab.img.complete);
  if(override)await p.evaluate(o=>window.__lab.applyRig(window.__lab.rid,o),JSON.parse(fs.readFileSync(override,"utf8")));
  await p.evaluate(k=>window.__lab.setRig(k),rig);
  const report=await p.evaluate(async({rig,modes,frames,zoom,capR,holeR,sliverMax,dots,sheet})=>{
    const L=window.__lab,g=L.RIGS[rig],D=L.CUR,SP=L.SP,img=L.img;
    const W=600,H=520,gy=H*.88;
    if(!(zoom>0)){const bb=L.opBounds(D,L.rigOps(D,rig,L.pose(g.kind,"rest",0)));zoom=Math.min(H*.8/(bb.y1-bb.y0),W*.8/(bb.x1-bb.x0))}
    const bb0=L.opBounds(D,L.rigOps(D,rig,L.pose(g.kind,"rest",0))),gx=W/2-(bb0.x0+bb0.x1)/2*zoom;
    const cv=document.createElement("canvas");cv.width=W;cv.height=H;const c=cv.getContext("2d");
    const partPng={};
    for(const n of g.parts){const s=SP[n],pc=document.createElement("canvas");pc.width=s.w;pc.height=s.h;pc.getContext("2d").drawImage(img,s.x,s.y,s.w,s.h,0,0,s.w,s.h);partPng[n]=pc.toDataURL("image/png")}
    const res={rig,label:g.label,kind:g.kind,R:g.R,zoom,W,H,gy,capR,holeR,sliverMax,store:{},frames:[],parts:partPng,sheets:{}};
    for(const n of g.parts)res.store[n]={w:SP[n].w,h:SP[n].h,store:SP[n].store,pivot:D[n].pivot,joints:D[n].joints,rot:D[n].rot||0};
    const seq=L.MODES[g.kind].map(m=>m[0]).filter(m=>modes.includes(m));
    const keep={};
    for(const mode of seq){
      const n=mode==="rest"?1:frames;keep[mode]=[];
      for(let i=0;i<n;i++){
        const t=mode==="rest"?0:i/n*8,P=L.pose(g.kind,mode,t),ops=L.rigOps(D,rig,P);
        const view=new DOMMatrix().translate(gx,gy).scale(zoom,zoom);
        c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);
        /* draw each op into its own layer to measure coverage, then composite */
        const layers=ops.map(o=>{const lc=document.createElement("canvas");lc.width=W;lc.height=H;L.drawOp(lc.getContext("2d"),view,o,D,1);return lc});
        layers.forEach(l=>{c.setTransform(1,0,0,1,0,0);c.drawImage(l,0,0)});
        const alpha=layers.map(l=>l.getContext("2d").getImageData(0,0,W,H).data);
        const opaque=(k,x,y)=>{x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return false;return alpha[k][(y*W+x)*4+3]>60};
        const any=new Uint8Array(W*H);for(let k=0;k<alpha.length;k++){const a=alpha[k];for(let q=0;q<W*H;q++)if(a[q*4+3]>60)any[q]=1}
        const anyAt=(x,y)=>{x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return false;return any[y*W+x]===1};
        /* enclosed holes: transparent pixels that cannot reach the canvas border through transparent pixels (flood fill) */
        const outside=new Uint8Array(W*H),stack=[];for(let x=0;x<W;x++){stack.push(x,(H-1)*W+x)}for(let y=0;y<H;y++){stack.push(y*W,y*W+W-1)}
        while(stack.length){const q=stack.pop();if(outside[q]||any[q])continue;outside[q]=1;const x=q%W,y=(q-x)/W;if(x>0)stack.push(q-1);if(x<W-1)stack.push(q+1);if(y>0)stack.push(q-W);if(y<H-1)stack.push(q+W)}
        let enclosedTotal=0;for(let q=0;q<W*H;q++)if(!any[q]&&!outside[q])enclosedTotal++;
        /* label enclosed regions; a region of at most sliverMax rig px² is a sliver (a see-through crack), a bigger one is just background between limbs */
        const small=new Uint8Array(W*H),seen=new Uint8Array(W*H),smax=sliverMax*zoom*zoom;
        for(let q0=0;q0<W*H;q0++){if(any[q0]||outside[q0]||seen[q0])continue;const comp=[],st=[q0];seen[q0]=1;while(st.length){const q=st.pop();comp.push(q);const x=q%W,y=(q-x)/W;
          for(const nq of [x>0?q-1:-1,x<W-1?q+1:-1,y>0?q-W:-1,y<H-1?q+W:-1]){if(nq<0||seen[nq]||any[nq]||outside[nq])continue;seen[nq]=1;st.push(nq)}}
          if(comp.length<=smax)for(const q of comp)small[q]=1}
        const enclosedAt=(x,y)=>{x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return false;const q=y*W+x;return !any[q]&&!outside[q]};
        const sliverAt=(x,y)=>{x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return false;return small[y*W+x]===1};
        const parts=ops.map((o,k)=>{const s=SP[o.n],d=D[o.n],w=s.w/s.store,h=s.h/s.store,M=view.multiply(o.m);
          const piv=M.transformPoint({x:0,y:0}),joints={};for(const j in d.joints){const q=M.transformPoint({x:(d.joints[j][0]-d.pivot[0])*w,y:(d.joints[j][1]-d.pivot[1])*h});joints[j]=[+q.x.toFixed(1),+q.y.toFixed(1)]}
          /* placed box: the part's quad; ink box: its opaque pixels */
          let bx0=1e9,by0=1e9,bx1=-1e9,by1=-1e9;[[0,0],[1,0],[0,1],[1,1]].forEach(([u,v])=>{const q=M.transformPoint({x:(u-d.pivot[0])*w,y:(v-d.pivot[1])*h});bx0=Math.min(bx0,q.x);by0=Math.min(by0,q.y);bx1=Math.max(bx1,q.x);by1=Math.max(by1,q.y)});
          let ix0=W,iy0=H,ix1=-1,iy1=-1;const a=alpha[k];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(a[(y*W+x)*4+3]>60){if(x<ix0)ix0=x;if(x>ix1)ix1=x;if(y<iy0)iy0=y;if(y>iy1)iy1=y}
          /* cap exposure: sample a disc of radius capR*zoom/… around the pivot; covered if any other layer is opaque there */
          const R=capR*zoom/1.5;let tot=0,vis=0;for(let dy=-R;dy<=R;dy+=2)for(let dx=-R;dx<=R;dx+=2){if(dx*dx+dy*dy>R*R)continue;const x=piv.x+dx,y=piv.y+dy;if(!opaque(k,x,y))continue;tot++;let cov=false;for(let m=0;m<ops.length;m++)if(m!==k&&opaque(m,x,y)){cov=true;break}if(!cov)vis++}
          return {sprite:o.n,tag:o.tag,order:k,pivot:[+piv.x.toFixed(1),+piv.y.toFixed(1)],joints,box:[bx0,by0,bx1,by1].map(v=>+v.toFixed(1)),ink:ix1<0?null:[ix0,iy0,ix1,iy1],capExposure:tot?+(vis/tot).toFixed(3):null,capPixels:tot}});
        /* socket gap: for each joint of each part, nearest opaque pixel of any part whose pivot sits at that joint */
        parts.forEach((pp,k)=>{pp.socketGap={};pp.jointFit={};pp.jointHits={};for(const j in pp.joints){const [jx,jy]=pp.joints[j];
          let kids=parts.filter(q=>Math.hypot(q.pivot[0]-jx,q.pivot[1]-jy)<1.5&&q!==pp),offset=0;
          if(!kids.length){/* a child the rig code places off the joint (the pack sits 6 rig px left of its mark) */
            const near=parts.filter(q=>q!==pp&&q.sprite!==pp.sprite).map(q=>[Math.hypot(q.pivot[0]-jx,q.pivot[1]-jy),q]).filter(x=>x[0]<12*zoom&&!parts.some(z=>z!==x[1]&&z!==pp&&Object.values(z.joints).some(([a,b])=>Math.hypot(x[1].pivot[0]-a,x[1].pivot[1]-b)<1.5))).sort((a,b)=>a[0]-b[0]);
            if(near.length){kids=[near[0][1]];offset=+(near[0][0]/zoom).toFixed(1)}}
          if(!kids.length){const hp=parts.filter(q=>q.sprite!==pp.sprite&&opaque(q.order,jx,jy));pp.jointHits[j]={hits:hp.map(q=>q.tag),over:hp.filter(q=>q.order>k).map(q=>q.tag),belowGround:jy>gy,anyInk:anyAt(jx,jy)};continue}
          let best=1e9;for(const q of kids){const kk=q.order;for(let r=0;r<40&&best>r;r++){for(let a=0;a<16;a++){const x=jx+Math.cos(a/16*6.283)*r,y=jy+Math.sin(a/16*6.283)*r;if(opaque(kk,x,y)){best=Math.min(best,r);break}}}}
          pp.socketGap[j]=best>=1e9?null:+(best/zoom).toFixed(1);
          const q=kids[0],top=q.order>k?"child":"parent",T=top==="child"?q.order:k,B=top==="child"?k:q.order;
          /* hole scan: transparent pixels near the joint that touch both parts' ink */
          const HR=holeR*zoom;let hole=0,enclosed=0,sliver=0;for(let dy=-HR;dy<=HR;dy+=1)for(let dx=-HR;dx<=HR;dx+=1){if(dx*dx+dy*dy>HR*HR)continue;const x=(jx+dx)|0,y=(jy+dy)|0;if(anyAt(x,y))continue;if(enclosedAt(x,y))enclosed++;
            let np=false,nc=false;for(let ey=-3;ey<=3&&!(np&&nc);ey++)for(let ex=-3;ex<=3;ex++){if(!np&&opaque(k,x+ex,y+ey))np=true;if(!nc&&opaque(q.order,x+ex,y+ey))nc=true}if(np&&nc){hole++;if(sliverAt(x,y))sliver++}}
          /* cap disc (radius capR rig px): overhang = top ink outside bottom, peek = bottom ink not covered by top */
          const CR=capR*zoom;let tT=0,oT=0,tB=0,oB=0;for(let dy=-CR;dy<=CR;dy+=1)for(let dx=-CR;dx<=CR;dx+=1){if(dx*dx+dy*dy>CR*CR)continue;const x=jx+dx,y=jy+dy;const t=opaque(T,x,y),bq=opaque(B,x,y);if(t){tT++;if(!bq)oT++}if(bq){tB++;if(!t)oB++}}
          pp.jointFit[j]={child:q.tag,top,hole,holeArea:+(hole/zoom/zoom).toFixed(1),enclosed,sliver,overhang:tT?+(oT/tT).toFixed(3):null,peek:tB?+(oB/tB).toFixed(3):null,offset}}});
        if(dots){c.setTransform(1,0,0,1,0,0);parts.forEach(pp=>{c.fillStyle="#d92f74";c.beginPath();c.arc(pp.pivot[0],pp.pivot[1],4,0,6.283);c.fill();for(const j in pp.joints){c.strokeStyle="#17807a";c.lineWidth=2;c.beginPath();c.arc(pp.joints[j][0],pp.joints[j][1],4,0,6.283);c.stroke()}})}
        c.setTransform(1,0,0,1,0,0);c.strokeStyle="#aaa";c.beginPath();c.moveTo(0,gy);c.lineTo(W,gy);c.stroke();
        if(sheet){const kc=document.createElement("canvas");kc.width=W;kc.height=H;kc.getContext("2d").drawImage(cv,0,0);keep[mode].push(kc)}
        res.frames.push({mode,i,t:+t.toFixed(2),pose:P,enclosedTotal,png:cv.toDataURL("image/png"),parts});
      }
    }
    if(sheet)for(const mode in keep){const fr=keep[mode],sw=Math.round(W*.6),sh=Math.round(H*.6),sc=document.createElement("canvas");sc.width=sw*fr.length;sc.height=sh+22;const x=sc.getContext("2d");
      x.fillStyle="#fff";x.fillRect(0,0,sc.width,sc.height);fr.forEach((f,i)=>{x.drawImage(f,i*sw,22,sw,sh);x.strokeStyle="#ccc";x.strokeRect(i*sw+.5,22.5,sw-1,sh-1);x.fillStyle="#333";x.font="13px sans-serif";x.fillText(`${rig} ${mode}-${i}`,i*sw+6,15)});
      res.sheets[mode]=sc.toDataURL("image/png")}
    return res;
  },{rig,modes,frames,zoom,capR,holeR,sliverMax,dots,sheet});
  for(const f of report.frames){fs.writeFileSync(path.join(out,`${f.mode}-${f.i}.png`),Buffer.from(f.png.split(",")[1],"base64"));delete f.png}
  for(const n in report.parts){fs.writeFileSync(path.join(out,"parts",n+".png"),Buffer.from(report.parts[n].split(",")[1],"base64"))}delete report.parts;
  for(const m in report.sheets){fs.writeFileSync(path.join(out,`contact-${m}.png`),Buffer.from(report.sheets[m].split(",")[1],"base64"))}delete report.sheets;
  fs.writeFileSync(path.join(out,"report.json"),JSON.stringify(report,null,1));
  if(csv){const rows=["mode,frame,part,joint,child,top,capExposure,socketGap,hole,enclosed,sliver,overhang,peek,offset"];
    for(const f of report.frames)for(const pp of f.parts)for(const j in pp.jointFit){const q=pp.jointFit[j],kid=f.parts.find(z=>z.tag===q.child);
      rows.push([f.mode,f.i,pp.tag,j,q.child,q.top,kid?kid.capExposure:"",pp.socketGap[j],q.hole,q.enclosed,q.sliver,q.overhang,q.peek,q.offset].join(","))}
    fs.writeFileSync(path.join(out,"fit.csv"),rows.join("\n")+"\n")}
  /* summary: worst cap exposure and socket gap per joint across frames */
  const worst={};for(const f of report.frames)for(const pp of f.parts){const k=pp.tag;worst[k]=worst[k]||{capExposure:0,frames:0};worst[k].capExposure=Math.max(worst[k].capExposure,pp.capExposure||0);worst[k].frames++;
    for(const j in pp.socketGap){const g=pp.socketGap[j];if(g==null)continue;worst[k]["gap:"+j]=Math.max(worst[k]["gap:"+j]||0,g)}
    for(const j in pp.jointFit){const q=pp.jointFit[j];worst[k]["hole:"+j]=Math.max(worst[k]["hole:"+j]||0,q.hole);worst[k]["enclosed:"+j]=Math.max(worst[k]["enclosed:"+j]||0,q.enclosed);worst[k]["sliver:"+j]=Math.max(worst[k]["sliver:"+j]||0,q.sliver);worst[k]["peek:"+j]=Math.max(worst[k]["peek:"+j]||0,q.peek||0);worst[k]["overhang:"+j]=Math.max(worst[k]["overhang:"+j]||0,q.overhang||0)}}
  console.log(JSON.stringify({rig,frames:report.frames.length,errors:errs,worst},null,1));
  await b.close();
})();
