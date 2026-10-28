/* Headless rules check (TDD-D17, implementation plan phase 0): short scripted scenarios that each assert one rule of
   the GDD as sim.js plays it. Every later phase adds its cases here. Like map-check.js, it prints ok / FAIL per case
   and exits with code 1 if any case fails.
   Run: node games/metr0niks/simulations/rules-check.js */
"use strict";
require("./sim.js");require("./pilot.js");
var M=globalThis.MetroSim,P=globalThis.MetroPilot,T=M.T,bad=0;
function ok(c,msg){console.log((c?"ok   ":"FAIL ")+msg);if(!c)bad++}
function idle(s,i){s.setInput(i||0,{k:0,ax:s.players[0].x+1,ay:s.players[0].y+1,az:.6,l:false,r:false,rp:false})}
function steps(s,n,each){for(var t=0;t<n;t++){if(each)each(t);else idle(s);s.step()}}
var calm={bot:{shotDmg:0,dmg:0},loader:{dmg:0},boss:{dmg:0}};   /* enemies that can't hurt the mech, for single-rule cases */

/* ----- tuning per run (TDD-D11) ----- */
(function(){
  var s=M.create({seed:3,tune:{bot:{hp:1}}});
  ok(s.T.bot.hp===1&&T.bot.hp===60,"a run's tune override changes that run's T only (bot hp "+s.T.bot.hp+", MetroSim.T "+T.bot.hp+")");
  ok(s.T.bot.speed===T.bot.speed&&s.T.waves.length===T.waves.length,"keys the override doesn't name keep their values");
  var seen=null;steps(s,600,function(){idle(s);s.bots.forEach(function(b){if(!b.boss&&!b.loader&&seen===null)seen=b.maxHp})});
  ok(seen===1,"enemies in that run spawn with the overridden health ("+seen+")");
  ok(M.create({seed:3}).T===T,"a run with no override uses MetroSim.T itself");
  ok(s.tuneHash()!==M.tuneHash(T),"the tuning hash tells the two apart");
})();

/* ----- determinism ----- */
(function(){
  function play(seed){var s=M.create({seed:seed}),p=P.make({seed:9,accuracy:"mix"});steps(s,1800,function(){s.setInput(0,p(s,0))});return s.stateHash()}
  ok(play(11)===play(11),"same seed, tuning and pilot give the same state hash after 30 s");
  ok(play(11)!==play(12),"a different seed gives a different match");
})();

/* ----- timing ring (GDD Combat) ----- */
function ring(hold){
  var s=M.create({seed:5,tune:calm}),p=s.players[0];
  steps(s,5);p.atb=s.T.atb.fill;
  var x=p.x,y=p.y;
  s.setInput(0,{k:0,ax:x+1,ay:y+1,az:.6,l:false,r:true,rp:true});s.step();
  for(var t=1;t<hold;t++){s.setInput(0,{k:0,ax:x+1,ay:y+1,az:.6,l:false,r:true,rp:false});s.step()}
  s.setInput(0,{k:0,ax:x+1,ay:y+1,az:.6,l:false,r:false,rp:false});s.step();
  for(t=0;t<120&&p.ring>=0;t++){idle(s);s.step()}
  return p.pileRes;
}
ok(ring(60)==="Perfect","release at 1.0 s is a Perfect");
ok(ring(55)==="Perfect"&&ring(65)==="Perfect","release within 0.086 s of the target is a Perfect");
ok(ring(70)==="Good"&&ring(51)==="Good","release within 0.31 s of the target, outside Perfect, is a Good");
ok(ring(30)==="Miss","release before 0.69 s is a Miss");
ok(ring(120)==="Miss","holding past 1.31 s fires a Miss");

/* ----- heat (GDD Combat) ----- */
(function(){
  var s=M.create({seed:5,tune:calm}),p=s.players[0],locked=-1,freed=-1;
  steps(s,5);p.heat=98;
  steps(s,400,function(t){s.setInput(0,{k:0,ax:p.x+3,ay:p.y+3,az:.6,l:locked<0,r:false,rp:false});
    if(locked<0&&p.over>0)locked=t;else if(locked>=0&&freed<0&&p.over<=0)freed=t});
  ok(locked>=0,"firing the minigun past 100 heat starts a lockout");
  ok(freed-locked>=T.heat.lockout*60-1&&freed-locked<=T.heat.lockout*60+1,"a lockout lasts "+T.heat.lockout+" s ("+((freed-locked)/60).toFixed(2)+" s)");
  ok(p.heat<1,"heat falls to 0 over the lockout");
})();

