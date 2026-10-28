/* Headless check of the Overpass Sector 4 map in sim.js (level design, games/metr0niks/level-design.md).
   Run: node games/metr0niks/simulations/map-check.js
   1. With every zone open, every street cell is reachable from the drop-in point.
   2. Nothing is loose at the start: a support check right after the drop-in makes no collapse.
   3. Each landmark stands while one leg does and falls once every leg is gone. */
require("./sim.js");var M=globalThis.MetroSim,W=M.W,D=M.D,H=M.H,bad=0;
function make(){var s=M.create({seed:7,level:4,builds:[M.STARTER]});s.setInput(0,{k:0,ax:15,ay:20,az:.6});return s}
function run(s,n){for(var t=0;t<n;t++)s.step()}
function kill(s,x,y,z){for(var k=0;k<8&&s.world.get(x,y,z);k++)s.hitVoxel(x,y,z,999)}
function vox(s,mat){var n=0,v=s.world.vox;for(var i=0;i<v.length;i++)if(v[i]===mat)n++;return n}
function ok(c,msg){console.log((c?"ok   ":"FAIL ")+msg);if(!c)bad++}

var s=make();run(s,30);
var walk=s.world.walk,seen=new Uint8Array(W*D),q=[15+11*W],n=0;seen[q[0]]=1;
while(q.length){var i=q.pop();n++;var x=i%W,y=(i/W)|0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){var j=(x+o[0])+(y+o[1])*W;if(walk[j]&&!seen[j]){seen[j]=1;q.push(j)}})}
var tot=0,zc=[0,0,0];for(i=0;i<W*D;i++)if(walk[i]){tot++;zc[i%W>=56?2:i%W>=32?1:0]++}
ok(n===tot,"every street cell reachable from the drop-in point ("+n+" of "+tot+"; per zone "+zc.join(" / ")+")");
kill(s,1,30,0);run(s,2);   /* a harmless break far from everything forces a support check */
ok(s.clusters.length===0,"nothing loose at the start");

function landmark(name,legs,mat,expect){
  var s=make();run(s,30);var before=vox(s,mat);
  legs.slice(0,-1).forEach(function(l){for(var z=0;z<(l[2]||1);z++)kill(s,l[0],l[1],z)});run(s,2);
  ok(s.clusters.length===0,name+" stands on its last leg");
  var l=legs[legs.length-1];for(var z=0;z<(l[2]||1);z++)kill(s,l[0],l[1],z);run(s,2);
  ok(s.clusters.length>0&&vox(s,mat)<before*expect,name+" falls when every leg is gone ("+s.clusters.length+" piece(s))");
}
var T=M.MAP.tower,C=M.MAP.crane,G=M.MAP.gallery;
landmark("water tower",T.legs.map(function(l){return [l[0],l[1],1]}),15,.5);
landmark("gantry crane",[[C.x0,C.y0,1],[C.x1,C.y0,1],[C.x0,C.y1,1],[C.x1,C.y1,1]],8,1);
landmark("slag gallery",G.legs.map(function(l){return [l[0],l[1],1]}),17,.6);
(function(){var s=make();run(s,30);var v=M.MAP.vats[0];for(var a=0;a<2;a++)for(var b=0;b<2;b++)kill(s,v[0]+a,v[1]+b,0);run(s,2);ok(s.clusters.length>0,"a street vat drops when its leg frame is shot out")})();
(function(){var s=make();run(s,30);var c=M.MAP.containers.filter(function(c){return c[5]===3})[0];for(var a=0;a<c[2];a++)for(var b=0;b<c[3];b++)for(var z=0;z<2;z++)kill(s,c[0]+a,c[1]+b,z);run(s,2);ok(s.clusters.length>0,"a 3-high container stack falls when its bottom box is shot out")})();
console.log(bad?bad+" failed":"map passes");process.exit(bad?1:0);
