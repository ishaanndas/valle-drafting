  /* ---------- word editor ---------- */
  var doc=$('#doc'),toolbar=$('#toolbar'),saveState=$('#save-state'),wcEl=$('#wc'),dirty=false;

  function exec(cmd,val){
    doc.focus();
    try{document.execCommand(cmd,false,val||null)}catch(e){}
    refreshToolbar();markDirty();
  }
  toolbar.addEventListener('mousedown',function(e){
    if(e.target.closest('.tb')&&!e.target.closest('.tb-sel'))e.preventDefault();
  });
  $$('#toolbar .tb[data-cmd]').forEach(function(b){
    b.addEventListener('click',function(){exec(b.dataset.cmd)});
  });
  $('#block-style').addEventListener('change',function(e){
    exec('formatBlock','<'+e.target.value+'>');
  });
  $('#insert-clause').addEventListener('click',function(){
    doc.focus();
    var html='<div class="clause"><h4><span class="n">7.5</span>Promotional Excerpt</h4>'+
      '<div class="sub"><span class="l" contenteditable="false">7.5</span><p>The Host may publish a single excerpt of the Capture of no more than three (3) minutes, drawn from footage designated by the Speaker and approved by the Speaker in writing prior to release, solely to promote the Event.<span class="cit" contenteditable="false" data-cit="c2">VL-REC-06</span></p></div></div>';
    try{document.execCommand('insertHTML',false,html)}catch(e){doc.insertAdjacentHTML('beforeend',html)}
    markDirty();toast('Inserted VL-REC-06 at the cursor.');
  });

  var STATE_CMDS=['bold','italic','underline','insertUnorderedList','insertOrderedList','justifyLeft','justifyFull'];
  function refreshToolbar(){
    var sel=window.getSelection();
    var inDoc=sel&&sel.rangeCount&&doc.contains(sel.getRangeAt(0).commonAncestorContainer);
    STATE_CMDS.forEach(function(c){
      var b=toolbar.querySelector('.tb[data-cmd="'+c+'"]');if(!b)return;
      var on=false;
      if(inDoc){try{on=document.queryCommandState(c)}catch(e){}}
      b.classList.toggle('on',on);
    });
    if(inDoc){
      var node=sel.getRangeAt(0).startContainer;
      var block=node.nodeType===1?node:node.parentElement;
      var tag=(block&&block.closest('h1,h2,p'))||null;
      $('#block-style').value=tag?tag.tagName.toLowerCase():'p';
    }
  }
  document.addEventListener('selectionchange',refreshToolbar);

  function countWords(){
    var t=doc.innerText.replace(/\s+/g,' ').trim();
    var n=t?t.split(' ').length:0;
    wcEl.textContent=n.toLocaleString()+' words';
  }
  function markDirty(){
    if(!dirty){dirty=true;saveState.innerHTML='<span class="dirty">Unsaved changes</span>'}
    countWords();
  }
  doc.addEventListener('input',markDirty);
  doc.addEventListener('keydown',function(e){
    var mod=e.metaKey||e.ctrlKey;
    if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();saveDoc()}
  });
  countWords();

  function saveDoc(){
    dirty=false;saveState.textContent='Saved '+nowStr();
    toast('Saved to /Valle Legal/Matters/2026-0188/Drafts as v4.');
  }
  $('#save-doc').addEventListener('click',saveDoc);

  /* export helpers */
  function cleanClone(){
    var c=doc.cloneNode(true);
    $$('.pending-bar',c).forEach(function(n){n.remove()});
    return c;
  }
  function docName(){
    return $('#doc-name').textContent.trim().replace(/[^\w\- ]+/g,'').replace(/\s+/g,'-');
  }
  function plainText(){
    var c=cleanClone();
    $$('.cit',c).forEach(function(n){n.remove()});
    return c.innerText.replace(/\n{3,}/g,'\n\n').trim();
  }
  $('#download-doc').addEventListener('click',function(){
    var name=docName()+'-v3.docx';
    saveFile(name,buildDocx(cleanClone(),$('#doc-name').textContent),'Downloaded '+name+' — opens in Word, fully editable.');
  });
  $('#copy-doc').addEventListener('click',function(){
    var c=cleanClone();
    $$('.cit',c).forEach(function(n){n.remove()});
    var html='<html><head><meta charset="utf-8"></head><body style="font-family:Georgia,serif;font-size:11pt;line-height:1.55;color:#232838">'+c.innerHTML+'</body></html>';
    var text=plainText();
    function fallback(){
      var ta=document.createElement('textarea');ta.value=text;
      ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);
      ta.select();try{document.execCommand('copy')}catch(e){}
      ta.remove();toast('Document copied as plain text.');
    }
    if(window.ClipboardItem&&navigator.clipboard&&navigator.clipboard.write){
      navigator.clipboard.write([new ClipboardItem({
        'text/html':new Blob([html],{type:'text/html'}),
        'text/plain':new Blob([text],{type:'text/plain'})
      })]).then(function(){toast('Document copied with formatting. Paste into Word.')},fallback);
    }else if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){toast('Document copied as plain text.')},fallback);
    }else{fallback()}
  });

