import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchHistory } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  ScriptableContext
} from 'chart.js/auto';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface RateChartProps {
  from: string;
  to: string;
  isDarkMode: boolean;
}

const RateChart: React.FC<RateChartProps> = ({ from, to, isDarkMode }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!from || !to) return;

    const loadData = async () => {
      setLoading(true);
      setUnavailable(false);
      try {
        const data = await fetchHistory(from, to, 30);
        if (!data) {
          setUnavailable(true);
          return;
        }

        const labels = Object.keys(data);
        const values = Object.values(data).map((rate: any) => rate[to]);

        setChartData({
          labels,
          datasets: [
            {
              fill: true,
              label: `${from} to ${to}`,
              data: values,
              borderColor: '#6366f1', // Indigo 500
              backgroundColor: (context: ScriptableContext<'line'>) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
                gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
                return gradient;
              },
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              borderWidth: 2,
            },
          ],
        });
      } catch (e) {
        setUnavailable(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [from, to]);

  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
  const tickColor = isDarkMode ? '#94a3b8' : '#94a3b8';
  const tooltipBg = isDarkMode ? '#1e293b' : '#0f172a';
  const tooltipText = '#f8fafc';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        padding: 12,
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13 },
        bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 14, weight: 700 },
        displayColors: false,
        callbacks: {
          label: (context: any) => `Rate: ${context.parsed.y.toFixed(4)}`
        }
      },
    },
    scales: {
      x: { 
        display: false,
        grid: { display: false } 
      },
      y: {
        display: true,
        grid: { color: gridColor },
        ticks: {
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
          color: tickColor
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
         <div className="h-6 w-6 border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 text-center">
         <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Chart unavailable for this pair</p>
         <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">Try major pairs like USD/EUR</p>
      </div>
    );
  }

  return (
    <div className="h-56 w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">30 Day Trend</h3>
        <span className="text-xs font-medium text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Live Market</span>
      </div>
      <div className="h-40 w-full">
         {chartData && <Line key={isDarkMode ? 'dark' : 'light'} data={chartData} options={options as any} />}
      </div>
    </div>
  );
};

export default RateChart;