/* ----- level scaling (GDD Excursion rules) ----- */
(function(){
  function botHp(level){var s=M.create({seed:4,level:level,tune:calm}),hp=null;
    steps(s,1200,function(){idle(s);s.bots.forEach(function(b){if(!b.boss&&!b.loader&&hp===null)hp=b.maxHp})});return hp}
  ok(botHp(1)===60,"a level-1 patrol bot has 60 health");
  ok(botHp(3)===Math.round(60*1.3),"each level above 1 adds 15% health (level 3: "+botHp(3)+")");
})();

/* ----- match end ----- */
(function(){
  var s=M.create({seed:6}),ev=null;steps(s,10);
  s.damage(s.players[0],1e9,s.players[0].x,s.players[0].y,1);
  s.drainEvents().forEach(function(e){if(e[0]==="o")ev=e});
  ok(s.state==="dead"&&ev&&ev[1]==="dead"&&ev[3]===0,"a destroyed mech ends the excursion and banks nothing");
  var x=M.create({seed:6,tune:{wave:{breather:.1}}}),out=null;
  for(var t=0;t<60*240&&!out;t++){idle(x);if(x.state==="play")x.killAll();x.step();x.drainEvents().forEach(function(e){if(e[0]==="o")out=e})}
  ok(out&&out[1]==="extracted"&&x.wave===T.waves.length,"clearing wave "+T.waves.length+" extracts ("+(out&&out[1])+")");
  ok(out&&Array.isArray(out[4].scrap)&&out[4].scrap.length===1,"the extract event reports each mech's scrap");
  ok(out&&out[4].stats&&out[4].stats[0].length===T.waves.length,"the extract event carries the match stats, one record per wave");
})();

/* ----- campaign save ----- */
(function(){
  var C=M.Campaign,c=C.make([M.STARTER],null,1234),code=C.encode(c),back=C.decode(code);
  ok(back&&back.seed===1234&&back.level===1&&back.players[0].scrap===0,"a campaign code round-trips");
  var n=C.advance(c,{scrap:[37]});
  ok(n.level===2&&n.players[0].scrap===37&&c.level===1,"extracting advances one level and banks the scrap");
  ok(C.decode("not a code")===null&&C.decode(C.encode({v:1,seed:1,level:0,players:[]}))===null,"bad codes are rejected");
  ok(C.levelSeed(c)!==C.levelSeed(n),"each level plays its own seed");
})();

