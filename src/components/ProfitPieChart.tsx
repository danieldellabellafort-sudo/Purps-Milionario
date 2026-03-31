import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { DayEntry } from "@/components/DayTable";

interface ProfitPieChartProps {
  entries: DayEntry[];
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = ["hsl(155, 70%, 45%)", "hsl(0, 75%, 55%)"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border rounded-xl px-4 py-2 shadow-lg text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="font-mono font-semibold">{fmt(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const ProfitPieChart = ({ entries }: ProfitPieChartProps) => {
  const totalGains = entries.reduce((s, e) => s + e.gains, 0);
  const totalLosses = entries.reduce((s, e) => s + e.losses, 0);

  if (totalGains === 0 && totalLosses === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
        Adicione registros para ver o gráfico
      </div>
    );
  }

  const data = [
    { name: "Ganhos", value: totalGains },
    { name: "Perdas", value: totalLosses },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[data[index].name === "Ganhos" ? 0 : 1]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-sm font-medium text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ProfitPieChart;
