/* Metr0niks ink prototype (prototype 2): the five zones of Overpass Sector 4, drawn for the sun-bleached ink look.
   Level design: games/metr0niks/level-design-ink.md. Zone names, order and lengths come from sim.js (MetroSim.MAP.zones),
   so this map opens zone by zone exactly like the voxel map; the layouts inside each zone are the ink prototype's own.
   Coordinates are world px: x along the sector (XS px per sim metre), y across it (north 0, south WH).
   Props named here either come from the Scenario atlas (adobe, shack, tower, pillar, stall and the small props) or are
   drawn in code by makeSprites below (containers, warehouse, halls, chimneys, vats, towers, pylons, bunkers, legs). */
(function(root){
"use strict";
var XS=50,WH=1900;
var MAPZ=(root.MetroSim&&MetroSim.MAP&&MetroSim.MAP.zones)||[{name:"Underpass",x0:0,x1:47},{name:"Freight Yard",x0:48,x1:83},{name:"Smelter Row",x0:84,x1:119},
  {name:"Glass Quarter",x0:120,x1:167},{name:"Terminus Yard",x0:168,x1:215,arena:{x:192,y:24,r:12}}];
var ZONES=MAPZ.map(function(z,i){return {name:z.name,x0:z.x0*XS,x1:(z.x1+1)*XS,level:i+1,arena:z.arena?{x:z.arena.x*XS,y:WH/2,r:z.arena.r*XS}:null}});
var WW=ZONES[ZONES.length-1].x1;
/* the overpass: its pillars (sim.js MAP.overpass.pillarsX) stand in a row under the deck band; in the ink world the deck is
   long gone, so the pillars are the broken stubs from the atlas */
var OP=(root.MetroSim&&MetroSim.MAP&&MetroSim.MAP.overpass)||{pillarsX:[5,17,29,41,53,65,77,89,101,113,125,137,149,161],x1:167};
var DECK={y0:830,y1:1080,x1:(OP.x1+1)*XS,pillarY:1000};
/* each zone's street tint and colour notes, drawn under the props */
var LOOK=[
  {tint:null,name:"Shanty market"},
  {tint:"rgba(214,210,198,.30)",name:"Container yard"},
  {tint:"rgba(96,64,44,.16)",name:"Furnace canyons"},
  {tint:"rgba(150,170,205,.13)",name:"Financial district"},
  {tint:"rgba(217,164,65,.12)",name:"The arena"}];
/* where the mechs land: level 1 at the Underpass plaza; a level that opens a zone lands in front of that zone's shutter */
function dropPoint(level){
  if(level<=1)return {x:1200,y:800};
  var z=ZONES[Math.min(ZONES.length,level)-1];return {x:z.x0-420,y:DECK.y0-40};
}

/* ---------- drawn-in-code sprites, in the atlas's palette ---------- */
var P={ink:"#2b2420",sand:"#e8d6b0",cream:"#fbf3e2",peach:"#f0a07a",sage:"#9cc3a8",coral:"#e07a5f",teal:"#7fc4c0",mustard:"#d9a441",
  slate:"#6f86a8",rust:"#b5643c",concrete:"#cfc6b4",conc2:"#b9ae99",iron:"#7a6c63",iron2:"#5d524c",soot:"#4d4440",glass:"#a9bccb",glass2:"#7d97b4",
  pink:"#ff4f9a",furnace:"#ffb054",steel:"#8e9aa3"};
function wob(seed){var r=seed||1;return function(){r=(r*9301+49297)%233280;return r/233280-.5}}
/* a hand-inked polygon: slight wobble on every corner */
function poly(g,pts,fill,lw,R){g.beginPath();pts.forEach(function(p,i){var x=p[0]+(R?R()*1.6:0),y=p[1]+(R?R()*1.6:0);i?g.lineTo(x,y):g.moveTo(x,y)});g.closePath();
  if(fill){g.fillStyle=fill;g.fill()}if(lw){g.lineWidth=lw;g.strokeStyle=P.ink;g.lineJoin="round";g.stroke()}}
function line(g,x0,y0,x1,y1,lw,c){g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.lineWidth=lw;g.strokeStyle=c||P.ink;g.lineCap="round";g.stroke()}
function shade(c,k){var n=parseInt(c.slice(1),16),r=n>>16,gg=n>>8&255,b=n&255,f=function(v){return Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)))};
  return "rgb("+f(r)+","+f(gg)+","+f(b)+")"}
