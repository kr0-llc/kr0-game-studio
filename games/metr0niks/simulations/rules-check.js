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

/* ----- phase 2: campaign and save ----- */
function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function finish(s){var out=null;for(var t=0;t<60*300&&!out;t++){idle(s);if(s.state==="play")s.killAll();s.step();s.drainEvents().forEach(function(e){if(e[0]==="o")out=e})}return out}
/* save v2 (TDD-D12): v1 migration */
(function(){
  var C=M.Campaign,v1={v:1,seed:99,level:7,players:[{build:{core:null,armR:"shotgun",armL:"pile",shoulder:null,legs:"jets",reactor:"mk1"},owned:["shotgun"],scrap:40,armor:55}]};
  var c=C.decode(C.encode(v1)),p=c&&c.players[0];
  ok(c&&c.v===2&&c.seed===99&&c.typed===false&&c.live===false&&c.level===T.level.max,"a v1 code loads as v2, its level capped at "+T.level.max+" ("+(c&&c.level)+")");
  ok(p&&p.scrap===40&&p.build.armR==="shotgun"&&same(p.wear,{})&&same(p.upg,{})&&p.best===5&&p.armor===undefined,"v1 migration: no wear, no upgrades, best = level capped at 5, carried armor dropped");
  ok(p&&same(p.records,{level:0,combo:0,spans:0,contracts:0,overtimes:0})&&same(p.callins,[null,null]),"v1 migration: empty records and call-in slots");
  var c3=C.decode(C.encode({v:1,seed:5,level:3,players:[{build:M.STARTER,owned:[],scrap:0,armor:null}]}));
  ok(c3&&c3.level===3&&c3.players[0].best===3,"a v1 code at level 3 keeps level 3 with best 3");
})();
/* save v2: strict validation */
(function(){
  var C=M.Campaign,good=C.make([{core:"composite",armR:"rail",armL:"pile",shoulder:"cryo",legs:"jets",reactor:"mk1"}],null,1234);
  good.players[0].wear={composite:.25,rail:1};good.players[0].upg={rail:2,minigun:1};good.players[0].best=3;good.players[0].callins=["strike",null];
  good.players[0].records={level:4,combo:3,spans:2,contracts:1,overtimes:0};
  var g=C.decode(C.encode(good));
  ok(g&&g.v===2&&g.players[0].wear.rail===1&&g.players[0].upg.rail===2&&g.players[0].callins[0]==="strike"&&g.players[0].records.level===4,"a good v2 code round-trips with wear, upgrades, records and call-ins");
  function bad(name,f){var c=JSON.parse(JSON.stringify(good));f(c,c.players[0]);ok(C.decode(C.encode(c))===null,"rejects a v2 code with "+name)}
  bad("wear on an unknown part",function(c,p){p.wear.laser=.1});
  bad("wear above 1",function(c,p){p.wear.composite=1.5});
  bad("negative wear",function(c,p){p.wear.composite=-.1});
  bad("wear on a starter part",function(c,p){p.wear.pile=.2});
  bad("wear on a part not owned",function(c,p){p.wear.mk3=.2});
  bad("an upgrade level of 3",function(c,p){p.upg.rail=3});
  bad("a fractional upgrade level",function(c,p){p.upg.rail=1.5});
  bad("an upgrade on a non-weapon",function(c,p){p.upg.cryo=1});
  bad("an upgrade on a weapon not owned",function(c,p){p.upg.mortar=1});
  bad("a level of 6",function(c){c.level=6});
  bad("a level of 0",function(c){c.level=0});
  bad("a highest level of 6",function(c,p){p.best=6});
  bad("an unknown call-in",function(c,p){p.callins=["nuke",null]});
  bad("three call-in slots",function(c,p){p.callins=[null,null,null]});
  bad("a seed of 0",function(c){c.seed=0});
  bad("a seed above 2,147,483,000",function(c){c.seed=2147483001});
  bad("three players",function(c){c.players.push(c.players[0],c.players[0])});
  bad("no typed flag",function(c){delete c.typed});
  bad("negative records",function(c,p){p.records.spans=-1});
  bad("negative scrap",function(c,p){p.scrap=-5});
  bad("no wear object",function(c,p){delete p.wear});
})();
/* the in-match mark (TDD-D8) and restarts (GDD-D49) */
(function(){
  var C=M.Campaign,c=C.make([M.STARTER],null,500);c.level=3;
  var b=C.decode(C.encode(C.begin(c)));
  ok(b&&b.live===true&&b.players[0].records.level===3,"a match start writes the in-match mark and the level reached");
  var r=C.restart(b,777);
  ok(r.level===1&&r.seed===777&&r.live===false,"a death or restart goes to level 1 on the new seed and clears the mark");
  b.typed=true;r=C.restart(b,777);
  ok(r.level===1&&r.seed===777&&r.typed===false,"a typed seed is used for that climb only: the next climb draws a new one");
})();
/* climb plan (TDD-D10) */
(function(){
  var C=M.Campaign,B=M.BOSSES,CD={},CT={},i,L;M.CONDITIONS.forEach(function(x){CD[x.id]=x});M.CONTRACTS.forEach(function(x){CT[x.id]=x});
  ok(same(C.plan({seed:42}),C.plan({seed:42}))&&same(C.plan({seed:42,level:4}),C.plan({seed:42})),"the same climb seed gives the same plan");
  var diff=0;for(i=1;i<=50;i++)if(!same(C.plan({seed:i}),C.plan({seed:i+1})))diff++;
  ok(!same(C.plan({seed:42}),C.plan({seed:43}))&&diff>=48,"different seeds give different plans ("+diff+" of 50 neighbouring pairs differ)");
  var rep=0,mild=0,first=0,last=0,range=0,filt=0,nul=0,n=500,len=0;
  for(i=0;i<n;i++){var pl=C.plan({seed:1+i*4294967%2147483000}),cs={},ks={};len+=pl.length===T.level.max?1:0;
    pl.forEach(function(e,k){L=k+1;if(!e.condition||!e.contract||!e.bosses[0]||!e.bosses[1])nul++;
      if(cs[e.condition]||ks[e.contract])rep++;cs[e.condition]=ks[e.contract]=1;
      e.bosses.forEach(function(b,w){var bb=B[b];if(!bb||L<bb.lv[0]||L>bb.lv[1]||(bb.wave&&bb.wave!==(w?5:3)))range++});
      var ct=CT[e.contract];if((ct.need==="sniper"&&!e.bosses.some(function(b){return B[b].sniper}))||(ct.not===e.condition)||(ct.need==="span"&&C.openSpans(L)<1))filt++});
    if(CD[pl[0].condition].mild)mild++;if(pl[0].bosses[0]==="sniper")first++;if(pl[T.level.max-1].bosses[1]==="warden")last++}
  ok(len===n&&nul===0,"every plan has "+T.level.max+" levels, each with a condition, a contract and two bosses");
  ok(rep===0,"no condition or contract repeats within a climb ("+n+" climbs)");
  ok(mild===n,"level 1 always draws a mild condition");
  ok(first===n,"level 1 wave 3 is always the Bounty sniper");
  ok(last===n,"level 5 wave 5 is always the Warden");
  ok(range===0,"bosses only come on their levels (sniper 1-4, pair 2-4, Juggernaut 3-5, Warden level 5 wave 5)");
  ok(filt===0,"no contract that can't be done is drawn (Eviction needs a sniper, Clean sweep not under Cold front, Crush and Bring it down need a span)");
  ok(C.openSpans(1)>=1,"the Underpass has an overpass span ("+C.openSpans(1)+")");
  var s=M.create({seed:3,plan:C.plan({seed:42})[1]});
  ok(s.plan&&s.plan.level===2&&s.plan.condition===C.plan({seed:42})[1].condition,"create({plan}) keeps the level's entry as sim.plan");
})();
/* wear (GDD-D18) */
(function(){
  var b={core:"composite",armR:"minigun",armL:"pile",shoulder:null,legs:"jets",reactor:"mk2"},s0=M.statsOf(b),s1=M.statsOf(b,{composite:.5,mk2:.5,minigun:.5});
  ok(s1.power===s0.power-7.5&&s1.speed===s0.speed-5-3,"wear scales helpful power and speed by 1 - wear (power "+s1.power+", speed "+s1.speed+")");
  ok(s1.weight===s0.weight+6-0&&s1.armor===s0.armor&&s1.heat===s0.heat,"helpful weight loss shrinks, costs (armor -15, heat +10, weight +8) stay whole");
  ok(same(M.statsOf(b,{minigun:1}),s0),"starter parts never wear");
  var sl={core:"slag",armR:"minigun",armL:"pile",shoulder:null,legs:"jets",reactor:"mk1"};
  ok(M.deriveStats(sl,T,{slag:.5}).maxHp===130&&M.deriveStats(sl).maxHp===160,"worn slag-plating gives half its armor (max armor 130)");
  var x=M.create({seed:3,builds:[sl],wear:[{slag:.5}]});
  ok(x.players[0].maxHp===130&&x.players[0].hp===130,"create({wear}) derives worn stats; every level starts at full armor");
  var C=M.Campaign,c=C.make([sl],null,9),n=C.advance(c,{result:"extracted",level:1,scrap:[10],damage:[80]});
  ok(n.players[0].wear.slag===.05&&n.players[0].wear.minigun===undefined,"extract adds 0.10 x damage taken / max armor to fitted non-starter parts (80 of 160: "+n.players[0].wear.slag+")");
  ok(n.players[0].best===1&&n.players[0].scrap===10,"extract raises the highest level extracted and banks the scrap");
  c.players[0].wear.slag=.98;n=C.advance(c,{scrap:[0],damage:[500]});
  ok(n.players[0].wear.slag===1,"wear stops at 100%");
  var g=C.bank(C.make([sl],null,9),0,{level:4,scrap:[5,12],damage:[0,160]},1);
  ok(g.level===1&&g.seed===9&&g.players[0].scrap===12&&g.players[0].wear.slag===.1&&g.players[0].records.level===4&&g.players[0].best===0,"a co-op guest banks only its own scrap, wear and records");
})();
/* damage taken reaches the extract detail */
(function(){
  var s=M.create({seed:6,tune:{wave:{breather:.1}}});steps(s,5);
  var p=s.players[0];s.damage(p,25,p.x,p.y,1);var o=finish(s);
  ok(o&&o[4].damage&&o[4].damage[0]>=25&&p.taken===o[4].damage[0],"the extract detail reports each mech's damage taken ("+(o&&o[4].damage)+")");
})();
/* repair (GDD-D28) */
(function(){
  var C=M.Campaign,c=C.make([{core:"composite",armR:"minigun",armL:"pile",shoulder:null,legs:"treads",reactor:"mk3"}],null,9),p=c.players[0];
  ok(C.repairPrice("composite",.4)===2&&C.repairPrice("treads",.5)===18&&C.repairPrice("mk3",.5)===45&&C.repairPrice("minigun",.5)===0,"repair price = ceil(price x wear x 0.25 / 0.5 / 0.75); starters free");
  p.wear={composite:.4,treads:.5,mk3:.02};p.scrap=10;
  var r=C.repairAll(c,0);
  ok(same(r.fixed,["composite","mk3"])&&same(r.skipped,["treads"])&&r.spent===4&&p.scrap===6,"Repair goes in slot order and skips a part it can't afford ("+r.fixed+" fixed, "+r.skipped+" skipped)");
  ok(same(p.wear,{treads:.5}),"repaired parts lose their wear");
})();
/* weapon upgrades (GDD-D23) */
(function(){
  var C=M.Campaign;
  ok(C.upgradePrice("minigun",0)===20&&C.upgradePrice("minigun",1)===40&&C.upgradePrice("minigun",2)===null&&C.upgradePrice("shotgun",1)===70&&C.upgradePrice("rail",0)===60&&C.upgradePrice("cryo",0)===null,
    "upgrade prices: common 20/40, rare 35/70, epic 60/120; none past Mk III or for non-weapons");
  var all=0;M.PARTS.forEach(function(p){if(M.isWeapon(p.id))all+=C.upgradePrice(p.id,0)+C.upgradePrice(p.id,1)});
  ok(all===1395,"upgrading all twelve weapons (nine base, plus the Arc caster, Seismic hammer and Breach charges) to Mk III costs 1,395 ("+all+")");
  var c=C.make([M.STARTER],null,9);c.players[0].scrap=100;
  ok(C.upgrade(c,0,"minigun")===20&&C.upgrade(c,0,"minigun")===40&&C.upgrade(c,0,"minigun")===false&&c.players[0].upg.minigun===2&&c.players[0].scrap===40,"upgrading pays from banked scrap, up to Mk III");
  ok(C.upgrade(c,0,"rail")===false&&C.upgrade(c,0,"cryo")===false,"no upgrade for a weapon not owned or a non-weapon");
  var s=M.create({seed:3,upgrades:[{minigun:2}]}),q=s.players[0];
  ok(Math.abs(q.upMul("minigun")-1.2)<1e-9&&q.upMul("pile")===1&&q.upg.minigun===2,"create({upgrades}) gives player.upMul(part) = 1 + 0.10 x level");
})();
/* five levels and victory (GDD-D47) */
(function(){
  ok(T.level.max===5,"the campaign has 5 levels");
  var s=M.create({seed:6,level:5,tune:{wave:{breather:.1}}}),o=finish(s);
  ok(o&&o[1]==="victory"&&s.state==="victory"&&o[4].result==="victory"&&o[4].level===5,"extracting level 5 is a victory ("+(o&&o[1])+")");
  ok(o&&Array.isArray(o[4].scrap)&&Array.isArray(o[4].damage)&&o[3]===o[4].scrap[0],"a victory banks scrap like an extract");
  var x=M.create({seed:6,level:4,tune:{wave:{breather:.1}}}),e=finish(x);
  ok(e&&e[1]==="extracted","extracting level 4 is not a victory");
  var C=M.Campaign,c=C.make([M.STARTER],null,9);c.level=5;var n=C.restart(C.advance(c,o[4]),321);
  ok(n.level===1&&n.seed===321&&n.players[0].best===5,"after a victory the next climb starts at level 1 on a new seed, best 5 kept");
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

/* ----- phase 3: match flow (GDD-D37 Overtime, GDD-D38 contracts, GDD-D39 sector conditions, GDD-D24 revive) ----- */
var Z5=[{bots:0},{bots:0},{bots:0},{bots:0},{bots:0}];
var QUIET=M.mergeTune(calm,{waves:Z5,wave:{breather:1000},pods:{perWave:0,extra:0}});   /* wave 1 clears at once, then a long breather: nothing happens */
function plan(cond,contract,level){return {level:level||1,zone:"Underpass",condition:cond||null,contract:contract||null,bosses:["sniper","sniper"]}}
function mk(o){o=o||{};return M.create({seed:o.seed||8,level:o.level||1,builds:o.builds,plan:plan(o.cond,o.contract,o.level),tune:M.mergeTune(o.base||QUIET,o.tune||{})})}
function ctEv(ev,st){return ev.filter(function(e){return e[0]==="ct"&&(st===undefined||e[4]===st)})}
function key(s,k,i){s.setInput(i||0,{k:k,ax:s.players[0].x+1,ay:s.players[0].y+1,az:.6})}
/* play to the end quickly: short breathers, Enter at the prompt; returns {o: the run-over event, ev: every event} */
function toEnd(s,each){var out=null,ev=[];s.T.wave.breather=.02;if(s.run.breather>1)s.run.breather=.02;
  for(var t=0;t<60*120&&!out;t++){key(s,s.state==="choose"?128:0);if(each)each(t);s.step();s.drainEvents().forEach(function(e){ev.push(e);if(e[0]==="o")out=e})}
  return {o:out,ev:ev}}
function done(s){return s.contract&&s.contract.state===1}
function failed(s){return s.contract&&s.contract.state===-1}
function REW(level){return Math.round(T.contract.scrap*(1+T.level.scrap*(level-1)))}
/* destroy whole pillars (pxs: their x) as mech `by` (-1: nobody) */
function dropSpan(s,pxs,by){s.asMech(by,function(){pxs.forEach(function(px){for(var z=0;z<5;z++)for(var y=23;y<25;y++)for(var x=px;x<px+2;x++)if(s.world.get(x,y,z))s.setVox(x,y,z,0)})})}
function crushed(n,by){
  var s=mk({contract:"crush"});steps(s,3);
  for(var k=0;k<n;k++){var l=s.spawnLoader(21.5+k*2,21.5);l.hp=5;l.stag=1e9}
  dropSpan(s,[17,29],by);steps(s,150);return s;
}
/* contracts: one case that completes each and one that fails it */
(function(){
  var s=crushed(3,0),ev=s.drainEvents();
  ok(done(s)&&s.contract.progress===3&&ctEv(ev,1).length===1,"Crush: 3 enemies killed by one collapse completes it ("+s.contract.progress+")");
  ok(s.players[0].scrap===REW(1)&&s.scrap===REW(1)&&ctEv(ev,1)[0][5]===REW(1),"a completed contract adds "+REW(1)+" scrap to the match scrap at once (level 1)");
  s=crushed(2,0);var r=toEnd(s);ok(failed(s)&&r.o&&r.o[4].contract.state===-1&&r.o[4].contract.reward===0&&s.contract.progress===2,"Crush: 2 kills from one collapse fails it at extract");
  s=crushed(3,-1);ok(!done(s),"Crush: a collapse nobody started counts for no contract");
})();
(function(){
  var s=mk({contract:"bringItDown"});steps(s,3);dropSpan(s,[17,29,41],0);steps(s,150);
  ok(done(s)&&s.contract.progress>=2,"Bring it down: dropping 2 spans completes it ("+s.contract.progress+")");
  s=mk({contract:"bringItDown"});steps(s,3);dropSpan(s,[17,29],0);steps(s,150);toEnd(s);
  ok(failed(s)&&s.contract.progress===1,"Bring it down: 1 span fails it ("+s.contract.progress+" of "+s.contract.goal+")");
})();
(function(){
  function evict(n,by){
    var s=mk({contract:"eviction",tune:{waves:[{bots:0,boss:1},{bots:0},{bots:0},{bots:0},{bots:0}]}}),b=null;
    for(var t=0;t<300&&!b;t++){idle(s);s.step();b=s.bots.filter(function(x){return x.boss})[0]}
    for(var k=0;k<n;k++){
      var c=s.perches()[k*7];b.x=c[0];b.y=c[1];b.z=c[2];b.mode="perch";b.stun=0;b.stag=0;
      s.asMech(by,function(){s.setVox(Math.floor(b.x),Math.floor(b.y),Math.floor(b.z-.5),0)});steps(s,90)}
    return s;
  }
  var s=evict(2,0);ok(done(s)&&s.contract.progress===2,"Eviction: knocking the sniper off its perch twice completes it");
  s=evict(1,0);ok(s.contract.progress===1&&!done(s),"Eviction: once is 1 of 2");s.killAll();toEnd(s);ok(failed(s),"Eviction: once fails it at extract");
  s=evict(2,-1);ok(s.contract.progress===0,"Eviction: a perch that falls with no mech's help counts for nothing");
})();
function perfects(s,n){var p=s.players[0];for(var i=0;i<n;i++){p.atb=s.T.atb.fill;p.retract=0;var x=p.x,y=p.y;
  s.setInput(0,{k:0,ax:x+1,ay:y+1,az:.6,r:true,rp:true});s.step();
  for(var t=1;t<60;t++){s.setInput(0,{k:0,ax:x+1,ay:y+1,az:.6,r:true});s.step()}
  s.setInput(0,{k:0,ax:x+1,ay:y+1,az:.6});s.step();for(t=0;t<120&&p.ring>=0;t++){idle(s);s.step()}}}
(function(){
  var s=mk({contract:"fullCombo",level:3});steps(s,5);perfects(s,3);
  ok(done(s)&&s.players[0].combo===4&&s.players[0].scrap===REW(3),"Full combo: reaching x4 completes it; the reward scales with the level (level 3: "+s.players[0].scrap+")");
  s=mk({contract:"fullCombo"});steps(s,5);perfects(s,2);toEnd(s);
  ok(failed(s)&&s.contract.progress===3,"Full combo: x3 fails it at extract");
})();
(function(){
  function sweep(steal){
    var s=mk({contract:"cleanSweep",base:calm,tune:{waves:[{bots:1},{bots:1},{bots:1},{bots:1},{bots:1}],wave:{breather:.05},pods:{perWave:1,extra:0,window:[.5,.6]}}}),p=s.players[0],out=null;
    for(var t=0;t<60*200&&!out;t++){
      key(s,s.state==="choose"?128:0);
      var lp=s.pods.filter(function(o){return o.landed})[0],b=s.bots.filter(function(x){return !x.dropping})[0];
      if(lp){if(steal===s.wave){if(b){b.x=lp.x;b.y=lp.y;b.stag=1e9}}else{p.x=lp.x;p.y=lp.y}}
      if(!s.pods.length&&!s.run.podAt.length&&s.run.waveT>1)s.bots.forEach(function(x){if(!x.dropping)s.hitEnemy(x,1e6,{by:-1,kind:"hazard"})});
      s.step();s.drainEvents().forEach(function(e){if(e[0]==="o")out=e});
    }
    return {s:s,o:out};
  }
  var a=sweep(0);ok(a.o&&a.o[1]==="extracted"&&done(a.s)&&a.s.run.podsTaken===5&&a.o[4].contract.state===1,"Clean sweep: taking all 5 wave pods completes it at extract ("+a.s.run.podsTaken+" of "+a.s.run.podsDropped+")");
  var b=sweep(2);ok(failed(b.s)&&b.s.run.podsLost===1,"Clean sweep: a pod taken by an enemy fails it");
})();
(function(){
  function wave3(dmg){
    var s=mk({contract:"untouchable",base:calm,tune:{waves:[{bots:0},{bots:0},{bots:1},{bots:0},{bots:0}],wave:{breather:.05}}}),hit=false;
    for(var t=0;t<60*30&&s.wave<4&&!s.contract.state;t++){idle(s);
      if(s.wave===3&&s.bots.length&&!s.bots[0].dropping&&!hit){hit=true;s.hitMech(s.players[0],dmg,{kind:"enemy"});s.killAll()}s.step()}
    return s;
  }
  var s=wave3(19);ok(done(s),"Untouchable: clearing wave 3 having lost 19% of max armor completes it");
  s=wave3(20);ok(failed(s)&&s.contract.progress===20,"Untouchable: losing 20% in wave 3 fails it");
})();
(function(){
  var s=mk({contract:"closeShave"});steps(s,5);s.players[0].hp=14;var r=toEnd(s);
  ok(r.o&&r.o[4].contract.state===1&&r.o[4].scrap[0]===REW(1),"Close shave: extracting below 15% of max armor completes it; the reward banks with the extract");
  s=mk({contract:"closeShave"});steps(s,5);s.players[0].hp=15;r=toEnd(s);ok(r.o&&failed(s)&&r.o[4].scrap[0]===0,"Close shave: extracting at 15% fails it");
})();
(function(){
  var s=mk({contract:"blitz",tune:{wave:{breather:.05}}});steps(s,30);
  ok(done(s),"Blitz: waves 1 and 2 cleared within 75 s completes it ("+s.run.clock.toFixed(2)+" s)");
  s=mk({contract:"blitz",base:calm,tune:{waves:[{bots:0},{bots:1},{bots:0},{bots:0},{bots:0}],wave:{breather:.05},pods:{perWave:0,extra:0}}});
  steps(s,60*74);var mid=s.contract.state;steps(s,60*2);ok(mid===0&&failed(s),"Blitz: still in wave 2 at 75 s fails it");
})();
(function(){
  function wreck(n){var s=mk({contract:"wreckingCrew"}),v=s.world.vox,W=M.W,D=M.D,c=0;steps(s,3);
    s.asMech(0,function(){for(var i=0;i<v.length&&c<n;i++){var x=i%W,y=((i/W)|0)%D,z=(i/(W*D))|0;if(v[i]===2||v[i]===6||v[i]===7){s.setVox(x,y,z,0);c++}}});
    steps(s,2);return s}
  var s=wreck(400);ok(done(s)&&s.contract.progress>=400,"Wrecking crew: 400 voxels destroyed completes it");
  s=wreck(150);toEnd(s);ok(failed(s)&&s.contract.progress<400,"Wrecking crew: fewer than 400 fails it ("+s.contract.progress+")");
})();
(function(){
  function repo(n,by){var s=mk({contract:"repoMan"});steps(s,3);
    for(var k=0;k<n;k++){var l=s.spawnLoader(30+k*3,17.5);l.hp=5;l.stag=1e9;s.spawnPod("repair",l.x,l.y,false);steps(s,2);s.hitEnemy(l,1e6,{by:by,kind:"light",pow:1})}
    steps(s,2);return s}
  var s=repo(2,0);ok(done(s)&&s.contract.progress===2,"Repo man: killing 2 enemies that took a pod completes it");
  s=repo(1,0);toEnd(s);ok(failed(s)&&s.contract.progress===1,"Repo man: 1 fails it");
  s=repo(2,-1);ok(s.contract.progress===0,"Repo man: pod carriers killed by nobody don't count");
})();
(function(){
  var s=mk({contract:"fullCombo",builds:[M.STARTER,M.STARTER]});steps(s,5);s.damage(s.players[1],1e9,0,0,0);perfects(s,3);
  ok(done(s)&&s.players[0].scrap===REW(1)&&s.players[1].scrap===0,"co-op: a contract pays each living mech, not a downed one");
  s=mk({contract:"fullCombo",builds:[M.STARTER,M.STARTER]});steps(s,5);perfects(s,3);
  ok(s.players[0].scrap===REW(1)&&s.players[1].scrap===REW(1)&&s.scrap===2*REW(1),"co-op: each living mech gets the full amount");
})();

/* sector conditions: each changes what it should */
(function(){
  function breakShare(cond){var s=mk({cond:cond}),W=M.W,D=M.D,lost=0,ch=s.world.chunks.filter(function(c){return !c.pillar&&c.init>=48&&c.cz===0&&s.world.structures[c.s].kind==="building"})[0];
    while(ch.alive&&lost<ch.init){var i=ch.v.filter(function(j){return s.world.vox[j]&&s.world.owner[j]===ch.s})[0];s.setVox(i%W,((i/W)|0)%D,(i/(W*D))|0,0);lost++}
    return lost/ch.init}
  var b0=breakShare(null),b1=breakShare("brittle"),b2=breakShare("reinforced");
  ok(b0>.2&&b0<.23,"no condition: a chunk breaks once it has lost 20% of its voxels ("+(b0*100).toFixed(1)+"%)");
  ok(b1>.12&&b1<.15,"Brittle city: chunks break at 12% lost ("+(b1*100).toFixed(1)+"%)");
  ok(b2>.3&&b2<.33,"Reinforced: chunks break at 30% lost ("+(b2*100).toFixed(1)+"%)");
  var r=mk({cond:"reinforced"});ok(r.T.collapse.scrap[0]===2*T.collapse.scrap[0]&&r.T.collapse.scrap[1]===2*T.collapse.scrap[1],"Reinforced: collapse scrap doubles ("+r.T.collapse.scrap+")");
  ok(T.chunk.breakAt===.8&&T.collapse.scrap[0]===2,"conditions never change MetroSim.T");
})();
(function(){
  var s=mk({cond:"loosePillars"}),base=mk({}),pc=function(x){return x.world.chunks.filter(function(c){return c.pillar&&c.cz===0})};
  var a=pc(s),ok1=a.length>0&&a.every(function(c){return c.alive&&c.count<c.init&&c.count>=s.T.chunk.pillarBreakAt*c.init&&(c.init-c.count)/c.init>=.1});
  ok(ok1&&pc(base).every(function(c){return c.count===c.init}),"Loose pillars: every pillar's lowest chunks start "+Math.round((a[0].init-a[0].count)/a[0].init*100)+"% short ("+a[0].count+" of "+a[0].init+" voxels)");
  var c=a[0],i=c.v.filter(function(j){return s.world.vox[j]})[0],W=M.W,D=M.D;s.setVox(i%W,((i/W)|0)%D,(i/(W*D))|0,0);
  ok(!c.alive,"Loose pillars: one more voxel lost breaks the chunk");
})();
(function(){
  var b=mk({}).players[0].drain,h=mk({cond:"heatWave"}).players[0].drain,c=mk({cond:"coldFront"}).players[0].drain;
  ok(Math.abs(h/b-.7)<1e-9,"Heat wave: heat drains 30% slower ("+h.toFixed(1)+" vs "+b.toFixed(1)+" per s)");
  ok(Math.abs(c/b-1.3)<1e-9,"Cold front: heat drains 30% faster ("+c.toFixed(1)+" per s)");
  var one=0,two=0;for(var sd=1;sd<=30;sd++){if(M.create({seed:sd*104729,plan:plan("coldFront")}).run.podAt.length===1)one++;if(M.create({seed:sd*104729}).run.podAt.length===2)two++}
  ok(one===30&&two>0,"Cold front: one pod per wave (30 of 30 waves; "+two+" of 30 without it had two)");
  var pr=0;for(sd=1;sd<=30;sd++)if(M.create({seed:sd*104729,plan:plan("podRain")}).run.podAt.length===2)pr++;
  ok(pr===30,"Pod rain: two pods every wave");
})();
(function(){
  var s=M.create({seed:4,plan:plan("scrapStorm"),tune:calm}),b=M.create({seed:4,tune:calm});
  ok(s.run.queue.length===b.run.queue.length+1,"Scrap storm: every wave adds one bot ("+s.run.queue.length+" vs "+b.run.queue.length+" drops)");
  function drop(cond){var x=M.create({seed:8,plan:plan(cond),tune:M.mergeTune(calm,{loader:{scrap:[10,10]}})});steps(x,5);var l=dummy(x,false);l.hp=1;x.drainEvents();x.hitEnemy(l,1e6,{by:0,kind:"light",pow:1});return kills(x)[0][4]}
  ok(drop("scrapStorm")===13&&drop(null)===10,"Scrap storm: scrap drops +30% (10 -> "+drop("scrapStorm")+")");
})();
(function(){
  var s=mk({cond:"blackout"});
  ok(Math.abs(s.T.bot.sight-7)<1e-9&&Math.abs(s.T.loader.sight-7)<1e-9&&Math.abs(s.T.boss.sight-10.5)<1e-9,"Blackout: enemies see 30% less far (bot "+s.T.bot.sight+" m, sniper "+s.T.boss.sight+" m)");
  ok(s.cond.night&&s.cond.light===12&&!mk({}).cond.night,"Blackout: the view's night flag, lit within 12 m");
  function sees(cond){var x=M.create({seed:8,plan:plan(cond),tune:M.mergeTune(calm,{waves:[{bots:1}].concat(Z5.slice(1)),pods:{perWave:0,extra:0}})}),b=null,p=x.players[0];
    for(var t=0;t<400&&!b;t++){idle(x);x.step();b=x.bots.filter(function(e){return !e.dropping})[0]}
    b.x=p.x+8.5;b.y=p.y;b.state="patrol";b.lost=0;idle(x);x.step();return b.state}
  ok(sees(null)==="engage"&&sees("blackout")==="patrol","Blackout: a bot 8.5 m away spots you by day and not at night ("+sees(null)+" / "+sees("blackout")+")");
})();
(function(){
  function seeks(cond){var x=M.create({seed:8,plan:plan(cond),tune:M.mergeTune(calm,{waves:[{bots:1}].concat(Z5.slice(1)),pods:{perWave:0,extra:0}})}),b=null,p=x.players[0];
    for(var t=0;t<400&&!b;t++){idle(x);x.step();b=x.bots.filter(function(e){return !e.dropping})[0]}
    b.x=p.x+6;b.y=p.y;b.state="patrol";x.spawnPod("repair",p.x+2,p.y,false);steps(x,3);return b.state}
  ok(seeks(null)!=="seekpod"&&seeks("podRain")==="seekpod","Pod rain: a patrol bot at full health goes for a pod nearer you ("+seeks(null)+" / "+seeks("podRain")+")");
})();
(function(){
  function bosses(cond){var x=M.create({seed:8,plan:plan(cond),tune:M.mergeTune(calm,{waves:[{bots:0},{bots:0},T.waves[2],T.waves[3],T.waves[4]],wave:{breather:.05},pods:{perWave:0,extra:0}})});
    for(var t=0;t<300&&x.wave<3;t++){idle(x);x.step()}
    return x.run.queue.filter(function(q){return q==="boss"}).length}
  ok(bosses("snipersNest")===2&&bosses(null)===1,"Sniper's nest: a boss wave brings one extra Bounty sniper ("+bosses("snipersNest")+" vs "+bosses(null)+")");
})();

/* the choose prompt and Overtime (GDD-D37) */
var FAST=M.mergeTune(calm,{waves:Z5,wave:{breather:.05},pods:{perWave:0,extra:0}});
function toChoose(s){var ev=[];for(var t=0;t<60*60&&s.state!=="choose";t++){idle(s);if(s.state==="play")s.killAll();s.step();ev=ev.concat(s.drainEvents())}return ev}
(function(){
  var s=mk({base:FAST}),ev=toChoose(s);
  ok(s.state==="choose"&&ev.some(function(e){return e[0]==="ch"&&e[1]==="prompt"&&e[2]===6}),"clearing wave 5 opens the 6 s choose prompt");
  var t0=s.tick,o=null;for(var t=0;t<600&&!o;t++){idle(s);s.step();s.drainEvents().forEach(function(e){if(e[0]==="o")o=e})}
  ok(o&&o[1]==="extracted"&&Math.abs(s.tick-t0-360)<=2,"no choice extracts after 6 s ("+((s.tick-t0)/60).toFixed(2)+" s)");
  s=mk({base:FAST});toChoose(s);key(s,128);s.step();ev=s.drainEvents();
  ok(s.state==="extracted"&&ev.some(function(e){return e[0]==="ch"&&e[1]==="extract"}),"Enter or R (128) extracts at once");
  s=mk({base:FAST,builds:[M.STARTER,M.STARTER]});toChoose(s);steps(s,10,function(){key(s,64,1);key(s,0,0)});
  ok(s.state==="choose","in co-op the guest's F does nothing: the host chooses");
  key(s,64,0);s.step();ev=s.drainEvents();
  ok(s.state==="overtime"&&s.run.overtime&&ev.some(function(e){return e[0]==="ch"&&e[1]==="overtime"}),"the host's F (64) calls Overtime");
})();
(function(){
  var s=mk({base:FAST,tune:{waves:[{bots:0},{bots:0},{bots:0},{bots:6,loaders:2},{bots:0}],loader:{scrap:[10,10]}}});toChoose(s);
  s.scraps.push({x:40.5,y:40.5,z:.08,vx:0,vy:0,vz:0,t:0,spin:0,src:"kill"});
  key(s,64);s.step();
  for(var t=0;t<400&&s.wave<6;t++){idle(s);s.step()}
  var q=s.run.queue.slice(),nl=q.filter(function(x){return x==="loader"}).length,nb=q.filter(function(x){return x==="bot"}).length;
  ok(s.wave===6&&s.state==="overtime"&&nl===3&&nb===6&&q.indexOf("boss")<0,"Overtime is wave 4 plus one loader, no boss ("+nl+" loaders, "+nb+" bots)");
  ok(s.scraps.some(function(c){return c.src==="kill"}),"cubes on the floor when Overtime is called stay where they are");
  s.drainEvents();var l=dummy(s,false);l.hp=1;s.hitEnemy(l,1e6,{by:0,kind:"light",pow:1});var k=kills(s)[0];
  ok(k&&k[4]===15&&s.scraps.filter(function(c){return c.src==="overtime"}).length===15,"while Overtime runs a drop counts 1.5 times (10 -> "+(k&&k[4])+"), as Overtime scrap");
  var r=toEnd(s,function(){if(s.state==="overtime")s.killAll()});
  ok(r.o&&r.o[1]==="extracted"&&r.o[4].overtime.called&&r.o[4].overtime.cleared&&r.o[4].records[0].overtimes===1,"clearing Overtime extracts, and the record counts one Overtime cleared");
  ok(r.o&&r.o[4].stats[0].length===6,"the stats record has a sixth wave for Overtime");
  ok(!r.ev.some(function(e){return e[0]==="ch"&&e[1]==="prompt"}),"there is no prompt after Overtime: one per excursion");
})();
(function(){
  var s=mk({base:FAST,tune:{waves:[{bots:0},{bots:0},{bots:0},{bots:1},{bots:0}]}});toChoose(s);key(s,64);s.step();
  for(var t=0;t<400&&!(s.bots.length&&!s.bots[0].dropping);t++){idle(s);s.step()}
  s.players[0].scrap=50;s.scrap=50;s.damage(s.players[0],1e9,0,0,0);var o=null;s.drainEvents().forEach(function(e){if(e[0]==="o")o=e});
  ok(s.wave===6&&o&&o[1]==="dead"&&o[3]===0&&s.state==="dead","dying in Overtime is a normal death: the match scrap is lost");
})();

/* revive (GDD-D24) in a two-mech match */
(function(){
  var price=Math.round(T.revive.price*(1+T.level.scrap*2)),t;
  var s=mk({base:FAST,level:3,builds:[M.STARTER,M.STARTER],tune:{waves:[{bots:1},{bots:0},{bots:0},{bots:0},{bots:0}]}}),a=s.players[0],b=s.players[1],ev=[];
  for(t=0;t<400&&!(s.bots.length&&!s.bots[0].dropping);t++){idle(s);s.step()}
  s.damage(b,1e9,b.x,b.y,1);a.scrap=price+5;s.scrap=price+5;
  for(t=0;t<400&&s.wave===1&&!(s.run.breather>0);t++){idle(s);s.killAll();s.step();ev=ev.concat(s.drainEvents())}
  ok(b.hp===Math.round(b.maxHp*.3)&&a.scrap===5&&s.scrap===5,"a wave's end revives the downed partner at 30% armor for "+price+" scrap at level 3 (paid by the survivor)");
  ok(ev.some(function(e){return e[0]==="rv"&&e[1]===1&&e[2]===0&&e[3]===price})&&Math.hypot(a.x-b.x,a.y-b.y)<3,"the revived mech comes back beside the survivor");
  s=mk({base:FAST,builds:[M.STARTER,M.STARTER],tune:{waves:[{bots:1},{bots:0},{bots:0},{bots:0},{bots:0}]}});a=s.players[0];b=s.players[1];
  for(t=0;t<400&&!(s.bots.length&&!s.bots[0].dropping);t++){idle(s);s.step()}
  s.damage(b,1e9,b.x,b.y,1);a.scrap=39;for(t=0;t<400&&s.wave===1&&!(s.run.breather>0);t++){idle(s);s.killAll();s.step()}ok(b.hp<=0&&a.scrap===39,"a survivor short of the price leaves the partner down");
  function at5(call){var x=mk({base:FAST,builds:[M.STARTER,M.STARTER]}),q=x.players[1];steps(x,2);x.damage(q,1e9,q.x,q.y,1);
    toChoose(x);x.players[0].scrap=60;key(x,call?64:128);x.step();return x}
  var e=at5(false),o=at5(true);
  ok(e.state==="extracted"&&e.players[1].hp<=0,"no revive after wave 5 when the team extracts");
  ok(o.state==="overtime"&&o.players[1].hp===30&&o.players[0].scrap===20,"calling Overtime runs the revive check at the end of wave 5");
  var r=toEnd(o,function(){if(o.state==="overtime")o.killAll()});
  ok(r.o&&r.o[1]==="extracted"&&r.o[4].overtime.cleared&&r.o[4].scrap.length===2,"a two-mech Overtime clears and extracts both wallets ("+(r.o&&r.o[4].scrap)+")");
})();
(function(){
  var C=M.Campaign,c=C.make([M.STARTER],null,9),n=C.advance(c,{result:"extracted",level:1,scrap:[10],damage:[0],records:[{combo:2,spans:0,contracts:1,overtimes:1}]});
  ok(n.players[0].records.contracts===1&&n.players[0].records.overtimes===1,"the lifetime records add the match's contracts and Overtimes");
  var s=mk({contract:"fullCombo"});steps(s,5);perfects(s,3);var r=toEnd(s);
  ok(r.o&&r.o[4].records[0].contracts===1&&r.o[4].contract.reward===REW(1),"the extract detail reports the contract and the record line");
})();


/* ----- phase 7: bosses (GDD-D51, TDD-D14) ----- */
var BW=[{bots:0},{bots:0},{bots:0,boss:1},{bots:0},{bots:0,boss:1}];
function bossPlan(b3,b5,level,cond){return {level:level||1,zone:"",condition:cond||null,contract:null,bosses:[b3,b5]}}
function bossSim(o){o=o||{};return M.create({seed:o.seed||8,level:o.level||1,builds:o.builds,plan:o.noPlan?undefined:bossPlan(o.b3||"sniper",o.b5||"sniper",o.level,o.cond),tune:M.mergeTune(FAST,M.mergeTune({waves:BW},o.tune||{}))})}
/* step to the start of wave n (killing whatever is up) and return its queue as beginWave built it */
function queueAt(s,n){for(var t=0;t<60*90&&s.wave<n;t++){idle(s);if(s.state==="play")s.killAll();s.step()}return s.run.queue.slice()}
function firstBoss(s,f){for(var t=0;t<120;t++){idle(s);s.step();var b=s.bots.filter(f||function(x){return x.boss||x.jugg||x.kind==="wbody"});if(b.length)return b}return []}
function L1(s){return function(e){return s.hitEnemy(e,1e5,{by:0,kind:"light",pow:1},e.x,e.y,(e.z||0)+.5)}}
/* roster from the climb plan */
(function(){
  var s=bossSim({level:3,b3:"sniperPair",b5:"juggernaut"});
  ok(same(queueAt(s,3),["pair","pair"])&&same(queueAt(s,5),["juggernaut"]),"the plan's bosses fill waves 3 and 5: a Sniper pair is two pair entries, the Juggernaut one");
  s=bossSim({level:5,b3:"juggernaut",b5:"warden"});
  ok(same(queueAt(s,3),["juggernaut"])&&same(queueAt(s,5),["warden"]),"level 5: wave 3 the Juggernaut, wave 5 the Warden");
  s=bossSim({noPlan:true});ok(same(queueAt(s,3),["boss"])&&same(queueAt(s,5),["boss"]),"no plan: the Bounty sniper on both boss waves");
  s=bossSim({level:3,b3:"sniperPair",b5:"juggernaut",cond:"snipersNest"});
  ok(same(queueAt(s,3),["pair","pair","boss"])&&same(queueAt(s,5),["juggernaut","boss"]),"Sniper's nest adds a Bounty sniper to each boss wave, the pair's and the Juggernaut's");
  s=bossSim({level:5,b3:"juggernaut",b5:"warden",cond:"snipersNest"});var q=queueAt(s,5),w=firstBoss(s)[0];
  ok(same(q,["warden"])&&w&&w.kind==="wbody"&&w.riders.length===4&&s.bots.filter(function(b){return b.rider}).length===4,"Sniper's nest with the Warden: a fourth rider, on its body");
  var pl=M.Campaign.plan({seed:12345}),good=pl[0].bosses[0]==="sniper"&&pl[4].bosses[1]==="warden";
  for(var sd=1;sd<=40;sd++)M.Campaign.plan({seed:sd}).forEach(function(e){e.bosses.forEach(function(b,i){var B=M.BOSSES[b];if(!B||e.level<B.lv[0]||e.level>B.lv[1]||b==="warden"&&(i!==1||e.level!==5))good=false})});
  ok(good,"the plan draws each boss only on its levels; the Warden only on level 5 wave 5");
  var m=M.create({seed:4,level:5,plan:pl[4],tune:M.mergeTune(FAST,{waves:BW})});
  ok(queueAt(m,5)[0]==="warden","a match on the plan's level 5 entry queues the Warden on wave 5");
})();
/* wave-5 variant (GDD-D51, prototype changes section 3) */
(function(){
  var s=bossSim({});queueAt(s,3);var a=firstBoss(s)[0];
  ok(a&&a.maxHp===180&&!a.hard&&a.scrapN===12&&!a.fireEvery,"wave 3: the Bounty sniper has 180 health, fires every "+T.boss.fireEvery+" s, drops 12 cubes");
  queueAt(s,5);var b=firstBoss(s)[0];
  ok(b&&b.hard&&b.maxHp===270&&b.fireEvery===1.5&&b.scrapN===18,"wave 5: the variant has 1.5x health (270), fires every 1.5 s, drops 18 cubes");
  b.tell=.01;b.cd=0;s.step();ok(Math.abs(b.cd-1.5)<1e-9,"after a wave-5 sniper's shot its next is 1.5 s away");
  var ev=[];s.drainEvents();L1(s)(b);ev=s.drainEvents().filter(function(e){return e[0]==="x"});
  ok(ev.length===1&&ev[0][1]==="sniper"&&ev[0][4]===18,"killing it drops 18 cubes");
  s=bossSim({level:3,b3:"sniperPair",b5:"sniperPair"});queueAt(s,5);var pr=firstBoss(s,function(x){return x.pair});for(var t=0;t<60&&pr.length<2;t++){idle(s);s.step();pr=s.bots.filter(function(x){return x.pair})}
  ok(pr.length===2&&pr[0].maxHp===Math.round(180*2/3*1.5*1.3)&&pr[0].scrapN===14&&pr[0].fireEvery===1.5,"a wave-5 Sniper pair at level 3: two thirds health x1.5 x the level ("+(pr[0]&&pr[0].maxHp)+"), 14 cubes, 1.5 s");
  s=bossSim({level:3,b3:"juggernaut",b5:"juggernaut"});queueAt(s,3);var j3=firstBoss(s)[0];queueAt(s,5);var j5=firstBoss(s)[0];
  ok(j3&&j5&&j3.maxHp===Math.round(450*1.3)&&j5.maxHp===Math.round(450*1.3*1.5)&&j3.L.cooldown===2.5&&Math.abs(j5.L.cooldown-1.75)<1e-9&&j3.scrapN===20&&j5.scrapN===30,
    "the Juggernaut: 450 health x the level on wave 3; the wave-5 one x1.5, a 30% shorter charge cooldown, 30 cubes");
})();
/* Sniper pair: never within 8 m of each other, firing in turn */
(function(){
  var s=M.create({seed:8,tune:M.mergeTune(QUIET,{boss:{sight:60,jump:[2,3]},pair:{wait:1e9}})});steps(s,5);
  var p=s.players[0],pr=s.spawnBoss("pair"),a=pr[0],b=pr[1],near=99,both=0,seq=[],last=[0,0];
  for(var t=0;t<60*60;t++){p.x=23.5;p.y=17.5;idle(s);s.step();
    if(a.mode==="perch"&&b.mode==="perch"&&a.z>.05&&b.z>.05){both++;near=Math.min(near,Math.hypot(a.x-b.x,a.y-b.y))}
    pr.forEach(function(m,i){if(m.tell>0&&last[i]<=0)seq.push(i);last[i]=m.tell})}
  var alt=seq.every(function(v,i){return i===0||v!==seq[i-1]});
  ok(a.maxHp===120&&b.maxHp===120&&a.scrapN===9,"a pair sniper has two thirds of the sniper's health (120) and 9 cubes");
  ok(both>600&&near>=T.pair.apart,"over 60 s of jumping the pair never perches within "+T.pair.apart+" m of each other (closest "+near.toFixed(1)+" m)");
  ok(seq.length>=6&&alt,"they fire in turn: "+seq.length+" tells, alternating ("+seq.slice(0,10).join("")+")");
  L1(s)(a);var n0=seq.length;for(t=0;t<60*8;t++){p.x=23.5;p.y=17.5;idle(s);s.step();if(b.tell>0&&last[1]<=0)seq.push(1);last[1]=b.tell}
  ok(seq.length-n0>=2,"with its partner down, the other fires on its own cadence");
})();
/* Juggernaut: plows pillars through the normal break path, credited to nobody; a Perfect stops the charge */
(function(){
  var s=M.create({seed:8,tune:QUIET});steps(s,5);var p=s.players[0];p.x=10;p.y=12;
  dropSpan(s,[29],-1);steps(s,10);s.drainEvents();
  var j=s.spawnBoss("juggernaut",13.6,23.5);j.state="tell";j.t=.01;j.cx=1;j.cy=0;j.head=0;var ev=[];
  ok(j.maxHp===450&&j.armored&&j.noPods&&j.r===T.juggernaut.radius,"the Juggernaut: 450 health, armored like a loader, never takes pods");
  var x0=j.x,t;for(t=0;t<60*2.2;t++){idle(s);s.step();ev=ev.concat(s.drainEvents())}
  var sd=ev.filter(function(e){return e[0]==="sd"});
  ok(j.x-x0>8,"its charge runs on through the pillar ("+(j.x-x0).toFixed(1)+" m)");
  ok(s.world.get(17,23,0)===0&&s.world.get(18,24,1)===0,"it breaks the pillar's base through the normal break path");
  steps(s,200);ev=ev.concat(s.drainEvents());sd=ev.filter(function(e){return e[0]==="sd"});
  ok(sd.length>=1&&sd.every(function(e){return e[4]===-1}),"with the next pillar gone, the span comes down, credited to nobody");
  ok(sumW(s,function(w){return w.spans+w.voxels})===0,"none of it counts for the mech: no spans, no voxels");
  s=M.create({seed:8,tune:QUIET});steps(s,5);p=s.players[0];
  j=s.spawnBoss("juggernaut",p.x+6,p.y);j.state="charge";j.t=2;j.cx=-1;j.cy=0;j.hit=false;steps(s,3);
  s.hitEnemy(j,45,{by:0,kind:"heavy",grade:"Good",pow:1,w:"pile"},j.x,j.y,.8);steps(s,1);var good=j.state==="charge";
  s.hitEnemy(j,45,{by:0,kind:"heavy",grade:"Perfect",pow:1,w:"pile"},j.x,j.y,.8);steps(s,1);
  ok(good&&j.state==="recover"&&j.vx===0&&j.stag>0,"a Good doesn't stop its charge; a Perfect staggers it and ends the charge");
})();
function sumW(s,f){var n=0;(s.stats[0]||[]).forEach(function(w){if(w)n+=f(w)||0});return n}
/* the Warden (TDD-D14) */
function warden(o){o=o||{};var s=M.create({seed:o.seed||8,level:o.level||1,tune:M.mergeTune(QUIET,o.tune||{})});steps(s,5);
  var p=s.players[0];p.x=o.px||180;p.y=o.py||24;var b=s.spawnBoss("warden",o.x||200,o.y||24,o);return {s:s,b:b,p:p,legs:b.parts.filter(function(e){return e.kind==="wleg"}),plats:b.parts.filter(function(e){return e.kind==="wplat"})}}
function hit(s,e,n,by){return s.hitEnemy(e,n,{by:by===undefined?0:by,kind:"light",pow:1},e.x,e.y,(e.z||0)+.5)}
(function(){
  var W=warden(),s=W.s,b=W.b;
  ok(b.z===5&&b.maxHp===1500&&b.scrapN===60&&W.legs.length===4&&W.legs.every(function(l){return l.maxHp===300&&l.z===0})&&W.plats.length===3&&W.plats.every(function(q){return q.maxHp===150})&&b.riders.length===3&&b.riders.every(function(r){return r.maxHp===180&&r.mode==="ride"}),
    "the Warden: a body 5 m up (1,500 health, 60 cubes), four 300-health legs, three 150-health platforms each carrying a Bounty sniper");
  ok(s.bots.filter(function(e){return e.wid===b.wid}).length===11,"its parts are linked entities in the enemy list sharing one parent id");
  ok(hit(s,b,100)===50,"while any rider is up, the body takes half damage (100 -> 50)");
  ok(hit(s,W.legs[0],100)===100,"a leg takes full damage: the riders' cover doesn't reach it");
  b.riders.forEach(L1(s));steps(s,1);
  ok(hit(s,b,100)===100,"with every rider down, the body takes full damage");
  var st=s.hitEnemy(b,1,{by:0,kind:"heavy",grade:"Perfect",pow:1,w:"pile"},b.x,b.y,5.5);ok(!(b.stag>0),"a Perfect doesn't stagger it");
  ok(b.noPods&&W.legs.every(function(l){return l.noPods}),"it never takes pods");
  var sn=s.snapshot(false),rows=sn.b.filter(function(r){return r[1]>=8});
  ok(rows.filter(function(r){return r[1]===8}).length===1&&rows.filter(function(r){return r[1]===10&&r[11]===rows[0][0]}).length===4&&rows.filter(function(r){return r[1]===9}).length===3&&rows[0][11]===15,
    "the snapshot carries the body (kind 8, legs mask 15), its platforms (9) and legs (10) with the body's id");
})();
(function(){
  var W=warden({tune:{boss:{sight:0}}}),s=W.s,b=W.b,pl=W.plats[0],r=pl.carry,t;
  hit(s,pl,1e3);
  ok(pl.hp<=0&&r.mode==="fall"&&ridersUp(b),"breaking a platform drops its rider; the others still cover the body");
  for(t=0;t<120&&r.mode==="fall";t++){idle(s);s.step()}
  ok(r.mode==="perch"&&r.z===0&&r.hp===180-T.boss.fallDmg&&r.stun>1,"the rider lands in the street with the usual fall damage and stun ("+r.hp+" left)");
  ok(sumW(s,function(w){return w.evictions})===1,"the platform's breaker gets the eviction");
  steps(s,30);ok(Math.hypot(r.x-pl.x,r.y-pl.y)>=0&&s.bots.indexOf(pl)<0,"the broken platform is gone from the enemy list; the rider fights on");
})();
function ridersUp(b){return b.riders.some(function(r){return r.hp>0&&r.mode==="ride"})}
(function(){
  var W=warden({px:178,py:24,x:200}),s=W.s,b=W.b,t;b.state="fight";b.barT=1e9;
  steps(s,60);var x0=b.x;steps(s,60);var v0=(x0-b.x);
  hit(s,W.legs[0],1e3);
  ok(W.legs[0].hp<=0&&b.legsBroken===1&&Math.abs(b.stag-T.warden.leg.stagger)<.02,"breaking a leg staggers the Warden for 2 s");
  x0=b.x;steps(s,60);var still=Math.abs(b.x-x0)<1e-6;steps(s,70);x0=b.x;steps(s,60);var v1=(x0-b.x);
  ok(still&&Math.abs(v0-.8)<.02&&Math.abs(v1-.6)<.02,"it stands still while staggered, then walks 25% slower ("+v0.toFixed(2)+" -> "+v1.toFixed(2)+" m/s)");
  var ev=s.drainEvents();ok(ev.some(function(e){return e[0]==="wd"&&e[1]==="leg"}),"a leg break sends a leg event");
})();
(function(){
  var W=warden({px:150,py:10,x:200}),s=W.s,b=W.b,t;b.state="fight";
  var bot=s.spawnBot(b.x+1,b.y+1),q=s.players[0];
  W.legs.forEach(function(l){hit(s,l,1e3)});
  ok(b.down&&b.falling&&b.stag===0,"four broken legs bring the body down");
  var hp0=b.hp;for(t=0;t<120&&b.falling;t++){idle(s);s.step()}
  ok(!b.falling&&b.z===T.warden.fall.z&&hp0-b.hp===400,"it lands as a collapse and takes 400 itself ("+(hp0-b.hp)+")");
  ok(bot.hp<=0||bot.maxHp-bot.hp>=T.collapse.botDmg,"what is under it takes collapse damage");
  b.riders.forEach(L1(s));steps(s,1);ok(hit(s,b,100)===150,"once down, it takes 50% more damage (100 -> 150)");
  var x0=b.x;q.x=b.x;q.y=b.y;b.hp=b.maxHp*.3;var tell=false;for(t=0;t<180;t++){idle(s);s.step();if(b.tell>0)tell=true}
  ok(Math.abs(b.x-x0)<1e-6&&!tell,"down, it neither walks nor stomps");
})();
(function(){   /* barrage: four shells toward a mech, a 2 s warning, 20 to mechs, 40 to enemies, credited to nobody; a Bulwark's shield blocks it from the front */
  var W=warden({px:186,py:24,x:200}),s=W.s,b=W.b,q=W.p,t;b.state="idle";
  var k=s.bossAct(b,"barrage");
  ok(k&&k.pts.length===4&&Math.abs(k.t-2)<1e-9&&s.snapshot(false).wb.length===1,"a barrage puts four shell warnings on the ground for 2 s (in the snapshot)");
  var near=k.pts.filter(function(pt){return Math.hypot(pt[0]-q.x,pt[1]-q.y)<.1}).length;
  var e1=s.spawnBot(k.pts[0][0],k.pts[0][1]);e1.state="idle";e1.hp=e1.maxHp=1000;var bw=s.spawnUnit("bulwark",k.pts[1][0]+.8,k.pts[1][1],{});bw.state="idle";bw.head=Math.PI;
  var hp0=q.hp;steps(s,118);var early=q.hp===hp0;s.drainEvents();steps(s,4);var ev=s.drainEvents();
  ok(near===1&&early&&hp0-q.hp===20,"one shell lands on the mech: 20 damage after the warning, none before ("+(hp0-q.hp)+")");
  ok(e1.maxHp-e1.hp===40,"an enemy under a shell takes 40 ("+(e1.maxHp-e1.hp)+")");
  ok(bw.hp===bw.maxHp,"a Bulwark facing the shell blocks it with its shield");
  var bw2=s.spawnUnit("bulwark",190,30,{});bw2.state="idle";bw2.head=Math.PI;k=s.bossAct(b,"barrage");k.pts=[[191.5,30],[1,1],[1,1],[1,1]];steps(s,125);
  ok(bw2.maxHp-bw2.hp===40,"from behind, the shell hits the Bulwark");
  ok(ev.filter(function(e){return e[0]==="wd"&&e[1]==="shell"}).length===4&&!ev.some(function(e){return e[0]==="x"&&e[2]!==-1}),"the shells credit nobody");
  var vs=0,vx=0;for(var y=21;y<26;y++)for(var x=174;x<177;x++)for(var z=0;z<2;z++)if(s.world.get(x,y,z))vs++;
  k=s.bossAct(b,"barrage");k.pts=[[175.5,23.5],[1,1],[1,1],[1,1]];steps(s,125);
  for(y=21;y<26;y++)for(x=174;x<177;x++)for(z=0;z<2;z++)if(s.world.get(x,y,z))vx++;
  ok(vx<vs,"a shell knocks a hole in what it lands on ("+vs+" -> "+vx+" voxels)");
  var Wb=warden({}),bb=Wb.b;bb.barT=.01;Wb.s.step();ok(Wb.s.wshells.length===1&&Math.abs(bb.barT-8)<.02,"its barrage runs every 8 s on its own timer");
})();
(function(){   /* below 50%: a Scuttler pack from its belly every 15 s */
  var W=warden({px:150,py:10}),s=W.s,b=W.b,t,packs=[];b.state="idle";b.barT=1e9;
  function run(n){for(var t=0;t<n;t++){idle(s);s.step();s.drainEvents().forEach(function(e){if(e[0]==="wd"&&e[1]==="pack")packs.push(s.tick)})}}
  b.state="fight";run(60*16);var above=packs.length;
  b.hp=Math.floor(b.maxHp*.49);packs=[];run(60*15.5);
  var sc=s.bots.filter(function(e){return e.kind==="scuttler"});
  ok(above===0&&packs.length===2&&Math.abs(packs[1]-packs[0]-900)<=1,"below 50% it drops a Scuttler pack at once and every 15 s ("+packs.length+" packs)");
  ok(sc.length>=4,"each pack is four Scuttlers out of its belly ("+sc.length+" up)");
})();
(function(){   /* stomp below 50%: a 0.8 s tell, then 25 within 3 m */
  var W=warden({x:190}),s=W.s,b=W.b,q=W.p,t,ev=[];b.state="fight";b.barT=1e9;
  q.x=b.x+1;q.y=b.y;steps(s,60);var noTell=!(b.tell>0);
  b.hp=Math.floor(b.maxHp*.4);b.packT=1e9;var hp0=q.hp,told=-1,hitAt=-1;
  for(t=0;t<120;t++){q.x=b.x+1;q.y=b.y;q.vx=q.vy=0;idle(s);s.step();if(told<0&&b.tell>0)told=t;if(hitAt<0&&q.hp<hp0)hitAt=t;ev=ev.concat(s.drainEvents())}
  ok(noTell&&told>=0&&hitAt-told>=47&&hitAt-told<=49&&hp0-q.hp===25,"below 50% it stomps a mech under it: a 0.8 s tell ("+((hitAt-told)/60).toFixed(2)+" s), then 25");
  ok(ev.some(function(e){return e[0]==="wd"&&e[1]==="tell"})&&ev.some(function(e){return e[0]==="wd"&&e[1]==="stomp"}),"the tell and the stomp send events");
  q.x=b.x+5;hp0=q.hp;var t2=false;for(t=0;t<120;t++){q.x=b.x+5;q.y=b.y;idle(s);s.step();if(b.tell>0)t2=true}
  ok(!t2&&q.hp===hp0,"a mech more than 3 m from its centre isn't stomped");
})();
(function(){   /* the body's death takes every linked part */
  var W=warden({tune:{boss:{sight:0}}}),s=W.s,b=W.b,pl=W.plats[1],r=pl.carry,t;
  hit(s,pl,1e3);for(t=0;t<120&&r.mode==="fall";t++){idle(s);s.step()}
  s.drainEvents();hit(s,b,1e5);steps(s,1);var ev=s.drainEvents(),x=ev.filter(function(e){return e[0]==="x"});
  ok(W.legs.concat(W.plats).every(function(e){return e.hp<=0})&&b.riders.every(function(q){return q===r||q.hp<=0})&&s.bots.filter(function(e){return e.wid===b.wid&&e.hp>0}).length===(r.hp>0?1:0),
    "when the body dies, every leg, platform and riding sniper goes with it");
  ok(r.hp>0,"a rider already knocked to the street fights on");
  ok(x.length===1&&x[0][1]==="warden"&&x[0][2]===0&&x[0][4]===60,"one kill: the Warden, credited to the mech, 60 cubes");
})();
/* a scripted level 5 wave 5, ending both ways */
function wave5(how){
  var s=M.create({seed:21,level:5,plan:bossPlan("juggernaut","warden",5),tune:M.mergeTune(FAST,{waves:[{bots:0},{bots:0},{bots:0},{bots:0},{bots:0,boss:1}]})}),b=null,o=null,t,ev=[];
  for(t=0;t<60*60&&!b;t++){idle(s);s.step();b=s.bots.filter(function(e){return e.kind==="wbody"})[0]}
  var walked=0,x0=b?b.x:0;steps(s,120);walked=b?x0-b.x:0;
  for(t=0;t<60*60&&!o;t++){
    if(b.hp>0){if(how==="legs"&&b.legsBroken<4){var l=b.parts.filter(function(e){return e.kind==="wleg"&&e.hp>0})[0];if(l)hit(s,l,120)}
      else if(!b.falling)hit(s,b,150)}
    else if(s.state==="play")s.killAll();   /* the belly pack it left behind */
    key(s,s.state==="choose"?128:0);s.step();s.drainEvents().forEach(function(e){ev.push(e);if(e[0]==="o")o=e})}
  return {s:s,b:b,o:o,ev:ev,walked:walked,x0:x0};
}
(function(){
  var a=wave5("body"),c=wave5("legs");
  ok(a.b&&a.x0===M.MAP.zones[4].x1-T.warden.walkIn.from&&a.walked>1,"level 5 wave 5: the Warden walks in from the far end of the Terminus Yard (x "+a.x0+", "+a.walked.toFixed(1)+" m in 2 s)");
  ok(a.o&&a.o[1]==="victory"&&a.ev.some(function(e){return e[0]==="x"&&e[1]==="warden"&&e[2]===0})&&a.ev.some(function(e){return e[0]==="ch"&&e[1]==="prompt"}),"killing the body clears wave 5; extracting wins the climb");
  ok(c.o&&c.o[1]==="victory"&&c.b.down&&c.b.legsBroken===4&&c.ev.some(function(e){return e[0]==="wd"&&e[1]==="down"})&&c.ev.some(function(e){return e[0]==="x"&&e[1]==="warden"}),"breaking all four legs, then killing it, also clears wave 5 and wins");
})();

console.log(bad?bad+" rule check(s) failed":"rules pass");
process.exit(bad?1:0);
