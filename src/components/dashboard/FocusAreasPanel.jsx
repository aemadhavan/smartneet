// File: src/components/dashboard/FocusAreasPanel.jsx
export default function FocusAreasPanel({ areas }) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
      <h3 className="font-medium text-blue-800 mb-2">Focus Areas</h3>
      <p className="text-blue-700 text-sm mb-3">
        These topics need more attention based on your performance:
      </p>
      <ul className="space-y-2">
        {areas.map((area, index) => (
          <li key={index} className="flex items-center text-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            {area.name} ({area.accuracy}% accuracy)
          </li>
        ))}
        {areas.length === 0 && (
          <li className="text-sm">No focus areas identified yet. Keep practicing!</li>
        )}
      </ul>
    </div>
  );
}