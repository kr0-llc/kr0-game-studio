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

/* ----- phase 5: city hazards (GDD-D41, D48, D55; Destruction and environment) ----- */
function smash(s,x,y,z){for(var k=0;k<8&&s.world.get(x,y,z);k++)s.hitVoxel(x,y,z,999)}
function pillarOut(s,px){var py=Math.floor((M.MAP.overpass.y0+M.MAP.overpass.y1)/2);for(var x=px;x<px+2;x++)for(var y=py;y<py+2;y++)for(var z=0;z<4;z++)smash(s,x,y,z)}
function idleAll(s){s.players.forEach(function(p,i){s.setInput(i,{k:0,ax:p.x+1,ay:p.y+1,az:.6})})}
function settle(s,n){for(var t=0;t<n;t++){idleAll(s);s.step()}}
(function(){
  /* level 5, two mechs: mech 0 breaks pillar 17, mech 1 breaks pillar 29, and the span between them falls on four bots */
  var s=M.create({seed:8,level:5,builds:[M.STARTER,M.STARTER],tune:calm});s.introTicks=1e9;settle(s,5);
  var bs=[[20.5,22.5],[23.5,23.5],[26.5,22.5],[25.5,25]].map(function(c){var b=s.spawnBot(c[0],c[1]);b.state="dummy";return b});
  var hp=bs[0].maxHp;
  s.asMech(0,function(){pillarOut(s,17)});settle(s,3);
  ok(!s.clusters.some(function(c){return c.span}),"one pillar down leaves the span standing (cantilevered)");
  s.asMech(1,function(){pillarOut(s,29)});settle(s,3);
  var span=s.clusters.filter(function(c){return c.span})[0];
  ok(span&&span.by===1,"the span's piece is credited to the mech that broke the last pillar chunk (mech "+(span&&span.by)+")");
  s.drainEvents();settle(s,150);var ev=s.drainEvents(),xs=ev.filter(function(e){return e[0]==="x"}),cr=ev.filter(function(e){return e[0]==="cr"}),sd=ev.filter(function(e){return e[0]==="sd"});
  ok(Math.round(T.collapse.botDmg*(1+T.level.hp*4))>=hp&&bs.every(function(b){return b.hp<=0}),"a span drop at level 5 kills patrol bots ("+hp+" health, "+Math.round(T.collapse.botDmg*(1+T.level.hp*4))+" collapse damage)");
  ok(xs.length===4&&xs.every(function(e){return e[2]===1&&e[3]==="collapse"}),"each kill is credited to mech 1 as a collapse kill");
  ok(cr.length===1&&cr[0][2]===4&&cr[0][5]===1&&cr[0][6]==="collapse","one CRUSHED event counts the four kills from that collapse ("+(cr[0]&&cr[0][2])+")");
  ok(sd.length===1&&sd[0][1]===span.id,"the span landing sends one SPAN DOWN event");
  var w=s.stats[1][s.wave-1];ok(w.spans===1&&w.bestCrush===4&&w.killsBy.collapse===4,"the stats give mech 1 the span, its best crush (4) and the collapse kills");
  ok(!(s.stats[0][s.wave-1]&&s.stats[0][s.wave-1].spans),"mech 0, who broke the first pillar, gets no span");
})();
(function(){
  /* a street vat: mech 0 shoots out its leg frame; it falls and spills a pool next to a bot and the mech */
  var s=M.create({seed:8,tune:{bot:{shotDmg:0,dmg:0,scrap:[10,10]},loader:{dmg:0},boss:{dmg:0},heat:{drain:0}}});s.introTicks=1e9;settle(s,5);
  var v=M.MAP.vats[0],b=s.spawnBot(v[0]+2.6,v[1]+2.5),p=s.players[0];b.state="dummy";p.x=v[0]-.5;p.y=v[1]-.5;
  s.asMech(0,function(){smash(s,v[0],v[1],0)});settle(s,2);
  ok(s.clusters.length===1&&s.clusters[0].by===0&&s.clusters[0].vats.length===1,"a vat whose leg frame breaks falls as a collapse credited to the breaker");
  s.drainEvents();var t=0;while(!s.pools.length&&t<200){settle(s,1);t++}
  var o=s.pools[0],S=T.slag;
  ok(o&&o.x1-o.x0===S.size&&o.y1-o.y0===S.size&&o.by===0&&Math.abs(o.t-S.time)<.05,"where it lands it spills a "+S.size+" x "+S.size+" m pool for "+S.time+" s, credited to the vat breaker");
  ok(s.drainEvents().some(function(e){return e[0]==="sp"&&e[1]===o.id}),"the spill sends an event");
  var b0=b.hp,h0=p.hp,q0=p.heat;settle(s,60);
  ok(b0-b.hp===S.botDps,"the pool burns an enemy for "+S.botDps+" a second ("+(b0-b.hp)+")");
  ok(h0-p.hp===S.mechDps&&Math.abs(p.heat-q0-S.heat)<1e-6,"a mech in it takes "+S.mechDps+" a second and "+S.heat+" heat a second ("+(h0-p.hp)+", "+(p.heat-q0).toFixed(1)+")");
  p.skids=true;h0=p.hp;q0=p.heat;settle(s,60);
  ok(h0-p.hp===S.mechDps*S.skids&&Math.abs(p.heat-q0-S.heat*S.skids)<1e-6,"Grav-skids (p.skids) halve the pool's damage and heat ("+(h0-p.hp)+", "+(p.heat-q0).toFixed(1)+")");
  var ev=[];for(t=0;t<60*S.time&&s.pools.length;t++){settle(s,1);ev=ev.concat(s.drainEvents())}
  var x=ev.filter(function(e){return e[0]==="x"})[0],cr=ev.filter(function(e){return e[0]==="cr"});
  ok(b.hp<=0&&x&&x[2]===0&&x[3]==="hazard","a bot burns to death in the pool and the kill is credited to the vat breaker");
  ok(x&&x[4]===Math.round(10*(1+T.demolition)),"a hazard kill drops the demolition bonus (10 cubes -> "+(x&&x[4])+")");
  ok(!s.pools.length&&cr.length===1&&cr[0][2]===1&&cr[0][6]==="slag"&&cr[0][5]===0,"the pool cools after "+S.time+" s and sends one CRUSHED event with its kill count");
  var w=s.stats[0][s.wave-1];ok(w.props===1&&w.killsBy.hazard===1&&w.taken.slag>0,"stats: one prop brought down, a hazard kill, slag damage taken");
})();
(function(){
  /* a 3-high container stack: one chunk of the bottom box goes, the whole box goes, and the two above fall */
  var s=M.create({seed:8,tune:calm});s.introTicks=1e9;settle(s,5);
  var c=M.MAP.containers.filter(function(c){return c[5]===3&&c[2]>4})[0];
  s.asMech(0,function(){smash(s,c[0],c[1],0)});settle(s,2);
  var left=0;for(var x=c[0];x<c[0]+c[2];x++)for(var z=0;z<2;z++)if(s.world.get(x,c[1],z))left++;
  ok(left===0,"breaking one chunk of a container destroys the whole box (T.hazard.wholeBox)");
  ok(s.clusters.length===1&&s.clusters[0].by===0&&s.clusters[0].prop,"the containers stacked on it fall as one collapse credited to the breaker");
  ok(s.stats[0][s.wave-1].props===1,"the stack counts as a prop brought down");
  var n=0;for(x=c[0];x<c[0]+c[2];x++)for(z=2;z<6;z++)if(s.world.get(x,c[1],z))n++;
  ok(n===0,"nothing of the stack stays up");
})();
(function(){
  /* the landmarks: break every leg as mech 0; each falls after the 0.9 s warning, credited to mech 0, as one prop */
  var MP=M.MAP,C=MP.crane,props=[["water tower",MP.tower.legs,0],["gantry crane",[[C.x0,C.y0],[C.x1,C.y0],[C.x0,C.y1],[C.x1,C.y1]],0],
    ["billboard",MP.billboard.legs,0],["slag gallery",MP.gallery.legs,MP.gallery.vats.length]];
  props.forEach(function(pr){
    var s=M.create({seed:8,tune:calm});s.introTicks=1e9;settle(s,5);
    s.asMech(0,function(){pr[1].forEach(function(l){smash(s,l[0],l[1],0)})});settle(s,2);
    var c=s.clusters.filter(function(c){return c.prop})[0];
    ok(c&&c.by===0&&c.creak>T.collapse.warn-.1&&c.off===0,pr[0]+": all legs gone, it falls after the warning, credited to the breaker");
    settle(s,180);
    ok(s.stats[0][s.wave-1].props===1&&s.pools.length===pr[2],pr[0]+": one prop brought down"+(pr[2]?", and each of its "+pr[2]+" vats spills a pool":""));
  });
})();

console.log(bad?bad+" rule check(s) failed":"rules pass");
process.exit(bad?1:0);
