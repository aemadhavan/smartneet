// File: src/components/dashboard/LoadingSpinner.jsx
export default function LoadingSpinner({ message = "Loading..." }) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg dark:text-gray-300 text-gray-600">{message}</p>
        </div>
      </div>
    );
  }