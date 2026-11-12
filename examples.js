const PINE_EXAMPLES=[
{ name:'🔥 SMA Crossover', code:`//@version=5\nindicator("SMA Cross", overlay=true)\nfast = ta.sma(close, 9)\nslow = ta.sma(close, 21)\nplot(fast, title="SMA 9", color=color.yellow)\nplot(slow, title="SMA 21", color=color.purple)`},
{ name:'📊 RSI', code:`//@version=5\nindicator("RSI Gue", overlay=false)\nr = ta.rsi(close, 14)\nplot(r, title="RSI 14", color=color.purple)\nhline(70, title="Overbought", color=color.red)\nhline(30, title="Oversold", color=color.green)`},
{ name:'⚡ Triple EMA', code:`//@version=5\nindicator("Triple EMA", overlay=true)\nplot(ta.ema(close, 9), title="EMA 9", color=color.yellow)\nplot(ta.ema(close, 21), title="EMA 21", color=color.blue)\nplot(ta.ema(close, 50), title="EMA 50", color=color.purple)`},
{ name:'🎯 BB', code:`//@version=5\nindicator("BB Gue", overlay=true)\nbasis = ta.sma(close, 20)\nplot(basis, title="Basis", color=color.white)\nplot(ta.ema(close, 20), title="EMA 20", color=color.blue)`},
{ name:'💥 MACD', code:`//@version=5\nindicator("MACD Gue", overlay=false)\nfast = ta.ema(close, 12)\nslow = ta.ema(close, 26)\nmacdLine = fast - slow\nplot(macdLine, title="MACD", color=color.blue)`},
{ name:'📉 ATR', code:`//@version=5\nindicator("ATR", overlay=false)\na = ta.atr(14)\nplot(a, title="ATR 14", color=color.orange)`},
{ name:'⭐ SNR Auto', code:`//@version=5\nindicator("SNR Auto", overlay=true)\nhi = ta.highest(high, 20)\nlo = ta.lowest(low, 20)\nplot(hi, title="Resist 20", color=color.red)\nplot(lo, title="Support 20", color=color.green)`},
{ name:'🔥 SMA + Input', code:`//@version=5\nindicator("SMA Input", overlay=true)\nlen = input.int(20, title="Length")\nplot(ta.sma(close, len), title="SMA", color=color.yellow)`},
];