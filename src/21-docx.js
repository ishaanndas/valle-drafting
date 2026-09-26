  /* ---------- .docx writer (OOXML, stored zip) ---------- */
  var CRC=(function(){var t=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
  function crc32(u8){var c=0xFFFFFFFF;for(var i=0;i<u8.length;i++)c=CRC[(c^u8[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
  function zipStore(files){
    var enc=new TextEncoder(),parts=[],central=[],offset=0;
    files.forEach(function(f){
      var data=typeof f.data==='string'?enc.encode(f.data):f.data,name=enc.encode(f.name),crc=crc32(data);
      var lh=new Uint8Array(30+name.length),dv=new DataView(lh.buffer);
      dv.setUint32(0,0x04034b50,true);dv.setUint16(4,20,true);dv.setUint32(14,crc,true);
      dv.setUint32(18,data.length,true);dv.setUint32(22,data.length,true);dv.setUint16(26,name.length,true);
      lh.set(name,30);parts.push(lh,data);
      var ch=new Uint8Array(46+name.length),cv=new DataView(ch.buffer);
      cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);
      cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);
      cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);ch.set(name,46);
      central.push(ch);offset+=lh.length+data.length;
    });
    var cdSize=central.reduce(function(a,b){return a+b.length},0);
    var eocd=new Uint8Array(22),ev=new DataView(eocd.buffer);
    ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);
    ev.setUint32(12,cdSize,true);ev.setUint32(16,offset,true);
    return new Blob(parts.concat(central,[eocd]),{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function R(text,f){
    if(text==='')return'';
    f=f||{};var p='<w:rPr>';
    if(f.font)p+='<w:rFonts w:ascii="'+f.font+'" w:hAnsi="'+f.font+'"/>';
    if(f.b)p+='<w:b/>';if(f.i)p+='<w:i/>';if(f.u)p+='<w:u w:val="single"/>';if(f.caps)p+='<w:caps/>';
    if(f.color)p+='<w:color w:val="'+f.color+'"/>';
    if(f.sz)p+='<w:sz w:val="'+f.sz+'"/><w:szCs w:val="'+f.sz+'"/>';
    if(f.spacing)p+='<w:spacing w:val="'+f.spacing+'"/>';
    p+='</w:rPr>';
    return '<w:r>'+p+'<w:t xml:space="preserve">'+esc(text)+'</w:t></w:r>';
  }
  function P(runs,o){
    o=o||{};var p='<w:pPr>';
    if(o.align)p+='<w:jc w:val="'+o.align+'"/>';
    if(o.indent)p+='<w:ind w:left="'+o.indent+'"'+(o.hanging?' w:hanging="'+o.hanging+'"':'')+'/>';
    p+='<w:spacing w:before="'+(o.before||0)+'" w:after="'+(o.after==null?140:o.after)+'" w:line="'+(o.line||288)+'" w:lineRule="auto"/>';
    if(o.border)p+='<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="CCCCCC"/></w:pBdr>';
    p+='</w:pPr>';
    return '<w:p>'+p+(runs||'')+'</w:p>';
  }
  function inlineRuns(node,inh){
    var out='';
    Array.prototype.forEach.call(node.childNodes,function(n){
      if(n.nodeType===3){out+=R(n.nodeValue.replace(/\s+/g,' '),inh)}
      else if(n.nodeType===1){
        if(n.classList&&n.classList.contains('cit'))return;
        var f={};for(var k in inh)f[k]=inh[k];
        var t=n.tagName;
        if(t==='B'||t==='STRONG')f.b=true;
        if(t==='I'||t==='EM')f.i=true;
        if(t==='U')f.u=true;
        out+=inlineRuns(n,f);
      }
    });
    return out;
  }
  function blocksXml(el){
    var out='';
    Array.prototype.forEach.call(el.children,function(n){
      var c=n.classList,t=n.tagName;
      if(c.contains('pending-bar'))return;
      if(c.contains('rule')){out+=P('',{border:true,after:220});return}
      if(c.contains('privilege')){out+=P(R(n.textContent,{sz:15,caps:true,spacing:26,color:'8A8A8A',font:'Arial'}),{after:420});return}
      if(c.contains('subtitle')){out+=P(R(n.textContent.replace(/\s+/g,' ').trim(),{sz:18,color:'7A7A7A',font:'Arial'}),{align:'center',after:120});return}
      if(t==='H1'){out+=P(inlineRuns(n,{sz:30}),{align:'center',before:160,after:120});return}
      if(t==='H2'){out+=P(inlineRuns(n,{sz:26,b:true}),{before:280,after:120});return}
      if(t==='H4'){
        var num=n.querySelector('.n'),cl=n.cloneNode(true),cn=cl.querySelector('.n');
        if(cn)cn.remove();
        out+=P(R((num?num.textContent.trim()+'   ':'')+cl.textContent.trim().toUpperCase(),
                 {b:true,sz:17,spacing:22,font:'Arial',color:'555555'}),{before:280,after:140});
        return;
      }
      if(c.contains('sub')){
        var l=n.querySelector('.l'),p=n.querySelector('p');
        out+=P(R(l?l.textContent.trim()+'   ':'',{color:'999999',sz:19})+(p?inlineRuns(p,{}):''),
               {indent:709,hanging:709,after:170,align:'both'});
        return;
      }
      if(t==='P'){out+=P(inlineRuns(n,{}),{after:170,align:'both'});return}
      if(t==='UL'||t==='OL'){
        Array.prototype.forEach.call(n.children,function(li,i){
          out+=P(R(t==='UL'?'•  ':(i+1)+'.  ',{})+inlineRuns(li,{}),{indent:454,hanging:227,after:90});
        });
        return;
      }
      if(c.contains('sig')){
        Array.prototype.forEach.call(n.children,function(d){
          var w=d.querySelector('.who-l');
          out+=P(R('______________________________________',{color:'9A9A9A'}),{before:420,after:60});
          out+=P(R(w?w.textContent:'',{sz:17,color:'7A7A7A',font:'Arial'}),{after:260});
        });
        return;
      }
      if(n.children.length){out+=blocksXml(n)}
      else if(n.textContent.trim()){out+=P(inlineRuns(n,{}),{after:170})}
    });
    return out;
  }
  function buildDocx(root,title){
    var body=blocksXml(root)+
      '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>'+
      '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720"/></w:sectPr>';
    var X='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    return zipStore([
      {name:'[Content_Types].xml',data:X+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
        '<Default Extension="xml" ContentType="application/xml"/>'+
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'+
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'+
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'},
      {name:'_rels/.rels',data:X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'+
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'},
      {name:'docProps/core.xml',data:X+'<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '+
        'xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>'+esc(title)+'</dc:title>'+
        '<dc:creator>Valle Legal Drafting Desk</dc:creator></cp:coreProperties>'},
      {name:'word/_rels/document.xml.rels',data:X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
      {name:'word/styles.xml',data:X+'<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
        '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/>'+
        '<w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="232838"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>'},
      {name:'word/document.xml',data:X+'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'</w:body></w:document>'}
    ]);
  }

  function saveFile(filename,blob,okMsg){
    var fallback=function(){
      try{
        var url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
        setTimeout(function(){URL.revokeObjectURL(url)},1500);
        toast(okMsg);
      }catch(e){toast('Could not save the file here. Use Copy and paste into Word.')}
    };
    var use=window.claude&&window.claude.use;
    if(!use)return fallback();
    Promise.resolve(window.claude.use('downloads')).then(function(dl){
      if(!dl)return fallback();
      dl.save({filename:filename,data:blob}).then(function(){toast(okMsg)},function(err){
        if(err&&err.code==='declined')return;
        fallback();
      });
    },fallback);
  }

