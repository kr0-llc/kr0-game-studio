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

/* ----- phase 4: zone enemies (GDD-D40, D48) ----- */
function freeAt(s,x,y){for(var r=0;r<6;r++)for(var dy=-r;dy<=r;dy++)for(var dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
  var cx=Math.floor(x)+dx,cy=Math.floor(y)+dy;if(!s.world.blockedCell(cx,cy))return [cx+.5,cy+.5]}return [x,y]}
function unit(s,kind,x,y,o){var c=freeAt(s,x,y),b=s.spawnUnit(kind,c[0],c[1],o);if(b&&!Array.isArray(b))b.state=b.kind==="charge"?b.state:"idle";return b}
/* a wave's queue as beginWave builds it, through the zone threats */
function waveQueue(s,n){var w=s.T.waves[n-1],c=1+s.T.level.count*(s.level-1),q=[],k;
  for(k=0;k<(w.boss||0);k++)q.push("boss");for(k=0;k<Math.round((w.loaders||0)*c);k++)q.push("loader");for(k=0;k<Math.round(w.bots*c);k++)q.push("bot");
  return s.zoneSlots(q,n)}
function count(q,k){return q.filter(function(x){return x===k}).length}
(function(){
  var zk=["pack","bulwark","wrecker","elite-bot","elite-loader"],lv,n,q;
  var s1=M.create({seed:9,level:1}),none=true;for(n=1;n<=5;n++){q=waveQueue(s1,n);zk.forEach(function(k){if(count(q,k))none=false})}
  ok(none,"zone threats only in open zones: level 1 (Underpass only) has no zone enemy in any wave");
  var s2=M.create({seed:9,level:2}),ok2=true;for(n=1;n<=5;n++){q=waveQueue(s2,n);
    if(count(q,"pack")!==([2,4,5].indexOf(n)>=0?1:0)||count(q,"bulwark")||count(q,"wrecker")||count(q,"elite-bot")||count(q,"elite-loader"))ok2=false}
  ok(ok2,"level 2 opens the Freight Yard: one Scuttler pack in waves 2, 4 and 5, and nothing from the sealed zones");
  ok(waveQueue(M.create({seed:9,level:2}),2).length===4,"level 2 wave 2: the pack takes the place of round(2 x 1.25) = 3 of the 5 bots");
  var s3=M.create({seed:9,level:3}),q34=waveQueue(s3,4),q32=waveQueue(s3,2);
  ok(count(q34,"bulwark")===2&&count(q34,"loader")===1&&!count(q32,"bulwark")&&!count(q34,"wrecker"),"level 3 opens Smelter Row: Bulwarks take loader slots in waves 4 and 5 only ("+q34.join(",")+")");
  var s4=M.create({seed:9,level:4}),w4={};for(n=1;n<=5;n++)w4[n]=count(waveQueue(s4,n),"wrecker");
  ok(w4[2]>0&&w4[4]>0&&!w4[1]&&!w4[3]&&!w4[5]&&!count(waveQueue(s4,5),"elite-bot"),"level 4 opens the Glass Quarter: Wreckers in waves 2 and 4 only, no Elites yet");
  var s5=M.create({seed:9,level:5}),el=true;for(n=1;n<=5;n++){q=waveQueue(s5,n);if(count(q,"elite-bot")+count(q,"elite-loader")!==1)el=false}
  ok(el,"level 5 opens the Terminus Yard: exactly one bot or loader in every wave is an Elite");
  ok(count(waveQueue(M.create({seed:9,level:5}),2),"pack")===2,"counts scale with the level: level 5 wave 2 brings round(1 x 2) = 2 packs");
  var q55=waveQueue(M.create({seed:9,level:5}),5),O=s5.T.dropOrder,sorted=q55.every(function(k,i){return !i||(O[q55[i-1]]||0)<=(O[k]||0)});
  ok(q55[0]==="boss"&&q55[q55.length-1]==="pack"&&sorted,"the drop order is boss, loaders and Bulwarks, Wreckers, bots, then Scuttler packs ("+q55.join(",")+")");
  ok(s1.run.queue.join()===M.create({seed:9,level:1}).run.queue.join()&&s5.run.queue.some(function(k){return k.indexOf("elite-")===0}),"wave 1's real queue goes through the same table (level 5: "+s5.run.queue.join(",")+")");
})();
(function(){   /* zone enemies land in their home zone */
  var s=M.create({seed:21,level:5,tune:{bot:{shotDmg:0,dmg:0},loader:{dmg:0},boss:{dmg:0},scuttler:{dmg:0},bulwark:{bashDmg:0},wave:{breather:.1}}}),first={},seen=[];
  for(var t=0;t<60*120&&s.wave<=5&&s.state!=="extracted";t++){idle(s);s.step();
    s.bots.forEach(function(b){if(seen.indexOf(b)>=0)return;seen.push(b);var k=b.kind||(b.elite?"elite":"");if(k&&k!=="charge")(first[k]=first[k]||[]).push(b.x)});
    if(!s.run.queue.length&&s.bots.every(function(b){return !b.dropping}))s.killAll()}
  var Z=M.MAP.zones;function inZ(k,z){return first[k]&&first[k].every(function(x){return x>=Z[z].x0-1&&x<=Z[z].x1+2})}
  ok(inZ("scuttler",1)&&inZ("bulwark",2)&&inZ("wrecker",3)&&inZ("elite",4),"at level 5 each zone enemy lands in its home zone (Scuttlers "+(first.scuttler||[]).length+", Bulwarks "+(first.bulwark||[]).length+", Wreckers "+(first.wrecker||[]).length+", Elites "+(first.elite||[]).length+")");
})();
(function(){   /* Scuttler */
  var s=M.create({seed:8,tune:calm}),p=s.players[0];steps(s,5);
  var l=s.spawnLoader(p.x+5,p.y);l.state="recover";l.t=99;l.hp=l.maxHp=1e6;var sc=unit(s,"scuttler",l.x+1,l.y);s.drainEvents();
  var h0=l.hp;s.hitEnemy(sc,100,{by:0,kind:"light",pow:1},sc.x,sc.y,.4);
  var k=kills(s);
  ok(k.length===1&&k[0][1]==="scuttler"&&k[0][2]===0&&k[0][4]===1,"a Scuttler shot down is the shooter's kill and drops 1 cube");
  ok(h0-l.hp===T.scuttler.dmg,"its blast hits another enemy in 1.5 m for "+T.scuttler.dmg+" ("+(h0-l.hp)+")");
  var s2=M.create({seed:8,tune:{bot:{shotDmg:0,dmg:0},loader:{dmg:0,scrap:[10,10]},boss:{dmg:0}}});steps(s2,5);var p2=s2.players[0];
  var v=s2.spawnLoader(p2.x+5,p2.y);v.state="recover";v.t=99;v.hp=4;var sc2=unit(s2,"scuttler",v.x+1,v.y);s2.drainEvents();
  s2.hitEnemy(sc2,100,{by:0,kind:"light",pow:1},sc2.x,sc2.y,.4);var lk=kills(s2).filter(function(e){return e[1]==="loader"})[0];
  ok(lk&&lk[2]===-1&&lk[3]==="hazard"&&lk[4]===Math.round(10*1.15),"a kill by a Scuttler blast is credited to nobody and gets the demolition bonus ("+(lk&&lk.slice(1).join(" "))+")");
  var s3=M.create({seed:8,tune:calm}),p3=s3.players[0];steps(s3,5);var a=unit(s3,"scuttler",p3.x+3,p3.y),hp=p3.hp;a.state="engage";
  steps(s3,90);var k3=kills(s3);
  ok(a.hp<=0&&hp-p3.hp===T.scuttler.dmg&&!k3.length,"a Scuttler runs at the mech, flashes and blows up: "+T.scuttler.dmg+" damage, and no kill for anyone ("+(hp-p3.hp)+")");
  var s4=M.create({seed:8,level:5,tune:calm});steps(s4,5);var b4=unit(s4,"scuttler",s4.players[0].x+4,s4.players[0].y);
  s4.hitEnemy(b4,1,{by:0,kind:"heavy",grade:"Perfect",pow:1});ok(b4.hp<=0,"a Scuttler dies to any Perfect, even at level 5 ("+b4.maxHp+" health)");
  var s5=M.create({seed:8,tune:calm});steps(s5,5);var b5=unit(s5,"scuttler",s5.players[0].x+6,s5.players[0].y);s5.spawnPod("repair",b5.x,b5.y,false);steps(s5,10);
  ok(s5.pods.length===1&&!b5.podCarrier,"a Scuttler can't take a pod");
  var s6=M.create({seed:8,tune:calm});steps(s6,5);var vx=s6.world.vox,n0=0,n1=0,i;for(i=0;i<vx.length;i++)if(vx[i])n0++;
  var b6=unit(s6,"scuttler",11.5,12.5);s6.hitEnemy(b6,100,{by:0,kind:"light",pow:1},b6.x,b6.y,.4);for(i=0;i<vx.length;i++)if(vx[i])n1++;
  ok(n0-n1===1,"its blast chips one voxel out of the wall beside it ("+(n0-n1)+")");
})();
(function(){   /* Bulwark: the shield is step 1 of the damage order */
  function setup(facing){var s=M.create({seed:8,tune:calm}),p=s.players[0];steps(s,5);var b=unit(s,"bulwark",p.x+3,p.y);
    b.head=facing?Math.atan2(p.y-b.y,p.x-b.x):Math.atan2(b.y-p.y,b.x-p.x);b.hp=b.maxHp=1000;return {s:s,p:p,b:b}}
  var F=setup(true),s=F.s,b=F.b,p=F.p,fx=b.x+Math.cos(b.head)*.6,fy=b.y+Math.sin(b.head)*.6;
  ok(s.hitEnemy(b,45,{by:0,kind:"heavy",grade:"Good",pow:1,w:"pile"},b.x,b.y,.8)===0&&b.hp===1000,"Bulwark: a Good pile-bunker from the front is blocked");
  ok(s.hitEnemy(b,10,{by:0,kind:"light",pow:1,resist:.5},fx,fy,.8)===0,"Bulwark: minigun rounds into the shield are blocked");
  ok(s.hitEnemy(b,34,{by:0,kind:"light",pow:1,w:"rail"},fx,fy,.8)===34,"Bulwark: the rail slug goes through the shield");
  ok(s.hitEnemy(b,80,{by:-1,kind:"collapse"},fx,fy,.8)===80&&s.hitEnemy(b,25,{by:-1,kind:"hazard"},fx,fy,.8)===25,"Bulwark: collapses and slag ignore the shield");
  ok(s.hitEnemy(b,10,{by:-1,kind:"hazard",blast:true},fx,fy,.8)===0,"Bulwark: a blast in front of the shield is blocked");
  var hp=b.hp,d=s.hitEnemy(b,45,{by:0,kind:"heavy",grade:"Perfect",pow:1,w:"pile"},b.x,b.y,.8);
  ok(d===90&&hp-b.hp===90&&Math.abs((b.shieldEnd-s.tick)/60-T.bulwark.broken)<.02&&b.stag===T.stagger.time,"Bulwark front Perfect: breaks the shield for "+T.bulwark.broken+" s, staggers it, and its damage goes through ("+d+")");
  ok(s.hitEnemy(b,45,{by:0,kind:"heavy",grade:"Good",pow:1,w:"pile"},b.x,b.y,.8)===68,"with the shield broken, a front Good goes through and takes the stagger bonus (45 x 1.5 = 68)");
  steps(s,T.bulwark.broken*60+5,function(){idle(s);b.state="idle"});
  ok(!(b.shieldEnd>s.tick)&&s.hitEnemy(b,45,{by:0,kind:"heavy",grade:"Good",pow:1,w:"pile"},b.x,b.y,.8)===0,"the shield is back after "+T.bulwark.broken+" s");
  var B=setup(false),bb=B.b,h2=bb.hp,d2=B.s.hitEnemy(bb,45,{by:0,kind:"heavy",grade:"Perfect",pow:1,w:"pile"},bb.x,bb.y,.8);
  ok(d2===90&&h2-bb.hp===90&&bb.stag===T.stagger.time&&!(bb.shieldEnd>B.s.tick),"Bulwark back Perfect: full damage and a stagger as usual; the shield stays whole");
  ok(B.s.hitEnemy(bb,10,{by:0,kind:"light",pow:1,resist:T.loader.minigunMult},bb.x-Math.cos(bb.head)*.6,bb.y-Math.sin(bb.head)*.6,.8)===8,"from behind, minigun rounds hit its armored body at half (10 x 1.5 stagger x 0.5 = 8)");
  var s9=M.create({seed:8,tune:{bot:{shotDmg:0,dmg:0},loader:{dmg:0},boss:{dmg:0}}}),p9=s9.players[0];steps(s9,5);var b9=unit(s9,"bulwark",p9.x+2.5,p9.y);
  b9.head=Math.atan2(p9.y-b9.y,p9.x-b9.x);b9.state="engage";b9.cd=0;var a9=p9.hp,px9=p9.x,py9=p9.y;steps(s9,1);
  ok(a9-p9.hp===T.bulwark.bashDmg&&Math.hypot(p9.x-px9,p9.y-py9)>1,"a Bulwark bashes a mech within 3 m in front of it: "+T.bulwark.bashDmg+" damage and a shove ("+(a9-p9.hp)+", "+Math.hypot(p9.x-px9,p9.y-py9).toFixed(1)+" m)");
})();
(function(){   /* Wrecker and its charge: the break and the collapse credit nobody */
  var s=M.create({seed:8,tune:{bot:{shotDmg:0,dmg:0},loader:{dmg:0,scrap:[10,10]},boss:{dmg:0}}});steps(s,5);
  var St=s.world.structures,base=function(px){return s.world.chunks.filter(function(c){var o=St[c.s];return o&&o.kind==="pillar"&&o.x===px&&c.cz===0&&c.alive})};
  var A=base(5)[0],B=base(17)[0],ca=unit(s,"charge",6.5,22.5,{chunk:A.id,fuse:.5}),cb=unit(s,"charge",17.5,22.5,{chunk:B.id,fuse:4});
  var l=s.spawnLoader(11.5,23.5);l.state="recover";l.t=99;l.hp=1;s.drainEvents();var kills0=s.kills;
  s.hitEnemy(cb,100,{by:0,kind:"light",pow:1},cb.x,cb.y,.3);   /* a mech shoots the second charge: it goes off early */
  ok(cb.hp<=0&&s.kills===kills0&&!kills(s).length,"a shot charge goes off early, and blowing it is no kill");
  var cl=[],xk=[];steps(s,300,function(){idle(s);s.clusters.forEach(function(c){if(cl.indexOf(c)<0)cl.push(c)});s.drainEvents().forEach(function(e){if(e[0]==="x")xk.push(e)})});
  ok(!base(5).length&&!base(17).length,"each charge breaks its pillar's base through the normal break path");
  ok(cl.length>0&&cl.every(function(c){return c.by===-1}),"the span the charges drop is credited to nobody, though a mech set one charge off ("+cl.length+" pieces, by "+cl.map(function(c){return c.by}).join(",")+")");
  var lk=xk.filter(function(e){return e[1]==="loader"})[0];
  ok(lk&&lk[2]===-1&&lk[3]==="collapse"&&lk[4]===Math.round(10*1.15),"a kill under it belongs to nobody and drops the demolition bonus ("+(lk&&lk.slice(1).join(" "))+")");
  var w=M.create({seed:8,tune:calm}),p=w.players[0];steps(w,5);var wr=unit(w,"wrecker",p.x+4,p.y);wr.state="move";
  steps(w,240);var far=Math.hypot(wr.x-p.x,wr.y-p.y);ok(far>=T.wrecker.keep,"a Wrecker backs off to more than "+T.wrecker.keep+" m from every mech ("+far.toFixed(1)+" m)");
  var planting=-1,chg=null,restart=false;
  steps(w,60*30,function(t){idle(w);if(wr.state==="plant"&&planting<0){planting=t;wr.t=1;w.hitEnemy(wr,1,{by:0,kind:"light",pow:1});restart=null}
    if(restart===null&&wr.state==="plant"&&wr.t>2)restart=true;if(!chg)chg=w.bots.filter(function(b){return b.kind==="charge"})[0]});
  ok(restart===true,"any damage restarts the plant");
  var cc=chg&&w.world.chunks[chg.chunk],o=cc&&w.world.structures[cc.s],cx=0,cy=0;if(cc){cc.v.forEach(function(i){cx+=i%M.W;cy+=((i/M.W)|0)%M.D});cx=cx/cc.v.length+.5;cy=cy/cc.v.length+.5}
  ok(chg&&(o.kind==="pillar"||o.kind==="building")&&Math.hypot(cx-p.x,cy-p.y)>=T.wrecker.keep,"it plants a charge on a "+(o&&o.kind)+" chunk at least "+T.wrecker.keep+" m from the mech ("+(cc?Math.hypot(cx-p.x,cy-p.y).toFixed(1):"-")+" m)");
  var d2=M.create({seed:8,tune:calm});steps(d2,5);var dp2=d2.players[0],dw2=unit(d2,"wrecker",dp2.x+12,dp2.y);dw2.state="move";var got=null;
  for(var t=0;t<60*20&&!got;t++){idle(d2);d2.step();if(dw2.hp>0&&dw2.state==="plant"){d2.hitEnemy(dw2,1e6,{by:0,kind:"light",pow:1});got=d2.bots.filter(function(b){return b.kind==="charge"})[0]}}
  ok(got&&Math.abs(got.t-T.charge.dropFuse)<1e-9,"a Wrecker killed mid-plant drops its charge, which goes off "+T.charge.dropFuse+" s later");
})();
(function(){   /* Elites */
  var s=M.create({seed:8,tune:{bot:{shotDmg:7,dmg:0},loader:{scrap:[10,10]},boss:{dmg:0}}}),p=s.players[0];steps(s,5);
  s.bots.length=0;s.run.queue.length=0;s.run.podAt.length=0;
  var e=unit(s,"elite-loader",p.x+1,p.y);
  ok(e.elite&&e.maxHp===T.loader.hp*T.elite.hp,"an Elite has double health ("+e.maxHp+")");
  var h=p.hp;e.state="charge";e.t=1;var d=Math.hypot(p.x-e.x,p.y-e.y);e.cx=(p.x-e.x)/d;e.cy=(p.y-e.y)/d;s.step();
  ok(h-p.hp===Math.round(T.loader.dmg*T.elite.dmg),"an Elite loader's ram deals +25% ("+(h-p.hp)+" for "+T.loader.dmg+")");
  var eb=unit(s,"elite-bot",p.x+4,p.y);eb.state="engage";eb.cd=0;eb.aim=Math.atan2(p.y-eb.y,p.x-eb.x);var shot=null;
  steps(s,30,function(){idle(s);if(!shot)shot=s.shots.filter(function(o){return o.team===1})[0]});
  ok(shot&&Math.round(shot.dmg)===Math.round(T.bot.shotDmg*T.elite.dmg),"an Elite bot's orb deals +25% ("+(shot&&shot.dmg)+")");
  s.drainEvents();var pods0=s.pods.length;e.hp=1;s.hitEnemy(e,10,{by:0,kind:"light",pow:1});var k=kills(s)[0];
  ok(k&&k[4]===15,"an Elite drops 1.5 times the scrap (10 -> "+(k&&k[4])+")");
  ok(s.pods.length===pods0+1&&s.pods[s.pods.length-1].landed&&T.elite.pods.indexOf(s.pods[s.pods.length-1].type)>=0,"an Elite leaves a Field repair or Overclock pod where it dies");
})();

console.log(bad?bad+" rule check(s) failed":"rules pass");
process.exit(bad?1:0);
