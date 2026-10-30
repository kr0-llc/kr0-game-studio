/* Review-page test (needs the page's #walkLive canvas and controls): walking away from the camera: front 3/4 parts (v2.1) and back 3/4 parts, picked by walk direction, mirrored for left. */
(function(){
const INK="#2a2420",q=id=>document.getElementById(id);
const SETS={front:{img:new Image(),src:"atlas-v2-1.webp"},back:{img:new Image(),src:"atlas-back34.webp"}};
let ready=0,mode="circle",playing=true,speed=1,t=0,last=0,legsOnly=false;
const ss=u=>u*u*(3-2*u);
function spr(ctx,S,n,x,y,r,sc){const s=S.A.sprites[n],k=1/S.A.store,w=s.w*k,h=s.h*k;ctx.save();ctx.translate(x,y);if(r)ctx.rotate(r);ctx.scale(sc||1,sc||1);if(s.rot)ctx.rotate(s.rot);
  ctx.drawImage(S.img,s.x,s.y,s.w,s.h,-s.pivot[0]*w,-s.pivot[1]*h,w,h);ctx.restore()}
function joint(S,n,j){const s=S.A.sprites[n],k=1/S.A.store,p=s.joints[j];return {x:(p[0]-s.pivot[0])*s.w*k,y:(p[1]-s.pivot[1])*s.h*k}}
/* one mech at ground point (gx,gy), facing set "front"/"back", m=+1 right / -1 left, walk phase ph (radians), sc scale */
function mech(ctx,set,m,gx,gy,ph,sc){const S=SETS[set],back=set==="back";
  const LK=.82,kn=joint(S,"p_thigh","knee"),tl=Math.hypot(kn.x,kn.y)*LK,sh=S.A.sprites.p_shin,sl=(1-sh.pivot[1])*sh.h/S.A.store*LK;
  const bob=Math.abs(Math.sin(ph))*3,lean=.05;
  ctx.save();ctx.translate(gx,gy);ctx.scale(m*sc,sc);
  const hipY=-(tl+sl)*.93-bob,ty=hipY-joint(S,"p_torso","hipF").y;
  function leg(side,p){const hip=joint(S,"p_torso",side),a1=Math.sin(p)*.42,a2=a1-Math.max(0,Math.cos(p))*.55;
    const hx=hip.x,hy=ty+hip.y,kx=hx-Math.sin(a1)*tl,ky=hy+Math.cos(a1)*tl;
    spr(ctx,S,"p_thigh",hx,hy,a1,LK);spr(ctx,S,"p_shin",kx,ky,a2,LK)}
  const armAng=back?-.38:.04,sw=Math.sin(ph)*.05;
  function arm(side,n,a,s){const j=joint(S,"p_torso",side);spr(ctx,S,n,j.x,ty+j.y,a,s)}
  /* shadow */
  ctx.save();ctx.scale(1,.32);ctx.beginPath();ctx.arc(0,0,48,0,6.283);ctx.fillStyle="rgba(42,36,32,.16)";ctx.fill();ctx.restore();
  if(back){
    if(!legsOnly)arm("armB","p_armL",armAng-sw,.9);
    leg("hipB",ph+Math.PI);leg("hipF",ph);
    if(!legsOnly){spr(ctx,S,"p_torso",0,ty,lean,1);const pk=joint(S,"p_torso","pack");spr(ctx,S,"p_pack",pk.x,ty+pk.y,lean,.82);
      arm("armF","p_armR",armAng+sw,1)}
  }else{
    if(!legsOnly){arm("armB","p_armL",armAng-sw,.92);const pk=joint(S,"p_torso","pack");spr(ctx,S,"p_pack",pk.x-6,ty+pk.y,lean,.7)}
    leg("hipB",ph+Math.PI);leg("hipF",ph);
    if(!legsOnly){spr(ctx,S,"p_torso",0,ty,lean,1);arm("armF","p_armR",armAng+sw,1)}
  }
  ctx.restore()}
function ground(ctx,w,h){ctx.fillStyle="#efe6d2";ctx.fillRect(0,0,w,h);ctx.strokeStyle="rgba(42,36,32,.10)";ctx.lineWidth=1;
  for(let i=-20;i<40;i++){ctx.beginPath();ctx.moveTo(i*40,0);ctx.lineTo(i*40+h*1.7,h);ctx.stroke();ctx.beginPath();ctx.moveTo(i*40,h);ctx.lineTo(i*40+h*1.7,0);ctx.stroke()}}
function label(ctx,x,y,txt){ctx.font="600 12px system-ui,sans-serif";ctx.fillStyle=INK;ctx.textAlign="center";ctx.fillText(txt,x,y)}
const NAME={front:{1:"Front 3/4, right",[-1]:"Front 3/4, left (mirrored)"},back:{1:"Back 3/4, right",[-1]:"Back 3/4, left (mirrored)"}};
function draw(){if(ready<2)return;const c=q("walkLive"),d=Math.min(2,window.devicePixelRatio||1),w=720,h=300;
  if(c.width!==w*d){c.width=w*d;c.height=h*d}const ctx=c.getContext("2d");ctx.setTransform(d,0,0,d,0,0);ground(ctx,w,h);
  const ph=t*2*Math.PI*1.1;
  if(mode==="circle"){/* walk an ellipse; the drawn facing follows the direction of travel */
    const a=t*.42,cx=w/2,cy=h*.68,rx=240,ry=52,x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry,vx=-Math.sin(a)*rx,vy=Math.cos(a)*ry;
    const set=vy<0?"back":"front",m=vx<0?-1:1,sc=.66+.14*(y-cy+ry)/(2*ry);
    ctx.save();ctx.setLineDash([4,6]);ctx.strokeStyle="rgba(42,36,32,.25)";ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,6.283);ctx.stroke();ctx.restore();
    mech(ctx,set,m,x,y,ph,sc);q("walkT").textContent=NAME[set][m];
  }else{const set=mode,ms=[1,-1];ms.forEach((m,i)=>{const x=w*(.28+.44*i);mech(ctx,set,m,x,h*.86,ph,1.05);label(ctx,x,h-6,NAME[set][m])});q("walkT").textContent="";}
}
function tick(now){if(playing&&last)t+=(now-last)/1000*speed;last=now;draw();requestAnimationFrame(tick)}
function init(){if(!q("walkLive"))return;
  q("walkTabs").querySelectorAll("button").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;q("walkTabs").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));draw()});
  q("walkPlay").onclick=e=>{playing=!playing;e.target.textContent=playing?"Pause":"Play";e.target.setAttribute("aria-pressed",String(playing))};
  q("walkSpeed").onchange=e=>speed=+e.target.value;
  q("walkLegs").onchange=e=>{legsOnly=e.target.checked;draw()};
  const go=()=>{if(++ready===2){SETS.front.A=window.TIMO_RIG2;SETS.back.A=window.TIMO_RIG_BACK;
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){playing=false;q("walkPlay").textContent="Play";q("walkPlay").setAttribute("aria-pressed","false")}requestAnimationFrame(tick)}};
  Object.values(SETS).forEach(S=>{S.img.onload=go;S.img.src=S.src});
  /* verdict, stored like the rig moves as rig-walkback */
  const V={};let db=null;const ta=q("walkNote"),stEl=q("walkStatus");
  const paint=()=>{q("walkVote").querySelectorAll("[data-v]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===V.verdict)));if(document.activeElement!==ta)ta.value=V.note||""};
  async function save(){V.note=ta.value;if(!db){stEl.textContent="Saving is off in this view.";return}try{await db.collection("verdicts").doc("rig-walkback").set({action:"rig-walkback",verdict:V.verdict||null,flags:[],note:V.note||"",updatedAt:new Date().toISOString()});stEl.textContent="Saved."}catch(e){stEl.textContent="Couldn't save; try again."}}
  q("walkVote").querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{V.verdict=V.verdict===b.dataset.v?null:b.dataset.v;paint();save()});
  ta.onblur=save;
  (async()=>{try{db=window.claude?await window.claude.use("db"):null}catch(e){db=null}if(!db)return;
    db.collection("verdicts").onSnapshot(snap=>{(snap.docs||[]).forEach(d=>{const v=d.data?d.data():d,id=d.id||v.action;if(id!=="rig-walkback")return;V.verdict=v.verdict||null;V.note=v.note||""});paint()},()=>{})})();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