/* an extruded box in the 3/4 view: front face w x h standing on the base line y, top face dd deep behind it */
function box(g,x,y,w,h,dd,front,top,R){
  poly(g,[[x,y-h],[x+w,y-h],[x+w,y-h-dd],[x,y-h-dd]],top||shade(front,.25),3,R);
  poly(g,[[x,y],[x+w,y],[x+w,y-h],[x,y-h]],front,3,R);
}
/* roof clutter on a box's top face: a parapet line, vents and AC boxes, a stain or two */
function roof(g,x,y,w,h,dd,col,R,kind){
  var ty=y-h-dd,inset=Math.min(10,dd*.18);
  g.save();g.strokeStyle="rgba(43,36,32,.45)";g.lineWidth=2;g.strokeRect(x+inset,ty+inset*.7,w-inset*2,dd-inset*1.4);g.restore();
  if(kind==="ridge"){g.save();g.strokeStyle="rgba(43,36,32,.28)";g.lineWidth=1.5;for(var i=x+inset+8;i<x+w-inset;i+=12){g.beginPath();g.moveTo(i,ty+inset);g.lineTo(i,ty+dd-inset);g.stroke()}g.restore()}
  var n=Math.max(1,Math.round(w/140));
  for(var k=0;k<n;k++){var vx=x+inset+12+(w-inset*2-50)*((k+.5)/n)+R()*20,vy=ty+dd*.35+R()*dd*.2,vw=22+Math.abs(R())*26;
    box(g,vx,vy+16,vw,12,10,shade(col,-.15),shade(col,.2),R)}
  if(w>200){g.beginPath();g.arc(x+w*.72,ty+dd*.6,9,0,6.283);g.fillStyle=shade(col,-.3);g.fill();g.lineWidth=2;g.strokeStyle=P.ink;g.stroke()}
  g.save();g.globalAlpha=.13;g.fillStyle=P.ink;g.beginPath();g.ellipse(x+w*.3,ty+dd*.65,w*.12,dd*.15,0,0,6.283);g.fill();g.restore();
}
function hatch(g,x,y,w,h,step,a){g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.strokeStyle="rgba(43,36,32,"+(a||.18)+")";g.lineWidth=1.2;
  for(var i=-h;i<w;i+=step){g.beginPath();g.moveTo(x+i,y+h);g.lineTo(x+i+h,y);g.stroke()}g.restore()}
function windows(g,x,y,w,h,cols,rows,lit,R,litP){
  var cw=w/cols,rh=h/rows;for(var c=0;c<cols;c++)for(var r=0;r<rows;r++){var on=(R()+.5)<(litP==null?.55:litP);
    poly(g,[[x+c*cw+cw*.22,y+r*rh+rh*.25],[x+c*cw+cw*.78,y+r*rh+rh*.25],[x+c*cw+cw*.78,y+r*rh+rh*.8],[x+c*cw+cw*.22,y+r*rh+rh*.8]],on?lit:shade(P.ink,.35),2,null)}}
