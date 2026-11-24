'use strict';
// A local-only illustrative simulation: no camera feeds, biometric processing or network requests.
const ZONES=[
 {name:'Entrance',x:125,y:300,r:65},
 {name:'Bathroom Booths A',x:300,y:145,r:70},
 {name:'Bathroom Booths B',x:495,y:145,r:70},
 {name:'Tile Display Walls',x:300,y:440,r:70},
 {name:'Sample Library',x:505,y:440,r:70},
 {name:'Vanity Islands',x:685,y:280,r:75},
 {name:'Curved Display Rings',x:860,y:190,r:70},
 {name:'Rotunda',x:905,y:425,r:80}
];
const LINKS=[[0,1],[0,3],[1,2],[1,5],[2,5],[3,4],[4,5],[5,6],[5,7],[6,7]];
const $=id=>document.getElementById(id), canvas=$('plan'),ctx=canvas.getContext('2d');
let people=[],events=[],totals=[],visitors=0,exits=0,totalExitDwell=0,nextId=1,elapsed=0,running=true,last=performance.now(),spawnWait=0;
function rand(a,b){return a+Math.random()*(b-a)}
function reset(){people=[];events=[];totals=ZONES.map(()=>({visits:0,dwell:0}));visitors=0;exits=0;totalExitDwell=0;nextId=1;elapsed=0;spawnWait=0;log('Simulation initialized');renderStats();renderZones();renderEvents()}
function log(message){events.unshift({time:Math.floor(elapsed),message});events=events.slice(0,80);renderEvents()}
function renderEvents(){$('events').innerHTML=events.slice(0,18).map(e=>`<div class="event"><span>${escapeHtml(e.message)}</span><time>${formatTime(e.time)}</time></div>`).join('')}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function formatTime(s){return `${Math.floor(s/60)}m ${Math.floor(s%60)}s`}
function spawn(){const id=nextId++;visitors++;totals[0].visits++;people.push({id,zone:0,x:ZONES[0].x+rand(-20,20),y:ZONES[0].y+rand(-20,20),age:0,wait:rand(3,8),visited:new Set([0]),moving:false,target:0});log(`Visitor #${id} entered showroom`)}
function nextZone(p){if(p.visited.size>=rand(3,7)&&Math.random()<.4)return -1;const options=LINKS.filter(([a,b])=>a===p.zone||b===p.zone).map(([a,b])=>a===p.zone?b:a);const unseen=options.filter(i=>!p.visited.has(i));return (unseen.length?unseen:options)[Math.floor(Math.random()*(unseen.length||options.length))]}
function step(dt){elapsed+=dt;spawnWait-=dt;if(spawnWait<=0&&people.length<25){spawn();spawnWait=rand(2.2,5.8)}for(const p of [...people]){p.age+=dt;if(p.moving){const dest=ZONES[p.target],dx=dest.x-p.x,dy=dest.y-p.y,d=Math.hypot(dx,dy),speed=90*dt;if(d<=speed){p.x=dest.x;p.y=dest.y;p.zone=p.target;p.moving=false;p.wait=rand(4,14);if(!p.visited.has(p.zone)){p.visited.add(p.zone);totals[p.zone].visits++}log(`Visitor #${p.id} reached ${dest.name}`)}else{p.x+=dx/d*speed;p.y+=dy/d*speed}}else{totals[p.zone].dwell+=dt;p.wait-=dt;if(p.wait<=0){const n=nextZone(p);if(n<0||p.age>140){people.splice(people.indexOf(p),1);exits++;totalExitDwell+=p.age;log(`Visitor #${p.id} exited after ${formatTime(p.age)}`)}else{p.target=n;p.moving=true}}}}renderStats();renderZones()}
function renderStats(){$('visitors').textContent=visitors;$('exits').textContent=exits;$('active').textContent=people.length;$('dwell').textContent=exits?formatTime(totalExitDwell/exits):'0s'}
function renderZones(){const max=Math.max(1,...totals.map(t=>t.dwell));$('zones').innerHTML=ZONES.map((z,i)=>`<div class="zone"><div class="zone-head"><span>${i+1}. ${z.name}</span><span>${totals[i].visits} visits · ${formatTime(totals[i].dwell)}</span></div><div class="bar"><div class="bar-fill" style="width:${Math.round(totals[i].dwell/max*100)}%"></div></div></div>`).join('')}
function draw(){ctx.clearRect(0,0,1100,600);ctx.fillStyle='#0b1728';ctx.fillRect(0,0,1100,600);ctx.strokeStyle='#284058';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(65,90);ctx.lineTo(670,90);ctx.lineTo(750,65);ctx.arc(790,300,245,-Math.PI/2,Math.PI/2);ctx.lineTo(670,535);ctx.lineTo(65,535);ctx.closePath();ctx.stroke();ctx.setLineDash([7,8]);ctx.lineWidth=2;ctx.strokeStyle='#2a3e56';for(const [a,b] of LINKS){ctx.beginPath();ctx.moveTo(ZONES[a].x,ZONES[a].y);ctx.lineTo(ZONES[b].x,ZONES[b].y);ctx.stroke()}ctx.setLineDash([]);
ZONES.forEach((z,i)=>{if($('heatmap').checked){const intensity=totals[i].dwell/Math.max(1,...totals.map(t=>t.dwell));const g=ctx.createRadialGradient(z.x,z.y,8,z.x,z.y,110);g.addColorStop(0,`rgba(239,107,121,${.09+.43*intensity})`);g.addColorStop(1,'rgba(239,107,121,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(z.x,z.y,110,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#172c40';ctx.strokeStyle='#42657a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#d4e4f3';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText(z.name,z.x,z.y+5);ctx.fillStyle='#69d5c2';ctx.beginPath();ctx.arc(z.x+z.r*.65,z.y-z.r*.7,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#09212a';ctx.font='bold 10px system-ui';ctx.fillText(String(i+1),z.x+z.r*.65,z.y-z.r*.7+3)});
people.forEach(p=>{ctx.fillStyle='#f8c76b';ctx.beginPath();ctx.arc(p.x,p.y,6,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff4d5';ctx.lineWidth=1;ctx.stroke()});ctx.fillStyle='#8da7c0';ctx.font='13px system-ui';ctx.textAlign='left';ctx.fillText('ENTRANCE →',75,550);requestAnimationFrame(draw)}
$('toggle').addEventListener('click',()=>{running=!running;$('toggle').textContent=running?'Pause':'Resume';$('status').textContent=running?'● Simulation running':'Ⅱ Simulation paused'});$('reset').addEventListener('click',reset);
$('export').addEventListener('click',()=>{const rows=[['zone','visits','dwell_seconds'],...ZONES.map((z,i)=>[z.name,totals[i].visits,totals[i].dwell.toFixed(1)])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='showroom-zone-analytics.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
function loop(now){const dt=Math.min((now-last)/1000,.08);last=now;if(running)step(dt*Number($('speed').value));requestAnimationFrame(loop)}reset();draw();requestAnimationFrame(loop);
