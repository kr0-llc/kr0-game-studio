#!/usr/bin/env node
/* Rig test battery. Renders a rig with ../render.js, then checks the report against the rigging plan's acceptance.

   node tools/rig-harness/tests/run.js [--rig timo3] [--override rig.json] [--out dir] [--frames 8] [--no-render]
                                       [--capTol 0.05] [--gapTol 0] [--sliverTol 0] [--peekTol 0.05] [--overhangTol 0.25] [--propTol 15] [--json]

   Prints PASS/FAIL per test with the numbers, writes <out>/tests.json, exits 1 when any test fails. See README.md next to this file. */
const fs=require("fs"),path=require("path"),cp=require("child_process");
const args=process.argv.slice(2),get=(k,d)=>{const i=args.indexOf("--"+k);return i<0?d:args[i+1]};const has=k=>args.includes("--"+k);
const ROOT=path.resolve(__dirname,"..","..",".."),HARNESS=path.resolve(__dirname,"..");
const rig=get("rig","timo3"),override=get("override",null),frames=+get("frames",8);
const out=path.resolve(get("out",path.join(HARNESS,"out","tests-"+rig+(override?"-override":""))));
const TOL={cap:+get("capTol",.05),gap:+get("gapTol",0),sliver:+get("sliverTol",0),peek:+get("peekTol",.05),overhang:+get("overhangTol",.25),prop:+get("propTol",15),bendMax:86};
const REF=path.join(ROOT,"art","metr0niks","characters","tim-o","turnaround","four-view.png");
const rel=p=>path.relative(ROOT,p);
/* draw order the plan asks for, per joint: who is on top of whom */
const PLAN_TOP={knee:"child",elbow:"parent",armF:"child",armB:"parent"};
const fmt=v=>typeof v==="number"?(Number.isInteger(v)?String(v):v.toFixed(3).replace(/0+$/,"").replace(/\.$/,"")):String(v);