function container(g,x,y,w,h,dd,col,R){
  box(g,x,y,w,h,dd,col,shade(col,.3),R);
  g.save();g.strokeStyle="rgba(43,36,32,.35)";g.lineWidth=1.6;for(var i=x+10;i<x+w-6;i+=11){g.beginPath();g.moveTo(i,y-h+6);g.lineTo(i,y-5);g.stroke()}g.restore();
  poly(g,[[x+w-26,y-h+8],[x+w-8,y-h+8],[x+w-8,y-6],[x+w-26,y-6]],shade(col,-.12),2,R);
  hatch(g,x,y-h,w,h,9,.08);
}
var CCOL=[P.coral,P.teal,P.mustard,P.slate,P.sage,P.rust];
/* sprite recipes: [name, width, height, draw(g,w,h)]. Each canvas has the base line at h-4 and is pivoted there. */
function recipes(){
  var list=[];
  function add(n,w,h,f){list.push([n,w,h,f])}
  /* containers: single boxes and stacks of 2 and 3 */
  for(var c=0;c<4;c++)(function(c){
    add("cont"+c,152,112,function(g,w,h){container(g,6,h-4,140,54,40,CCOL[c],wob(11+c))});
    add("stack2_"+c,152,166,function(g,w,h){var R=wob(21+c);container(g,6,h-4,140,54,40,CCOL[c],R);container(g,6,h-58,140,54,40,CCOL[(c+2)%6],R)});
    add("stack3_"+c,152,220,function(g,w,h){var R=wob(31+c);container(g,6,h-4,140,54,40,CCOL[c],R);container(g,6,h-58,140,54,40,CCOL[(c+3)%6],R);container(g,6,h-112,140,54,40,CCOL[(c+1)%6],R)});
  })(c);
  /* Freight Yard: the warehouse and tin sheds, sodium-lit */
  add("warehouse",900,290,function(g,w,h){var R=wob(5);box(g,6,h-4,888,150,120,P.concrete,P.conc2,R);roof(g,6,h-4,888,150,120,P.conc2,R,"ridge");
    for(var i=0;i<4;i++)poly(g,[[60+i*215,h-4],[160+i*215,h-4],[160+i*215,h-110],[60+i*215,h-110]],shade(P.slate,-.1),3,R);
    for(i=0;i<4;i++){g.save();g.strokeStyle="rgba(43,36,32,.4)";g.lineWidth=2;for(var k=0;k<6;k++){g.beginPath();g.moveTo(62+i*215,h-100+k*16);g.lineTo(158+i*215,h-100+k*16);g.stroke()}g.restore()}
    windows(g,40,h-150,820,34,16,1,"#ffd27a",R,.7);hatch(g,6,h-154,888,150,12,.06);
    g.font="700 30px Kalam,cursive";g.fillStyle=P.ink;g.textAlign="center";g.fillText("FREIGHT 4",w/2,h-185)});
  add("shed",230,200,function(g,w,h){var R=wob(6);box(g,8,h-4,214,96,70,P.steel,shade(P.steel,.2),R);roof(g,8,h-4,214,96,70,shade(P.steel,.2),R,"ridge");
    g.save();g.strokeStyle="rgba(43,36,32,.35)";g.lineWidth=1.5;for(var i=16;i<214;i+=12){g.beginPath();g.moveTo(8+i,h-96);g.lineTo(8+i,h-6);g.stroke()}g.restore();
    poly(g,[[80,h-4],[150,h-4],[150,h-70],[80,h-70]],shade(P.rust,-.1),3,R);windows(g,20,h-90,50,24,2,1,"#ffd27a",R,.8)});
  /* Smelter Row: halls of iron and soot with furnace-lit windows; chimneys; slag vats on leg frames */
  [["hall_s",300,150],["hall_m",300,210],["hall_t",260,300],["hall_w",360,170],["smelter",1500,200]].forEach(function(s){
    add(s[0],s[1]+12,s[2]+s[1]*.0+130,function(g,w,h){var R=wob(s[1]+s[2]);box(g,6,h-4,s[1],s[2],110,P.iron,"#857a72",R);roof(g,6,h-4,s[1],s[2],110,"#857a72",R,"ridge");
      windows(g,24,h-s[2]+20,s[1]-48,s[2]*.45,Math.max(3,Math.round(s[1]/50)),s[2]>200?2:1,P.furnace,R,.7);
      hatch(g,6,h-4-s[2],s[1],s[2],10,.12);
      if(s[0]==="smelter"){g.font="700 34px Kalam,cursive";g.fillStyle=P.cream;g.textAlign="center";g.fillText("SMELTER ROW",w/2,h-30)}
      poly(g,[[6,h-4],[6+s[1],h-4],[6+s[1],h-18],[6,h-18]],P.soot,2,R)})});
  add("chimney",90,420,function(g,w,h){var R=wob(9);poly(g,[[18,h-4],[72,h-4],[66,h-380],[24,h-380]],P.rust,3,R);
    for(var i=0;i<5;i++)poly(g,[[19+i*.8,h-60-i*70],[71-i*.8,h-60-i*70],[71-i*.8,h-74-i*70],[19+i*.8,h-74-i*70]],P.soot,2,R);
    g.beginPath();g.ellipse(45,h-380,22,8,0,0,6.283);g.fillStyle=P.soot;g.fill();g.lineWidth=3;g.strokeStyle=P.ink;g.stroke();hatch(g,18,h-380,54,376,9,.12)});
  function vat(g,x,y,R){line(g,x+12,y,x+18,y-46,6);line(g,x+78,y,x+72,y-46,6);line(g,x+12,y-10,x+78,y-40,3);line(g,x+78,y-10,x+12,y-40,3);
    poly(g,[[x+4,y-46],[x+86,y-46],[x+76,y-104],[x+14,y-104]],P.iron2,3,R);
    g.beginPath();g.ellipse(x+45,y-104,31,9,0,0,6.283);g.fillStyle=P.furnace;g.fill();g.lineWidth=3;g.strokeStyle=P.ink;g.stroke();
    g.beginPath();g.ellipse(x+45,y-104,18,4,0,0,6.283);g.fillStyle="#fff1b8";g.fill()}
  add("vat",100,140,function(g,w,h){vat(g,5,h-4,wob(13))});
  /* Glass Quarter: sun-faded towers with pink neon windows */
  [["glass_s",220,200],["glass_m",240,260],["glass_t",260,330]].forEach(function(s,k){
    add(s[0],s[1]+12,s[2]+120,function(g,w,h){var R=wob(40+k);box(g,6,h-4,s[1],s[2],100,P.glass,"#d9d6cc",R);roof(g,6,h-4,s[1],s[2],100,"#d9d6cc",R);
      windows(g,14,h-s[2]+10,s[1]-28,s[2]-40,Math.round(s[1]/36),Math.round(s[2]/42),"#f6a6c8",R,.4);
      var R2=wob(90+k);for(var i=0;i<3;i++){var c=Math.round(Math.abs(R2())*2*Math.round(s[1]/36)),r=Math.round(Math.abs(R2())*2*Math.round(s[2]/42));windows(g,14+c*(s[1]-28)/Math.round(s[1]/36),h-s[2]+10+r*(s[2]-40)/Math.round(s[2]/42),(s[1]-28)/Math.round(s[1]/36),(s[2]-40)/Math.round(s[2]/42),1,1,P.pink,R2,1)}
      g.save();g.globalAlpha=.25;g.fillStyle="#fff";g.beginPath();g.moveTo(16,h-s[2]);g.lineTo(60,h-s[2]);g.lineTo(16,h-s[2]+90);g.fill();g.restore();
      poly(g,[[6,h-4],[6+s[1],h-4],[6+s[1],h-22],[6,h-22]],P.cream,2,R)})});
  add("planter",120,80,function(g,w,h){var R=wob(14);box(g,8,h-4,104,26,24,P.cream,P.concrete,R);
    for(var i=0;i<5;i++){g.beginPath();g.arc(24+i*18,h-36-(i%2)*6,12,0,6.283);g.fillStyle=P.sage;g.fill();g.lineWidth=2;g.strokeStyle=P.ink;g.stroke()}});
  add("barrier",140,70,function(g,w,h){var R=wob(15);poly(g,[[6,h-4],[134,h-4],[124,h-34],[16,h-34]],P.concrete,3,R);poly(g,[[16,h-34],[124,h-34],[118,h-46],[22,h-46]],P.cream,3,R);
    for(var i=0;i<5;i++)poly(g,[[20+i*24,h-8],[32+i*24,h-8],[42+i*24,h-30],[30+i*24,h-30]],i%2?P.coral:P.cream,0,null)});
  /* Terminus Yard: corner pylons and rim bunkers */
  add("pylon",120,380,function(g,w,h){var R=wob(16);box(g,10,h-4,100,300,50,P.conc2,P.concrete,R);
    for(var i=0;i<6;i++)poly(g,[[10,h-40-i*48],[110,h-40-i*48],[110,h-58-i*48],[10,h-58-i*48]],i%2?P.mustard:P.ink,0,null);
    g.beginPath();g.arc(60,h-330,14,0,6.283);g.fillStyle=P.coral;g.fill();g.lineWidth=3;g.strokeStyle=P.ink;g.stroke()});
  add("bunker",320,200,function(g,w,h){var R=wob(17);box(g,8,h-4,304,110,70,P.conc2,P.concrete,R);roof(g,8,h-4,304,110,70,P.concrete,R);
    poly(g,[[40,h-70],[280,h-70],[280,h-50],[40,h-50]],P.ink,2,R);hatch(g,8,h-114,304,110,10,.12);
    for(var i=0;i<8;i++)poly(g,[[8+i*38,h-4],[27+i*38,h-4],[46+i*38,h-20],[27+i*38,h-20]],i%2?P.mustard:P.ink,0,null)});
  /* steel legs that hold up landmarks; a crane leg, a gallery leg, a billboard leg */
  [["leg_crane",44,300],["leg_gal",36,190],["leg_sign",34,230]].forEach(function(s){
    add(s[0],s[1],s[2],function(g,w,h){var R=wob(s[2]);poly(g,[[w/2-8,h-4],[w/2+8,h-4],[w/2+6,h-s[2]+10],[w/2-6,h-s[2]+10]],P.steel,3,R);
      for(var y=h-20;y>20;y-=36){line(g,w/2-12,y,w/2+12,y-26,2.5);line(g,w/2+12,y,w/2-12,y-26,2.5)}
      poly(g,[[w/2-16,h-4],[w/2+16,h-4],[w/2+12,h-14],[w/2-12,h-14]],P.mustard,2,R)})});
  return list;
}

