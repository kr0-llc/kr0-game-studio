/* Metr0niks headless simulation. Runs the game in the browser (single player and the co-op host, loaded with a
   classic <script src="../simulations/sim.js">) and in Node (`import './simulations/sim.js'`, then globalThis.MetroSim). No DOM, no timers,
   no browser globals: time comes in as fixed ticks, and everything a renderer needs that is not state is an event.

   MetroSim.create({seed, builds:[build,...], level?, armor?, colorOf?, clock?}) -> sim
     level    campaign level 1..T.level.max (default 1); enemy counts, hp, damage and scrap scale with it (T.level), sim.level
     armor    per mech: null = full, a number < 1 = fraction of max armor, >= 1 = absolute armor (clamped to 1..max)
     builds   one garage build per mech ({core,armR,armL,shoulder,legs,reactor}, null = empty); builds[1] is the co-op partner
     colorOf  optional (materialId, structure) -> [r,g,b]; lets a renderer theme debris and falling pieces
     clock    optional () -> ms, only used to time support checks (sim.chk); default is a function returning 0
   sim.T                tunables (shared object, MetroSim.T)
   sim.world            {vox,owner,vdmg (typed arrays), W,D,H, structures, chunks, walk, rev (bumps when voxels change),
                         get(x,y,z), solidAt(x,y,z), blockedCell(cx,cy), rebuildWalk()}
   sim.players, bots, shots, pods, scraps, clusters, debris   live arrays (mutated in place, never replaced)
   sim.run {wave,queue,breather,done,...}   sim.wave (number)   sim.state 'play'|'dead'|'extracted'
   sim.tick             completed steps   sim.scrap (shared run total, for the HUD), sim.kills, sim.shake (0..1, decays)
                        each mech also has player.scrap: the cubes it picked up (the wallet that banks at extraction)
   sim.state            'drop' (until sim.tick >= sim.introTicks: no spawns, no pods; set introTicks right after create(), default 0),
                        then 'play', then 'dead' | 'extracted'
   sim.setInput(i, {k,ax,ay,az,l,r,rp,seq})   k bitmask W=1 A=2 S=4 D=8 Space=16; ax,ay,az world aim point;
                        l / r held buttons (left arm gun / ATB arm); rp true = right button pressed since the last tick;
                        seq (network inputs only): such an input is released after T.net.inputStale s of silence
   sim.step()           one fixed 1/60 s tick
   sim.drainEvents()    returns and clears the events array. Events are arrays:
                        ["t",text,css|null,only]  toast (only = mech index, -1 = everyone)
                        ["f",x,y,z,text,css]      floating number    ["s",x,y,z,n,[r,g,b]] sparks   ["m",x,y,z,n,[r,g,b]] smoke
                        ["k",amount]              screen shake       ["p",x,y] drop pod landed
                        ["c",id,voxelIdx[],packedColours[]]  falling cluster created
                        ["o","dead"|"extracted",message,scrapBanked,detail]  run over; detail = {result,level,scrap:[per mech],armor:[per mech]}
                        (extracted: scrap and armor to carry on; dead: nothing carries on)
                        ["z",zoneIndex,name]      a sealed zone's gate fell: the map grew (also sent to guests)
   sim.snapshot(full)   co-op host snapshot {t:"snap",tk,ack,sc,k,sh,w,p,b,s,sr,pd,cl,vx,ev}; full=true also carries copies of
                        vox and owner (for a joining guest), clears queued events and resets the diff baseline
   sim.voxelDiffSince(tick)   flat [index,material,owner,...] for voxels changed after `tick`
   sim.applyBuild(i, build)   re-derive mech i from a build (adds the mech when i === players.length)
   sim.dropPlayer(i)    mech i leaves (hp 0); the run is lost if nobody else is alive
   sim.level            the level this sim was created for (opts.level, default 1)
   sim.introTicks       set by create(): ticks of drop-in cinematic before anything may spawn, 0 unless a zone opens this level
   sim.zone             {open, opening, target, openAt, intro}: zones MAP.zones[0..open-1] are open; `opening` is the zone
                        whose gate falls at tick openAt (-1 once it has), `target` that same zone for the whole intro
   sim.markOpen(k)      bookkeeping only (a guest applying the ["z",k,name] event): zone k counts as open
   Debug hooks (tests): killAll(), damage(e,dmg,x,y,z), hitVoxel(x,y,z,dmg), setVox(x,y,z,m), spawnPod(type,x,y,counting),
                        spawnLoader(x,y), perches(), los3(...), collide(e), flowField(), chk, dbg(), stepDebris(dt), debrisPiece(...)
   Statics: MetroSim.PARTS, PART, SLOTS, STARTER, MAP, MAT, WINDOW, T, hash, W, D, H, deriveStats(build[,T]), moveMech(mech,input,T,dt,pred),
            clusterGeom(idx,cols), cleanBuild(build), cloneBuild(build), statsOf(build), Campaign (save state, see below) */
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
        overclock:{mult:2,time:15},fire:2},       /* window: seconds into the wave; fire: bot fire-rate multiplier while overclocked */
  level:{count:.25,hp:.15,dmg:.15,scrap:.1,max:50,revive:.3},   /* per level above 1: share added to enemy counts, hp, damage, scrap drops; revive: armor share a downed mech returns with */
  repairCost:3,       /* garage repair: armor restored per scrap */
  scrapMagnet:3,
  debrisCap:300,
  structural:.5,      /* share of bullet damage that goes into voxels (minigun: low structural damage) */
  collapse:{warn:.9,gravity:22,botDmg:80,playerDmg:40,rubbleKeep:.38,scrap:[2,4]},
  chunk:{size:4,breakAt:.8,pillarBreakAt:.8},   /* a chunk breaks when its voxels fall below this share of its start count; the mech only reaches the bottom two layers of a 4-high chunk, so a lower share could never be shot through; pillar chunks are slim 1x1 columns */
  zone:{intro:5.5,open:2.6,gateH:3},   /* drop-in cinematic when a zone opens: seconds of intro before spawns, second the gate falls, gate wall height */
  net:{rate:20,delay:100,snapErr:.3,snapFar:2.5,diffMax:800,inputStale:.5,shotMax:120,scrapMax:80,eventMax:200}   /* snapshots per second; render delay ms; prediction error (units) before a gentle pull / a hard snap; (unused) voxel changes per snapshot; seconds before a silent partner's keys are released */
};

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
  {id:"fusion",slot:"reactor",name:"Cold-fusion cell",rarity:"epic",cost:140,d:{power:20,speed:6,weight:10,heat:-12},hook:{},desc:"Nearly Mk3 power that runs cool. The most expensive part in the garage."}
];
var PART={};PARTS.forEach(function(p){PART[p.id]=p});
var STARTER={core:null,armR:"minigun",armL:"pile",shoulder:null,legs:"jets",reactor:"mk1"};
function cloneBuild(b){var o={};SLOTS.forEach(function(s){o[s[0]]=b[s[0]]||null});return o}
function cleanBuild(b){var o={};SLOTS.forEach(function(sl){var id=b&&b[sl[0]];o[sl[0]]=(id&&PART[id]&&PART[id].slot===sl[0])?id:STARTER[sl[0]]});return o}
function statsOf(b){var s={},k;for(k in BASE)s[k]=BASE[k];SLOTS.forEach(function(sl){var p=PART[b[sl[0]]];if(p)for(k in p.d)s[k]+=p.d[k]});return s}
/* Stats to gameplay numbers. The starter build lands exactly on the T baselines. */
function deriveStats(b,TT){
  TT=TT||T;
  var s=statsOf(b),Gt=TT.garage,wf=1/(1+(s.weight-100)*Gt.weightDrag),Hk={turn:1,torso:1,gun:"minigun",pile:"pile",noDash:false,immune:false,q:null,magnet:false,dash:1,dashHeat:1,regen:false},P=TT.player;
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
    var f=Math.exp(-P.friction*dt*(il?.35:1));p.vx*=f;p.vy*=f;
    var sp=Math.hypot(p.vx,p.vy);if(sp>p.spd){p.vx*=p.spd/sp;p.vy*=p.spd/sp}
  }
  p.dashCd=Math.max(0,p.dashCd-dt);
  if((k&16)&&p.dashCd<=0&&!p.over&&!p.noDash){
    var dx=il?ix:Math.cos(p.leg),dy=il?iy:Math.sin(p.leg);
    p.vx=dx*P.dashSpeed;p.vy=dy*P.dashSpeed;p.dash=P.dashTime;p.dashCd=P.dashCooldown*(p.dashMul||1);dashed=true;
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
  var seed=(opts.seed|0)||7;if(seed<=0)seed=7;
  var colorOf=opts.colorOf||defaultColor,clock=opts.clock||function(){return 0};
  function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}

  var vox=new Uint8Array(N),owner=new Uint16Array(N),vdmg=new Float32Array(N),vstamp=new Int32Array(N);
  var structures=[null],CS=T.chunk.size,CXN=Math.ceil(W/CS),CYN=Math.ceil(D/CS);
  var chunks=[],chunkOf=new Int16Array(N),walk=new Uint8Array(W*D),wbox=null,reachC=new Uint8Array(0);
  var players=[],bots=[],pods=[],shots=[],scraps=[],debris=[],clusters=[],events=[],netEv=[],inputs=[];
  var run={wave:1,queue:[],spawnT:0,breather:0,done:false,exitT:0,waveT:0,podAt:[]};
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
  var sim={T:T,introTicks:0,world:world,players:players,bots:bots,shots:shots,pods:pods,scraps:scraps,clusters:clusters,debris:debris,run:run,chk:chk};

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
    var c=voxColor(i),ci=chunkOf[i];vox[i]=0;owner[i]=0;vdmg[i]=0;chunkOf[i]=-1;touch(i);
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
      vox[i]=0;owner[i]=0;vdmg[i]=0;chunkOf[i]=-1;touch(i);if(z<=1)markWalk(x,y);
      n++;fx+=x;fy+=y;fz+=z;
    }
    c.count=0;supportDirty=true;
    if(n){sparks(fx/n+.5,fy/n+.5,fz/n+.5,10,[255,200,120]);smoke(fx/n+.5,fy/n+.5,fz/n+.5,3,[140,136,128]);addShake(.08)}
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
    var cols=idx.map(function(i){return voxColor(i)}),g=clusterGeom(idx,cols);
    idx.forEach(function(i){var z=(i/(W*D))|0;if(z<=1)markWalk(i%W,((i/W)|0)%D)});
    idx.forEach(function(i){vox[i]=0;owner[i]=0;vdmg[i]=0;chunkOf[i]=-1;touch(i)});
    var c={id:++cid,vs:g.vs,foot:g.foot,off:0,vz:0,creak:T.collapse.warn,t:0};clusters.push(c);
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
    var hitE=function(e){if(e.hp>0&&!e.dropping&&!aloft(e)&&footSet[Math.floor(e.x)+Math.floor(e.y)*W])damage(e,e.team?C.botDmg:C.playerDmg,e.x,e.y,1)};
    bots.forEach(hitE);players.forEach(hitE);
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
    var mid=c.vs[(c.vs.length/2)|0],n=C.scrap[0]+((rnd()*(C.scrap[1]-C.scrap[0]+1))|0);
    for(var k=0;k<n&&c.vs.length>6;k++)scraps.push({x:mid.x+.5,y:mid.y+.5,z:.6,vx:(rnd()-.5)*5,vy:(rnd()-.5)*5,vz:3+rnd()*2,t:0,spin:rnd()*6});
    world.rev++;c.foot.forEach(function(f){markWalk(f%W,(f/W)|0)});
  }

  /* ----- entities. Player and bots share one shape: position, velocity, armor, radius, height, team. ----- */
  function newPlayer(build,idx){
    var d=deriveStats(build,T);
    return {team:0,idx:idx||0,x:MAP.spawn[idx?1:0][0],y:MAP.spawn[idx?1:0][1],z:0,vx:0,vy:0,r:T.player.radius,h:T.player.height,hp:d.maxHp,maxHp:d.maxHp,scrap:0,
      v:cloneBuild(build),spd:d.spd,acc:d.acc,legT:d.legT,torT:d.torT,dmgMul:d.dmgMul,atbRate:d.atbRate,drain:d.drain,heatMul:d.heatMul,gun:d.gun,pileKind:d.pile,noDash:d.noDash,immune:d.immune,
      q:d.q,sq:0,qPrev:false,magnet:d.magnet,dashMul:d.dashMul,dashHeat:d.dashHeat,regen:d.regen,calm:0,
      leg:Math.PI*.75,aim:Math.PI*.75,step:0,heat:0,over:0,cool:0,dash:0,dashCd:0,flash:0,muzzle:0,ax:16,ay:16,az:.6,
      atb:0,ring:-1,retract:0,pileT:0,cue:0,pileRes:"",oc:0,field:null,rPrev:false};
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
    var w=T.waves[n-1],q=[],np;run.wave=n;run.breather=0;run.spawnT=0;run.done=false;
    for(var k=0;k<(w.boss||0);k++)q.push("boss");
    var nl=Math.round((w.loaders||0)*lvm("count")),nb=Math.round(w.bots*lvm("count"));
    for(k=0;k<nl;k++)q.push("loader");
    for(k=0;k<nb;k++)q.push("bot");
    run.queue=q;run.waveT=0;run.podAt=[];
    for(k=0,np=T.pods.perWave+(rnd()<T.pods.extra?1:0);k<np;k++)run.podAt.push(T.pods.window[0]+rnd()*(T.pods.window[1]-T.pods.window[0]));
    run.podAt.sort(function(a,b){return a-b});
    if(!quiet)toast(w.boss?"Wave "+n+": Bounty sniper":"Wave "+n,w.boss?"var(--cyan)":"var(--fg)");
  }
  function updateWave(dt){
    var R=run;
    if(R.done){if((R.exitT-=dt)<=0)extract();return}
    if(R.breather>0){if((R.breather-=dt)<=0)beginWave(R.wave+1);return}
    R.waveT+=dt;
    while(R.podAt.length&&R.waveT>=R.podAt[0]){R.podAt.shift();randomPod()}
    if(R.queue.length){
      if((R.spawnT-=dt)<=0){R.spawnT=T.wave.stagger;var kind=R.queue.shift();bots.push(kind==="boss"?newBoss():kind==="loader"?newLoader():newBot())}
    } else if(!bots.length){
      toast("Wave "+R.wave+" cleared","var(--good)");
      if(R.wave>=T.waves.length){R.done=true;R.exitT=T.wave.exit}else R.breather=T.wave.breather;
    }
  }
  function extract(){
    scraps.forEach(function(s){nearestPlayer(s.x,s.y).scrap++});   /* whatever is still on the floor goes to the nearest mech */
    scrap+=scraps.length;scraps.length=0;
    var got=scrap,per=players.map(function(q){return q.scrap}),arm=players.map(function(q){return Math.max(Math.ceil(q.hp),Math.ceil(q.maxHp*T.level.revive))});
    scrap=0;state="extracted";
    emit(["o","extracted","Level "+level+" cleared. You banked "+got+" scrap"+(players.length>1?" ("+per.join(" + ")+")":"")+". Repair and shop in the garage, then drop into level "+Math.min(T.level.max,level+1)+".",got,{result:"extracted",level:level,scrap:per,armor:arm}]);
  }
  /* Drop pods: a marker and countdown, then the crate falls like a bot does and waits to be touched. */
  var POD_TYPES=["repair","overclock"];
  function spawnPod(type,x,y,counting){
    var P=T.pods,o={type:type,x:x,y:y,z:counting?P.dropHeight:0,vz:0,t:counting?P.countdown:0,landed:!counting,field:null,ft:0};
    pods.push(o);return o;
  }
  function randomPod(){
    var cs=openCells().filter(function(c){return players.every(function(q){return q.hp<=0||Math.hypot(c[0]-q.x,c[1]-q.y)>=T.pods.minDist})});
    if(!cs.length)return;
    var c=cs[(rnd()*cs.length)|0];spawnPod(POD_TYPES[(rnd()*POD_TYPES.length)|0],c[0],c[1],true);
  }
  function applyPod(o,e){
    var P=T.pods,amt=Math.round(e.maxHp*P.heal);
    if(o.type==="repair"){e.hp=Math.min(e.maxHp,e.hp+amt);floatText(e.x,e.y,2,"+"+amt,"#7fdc6a")}
    else{e.oc=P.overclock.time;floatText(e.x,e.y,2,"OVERCLOCK","#3fd6e8")}
    sparks(o.x,o.y,.5,12,[63,214,232]);
    if(e.team===0)toast(o.type==="repair"?"Field repair: +"+amt+" armor":"Overclock: ATB x"+P.overclock.mult+" for "+P.overclock.time+" s","var(--cyan)",e.idx);
    else toast((e.loader?"Loader":"Patrol bot")+" took a pod","var(--hazard)");
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
      if(!taker)for(var j=0;j<bots.length&&!taker;j++){var b=bots[j];if(b.hp>0&&!b.boss&&!b.dropping&&Math.hypot(b.x-o.x,b.y-o.y)<P.touch)taker=b}
      if(taker){pods.splice(i,1);applyPod(o,taker)}
    }
  }
  function podFor(b){
    var best=null,bd=1e9,low=b.hp<b.maxHp*.5;
    pods.forEach(function(o){if(!o.landed||!o.field)return;var d=Math.hypot(o.x-b.x,o.y-b.y),np=nearestPlayer(o.x,o.y);
      if(d<bd&&(low||d<Math.hypot(o.x-np.x,o.y-np.y))){bd=d;best=o}});
    return best;
  }
  /* Bounty sniper: a bot variant that perches on roof edges, so the minigun can reach it from range. */
  function aloft(b){return b.boss&&b.z>.05}
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
  function pickPerch(cx,cy,minD,maxD){
    var pl=nearestPlayer(cx,cy),a=perches().filter(function(c){var d=Math.hypot(c[0]-cx,c[1]-cy);return d>=minD&&d<=maxD&&Math.hypot(c[0]-pl.x,c[1]-pl.y)>=T.wave.perchMin*.5});
    var see=a.filter(function(c){return los3(c[0],c[1],c[2]+.8,pl.x,pl.y,.9)}),pool=see.length?see:a;
    return pool.length?pool[(rnd()*pool.length)|0]:null;
  }
  function newBoss(){
    var B=T.boss,lp=players.filter(function(q){return q.hp>0}),A=lp.length?lp[(rnd()*lp.length)|0]:players[0],c=pickPerch(A.x,A.y,T.wave.perchMin,16)||pickPerch(A.x,A.y,0,99)||[spawnCells[0][0],spawnCells[0][1],0];
    return {team:1,boss:true,x:c[0],y:c[1],z:c[2],vz:0,dropping:false,vx:0,vy:0,r:B.radius,h:B.height,hp:Math.round(B.hp*lvm("hp")),maxHp:Math.round(B.hp*lvm("hp")),
      head:0,aim:0,state:"boss",flash:0,step:0,mode:"perch",cd:1.2,tell:0,blind:0,stun:0,jt:0,fallZ:0,
      jumpCd:B.jump[0]+rnd()*(B.jump[1]-B.jump[0])};
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
        if(b.fallZ-g>=B.fallMin){b.stun=B.stun;b.tell=0;damage(b,B.fallDmg,b.x,b.y,g+1);if(b.hp>0)toast("Sniper brought down","var(--hazard)")}
      }
      return;
    }
    /* perched: the voxel under its feet is gone, so it falls */
    if(b.z>.05&&!solidAt(b.x,b.y,b.z-.5)){b.mode="fall";b.vz=0;b.fallZ=b.z;b.tell=0;return}
    if(alive)b.aim=angTo(b.aim,Math.atan2(p.y-b.y,p.x-b.x),6,dt);
    if(b.stun>0)return;
    var sees=alive&&dist<B.sight&&los3(b.x,b.y,b.z+.8,p.x,p.y,.9);
    if(b.tell>0){
      if(!alive){b.tell=0;return}
      if((b.tell-=dt)<=0){
        var ox=b.x+Math.cos(b.aim)*.5,oy=b.y+Math.sin(b.aim)*.5,oz=b.z+.8,dx=p.x-ox,dy=p.y-oy,dz=.9-oz,d=Math.hypot(dx,dy,dz);
        shots.push({x:ox,y:oy,z:oz,vx:dx/d*B.shotSpeed,vy:dy/d*B.shotSpeed,vz:dz/d*B.shotSpeed,dmg:B.dmg*lvm("dmg"),team:1,t:3,kind:"orb",big:1});
        sparks(ox,oy,oz,6,[255,90,74]);b.cd=B.fireEvery;
      }
      return;
    }
    b.cd-=dt*(b.slow>0?T.vent.slowMul:1);b.jumpCd-=dt;b.blind=sees||!alive?0:b.blind+dt;
    if(sees&&b.cd<=0){b.tell=B.tell;return}
    if(b.jumpCd<=0||b.blind>1.5){
      var c=pickPerch(b.x,b.y,3,B.jumpRange);
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
    var g=T[p.gun],ca=Math.cos(p.aim),sa=Math.sin(p.aim),n=g.pellets||1,kind=p.gun==="plasma"||p.gun==="rail"?p.gun:"bullet";
    var tx=p.x+ca*.62+sa*.36,ty=p.y+sa*.62-ca*.36,tz=1.1;   /* right-arm barrel tip */
    var dx=p.ax-tx,dy=p.ay-ty,dz=p.az-tz,d=Math.hypot(dx,dy,dz)||1;
    for(var k=0;k<n;k++){
      var sp=g.spread,ux=dx/d+(rnd()-.5)*sp,uy=dy/d+(rnd()-.5)*sp,uz=dz/d+(rnd()-.5)*sp*.5,ul=Math.hypot(ux,uy,uz);
      var o={x:tx,y:ty,z:tz,vx:ux/ul*g.speed,vy:uy/ul*g.speed,vz:uz/ul*g.speed,dmg:g.dmg*p.dmgMul,team:0,t:g.life,kind:kind};
      if(kind==="rail"){o.pen=g.pen;o.hit=[]}
      shots.push(o);
    }
    if(kind==="rail"){sparks(tx,ty,tz,8,[160,230,255]);addShake(.06)}
    p.muzzle=n>1||kind==="rail"?.08:.05;addHeat(p,g.heat);
  }
  function addHeat(p,h){p.heat=Math.min(100,p.heat+h*(p.heatMul||1));if(p.heat>=100&&!p.over){p.over=T.heat.lockout;toast("Overheated: guns locked","var(--bad)",p.idx);smoke(p.x,p.y,1.3,10,[220,220,220])}}
  function damage(e,dmg,x,y,z){
    if(e.hp<=0)return;e.hp-=dmg;e.flash=.08;if(e.team===0)e.calm=0;
    if(e.team===1){floatText(x,y,z+.3,Math.round(dmg),"#f2c230");if(e.state==="patrol"){e.state="engage";e.lost=0}}
    else floatText(x,y,z+.3,Math.round(dmg),"#ff5a4a");
    if(e.hp<=0)(e.team===1?killBot:killPlayer)(e);
  }
  function killBot(b){
    kills++;var c=b.boss?[63,214,232]:b.loader?[176,150,52]:[140,70,56],z0=b.boss?b.z:0;
    for(var k=0;k<14;k++)debrisPiece(b.x,b.y,z0+.5,k%2?c:[60,62,66]);
    sparks(b.x,b.y,z0+.6,18,[255,170,60]);smoke(b.x,b.y,z0+.5,8,[90,90,90]);
    var sc=b.loader?T.loader.scrap:T.bot.scrap,n=b.boss?T.boss.scrap:sc[0]+((rnd()*(sc[1]-sc[0]+1))|0),sx=b.x,sy=b.y,sz=.4;
    if(b.dbl)n*=2;   /* killed by a Perfect pile-bunker hit */
    n=Math.round(n*lvm("scrap"));
    if(aloft(b)){var g=groundNear(b.x,b.y);sx=g[0];sy=g[1];sz=1.5}   /* roof loot drops to street level */
    if(b.boss)toast("Bounty sniper down","var(--hazard)");
    for(k=0;k<n;k++)scraps.push({x:sx,y:sy,z:sz,vx:(rnd()-.5)*4,vy:(rnd()-.5)*4,vz:3+rnd()*2,t:0,spin:rnd()*6});
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
    }
    smoke(b.x,b.y,.5,3,[200,200,200]);
  }
  function firePile(p,grade){
    var K=T.pile,m=K.mult[grade],ca=Math.cos(p.aim),sa=Math.sin(p.aim),perfect=grade==="Perfect";
    p.atb=0;p.ring=-1;p.pileT=K.ext;p.pileRes=grade;
    if(grade==="Miss"&&p.pileKind!=="buster")p.retract=K.retract;
    floatText(p.x,p.y,2.1,grade==="Perfect"?"PERFECT":grade,perfect?"#f2c230":grade==="Good"?"#7fdc6a":"#ff5a4a");
    addHeat(p,K.heat);
    if(p.pileKind==="buster"){fireBuster(p,m);return}
    if(p.pileKind==="winch"){fireWinch(p,grade,m);return}
    bots.forEach(function(b){
      if(b.hp<=0||b.dropping||b.z>.5)return;   /* a roof sniper is out of reach */
      var dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy);if(d>K.reach+b.r)return;
      var ang=Math.abs(Math.atan2(ca*dy-sa*dx,ca*dx+sa*dy));
      if(d>b.r&&ang>K.cone+Math.atan2(b.r,d))return;
      var dm=Math.round(K.dmg*m*p.dmgMul);if(perfect&&b.hp<=dm)b.dbl=true;
      damage(b,dm,b.x,b.y,.8);sparks(b.x,b.y,.8,perfect?16:8,[255,255,255]);
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
  function fireBuster(p,m){
    var B=T.buster,ca=Math.cos(p.aim),sa=Math.sin(p.aim),tx=p.x-sa*.42+ca*.8,ty=p.y+ca*.42+sa*.8,tz=1.05;
    var dx=p.ax-tx,dy=p.ay-ty,dz=p.az-tz,d=Math.hypot(dx,dy,dz)||1;
    shots.push({x:tx,y:ty,z:tz,vx:dx/d*B.speed,vy:dy/d*B.speed,vz:dz/d*B.speed,dmg:Math.round(B.dmg*m*p.dmgMul),team:0,t:B.life,kind:"shell"});
    sparks(tx,ty,tz,10,[255,200,120]);smoke(tx,ty,tz,3,[200,200,200]);p.muzzle=.1;addShake(.2);
    if(!p.immune)knockBot(p,-ca,-sa,B.recoil,false);
  }
  /* Mag-winch: a cable along the aim. Light bots are reeled in; a wall or a heavy loader reels you in instead;
     a roof sniper is yanked off its perch; a Perfect hit on a pillar tears out its base. */
  function fireWinch(p,grade,m){
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
      var b=hitB;damage(b,Math.round(Wn.dmg*m*p.dmgMul),b.x,b.y,b.z+.8);if(b.hp<=0)return;
      if(aloft(b)){   /* yanked off the roof: it falls, and a long fall stuns and hurts it */
        b.mode="fall";b.vz=0;b.fallZ=b.z;b.tell=0;b.x-=px*1.2;b.y-=py*1.2;toast("Sniper yanked off the roof","var(--hazard)");
      } else if(b.loader){winchPull(p,px,py,pl-b.r-p.r-.15)}
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
    var ca=Math.cos(p.aim),sa=Math.sin(p.aim),g=T.collapse.gravity,ft=M.flight*(.8+.4*dl/M.maxR);
    for(var k=0;k<M.shells;k++){
      var side=k?1:-1,ox=p.x-ca*.15+sa*side*.18,oy=p.y-sa*.15-ca*side*.18,oz=1.7;
      var tx=p.x+dx+(rnd()-.5)*M.spread,ty=p.y+dy+(rnd()-.5)*M.spread,tz=p.az>.7?p.az:0;
      shots.push({x:ox,y:oy,z:oz,vx:(tx-ox)/ft,vy:(ty-oy)/ft,vz:(tz-oz+.5*g*ft*ft)/ft,dmg:M.dmg*p.dmgMul,team:0,t:ft*2+1,kind:"mortar",big:k});
      smoke(ox,oy,oz,3,[200,200,200]);
    }
    sparks(p.x,p.y,1.8,8,[255,200,120]);addShake(.12);addHeat(p,M.heat);return true;
  }
  function fireVent(p){
    var V=T.vent,n=0;
    p.heat=0;if(p.over){p.over=0;toast("Vented: guns unlocked","var(--good)",p.idx)}
    bots.forEach(function(b){if(b.hp<=0||b.dropping)return;
      if(Math.hypot(b.x-p.x,b.y-p.y,(b.z||0)-p.z)>V.radius)return;
      b.slow=V.slow;n++;damage(b,Math.round(V.dmg*p.dmgMul),b.x,b.y,b.z+.8);sparks(b.x,b.y,b.z+.6,6,[150,232,240])});
    for(var k=0;k<14;k++){var a=k/14*6.283;smoke(p.x+Math.cos(a)*1.2,p.y+Math.sin(a)*1.2,.4,1,[200,240,250])}
    sparks(p.x,p.y,1.2,20,[150,232,240]);floatText(p.x,p.y,2.1,n?"FROZEN x"+n:"VENT","#3fd6e8");
    return true;
  }
  function updateShoulder(p,dt,press){
    if(!p.q)return;
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
      p.atb=Math.min(T.atb.fill,p.atb+dt*p.atbRate*(p.oc>0?T.pods.overclock.mult:1));
      if(press){
        if(p.over||p.retract>0||p.atb<T.atb.fill){if(p.cue<=0){p.cue=.6;floatText(p.x,p.y,1.9,p.retract>0?"retracting":"charging","#a39d93")}}
        else p.ring=0;
      }
      return;
    }
    p.ring+=dt;
    if(p.over){p.ring=-1;p.atb=0;p.retract=T.pile.retract;p.pileRes="Miss";floatText(p.x,p.y,2.1,"Miss","#ff5a4a")}
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
    var det={result:"dead",level:level};
    msg="Mech destroyed on "+w+". You lost "+lost+" scrap from this match. Parts you own are never lost; scrap only counts once you extract.";
    emit(["o","dead",msg,0,det]);
  }

  /* ----- update ----- */
  function updatePlayer(p,dt,inp){
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
    if(inp.l&&!p.over&&p.cool<=0){fireMinigun(p);var gg=T[p.gun];p.cool=gg.every||1/gg.rate}
    var press=inp.rp||(inp.r&&!p.rPrev);p.rPrev=inp.r;inp.rp=false;p.rDown=inp.r;
    updatePile(p,dt,press);
    p.muzzle-=dt;p.flash-=dt;if(p.oc>0)p.oc=Math.max(0,p.oc-dt);
  }
  function updateBot(b,dt){
    var B=T.bot,p=nearestPlayer(b.x,b.y);
    b.flash-=dt;if(b.slow>0)b.slow-=dt;
    if(b.boss){updateBoss(b,dt);return}
    if(b.oc>0)b.oc-=dt;
    if(b.dropping){
      b.vz-=30*dt;b.z+=b.vz*dt;
      if(b.z<=0){b.z=0;b.dropping=false;smoke(b.x,b.y,.1,10,[150,140,120]);sparks(b.x,b.y,.2,8,[255,200,120]);
        players.forEach(function(q){if(q.hp>0&&Math.hypot(q.x-b.x,q.y-b.y)<1.2)damage(q,10*lvm("dmg"),q.x,q.y,1)})}
      return;
    }
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
          shots.push({x:ox,y:oy,z:oz,vx:dx/d*B.shotSpeed,vy:dy/d*B.shotSpeed,vz:dz/d*B.shotSpeed,dmg:B.shotDmg*lvm("dmg"),team:1,t:2,kind:"orb"});
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
    var L=T.loader,p=nearestPlayer(b.x,b.y);
    if(b.slow>0)dt*=T.vent.slowMul;   /* frozen: the tell, the charge and the cooldown all run slow */
    b.cd-=dt;
    if(b.state==="tell"){
      b.vx=b.vy=0;b.head=angTo(b.head,Math.atan2(b.cy,b.cx),12,dt);
      if((b.t-=dt)<=0){b.state="charge";b.t=L.charge;b.hit=false}
      return [null,0];
    }
    if(b.state==="charge"){
      b.vx=b.cx*L.chargeSpeed;b.vy=b.cy*L.chargeSpeed;b.head=Math.atan2(b.cy,b.cx);ram(b);
      if(!b.hit&&alive&&Math.hypot(p.x-b.x,p.y-b.y)<b.r+p.r+.05){
        b.hit=true;damage(p,L.dmg*lvm("dmg"),p.x,p.y,1);if(!p.immune)knockBot(p,b.cx,b.cy,L.shove,false);
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
  function updateShots(dt){
    for(var i=shots.length-1;i>=0;i--){
      var s=shots[i],n,dead=false;
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
            if(s.kind==='rail'){if(s.hit.indexOf(e)>=0)continue;s.hit.push(e);damage(e,s.dmg,s.x,s.y,s.z);sparks(s.x,s.y,s.z,10,[160,230,255]);continue}
            damage(e,s.dmg*(e.armored&&s.kind==='bullet'?T.loader.minigunMult:1),s.x,s.y,s.z);sparks(s.x,s.y,s.z,s.kind==='shell'?14:4,s.team?[255,90,74]:s.kind==='plasma'?[200,170,255]:[255,220,140]);dead=true;break}
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
      if(d<M.radius)damage(b,Math.round(s.dmg*(1-.5*d/M.radius)),b.x,b.y,b.z+.8)});
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
      if(s.t>.5&&p.hp>0&&dl<.55){scrap++;p.scrap++;floatText(p.x,p.y,1.8,"+1 scrap","#f2c230");scraps.splice(i,1)}
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
    pl.forEach(function(q,qi){
      if(q.hp<=0)return;
      var inp=inputs[qi];
      if(inp.seq>=0&&tick-inp.at>stale){inp.k=0;inp.l=false;inp.r=false;inp.rp=false}
      updatePlayer(q,dt,inp);
    });
    for(i=0;i<bots.length;i++)updateBot(bots[i],dt);
    for(i=0;i<bots.length;i++){if(bots[i].dropping||aloft(bots[i]))continue;for(j=0;j<pl.length;j++)if(pl[j].hp>0)separate(pl[j],bots[i]);for(j=i+1;j<bots.length;j++)if(!bots[j].dropping&&!aloft(bots[j]))separate(bots[i],bots[j])}
    if(pl.length>1&&pl[0].hp>0&&pl[1].hp>0)separate(pl[0],pl[1]);
    for(i=0;i<bots.length;i++)if(!aloft(bots[i]))collide(bots[i]);
    for(i=0;i<pl.length;i++)if(pl[i].hp>0)collide(pl[i]);
    for(i=bots.length-1;i>=0;i--)if(bots[i].hp<=0)bots.splice(i,1);
    if(state==="play")updateWave(dt);
    if(state!=="drop")updatePods(dt);updateShots(dt);updateScraps(dt);stepDebris(dt);
    if(supportDirty)checkSupports();
    updateClusters(dt);flushWalk();
    tick++;
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
      r2(q.atb),r2(q.ring),r2(q.retract),r2(q.pileT),r2(q.oc),q.muzzle>0?1:0,q.flash>0?1:0,r2(q.ax),r2(q.ay),r2(q.az),r2(q.step)])});
    bots.forEach(function(b){
      if(!b.id)b.id=++eid;
      var k=b.boss?2:b.loader?1:0,f=(b.dropping?1:0)|(b.flash>0?2:0)|(b.state==="tell"?4:0)|(b.state==="charge"?8:0)|(b.slow>0?32:0);
      var row=[b.id,k,r2(b.x),r2(b.y),r2(b.z),r2(b.head),r2(b.aim),Math.max(0,Math.ceil(b.hp)),0];
      if(k===2){row.push(r2(b.tell>0?b.tell:0),r2(b.base||0));if(b.mode==="jump"&&b.j1){f|=16;row.push(r2(b.j1[0]),r2(b.j1[1]),r2(b.j1[2]))}}
      row[8]=f;s.b.push(row);
    });
    for(i=0;i<shots.length&&i<T.net.shotMax;i++){var q=shots[i];if(!q.id)q.id=++eid;
      s.s.push([q.id,r2(q.x),r2(q.y),r2(q.z),r2(q.vx),r2(q.vy),r2(q.vz),SHOT_KIND[q.kind]||0,q.big?1:0])}
    for(i=0;i<scraps.length&&i<T.net.scrapMax;i++){var c=scraps[i];if(!c.id)c.id=++eid;s.sr.push([c.id,r2(c.x),r2(c.y),r2(c.z),r2(c.spin)])}
    pods.forEach(function(o){if(!o.id)o.id=++eid;s.pd.push([o.id,o.type==="repair"?0:1,r2(o.x),r2(o.y),r2(o.z),r2(Math.max(0,o.t)),o.landed?1:0])});
    clusters.forEach(function(c){s.cl.push([c.id,r2(c.off),r2(c.creak),r2(c.t)])});
    s.q=players.map(function(q){return r2(q.sq||0)});   /* shoulder recharge per seat */
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
  function applyBuild(i,build){
    var q=newPlayer(cleanBuild(build),i);
    if(i<players.length){var o=players[i];for(var k in q)if(k!=="x"&&k!=="y"&&k!=="idx")o[k]=q[k]}
    else{players.push(q);inputs.push(mkInput())}
    fieldsDirty=true;
  }
  function dropPlayer(i){var q=players[i];if(q&&q.hp>0){q.hp=0;if(state==="play"||state==="drop")lossCheck()}}

  buildMap();buildChunks();rebuildWalk();
  spawnCells=openCells();sim.introTicks=zone.intro;   /* the drop-in intro: the zone opens in the middle of it, the waves start after */
  (opts.builds&&opts.builds.length?opts.builds:[STARTER]).forEach(function(b,i){players.push(newPlayer(cleanBuild(b),i));inputs.push(mkInput())});
  (opts.armor||[]).forEach(function(a,i){var q=players[i];
    if(q&&typeof a==="number"&&a===a)q.hp=Math.max(1,Math.min(q.maxHp,a<1?a*q.maxHp:a))});
  beginWave(1,true);
  world.rev=1;

  sim.setInput=setInput;sim.step=step;sim.snapshot=snapshot;sim.voxelDiffSince=voxelDiffSince;sim.applyBuild=applyBuild;sim.dropPlayer=dropPlayer;
  sim.drainEvents=function(){var e=events.slice();events.length=0;return e};
  Object.defineProperties(sim,{
    tick:{get:function(){return tick}},state:{get:function(){return state}},wave:{get:function(){return run.wave}},
    scrap:{get:function(){return scrap},set:function(v){scrap=v}},kills:{get:function(){return kills}},
    level:{get:function(){return level}},shake:{get:function(){return shake}},
    zone:{get:function(){return zone}}
  });
  sim.markOpen=function(k){if(zone.open<k+1)zone.open=k+1;if(zone.opening===k)zone.opening=-1;spawnCells=openCells()};
  /* debug hooks */
  sim.killAll=function(){bots.slice().forEach(function(b){damage(b,1e9,b.x,b.y,b.z)})};
  sim.damage=damage;sim.hitVoxel=hitVoxel;sim.spawnPod=spawnPod;sim.perches=perches;sim.los3=los3;sim.collide=collide;sim.flowField=flowField;
  sim.stepDebris=stepDebris;sim.debrisPiece=debrisPiece;
  sim.spawnLoader=function(x,y){var l=newLoader();l.x=x;l.y=y;l.z=0;l.dropping=false;bots.push(l);return l};
  sim.setVox=function(x,y,z,m){var i=vi(x,y,z);if(!m&&vox[i])removeVoxel(i,x,y,z);else{vox[i]=m;touch(i)}};
  sim.dbg=function(){var w=[];structures.forEach(function(st){if(st&&st.kind==='pillar'&&pillarIsDown(st))w.push(st.x+.2,st.x+1)});var pv=0,pd=0;
    for(var i=0;i<N;i++)if(vox[i]===1&&structures[owner[i]]&&structures[owner[i]].kind==='pillar'){pv++;pd+=vdmg[i]}
    var deck=0;for(i=0;i<N;i++)if(vox[i]===3)deck++;
    return {pv:pv,pd:pd,down:pillarsDown,which:w,clusters:clusters.length,debris:debris.length,deck:deck,alive:chunks.filter(function(c){return c.alive}).length,chunks:chunks.length,chk:chk.last}};
  return sim;
}