/* ----- phase 1: hit path, kill credit, combo, stagger, stats (GDD-D35, D48, D50, D53, D55) ----- */
function dummy(s,armored){var p=s.players[0],l=s.spawnLoader(p.x+6,p.y);l.armored=!!armored;l.hp=l.maxHp=1e6;return l}
function kills(s){return s.drainEvents().filter(function(e){return e[0]==="x"})}
(function(){
  var s=M.create({seed:8,tune:calm});steps(s,5);var l=dummy(s,false);
  ok(s.hitEnemy(l,10,{by:0,kind:"light",pow:1.24})===12,"power multiplies a player weapon's base damage, rounded once (10 x 1.24 = 12)");
  ok(s.hitEnemy(l,10,{kind:"collapse",pow:1.5})===10,"collapses ignore power");
  ok(s.hitEnemy(l,45,{by:0,kind:"heavy",grade:"Good",pow:1})===45&&s.hitEnemy(l,45,{by:0,kind:"heavy",grade:"Miss",pow:1})===23,"a heavy hit takes its grade: Good x1, Miss x0.5");
  var a=dummy(s,true);
  ok(s.hitEnemy(a,10,{by:0,kind:"light",pow:1,resist:T.loader.minigunMult})===5&&s.hitEnemy(a,10,{by:0,kind:"light",pow:1})===10,"armor resist halves the minigun on a loader and nothing else");
  ok(s.hitEnemy(l,45,{by:0,kind:"heavy",grade:"Perfect",pow:1})===90&&l.stag===T.stagger.time,"a Perfect hits x2 and staggers for "+T.stagger.time+" s");
  ok(s.hitEnemy(l,10,{by:0,kind:"light",pow:1})===15,"a staggered enemy takes 50% more damage");
  ok(s.hitEnemy(a,10,{by:0,kind:"heavy",grade:"Good",pow:1.2,resist:.5})===6,"the steps multiply in order: 10 x 1.2 x 1 x 0.5 = 6");
  steps(s,30);s.hitEnemy(l,45,{by:0,kind:"heavy",grade:"Perfect",pow:1});
  ok(l.stag===T.stagger.time,"a Perfect on a staggered enemy restarts the stagger at 1.0 s; it never adds up");
  steps(s,61);ok(!(l.stag>0),"the stagger ends after 1.0 s");
  l.state="charge";l.t=1;l.cx=1;l.cy=0;s.hitEnemy(l,1,{by:0,kind:"heavy",grade:"Perfect",pow:1});steps(s,1);
  ok(l.state==="recover"&&l.vx===0&&l.vy===0,"a staggered loader's charge stops");
})();
(function(){
  function creditAfter(ticks){
    var s=M.create({seed:8,tune:calm});steps(s,5);var l=dummy(s,false);l.hp=100;
    s.hitEnemy(l,1,{by:0,kind:"light",pow:1});steps(s,ticks);s.drainEvents();
    s.hitEnemy(l,1e6,{kind:"hazard"});var k=kills(s)[0];return k&&k[2];
  }
  ok(creditAfter(174)===0,"a hazard kill 2.9 s after a mech's hit is credited to that mech");
  ok(creditAfter(186)===-1,"a hazard kill 3.1 s after the last hit is credited to nobody");
  var s=M.create({seed:8,tune:calm});steps(s,5);var l=dummy(s,false);
  s.hitEnemy(l,1e6,{by:-1,kind:"collapse"});ok(kills(s)[0][2]===-1,"a collapse nobody started is credited to nobody");
})();
(function(){
  var s=M.create({seed:5,tune:calm}),p=s.players[0];steps(s,5);
  function heavy(hold){p.atb=s.T.atb.fill;p.retract=0;var x=p.x,y=p.y;
    s.setInput(0,{k:0,ax:x+1,ay:y+1,az:.6,r:true,rp:true});s.step();
    for(var t=1;t<hold;t++){s.setInput(0,{k:0,ax:x+1,ay:y+1,az:.6,r:true});s.step()}
    s.setInput(0,{k:0,ax:x+1,ay:y+1,az:.6});s.step();for(t=0;t<120&&p.ring>=0;t++){idle(s);s.step()}}
  heavy(60);heavy(60);ok(p.combo===3,"each Perfect raises the combo by one (x"+p.combo+")");
  heavy(70);ok(p.combo===3,"a Good holds the combo");
  heavy(60);heavy(60);ok(p.combo===4,"the combo stops at x4");
  var b0=p.atb;steps(s,60);ok(Math.abs((p.atb-b0)-p.atbRate*1.25)<1e-6,"at x4 the ATB bar fills 25% faster");
  heavy(30);ok(p.combo===1,"a Miss drops the combo to x1");
  heavy(60);heavy(60);steps(s,60*T.combo.decay-30);ok(p.combo===3,"the combo holds up to 12 s without a heavy shot");
  steps(s,40);ok(p.combo===1,"12 s without a heavy shot drops it to x1");
  var w=s.stats[0][s.wave-1];ok(w.perfect===6&&w.good===1&&w.miss===1&&w.bestCombo===4,"the match stats count Perfects, Goods, Misses and the best combo");
})();
(function(){
  function drop(level,src,combo){var s=M.create({seed:8,level:level,tune:{bot:{shotDmg:0,dmg:0},loader:{dmg:0,scrap:[10,10]},boss:{dmg:0}}});steps(s,5);
    s.players[0].combo=combo||1;var l=dummy(s,false);l.hp=1;s.drainEvents();s.hitEnemy(l,1e6,src);return kills(s)[0][4]}
  ok(drop(1,{by:0,kind:"light",pow:1})===10,"a plain kill drops the base scrap");
  ok(drop(1,{by:0,kind:"heavy",grade:"Perfect",pow:1,w:"pile"})===20,"a Perfect pile-bunker kill drops double");
  ok(drop(1,{by:0,kind:"light",pow:1},4)===13,"a credited kill at x4 drops 30% more");
  ok(drop(1,{by:-1,kind:"collapse"},4)===12,"a collapse kill credited to nobody gets the demolition bonus but no combo bonus");
  ok(drop(3,{by:0,kind:"heavy",grade:"Perfect",pow:1,w:"pile"},3)===Math.round(10*1.2*2*1.2),"multipliers multiply and percentages add, rounded once (level 3, Perfect pile, x3: "+drop(3,{by:0,kind:"heavy",grade:"Perfect",pow:1,w:"pile"},3)+")");
  ok(drop(3,{by:0,kind:"collapse"},3)===Math.round(10*1.2*(1+.2+.15)),"combo and demolition add: 10 x 1.2 x 1.35 = 16");
})();
(function(){
  var s=M.create({seed:8,tune:calm});steps(s,5);var ls=[dummy(s),dummy(s),dummy(s)],mk=[];
  ls.forEach(function(l,k){l.hp=1;s.hitEnemy(l,9,{by:0,kind:"light",pow:1});steps(s,30)});
  s.drainEvents().forEach(function(e){if(e[0]==="mk")mk.push(e[2])});
  ok(mk.join()==="2,3","three kills 0.5 s apart make a DOUBLE then a TRIPLE ("+mk.join()+")");
  var w=s.stats[0][s.wave-1];ok(w.multi[2]===0&&w.multi[3]===1,"the stats count that streak once, as a triple");
  ok(w.kills.loader===3&&w.killsBy.light===3,"kills are counted by enemy type and by source");
  var t=dummy(s);t.hp=1;steps(s,95);s.hitEnemy(t,9,{by:0,kind:"light",pow:1});
  ok(!s.drainEvents().some(function(e){return e[0]==="mk"}),"a kill more than 1.5 s later starts a new count");
})();