/* ---------- overhead parts of the landmarks, drawn into their own canvases (ground at the bottom edge) ---------- */
/* a truss girder seen from above and in front: a top chord, a front face with a zigzag lattice */
function truss(g,x0,y0,x1,y1,th,col,R){
  var horiz=Math.abs(x1-x0)>Math.abs(y1-y0);
  if(horiz){poly(g,[[x0,y0-12],[x1,y0-12],[x1,y0],[x0,y0]],shade(col,.3),3,R);poly(g,[[x0,y0],[x1,y0],[x1,y0+th],[x0,y0+th]],col,3,R);
    g.save();g.beginPath();g.rect(x0,y0,x1-x0,th);g.clip();for(var x=x0;x<x1;x+=th*1.2){line(g,x,y0+th,x+th*.6,y0,2.5);line(g,x+th*.6,y0,x+th*1.2,y0+th,2.5)}g.restore()}
  else{poly(g,[[x0-th/2,y0],[x0+th/2,y0],[x0+th/2,y1],[x0-th/2,y1]],col,3,R);
    g.save();g.beginPath();g.rect(x0-th/2,y0,th,y1-y0);g.clip();for(var y=y0;y<y1;y+=th*1.2){line(g,x0-th/2,y,x0+th/2,y+th*.6,2.5);line(g,x0+th/2,y+th*.6,x0-th/2,y+th*1.2,2.5)}g.restore();
    poly(g,[[x0-th/2,y1],[x0+th/2,y1],[x0+th/2,y1+12],[x0-th/2,y1+12]],shade(col,-.2),3,R)}
}
function drawCrane(g,L){
  var w=L.x1-L.x0,dep=L.y1-L.y0,z=L.z,R=wob(77),pad=20;
  /* end beams run north-south, the two long girders east-west on top of them; the trolley rides on the girders */
  truss(g,20,pad,20,pad+dep,26,P.mustard,R);truss(g,w-20,pad,w-20,pad+dep,26,P.mustard,R);
  truss(g,0,pad,w,pad,28,P.mustard,R);truss(g,0,pad+dep,w,pad+dep,28,P.mustard,R);
  var tx=L.hook.x-L.x0,hy=L.hook.y-L.y0+pad;
  truss(g,tx,pad-6,tx,pad+dep+6,22,P.coral,R);
  box(g,tx-30,hy+10,60,22,26,P.iron2,P.iron,R);
  var cy=hy+z-L.hook.z;line(g,tx-12,hy+12,tx-30,cy-54,2.5);line(g,tx+12,hy+12,tx+30,cy-54,2.5);
  container(g,tx-70,cy,140,54,40,P.teal,R);
}
function drawGallery(g,L){
  var w=L.x1-L.x0,dep=L.y1-L.y0,R=wob(78);
  poly(g,[[0,30],[w,30],[w,30+dep],[0,30+dep]],"#9a8c80",3,R);
  g.save();g.strokeStyle="rgba(43,36,32,.35)";g.lineWidth=1.5;for(var gx=8;gx<w;gx+=14){g.beginPath();g.moveTo(gx,32);g.lineTo(gx,28+dep);g.stroke()}g.restore();
  poly(g,[[0,30+dep],[w,30+dep],[w,46+dep],[0,46+dep]],P.iron2,3,R);
  for(var x=10;x<w;x+=40)line(g,x,30,x,8,2);line(g,0,8,w,8,3);
  L.vats.forEach(function(vx){var x=vx-L.x0-45,y=30+dep*.75;line(g,x+14,y,x+20,y-30,6);line(g,x+76,y,x+70,y-30,6);
    poly(g,[[x+4,y-30],[x+86,y-30],[x+76,y-86],[x+14,y-86]],P.iron2,3,R);g.beginPath();g.ellipse(x+45,y-86,31,9,0,0,6.283);g.fillStyle=P.furnace;g.fill();g.lineWidth=3;g.strokeStyle=P.ink;g.stroke()});
}
function drawSign(g,L){
  var w=L.x1-L.x0,R=wob(79),y=40;
  poly(g,[[0,y],[w,y],[w,y+150],[0,y+150]],P.ink,3,R);poly(g,[[12,y+12],[w-12,y+12],[w-12,y+138],[12,y+138]],"#3a2f3a",2,R);
  g.font="700 74px Kalam,cursive";g.textAlign="center";g.textBaseline="middle";g.lineWidth=8;g.strokeStyle="rgba(255,79,154,.35)";
  var a="kr",b="0",c=" SALVAGE",wa=g.measureText(a).width,wb=g.measureText(b).width,wc=g.measureText(c).width,sx=w/2-(wa+wb+wc)/2;g.textAlign="left";
  g.fillStyle=P.cream;g.fillText(a,sx,y+78);g.fillStyle=P.pink;g.strokeText(b,sx+wa,y+78);g.fillText(b,sx+wa,y+78);g.fillStyle=P.cream;g.fillText(c,sx+wa+wb,y+78);
  for(var i=0;i<12;i++){g.beginPath();g.arc(20+i*(w-40)/11,y+4,5,0,6.283);g.fillStyle=P.furnace;g.fill();g.lineWidth=1.5;g.strokeStyle=P.ink;g.stroke()}
}

