import { useEffect, useMemo, useState } from "react"; import { Card, CardContent } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; import { motion } from "framer-motion";

const API_KEY = "YOUR_TWELVE_DATA_API_KEY";

const SYMBOLS = [ "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "XAU/USD", "BTC/USD", "ETH/USD", ];

const TIMEFRAMES = ["1min", "5min", "15min"];

function mapSymbol(market) { const map = { "EUR/USD": "EUR/USD", "GBP/USD": "GBP/USD", "USD/JPY": "USD/JPY", "USD/CHF": "USD/CHF", "XAU/USD": "XAU/USD", "BTC/USD": "BTC/USD", "ETH/USD": "ETH/USD", }; return map[market] || market; }

async function fetchCandles(symbol, tf) { const url = https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${tf}&outputsize=50&apikey=${API_KEY}; const res = await fetch(url); const data = await res.json(); if (!data.values) return null;

return data.values .map((c) => ({ open: +c.open, high: +c.high, low: +c.low, close: +c.close, })) .reverse(); }

function analyze(candles) { if (!candles || candles.length < 20) { return { signal: "WAIT", prob: 0, trend: "NEUTRAL" }; }

const data = candles.slice(0, -1); const closes = data.map((c) => c.close);

const last = data[data.length - 1]; const prev = data[data.length - 2];

const HH = last.high > prev.high; const HL = last.low > prev.low; const LH = last.high < prev.high; const LL = last.low < prev.low;

const bosUp = last.close > prev.high; const bosDown = last.close < prev.low;

const lows = data.slice(-10).map((c) => c.low); const highs = data.slice(-10).map((c) => c.high);

const liquidityBuy = last.low < Math.min(...lows); const liquiditySell = last.high > Math.max(...highs);

let gain = 0, loss = 0; for (let i = 1; i < closes.length; i++) { const diff = closes[i] - closes[i - 1]; diff > 0 ? (gain += diff) : (loss -= diff); }

const rsi = 100 - 100 / (1 + gain / (loss || 1));

let buy = 0; let sell = 0;

if (HH) buy++; if (HL) buy++; if (bosUp) buy++; if (liquidityBuy) buy++; if (rsi < 40) buy++;

if (LH) sell++; if (LL) sell++; if (bosDown) sell++; if (liquiditySell) sell++; if (rsi > 60) sell++;

let signal = "WAIT"; if (buy >= 3 && buy > sell + 1) signal = "BUY"; else if (sell >= 3 && sell > buy + 1) signal = "SELL";

const score = Math.max(buy, sell); const prob = Math.min(95, 50 + score * 10);

return { signal, trend: signal === "BUY" ? "BULLISH" : signal === "SELL" ? "BEARISH" : "NEUTRAL", prob: prob.toFixed(1), rsi: rsi.toFixed(2), }; }

export default function TradingDashboard() { const [market, setMarket] = useState("EUR/USD"); const [tf, setTf] = useState("1min"); const [data, setData] = useState(null); const [loading, setLoading] = useState(false);

const result = useMemo(() => { if (!data) return null; return analyze(data); }, [data]);

const runAnalysis = async () => { setLoading(true); const candles = await fetchCandles(mapSymbol(market), tf); setData(candles); setLoading(false); };

useEffect(() => { runAnalysis(); }, [market, tf]);

return ( <div className="min-h-screen bg-black text-white p-6 grid gap-6"> <motion.h1 className="text-3xl font-bold text-center text-emerald-400"> V20 ULTRA PRO DASHBOARD </motion.h1>

<div className="grid md:grid-cols-3 gap-4">
    <Card className="bg-zinc-900">
      <CardContent className="p-4">
        <p className="text-gray-400">Market</p>
        <Select value={market} onValueChange={setMarket}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SYMBOLS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>

    <Card className="bg-zinc-900">
      <CardContent className="p-4">
        <p className="text-gray-400">Timeframe</p>
        <Select value={tf} onValueChange={setTf}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEFRAMES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>

    <Card className="bg-zinc-900">
      <CardContent className="p-4 flex items-center justify-center">
        <Button onClick={runAnalysis} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </CardContent>
    </Card>
  </div>

  {result && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid md:grid-cols-3 gap-4"
    >
      <Card className="bg-zinc-900 border-2 border-emerald-500">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Signal</p>
          <h2
            className={`text-4xl font-bold mt-2 ${
              result.signal === "BUY"
                ? "text-green-400"
                : result.signal === "SELL"
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {result.signal}
          </h2>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Probability</p>
          <h2 className="text-3xl font-bold text-white">
            {result.prob}%
          </h2>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Trend</p>
          <h2 className="text-2xl font-bold text-blue-400">
            {result.trend}
          </h2>
        </CardContent>
      </Card>
    </motion.div>
  )}

  <div className="text-center text-gray-500 text-sm">
    Smart Money Engine • Twelve Data Live Market
  </div>
</div>

); }