/* ----- phase 6: blueprint parts, pods and call-ins (GDD-D36, D42, D43, D54) ----- */
function fit(o){var b=M.cloneBuild(M.STARTER);for(var k in o)b[k]=o[k];return b}
function bp(build,extra){var o={seed:8,tune:calm,builds:[fit(build)]};for(var k in extra||{})o[k]=extra[k];var s=M.create(o);steps(s,5);return s}
/* a frozen enemy that never dies: a loader held in its recover state */
function post(s,x,y,armored){var l=s.spawnLoader(x,y);l.armored=!!armored;l.hp=l.maxHp=1e6;l.state="recover";l.t=1e9;return l}
function aimAt(s,o,extra){var r={k:0,ax:o.ax,ay:o.ay,az:o.az===undefined?.6:o.az,l:false,r:false,rp:false};for(var k in extra||{})r[k]=extra[k];s.setInput(0,r)}
function tapQ(s,at){aimAt(s,at,{k:32});s.step();s.step();aimAt(s,at);s.step();s.step()}
function lost(l){return 1e6-l.hp}
(function(){
  var bps=M.PARTS.filter(function(p){return p.zone});
  ok(M.PARTS.length===27&&bps.length===6,"the garage holds 27 parts, 6 of them blueprints with a zone ("+bps.map(function(p){return p.id}).join(", ")+")");
  ok(M.unlockLevel("arc")===2&&M.unlockLevel("redline")===3&&M.unlockLevel("seismic")===3&&M.unlockLevel("breach")===4&&M.unlockLevel("overdrive")===5&&M.unlockLevel("skids")===5&&M.unlockLevel("minigun")===1,
    "each blueprint unlocks at the level that opened its zone (Freight Yard 2 to Terminus Yard 5)");
  ok(M.callinPrice("strike",1)===50&&M.callinPrice("repair",3)===48&&M.callinPrice("overclock",5)===42&&M.callinPrice("cache",1)===null,"call-in prices scale with the level's scrap scale (strike 50, repair at 3: 48, overclock at 5: 42)");
})();
/* Arc caster: a 9 damage bolt that jumps to up to 2 more enemies within 4 m for 6; half on loaders; no voxel damage */
(function(){
  var s=bp({armR:"arc"}),p=s.players[0];p.x=23.5;p.y=17.5;
  var A=post(s,28,17.5),B=post(s,30.5,17.5),C=post(s,28,20.4),D=post(s,33,17.5),far=post(s,36.5,17.5);
  p.aim=0;p.cool=0;aimAt(s,{ax:28,ay:17.5},{l:true});s.step();
  var pw=p.dmgMul;
  ok(lost(A)===Math.round(9*pw)&&lost(B)===Math.round(6*pw)&&lost(D)===Math.round(6*pw),"the bolt hits for 9 and jumps nearest-first to 2 more within 4 m for 6 ("+[lost(A),lost(B),lost(D)].join(", ")+")");
  ok(lost(C)===0&&lost(far)===0,"it jumps no more than twice and never past 4 m");
  ok(s.drainEvents().some(function(e){return e[0]==="ar"&&e[2].length===12}),"an arc event carries the bolt's path (start and three hits)");
  var t=bp({armR:"arc"}),q=t.players[0];q.x=23.5;q.y=17.5;var L=post(t,28,17.5,true);q.aim=0;q.cool=0;aimAt(t,{ax:28,ay:17.5},{l:true});t.step();
  ok(lost(L)===Math.round(9*q.dmgMul*.5),"an armored loader takes half ("+lost(L)+")");
  var u=bp({armR:"arc"}),r=u.players[0],w=u.world;r.x=6;r.y=19;r.aim=Math.PI/2;
  var before=0,i;for(i=0;i<w.vdmg.length;i++)before+=w.vdmg[i];
  for(i=0;i<30;i++){aimAt(u,{ax:6,ay:23.2,az:1},{l:true});u.step()}
  var after=0;for(i=0;i<w.vdmg.length;i++)after+=w.vdmg[i];
  ok(after===before&&r.heat>0,"bolts into a pillar do no voxel damage");
})();
/* Redline vent (GDD-D36) */
(function(){
  var s=bp({shoulder:"redline"}),p=s.players[0],at={ax:p.x+3,ay:p.y+3},net=0,prev=0,maxH=0,locked=false,hp0=p.hp;
  p.heat=90;prev=p.heat;tapQ(s,at);
  ok(p.red>4.9&&p.red<5,"Q starts 5 s of Redline");
  prev=Math.max(100,p.heat);
  for(var t=0;t<400&&p.red>0;t++){aimAt(s,at,{l:true});s.step();if(p.red>0||p.over>0){net+=Math.max(0,Math.max(100,p.heat)-prev);prev=Math.max(100,p.heat)}maxH=Math.max(maxH,p.heat);if(p.over>0&&p.red>0)locked=true}
  var cost=s.stats[0][s.wave-1].taken.redline||0,endHeat=p.heat;
  ok(!locked&&maxH>100&&maxH<=T.redline.cap+1e-9,"nothing locks during Redline and heat climbs past 100 to the cap (max "+maxH.toFixed(1)+")");
  ok(Math.abs(cost-net*T.redline.armor)<=1&&Math.abs((hp0-p.hp)-cost)<1e-9,"every point of net heat above 100 costs 0.5 armor through hitMech ("+cost+" for "+net.toFixed(1)+" heat)");
  ok(Math.abs(p.over-(T.redline.lockout+(endHeat-100)/10))<.02,"ending above 100 locks out for 3 s + 1 s per 10 heat above 100 ("+p.over.toFixed(2)+" s at "+endHeat.toFixed(1)+")");
  ok(Math.abs(p.sq-T.redline.every)<.02,"the vent then recharges for 14 s ("+p.sq.toFixed(2)+")");
  ok(s.stats[0][s.wave-1].redline>=4.9,"the stats count seconds in Redline ("+s.stats[0][s.wave-1].redline+")");
  var u=bp({shoulder:"redline"}),q=u.players[0];q.heat=100;q.over=2;tapQ(u,{ax:q.x+3,ay:q.y+3});
  ok(q.over===0&&q.red>0,"Q during a lockout ends it and starts Redline (the clutch use)");
  var v=bp({shoulder:"redline",core:"nanite"}),n=v.players[0];n.heat=99;tapQ(v,{ax:n.x+3,ay:n.y+3});
  var c0=n.calm;for(t=0;t<120;t++){aimAt(v,{ax:n.x+3,ay:n.y+3},{l:true});v.step()}
  ok(n.calm>c0+1.9&&(v.stats[0][v.wave-1].taken.redline||0)>0,"Redline's armor cost doesn't reset the Nanite core's calm timer");
  var w=bp({shoulder:"redline"}),m=w.players[0];m.heat=50;tapQ(w,{ax:m.x+3,ay:m.y+3});for(t=0;t<320;t++){aimAt(w,{ax:m.x+3,ay:m.y+3});w.step()}
  ok(m.red===0&&m.over===0&&!(w.stats[0][w.wave-1].taken.redline>0),"Redline that ends at 100 heat or below costs nothing and locks nothing");
})();
/* Seismic hammer: 50 within 3 m (4 m on a Perfect); a Perfect staggers, topples stacks and shakes a perched sniper */
function slam(s,hold){var p=s.players[0],at={ax:p.x+1,ay:p.y};p.atb=s.T.atb.fill;p.retract=0;
  aimAt(s,at,{r:true,rp:true});s.step();for(var t=1;t<hold;t++){aimAt(s,at,{r:true});s.step()}aimAt(s,at);s.step();for(t=0;t<120&&p.ring>=0;t++){aimAt(s,at);s.step()}}
