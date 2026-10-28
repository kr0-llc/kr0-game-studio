/* Tim-o on the ink prototype's cut-out puppet: the same parts, joints and two-bone IK legs as
   games/metr0niks/prototypes/prototype-ink.html, driven by keyed timelines instead of the walk cycle.
   Moves: dash (GDD 12 m/s for 0.15 s), pile-bunker charge/fire/retract (1.5 s retract on a Miss),
   jump-jets from the legs, overheat vent (guns locked 3 s), destroyed break-apart.
   Parts: v2.1 sheet (28 Oct, aligned ball joints) or the rejected v1 sheet. */
(function(){
const INK="#2b2420";
const atlas=new Image(),atlas2=new Image(),ground=new Image();let A=null,A2=null,ready=0,CUR=null;
/* puppet parts come from the chosen set; dust and puffs always from the prototype atlas */
const setFor=n=>n.startsWith("p_")&&CUR?CUR:{A,img:atlas};
const ss=u=>u*u*(3-2*u),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* pose channels. x root (px), lift (px up), c crouch (px down), tilt (rad, + leans forward),
   ff/bf front and back foot targets relative to their hip (x forward, y up from the ground),
   fl pack flame, jl leg-jet flame (-1 = same as fl), ja leg-jet angle, drp arms droop 0-1,
   bx bunker arm thrust (px), pile spike out 0-1, ring ATB charge 0-1, hit impact flash,
   heat 0-1, fire minigun firing 0-1, shk shudder, wf white hit flash */
const DEF={x:0,lift:0,c:0,tilt:0,ff:[8,0],bf:[-8,0],fl:0,jl:-1,ja:.35,drp:0,bx:0,pile:0,ring:0,hit:0,heat:0,fire:0,shk:0,wf:0};
function track(K,t){let i=0;while(i<K.length-2&&t>K[i+1].t)i++;const a={...DEF,...K[i]},b={...DEF,...K[i+1]},u=ss(clamp((t-a.t)/(b.t-a.t),0,1)),o={};
  for(const k in DEF){const p=a[k],q=b[k];o[k]=Array.isArray(p)?[p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u]:p+(q-p)*u}
  if(o.jl<0)o.jl=o.fl;return o}
/* deterministic particles so the live view and the frame strip match */
let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
const MOVES={
 dash:{name:"Dash",loop:1.6,zoom:1.25,x0:.16,breath:1,K:[
  {t:0.00,x:0,  c:0, tilt:0,    ff:[8,0],   bf:[-8,0],  fl:0},
  {t:0.10,x:-4, c:15,tilt:-.10, ff:[12,0],  bf:[-14,0], fl:0},
  {t:0.14,x:6,  c:4, tilt:.30,  ff:[-18,16],bf:[-40,8], fl:1},
  {t:0.29,x:170,c:2, tilt:.26,  ff:[-14,14],bf:[-36,10],fl:.8},
  {t:0.36,x:214,c:8, tilt:-.06, ff:[22,2],  bf:[-6,4],  fl:0},
  {t:0.46,x:240,c:13,tilt:-.20, ff:[34,0],  bf:[4,0],   fl:0},
  {t:0.62,x:254,c:14,tilt:-.08, ff:[22,0],  bf:[-6,0],  fl:0},
  {t:0.80,x:256,c:-3,tilt:.04,  ff:[10,0],  bf:[-8,0],  fl:0},
  {t:1.00,x:256,c:0, tilt:0,    ff:[8,0],   bf:[-8,0],  fl:0},
  {t:1.60,x:256,c:0, tilt:0,    ff:[8,0],   bf:[-8,0],  fl:0}],
  strip:[0,.06,.11,.14,.19,.25,.31,.37,.45,.58,.78,1.0]},
 bunker:{name:"Pile-bunker",loop:3.4,zoom:1,x0:.26,tg:[250,-95],breath:0,K:[
  {t:0},
  {t:.25,c:2},
  {t:1.05,c:12,tilt:-.14,bx:-8,ring:1,ff:[14,0],bf:[-14,0]},
  {t:1.12,c:4,tilt:.24,bx:8,pile:1,hit:1,ff:[30,0],bf:[-18,0]},
  {t:1.25,c:6,tilt:.18,bx:6,pile:1,ff:[30,0],bf:[-18,0]},
  {t:1.40,c:6,tilt:.14,bx:6,pile:1,ff:[30,0],bf:[-18,0]},
  {t:2.90,c:2,tilt:0,bx:0,pile:0,ff:[16,0],bf:[-12,0]},
  {t:3.15},{t:3.40}],
  strip:[0,.4,.7,1.0,1.08,1.12,1.2,1.5,2.0,2.5,2.9,3.2]},
 jets:{name:"Jump-jets",jlen:1.8,loop:2.8,zoom:.72,x0:.4,tg:[210,-150],breath:0,K:[
  {t:0,ja:-1.45},
  {t:.22,c:16,tilt:-.06,ff:[10,0],bf:[-10,0],ja:-1.45},
  {t:.30,c:-6,lift:14,jl:1,ff:[6,6],bf:[-6,6],ja:-1.45},
  {t:.55,lift:76,jl:1,tilt:.05,ff:[14,8],bf:[-4,10],ja:-1.45},
  {t:.90,lift:85,jl:.8,tilt:.04,ff:[12,8],bf:[-4,10],ja:-1.45},
  {t:1.20,lift:80,jl:.85,tilt:.02,ff:[12,8],bf:[-4,10],ja:-1.45},
  {t:1.50,lift:36,jl:.5,ff:[10,4],bf:[-8,4],ja:-1.45},
  {t:1.72,lift:0,jl:.2,c:4,ja:-1.45},
  {t:1.80,c:18,tilt:-.08,ff:[10,0],bf:[-10,0],ja:-1.45},
  {t:2.05,c:-2,ja:-1.45},{t:2.30,ja:-1.45},{t:2.80,ja:-1.45}],
  strip:[0,.2,.3,.42,.6,.9,1.2,1.45,1.65,1.8,1.95,2.3]},
 vent:{name:"Overheat vent",loop:4.6,zoom:1,x0:.26,tg:[260,-100],breath:0,K:[
  {t:0,fire:1},
  {t:.70,fire:1,heat:1},
  {t:.75,heat:1},
  {t:1.05,drp:1,c:10,tilt:-.06,heat:1},
  {t:3.40,drp:1,c:10,tilt:-.06,heat:.45},
  {t:3.75,drp:1,c:8,tilt:-.04,heat:.25},
  {t:4.05},{t:4.60}],
  strip:[0,.3,.6,.8,1.0,1.4,2.0,2.6,3.2,3.7,3.9,4.2]},
 destroyed:{name:"Destroyed",loop:3.6,zoom:.9,x0:.4,tg:[230,-100],breath:0,brk:.52,K:[
  {t:0},
  {t:.08,wf:1,shk:1,tilt:-.12,c:6,heat:.5},
  {t:.18,wf:0,shk:.7,tilt:.08,c:4,heat:.6},
  {t:.30,wf:.6,shk:1,tilt:-.1,c:8,heat:.9},
  {t:.50,wf:1,shk:1,tilt:-.04,c:10,heat:1},
  {t:.60,shk:1,tilt:-.04,c:10,heat:.5},
  {t:3.6,shk:1,tilt:-.04,c:10,heat:.3}],
  strip:[0,.08,.2,.32,.48,.56,.64,.76,.95,1.3,2.0,3.0]}
};
/* particles: b birth (s), x,y local start, vx,vy (px/s, y up), s size, life, n sprite or "steam"/"spark", at anchor */
function P(o){return Object.assign({x:0,y:0,vx:0,vy:0,s:20,life:.6,n:"puff",at:null},o)}
(function(){const D=MOVES.dash,ps=[];D.parts=ps;
  for(let i=0;i<7;i++)ps.push(P({b:.12+rnd()*.05,x:-20-rnd()*30,vx:-60-rnd()*80,s:22+rnd()*18,life:.5+rnd()*.3}));
  for(let i=0;i<10;i++){const b=.33+rnd()*.25;ps.push(P({b,x:track(D.K,b).x+30+rnd()*14,vx:40+rnd()*60,s:16+rnd()*22,life:.45+rnd()*.35,n:rnd()<.5?"puff":"dust"}))}
  const B=MOVES.bunker.parts=[];
  for(let i=0;i<14;i++)B.push(P({b:1.4+i*.1+rnd()*.05,n:"steam",at:"tip",vx:-10+rnd()*20,vy:30+rnd()*30,s:7+rnd()*6,life:.6+rnd()*.3}));
  for(let i=0;i<6;i++)B.push(P({b:1.12,n:"spark",at:"tip",vx:60+rnd()*160,vy:-60+rnd()*160,s:6,life:.25+rnd()*.15}));
  const J=MOVES.jets.parts=[];
  for(let i=0;i<8;i++)J.push(P({b:.28+rnd()*.06,x:-30+rnd()*60,vx:(rnd()<.5?-1:1)*(50+rnd()*70),s:20+rnd()*16,life:.5+rnd()*.3,n:rnd()<.5?"puff":"dust"}));
  for(let i=0;i<8;i++)J.push(P({b:1.76+rnd()*.06,x:-30+rnd()*60,vx:(rnd()<.5?-1:1)*(40+rnd()*60),s:18+rnd()*16,life:.5+rnd()*.3,n:rnd()<.5?"puff":"dust"}));
  const V=MOVES.vent.parts=[];
  for(let i=0;i<26;i++)V.push(P({b:.8+i*.11+rnd()*.05,n:"steam",at:"pack",x:-4+rnd()*8,vx:-25+rnd()*20,vy:60+rnd()*40,s:9+rnd()*8,life:.8+rnd()*.4}));
  for(let i=0;i<8;i++)V.push(P({b:.85+i*.3+rnd()*.1,n:"steam",at:"muzzle",vx:-5+rnd()*10,vy:35+rnd()*20,s:6+rnd()*4,life:.6+rnd()*.3}));
  const X=MOVES.destroyed.parts=[];
  for(let i=0;i<5;i++)X.push(P({b:.08+i*.1,n:"spark",at:"core",vx:-120+rnd()*240,vy:40+rnd()*160,s:6,life:.25}));
  for(let i=0;i<14;i++)X.push(P({b:.55+rnd()*.15,n:"spark",at:"core",vx:-260+rnd()*520,vy:40+rnd()*300,s:8,life:.3+rnd()*.2}));
  for(let i=0;i<12;i++)X.push(P({b:.9+i*.2,x:-20+rnd()*60,y:10,vx:-10+rnd()*20,vy:-28-rnd()*20,s:26+rnd()*20,life:1.2+rnd()*.5,n:"smoke"}));
  /* break-apart: each piece flies from its anchor, spins, lands and stays */
  MOVES.destroyed.pieces={torso:{vx:30,vy:170,w:1.6,r:40},pack:{vx:-110,vy:230,w:-3,r:26},armF:{vx:150,vy:250,w:5,r:16},armB:{vx:-70,vy:270,w:-4.5,r:16},
    hipF:{vx:60,vy:120,w:2.2,r:10},hipB:{vx:-40,vy:110,w:-2,r:10}};
})();

function spr(ctx,n,x,y,r,sx,sy){const S=setFor(n),s=S.A.sprites[n],k=1/S.A.store,w=s.w*k,h=s.h*k;ctx.save();ctx.translate(x,y);if(r)ctx.rotate(r);ctx.scale(sx||1,sy||sx||1);if(s.rot)ctx.rotate(s.rot);
  ctx.drawImage(S.img,s.x,s.y,s.w,s.h,-s.pivot[0]*w,-s.pivot[1]*h,w,h);
  if(TINT.a>0){const c=tinted(S,n,s);ctx.globalAlpha*=TINT.a;ctx.drawImage(c,-s.pivot[0]*w,-s.pivot[1]*h,w,h)}ctx.restore()}
/* heat and hit flashes: the part's own silhouette filled with one colour */
const TINT={a:0,col:"#fff"},TC={};
function tinted(S,n,s){const key=S.id+n+TINT.col;if(TC[key])return TC[key];const c=document.createElement("canvas");c.width=s.w;c.height=s.h;const x=c.getContext("2d");
  x.drawImage(S.img,s.x,s.y,s.w,s.h,0,0,s.w,s.h);x.globalCompositeOperation="source-atop";x.fillStyle=TINT.col;x.fillRect(0,0,s.w,s.h);return TC[key]=c}
function joint(n,j){const S=setFor(n),s=S.A.sprites[n],k=1/S.A.store,p=s.joints[j];return {x:(p[0]-s.pivot[0])*s.w*k,y:(p[1]-s.pivot[1])*s.h*k}}
/* a joint on an arm drawn at shoulder o, angle ang, scale sc, pushed ext px along its axis */
function armPt(n,j,o,ang,sc,ext){const s=setFor(n).A.sprites[n],p=joint(n,j),r=s.rot||0;let x=(p.x*Math.cos(r)-p.y*Math.sin(r))*sc+ext,y=(p.x*Math.sin(r)+p.y*Math.cos(r))*sc;
  return {x:o.x+x*Math.cos(ang)-y*Math.sin(ang),y:o.y+x*Math.sin(ang)+y*Math.cos(ang)}}
const R={torso:"p_torso",thigh:"p_thigh",shin:"p_shin",armF:"p_armR",armB:"p_armL",pack:"p_pack",scale:1.15,legLen:.82};
const LL={};function legLens(){if(LL[CUR.id])return LL[CUR.id];const k=R.legLen,kn=joint(R.thigh,"knee"),sh=CUR.A.sprites[R.shin];
  return LL[CUR.id]={l1:Math.hypot(kn.x,kn.y)*k,l2:sh.h/CUR.A.store*(1-sh.pivot[1])*k*.94,base:Math.atan2(-kn.x,kn.y)}}
function flame(ctx,x,y,ang,len,w,t){if(len<2)return;const j=1+Math.sin(t*90)*.12;ctx.save();ctx.translate(x,y);ctx.rotate(ang);
  const P=(L,W)=>{ctx.beginPath();ctx.moveTo(0,-W);ctx.quadraticCurveTo(L*.55,-W*1.05,L*j,0);ctx.quadraticCurveTo(L*.55,W*1.05,0,W);ctx.closePath()};
  P(len,w);ctx.fillStyle="#ef8a4c";ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=INK;ctx.stroke();P(len*.6,w*.5);ctx.fillStyle="#ffd98a";ctx.fill();ctx.restore()}
function blob(ctx,x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=INK;ctx.stroke()}
function star(ctx,x,y,r,a){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.beginPath();for(let i=0;i<16;i++){const q=i%2?r*.42:r,an=i/16*6.283;ctx[i?"lineTo":"moveTo"](Math.cos(an)*q,Math.sin(an)*q)}ctx.closePath();
  ctx.fillStyle="#ffd98a";ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=INK;ctx.stroke();ctx.restore()}
/* draw one particle at local (x,y), age u 0-1 */
function particle(ctx,d,x,y,u,zoom){ctx.save();ctx.globalAlpha*=(1-u);
  if(d.n==="steam")blob(ctx,x,y,d.s*(.6+u*1.2),"#f6f1e7");
  else if(d.n==="smoke")blob(ctx,x,y,d.s*(.5+u),"rgba(120,108,96,.55)");
  else if(d.n==="spark"){ctx.strokeStyle="#ef8a4c";ctx.lineWidth=3/zoom+1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-d.vx*.03,y+d.vy*.03);ctx.stroke()}
  else spr(ctx,d.n,x,y,0,(d.s*(0.6+u*.9))/80,(d.s*(0.6+u*.9))/80);
  ctx.restore()}

/* draw the whole scene at time t into ctx (w x h css px) */
function scene(ctx,w,h,t,opt){
  CUR=opt.parts==="v1"?{A,img:atlas,id:"v1"}:{A:A2,img:atlas2,id:"v2"};
  const M=MOVES[opt.move||"dash"],zoom=(opt.zoom||1)*M.zoom,face=opt.face||1,gy=h*.78;
  const fwd=opt.aimBack?.7:M.x0,x0=face>0?w*fwd:w*(1-fwd),p=track(M.K,t),G=700;
  ctx.save();
  if(ground.complete&&ground.naturalWidth){ctx.fillStyle=ctx.createPattern(ground,"repeat");ctx.fillRect(0,0,w,h)}else{ctx.fillStyle="#e8d6b0";ctx.fillRect(0,0,w,h)}
  ctx.translate(x0,gy);ctx.scale(zoom,zoom);
  const m=opt.aimBack?-1:1,rx=p.x*face*m;
  /* aim target: a fixed point ahead, so the arms keep tracking it whatever the legs do */
  const tg=M.tg||[opt.aimBack?150:330,-105],tgx=tg[0]*face,tgy=tg[1];
  ctx.save();ctx.strokeStyle="rgba(255,61,139,.85)";ctx.lineWidth=2/zoom*1.2;ctx.beginPath();ctx.arc(tgx,tgy,9,0,6.283);ctx.moveTo(tgx-14,tgy);ctx.lineTo(tgx+14,tgy);ctx.moveTo(tgx,tgy-14);ctx.lineTo(tgx,tgy+14);ctx.stroke();
  /* pile-bunker ATB ring fills around the target while charging */
  if(p.ring>.01){ctx.lineWidth=5/zoom+1;ctx.strokeStyle="#ff3d8b";ctx.beginPath();ctx.arc(tgx,tgy,22,-Math.PI/2,-Math.PI/2+p.ring*6.283);ctx.stroke()}
  ctx.restore();
  /* ground particles behind the mech */
  (M.parts||[]).forEach(d=>{if(d.at)return;const a=t-d.b;if(a<0||a>d.life)return;const u=a/d.life;ctx.save();ctx.globalAlpha=.85;
    const px=(d.x+d.vx*a*(1-u*.5))*face*m;particle(ctx,d,d.n==="smoke"?px:px,d.n==="smoke"?-(d.y-d.vy*a):-6-u*14,u,zoom);ctx.restore()});
  /* shadow, smaller when lifted */
  const sh=1/(1+p.lift/60);ctx.fillStyle=`rgba(92,64,44,${.22*sh})`;ctx.beginPath();ctx.ellipse(rx,0,52*sh,18*sh,0,0,6.283);ctx.fill();
  /* speed lines during the dash burst */
  if(opt.move==="dash"||!opt.move){if(p.fl>.3){ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.globalAlpha=Math.min(1,p.fl);for(let i=0;i<4;i++){const yy=-40-i*22,xx=rx-face*m*(70+i*9);ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-face*m*(40+i*12),yy);ctx.stroke()}ctx.restore()}}
  /* the mech: same layering as drawBiped */
  ctx.save();ctx.translate(rx,0);ctx.scale(face*R.scale,R.scale);
  const L=legLens(),hipF=joint(R.torso,"hipF"),by=-((L.l1+L.l2)*.93+hipF.y);
  /* break-apart: after M.brk the body pose freezes and each piece flies from its anchor */
  const tb=M.brk!=null?t-M.brk:-1,pl=tb>=0?track(M.K,M.brk):p;
  const shk=pl.shk&&tb<0?Math.sin(t*95)*2.2*pl.shk:0;
  const ty=by+pl.c-pl.lift+shk*.5+(M.breath&&t>1?Math.sin(t*2.2)*1.2:0)+(p.jl>.5&&p.lift>20?Math.sin(t*9)*2*p.jl:0);
  const tilt=pl.tilt*m+shk*.01,FA=a=>m>0?Math.PI+a:-a;
  function piece(id,ax,ay,fn){if(tb<0||!M.pieces){fn();return}const q=M.pieces[id],tl=(q.vy+Math.sqrt(q.vy*q.vy+2*G*Math.max(0,-ay-q.r)))/G,tt=Math.min(tb,tl);
    let dx=q.vx*tt,dy=-q.vy*tt+.5*G*tt*tt;if(tb>tl)dx+=q.vx*.25*Math.min(.3,tb-tl);ctx.save();ctx.translate(ax+dx,ay+dy);ctx.rotate(q.w*tt);ctx.translate(-ax,-ay);fn();ctx.restore()}
  const feet={};
  function leg(side,off){const hip=joint(R.torso,side),k=R.legLen,hx=hip.x,hy=ty+hip.y,fx=hx+off[0]*m,fy=-off[1]-pl.lift;
    const dx=fx-hx,dy=fy-hy,dd=Math.min(Math.hypot(dx,dy),(L.l1+L.l2)*.999),aF=Math.atan2(-dx,dy);
    const bend=Math.acos(clamp((L.l1*L.l1+dd*dd-L.l2*L.l2)/(2*L.l1*dd),-1,1)),r1=aF-bend;
    const kx=hx-Math.sin(r1)*L.l1,ky=hy+Math.cos(r1)*L.l1,r2=Math.atan2(-(fx-kx),fy-ky);
    const fx2=kx-Math.sin(r2)*L.l2,fy2=ky+Math.cos(r2)*L.l2;
    piece(side,hx,hy,()=>{spr(ctx,R.thigh,hx,hy,r1-L.base,k,k);spr(ctx,R.shin,kx,ky,r2,k,k)});feet[side]={x:fx2,y:fy2}}
  /* aim angle from the shoulder to the target, in this mirrored frame, clamped like aimD(); droop blends toward hanging arms */
  const sa=joint(R.torso,"armF"),sb=joint(R.torso,"armB"),pk=joint(R.torso,"pack");
  let aim=Math.atan2(tgy/R.scale-(ty+sa.y),(tgx-rx)*face/R.scale-sa.x);aim=clamp(aim,-.8,.95);
  const angF=aim+(1.05-aim)*p.drp+tilt*.25,angB=(aim*.9+tilt*.5)+(1.15-(aim*.9+tilt*.5))*p.drp;
  const jets=p.jl*(opt.jets===false&&(opt.move||"dash")==="dash"?0:1),ja=p.ja;
  TINT.a=0;const heatA=p.heat*(.18+.1*Math.sin(t*14)),flash=p.wf*(.5+.5*Math.sin(t*60));
  const setTint=part=>{if(flash>.05){TINT.col="#ffffff";TINT.a=flash*.8}else if(heatA>.02&&(part==="armF"||part==="torso")){TINT.col="#ff5a3c";TINT.a=part==="armF"?heatA*1.6:heatA}else TINT.a=0};
  leg("hipB",pl.bf);
  if(jets>.02&&tb<0)flame(ctx,feet.hipB.x-(ja<0?2:10),feet.hipB.y-(ja<0?-2:14),FA(ja),34*jets*(M.jlen||1),7,t);
  const sbo={x:sb.x,y:ty+sb.y};
  piece("armB",sbo.x,sbo.y,()=>{setTint("armB");ctx.save();ctx.translate(sbo.x,sbo.y);ctx.rotate(angB);spr(ctx,R.armB,p.bx,0,0,.92,.92);
    if(p.pile>.01){const tp=armPt(R.armB,"tip",{x:0,y:0},0,.92,p.bx);ctx.fillStyle="#d8d2c4";ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.rect(tp.x-6,tp.y-3.5,6+30*p.pile,7);ctx.fill();ctx.stroke()}
    ctx.restore();TINT.a=0});
  const tipPt=armPt(R.armB,"tip",sbo,angB,.92,p.bx+30*p.pile);
  if(p.fl&&tb<0)flame(ctx,pk.x-26,ty+pk.y+8,FA(.25)+tilt,70*p.fl,12,t+.3);
  piece("pack",pk.x-6,ty+pk.y,()=>{setTint("pack");spr(ctx,R.pack,pk.x-6,ty+pk.y,tilt,.7,.7);TINT.a=0});
  leg("hipF",pl.ff);
  if(jets>.02&&tb<0)flame(ctx,feet.hipF.x-(ja<0?2:10),feet.hipF.y-(ja<0?-2:14),FA(ja),38*jets*(M.jlen||1),8,t+.7);
  piece("torso",0,ty,()=>{setTint("torso");spr(ctx,R.torso,0,ty,tilt,1,1);TINT.a=0});
  const sao={x:sa.x,y:ty+sa.y},rec=p.fire>.5?-Math.abs(Math.sin(t*70))*3:0;
  piece("armF",sao.x,sao.y,()=>{setTint("armF");ctx.save();ctx.translate(sao.x,sao.y);ctx.rotate(angF);spr(ctx,R.armF,rec,0,0,1,1);ctx.restore();TINT.a=0});
  const mz=armPt(R.armF,"muzzle",sao,angF,1,rec);
  /* minigun fire: flash and tracers toward the target */
  if(p.fire>.5){if(Math.sin(t*70)>0)star(ctx,mz.x+6*Math.cos(angF),mz.y+6*Math.sin(angF),11,t*20);
    ctx.save();ctx.strokeStyle="#ef8a4c";ctx.lineWidth=2;for(let i=0;i<2;i++){const ph=((t*9+i*.5)%1),d0=20+ph*140;ctx.beginPath();ctx.moveTo(mz.x+Math.cos(aim)*d0,mz.y+Math.sin(aim)*d0);ctx.lineTo(mz.x+Math.cos(aim)*(d0+22),mz.y+Math.sin(aim)*(d0+22));ctx.stroke()}ctx.restore()}
  if(p.heat>.2&&p.fire<.5&&tb<0){ctx.save();ctx.globalAlpha=p.heat*.7;blob(ctx,mz.x,mz.y,5+3*Math.sin(t*12),"#ef8a4c");ctx.restore()}
  if(p.hit>.05){star(ctx,tipPt.x+8,tipPt.y,20*p.hit+6,.3)}
  /* explosion at the core when the mech breaks */
  if(tb>=0&&tb<.45){const u=tb/.45;ctx.save();ctx.globalAlpha=1-u;blob(ctx,0,ty,30+60*u,u<.4?"#ffd98a":"#ef8a4c");ctx.restore();if(u<.3)star(ctx,0,ty,50+80*u,u*4)}
  /* anchored particles */
  const anc={pack:{x:pk.x-12,y:ty+pk.y-34},tip:tipPt,muzzle:mz,core:{x:0,y:ty}};
  (M.parts||[]).forEach(d=>{if(!d.at)return;const a=t-d.b;if(a<0||a>d.life)return;const u=a/d.life,o=anc[d.at];particle(ctx,d,o.x+d.x+d.vx*a,o.y-d.vy*a+(d.n==="spark"?.5*G*.6*a*a:0),u,zoom)});
  ctx.restore();ctx.restore();
}

