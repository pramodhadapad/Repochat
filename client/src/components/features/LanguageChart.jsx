/**
 * A simple horizontal bar chart showing language breakdown.
 * No external charting library needed — pure CSS.
 */
const LanguageChart = ({ languages }) => {
  if (!languages || languages.length === 0) {
    return (
      <div className="text-xs text-slate-500 italic">No language data available</div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
        {languages.map((lang) => (
          <div
            key={lang.ext}
            className="h-full transition-all duration-500"
            style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
            title={`${lang.name}: ${lang.percentage}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {languages.map((lang) => (
          <div key={lang.ext} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: lang.color }}
            />
            <span className="font-medium">{lang.name}</span>
            <span className="text-slate-600">{lang.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageChart;