(function(){
  var s=bp({armL:"seismic"}),p=s.players[0];p.x=23.5;p.y=17.5;var A=post(s,25.5,17.5),B=post(s,27.8,17.5);
  slam(s,70);
  ok(lost(A)===Math.round(50*p.dmgMul)&&lost(B)===0,"a Good slam hits every enemy within 3 m for 50 x power and nothing past it ("+lost(A)+", "+lost(B)+")");
  var t=bp({armL:"seismic"}),q=t.players[0];q.x=23.5;q.y=17.5;var C=post(t,25.5,17.5),E=post(t,27.8,17.5);
  slam(t,60);
  ok(lost(C)===Math.round(100*q.dmgMul)&&lost(E)===Math.round(100*q.dmgMul)&&C.stag>0&&E.stag>0,"a Perfect slam reaches 4 m, doubles and staggers all it hits");
  var u=M.create({seed:8,level:3,tune:calm,builds:[fit({armL:"seismic"})]});u.introTicks=0;steps(u,5);var r=u.players[0],w=u.world;
  r.x=56;r.y=14.5;var top=w.get(55,12,2);slam(u,60);var ev=u.drainEvents();
  ok(top===8&&w.get(55,12,0)===0&&ev.some(function(e){return e[0]==="c"}),"a Perfect topples a container stack within 4 m: the bottom box goes and the boxes on it fall");
  var x=bp({armL:"seismic"}),m=x.players[0],per=x.perches()[0],spot=null;
  for(var dy=-8;dy<=8&&!spot;dy++)for(var dx=-8;dx<=8&&!spot;dx++){var d=Math.hypot(dx,dy);if(d>=4&&d<=8&&!x.world.blockedCell(Math.floor(per[0])+dx,Math.floor(per[1])+dy))spot=[Math.floor(per[0])+dx+.5,Math.floor(per[1])+dy+.5]}
  m.x=spot[0];m.y=spot[1];
  var sn={team:1,boss:true,x:per[0],y:per[1],z:per[2],vz:0,dropping:false,vx:0,vy:0,r:.4,h:1,hp:180,maxHp:180,head:0,aim:0,state:"boss",flash:0,step:0,mode:"perch",cd:99,tell:0,blind:0,stun:0,jt:0,fallZ:0,jumpCd:99};
  x.bots.push(sn);slam(x,60);
  ok(sn.mode==="fall"||sn.z<per[2],"a Perfect shakes a sniper off a perch within 10 m");
})();
/* Breach charges: Q throws a sticky charge up to 10 m, Q again (or hold) sets them off: 40 within 2 m, every voxel within 2 m */
(function(){
  var s=bp({shoulder:"breach"}),p=s.players[0],at={ax:6,ay:23.2,az:1};p.x=6;p.y=19;var L=post(s,7.6,22);
  tapQ(s,at);var c=s.breaches[0];
  ok(s.breaches.length===1&&c.vi>=0&&c.y<23&&p.bHeld===1,"a tap throws one charge onto the surface under the cursor (it sticks to the pillar)");
  var held=0;aimAt(s,at,{k:32});s.step();for(var t=0;t<40;t++){aimAt(s,at,{k:32});s.step();if(s.breaches.length)held=t}aimAt(s,at);s.step();
  ok(s.breaches.length===0&&held>=Math.round(T.breach.hold*60)-3,"holding Q sets off the placed charge");
  ok(lost(L)===Math.round(T.breach.dmg*p.dmgMul),"the blast deals 40 to an enemy within 2 m ("+lost(L)+")");
  steps(s,90,function(){aimAt(s,at)});
  ok(s.dbg().down===1,"removing the voxels within 2 m brings the pillar down through the normal chunk path");
  steps(s,Math.round(T.breach.recharge*60),function(){aimAt(s,at)});
  ok(p.bHeld===2,"each charge is back 8 s after its throw");
  var u=bp({shoulder:"breach"}),q=u.players[0],far={ax:q.x+8,ay:q.y};tapQ(u,far);tapQ(u,far);
  ok(u.breaches.length===2&&q.bHeld===0,"two charges can be placed");
  tapQ(u,far);ok(u.breaches.length===0,"with none in hand, a tap sets off every placed charge");
  var v=bp({shoulder:"breach"}),m=v.players[0],tr={ax:m.x+20,ay:m.y,az:.6};tapQ(v,tr);
  ok(v.breaches.length===1&&Math.hypot(v.breaches[0].x-m.x,v.breaches[0].y-m.y)<=T.breach.range+.2,"a throw never lands past 10 m");
})();
/* Overdrive core and Grav-skids */
(function(){
  var s=bp({core:"overdrive"}),p=s.players[0],dm=p.dmgMul,ar=p.atbRate,dr=p.drain;
  p.hp=Math.floor(p.maxHp*.34);steps(s,1);
  ok(Math.abs(p.dmgMul-dm-.3)<1e-9&&Math.abs(p.atbRate-ar-.3)<1e-9&&Math.abs(p.drain-dr*1.5)<1e-9,"below 35% armor the Overdrive core adds 30 power and drains heat 50% faster");
  p.hp=p.maxHp;steps(s,1);
  ok(Math.abs(p.dmgMul-dm)<1e-9&&Math.abs(p.drain-dr)<1e-9,"above 35% it switches off");
  var t=bp({legs:"skids"}),q=t.players[0],n=0;q.heat=0;
  for(var i=0;i<30;i++){aimAt(t,{ax:q.x+1,ay:q.y},{k:16});var was=q.dashN;t.step();if(q.dashN<was)n++}
  ok(n===2&&q.skids===true,"Grav-skids hold 2 dashes ("+n+" in 0.5 s of held Space)");
  ok(Math.abs(q.heat-(2*T.skids.dashHeat-q.drain*(29/60)))<1.5,"each dash adds 8 heat ("+q.heat.toFixed(1)+")");
  steps(t,Math.round(T.skids.recharge*60)-24,function(){aimAt(t,{ax:q.x+1,ay:q.y})});var one=q.dashN;
  steps(t,Math.round(T.skids.recharge*60),function(){aimAt(t,{ax:q.x+1,ay:q.y})});
  ok(one===1&&q.dashN===2,"the charges come back one at a time, 1.6 s each");
  function shove(legs){var s2=bp({legs:legs}),m=s2.players[0];m.x=26;m.y=17.5;var l=s2.spawnLoader(25,17.5);l.state="charge";l.t=1;l.cx=1;l.cy=0;l.hit=false;var x0=m.x;
    aimAt(s2,{ax:m.x+1,ay:m.y});s2.step();return m.x-x0}
  var a=shove("jets"),b=shove("skids");
  ok(b>a*1.3,"a loader's shove pushes Grav-skids 50% further ("+a.toFixed(2)+" m vs "+b.toFixed(2)+" m)");
})();
/* pods (GDD-D43) */
(function(){
  var s=bp({}),n={repair:0,overclock:0,cache:0,strike:0},N=20000;for(var i=0;i<N;i++)n[s.podType()]++;
  ok(Math.abs(n.repair/N-.5)<.015&&Math.abs(n.overclock/N-.2)<.015&&Math.abs(n.cache/N-.15)<.015&&Math.abs(n.strike/N-.15)<.015,
    "pod types follow T.pods.odds 50/20/15/15 ("+[n.repair,n.overclock,n.cache,n.strike].map(function(v){return Math.round(v/N*100)}).join("/")+")");
  var t=M.create({seed:8,level:3,tune:calm});t.introTicks=0;steps(t,5);var p=t.players[0];t.spawnPod("cache",p.x,p.y,false);t.scraps.length=0;steps(t,1);
  var c=t.scraps.filter(function(x){return x.src==="pod"}).length;
  ok(c===Math.round(8*1.2),"a Scrap cache bursts 8 cubes x the level's scrap scale around the mech (level 3: "+c+")");
  var u=bp({}),q=u.players[0],L=u.spawnLoader(q.x+10,q.y);L.state="recover";L.t=1e9;u.spawnPod("cache",L.x,L.y,false);steps(u,1);
  ok(L.cache===8&&L.podCarrier,"an enemy that takes a Scrap cache carries it");
  u.scraps.length=0;u.hitEnemy(L,1e6,{by:0,kind:"light",pow:1});
  ok(u.scraps.filter(function(x){return x.src==="pod"}).length===8,"and drops those cubes with its own when it dies");
})();
(function(){
  /* a mech's Strike beacon: four shells at 3, 6, 9, 12 m toward its cursor, 40 x the level's hp scale, credited to it, never hurting mechs */
  var s=M.create({seed:8,level:3,tune:calm,builds:[M.STARTER,M.STARTER]});s.introTicks=0;steps(s,5);
  var p=s.players[0],q=s.players[1];p.x=23.5;p.y=17.5;q.x=29.5;q.y=17.5;
  var A=post(s,26.5,17.5),B=post(s,32.5,17.5),K=post(s,35.5,17.5);K.hp=5;
  s.spawnPod("strike",p.x,p.y,false);var at={ax:40,ay:17.5};
  for(var t=0;t<Math.round(T.strike.delay*60)+3;t++){aimAt(s,at);s.setInput(1,{k:0,ax:q.x+1,ay:q.y,az:.6});s.step()}
  var ev=s.drainEvents(),x=ev.filter(function(e){return e[0]==="x"})[0];
  ok(lost(A)===Math.round(40*1.3)&&lost(B)===Math.round(40*1.3),"Strike beacon shells hit enemies within 2 m for 40 x the level's hp scale (level 3: "+lost(A)+")");
  ok(x&&x[2]===0&&x[3]==="pod","a kill by a mech's Strike beacon is credited to that mech as a pod kill");
  ok(q.hp===q.maxHp&&p.hp===p.maxHp,"a mech's Strike beacon never hurts mechs, its partner included");
  /* an enemy's Strike beacon: aimed at the nearest mech with a 2 s warning, 20 to mechs and 40 to enemies, credited to nobody */
  var u=bp({}),m=u.players[0];m.x=31.5;m.y=17.5;var E=u.spawnLoader(22.5,17.5);E.state="recover";E.t=1e9;var V=post(u,28.5,17.5);V.hp=30;
  u.spawnPod("strike",E.x,E.y,false);steps(u,1,function(){aimAt(u,{ax:m.x+1,ay:m.y})});
  ok(u.strikes.length===1&&u.strikes[0].by===-1&&u.strikes[0].pts.length===4,"an enemy that takes a Strike beacon aims its four shells at the nearest mech");
  u.drainEvents();steps(u,Math.round(T.strike.enemyDelay*60)+2,function(){aimAt(u,{ax:m.x+1,ay:m.y})});
  var kx=u.drainEvents().filter(function(e){return e[0]==="x"})[0];
  ok(m.maxHp-m.hp===T.strike.mechDmg,"it hits the mech for 20 ("+(m.maxHp-m.hp)+")");
  ok(kx&&kx[2]===-1,"and its kills belong to nobody");
})();
/* call-ins (GDD-D54): keys 1 and 2 (input 256 and 512) call the slot's pod at the aim point, up to 14 m, as a normal pod */
(function(){
  var s=M.create({seed:8,tune:calm,callins:[["strike","repair"]]});steps(s,5);s.run.queue.length=0;s.bots.length=0;var p=s.players[0];p.x=23.5;p.y=17.5;s.drainEvents();
  aimAt(s,{ax:p.x+20,ay:p.y},{k:256});s.step();aimAt(s,{ax:p.x+20,ay:p.y},{k:256});s.step();
  var o=s.pods[0],ev=s.drainEvents().filter(function(e){return e[0]==="ci"});
  ok(s.pods.length===1&&o.type==="strike"&&o.by===0&&!o.landed&&o.t>T.pods.countdown-.05,"key 1 calls slot 1's pod with the usual marker and countdown (held, it calls once)");
  ok(Math.hypot(o.x-p.x,o.y-p.y)<=T.callin.range+1&&s.callins[0][0]===null&&s.callins[0][1]==="repair"&&ev.length===1,"it lands at the aim point, at most 14 m away, and empties the slot");
  /* slot 2's repair, stolen by a bot standing on the spot */
  var at={ax:p.x-6,ay:p.y};aimAt(s,at,{k:512});s.step();var o2=s.pods.filter(function(x){return x.type==="repair"})[0];
  var L=s.spawnLoader(o2.x,o2.y);L.state="recover";L.t=1e9;
  steps(s,Math.round(T.pods.countdown*60)+90,function(){aimAt(s,{ax:p.x+1,ay:p.y})});
  var w={pods:{stolen:0},callins:0};s.stats[0].forEach(function(x){if(x){w.pods.stolen+=x.pods.stolen;w.callins+=x.callins}});
  ok(s.pods.indexOf(o2)<0&&L.podCarrier&&w.pods.stolen===1,"a called-in pod is a race: a bot can steal it, and it counts as stolen from the caller");
  ok(w.callins===2,"the stats count call-ins used ("+w.callins+")");
  s.damage(p,1e9,p.x,p.y,1);var out=s.drainEvents().filter(function(e){return e[0]==="o"})[0];
  ok(out&&out[4].callins[0].used.join()==="strike,repair"&&out[4].callins[0].left.join()===",","the run-over detail reports the call-ins used, and a death leaves nothing in the slots");
  var x=M.create({seed:6,tune:{wave:{breather:.1}},callins:[[null,"overclock"]]}),end=null;
  for(var t=0;t<60*240&&!end;t++){idle(x);if(x.state==="play")x.killAll();x.step();x.drainEvents().forEach(function(e){if(e[0]==="o")end=e})}
  ok(end&&end[1]==="extracted"&&end[4].callins[0].left[1]==="overclock"&&end[4].callins[0].left[0]===null,"an unused call-in stays in its slot after an extract");
  var y=M.create({seed:8,tune:calm,callins:[["cache","bogus"]]});ok(y.callins[0][0]===null&&y.callins[0][1]===null,"only sold call-in types are accepted in a slot");
})();

console.log(bad?bad+" rule check(s) failed":"rules pass");
process.exit(bad?1:0);
