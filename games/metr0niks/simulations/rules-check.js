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
  ok(all===1005,"upgrading all nine weapons to Mk III costs 1,005 ("+all+")");
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

console.log(bad?bad+" rule check(s) failed":"rules pass");
process.exit(bad?1:0);
