const Drawing={
  tool:'cross', drawings:[], temp:null, seriesList:[], previewSeries:null,
  init(chart,candleSeries,getBars){
    this.chart=chart; this.candleSeries=candleSeries; this.getBars=getBars; this.load();
    this.chart.subscribeClick((param)=>{
      if(this.tool==='cross') return; if(!param || !param.time) return;
      let price=null;
      if(param.seriesData){ let data=param.seriesData.get(this.candleSeries); if(data) price=data.close ?? data.value; if(!price){ for(let v of param.seriesData.values()){ if(v && (v.close||v.value)){ price=v.close||v.value; break; } } } }
      if(!price && param.point){ try{ price=this.candleSeries.coordinateToPrice(param.point.y); }catch(e){} }
      if(!price) return;
      let time=param.time; if(typeof time==='string') time=Math.floor(new Date(time).getTime()/1000);
      let pt={time, price, x:param.point?param.point.x:0, y:param.point?param.point.y:0};
      this.handleClick(pt);
    });
    this.chart.subscribeCrosshairMove((param)=>{
      if(this.tool==='cross' || !this.temp || !param || !param.time) return;
      let price=null; if(param.seriesData){ let data=param.seriesData.get(this.candleSeries); if(data) price=data.close ?? data.value; }
      if(!price && param.point){ try{ price=this.candleSeries.coordinateToPrice(param.point.y); }catch(e){} }
      if(!price) return; let time=param.time; if(typeof time==='string') time=Math.floor(new Date(time).getTime()/1000);
      this.updatePreview({time, price});
    });
    this.render();
  },
  setTool(t){
    if(t==='clear'){ this.clearAll(); return; }
    this.tool=t; this.temp=null; this.clearPreview();
    document.querySelectorAll('.tool').forEach(b=>b.classList.remove('active'));
    let btn=document.querySelector(`[data-tool="${t}"]`); if(btn) btn.classList.add('active');
    let hintEl=document.getElementById('drawingHint'); let chartEl=document.getElementById('chart');
    if(t==='cross'){ hintEl.textContent='Cross - Geser Chart'; chartEl.classList.remove('drawing-mode'); this.chart.applyOptions({handleScroll:true, handleScale:true}); }
    else { hintEl.textContent = t==='trendline'?'📐 Trendline - KLIK 1x titik 1, KLIK lagi titik 2' : t==='hline'?'➖ Horizontal - KLIK 1x di harga' : t==='fibo'?'〰️ Fibo - KLIK 1x atas, KLIK lagi bawah' : t==='rect'?'⬜ Box - KLIK 1x pojok 1, KLIK lagi pojok 2' : t==='text'?'T Text - KLIK 1x buat tulis' : t; chartEl.classList.add('drawing-mode'); this.chart.applyOptions({handleScroll:false, handleScale:false}); document.getElementById('drawingPreview').textContent='Mode Gambar AKTIF - klik di chart!'; }
    if(window.App) App.log('✏️ Tool: '+t);
  },
  handleClick(pt){
    if(this.tool==='hline'){ this.drawings.push({id:Date.now(), tool:'hline', p1:pt, p2:pt, price:pt.price}); this.render(); this.save(); this.renderList(); if(window.App) App.log('✏️ H-Line ditambah di '+pt.price.toFixed(2)); return; }
    if(this.tool==='text'){ let txt=prompt('Tulis catatan di chart:', 'BUY di sini!'); if(txt){ this.drawings.push({id:Date.now(), tool:'text', p1:pt, text:txt}); this.render(); this.save(); this.renderList(); if(window.App) App.log('✏️ Text: '+txt); } return; }
    if(!this.temp){ this.temp={tool:this.tool, p1:pt}; document.getElementById('drawingPreview').textContent='Titik 1: '+pt.price.toFixed(2)+' ✅ - Sekarang KLIK lagi buat titik 2'; if(window.App) App.log('📍 Titik 1: '+pt.price.toFixed(2)+' - klik lagi buat titik 2'); }
    else { let d={id:Date.now(), tool:this.temp.tool, p1:this.temp.p1, p2:pt}; this.drawings.push(d); this.temp=null; this.clearPreview(); document.getElementById('drawingPreview').textContent='✅ Gambar ditambah! Klik lagi buat gambar baru, atau klik ✛ buat selesai'; this.render(); this.save(); this.renderList(); if(window.App) App.log('✏️ Gambar: '+d.tool+' • Total: '+this.drawings.length); }
  },
  updatePreview(pt){ if(!this.temp) return; if(this.previewSeries){ try{this.chart.removeSeries(this.previewSeries)}catch(e){} } if(this.temp.tool==='trendline'){ let s=this.chart.addLineSeries({color:'#f0b90b',lineWidth:1,lineStyle:2,title:'Preview',priceLineVisible:false,lastValueVisible:false}); s.setData([{time:this.temp.p1.time,value:this.temp.p1.price},{time:pt.time,value:pt.price}]); this.previewSeries=s; } },
  clearPreview(){ if(this.previewSeries){ try{this.chart.removeSeries(this.previewSeries)}catch(e){} this.previewSeries=null; } },
  render(){
    if(this.seriesList) this.seriesList.forEach(s=>{ try{this.chart.removeSeries(s)}catch(e){} });
    this.seriesList=[]; let bars=this.getBars ? this.getBars() : [];
    this.drawings.forEach(d=>{
      if(d.tool==='text') return; if(!d.p1 || !d.p2) return;
      if(d.tool==='trendline'){ let s=this.chart.addLineSeries({color:'#f0b90b',lineWidth:2,title:'Trendline',priceLineVisible:false,lastValueVisible:false}); s.setData([{time:d.p1.time,value:d.p1.price},{time:d.p2.time,value:d.p2.price}]); this.seriesList.push(s); }
      else if(d.tool==='hline'){ let s=this.chart.addLineSeries({color:'#2962ff',lineWidth:1,lineStyle:2,title:'H '+d.p1.price.toFixed(2),priceLineVisible:false,lastValueVisible:false}); if(!bars.length) return; s.setData([{time:bars[0].time,value:d.p1.price},{time:bars[bars.length-1].time,value:d.p1.price}]); this.seriesList.push(s); }
      else if(d.tool==='fibo'){ let hi=Math.max(d.p1.price,d.p2.price), lo=Math.min(d.p1.price,d.p2.price), diff=hi-lo; let levels=[0,0.236,0.382,0.5,0.618,0.786,1]; let colors=['#ef5350','#ff6d00','#f0b90b','#26a69a','#2962ff','#7e57c2','#ef5350']; if(!bars.length) return; levels.forEach((lv,idx)=>{ let price=hi-diff*lv; let s=this.chart.addLineSeries({color:colors[idx],lineWidth:1,lineStyle: idx===3?0:2, title:'Fibo '+(lv*100).toFixed(1)+'% • '+price.toFixed(2), priceLineVisible:false,lastValueVisible:false}); s.setData([{time:bars[0].time,value:price},{time:bars[bars.length-1].time,value:price}]); this.seriesList.push(s); }); }
      else if(d.tool==='rect'){ let top=Math.max(d.p1.price,d.p2.price), bot=Math.min(d.p1.price,d.p2.price); [top,bot].forEach(price=>{ let s=this.chart.addLineSeries({color:'#26a69a',lineWidth:2,title:'Box',priceLineVisible:false,lastValueVisible:false}); s.setData([{time:d.p1.time,value:price},{time:d.p2.time,value:price}]); this.seriesList.push(s); }); }
    });
    let textDrawings=this.drawings.filter(d=>d.tool==='text');
    if(textDrawings.length){ this.textMarkers=textDrawings.map(d=>({time:d.p1.time, position:'aboveBar', color:'#f0b90b', shape:'circle', text:d.text})); } else { this.textMarkers=[]; }
    let el=document.getElementById('drawingCount'); if(el) el.textContent=this.drawings.length+' gambar';
    this.renderList(); if(window.App) App.updateMarkers();
  },
  renderList(){ let el=document.getElementById('drawingList'); if(!el) return; if(!this.drawings.length){ el.innerHTML='<div style="font-size:12px;color:#787b86;padding:8px">Belum ada gambar. Klik 📐 di kiri, terus klik 2x di chart.</div>'; return; } el.innerHTML=this.drawings.map(d=>{ let label=d.tool==='trendline'?'📐 Trendline':d.tool==='hline'?'➖ H-Line '+d.p1.price.toFixed(2):d.tool==='fibo'?'〰️ Fibo':d.tool==='rect'?'⬜ Box':d.tool==='text'?'T '+d.text:'Gambar'; return `<div class="pine-item"><span>${label}</span><button onclick="Drawing.removeOne(${d.id})">🗑️</button></div>`; }).join(''); },
  removeOne(id){ this.drawings=this.drawings.filter(d=>d.id!==id); this.render(); this.save(); },
  clearAll(){ this.drawings=[]; this.temp=null; this.clearPreview(); this.render(); this.save(); if(window.App) App.log('🗑️ Semua gambar dihapus'); },
  removeLast(){ this.drawings.pop(); this.render(); this.save(); },
  save(){ try{ if(window.App) localStorage.setItem('tv_drawings_'+App.symbol+'_'+App.interval, JSON.stringify(this.drawings)); }catch(e){} },
  load(){ try{ if(window.App){ let s=localStorage.getItem('tv_drawings_'+App.symbol+'_'+App.interval); if(s) this.drawings=JSON.parse(s); } }catch(e){ this.drawings=[]; } }
};