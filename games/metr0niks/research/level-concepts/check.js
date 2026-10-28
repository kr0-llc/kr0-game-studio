/* Checks every level concept: items inside the map and their zone, nothing overlapping a pillar, gate or another
   solid item, every street cell reachable from the drop-in point with all gates open, and roofs for the sniper.
   Run: node check.js */
var L=require("./concepts.js"),W=L.W,D=L.D,H=L.H,bad=0;
function zoneOf(x){for(var k=0;k<L.ZONES.length;k++)if(x>=L.ZONES[k].x0&&x<=L.ZONES[k].x1)return k;return -1}
L.concepts.forEach(function(c){
  var occ=new Array(W*D*H).fill(""),walk=new Uint8Array(W*D);
  function put(x,y,z,tag){var i=x+y*W+z*W*D;if(occ[i]&&tag!=="deck"){console.log(c.id,"overlap",tag,"with",occ[i],"at",x,y,z);bad++}occ[i]=tag}
  for(var x=0;x<W;x++){put(x,0,0,"edge");put(x,D-1,0,"edge")}for(var y=1;y<D-1;y++){put(0,y,0,"edge");put(W-1,y,0,"edge")}
  L.OVER.pillarsX.forEach(function(px){for(var z=0;z<L.OVER.z;z++)for(var dx=0;dx<2;dx++)for(var dy=0;dy<2;dy++)put(px+dx,15+dy,z,"pillar")});
  [32,56].forEach(function(gx){for(var y=1;y<D-1;y++)put(gx,y,0,"gateline")});
  var perch=[0,0,0],cells=[0,0,0];
  c.zones.forEach(function(z,zk){z.items.forEach(function(it){
    var k=it[0],x0=it[1],y0=it[2],w=it[3],d=it[4],h=it[5],zb=it[6];
    if(x0<1||y0<1||x0+w>W-1||y0+d>D-1||zb+h>H){console.log(c.id,z.name,"out of bounds",it.slice(0,7));bad++}
    for(var x=x0;x<x0+w;x++)if(zoneOf(x)!==zk){console.log(c.id,z.name,"leaves its zone",it.slice(0,7));bad++;break}
    if(k==="dec")return;
    for(var x=x0;x<x0+w;x++)for(var y=y0;y<y0+d;y++)for(var zz=zb;zz<zb+h;zz++){
      if(y>=L.OVER.y0&&y<=L.OVER.y1&&(zz===L.OVER.z||(zz===L.OVER.z+1&&(y===L.OVER.y0||y===L.OVER.y1)))){console.log(c.id,"hits deck",it.slice(0,7));bad++;return}
      put(x,y,zz,k)}
    if(k==="bld")perch[zk]+=2*(w+d);
  })});
  for(var y=1;y<D-1;y++)for(var x=1;x<W-1;x++){var a=occ[x+y*W],b2=occ[x+y*W+W*D];walk[x+y*W]=(!a||a==="gateline")&&(!b2)?1:0;if(walk[x+y*W])cells[zoneOf(x)]++}
  /* flood fill from the drop-in point (15.5, 11) */
  var seen=new Uint8Array(W*D),q=[15+11*W],n=0;if(!walk[q[0]]){console.log(c.id,"drop-in point blocked");bad++}
  seen[q[0]]=1;while(q.length){var i=q.pop();n++;var x=i%W,y=(i/W)|0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){var j=(x+o[0])+(y+o[1])*W;if(walk[j]&&!seen[j]){seen[j]=1;q.push(j)}})}
  var tot=cells[0]+cells[1]+cells[2];
  var lost=[];for(var i=0;i<W*D;i++)if(walk[i]&&!seen[i])lost.push([i%W,(i/W)|0]);
  if(lost.length){console.log(c.id,"unreachable cells",lost.length,JSON.stringify(lost.slice(0,12)));bad++}
  console.log(c.id,c.name,"| street cells per zone",cells.join(" / "),"| share",cells.map(function(v,k){var z=L.ZONES[k];return Math.round(100*v/((z.x1-z.x0+1)*(D-2)))+"%"}).join(" / "),"| roof edge cells (approx)",perch.join(" / "));
  c.zones.forEach(function(z,zk){if(perch[zk]<24){console.log(c.id,z.name,"few sniper roofs");bad++}});
});
console.log(bad?bad+" problems":"all concepts pass");process.exit(bad?1:0);
