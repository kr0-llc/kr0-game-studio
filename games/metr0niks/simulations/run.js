/* Metr0niks headless runner (TDD-D17, implementation plan phase 0). Plays whole excursions in Node with scripted
   players (pilot.js), writes one metrics record per run, and replays one run per batch to check determinism.

   node games/metr0niks/simulations/run.js [options]
     --runs N        excursions to play (default 20); run k uses seed = --seed + k, so batches share paired seeds
     --seed S        first seed (default 1)
     --level L       campaign level to play (default 1)
     --climb         play a climb instead: level 1 up, the next level after each extract, until a death or --to
     --to L          last level of a climb (default 5)
     --players 1|2   single-player or co-op with two pilots (default 1)
     --accuracy A    perfect | mix | random | none: how the pilots release the timing ring (default mix)
     --tune FILE     a JSON file with a partial T merged over MetroSim.T for these runs (create({tune}))
     --max S         stop a match after S simulated seconds and record it as "timeout" (default 900)
     --out FILE      write the records as JSON lines (default: none; tuning runs go in games/metr0niks/tuning-runs/)
     --no-replay     skip the replay check

   Each record: {seed, level, players, accuracy, tuneHash, result, wave, ticks, seconds, kills, scrap:[per mech],
   armor:[per mech at the end], hash}. A climb adds {climb:true, reached, levels:[records]}. The replay check
   re-runs the batch's first match from its recorded inputs and compares the state hash every 10 s and at the end;
   any mismatch exits with code 1. The GDD-D50 match stats join the record when phase 1 adds them. */
"use strict";
var fs=require("fs"),path=require("path");
require("./sim.js");require("./pilot.js");
var M=globalThis.MetroSim,P=globalThis.MetroPilot;

function args(argv){
  var o={runs:20,seed:1,level:1,climb:false,to:5,players:1,accuracy:"mix",tune:null,max:900,out:null,replay:true};
  for(var i=2;i<argv.length;i++){var a=argv[i],v=argv[i+1];
    if(a==="--runs"){o.runs=+v;i++}else if(a==="--seed"){o.seed=+v;i++}else if(a==="--level"){o.level=+v;i++}
    else if(a==="--climb")o.climb=true;else if(a==="--to"){o.to=+v;i++}else if(a==="--players"){o.players=+v;i++}
    else if(a==="--accuracy"){o.accuracy=v;i++}else if(a==="--tune"){o.tune=JSON.parse(fs.readFileSync(v,"utf8"));i++}
    else if(a==="--max"){o.max=+v;i++}else if(a==="--out"){o.out=v;i++}else if(a==="--no-replay")o.replay=false;
    else{console.error("unknown option "+a);process.exit(2)}}
  return o;
}

/* One excursion. log: an array to record every tick's inputs into, or recorded inputs to replay (replay=true). */
function match(o,seed,level,log,replay,checks){
  var builds=[];for(var i=0;i<o.players;i++)builds.push(M.STARTER);
  var sim=M.create({seed:seed,level:level,builds:builds,tune:o.tune||undefined});
  var pilots=builds.map(function(_,k){return P.make({seed:seed*7+k+1,accuracy:o.accuracy})});
  var over=null,maxT=Math.round(o.max*60);
  while(!over&&sim.tick<maxT){
    for(var k=0;k<builds.length;k++){
      var inp=replay?log[sim.tick][k]:pilots[k](sim,k);
      if(log&&!replay){(log[sim.tick]=log[sim.tick]||[])[k]=JSON.parse(JSON.stringify(inp))}
      sim.setInput(k,replay?JSON.parse(JSON.stringify(inp)):inp);
    }
    sim.step();
    if(checks&&sim.tick%600===0)checks.push(sim.stateHash());
    sim.drainEvents().forEach(function(e){if(e[0]==="o")over=e});
  }
  if(checks)checks.push(sim.stateHash());
  return {seed:seed,level:level,players:o.players,accuracy:o.accuracy,tuneHash:sim.tuneHash(),
    result:over?over[1]:"timeout",wave:sim.wave,ticks:sim.tick,seconds:Math.round(sim.tick/6)/10,kills:sim.kills,
    scrap:over&&over[4]&&over[4].scrap?over[4].scrap:sim.players.map(function(q){return over&&over[1]==="dead"?0:q.scrap}),
    armor:sim.players.map(function(q){return Math.max(0,Math.round(q.hp))}),hash:sim.stateHash()};
}

