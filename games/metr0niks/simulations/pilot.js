/* Metr0niks scripted player (TDD-D17). Drives one mech of a MetroSim through sim.setInput so a whole excursion can run
   headless, with no human. Used by run.js (sweeps) and rules-check.js; it reads sim state and never changes rules.

   var pilot=MetroPilot.make({seed, accuracy});  then every tick, before sim.step():  sim.setInput(i, pilot(sim, i))
     accuracy  how the heavy weapon's timing ring is released:
               "perfect" every release at 1.0 s; "mix" 70% Perfect, 25% Good, 5% Miss; "random" anywhere from 0.5 to 1.4 s;
               "none" never uses the heavy weapon
     seed      the pilot's own random stream (the sim's stream is never touched)

   What it does: takes a Field repair pod when armor is below 50%, otherwise fights the nearest enemy (closing in with
   the pile-bunker when the ATB bar is full, keeping about 9 m away and circle-strafing otherwise), fires the light gun below 85 heat, and
   picks up scrap between fights. It paths over the sim's walk grid. It doesn't dash, use Q or take Overclock on purpose. */
(function(root){
"use strict";
var N8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

function make(opts){
  opts=opts||{};
  var seed=((opts.seed|0)||1)%2147483647;if(seed<=0)seed+=2147483646;
  function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
  var accuracy=opts.accuracy||"mix",mem={};

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
root.MetroPilot={make:make};
})(typeof globalThis!=='undefined'?globalThis:this);
