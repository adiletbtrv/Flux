import React, { useEffect, useState, memo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import { fetchHistory } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Tooltip, Filler,
} from 'chart.js/auto';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);
ChartJS.defaults.font.family = '"Plus Jakarta Sans", sans-serif';

interface RateChartProps {
  from: string;
  to: string;
  isDarkMode: boolean;
}

const RateChart = memo(function RateChart({ from, to, isDarkMode }: RateChartProps) {
  const [chartData, setChartData] = useState<ChartData<'line'> | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!from || !to) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setUnavailable(false);
      const data = await fetchHistory(from, to, 30);

      if (cancelled) return;
      setLoading(false);

      if (!data) { setUnavailable(true); return; }

      const labels = Object.keys(data);
      const values = labels.map(d => data[d][to] ?? 0);

      setChartData({
        labels,
        datasets: [{
          fill: true,
          label: `${from}/${to}`,
          data: values,
          borderColor: '#6366f1',
          backgroundColor: (ctx: ScriptableContext<'line'>) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 240);
            gradient.addColorStop(0, 'rgba(99,102,241,0.18)');
            gradient.addColorStop(1, 'rgba(99,102,241,0)');
            return gradient;
          },
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,
        }],
      });
    };

    load();
    return () => { cancelled = true; };
  }, [from, to]);

  const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9';
  const tickColor = '#94a3b8';

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDarkMode ? '#1e293b' : '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        padding: 10,
        displayColors: false,
        titleFont: { family: '"Plus Jakarta Sans", sans-serif', size: 12 },
        bodyFont: { family: '"Plus Jakarta Sans", sans-serif', size: 13, weight: 'bold' as const },
        callbacks: {
          title: items => items[0]?.label ?? '',
          label: ctx => `${(ctx.parsed.y ?? 0).toFixed(4)}`,
        },
      },
    },
    scales: {
      x: { display: false },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { family: '"Plus Jakarta Sans", sans-serif', size: 10 }, maxTicksLimit: 5 },
      },
    },
    interaction: { intersect: false, mode: 'index' },
  };

  if (loading) return (
    <div className="h-48 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="h-6 w-6 border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  if (unavailable) return (
    <div className="h-48 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center p-6">
      <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Chart unavailable for this pair</p>
      <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">Try major pairs like USD / EUR</p>
    </div>
  );

  return (
    <div className="h-56 w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          30-Day Trend
        </h3>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
          Live Market
        </span>
      </div>
      <div className="h-40 w-full">
        {chartData && (
          <div key={`${from}-${to}-${isDarkMode}`} className="h-full w-full">
            <Line data={chartData} options={options} />
          </div>
        )}
      </div>
    </div>
  );
});

export default RateChart;