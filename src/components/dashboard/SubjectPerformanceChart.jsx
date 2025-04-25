// File: src/components/dashboard/SubjectPerformanceChart.jsx
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
  } from 'recharts';
  
  export default function SubjectPerformanceChart({ data }) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold dark:text-white text-gray-800 mb-4">Subject Performance</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="accuracy" name="Accuracy %" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }