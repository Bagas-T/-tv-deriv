const INDICATORS_LIBRARY=[
  {cat:'📈 TREND',name:'SMA',code:`//@version=5\nindicator("SMA", overlay=true)\nplot(ta.sma(close, 20), title="SMA", color=color.yellow)`},
  {cat:'📈 TREND',name:'EMA',code:`//@version=5\nindicator("EMA", overlay=true)\nplot(ta.ema(close, 20), title="EMA", color=color.blue)`},
  {cat:'📈 TREND',name:'EMA 9 / 21 / 50 / 200',code:`//@version=5\nindicator("EMA Combo", overlay=true)\nplot(ta.ema(close, 9), title="EMA 9", color=color.yellow)\nplot(ta.ema(close, 21), title="EMA 21", color=color.blue)\nplot(ta.ema(close, 50), title="EMA 50", color=color.purple)\nplot(ta.ema(close, 200), title="EMA 200", color=color.red)`},
  {cat:'📈 TREND',name:'SMA 50 / 200',code:`//@version=5\nindicator("Golden Cross", overlay=true)\nplot(ta.sma(close, 50), title="SMA 50", color=color.yellow)\nplot(ta.sma(close, 200), title="SMA 200", color=color.purple)`},
  {cat:'📈 TREND',name:'Supertrend',code:`//@version=5\nindicator("Supertrend", overlay=true)\nplot(ta.sma(close, 10), title="ST Fast", color=color.green)\nplot(ta.sma(close, 50), title="ST Slow", color=color.red)`},
  {cat:'⚡ MOMENTUM',name:'RSI',code:`//@version=5\nindicator("RSI", overlay=false)\nr = ta.rsi(close, 14)\nplot(r, title="RSI", color=color.purple)\nhline(70, color=color.red)\nhline(30, color=color.green)`},
  {cat:'⚡ MOMENTUM',name:'MACD',code:`//@version=5\nindicator("MACD", overlay=false)\nfast = ta.ema(close, 12)\nslow = ta.ema(close, 26)\nmacdLine = fast - slow\nplot(macdLine, title="MACD", color=color.blue)`},
  {cat:'⚡ MOMENTUM',name:'Momentum',code:`//@version=5\nindicator("Momentum", overlay=false)\nprev = close[10]\nmom = close - prev\nplot(mom, title="Momentum 10", color=color.blue)`},
  {cat:'🌊 VOLATILITY',name:'Bollinger',code:`//@version=5\nindicator("BB", overlay=true)\nbasis = ta.sma(close, 20)\nupper = basis + 10\nlower = basis - 10\nplot(basis, title="Basis", color=color.white)\nplot(upper, title="Upper", color=color.green)\nplot(lower, title="Lower", color=color.red)`},
  {cat:'🌊 VOLATILITY',name:'ATR',code:`//@version=5\nindicator("ATR", overlay=false)\na = ta.atr(14)\nplot(a, title="ATR 14", color=color.orange)`},
  {cat:'🌊 VOLATILITY',name:'ATR 7 / 14 / 21',code:`//@version=5\nindicator("ATR Combo", overlay=false)\nplot(ta.atr(7), title="ATR 7", color=color.yellow)\nplot(ta.atr(14), title="ATR 14", color=color.orange)\nplot(ta.atr(21), title="ATR 21", color=color.red)`},
  {cat:'🌊 VOLATILITY',name:'Donchian Channel',code:`//@version=5\nindicator("Donchian", overlay=true)\nplot(ta.highest(high, 20), title="Upper", color=color.green)\nplot(ta.lowest(low, 20), title="Lower", color=color.red)`},
  {cat:'📊 VOLUME',name:'Volume SMA',code:`//@version=5\nindicator("Volume SMA", overlay=false)\nvolSMA = ta.sma(volume, 20)\nplot(volSMA, title="Vol SMA 20", color=color.blue)`},
  {cat:'🎯 SUPPORT / RESIST',name:'Support / Resist Auto',code:`//@version=5\nindicator("SNR Auto", overlay=true)\nplot(ta.highest(high, 20), title="Resist", color=color.red)\nplot(ta.lowest(low, 20), title="Support", color=color.green)`},
  {cat:'🔥 COMBO SIAP PAKAI',name:'🔥 Scalping 1m - Buat Volatility / Boom Crash',code:`//@version=5\nindicator("Scalping 1m", overlay=true)\nplot(ta.ema(close, 9), title="EMA 9", color=color.yellow)\nplot(ta.ema(close, 21), title="EMA 21", color=color.blue)`},
  {cat:'🔥 COMBO SIAP PAKAI',name:'🔥 All in One',code:`//@version=5\nindicator("All in One", overlay=true)\nplot(ta.ema(close, 9), title="EMA 9", color=color.yellow)\nplot(ta.ema(close, 21), title="EMA 21", color=color.blue)\nplot(ta.ema(close, 50), title="EMA 50", color=color.purple)\nplot(ta.sma(close, 200), title="SMA 200", color=color.red)`},
  {cat:'🎲 DERIV SPECIAL',name:'🎲 Volatility Scalping',code:`//@version=5\nindicator("Volatility Scalping", overlay=true)\nplot(ta.ema(close, 5), title="EMA 5", color=color.yellow)\nplot(ta.ema(close, 10), title="EMA 10", color=color.blue)\nplot(ta.sma(close, 50), title="SMA 50", color=color.purple)`},
  {cat:'🎲 DERIV SPECIAL',name:'🎲 Boom / Crash - Spike Hunter',code:`//@version=5\nindicator("Spike Hunter", overlay=false)\nr = ta.rsi(close, 7)\nplot(r, title="RSI 7", color=color.yellow)\nhline(80, color=color.red)\nhline(20, color=color.green)`},
];
function renderIndicatorsLibrary(){
  let el=document.getElementById('indicatorsLibrary'); if(!el) return;
  let cats=[...new Set(INDICATORS_LIBRARY.map(i=>i.cat))];
  el.innerHTML=cats.map(cat=>{
    let items=INDICATORS_LIBRARY.filter(i=>i.cat===cat);
    return `<div style="margin-bottom:12px"><div style="font-weight:800;font-size:12px;color:#f0b90b;margin-bottom:6px">${cat}</div>${items.map(it=>{let gi=INDICATORS_LIBRARY.indexOf(it); return `<div class="pine-item"><span>${it.name}</span><button onclick="App.addFromLibrary(${gi})">+ Tambah</button></div>`;}).join('')}</div>`;
  }).join('');
}