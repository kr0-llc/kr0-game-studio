/* Metr0niks headless simulation. Runs the game in the browser (single player and the co-op host, loaded with a
   classic <script src="../simulations/sim.js">) and in Node (`import './simulations/sim.js'`, then globalThis.MetroSim). No DOM, no timers,
   no browser globals: time comes in as fixed ticks, and everything a renderer needs that is not state is an event.

   MetroSim.create({seed, builds:[build,...], level?, wear?, upgrades?, plan?, colorOf?, clock?}) -> sim
     level    campaign level 1..T.level.max (default 1); enemy counts, hp, damage and scrap scale with it (T.level), sim.level
     builds   one garage build per mech ({core,armR,armL,shoulder,legs,reactor}, null = empty); builds[1] is the co-op partner
     wear     per mech {partId: 0..1} (GDD-D18): worn parts give less of their helpful stats (deriveStats). Every mech starts at full armor
     upgrades per mech {weaponPartId: 0..2} (GDD-D23): player.upg; player.upMul(partId) = 1 + T.upgrade.dmg x level, read by the hit path
     plan     this level's climb plan entry {level,zone,condition,contract,bosses:[wave3,wave5]} (Campaign.plan), kept as sim.plan
     colorOf  optional (materialId, structure) -> [r,g,b]; lets a renderer theme debris and falling pieces
     clock    optional () -> ms, only used to time support checks (sim.chk); default is a function returning 0
   sim.T                tunables (shared object, MetroSim.T)
   sim.world            {vox,owner,vdmg (typed arrays), W,D,H, structures, chunks, walk, rev (bumps when voxels change),
                         get(x,y,z), solidAt(x,y,z), blockedCell(cx,cy), rebuildWalk()}
   sim.players, bots, shots, pods, scraps, clusters, debris, pools   live arrays (mutated in place, never replaced)
   sim.run {wave,queue,breather,done,...}   sim.wave (number; 6 = Overtime)   sim.state 'play'|'choose'|'overtime'|'dead'|'extracted'|'victory'
   sim.tick             completed steps   sim.scrap (shared run total, for the HUD), sim.kills, sim.shake (0..1, decays)
                        each mech also has player.scrap: the cubes it picked up (the wallet that banks at extraction)
                        and player.taken: armor lost this match, counted when taken even if healed later (wear on extract)
   sim.state            'drop' (until sim.tick >= sim.introTicks: no spawns, no pods; set introTicks right after create(), default 0),
                        then 'play', then 'choose' (wave 5 cleared: T.overtime.choose s to pick Extract or Overtime, GDD-D37),
                        'overtime' (the sixth wave), then 'dead' | 'extracted' | 'victory' (extracting level T.level.max)
   sim.setInput(i, {k,ax,ay,az,l,r,rp,seq})   k bitmask W=1 A=2 S=4 D=8 Space=16 Q=32 F=64 (call Overtime) Enter/R=128 (extract now;
                        F and Enter/R are read from mech 0 only: the host chooses in co-op, TDD-D15); ax,ay,az world aim point;
                        l / r held buttons (left arm gun / ATB arm); rp true = right button pressed since the last tick;
                        seq (network inputs only): such an input is released after T.net.inputStale s of silence
   sim.step()           one fixed 1/60 s tick
   sim.drainEvents()    returns and clears the events array. Events are arrays:
                        ["t",text,css|null,only]  toast (only = mech index, -1 = everyone)
                        ["f",x,y,z,text,css]      floating number    ["s",x,y,z,n,[r,g,b]] sparks   ["m",x,y,z,n,[r,g,b]] smoke
                        ["k",amount]              screen shake       ["p",x,y] drop pod landed
                        ["c",id,voxelIdx[],packedColours[]]  falling cluster created
                        ["o","dead"|"extracted"|"victory",message,scrapBanked,detail]  run over; detail = {result,level,scrap:[per mech],damage:[per mech],stats,
                          records,contract,condition,overtime:{called,cleared},revives}
                        (extracted and victory: scrap to bank, damage taken for wear; dead: detail {result,level}, nothing carries on)
                        ["cb",mech,combo,broken]  combo changed (GDD-D35)   ["sg",x,y,z] an enemy was staggered
                        ["mk",mech,count]         multi-kill (GDD-D53)      ["x",type,mech|-1,sourceKind,cubes] an enemy died (kill credit, GDD-D48)
                        ["w",wave,[stats per mech]]  wave cleared, with that wave's GDD-D50 stats
                        ["cr",id,kills,x,y,mech|-1,"collapse"|"slag"]  CRUSHED: the kills of one landed piece or one slag pool (phase 5)
                        ["sd",clusterId,x,y,mech|-1]  a deck span landed (SPAN DOWN)   ["sp",poolId,x,y,mech|-1]  a slag vat spilled
                        ["ct",id,progress,goal,state,reward]  contract progress (GDD-D38); state 0 running, 1 done, -1 failed;
                                                  reward = scrap each living mech got on completion
                        ["ch","prompt",seconds] | ["ch","overtime"] | ["ch","extract"]  the choose prompt after wave 5 (GDD-D37)
                        ["rv",mech,payer,price]   a downed mech was revived at a wave's end (GDD-D24)
                        ["z",zoneIndex,name]      a sealed zone's gate fell: the map grew (also sent to guests)
                        ["sb",x,y]                a Perfect broke a Bulwark's shield (phase 4)
   sim.snapshot(full)   co-op host snapshot {t:"snap",tk,ack,sc,k,sh,w,p,b,s,sr,pd,cl,sl,vx,ev,st,ch,ct}; sl = slag pools [id,x0,y0,x1,y1,z,secondsLeft];
                        st = sim.state, ch = [prompt seconds left, Overtime called 0|1], ct = [contract progress, goal, state] (no contract: absent).
                        Bot rows [id,kind,x,y,z,head,aim,hp,flags,...]: kind 0 bot, 1 loader, 2 boss,
                        3 Scuttler, 4 Bulwark, 5 Wrecker, 6 Wrecker charge (kinds 3+ add one timer: flash, plant, fuse, broken shield);
                        flags 1 dropping, 2 hit flash, 4 tell, 8 charge, 16 jump, 32 slowed, 64 staggered, 128 Elite,
                        256 Scuttler flash / Wrecker plant / Bulwark bash, 512 Bulwark shield broken. full=true also
                        clears queued events and resets the diff baseline
   sim.voxelDiffSince(tick)   flat [index,material,owner,...] for voxels changed after `tick`
   sim.applyBuild(i, build, wear?, upg?)   re-derive mech i from a build (adds the mech when i === players.length)
   sim.dropPlayer(i)    mech i leaves (hp 0); the run is lost if nobody else is alive
   sim.hitEnemy(e,base,src,x,y,z) / sim.hitMech(q,base,src,x,y,z)  the hit path (GDD-D48 damage order, kill credit); see hitEnemy
   sim.stats            [mech][wave] match stats (GDD-D50): kills by type and source, damage dealt and taken, voxels, grades,
                        best combo, spans, props brought down, most kills from one collapse or pool, multi-kills, pods, scrap by source, overheats, wave time
   sim.level            the level this sim was created for (opts.level, default 1)
   sim.plan             opts.plan or null: this level's sector condition, contract and bosses. Its condition's tuning override
                        (condTune) is merged over the run's T after opts.tune; its contract is tracked as sim.contract
   sim.cond             {id, night, light}: the sector condition and the view's flags (Blackout: night, lit within `light` m)
   sim.contract         null or {id, name, progress, goal, state (0 running, 1 done, -1 failed), reward}
   run.overtime         true once Overtime is called; run.choose: seconds left on the prompt; run.clock: seconds since wave 1 began;
                        run.asWave: the wave whose make-up this one uses (Overtime: T.overtime.wave), for the zone threats table
   sim.introTicks       set by create(): ticks of drop-in cinematic before anything may spawn, 0 unless a zone opens this level
   sim.zone             {open, opening, target, openAt, intro}: zones MAP.zones[0..open-1] are open; `opening` is the zone
                        whose gate falls at tick openAt (-1 once it has), `target` that same zone for the whole intro
   Phase 6 (blueprint parts, pods, call-ins; GDD-D36, D42, D43, D54):
     opts.callins         [[type|null, type|null] per mech]: the two call-in slots carried in (types: keys of T.callin.price)
     input k bits         Q=32 (Breach: tap throws, hold sets off), 1=256 and 2=512 call the pod in slot 1 / 2 at the aim point
     sim.callins          live slots per mech; sim.setCallins(i,[a,b]); sim.breaches (placed Breach charges); sim.strikes (Strike
                          beacon lines waiting to land: {by, t, x, y, pts|null}); run-over detail.callins = [{used:[types], left:[a,b]}]
                          per mech (left is [null,null] on a death); stats per wave add redline (seconds) and callins (used)
     events               ["ar",mech,[x,y,z,...]] Arc bolt path   ["rl",mech,1|0,lockoutS] Redline start / end   ["sm",mech,x,y,r,perfect]
                          Seismic slam   ["bx",mech,x,y,z] Breach charge blast   ["sk",mech|-1,x,y,z] Strike shell landed
                          ["ci",mech,slot,type,x,y] call-in
     snapshot             pd type = MetroSim.POD_TYPES index; bot flag 1024 = carries a Scrap cache; player row adds red, dashN;
                          bc [[id,mech,x,y,z]] charges; sk [[id,mech,t,x,y,(px,py)*]] strike lines
     statics              MetroSim.POD_TYPES, POD_NAME, unlockLevel(partId), callinPrice(type, level[, T])
   Phase 7 (bosses; GDD climb plan, TDD-D14):
     opts.plan.bosses     [wave3, wave5] boss ids (BOSSES): sniper, sniperPair, juggernaut, warden; no plan = the Bounty sniper.
                          Wave 5's boss is the hard variant (T.boss.hard). Sniper's nest (T.match.extraSnipers) adds a Bounty
                          sniper; with the Warden it rides the body as a fourth rider
     tuning               T.boss.hard, T.pair, T.juggernaut, T.warden
     events               ["wd",what,x,y,z]  Warden: what = "walk", "tell" (stomp tell), "barrage" (warning line up), "shell" (landed),
                          "pack" (belly pack), "stomp", "platform" / "leg" (part broken), "rider" (rider dropped), "down", "dead"
     snapshot             bot kinds 7 Juggernaut, 8 Warden body, 9 Warden platform, 10 Warden leg; rows of kinds 7..10 add after
                          the timer: max health, then body [legs mask (bit = slot standing), riders up, stomp tell s],
                          platform and leg [body id, slot]. Flags 2048 wave-5 variant, 4096 Sniper pair, 8192 Warden rider,
                          16384 Warden down; 4 on the body = stomp tell. s.wb = [[id, seconds left, x, y, ...]] barrage warnings
     debug hooks          spawnBoss(kind,x,y,o) ("warden"|"juggernaut"|"pair"|else a Bounty sniper; o {hard,riders,drop}), bossAct(body,"barrage"|"pack"|"stomp"|"tell"),
                          wshells (live barrage lines), bossFor(wave)
   sim.markOpen(k)      bookkeeping only (a guest applying the ["z",k,name] event): zone k counts as open
   Debug hooks (tests): killAll(), damage(e,dmg,x,y,z), hitVoxel(x,y,z,dmg), setVox(x,y,z,m), spawnPod(type,x,y,counting),
                        spawnUnit(kind,x,y,{drop,chunk,fuse}), zoneSlots(queue,wave), pickWreck(wrecker) (phase 4),
                        spawnLoader(x,y), perches(), los3(...), collide(e), flowField(), chk, dbg(), stepDebris(dt), debrisPiece(...)
   sim.stateHash()      hash of the rules state (players, enemies, pods, voxels, rng) for replay checks
   sim.tuneHash()       hash of this run's tuning; MetroSim.tuneHash(T) for any table
   create({tune})       a partial T merged over a copy of MetroSim.T for this run only (sector conditions, sweeps)
   Statics: MetroSim.PARTS, PART, SLOTS, STARTER, MAP, MAT, WINDOW, T, hash, W, D, H, deriveStats(build[,T[,wear]]), moveMech(mech,input,T,dt,pred),
            clusterGeom(idx,cols), cleanBuild(build), cloneBuild(build), statsOf(build[,wear]), isWeapon(partId),
            CONTRACTS, CONDITIONS, BOSSES (climb plan tables, ids and names), Campaign (save state and climb plan, see below) */