/* ===== Campaign: the save. {v:1, seed, level, players:[{build, owned:[ids], scrap, armor}]}.
   players[0] is the host / single player. A mode field in saves from before Gauntlet was cut (GDD-D29) is ignored.
   armor: null = full, else absolute armor points. encode() is JSON as base64url (the
   "campaign code"); decode() returns a clean campaign or null when anything is off (unknown part ids, negative scrap, level outside 1..max). ===== */
var Campaign=(function(){
  var SCRAP_MAX=10000000;
  function starterOwned(){var a=[];SLOTS.forEach(function(sl){if(STARTER[sl[0]])a.push(STARTER[sl[0]])});return a}
  function player(build,owned,scrap,armor){
    var b=cleanBuild(build),o=starterOwned();
    (owned||[]).concat(SLOTS.map(function(sl){return b[sl[0]]})).forEach(function(id){if(id&&PART[id]&&o.indexOf(id)<0)o.push(id)});
    return {build:b,owned:o,scrap:scrap|0,armor:armor===undefined?null:armor};
  }
  function make(builds,_mode,seed){return {v:1,seed:seed||7,level:1,players:(builds||[STARTER]).map(function(b){return player(b)})}}
  function cleanPlayer(p){
    if(!p||typeof p!=="object"||!p.build||typeof p.build!=="object"||!Array.isArray(p.owned))return null;
    var owned=[],i,id;
    for(i=0;i<p.owned.length;i++){id=p.owned[i];if(typeof id!=="string"||!PART[id])return null;if(owned.indexOf(id)<0)owned.push(id)}
    var b={};
    for(i=0;i<SLOTS.length;i++){var k=SLOTS[i][0];id=p.build[k];
      if(id!==null&&id!==undefined&&(typeof id!=="string"||!PART[id]||PART[id].slot!==k))return null;
      b[k]=id||null}
    b=cleanBuild(b);
    starterOwned().forEach(function(x){if(owned.indexOf(x)<0)owned.push(x)});
    for(i=0;i<SLOTS.length;i++){id=b[SLOTS[i][0]];if(id&&owned.indexOf(id)<0)return null}   /* fitted parts must be owned */
    if(typeof p.scrap!=="number"||!(p.scrap>=0)||p.scrap>SCRAP_MAX)return null;
    var ar=p.armor;if(ar!==null&&ar!==undefined&&(typeof ar!=="number"||!(ar>=0)||ar>100000))return null;
    return {build:b,owned:owned,scrap:Math.floor(p.scrap),armor:ar===null||ar===undefined?null:Math.round(ar)};
  }
  function validate(c){
    if(!c||typeof c!=="object"||c.v!==1||!Array.isArray(c.players)||c.players.length<1||c.players.length>2)return null;
    var lv=c.level,sd=c.seed===undefined?7:c.seed;
    if(typeof lv!=="number"||lv!==Math.floor(lv)||lv<1||lv>T.level.max)return null;
    if(typeof sd!=="number"||sd!==Math.floor(sd)||sd<1||sd>2147483000)return null;
    var ps=[];
    for(var i=0;i<c.players.length;i++){var p=cleanPlayer(c.players[i]);if(!p)return null;ps.push(p)}
    return {v:1,seed:sd,level:lv,players:ps};
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
  /* The campaign after a level was extracted: next level, each mech's scrap added, armor carried. detail = the "o" event's detail. */
  function advance(c,d){
    var n=JSON.parse(JSON.stringify(c));
    n.level=Math.min(T.level.max,c.level+1);
    n.players.forEach(function(p,i){p.scrap+=(d.scrap&&d.scrap[i])|0;if(d.armor&&typeof d.armor[i]==="number")p.armor=d.armor[i]});
    return n;
  }
  /* each level plays a different (deterministic) sim seed */
  function levelSeed(c){return ((c.seed+(c.level-1)*7919)%2147483646)+1}
  return {make:make,player:player,validate:validate,encode:encode,decode:decode,advance:advance,levelSeed:levelSeed,starterOwned:starterOwned};
})();

root.MetroSim={create:create,Campaign:Campaign,T:T,SHOT_KIND:SHOT_KIND,MAT:MAT,WINDOW:WINDOW,MAP:MAP,PARTS:PARTS,PART:PART,SLOTS:SLOTS,STARTER:STARTER,BASE:BASE,W:W,D:D,H:H,hash:hash,
  deriveStats:deriveStats,moveMech:moveMech,clusterGeom:clusterGeom,cleanBuild:cleanBuild,cloneBuild:cloneBuild,statsOf:statsOf};
})(typeof globalThis!=='undefined'?globalThis:this);
