// File: src/components/dashboard/StrongAreasPanel.jsx
export default function StrongAreasPanel({ areas }) {
    return (
      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
        <h3 className="font-medium text-green-800 mb-2">Strong Areas</h3>
        <p className="text-green-700 text-sm mb-3">
          You&apos;re performing well in these topics:
        </p>
        <ul className="space-y-2">
          {areas.map((area, index) => (
            <li key={index} className="flex items-center text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {area.name} ({area.accuracy}% accuracy)
            </li>
          ))}
          {areas.length === 0 && (
            <li className="text-sm">No strong areas identified yet. Keep practicing!</li>
          )}
        </ul>
      </div>
    );
  }