(function(root){
"use strict";

var T={
  player:{armor:100,speed:4.4,accel:26,friction:9,legTurn:7,torsoTurn:11,radius:.42,height:1.6,
          dashSpeed:12,dashTime:.15,dashCooldown:1.3,dashHeat:10},
  minigun:{rate:11,dmg:4,speed:28,spread:.045,heat:3.2,life:.7},
  shotgun:{pellets:6,every:.55,dmg:5,speed:26,spread:.42,heat:16,life:.32},   /* arm-R alternative: wide close blast */
  buster:{dmg:70,speed:13,life:1.6,voxDmg:44,recoil:2,torso:.75},          /* arm-L alternative: the ATB shot is a slow shell */
  treads:{turn:.5},
  plasma:{rate:14,dmg:3.2,speed:22,spread:.03,heat:4.4,life:.22,struct:4},   /* arm-R: short torch; ignores loader armor, melts voxels */
  rail:{every:1.1,dmg:34,speed:70,spread:0,heat:24,life:.45,pen:3},        /* arm-R: one slug that passes through bots and soft walls */
  winch:{reach:8,perfect:10,dmg:20,pull:15,stop:1.1,pillar:70},              /* arm-L ATB: cable; pulls bots in, pulls you to walls and heavy loaders, Perfect yanks pillars */
  mortar:{every:7,shells:2,minR:4,maxR:14,flight:1.1,dmg:30,radius:1.7,voxDmg:40,heat:18,spread:.8},   /* shoulder, Q: arcing shells */
  vent:{every:10,radius:4,dmg:8,slow:3,slowMul:.4},                         /* shoulder, Q: dumps all heat as a freezing blast */
  magnet:{range:7},
  strider:{dash:.55,dashHeat:.5},
  nanite:{delay:3,regen:2},
  garage:{statMax:200,weightDrag:.004,cool:.015,spin:.5},   /* stat bar scale; weight slows by 1/(1+drag*(weight-100)); cooling per heat point below 100; turntable rad/s */
  heat:{drain:20,lockout:3},
  atb:{fill:6},                                   /* seconds for a heavy-weapon bar to fill */
  ring:{duration:1,start:72,target:30,perfect:.05,good:.18},   /* px; windows are shares of the start radius */
  pile:{dmg:45,heat:28,reach:1.4,cone:.55,mult:{Perfect:2,Good:1,Miss:.5},retract:1.5,retractTurn:.5,
        knock:{Perfect:3,Good:1,Miss:0},voxDmg:30,launchDmg:26,ext:.12},
  bot:{hp:60,speed:2.4,radius:.45,height:1.05,sight:10,range:6.5,fireEvery:1.25,shotSpeed:8.5,shotDmg:7,
       turretTurn:4,scrap:[3,5],dropHeight:9},
  waves:[{bots:3},{bots:4,loaders:1},{bots:4,boss:1},{bots:6,loaders:2},{bots:5,loaders:1,boss:1}],   /* one entry per wave */
  wave:{stagger:.8,breather:3,exit:1.4,perchMin:8},
  loader:{hp:160,speed:1.3,radius:.6,height:1.3,sight:10,patrol:.7,engage:2.2,tell:.5,charge:1,chargeSpeed:5,dmg:22,shove:1.5,
          recover:.8,cooldown:1.5,voxDmg:40,minigunMult:.5,scrap:[8,10]},   /* voxDmg goes through T.structural; minigunMult: armored */
  boss:{hp:180,radius:.4,height:1,dmg:18,fireEvery:2.2,tell:.6,shotSpeed:9,sight:15,jump:[6,9],jumpRange:10,jumpTime:.9,jumpArc:2.2,
        fallDmg:60,fallMin:1.5,stun:2,scrap:12},
  pods:{perWave:1,extra:.4,window:[1.5,6],minDist:4,countdown:3,dropHeight:9,fall:30,touch:.7,heal:.4,
        overclock:{mult:2,time:15},fire:2,        /* window: seconds into the wave; fire: bot fire-rate multiplier while overclocked */
        odds:{repair:.5,overclock:.2,cache:.15,strike:.15}},   /* GDD-D43: pod type odds, drawn in this order (they need not sum to 1) */
  combo:{max:4,step:.1,decay:12,atbAt4:.25},   /* GDD-D35: x1..x4; each step above x1 adds 10% scrap to credited kills; drops after 12 s without a heavy shot; ATB fills 25% faster at x4 */
  stagger:{time:1,taken:.5},                   /* GDD-D35: a Perfect staggers for 1 s; a staggered enemy takes 50% more damage */
  credit:{window:3},multiKill:{window:1.5},demolition:.15,   /* GDD-D48 kill credit window (s); GDD-D53 multi-kill window (s); GDD-D41/D55 collapse and hazard scrap bonus */
  /* ----- phase 5: city hazards (GDD-D41) ----- */
  slag:{size:4,time:8,botDps:25,mechDps:10,heat:15,skids:.5,pulse:.2},   /* a landed vat's pool: m square, s; per second to enemies (x the level's hp scale), to mechs, heat to mechs; Grav-skids share; damage tick (s) */
  hazard:{wholeBox:1},   /* 1: a container is one box, so breaking any chunk of it destroys all of it and drops what it carries */
  level:{count:.25,hp:.15,dmg:.15,scrap:.1,max:5},   /* per level above 1: share added to enemy counts, hp, damage, scrap drops; extracting level max wins (GDD-D47) */
  durability:{share:.1,repair:{common:.25,rare:.5,epic:.75}},   /* GDD-D18: wear per extract = share x damage taken / max armor; repair = ceil(price x wear x rate) */
  upgrade:{dmg:.1,price:{common:[20,40],rare:[35,70],epic:[60,120]}},   /* GDD-D23: damage to enemies x (1 + dmg x level); price[rarity][level] buys the next Mk */
  /* ===== phase 4: zone enemies (GDD-D40) ===== */
  zoneThreats:[   /* once MAP.zones[zone] is open, its enemy takes wave slots: `n` slots of kind `take` per listed wave at level 1
                     (scaled and rounded like the count they replace) become `give` entries of `enemy` (also scaled, at least 1).
                     A "pack" entry lands T.scuttler.pack Scuttlers together. elite: one bot or loader slot in each wave becomes
                     an Elite instead. waves: wave numbers, null = every wave (Overtime included) */
    {zone:1,enemy:"pack",take:"bot",n:2,give:1,waves:[2,4,5]},
    {zone:2,enemy:"bulwark",take:"loader",n:1,give:1,waves:[4,5]},
    {zone:3,enemy:"wrecker",take:"bot",n:1,give:1,waves:[2,4]},
    {zone:4,elite:true,waves:null}],
  dropOrder:{boss:0,loader:1,"elite-loader":1,bulwark:1,wrecker:2,bot:3,"elite-bot":3,pack:4},   /* GDD Wave pacing: lower drops first */
  scuttler:{hp:18,speed:5,radius:.3,height:.55,sight:12,pack:4,spread:1.2,trigger:1.2,flash:.4,blast:1.5,dmg:10,hole:1e3,scrap:[1,1]},   /* hole: voxel damage of the blast's one-voxel chip */
  bulwark:{hp:220,speed:1.6,radius:.6,height:1.4,sight:10,turn:1.2,arc:60,bash:3,bashDmg:15,shove:2,bashEvery:2,broken:5,patrol:.7,scrap:[10,12]},   /* arc: degrees either side of its facing the shield covers; broken: s */
  wrecker:{hp:90,speed:2.8,radius:.4,height:1.1,sight:8,keep:8,plant:2.5,retarget:1,scrap:[6,8]},   /* keep: m from every mech, for itself and its target chunk */
  charge:{hp:20,fuse:4,dropFuse:2,radius:.25,height:.35,reach:3.5},   /* a Wrecker charge; reach: how far from its chunk's centre it still breaks it */
  elite:{hp:2,dmg:1.25,scrap:1.5,pods:["repair","overclock"]},   /* health and damage multipliers, kill scrap multiplier, the pod it drops */
  /* ----- phase 6: blueprint parts, pods and call-ins (GDD-D36, D42, D43, D54) ----- */
  arc:{every:.4,dmg:9,range:12,heat:6,jumps:2,jumpR:4,jumpDmg:6,loaderMult:.5},   /* Arc caster (Arm-R): hitscan bolt that chains nearest-first; no voxel damage */
  redline:{time:5,cap:130,armor:.5,lockout:3,per10:1,every:14},   /* Redline vent (Q): seconds, heat cap, armor per net heat point above 100, lockout s + s per 10 heat above 100, recharge after it ends */
  seismic:{dmg:50,radius:3,perfect:4,topple:4,shake:10},   /* Seismic hammer (Arm-L ATB): slam radius (Perfect radius); a Perfect topples stacks within topple m and shakes a perched sniper within shake m */
  breach:{range:10,held:2,recharge:8,dmg:40,radius:2,heat:8,every:8,hold:.35},   /* Breach charges (Q): tap throws (or, with none in hand, sets off); holding Q `hold` s sets off every placed charge; each back `recharge` s after its throw */
  overdrive:{below:.35,power:30,drain:.5},   /* Overdrive core: below 35% armor, power +30 and heat drain +50% */
  skids:{dashes:2,recharge:1.6,dashHeat:8,grip:.5,slag:.5,shove:1.5},   /* Grav-skids: dash charges, s per charge, heat per dash, friction share (wider slides), slag damage and heat share (hazards read p.skids), loader shove multiplier */
  cache:{cubes:8,burst:2},   /* Scrap cache pod: cubes x the level's scrap scale, within burst m of the taker */
  strike:{delay:1.5,enemyDelay:2,at:[3,6,9,12],dmg:40,radius:2,voxDmg:40,mechDmg:20},   /* Strike beacon pod: shells land at `at` m along the line; dmg x the level's hp scale to enemies; mechDmg when an enemy took it */
  callin:{range:14,slots:2,price:{repair:40,overclock:30,strike:50}},   /* GDD-D54: called at the aim point up to range m; garage price x (1 + T.level.scrap x (level - 1)), rounded */
  scrapMagnet:3,
  debrisCap:300,
  structural:.5,      /* share of bullet damage that goes into voxels (minigun: low structural damage) */
  collapse:{warn:.9,gravity:22,botDmg:80,playerDmg:40,rubbleKeep:.38,scrap:[2,4]},
  chunk:{size:4,breakAt:.8,pillarBreakAt:.8},   /* a chunk breaks when its voxels fall below this share of its start count; the mech only reaches the bottom two layers of a 4-high chunk, so a lower share could never be shot through; pillar chunks are slim 1x1 columns */
  zone:{intro:5.5,open:2.6,gateH:3},   /* drop-in cinematic when a zone opens: seconds of intro before spawns, second the gate falls, gate wall height */
  net:{rate:20,delay:100,snapErr:.3,snapFar:2.5,diffMax:800,inputStale:.5,shotMax:120,scrapMax:80,eventMax:200}   /* snapshots per second; render delay ms; prediction error (units) before a gentle pull / a hard snap; (unused) voxel changes per snapshot; seconds before a silent partner's keys are released */
};
/* ===== Phase 3, match flow: tuning keys (GDD-D37 Overtime, GDD-D38 contracts, GDD-D39 sector conditions, GDD-D24 revive) ===== */
T.overtime={choose:6,scrap:1.5,wave:4,loaders:1};   /* prompt seconds after wave 5; drops x1.5 while it runs; Overtime = wave 4 plus 1 loader, no boss */
T.contract={scrap:15,crush:3,spans:2,evictions:2,combo:4,pods:5,untouchable:.2,closeShave:.15,blitz:75,voxels:400,repo:2};   /* reward x the level's scrap scale; each contract's target */
T.revive={price:40,armor:.3};   /* GDD-D24: price x the level's scrap scale, paid from the survivor's wallet; back at 30% of max armor */
T.cond={brittle:.12,reinforced:.3,reinforcedScrap:2,heatWave:.3,coldFront:.3,coldFrontPods:1,scrapStorm:.3,scrapStormBots:1,
        blackout:.3,blackoutLight:12,podRain:2,loose:.15,nest:1};   /* the nine conditions' numbers; condTune() turns one into an override */
T.match={scrapMul:1,extraBots:0,podSeekAny:0,looseShare:0,extraSnipers:0,night:0,light:0};   /* flags a condition sets; all off by default */
T.net.hostLost=3;   /* view: seconds without a host snapshot before a co-op guest treats the host as gone (GDD-D52) */
/* ===== Phase 7, bosses (GDD-D51, TDD-D14): tuning keys. Health, damage and scrap take the level's scaling like every enemy. ===== */
T.boss.hard={hp:1.5,fireEvery:1.5,scrap:18,rate:.7};   /* the wave-5 variant of every boss but the Warden: health x1.5; a sniper fires every 1.5 s and drops 18 cubes
                                                          (a pair sniper's cubes x 18/12); the Juggernaut's charge cooldown x rate (30% faster) */
T.pair={hp:2/3,scrap:9,apart:8,wait:3};   /* Sniper pair: share of a sniper's health each, cubes each, never perched within `apart` m of each other,
                                             firing in turn (the turn passes back after `wait` s when the partner can't take it) */
T.juggernaut={hp:450,speed:1.8,radius:.85,height:1.8,patrol:.7,engage:6,tell:.6,charge:2,chargeSpeed:6.5,dmg:30,shove:2.5,recover:1,cooldown:2.5,voxDmg:60,scrap:20};   /* a boss loader: charges from
                                             `engage` m for up to `charge` s, plowing buildings, pillars, barriers and containers (voxDmg goes through T.structural) */
T.warden={hp:1500,speed:.8,z:5,height:1.4,radius:2.6,half:3,scrap:60,cover:.5,below:.5,   /* body aloft at z (m), hit cylinder radius, half the 6x6 footprint; damage x cover while a rider is up; below: share of health for the belly packs and stomp */
  leg:{hp:300,radius:.45,off:2.6,stagger:2,slow:.25},   /* four legs at the body's corners (off m along each axis); a break staggers 2 s and slows 25% (each) */
  platform:{hp:150,radius:.7,height:.35,off:2},   /* three rider platforms on its back, off m from the centre */
  fall:{dmg:400,taken:1.5,z:.9,gravity:22},   /* four legs broken: it comes down to z, takes dmg (x hp scale) and x taken damage from then on */
  barrage:{every:8,first:4,warn:2,at:[-6,-3,0,3],radius:2,mechDmg:20,enemyDmg:40,voxDmg:40},   /* four shells walking a line toward a mech (at: m from it along the Warden-to-mech line), a warn s ground warning, a 3x3x3 hole each */
  pack:{every:15},   /* below `below` health: a Scuttler pack from its belly every 15 s (the first at once) */
  stomp:{tell:.8,radius:3,dmg:25,every:2.5},   /* below `below` health and not down: a mech within radius m under it gets a tell, then dmg; every: cooldown s */
  walkIn:{from:3,to:3}};   /* it appears `from` m inside the far end of the Terminus Yard and walks in until within `to` m of the arena's centre */
/* Per-run tuning (TDD-D11): tuneFor(over) returns T itself, or a deep copy of T with `over` merged in (objects merge,
   anything else replaces). create({tune}) uses it, so sector conditions and sweep variants never touch MetroSim.T. */
function mergeTune(base,over){
  var o=JSON.parse(JSON.stringify(base));
  (function m(dst,src){Object.keys(src).forEach(function(k){var v=src[k];
    if(v&&typeof v==="object"&&!Array.isArray(v)&&dst[k]&&typeof dst[k]==="object"&&!Array.isArray(dst[k]))m(dst[k],v);
    else dst[k]=JSON.parse(JSON.stringify(v))})})(o,over||{});
  return o;
}
function tuneFor(over){return over&&Object.keys(over).length?mergeTune(T,over):T}
/* Sector conditions (GDD-D39, phase 3): the override condition `id` merges over a run's tuning TT. Numbers are relative to
   TT, so a sweep's override and a condition stack. Flags go in TT.match, which the sim and the view read. */
function condTune(TT,id){
  var C=TT.cond,o={},k;
  function brk(lost){o.chunk={breakAt:1-lost,pillarBreakAt:1-lost}}
  if(id==="brittle")brk(C.brittle);
  else if(id==="reinforced"){brk(C.reinforced);o.collapse={scrap:TT.collapse.scrap.map(function(v){return v*C.reinforcedScrap})}}
  else if(id==="loosePillars")o.match={looseShare:C.loose};
  else if(id==="heatWave")o.heat={drain:TT.heat.drain*(1-C.heatWave)};
  else if(id==="coldFront"){o.heat={drain:TT.heat.drain*(1+C.coldFront)};o.pods={perWave:C.coldFrontPods,extra:0}}
  else if(id==="scrapStorm")o.match={scrapMul:1+C.scrapStorm,extraBots:C.scrapStormBots};
  else if(id==="blackout"){k=1-C.blackout;o.bot={sight:TT.bot.sight*k};o.loader={sight:TT.loader.sight*k};o.boss={sight:TT.boss.sight*k};o.match={night:1,light:C.blackoutLight}}
  else if(id==="podRain"){o.pods={perWave:C.podRain,extra:0};o.match={podSeekAny:1}}
  else if(id==="snipersNest")o.match={extraSnipers:C.nest};
  return o;
}
/* FNV-1a over a list of numbers and strings: state hashes for the replay check, and the tuning hash. */
function fnv(list){var h=2166136261>>>0;for(var i=0;i<list.length;i++){var v=list[i],s=typeof v==="number"?(Math.round(v*1000)|0).toString(36):String(v);
  for(var j=0;j<s.length;j++){h^=s.charCodeAt(j);h=Math.imul(h,16777619)>>>0}h^=44;h=Math.imul(h,16777619)>>>0}return ("0000000"+h.toString(16)).slice(-8)}
function tuneHash(TT){return fnv([JSON.stringify(TT||T)])}

/* Materials: base colour and voxel hit points. */
var MAT={
  1:{name:"concrete",col:[128,126,120],hp:8},
  2:{name:"building",col:null,hp:12},       /* colour comes from the structure */
  3:{name:"deck",col:[70,72,78],hp:40},
  4:{name:"rail",col:[214,170,52],hp:10},
  5:{name:"barrier",col:[168,160,146],hp:10},
  6:{name:"window",col:[63,214,232],hp:4,glow:1},
  7:{name:"roof",col:null,hp:12},
  8:{name:"container",col:null,hp:14},
  9:{name:"edge",col:[118,116,110],hp:Infinity},
  10:{name:"rubble",col:[104,100,94],hp:8},
  11:{name:"steel",col:[214,170,52],hp:20},           /* crane, tower and gallery legs and beams */
  12:{name:"lamp",col:[240,190,90],hp:4,glow:1},      /* Freight Yard windows: sodium light */
  13:{name:"furnace",col:[255,140,60],hp:4,glow:1},   /* Smelter Row windows: furnace light */
  14:{name:"canvas",col:null,hp:3},                   /* market awnings, coloured by their structure */
  15:{name:"tank",col:[92,104,120],hp:12},            /* the Underpass water tower */
  16:{name:"iron",col:[78,70,66],hp:14},              /* slag vats and chimneys */
  17:{name:"slag",col:[255,120,40],hp:6,glow:1},      /* molten top of a slag vat */
  18:{name:"neon",col:[255,79,163],hp:4,glow:1}       /* Glass Quarter windows: pink neon */
};
var WINDOW={6:1,12:1,13:1,18:1};   /* window materials: the loader plows them, the renderer lights them */

var W=216,D=48,H=8,N=W*D*H;   /* five zones of streets along one overpass; MAP.zones says where each begins */
var SHOT_KIND={bullet:0,shell:1,orb:2,plasma:3,rail:4,mortar:5};   /* snapshot codes */
var NB6=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
var N8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function vi(x,y,z){return x+y*W+z*W*D}
function inB(x,y,z){return x>=0&&y>=0&&z>=0&&x<W&&y<D&&z<H}
function hash(x,y,z){var h=x*374761393+y*668265263+z*2147483647;h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967295}
function r2(v){return Math.round(v*100)/100}
function packCol(c){return (Math.min(255,Math.round(c[0]))<<16)|(Math.min(255,Math.round(c[1]))<<8)|Math.min(255,Math.round(c[2]))}
function angTo(a,b,rate,dt){var d=Math.atan2(Math.sin(b-a),Math.cos(b-a)),m=rate*dt;return a+Math.max(-m,Math.min(m,d))}

/* Map: Overpass Sector 4. A raised highway deck on ten pillars over three districts (level design, Oct 28 2026:
   games/metr0niks/level-design.md). Each zone has its own building shapes, colours and window light, and one landmark
   that falls under the same support rule as the deck: the water tower, the gantry crane and the slag gallery. */
var MAP={
  /* Sector 4 is one long overpass. The streets under it come in zones: level 1 plays in the first, each level after
     opens the next (its gate wall falls during the drop-in), until the whole sector is one battlefield.
     win: the window material of the zone's buildings; ground: a tint for the street under it. */
  zones:[{name:"Underpass",x0:0,x1:47,win:6,ground:[1,1,1]},{name:"Freight Yard",x0:48,x1:83,win:12,ground:[1.22,1.2,1.12]},{name:"Smelter Row",x0:84,x1:119,win:13,ground:[1.12,.9,.84]},
    {name:"Glass Quarter",x0:120,x1:167,win:18,ground:[.94,.98,1.12]},{name:"Terminus Yard",x0:168,x1:215,win:12,ground:[1.16,1.08,.96],arena:{x:192,y:24,r:12}}],
  /* the deck ends at x1, over the Terminus Yard's entrance: the last zone is open sky, room for a big fight */
  spawn:[[23.5,17.5],[26,17.5]],   /* drop-in points of player 1 and 2, at the Underpass plaza */
  overpass:{y0:20,y1:27,z:5,x1:167,pillarsX:[5,17,29,41,53,65,77,89,101,113,125,137,149,161]},
  blocks:[ /* x,y,w,d,h,hue (MAP.hues) */
    /* Underpass, shanty market: shacks of 2 to 4 m on 2 m alleys; the plaza in the middle is the water tower's */
    [3,2,5,4,2,0],[11,2,3,4,3,1],[3,9,3,3,3,3],[9,9,5,3,2,2],
    [32,2,3,4,3,1],[38,2,3,3,4,0],[44,2,3,4,2,2],[32,9,3,5,3,2],[36,8,5,4,2,3],[44,9,3,3,3,1],
    [3,30,5,5,2,1],[11,30,3,3,3,2],[17,32,4,3,2,3],[24,30,5,5,4,0],[32,32,3,3,2,1],[38,30,4,3,3,2],[44,32,3,3,2,3],
    [3,39,3,5,3,2],[9,38,5,4,2,0],[17,39,3,5,3,1],[23,39,4,3,2,2],[30,38,5,4,5,3],[38,39,3,5,2,0],[42,38,5,4,3,1],
    /* Freight Yard, container yard: one long warehouse and two sheds north, a shed south */
    [51,2,18,6,4,7],[72,2,6,4,2,6],[80,3,3,3,3,6],[80,38,3,4,2,8],
    /* Smelter Row, furnace canyons: one long smelter hall north, tall halls on 3 m canyons south */
    [86,2,31,6,6,10],[92,15,4,3,2,11],[107,15,4,3,2,9],
    [86,30,7,6,5,11],[96,30,9,6,7,10],[108,30,9,5,4,9],
    [86,39,6,6,3,9],[95,41,7,4,4,11],[105,39,5,6,6,10],[113,39,4,6,3,11],
    /* Glass Quarter, financial district: glass towers of 4 to 7 m in a grid of 2 to 3 m streets, with a plaza in
       the north half under the billboard */
    [123,2,8,7,7,14],[135,2,6,6,6,15],[146,2,9,6,7,16],[158,2,7,7,6,14],[123,12,5,5,4,17],[155,12,6,5,4,15],
    [123,30,6,6,6,16],[132,32,5,4,5,17],[140,30,7,6,7,14],[150,30,5,5,4,15],[158,30,7,8,6,16],
    [123,39,9,6,4,15],[137,39,6,6,6,14],[146,39,4,6,3,17],[153,41,12,4,5,16],
    /* Terminus Yard, the arena: four pylons in the corners and two bunkers mid-wall around an open floor */
    [171,3,5,5,6,18],[209,3,4,5,6,18],[171,41,5,4,6,18],[209,41,4,4,6,18],[189,2,6,3,3,19],[189,44,6,3,3,19]
  ],
  barriers:[ /* x,y,w,d: 1 m high; the Underpass ones are market stalls */
    [9,21,1,1],[12,26,1,1],[21,21,3,1],[24,26,1,1],[33,21,1,1],[36,26,3,1],[44,21,1,1],[15,5,1,1],[27,5,1,1],[15,14,1,1],
    [57,21,1,3],[71,26,3,1],[81,21,1,3],
    [93,21,1,3],[107,26,3,1],[117,20,1,1],
    [134,11,3,1],[149,17,1,1],[141,18,3,1],[129,21,1,3],[143,26,3,1],[155,21,1,3],[165,24,1,1],
    [177,9,3,1],[204,9,3,1],[177,38,3,1],[204,38,3,1]],
  containers:[ /* x,y,w,d,colour,stack: a stack of 2 or 3 falls when its bottom box is shot out or plowed */
    [6,44,3,1,[176,74,44],1],
    [53,12,6,1,[176,74,44],2],[62,12,6,1,[52,108,132],3],[71,12,6,1,[106,128,64],2],[78,14,3,1,[150,62,40],1],[53,15,3,1,[52,108,132],1],[68,15,3,1,[150,62,40],2],
    [59,32,4,1,[106,128,64],2],[72,32,5,1,[176,74,44],3],[59,39,4,1,[150,62,40],3],[72,39,5,1,[52,108,132],2],
    [51,32,3,1,[176,74,44],1],[80,33,1,3,[106,128,64],2],[51,44,5,1,[52,108,132],1],
    [176,14,3,1,[176,74,44],2],[206,14,3,1,[52,108,132],1],[176,33,3,1,[106,128,64],1],[206,33,3,1,[150,62,40],2]],
  rubble:[ /* x,y,w,d,h: scrap heaps, block walking and can be shot away */
    [174,21,3,5,1],[210,21,3,5,2],[192,8,3,1,1],[192,39,3,1,1]],
  billboard:{legs:[[138,14],[146,14]],legH:4,sign:[137,14,12,3,3]},   /* Glass Quarter: a neon sign on two legs over the plaza */
  awnings:[ /* x,y,w,d,z,colour: canvas strung between shack walls; you walk under it */
    [8,3,3,3,2,[196,84,60]],[35,3,3,3,2,[214,170,70]],[41,9,3,3,2,[52,140,136]],
    [14,32,3,3,2,[214,170,70]],[29,32,3,3,2,[52,140,136]],[6,39,3,3,2,[196,84,60]],[35,36,3,3,2,[214,170,70]]],
  /* Landmarks: legs stand on the street and hold what sits on them. Break every leg and the rest falls as a collapse. */
  tower:{legs:[[18,6],[25,6],[18,13],[25,13]],legH:4,tank:[18,6,8,8,3]},          /* Underpass: tank x,y,w,d,h on 4 m legs */
  crane:{x0:56,y0:30,x1:79,y1:44,h:6,trolleyX:66,load:[66,36,4,3]},              /* Freight Yard: frame at 6 m, a container on the hook */
  gallery:{x:89,y:9,w:24,d:5,z:3,legs:[[90,11],[99,11],[108,11]],vats:[[91,10],[96,11],[102,10],[108,11]]},   /* Smelter Row: slag vats on a gallery */
  vats:[[102,17],[93,36],[110,36]],   /* standalone slag vats on a leg frame */
  chimneys:[[87,15,8],[117,15,8],[105,33,8]],
  hues:[ /* 0-5 Underpass brick and ochre, 6-8 Freight Yard sheds, 9-13 Smelter Row iron and soot, 14-17 Glass Quarter glass and stone, 18-19 Terminus Yard */
    [150,92,64],[172,150,116],[96,108,124],[140,70,56],[120,104,88],[112,122,112],
    [128,126,120],[104,116,108],[136,112,92],
    [70,66,64],[88,76,68],[118,66,50],[104,100,96],[96,60,48],
    [70,96,120],[52,60,72],[140,146,152],[196,192,182],
    [150,110,50],[96,92,88]]
};

/* ===== Garage data: build model and derived stats ===== */
var SLOTS=[["core","Core"],["armR","Arm-R"],["armL","Arm-L"],["shoulder","Shoulder"],["legs","Legs"],["reactor","Reactor"]];
var BASE={power:100,armor:100,speed:100,weight:60,heat:100};   /* the starter parts' weights bring weight to 100 */
/* d: stat deltas; hook: gameplay switches read by deriveStats(). Cost is in banked scrap. */
var PARTS=[
  {id:"minigun",slot:"armR",name:"Minigun",rarity:"common",cost:0,d:{weight:14},hook:{gun:"minigun"},desc:"Fast stream of light rounds. Heats up quickly."},
  {id:"shotgun",slot:"armR",name:"Shotgun",rarity:"rare",cost:25,d:{power:10,weight:18,heat:15},hook:{gun:"shotgun"},desc:"Six pellets in a wide blast, one every 0.55 s. Devastating up close, weak past it, and each shot is hot."},
  {id:"pile",slot:"armL",name:"Pile-bunker",rarity:"common",cost:0,d:{weight:14},hook:{pile:"pile"},desc:"Zero-range melee spike on an ATB bar. Miss and it takes 1.5 s to retract."},
  {id:"buster",slot:"armL",name:"Bunker-buster cannon",rarity:"rare",cost:90,d:{power:20,weight:34,speed:-5,heat:10},hook:{pile:"buster",torso:T.buster.torso},desc:"The ATB shot is a slow 70 damage shell that blasts through walls. Recoil shoves you back 2 m and the torso turns 25% slower."},
  {id:"cryo",slot:"shoulder",name:"Cryo-vent heatsink",rarity:"rare",cost:30,d:{weight:8,heat:-33},hook:{},desc:"Passive cooling: heat drains 50% faster."},
  {id:"jets",slot:"legs",name:"Vectored jump-jets",rarity:"common",cost:0,d:{weight:8},hook:{},desc:"Space dashes in your drive direction. Each dash adds heat."},
  {id:"treads",slot:"legs",name:"Bulldozer siege treads",rarity:"rare",cost:70,d:{armor:25,speed:-8,weight:38},hook:{noDash:1,immune:1,turn:T.treads.turn},desc:"No dash. Immune to loader shove and recoil. Turns 2x slower, heavier armor."},
  {id:"slag",slot:"core",name:"Ablative slag-plating",rarity:"rare",cost:80,d:{armor:60,speed:-20,weight:40},hook:{},desc:"+60 max armor, but about 30% slower."},
  {id:"plasma",slot:"armR",name:"Plasma cutter",rarity:"rare",cost:45,d:{power:5,weight:12,heat:20},hook:{gun:"plasma"},desc:"Short white-hot torch, about 5 m. Ignores loader armor and melts walls and pillars four times faster than bullets. Fills heat fast."},
  {id:"rail",slot:"armR",name:"Rail rifle",rarity:"epic",cost:110,d:{power:15,weight:22,speed:-4,heat:15},hook:{gun:"rail"},desc:"One 34 damage slug every 1.1 s that passes through every bot in line and punches through thin walls. Each shot is very hot."},
  {id:"winch",slot:"armL",name:"Industrial mag-winch",rarity:"rare",cost:55,d:{weight:16},hook:{pile:"winch"},desc:"The ATB shot fires a cable, 8 m (10 m on Perfect). Bots are dragged to your feet; a wall or a heavy loader drags you to it instead. A Perfect hit on a pillar rips it apart."},
  {id:"mortar",slot:"shoulder",name:"Twin-pod siege mortar",rarity:"epic",cost:100,d:{power:5,weight:24,speed:-4,heat:10},hook:{q:"mortar"},desc:"Q lobs two shells over buildings onto the cursor every 7 s. They blast rooftops and splash bots. Can't hit closer than 4 m."},
  {id:"vent",slot:"shoulder",name:"Cryo flash-vent",rarity:"rare",cost:40,d:{weight:10,heat:-15},hook:{q:"vent"},desc:"Q dumps all your heat at once, even when locked out, as a freezing blast that slows nearby bots for 3 s. Recharges in 10 s."},
  {id:"magnet",slot:"shoulder",name:"Salvage magnet",rarity:"common",cost:20,d:{weight:6},hook:{magnet:1},desc:"Pulls scrap cubes in from 7 m instead of 3."},
  {id:"strider",slot:"legs",name:"Strider servo-legs",rarity:"rare",cost:50,d:{armor:-10,speed:14,weight:2},hook:{dash:T.strider.dash,dashHeat:T.strider.dashHeat},desc:"Fast, light legs. Dash recharges in 0.7 s and adds half the heat. Thinner armor."},
  {id:"composite",slot:"core",name:"Composite frame",rarity:"common",cost:15,d:{armor:-15,speed:10,weight:-12},hook:{},desc:"Swaps steel for composite: lighter and faster, with less armor."},
  {id:"nanite",slot:"core",name:"Nanite repair core",rarity:"epic",cost:95,d:{weight:10,heat:8},hook:{regen:1},desc:"After 3 s without taking damage, repairs 2 armor per second."},
  {id:"mk1",slot:"reactor",name:"Reactor Mk1",rarity:"common",cost:0,d:{weight:4},hook:{},desc:"Standard reactor."},
  {id:"mk2",slot:"reactor",name:"Reactor Mk2",rarity:"rare",cost:60,d:{power:15,speed:6,weight:8,heat:10},hook:{},desc:"More power: faster ATB fill and damage, a little more speed. Runs hotter."},
  {id:"mk3",slot:"reactor",name:"Reactor Mk3",rarity:"epic",cost:120,d:{power:30,speed:12,weight:14,heat:22},hook:{},desc:"Top-tier power and speed. Heavy, and it runs hot."},
  {id:"fusion",slot:"reactor",name:"Cold-fusion cell",rarity:"epic",cost:140,d:{power:20,speed:6,weight:10,heat:-12},hook:{},desc:"Nearly Mk3 power that runs cool. The most expensive part in the garage."},
  /* ----- phase 6: blueprint parts (GDD-D42). zone = the MAP.zones index whose level (zone + 1) unlocks the part the first
     time it is extracted (MetroSim.unlockLevel(id)); after that they are bought like any part. ----- */
  {id:"arc",slot:"armR",name:"Arc caster",rarity:"rare",cost:65,zone:1,d:{power:5,weight:14,heat:18},hook:{gun:"arc"},desc:"A bolt every 0.4 s, 9 damage, about 12 m, that jumps to up to 2 more enemies within 4 m for 6 each. Built for Scuttler packs. Half damage to loaders; no damage to walls."},
  {id:"redline",slot:"shoulder",name:"Redline vent",rarity:"rare",cost:50,zone:2,d:{weight:8,heat:5},hook:{q:"redline"},desc:"Q: 5 s of Redline. Nothing locks and heat climbs to 130, but every point above 100 costs half a point of armor. Works during a lockout and ends it. 14 s recharge."},
  {id:"seismic",slot:"armL",name:"Seismic hammer",rarity:"epic",cost:115,zone:2,d:{power:10,weight:30,speed:-6,heat:12},hook:{pile:"seismic"},desc:"ATB ground slam: 50 damage to every enemy within 3 m (4 m on a Perfect). A Perfect staggers them all, topples container stacks and shakes a nearby sniper off its roof."},
  {id:"breach",slot:"shoulder",name:"Breach charges",rarity:"rare",cost:60,zone:3,d:{weight:10,heat:5},hook:{q:"breach"},desc:"Tap Q to stick a charge on the surface under the cursor, up to 10 m; tap again with none in hand, or hold Q, to set them all off. 40 damage and every voxel within 2 m. Holds 2, each back after 8 s."},
  {id:"overdrive",slot:"core",name:"Overdrive core",rarity:"epic",cost:100,zone:4,d:{armor:-10,weight:8},hook:{overdrive:1},desc:"Below 35% armor: power +30 and heat drains 50% faster. A comeback core for players who live on the edge."},
  {id:"skids",slot:"legs",name:"Grav-skids",rarity:"rare",cost:55,zone:4,d:{armor:-5,speed:8,weight:6},hook:{skids:1},desc:"Hover drive: slides wider through turns, holds 2 dashes that recharge 1.6 s each (8 heat a dash), and takes half damage and heat from slag. Loader shoves push you 50% further."}
];
var PART={};PARTS.forEach(function(p){PART[p.id]=p});
/* ===== Climb plan data (TDD-D10, GDD-D38, GDD-D39, GDD-D51): ids, names and what the plan's filter reads; phase 3 adds the effects.
   need: "span" = an overpass span must stand in the level's open zones, "sniper" = a sniper boss must come that level;
   not: a condition the contract can't be done under. mild: level 1 draws its condition from these only. ===== */
var CONTRACTS=[
  {id:"crush",name:"Crush",desc:"Kill 3 or more enemies with one collapse",need:"span"},
  {id:"bringItDown",name:"Bring it down",desc:"Drop 2 overpass spans",need:"span"},
  {id:"eviction",name:"Eviction",desc:"Knock the sniper off its perch twice",need:"sniper"},
  {id:"fullCombo",name:"Full combo",desc:"Reach a x4 combo"},
  {id:"cleanSweep",name:"Clean sweep",desc:"Take every pod that drops (at least 5)",not:"coldFront"},
  {id:"untouchable",name:"Untouchable",desc:"Clear wave 3 losing less than 20% of max armor"},
  {id:"closeShave",name:"Close shave",desc:"Extract with less than 15% of max armor"},
  {id:"blitz",name:"Blitz",desc:"Clear waves 1 and 2 within 75 s of wave 1 starting"},
  {id:"wreckingCrew",name:"Wrecking crew",desc:"Destroy 400 voxels"},
  {id:"repoMan",name:"Repo man",desc:"Kill 2 enemies that took a pod"}];
var CONDITIONS=[
  {id:"brittle",name:"Brittle city",mild:false,desc:"Chunks break sooner"},
  {id:"reinforced",name:"Reinforced",mild:true,desc:"Chunks hold longer; collapse scrap doubles"},
  {id:"loosePillars",name:"Loose pillars",mild:false,desc:"Every pillar starts cracked at the base"},
  {id:"heatWave",name:"Heat wave",mild:true,desc:"Heat drains 30% slower"},
  {id:"coldFront",name:"Cold front",mild:true,desc:"Heat drains 30% faster; one pod per wave"},
  {id:"scrapStorm",name:"Scrap storm",mild:true,desc:"Scrap drops +30%; one more bot per wave"},
  {id:"blackout",name:"Blackout",mild:false,desc:"Night: enemies see 30% less far"},
  {id:"podRain",name:"Pod rain",mild:true,desc:"Two pods every wave"},
  {id:"snipersNest",name:"Sniper's nest",mild:false,desc:"Each boss wave brings an extra Bounty sniper"}];
/* lv: the levels a boss may come on; wave: the only wave it comes on; sniper: Eviction can be done against it;
   force: "first" = always level 1 wave 3, "last" = always wave 5 of the last level */
var BOSSES={sniper:{name:"Bounty sniper",lv:[1,4],sniper:1,force:"first"},sniperPair:{name:"Sniper pair",lv:[2,4],sniper:1},
  juggernaut:{name:"Juggernaut",lv:[3,5]},warden:{name:"The Warden",lv:[5,5],wave:5,force:"last"}};
var STARTER={core:null,armR:"minigun",armL:"pile",shoulder:null,legs:"jets",reactor:"mk1"};
function cloneBuild(b){var o={};SLOTS.forEach(function(s){o[s[0]]=b[s[0]]||null});return o}
function cleanBuild(b){var o={};SLOTS.forEach(function(sl){var id=b&&b[sl[0]];o[sl[0]]=(id&&PART[id]&&PART[id].slot===sl[0])?id:STARTER[sl[0]]});return o}
function isStarter(id){var p=PART[id];return !!p&&STARTER[p.slot]===id}
/* Wear (GDD-D18): a worn part gives (1 - wear) of each helpful change (power, armor, speed up; weight, heat down);
   costs and hooks stay whole. Starter parts never wear. wear = {partId: 0..1} or nothing. */
var HELP={power:1,armor:1,speed:1,weight:-1,heat:-1};
function statsOf(b,wear){var s={},k;for(k in BASE)s[k]=BASE[k];SLOTS.forEach(function(sl){var id=b[sl[0]],p=PART[id];if(!p)return;
  var w=wear&&!isStarter(id)?Math.max(0,Math.min(1,+wear[id]||0)):0;
  for(k in p.d){var v=p.d[k];s[k]+=w&&v*HELP[k]>0?v*(1-w):v}});return s}
/* A weapon (GDD-D23) is a part whose hook grants a gun, an ATB weapon or a Q active that deals damage: it can be upgraded. */
function isWeapon(id){var p=PART[id],h=p&&p.hook;if(!h)return false;var k=h.gun||h.pile||h.q;return !!(k&&T[k]&&T[k].dmg>0)}
/* Stats to gameplay numbers. The starter build lands exactly on the T baselines. */
function deriveStats(b,TT,wear){
  TT=TT||T;
  var s=statsOf(b,wear),Gt=TT.garage,wf=1/(1+(s.weight-100)*Gt.weightDrag),Hk={turn:1,torso:1,gun:"minigun",pile:"pile",noDash:false,immune:false,q:null,magnet:false,dash:1,dashHeat:1,regen:false},P=TT.player;
  SLOTS.forEach(function(sl){var p=PART[b[sl[0]]],h=p&&p.hook;if(!h)return;
    if(h.turn)Hk.turn*=h.turn;if(h.torso)Hk.torso*=h.torso;if(h.gun)Hk.gun=h.gun;if(h.pile)Hk.pile=h.pile;if(h.noDash)Hk.noDash=true;if(h.immune)Hk.immune=true;
    if(h.q)Hk.q=h.q;if(h.magnet)Hk.magnet=true;if(h.dash)Hk.dash*=h.dash;if(h.dashHeat)Hk.dashHeat*=h.dashHeat;if(h.regen)Hk.regen=true});
  return {s:s,maxHp:Math.round(P.armor*s.armor/100),spd:P.speed*s.speed/100*wf,acc:P.accel*s.speed/100*wf,legT:P.legTurn*wf*Hk.turn,torT:P.torsoTurn*wf*Hk.turn*Hk.torso,
    dmgMul:s.power/100,atbRate:s.power/100,drain:TT.heat.drain*Math.max(.4,1+(100-s.heat)*Gt.cool),heatMul:1+(s.heat-100)/(s.heat>100?100:200),
    gun:Hk.gun,pile:Hk.pile,noDash:Hk.noDash,immune:Hk.immune,q:Hk.q,magnet:Hk.magnet?TT.magnet.range:TT.scrapMagnet,dashMul:Hk.dash,dashHeat:Hk.dashHeat,regen:Hk.regen};
}

/* Legs: movement, dash and walk cycle, shared by the sim and the guest's prediction. input.k is the key bitmask.
   Returns true on the tick a dash starts (the caller adds heat and effects; a prediction skips the heat). */
function moveMech(p,inp,TT,dt){
  var P=TT.player,k=inp.k|0,ix=0,iy=0,dashed=false;
  /* WASD is screen relative. Screen up is world (-1,-1). */
  if(k&1){ix-=1;iy-=1}
  if(k&4){ix+=1;iy+=1}
  if(k&2){ix-=1;iy+=1}
  if(k&8){ix+=1;iy-=1}
  var il=Math.hypot(ix,iy);if(il){ix/=il;iy/=il}
  if(p.dash>0){p.dash-=dt}
  else{
    if(il){p.vx+=ix*p.acc*dt;p.vy+=iy*p.acc*dt}
    var f=Math.exp(-P.friction*dt*(il?.35:1)*(p.grip||1));p.vx*=f;p.vy*=f;   /* grip < 1: Grav-skids slide wider */
    var sp=Math.hypot(p.vx,p.vy);if(sp>p.spd){p.vx*=p.spd/sp;p.vy*=p.spd/sp}
  }
  p.dashCd=Math.max(0,p.dashCd-dt);
  var sk=p.dashN!=null;   /* Grav-skids (GDD-D42): dash charges, recharging one at a time (dashCd times the next one) */
  if(sk&&p.dashCd<=0&&p.dashN<TT.skids.dashes){p.dashN++;if(p.dashN<TT.skids.dashes)p.dashCd=TT.skids.recharge}
  if((k&16)&&(sk?p.dashN>0&&p.dash<=0:p.dashCd<=0)&&!p.over&&!p.noDash){
    var dx=il?ix:Math.cos(p.leg),dy=il?iy:Math.sin(p.leg);
    p.vx=dx*P.dashSpeed;p.vy=dy*P.dashSpeed;p.dash=P.dashTime;dashed=true;
    if(sk){p.dashN--;if(p.dashCd<=0)p.dashCd=TT.skids.recharge}else p.dashCd=P.dashCooldown*(p.dashMul||1);
  }
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  var spd=Math.hypot(p.vx,p.vy);
  if(spd>.3)p.leg=angTo(p.leg,Math.atan2(p.vy,p.vx),p.legT,dt);
  p.step+=spd*dt*2.2;
  return dashed;
}

/* Cluster geometry from voxel indices and their colours; a guest rebuilds falling pieces from the same data.
   Colour strings are the renderer's business: n is the per-voxel shade jitter. */
function clusterGeom(idx,cols){
  var mark=new Uint8Array(N),vs=[],foot={};
  idx.forEach(function(i){mark[i]=1});
  idx.forEach(function(i,k){
    var x=i%W,y=((i/W)|0)%D,z=(i/(W*D))|0,n=.9+hash(x,y,z)*.16;
    var top=z+1>=H||!mark[vi(x,y,z+1)],fx=x+1>=W||!mark[vi(x+1,y,z)],fy=y+1>=D||!mark[vi(x,y+1,z)];
    vs.push({x:x,y:y,z:z,key:x+y+1,col:cols[k],top:top,fx:fx,fy:fy,n:n});
    foot[x+y*W]=1;
  });
  return {vs:vs,foot:Object.keys(foot).map(Number)};
}

function defaultColor(id,s){
  var m=MAT[id];if(m.col)return m.col;
  var c=s.hue!==undefined?MAP.hues[s.hue]:s.col;
  return id===7?[c[0]*.72,c[1]*.72,c[2]*.72]:c;
}

function create(opts){
  opts=opts||{};
  var T=tuneFor(opts.tune);   /* this run's tuning: MetroSim.T unless opts.tune overrides some keys */
  var condId=opts.plan&&opts.plan.condition;   /* phase 3: the level's sector condition merges over the run's tuning (GDD-D39) */
  if(condId&&CONDITIONS.some(function(x){return x.id===condId}))T=mergeTune(T,condTune(T,condId));else condId=null;
  var seed=(opts.seed|0)||7;if(seed<=0)seed=7;
  var colorOf=opts.colorOf||defaultColor,clock=opts.clock||function(){return 0};
  function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}

  var vox=new Uint8Array(N),owner=new Uint16Array(N),vdmg=new Float32Array(N),vstamp=new Int32Array(N);
  var structures=[null],CS=T.chunk.size,CXN=Math.ceil(W/CS),CYN=Math.ceil(D/CS);
  var chunks=[],chunkOf=new Int16Array(N),walk=new Uint8Array(W*D),wbox=null,reachC=new Uint8Array(0);
  var players=[],bots=[],pods=[],shots=[],scraps=[],debris=[],clusters=[],events=[],netEv=[],inputs=[];
  var run={wave:1,queue:[],spawnT:0,breather:0,done:false,exitT:0,waveT:0,podAt:[],
    overtime:false,otCleared:false,choose:0,clock:0,podsDropped:0,podsTaken:0,podsLost:0,revives:0};   /* phase 3 fields */
  var level=Math.max(1,Math.min(T.level.max,Math.floor(+opts.level)||1));
  function lvm(k){return 1+T.level[k]*(level-1)}
  var tick=0,state="drop",scrap=0,kills=0,shake=0,fieldsDirty=true,fieldT=0,supportDirty=false,pillarsDown=0,bigFall=false;
  var cid=0,eid=0,snapBase=0,spawnCells=[];
  /* Zones: at level L the first min(L, zones) zones are open. When L itself opens a new zone, that zone starts sealed
     and its gate falls at zone.openAt, in the middle of an intro of introTicks during which nothing spawns. */
  var ZS=MAP.zones,zone={open:Math.min(ZS.length,level),opening:-1,target:-1,openAt:0,intro:0},gates=[];
  if(level>1&&level<=ZS.length){zone.open=level-1;zone.opening=zone.target=level-1;zone.openAt=Math.round(T.zone.open*60);zone.intro=Math.round(T.zone.intro*60)}
  function openX(){return ZS[zone.open-1].x1}
  var chk={last:0,max:0,n:0};
  var world={vox:vox,owner:owner,vdmg:vdmg,W:W,D:D,H:H,structures:structures,walk:walk,rev:0,
    get chunks(){return chunks},get:get,solidAt:solidAt,blockedCell:blockedCell,rebuildWalk:rebuildWalk,vi:vi};
  var sim={T:T,introTicks:0,world:world,players:players,bots:bots,shots:shots,pods:pods,scraps:scraps,clusters:clusters,debris:debris,run:run,chk:chk,plan:opts.plan||null,
    cond:{id:condId,night:!!T.match.night,light:T.match.light}};
  var wearOf=(opts.wear||[]).slice(),upgOf=(opts.upgrades||[]).slice();   /* per mech, by index: {partId: wear}, {partId: Mk level} */

  function get(x,y,z){return inB(x,y,z)?vox[vi(x,y,z)]:0}
  function solidAt(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(z<0)return 1;return inB(x,y,z)?vox[vi(x,y,z)]:0}
  function touch(i){vstamp[i]=tick+1;world.rev++}

  /* ----- events ----- */
  function emit(e){
    var k=e[0];
    if(events.length>=(k==="s"||k==="m"?1500:5000))return;   /* nobody drains: drop effects first */
    events.push(e);
  }
  function emitNet(e){emit(e);if(netEv.length<T.net.eventMax)netEv.push(e)}
  function sparks(x,y,z,n,col){emit(["s",x,y,z,n,col])}
  function smoke(x,y,z,n,col){emit(["m",x,y,z,n,col||[160,160,160]])}
  function addShake(a){shake=Math.min(1,shake+a);emit(["k",a])}
  function floatText(x,y,z,txt,col){emitNet(["f",r2(x),r2(y),r2(z),txt,col])}
  /* only: a player index when the line is for one mech (the co-op partner gets it as an event); omitted = everyone */
  function toast(t,c,only){emitNet(["t",t,c||null,only===undefined?-1:only])}
  function debrisPiece(x,y,z,col){
    if(debris.length>=T.debrisCap)debris.shift();
    debris.push({x:x,y:y,z:z,vx:(rnd()-.5)*6,vy:(rnd()-.5)*6,vz:2+rnd()*4,s:.1+rnd()*.12,col:col,t:2+rnd(),spin:rnd()*6})
  }

  /* ----- world ----- */
  function structure(kind,col,support){var s={id:structures.length,kind:kind,col:col,support:!!support};structures.push(s);return s}
  function fill(x0,y0,z0,w,d,h,mat,s){
    for(var z=z0;z<z0+h;z++)for(var y=y0;y<y0+d;y++)for(var x=x0;x<x0+w;x++){
      if(!inB(x,y,z))continue;var i=vi(x,y,z);vox[i]=mat;owner[i]=s?s.id:0;
    }
  }
  function buildMap(){
    var edge=structure("edge",null);
    fill(0,0,0,W,1,2,9,edge);fill(0,D-1,0,W,1,2,9,edge);fill(0,0,0,1,D,2,9,edge);fill(W-1,0,0,1,D,2,9,edge);
    /* The deck is cast in spans with expansion joints over the pillars: each pillar holds the two spans that
       meet on it, so losing one pillar leaves both spans cantilevered and losing two neighbours drops the span. */
    var o=MAP.overpass,cuts=[0];
    o.pillarsX.forEach(function(x){cuts.push(x+1)});cuts.push(o.x1!==undefined?o.x1+1:W);
    for(var k=0;k<cuts.length-1;k++){
      var sp=structure("deck",null);sp.span=true;var w=cuts[k+1]-cuts[k];
      fill(cuts[k],o.y0,o.z,w,o.y1-o.y0+1,1,3,sp);
      fill(cuts[k],o.y0,o.z+1,w,1,1,4,sp);fill(cuts[k],o.y1,o.z+1,w,1,1,4,sp);
    }
    o.pillarsX.forEach(function(px){var p=structure("pillar",null,true);p.x=px;var py=Math.floor((o.y0+o.y1)/2);p.y=py;fill(px,py,0,2,2,o.z,1,p)});
    function zoneAt(x){for(var k=0;k<ZS.length;k++)if(x<=ZS[k].x1)return ZS[k];return ZS[ZS.length-1]}
    MAP.blocks.forEach(function(b){
      var hue=b[5]%MAP.hues.length,s=structure("building",MAP.hues[hue]),win=zoneAt(b[0]).win||6;s.hue=hue;
      fill(b[0],b[1],0,b[2],b[3],b[4],2,s);
      fill(b[0],b[1],b[4]-1,b[2],b[3],1,7,s);
      for(var z=1;z<b[4]-1;z++)for(var y=b[1];y<b[1]+b[3];y++)for(var x=b[0];x<b[0]+b[2];x++){
        var face=(x===b[0]+b[2]-1)||(y===b[1]+b[3]-1);
        if(face&&hash(x,y,z)<.28)vox[vi(x,y,z)]=win;
      }
    });
    MAP.barriers.forEach(function(b){fill(b[0],b[1],0,b[2],b[3],1,5,structure("barrier",null))});
    var ci=0;
    MAP.containers.forEach(function(c){for(var n=0;n<(c[5]||1);n++){var s=structure("container",c[4]);s.ci=ci++;fill(c[0],c[1],n*2,c[2],c[3],2,8,s)}});
    MAP.awnings.forEach(function(a){fill(a[0],a[1],a[4],a[2],a[3],1,14,structure("awning",a[5]))});
    /* water tower: each leg is its own structure, so the tank stands while any leg does */
    var tw=MAP.tower;
    tw.legs.forEach(function(l){fill(l[0],l[1],0,1,1,tw.legH,11,structure("leg",null))});
    var tank=structure("tank",null);fill(tw.tank[0],tw.tank[1],tw.legH,tw.tank[2],tw.tank[3],tw.tank[4],15,tank);
    fill(tw.tank[0]+1,tw.tank[1]+1,tw.legH+tw.tank[4]-1,tw.tank[2]-2,tw.tank[3]-2,1,11,tank);
    /* gantry crane: four legs, a frame and a trolley beam, and a container hanging from the hook; one structure, so
       the load hangs from the frame (load only hangs inside one structure) and falls with it */
    var C=MAP.crane,cr=structure("crane",[106,128,64]);cr.ci=ci++;
    [[C.x0,C.y0],[C.x1,C.y0],[C.x0,C.y1],[C.x1,C.y1]].forEach(function(l){fill(l[0],l[1],0,1,1,C.h,11,cr)});
    fill(C.x0,C.y0,C.h,C.x1-C.x0+1,1,1,11,cr);fill(C.x0,C.y1,C.h,C.x1-C.x0+1,1,1,11,cr);
    fill(C.trolleyX,C.y0+1,C.h,2,C.y1-C.y0-1,1,11,cr);
    var L=C.load;fill(L[0]+1,L[1],4,1,1,C.h-4,11,cr);fill(L[0],L[1],2,L[2],L[3],2,8,cr);
    /* slag gallery: a deck on legs over the street with vats on top */
    var G=MAP.gallery,gl=structure("gallery",null);
    G.legs.forEach(function(l){fill(l[0],l[1],0,1,1,G.z,11,structure("leg",null))});
    fill(G.x,G.y,G.z,G.w,G.d,1,16,gl);
    G.vats.forEach(function(v){var s=structure("vat",null);fill(v[0],v[1],G.z+1,2,2,1,16,s);fill(v[0],v[1],G.z+2,2,2,1,17,s)});
    /* standalone vats: a 2x2 leg frame at street level, the vat on top; shoot the frame and the vat drops */
    MAP.vats.forEach(function(v){fill(v[0],v[1],0,2,2,1,11,structure("leg",null));var s=structure("vat",null);fill(v[0],v[1],1,2,2,1,16,s);fill(v[0],v[1],2,2,2,1,17,s)});
    (MAP.rubble||[]).forEach(function(r){fill(r[0],r[1],0,r[2],r[3],r[4],10,structure("rubble",null))});
    var BB=MAP.billboard;if(BB){BB.legs.forEach(function(l){fill(l[0],l[1],0,1,1,BB.legH,11,structure("leg",null))});
      var sg=structure("sign",[255,79,163]),S=BB.sign;fill(S[0],S[1],BB.legH,S[2],S[3],S[4],18,sg);fill(S[0],S[1],BB.legH,S[2],S[3],1,16,sg)}
    MAP.chimneys.forEach(function(c){var s=structure("chimney",null);fill(c[0],c[1],0,1,1,c[2],16,s)});
    /* Gate walls seal every zone that is not open yet: a blast shutter across the street, under the deck. */
    for(var k=zone.open;k<ZS.length;k++){var g=structure("gate",null);g.zone=k;gates[k]=g;fill(ZS[k].x0,1,0,1,D-2,T.zone.gateH,9,g)}
  }
  /* The gate of zone k falls: its voxels become debris, the walk grid and spawn cells grow, and everyone hears about it. */
  function openZone(k){
    var g=gates[k];if(!g)return;gates[k]=null;
    for(var z=0;z<H;z++)for(var y=0;y<D;y++){var x=ZS[k].x0,i=vi(x,y,z);if(!vox[i]||owner[i]!==g.id)continue;
      var ci=chunkOf[i];if(ci>=0){chunks[ci].alive=false;chunks[ci].count=0}
      vox[i]=0;owner[i]=0;vdmg[i]=0;chunkOf[i]=-1;touch(i);if(z<=1)markWalk(x,y);
      if(rnd()<.45)debrisPiece(x+.5,y+.5,z+.5,colorOf(9,g));if(rnd()<.2)smoke(x+.5,y+.5,z+.5,1,[150,140,125]);if(rnd()<.2)sparks(x+.5,y+.5,z+.5,3,[255,200,120])}
    addShake(.4);
    if(zone.opening===k)zone.opening=-1;if(zone.open<k+1)zone.open=k+1;
    flushWalk();spawnCells=openCells();
    emitNet(["z",k,ZS[k].name]);toast(ZS[k].name+" is open: the sector grows","var(--cyan)");
  }
  function updateZones(){if(zone.opening>=0&&tick>=zone.openAt)openZone(zone.opening)}
  function voxColor(i){return colorOf(vox[i],structures[owner[i]])}

  /* Walk grid and flow fields (rebuilt when terrain changes, like a local navmesh rebake). Collapses mark the
     cells they touched, and one rebuild per tick covers just that box. */
  function rebuildWalk(x0,y0,x1,y1){
    if(x0===undefined){x0=0;y0=0;x1=W-1;y1=D-1}
    for(var y=y0;y<=y1;y++)for(var x=x0;x<=x1;x++)walk[x+y*W]=(!get(x,y,0)&&!get(x,y,1))?1:0;
  }
  function markWalk(x,y){if(!wbox)wbox=[x,y,x,y];else{if(x<wbox[0])wbox[0]=x;if(y<wbox[1])wbox[1]=y;if(x>wbox[2])wbox[2]=x;if(y>wbox[3])wbox[3]=y}}
  function flushWalk(){if(!wbox)return;rebuildWalk(wbox[0],wbox[1],wbox[2],wbox[3]);wbox=null;fieldsDirty=true}
  function blockedCell(cx,cy){return cx<0||cy<0||cx>=W||cy>=D||!walk[cx+cy*W]}
  function flowField(tx,ty,out){
    out=out||new Float32Array(W*D);out.fill(1e9);
    tx=Math.floor(tx);ty=Math.floor(ty);if(blockedCell(tx,ty))return out;
    var q=[tx+ty*W],head=0;out[q[0]]=0;
    while(head<q.length){
      var c=q[head++],cx=c%W,cy=(c/W)|0,cd=out[c];
      for(var k=0;k<8;k++){
        var nx=cx+N8[k][0],ny=cy+N8[k][1];if(blockedCell(nx,ny))continue;
        if(k>3&&(blockedCell(cx+N8[k][0],cy)||blockedCell(cx,cy+N8[k][1])))continue;
        var nd=cd+(k>3?1.414:1),ni=nx+ny*W;if(nd<out[ni]){out[ni]=nd;q.push(ni)}
      }
    }
    return out;
  }
  function stepToward(field,x,y){
    var cx=Math.floor(x),cy=Math.floor(y),best=field[cx+cy*W],bx=cx,by=cy;
    for(var k=0;k<8;k++){
      var nx=cx+N8[k][0],ny=cy+N8[k][1];if(blockedCell(nx,ny))continue;
      if(k>3&&(blockedCell(cx+N8[k][0],cy)||blockedCell(cx,cy+N8[k][1])))continue;
      var v=field[nx+ny*W];if(v<best){best=v;bx=nx;by=ny}
    }
    return [bx+.5,by+.5];
  }
  function walkableCells(){var a=[];for(var i=0;i<W*D;i++)if(walk[i])a.push([i%W+.5,((i/W)|0)+.5]);return a}
  function openCells(){var ox=openX();return walkableCells().filter(function(c){return c[0]<ox})}   /* street cells in open zones: where bots, loaders and pods come down */

  function hitVoxel(x,y,z,dmg,hx,hy,hz){
    x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(!inB(x,y,z))return;
    if(hx===undefined){hx=x;hy=y;hz=z}
    var i=vi(x,y,z),m=vox[i];if(!m)return;
    vdmg[i]+=dmg*T.structural;world.rev++;
    sparks(hx,hy,hz,4,MAT[m].glow?[120,240,255]:[255,210,120]);
    if(vdmg[i]>=MAT[m].hp)removeVoxel(i,x,y,z);
  }
  function removeVoxel(i,x,y,z){
    var c=voxColor(i),ci=chunkOf[i];vox[i]=0;owner[i]=0;vdmg[i]=0;chunkOf[i]=-1;touch(i);goneBy[i]=curBy;
    if(curBy>=0){var vs=st(curBy);if(vs)vs.voxels++}
    if(z<=1)markWalk(x,y);
    for(var k=0;k<3;k++)debrisPiece(x+.5,y+.5,z+.5,c);
    smoke(x+.5,y+.5,z+.5,1,[140,136,128]);
    if(ci>=0){var ch=chunks[ci];ch.count--;if(ch.alive&&ch.count<(ch.pillar?T.chunk.pillarBreakAt:T.chunk.breakAt)*ch.init)breakChunk(ch)}
  }

  /* ----- chunks: 4x4x4 cells, one structure per chunk, linked into a support graph ----- */
  /* Two different deck spans never hold each other up: that is the expansion joint. */
  function linked(a,b){var sa=structures[owner[a]],sb=structures[owner[b]];return !(sa&&sb&&sa.span&&sb.span&&sa!==sb)}
  /* Load only travels up into what rests on top, or sideways and down within one structure, so a span can't
     hang off a pillar stump that is itself held up by the next span. */
  function carries(a,b,dz){return dz>0||owner[a]===owner[b]||(dz===0&&linked(a,b))}
  function buildChunks(){
    var key={},x,y,z,i,c;chunks.length=0;chunkOf.fill(-1);
    function ck(cx,cy,cz,s){return (cx+cy*CXN+cz*CXN*CYN)*65536+s}
    for(z=0;z<H;z++)for(y=0;y<D;y++)for(x=0;x<W;x++){
      i=vi(x,y,z);if(!vox[i])continue;
      var cx=(x/CS)|0,cy=(y/CS)|0,cz=(z/CS)|0,k=ck(cx,cy,cz,owner[i]);c=key[k];
      if(!c){c=key[k]={id:chunks.length,s:owner[i],cx:cx,cy:cy,cz:cz,v:[],count:0,init:0,alive:true,support:false,
        pillar:structures[owner[i]].kind==="pillar",below:-1,out:[],nb:[]};chunks.push(c)}
      chunkOf[i]=c.id;c.v.push(i);c.count++;if(z===0)c.support=true;
    }
    chunks.forEach(function(c){
      c.init=c.count;if(c.pillar)c.support=true;
      if(c.pillar&&c.cz>0){var b=key[ck(c.cx,c.cy,c.cz-1,c.s)];if(b)c.below=b.id}
    });
    /* edges follow the voxel rules: a chunk passes load to a neighbour chunk when any touching voxel pair would */
    chunks.forEach(function(c){c.v.forEach(function(i){
      var x=i%W,y=((i/W)|0)%D,z=(i/(W*D))|0;
      for(var k=0;k<6;k++){
        var nx=x+NB6[k][0],ny=y+NB6[k][1],nz=z+NB6[k][2];if(!inB(nx,ny,nz))continue;
        var j=vi(nx,ny,nz),b=chunkOf[j];if(b<0||b===c.id)continue;
        if(linked(i,j)&&carries(i,j,NB6[k][2])&&c.out.indexOf(b)<0)c.out.push(b);
      }})});
    chunks.forEach(function(c){c.out.forEach(function(b){var o=chunks[b];if(c.nb.indexOf(b)<0)c.nb.push(b);if(o.nb.indexOf(c.id)<0)o.nb.push(c.id)})});
    structures.forEach(function(s){if(s&&s.kind==="pillar")s.gc=[]});
    chunks.forEach(function(c){if(c.pillar&&c.cz===0)structures[c.s].gc.push(c.id)});
    reachC=new Uint8Array(chunks.length);
  }
  /* A broken chunk turns into debris and leaves the graph; the next support check sees the hole. */
  function breakChunk(c){
    c.alive=false;var n=0,fx=0,fy=0,fz=0;
    for(var k=0;k<c.v.length;k++){
      var i=c.v[k];if(!vox[i]||chunkOf[i]!==c.id)continue;
      var x=i%W,y=((i/W)|0)%D,z=(i/(W*D))|0,col=voxColor(i);
      for(var d=0;d<2&&debris.length<T.debrisCap;d++)debrisPiece(x+.5,y+.5,z+.5,col);
      vox[i]=0;owner[i]=0;vdmg[i]=0;chunkOf[i]=-1;touch(i);if(z<=1)markWalk(x,y);goneBy[i]=curBy;
      n++;fx+=x;fy+=y;fz+=z;
    }
    c.count=0;supportDirty=true;lastBreakBy=curBy;
    if(n){sparks(fx/n+.5,fy/n+.5,fz/n+.5,10,[255,200,120]);smoke(fx/n+.5,fy/n+.5,fz/n+.5,3,[140,136,128]);addShake(.08)}
    propBreak(c);   /* phase 5 */
  }

  /* ----- supports and collapse ----- */
  function isAnchor(c){return c.alive&&c.support&&(!c.pillar||c.cz===0||(c.below>=0&&chunks[c.below].alive))}
  function pillarIsDown(s){for(var k=0;k<s.gc.length;k++)if(chunks[s.gc[k]].alive)return false;return true}
  /* Flood over the chunk graph from the anchors; every live chunk it misses is loose. */
  function checkSupports(){
    var t0=clock(),i,q=[],loose=[];supportDirty=false;bigFall=false;
    reachC.fill(0);
    for(i=0;i<chunks.length;i++)if(isAnchor(chunks[i])){reachC[i]=1;q.push(i)}
    for(var h=0;h<q.length;h++){var o=chunks[q[h]].out;for(var k=0;k<o.length;k++){var b=o[k];if(!reachC[b]&&chunks[b].alive){reachC[b]=1;q.push(b)}}}
    for(i=0;i<chunks.length;i++)if(chunks[i].alive&&!reachC[i])loose.push(i);
    /* loose chunks that touch each other fall as one piece */
    for(i=0;i<loose.length;i++){
      if(reachC[loose[i]]===2)continue;
      var g=[loose[i]],idx=[];reachC[loose[i]]=2;
      for(h=0;h<g.length;h++){
        var c=chunks[g[h]];c.alive=false;
        c.v.forEach(function(j){if(vox[j]&&chunkOf[j]===c.id)idx.push(j)});
        c.nb.forEach(function(b){if(chunks[b].alive&&!reachC[b]){reachC[b]=2;g.push(b)}});
      }
      if(idx.length)makeCluster(idx);
    }
    var down=0;
    structures.forEach(function(s){if(s&&s.kind==="pillar"&&pillarIsDown(s))down++});
    if(down>pillarsDown&&!bigFall)toast(down===1?"Pillar down: break a neighbour and the road falls":"Pillar down","var(--hazard)");
    pillarsDown=down;
    chk.last=clock()-t0;chk.n++;if(chk.last>chk.max)chk.max=chk.last;
  }
  function makeCluster(idx){
    var hz=hazardInfo(idx);   /* phase 5: read the props in the piece before its voxels are cleared */
    var cols=idx.map(function(i){return voxColor(i)}),g=clusterGeom(idx,cols),span=idx.some(function(i){var o=structures[owner[i]];return o&&o.span});
    idx.forEach(function(i){var z=(i/(W*D))|0;if(z<=1)markWalk(i%W,((i/W)|0)%D)});
    idx.forEach(function(i){vox[i]=0;owner[i]=0;vdmg[i]=0;chunkOf[i]=-1;touch(i);goneBy[i]=lastBreakBy});
    var c={id:++cid,vs:g.vs,foot:g.foot,off:0,vz:0,creak:T.collapse.warn,t:0,by:lastBreakBy};clusters.push(c);
    var cs=c.by>=0&&st(c.by);if(cs&&span)cs.spans++;
    hazardCluster(c,hz,span);   /* phase 5 */
    emitNet(["c",c.id,idx,cols.map(packCol)]);
    if(c.vs.length>30){bigFall=true;toast("Collapse! Get out of the red","var(--bad)")}
  }
  function updateClusters(dt){
    shake=Math.max(0,shake-dt*1.6);
    for(var ci=clusters.length-1;ci>=0;ci--){
      var c=clusters[ci];c.t+=dt;
      if(c.creak>0){c.creak-=dt;
        if(rnd()<.6){var v=c.vs[(rnd()*c.vs.length)|0];emit(["s",v.x+rnd(),v.y+rnd(),v.z,1,[170,160,140]])}
        continue}
      c.vz-=T.collapse.gravity*dt;var no=c.off+c.vz*dt,hit=false;
      for(var k=0;k<c.vs.length&&!hit;k++){var v2=c.vs[k],bz=v2.z+no;if(bz<0||get(v2.x,v2.y,Math.floor(bz)))hit=true}
      if(hit){land(c,Math.floor(no)+1);clusters.splice(ci,1)}else c.off=no;
    }
  }
  function land(c,L){
    var C=T.collapse,footSet={};c.foot.forEach(function(f){footSet[f]=1});
    addShake(.25+c.vs.length/150);
    var crushed=0,src={by:c.by,kind:"collapse"};
    var hitE=function(e){if(e.hp>0&&!e.dropping&&!aloft(e)&&footSet[Math.floor(e.x)+Math.floor(e.y)*W]){
      if(e.team){hitEnemy(e,C.botDmg*lvm("hp"),src,e.x,e.y,1);if(e.hp<=0)crushed++}else hitMech(e,C.playerDmg,{kind:"collapse"},e.x,e.y,1)}};
    bots.forEach(hitE);players.forEach(hitE);
    var cs=c.by>=0&&st(c.by);if(cs&&crushed>cs.bestCrush)cs.bestCrush=crushed;
    var occupied={};players.concat(bots).forEach(function(e){if(e.hp>0)for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++)occupied[Math.floor(e.x+dx*e.r)+Math.floor(e.y+dy*e.r)*W]=1});
    var rubble=structure("rubble",null);
    c.vs.sort(function(a,b){return a.z-b.z});
    c.vs.forEach(function(v){
      var z=v.z+L;
      if(z<=1&&!occupied[v.x+v.y*W]&&inB(v.x,v.y,z)&&!get(v.x,v.y,z)&&(z===0||get(v.x,v.y,z-1))&&hash(v.x,v.y,z+50)<C.rubbleKeep){
        var i=vi(v.x,v.y,z);vox[i]=10;owner[i]=rubble.id;touch(i);
      } else if(rnd()<.55)debrisPiece(v.x+.5,v.y+.5,z+.5,v.col);
      if(rnd()<.25)smoke(v.x+.5,v.y+.5,z+.3,1,[150,140,125]);
    });
    var mid=c.vs[(c.vs.length/2)|0],n=Math.round((C.scrap[0]+((rnd()*(C.scrap[1]-C.scrap[0]+1))|0))*dropMul());
    for(var k=0;k<n&&c.vs.length>6;k++)scraps.push({x:mid.x+.5,y:mid.y+.5,z:.6,vx:(rnd()-.5)*5,vy:(rnd()-.5)*5,vz:3+rnd()*2,t:0,spin:rnd()*6,src:run.overtime?"overtime":"collapse"});
    world.rev++;c.foot.forEach(function(f){markWalk(f%W,(f/W)|0)});
    hazardLanded(c,L,crushed);   /* phase 5: CRUSHED, SPAN DOWN, slag spill */
  }

  /* ===== phase 5: city hazards (GDD-D41, Destruction and environment: Hazard props). Every prop falls through the
     normal support rule above; this block adds what happens around a fall. A cluster carries c.by, the mech whose hit
     broke the last chunk under it (-1: nobody, e.g. a loader's plow or an enemy's shot), and its landing, CRUSHED
     count, spill and props stat all go to that mech.
     - Container stacks: a container is one box (T.hazard.wholeBox), so breaking any chunk of it destroys the whole
       box and the containers stacked on it fall as a collapse.
     - Slag spill: each vat in a piece that lands leaves a T.slag.size square pool for T.slag.time s, centred on where
       the vat came down. Every T.slag.pulse s it burns enemies in it (T.slag.botDps a second x the level's hp scale,
       kind "hazard", credited to the vat breaker) and mechs in it (T.slag.mechDps a second, kind "slag", plus
       T.slag.heat heat a second; x T.slag.skids for a mech whose part flag p.skids is set). One pool per entity per tick.
     - Events: ["cr",id,kills,x,y,by,"collapse"|"slag"] CRUSHED, one per landed piece or per pool (sent when the pool
       cools), only when it killed something; ["sd",clusterId,x,y,by] a deck span landed; ["sp",poolId,x,y,by] a vat spilled. */
  var PROP_KINDS={container:1,crane:1,tank:1,sign:1,vat:1,gallery:1};
  var pools=[];sim.pools=pools;
  /* the props in a loose piece, read before makeCluster clears its voxels: vats by structure, with their lowest corner */
  function hazardInfo(idx){
    var o={props:false,vats:{}};
    for(var k=0;k<idx.length;k++){var i=idx[k],s=structures[owner[i]];if(!s||!PROP_KINDS[s.kind])continue;o.props=true;
      if(s.kind!=="vat")continue;
      var x=i%W,y=((i/W)|0)%D,z=(i/(W*D))|0,v=o.vats[s.id]||(o.vats[s.id]={x0:x,y0:y,x1:x,y1:y,z0:z});
      v.x0=Math.min(v.x0,x);v.y0=Math.min(v.y0,y);v.x1=Math.max(v.x1,x);v.y1=Math.max(v.y1,y);v.z0=Math.min(v.z0,z)}
    o.vats=Object.keys(o.vats).map(function(k){return o.vats[k]});
    return o;
  }
  function hazardCluster(c,hz,span){
    c.span=!!span;c.vats=hz.vats;c.prop=hz.props;
    var s=hz.props&&c.by>=0&&st(c.by);if(s)s.props++;
  }
  /* a container is one box: the rest of it goes with the broken chunk */
  function propBreak(c){
    if(!T.hazard.wholeBox)return;var s=structures[c.s];if(!s||s.kind!=="container")return;
    for(var k=0;k<chunks.length;k++){var o=chunks[k];if(o.alive&&o.s===c.s)breakChunk(o)}
  }
  function emitCrushed(id,n,x,y,by,what){
    if(n<=0)return;emitNet(["cr",id,n,r2(x),r2(y),by,what]);
    var s=by>=0&&st(by);if(s&&n>s.bestCrush)s.bestCrush=n;
  }
  function hazardLanded(c,L,n){
    var fx=0,fy=0;c.foot.forEach(function(f){fx+=f%W+.5;fy+=((f/W)|0)+.5});fx/=c.foot.length||1;fy/=c.foot.length||1;
    emitCrushed(c.id,n,fx,fy,c.by,"collapse");
    if(c.span)emitNet(["sd",c.id,r2(fx),r2(fy),c.by]);
    (c.vats||[]).forEach(function(v){
      var S=T.slag,cx=(v.x0+v.x1+1)/2,cy=(v.y0+v.y1+1)/2,o={id:++cid,x:cx,y:cy,x0:cx-S.size/2,y0:cy-S.size/2,x1:cx+S.size/2,y1:cy+S.size/2,
        z:Math.max(0,v.z0+L),t:S.time,by:c.by,kills:0};
      pools.push(o);emitNet(["sp",o.id,r2(cx),r2(cy),c.by]);
      sparks(cx,cy,o.z+.3,24,[255,140,50]);smoke(cx,cy,o.z+.4,8,[120,80,60]);
    });
  }
  function inPool(o,e){var z=e.z||0;return e.x>=o.x0&&e.x<o.x1&&e.y>=o.y0&&e.y<o.y1&&z>=o.z-1.5&&z<=o.z+.5}
  /* damage carried as a fraction per entity, so each pulse deals a whole number and the rate per second is exact */
  function slagShare(e,amt){amt+=e.slagC||0;var n=Math.floor(amt+1e-9);e.slagC=amt-n;return n}
  function updatePools(dt){
    if(!pools.length)return;
    var S=T.slag,pt=Math.max(1,Math.round(S.pulse*60)),pulse=tick%pt===0,per=pt/60;
    for(var i=pools.length-1;i>=0;i--){
      var o=pools[i];o.t-=dt;
      if(rnd()<.3)emit(["s",o.x0+rnd()*(o.x1-o.x0),o.y0+rnd()*(o.y1-o.y0),o.z+.05,1,[255,150,60]]);
      if(pulse&&o.t>0){
        var src={by:o.by,kind:"hazard",hz:"slag"};
        bots.forEach(function(b){
          if(b.hp<=0||b.dropping||aloft(b)||b.slagT===tick||!inPool(o,b))return;b.slagT=tick;
          var d=slagShare(b,S.botDps*lvm("hp")*per);if(d<=0)return;
          hitEnemy(b,d,src,b.x,b.y,(b.z||0)+.6);if(b.hp<=0){o.kills++;var s=o.by>=0&&st(o.by);if(s&&o.kills>s.bestCrush)s.bestCrush=o.kills}
        });
        players.forEach(function(q){
          if(q.hp<=0||q.slagT===tick||!inPool(o,q))return;q.slagT=tick;
          var f=q.skids?S.skids:1,d=slagShare(q,S.mechDps*f*per);
          addHeat(q,S.heat*f*per/(q.heatMul||1));   /* T.slag.heat is heat points, not scaled by the mech's heat stat */
          if(d>0)hitMech(q,d,{kind:"slag"},q.x,q.y,1);
        });
      }
      if(o.t<=0){emitCrushed(o.id,o.kills,o.x,o.y,o.by,"slag");pools.splice(i,1)}
    }
  }
  /* test hooks: a level-scaled patrol bot standing at x,y; run fn as if mech `by` were hitting (voxel breaks credit it) */
  sim.spawnBot=function(x,y){var b=newBot();b.x=x;b.y=y;b.z=0;b.vz=0;b.dropping=false;bots.push(b);return b};
  sim.asMech=function(by,fn){var was=curBy;curBy=by;try{fn()}finally{curBy=was}};
  /* ===== end phase 5 ===== */

  /* ----- entities. Player and bots share one shape: position, velocity, armor, radius, height, team. ----- */
  function upMul(id){return 1+T.upgrade.dmg*((this.upg&&this.upg[id])|0)}   /* GDD-D23: the hit path multiplies a weapon's damage to enemies by this */
  function newPlayer(build,idx){
    var d=deriveStats(build,T,wearOf[idx||0]),u={},uo=upgOf[idx||0]||{};
    for(var id in uo)if(isWeapon(id)&&uo[id]>0)u[id]=Math.min(T.upgrade.price[PART[id].rarity].length,uo[id]|0);
    return bpPlayer({team:0,idx:idx||0,upg:u,upMul:upMul,taken:0,x:MAP.spawn[idx?1:0][0],y:MAP.spawn[idx?1:0][1],z:0,vx:0,vy:0,r:T.player.radius,h:T.player.height,hp:d.maxHp,maxHp:d.maxHp,scrap:0,
      v:cloneBuild(build),spd:d.spd,acc:d.acc,legT:d.legT,torT:d.torT,dmgMul:d.dmgMul,atbRate:d.atbRate,drain:d.drain,heatMul:d.heatMul,gun:d.gun,pileKind:d.pile,noDash:d.noDash,immune:d.immune,
      q:d.q,sq:0,qPrev:false,magnet:d.magnet,dashMul:d.dashMul,dashHeat:d.dashHeat,regen:d.regen,calm:0,
      leg:Math.PI*.75,aim:Math.PI*.75,step:0,heat:0,over:0,cool:0,dash:0,dashCd:0,flash:0,muzzle:0,ax:16,ay:16,az:.6,
      atb:0,ring:-1,retract:0,pileT:0,cue:0,pileRes:"",oc:0,field:null,rPrev:false,combo:1,comboT:0,mkN:0,mkT:-1e9,mkRec:null});
  }
  function mkInput(){return {k:0,ax:16,ay:16,az:.6,l:false,r:false,rp:false,seq:-1,at:0}}
  function newBot(){
    var c=pickSpawn();
    return {team:1,x:c[0],y:c[1],z:T.bot.dropHeight,vz:0,dropping:true,vx:0,vy:0,r:T.bot.radius,h:T.bot.height,
      hp:Math.round(T.bot.hp*lvm("hp")),maxHp:Math.round(T.bot.hp*lvm("hp")),head:rnd()*6.28,aim:rnd()*6.28,state:"patrol",wp:null,wpField:null,cd:1+rnd(),
      lost:0,flash:0,strafe:rnd()<.5?1:-1,strafeT:0,step:0};
  }
  function newLoader(){
    var L=T.loader,c=pickSpawn(),a=spawnCells[(rnd()*spawnCells.length)|0],d=spawnCells[(rnd()*spawnCells.length)|0];
    return {team:1,loader:true,armored:true,x:c[0],y:c[1],z:T.bot.dropHeight,vz:0,dropping:true,vx:0,vy:0,r:L.radius,h:L.height,
      hp:Math.round(L.hp*lvm("hp")),maxHp:Math.round(L.hp*lvm("hp")),head:rnd()*6.28,aim:0,state:"patrol",route:[a,d],ri:0,wp:null,wpField:null,lost:0,flash:0,step:0,
      t:0,cd:0,cx:1,cy:0,hit:false};
  }
  function pickSpawn(){
    var best=null;
    for(var t=0;t<40;t++){var c=spawnCells[(rnd()*spawnCells.length)|0],far=true;
      players.forEach(function(q){if(q.hp>0&&Math.hypot(c[0]-q.x,c[1]-q.y)<=10)far=false});
      if(far){best=c;break}}
    return best||spawnCells[0];
  }
  function nearestPlayer(x,y){
    var best=null,bd=1e9;
    for(var i=0;i<players.length;i++){var q=players[i];if(q.hp<=0)continue;var d=Math.hypot(q.x-x,q.y-y);if(d<bd){bd=d;best=q}}
    return best||players[0];
  }

  /* Waves: a wave is a queue of drops released one stagger apart; it is cleared when the queue is empty and nobody is alive. */
  function beginWave(n,quiet){
    var ot=n>T.waves.length,w=ot?overtimeWave():T.waves[n-1],q=[],np;run.wave=n;run.asWave=ot?T.overtime.wave:n;run.breather=0;run.spawnT=0;run.done=false;
    var nboss=(w.boss||0)+(w.boss?T.match.extraSnipers:0),k;   /* Sniper's nest: one more Bounty sniper on each boss wave (GDD-D39) */
    bossQueue(q,w,n);   /* phase 7: the climb plan's boss for this wave (GDD-D51) */
    var nl=Math.round((w.loaders||0)*lvm("count")),nb=Math.round(w.bots*lvm("count"))+T.match.extraBots;   /* Scrap storm: one more bot */
    for(k=0;k<nl;k++)q.push("loader");
    for(k=0;k<nb;k++)q.push("bot");
    zoneSlots(q,run.asWave);   /* phase 4: zone threats swap slots and set the drop order (Overtime uses wave 4's rows) */
    run.queue=q;run.waveT=0;run.podAt=[];
    for(k=0,np=T.pods.perWave+(rnd()<T.pods.extra?1:0);k<np;k++)run.podAt.push(T.pods.window[0]+rnd()*(T.pods.window[1]-T.pods.window[0]));
    run.podAt.sort(function(a,b){return a-b});
    if(!quiet)toast(ot?"Overtime: drops x"+T.overtime.scrap+", clear it to extract":w.boss?"Wave "+n+": "+BOSSES[run.boss].name+(nboss>1?" + "+(nboss-w.boss)+" Bounty sniper":""):"Wave "+n,ot?"var(--hazard)":w.boss?"var(--cyan)":"var(--fg)");
  }
  function updateWave(dt){
    var R=run;
    if(R.done){if((R.exitT-=dt)<=0)extract();return}
    R.clock+=dt;
    if(R.breather>0){if((R.breather-=dt)<=0)beginWave(R.wave+1);return}
    R.waveT+=dt;
    while(R.podAt.length&&R.waveT>=R.podAt[0]){R.podAt.shift();randomPod()}
    if(R.queue.length){
      if((R.spawnT-=dt)<=0){R.spawnT=T.wave.stagger;var kind=R.queue.shift();if(!spawnBoss(kind)&&!spawnZone(kind))bots.push(kind==="boss"?newBoss():kind==="loader"?newLoader():newBot())}
    } else if(!bots.length){
      toast(R.wave>T.waves.length?"Overtime cleared":"Wave "+R.wave+" cleared","var(--good)");
      players.forEach(function(q){var s=st(q.idx);if(s)s.time=Math.round(R.waveT*10)/10});
      emitNet(["w",R.wave,players.map(function(q){return st(q.idx)})]);
      contractWave(R.wave);
      if(R.wave>T.waves.length){R.otCleared=true;R.done=true;R.exitT=T.wave.exit}   /* Overtime cleared: extract, no revive after it */
      else if(R.wave>=T.waves.length)enterChoose();   /* wave 5: Extract or Overtime (GDD-D37) */
      else{R.breather=T.wave.breather;revive()}
    }
  }
  function extract(){
    contractEnd();   /* Close shave and Clean sweep are decided here; a contract still open fails */
    scraps.forEach(function(s){nearestPlayer(s.x,s.y).scrap++});   /* whatever is still on the floor goes to the nearest mech */
    scrap+=scraps.length;scraps.length=0;
    var got=scrap,per=players.map(function(q){return q.scrap}),dmg=players.map(function(q){return Math.round(q.taken)}),win=level>=T.level.max;
    scrap=0;state=win?"victory":"extracted";   /* extracting the last level wins the campaign (GDD-D47); it banks like an extract */
    emit(["o",state,(win?"Level "+level+" cleared: the sector is yours. You banked ":"Level "+level+" cleared. You banked ")+got+" scrap"+(players.length>1?" ("+per.join(" + ")+")":"")+
      (win?". Parts, upgrades and banked scrap stay for the next climb.":". Repair and shop in the garage, then drop into level "+(level+1)+"."),got,matchDetail({result:state,level:level,scrap:per,damage:dmg,stats:stats,records:players.map(function(q){return recordsOf(q.idx)}),callins:callinReport(false)})]);
  }
  /* Drop pods: a marker and countdown, then the crate falls like a bot does and waits to be touched. */
  function spawnPod(type,x,y,counting){
    var P=T.pods,o={type:type,x:x,y:y,z:counting?P.dropHeight:0,vz:0,t:counting?P.countdown:0,landed:!counting,field:null,ft:0};
    pods.push(o);return o;
  }
  function randomPod(){
    var cs=openCells().filter(function(c){return players.every(function(q){return q.hp<=0||Math.hypot(c[0]-q.x,c[1]-q.y)>=T.pods.minDist})});
    if(!cs.length)return;
    var c=cs[(rnd()*cs.length)|0],o=spawnPod(drawPodType(),c[0],c[1],true);
    if(o){o.wave=1;run.podsDropped++}   /* a wave pod: Clean sweep counts these */
  }
  function applyPod(o,e){
    var P=T.pods,amt=Math.round(e.maxHp*P.heal);
    if(o.type==="repair"){e.hp=Math.min(e.maxHp,e.hp+amt);floatText(e.x,e.y,2,"+"+amt,"#7fdc6a")}
    else if(o.type==="overclock"){e.oc=P.overclock.time;floatText(e.x,e.y,2,"OVERCLOCK","#3fd6e8")}
    else podEffect(o,e);   /* phase 6: Scrap cache, Strike beacon */
    sparks(o.x,o.y,.5,12,[63,214,232]);
    /* a called-in pod taken by an enemy counts as stolen from the mech that called it */
    if(e.team===0){var ps=st(e.idx);if(ps)ps.pods.taken++}else{e.podCarrier=true;var ns=st(o.by>=0?o.by:nearestPlayer(e.x,e.y).idx);if(ns)ns.pods.stolen++}
    if(o.wave){if(e.team===0)run.podsTaken++;else run.podsLost++}
    if(e.team===0)toast(o.type==="repair"?"Field repair: +"+amt+" armor":o.type==="overclock"?"Overclock: ATB x"+P.overclock.mult+" for "+P.overclock.time+" s":podToast(o),"var(--cyan)",e.idx);
    else toast((e.label||(e.loader?"Loader":"Patrol bot"))+(o.type==="strike"?" took a Strike beacon: get clear of the line":o.type==="cache"?" took a Scrap cache: it carries the cubes":" took a pod"),"var(--hazard)");
  }
  function updatePods(dt){
    var P=T.pods;
    for(var i=pods.length-1;i>=0;i--){
      var o=pods[i];
      if(!o.landed){
        if(o.t>0){o.t-=dt;continue}
        o.vz-=P.fall*dt;o.z+=o.vz*dt;
        if(o.z<=0){o.z=0;o.landed=true;smoke(o.x,o.y,.1,10,[150,140,120]);sparks(o.x,o.y,.2,8,[255,200,120]);addShake(.18);emit(["p",o.x,o.y])}
        continue;
      }
      if(!o.field||(o.ft-=dt)<=0){o.field=flowField(o.x,o.y,o.field);o.ft=.5}
      var taker=null,td=P.touch;   /* players are checked first and the nearest one wins a same-frame tie */
      for(var pi=0;pi<players.length;pi++){var q=players[pi];if(q.hp<=0)continue;var d=Math.hypot(q.x-o.x,q.y-o.y);if(d<td){td=d;taker=q}}
      if(!taker)for(var j=0;j<bots.length&&!taker;j++){var b=bots[j];if(b.hp>0&&!b.boss&&!b.noPods&&!b.dropping&&Math.hypot(b.x-o.x,b.y-o.y)<P.touch)taker=b}
      if(taker){pods.splice(i,1);applyPod(o,taker)}
    }
  }
  function podFor(b){
    var best=null,bd=1e9,low=b.hp<b.maxHp*.5||!!T.match.podSeekAny;   /* Pod rain: patrol bots go for a pod at any health */
    pods.forEach(function(o){if(!o.landed||!o.field)return;var d=Math.hypot(o.x-b.x,o.y-b.y),np=nearestPlayer(o.x,o.y);
      if(d<bd&&(low||d<Math.hypot(o.x-np.x,o.y-np.y))){bd=d;best=o}});
    return best;
  }
  /* Bounty sniper: a bot variant that perches on roof edges, so the minigun can reach it from range. */
  function aloft(b){return b.boss&&b.z>.05||!!b.air}   /* phase 7: the Warden's body and platforms (air) are never on the street */
  function los3(ax,ay,az,bx,by,bz){
    var dx=bx-ax,dy=by-ay,dz=bz-az,n=Math.ceil(Math.hypot(dx,dy,dz)/.25);
    for(var k=1;k<n;k++){var t=k/n;if(solidAt(ax+dx*t,ay+dy*t,az+dz*t))return false}
    return true;
  }
  function perches(){
    var a=[],ox=openX();   /* roofs in open zones only */
    for(var y=1;y<D-1;y++)for(var x=1;x<ox;x++)for(var z=H-1;z>=1;z--){
      var m=vox[vi(x,y,z)];if(!m)continue;
      if(m===7&&(!get(x-1,y,z)||!get(x+1,y,z)||!get(x,y-1,z)||!get(x,y+1,z)))a.push([x+.5,y+.5,z+1]);
      break;
    }
    return a;
  }
  function pickPerch(cx,cy,minD,maxD,ok){   /* ok: optional filter (phase 7: a Sniper pair keeps apart) */
    var pl=nearestPlayer(cx,cy),a=perches().filter(function(c){var d=Math.hypot(c[0]-cx,c[1]-cy);return d>=minD&&d<=maxD&&Math.hypot(c[0]-pl.x,c[1]-pl.y)>=T.wave.perchMin*.5&&(!ok||ok(c))});
    var see=a.filter(function(c){return los3(c[0],c[1],c[2]+.8,pl.x,pl.y,.9)}),pool=see.length?see:a;
    return pool.length?pool[(rnd()*pool.length)|0]:null;
  }
  function newBoss(o){   /* o (phase 7): {hard: the wave-5 variant, pair: the Sniper pair group it joins} */
    o=o||{};var ok=o.pair?pairOk(o.pair,null):null;
    var B=T.boss,lp=players.filter(function(q){return q.hp>0}),A=lp.length?lp[(rnd()*lp.length)|0]:players[0],c=pickPerch(A.x,A.y,T.wave.perchMin,16,ok)||pickPerch(A.x,A.y,0,99,ok)||[spawnCells[0][0],spawnCells[0][1],0];
    return bossSetup({team:1,boss:true,x:c[0],y:c[1],z:c[2],vz:0,dropping:false,vx:0,vy:0,r:B.radius,h:B.height,hp:Math.round(B.hp*lvm("hp")),maxHp:Math.round(B.hp*lvm("hp")),
      head:0,aim:0,state:"boss",flash:0,step:0,mode:"perch",cd:1.2,tell:0,blind:0,stun:0,jt:0,fallZ:0,
      jumpCd:B.jump[0]+rnd()*(B.jump[1]-B.jump[0])},o);
  }
  function groundZ(x,y,z){for(var k=Math.floor(z-.01);k>=0;k--)if(get(Math.floor(x),Math.floor(y),k))return k+1;return 0}
  function groundNear(x,y){
    for(var r=0;r<8;r++)for(var dy=-r;dy<=r;dy++)for(var dx=-r;dx<=r;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
      var cx=Math.floor(x)+dx,cy=Math.floor(y)+dy;if(!blockedCell(cx,cy))return [cx+.5,cy+.5];
    }
    return [x,y];
  }
  function updateBoss(b,dt){
    var B=T.boss,p=nearestPlayer(b.x,b.y),alive=p.hp>0,dist=alive?Math.hypot(p.x-b.x,p.y-b.y):99;
    if(b.stun>0){b.stun-=dt;if(rnd()<.2)sparks(b.x,b.y,b.z+1.1,1,[255,230,120])}
    if(b.mode==="jump"){
      var u=Math.min(1,(b.jt+=dt)/B.jumpTime);
      b.x=b.j0[0]+(b.j1[0]-b.j0[0])*u;b.y=b.j0[1]+(b.j1[1]-b.j0[1])*u;
      b.base=b.j0[2]+(b.j1[2]-b.j0[2])*u;b.z=b.base+B.jumpArc*4*u*(1-u);
      if(alive)b.aim=angTo(b.aim,Math.atan2(p.y-b.y,p.x-b.x),6,dt);
      if(u>=1){b.mode="perch";b.z=b.j1[2];smoke(b.x,b.y,b.z+.1,6,[150,140,120]);b.cd=Math.max(b.cd,.8);b.blind=0;
        b.jumpCd=B.jump[0]+rnd()*(B.jump[1]-B.jump[0])}
      return;
    }
    if(b.mode==="fall"){
      b.vz-=T.collapse.gravity*dt;b.z+=b.vz*dt;var g=groundZ(b.x,b.y,b.z);
      if(b.z<=g){
        b.z=g;b.mode="perch";smoke(b.x,b.y,g+.1,10,[150,140,120]);sparks(b.x,b.y,g+.2,8,[255,200,120]);
        if(b.fallZ-g>=B.fallMin){b.stun=B.stun;b.tell=0;hitEnemy(b,B.fallDmg,{kind:"hazard"},b.x,b.y,g+1);if(b.hp>0)toast("Sniper brought down","var(--hazard)")}
      }
      return;
    }
    /* perched: the voxel under its feet is gone, so it falls */
    if(b.z>.05&&b.mode!=="ride"&&!solidAt(b.x,b.y,b.z-.5)){b.mode="fall";b.vz=0;b.fallZ=b.z;b.tell=0;evicted(perchBy(b));return}
    if(alive)b.aim=angTo(b.aim,Math.atan2(p.y-b.y,p.x-b.x),6,dt);
    if(b.stun>0)return;
    var sees=alive&&dist<B.sight&&los3(b.x,b.y,b.z+.8,p.x,p.y,.9);
    if(b.tell>0){
      if(!alive){b.tell=0;return}
      if((b.tell-=dt)<=0){
        var ox=b.x+Math.cos(b.aim)*.5,oy=b.y+Math.sin(b.aim)*.5,oz=b.z+.8,dx=p.x-ox,dy=p.y-oy,dz=.9-oz,d=Math.hypot(dx,dy,dz);
        shots.push({x:ox,y:oy,z:oz,vx:dx/d*B.shotSpeed,vy:dy/d*B.shotSpeed,vz:dz/d*B.shotSpeed,dmg:B.dmg*lvm("dmg"),team:1,t:3,kind:"orb",big:1});
        sparks(ox,oy,oz,6,[255,90,74]);b.cd=b.fireEvery||B.fireEvery;pairFired(b);
      }
      return;
    }
    b.cd-=dt*(b.slow>0?T.vent.slowMul:1);b.jumpCd-=dt;b.blind=sees||!alive?0:b.blind+dt;
    if(sees&&b.cd<=0&&pairTurn(b)){b.tell=B.tell;return}
    if(b.mode!=="ride"&&(b.jumpCd<=0||b.blind>1.5)){   /* a Warden rider stays on its platform */
      var c=pickPerch(b.x,b.y,3,B.jumpRange,b.pair?pairOk(b.pair,b):null);
      if(c){b.mode="jump";b.jt=0;b.j0=[b.x,b.y,b.z];b.j1=c;b.base=b.z;b.blind=0}else{b.jumpCd=1;b.blind=0}
    }
  }

  /* Circle vs voxel cells, push out. */
  function collide(e){
    for(var it=0;it<2;it++){
      var x0=Math.floor(e.x-e.r),x1=Math.floor(e.x+e.r),y0=Math.floor(e.y-e.r),y1=Math.floor(e.y+e.r);
      for(var cy=y0;cy<=y1;cy++)for(var cx=x0;cx<=x1;cx++){
        if(!blockedCell(cx,cy))continue;
        var qx=Math.max(cx,Math.min(e.x,cx+1)),qy=Math.max(cy,Math.min(e.y,cy+1)),dx=e.x-qx,dy=e.y-qy,d2=dx*dx+dy*dy;
        if(d2<e.r*e.r){
          if(d2>1e-8){var d=Math.sqrt(d2),p=(e.r-d)/d;e.x+=dx*p;e.y+=dy*p;
            var vn=(e.vx*dx+e.vy*dy)/d;if(vn<0){e.vx-=vn*dx/d;e.vy-=vn*dy/d}}
          else{e.x+=(e.x-(cx+.5))>0?.05:-.05}
        }
      }
    }
  }
  function separate(a,b){
    var dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r;
    if(d>0&&d<m){var p=(m-d)/2/d;a.x-=dx*p;a.y-=dy*p;b.x+=dx*p;b.y+=dy*p}
  }
  function los(ax,ay,bx,by,z){
    var dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy),n=Math.ceil(d/.25);
    for(var k=1;k<n;k++){var t=k/n;if(solidAt(ax+dx*t,ay+dy*t,z))return false}
    return true;
  }

  /* ----- combat ----- */
  function fireMinigun(p){
    if(p.gun==="arc"){fireArc(p);return}
    var g=T[p.gun],ca=Math.cos(p.aim),sa=Math.sin(p.aim),n=g.pellets||1,kind=p.gun==="plasma"||p.gun==="rail"?p.gun:"bullet";
    var tx=p.x+ca*.62+sa*.36,ty=p.y+sa*.62-ca*.36,tz=1.1;   /* right-arm barrel tip */
    var dx=p.ax-tx,dy=p.ay-ty,dz=p.az-tz,d=Math.hypot(dx,dy,dz)||1;
    var src={by:p.idx,kind:"light",pow:p.dmgMul,w:p.gun,resist:kind==="bullet"?T.loader.minigunMult:1};
    for(var k=0;k<n;k++){
      var sp=g.spread,ux=dx/d+(rnd()-.5)*sp,uy=dy/d+(rnd()-.5)*sp,uz=dz/d+(rnd()-.5)*sp*.5,ul=Math.hypot(ux,uy,uz);
      var o={x:tx,y:ty,z:tz,vx:ux/ul*g.speed,vy:uy/ul*g.speed,vz:uz/ul*g.speed,dmg:g.dmg*p.dmgMul,team:0,t:g.life,kind:kind,base:g.dmg,src:src};
      if(kind==="rail"){o.pen=g.pen;o.hit=[]}
      shots.push(o);
    }
    if(kind==="rail"){sparks(tx,ty,tz,8,[160,230,255]);addShake(.06)}
    p.muzzle=n>1||kind==="rail"?.08:.05;addHeat(p,g.heat);
  }
  function addHeat(p,h){if(p.red>0){p.heat=Math.min(T.redline.cap,p.heat+h*(p.heatMul||1));return}   /* Redline: nothing locks, heat climbs to the cap */
    p.heat=Math.min(100,p.heat+h*(p.heatMul||1));if(p.heat>=100&&!p.over){p.over=T.heat.lockout;var hs=st(p.idx);if(hs)hs.overheats++;toast("Overheated: guns locked","var(--bad)",p.idx);smoke(p.x,p.y,1.3,10,[220,220,220])}}
  function damage(e,dmg,x,y,z){
    if(e.hp<=0)return;if(e.team===0)e.taken+=Math.max(0,Math.min(dmg,e.hp));e.hp-=dmg;e.flash=.08;if(e.team===0)e.calm=0;
    if(e.team===1){floatText(x,y,z+.3,Math.round(dmg),"#f2c230");if(e.state==="patrol"){e.state="engage";e.lost=0}}
    else floatText(x,y,z+.3,Math.round(dmg),"#ff5a4a");
    if(e.hp<=0)(e.team===1?killBot:killPlayer)(e);
  }
  /* ----- hit path (GDD-D48). Every hit on an enemy goes through hitEnemy and every hit on a mech through hitMech.
     src = {by: mech index, -1 for nobody, or undefined for "the last mech that hit it within the credit window";
            kind: light | heavy | shoulder | collapse | hazard | pod | enemy; grade: the ring grade of a heavy hit;
            pow: power / 100 at the moment of firing; w: weapon id; resist: armor multiplier against armored enemies}
     Damage order: blocked? -> base -> x power (player weapons only) -> x upgrade (player.upMul, when the garage adds it)
     -> x grade (heavy) -> x 1.5 if staggered -> x armor resist, rounded once. A Perfect then staggers what it hit. */
  function hitEnemy(e,base,src,x,y,z){
    if(e.hp<=0)return 0;
    if(e.blocks&&e.blocks(src,x,y))return 0;
    var K=src.kind,pl=src.by>=0?players[src.by]:null,d=base;
    if(K==="light"||K==="heavy"||K==="shoulder"){d*=src.pow===undefined?(pl?pl.dmgMul:1):src.pow;if(pl&&pl.upMul)d*=pl.upMul(src.w)}
    if(K==="heavy"&&src.grade)d*=T.pile.mult[src.grade];
    if(e.stag>0)d*=1+T.stagger.taken;
    if(e.armored&&src.resist)d*=src.resist;
    if(e.takes)d*=e.takes(src);   /* phase 7: the Warden's rider cover and its +50% once down */
    d=Math.round(d);
    if(src.grade==="Perfect"&&e.frail)d=Math.max(d,Math.ceil(e.hp));   /* phase 4: a Scuttler dies to any Perfect */
    if(src.by>=0){e.cr=src.by;e.crT=tick}
    e.lastSrc=src;
    var s=src.by>=0&&st(src.by);if(s)s.dealt[K]=(s.dealt[K]||0)+Math.max(0,Math.min(d,e.hp));
    damage(e,d,x,y,z);
    if(src.grade==="Perfect"&&e.hp>0&&!e.noStagger){e.stag=T.stagger.time;emitNet(["sg",r2(e.x),r2(e.y),r2(e.z||0)])}
    return d;
  }
  /* Enemy, collapse and hazard damage to a mech: base x mul (an Elite's, when phase 4 adds them), rounded; power, upgrades and grades don't apply. */
  function hitMech(q,base,src,x,y,z){
    if(q.hp<=0)return 0;
    var d=Math.round(base*(src.mul||1)),s=st(q.idx);
    if(s)s.taken[src.kind]=(s.taken[src.kind]||0)+Math.max(0,Math.min(d,q.hp));
    damage(q,d,x===undefined?q.x:x,y===undefined?q.y:y,z===undefined?1:z);
    return d;
  }
  /* Kill credit (GDD-D48): the killing hit's mech; for a hit with no mech of its own (a fall), the last mech that hit it within the window. */
  function creditOf(b){
    var src=b.lastSrc||{};if(src.by!==undefined)return src.by;
    return b.cr!==undefined&&tick-b.crT<=T.credit.window*60?b.cr:-1;
  }
  /* Match stats (GDD-D50): one record per mech per wave. */
  var stats=[],curBy=-1,lastBreakBy=-1;
  function newStats(){return {kills:{},killsBy:{},dealt:{},voxels:0,taken:{},perfect:0,good:0,miss:0,bestCombo:1,spans:0,props:0,bestCrush:0,
    multi:{2:0,3:0,4:0,5:0},pods:{taken:0,stolen:0,stolenBack:0},scrap:{},overheats:0,time:0,redline:0,callins:0}}   /* redline: seconds in Redline; callins: call-ins used */
  function st(i){if(!(i>=0)||!players[i])return null;var w=stats[i]||(stats[i]=[]);return w[run.wave-1]||(w[run.wave-1]=newStats())}
  /* lifetime record fields this match feeds (Campaign.advance reads detail.records); contracts and Overtimes come with phase 3 */
  function recordsOf(i){var r={combo:1,spans:0,contracts:players[i]&&players[i].ctDone?1:0,overtimes:run.otCleared?1:0};(stats[i]||[]).forEach(function(w){if(!w)return;if(w.bestCombo>r.combo)r.combo=w.bestCombo;r.spans+=w.spans});return r}
  function setCombo(p,n){
    var was=p.combo;p.combo=n;if(n===was)return;
    emitNet(["cb",p.idx,n,n<was?1:0]);
    var s=st(p.idx);if(s&&n>s.bestCombo)s.bestCombo=n;
  }
  function killBot(b){
    if(b.kind==="charge"){detonate(b);return}   /* phase 4: a shot charge goes off early; it is no kill */
    if(b.part){partBroken(b);return}   /* phase 7: a Warden leg or platform breaks; it is no kill */
    kills++;
    var src=b.lastSrc||{},by=creditOf(b),pl=by>=0?players[by]:null,type=b.btype||(b.boss?"sniper":b.loader?"loader":(b.type||"bot"));var c=b.boss?[63,214,232]:b.loader?[176,150,52]:b.col||[140,70,56],z0=b.boss?b.z:0;
    for(var k=0;k<14;k++)debrisPiece(b.x,b.y,z0+.5,k%2?c:[60,62,66]);
    sparks(b.x,b.y,z0+.6,18,[255,170,60]);smoke(b.x,b.y,z0+.5,8,[90,90,90]);
    var sc=b.scrapR||(b.loader?T.loader.scrap:T.bot.scrap),n=b.scrapN!==undefined?b.scrapN:b.boss?T.boss.scrap:sc[0]+((rnd()*(sc[1]-sc[0]+1))|0),sx=b.x,sy=b.y,sz=.4;
    /* how kill bonuses combine (GDD Economy): the multipliers multiply, the percentages add, rounded once */
    var mul=lvm("scrap"),pct=0;
    if(src.kind==="heavy"&&src.grade==="Perfect"&&src.w==="pile")mul*=2;   /* killed by a Perfect pile-bunker hit */
    if(run.overtime&&T.overtime)mul*=T.overtime.scrap;
    if(T.match&&T.match.scrapMul)mul*=T.match.scrapMul;   /* Scrap storm (GDD-D39) */
    if(b.elite&&T.elite)mul*=T.elite.scrap;
    if(pl&&pl.combo>1)pct+=T.combo.step*(pl.combo-1);
    if(src.kind==="collapse"||src.kind==="hazard"||src.kind==="pod"&&src.by===-1)pct+=T.demolition;   /* an enemy-taken Strike beacon counts as demolition too (TDD kill credit) */
    n=Math.round(n*mul*(1+pct));
    var tag=src.kind||"other";
    if(pl){var s=st(by);
      s.kills[type]=(s.kills[type]||0)+1;s.killsBy[tag]=(s.killsBy[tag]||0)+1;if(b.podCarrier)s.pods.stolenBack++;
      if(tick-pl.mkT<=T.multiKill.window*60)pl.mkN++;else{pl.mkN=1;pl.mkRec=s}
      pl.mkT=tick;
      if(pl.mkN>=2){var r=pl.mkRec||s;if(pl.mkN<=5){if(pl.mkN>2)r.multi[pl.mkN-1]--;r.multi[pl.mkN]++}emitNet(["mk",by,pl.mkN])}
    }
    emitNet(["x",type,by,tag,n]);
    if(aloft(b)){var g=groundNear(b.x,b.y);sx=g[0];sy=g[1];sz=1.5}   /* roof loot drops to street level */
    if(b.boss||b.bossName)toast((b.bossName||(b.pair?"Pair sniper":b.rider?"Warden rider":"Bounty sniper"))+" down","var(--hazard)");
    for(k=0;k<n;k++)scraps.push({x:sx,y:sy,z:sz,vx:(rnd()-.5)*4,vy:(rnd()-.5)*4,vz:3+rnd()*2,t:0,spin:rnd()*6,src:run.overtime?"overtime":tag});
    if(b.cache)burstCubes(sx,sy,sz,b.cache);   /* a carried Scrap cache drops with it (GDD-D43) */
    zoneDeath(b);   /* phase 4: a Scuttler's blast, a Wrecker's dropped charge, an Elite's pod */
    bossDeath(b);   /* phase 7: the Warden's body takes every linked part with it */
  }
  /* Pile-bunker: the timing ring decides the grade, the spike is a short cone in front of the left arm. */
  function ringR(t){return T.ring.start+(T.ring.target-T.ring.start)*t/T.ring.duration}
  function gradeRing(t){var R=T.ring,e=Math.abs(ringR(t)-R.target)/R.start;return e<=R.perfect?"Perfect":e<=R.good?"Good":"Miss"}
  function knockBot(b,ux,uy,dist,breach){
    var K=T.pile,vx=-uy,vy=ux,n=Math.ceil(dist/.25),zs=[.3,1.1],os=[-.8*b.r,0,.8*b.r];
    for(var k=0;k<n;k++){
      var nx=b.x+ux*.25,ny=b.y+uy*.25,stop=false;
      os.forEach(function(o){var ax=nx+ux*b.r+vx*o,ay=ny+uy*b.r+vy*o;
        zs.forEach(function(z){if(solidAt(ax,ay,z)){if(breach)hitVoxel(ax,ay,z,K.launchDmg,ax,ay,z);if(solidAt(ax,ay,z))stop=true}})});
      if(stop)break;
      b.x=nx;b.y=ny;
      if(b.kind==="scuttler"&&b.hp>0&&scuttlerBump(b))return;
    }
    smoke(b.x,b.y,.5,3,[200,200,200]);
  }
  function firePile(p,grade){
    var K=T.pile,m=K.mult[grade],ca=Math.cos(p.aim),sa=Math.sin(p.aim),perfect=grade==="Perfect";
    p.atb=0;p.ring=-1;p.pileT=K.ext;p.pileRes=grade;p.comboT=0;
    var gs=st(p.idx);if(gs)gs[grade.toLowerCase()]++;
    if(perfect)setCombo(p,Math.min(T.combo.max,p.combo+1));else if(grade==="Miss")setCombo(p,1);
    var src={by:p.idx,kind:"heavy",grade:grade,pow:p.dmgMul,w:p.pileKind};
    if(grade==="Miss"&&p.pileKind!=="buster")p.retract=K.retract;
    floatText(p.x,p.y,2.1,grade==="Perfect"?"PERFECT":grade,perfect?"#f2c230":grade==="Good"?"#7fdc6a":"#ff5a4a");
    addHeat(p,K.heat);
    if(p.pileKind==="buster"){fireBuster(p,src);return}
    if(p.pileKind==="winch"){fireWinch(p,grade,m,src);return}
    if(p.pileKind==="seismic"){fireSeismic(p,grade,src);return}
    bots.forEach(function(b){
      if(b.hp<=0||b.dropping||b.z>.5)return;   /* a roof sniper is out of reach */
      var dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy);if(d>K.reach+b.r)return;
      var ang=Math.abs(Math.atan2(ca*dy-sa*dx,ca*dx+sa*dy));
      if(d>b.r&&ang>K.cone+Math.atan2(b.r,d))return;
      hitEnemy(b,K.dmg,src,b.x,b.y,.8);sparks(b.x,b.y,.8,perfect?16:8,[255,255,255]);
      if(b.hp>0&&K.knock[grade])knockBot(b,ca,sa,K.knock[grade],perfect);
    });
    /* voxels: rays at two heights; Perfect is wider and cores two cells deep */
    var done={},lat=perfect?[-.6,-.3,0,.3,.6]:[-.3,0,.3];
    lat.forEach(function(o){[.3,1.1].forEach(function(z){
      var left=perfect?2:1;
      for(var d=.5;d<=K.reach+(perfect?.5:0)&&left>0;d+=.2){
        var x=p.x+ca*d-sa*o,y=p.y+sa*d+ca*o;if(!solidAt(x,y,z))continue;
        var key=Math.floor(x)+","+Math.floor(y)+","+Math.floor(z);if(done[key])continue;
        done[key]=1;left--;hitVoxel(x,y,z,K.voxDmg*m,x,y,z);
      }})});
  }
  /* Bunker-buster: the ATB shot is a slow shell (it blasts a hole where it lands); the recoil shoves the mech back. */
  function fireBuster(p,src){
    var B=T.buster,ca=Math.cos(p.aim),sa=Math.sin(p.aim),tx=p.x-sa*.42+ca*.8,ty=p.y+ca*.42+sa*.8,tz=1.05;
    var dx=p.ax-tx,dy=p.ay-ty,dz=p.az-tz,d=Math.hypot(dx,dy,dz)||1;
    shots.push({x:tx,y:ty,z:tz,vx:dx/d*B.speed,vy:dy/d*B.speed,vz:dz/d*B.speed,dmg:B.dmg,base:B.dmg,src:src,team:0,t:B.life,kind:"shell"});
    sparks(tx,ty,tz,10,[255,200,120]);smoke(tx,ty,tz,3,[200,200,200]);p.muzzle=.1;addShake(.2);
    if(!p.immune)knockBot(p,-ca,-sa,B.recoil,false);
  }
  /* Mag-winch: a cable along the aim. Light bots are reeled in; a wall or a heavy loader reels you in instead;
     a roof sniper is yanked off its perch; a Perfect hit on a pillar tears out its base. */
  function fireWinch(p,grade,m,src){
    var Wn=T.winch,reach=grade==="Perfect"?Wn.perfect:Wn.reach,ca=Math.cos(p.aim),sa=Math.sin(p.aim);
    var ox=p.x-sa*.42+ca*.5,oy=p.y+ca*.42+sa*.5,oz=1,dx=p.ax-ox,dy=p.ay-oy,dz=p.az-oz,dl=Math.hypot(dx,dy,dz)||1;
    dx/=dl;dy/=dl;dz/=dl;
    var hx=ox,hy=oy,hz=oz,hitB=null,hitV=false;
    for(var d=.2;d<=reach&&!hitB&&!hitV;d+=.2){
      hx=ox+dx*d;hy=oy+dy*d;hz=Math.max(.05,oz+dz*d);
      for(var j=0;j<bots.length;j++){var b=bots[j];if(b.hp<=0||b.dropping)continue;
        if(Math.hypot(b.x-hx,b.y-hy)<b.r+.15&&hz>=b.z-.1&&hz<=b.z+b.h+.3){hitB=b;break}}
      if(!hitB&&solidAt(hx,hy,hz))hitV=true;
    }
    emitNet(["l",r2(ox),r2(oy),r2(oz),r2(hx),r2(hy),r2(hz)]);
    sparks(hx,hy,hz,hitB||hitV?10:3,[200,220,230]);
    var px=hx-p.x,py=hy-p.y,pl=Math.hypot(px,py)||1;px/=pl;py/=pl;
    if(hitB){
      var b=hitB;hitEnemy(b,Wn.dmg,src,b.x,b.y,b.z+.8);if(b.hp<=0)return;
      if(aloft(b)&&!b.air){   /* yanked off the roof: it falls, and a long fall stuns and hurts it */
        b.mode="fall";b.vz=0;b.fallZ=b.z;b.tell=0;b.x-=px*1.2;b.y-=py*1.2;toast("Sniper yanked off the roof","var(--hazard)");evicted(p.idx);
      } else if(b.loader||b.heavy){winchPull(p,px,py,pl-b.r-p.r-.15)}
      else {knockBot(b,-px,-py,Math.max(0,pl-b.r-p.r-.2),false);if(b.state==="patrol")b.state="engage"}
      return;
    }
    if(!hitV)return;
    var st=structures[owner[vi(Math.floor(hx),Math.floor(hy),Math.floor(hz))]];
    if(grade==="Perfect"&&st&&st.kind==="pillar"){
      var cx=Math.floor(hx),cy=Math.floor(hy);
      for(var z=0;z<3;z++)for(var yy=cy-1;yy<=cy+1;yy++)for(var xx=cx-1;xx<=cx+1;xx++)
        if(inB(xx,yy,z)&&vox[vi(xx,yy,z)]&&owner[vi(xx,yy,z)]===st.id)hitVoxel(xx,yy,z,Wn.pillar*m,xx+.5,yy+.5,z+.5);
      addShake(.3);toast("Pillar torn out","var(--hazard)",p.idx);return;
    }
    winchPull(p,px,py,pl-p.r-.3);
  }
  function winchPull(p,ux,uy,d){
    if(d<.4)return;var v=T.winch.pull;
    p.vx=ux*v;p.vy=uy*v;p.dash=d/v;smoke(p.x,p.y,.3,4,[200,200,200]);
  }
  /* Shoulder actives on Q. */
  function fireMortar(p){
    var M=T.mortar,dx=p.ax-p.x,dy=p.ay-p.y,dl=Math.hypot(dx,dy);
    if(dl<M.minR){floatText(p.x,p.y,1.9,"too close","#a39d93");return false}
    if(dl>M.maxR){dx*=M.maxR/dl;dy*=M.maxR/dl;dl=M.maxR}
    var ca=Math.cos(p.aim),sa=Math.sin(p.aim),g=T.collapse.gravity,ft=M.flight*(.8+.4*dl/M.maxR),src={by:p.idx,kind:"shoulder",pow:p.dmgMul,w:"mortar"};
    for(var k=0;k<M.shells;k++){
      var side=k?1:-1,ox=p.x-ca*.15+sa*side*.18,oy=p.y-sa*.15-ca*side*.18,oz=1.7;
      var tx=p.x+dx+(rnd()-.5)*M.spread,ty=p.y+dy+(rnd()-.5)*M.spread,tz=p.az>.7?p.az:0;
      shots.push({x:ox,y:oy,z:oz,vx:(tx-ox)/ft,vy:(ty-oy)/ft,vz:(tz-oz+.5*g*ft*ft)/ft,dmg:M.dmg*p.dmgMul,base:M.dmg,src:src,team:0,t:ft*2+1,kind:"mortar",big:k});
      smoke(ox,oy,oz,3,[200,200,200]);
    }
    sparks(p.x,p.y,1.8,8,[255,200,120]);addShake(.12);addHeat(p,M.heat);return true;
  }
  function fireVent(p){
    var V=T.vent,n=0;
    p.heat=0;if(p.over){p.over=0;toast("Vented: guns unlocked","var(--good)",p.idx)}
    bots.forEach(function(b){if(b.hp<=0||b.dropping)return;
      if(Math.hypot(b.x-p.x,b.y-p.y,(b.z||0)-p.z)>V.radius)return;
      b.slow=V.slow;n++;hitEnemy(b,V.dmg,{by:p.idx,kind:"shoulder",pow:p.dmgMul,w:"vent"},b.x,b.y,b.z+.8);sparks(b.x,b.y,b.z+.6,6,[150,232,240])});
    for(var k=0;k<14;k++){var a=k/14*6.283;smoke(p.x+Math.cos(a)*1.2,p.y+Math.sin(a)*1.2,.4,1,[200,240,250])}
    sparks(p.x,p.y,1.2,20,[150,232,240]);floatText(p.x,p.y,2.1,n?"FROZEN x"+n:"VENT","#3fd6e8");
    return true;
  }
  function updateShoulder(p,dt,press){
    if(!p.q)return;
    if(BP_Q[p.q]){BP_Q[p.q](p,dt,press);return}   /* phase 6: Redline vent, Breach charges */
    p.sq=Math.max(0,p.sq-dt*(p.q==="mortar"?p.atbRate:1));
    if(!press)return;
    if(p.sq>0){floatText(p.x,p.y,1.9,"recharging","#a39d93");return}
    if(p.q==="mortar"&&p.over){floatText(p.x,p.y,1.9,"overheated","#ff5a4a");return}
    if((p.q==="mortar"?fireMortar:fireVent)(p))p.sq=T[p.q].every;
  }
  function updatePile(p,dt,press){
    var R=T.ring;
    p.pileT-=dt;p.retract=Math.max(0,p.retract-dt);p.cue-=dt;
    if(p.ring<0){
      p.atb=Math.min(T.atb.fill,p.atb+dt*p.atbRate*(p.oc>0?T.pods.overclock.mult:1)*(p.combo>=T.combo.max?1+T.combo.atbAt4:1));
      if(press){
        if(p.over||p.retract>0||p.atb<T.atb.fill){if(p.cue<=0){p.cue=.6;floatText(p.x,p.y,1.9,p.retract>0?"retracting":"charging","#a39d93")}}
        else p.ring=0;
      }
      return;
    }
    p.ring+=dt;
    if(p.over){p.ring=-1;p.atb=0;p.retract=T.pile.retract;p.pileRes="Miss";p.comboT=0;setCombo(p,1);var ms=st(p.idx);if(ms)ms.miss++;floatText(p.x,p.y,2.1,"Miss","#ff5a4a")}
    else if(!p.rDown)firePile(p,gradeRing(p.ring));
    else if(ringR(p.ring)<R.target-R.good*R.start)firePile(p,"Miss");   /* ring closed on the target without a release */
  }
  function killPlayer(p){
    var acc=p.idx===1?[63,214,232]:[224,112,43];
    for(var k=0;k<24;k++)debrisPiece(p.x,p.y,.8,k%2?[74,78,86]:acc);
    sparks(p.x,p.y,1,26,[255,170,60]);smoke(p.x,p.y,1,12);
    var left=players.filter(function(q){return q.hp>0});
    if(left.length){   /* the other mech keeps going; the run is lost only when both are down */
      toast("Your mech is destroyed: your partner fights on","var(--bad)",p.idx);toast("Partner down","var(--hazard)",left[0].idx);return;
    }
    lossCheck();
  }
  function lossCheck(){
    if(players.some(function(q){return q.hp>0}))return;
    var lost=scrap,w="wave "+run.wave+" of "+T.waves.length,msg;scrap=0;state="dead";
    var det=matchDetail({result:"dead",level:level,stats:stats,callins:callinReport(true)});
    msg="Mech destroyed on "+w+". You lost "+lost+" scrap from this match. Parts you own are never lost; scrap only counts once you extract.";
    emit(["o","dead",msg,0,det]);
  }

  /* ===== phase 6: blueprint parts, pods and call-ins (GDD-D36, D42, D43, D54). Everything below is new; the hooks into the
     older code are one call each: bpPlayer (newPlayer), BP_Q (updateShoulder), bpTick (end of updatePlayer), fireArc
     (fireMinigun), fireSeismic (firePile), podEffect / podToast (applyPod), burstCubes (killBot), drawPodType (randomPod),
     updateBp (step), callinReport (run-over detail), bpSnap (snapshot) and bpHash (stateHash).
     State: breaches = placed Breach charges, strikes = Strike beacon lines waiting to land, callins = two slots per mech. ===== */
  var breaches=[],strikes=[],callins=[],ciUsed=[];
  var BP_Q={redline:qRedline,breach:qBreach};
  function setCallins(i,c){
    var a=[];for(var k=0;k<T.callin.slots;k++){var t=c&&c[k];a.push(typeof t==="string"&&T.callin.price[t]!==undefined?t:null)}
    callins[i]=a;if(!ciUsed[i])ciUsed[i]=[];
  }
  (opts.callins||[]).forEach(function(c,i){setCallins(i,c)});
  /* run-over detail: per mech, the call-ins used this match and what stays in the slots (a death loses what was carried) */
  function callinReport(dead){
    return players.map(function(q,i){var c=callins[i]||[];
      return {used:(ciUsed[i]||[]).slice(),left:[0,1].map(function(k){return dead?null:c[k]||null})}});
  }
  /* per-mech state the blueprint parts need; every key is set so applyBuild overwrites the last build's values */
  function bpPlayer(q){
    function hook(slot){var pt=PART[q.v[slot]];return (pt&&pt.hook)||{}}
    var S=T.skids;
    q.red=0;q.redH=0;q.redDebt=0;q.bHeld=T.breach.held;q.bRe=[];q.bq=-1;q.bqFired=false;q.ciPrev=0;
    q.overdrive=!!hook("core").overdrive;q.odOn=false;
    q.skids=!!hook("legs").skids;q.dashN=q.skids?S.dashes:null;q.grip=q.skids?S.grip:1;q.shoveMul=q.skids?S.shove:1;
    if(q.skids){q.dashHeat=S.dashHeat/T.player.dashHeat;q.dashMul=S.recharge/T.player.dashCooldown}
    return q;
  }
  /* end of each mech's tick: Redline's armor cost and end, the Overdrive switch, call-in keys (1 = 256, 2 = 512) */
  function bpTick(p,dt,inp){
    if(p.hp<=0)return;
    if(p.red>0){
      var R=T.redline,s=st(p.idx),gain=Math.max(0,Math.max(100,p.heat)-Math.max(100,p.redH));p.redH=p.heat;
      if(s)s.redline=Math.round((s.redline+dt)*1000)/1000;
      p.redDebt+=gain*R.armor;   /* net of drain: only what the heat rose above 100 since the last tick */
      if(p.redDebt>=1&&tick%6===0){var n=Math.floor(p.redDebt);p.redDebt-=n;redlineCost(p,n)}
      if(p.hp>0&&(p.red-=dt)<=1e-9)endRedline(p);
    }
    if(p.overdrive){
      var O=T.overdrive,on=p.hp>0&&p.hp<p.maxHp*O.below;
      if(on!==p.odOn){var sg=on?1:-1;p.odOn=on;p.dmgMul+=sg*O.power/100;p.atbRate+=sg*O.power/100;p.drain*=on?1+O.drain:1/(1+O.drain);
        if(on){toast("Overdrive: power +"+O.power+", heat drains faster","var(--hazard)",p.idx);sparks(p.x,p.y,1.2,10,[255,200,90])}}
    }
    var k=inp.k|0,edge=k&~p.ciPrev;p.ciPrev=k;
    if(edge&256)callIn(p,0);
    if(edge&512)callIn(p,1);
  }
  /* ----- Redline vent (GDD-D36) ----- */
  function redlineCost(p,n){var calm=p.calm;hitMech(p,n,{kind:"redline"},p.x,p.y,1.4);p.calm=calm}   /* counts as damage taken, not for the Nanite core */
  function qRedline(p,dt,press){
    p.sq=Math.max(0,p.sq-dt);
    if(!press||p.red>0)return;
    if(p.sq>0){floatText(p.x,p.y,1.9,"recharging","#a39d93");return}
    var R=T.redline,clutch=p.over>0;
    p.red=R.time;p.redH=p.heat;p.redDebt=0;p.over=0;p.sq=R.time+R.every;   /* the recharge runs from the end of Redline */
    toast(clutch?"Redline: lockout cleared, nothing locks for "+R.time+" s":"Redline: nothing locks for "+R.time+" s","var(--hazard)",p.idx);
    sparks(p.x,p.y,1.3,16,[255,244,226]);emitNet(["rl",p.idx,1,0]);
  }
  function endRedline(p){
    var R=T.redline,lock=0;p.red=0;
    if(p.redDebt>=.5)redlineCost(p,1);p.redDebt=0;
    if(p.hp<=0)return;
    if(p.heat>100){lock=R.lockout+R.per10*(p.heat-100)/10;p.over=lock;var s=st(p.idx);if(s)s.overheats++;
      toast("Redline over: locked "+lock.toFixed(1)+" s","var(--bad)",p.idx);smoke(p.x,p.y,1.3,12,[230,230,230])}
    else toast("Redline over","var(--good)",p.idx);
    emitNet(["rl",p.idx,0,r2(lock)]);
  }
  /* ----- Breach charges: tap Q throws one (with none in hand, sets them off); holding Q sets off every placed charge ----- */
  function qBreach(p,dt,press){
    var B=T.breach,inp=inputs[p.idx],down=!!(inp&&(inp.k&32)),mine=breaches.some(function(c){return c.by===p.idx});
    for(var k=p.bRe.length-1;k>=0;k--)if((p.bRe[k]-=dt)<=0){p.bRe.splice(k,1);p.bHeld++}
    p.sq=p.bRe.length?Math.min.apply(null,p.bRe):0;
    if(press){p.bq=0;p.bqFired=false;return}
    if(p.bq<0)return;
    if(down){p.bq+=dt;if(!p.bqFired&&p.bq>=B.hold&&mine){p.bqFired=true;detonateBreaches(p)}return}
    if(!p.bqFired){if(p.bHeld>0)throwCharge(p);else if(mine)detonateBreaches(p);else floatText(p.x,p.y,1.9,"no charges","#a39d93")}
    p.bq=-1;
  }
  function settle(c){c.on=null;c.z=groundZ(c.x,c.y,c.z+.01);c.vi=c.z>0?vi(Math.floor(c.x),Math.floor(c.y),c.z-1):-1}
  function throwCharge(p){
    var B=T.breach,ox=p.x,oy=p.y,oz=1.5,tx=p.ax,ty=p.ay,tz=p.az,dh=Math.hypot(tx-ox,ty-oy);
    if(dh>B.range){tx=ox+(tx-ox)*B.range/dh;ty=oy+(ty-oy)*B.range/dh;tz=0}   /* past range: onto the street at range */
    var n=Math.max(1,Math.ceil(Math.hypot(tx-ox,ty-oy,tz-oz)/.1)),c=null,px=ox,py=oy,pz=oz;
    for(var k=1;k<=n&&!c;k++){
      var u=k/n,x=ox+(tx-ox)*u,y=oy+(ty-oy)*u,z=oz+(tz-oz)*u;
      for(var j=0;j<bots.length&&!c;j++){var b=bots[j];if(b.hp<=0||b.dropping)continue;
        if(Math.hypot(b.x-x,b.y-y)<b.r+.1&&z>=b.z-.1&&z<=b.z+b.h+.2)c={on:b,ox:x-b.x,oy:y-b.y,oz:Math.max(.2,z-b.z),x:x,y:y,z:z,vi:-1}}   /* sticks to an enemy */
      if(!c&&(z<=0||solidAt(x,y,z)))c={on:null,x:px,y:py,z:Math.max(0,pz),vi:z<=0?-1:vi(Math.floor(x),Math.floor(y),Math.floor(z))};   /* to the surface it hit */
      px=x;py=y;pz=z;
    }
    if(!c){c={on:null,x:tx,y:ty,z:tz};settle(c)}
    c.by=p.idx;c.id=++eid;breaches.push(c);
    p.bHeld--;p.bRe.push(B.recharge);addHeat(p,B.heat);
    sparks(c.x,c.y,c.z,6,[255,120,60]);floatText(c.x,c.y,c.z+.6,"CHARGE","#ff7a3c");
  }
  function detonateBreaches(p){
    for(var i=breaches.length-1;i>=0;i--)if(breaches[i].by===p.idx){var c=breaches[i];breaches.splice(i,1);breachBlast(c)}
  }
  /* 40 damage within 2 m and every voxel within 2 m removed through the normal voxel path, so chunks, supports and collapses follow */
  function breachBlast(c){
    var B=T.breach,R=B.radius,q=players[c.by],src={by:c.by,kind:"shoulder",pow:q?q.dmgMul:1,w:"breach"},was=curBy;curBy=c.by;
    for(var z=Math.floor(c.z-R);z<=Math.floor(c.z+R);z++)for(var y=Math.floor(c.y-R);y<=Math.floor(c.y+R);y++)for(var x=Math.floor(c.x-R);x<=Math.floor(c.x+R);x++){
      if(!inB(x,y,z))continue;var i=vi(x,y,z),m=vox[i];
      if(m&&MAT[m].hp!==Infinity&&Math.hypot(x+.5-c.x,y+.5-c.y,z+.5-c.z)<=R)removeVoxel(i,x,y,z);
    }
    bots.forEach(function(b){if(b.hp<=0||b.dropping)return;
      if(Math.hypot(b.x-c.x,b.y-c.y,(b.z||0)+.5-c.z)<=R+b.r)hitEnemy(b,B.dmg,src,b.x,b.y,(b.z||0)+.8)});
    sparks(c.x,c.y,c.z+.2,22,[255,160,70]);smoke(c.x,c.y,c.z+.2,7,[170,160,140]);addShake(.2);
    emitNet(["bx",c.by,r2(c.x),r2(c.y),r2(c.z)]);curBy=was;
  }
  /* ----- Seismic hammer: ATB ground slam around the mech ----- */
  function fireSeismic(p,grade,src){
    var S=T.seismic,perfect=grade==="Perfect",R=perfect?S.perfect:S.radius;
    bots.forEach(function(b){if(b.hp<=0||b.dropping||b.z>.5)return;   /* a roof sniper is out of reach */
      if(Math.hypot(b.x-p.x,b.y-p.y)>R+b.r)return;
      hitEnemy(b,S.dmg,src,b.x,b.y,.8);sparks(b.x,b.y,.6,8,[255,210,140])});
    if(perfect){
      topple(p,S.topple);
      bots.forEach(function(b){if(b.hp>0&&aloft(b)&&b.mode==="perch"&&Math.hypot(b.x-p.x,b.y-p.y)<=S.shake){
        /* off the roof edge, toward the mech when that side is open, then it falls like a yanked sniper */
        var ds=[[1,0],[-1,0],[0,1],[0,-1]].sort(function(a,c){return (c[0]*(p.x-b.x)+c[1]*(p.y-b.y))-(a[0]*(p.x-b.x)+a[1]*(p.y-b.y))});
        for(var k=0;k<ds.length;k++)if(!solidAt(b.x+ds[k][0],b.y+ds[k][1],b.z-.5)){b.x+=ds[k][0];b.y+=ds[k][1];break}
        b.mode="fall";b.vz=0;b.fallZ=b.z;b.tell=0;toast("Sniper shaken off the roof","var(--hazard)")}});
    }
    for(var k=0;k<16;k++){var a=k/16*6.283;smoke(p.x+Math.cos(a)*R*.7,p.y+Math.sin(a)*R*.7,.2,1,[170,160,140])}
    addShake(perfect?.35:.2);emitNet(["sm",p.idx,r2(p.x),r2(p.y),R,perfect?1:0]);
  }
  /* the bottom box of every container stack within r m goes, so the boxes on it fall as a collapse credited to this mech */
  function topple(p,r){
    MAP.containers.forEach(function(c){
      if((c[5]||1)<2)return;
      var nx=Math.max(c[0],Math.min(p.x,c[0]+c[2])),ny=Math.max(c[1],Math.min(p.y,c[1]+c[3]));if(Math.hypot(nx-p.x,ny-p.y)>r)return;
      var own=0,x,y,z;for(y=c[1];y<c[1]+c[3]&&!own;y++)for(x=c[0];x<c[0]+c[2]&&!own;x++)if(vox[vi(x,y,0)]===8)own=owner[vi(x,y,0)];
      if(!own)return;
      for(z=0;z<2;z++)for(y=c[1];y<c[1]+c[3];y++)for(x=c[0];x<c[0]+c[2];x++){var i=vi(x,y,z);if(vox[i]&&owner[i]===own)removeVoxel(i,x,y,z)}
      toast("Stack toppled","var(--hazard)",p.idx);
    });
  }
  /* ----- Arc caster: a hitscan bolt that jumps nearest-first; no voxel damage ----- */
  function fireArc(p){
    var A=T.arc,ca=Math.cos(p.aim),sa=Math.sin(p.aim),tx=p.x+ca*.62+sa*.36,ty=p.y+sa*.62-ca*.36,tz=1.1;
    var dx=p.ax-tx,dy=p.ay-ty,dz=p.az-tz,d=Math.hypot(dx,dy,dz)||1,src={by:p.idx,kind:"light",pow:p.dmgMul,w:"arc",resist:A.loaderMult};
    dx/=d;dy/=d;dz/=d;
    var hit=null,x=tx,y=ty,z=tz,pts=[r2(tx),r2(ty),r2(tz)],j,b;
    for(var s=.2;s<=A.range&&!hit;s+=.2){
      x=tx+dx*s;y=ty+dy*s;z=tz+dz*s;if(z<=0||solidAt(x,y,z))break;
      for(j=0;j<bots.length;j++){b=bots[j];if(b.hp<=0||b.dropping)continue;
        if(Math.hypot(b.x-x,b.y-y)<b.r+.15&&z>=b.z-.1&&z<=b.z+b.h+.2){hit=b;break}}
    }
    if(!hit)pts.push(r2(x),r2(y),r2(Math.max(0,z)));
    var done=[],cur=hit;
    for(var n=0;cur&&n<=A.jumps;n++){
      done.push(cur);pts.push(r2(cur.x),r2(cur.y),r2((cur.z||0)+.6));
      var cx=cur.x,cy=cur.y,cz=(cur.z||0)+.5;
      hitEnemy(cur,n?A.jumpDmg:A.dmg,src,cx,cy,cz+.3);sparks(cx,cy,cz+.3,5,[190,170,255]);
      var next=null,nd=A.jumpR;
      for(j=0;j<bots.length;j++){b=bots[j];if(b.hp<=0||b.dropping||done.indexOf(b)>=0)continue;
        var bd=Math.hypot(b.x-cx,b.y-cy,(b.z||0)+.5-cz);if(bd<=nd){nd=bd;next=b}}
      cur=next;
    }
    emitNet(["ar",p.idx,pts]);
    p.muzzle=.06;addHeat(p,A.heat);
  }
  /* ----- pods (GDD-D43) ----- */
  function drawPodType(){   /* one draw from the run's stream, weighted by T.pods.odds */
    var O=T.pods.odds||{},sum=0,k,r;
    for(k=0;k<POD_TYPES.length;k++)sum+=O[POD_TYPES[k]]||0;
    r=rnd()*sum;
    for(k=0;k<POD_TYPES.length;k++){r-=O[POD_TYPES[k]]||0;if(r<0)return POD_TYPES[k]}
    return POD_TYPES[0];
  }
  function podEffect(o,e){
    if(o.type==="cache"){
      var n=Math.round(T.cache.cubes*lvm("scrap"));o.n=n;
      if(e.team===0){burstCubes(e.x,e.y,.6,n);floatText(e.x,e.y,2,"+"+n+" CACHE","#f2c230")}
      else e.cache=(e.cache||0)+n;   /* it glows gold and drops them when it dies */
    } else if(o.type==="strike"){
      if(e.team===0)strikes.push({id:++eid,by:e.idx,t:T.strike.delay,x:e.x,y:e.y,ax:e.ax,ay:e.ay,pts:null});   /* the line is drawn toward the cursor when it lands */
      else{var q=nearestPlayer(e.x,e.y),ux=q.x-e.x,uy=q.y-e.y,ul=Math.hypot(ux,uy)||1;
        strikes.push({id:++eid,by:-1,t:T.strike.enemyDelay,x:e.x,y:e.y,pts:linePts(e.x,e.y,ux/ul,uy/ul)})}   /* aimed now, with a ground warning */
    }
  }
  function podToast(o){
    if(o.type==="cache")return "Scrap cache: "+o.n+" cubes";
    if(o.type==="strike")return "Strike beacon: four shells along your aim in "+T.strike.delay+" s";
    return POD_NAME[o.type]||"Pod";
  }
  function burstCubes(x,y,z,n){
    for(var k=0;k<n;k++){var a=rnd()*6.283,v=1+rnd()*3;scraps.push({x:x,y:y,z:z,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:3+rnd()*2,t:0,spin:rnd()*6,src:"pod"})}
  }
  function linePts(x,y,ux,uy){return T.strike.at.map(function(d){return [r2(x+ux*d),r2(y+uy*d)]})}
  function landStrike(k){
    var S=T.strike,pts=k.pts,was=curBy;
    if(!pts){var ux=k.ax-k.x,uy=k.ay-k.y,ul=Math.hypot(ux,uy),q=players[k.by];
      if(ul<.1){ux=Math.cos(q.aim);uy=Math.sin(q.aim);ul=1}
      pts=linePts(k.x,k.y,ux/ul,uy/ul)}
    curBy=k.by;
    var src={by:k.by,kind:"pod",w:"strike"};
    pts.forEach(function(pt){
      var x=pt[0],y=pt[1];if(x<1||y<1||x>=W-1||y>=D-1)return;
      var z=groundZ(x,y,H),bx=Math.floor(x),by=Math.floor(y),cz=Math.max(0,z-1);
      for(var dz=-1;dz<=1;dz++)for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++)hitVoxel(bx+dx,by+dy,cz+dz,S.voxDmg,bx+dx+.5,by+dy+.5,cz+dz+.5);
      bots.forEach(function(b){if(b.hp<=0||b.dropping)return;
        if(Math.hypot(b.x-x,b.y-y,(b.z||0)+.5-z)<=S.radius)hitEnemy(b,S.dmg*lvm("hp"),src,b.x,b.y,(b.z||0)+.8)});   /* scaled like collapse damage */
      if(k.by<0)players.forEach(function(q){if(q.hp>0&&Math.hypot(q.x-x,q.y-y,.8-z)<=S.radius)hitMech(q,S.mechDmg,{kind:"pod"},q.x,q.y,1)});   /* a mech's own beacon never hurts mechs */
      sparks(x,y,z+.2,16,[255,190,90]);smoke(x,y,z+.2,5,[170,160,140]);
      emitNet(["sk",k.by,r2(x),r2(y),z]);
    });
    addShake(.3);curBy=was;
  }
  /* ----- call-ins (GDD-D54): the slot's pod at the aim point, up to T.callin.range, with the usual marker and countdown ----- */
  function openCellNear(x,y){
    var ox=openX();
    for(var r=0;r<=6;r++)for(var dy=-r;dy<=r;dy++)for(var dx=-r;dx<=r;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
      var cx=Math.floor(x)+dx,cy=Math.floor(y)+dy;if(cx+.5<ox&&!blockedCell(cx,cy))return [cx+.5,cy+.5];
    }
    return null;
  }
  function callIn(p,k){
    var c=callins[p.idx],type=c&&c[k];if(!type)return;
    if(state!=="play"){   /* not in the drop intro or after the run is over; fine while the exit counts down */
      floatText(p.x,p.y,1.9,"no call-ins now","#a39d93");return}
    var C=T.callin,dx=p.ax-p.x,dy=p.ay-p.y,dl=Math.hypot(dx,dy),tx=p.ax,ty=p.ay;
    if(dl>C.range){tx=p.x+dx*C.range/dl;ty=p.y+dy*C.range/dl}
    var cell=openCellNear(tx,ty);if(!cell){floatText(p.x,p.y,1.9,"no landing spot","#a39d93");return}
    var o=spawnPod(type,cell[0],cell[1],true);o.by=p.idx;o.callin=k+1;
    c[k]=null;ciUsed[p.idx].push(type);
    var s=st(p.idx);if(s)s.callins++;
    toast("Call-in: "+POD_NAME[type]+" inbound","var(--cyan)",p.idx);
    emitNet(["ci",p.idx,k,type,r2(o.x),r2(o.y)]);
  }
  /* ----- per tick: Strike beacon lines land, Breach charges ride their enemy or drop when what holds them is gone ----- */
  function updateBp(dt){
    for(var i=strikes.length-1;i>=0;i--){var k=strikes[i];
      if(k.by>=0){var q=players[k.by];if(q&&q.hp>0){k.x=q.x;k.y=q.y;k.ax=q.ax;k.ay=q.ay}}
      if((k.t-=dt)>0)continue;
      strikes.splice(i,1);landStrike(k);
    }
    breaches.forEach(function(c){
      if(c.on){if(c.on.hp>0){c.x=c.on.x+c.ox;c.y=c.on.y+c.oy;c.z=(c.on.z||0)+c.oz}else settle(c)}
      else if(c.vi>=0&&!vox[c.vi])settle(c);
    });
  }
  function bpSnap(s){
    s.bc=breaches.map(function(c){return [c.id,c.by,r2(c.x),r2(c.y),r2(c.z)]});
    s.sk=strikes.map(function(k){var a=[k.id,k.by,r2(k.t),r2(k.x),r2(k.y)];(k.pts||[]).forEach(function(pt){a.push(pt[0],pt[1])});return a});
  }
  function bpHash(a){
    players.forEach(function(q){a.push(q.red||0,q.bHeld,q.dashN==null?-1:q.dashN,(callins[q.idx]||[]).join("/"))});
    breaches.forEach(function(c){a.push(c.by,c.x,c.y,c.z)});
    strikes.forEach(function(k){a.push(k.by,k.t,k.x,k.y)});
    bots.forEach(function(b){a.push(b.cache||0)});
  }
  sim.breaches=breaches;sim.strikes=strikes;sim.setCallins=setCallins;sim.podType=drawPodType;   /* podType: debug hook (rules check) */
  Object.defineProperty(sim,"callins",{get:function(){return callins}});
  /* ===== end of phase 6 ===== */

  /* ===== phase 7: bosses (GDD-D51, TDD-D14). The climb plan's boss for waves 3 and 5 (sim.plan.bosses, default the Bounty
     sniper), the wave-5 variant (T.boss.hard), the Sniper pair, the Juggernaut and the Warden. Every hit still goes through
     hitEnemy / hitMech; enemy-made blasts and collapses credit nobody.
     Queue kinds: "boss" (Bounty sniper; Sniper's nest extras too), "pair" (one pair sniper; the pair is two entries),
     "juggernaut", "warden". They aren't in T.dropOrder, so they drop first.
     Entity fields: hard (wave-5 variant), fireEvery / scrapN (per-entity overrides), pair {turn, at, m:[a,b]} and pairIdx,
     jugg and L (the Juggernaut's loader table), btype (stats name), bossName (toast), and for the Warden: wid (the parent
     id its linked entities share), body, part (a leg or platform: breaking it is no kill), slot, air (aloft, never on the
     street), rider and ride (a sniper riding a platform or the body: mode "ride"), takes (hitEnemy's damage share hook).
     Events: ["wd",what,x,y,z] what = walk (it appeared), barrage (warning placed), shell (one landed), leg, platform,
     rider (a rider fell), tell (stomp tell), stomp, pack, down (the body landed after its fourth leg), dead. ===== */
  var BOSS_KIND={juggernaut:7,wbody:8,wplat:9,wleg:10};   /* snapshot bot kinds after the phase 4 kinds 3..6 */
  var JUG_PLOW={building:1,pillar:1,barrier:1,container:1,rubble:1,awning:1};   /* what a Juggernaut charge plows through */
  var wshells=[],wardenN=0,pairG=null;
  var BOSS_AI={wbody:wardenAI,wplat:partAI,wleg:partAI};   /* updateBot runs stagger and drop-in, then these */
  /* the plan's boss for wave n: bosses[0] on wave 3 (or earlier), bosses[1] after; no plan = the Bounty sniper */
  function bossFor(n){var P=sim.plan&&sim.plan.bosses,id=P?P[n<=3?0:1]:null;return id&&BOSSES[id]?id:"sniper"}
  function bossQueue(q,w,n){
    if(!w.boss)return;var id=bossFor(n),x=T.match.extraSnipers|0,k;run.boss=id;run.riders=0;pairG=null;
    for(k=0;k<w.boss;k++){if(id==="sniperPair")q.push("pair","pair");else q.push(id==="sniper"?"boss":id)}
    if(id==="warden")run.riders=x;else for(k=0;k<x;k++)q.push("boss");   /* Sniper's nest (GDD-D39): one more Bounty sniper; with the Warden, a fourth rider */
  }
  function hardWave(){return run.wave===T.waves.length}   /* the wave-5 variant; Overtime has no boss */
  function spawnBoss(kind){
    if(kind==="boss"){bots.push(newBoss({hard:hardWave()}));return true}
    if(kind==="pair"){if(!pairG||pairG.m.length>=2)pairG={turn:0,at:tick,m:[]};bots.push(newBoss({hard:hardWave(),pair:pairG}));return true}
    if(kind==="juggernaut"){bots.push(newJuggernaut(hardWave()));return true}
    if(kind==="warden"){spawnWarden(null,null,run.riders|0);return true}
    return false;
  }
  /* health share, wave-5 variant and pair membership on a sniper newBoss built */
  function bossSetup(b,o){
    var B=T.boss,H=B.hard,mul=1;b.scrapN=B.scrap;
    if(o.pair){mul=T.pair.hp;b.pair=o.pair;b.pairIdx=o.pair.m.length;o.pair.m.push(b);b.scrapN=T.pair.scrap}
    if(o.hard&&H){mul*=H.hp;b.hard=true;b.fireEvery=H.fireEvery;b.scrapN=Math.round(b.scrapN*H.scrap/B.scrap)}
    b.hp=b.maxHp=Math.round(B.hp*mul*lvm("hp"));
    return b;
  }
  /* Sniper pair: a perch is fine when it is at least T.pair.apart from every other living member (where it stands, or lands) */
  function pairOk(g,self){return function(c){return g.m.every(function(m){if(m===self||m.hp<=0)return true;
    var s=m.mode==="jump"&&m.j1?m.j1:[m.x,m.y];return Math.hypot(c[0]-s[0],c[1]-s[1])>=T.pair.apart})}}
  function pairTurn(b){var g=b.pair;if(!g||g.turn===b.pairIdx)return true;var o=g.m[1-b.pairIdx];return !o||o.hp<=0||tick-g.at>T.pair.wait*60}
  function pairFired(b){var g=b.pair;if(g){g.turn=1-b.pairIdx;g.at=tick}}

  /* Juggernaut: a heavy loader with its own table; it lands like a loader and runs loaderAI */
  function newJuggernaut(hard){
    var J=T.juggernaut,H=T.boss.hard,b=newLoader(),L=J,k;
    if(hard&&H){L={};for(k in J)L[k]=J[k];L.cooldown=J.cooldown*H.rate}
    b.kind="juggernaut";b.type=b.btype="juggernaut";b.label=b.bossName="Juggernaut";b.jugg=true;b.L=L;b.noPods=true;b.heavy=true;b.hard=!!(hard&&H);
    b.hp=b.maxHp=Math.round(J.hp*lvm("hp")*(b.hard?H.hp:1));b.r=J.radius;b.h=J.height;b.col=[150,52,40];
    b.scrapN=Math.round(J.scrap*(b.hard?H.scrap/T.boss.scrap:1));
    return b;
  }
  /* its charge breaks what is in front at three heights through hitVoxel, so chunks break, supports fail and spans can fall;
     it runs inside updateBot, where curBy is -1, so those voxels and collapses credit nobody */
  function jugRam(b){
    var L=b.L,sx=-b.cy,sy=b.cx;
    [-.6,0,.6].forEach(function(o){
      var ax=b.x+b.cx*(b.r+.25)+sx*o*b.r,ay=b.y+b.cy*(b.r+.25)+sy*o*b.r;
      [.3,1,1.7].forEach(function(z){var x=Math.floor(ax),y=Math.floor(ay),zz=Math.floor(z);if(!inB(x,y,zz))return;
        var i=vi(x,y,zz),s=vox[i]&&structures[owner[i]];if(s&&JUG_PLOW[s.kind])hitVoxel(ax,ay,z,L.voxDmg,ax,ay,z)});
    });
  }

  /* ----- the Warden (TDD-D14): a body aloft, four legs, three platforms with a rider each (plus Sniper's nest riders on the
     body). All are entries in `bots` sharing body.wid; the body poses them every tick. Only the legs touch the street. ----- */
  function arenaOf(){var Z=ZS[ZS.length-1];return {Z:Z,A:Z.arena||{x:(Z.x0+Z.x1)/2,y:D/2}}}
  function spawnWarden(x,y,extra){
    var Wd=T.warden,hs=lvm("hp"),ar=arenaOf(),id=++wardenN,k;
    if(x==null){x=ar.Z.x1-Wd.walkIn.from;y=ar.A.y}
    var hp=Math.round(Wd.hp*hs),body={team:1,kind:"wbody",type:"warden",btype:"warden",label:"The Warden",bossName:"The Warden",wid:id,air:true,
      x:x,y:y,z:Wd.z,vz:0,dropping:false,vx:0,vy:0,r:Wd.radius,h:Wd.height,hp:hp,maxHp:hp,head:Math.atan2(ar.A.y-y,ar.A.x-x)||Math.PI,aim:Math.PI,
      state:"walkin",flash:0,step:0,t:0,cd:0,tell:0,noPods:true,noStagger:true,heavy:true,legsBroken:0,down:false,falling:false,
      barT:Wd.barrage.first,packT:0,stompCd:0,scrapN:Wd.scrap,col:[96,92,88],riders:[],parts:[],takes:wardenTakes};
    bots.push(body);
    function part(kind,slot,hp,r,h,ox,oy){var e={team:1,kind:kind,type:kind,wid:id,body:body,slot:slot,part:true,x:x,y:y,z:0,vz:0,dropping:false,vx:0,vy:0,
      r:r,h:h,hp:hp,maxHp:hp,head:0,aim:0,state:"linked",flash:0,step:0,t:0,noPods:true,noStagger:true,ox:ox,oy:oy,col:[80,78,76]};
      body.parts.push(e);bots.push(e);return e}
    var L=Wd.leg,P=Wd.platform,C=[[1,1],[1,-1],[-1,-1],[-1,1]];
    for(k=0;k<4;k++){var lg=part("wleg",k,Math.round(L.hp*hs),L.radius,Wd.z,C[k][0]*L.off,C[k][1]*L.off);lg.heavy=true}
    for(k=0;k<3;k++){var a=k*2.0944,pl=part("wplat",k,Math.round(P.hp*hs),P.radius,P.height,Math.cos(a)*P.off,Math.sin(a)*P.off);pl.air=true;pl.carry=mkRider(pl,body,k)}
    for(k=0;k<extra;k++)mkRider(body,body,3+k,-1+k*.8,0);   /* Sniper's nest: riders on the body itself, near its middle */
    poseParts(body);
    toast("The Warden walks in","var(--bad)");emitNet(["wd","walk",r2(x),r2(y),Wd.z]);
    return body;
  }
  function mkRider(carrier,body,k,ox,oy){
    var B=T.boss,hp=Math.round(B.hp*lvm("hp")),r={team:1,boss:true,rider:true,wid:body.wid,ride:carrier,rox:ox||0,roy:oy||0,x:carrier.x,y:carrier.y,z:carrier.z+carrier.h,
      vz:0,dropping:false,vx:0,vy:0,r:B.radius,h:B.height,hp:hp,maxHp:hp,head:0,aim:0,state:"boss",flash:0,step:0,mode:"ride",cd:1.2+k*.7,tell:0,blind:0,stun:0,jt:0,fallZ:0,
      jumpCd:B.jump[0],scrapN:B.scrap,noPods:true};
    body.riders.push(r);bots.push(r);return r;
  }
  function poseOne(e,b){
    var c=Math.cos(b.head),s=Math.sin(b.head);e.x=b.x+e.ox*c-e.oy*s;e.y=b.y+e.ox*s+e.oy*c;e.head=b.head;e.aim=b.aim;e.vx=e.vy=0;
    if(e.kind==="wleg"){e.z=0;e.h=Math.max(.3,b.z)}else e.z=b.z+b.h;
  }
  function seat(r){var c=r.ride;if(!c||r.hp<=0||r.mode!=="ride")return;
    if(c.kind==="wbody"){var co=Math.cos(c.head),si=Math.sin(c.head);r.x=c.x+r.rox*co-r.roy*si;r.y=c.y+r.rox*si+r.roy*co}else{r.x=c.x;r.y=c.y}
    r.z=c.z+c.h}
  function poseParts(b){b.parts.forEach(function(e){if(e.hp>0)poseOne(e,b)});b.riders.forEach(seat)}
  function ridersUp(b){return b.riders.some(function(r){return r.hp>0&&r.mode==="ride"})}
  /* hitEnemy's share for the body: half while any rider is up, x1.5 once it is down; the fall's own damage is taken whole */
  function wardenTakes(src){var Wd=T.warden,m=1;if(src.fall)return 1;if(ridersUp(this))m*=Wd.cover;if(this.down&&!this.falling)m*=Wd.fall.taken;return m}
  /* q under the Warden: within r of its centre, or (no r) inside its rotated 6x6 footprint */
  function underWarden(b,q,r){var dx=q.x-b.x,dy=q.y-b.y,c=Math.cos(b.head),s=Math.sin(b.head);
    return r?Math.hypot(dx,dy)<=r:Math.abs(dx*c+dy*s)<=T.warden.half&&Math.abs(-dx*s+dy*c)<=T.warden.half}
  function wardenAI(b,dt){
    var Wd=T.warden;b.vx=b.vy=0;
    if(b.falling){b.vz-=Wd.fall.gravity*dt;b.z+=b.vz*dt;if(b.z<=Wd.fall.z){b.z=Wd.fall.z;b.vz=0;b.falling=false;wardenLanded(b)}poseParts(b);return}
    if(b.state==="idle"){poseParts(b);return}   /* the units lab holds it */
    var p=nearestPlayer(b.x,b.y),alive=p.hp>0,low=b.hp<b.maxHp*Wd.below;
    if((b.barT-=dt)<=0){b.barT=Wd.barrage.every;if(alive)wardenBarrage(b,p)}
    if(low&&(b.packT-=dt)<=0){b.packT=Wd.pack.every;wardenPack(b)}
    if(!b.down){
      if(b.tell>0){if((b.tell-=dt)<=0){b.tell=0;wardenStomp(b)}poseParts(b);return}
      if(b.stompCd>0)b.stompCd-=dt;
      if(low&&b.stompCd<=0&&players.some(function(q){return q.hp>0&&underWarden(b,q,Wd.stomp.radius)})){
        b.tell=Wd.stomp.tell;b.stompCd=Wd.stomp.every;emitNet(["wd","tell",r2(b.x),r2(b.y),0]);poseParts(b);return}
      var ar=arenaOf(),gx=b.x,gy=b.y;
      if(b.state==="walkin"){gx=ar.A.x;gy=ar.A.y;if(Math.hypot(gx-b.x,gy-b.y)<Wd.walkIn.to)b.state="fight"}
      else if(alive){gx=p.x;gy=p.y}
      gx=Math.max(ar.Z.x0+Wd.half,Math.min(ar.Z.x1-Wd.half,gx));gy=Math.max(Wd.half+1,Math.min(D-1-Wd.half,gy));
      var dx=gx-b.x,dy=gy-b.y,d=Math.hypot(dx,dy),v=Wd.speed*Math.max(0,1-Wd.leg.slow*b.legsBroken)*(b.slow>0?T.vent.slowMul:1);
      if(d>.5&&v>0){b.head=angTo(b.head,Math.atan2(dy,dx),.6,dt);var m=Math.min(d,v*dt);b.x+=dx/d*m;b.y+=dy/d*m;b.vx=dx/d*v;b.vy=dy/d*v;b.step+=m*3}
    }
    if(alive)b.aim=angTo(b.aim,Math.atan2(p.y-b.y,p.x-b.x),1.5,dt);
    poseParts(b);
  }
  function partAI(e){var b=e.body;e.vx=e.vy=0;if(b&&b.hp>0){poseOne(e,b);if(e.carry)seat(e.carry)}}
  /* barrage: four shells on a line through mech p, along the line from the Warden to it, after a T.warden.barrage.warn s warning */
  function wardenBarrage(b,p){
    var A=T.warden.barrage,dx=p.x-b.x,dy=p.y-b.y,l=Math.hypot(dx,dy);if(l<.1){dx=Math.cos(b.aim);dy=Math.sin(b.aim);l=1}
    var ux=dx/l,uy=dy/l,pts=A.at.map(function(d){return [r2(Math.max(1,Math.min(W-2,p.x+ux*d))),r2(Math.max(1,Math.min(D-2,p.y+uy*d)))]});
    var k={id:++eid,t:A.warn,pts:pts,wid:b.wid};wshells.push(k);emitNet(["wd","barrage",r2(p.x),r2(p.y),0]);return k;
  }
  function landShells(k){
    var A=T.warden.barrage,was=curBy,src={by:-1,kind:"hazard",blast:true,w:"barrage"};curBy=-1;
    k.pts.forEach(function(pt){
      var x=pt[0],y=pt[1],z=groundZ(x,y,H),bx=Math.floor(x),by=Math.floor(y),cz=Math.max(0,z-1);
      for(var dz=-1;dz<=1;dz++)for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++)hitVoxel(bx+dx,by+dy,cz+dz,A.voxDmg,bx+dx+.5,by+dy+.5,cz+dz+.5);
      bots.forEach(function(e){if(e.hp<=0||e.dropping||e.wid===k.wid)return;   /* never its own parts or riders */
        if(Math.hypot(e.x-x,e.y-y,(e.z||0)+.5-z)<=A.radius)hitEnemy(e,A.enemyDmg*lvm("hp"),src,x,y,z+.5)});   /* x,y: the blast centre, so a Bulwark blocks from the front */
      players.forEach(function(q){if(q.hp>0&&Math.hypot(q.x-x,q.y-y,.8-z)<=A.radius)hitMech(q,A.mechDmg*lvm("dmg"),{kind:"enemy"},q.x,q.y,1)});
      sparks(x,y,z+.2,16,[255,170,70]);smoke(x,y,z+.2,5,[170,160,140]);
      emitNet(["wd","shell",r2(x),r2(y),z]);
    });
    addShake(.3);curBy=was;
  }
  function wardenPack(b){
    var g=groundNear(b.x,b.y),u=spawnUnit("pack",g[0],g[1],{drop:true});
    u.forEach(function(s){s.z=Math.min(s.z,b.z)});   /* out of its belly, not from the sky */
    emitNet(["wd","pack",r2(g[0]),r2(g[1]),r2(b.z)]);toast("The Warden drops a Scuttler pack","var(--hazard)");return u;
  }
  function wardenStomp(b){
    var S=T.warden.stomp;
    players.forEach(function(q){if(q.hp>0&&underWarden(b,q,S.radius))hitMech(q,S.dmg*lvm("dmg"),{kind:"enemy"},q.x,q.y,1)});
    smoke(b.x,b.y,.2,14,[170,160,140]);addShake(.45);emitNet(["wd","stomp",r2(b.x),r2(b.y),0]);
  }
  /* a leg or platform reached 0: no kill; a platform drops its rider, a leg staggers and slows the body, the fourth brings it down */
  function partBroken(e){
    var b=e.body,Wd=T.warden,by=creditOf(e);e.hp=0;e.gone=true;
    var c=e.kind==="wleg"?[90,86,80]:[120,112,96],z0=e.z||0;
    for(var k=0;k<10;k++)debrisPiece(e.x,e.y,z0+(e.kind==="wleg"?k*.4:.3),k%2?c:[60,62,66]);
    sparks(e.x,e.y,z0+.5,16,[255,170,60]);smoke(e.x,e.y,z0+.5,6,[90,90,90]);
    if(!b||b.hp<=0)return;
    if(e.kind==="wplat"){var r=e.carry;if(r&&r.hp>0&&r.mode==="ride")dropRider(r,by);emitNet(["wd","platform",r2(e.x),r2(e.y),r2(e.z)]);toast("Platform down: its sniper falls","var(--hazard)");return}
    b.legsBroken++;emitNet(["wd","leg",r2(e.x),r2(e.y),0]);
    if(b.legsBroken>=4){b.stag=0;b.tell=0;b.down=true;b.falling=true;b.vz=0;b.fallBy=by;toast("All four legs gone: the Warden comes down","var(--bad)")}
    else{b.stag=Math.max(b.stag||0,Wd.leg.stagger);b.tell=0;emitNet(["sg",r2(b.x),r2(b.y),r2(b.z)]);toast("Leg broken: the Warden staggers","var(--hazard)")}
  }
  /* a rider off its platform falls to the street like a sniper off its roof; the platform's breaker gets the credit and the eviction */
  function dropRider(r,by){
    r.mode="fall";r.vz=0;r.fallZ=r.z;r.tell=0;r.ride=null;
    if(by>=0){r.cr=by;r.crT=tick;evicted(by)}
    emitNet(["wd","rider",r2(r.x),r2(r.y),r2(r.z)]);
  }
  /* down: a collapse under its footprint (credited to the mech that broke the last leg), then its own fall damage */
  function wardenLanded(b){
    var C=T.collapse,by=b.fallBy===undefined?-1:b.fallBy,src={by:by,kind:"collapse"},n=0;
    bots.forEach(function(e){if(e===b||e.wid===b.wid||e.hp<=0||e.dropping||aloft(e)||!underWarden(b,e))return;hitEnemy(e,C.botDmg*lvm("hp"),src,e.x,e.y,1);if(e.hp<=0)n++});
    players.forEach(function(q){if(q.hp>0&&underWarden(b,q))hitMech(q,C.playerDmg,{kind:"collapse"},q.x,q.y,1)});
    for(var k=0;k<24;k++)smoke(b.x+(rnd()-.5)*6,b.y+(rnd()-.5)*6,.3,1,[150,140,125]);
    addShake(.7);emitNet(["wd","down",r2(b.x),r2(b.y),r2(b.z)]);emitCrushed(b.wid*1000,n,b.x,b.y,by,"collapse");
    hitEnemy(b,T.warden.fall.dmg*lvm("hp"),{by:by,kind:"collapse",fall:true},b.x,b.y,b.z+.5);
  }
  /* killBot's last step: the Warden's body takes every linked part and every rider still riding with it */
  function bossDeath(b){
    if(b.kind!=="wbody")return;
    bots.forEach(function(e){if(e===b||e.wid!==b.wid||e.hp<=0||!(e.part||e.mode==="ride"))return;
      e.hp=0;e.gone=true;for(var k=0;k<6;k++)debrisPiece(e.x,e.y,(e.z||0)+.4,k%2?[96,92,88]:[60,62,66])});
    for(var i=wshells.length-1;i>=0;i--)if(wshells[i].wid===b.wid)wshells.splice(i,1);
    addShake(.6);emitNet(["wd","dead",r2(b.x),r2(b.y),r2(b.z)]);
  }
  function updateBosses(dt){
    for(var i=wshells.length-1;i>=0;i--){var k=wshells[i];if((k.t-=dt)>0)continue;wshells.splice(i,1);landShells(k)}
  }
  /* snapshot (TDD co-op): flags 2048 wave-5 variant, 4096 Sniper pair, 8192 Warden rider, 16384 the Warden down; 4 = stomp tell on the body.
     Rows of kinds 7..10 add after the timer: max health, then body: [legs mask (bit = slot standing), riders up, stomp tell s],
     platform and leg: [body id, slot]. s.wb = [[id, seconds left, x, y, ...]] barrage warnings. */
  function bossFlags(b){return (b.hard?2048:0)|(b.pair?4096:0)|(b.rider?8192:0)|(b.down?16384:0)|(b.kind==="wbody"&&b.tell>0?4:0)}
  function bossRow(b,row){
    row.push(b.maxHp);
    if(b.kind==="wbody"){var m=0;b.parts.forEach(function(e){if(e.kind==="wleg"&&e.hp>0)m|=1<<e.slot});row.push(m,b.riders.filter(function(r){return r.hp>0&&r.mode==="ride"}).length,r2(b.tell||0))}
    else if(b.part){if(!b.body.id)b.body.id=++eid;row.push(b.body.id,b.slot)}
  }
  function bossSnap(s){s.wb=wshells.map(function(k){var a=[k.id,r2(k.t)];k.pts.forEach(function(p){a.push(p[0],p[1])});return a})}
  function bossHash(a){
    wshells.forEach(function(k){a.push(k.t,k.pts[0][0],k.pts[0][1])});
    bots.forEach(function(b){if(b.kind==="wbody")a.push(b.legsBroken,b.tell,b.barT,b.packT,b.down?1:0);if(b.pair)a.push(b.pair.turn)});
  }
  /* lab and rules-check hooks. spawnBoss(kind,x,y,o): "sniper" | "pair" (returns both) | "juggernaut" (at x,y, o.drop) |
     "warden" (body at x,y or the far end of the Terminus Yard; o.riders extra body riders); o.hard = the wave-5 variant.
     bossAct(body, "barrage" | "pack" | "stomp" | "tell"): run one Warden behaviour now. */
  sim.spawnBoss=function(kind,x,y,o){
    o=o||{};var b;
    if(kind==="warden")return spawnWarden(x,y,o.riders|0);
    if(kind==="juggernaut"){b=newJuggernaut(!!o.hard);if(x!=null){b.x=x;b.y=y;b.z=o.drop?T.bot.dropHeight:0;b.dropping=!!o.drop}bots.push(b);return b}
    if(kind==="pair"){var g={turn:0,at:tick,m:[]},a=newBoss({hard:!!o.hard,pair:g});bots.push(a);b=newBoss({hard:!!o.hard,pair:g});bots.push(b);return [a,b]}
    b=newBoss({hard:!!o.hard});bots.push(b);return b;
  };
  sim.bossAct=function(b,what){
    if(what==="barrage")return wardenBarrage(b,nearestPlayer(b.x,b.y));
    if(what==="pack")return wardenPack(b);
    if(what==="stomp"){wardenStomp(b);return true}
    if(what==="tell"){b.tell=T.warden.stomp.tell;b.stompCd=T.warden.stomp.every;emitNet(["wd","tell",r2(b.x),r2(b.y),0]);return true}
  };
  sim.wshells=wshells;sim.bossFor=bossFor;
  /* ===== end of phase 7 ===== */

  /* ----- update ----- */
  function updatePlayer(p,dt,inp){
    curBy=p.idx;
    if(p.combo>1&&(p.comboT+=dt)>=T.combo.decay)setCombo(p,1);
    if(moveMech(p,inp,T,dt)){addHeat(p,T.player.dashHeat*(p.dashHeat||1));smoke(p.x,p.y,.2,6,[120,200,220])}
    p.calm+=dt;
    if(p.regen&&p.calm>=T.nanite.delay&&p.hp<p.maxHp){p.hp=Math.min(p.maxHp,p.hp+T.nanite.regen*dt);if(rnd()<.05)sparks(p.x,p.y,1,1,[127,220,106])}
    p.ax=inp.ax;p.ay=inp.ay;p.az=inp.az;
    p.aim=angTo(p.aim,Math.atan2(p.ay-p.y,p.ax-p.x),p.torT*(p.retract>0?T.pile.retractTurn:1),dt);
    var qd=!!(inp.k&32);updateShoulder(p,dt,qd&&!p.qPrev);p.qPrev=qd;
    /* Heat */
    if(p.over){p.over-=dt;p.heat=Math.max(0,p.heat-dt*100/T.heat.lockout);if(rnd()<.3)smoke(p.x,p.y,1.4,1,[200,200,200]);if(p.over<=0){p.over=0;toast("Cooled down","var(--good)",p.idx)}}
    else p.heat=Math.max(0,p.heat-p.drain*dt);
    p.cool-=dt;
    if(inp.l&&!p.over&&p.cool<=0){fireMinigun(p);var gg=T[p.gun];p.cool=Math.max(p.cool,-dt)+(gg.every||1/gg.rate)}   /* carry the tick's leftover so rates match T on 60 Hz ticks */
    var press=inp.rp||(inp.r&&!p.rPrev);p.rPrev=inp.r;inp.rp=false;p.rDown=inp.r;
    updatePile(p,dt,press);
    p.muzzle-=dt;p.flash-=dt;if(p.oc>0)p.oc=Math.max(0,p.oc-dt);
    bpTick(p,dt,inp);   /* phase 6: Redline cost, Overdrive, call-ins */
  }
  function updateBot(b,dt){
    var B=T.bot,p=nearestPlayer(b.x,b.y);
    b.flash-=dt;if(b.slow>0)b.slow-=dt;
    /* staggered (GDD-D35): no moving, firing, charging or jumping, and any tell is lost; a falling sniper still falls */
    if(b.stag>0){b.stag=Math.max(0,b.stag-dt);
      if(!b.dropping&&b.mode!=="fall"&&b.mode!=="jump"){b.vx=b.vy=0;b.tell=0;
        if(b.state==="tell"||b.state==="charge"){b.state="recover";b.t=T.loader.recover;b.cd=T.loader.cooldown}
        if(b.boss&&b.stun>0)b.stun=Math.max(0,b.stun-dt);
        return}}
    if(b.boss){updateBoss(b,dt);return}
    if(b.oc>0)b.oc-=dt;
    if(b.dropping){
      b.vz-=30*dt;b.z+=b.vz*dt;
      if(b.z<=0){b.z=0;b.dropping=false;smoke(b.x,b.y,.1,10,[150,140,120]);sparks(b.x,b.y,.2,8,[255,200,120]);
        players.forEach(function(q){if(q.hp>0&&Math.hypot(q.x-b.x,q.y-b.y)<1.2)hitMech(q,10*lvm("dmg"),{kind:"enemy",mul:emul(b)},q.x,q.y,1)})}
      return;
    }
    if(b.kind&&BOSS_AI[b.kind]){BOSS_AI[b.kind](b,dt);return}   /* phase 7: the Warden and its parts */
    if(b.kind&&ZONE_AI[b.kind]){ZONE_AI[b.kind](b,dt);return}   /* phase 4: Scuttler, Bulwark, Wrecker, charge */
    var alive=p.hp>0,dist=alive?Math.hypot(p.x-b.x,p.y-b.y):99,sees=alive&&dist<B.sight&&los(b.x,b.y,p.x,p.y,.8);
    var goal=null,want=0;
    if(b.loader){var lg=loaderAI(b,dt,alive,dist,sees);goal=lg[0];want=lg[1]}
    else if(b.state==="patrol"||b.state==="engage"){var pd=podFor(b);if(pd){b.state="seekpod";b.pod=pd}}
    if(b.state==="seekpod"){
      if(pods.indexOf(b.pod)<0){b.state=sees?"engage":"patrol";b.lost=0;b.wp=null;b.pod=null}
      else{goal=stepToward(b.pod.field,b.x,b.y);want=B.speed*1.1;b.aim=angTo(b.aim,Math.atan2(goal[1]-b.y,goal[0]-b.x),B.turretTurn,dt)}
    }
    if(!b.loader&&b.state==="patrol"){
      if(sees){b.state="engage";b.lost=0}
      if(!b.wp||Math.hypot(b.wp[0]-b.x,b.wp[1]-b.y)<.6){b.wp=spawnCells[(rnd()*spawnCells.length)|0];b.wpField=flowField(b.wp[0],b.wp[1],b.wpField)}
      goal=stepToward(b.wpField,b.x,b.y);want=B.speed*.55;
      b.aim=angTo(b.aim,b.head,B.turretTurn,dt);
    }
    if(!b.loader&&b.state==="engage"){
      b.lost=sees?0:b.lost+dt;
      if(!alive||b.lost>3){b.state="patrol";b.wp=null}
      else if(!sees||dist>B.range){goal=stepToward(p.field,b.x,b.y);want=B.speed}
      else{
        b.strafeT-=dt;if(b.strafeT<=0){b.strafeT=1.5+rnd()*2;b.strafe*=-1}
        var ux=(p.x-b.x)/dist,uy=(p.y-b.y)/dist,back=dist<B.range*.55?-1:0;
        goal=[b.x-uy*b.strafe+ux*back,b.y+ux*b.strafe+uy*back];want=B.speed*.6;
      }
      if(alive){
        var ta=Math.atan2(p.y-b.y,p.x-b.x);b.aim=angTo(b.aim,ta,B.turretTurn,dt);
        b.cd-=dt*(b.oc>0?T.pods.fire:1)*(b.slow>0?T.vent.slowMul:1);
        if(sees&&b.cd<=0&&Math.abs(Math.atan2(Math.sin(ta-b.aim),Math.cos(ta-b.aim)))<.15){
          b.cd=B.fireEvery*(.85+rnd()*.3);
          var ox=b.x+Math.cos(b.aim)*.55,oy=b.y+Math.sin(b.aim)*.55,oz=.72,dx=p.x-ox,dy=p.y-oy,dz=.9-oz,d=Math.hypot(dx,dy,dz);
          shots.push({x:ox,y:oy,z:oz,vx:dx/d*B.shotSpeed,vy:dy/d*B.shotSpeed,vz:dz/d*B.shotSpeed,dmg:B.shotDmg*lvm("dmg")*emul(b),team:1,t:2,kind:"orb"});
          sparks(ox,oy,oz,3,[255,90,74]);
        }
      }
    }
    if(goal){
      var gx=goal[0]-b.x,gy=goal[1]-b.y,gl=Math.hypot(gx,gy);
      if(gl>.05){var th=Math.atan2(gy,gx);b.head=angTo(b.head,th,5,dt);
        var fw=Math.max(0,Math.cos(Math.atan2(Math.sin(th-b.head),Math.cos(th-b.head))));
        b.vx=Math.cos(b.head)*want*fw;b.vy=Math.sin(b.head)*want*fw}
      else{b.vx*=.8;b.vy*=.8}
    }
    var sm=b.slow>0?T.vent.slowMul:1;
    b.x+=b.vx*dt*sm;b.y+=b.vy*dt*sm;b.step+=Math.hypot(b.vx,b.vy)*dt*3*sm;
  }
  /* Heavy loader: hauls ore between two waypoints; in sight it closes in, telegraphs, then rams in a straight line. */
  function loaderAI(b,dt,alive,dist,sees){
    var L=b.L||T.loader,p=nearestPlayer(b.x,b.y);   /* b.L: the Juggernaut's own table (phase 7) */
    if(b.slow>0)dt*=T.vent.slowMul;   /* frozen: the tell, the charge and the cooldown all run slow */
    b.cd-=dt;
    if(b.state==="tell"){
      b.vx=b.vy=0;b.head=angTo(b.head,Math.atan2(b.cy,b.cx),12,dt);
      if((b.t-=dt)<=0){b.state="charge";b.t=L.charge;b.hit=false}
      return [null,0];
    }
    if(b.state==="charge"){
      b.vx=b.cx*L.chargeSpeed;b.vy=b.cy*L.chargeSpeed;b.head=Math.atan2(b.cy,b.cx);(b.jugg?jugRam:ram)(b);
      if(!b.hit&&alive&&Math.hypot(p.x-b.x,p.y-b.y)<b.r+p.r+.05){
        b.hit=true;hitMech(p,L.dmg*lvm("dmg"),{kind:"enemy",mul:emul(b)},p.x,p.y,1);if(!p.immune)knockBot(p,b.cx,b.cy,L.shove*(p.shoveMul||1),false);
        sparks(p.x,p.y,.9,14,[255,200,90]);addShake(.4);
      }
      if(b.hit||(b.t-=dt)<=0){b.state="recover";b.t=L.recover;b.cd=L.cooldown}
      return [null,0];
    }
    if(b.state==="recover"){b.vx=b.vy=0;if((b.t-=dt)<=0)b.state="engage";return [null,0]}
    if(b.state==="patrol"){
      if(sees){b.state="engage";b.lost=0}
      else{
        if(!b.wp||Math.hypot(b.wp[0]-b.x,b.wp[1]-b.y)<.8){b.ri=1-b.ri;b.wp=b.route[b.ri];b.wpField=flowField(b.wp[0],b.wp[1],b.wpField)}
        return [stepToward(b.wpField,b.x,b.y),L.speed*L.patrol];
      }
    }
    b.lost=sees?0:b.lost+dt;
    if(!alive||b.lost>3){b.state="patrol";b.wp=null;return [null,0]}
    if(sees&&dist<L.engage&&b.cd<=0){b.state="tell";b.t=L.tell;b.cx=(p.x-b.x)/dist;b.cy=(p.y-b.y)/dist;return [null,0]}
    return [stepToward(p.field,b.x,b.y),L.speed];
  }
  /* Barriers, containers and windows in front of a charging loader are plowed through. */
  function ram(b){
    var L=T.loader,sx=-b.cy,sy=b.cx;
    [-.5,0,.5].forEach(function(o){
      var ax=b.x+b.cx*(b.r+.25)+sx*o*b.r,ay=b.y+b.cy*(b.r+.25)+sy*o*b.r;
      [.3,1.0].forEach(function(z){var m=solidAt(ax,ay,z);if(m===5||WINDOW[m]||m===8||m===14)hitVoxel(ax,ay,z,L.voxDmg,ax,ay,z)});
    });
  }
  /* ===== phase 4: zone enemies (GDD-D40, TDD AI). Scuttler packs, the Bulwark, the Wrecker and its charge, Elites, and
     the zone threats that put them into the waves. They live in `bots` with a `kind`; updateBot runs the shared stagger
     and drop-in code, then hands them to ZONE_AI. Blasts and charges an enemy starts credit nobody (GDD-D48).
     Entity fields: kind, type (stats name), label (toasts), col (debris), scrapR (cube range), frail (dies to any Perfect),
     noPods, heavy (the winch pulls the mech), blocks (Bulwark shield), elite. ===== */
  var ZONE_KIND={scuttler:3,bulwark:4,wrecker:5,charge:6};   /* snapshot bot kind codes after bot 0, loader 1, boss 2 */
  var ZONE_AI={scuttler:scuttlerAI,bulwark:bulwarkAI,wrecker:wreckerAI,charge:chargeAI};
  var charged={};   /* chunk id -> 1 while a Wrecker charge sits on it */
  function emul(b){return b&&b.elite&&T.elite?T.elite.dmg:1}   /* an Elite's damage multiplier, for hitMech's src.mul */
  function shieldDown(b){return b.shieldEnd>tick}   /* a Bulwark's shield is broken until tick shieldEnd */
  function zoneFlags(b){return (b.elite?128:0)|(b.state==="flash"||b.state==="plant"||b.bashT>0?256:0)|(shieldDown(b)?512:0)}
  function zoneTimer(b){return Math.max(0,b.kind==="bulwark"?(b.shieldEnd-tick)/60||0:b.t||0)}
  function threatOf(kind){var Z=T.zoneThreats||[];for(var i=0;i<Z.length;i++)if(Z[i].elite?kind.indexOf("elite-")===0:Z[i].enemy===kind)return Z[i];return null}
  /* zones open for this level's waves: the zone a drop-in opens counts from the start, so wave 1 already has its threat */
  function openZones(){return Math.max(zone.open,zone.target+1)}
  /* Zone threats (GDD-D40): swap wave n's slots for each open zone's enemy, mark one Elite, then sort the queue into the
     GDD's drop order (T.dropOrder; kinds it doesn't list drop first, like the boss). Returns q, changed in place. */
  function zoneSlots(q,n){
    var c=lvm("count"),open=openZones(),O=T.dropOrder||{};
    (T.zoneThreats||[]).forEach(function(Z){
      if(Z.zone>=open||(Z.waves&&Z.waves.indexOf(n)<0))return;
      var i;
      if(Z.elite){var at=[];q.forEach(function(k,j){if(k==="bot"||k==="loader")at.push(j)});
        if(at.length){i=at[(rnd()*at.length)|0];q[i]="elite-"+q[i]}return}
      var take=Math.round(Z.n*c),took=0;
      for(i=q.length-1;i>=0&&took<take;i--)if(q[i]===Z.take){q.splice(i,1);took++}
      if(!took)return;
      for(var k=0,g=Math.max(1,Math.round(Z.give*c));k<g;k++)q.push(Z.enemy);
    });
    function rank(k){return O[k]===undefined?0:O[k]}
    var tagged=q.map(function(k,j){return [k,j]});
    tagged.sort(function(a,b){return rank(a[0])-rank(b[0])||a[1]-b[1]});
    tagged.forEach(function(e,j){q[j]=e[0]});
    return q;
  }
  /* A zone enemy prefers a street cell inside its home zone, more than 10 m from every mech; else the usual pick. */
  function pickZoneSpawn(zk){
    var Z=zk>=0?ZS[zk]:null;
    if(Z){var cs=spawnCells.filter(function(c){return c[0]>Z.x0&&c[0]<Z.x1+1});
      for(var t=0;t<40&&cs.length;t++){var c=cs[(rnd()*cs.length)|0];
        if(players.every(function(q){return q.hp<=0||Math.hypot(c[0]-q.x,c[1]-q.y)>10}))return c}}
    return pickSpawn();
  }
  /* Queue entries this phase adds; false hands the entry back to the usual bot / loader / boss drop. */
  function spawnZone(kind){
    var Z=threatOf(kind),zk=Z?Z.zone:-1,c,k;
    if(kind==="pack"){var S=T.scuttler;c=pickZoneSpawn(zk);   /* a pack lands together */
      for(k=0;k<S.pack;k++){var a=k/S.pack*6.283+rnd()*.5,g=groundNear(c[0]+Math.cos(a)*S.spread,c[1]+Math.sin(a)*S.spread);bots.push(newUnit("scuttler",g[0],g[1],true))}
      return true}
    if(kind==="bulwark"||kind==="wrecker"){c=pickZoneSpawn(zk);bots.push(newUnit(kind,c[0],c[1],true));return true}
    if(kind==="elite-bot"||kind==="elite-loader"){var e=kind==="elite-bot"?newBot():newLoader();c=pickZoneSpawn(zk);e.x=c[0];e.y=c[1];bots.push(makeElite(e));return true}
    return false;
  }
  function makeElite(e){e.elite=true;e.hp=e.maxHp=Math.round(e.maxHp*T.elite.hp);e.label="Elite "+(e.loader?"loader":"patrol bot");return e}
  function newUnit(kind,x,y,drop){
    var S=T[kind],hp=Math.round(S.hp*lvm("hp")),a=rnd()*6.283;
    var b={team:1,kind:kind,type:kind,x:x,y:y,z:drop?T.bot.dropHeight:0,vz:0,dropping:!!drop,vx:0,vy:0,r:S.radius,h:S.height,hp:hp,maxHp:hp,
      head:a,aim:a,state:"patrol",wp:null,wpField:null,lost:0,flash:0,step:0,t:0,cd:0,scrapR:S.scrap};
    if(kind==="scuttler"){b.frail=true;b.noPods=true;b.label="Scuttler";b.col=[214,160,40]}
    else if(kind==="bulwark"){b.armored=true;b.heavy=true;b.blocks=bulwarkBlocks;b.shieldEnd=0;b.bashT=0;b.label="Bulwark";b.col=[110,120,134];
      b.route=[spawnCells[(rnd()*spawnCells.length)|0],spawnCells[(rnd()*spawnCells.length)|0]];b.ri=0}
    else if(kind==="wrecker"){b.state="move";b.target=-1;b.spot=null;b.label="Wrecker";b.col=[150,64,170]}
    return b;
  }
  function newCharge(x,y,chunk,fuse){
    var C=T.charge;if(chunk>=0)charged[chunk]=1;
    return {team:1,kind:"charge",type:"charge",x:x,y:y,z:0,vz:0,dropping:false,vx:0,vy:0,r:C.radius,h:C.height,hp:C.hp,maxHp:C.hp,
      head:0,aim:0,state:"armed",flash:0,step:0,t:fuse,chunk:chunk,noPods:true,noStagger:true,label:"Charge"};
  }
  /* Debug and lab hook: put one unit down at (x,y). kind: scuttler | bulwark | wrecker | elite-bot | elite-loader | charge
     (o.chunk: the chunk id it breaks, o.fuse: seconds) | pack (returns the 4 Scuttlers). o.drop: falls in from 9 m. */
  function spawnUnit(kind,x,y,o){
    o=o||{};var b;
    if(kind==="pack"){var out=[];for(var k=0;k<T.scuttler.pack;k++){var a=k/T.scuttler.pack*6.283,g=groundNear(x+Math.cos(a)*T.scuttler.spread,y+Math.sin(a)*T.scuttler.spread);
      b=newUnit("scuttler",g[0],g[1],o.drop);bots.push(b);out.push(b)}return out}
    if(kind==="charge")b=newCharge(x,y,o.chunk===undefined?-1:o.chunk,o.fuse===undefined?T.charge.fuse:o.fuse);
    else if(kind==="elite-bot"||kind==="elite-loader"){b=makeElite(kind==="elite-bot"?newBot():newLoader());b.x=x;b.y=y;b.z=o.drop?T.bot.dropHeight:0;b.dropping=!!o.drop}
    else b=newUnit(kind,x,y,o.drop);
    bots.push(b);return b;
  }
  /* Shared movement: turn toward the goal at `turn` rad/s, drive forward as far as the heading allows. */
  function zoneMove(b,goal,want,turn,dt){
    var gl=goal?Math.hypot(goal[0]-b.x,goal[1]-b.y):0;
    if(gl>.05){var th=Math.atan2(goal[1]-b.y,goal[0]-b.x);b.head=angTo(b.head,th,turn,dt);
      var fw=Math.max(0,Math.cos(Math.atan2(Math.sin(th-b.head),Math.cos(th-b.head))));b.vx=Math.cos(b.head)*want*fw;b.vy=Math.sin(b.head)*want*fw}
    else{b.vx*=.8;b.vy*=.8}
    var sm=b.slow>0?T.vent.slowMul:1;b.x+=b.vx*dt*sm;b.y+=b.vy*dt*sm;b.step+=Math.hypot(b.vx,b.vy)*dt*3*sm;
  }
  function wander(b){
    if(!b.wp||Math.hypot(b.wp[0]-b.x,b.wp[1]-b.y)<.6){b.wp=spawnCells[(rnd()*spawnCells.length)|0];b.wpField=flowField(b.wp[0],b.wp[1],b.wpField)}
    return stepToward(b.wpField,b.x,b.y);
  }
  function stepAway(field,x,y){   /* uphill on a mech's flow field: away from it, around walls */
    var cx=Math.floor(x),cy=Math.floor(y),best=field[cx+cy*W],bx=cx,by=cy;
    for(var k=0;k<8;k++){var nx=cx+N8[k][0],ny=cy+N8[k][1];if(blockedCell(nx,ny))continue;
      if(k>3&&(blockedCell(cx+N8[k][0],cy)||blockedCell(cx,cy+N8[k][1])))continue;
      var v=field[nx+ny*W];if(v<1e9&&v>best){best=v;bx=nx;by=ny}}
    return [bx+.5,by+.5];
  }
  function mechDist(x,y){var m=1e9;players.forEach(function(q){if(q.hp>0)m=Math.min(m,Math.hypot(q.x-x,q.y-y))});return m}

  /* Scuttler: runs straight at the nearest mech, flashes 0.4 s within 1.2 m, then blows up. Shot down, it blows up where it
     is; knocked into another enemy, it blows up on contact. The blast (10 within 1.5 m to mechs and enemies alike, a
     one-voxel chip) credits nobody. */
  function scuttlerAI(b,dt){
    var S=T.scuttler,p=nearestPlayer(b.x,b.y),alive=p.hp>0,dist=alive?Math.hypot(p.x-b.x,p.y-b.y):99,goal=null,want=0;
    if(b.state==="idle"){b.vx=b.vy=0;return}
    if(b.state==="flash"){if((b.t-=dt)<=0){scuttlerBlast(b);return}zoneMove(b,null,0,10,dt);return}
    if(b.state==="patrol"){if(alive&&dist<S.sight&&los(b.x,b.y,p.x,p.y,.4))b.state="engage";else{goal=wander(b);want=S.speed*.5}}
    if(b.state==="engage"){
      if(!alive){b.state="patrol";b.wp=null}
      else if(dist<S.trigger){b.state="flash";b.t=S.flash;sparks(b.x,b.y,.5,6,[255,230,120]);floatText(b.x,b.y,1.1,"!","#ffb84a")}
      else{goal=dist<3&&los(b.x,b.y,p.x,p.y,.4)?[p.x,p.y]:stepToward(p.field,b.x,b.y);want=S.speed}
    }
    zoneMove(b,goal,want,10,dt);b.aim=b.head;
  }
  function scuttlerBlast(b){if(b.blown)return;b.blown=true;b.hp=0;b.state="blown";enemyBlast(b.x,b.y,T.scuttler,b)}   /* self-destruct: no kill, no scrap */
  function scuttlerBump(b){
    for(var i=0;i<bots.length;i++){var e=bots[i];if(e===b||e.hp<=0||e.dropping||aloft(e))continue;
      if(Math.hypot(e.x-b.x,e.y-b.y)<b.r+e.r+.05){scuttlerBlast(b);return true}}
    return false;
  }
  function enemyBlast(x,y,S,from){
    var src={by:-1,kind:"hazard",blast:true,w:"scuttler"};
    sparks(x,y,.4,22,[255,190,60]);smoke(x,y,.4,6,[150,140,120]);addShake(.12);
    players.forEach(function(q){if(q.hp>0&&Math.hypot(q.x-x,q.y-y)<=S.blast)hitMech(q,S.dmg*lvm("dmg"),{kind:"enemy"},q.x,q.y,1)});
    bots.forEach(function(e){if(e!==from&&e.hp>0&&!e.dropping&&!aloft(e)&&Math.hypot(e.x-x,e.y-y)<=S.blast)hitEnemy(e,S.dmg*lvm("hp"),src,x,y,.5)});
    var best=null,bd=1e9,cx=Math.floor(x),cy=Math.floor(y);   /* the one-voxel chip: the nearest voxel the blast reaches */
    for(var z=0;z<2;z++)for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++){var vx=cx+dx,vy=cy+dy;if(!get(vx,vy,z))continue;
      var d=Math.hypot(vx+.5-x,vy+.5-y,z+.5-.3);if(d<=S.blast&&d<bd){bd=d;best=[vx,vy,z]}}
    if(best){var sv=curBy;curBy=-1;hitVoxel(best[0],best[1],best[2],S.hole);curBy=sv}
  }

  /* Bulwark: a loader with a riot shield facing its walk, turning at 1.2 rad/s. The shield blocks every hit within 60 degrees
     of its front (GDD-D48 step 1) except the rail slug, collapses, slag and other non-blast hazards. A Perfect into the shield
     breaks it for 5 s, and its damage and stagger go through. At 3 m it bashes: 15 and a 2 m shove, then 2 s. */
  function bulwarkBlocks(src,x,y){
    var b=this,K=T.bulwark;
    if(shieldDown(b)||b.dropping)return false;
    if(src.kind==="collapse"||src.w==="rail"||(src.kind==="hazard"&&!src.blast))return false;
    var dx=x-b.x,dy=y-b.y;
    if(x===undefined||Math.hypot(dx,dy)<.15){var q=src.by>=0?players[src.by]:null;if(!q)return false;dx=q.x-b.x;dy=q.y-b.y}   /* a hit on its centre: from the attacker's side */
    var a=Math.atan2(dy,dx),off=Math.abs(Math.atan2(Math.sin(a-b.head),Math.cos(a-b.head)));
    if(off>K.arc*Math.PI/180)return false;
    if(src.grade==="Perfect"){b.shieldEnd=tick+Math.round(K.broken*60);floatText(b.x,b.y,1.9,"SHIELD BROKEN","#f2c230");sparks(b.x+Math.cos(b.head)*.7,b.y+Math.sin(b.head)*.7,.9,16,[200,220,255]);emitNet(["sb",r2(b.x),r2(b.y)]);return false}
    sparks(b.x+Math.cos(b.head)*.7,b.y+Math.sin(b.head)*.7,.9,5,[200,220,255]);if(b.cue===undefined||tick-b.cue>20){b.cue=tick;floatText(b.x,b.y,1.7,"BLOCKED","#a39d93")}
    return true;
  }
  function bulwarkAI(b,dt){
    var K=T.bulwark,p=nearestPlayer(b.x,b.y),alive=p.hp>0,dist=alive?Math.hypot(p.x-b.x,p.y-b.y):99,goal=null,want=0;
    if(b.bashT>0)b.bashT-=dt;b.cd-=dt*(b.slow>0?T.vent.slowMul:1);
    if(b.state==="idle"){b.vx=b.vy=0;return}
    var sees=alive&&dist<K.sight&&los(b.x,b.y,p.x,p.y,.8);
    if(b.state==="patrol"){
      if(sees){b.state="engage";b.lost=0}
      else{if(!b.wp||Math.hypot(b.wp[0]-b.x,b.wp[1]-b.y)<.8){b.ri=1-b.ri;b.wp=b.route[b.ri];b.wpField=flowField(b.wp[0],b.wp[1],b.wpField)}
        goal=stepToward(b.wpField,b.x,b.y);want=K.speed*K.patrol}
    }
    if(b.state==="engage"){
      b.lost=sees?0:b.lost+dt;
      if(!alive||b.lost>3){b.state="patrol";b.wp=null}
      else{
        var ta=Math.atan2(p.y-b.y,p.x-b.x),off=Math.abs(Math.atan2(Math.sin(ta-b.head),Math.cos(ta-b.head)));
        if(sees&&dist<=K.bash&&b.cd<=0&&off<=K.arc*Math.PI/180){
          var ux=(p.x-b.x)/dist,uy=(p.y-b.y)/dist;
          hitMech(p,K.bashDmg*lvm("dmg"),{kind:"enemy",mul:emul(b)},p.x,p.y,1);if(!p.immune)knockBot(p,ux,uy,K.shove,false);
          b.cd=K.bashEvery;b.bashT=.3;sparks(p.x,p.y,1,12,[200,220,255]);addShake(.3);
        }
        if(dist>b.r+p.r+.5){goal=sees&&dist<3?[p.x,p.y]:stepToward(p.field,b.x,b.y);want=K.speed}
        else b.head=angTo(b.head,ta,K.turn,dt);   /* up close it only turns, slowly: the flanker's window */
      }
    }
    zoneMove(b,goal,want,K.turn,dt);b.aim=b.head;
  }

  /* Wrecker: keeps more than 8 m from every mech; walks to the pillar or building chunk nearest a mech that is still at least
     8 m from every mech, and plants a charge over 2.5 s (any damage restarts it). With no such chunk it holds back. */
  function chunkCenter(c){if(c.mx===undefined){var sx=0,sy=0;c.v.forEach(function(i){sx+=i%W;sy+=((i/W)|0)%D});c.mx=sx/c.v.length+.5;c.my=sy/c.v.length+.5}return [c.mx,c.my]}
  function plantSpot(c,b){   /* the street cell beside the chunk's lowest voxels, outside the keep ring, nearest the Wrecker: [x,y, voxel x,y] */
    var best=null,bd=1e9;
    c.v.forEach(function(i){if(!vox[i]||chunkOf[i]!==c.id)return;var z=(i/(W*D))|0;if(z>1)return;var x=i%W,y=((i/W)|0)%D;
      for(var k=0;k<4;k++){var nx=x+N8[k][0],ny=y+N8[k][1];if(blockedCell(nx,ny)||mechDist(nx+.5,ny+.5)<T.wrecker.keep)continue;
        var d=Math.hypot(nx+.5-b.x,ny+.5-b.y);if(d<bd){bd=d;best=[nx+.5,ny+.5,x+.5,y+.5]}}});
    return best;
  }
  function wreckOk(c){if(!c||!c.alive)return false;var m=chunkCenter(c);return mechDist(m[0],m[1])>=T.wrecker.keep}
  function pickWreck(b){
    var R=T.wrecker,ox=openX(),cand=[];b.target=-1;b.spot=null;
    for(var i=0;i<chunks.length;i++){var c=chunks[i];if(!c.alive||c.cz!==0||charged[c.id]||(b.avoid&&b.avoid[c.id]>tick))continue;
      var s=structures[c.s];if(!s||(s.kind!=="pillar"&&s.kind!=="building"))continue;
      var m=chunkCenter(c);if(m[0]>=ox)continue;var md=mechDist(m[0],m[1]);if(md>=R.keep)cand.push([md,c])}
    cand.sort(function(a,b){return a[0]-b[0]||a[1].id-b[1].id});
    for(var k=0;k<cand.length&&k<4;k++){var ch=cand[k][1],sp=plantSpot(ch,b);if(!sp)continue;
      b.wpField=flowField(sp[0],sp[1],b.wpField);if(b.wpField[Math.floor(b.x)+Math.floor(b.y)*W]>=1e9)continue;
      b.target=ch.id;b.spot=sp;return ch}
    return null;
  }
  function wreckerAI(b,dt){
    var R=T.wrecker,near=null,nd=1e9,goal=null,want=0,hurt=b.lastHp!==undefined&&b.hp<b.lastHp;b.lastHp=b.hp;
    if(b.state==="idle"){b.vx=b.vy=0;return}
    players.forEach(function(q){if(q.hp<=0)return;var d=Math.hypot(q.x-b.x,q.y-b.y);if(d<nd){nd=d;near=q}});
    b.cd-=dt;
    if(near&&(nd<R.keep||b.state==="flee"&&nd<R.keep+1)){b.state="flee";b.t=0;goal=stepAway(near.field,b.x,b.y);want=R.speed}   /* backs off to a metre past the ring */
    else if(b.state==="plant"){
      b.vx=b.vy=0;if(hurt)b.t=R.plant;   /* any damage restarts the plant */
      if(!wreckOk(chunks[b.target])){b.state="move";b.t=0;b.target=-1;b.cd=0}
      else if((b.t-=dt*(b.slow>0?T.vent.slowMul:1))<=0){var sp=b.spot;
        bots.push(newCharge(sp[0]+(sp[2]-sp[0])*.4,sp[1]+(sp[3]-sp[1])*.4,b.target,T.charge.fuse));toast("Wrecker charge planted: shoot it or clear out","var(--hazard)");
        b.state="move";b.t=0;b.target=-1;b.cd=0}
      return;
    }
    else{
      if(b.state!=="hold")b.state="move";
      if(b.cd<=0||b.target<0||!wreckOk(chunks[b.target])){b.cd=R.retarget;pickWreck(b)}
      if(b.target>=0){b.state="move";
        if(Math.hypot(b.spot[0]-b.x,b.spot[1]-b.y)<.5){b.state="plant";b.t=R.plant;b.vx=b.vy=0;return}
        goal=stepToward(b.wpField,b.x,b.y);if(Math.hypot(goal[0]-b.x,goal[1]-b.y)<.3)goal=[b.spot[0],b.spot[1]];want=R.speed;
        if(mechDist(goal[0],goal[1])<R.keep){(b.avoid=b.avoid||{})[b.target]=tick+600;b.target=-1;b.cd=0;goal=null}}   /* its path runs into the ring: try another chunk for 10 s */
      else{b.state="hold";goal=wander(b);want=R.speed*.6}   /* nothing safe to break: hold back and reposition */
    }
    zoneMove(b,goal,want,6,dt);b.aim=b.head;
  }
  /* The charge: 20 health and a 4 s fuse (2 s when dropped by a dying Wrecker). Shot, it goes off early. It breaks its chunk
     (a pillar's whole base) through the normal break path with nobody as the breaker, so its collapse credits nobody. */
  function chargeAI(b,dt){b.vx=b.vy=0;if((b.t-=dt)<=0)detonate(b)}
  function detonate(b){
    if(b.gone)return;b.gone=true;b.hp=0;if(b.chunk>=0)delete charged[b.chunk];
    sparks(b.x,b.y,.5,26,[255,160,60]);smoke(b.x,b.y,.5,10,[120,110,100]);addShake(.3);
    var c=b.chunk>=0?chunks[b.chunk]:null;if(!c||!c.alive)return;
    var m=chunkCenter(c);if(Math.hypot(m[0]-b.x,m[1]-b.y)>T.charge.reach)return;
    var sv=curBy;curBy=-1;
    breakChunk(c);var s=structures[c.s];if(s&&s.kind==="pillar")s.gc.forEach(function(g){if(chunks[g].alive)breakChunk(chunks[g])});
    curBy=sv;
  }
  /* After killBot's kill: a Scuttler blows up, a Wrecker killed mid-plant drops its charge, an Elite leaves a pod. */
  function zoneDeath(b){
    if(b.kind==="scuttler"&&!b.blown){b.blown=true;enemyBlast(b.x,b.y,T.scuttler,b)}
    if(b.kind==="wrecker"&&b.state==="plant"&&b.target>=0&&chunks[b.target]&&chunks[b.target].alive)bots.push(newCharge(b.x,b.y,b.target,T.charge.dropFuse));
    if(b.elite&&T.elite){var g=groundNear(b.x,b.y),P=T.elite.pods;spawnPod(P[(rnd()*P.length)|0],g[0],g[1],false);toast("Elite down: it dropped a pod","var(--cyan)")}
  }

  function updateShots(dt){
    for(var i=shots.length-1;i>=0;i--){
      var s=shots[i],n,dead=false;curBy=s.src?s.src.by:-1;
      if(s.kind==='mortar')s.vz-=T.collapse.gravity*dt;
      n=Math.ceil(Math.hypot(s.vx,s.vy,s.vz)*dt/.2);
      for(var k=0;k<n&&!dead;k++){
        s.x+=s.vx*dt/n;s.y+=s.vy*dt/n;s.z+=s.vz*dt/n;
        if(s.z<=0){if(s.kind==='mortar')mortarBlast(s);else sparks(s.x,s.y,.02,3,[200,180,140]);dead=true;break}
        if(solidAt(s.x,s.y,s.z)){
          if(s.kind==='shell')blast(s);
          else if(s.kind==='mortar')mortarBlast(s);
          else if(s.kind==='rail'){hitVoxel(s.x,s.y,s.z,s.dmg,s.x,s.y,s.z);if(!solidAt(s.x,s.y,s.z)&&--s.pen>0)continue}
          else hitVoxel(s.x,s.y,s.z,s.kind==='plasma'?s.dmg*T.plasma.struct:s.dmg,s.x-s.vx*dt/n,s.y-s.vy*dt/n,s.z);
          dead=true;break}
        var targets=s.team===0?bots:players;
        for(var j=0;j<targets.length;j++){var e=targets[j];
          if(e.hp<=0||e.dropping)continue;
          if(Math.hypot(e.x-s.x,e.y-s.y)<e.r+.08&&s.z>=e.z-.1&&s.z<=e.z+e.h+.2){
            if(s.kind==='mortar'){mortarBlast(s);dead=true;break}
            if(s.kind==='rail'){if(s.hit.indexOf(e)>=0)continue;s.hit.push(e);hitEnemy(e,s.base,s.src,s.x,s.y,s.z);sparks(s.x,s.y,s.z,10,[160,230,255]);continue}
            if(s.team===0)hitEnemy(e,s.base,s.src,s.x,s.y,s.z);else hitMech(e,s.dmg,{kind:"enemy"},s.x,s.y,s.z);sparks(s.x,s.y,s.z,s.kind==='shell'?14:4,s.team?[255,90,74]:s.kind==='plasma'?[200,170,255]:[255,220,140]);dead=true;break}
        }
      }
      if(dead||(s.t-=dt)<=0)shots.splice(i,1);
    }
  }
  function blast(s){
    var x=Math.floor(s.x),y=Math.floor(s.y),z=Math.floor(s.z);
    for(var dz=-1;dz<=1;dz++)for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++)hitVoxel(x+dx,y+dy,z+dz,T.buster.voxDmg,x+dx+.5,y+dy+.5,z+dz+.5);
    sparks(s.x,s.y,s.z,16,[255,190,90]);smoke(s.x,s.y,s.z,5,[170,160,140]);addShake(.15);
  }
  function mortarBlast(s){
    var M=T.mortar,x=Math.floor(s.x),y=Math.floor(s.y),z=Math.floor(Math.max(0,s.z));
    for(var dz=-1;dz<=1;dz++)for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++)hitVoxel(x+dx,y+dy,z+dz,M.voxDmg,x+dx+.5,y+dy+.5,z+dz+.5);
    bots.forEach(function(b){if(b.hp<=0||b.dropping)return;var d=Math.hypot(b.x-s.x,b.y-s.y,b.z+.5-s.z);
      if(d<M.radius)hitEnemy(b,s.base*(1-.5*d/M.radius),s.src,b.x,b.y,b.z+.8)});
    sparks(s.x,s.y,s.z+.2,18,[255,190,90]);smoke(s.x,s.y,s.z+.2,6,[170,160,140]);addShake(.12);
  }
  function updateScraps(dt){
    for(var i=scraps.length-1;i>=0;i--){var s=scraps[i],p=nearestPlayer(s.x,s.y);s.t+=dt;s.spin+=dt*3;
      var dx=p.x-s.x,dy=p.y-s.y,dl=Math.hypot(dx,dy);
      var mg=p.magnet||T.scrapMagnet;
      if(s.t>.5&&p.hp>0&&dl<mg){var a=(Math.min(T.scrapMagnet,mg-dl)+1)*14;s.vx+=dx/dl*a*dt;s.vy+=dy/dl*a*dt}
      s.vz-=18*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;
      if(s.z<.08){s.z=.08;s.vz*=-.4;s.vx*=.82;s.vy*=.82}
      if(blockedCell(Math.floor(s.x),Math.floor(s.y))){s.x-=s.vx*dt;s.y-=s.vy*dt;s.vx*=-.5;s.vy*=-.5}
      if(s.t>.5&&p.hp>0&&dl<.55){scrap++;p.scrap++;var ss=st(p.idx);if(ss){var sk=s.src||"other";ss.scrap[sk]=(ss.scrap[sk]||0)+1}floatText(p.x,p.y,1.8,"+1 scrap","#f2c230");scraps.splice(i,1)}
    }
  }
  function stepDebris(dt){
    for(var i=debris.length-1;i>=0;i--){var d=debris[i];d.vz-=18*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;d.spin+=dt*d.vx;
      if(d.z<d.s){d.z=d.s;d.vz*=-.35;d.vx*=.6;d.vy*=.6}if(solidAt(d.x,d.y,d.z)){d.vx*=-.4;d.vy*=-.4}if((d.t-=dt)<=0)debris.splice(i,1)}
  }

  function step(){
    updateZones();
    var dt=1/60,i,j,pl=players;
    if(state==="drop"&&tick>=sim.introTicks)state="play";
    if(fieldsDirty||fieldT<=0){pl.forEach(function(q){if(q.hp>0)q.field=flowField(q.x,q.y,q.field)});fieldT=.3;fieldsDirty=false}
    fieldT-=dt;
    var stale=T.net.inputStale*60;
    curBy=-1;
    pl.forEach(function(q,qi){
      if(q.hp<=0)return;
      var inp=inputs[qi];
      if(inp.seq>=0&&tick-inp.at>stale){inp.k=0;inp.l=false;inp.r=false;inp.rp=false}
      updatePlayer(q,dt,inp);
    });
    curBy=-1;
    for(i=0;i<bots.length;i++)updateBot(bots[i],dt);
    for(i=0;i<bots.length;i++){if(bots[i].dropping||aloft(bots[i]))continue;for(j=0;j<pl.length;j++)if(pl[j].hp>0)separate(pl[j],bots[i]);for(j=i+1;j<bots.length;j++)if(!bots[j].dropping&&!aloft(bots[j]))separate(bots[i],bots[j])}
    if(pl.length>1&&pl[0].hp>0&&pl[1].hp>0)separate(pl[0],pl[1]);
    for(i=0;i<bots.length;i++)if(!aloft(bots[i]))collide(bots[i]);
    for(i=0;i<pl.length;i++)if(pl[i].hp>0)collide(pl[i]);
    for(i=bots.length-1;i>=0;i--)if(bots[i].hp<=0)bots.splice(i,1);
    if(state==="play"||state==="overtime")updateWave(dt);else if(state==="choose")updateChoose(dt);
    if(state!=="drop")updatePods(dt);updateShots(dt);curBy=-1;updateScraps(dt);stepDebris(dt);
    updateBp(dt);curBy=-1;   /* phase 6: Strike beacon shells, Breach charges */
    updateBosses(dt);curBy=-1;   /* phase 7: the Warden's barrage shells */
    if(supportDirty)checkSupports();
    updateClusters(dt);updatePools(dt);flushWalk();
    if(contract)contractTick();
    tick++;
  }

  /* ===== Phase 3: match flow. Contracts (GDD-D38), the choose prompt and Overtime (GDD-D37), the revive check (GDD-D24)
     and the build-time half of the sector conditions (GDD-D39; the rest is condTune). It reads the phase 1 stats record
     and the run, and never changes a hit. Stat fields later phases add are read defensively. ===== */
  var goneBy=new Int8Array(N).fill(-1);   /* the mech that destroyed each voxel (-1: nobody); Eviction looks under a sniper's feet */
  function perchBy(b){var x=Math.floor(b.x),y=Math.floor(b.y),z=Math.floor(b.z-.5);return inB(x,y,z)?goneBy[vi(x,y,z)]:-1}
  function evicted(by){var s=by>=0&&st(by);if(s)s.evictions=(s.evictions||0)+1}   /* a sniper knocked off its perch by mech `by` */
  function eachStat(f){stats.forEach(function(w){(w||[]).forEach(function(x){if(x)f(x)})})}
  function sumStat(f){var n=0;eachStat(function(x){n+=f(x)||0});return n}
  function maxStat(f){var n=0;eachStat(function(x){var v=f(x)||0;if(v>n)n=v});return n}
  function living(){return players.filter(function(q){return q.hp>0})}
  function lostIn(q,wave){var w=stats[q.idx]&&stats[q.idx][wave-1],n=0;if(w)for(var k in w.taken)n+=w.taken[k];return n/q.maxHp}   /* share of max armor lost that wave */
  function dropMul(){return (run.overtime?T.overtime.scrap:1)*(T.match.scrapMul||1)}   /* non-kill drops (collapse landings): Overtime, Scrap storm */
  /* Each contract: goal() and prog() (the HUD's "prog of goal"); count = done the tick prog reaches goal; fail() = failed early;
     wave(n) = decided when wave n clears (1 done, -1 failed, 0 not yet); end() = decided at extract. Open at extract = failed. */
  var CHECKS={
    crush:{count:1,goal:function(){return T.contract.crush},prog:function(){return maxStat(function(x){return x.bestCrush})}},
    bringItDown:{count:1,goal:function(){return T.contract.spans},prog:function(){return sumStat(function(x){return x.spans})}},
    eviction:{count:1,goal:function(){return T.contract.evictions},prog:function(){return sumStat(function(x){return x.evictions})}},
    fullCombo:{count:1,goal:function(){return T.contract.combo},prog:function(){return maxStat(function(x){return x.bestCombo})}},
    wreckingCrew:{count:1,goal:function(){return T.contract.voxels},prog:function(){return sumStat(function(x){return x.voxels})}},
    repoMan:{count:1,goal:function(){return T.contract.repo},prog:function(){return sumStat(function(x){return x.pods&&x.pods.stolenBack})}},
    cleanSweep:{goal:function(){return Math.max(T.contract.pods,run.podsDropped)},prog:function(){return run.podsTaken},
      fail:function(){return run.podsLost>0},
      end:function(){return run.podsLost===0&&run.podsTaken>=run.podsDropped&&run.podsTaken>=T.contract.pods&&!pods.some(function(o){return o.wave})}},
    untouchable:{goal:function(){return Math.round(T.contract.untouchable*100)},   /* progress: % of max armor lost in wave 3, lowest living mech */
      prog:function(){if(run.wave<3)return 0;var l=living();return l.length?Math.min.apply(null,l.map(function(q){return Math.round(lostIn(q,3)*100)})):100},
      wave:function(n){return n!==3?0:living().some(function(q){return lostIn(q,3)<T.contract.untouchable})?1:-1}},
    closeShave:{goal:function(){return Math.round(T.contract.closeShave*100)},   /* progress: lowest living armor, % of max */
      prog:function(){var l=living();return l.length?Math.min.apply(null,l.map(function(q){return Math.ceil(q.hp/q.maxHp*100)})):0},
      end:function(){return living().some(function(q){return q.hp<q.maxHp*T.contract.closeShave})}},
    blitz:{goal:function(){return T.contract.blitz},prog:function(){return run.clock},   /* progress: seconds since wave 1 began */
      fail:function(){return run.clock>T.contract.blitz},wave:function(n){return n!==2?0:run.clock<=T.contract.blitz?1:-1}}
  };
  var contract=null;
  function contractSetup(){
    var id=sim.plan&&sim.plan.contract,K=id&&CHECKS[id];if(!K)return;
    var def=CONTRACTS.filter(function(x){return x.id===id})[0];
    contract={id:id,name:def?def.name:id,progress:0,goal:K.goal(),state:0,reward:0};
  }
  function contractTick(){
    var c=contract;if(!c||c.state)return;var K=CHECKS[c.id],g=K.goal(),p=Math.floor(K.prog()+1e-9);
    if(K.count&&p>=g){c.goal=g;contractDone(p);return}
    if(K.fail&&K.fail()){c.goal=g;contractFail(p,true);return}
    if(p!==c.progress||g!==c.goal){c.progress=p;c.goal=g;emitNet(["ct",c.id,p,g,0,0])}
  }
  function contractWave(n){
    var c=contract;if(!c||c.state)return;contractTick();if(c.state)return;
    var K=CHECKS[c.id],r=K.wave?K.wave(n):0;if(r>0)contractDone(c.progress);else if(r<0)contractFail(c.progress,true);
  }
  function contractEnd(){
    var c=contract;if(!c||c.state)return;contractTick();if(c.state)return;
    var K=CHECKS[c.id];if(K.end&&K.end())contractDone(c.progress);else contractFail(c.progress,false);
  }
  /* Done: T.contract.scrap x the level's scrap scale into each living mech's match scrap, at once (GDD-D38). */
  function contractDone(p){
    var c=contract,amt=Math.round(T.contract.scrap*lvm("scrap"));c.state=1;c.progress=p;c.reward=amt;
    living().forEach(function(q){q.scrap+=amt;scrap+=amt;q.ctDone=true;var s=st(q.idx);if(s)s.scrap.contract=(s.scrap.contract||0)+amt;floatText(q.x,q.y,2.2,"+"+amt+" contract","#f2c230")});
    emitNet(["ct",c.id,p,c.goal,1,amt]);toast("Contract done: "+c.name+", +"+amt+" scrap","var(--good)");
  }
  function contractFail(p,say){
    var c=contract;c.state=-1;c.progress=p;emitNet(["ct",c.id,p,c.goal,-1,0]);
    if(say)toast("Contract failed: "+c.name,"var(--muted)");
  }
  /* The run-over detail's phase 3 fields. */
  function matchDetail(d){
    d.contract=contract?{id:contract.id,name:contract.name,progress:contract.progress,goal:contract.goal,state:contract.state,reward:contract.reward}:null;
    d.condition=sim.cond.id;d.overtime={called:run.overtime,cleared:run.otCleared};d.revives=run.revives;
    return d;
  }
  /* Choose (GDD-D37): T.overtime.choose s after wave 5. Mech 0's F calls Overtime, its Enter or R extracts, the timer extracts. */
  function enterChoose(){
    state="choose";run.choose=T.overtime.choose;
    emitNet(["ch","prompt",T.overtime.choose]);toast("Wave "+run.wave+" cleared: Extract (Enter or R) or Overtime (F)","var(--good)");
  }
  function updateChoose(dt){
    var k=inputs[0]?inputs[0].k:0;
    if(k&64){callOvertime();return}
    if(k&128||(run.choose-=dt)<=0){run.choose=0;emitNet(["ch","extract"]);extract()}
  }
  /* Overtime: the revive check runs, then a 3 s breather, then wave 6 = wave 4 plus T.overtime.loaders loaders, no boss. */
  function callOvertime(){
    state="overtime";run.overtime=true;run.choose=0;run.breather=T.wave.breather;
    emitNet(["ch","overtime"]);toast("Overtime called: drops x"+T.overtime.scrap+" until it's cleared","var(--hazard)");
    revive();
  }
  function overtimeWave(){var b=T.waves[T.overtime.wave-1];return {bots:b.bots,loaders:(b.loaders||0)+T.overtime.loaders}}
  /* Revive (GDD-D24): at a wave's end, each downed mech comes back beside a survivor whose wallet covers the price. */
  function revive(){
    var price=Math.round(T.revive.price*lvm("scrap"));
    players.forEach(function(d){
      if(d.hp>0)return;var s=null;
      players.forEach(function(q){if(q.hp>0&&q.scrap>=price&&(!s||q.scrap>s.scrap))s=q});
      if(!s){toast("Partner still down: "+price+" scrap revives them at the next wave's end","var(--hazard)");return}
      s.scrap-=price;scrap-=price;run.revives++;
      var ss=st(s.idx);if(ss)ss.reviveSpent=(ss.reviveSpent||0)+price;
      var g=groundNear(s.x+Math.cos(s.leg+1.57)*1.4,s.y+Math.sin(s.leg+1.57)*1.4);
      d.x=g[0];d.y=g[1];d.vx=d.vy=0;d.dash=0;d.hp=Math.max(1,Math.round(d.maxHp*T.revive.armor));
      d.heat=0;d.over=0;d.ring=-1;d.retract=0;d.calm=0;d.oc=0;d.atb=0;setCombo(d,1);fieldsDirty=true;
      sparks(d.x,d.y,1,20,[127,220,106]);smoke(d.x,d.y,.5,8,[200,240,220]);
      emitNet(["rv",d.idx,s.idx,price]);toast("Partner revived for "+price+" scrap","var(--good)");
    });
  }
  /* Loose pillars (GDD-D39): at build, each pillar's lowest chunks start T.match.looseShare short of their voxels (bottom first),
     never so many that they break: a hit or two finishes them. */
  function loosenPillars(){
    var share=T.match.looseShare;if(!(share>0))return;
    structures.forEach(function(s){if(!s||s.kind!=="pillar")return;
      s.gc.forEach(function(ci){var c=chunks[ci],keep=Math.ceil(T.chunk.pillarBreakAt*c.init-1e-9),n=Math.min(Math.round(c.init*share),c.init-keep);
        for(var k=0;k<c.v.length&&n>0;k++){var i=c.v[k];if(!vox[i]||chunkOf[i]!==c.id)continue;vox[i]=0;owner[i]=0;chunkOf[i]=-1;c.count--;n--}})});
  }

  /* ----- co-op host snapshots ----- */
  function voxelDiffSince(since){
    var vx=[];
    for(var i=0;i<N;i++)if(vstamp[i]>since)vx.push(i,vox[i],owner[i]);
    return vx;
  }
  function snapshot(full){
    var s={t:"snap",tk:tick,ack:inputs[1]?inputs[1].seq:0,sc:scrap,k:kills,sh:r2(shake),w:[run.wave,r2(run.breather),bots.length+run.queue.length],p:[],b:[],s:[],sr:[],pd:[],cl:[]},i;
    players.forEach(function(q){s.p.push([q.idx,r2(q.x),r2(q.y),r2(q.z),r2(q.leg),r2(q.aim),Math.max(0,r2(q.hp)),q.maxHp,r2(q.heat),r2(q.over),r2(q.dashCd),q.dash>0?1:0,
      r2(q.atb),r2(q.ring),r2(q.retract),r2(q.pileT),r2(q.oc),q.muzzle>0?1:0,q.flash>0?1:0,r2(q.ax),r2(q.ay),r2(q.az),r2(q.step),q.combo,r2(q.red||0),q.dashN==null?-1:q.dashN])});
    bots.forEach(function(b){
      if(!b.id)b.id=++eid;
      var k=BOSS_KIND[b.kind]||(b.boss?2:b.loader?1:ZONE_KIND[b.kind]||0),f=(b.dropping?1:0)|(b.flash>0?2:0)|(b.state==="tell"?4:0)|(b.state==="charge"?8:0)|(b.slow>0?32:0)|(b.stag>0?64:0)|zoneFlags(b)|(b.cache?1024:0)|bossFlags(b);
      var row=[b.id,k,r2(b.x),r2(b.y),r2(b.z),r2(b.head),r2(b.aim),Math.max(0,Math.ceil(b.hp)),0];
      if(k>=3)row.push(r2(zoneTimer(b)));   /* phase 4 kinds: the timer of the flash, the plant, the fuse or the broken shield */
      if(k>=7)bossRow(b,row);   /* phase 7 kinds: max health, then the Warden's own fields */
      if(k===2){row.push(r2(b.tell>0?b.tell:0),r2(b.base||0));if(b.mode==="jump"&&b.j1){f|=16;row.push(r2(b.j1[0]),r2(b.j1[1]),r2(b.j1[2]))}}
      row[8]=f;s.b.push(row);
    });
    for(i=0;i<shots.length&&i<T.net.shotMax;i++){var q=shots[i];if(!q.id)q.id=++eid;
      s.s.push([q.id,r2(q.x),r2(q.y),r2(q.z),r2(q.vx),r2(q.vy),r2(q.vz),SHOT_KIND[q.kind]||0,q.big?1:0])}
    for(i=0;i<scraps.length&&i<T.net.scrapMax;i++){var c=scraps[i];if(!c.id)c.id=++eid;s.sr.push([c.id,r2(c.x),r2(c.y),r2(c.z),r2(c.spin)])}
    pods.forEach(function(o){if(!o.id)o.id=++eid;s.pd.push([o.id,Math.max(0,POD_TYPES.indexOf(o.type)),r2(o.x),r2(o.y),r2(o.z),r2(Math.max(0,o.t)),o.landed?1:0])});
    clusters.forEach(function(c){s.cl.push([c.id,r2(c.off),r2(c.creak),r2(c.t)])});
    s.q=players.map(function(q){return r2(q.sq||0)});   /* shoulder recharge per seat */
    s.sl=pools.map(function(o){return [o.id,o.x0,o.y0,o.x1,o.y1,o.z,r2(o.t)]});   /* phase 5: slag pools */
    bpSnap(s);   /* phase 6: Breach charges and pending Strike beacons as compact arrays */
    bossSnap(s);   /* phase 7: the Warden's barrage warnings */
    s.st=state;s.ch=[r2(run.choose),run.overtime?1:0];if(contract)s.ct=[contract.progress,contract.goal,contract.state];   /* phase 3: prompt timer, contract */
    if(full){s.full=true;s.vox=vox.slice();s.owner=owner.slice();s.vx=[];s.ev=[];netEv.length=0}
    else{s.vx=voxelDiffSince(snapBase);s.ev=netEv.splice(0,60)}
    snapBase=tick;
    return s;
  }

  /* ----- public api ----- */
  function setInput(i,inp){
    var t=inputs[i];if(!t)return;
    t.k=inp.k|0;t.ax=Math.max(0,Math.min(W,+inp.ax||0));t.ay=Math.max(0,Math.min(D,+inp.ay||0));t.az=Math.max(0,Math.min(H,+inp.az||0));
    t.l=!!inp.l;t.r=!!inp.r;if(inp.rp)t.rp=true;
    if(inp.seq!==undefined){if(inp.seq<t.seq)return;t.seq=inp.seq}
    t.at=tick;
  }
  function applyBuild(i,build,wear,upg){
    if(wear)wearOf[i]=wear;if(upg)upgOf[i]=upg;
    var q=newPlayer(cleanBuild(build),i);
    if(i<players.length){var o=players[i];for(var k in q)if(k!=="x"&&k!=="y"&&k!=="idx"&&k!=="taken")o[k]=q[k]}
    else{players.push(q);inputs.push(mkInput())}
    fieldsDirty=true;
  }
  function dropPlayer(i){var q=players[i];if(q&&q.hp>0){q.hp=0;if(state==="play"||state==="drop"||state==="choose"||state==="overtime")lossCheck()}}

  buildMap();buildChunks();loosenPillars();rebuildWalk();contractSetup();
  spawnCells=openCells();sim.introTicks=zone.intro;   /* the drop-in intro: the zone opens in the middle of it, the waves start after */
  (opts.builds&&opts.builds.length?opts.builds:[STARTER]).forEach(function(b,i){players.push(newPlayer(cleanBuild(b),i));inputs.push(mkInput())});
  beginWave(1,true);
  world.rev=1;

  sim.setInput=setInput;sim.step=step;sim.snapshot=snapshot;sim.voxelDiffSince=voxelDiffSince;sim.applyBuild=applyBuild;sim.dropPlayer=dropPlayer;
  sim.drainEvents=function(){var e=events.slice();events.length=0;return e};
  /* One hash of the rules state, for the runner's replay check: same seed, tuning and inputs give the same hash. */
  sim.stateHash=function(){
    var a=[tick,seed,state,run.wave,run.queue.length,scrap,kills,zone.open,bots.length,shots.length,pods.length,scraps.length,clusters.length];
    players.forEach(function(q){a.push(q.x,q.y,q.hp,q.heat,q.atb,q.ring,q.scrap,q.over,q.oc,q.combo)});
    bots.forEach(function(b){a.push(b.x,b.y,b.z,b.hp,b.state||"",b.stag||0)});
    pods.forEach(function(o){a.push(o.type,o.x,o.y,o.z)});
    a.push(run.overtime?1:0,run.choose,run.revives,contract?contract.state:9,contract?contract.progress:0);
    var v=0;for(var i=0;i<N;i++)if(vox[i])v=(Math.imul(v,31)+i*16+vox[i])|0;a.push(v);
    bpHash(a);bossHash(a);
    return fnv(a);
  };
  sim.tuneHash=function(){return tuneHash(T)};
  Object.defineProperties(sim,{
    tick:{get:function(){return tick}},state:{get:function(){return state}},wave:{get:function(){return run.wave}},
    scrap:{get:function(){return scrap},set:function(v){scrap=v}},kills:{get:function(){return kills}},
    level:{get:function(){return level}},shake:{get:function(){return shake}},
    zone:{get:function(){return zone}},stats:{get:function(){return stats}},contract:{get:function(){return contract}}
  });
  sim.markOpen=function(k){if(zone.open<k+1)zone.open=k+1;if(zone.opening===k)zone.opening=-1;spawnCells=openCells()};
  /* debug hooks */
  sim.killAll=function(){bots.slice().forEach(function(b){damage(b,1e9,b.x,b.y,b.z)})};
  sim.damage=damage;sim.hitEnemy=hitEnemy;sim.hitMech=hitMech;sim.hitVoxel=hitVoxel;sim.spawnPod=spawnPod;sim.perches=perches;sim.los3=los3;sim.collide=collide;sim.flowField=flowField;
  sim.stepDebris=stepDebris;sim.debrisPiece=debrisPiece;
  sim.spawnUnit=spawnUnit;sim.zoneSlots=zoneSlots;sim.pickWreck=pickWreck;   /* phase 4 (labs and rules check) */
  sim.spawnLoader=function(x,y){var l=newLoader();l.x=x;l.y=y;l.z=0;l.dropping=false;bots.push(l);return l};
  sim.setVox=function(x,y,z,m){var i=vi(x,y,z);if(!m&&vox[i])removeVoxel(i,x,y,z);else{vox[i]=m;touch(i)}};
  sim.dbg=function(){var w=[];structures.forEach(function(st){if(st&&st.kind==='pillar'&&pillarIsDown(st))w.push(st.x+.2,st.x+1)});var pv=0,pd=0;
    for(var i=0;i<N;i++)if(vox[i]===1&&structures[owner[i]]&&structures[owner[i]].kind==='pillar'){pv++;pd+=vdmg[i]}
    var deck=0;for(i=0;i<N;i++)if(vox[i]===3)deck++;
    return {pv:pv,pd:pd,down:pillarsDown,which:w,clusters:clusters.length,debris:debris.length,deck:deck,alive:chunks.filter(function(c){return c.alive}).length,chunks:chunks.length,chk:chk.last}};
  return sim;
}

