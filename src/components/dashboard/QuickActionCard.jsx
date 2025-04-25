// File: src/components/dashboard/QuickActionCard.jsx
import Link from 'next/link';

export default function QuickActionCard({ 
  href, 
  bgColor, 
  textColor, 
  icon, 
  title, 
  description, 
  descriptionColor 
}) {
  return (
    <Link 
      href={href}
      className={`block ${bgColor} p-4 rounded-md ${textColor}`}
    >
      <div className="flex items-center">
        {icon}
        <div>
          <p className="font-medium">{title}</p>
          <p className={`text-sm ${descriptionColor}`}>{description}</p>
        </div>
      </div>
    </Link>
  );
}