/* Metr0niks scripted player (TDD-D17). Drives one mech of a MetroSim through sim.setInput so a whole excursion can run
   headless, with no human. Used by run.js (sweeps) and rules-check.js; it reads sim state and never changes rules.

   var pilot=MetroPilot.make({seed, accuracy});  then every tick, before sim.step():  sim.setInput(i, pilot(sim, i))
     accuracy  how the heavy weapon's timing ring is released:
               "perfect" every release at 1.0 s; "mix" 70% Perfect, 25% Good, 5% Miss; "random" anywhere from 0.5 to 1.4 s;
               "none" never uses the heavy weapon
     seed      the pilot's own random stream (the sim's stream is never touched)
     skill     "v2": the smarter pilot (makeV2 below, Oct 28); anything else is this v1 pilot
     overtime  true: at the prompt after wave 5 (sim.state "choose") mech 0's pilot calls Overtime (F, 64); otherwise it extracts
               at once (Enter/R, 128). Only mech 0 chooses (the host, GDD-D37), alive or not.

   What it does: takes a Field repair pod when armor is below 50%, otherwise fights the nearest enemy (closing in with
   the pile-bunker when the ATB bar is full, keeping about 9 m away and circle-strafing otherwise), fires the light gun below 85 heat, and
   picks up scrap between fights. It paths over the sim's walk grid. It doesn't dash, use Q or take Overclock on purpose. */