/* ===== Campaign: the save (TDD-D12) and the climb plan (TDD-D10).
   v2: {v:2, seed, typed, level, live, players:[{build, owned:[ids], scrap, wear:{id:0..1}, upg:{weaponId:0..2}, best,
        records:{level,combo,spans,contracts,overtimes}, callins:[type|null, type|null]}]}
   players[0] is the host / single player. seed: the climb's seed (1..2,147,483,000, GDD-D49); typed: the player typed it
   at level 1, so a restart keeps it. live: written when a match starts (TDD-D8); a save still marked live when it is
   loaded counts as a death. best: highest level ever extracted (0..max, blueprints). records: lifetime (GDD-D45).
   callins: the two call-in slots (repair, overclock, strike). A v1 code ({v:1, seed, level, players:[{build, owned,
   scrap, armor}]}) migrates: no wear, no upgrades, best = its level capped at max, empty records and slots, carried
   armor dropped. encode() is JSON as base64url (the "campaign code"); decode() returns a clean campaign or null when
   anything is off. advance/bank/restart/begin return a new campaign; repairAll and upgrade change c in place. ===== */
var Campaign=(function(){
  var SCRAP_MAX=10000000,SEED_MAX=2147483000,V1_MAX=50,REC=["level","combo","spans","contracts","overtimes"],CALLINS=["repair","overclock","strike"];
  function clone(o){return JSON.parse(JSON.stringify(o))}
  function isInt(x){return typeof x==="number"&&x===Math.floor(x)&&isFinite(x)}
  function plain(o){return !!o&&typeof o==="object"&&!Array.isArray(o)}
  function starterOwned(){var a=[];SLOTS.forEach(function(sl){if(STARTER[sl[0]])a.push(STARTER[sl[0]])});return a}
  function records(){var r={};REC.forEach(function(k){r[k]=0});return r}
  function upMax(id){return T.upgrade.price[PART[id].rarity].length}
  /* o: optional {wear, upg, best, records, callins} (copied) */
  function player(build,owned,scrap,o){
    var b=cleanBuild(build),ow=starterOwned();o=plain(o)?clone(o):{};
    (owned||[]).concat(SLOTS.map(function(sl){return b[sl[0]]})).forEach(function(id){if(id&&PART[id]&&ow.indexOf(id)<0)ow.push(id)});
    return {build:b,owned:ow,scrap:scrap|0,wear:o.wear||{},upg:o.upg||{},best:o.best|0,records:o.records||records(),callins:o.callins||[null,null]};
  }
  function make(builds,_mode,seed,typed){return {v:2,seed:seed||7,typed:!!typed,level:1,live:false,players:(builds||[STARTER]).map(function(b){return player(b)})}}
  function cleanPlayer(p,v,level){
    if(!plain(p)||!plain(p.build)||!Array.isArray(p.owned))return null;
    var owned=[],i,id,x;
    for(i=0;i<p.owned.length;i++){id=p.owned[i];if(typeof id!=="string"||!PART[id])return null;if(owned.indexOf(id)<0)owned.push(id)}
    var b={};
    for(i=0;i<SLOTS.length;i++){var k=SLOTS[i][0];id=p.build[k];
      if(id!==null&&id!==undefined&&(typeof id!=="string"||!PART[id]||PART[id].slot!==k))return null;
      b[k]=id||null}
    b=cleanBuild(b);
    starterOwned().forEach(function(x){if(owned.indexOf(x)<0)owned.push(x)});
    for(i=0;i<SLOTS.length;i++){id=b[SLOTS[i][0]];if(id&&owned.indexOf(id)<0)return null}   /* fitted parts must be owned */
    if(typeof p.scrap!=="number"||!(p.scrap>=0)||p.scrap>SCRAP_MAX)return null;
    var out={build:b,owned:owned,scrap:Math.floor(p.scrap),wear:{},upg:{},best:Math.min(T.level.max,level),records:records(),callins:[null,null]};
    if(v===1){var ar=p.armor;return ar!==null&&ar!==undefined&&(typeof ar!=="number"||!(ar>=0)||ar>100000)?null:out}
    /* v2: strict */
    if(!plain(p.wear)||!plain(p.upg)||!plain(p.records)||!Array.isArray(p.callins)||p.callins.length!==2)return null;
    for(id in p.wear){x=p.wear[id];if(!PART[id]||isStarter(id)||owned.indexOf(id)<0||typeof x!=="number"||!(x>=0&&x<=1))return null;if(x>0)out.wear[id]=x}
    for(id in p.upg){x=p.upg[id];if(!PART[id]||!isWeapon(id)||owned.indexOf(id)<0||!isInt(x)||x<0||x>upMax(id))return null;if(x>0)out.upg[id]=x}
    if(!isInt(p.best)||p.best<0||p.best>T.level.max)return null;out.best=p.best;
    for(i=0;i<REC.length;i++){x=p.records[REC[i]];if(!isInt(x)||x<0||x>SCRAP_MAX||(REC[i]==="level"&&x>T.level.max))return null;out.records[REC[i]]=x}
    for(i=0;i<2;i++){x=p.callins[i];if(x!==null&&CALLINS.indexOf(x)<0)return null;out.callins[i]=x}
    return out;
  }
  function validate(c){
    if(!plain(c)||(c.v!==1&&c.v!==2)||!Array.isArray(c.players)||c.players.length<1||c.players.length>2)return null;
    var lv=c.level,sd=c.seed===undefined&&c.v===1?7:c.seed;
    if(!isInt(lv)||lv<1||lv>(c.v===1?V1_MAX:T.level.max))return null;
    if(!isInt(sd)||sd<1||sd>SEED_MAX)return null;
    if(c.v===2&&(typeof c.typed!=="boolean"||(c.live!==undefined&&typeof c.live!=="boolean")))return null;
    lv=Math.min(T.level.max,lv);
    var ps=[];
    for(var i=0;i<c.players.length;i++){var p=cleanPlayer(c.players[i],c.v,lv);if(!p)return null;ps.push(p)}
    return {v:2,seed:sd,typed:c.v===2&&c.typed,level:lv,live:c.v===2&&!!c.live,players:ps};
  }
  function toB64(str){return (typeof btoa==="function"?btoa(str):Buffer.from(str,"binary").toString("base64")).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
  function fromB64(s){
    s=String(s).replace(/\s+/g,"").replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";
    return typeof atob==="function"?atob(s):Buffer.from(s,"base64").toString("binary");
  }
  function encode(c){return toB64(JSON.stringify(c))}
  function decode(s){
    if(typeof s!=="string"||!s||s.length>20000||!/^[A-Za-z0-9_\-\s]+$/.test(s))return null;
    try{return validate(JSON.parse(fromB64(s)))}catch(e){return null}
  }
  /* Wear on extract (GDD-D18): each fitted non-starter part gains share x damage taken / max armor, capped at 1. */
  function wearOn(p,taken){
    if(!(taken>0))return;var add=T.durability.share*taken/deriveStats(p.build,T,p.wear).maxHp;
    SLOTS.forEach(function(sl){var id=p.build[sl[0]];if(id&&!isStarter(id))p.wear[id]=Math.min(1,Math.round(((p.wear[id]||0)+add)*1e4)/1e4)});
  }
  /* Lifetime records: r = {level, combo, spans, contracts, overtimes}; level and combo keep the best, the counters add up. */
  function addRecords(p,r){if(!r)return;REC.forEach(function(k){var x=Math.round(+r[k]||0);if(x>0)p.records[k]=k==="level"||k==="combo"?Math.max(p.records[k],x):p.records[k]+x})}
  /* Bank mech k's share of a run-over detail d into player p: scrap, wear, records (d.records[k] once phase 1 reports them). */
  function bankInto(p,d,k){
    p.scrap=Math.min(SCRAP_MAX,p.scrap+((d.scrap&&d.scrap[k])|0));
    wearOn(p,d.damage&&d.damage[k]);
    addRecords(p,{level:d.level});addRecords(p,d.records&&d.records[k]);
  }
  /* The campaign after a level was extracted (d = the "o" event's detail, extract or victory): next level, each mech's
     scrap banked, wear applied, highest level extracted raised, the in-match mark cleared. A victory stays on the last
     level: the caller starts the next climb with restart(). */
  function advance(c,d){
    var n=clone(c);d=d||{};
    n.level=Math.min(T.level.max,c.level+1);n.live=false;
    n.players.forEach(function(p,i){bankInto(p,d,i);p.best=Math.max(p.best|0,Math.min(T.level.max,c.level))});
    return n;
  }
  /* Co-op guest (GDD-D31): only player i's own scrap, wear and records, from mech k of the room's detail; level and seed stay. */
  function bank(c,i,d,k){var n=clone(c);bankInto(n.players[i||0],d||{},k===undefined?i||0:k);return n}
  /* A new climb (new campaign, death, victory, or a load still marked live): level 1 on `seed` (drawn by the caller,
     outside the sim), unless the climb seed was typed. Parts, upgrades, wear, records and banked scrap stay. */
  function restart(c,seed){
    var n=clone(c);n.level=1;n.live=false;
    if(isInt(seed)&&seed>=1&&seed<=SEED_MAX){n.seed=seed;n.typed=false}   /* a typed seed is used for that climb only (GDD-D49) */
    return n;
  }
  /* Match start: the in-match mark, and the highest level reached. */
  function begin(c){var n=clone(c);n.live=true;n.players.forEach(function(p){addRecords(p,{level:c.level})});return n}
  /* Repairs (GDD-D18, GDD-D28): ceil(price x wear x rate by rarity); starter parts never wear, so they are free. */
  function repairPrice(id,w){var p=PART[id];if(!p||isStarter(id)||!(w>0))return 0;return Math.ceil(p.cost*Math.min(1,w)*T.durability.repair[p.rarity]-1e-9)}
  /* The Repair button: worn fitted parts in slot order, skipping one the banked scrap can't cover. Changes c. */
  function repairAll(c,i){
    var p=c.players[i||0],r={spent:0,fixed:[],skipped:[]};
    SLOTS.forEach(function(sl){var id=p.build[sl[0]],w=id&&p.wear[id];if(!(w>0))return;var pr=repairPrice(id,w);
      if(pr<=p.scrap){p.scrap-=pr;r.spent+=pr;delete p.wear[id];r.fixed.push(id)}else r.skipped.push(id)});
    return r;
  }
  /* Weapon upgrades (GDD-D23): the price of the next Mk from `level` (0 = Mk I), or null when there is none. */
  function upgradePrice(id,level){if(!isWeapon(id))return null;var a=T.upgrade.price[PART[id].rarity],l=level|0;return l>=0&&l<a.length?a[l]:null}
  /* Buy the next Mk of an owned weapon for player i. Changes c; returns the scrap paid, or false. */
  function upgrade(c,i,id){
    var p=c.players[i||0],l=p.upg[id]|0,pr=upgradePrice(id,l);
    if(pr===null||p.owned.indexOf(id)<0||p.scrap<pr)return false;
    p.scrap-=pr;p.upg[id]=l+1;return pr;
  }
  /* each level plays a different (deterministic) sim seed */
  function levelSeed(c){return ((c.seed+(c.level-1)*7919)%2147483646)+1}
  /* overpass spans whose two pillars stand in the open zones of a level (Crush and Bring it down need one) */
  function openSpans(level){
    var px=MAP.overpass.pillarsX,x1=MAP.zones[Math.min(level,MAP.zones.length)-1].x1,n=0;
    for(var k=0;k+1<px.length;k++)if(px[k+1]+1<=x1)n++;
    return n;
  }
  /* The climb plan (TDD-D10): for levels 1..max, {level, zone, condition, contract, bosses:[wave 3, wave 5]}, from the
     climb seed alone on its own stream (the sim's 16807 generator), so match randomness never changes it. Bosses come
     first, then the condition, then a contract the level allows; no condition or contract repeats in a climb.
     Recomputed on load, never saved. */
  function plan(c){
    var s=((c.seed*48271)%2147483646)+1,max=T.level.max,out=[],usedC={},usedK={},ids=Object.keys(BOSSES);
    function rnd(){s=(s*16807)%2147483647;return (s-1)/2147483646}
    function pick(a){return a.length?a[(rnd()*a.length)|0]:null}
    rnd();rnd();
    for(var L=1;L<=max;L++){
      var bs=[3,5].map(function(w){
        var f=ids.filter(function(b){var F=BOSSES[b].force;return (F==="first"&&L===1&&w===3)||(F==="last"&&L===max&&w===5)});
        if(f.length)return f[0];
        return pick(ids.filter(function(b){var B=BOSSES[b];return B.force!=="last"&&L>=B.lv[0]&&L<=B.lv[1]&&(!B.wave||B.wave===w)}));
      });
      var cond=pick(CONDITIONS.filter(function(x){return !usedC[x.id]&&(L>1||x.mild)}));if(cond)usedC[cond.id]=1;
      var sn=bs.some(function(b){return b&&BOSSES[b].sniper}),sp=openSpans(L)>0;
      var con=pick(CONTRACTS.filter(function(x){return !usedK[x.id]&&(x.need!=="span"||sp)&&(x.need!=="sniper"||sn)&&(!x.not||!cond||x.not!==cond.id)}));if(con)usedK[con.id]=1;
      out.push({level:L,zone:MAP.zones[Math.min(L,MAP.zones.length)-1].name,condition:cond&&cond.id,contract:con&&con.id,bosses:bs});
    }
    return out;
  }
  return {make:make,player:player,validate:validate,encode:encode,decode:decode,advance:advance,bank:bank,restart:restart,begin:begin,
    repairPrice:repairPrice,repairAll:repairAll,upgradePrice:upgradePrice,upgrade:upgrade,plan:plan,openSpans:openSpans,levelSeed:levelSeed,
    starterOwned:starterOwned,isStarter:isStarter,SEED_MAX:SEED_MAX,CALLINS:CALLINS};
})();

/* ===== phase 6 statics: pod types, blueprint unlock level, call-in price (GDD-D42, D43, D54) ===== */
var POD_TYPES=["repair","overclock","cache","strike"];   /* also the snapshot's pod type codes */
var POD_NAME={repair:"Field repair",overclock:"Overclock",cache:"Scrap cache",strike:"Strike beacon"};
/* the highest extracted level a save needs before the garage lists this part: 1 for the garage's own parts */
function unlockLevel(id){var p=PART[id];return p&&p.zone?p.zone+1:1}
/* garage price of a call-in for the level about to be played: base x (1 + T.level.scrap x (level - 1)), rounded; null if not sold */
function callinPrice(type,level,TT){TT=TT||T;var b=TT.callin.price[type];return b===undefined?null:Math.round(b*(1+TT.level.scrap*((level||1)-1)))}

root.MetroSim={create:create,mergeTune:mergeTune,tuneHash:tuneHash,Campaign:Campaign,T:T,SHOT_KIND:SHOT_KIND,MAT:MAT,WINDOW:WINDOW,MAP:MAP,PARTS:PARTS,PART:PART,SLOTS:SLOTS,STARTER:STARTER,BASE:BASE,W:W,D:D,H:H,hash:hash,
  deriveStats:deriveStats,moveMech:moveMech,clusterGeom:clusterGeom,cleanBuild:cleanBuild,cloneBuild:cloneBuild,statsOf:statsOf,isWeapon:isWeapon,
  CONTRACTS:CONTRACTS,CONDITIONS:CONDITIONS,BOSSES:BOSSES,
  POD_TYPES:POD_TYPES,POD_NAME:POD_NAME,unlockLevel:unlockLevel,callinPrice:callinPrice};
})(typeof globalThis!=='undefined'?globalThis:this);
