// File: src/components/dashboard/PerformanceChart.jsx
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
  } from 'recharts';
  
  export default function PerformanceChart({ data }) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold dark:text-white text-gray-800 mb-4">Performance Overview</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="accuracy" stroke="#10b981" name="Accuracy %" />
              <Line type="monotone" dataKey="score" stroke="#6366f1" name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }