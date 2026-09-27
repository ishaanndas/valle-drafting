  /* ---------- view modes, zoom, pagination, provenance ---------- */
  var docCol=$('#doc-col'),scrollEl=$('#doc-scroll'),frame=$('#zoom-frame'),layer=$('#zoom-layer');
  var PAGE_W=816,PAGE_H=1056,MARGIN=96,FOOTZONE=26;
  var mode='edit',zoomPref='fit';

  var docBody=$('#doc-body');
  var SPLIT_MIN=760;
  function syncSplit(){
    docBody.classList.toggle('narrow',mode==='sources'&&docBody.clientWidth<SPLIT_MIN);
  }
  function applyZoom(){
    syncSplit();
    var avail=Math.max(160,scrollEl.clientWidth-56);
    var s=zoomPref==='fit'?Math.max(.2,Math.min(1,avail/PAGE_W)):parseFloat(zoomPref);
    layer.style.transform='scale('+s+')';
    frame.style.width=Math.round(PAGE_W*s)+'px';
    frame.style.height=Math.round(layer.offsetHeight*s)+'px';
  }
  var zt;
  function queueZoom(){clearTimeout(zt);zt=setTimeout(applyZoom,60)}
  function zoomAfterLayout(){
    requestAnimationFrame(function(){requestAnimationFrame(applyZoom)});
    setTimeout(applyZoom,120);
  }
  $('#zoom-sel').addEventListener('change',function(e){zoomPref=e.target.value;applyZoom()});
  if(window.ResizeObserver){
    try{
      var ro=new ResizeObserver(queueZoom);
      ro.observe(scrollEl);ro.observe(docBody);
    }catch(e){}
  }
  window.addEventListener('resize',queueZoom);
  window.addEventListener('vl:panes',applyZoom);
  /* ResizeObserver does not fire in every host, and the pane can change width
     without the window doing so (splitter drag, sidebar collapse, mode switch).
     Watch the measured width directly — it costs one layout read per tick and
     only recomputes when the number actually moves. */
  var lastW=0,lastBody=0;
  setInterval(function(){
    var w=scrollEl.clientWidth,b=docBody.clientWidth;
    if(w===lastW&&b===lastBody)return;
    lastW=w;lastBody=b;applyZoom();
  },220);

  /* --- pagination for preview --- */
  function clearSheets(){$$('.page.sheetview',layer).forEach(function(n){n.remove()})}
  function newSheet(){
    var p=document.createElement('article');
    p.className='page sheetview';
    layer.appendChild(p);
    return p;
  }
  function buildPreview(){
    clearSheets();
    doc.style.display='none';
    var clone=doc.cloneNode(true);
    $$('.pending-bar',clone).forEach(function(n){n.remove()});
    $$('.cit',clone).forEach(function(n){n.remove()});
    var flat=[];
    Array.prototype.forEach.call(clone.children,function(b){
      if(b.classList.contains('pending')){
        Array.prototype.forEach.call(b.children,function(x){flat.push(x)});
      }else flat.push(b);
    });
    var limit=PAGE_H-MARGIN*2-FOOTZONE;
    var sheet=newSheet(),used=0;
    flat.forEach(function(b){
      sheet.appendChild(b);
      var cs=getComputedStyle(b);
      var h=b.offsetHeight+(parseFloat(cs.marginTop)||0)+(parseFloat(cs.marginBottom)||0);
      if(used+h>limit&&used>0){
        sheet.removeChild(b);
        sheet=newSheet();
        sheet.appendChild(b);
        used=h;
      }else used+=h;
    });
    var sheets=$$('.page.sheetview',layer);
    sheets.forEach(function(p,i){
      var n=document.createElement('div');
      n.className='pv-num';
      n.textContent='Page '+(i+1)+' of '+sheets.length;
      p.appendChild(n);
    });
    setPageCount(sheets.length);
    zoomAfterLayout();
  }
  function teardownPreview(){clearSheets();doc.style.display='';estimatePages()}
  function setPageCount(n){$('#page-count').textContent=n+(n===1?' page':' pages')}
  function estimatePages(){
    setPageCount(Math.max(1,Math.ceil(doc.offsetHeight/(PAGE_H-MARGIN*0))));
  }

  /* --- provenance --- */
  var PROV=[
    {cl:'1.7',ti:'Definition of “Capture”',srcs:['c2'],why:'Clause-bank definition, adopted verbatim.'},
    {cl:'1.8',ti:'Definition of “Internal Replay”',srcs:[],why:'Attorney-drafted for this matter. No precedent used.'},
    {cl:'6.1',ti:'Fee and expenses',srcs:['c3'],why:'Figures taken from the client rider; expense terms from the master template.'},
    {cl:'7.1',ti:'Ownership of the Capture',srcs:['c1','c2'],why:'Northwind structure, clause-bank wording.'},
    {cl:'7.2',ti:'Internal replay licence, ninety days',srcs:['c1'],why:'Northwind gave 120 days. Tightened to 90 on your instruction.'},
    {cl:'7.3',ti:'No public distribution',srcs:['c2','c3'],why:'Clause-bank covenant, extended to sponsors because the rider requires it.'},
    {cl:'7.4',ti:'Name and likeness for promotion',srcs:[],why:'Attorney-drafted. The 30-day tail is not in any precedent.'},
    {cl:'8.2',ti:'Cancellation and force majeure',srcs:['c4'],why:'Clause-bank position, adopted verbatim.'}
  ];
  function buildProv(){
    var wrap=$('#prov');
    if(wrap.childElementCount)return;
    wrap.innerHTML=PROV.map(function(p){
      var body=p.srcs.length?p.srcs.map(function(id){
        var s=SOURCES[id];
        return '<div class="prov-src"><div class="sh"><span class="badge">'+s.badge+'</span>'+
               '<span class="nm">'+s.title+'</span><span class="lc">'+s.loc+'</span></div>'+
               '<q>'+s.quote+'</q></div>';
      }).join(''):'<div class="prov-none">'+p.why+'</div>';
      var note=p.srcs.length?'<div class="prov-none" style="border:none;padding-left:13px">'+p.why+'</div>':'';
      return '<div class="prov-item" data-cl="'+p.cl+'"><div class="prov-head"><span class="cl">§ '+p.cl+
             '</span><span class="ti">'+p.ti+'</span></div>'+body+note+'</div>';
    }).join('');
    $$('.prov-item',wrap).forEach(function(it){
      it.addEventListener('click',function(){
        lite(it.dataset.cl);
        var sub=doc.querySelector('.sub[data-cl="'+it.dataset.cl+'"]');
        if(sub)sub.scrollIntoView({block:'center',behavior:'smooth'});
      });
    });
  }
  function lite(cl){
    $$('.sub[data-cl]',doc).forEach(function(s){s.classList.toggle('lit',s.dataset.cl===cl)});
    $$('.prov-item').forEach(function(p){p.classList.toggle('lit',p.dataset.cl===cl)});
  }
  doc.addEventListener('click',function(e){
    if(mode!=='sources')return;
    var sub=e.target.closest('.sub[data-cl]');if(!sub)return;
    lite(sub.dataset.cl);
    var it=$('.prov-item[data-cl="'+sub.dataset.cl+'"]');
    if(it)it.scrollIntoView({block:'nearest',behavior:'smooth'});
  });
  function markTraced(on){
    $$('.sub[data-cl]',doc).forEach(function(s){
      s.classList.toggle('traced',on);
      if(!on)s.classList.remove('lit');
    });
    if(!on)$$('.prov-item').forEach(function(p){p.classList.remove('lit')});
  }

  /* --- mode switch --- */
  function setMode(m){
    mode=m;
    $$('#modes .mode').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.mode===m))});
    docCol.classList.remove('mode-edit','mode-preview','mode-sources');
    docCol.classList.add('mode-'+m);
    doc.contentEditable=m==='edit'?'true':'false';
    $('#edit-tools').hidden=m!=='edit';
    $('#view-note').hidden=m==='edit';
    if(m==='preview'){
      $('#view-note-text').textContent='Read-only — the exported layout, page for page.';
      buildPreview();
    }else{
      teardownPreview();
    }
    if(m==='sources'){
      $('#view-note-text').textContent='Read-only — select any clause to trace it.';
      buildProv();markTraced(true);
    }else markTraced(false);
    zoomAfterLayout();
  }
  $$('#modes .mode').forEach(function(b){b.addEventListener('click',function(){setMode(b.dataset.mode)})});

  /* --- full screen --- */
  function toggleFs(force){
    var on=force==null?!app.classList.contains('fs'):force;
    app.classList.toggle('fs',on);
    $('#fullscreen').setAttribute('aria-label',on?'Exit full screen':'Full screen');
    setTimeout(function(){if(mode==='preview')buildPreview();zoomAfterLayout()},230);
  }
  $('#fullscreen').addEventListener('click',function(){toggleFs()});
  window.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&app.classList.contains('fs')){toggleFs(false);return}
    var t=e.target,editing=t&&(t.isContentEditable||t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT');
    if(editing||e.metaKey||e.ctrlKey||e.altKey)return;
    if(e.key==='f'||e.key==='F'){e.preventDefault();toggleFs()}
  });

  docCol.classList.add('mode-edit');
  doc.addEventListener('input',queueZoom);
  estimatePages();zoomAfterLayout();

  /* Deep links: ?view=clauses&mode=sources&rail=closed&chat=440&fs=1
     Lets a section be linked to directly, and drives screenshot capture. */
  (function deepLink(){
    var q=new URLSearchParams(location.search);
    var v=q.get('view');
    if(v&&$('#view-'+v))show(v);
    var c=parseInt(q.get('chat'),10);
    if(c)$('#view-draft').style.setProperty('--chat-w',c+'px');
    if(q.get('rail')==='closed')setCollapsed(true);
    var m=q.get('mode');
    if(m&&['edit','preview','sources'].indexOf(m)>-1)setMode(m);
    if(q.get('fs')==='1')toggleFs(true);
    zoomAfterLayout();
  })();
