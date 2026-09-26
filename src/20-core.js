<script>
(function(){
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var store={
    get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},
    set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  };

  /* ---------- views ---------- */
  function show(v){
    $$('.view').forEach(function(s){s.classList.toggle('active',s.id==='view-'+v)});
    $$('.nav-item').forEach(function(b){
      if(b.dataset.view===v){b.setAttribute('aria-current','page')}else{b.removeAttribute('aria-current')}
    });
  }
  $$('.nav-item').forEach(function(b){b.addEventListener('click',function(){show(b.dataset.view)})});
  $$('[data-view-jump]').forEach(function(b){b.addEventListener('click',function(){show(b.dataset.viewJump)})});
  $$('[data-open="current"]').forEach(function(b){
    b.addEventListener('click',function(){show('draft');toast('Loaded Cascade Health Summit v3 into the editor.')});
  });

  /* ---------- sidebar collapse ---------- */
  var app=$('#app');
  function setCollapsed(on){
    app.classList.toggle('collapsed',on);
    store.set('vl-rail',on?'1':'0');
    setTimeout(function(){window.dispatchEvent(new Event('vl:panes'))},220);
  }
  $('#collapse').addEventListener('click',function(){setCollapsed(true)});
  $('#reopen').addEventListener('click',function(){setCollapsed(false)});
  if(store.get('vl-rail')==='1')setCollapsed(true);

  /* ---------- theme ---------- */
  var MOON='<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"/></svg>';
  var SUN='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';
  function currentTheme(){
    var a=document.documentElement.getAttribute('data-theme');
    if(a)return a;
    return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  }
  function paintThemeBtn(){
    var dark=currentTheme()==='dark';
    $('#theme-icon').innerHTML=dark?SUN:MOON;
    $('#theme-label').textContent=dark?'Light mode':'Dark mode';
    $('#theme-toggle').setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
  }
  $('#theme-toggle').addEventListener('click',function(){
    var next=currentTheme()==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',next);
    store.set('vl-theme',next);paintThemeBtn();
  });
  var saved=store.get('vl-theme');
  if(saved)document.documentElement.setAttribute('data-theme',saved);
  paintThemeBtn();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){
    if(!document.documentElement.getAttribute('data-theme'))paintThemeBtn();
  });

  /* ---------- toast ---------- */
  var toastEl=$('#toast'),tt;
  function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){toastEl.classList.remove('show')},2600)}
  document.addEventListener('click',function(e){var b=e.target.closest('[data-toast]');if(b)toast(b.dataset.toast)});

  /* ---------- pane resize ---------- */
  var draft=$('#view-draft'),splitter=$('#splitter'),threadCol=$('.thread-col');
  var savedW=parseInt(store.get('vl-chat-w'),10);
  if(savedW)draft.style.setProperty('--chat-w',savedW+'px');
  function clampW(px){
    var total=draft.clientWidth;
    return Math.max(330,Math.min(px,Math.max(420,total-420)));
  }
  function startDrag(startX,startW){
    var w=startW;
    splitter.classList.add('drag');document.body.classList.add('resizing');
    function move(e){
      w=clampW(startW+((e.touches?e.touches[0].clientX:e.clientX)-startX));
      draft.style.setProperty('--chat-w',w+'px');
      window.dispatchEvent(new Event('vl:panes'));
    }
    function up(){
      splitter.classList.remove('drag');document.body.classList.remove('resizing');
      store.set('vl-chat-w',String(w));
      window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);
      window.removeEventListener('touchmove',move);window.removeEventListener('touchend',up);
    }
    window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);
    window.addEventListener('touchmove',move,{passive:true});window.addEventListener('touchend',up);
  }
  splitter.addEventListener('mousedown',function(e){e.preventDefault();startDrag(e.clientX,threadCol.offsetWidth)});
  splitter.addEventListener('touchstart',function(e){startDrag(e.touches[0].clientX,threadCol.offsetWidth)},{passive:true});
  splitter.addEventListener('dblclick',function(){draft.style.setProperty('--chat-w','440px');store.set('vl-chat-w','440')});
  splitter.addEventListener('keydown',function(e){
    var step=e.shiftKey?60:20,w=threadCol.offsetWidth;
    if(e.key==='ArrowLeft'){w=clampW(w-step)}else if(e.key==='ArrowRight'){w=clampW(w+step)}else{return}
    e.preventDefault();draft.style.setProperty('--chat-w',w+'px');store.set('vl-chat-w',String(w));
  });

  /* ---------- citations ---------- */
  var SOURCES={
    c1:{badge:'SharePoint',title:'Northwind Summit — Speaking Agreement (executed)',loc:'§ 8.1–8.4',
        path:'/sites/VL-Practice/Precedents/Speaker Agreements/2025',meta:'Matter 2025-0642 · executed 3 Nov 2025 · indexed 12 Sep',
        quote:'All right, title and interest in any recording of the Presentation shall vest in the Speaker. The Host shall be granted access for internal replay for a period of one hundred twenty (120) days…'},
    c2:{badge:'Clause bank',title:'Recording and likeness — speaker-retained, replay carve-out',loc:'VL-REC-04',
        path:'Firm clause bank · preferred position',meta:'Approved M. Valle, 4 Mar 2026 · used in 31 agreements',
        quote:'All right, title, and interest in the Capture vests in the Speaker upon creation. The Host acquires no ownership interest in the Capture and shall make no derivative work from it except as expressly permitted.'},
    c3:{badge:'Clio',title:'Whitfield — Standard Engagement Rider 2026',loc:'¶ 6',
        path:'Clio · Documents · Whitfield Speaks LLC',meta:'Matter 2026-0188 · client paper · indexed 14 Sep',
        quote:'No portion of any recording may be posted publicly, shared with sponsors, or used in promotion of any future event without my written approval in each instance.'},
    c4:{badge:'Clause bank',title:'Force majeure — speaker illness, substitute date',loc:'VL-FM-02',
        path:'Firm clause bank · preferred position',meta:'Approved D. Okafor, 11 Jan 2026 · used in 57 agreements',
        quote:'If the Speaker cancels due to illness, injury, or a death in the immediate family, the Speaker shall use reasonable efforts to propose a mutually acceptable substitute date within twelve (12) months and no further liability attaches.'}
  };
  var pop=$('#pop');
  function closePop(){pop.classList.remove('open')}
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-cit]');
    if(!t){if(!e.target.closest('#pop'))closePop();return}
    var s=SOURCES[t.dataset.cit];if(!s)return;
    pop.innerHTML='<div class="r"><span class="mono">'+s.badge+' · '+s.loc+'</span></div>'+
      '<h5>'+s.title+'</h5><div class="q">'+s.quote+'</div>'+
      '<div class="r">'+s.path+'</div><div class="r">'+s.meta+'</div>'+
      '<div class="acts"><button class="link" data-toast="Opening the source in its system of record.">Open source</button>'+
      '<button class="link quiet" data-toast="Passage pinned to this drafting session.">Pin to session</button></div>';
    pop.classList.add('open');
    var r=t.getBoundingClientRect();
    pop.style.top=Math.max(12,Math.min(r.bottom+8,window.innerHeight-pop.offsetHeight-12))+'px';
    pop.style.left=Math.min(Math.max(12,r.left-150),window.innerWidth-pop.offsetWidth-12)+'px';
    e.stopPropagation();
  });
  window.addEventListener('keydown',function(e){if(e.key==='Escape')closePop()});
  window.addEventListener('resize',closePop);

  /* ---------- pending insertion ---------- */
  var pending=$('#pending');
  $('#accept-ins').addEventListener('click',function(){
    pending.classList.add('settled');
    $('#doc-status').textContent='all insertions reviewed';
    toast('§ 7 accepted. Version 4 saved to SharePoint.');
  });
  $('#revise-ins').addEventListener('click',function(){
    var i=$('#input');i.value='Revise § 7 — ';i.focus();i.setSelectionRange(i.value.length,i.value.length);
  });

  /* ---------- table filtering ---------- */
  function wireTable(filterId,searchId,bodyId){
    var rows=$$('#'+bodyId+' tr'),f='all',q='';
    function apply(){
      rows.forEach(function(r){
        var okF=f==='all'||r.dataset.f===f;
        var okQ=!q||r.textContent.toLowerCase().indexOf(q)>-1;
        r.hidden=!(okF&&okQ);
      });
    }
    $$('#'+filterId+' .filt').forEach(function(b){
      b.addEventListener('click',function(){
        $$('#'+filterId+' .filt').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
        f=b.dataset.f;apply();
      });
    });
    $('#'+searchId).addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();apply()});
  }
  wireTable('kb-filters','kb-search','kb-body');
  wireTable('doc-filters','doc-search','doc-body');

  /* ---------- sync ---------- */
  function nowStr(){var d=new Date();return d.getHours()+':'+String(d.getMinutes()).padStart(2,'0')}
  $$('[data-sync]').forEach(function(b){
    b.addEventListener('click',function(){
      var k=b.dataset.sync,t=nowStr(),old=b.textContent;
      b.textContent='Syncing…';
      setTimeout(function(){
        b.textContent=old;
        $('#'+k+'-foot').textContent='Last sync '+t;
        toast(k==='sp'?'SharePoint delta crawl complete. Two items re-embedded.':'Clio sync complete. 42 matters, no conflicts.');
      },900);
    });
  });

