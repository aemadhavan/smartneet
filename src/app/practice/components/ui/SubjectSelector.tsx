// File: src/app/practice/components/ui/SubjectSelector.tsx
import { Subject } from '@/app/practice/types';

interface SubjectSelectorProps {
  subjects: Subject[];
  onSelect: (subject: Subject) => void;
}

export function SubjectSelector({ subjects, onSelect }: SubjectSelectorProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Select a Subject</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.subject_id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition duration-200 cursor-pointer"
            onClick={() => onSelect(subject)}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{subject.subject_name}</h2>
            <p className="text-sm text-gray-500">{subject.subject_code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}