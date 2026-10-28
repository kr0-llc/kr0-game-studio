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
  ok(r.level===1&&r.seed===500,"a typed seed is kept on restart");
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

console.log(bad?bad+" rule check(s) failed":"rules pass");
process.exit(bad?1:0);
