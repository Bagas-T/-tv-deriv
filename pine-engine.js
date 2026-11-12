class PineEngine {
  constructor() { this.plots=[]; this.shapes=[]; this.hlines=[]; this.inputs={}; this.errors=[]; this.vars={}; this.lastValues={}; }
  stripComments(code){ code=code.replace(/\/\*[\s\S]*?\*\//g,''); return code.split('\n').map(l=>{ let inStr=false,out=''; for(let i=0;i<l.length;i++){ if(l[i]==='"'&&l[i-1]!=='\\') inStr=!inStr; if(!inStr&&l[i]==='/'&&l[i+1]==='/') break; out+=l[i]; } return out; }).join('\n'); }
  parseColor(s){ if(!s) return '#2962ff'; s=s.trim(); const map={'color.red':'#ef5350','color.green':'#26a69a','color.blue':'#2962ff','color.yellow':'#f0b90b','color.purple':'#7e57c2','color.orange':'#ff6d00','color.white':'#ffffff','color.black':'#000000','color.aqua':'#00bcd4','color.gray':'#787b86','color.silver':'#c0c0c0','color.maroon':'#880e4f','color.teal':'#00897b','color.lime':'#00e676','color.navy':'#000080','red':'#ef5350','green':'#26a69a','blue':'#2962ff','yellow':'#f0b90b','purple':'#7e57c2','orange':'#ff6d00','white':'#fff','black':'#000','aqua':'#00bcd4'}; if(map[s]) return map[s]; if(s.startsWith('#')) return s; if(s.startsWith('color.new')){ let m=s.match(/color\.new\s*\(\s*([^,]+),\s*([0-9]+)/); if(m) return map[m[1].trim()]||'#2962ff'; } return '#2962ff'; }
  parsePlotArgs(pLine){
    let start = pLine.indexOf('('); if(start===-1) return null;
    let depth=0, end=-1, inStr=false;
    for(let i=start;i<pLine.length;i++){ let c=pLine[i]; if(c==='"' && pLine[i-1]!=='\\') inStr=!inStr; if(inStr) continue; if(c==='(') depth++; if(c===')'){ depth--; if(depth===0){ end=i; break; } } }
    if(end===-1) return null;
    let inside=pLine.slice(start+1,end);
    let args=[], cur='', d=0; inStr=false;
    for(let i=0;i<inside.length;i++){ let c=inside[i]; if(c==='"' && inside[i-1]!=='\\') inStr=!inStr; if(!inStr){ if(c==='(') d++; if(c===')') d--; if(c===',' && d===0){ args.push(cur.trim()); cur=''; continue; } } cur+=c; }
    if(cur.trim()) args.push(cur.trim());
    let expr=args[0]||''; let title=expr, colorExpr='color.blue', linewidth=2;
    args.slice(1).forEach(a=>{ let tm=a.match(/title\s*=\s*"([^"]+)"/); if(tm) title=tm[1]; let cm=a.match(/color\s*=\s*([^,]+)/); if(cm) colorExpr=cm[1].trim(); let wm=a.match(/linewidth\s*=\s*(\d+)/); if(wm) linewidth=parseInt(wm[1]); });
    return {expr, title, colorExpr, linewidth};
  }
  evalFullSeries(expr, bars, varSeries, close, open, high, low, volume){
    expr=expr.trim(); if(!expr) return close.map(()=>NaN);
    if(varSeries[expr]) return varSeries[expr];
    if(expr==='close') return close; if(expr==='open') return open; if(expr==='high') return high; if(expr==='low') return low; if(expr==='volume') return volume;
    if(!isNaN(parseFloat(expr)) && !expr.includes('(') && !expr.includes('+') && !expr.includes('-') && !expr.includes('*') && !expr.includes('/')) return close.map(()=>parseFloat(expr));
    const getSeries=(token)=>{
      token=token.trim();
      let hm=token.match(/^([a-zA-Z_][\w]*)\s*\[\s*(\d+)\s*\]$/);
      if(hm){ let base=this.evalFullSeries(hm[1],bars,varSeries,close,open,high,low,volume); let off=parseInt(hm[2]); return base.map((v,i)=> i-off>=0?base[i-off]:NaN); }
      let m=token.match(/^ta\.sma\s*\(\s*(.+),\s*([0-9]+)\s*\)$/); if(m) return PineStd.sma(this.evalFullSeries(m[1],bars,varSeries,close,open,high,low,volume), parseInt(m[2]));
      m=token.match(/^ta\.ema\s*\(\s*(.+),\s*([0-9]+)\s*\)$/); if(m) return PineStd.ema(this.evalFullSeries(m[1],bars,varSeries,close,open,high,low,volume), parseInt(m[2]));
      m=token.match(/^ta\.rsi\s*\(\s*(.+),\s*([0-9]+)\s*\)$/); if(m) return PineStd.rsi(this.evalFullSeries(m[1],bars,varSeries,close,open,high,low,volume), parseInt(m[2]));
      m=token.match(/^ta\.atr\s*\(\s*([0-9]+)\s*\)$/); if(m) return PineStd.atr(high,low,close,parseInt(m[1]));
      m=token.match(/^ta\.highest\s*\(\s*(.+),\s*([0-9]+)\s*\)$/); if(m) return PineStd.highest(this.evalFullSeries(m[1],bars,varSeries,close,open,high,low,volume), parseInt(m[2]));
      m=token.match(/^ta\.lowest\s*\(\s*(.+),\s*([0-9]+)\s*\)$/); if(m) return PineStd.lowest(this.evalFullSeries(m[1],bars,varSeries,close,open,high,low,volume), parseInt(m[2]));
      m=token.match(/^ta\.change\s*\(\s*(.+)\s*\)$/); if(m) return PineStd.change(this.evalFullSeries(m[1],bars,varSeries,close,open,high,low,volume));
      if(varSeries[token]) return varSeries[token];
      if(token==='close') return close; if(token==='open') return open; if(token==='high') return high; if(token==='low') return low; if(token==='volume') return volume;
      if(!isNaN(parseFloat(token))) return close.map(()=>parseFloat(token));
      return null;
    };
    let direct=getSeries(expr); if(direct) return direct;
    try{
      let n=close.length, out=new Array(n).fill(NaN);
      for(let i=0;i<n;i++){
        let scope={}; Object.keys(varSeries).forEach(k=>{ scope[k]=varSeries[k][i]; });
        scope['close']=close[i]; scope['open']=open[i]; scope['high']=high[i]; scope['low']=low[i]; scope['volume']=volume[i];
        let e=expr.replace(/([a-zA-Z_][\w]*)\s*\[\s*(\d+)\s*\]/g,(m,name,off)=>{ let arr=varSeries[name]||(name==='close'?close:name==='open'?open:name==='high'?high:name==='low'?low:name==='volume'?volume:null); if(!arr) return 'NaN'; let j=i-parseInt(off); return j>=0?String(arr[j]):'NaN'; });
        e=e.replace(/ta\.sma\s*\(\s*([^,]+),\s*([0-9]+)\s*\)/g,(m,src,len)=>{ let s=this.evalFullSeries(src,bars,varSeries,close,open,high,low,volume); let l=parseInt(len); if(i<l-1) return 'NaN'; let sum=0; for(let j=i-l+1;j<=i;j++) sum+=s[j]; return String(sum/l); });
        e=e.replace(/ta\.ema\s*\(\s*([^,]+),\s*([0-9]+)\s*\)/g,(m,src,len)=>{ let s=PineStd.ema(this.evalFullSeries(src,bars,varSeries,close,open,high,low,volume),parseInt(len)); return String(s[i]); });
        e=e.replace(/ta\.rsi\s*\(\s*([^,]+),\s*([0-9]+)\s*\)/g,(m,src,len)=>{ let s=PineStd.rsi(this.evalFullSeries(src,bars,varSeries,close,open,high,low,volume),parseInt(len)); return String(s[i]); });
        e=e.replace(/ta\.atr\s*\(\s*([0-9]+)\s*\)/g,(m,len)=>{ let s=PineStd.atr(high,low,close,parseInt(len)); return String(s[i]); });
        let keys=Object.keys(scope).sort((a,b)=>b.length-a.length);
        keys.forEach(k=>{ let re=new RegExp('\\b'+k+'\\b','g'); e=e.replace(re,String(scope[k]!==undefined?scope[k]:'NaN')); });
        if(/^[0-9\s\.\+\-\*\/\(\)NaN]+$/.test(e)){ try{ let v=Function('return ('+e+')')(); out[i]=v; }catch(err){ out[i]=NaN; } }
      }
      return out;
    }catch(e){ return close.map(()=>NaN); }
  }
  transpileExpr(expr){ let e=expr.trim(); e=e.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(\d+)\s*\]/g,(m,name,off)=>'__hist("'+name+'",'+off+',i)'); e=e.replace(/\bta\.sma\s*\(/g,'__ta.sma('); e=e.replace(/\bta\.ema\s*\(/g,'__ta.ema('); e=e.replace(/\bta\.rsi\s*\(/g,'__ta.rsi('); e=e.replace(/\bta\.atr\s*\(/g,'__ta.atr('); e=e.replace(/\bta\.crossover\s*\(/g,'__ta.crossover('); e=e.replace(/\bta\.crossunder\s*\(/g,'__ta.crossunder('); e=e.replace(/\bta\.highest\s*\(/g,'__ta.highest('); e=e.replace(/\bta\.lowest\s*\(/g,'__ta.lowest('); e=e.replace(/\bta\.change\s*\(/g,'__ta.change('); e=e.replace(/\bmath\.abs\s*\(/g,'Math.abs('); e=e.replace(/\bmath\.max\s*\(/g,'Math.max('); e=e.replace(/\bmath\.min\s*\(/g,'Math.min('); e=e.replace(/\band\b/g,'&&').replace(/\bor\b/g,'||').replace(/\bnot\b/g,'!'); e=e.replace(/\bna\s*\(/g,'__na(').replace(/\bnz\s*\(/g,'__nz('); return e; }
  run(code,bars){
    this.errors=[]; this.plots=[]; this.shapes=[]; this.hlines=[]; this.inputs={}; this.vars={}; this.lastValues={};
    let clean=this.stripComments(code); let lines=clean.split('\n');
    let meta={overlay:false,title:'Indikator Gue',shorttitle:''};
    let metaLine=lines.find(l=>l.includes('indicator(')||l.includes('strategy('));
    if(metaLine){ if(metaLine.includes('overlay=true')) meta.overlay=true; let tm=metaLine.match(/title\s*=\s*"([^"]+)"/); if(tm) meta.title=tm[1]; }
    lines.forEach(l=>{ let m=l.match(/([a-zA-Z_][\w]*)\s*=\s*input\.(int|float|bool|string|color|source|timeframe)\s*\(\s*([^,\)]+)(?:,\s*title\s*=\s*"([^"]+)")?.*\)/); if(m){ let name=m[1],type=m[2],def=m[3].trim(); let val=def; if(def.startsWith('"')&&def.endsWith('"')) val=def.slice(1,-1); else if(def==='true') val=true; else if(def==='false') val=false; else if(!isNaN(parseFloat(def))) val=parseFloat(def); this.inputs[name]={type,value:val,title:m[4]||name}; this.vars[name]=val; } });
    let n=bars.length; let close=bars.map(b=>b.close), open=bars.map(b=>b.open), high=bars.map(b=>b.high), low=bars.map(b=>b.low), volume=bars.map(b=>b.volume||0);
    let taCache={}; let getTA=(fn,args)=>{ let key=fn+JSON.stringify(args); if(taCache[key]) return taCache[key]; let res; if(fn==='sma') res=PineStd.sma(args[0],args[1]||14); if(fn==='ema') res=PineStd.ema(args[0],args[1]||14); if(fn==='rsi') res=PineStd.rsi(args[0],args[1]||14); if(fn==='atr') res=PineStd.atr(high,low,close,args[0]||14); if(fn==='highest') res=PineStd.highest(args[0],args[1]||10); if(fn==='lowest') res=PineStd.lowest(args[0],args[1]||10); if(fn==='change') res=PineStd.change(args[0]); taCache[key]=res; return res; };
    let plotDefs=[], shapeDefs=[], hlineDefs=[]; let codeBody=[];
    lines.forEach(raw=>{ let l=raw.trim(); if(!l) return; if(l.startsWith('//')||l.startsWith('#')||l.startsWith('@')||l.startsWith('indicator(')||l.startsWith('strategy(')) return; if(l.includes('input.')&&l.includes('=')) return; if(l.startsWith('plot(')){ plotDefs.push(l); return; } if(l.startsWith('plotshape(')){ shapeDefs.push(l); return; } if(l.startsWith('hline(')){ hlineDefs.push(l); return; } if(l.startsWith('bgcolor(')||l.startsWith('barcolor(')||l.startsWith('fill(')) return; codeBody.push(raw); });
    let varSeries={}; Object.keys(this.vars).forEach(k=>{ varSeries[k]=new Array(n).fill(this.vars[k]); });
    let varState={};
    for(let i=0;i<n;i++){
      let scope={ close:close[i], open:open[i], high:high[i], low:low[i], volume:volume[i], bar_index:i, n:n,
        __hist:(name,off,idx)=>{ let arr=varSeries[name]||(name==='close'?close:name==='open'?open:name==='high'?high:name==='low'?low:name==='volume'?volume:null); if(!arr) return NaN; let j=idx-off; return j>=0?arr[j]:NaN; },
        __ta:{ sma:(src,len)=>{ let full=Array.isArray(src)?src:close; return getTA('sma',[full,len])[i]; }, ema:(src,len)=>{ let full=Array.isArray(src)?src:close; return getTA('ema',[full,len])[i]; }, rsi:(src,len)=>{ let full=Array.isArray(src)?src:close; return getTA('rsi',[full,len])[i]; }, atr:(len)=>getTA('atr',[len])[i], highest:(src,len)=>{ let full=Array.isArray(src)?src:close; return getTA('highest',[full,len])[i]; }, lowest:(src,len)=>{ let full=Array.isArray(src)?src:close; return getTA('lowest',[full,len])[i]; }, change:(src)=>{ let full=Array.isArray(src)?src:close; return getTA('change',[full])[i]; }, crossover:(a,b)=>{ let av=Array.isArray(a)?a[i]:a; let bv=Array.isArray(b)?b[i]:b; let avp=i>0?(Array.isArray(a)?a[i-1]:a):av; let bvp=i>0?(Array.isArray(b)?b[i-1]:b):bv; return avp<=bvp&&av>bv; }, crossunder:(a,b)=>{ let av=Array.isArray(a)?a[i]:a; let bv=Array.isArray(b)?b[i]:b; let avp=i>0?(Array.isArray(a)?a[i-1]:a):av; let bvp=i>0?(Array.isArray(b)?b[i-1]:b):bv; return avp>=bvp&&av<bv; } },
        __na:(v)=>v==null||isNaN(v), __nz:(v,r=0)=>(v==null||isNaN(v))?r:v };
      Object.keys(varSeries).forEach(k=>{ if(!(k in scope)) scope[k]=varSeries[k][i]!==undefined?varSeries[k][i]:(i>0?varSeries[k][i-1]:NaN); });
      Object.keys(varState).forEach(k=>{ if(!(k in scope)) scope[k]=varState[k]; });
      for(let raw of codeBody){
        let l=raw.trim(); if(!l) continue;
        let vm=l.match(/^var\s+([a-zA-Z_][\w]*)\s*=\s*(.+)$/);
        let am=l.match(/^([a-zA-Z_][\w]*)\s*:=\s*(.+)$/);
        let sm=l.match(/^([a-zA-Z_][\w]*)\s*=\s*(.+)$/);
        try{
          if(vm){ let name=vm[1]; if(!(name in varState)){ let val=this.evalExpr(vm[2],scope,i,varSeries,close,open,high,low,volume); varState[name]=val; if(!varSeries[name]) varSeries[name]=new Array(n).fill(NaN); varSeries[name][i]=val; scope[name]=val; } else { scope[name]=varState[name]; if(!varSeries[name]) varSeries[name]=new Array(n).fill(NaN); varSeries[name][i]=varState[name]; } }
          else if(am){ let name=am[1]; let val=this.evalExpr(am[2],scope,i,varSeries,close,open,high,low,volume); varState[name]=val; if(!varSeries[name]) varSeries[name]=new Array(n).fill(NaN); varSeries[name][i]=val; scope[name]=val; }
          else if(sm){ let name=sm[1]; let val=this.evalExpr(sm[2],scope,i,varSeries,close,open,high,low,volume); if(!varSeries[name]) varSeries[name]=new Array(n).fill(NaN); varSeries[name][i]=val; scope[name]=val; }
        }catch(e){ if(!this.errors.includes(e.message)) this.errors.push('Bar '+i+' • '+l+' • '+e.message); }
      }
      Object.keys(scope).forEach(k=>{ if(typeof scope[k]==='number'&&!['close','open','high','low','volume','bar_index','n'].includes(k)){ if(!varSeries[k]) varSeries[k]=new Array(n).fill(NaN); if(isNaN(varSeries[k][i])) varSeries[k][i]=scope[k]; } });
    }
    Object.keys(varSeries).forEach(k=>{ let hasValid=varSeries[k].some(v=>v!=null&&!isNaN(v)); if(!hasValid){ let defLine=codeBody.find(l=>l.trim().startsWith(k+' =')||l.trim().startsWith(k+' :=')); if(defLine){ let expr=defLine.split('=').slice(1).join('=').trim(); try{ let full=this.evalFullSeries(expr,bars,varSeries,close,open,high,low,volume); varSeries[k]=full; }catch(e){} } } });
    for(let pLine of plotDefs){
      try{
        let parsed=this.parsePlotArgs(pLine); if(!parsed) continue;
        let expr=parsed.expr, title=parsed.title, colorExpr=parsed.colorExpr;
        let series=null; if(varSeries[expr]) series=varSeries[expr]; else series=this.evalFullSeries(expr,bars,varSeries,close,open,high,low,volume);
        let color=this.parseColor(colorExpr.replace(/"/g,''));
        let data=bars.map((b,idx)=>{ return { time:b.time, value: series?series[idx]:NaN }; });
        let lastVal=series?series[n-1]:NaN;
        this.plots.push({ title:title, color:color, data:data, overlay:meta.overlay, linewidth:parsed.linewidth });
        this.lastValues[title]=lastVal;
      }catch(e){ this.errors.push('plot: '+e.message); }
    }
    for(let sLine of shapeDefs){
      try{ let condM=sLine.match(/plotshape\s*\(\s*([^,]+)/); if(!condM) continue; let expr=condM[1].trim(); let series=varSeries[expr]||this.evalFullSeries(expr,bars,varSeries,close,open,high,low,volume); let data=bars.map((b,idx)=>{ return { time:b.time, value: series?series[idx]:false, price:b.close }; }); this.shapes.push({ title:'Shape', color:'#2962ff', location:'location.abovebar', style:'shape.triangleup', text:'', data:data }); }catch(e){ this.errors.push('plotshape: '+e.message); }
    }
    for(let hLine of hlineDefs){ let m=hLine.match(/hline\s*\(\s*([0-9.\-]+)(?:,\s*title\s*=\s*"([^"]+)")?(?:,\s*color\s*=\s*([^,\)]+))?/); if(m) this.hlines.push({ value:parseFloat(m[1]), title:m[2]||String(m[1]), color:this.parseColor(m[3]||'color.gray') }); }
    return { meta:meta, plots:this.plots, shapes:this.shapes, hlines:this.hlines, vars:varSeries, inputs:this.inputs, errors:this.errors };
  }
  evalExpr(expr,scope,idx,varSeries,close,open,high,low,volume){
    let e=this.transpileExpr(expr); let fnBody='with(scope){ return ('+e+'); }';
    try{ let fn=new Function('scope','i','__hist','__ta','__na','__nz',fnBody); let histFn=(name,off,ii)=>{ let arr=varSeries[name]||(name==='close'?close:name==='open'?open:name==='high'?high:name==='low'?low:name==='volume'?volume:null); if(!arr) return NaN; let j=ii-off; return j>=0?arr[j]:NaN; }; let v=fn(scope,idx,histFn,scope.__ta,scope.__na,scope.__nz); if(Array.isArray(v)) return v[idx]; return v; }catch(err){ if(!isNaN(parseFloat(expr))) return parseFloat(expr); throw err; }
  }
}
window.PineEngine=new PineEngine();