(async()=>{
  if(!has("no-render")){
    const a=[path.join(HARNESS,"render.js"),"--rig",rig,"--dots","--csv","--frames",String(frames),"--out",out];if(override)a.push("--override",path.resolve(override));
    const r=cp.spawnSync(process.execPath,a,{stdio:["ignore","pipe","inherit"]});if(r.status!==0){console.error("render failed");process.exit(2)}
    try{const e=JSON.parse(r.stdout.toString()).errors;if(e&&e.length)console.error("page errors:",e)}catch(_){}
  }
  const rep=JSON.parse(fs.readFileSync(path.join(out,"report.json"),"utf8"));
  const png=f=>rel(path.join(out,`${f.mode}-${f.i}.png`));
  const results=[];const add=(name,pass,lines,data)=>results.push({name,pass,lines,data});
  const byTag=f=>Object.fromEntries(f.parts.map(p=>[p.tag,p]));

  /* ---- 1 joint fit: capExposure of every child, socketGap of every parent joint ---- */
  {
    const fails={},worst={};let n=0;
    for(const f of rep.frames){const T=byTag(f);
      for(const pp of f.parts)for(const j in pp.jointFit){const q=pp.jointFit[j],kid=T[q.child],key=`${pp.tag}.${j}`;n++;
        const cap=q.offset?0:(kid.capExposure??0),gap=pp.socketGap[j]??0;
        const w=worst[key]=worst[key]||{cap:0,gap:0,frame:null};
        if(cap>w.cap||gap>w.gap){w.cap=Math.max(w.cap,cap);w.gap=Math.max(w.gap,gap);w.frame=f}
        if(cap>TOL.cap||gap>TOL.gap)(fails[key]=fails[key]||[]).push({frame:`${f.mode}-${f.i}`,cap,gap})}}
    const lines=[];for(const k in worst){const w=worst[k],bad=fails[k]||[];lines.push(`${k}: worst cap ${fmt(w.cap)} gap ${fmt(w.gap)} px, ${bad.length} failing frame(s)${bad.length?" "+bad.map(b=>b.frame).join(" ")+" worst "+png(w.frame):""}`)}
    add("1 joint fit",Object.keys(fails).length===0,[`${n} joint-frames checked, cap < ${TOL.cap} and gap <= ${TOL.gap}`,...lines],{worst:Object.fromEntries(Object.entries(worst).map(([k,w])=>[k,{cap:w.cap,gap:w.gap,frame:w.frame?`${w.frame.mode}-${w.frame.i}`:null}])),fails});
  }
  /* ---- 2 visual gap scan: sealed cracks between parent and child near the joint ---- */
  {
    const worst={},fails={};
    for(const f of rep.frames)for(const pp of f.parts)for(const j in pp.jointFit){const q=pp.jointFit[j],key=`${pp.tag}.${j}`;
      const w=worst[key]=worst[key]||{sliver:0,hole:0,enclosed:0,frame:f};if(q.sliver>w.sliver||(q.sliver===w.sliver&&q.hole>w.hole)){w.sliver=q.sliver;w.frame=f}w.hole=Math.max(w.hole,q.hole);w.enclosed=Math.max(w.enclosed,q.enclosed);
      if(q.sliver>TOL.sliver)(fails[key]=fails[key]||[]).push(`${f.mode}-${f.i}(${q.sliver})`)}
    const lines=[];for(const k in worst){const w=worst[k];lines.push(`${k}: sliver max ${w.sliver} px, notch max ${w.hole} px, enclosed max ${w.enclosed} px${fails[k]?" FAIL "+fails[k].join(" ")+" worst "+png(w.frame):""}`)}
    add("2 visual gap scan",Object.keys(fails).length===0,[`sliver (sealed crack touching both parts, within ${rep.holeR} rig px of the joint) must be <= ${TOL.sliver} px`,...lines],{worst:Object.fromEntries(Object.entries(worst).map(([k,w])=>[k,{sliver:w.sliver,hole:w.hole,enclosed:w.enclosed}])),fails});
  }
  /* ---- 3 draw order: who is on top, cap overhang, cap peek ---- */
  {
    const lines=[],fails=[];const seen={};
    for(const f of rep.frames){const T=byTag(f);
      for(const pp of f.parts)for(const j in pp.jointFit){const q=pp.jointFit[j],key=`${pp.tag}.${j}`;const s=seen[key]=seen[key]||{top:q.top,overhang:0,peek:0,fo:f,fp:f,planOk:true};
        if(q.overhang>s.overhang){s.overhang=q.overhang;s.fo=f}if(q.peek>s.peek){s.peek=q.peek;s.fp=f}
        if(PLAN_TOP[j]&&q.top!==PLAN_TOP[j])s.planOk=false}
      /* back arm under the pack too */
      const pk=T[rep.R.pack],ub=T[rep.R.armB2?rep.R.armB2[0]:rep.R.armB];if(pk&&ub&&ub.order>pk.order){seen["pack-over-backarm"]=seen["pack-over-backarm"]||{top:"back arm over pack",overhang:0,peek:0,fo:f,fp:f,planOk:false}}}
    for(const k in seen){const s=seen[k],bad=[];if(!s.planOk)bad.push(`order differs from plan (top is ${s.top})`);if(s.overhang>TOL.overhang)bad.push(`top cap sticks out ${fmt(s.overhang)} > ${TOL.overhang} at ${png(s.fo)}`);if(s.peek>TOL.peek)bad.push(`bottom cap peeks ${fmt(s.peek)} > ${TOL.peek} at ${png(s.fp)}`);
      lines.push(`${k}: top=${s.top} overhang ${fmt(s.overhang)} peek ${fmt(s.peek)}${bad.length?" FAIL "+bad.join("; "):""}`);if(bad.length)fails.push(k)}
    add("3 draw order",fails.length===0,[`plan: shin over thigh, upper arm over forearm, front arm over torso, back arm under torso and pack`,...lines],{joints:Object.fromEntries(Object.entries(seen).map(([k,s])=>[k,{top:s.top,overhang:s.overhang,peek:s.peek,planOk:s.planOk}])),fails});
  }
  /* ---- 4 elbow behaviour ---- */
  {
    const arms=rep.kind==="biped"?[["F",rep.R.armF2?rep.R.armF2[0]:rep.R.armF,rep.R.armF2?rep.R.armF2[1]:rep.R.armF,"muzzle"],["B",rep.R.armB2?rep.R.armB2[0]:rep.R.armB,rep.R.armB2?rep.R.armB2[1]:rep.R.armB,"tip"]]:[];
    const lines=[],fails=[],data={};
    for(const [side,up,fore,tip0] of arms){const two=up!==fore;let tipName=tip0;const st={min:1e9,max:-1e9,fmin:null,fmax:null,torso:[],ground:[],neg:[]};
      for(const f of rep.frames){if(!["walk","stress","aim"].includes(f.mode))continue;const T=byTag(f),U=T[up],Fo=T[fore];if(!U||!Fo)continue;if(!Fo.joints[tipName])tipName=Object.keys(Fo.joints)[0]||tipName;   /* v4 swaps the weapons between arms */
        let bend=null;if(two){const s=U.pivot,e=U.joints.elbow,t=Fo.joints[tipName];const ux=e[0]-s[0],uy=e[1]-s[1],fx=t[0]-e[0],fy=t[1]-e[1];
          bend=-Math.atan2(ux*fy-uy*fx,ux*fx+uy*fy)*180/Math.PI;/* positive = forearm comes back up toward the aim, as arm2 intends */
          if(bend<st.min){st.min=bend;st.fmin=f}if(bend>st.max){st.max=bend;st.fmax=f}if(bend<-0.5)st.neg.push(`${f.mode}-${f.i}(${bend.toFixed(1)})`)}
        const h=Fo.jointHits[tipName];if(h){if(h.hits.includes(rep.R.torso))st.torso.push(`${f.mode}-${f.i}`);if(h.belowGround)st.ground.push(`${f.mode}-${f.i}`)}}
      data[side]=st;const bad=[];if(st.neg.length)bad.push(`negative bend in ${st.neg.join(" ")}`);if(st.torso.length)bad.push(`${tipName} inside torso in ${st.torso.join(" ")}`);
      lines.push(`arm ${side}: ${two?`elbow bend ${st.min.toFixed(1)}..${st.max.toFixed(1)} deg (min ${st.fmin?png(st.fmin):"-"}, max ${st.fmax?png(st.fmax):"-"})`:"one-piece arm, no elbow"}; ${tipName} in torso: ${st.torso.length} frame(s); ${tipName} below ground: ${st.ground.length} frame(s)${st.ground.length?" "+st.ground.join(" "):""}${two&&st.max>TOL.bendMax?`; WARN bend over ${TOL.bendMax} deg (plan clamp 1.5 rad)`:""}${bad.length?" FAIL "+bad.join("; "):""}`);
      if(bad.length)fails.push(side)}
    add("4 elbow behaviour",fails.length===0,[`bend measured from report.json bones (shoulder->elbow, elbow->${arms.map(a=>a[3]).join("/")}), art tilt included`,...lines],data);
  }
  /* ---- 5 proportions vs the turnaround side view ---- */
  {
    let ref=null,lines=[],pass=true,data={};
    try{ref=await measureReference()}catch(e){lines.push("reference measurement failed: "+e.message);pass=false}
    const rest=rep.frames.find(f=>f.mode==="rest");
    if(ref&&rest){const T=byTag(rest),torso=T[rep.R.torso],upF=T[rep.R.armF2?rep.R.armF2[0]:rep.R.armF],foreF=T[rep.R.armF2?rep.R.armF2[1]:rep.R.armF],thF=T[rep.R.thigh+"@hipF"],shF=T[rep.R.shin+"@hipF"],pack=T[rep.R.pack];
      const top=Math.min(...rest.parts.map(p=>p.ink[1])),sole=Math.max(...rest.parts.map(p=>p.ink[3])),hipY=(torso.joints.hipF[1]+torso.joints.hipB[1])/2,sh=torso.joints.armF;
      const d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
      const tipJ=f=>f.joints.muzzle||f.joints.tip||Object.values(f.joints)[0];const arm=rep.R.armF2?d(upF.pivot,upF.joints.elbow)+d(foreF.pivot,tipJ(foreF)):d(upF.pivot,tipJ(upF));
      const leg=d(thF.pivot,thF.joints.knee)+(shF.ink[3]-shF.pivot[1]);
      const rigM={torso:hipY-torso.ink[1],total:sole-top,arm,leg,packAbove:sh[1]-pack.ink[1],upper:rep.R.armF2?d(upF.pivot,upF.joints.elbow):null,shoulderDrop:sh[1]-torso.ink[1]};
      const ratios=[["arm / torso","arm"],["leg / torso","leg"],["total / torso","total"],["pack above shoulder / torso","packAbove"],["shoulder below top / torso","shoulderDrop"]];
      lines.push(`reference side view (px): torso ${ref.torso.toFixed(0)} total ${ref.total.toFixed(0)} arm ${ref.arm.toFixed(0)} leg ${ref.leg.toFixed(0)} pack above shoulder ${ref.packAbove.toFixed(0)} (landmarks top ${ref.top} waist ${ref.waist} hip ${ref.hip} hipJoint ${ref.hipJoint} sole ${ref.sole} shoulder ${ref.shoulder.map(v=>v.toFixed(0))} fingertip ${ref.fingertip} packTop ${ref.packTop})`);
      lines.push(`rig rest frame (canvas px, zoom ${rep.zoom.toFixed(2)}): torso ${rigM.torso.toFixed(0)} total ${rigM.total.toFixed(0)} arm ${rigM.arm.toFixed(0)}${rigM.upper?` (upper ${rigM.upper.toFixed(0)})`:""} leg ${rigM.leg.toFixed(0)} pack above shoulder ${rigM.packAbove.toFixed(0)}`);
      for(const [label,k] of ratios){const a=rigM[k]/rigM.torso,b=ref[k]/ref.torso,pct=(a-b)/b*100;const bad=Math.abs(pct)>TOL.prop;if(bad)pass=false;data[k]={rig:a,ref:b,pct};lines.push(`${label}: rig ${a.toFixed(2)} ref ${b.toFixed(2)} (${pct>=0?"+":""}${pct.toFixed(0)}%)${bad?" FAIL":""}`)}
      data.ref=ref;data.rig=rigM}
    add("5 proportions",pass,[`ratios within ${TOL.prop}% of the turnaround side view`,...lines],data);
  }
  /* ---- 6 contact sheets ---- */
  {
    const modes=[...new Set(rep.frames.map(f=>f.mode))],missing=modes.filter(m=>{const p=path.join(out,`contact-${m}.png`);return !fs.existsSync(p)||fs.statSync(p).size<1000});
    add("6 contact sheets",missing.length===0,modes.map(m=>rel(path.join(out,`contact-${m}.png`))+(missing.includes(m)?" MISSING":"")),{missing});
  }
  /* ---- 7 the runner itself: page errors and frame count ---- */
  {
    const expect=rep.frames.length;add("7 regression hook",expect>0,[`${expect} frames rendered for ${rig}${override?" with override "+override:""}, report ${rel(path.join(out,"report.json"))}`],{frames:expect});
  }

  const allPass=results.every(r=>r.pass);
  if(has("json"))console.log(JSON.stringify({rig,override,out:rel(out),pass:allPass,results},null,1));
  else{console.log(`rig ${rig}${override?" + "+override:""}  ->  ${rel(out)}`);for(const r of results){console.log(`${r.pass?"PASS":"FAIL"}  ${r.name}`);for(const l of r.lines)console.log("      "+l)}console.log(allPass?"ALL PASS":"SOME TESTS FAILED")}
  fs.writeFileSync(path.join(out,"tests.json"),JSON.stringify({rig,override,tolerances:TOL,pass:allPass,results},null,1));
  process.exit(allPass?0:1);

  /* reference: second figure of four-view.png (side view), measured by colour thresholds. Landmarks are row/column features of the silhouette:
     top = first ink row; sole = last saturated row (the drop shadow is grey and does not count); waist = first row below the widest torso row
     narrower than 80% of it; hip = first row below the waist narrower than 55%; hipJoint = midpoint of waist and hip (the socket sits inside the
     pelvis block); shoulder = centroid of the green shoulder pad (green pixels in the upper middle of the figure); fingertip = lowest green pixel of
     the hand in the lower middle; packTop = first ink row in the right quarter of the figure (the pack sticks up behind the shoulder). */
  async function measureReference(){
    const cache=path.join(out,"ref-measure.json");
    const {chromium}=require("playwright");const b=await chromium.launch(),p=await b.newPage();
    const data="data:image/png;base64,"+fs.readFileSync(REF).toString("base64");
    const m=await p.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const W=img.width,H=img.height,cv=document.createElement("canvas");cv.width=W;cv.height=H;const c=cv.getContext("2d");c.drawImage(img,0,0);const d=c.getImageData(0,0,W,H).data;
      const px=(x,y)=>{const i=(y*W+x)*4;return [d[i],d[i+1],d[i+2]]},ink=([r,g,bb])=>Math.min(r,g,bb)<190||Math.max(r,g,bb)-Math.min(r,g,bb)>40,sat=([r,g,bb])=>Math.max(r,g,bb)-Math.min(r,g,bb)>40,green=([r,g,bb])=>g>r+8&&g>bb+4&&g>110;
      const cols=[];for(let x=0;x<W;x++){let a=false;for(let y=0;y<H&&!a;y++)if(ink(px(x,y)))a=true;cols.push(a)}
      const segs=[];let s=null;for(let x=0;x<=W;x++){const v=x<W&&cols[x];if(v&&s==null)s=x;if(!v&&s!=null){segs.push([s,x-1]);s=null}}
      if(segs.length<2)throw new Error("fewer than two figures found");const [x0,x1]=segs[1],fw=x1-x0+1;
      const rows=[];for(let y=0;y<H;y++){let n=0,ss=false;for(let x=x0;x<=x1;x++){const q=px(x,y);if(ink(q)){n++;if(sat(q))ss=true}}rows.push([n,ss])}
      let top=rows.findIndex(r=>r[0]>0),sole=H-1;while(sole>0&&!rows[sole][1])sole--;const fh=sole-top;
      let maxW=0,maxY=top;for(let y=top;y<=sole;y++)if(rows[y][0]>maxW){maxW=rows[y][0];maxY=y}
      let waist=maxY;while(waist<sole&&rows[waist][0]>=.8*maxW)waist++;let hip=waist;while(hip<sole&&rows[hip][0]>=.55*maxW)hip++;const hipJoint=(waist+hip)/2;
      let gx=0,gy=0,gn=0,padTop=1e9;for(let y=top+fh*.1;y<top+fh*.38;y++)for(let x=x0+fw*.35;x<x0+fw*.8;x++){if(green(px(x|0,y|0))){gx+=x;gy+=y;gn++;padTop=Math.min(padTop,y)}}
      if(!gn)throw new Error("no shoulder pad found");const shoulder=[gx/gn,gy/gn];
      let finger=0,fxs=0,fxn=0;for(let y=top+fh*.65;y<top+fh*.85;y++)for(let x=x0+fw*.15;x<x0+fw*.6;x++)if(green(px(x|0,y|0))){if(y>finger){finger=y;fxs=0;fxn=0}if(y===finger){fxs+=x;fxn++}}const fingerX=fxn?fxs/fxn:x0+fw*.38;
      let packTop=1e9;for(let y=top;y<sole;y++){for(let x=x0+fw*.75;x<=x1;x++)if(ink(px(x|0,y))){packTop=Math.min(packTop,y);break}if(packTop<1e9)break}
      return {figure:[x0,x1],top,sole,waist,hip,hipJoint,maxW,shoulder,padTop,fingertip:[fingerX,finger],packTop,torso:hipJoint-top,total:sole-top,leg:sole-hipJoint,arm:Math.hypot(finger-shoulder[1],shoulder[0]-fingerX),packAbove:shoulder[1]-packTop,shoulderDrop:shoulder[1]-top}},data);
    await b.close();fs.writeFileSync(cache,JSON.stringify(m,null,1));return m;
  }
})();
