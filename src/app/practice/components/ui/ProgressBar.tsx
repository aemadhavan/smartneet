// File: src/app/practice/components/ui/ProgressBar.tsx
interface ProgressBarProps {
    current: number;
    total: number;
  }
  
  export function ProgressBar({ current, total }: ProgressBarProps) {
    const percentage = (current / total) * 100;
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div
          className="bg-indigo-600 h-2.5 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }