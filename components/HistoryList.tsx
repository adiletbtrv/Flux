import React from 'react';

export interface HistoryItem {
  id: string;
  from: string;
  to: string;
  amountFrom: string;
  amountTo: string;
  date: string;
}

interface HistoryListProps {
  history: HistoryItem[];
  onClear: () => void;
  onRestore: (item: HistoryItem) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onClear, onRestore }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No recent history</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs">Your calculations will appear here</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Recent Activity</h3>
        <button onClick={onClear} className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors">
          Clear All
        </button>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto hide-scrollbar">
        {history.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onRestore(item)}
            className="group flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md cursor-pointer transition-all duration-200"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
                <span>{item.amountFrom} <span className="text-xs text-slate-400 dark:text-slate-500">{item.from}</span></span>
                <svg className="h-3 w-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="text-indigo-600 dark:text-indigo-400">{item.amountTo} <span className="text-xs text-indigo-300 dark:text-indigo-900">{item.to}</span></span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{item.date}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="h-4 w-4 text-indigo-400 dark:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;