(function(root){
"use strict";
var N8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

function make(opts){
  opts=opts||{};
  if(opts.skill==="v2")return makeV2(opts);   /* pilot v2 (Oct 28): see makeV2; v1 below is unchanged so old records replay */
  var seed=((opts.seed|0)||1)%2147483647;if(seed<=0)seed+=2147483646;
  function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
  var accuracy=opts.accuracy||"mix",mem={},overtime=!!opts.overtime;

  function holdTicks(){   /* ticks to hold the ring: release at hold/60 s; 60 is the 1.0 s target */
    if(accuracy==="perfect")return 60;
    if(accuracy==="random")return 30+Math.floor(rnd()*55);
    var r=rnd();return r<.70?60:r<.95?(rnd()<.5?51:70):(rnd()<.5?36:84);
  }
  function stepToward(sim,field,x,y){
    var W=sim.world.W,cx=Math.floor(x),cy=Math.floor(y),best=field[cx+cy*W],bx=cx,by=cy,bl=sim.world.blockedCell;
    for(var k=0;k<8;k++){
      var nx=cx+N8[k][0],ny=cy+N8[k][1];if(bl(nx,ny))continue;
      if(k>3&&(bl(cx+N8[k][0],cy)||bl(cx,cy+N8[k][1])))continue;
      var v=field[nx+ny*sim.world.W];if(v<best){best=v;bx=nx;by=ny}
    }
    return [bx+.5,by+.5];
  }
  /* WASD are screen-relative: W moves (-1,-1), S (+1,+1), A (-1,+1), D (+1,-1) in map cells. */
  function keysFor(dx,dy){
    var l=Math.hypot(dx,dy);if(l<.05)return 0;dx/=l;dy/=l;
    var u=-(dx+dy)/Math.SQRT2,v=(dx-dy)/Math.SQRT2,k=0;
    if(u>.38)k|=1;else if(u<-.38)k|=4;
    if(v>.38)k|=8;else if(v<-.38)k|=2;
    return k;
  }

  return function pilot(sim,i){
    var me=sim.players[i],T=sim.T,m=mem[i]||(mem[i]={hold:0,want:0,field:null,goalCell:-1,fieldT:0,stuck:0,lx:0,ly:0});
    var inp={k:0,ax:me.x+1,ay:me.y+1,az:.6,l:false,r:false,rp:false};
    if(sim.state==="choose"){if(i===0)inp.k=overtime?64:128;return inp}
    if(me.hp<=0)return inp;
    var best=null,bd=1e9;
    sim.bots.forEach(function(b){if(b.hp<=0||b.dropping)return;var d=Math.hypot(b.x-me.x,b.y-me.y);if(d<bd){bd=d;best=b}});
    var goal=null,keep=0;
    if(me.hp<me.maxHp*.6){var pd=1e9;sim.pods.forEach(function(o){if(!o.landed||o.type!=="repair")return;var d=Math.hypot(o.x-me.x,o.y-me.y);if(d<pd&&d<25){pd=d;goal=[o.x,o.y]}})}
    var ready=me.atb>=T.atb.fill&&me.ring<0&&!me.over&&me.retract<=0;
    var crowd=0;sim.bots.forEach(function(b){if(b.hp>0&&!b.dropping&&Math.hypot(b.x-me.x,b.y-me.y)<6)crowd++});
    var melee=best&&!(best.z>.05)&&accuracy!=="none"&&(!best.loader||best.state!=="charge")&&crowd<=2;
    if(!goal&&best){goal=[best.x,best.y];keep=melee&&ready?1.1:9}
    if(!goal&&sim.scraps.length){var sd=1e9;sim.scraps.forEach(function(c){var d=Math.hypot(c.x-me.x,c.y-me.y);if(d<sd){sd=d;goal=[c.x,c.y]}})}
    if(goal){
      var gd=Math.hypot(goal[0]-me.x,goal[1]-me.y);
      if(gd>keep+.4){
        var W=sim.world.W,gc=Math.floor(goal[0])+Math.floor(goal[1])*W;
        if(!m.field||m.goalCell!==gc&&m.fieldT<=0){m.field=sim.flowField(goal[0],goal[1],m.field);m.goalCell=gc;m.fieldT=20}
        var nx=stepToward(sim,m.field,me.x,me.y),dx=nx[0]-me.x,dy=nx[1]-me.y;
        if(Math.hypot(dx,dy)<.2){dx=goal[0]-me.x;dy=goal[1]-me.y}
        inp.k=keysFor(dx,dy);
      } else if(gd<keep-1.5)inp.k=keysFor(me.x-goal[0],me.y-goal[1]);
      else if(best&&keep>2){   /* in range: circle-strafe to slip the orbs, switching side every 1.5 s */
        var side=Math.floor(sim.tick/90)%2?1:-1,ux=(best.x-me.x)/gd,uy=(best.y-me.y)/gd;
        inp.k=keysFor(-uy*side,ux*side);
      }
    }
    m.fieldT--;
    if(best){inp.ax=best.x;inp.ay=best.y;inp.az=(best.z||0)+.6;inp.l=bd<16&&me.heat<85&&!me.over}
    /* heavy weapon: press when ready and in reach, hold for the chosen time, then release */
    if(m.hold>0){m.hold++;if(m.hold<=m.want)inp.r=true;else m.hold=0}
    else if(ready&&melee&&bd<T.pile.reach+best.r+.2){inp.r=true;inp.rp=true;m.hold=1;m.want=holdTicks()}
    return inp;
  };
}
/* ===== Pilot v2 (Oct 28, 2026): a smarter scripted player for the fun pass sweep. MetroPilot.make({skill:"v2", seed,
   accuracy, overtime}). Like v1 it only reads sim state and sets inputs; it never changes a rule. Its random stream is its
   own (seeded from opts.seed, drawn only for the timing ring), so a batch replays exactly. pilot.usage counts what it did.

   What it adds over v1:
     dodges     Space (16) out of a loader's or the Juggernaut's charge line, a flashing Scuttler, a Warden barrage line or
                stomp tell, an enemy-taken Strike beacon line, slag pools and a Bulwark's bash; walks out when there's time,
                dashes when there isn't. Picks its walking direction round orbs about to hit, and dashes sideways out of one
                when the dash is free and heat allows (it keeps the dash for charges and Scuttlers when one is close)
     closes     dashes into pile-bunker reach when the bar is full; dashes away when low on armor with heavies close; rings a
                loader or the Juggernaut only in the window after a charge, and hovers just outside charge range to bait one
     unsticks   when no enemy has lost health for 20 s, plays plainly (nearest enemy, no backing off) for 10 s
     targets    Scuttlers close by, staggered and hurt enemies, Wreckers; the Warden's riders (via their platforms) first,
                then its legs, then the body; leads its shots; holds fire when there's no line of sight
     Bulwark   walks round it to hit from behind (holding fire into the shield), or, with the bar full, walks in from the
                front to bait a Perfect that breaks the shield
     city      when 2+ enemies a collapse would kill stand under one overpass span, breaks that span's standing pillar(s)
                from outside the span's footprint (minigun, Breach, mortar or a winch Perfect), so the span drops on them
     cover     when locked out or low on armor with no repair coming, backs off to a nearby spot few enemies can see
     Q          per shoulder part: mortar onto the biggest group 4.5 to 13.5 m out; flash-vent when locked out or hot with
                enemies close; Redline to clear a lockout with enemies on it, or when hot with a staggered, hurt or
                boss target; in Redline it fires above 100 heat (where every heat point costs armor) only to finish a staggered or
                nearly dead target, so the vent costs little and ends without a lockout; Breach on a span's pillar or a group, then set off
     call-ins   keys 1 and 2 (256, 512) from its slots (create({callins})): Field repair below 45% armor with no repair pod
                coming, Overclock with a boss or 5+ enemies up, Strike beacon with 3+ enemies (or a heavy) within 12 m;
                each lands at its feet and it goes to take it
     pods       takes repair pods below 70% armor, and Overclock, Strike and Scrap cache pods when they're worth it */
function makeV2(opts){
  var seed=((opts.seed|0)||1)%2147483647;if(seed<=0)seed+=2147483646;
  seed=(seed*48271)%2147483647||1;   /* a stream apart from v1's for the same seed */
  function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
  var accuracy=opts.accuracy||"mix",overtime=!!opts.overtime,mem={};
  var usage={dash:{loader:0,juggernaut:0,scuttler:0,barrage:0,stomp:0,slag:0,strike:0,orb:0,close:0,escape:0,flank:0,bash:0},
    q:{mortar:0,vent:0,redline:0,breach:0,detonate:0},callins:{repair:0,overclock:0,strike:0},
    flanks:0,baits:0,spanPlans:0,pillarTicks:0,cover:0,unstick:0};   /* cover: times it backed off to cover; pillarTicks: ticks spent firing at a pillar */
  var PI=Math.PI,simRef=null,PIL=null,SPANS=null;
  function MS(){return root.MetroSim}
  function holdTicks(){
    if(accuracy==="perfect")return 60;
    if(accuracy==="random")return 30+Math.floor(rnd()*55);
    var r=rnd();return r<.70?60:r<.95?(rnd()<.5?51:70):(rnd()<.5?36:84);
  }
  function ang(a){return Math.atan2(Math.sin(a),Math.cos(a))}
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function keysFor(dx,dy){
    var l=Math.hypot(dx,dy);if(l<.05)return 0;dx/=l;dy/=l;
    var u=-(dx+dy)/Math.SQRT2,v=(dx-dy)/Math.SQRT2,k=0;
    if(u>.38)k|=1;else if(u<-.38)k|=4;
    if(v>.38)k|=8;else if(v<-.38)k|=2;
    return k;
  }
  function stepToward(sim,field,x,y){
    var W=sim.world.W,cx=Math.floor(x),cy=Math.floor(y),best=field[cx+cy*W],bx=cx,by=cy,bl=sim.world.blockedCell;
    for(var k=0;k<8;k++){
      var nx=cx+N8[k][0],ny=cy+N8[k][1];if(bl(nx,ny))continue;
      if(k>3&&(bl(cx+N8[k][0],cy)||bl(cx,cy+N8[k][1])))continue;
      var v=field[nx+ny*W];if(v<best){best=v;bx=nx;by=ny}
    }
    return [bx+.5,by+.5];
  }
  /* no solid voxel on the segment (the last `stop` m are not checked: the target's own surface) */
  function clear(sim,x0,y0,z0,x1,y1,z1,stop){
    var dx=x1-x0,dy=y1-y0,dz=z1-z0,L=Math.hypot(dx,dy,dz),n=Math.ceil(L/.4),sa=sim.world.solidAt,end=L>0?1-(stop||0)/L:0;
    for(var k=1;k<n;k++){var t=k/n;if(t>end)break;if(sa(x0+dx*t,y0+dy*t,z0+dz*t))return false}
    return true;
  }
  /* the overpass: pillars (sorted by x) and the spans between them; each span is held by the pillars at its ends */
  function city(sim){
    if(simRef===sim)return;simRef=sim;PIL=[];SPANS=[];
    sim.world.structures.forEach(function(s){if(s&&s.kind==="pillar")PIL.push(s)});
    PIL.sort(function(a,b){return a.x-b.x});
    var O=MS().MAP.overpass,x1=O.x1!==undefined?O.x1:sim.world.W-1;
    for(var k=0;k<=PIL.length;k++){var a=PIL[k-1],b=PIL[k];
      SPANS.push({x0:a?a.x+1:0,x1:b?b.x:x1,y0:O.y0,y1:O.y1,z:O.z,sup:[a,b].filter(Boolean)})}
  }
  function pillarDown(sim,s){var C=sim.world.chunks;for(var k=0;k<s.gc.length;k++)if(C[s.gc[k]].alive)return false;return true}
  function spanUp(sim,sp){var g=sim.world.get,y=Math.floor((sp.y0+sp.y1)/2),z=sp.z;
    return g(Math.floor((sp.x0*3+sp.x1)/4),y,z)===3||g(Math.floor((sp.x0+sp.x1*3)/4),y,z)===3}
  function under(sp,e,pad){pad=pad||0;return e.x>=sp.x0-pad&&e.x<sp.x1+1+pad&&e.y>=sp.y0-pad&&e.y<sp.y1+1+pad}
  function openX(sim){var Z=MS().MAP.zones;return Z[Math.max(1,sim.zone.open)-1].x1}
  function ground(b){return !b.air&&!(b.z>.5)&&!b.part}
  function live(b){return b.hp>0&&!b.dropping&&!b.gone&&b.kind!=="charge"}
  function lvm(sim,k){return 1+sim.T.level[k]*(sim.level-1)}
  function heavyFoe(b){return b.loader||b.jugg||b.kind==="bulwark"||b.kind==="wbody"||b.boss&&!b.rider}
  function pillarVoxel(sim,s,me){   /* the pillar's nearest live base voxel (z 0..3) */
    var g=sim.world.get,best=null,bd=1e9;
    for(var z=0;z<4;z++)for(var y=s.y;y<=s.y+1;y++)for(var x=s.x;x<=s.x+1;x++){if(g(x,y,z)!==1)continue;
      var d=Math.hypot(x+.5-me.x,y+.5-me.y)+Math.abs(z-1)*.3;if(d<bd){bd=d;best=[x+.5,y+.5,z+.5]}}
    return best;
  }
  /* span drop: the span with the most enemies a collapse would kill under it, and its standing pillar nearest the mech */
  function spanPlan(sim,me,en){
    city(sim);var ox=openX(sim),dmg=sim.T.collapse.botDmg*lvm(sim,"hp"),best=null,bs=0;
    SPANS.forEach(function(sp){
      if(sp.x1+2>ox||!sp.sup.length||!spanUp(sim,sp))return;
      var stand=sp.sup.filter(function(s){return !pillarDown(sim,s)});if(!stand.length)return;
      var n=0,all=0;en.forEach(function(b){if(!ground(b)||!under(sp,b))return;all++;if(b.hp<=dmg*(b.stag>0?1.5:1))n++});
      if(n<2||(stand.length>1&&n<3))return;
      var pil=null,pd=1e9;stand.forEach(function(s){var d=Math.hypot(s.x+1-me.x,s.y+1-me.y);if(d<pd){pd=d;pil=s}});
      if(pd>22)return;
      var sc=n*2+all*.5-stand.length*1.5-pd/8;if(sc>bs){bs=sc;best={sp:sp,pil:pil,n:n,stand:stand.length}}
    });
    return best;
  }
  /* would breaking pillar s now drop a span on (x,y)? (a span it holds whose other support is down, or it holds alone) */
  function dangerUnder(sim,s,e){
    city(sim);return SPANS.some(function(sp){if(sp.sup.indexOf(s)<0||!spanUp(sim,sp)||!under(sp,e,1))return false;
      return sp.sup.every(function(o){return o===s||pillarDown(sim,o)})});
  }
  /* a spot near (x,y) that few enemies can see, for backing off */
  function coverPoint(sim,me,en){
    var best=null,bs=-1e9,bl=sim.world.blockedCell;
    for(var a=0;a<12;a++)for(var r=3;r<=7;r+=2){
      var x=me.x+Math.cos(a*PI/6)*r,y=me.y+Math.sin(a*PI/6)*r;if(bl(Math.floor(x),Math.floor(y)))continue;
      var s=-r*.3,near=1e9;
      en.forEach(function(b){var d=Math.hypot(b.x-x,b.y-y);if(d<near)near=d;
        if(d<14&&!b.part&&clear(sim,b.x,b.y,(b.z||0)+.8,x,y,.9,.3))s-=b.loader&&!b.jugg?1:4});
      en.forEach(function(b){if((b.loader||b.jugg||b.kind==="bulwark")&&Math.hypot(b.x-x,b.y-y)<4.5)s-=6});
      s+=Math.min(near,12);if(s>bs){bs=s;best=[x,y]}
    }
    return best;
  }
  /* the walkable cell nearest (x,y): a goal on a roof or in a wall gets a flow field to the street below it */
  function walkCell(sim,x,y){var bl=sim.world.blockedCell,cx=Math.floor(x),cy=Math.floor(y);
    for(var r=0;r<10;r++)for(var dy=-r;dy<=r;dy++)for(var dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
      if(!bl(cx+dx,cy+dy))return [cx+dx+.5,cy+dy+.5]}
    return [x,y]}
  /* (dx,dy), or the nearest turn of it (45 degree steps) that isn't straight into a wall */
  function freeDir(sim,me,dx,dy){var l=Math.hypot(dx,dy)||1,bl=sim.world.blockedCell;dx/=l;dy/=l;
    for(var k=0;k<7;k++){var a=(k%2?1:-1)*Math.ceil(k/2)*PI/4,c=Math.cos(a),s=Math.sin(a),x=dx*c-dy*s,y=dx*s+dy*c;
      if(!bl(Math.floor(me.x+x*.9),Math.floor(me.y+y*.9)))return [x,y]}
    return [dx,dy]}
  function dashReady(me){return !me.noDash&&!me.over&&(me.dashN!=null?me.dashN>0&&me.dash<=0:me.dashCd<=0&&me.dash<=0)}

  function pilot(sim,i){
    var me=sim.players[i],T=sim.T,m=mem[i]||(mem[i]={hold:0,want:0,field:null,goalCell:-1,fieldT:0,qLast:-9,qHold:0,qAim:null,ciT:0,plan:null,planT:0,
      cover:null,coverT:0,fl:null,bait:null,brT:0});
    var inp={k:0,ax:me.x+1,ay:me.y+1,az:.6,l:false,r:false,rp:false};
    if(sim.state==="choose"){if(i===0)inp.k=overtime?64:128;return inp}
    if(me.hp<=0)return inp;
    var en=sim.bots.filter(live),tick=sim.tick,hk=me.pileKind,gun=me.gun;
    var GR={minigun:18,plasma:4.5,shotgun:7.5,rail:28,arc:11.5}[gun]||18,KEEP={minigun:9,plasma:3.5,shotgun:5,rail:12,arc:8}[gun]||9;
    var ready=me.atb>=T.atb.fill&&me.ring<0&&!me.over&&me.retract<=0;
    var crowd=0,near=1e9,nearB=null;
    en.forEach(function(b){if(b.part||b.air)return;var d=dist(b,me);if(d<6)crowd++;if(d<near){near=d;nearB=b}});

    /* stalemate breaker: no enemy has lost health (and none has died) for 20 s while some are up: 10 s of plain play,
       nearest enemy first, no backing off, no flanking */
    var hpSum=0;en.forEach(function(b){hpSum+=b.hp});
    if(!en.length||hpSum<m.hpSum-.5||en.length<m.hpN){m.progT=tick}m.hpSum=hpSum;m.hpN=en.length;
    if(m.progT===undefined)m.progT=tick;
    if(tick-m.progT>1200&&tick>=(m.aggro||0)){m.aggro=tick+600;m.progT=tick;usage.unstick++}
    var aggro=tick<(m.aggro||0);
    /* ----- target ----- */
    var wd=null;en.forEach(function(b){if(b.kind==="wbody")wd=b});
    var tg=null,ts=1e9;
    en.forEach(function(b){
      if(b.kind==="wbody"||b.part||b.rider&&b.mode==="ride")return;
      var d=dist(b,me),s=d;
      if(aggro){if(s<ts){ts=s;tg=b}return}
      if(b.kind==="scuttler")s-=d<7?8:2;
      if(b.stag>0)s-=3;
      s-=3*(1-b.hp/b.maxHp);
      if(b.kind==="wrecker")s-=2;
      if(b.kind==="bulwark"&&!(b.shieldEnd>tick)&&!ready&&Math.abs(ang(Math.atan2(me.y-b.y,me.x-b.x)-b.head))<=T.bulwark.arc*PI/180)s+=4;
      if(s<ts){ts=s;tg=b}
    });
    if(wd){   /* riders first (their platforms are the softer way), then legs, then the body */
      var wt=null,wh=1e9;
      wd.riders.forEach(function(r){if(r.hp>0&&r.mode==="ride"&&r.ride===wd&&r.hp<wh){wh=r.hp;wt=r}});
      wd.parts.forEach(function(e){if(e.hp>0&&e.kind==="wplat"&&e.carry&&e.carry.hp>0&&e.carry.mode==="ride"){var h=Math.min(e.hp,e.carry.hp);if(h<wh){wh=h;wt=e.hp<=e.carry.hp?e:e.carry}}});
      if(!wt){var ld=1e9;wd.parts.forEach(function(e){if(e.hp>0&&e.kind==="wleg"){var d=dist(e,me);if(d<ld){ld=d;wt=e}}})}
      if(!wt)wt=wd;
      if(!tg||ts>dist(wt,me)-6)tg=wt;
    }
    var td=tg?dist(tg,me):1e9,tz=tg?(tg.kind==="wleg"?1:(tg.z||0)+(tg.part||tg.kind==="wbody"?tg.h*.5:.6)):.6;

    /* ----- threats: where to get out to, and whether it needs the dash ----- */
    var th=null;
    function threat(dx,dy,u,why){if(!th||u>th.u)th={dx:dx,dy:dy,u:u,why:why}}
    en.forEach(function(b){
      var rx=me.x-b.x,ry=me.y-b.y,d=Math.hypot(rx,ry)||.01;
      if((b.loader||b.jugg)&&(b.state==="tell"||b.state==="charge")){
        var L=b.L||T.loader,cx=b.cx,cy=b.cy,al=rx*cx+ry*cy,pp=-rx*cy+ry*cx,len=L.chargeSpeed*(b.state==="tell"?L.charge:Math.max(0,b.t)),w=b.r+me.r+.5;
        if(al>-.5&&al<len+b.r+1&&Math.abs(pp)<w){var sg=pp>=0?1:-1,hit=(b.state==="tell"?b.t:0)+Math.max(0,al-b.r-me.r)/L.chargeSpeed;
          threat(-cy*sg,cx*sg,hit<.45?3:1.5,b.jugg?"juggernaut":"loader")}
      }
      if(b.kind==="scuttler"){
        if(b.state==="flash"&&d<T.scuttler.blast+me.r+.5)threat(rx/d,ry/d,3,"scuttler");
        else if(d<4.5&&b.state==="engage"&&!aggro)threat(rx/d,ry/d,1,"scuttler");   /* back off while shooting it: it closes slower */
      }
      if(b.kind==="bulwark"&&d<T.bulwark.bash+.7&&!(b.stag>0)&&!(m.bait===b&&b.cd>=.9&&ready)){   /* inside its bash range, in front: step out (dash when it's about to bash) */
        var fo=Math.abs(ang(Math.atan2(ry,rx)-b.head));
        if(fo<=T.bulwark.arc*PI/180+.2){var bs=ang(Math.atan2(ry,rx)-b.head)>=0?1:-1;   /* out sideways, toward its back */
          threat(rx/d*.4-ry/d*bs,ry/d*.4+rx/d*bs,d<T.bulwark.bash+.2&&b.cd<.25?2.6:1.2,"bash")}
      }
      if(b.kind==="wbody"&&b.tell>0&&!b.down&&d<T.warden.stomp.radius+me.r+.6)threat(rx/d,ry/d,b.tell<.45?3:1.6,"stomp");
    });
    function lineThreat(pts,t,R,why){
      var hit=pts.some(function(p){return Math.hypot(p[0]-me.x,p[1]-me.y)<R+me.r+.4});if(!hit)return;
      var a=pts[0],b=pts[pts.length-1],lx=b[0]-a[0],ly=b[1]-a[1],ll=Math.hypot(lx,ly)||1;lx/=ll;ly/=ll;
      var pp=-(me.x-a[0])*ly+(me.y-a[1])*lx,sg=pp>=0?1:-1;
      threat(-ly*sg,lx*sg,t<.5?3:1.4,why);
    }
    (sim.wshells||[]).forEach(function(k){lineThreat(k.pts,k.t,T.warden.barrage.radius,"barrage")});
    (sim.strikes||[]).forEach(function(k){if(k.by<0&&k.pts)lineThreat(k.pts,k.t,T.strike.radius,"strike")});
    (sim.pools||[]).forEach(function(o){if(o.t<=0)return;var pad=me.r+.2;
      if(me.x<o.x0-pad||me.x>=o.x1+pad||me.y<o.y0-pad||me.y>=o.y1+pad)return;
      var ex=[[o.x0-pad-me.x,0],[o.x1+pad-me.x,0],[0,o.y0-pad-me.y],[0,o.y1+pad-me.y]].sort(function(a,b){return Math.abs(a[0]+a[1])-Math.abs(b[0]+b[1])})[0];
      threat(ex[0],ex[1],me.x>o.x0&&me.x<o.x1&&me.y>o.y0&&me.y<o.y1?2.6:1.8,"slag")});

    /* ----- what to walk to ----- */
    var goal=null,keep=0,mode="",aimP=null,fireOk=true,heavyAllowed=false,reach=0,flankDash=null;
    /* pods: repair when hurt, my own call-ins, and wave pods worth the walk */
    var pg=null,pgd=1e9;
    sim.pods.forEach(function(o){var d=Math.hypot(o.x-me.x,o.y-me.y),want=false;
      if(o.type==="repair")want=me.hp<me.maxHp*.7&&d<30||o.by===i&&me.hp<me.maxHp*.9;
      else if(o.type==="overclock")want=d<25&&en.length>0||o.by===i;
      else if(o.type==="strike")want=o.by===i||d<16&&en.filter(function(b){return dist(b,me)<14}).length>=2;
      else if(o.type==="cache")want=d<20&&near>8;
      if(!want)return;if(!o.landed&&d>3)d+=6;if(d<pgd){pgd=d;pg=o}});
    var hurt=me.hp<me.maxHp*.3;
    /* span plan, re-checked every 15 ticks */
    if(tick-m.planT>=15){m.planT=tick;var pl=spanPlan(sim,me,en);
      if(pl&&(!m.plan||m.plan.pil!==pl.pil)){usage.spanPlans++;pl.t0=tick}else if(pl&&m.plan)pl.t0=m.plan.t0;
      m.plan=pl&&tick-pl.t0<60*8?pl:null}
    /* back off only while something can shoot it, and never hide longer than 6 s at a time (then fight for 3 s) */
    var seen=(me.over>.6||hurt)&&en.some(function(b){return (b.boss||!b.kind&&!b.loader)&&!b.part&&dist(b,me)<12&&clear(sim,b.x,b.y,(b.z||0)+.8,me.x,me.y,.9,.4)});
    var retreat=seen&&!aggro&&(me.over>.6||!pg)&&tick>=(m.covBan||0);
    if(retreat&&m.inCov&&tick-m.covT0>360){m.covBan=tick+180;retreat=false}
    if(retreat){if(!m.inCov){usage.cover++;m.covT0=tick}m.inCov=true;if(tick-m.coverT>=20||!m.cover){m.cover=coverPoint(sim,me,en);m.coverT=tick}goal=m.cover;mode="cover"}
    else{m.cover=null;m.inCov=false}
    if(!goal&&pg&&(me.hp<me.maxHp*.7||pgd<10||!tg||pg.by===i)){goal=[pg.x,pg.y];mode="pod"}
    if(!goal&&m.plan){
      var P=m.plan.pil,pv=pillarVoxel(sim,P,me);
      if(pv){aimP=pv;mode="pillar";
        var pd=Math.hypot(pv[0]-me.x,pv[1]-me.y),safe=!dangerUnder(sim,P,me)&&!under(m.plan.sp,me,1);
        if(!safe||pd>12||!clear(sim,me.x,me.y,1.1,pv[0],pv[1],pv[2],.8)){
          var side=me.y<P.y+1?-1:1;goal=[P.x+1,P.y+1+side*8];keep=.6;
        }
      } else m.plan=null;
    }
    if(!goal&&tg&&mode!=="pillar"){
      var melee=(hk==="pile"||hk==="seismic");
      reach=hk==="pile"?T.pile.reach+tg.r+.2:hk==="seismic"?T.seismic.radius-.4:hk==="winch"?T.winch.reach-.6:12;
      var charger=tg.loader||tg.jugg,charging=charger&&(tg.state==="tell"||tg.state==="charge");
      /* a loader or the Juggernaut is only rung in the window after a charge (its cooldown still covers the 1 s ring) */
      var opening=!charger||tg.state==="recover"||tg.cd>=.9||tg.stag>0;
      var bw=tg.kind==="bulwark"&&!(tg.shieldEnd>tick),a=Math.atan2(me.y-tg.y,me.x-tg.x),off=Math.abs(ang(a-tg.head)),arc=T.bulwark.arc*PI/180,front=bw&&off<=arc+.12;
      if(front&&tg.cd<.9&&!(tg.stag>0))opening=false;   /* a Bulwark is baited from the front just after a bash */
      heavyAllowed=accuracy!=="none"&&!charging&&opening&&(melee?ground(tg)&&!(tg.kind==="wleg"&&wd&&wd.hp<wd.maxHp*T.warden.below)&&(hk==="seismic"||crowd<=2):hk==="winch"?!tg.air&&!tg.part:true);
      goal=[tg.x,tg.y];keep=heavyAllowed&&ready?(melee?(hk==="pile"?1.1:1.6):Math.min(KEEP,reach-1)):KEEP;
      if(charger&&!(heavyAllowed&&ready))keep=ready?(tg.jugg?7.5:2.6):Math.max(tg.jugg?8:5,Math.min(KEEP,9));   /* hover just outside its charge range to bait one */
      if(bw&&!aggro){   /* flank, or bait a Perfect from the front */
        if(heavyAllowed&&ready&&melee&&front){mode="bait";if(m.bait!==tg){m.bait=tg;usage.baits++}}
        else if(front||!(heavyAllowed&&ready&&melee)){
          /* outside its 3 m bash while in front; at its shoulder, dash across the front; behind, stay close (it turns slower than a close orbit) */
          mode="flank";var behind=tg.head+PI,dd=ang(behind-a),sgn=dd>=0?1:-1,stp=Math.max(-1,Math.min(1,dd)),R=front?3.4:1.9,ga=a+stp;
          goal=[tg.x+Math.cos(ga)*R,tg.y+Math.sin(ga)*R];keep=0;
          if(sim.world.blockedCell(Math.floor(goal[0]),Math.floor(goal[1]))||!clear(sim,me.x,me.y,.5,tg.x,tg.y,.5,tg.r)){goal=[tg.x,tg.y];keep=front?3.6:1.9}   /* a wall in the way: walk round to it first */
          if(front){fireOk=false;if(td<3.8&&off>.45)flankDash=[-Math.sin(a)*sgn-Math.cos(a)*.3,Math.cos(a)*sgn-Math.sin(a)*.3]}
        }
        if(!m.fl||m.fl.b!==tg)m.fl={b:tg,front:front};
        else{if(m.fl.front&&off>arc+.05&&tick-(m.flT||-1e9)>60){usage.flanks++;m.flT=tick}m.fl.front=front}   /* counted once a second at most */
      }
    }
    if(!goal&&!tg&&sim.scraps.length){var sd=1e9;sim.scraps.forEach(function(c){var d=Math.hypot(c.x-me.x,c.y-me.y);if(d<sd){sd=d;goal=[c.x,c.y]}})}

    /* ----- movement ----- */
    if(goal){
      var gd=Math.hypot(goal[0]-me.x,goal[1]-me.y),W=sim.world.W;
      if(gd>keep+.4){
        var gc=Math.floor(goal[0])+Math.floor(goal[1])*W,dx,dy;
        if(gd<3.5&&clear(sim,me.x,me.y,.5,goal[0],goal[1],.5)){dx=goal[0]-me.x;dy=goal[1]-me.y}
        else{
          if(!m.field||m.goalCell!==gc&&m.fieldT<=0){var wg=walkCell(sim,goal[0],goal[1]);m.field=sim.flowField(wg[0],wg[1],m.field);m.goalCell=gc;m.fieldT=20}
          var nx=stepToward(sim,m.field,me.x,me.y);dx=nx[0]-me.x;dy=nx[1]-me.y;
          if(Math.hypot(dx,dy)<.2){dx=goal[0]-me.x;dy=goal[1]-me.y}
        }
        inp.k=keysFor(dx,dy);
      } else if(gd<keep-1.5)inp.k=keysFor(me.x-goal[0],me.y-goal[1]);
      else if(tg&&keep>2&&mode!=="pod"){
        var side2=Math.floor(tick/90)%2?1:-1,ux=(tg.x-me.x)/(td||1),uy=(tg.y-me.y)/(td||1);
        inp.k=keysFor(-uy*side2,ux*side2);
      }
    } else if(mode==="pillar"&&tg){var s3=Math.floor(tick/90)%2?1:-1,u3=(tg.x-me.x)/(td||1),v3=(tg.y-me.y)/(td||1);inp.k=keysFor(-v3*s3,u3*s3)}
    m.fieldT--;
    /* orbs in flight: if the way it wants to walk runs into one within the next second, take the walking direction
       (eight, or standing) nearest that way that the fewest orbs hit */
    if(!th){
      var orbs=sim.shots.filter(function(s){return s.team===1&&s.kind==="orb"&&Math.hypot(s.x-me.x,s.y-me.y)<12});
      if(orbs.length){
        var kk=inp.k,wx=((kk&4)?1:0)-((kk&1)?1:0)+((kk&8)?1:0)-((kk&2)?1:0),wy=((kk&4)?1:0)-((kk&1)?1:0)+((kk&2)?1:0)-((kk&8)?1:0),wl=Math.hypot(wx,wy);
        if(wl){wx/=wl;wy/=wl}
        var hitsFor=function(vx,vy){var h=0,sp=me.spd;orbs.forEach(function(s){var lim=Math.min(s.t,1.2);
          for(var t=.05;t<=lim;t+=.05){var px=me.x+me.vx*Math.min(t,.1)+vx*sp*Math.max(0,t-.1),py=me.y+me.vy*Math.min(t,.1)+vy*sp*Math.max(0,t-.1);
            if(Math.hypot(px-s.x-s.vx*t,py-s.y-s.vy*t)<me.r+.2){h+=s.dmg;break}}});return h};
        if(hitsFor(wx,wy)>0){var bsc=1e9,bk=kk;
          for(var c=-1;c<8;c++){var vx=c<0?0:Math.cos(c*PI/4),vy=c<0?0:Math.sin(c*PI/4),sc=hitsFor(vx,vy)*3+(wl?(1-(vx*wx+vy*wy))*2:(c<0?0:.5));
            if(sc<bsc){bsc=sc;bk=c<0?0:keysFor(vx,vy)}}
          inp.k=bk;
        }
      }
    }
    var dashed=false;
    function dash(dx,dy,why){if(dashed||!dashReady(me))return false;inp.k=keysFor(dx,dy)|16;usage.dash[why]++;dashed=true;return true}
    if(th){var fd=freeDir(sim,me,th.dx,th.dy);th.dx=fd[0];th.dy=fd[1];inp.k=keysFor(th.dx,th.dy);if(th.u>=2.5)dash(th.dx,th.dy,th.why)}
    else{
      /* an orb about to hit: sidestep with the dash */
      /* keep the dash for charges and Scuttlers when one is close */
      var keepDash=en.some(function(b){var d=dist(b,me);return (b.loader||b.jugg)&&d<(b.jugg?9:5)||b.kind==="scuttler"&&d<8})||(sim.wshells||[]).length>0;
      if(!keepDash&&dashReady(me)&&me.heat<70)for(var si=0;si<sim.shots.length;si++){var s=sim.shots[si];if(s.team!==1||s.kind!=="orb")continue;
        var rx=me.x-s.x,ry=me.y-s.y,v2=s.vx*s.vx+s.vy*s.vy;if(v2<1)continue;var tt=(rx*s.vx+ry*s.vy)/v2;if(tt<0||tt>.22)continue;
        var px=rx-s.vx*tt,py=ry-s.vy*tt,pd2=Math.hypot(px,py);if(pd2>me.r+.25)continue;
        if(pd2<.05){px=-s.vy;py=s.vx}
        dash(px,py,"orb");break}
      if(flankDash&&me.heat<85&&!en.some(function(b){return (b.loader||b.jugg)&&dist(b,me)<5}))dash(flankDash[0],flankDash[1],"flank");
      if(!dashed&&!keepDash&&tg&&ready&&heavyAllowed&&(hk==="pile"||hk==="seismic")&&td>reach+.3&&td<reach+3&&me.heat<80&&mode!=="cover"&&mode!=="pod")dash(tg.x-me.x,tg.y-me.y,"close");
      if(!dashed&&me.hp<me.maxHp*.35&&nearB&&near<3.5&&(heavyFoe(nearB)||crowd>=3))dash(me.x-nearB.x,me.y-nearB.y,"escape");
    }

    /* ----- aim and the light gun ----- */
    if(aimP){inp.ax=aimP[0];inp.ay=aimP[1];inp.az=aimP[2];
      if(Math.hypot(aimP[0]-me.x,aimP[1]-me.y)<GR&&!me.over&&me.heat<(me.red>0?96.5:90)){inp.l=true;usage.pillarTicks++}}
    else if(tg){
      var lt=td/28;inp.ax=tg.x+(tg.vx||0)*lt;inp.ay=tg.y+(tg.vy||0)*lt;inp.az=tz;
      var see=clear(sim,me.x,me.y,1.1,tg.x,tg.y,tz,tg.r+.1),fin=tg.stag>0||tg.hp<=12*lvm(sim,"hp"),lim=me.red>0?(fin?110:96.5):fin?96:86;
      inp.l=fireOk&&see&&td<GR&&!me.over&&me.heat<lim;
      if(!see&&goal&&mode===""&&keep>4)keep=4;
    }
    /* ----- the heavy weapon: press when ready and in reach, hold for the chosen time, then release ----- */
    if(m.hold>0){m.hold++;if(m.hold<=m.want)inp.r=true;else m.hold=0;
      if(m.hT&&m.hT.hp>0){inp.ax=m.hT.x;inp.ay=m.hT.y;inp.az=m.hTz}}
    else if(ready&&accuracy!=="none"){
      var go=false;
      if(mode==="pillar"&&hk==="winch"&&aimP&&Math.hypot(aimP[0]-me.x,aimP[1]-me.y)<T.winch.perfect-.5&&!dangerUnder(sim,m.plan.pil,me)){go=true;m.hT=null}
      else if(tg&&heavyAllowed&&mode!=="cover"&&mode!=="pillar"){
        var d3=hk==="winch"?Math.hypot(td,tz-1):td;
        if(d3<reach&&(hk==="pile"||hk==="seismic"||clear(sim,me.x,me.y,1,tg.x,tg.y,tz,tg.r+.1))){go=true;m.hT=tg;m.hTz=tz}
      }
      if(go){inp.r=true;inp.rp=true;m.hold=1;m.want=holdTicks()}
    }
    /* ----- Q: the shoulder part ----- */
    if(m.qHold>0){m.qHold--;inp.k|=32}
    else if(m.qAim){inp.ax=m.qAim[0];inp.ay=m.qAim[1];inp.az=m.qAim[2];m.qAim=null}   /* the Breach throw happens on the release tick */
    else if(me.q&&tick-m.qLast>2&&m.hold<=0){   /* not while holding the ring: Q presses re-aim */
      var q=me.q,press=null;
      if(q==="mortar"&&me.sq<=0&&!me.over&&me.heat<80){
        var mb=null,mc=0;en.forEach(function(b){if(!ground(b))return;var d=dist(b,me);if(d<T.mortar.minR+.5||d>T.mortar.maxR-.5)return;
          var c=0;en.forEach(function(o){if(ground(o)&&dist(o,b)<T.mortar.radius+.6)c++});if(c>mc||c===mc&&mb&&d<dist(mb,me)){mc=c;mb=b}});
        if(mb)press=[mb.x+(mb.vx||0)*1.1,mb.y+(mb.vy||0)*1.1,.6];
        if(!mb&&mode==="pillar"&&aimP&&Math.hypot(aimP[0]-me.x,aimP[1]-me.y)>T.mortar.minR+.5)press=[aimP[0],aimP[1],.6];
      }
      else if(q==="vent"&&me.sq<=0){
        var close=en.filter(function(b){return !b.air&&dist(b,me)<T.vent.radius+.3}).length;
        if(me.over>.5&&near<16||me.heat>=88&&close>0||close>=3)press=[inp.ax,inp.ay,inp.az];
      }
      else if(q==="redline"&&me.sq<=0&&me.red<=0&&me.hp>me.maxHp*.45&&tg&&td<GR){
        var worth=tg.stag>0||tg.hp<=tg.maxHp*.4||tg.boss||tg.jugg||tg.kind==="wbody"||tg.part||crowd>=3;
        if(me.heat>=82&&!me.over&&worth||me.over>1.2&&near<9)press=[inp.ax,inp.ay,inp.az];
      }
      else if(q==="breach"){
        var mine=(sim.breaches||[]).filter(function(c){return c.by===i});
        var boom=mine.some(function(c){
          if(m.plan&&Math.abs(c.x-(m.plan.pil.x+1))<2.5&&Math.abs(c.y-(m.plan.pil.y+1))<2.5)return !dangerUnder(sim,m.plan.pil,me);
          return en.some(function(b){return Math.hypot(b.x-c.x,b.y-c.y,(b.z||0)+.5-c.z)<T.breach.radius+b.r})});
        if(mine.length&&(boom||tick-m.brT>240)){m.qHold=24;inp.k|=32;usage.q.detonate++;m.qLast=tick}
        else if(me.bHeld>0&&tick-m.brT>30){
          var bt=null;
          if(m.plan&&aimP&&Math.hypot(aimP[0]-me.x,aimP[1]-me.y)<T.breach.range-.5)bt=[aimP[0],aimP[1],1];
          else en.forEach(function(b){if(bt||b.air||b.part)return;var d=dist(b,me);if(d>T.breach.range-.5||d<2.5)return;
            var c=en.filter(function(o){return !o.air&&dist(o,b)<2.2}).length;if(c>=2||heavyFoe(b))bt=[b.x,b.y,(b.z||0)+.6]});
          if(bt){press=bt;m.qAim=bt;m.brT=tick}
        }
      }
      if(press){inp.k|=32;inp.ax=press[0];inp.ay=press[1];inp.az=press[2];usage.q[q]++;m.qLast=tick}
    }
    /* ----- call-ins from the two slots ----- */
    var slots=sim.callins&&sim.callins[i];
    if(slots&&sim.state==="play"&&tick-m.ciT>60&&m.hold<=0){
      var hasPod=function(t){return sim.pods.some(function(o){return o.type===t&&(o.by===i||Math.hypot(o.x-me.x,o.y-me.y)<20)})};
      var boss=en.some(function(b){return b.boss&&!b.rider||b.jugg||b.kind==="wbody"});
      var n12=en.filter(function(b){return !b.air&&dist(b,me)<12}).length,heavy12=en.some(function(b){return heavyFoe(b)&&!b.air&&dist(b,me)<12});
      for(var sl=0;sl<2;sl++){var ty=slots[sl];if(!ty)continue;var want=false;
        if(ty==="repair")want=me.hp<me.maxHp*.45&&!hasPod("repair");
        else if(ty==="overclock")want=(boss||en.length>=5)&&me.oc<=0&&!hasPod("overclock");
        else if(ty==="strike")want=(n12>=3||heavy12)&&!hasPod("strike");
        if(!want)continue;
        var ax=me.x,ay=me.y;if(nearB){var dl=near||1;ax-=(nearB.x-me.x)/dl*1.2;ay-=(nearB.y-me.y)/dl*1.2}
        inp.k|=sl?512:256;inp.ax=ax;inp.ay=ay;inp.az=.6;m.ciT=tick;usage.callins[ty]=(usage.callins[ty]||0)+1;break;
      }
    }
    return inp;
  }
  pilot.usage=usage;
  return pilot;
}
root.MetroPilot={make:make};
})(typeof globalThis!=='undefined'?globalThis:this);
