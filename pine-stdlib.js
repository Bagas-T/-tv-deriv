const PineStd={
  sma(arr,len){let out=new Array(arr.length).fill(NaN);let sum=0;for(let i=0;i<arr.length;i++){sum+=arr[i];if(i>=len)sum-=arr[i-len];if(i>=len-1)out[i]=sum/len;}return out;},
  ema(arr,len){let out=new Array(arr.length).fill(NaN);let k=2/(len+1),ema=NaN;for(let i=0;i<arr.length;i++){if(isNaN(arr[i]))continue;if(isNaN(ema))ema=arr[i];else ema=arr[i]*k+ema*(1-k);out[i]=ema;}return out;},
  rma(arr,len){let out=new Array(arr.length).fill(NaN);let alpha=1/len,v=NaN;for(let i=0;i<arr.length;i++){if(isNaN(arr[i]))continue;if(isNaN(v))v=arr[i];else v=alpha*arr[i]+(1-alpha)*v;out[i]=v;}return out;},
  rsi(src,len){let out=new Array(src.length).fill(NaN);let up=[],down=[];for(let i=0;i<src.length;i++){let ch=i===0?0:src[i]-src[i-1];up.push(Math.max(ch,0));down.push(Math.max(-ch,0));}let avgUp=PineStd.rma(up,len),avgDown=PineStd.rma(down,len);for(let i=0;i<src.length;i++){if(isNaN(avgUp[i])||isNaN(avgDown[i]))continue;let rs=avgDown[i]===0?100:avgUp[i]/avgDown[i];out[i]=100-(100/(1+rs));}return out;},
  macd(src,fast=12,slow=26,sig=9){let f=PineStd.ema(src,fast),s=PineStd.ema(src,slow);let macd=f.map((v,i)=>v-s[i]);let signal=PineStd.ema(macd.filter(v=>!isNaN(v)),sig);let sigFull=new Array(src.length).fill(NaN);let idx=0;for(let i=0;i<src.length;i++){if(!isNaN(macd[i])){if(idx<signal.length)sigFull[i]=signal[idx++];}}let hist=macd.map((v,i)=>v-sigFull[i]);return{macd,signal:sigFull,hist};},
  bb(src,len=20,mult=2){let basis=PineStd.sma(src,len);let up=new Array(src.length).fill(NaN),down=new Array(src.length).fill(NaN);for(let i=len-1;i<src.length;i++){let slice=src.slice(i-len+1,i+1);let mean=basis[i];let variance=slice.reduce((a,b)=>a+Math.pow(b-mean,2),0)/len;let sd=Math.sqrt(variance);up[i]=mean+mult*sd;down[i]=mean-mult*sd;}return{basis,upper:up,lower:down};},
  atr(high,low,close,len=14){let tr=[];for(let i=0;i<close.length;i++){if(i===0)tr.push(high[i]-low[i]);else tr.push(Math.max(high[i]-low[i],Math.abs(high[i]-close[i-1]),Math.abs(low[i]-close[i-1])));}return PineStd.rma(tr,len);},
  highest(arr,len){let out=new Array(arr.length).fill(NaN);for(let i=len-1;i<arr.length;i++)out[i]=Math.max(...arr.slice(i-len+1,i+1));return out;},
  lowest(arr,len){let out=new Array(arr.length).fill(NaN);for(let i=len-1;i<arr.length;i++)out[i]=Math.min(...arr.slice(i-len+1,i+1));return out;},
  change(arr){return arr.map((v,i)=>i===0?NaN:v-arr[i-1]);},
  nz(v,repl=0){return Array.isArray(v)?v.map(x=>(x===null||x===undefined||isNaN(x))?repl:x):(v==null||isNaN(v)?repl:v);},
  na(v){return v==null||isNaN(v);}
};