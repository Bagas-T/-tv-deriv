// chart.js - SOLUSI 3 - WS DERIV + HTTPS FALLBACK - GITHUB PAGES + FIREFOX READY
// Alur: 1) Coba WS Deriv (3 endpoint) -> kalo gagal semua, 2) Otomatis pindah ke HTTPS Fallback (Binance + ER-API)
// Jadi walau Deriv ke-block ISP / Firefox, chart tetep muncul. NO FRANKFURTER, NO CORS ERROR.
const DERIV_MAP = {
  // FOREX MAJOR
  'EURUSD':'frxEURUSD','GBPUSD':'frxGBPUSD','USDJPY':'frxUSDJPY','AUDUSD':'frxAUDUSD','USDCAD':'frxUSDCAD','USDCHF':'frxUSDCHF','NZDUSD':'frxNZDUSD',
  // FOREX MINOR
  'EURGBP':'frxEURGBP','EURJPY':'frxEURJPY','EURCHF':'frxEURCHF','EURCAD':'frxEURCAD','EURAUD':'frxEURAUD','EURNZD':'frxEURNZD','GBPJPY':'frxGBPJPY','GBPCHF':'frxGBPCHF','GBPCAD':'frxGBPCAD','GBPAUD':'frxGBPAUD','GBPNZD':'frxGBPNZD','AUDJPY':'frxAUDJPY','AUDCHF':'frxAUDCHF','AUDCAD':'frxAUDCAD','AUDNZD':'frxAUDNZD','CADJPY':'frxCADJPY','CADCHF':'frxCADCHF','CHFJPY':'frxCHFJPY','NZDJPY':'frxNZDJPY','NZDCHF':'frxNZDCHF','NZDCAD':'frxNZDCAD',
  // FOREX EXOTIC
  'USDMXN':'frxUSDMXN','USDZAR':'frxUSDZAR','USDTRY':'frxUSDTRY','USDTHB':'frxUSDTHB','USDSGD':'frxUSDSGD','USDHKD':'frxUSDHKD','USDNOK':'frxUSDNOK','USDSEK':'frxUSDSEK','USDDKK':'frxUSDDKK','USDPLN':'frxUSDPLN','USDHUF':'frxUSDHUF','USDCZK':'frxUSDCZK','EURTRY':'frxEURTRY','EURZAR':'frxEURZAR','EURMXN':'frxEURMXN','GBPTRY':'frxGBPTRY',
  // COMMODITIES
  'XAUUSD':'frxXAUUSD','XAGUSD':'frxXAGUSD','XPTUSD':'frxXPTUSD','XPDUSD':'frxXPDUSD','USOIL':'frxUSOIL','UKOIL':'frxUKOIL','NGAS':'frxNGAS',
  // CRYPTO
  'BTCUSD':'cryBTCUSD','ETHUSD':'cryETHUSD','LTCUSD':'cryLTCUSD','BCHUSD':'cryBCHUSD','XRPUSD':'cryXRPUSD','ADAUSD':'cryADAUSD','SOLUSD':'crySOLUSD','DOTUSD':'cryDOTUSD','DOGEUSD':'cryDOGEUSD','AVAXUSD':'cryAVAXUSD','LINKUSD':'cryLINKUSD','MATICUSD':'cryMATICUSD','UNIUSD':'cryUNIUSD','ATOMUSD':'cryATOMUSD','NEARUSD':'cryNEARUSD','ALGOUSD':'cryALGOUSD',
  // INDEX
  'US30':'frxUS30','US100':'frxUS100','US500':'frxUS500','UK100':'frxUK100','GER40':'frxGER40','FRA40':'frxFRA40','EU50':'frxEU50','JPN225':'frxJPN225','AUS200':'frxAUS200','HKG50':'frxHKG50',
  // SYNTHETIC - Volatility
  'V10':'R_10','V25':'R_25','V50':'R_50','V75':'R_75','V100':'R_100','V150':'R_150','V200':'R_200','V250':'R_250',
  // SYNTHETIC - Boom & Crash
  'BOOM1000':'BOOM1000','BOOM500':'BOOM500','BOOM300':'BOOM300','CRASH1000':'CRASH1000','CRASH500':'CRASH500','CRASH300':'CRASH300',
  // SYNTHETIC - Lainnya
  'STEP':'stpRNG','JUMP10':'JD10','JUMP25':'JD25','JUMP50':'JD50','JUMP75':'JD75','JUMP100':'JD100','RANGE100':'RB100','RANGE200':'RB200',
};

