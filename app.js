const PROMPT_DATA=window.PROMPT_DATA||[];
let PROMPTS=[];
let currentPrompt=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

const rowDefs=[
  {title:'Start here · all guided tools', ids:['structure','incorporation','first-year','annual-roc','corporate-change','compliance-reset','special-entities']},
  {title:'Planning to start a business', ids:['structure','incorporation']},
  {title:'Newly incorporated', ids:['first-year','incorporation','annual-roc']},
  {title:'Running an existing entity', ids:['annual-roc','corporate-change','compliance-reset']},
  {title:'Special situations', ids:['special-entities','compliance-reset','corporate-change']}
];

function escapeHtml(s=''){return s.replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function card(p){return `<article class="prompt-card" data-id="${p.id}" data-stage="${escapeHtml(p.stage)}" tabindex="0" role="button" aria-label="Open ${escapeHtml(p.name)}">
  <div class="poster-art" style="background:${p.gradient}"><span class="num">MORROW / ${p.num}</span><div><div class="word">${escapeHtml(p.poster_word)}</div><div class="strap">${escapeHtml(p.strap)}</div></div></div>
  <div class="card-fade"></div><div class="card-info"><span class="stage">${escapeHtml(p.stage)}</span><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.subtitle)}</p></div></article>`}

function render(filter='all',q=''){
  const rows=$('#rows'); rows.innerHTML='';
  const query=q.trim().toLowerCase();
  let matchCount=0;
  rowDefs.forEach(rd=>{
    let items=rd.ids.map(id=>PROMPTS.find(p=>p.id===id)).filter(Boolean);
    items=items.filter(p => (filter==='all' || p.stage===filter) && (!query || [p.name,p.subtitle,p.best,p.out,p.stage,p.prompt].join(' ').toLowerCase().includes(query)));
    if(!items.length)return;
    matchCount+=items.length;
    const sec=document.createElement('section'); sec.className='row'; sec.innerHTML=`<h3 class="row-title">${rd.title}</h3><div class="rail-wrap"><div class="rail">${items.map(card).join('')}</div></div>`; rows.appendChild(sec);
  });
  $('#searchEmpty').hidden=matchCount>0;
  bindCards();
}

function bindCards(){
  $$('.prompt-card').forEach(el=>{
    el.addEventListener('click',()=>openPrompt(el.dataset.id));
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPrompt(el.dataset.id)}});
  });
}
function openPrompt(id){
  const p=PROMPTS.find(x=>x.id===id); if(!p)return; currentPrompt=p;
  $('#modalPoster').style.background=p.gradient; $('#modalNum').textContent=p.num; $('#modalWord').textContent=p.poster_word;
  $('#modalStage').textContent=p.stage; $('#modalTitle').textContent=p.name; $('#modalSubtitle').textContent=p.subtitle; $('#modalBest').textContent=p.best; $('#modalOut').textContent=p.out; $('#modalPrompt').textContent=p.prompt;
  $('#promptWrap').hidden=true; $('#togglePromptBtn').textContent='Read full prompt';
  const m=$('#promptModal'); m.classList.add('open'); m.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
}
function closePrompt(){const m=$('#promptModal');m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.style.overflow='';}
async function copyCurrent(btn){if(!currentPrompt)return; try{await navigator.clipboard.writeText(currentPrompt.prompt);showToast('Prompt copied'); const old=btn.textContent;btn.textContent='✓ Copied';setTimeout(()=>btn.textContent=old,1300)}catch(e){const ta=document.createElement('textarea');ta.value=currentPrompt.prompt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast('Prompt copied');}}
function showToast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.classList.remove('show'),1600)}