function fit(c,w,h){const d=Math.min(2,window.devicePixelRatio||1);c.width=w*d;c.height=h*d;const x=c.getContext("2d");x.setTransform(d,0,0,d,0,0);return x}
const q=id=>document.getElementById(id);
const players=[];
/* one player: live canvas + 12-moment strip, for the dash comparison and for the moves section */
function player(o){
  const cv=q(o.cv),strip=q(o.strip);if(!cv)return null;
  const st={t:0,playing:true,speed:o.speed||1,last:0,face:1,aimBack:false,jets:true,parts:"v2",move:o.move,i:0};
  const lx=fit(cv,720,300);
  st.drawLive=()=>{if(ready<3)return;lx.clearRect(0,0,720,300);scene(lx,720,300,st.t,{move:st.move,face:st.face,aimBack:st.aimBack,jets:st.jets,parts:st.parts});
    const l=q(o.lbl);if(l)l.textContent=st.t.toFixed(2)+" s"};
  st.drawStrip=()=>{if(ready<3||!strip)return;strip.innerHTML="";MOVES[st.move].strip.forEach((t,i)=>{const c=document.createElement("canvas");c.className="dcell";
    c.setAttribute("aria-label","Puppet "+MOVES[st.move].name+" frame "+(i+1)+" at "+t.toFixed(2)+" s");
    const x=fit(c,240,150);x.save();scene(x,240,150,t,{zoom:.416,move:st.move,face:1,aimBack:st.aimBack,jets:st.jets,parts:st.parts});x.restore();
    const f=document.createElement("div");f.className="cell";f.dataset.i=i;if(o.commentable)f.setAttribute("data-comment-target","");const s=document.createElement("span");s.textContent=String(i+1).padStart(2,"0")+" · "+t.toFixed(2)+"s";f.appendChild(c);f.appendChild(s);
    f.onclick=()=>{st.t=t;st.i=i;st.playing=false;st.syncBtn();st.drawLive();st.paint()};strip.appendChild(f)});st.paint()};
  st.paint=()=>{if(strip)strip.querySelectorAll(".cell").forEach(c=>c.classList.toggle("cur",!st.playing&&+c.dataset.i===st.i))};
  st.syncBtn=()=>{const b=q(o.play);if(b){b.textContent=st.playing?"Pause":"Play";b.setAttribute("aria-pressed",String(st.playing))}};
  q(o.play).onclick=()=>{st.playing=!st.playing;st.syncBtn();st.paint()};
  q(o.speedSel).onchange=e=>st.speed=+e.target.value;
  q(o.faceChk).onchange=e=>{st.face=e.target.checked?-1:1;st.drawLive()};
  if(o.aimChk)q(o.aimChk).onchange=e=>{st.aimBack=e.target.checked;st.drawLive();st.drawStrip()};
  if(o.oldChk)q(o.oldChk).onchange=e=>{st.parts=e.target.checked?"v1":"v2";st.drawLive();st.drawStrip()};
  if(o.jetsChk)q(o.jetsChk).onchange=e=>{st.jets=e.target.checked;st.drawLive();st.drawStrip()};
  st.setMove=m=>{st.move=m;st.t=0;st.i=0;st.drawLive();st.drawStrip()};
  players.push(st);return st}
