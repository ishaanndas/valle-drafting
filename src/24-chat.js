  /* ---------- chat ---------- */
  var thread=$('#thread'),input=$('#input'),sendBtn=$('#send');
  var SPARK='<span class="spark"><svg viewBox="0 0 24 24"><path d="M12 2.5 13.8 9a4 4 0 0 0 2.7 2.7l6.5 1.8-6.5 1.8a4 4 0 0 0-2.7 2.7L12 24.5 10.2 18a4 4 0 0 0-2.7-2.7L1 13.5l6.5-1.8A4 4 0 0 0 10.2 9Z" transform="translate(0 -1) scale(.95) translate(.6 .6)"/></svg></span>';
  var ARROW='<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  var SQUARE='<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>';

  var REPLIES={
    opt1:{think:'Read VL-REC-06 and the two agreements where it survived negotiation · 3 passages',
      srcs:[['Clause','Promotional excerpt licence — three minutes, speaker approval','VL-REC-06'],
            ['Dropbox','Meridian Learning — Course Licensing Agreement','§ 4.2']],
      blocks:['Added *§ 7.5* and the two definitions it depends on. The excerpt is drawn from footage Rebecca designates, not footage the host picks, and approval is required before first publication rather than after.',
              'Two knock-on edits worth your eye: § 1.7 now excludes the approved excerpt from the Capture restrictions, and § 7.3 carries an express carve-out so the two clauses do not contradict each other.'],
      note:'Inserted § 7.5 and amended § 1.7 and § 7.3, pending your review.'},
    compare:{think:'Compared § 7 against five executed speaker agreements from the last eighteen months',
      srcs:[['Dropbox','Northwind Summit 2025, Keppler Bureau 2024, and three others','5 documents']],
      blocks:['Your § 7 is *tighter than four of the five*. Replay runs 90 days where the firm norm is 120, and you have added a deletion certificate none of the others carry.',
              'One thing the others have that this draft does not: an *attendee recording* clause. Four of the five put an express no-recording obligation on the host for attendee devices. Northwind § 8.4 is the cleanest version. Want it as § 7.6?'],
      note:null},
    risk:{think:'Read the host form agreement uploaded 22 Sep · 6 passages from 2 sources',
      srcs:[['Upload','Cascade Health Summit — Host form agreement','§ 11, § 14'],
            ['Clause','Sponsor adjacency — named exclusions','VL-SPN-03']],
      blocks:['Three places their counsel will push, in the order I would expect them.',
              '*Ninety days.* Their form says twelve months of on-demand access. Expect a counter at six. The deletion certificate is the part worth holding.',
              '*Sole discretion in § 7.3.* Standard ask is to soften this to consent not unreasonably withheld. Our position memo says hold it for likeness, trade it for text quotes.',
              '*Sponsor adjacency.* Their § 14 grants sponsors promotional use of “session content”, which reads onto the Capture. This draft has no Schedule B. That gap is the real one.'],
      note:null},
    generic:{think:'Searched 1,482 documents · 3 passages from 2 sources',
      srcs:[['Dropbox','Master template — Speaking Engagement Agreement v9','/Templates/Active'],
            ['Clio','Whitfield — Standard Engagement Rider 2026','¶ 6']],
      blocks:['Working from the v9 master template and Rebecca’s standing rider. I have drafted this against the firm’s preferred position rather than the host’s form, and flagged where the two diverge.',
              'Tell me which section to place it in and I will insert it with the definition updates it needs.'],
      note:'Draft ready — tell me where to place it.'}
  };

  function el(h){var d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild}
  function time(){var d=new Date();return d.getHours()+':'+String(d.getMinutes()).padStart(2,'0')}
  function atBottom(){return thread.scrollHeight-thread.scrollTop-thread.clientHeight<90}
  function follow(stick){if(stick)thread.scrollTop=thread.scrollHeight}
  function fmt(t){
    var s=t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    var open=(s.match(/\*/g)||[]).length%2===1;
    if(open)s=s.replace(/\*([^*]*)$/,'$1');
    return s.replace(/\*([^*]+)\*/g,'<b>$1</b>');
  }

  var run=null;
  function setSending(on){
    sendBtn.disabled=on?false:!input.value.trim();
    sendBtn.classList.toggle('stop',on);
    sendBtn.innerHTML=on?SQUARE:ARROW;
    sendBtn.setAttribute('aria-label',on?'Stop':'Send');
  }

  function reply(key){
    var r=REPLIES[key]||REPLIES.generic;
    var turn=el('<div class="turn ai"><div class="ai-head">'+SPARK+'Drafting assistant</div>'+
                '<div class="bubble"><div class="think live"><span class="tick">✦</span><span class="shimmer">Searching the knowledge base…</span></div></div></div>');
    thread.appendChild(turn);thread.scrollTop=thread.scrollHeight;
    var bubble=turn.querySelector('.bubble');
    var job={cancelled:false};run=job;setSending(true);

    setTimeout(function(){
      if(job.cancelled)return finish(job,turn);
      var ss=r.srcs.map(function(s){
        return '<button class="src"><span class="badge">'+s[0]+'</span><span class="t">'+s[1]+'</span><span class="loc">'+s[2]+'</span></button>';
      }).join('');
      bubble.innerHTML='<details class="think"><summary><span class="tick">✦</span> '+r.think+
        ' <span class="chev">›</span></summary><div class="think-body"><div class="src-list">'+ss+'</div></div></details>';
      follow(true);
      streamBlocks(job,turn,bubble,r,0);
    },950);
  }

  function streamBlocks(job,turn,bubble,r,idx){
    if(job.cancelled)return finish(job,turn);
    if(idx>=r.blocks.length){
      if(r.note){
        bubble.appendChild(el('<div class="inserted-note"><span>'+r.note+'</span></div>'));
        follow(atBottom());
      }
      if(r.note&&job.key==='opt1'){}
      return finish(job,turn);
    }
    var words=r.blocks[idx].split(' '),i=0;
    var p=document.createElement('p');bubble.appendChild(p);
    (function tick(){
      if(job.cancelled)return finish(job,turn);
      var stick=atBottom();
      i=Math.min(words.length,i+(1+Math.floor(Math.random()*2)));
      var done=i>=words.length;
      p.innerHTML=fmt(words.slice(0,i).join(' '))+(done?'':'<span class="caret"></span>');
      follow(stick);
      if(done)return setTimeout(function(){streamBlocks(job,turn,bubble,r,idx+1)},140);
      setTimeout(tick,26+Math.random()*34);
    })();
  }

  function finish(job,turn){
    job.cancelled=true;
    if(run===job)run=null;
    var c=turn.querySelector('.caret');if(c)c.remove();
    var live=turn.querySelector('.think.live');if(live)live.remove();
    if(!turn.querySelector('.turn-acts')){
      turn.appendChild(el('<div class="turn-acts"><button data-toast="Response copied.">Copy</button><button data-toast="Re-running against the same sources.">Retry</button></div>'));
    }
    setSending(false);
  }

  function send(text,key){
    if(run){run.cancelled=true;return}
    if(!text.trim())return;
    thread.appendChild(el('<div class="turn user"><div class="bubble">'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</div></div>'));
    input.value='';autosize();thread.scrollTop=thread.scrollHeight;
    if(key==='opt1'){
      $('#doc-status').textContent='2 insertions awaiting review';
      pending.classList.remove('settled');
    }
    reply(key);
  }

  function autosize(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,180)+'px'}
  input.addEventListener('input',function(){autosize();if(!run)sendBtn.disabled=!input.value.trim()});
  input.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input.value,'generic')}
  });
  sendBtn.addEventListener('click',function(){
    if(run){run.cancelled=true;return}
    send(input.value,'generic');
  });
  $$('#suggests .sug').forEach(function(b){
    b.addEventListener('click',function(){if(run)return;send(b.textContent,b.dataset.q)});
  });
  autosize();
})();
</script>