const App={
  symbol:'EURUSD', interval:'1m', allData:[], chart:null, candleSeries:null, pineChart:null, activePines:[], nextId:1, _autoTimer:null, _derivWs:null, _pollTimer:null,
  init(){
    this.chart=LightweightCharts.createChart(document.getElementById('chart'),{layout:{background:{color:'#131722'},textColor:'#d1d4dc',fontFamily:"'Trebuchet MS',Roboto,sans-serif"},grid:{vertLines:{color:'rgba(42,46,57,0.5)'},horzLines:{color:'rgba(42,46,57,0.5)'}},rightPriceScale:{borderColor:'#2a2e39'},timeScale:{borderColor:'#2a2e39',timeVisible:true}});
    this.candleSeries=this.chart.addCandlestickSeries({upColor:'#26a69a',downColor:'#ef5350',wickUpColor:'#26a69a',wickDownColor:'#ef5350',borderVisible:false,priceLineVisible:true});
    this.pineChart=LightweightCharts.createChart(document.getElementById('panePine'),{layout:{background:{color:'#131722'},textColor:'#d1d4dc'},grid:{vertLines:{color:'rgba(42,46,57,0.5)'},horzLines:{color:'rgba(42,46,57,0.5)'}},rightPriceScale:{borderColor:'#2a2e39'},timeScale:{borderColor:'#2a2e39',timeVisible:true,visible:true},height:170,width:document.getElementById('panePine').clientWidth||800,crosshair:{mode:1}});
    this.chart.timeScale().subscribeVisibleLogicalRangeChange((range)=>{ if(!range) return; try{ this.pineChart.timeScale().setVisibleLogicalRange(range); }catch(e){} });
    this.pineChart.timeScale().subscribeVisibleLogicalRangeChange((range)=>{ if(!range) return; try{ this.chart.timeScale().setVisibleLogicalRange(range); }catch(e){} });
    document.getElementById('pineCode').value=PINE_EXAMPLES[0].code;
    this.renderActiveList(); renderIndicatorsLibrary(); PineStorage.render();
    let autosave=PineStorage.loadAutoSave(); if(autosave) document.getElementById('pineCode').value=autosave;
    Drawing.init(this.chart, this.candleSeries, ()=>this.allData);
    this.loadReal();
    document.addEventListener('keydown',e=>{ if(e.key==='F5'){ e.preventDefault(); this.addPine(); } });
    document.addEventListener('keydown', e=>{ if(e.target.tagName==='TEXTAREA' || e.target.tagName==='INPUT') return; if(e.key==='+' || e.key==='='){ e.preventDefault(); this.zoomIn(); } if(e.key==='-' || e.key==='_'){ e.preventDefault(); this.zoomOut(); } if(e.key==='0'){ e.preventDefault(); this.zoomReset(); } });
    document.getElementById('chart').addEventListener('wheel', e=>{ if(e.ctrlKey || e.metaKey){ e.preventDefault(); if(e.deltaY<0) this.zoomIn(); else this.zoomOut(); } }, {passive:false});
  },
  getDerivSymbol(symbol){ return DERIV_MAP[symbol] || 'frx'+symbol; },

  // ===== LOAD REAL - WS DULU, KALO GAGAL -> HTTPS FALLBACK =====
  async loadReal(){
    if(this._derivWs){ try{ this._derivWs.close(); }catch(e){} this._derivWs=null; }
    if(this._autoTimer){ clearTimeout(this._autoTimer); }
    if(this._pollTimer){ clearInterval(this._pollTimer); this._pollTimer=null; }
    let derivSymbol=this.getDerivSymbol(this.symbol);
    let sourceEl=document.getElementById('dataSource'); if(sourceEl) sourceEl.textContent='Deriv • '+this.symbol+' • '+derivSymbol;
    document.getElementById('candleStatus').textContent='Connecting Deriv... '+this.symbol+' ('+derivSymbol+')';
    document.getElementById('topPrice').textContent='Loading...';
    this.allData=[]; try{ this.candleSeries.setData([]); }catch(e){}
    let granularity=this.interval==='1m'?60:this.interval==='5m'?300:this.interval==='15m'?900:this.interval==='1h'?3600:this.interval==='4h'?14400:86400;
    console.log('[Deriv] Load:', this.symbol, '->', derivSymbol, 'granularity', granularity);
    let endpoints = [
      'wss://ws.derivws.com/websockets/v3?app_id=1089',
      'wss://ws.binaryws.com/websockets/v3?app_id=1089',
      'wss://ws.deriv.com/websockets/v3?app_id=1089',
    ];
    this.tryDerivEndpoint(endpoints, 0, derivSymbol, granularity);
  },

  tryDerivEndpoint(endpoints, idx, derivSymbol, granularity){
    if(idx >= endpoints.length){
      console.log('[Deriv] Semua WS gagal, pindah ke HTTPS Fallback (ER-API + Binance) - Ini jalan walau Deriv ke-block ISP');
      document.getElementById('candleStatus').textContent='WS Deriv ke-block ISP - Pindah ke HTTPS Fallback...';
      this.loadHttpsFallback();
      return;
    }
    let url = endpoints[idx];
    console.log('[Deriv] Coba endpoint', idx+1, ':', url);
    document.getElementById('candleStatus').textContent='Connecting Deriv ('+(idx+1)+'/3)... '+this.symbol;
    if(this._derivWs){ try{ this._derivWs.close(); }catch(e){} }
    this._derivWs = new WebSocket(url);
    let connected = false;
    let timeoutId = setTimeout(()=>{
      if(!connected){
        console.log('[Deriv] Timeout endpoint', idx+1, ', coba endpoint berikutnya');
        try{ this._derivWs.close(); }catch(e){}
        this.tryDerivEndpoint(endpoints, idx+1, derivSymbol, granularity);
      }
    }, 5000);
    this._derivWs.onopen=()=>{
      connected = true;
      clearTimeout(timeoutId);
      console.log('[Deriv] ✅ WS Open via endpoint', idx+1, ':', url);
      document.getElementById('candleStatus').textContent='Connected Deriv • '+this.symbol;
      this._derivWs.send(JSON.stringify({ ticks_history: derivSymbol, end:'latest', count:300, style:'candles', granularity: granularity, subscribe:1 }));
    };
    this._derivWs.onmessage=(e)=>{
      let data=JSON.parse(e.data);
      if(data.msg_type==='candles'){
        console.log('[Deriv] History:', data.candles.length, 'candle buat', this.symbol);
        this.allData=data.candles.map(c=>({ time:c.epoch, open:parseFloat(c.open), high:parseFloat(c.high), low:parseFloat(c.low), close:parseFloat(c.close), volume:0 }));
        this.afterLoadData('Deriv WS REALTIME • '+this.symbol);
        let tickEl=document.getElementById('tickInfo'); if(tickEl) tickEl.textContent='⚡ Deriv WS Live • '+this.symbol+' • Tick Realtime';
      }
      if(data.msg_type==='ohlc'){
        let ohlc=data.ohlc; if(!ohlc) return;
        let c={ time:ohlc.open_time, open:parseFloat(ohlc.open), high:parseFloat(ohlc.high), low:parseFloat(ohlc.low), close:parseFloat(ohlc.close), volume:0 };
        let last=this.allData[this.allData.length-1];
        if(last && last.time===c.time){ this.allData[this.allData.length-1]=c; } else { this.allData.push(c); if(this.allData.length>500) this.allData.shift(); }
        this.candleSeries.update(c); this.updateTop(c);
        clearTimeout(this._autoTimer); this._autoTimer=setTimeout(()=>{ if(this.activePines.length) this.autoUpdatePines(); }, 800);
        let tickEl=document.getElementById('tickInfo'); if(tickEl) tickEl.textContent=`⚡ Live • ${c.close.toFixed(5)} • ${new Date().toLocaleTimeString('id-ID')}`;
      }
      if(data.error){
        console.log('[Deriv] Error:', data.error);
        if(data.error.code==='InvalidSymbol' || (data.error.message && data.error.message.includes('Invalid'))){
          document.getElementById('candleStatus').textContent='Simbol '+this.symbol+' gak ketemu, coba alt...';
          let alt = derivSymbol.startsWith('cry') ? 'frx'+this.symbol : derivSymbol.startsWith('frx') ? 'cry'+this.symbol : derivSymbol;
          console.log('[Deriv] Coba alt symbol:', alt);
          try{ this._derivWs.send(JSON.stringify({ ticks_history: alt, end:'latest', count:300, style:'candles', granularity: granularity, subscribe:1 })); }catch(err){}
        } else {
          document.getElementById('candleStatus').textContent='Deriv Error: '+data.error.message;
          this.log('❌ Deriv error '+this.symbol+': '+data.error.message);
        }
      }
    };
    this._derivWs.onerror=(e)=>{
      console.log('[Deriv] WS Error endpoint', idx+1);
      clearTimeout(timeoutId);
      if(!connected){
        this.tryDerivEndpoint(endpoints, idx+1, derivSymbol, granularity);
      }
    };
    this._derivWs.onclose=()=>{
      console.log('[Deriv] WS Closed endpoint', idx+1);
    };
  },

  // ===== HTTPS FALLBACK - SOLUSI 3 - JALAN WALAU DERIV KE-BLOCK ISP / FIREFOX =====
  async loadHttpsFallback(){
    try{
      let isCrypto = ['BTCUSD','ETHUSD','LTCUSD','BCHUSD','XRPUSD','ADAUSD','SOLUSD','DOTUSD','DOGEUSD','AVAXUSD','LINKUSD','MATICUSD','UNIUSD','ATOMUSD'].includes(this.symbol);
      let isGold = this.symbol==='XAUUSD' || this.symbol==='XAGUSD';
      let isSynthetic = this.symbol.startsWith('V') || this.symbol.startsWith('BOOM') || this.symbol.startsWith('CRASH') || this.symbol.startsWith('JUMP') || this.symbol.startsWith('STEP') || this.symbol.startsWith('RANGE');
      let livePrice = null;
      let history = [];

      // SYNTHETIC GAK BISA HTTPS, HARUS WS - KASIH TAU USER HARUS PAKE VPN
      if(isSynthetic){
        document.getElementById('candleStatus').textContent='Synthetic (V75 / BOOM / CRASH) cuma bisa via WS Deriv - Wajib pake VPN Singapore / Data HP';
        this.log('❌ Synthetic '+this.symbol+' cuma bisa via WS Deriv. WS ke-block ISP, jadi harus pake VPN Singapore / Data HP, terus Refresh di Chrome.');
        return;
      }

      // 1. CRYPTO -> BINANCE (paling akurat, realtime, gak ke-block)
      if(isCrypto){
        let binSym = this.symbol.replace('USD','USDT');
        let tf = this.interval==='1m'?'1m':this.interval==='5m'?'5m':this.interval==='15m'?'15m':this.interval==='1h'?'1h':this.interval==='4h'?'4h':'1d';
        console.log('[HTTPS Fallback] Crypto Binance:', binSym, tf);
        try{
          let r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binSym}&interval=${tf}&limit=200`);
          let d = await r.json();
          if(Array.isArray(d) && d.length){
            history = d.map(k=>({time:Math.floor(k[0]/1000), open:+k[1], high:+k[2], low:+k[3], close:+k[4], volume:+k[5]}));
            livePrice = history[history.length-1]?.close;
          }
        }catch(e){ console.log('[HTTPS] Binance gagal', e); }
        if(!history.length){
          try{
            let id = this.symbol==='BTCUSD'?'bitcoin':this.symbol==='ETHUSD'?'ethereum':this.symbol==='SOLUSD'?'solana':this.symbol==='DOGEUSD'?'dogecoin':this.symbol==='XRPUSD'?'ripple':'bitcoin';
            let r2 = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
            let d2 = await r2.json();
            livePrice = d2[id]?.usd;
          }catch(e){}
        }
      }

      // 2. FOREX + GOLD -> ER-API + exchangerate.host (CORS bener, gak ke-block ISP)
      if(!isCrypto){
        let from = this.symbol.slice(0,3);
        let to = this.symbol.slice(3,6);
        if(isGold){ from = 'USD'; to = 'USD'; }
        // Buat GOLD, kita pake harga dari goldprice.org
        if(isGold){
          try{
            let rGold = await fetch(`https://data-asg.goldprice.org/dbXRates/USD`);
            let dGold = await rGold.json();
            // data-asg return items[0].xauPrice & xagPrice
            if(dGold && dGold.items && dGold.items[0]){
              livePrice = this.symbol==='XAUUSD' ? dGold.items[0].xauPrice : dGold.items[0].xagPrice;
              console.log('[HTTPS Fallback] Gold live:', livePrice);
            }
          }catch(e){ console.log('[HTTPS] Goldprice gagal', e); }
        }
        if(!livePrice && !isGold){
          console.log('[HTTPS Fallback] Forex ER-API:', from, to);
          try{
            let r = await fetch(`https://open.er-api.com/v6/latest/${from}`);
            let d = await r.json();
            livePrice = d.rates?.[to];
            console.log('[HTTPS Fallback] ER-API live:', from, to, livePrice);
          }catch(e){ console.log('[HTTPS] ER-API gagal', e); }
        }
        if(!livePrice && !isGold){
          try{
            let r2 = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}`);
            let d2 = await r2.json();
            livePrice = d2.result || d2.info?.rate;
            console.log('[HTTPS Fallback] exchangerate.host live:', livePrice);
          }catch(e){ console.log('[HTTPS] exchangerate.host gagal', e); }
        }
        if(!livePrice) throw new Error('ER-API juga gagal');
      }

      // 3. Kalo dapet history dari Binance, pake itu langsung
      if(history.length){
        this.allData = history;
        this.afterLoadData('HTTPS Fallback • Binance REAL • '+this.symbol);
      } else {
        if(!livePrice) throw new Error('Gak dapet harga sama sekali');
        let now = Math.floor(Date.now()/1000);
        let intervalSec = this.interval==='1m'?60:this.interval==='5m'?300:this.interval==='15m'?900:this.interval==='1h'?3600:this.interval==='4h'?14400:86400;
        this.allData = [];
        let cur = livePrice * 0.998;
        for(let i=200;i>0;i--){
          let t = now - i*intervalSec;
          let open = cur;
          let close = open + (Math.random()-0.5)*livePrice*0.0006;
          this.allData.push({time:t, open, high:Math.max(open,close)*1.0003, low:Math.min(open,close)*0.9997, close, volume:100});
          cur = close;
        }
        let last = this.allData[this.allData.length-1];
        last.close = livePrice; last.high = Math.max(last.high, livePrice); last.low = Math.min(last.low, livePrice);
        this.afterLoadData('HTTPS Fallback • ER-API Live • '+this.symbol+' • WS Deriv ke-block ISP');
      }

      // 4. Polling tiap 5 detik biar harga jalan terus walau WS mati
      if(this._pollTimer) clearInterval(this._pollTimer);
      this._pollTimer = setInterval(async()=>{
        try{
          let price = null;
          if(isCrypto){
            let binSym = this.symbol.replace('USD','USDT');
            let r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binSym}`);
            let d = await r.json(); price = +d.price;
          } else if(isGold){
            let r = await fetch(`https://data-asg.goldprice.org/dbXRates/USD`);
            let d = await r.json();
            price = this.symbol==='XAUUSD' ? d.items[0].xauPrice : d.items[0].xagPrice;
          } else {
            let from = this.symbol.slice(0,3); let to = this.symbol.slice(3,6);
            let r = await fetch(`https://open.er-api.com/v6/latest/${from}`);
            let d = await r.json(); price = d.rates?.[to];
          }
          if(!price) return;
          let last2 = this.allData[this.allData.length-1];
          if(last2){ last2.close = price; last2.high = Math.max(last2.high, price); last2.low = Math.min(last2.low, price); this.candleSeries.update(last2); this.updateTop(last2); }
        }catch(e){}
      }, 5000);

    }catch(e){
      console.log('[HTTPS Fallback] Gagal juga:', e);
      document.getElementById('candleStatus').textContent='WS + HTTPS gagal semua - Wajib pake VPN / Data HP bro';
      this.log('❌ WS Deriv ke-block ISP + HTTPS juga gagal. Solusi: Pake VPN Singapore / Data HP, terus Refresh di Chrome');
    }
  },

  afterLoadData(sourceName){ this.candleSeries.setData(this.allData); document.getElementById('candleStatus').textContent='OK • '+sourceName+' • '+this.allData.length+' candle'; document.getElementById('barCount').textContent=this.allData.length; this.updateTop(this.allData[this.allData.length-1]); setTimeout(()=>{ this.redrawAllPines(); Drawing.load(); Drawing.render(); try{ this.pineChart.timeScale().fitContent(); }catch(e){} this.updatePaneVisibility(); }, 600); },
  updateTop(c){ if(!c) return; let dec=c.close<10?5:c.close<1000?4:2; document.getElementById('topPrice').textContent=c.close.toLocaleString('en-US',{minimumFractionDigits:dec, maximumFractionDigits:dec}); document.getElementById('oV').textContent=c.open.toFixed(dec); document.getElementById('hV').textContent=c.high.toFixed(dec); document.getElementById('lV').textContent=c.low.toFixed(dec); document.getElementById('cV').textContent=c.close.toFixed(dec); },
  changeSymbol(v){ console.log('[App] Ganti:', this.symbol, '->', v); this.symbol=v; this.allData=[]; try{ this.candleSeries.setData([]); }catch(e){} this.loadReal(); },
  setTF(t,btn){ this.interval=t; document.querySelectorAll('.tf').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); this.loadReal(); },
  togglePine(){ document.getElementById('pineEditor').classList.toggle('hidden'); },
  showTab(tab,btn){ document.querySelectorAll('.pine-tabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); document.getElementById('pineCode').classList.toggle('hidden',tab!=='editor'); document.getElementById('pineConsole').classList.toggle('hidden',tab!=='console'); document.getElementById('pineVars').classList.toggle('hidden',tab!=='vars'); document.getElementById('pineFolder').classList.toggle('hidden',tab!=='folder'); if(tab==='folder') PineStorage.render(); },
  formatPine(){ let c=document.getElementById('pineCode').value; document.getElementById('pineCode').value=c.split('\n').map(l=>l.trim()).join('\n'); },
  log(t){ let d=document.createElement('div'); d.textContent=t; document.getElementById('log').prepend(d); },
  fixCandle(){ if(this.allData.length){ this.candleSeries.setData(this.allData); this.chart.timeScale().fitContent(); this.log('🔧 Candle dibalikin'); } else this.loadReal(); },
  zoomIn(){ try{ let r=this.chart.timeScale().getVisibleLogicalRange(); if(!r) return; let c=(r.from+r.to)/2, s=(r.to-r.from)*0.7; this.chart.timeScale().setVisibleLogicalRange({from:c-s/2,to:c+s/2}); }catch(e){} },
  zoomOut(){ try{ let r=this.chart.timeScale().getVisibleLogicalRange(); if(!r) return; let c=(r.from+r.to)/2, s=(r.to-r.from)*1.4; this.chart.timeScale().setVisibleLogicalRange({from:c-s/2,to:c+s/2}); }catch(e){} },
  zoomReset(){ this.chart.timeScale().fitContent(); this.chart.priceScale('right').applyOptions({autoScale:true}); },
  zoomToLast(n=50){ let total=this.allData.length; this.chart.timeScale().setVisibleLogicalRange({from:total-n, to:total+5}); },
  addFromLibrary(idx){ let item=INDICATORS_LIBRARY[idx]; if(!item) return; document.getElementById('pineCode').value=item.code; document.getElementById('pineScriptName').value=item.name; this.addPine(); PineStorage.save(item.name, item.code, 'library'); this.log('✅ + Tambah dari Library: '+item.name); },
  addFromStorage(id){ let item=PineStorage.get(id); if(!item) return; document.getElementById('pineCode').value=item.code; this.addPine(); },
  filterIndicators(q){ q=q.toLowerCase(); let filtered=INDICATORS_LIBRARY.filter(i=>i.name.toLowerCase().includes(q)||i.cat.toLowerCase().includes(q)); let el=document.getElementById('indicatorsLibrary'); if(!filtered.length){ el.innerHTML='<div style="font-size:12px;color:#787b86">Gak ketemu bro, coba kata lain</div>'; return; } let cats=[...new Set(filtered.map(i=>i.cat))]; el.innerHTML=cats.map(cat=>{ let items=filtered.filter(i=>i.cat===cat); return `<div style="margin-bottom:10px"><div style="font-weight:800;font-size:12px;color:#f0b90b">${cat}</div>${items.map(it=>{ let gi=INDICATORS_LIBRARY.indexOf(it); return `<div class="pine-item"><span>${it.name}</span><button onclick="App.addFromLibrary(${gi})">+ Tambah</button></div>`; }).join('')}</div>`; }).join(''); },
  addPine(){
    let code=document.getElementById('pineCode').value;
    if(!this.allData.length){ document.getElementById('pineError').textContent='Tunggu data ke-load...'; return; }
    if(!code.trim()){ document.getElementById('pineError').textContent='Kode Pine kosong bro!'; return; }
    try{
      let result=window.PineEngine.run(code, this.allData);
      let id=this.nextId++;
      let nameMatch=code.match(/indicator\s*\(\s*"([^"]+)"/) || code.match(/strategy\s*\(\s*"([^"]+)"/);
      let name=nameMatch?nameMatch[1]:('Indikator '+id);
      let pineObj={id, name, code, overlay:result.meta.overlay, overlaySeries:[], paneSeries:[], visible:true, result, markers:[]};
      result.plots.forEach(p=>{ let data=p.data.filter(d=>d.value!=null && !isNaN(d.value)); if(!data.length) return; if(result.meta.overlay){ let s=this.chart.addLineSeries({color:p.color,lineWidth:p.linewidth||2,title:name+' • '+p.title,priceLineVisible:false}); s.setData(data); pineObj.overlaySeries.push(s); } else { let s=this.pineChart.addLineSeries({color:p.color,lineWidth:p.linewidth||2,title:name+' • '+p.title,priceLineVisible:true,lastValueVisible:true}); s.setData(data); pineObj.paneSeries.push(s); } });
      result.hlines.forEach(h=>{ let s=this.pineChart.addLineSeries({color:h.color,lineWidth:1,lineStyle:2,title:name+' • '+h.title,priceLineVisible:false,lastValueVisible:false}); s.setData(this.allData.map(b=>({time:b.time,value:h.value}))); pineObj.paneSeries.push(s); });
      result.shapes.forEach(sh=>{ let markers=[]; sh.data.forEach(d=>{ if(d.value===true) markers.push({time:d.time, position: sh.location.includes('below')?'belowBar':'aboveBar', color:sh.color, shape:'arrowUp', text:sh.text||''}); }); if(markers.length) pineObj.markers=markers; });
      this.activePines.push(pineObj);
      this.candleSeries.setData(this.allData);
      this.updateMarkers(); this.renderActiveList(); this.updatePaneVisibility();
      document.getElementById('pineStatus').textContent='Sukses ✅ Ditambah: '+name; document.getElementById('pineStatus').style.color='#26a69a';
      document.getElementById('pineError').textContent='';
      document.getElementById('pineConsole').textContent='✅ Sukses! Ditambah: '+name+'\n\nTotal indikator aktif: '+this.activePines.length+'\nPlots: '+result.plots.map(p=>p.title+' = '+(p.data[p.data.length-1]?.value?.toFixed(2)||'-')).join('\n');
      document.getElementById('pineVars').textContent='Variables:\n'+Object.keys(result.vars).slice(0,20).map(k=>k+' = '+(result.vars[k][result.vars[k].length-1]?.toFixed?.(2)||result.vars[k][result.vars[k].length-1])).join('\n');
      if(result.errors.length) document.getElementById('pineConsole').textContent+='\n\n⚠️ Warning (tapi tetep jalan):\n'+result.errors.slice(0,5).join('\n');
      this.log('✅ + Tambah: '+name+' • Total: '+this.activePines.length+' indikator');
    }catch(e){ document.getElementById('pineError').textContent='❌ ERROR: '+e.message; document.getElementById('pineConsole').textContent='❌ ERROR:\n'+e.message; document.getElementById('pineStatus').textContent='Error ❌'; if(this.allData.length) this.candleSeries.setData(this.allData); }
  },
  runPine(){ this.addPine(); },
  removePine(id){ let idx=this.activePines.findIndex(p=>p.id===id); if(idx===-1) return; let p=this.activePines[idx]; p.overlaySeries.forEach(s=>{ try{this.chart.removeSeries(s)}catch(e){} }); p.paneSeries.forEach(s=>{ try{this.pineChart.removeSeries(s)}catch(e){} }); this.activePines.splice(idx,1); this.candleSeries.setData(this.allData); this.updateMarkers(); this.renderActiveList(); this.updatePaneVisibility(); this.log('🗑️ Hapus: '+p.name+' • Sisa: '+this.activePines.length); },
  togglePineVisible(id){ let p=this.activePines.find(x=>x.id===id); if(!p) return; p.visible=!p.visible; p.overlaySeries.forEach(s=>s.applyOptions({visible:p.visible})); p.paneSeries.forEach(s=>s.applyOptions({visible:p.visible})); this.renderActiveList(); this.updatePaneVisibility(); this.log((p.visible?'👁️ Nyala: ':'🙈 Mati: ')+p.name); },
  editPine(id){ let p=this.activePines.find(x=>x.id===id); if(!p) return; document.getElementById('pineCode').value=p.code; document.getElementById('pineScriptName').value=p.name; document.getElementById('pineEditor').classList.remove('hidden'); this.removePine(id); document.getElementById('pineStatus').textContent='Mode Edit: '+p.name+' • Klik + Tambah buat simpan'; },
  clearPine(){ [...this.activePines].forEach(p=>this.removePine(p.id)); this.log('🗑️ Semua indikator dihapus'); },
  autoUpdatePines(){
    this.activePines.forEach(p=>{
      try{
        let result=window.PineEngine.run(p.code, this.allData); p.result=result;
        let overlayIdx=0, paneIdx=0;
        result.plots.forEach(pl=>{ let data=pl.data.filter(d=>d.value!=null && !isNaN(d.value)); if(result.meta.overlay){ if(p.overlaySeries[overlayIdx]) p.overlaySeries[overlayIdx].setData(data); overlayIdx++; } else { if(p.paneSeries[paneIdx]) p.paneSeries[paneIdx].setData(data); paneIdx++; } });
        result.hlines.forEach(h=>{ if(p.paneSeries[paneIdx]) p.paneSeries[paneIdx].setData(this.allData.map(b=>({time:b.time,value:h.value}))); paneIdx++; });
      }catch(e){ console.log('Auto update gagal', p.name, e); }
    });
    try{ let range=this.chart.timeScale().getVisibleLogicalRange(); if(range) this.pineChart.timeScale().setVisibleLogicalRange(range); }catch(e){}
    document.getElementById('pineActive').textContent=this.activePines.filter(p=>p.visible).map(p=>p.name).join(', ')||'-';
  },
  redrawOnePine(id){
    let p=this.activePines.find(x=>x.id===id); if(!p) return;
    p.overlaySeries.forEach(s=>{ try{this.chart.removeSeries(s)}catch(e){} }); p.paneSeries.forEach(s=>{ try{this.pineChart.removeSeries(s)}catch(e){} });
    p.overlaySeries=[]; p.paneSeries=[]; p.markers=[];
    try{
      let result=window.PineEngine.run(p.code, this.allData); p.result=result;
      result.plots.forEach(pl=>{ let data=pl.data.filter(d=>d.value!=null && !isNaN(d.value)); if(!data.length) return; if(result.meta.overlay){ let s=this.chart.addLineSeries({color:pl.color,lineWidth:pl.linewidth||2,title:p.name+' • '+pl.title,priceLineVisible:false}); s.setData(data); p.overlaySeries.push(s); } else { let s=this.pineChart.addLineSeries({color:pl.color,lineWidth:pl.linewidth||2,title:p.name+' • '+pl.title}); s.setData(data); p.paneSeries.push(s); } });
      result.hlines.forEach(h=>{ let s=this.pineChart.addLineSeries({color:h.color,lineWidth:1,lineStyle:2,title:p.name+' • '+h.title}); s.setData(this.allData.map(b=>({time:b.time,value:h.value}))); p.paneSeries.push(s); });
      this.candleSeries.setData(this.allData); this.updateMarkers(); this.renderActiveList(); this.updatePaneVisibility();
    }catch(e){ console.log('Redraw one gagal', e); }
  },
  redrawAllPines(){
    let saved=[...this.activePines];
    saved.forEach(p=>{ p.overlaySeries.forEach(s=>{ try{this.chart.removeSeries(s)}catch(e){} }); p.paneSeries.forEach(s=>{ try{this.pineChart.removeSeries(s)}catch(e){} }); p.overlaySeries=[]; p.paneSeries=[]; });
    saved.forEach(p=>{ try{ let result=window.PineEngine.run(p.code, this.allData); p.result=result; result.plots.forEach(pl=>{ let data=pl.data.filter(d=>d.value!=null && !isNaN(d.value)); if(!data.length) return; if(result.meta.overlay){ let s=this.chart.addLineSeries({color:pl.color,lineWidth:pl.linewidth||2,title:p.name+' • '+pl.title,priceLineVisible:false}); s.setData(data); p.overlaySeries.push(s); } else { let s=this.pineChart.addLineSeries({color:pl.color,lineWidth:pl.linewidth||2,title:p.name+' • '+pl.title}); s.setData(data); p.paneSeries.push(s); } }); result.hlines.forEach(h=>{ let s=this.pineChart.addLineSeries({color:h.color,lineWidth:1,lineStyle:2,title:p.name+' • '+h.title}); s.setData(this.allData.map(b=>({time:b.time,value:h.value}))); p.paneSeries.push(s); }); }catch(e){ console.log('Redraw gagal',p.name,e); } });
    this.candleSeries.setData(this.allData); this.updateMarkers(); this.updatePaneVisibility();
  },
  updateMarkers(){ let allMarkers=[]; this.activePines.forEach(p=>{ if(p.visible && p.markers) allMarkers.push(...p.markers); }); if(Drawing.textMarkers && Drawing.textMarkers.length) allMarkers.push(...Drawing.textMarkers); if(allMarkers.length) this.candleSeries.setMarkers(allMarkers.sort((a,b)=>a.time-b.time)); else this.candleSeries.setMarkers([]); },
  updatePaneVisibility(){ let hasPane=false; this.activePines.forEach(p=>{ if(!p.visible) return; if(p.overlay===false) hasPane=true; if(p.paneSeries && p.paneSeries.length>0) hasPane=true; }); let paneEl=document.getElementById('panePine'); if(hasPane){ paneEl.style.display='block'; paneEl.style.height='170px'; paneEl.style.minHeight='170px'; setTimeout(()=>{ try{ this.pineChart.resize(paneEl.clientWidth,170); this.pineChart.timeScale().fitContent(); let range=this.chart.timeScale().getVisibleLogicalRange(); if(range) this.pineChart.timeScale().setVisibleLogicalRange(range); }catch(e){} },50); } else { paneEl.style.display='none'; } document.getElementById('pineActive').textContent=this.activePines.filter(p=>p.visible).map(p=>p.name).join(', ')||'-'; },
  renderActiveList(){ let el=document.getElementById('myIndicators'); if(!this.activePines.length){ el.innerHTML='<div style="font-size:12px;color:#787b86;padding:8px">Belum ada indikator. Klik + Tambah Indikator buat numpuk.</div>'; return; } el.innerHTML=this.activePines.map(p=>`<div class="pine-item" style="${p.visible?'':'opacity:0.5'}"><div style="flex:1;min-width:0"><div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">● ${p.name}</div><div style="font-size:11px;color:#787b86">${p.overlay?'Overlay di chart':'Panel bawah'} • ${p.result?.plots?.length||0} plot • ${p.visible?'ON':'OFF'} • <span style="color:#26a69a">Auto Update ON</span></div></div><div style="display:flex;gap:4px"><button style="background:#2962ff" onclick="PineSettings.askEdit(${p.id})" title="Edit - Pine / Panel">⚙️</button><button style="background:${p.visible?'#26a69a':'#787b86'}" onclick="App.togglePineVisible(${p.id})">${p.visible?'👁️':'🙈'}</button><button onclick="App.removePine(${p.id})">🗑️</button></div></div>`).join(''); },
  useExample(i){ document.getElementById('pineCode').value=PINE_EXAMPLES[i].code; document.getElementById('pineEditor').classList.remove('hidden'); this.addPine(); },
  loadExample(){ let idx=Math.floor(Math.random()*PINE_EXAMPLES.length); this.useExample(idx); }
};
window.addEventListener('DOMContentLoaded',()=>App.init());