const dash=player({move:"dash",cv:"dashLive",strip:"dashStrip",lbl:"dashT",play:"dashPlay",speedSel:"dashSpeed",faceChk:"dashFace",aimChk:"dashAim",oldChk:"dashOld",jetsChk:"dashJets",speed:.25});
const rig=player({move:"bunker",cv:"rigLive",strip:"rigStrip",lbl:"rigT",play:"rigPlay",speedSel:"rigSpeed",faceChk:"rigFace",oldChk:"rigOld",speed:.5,commentable:true});
/* moves section: tabs, notes, marks and comments */
if(rig){
  const tabs=[...document.querySelectorAll("#rigTabs [data-move]")],notes=[...document.querySelectorAll("[data-movenote]")],stEl=q("rigStatus"),ta=q("rigNote");
  const V={};let db=null;
  const paintVote=()=>{const v=V[rig.move]||{};document.querySelectorAll("#rigVote [data-v]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===v.verdict)));if(document.activeElement!==ta)ta.value=v.note||""};
  const show=m=>{tabs.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.move===m)));notes.forEach(n=>n.hidden=n.dataset.movenote!==m);rig.setMove(m);paintVote()};
  tabs.forEach(b=>b.onclick=()=>show(b.dataset.move));
  async function save(){const id="rig-"+rig.move,v=V[rig.move]||(V[rig.move]={});v.note=ta.value;
    if(!db){stEl.textContent="Not saved: this view cannot store verdicts.";return}stEl.textContent="Saving…";
    try{await db.collection("verdicts").doc(id).set({action:id,verdict:v.verdict||null,flags:[],note:v.note||"",updatedAt:new Date().toISOString()});stEl.textContent="Saved"}
    catch(e){stEl.textContent="Not saved: "+(e&&e.message||"the store refused the write")}}
  document.querySelectorAll("#rigVote [data-v]").forEach(b=>b.onclick=()=>{const v=V[rig.move]||(V[rig.move]={});v.verdict=v.verdict===b.dataset.v?null:b.dataset.v;paintVote();save()});
  ta.onchange=save;
  (async()=>{try{db=window.claude?await window.claude.use("db"):null}catch(e){db=null}if(!db)return;
    db.collection("verdicts").onSnapshot(snap=>{(snap.docs||[]).forEach(d=>{const v=d.data?d.data():d,id=d.id||v.action;if(!id||!id.startsWith("rig-"))return;V[id.slice(4)]={verdict:v.verdict||null,note:v.note||""}});paintVote()},()=>{})})();
  (async()=>{let cm=null;try{cm=window.claude?await window.claude.use("comments"):null}catch(e){cm=null}if(!cm)return;
    const bf=q("rigCmtFrame"),bs=q("rigCmtMove");bf.hidden=bs.hidden=false;
    const open=async el=>{try{const r=await cm.openComposer({element:el});if(r&&!r.opened)stEl.textContent="Click inside the page first, then try again."}catch(e){stEl.textContent="Commenting from the page is off here; use comment mode instead.";bf.hidden=bs.hidden=true}};
    bf.onclick=()=>{const c=q("rigStrip").querySelectorAll(".cell")[rig.i];open(c||q("rigLive"))};bs.onclick=()=>open(q("rig-poses"))})();
  rig.show=show;
}
function tick(now){players.forEach(st=>{if(st.playing){if(st.last)st.t=(st.t+(now-st.last)/1000*st.speed)%MOVES[st.move].loop;st.drawLive()}st.last=now});requestAnimationFrame(tick)}
const go=()=>{if(++ready===3){A=window.TIMO_RIG;A2=window.TIMO_RIG2;players.forEach(st=>{st.drawLive();st.drawStrip()});if(rig)rig.show("bunker");
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){players.forEach(st=>{st.playing=false;st.syncBtn()});if(dash){dash.t=.19;dash.drawLive()}if(rig){rig.t=MOVES.bunker.strip[5];rig.drawLive()}}requestAnimationFrame(tick)}};
atlas.onload=go;atlas2.onload=go;ground.onload=go;atlas2.src="img/rig/atlas_v2.webp";atlas.src="img/rig/atlas.webp";ground.src="img/rig/ground.webp";
})();