const routerQuestions=[
 {q:'Where are you in the entity lifecycle?',opts:[['Planning a new business','planning'],['About to incorporate','incorp'],['Just incorporated / first year','new'],['Existing company or LLP','existing'],['Something may be pending or wrong','reset'],['Considering Section 8 / Producer Company','special']]},
 {q:'What do you most need clarity on?',depends:true}
];
let routerStage=null;
function openRouter(){routerStage=null; const m=$('#routerModal');m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';showRouterStage();}
function closeRouter(){const m=$('#routerModal');m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.style.overflow='';}
function showRouterStage(){
  $('#routerTitle').textContent='Where are you in the entity lifecycle?';
  const opts=routerQuestions[0].opts;
  $('#routerBody').innerHTML=`<div class="router-options">${opts.map(o=>`<button class="router-option" data-stage-choice="${o[1]}"><b>${o[0]}</b><span>Choose this if it best describes today.</span></button>`).join('')}</div>`;
  $$('[data-stage-choice]').forEach(b=>b.onclick=()=>{routerStage=b.dataset.stageChoice;showRouterNeed()});
}
function showRouterNeed(){
  $('#routerTitle').textContent='What do you most need clarity on?';
  const map={
    planning:[['Which structure fits?','structure'],['What should be ready before incorporation?','incorporation']],
    incorp:[['Check incorporation readiness','incorporation'],['Compare the structure before filing','structure']],
    new:[['Build the first 12-month roadmap','first-year'],['Prepare for annual ROC work','annual-roc']],
    existing:[['Annual ROC readiness','annual-roc'],['A director/share/capital/office change','corporate-change'],['I suspect historical gaps','compliance-reset']],
    reset:[['Diagnose old gaps / missed filings','compliance-reset'],['Plan a specific corporate change','corporate-change']],
    special:[['Section 8 / Producer Company fit','special-entities'],['Recheck the underlying structure','structure']]
  };
  const opts=map[routerStage]||map.existing;
  $('#routerBody').innerHTML=`<div class="router-options">${opts.map(o=>`<button class="router-option" data-prompt-choice="${o[1]}"><b>${o[0]}</b><span>Route me to the matching guided diagnostic.</span></button>`).join('')}</div><button class="filter" id="routerBack" style="margin-top:16px">← Back</button>`;
  $$('[data-prompt-choice]').forEach(b=>b.onclick=()=>showRouterResult(b.dataset.promptChoice)); $('#routerBack').onclick=showRouterStage;
}
function showRouterResult(id){const p=PROMPTS.find(x=>x.id===id);$('#routerTitle').textContent='Recommended tool';$('#routerBody').innerHTML=`<div class="router-result"><span class="kicker">${escapeHtml(p.stage)}</span><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.subtitle)}</p><button class="btn btn-primary" id="openRecommended">Open this prompt</button></div>`;$('#openRecommended').onclick=()=>{closeRouter();openPrompt(id)}}

document.addEventListener('DOMContentLoaded',async()=>{
  PROMPTS=PROMPT_DATA;
  render();
  $$('[data-open]').forEach(b=>b.addEventListener('click',()=>openPrompt(b.dataset.open)));
  $$('[data-close]').forEach(x=>x.addEventListener('click',closePrompt));
  $$('[data-router-close]').forEach(x=>x.addEventListener('click',closeRouter));
  $('#copyPromptBtn').onclick=e=>copyCurrent(e.currentTarget); $('#copyPromptBtn2').onclick=e=>copyCurrent(e.currentTarget);
  $('#togglePromptBtn').onclick=()=>{const w=$('#promptWrap');w.hidden=!w.hidden;$('#togglePromptBtn').textContent=w.hidden?'Read full prompt':'Hide full prompt';if(!w.hidden)w.scrollIntoView({behavior:'smooth',block:'nearest'})};
  $('#startHereBtn').onclick=openRouter; $('#startHereBtn2').onclick=openRouter;
  $('#searchInput').addEventListener('input',e=>{const f=$('.filter.active')?.dataset.filter||'all';render(f,e.target.value)});
  $$('.filter[data-filter]').forEach(b=>b.onclick=()=>{$$('.filter[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.filter,$('#searchInput').value)});
  window.addEventListener('scroll',()=>$('.site-header').classList.toggle('scrolled',scrollY>20));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePrompt();closeRouter()}});
});
