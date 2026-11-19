"use client";
import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageTitle, Panel, RankingList } from "@/components/shared";
import { pointHistory } from "@/data/demo";
import { rankUnits } from "@/services/club-selectors";
import { useClub } from "@/services/club-provider";

const series = [{ key: "orion", name: "Órion", color: "#7454ef" }, { key: "phoenix", name: "Phoenix", color: "#3d82f6" }, { key: "atlas", name: "Atlas", color: "#20a9a5" }, { key: "lumen", name: "Lúmen", color: "#ce771e" }];
export function PointsChart() {
  const [period, setPeriod] = useState(6);
  const id = useId();
  return <Panel title="Evolução de pontos" subtitle="Pontuação acumulada por unidade" action={<select aria-label="Período do gráfico" value={period} onChange={event => setPeriod(Number(event.target.value))}><option value={6}>Últimos 6 meses</option><option value={3}>Últimos 3 meses</option></select>}>
    <div className="chart-legend">{series.map(item => <span key={item.key}><i style={{ background: item.color }} />{item.name}</span>)}</div>
    <div className="chart"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 560, height: 220 }}>
      <AreaChart data={pointHistory.slice(-period)} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
        <defs>{series.map(item => <linearGradient key={item.key} id={id + item.key} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={item.color} stopOpacity={0.2} /><stop offset="100%" stopColor={item.color} stopOpacity={0.015} /></linearGradient>)}</defs>
        <CartesianGrid vertical={false} stroke="#e8ebf4" strokeDasharray="4 4" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickMargin={10} />
        <YAxis width={42} domain={[0, 3000]} ticks={[0, 750, 1500, 2250, 3000]} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip />
        {series.map(item => <Area key={item.key} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2.5} fill={`url(#${id + item.key})`} isAnimationActive={false} />)}
      </AreaChart>
    </ResponsiveContainer></div>
  </Panel>;
}
export function Ranking() {
  const { data } = useClub();
  return <><PageTitle title="Ranking" description="Confira a classificação e a evolução das unidades." /><div className="split"><PointsChart /><Panel title="Classificação geral" subtitle="Pontuação acumulada"><RankingList units={rankUnits(data.units)} /></Panel></div></>;
}