/* ---------- the layout ---------- */
/* api: prop(kind,x,y) adds a prop and returns it; landmark(def) adds an elevated landmark held up by leg props;
   rnd() is the seeded random; free(x,y,r) says whether a small prop fits there */
function build(api){
  var Z=ZONES,S=["barrel","crates","tires","cone","canister","sign","scrappile"],cc=0;
  function cont(x,y,n){var k=(cc++)%4;return api.prop(n===3?"stack3_"+k:n===2?"stack2_"+k:"cont"+k,x,y)}
  function scatter(z,n,kinds){for(var i=0;i<n;i++){var k=kinds[i%kinds.length],x,y,t=0;
    do{x=Z[z].x0+80+api.rnd()*(Z[z].x1-Z[z].x0-160);y=170+api.rnd()*(WH-260)}while(!api.free(x,y,k)&&++t<40);if(t<40)api.prop(k,x,y)}}
  /* overpass pillars: in the deck band, up to the end of the deck */
  OP.pillarsX.forEach(function(px){if(px*XS<DECK.x1)api.prop("pillar",px*XS,DECK.pillarY)});

  /* 1. Underpass: shanty market. Alleys at both ends of the north street, the water tower plaza in the middle,
        a stall row under the deck, tenements to the south. */
  var u=Z[0].x0;
  [[200,330,"adobe"],[440,300,"shack"],[660,330,"shack"],[210,640,"shack"],[450,660,"adobe"],[680,620,"shack"],
   [1720,320,"shack"],[1960,330,"adobe"],[2200,300,"shack"],[1730,640,"adobe"],[1970,620,"shack"],[2210,650,"shack"]].forEach(function(b){api.prop(b[2],u+b[0],b[1])});
  api.prop("tower",u+1200,520).landmark="water";   /* the water tower: falls on the plaza */
  [[960,380],[1440,380],[980,720]].forEach(function(b){api.prop("stall",u+b[0],b[1])});
  [[550,980],[1150,960],[1750,980]].forEach(function(b){api.prop("stall",u+b[0],b[1])});
  [[180,1320,"adobe"],[430,1300,"shack"],[690,1330,"adobe"],[1200,1310,"adobe"],[1460,1300,"shack"],[1720,1330,"shack"],[2180,1310,"adobe"],
   [200,1680,"shack"],[460,1700,"adobe"],[720,1660,"shack"],[1000,1700,"shack"],[1280,1690,"adobe"],[1560,1700,"shack"],[1840,1680,"adobe"],[2140,1700,"shack"]].forEach(function(b){api.prop(b[2],u+b[0],b[1])});
  api.prop("stall",u+940,1480);api.prop("stall",u+1960,1500);api.prop("car",u+1050,1180);api.prop("sandbags",u+2050,1150);
  scatter(0,26,["barrel","crates","palm","cactus","tires","cone","sign","canister","palm"]);

  /* 2. Freight Yard: container yard. Warehouse and sheds on the north wall, a row of stacks with an apron in front
        and a lane behind, the loading apron under the deck, and the gantry crane over the south yard. */
  var f=Z[1].x0;
  api.prop("warehouse",f+560,320);api.prop("shed",f+1260,300);api.prop("shed",f+1580,310);
  [[160,3],[320,2],[600,3],[760,2],[1050,2],[1210,3],[1500,2],[1660,3]].forEach(function(s){cont(f+s[0],600,s[1])});
  [[550,960],[1150,975],[1650,960]].forEach(function(b){api.prop("barrier",f+b[0],b[1])});
  var cr={kind:"crane",x0:f+380,x1:f+1520,y0:1210,y1:1740,z:230,hook:{x:f+950,y:1475,z:110},legs:[]};
  [[cr.x0+20,cr.y0+40],[cr.x1-20,cr.y0+40],[cr.x0+20,cr.y1],[cr.x1-20,cr.y1]].forEach(function(p){cr.legs.push(api.prop("leg_crane",p[0],p[1]))});
  api.landmark(cr);
  [[560,1390,2],[760,1390,3],[1140,1390,3],[1340,1390,2],[560,1660,3],[780,1660,2],[1120,1660,2],[1340,1660,3]].forEach(function(s){cont(f+s[0],s[1],s[2])});
  cont(f+130,1300,1);cont(f+130,1650,1);cont(f+1700,1460,1);api.prop("shed",f+1650,1790);
  scatter(1,16,["barrel","tires","crates","cone","canister","scrappile"]);

  /* 3. Smelter Row: furnace canyons. The smelter hall fills the north wall with the slag gallery in front of it on
        three legs; chimneys and a street vat at the junction; a narrow slag run under the deck; canyon halls south. */
  var s=Z[2].x0;
  api.prop("smelter",s+900,300);
  var ga={kind:"gallery",x0:s+220,x1:s+1500,y0:440,y1:590,z:150,vats:[s+420,s+760,s+1100,s+1360],legs:[]};
  [s+250,s+860,s+1470].forEach(function(x){ga.legs.push(api.prop("leg_gal",x,600))});
  api.landmark(ga);
  api.prop("chimney",s+120,770);api.prop("chimney",s+1700,770);api.prop("vat",s+900,770);api.prop("hall_s",s+420,780);api.prop("hall_s",s+1380,790);
  [[550,960],[1150,975],[1700,960]].forEach(function(b){api.prop("barrier",s+b[0],b[1])});
  [[180,1340,"hall_s"],[560,1300,"hall_t"],[1000,1340,"hall_m"],[1430,1330,"hall_w"],[200,1740,"hall_w"],[640,1720,"hall_m"],[1450,1760,"hall_w"]].forEach(function(b){api.prop(b[2],s+b[0],b[1])});
  api.prop("chimney",s+1060,1700);api.prop("vat",s+400,1520);api.prop("vat",s+1250,1530);api.prop("vat",s+820,1520);
  scatter(2,12,["barrel","scrappile","tires","canister","crates"]);

  /* 4. Glass Quarter: financial district. Towers on the north wall around the billboard plaza, a boulevard under
        the deck where the last pillar stands, and a grid of towers to the south. */
  var q=Z[3].x0;
  [[160,330,"glass_t"],[430,320,"glass_m"],[1850,330,"glass_t"],[2110,320,"glass_m"],[2340,330,"glass_s"],[150,700,"glass_s"],[2120,700,"glass_s"]].forEach(function(b){api.prop(b[2],q+b[0],b[1])});
  var bb={kind:"sign",x0:q+900,x1:q+1500,y0:520,y1:560,z:190,legs:[]};
  [q+980,q+1420].forEach(function(x){bb.legs.push(api.prop("leg_sign",x,580))});
  api.landmark(bb);
  [[700,470],[1700,760],[1200,790],[760,780],[1640,440]].forEach(function(b){api.prop("planter",q+b[0],b[1])});
  [[550,960],[1450,975],[2200,960],[1000,970]].forEach(function(b){api.prop("barrier",q+b[0],b[1])});
  [[140,1340,"glass_m"],[460,1330,"glass_s"],[780,1350,"glass_t"],[1100,1330,"glass_s"],[1420,1350,"glass_m"],[1740,1330,"glass_s"],[2060,1350,"glass_t"],[2330,1340,"glass_s"],
   [160,1730,"glass_s"],[480,1740,"glass_t"],[800,1720,"glass_s"],[1120,1740,"glass_m"],[1440,1730,"glass_s"],[1760,1740,"glass_t"],[2080,1720,"glass_s"]].forEach(function(b){api.prop(b[2],q+b[0],b[1])});
  scatter(3,10,["cone","sign","palm","barrel","car"]);

  /* 5. Terminus Yard: the arena. No deck: open sky over a painted ring that nothing stands in. Pylons in the
        corners, bunkers mid-wall north and south, short stacks and barriers outside the ring, scrap at the rim. */
  var t=Z[4].x0,A=Z[4].arena||{x:t+1200,y:WH/2,r:600};
  [[150,260],[2250,260],[150,1820],[2250,1820]].forEach(function(b){api.prop("pylon",t+b[0],b[1])});
  api.prop("bunker",A.x,250);api.prop("bunker",A.x,1830);
  [[-680,-380],[680,-380],[-680,420],[680,420]].forEach(function(d){cont(A.x+d[0],A.y+d[1],2);api.prop("barrier",A.x+d[0]*1.25,A.y+d[1]*1.25+30)});
  [[t+110,A.y],[t+2290,A.y],[A.x-420,200],[A.x+420,1850],[A.x+420,200],[A.x-420,1850]].forEach(function(b){api.prop("scrappile",b[0],b[1])});
}

root.INK_ZONES={XS:XS,WW:WW,WH:WH,ZONES:ZONES,DECK:DECK,LOOK:LOOK,dropPoint:dropPoint,recipes:recipes,build:build,drawCrane:drawCrane,drawGallery:drawGallery,drawSign:drawSign,P:P,poly:poly,hatch:hatch,wob:wob};
})(typeof window!=="undefined"?window:this);
