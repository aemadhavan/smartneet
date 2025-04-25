// File: src/components/dashboard/StatCard.jsx
export default function StatCard({ icon, iconBgColor, label, value }) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${iconBgColor} mr-4`}>
            {icon}
          </div>
          <div>
            <p className="text-sm dark:text-gray-400 text-gray-500">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </div>
    );
  }