function climb(o,seed){
  var levels=[],lv=1,r;
  do{r=match(o,seed*31+lv,lv);levels.push(r);lv++}while(r.result==="extracted"&&lv<=o.to);
  var last=levels[levels.length-1];
  return {seed:seed,climb:true,players:o.players,accuracy:o.accuracy,tuneHash:last.tuneHash,
    result:last.result==="extracted"?"victory":last.result,reached:last.level,
    scrap:levels.reduce(function(a,x){return x.result==="extracted"||x.result==="victory"?a.map(function(v,i){return v+(x.scrap[i]|0)}):a},levels[0].scrap.map(function(){return 0})),
    levels:levels};
}

function main(){
  var o=args(process.argv),recs=[],t0=Date.now();
  for(var k=0;k<o.runs;k++)recs.push(o.climb?climb(o,o.seed+k):match(o,o.seed+k,o.level));
  var ms=Date.now()-t0;
  if(o.out){fs.mkdirSync(path.dirname(o.out),{recursive:true});fs.writeFileSync(o.out,recs.map(function(r){return JSON.stringify(r)}).join("\n")+"\n")}
  /* summary */
  var n=recs.length,cnt=function(f){return recs.filter(f).length},mean=function(f){return n?Math.round(recs.reduce(function(a,r){return a+f(r)},0)/n*10)/10:0};
  console.log("runs "+n+" in "+(ms/1000).toFixed(1)+" s · "+(o.climb?"climbs to level "+o.to:"level "+o.level)+" · "+o.players+" player(s) · accuracy "+o.accuracy+" · tuning "+(recs[0]&&recs[0].tuneHash));
  if(o.climb){
    console.log("victories "+cnt(function(r){return r.result==="victory"})+" · mean level reached "+mean(function(r){return r.reached})+" · mean banked scrap "+mean(function(r){return r.scrap.reduce(function(a,b){return a+b},0)}));
    var by={};recs.forEach(function(r){by[r.reached]=(by[r.reached]||0)+1});console.log("level reached: "+JSON.stringify(by));
  } else {
    console.log("extracted "+cnt(function(r){return r.result==="extracted"||r.result==="victory"})+" · dead "+cnt(function(r){return r.result==="dead"})+" · timeout "+cnt(function(r){return r.result==="timeout"}));
    console.log("mean seconds "+mean(function(r){return r.seconds})+" · mean kills "+mean(function(r){return r.kills})+" · mean scrap "+mean(function(r){return r.scrap.reduce(function(a,b){return a+b},0)}));
    var dw={};recs.forEach(function(r){if(r.result==="dead")dw[r.wave]=(dw[r.wave]||0)+1});console.log("deaths by wave: "+JSON.stringify(dw));
  }
  if(o.replay&&n){
    var lv=o.climb?1:o.level,sd=o.climb?(o.seed*31+1):o.seed,log=[],a=[],b=[];
    var r1=match(o,sd,lv,log,false,a),r2=match(o,sd,lv,log,true,b);
    var same=a.length===b.length&&a.every(function(h,i){return h===b[i]})&&r1.hash===r2.hash;
    console.log((same?"replay ok   ":"REPLAY FAIL ")+"seed "+sd+", "+a.length+" hashes, final "+r1.hash+" / "+r2.hash);
    if(!same)process.exit(1);
  }
}
if(require.main===module)main();
module.exports={match:match,climb:climb};
