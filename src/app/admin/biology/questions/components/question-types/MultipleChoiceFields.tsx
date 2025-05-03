// src/app/admin/biology/questions/components/question-types/MultipleChoiceFields.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Option } from './TypeInterfaces';

interface MultipleChoiceFieldsProps {
  options: Option[];
  setOptions: React.Dispatch<React.SetStateAction<Option[]>>;
}

export default function MultipleChoiceFields({ options, setOptions }: MultipleChoiceFieldsProps) {
  // Handle option change with specific types
  const handleOptionChange = (index: number, field: keyof Option, value: string | boolean) => {
    const newOptions = [...options];
    
    // Type-safe approach to update fields based on their expected types
    if (field === 'option_number' || field === 'option_text') {
      if (typeof value === 'string') {
        newOptions[index][field] = value;
      }
    } else if (field === 'is_correct') {
      if (typeof value === 'boolean') {
        newOptions[index].is_correct = value;
      }
    }
    
    setOptions(newOptions);
  };

  // Add more options
  const addOption = () => {
    const newOption = { 
      option_number: String.fromCharCode(65 + options.length), // A, B, C, D...
      option_text: '', 
      is_correct: false 
    };
    setOptions([...options, newOption]);
  };

  // Remove options
  const removeOption = (index: number) => {
    if (options.length <= 2) return; // Keep at least 2 options
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Options</h3>
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          Add Option
        </Button>
      </div>
      
      {options.map((option, index) => (
        <div key={index} className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-1">
            <Input
              value={option.option_number}
              onChange={(e) => handleOptionChange(index, 'option_number', e.target.value)}
            />
          </div>
          <div className="col-span-9">
            <Textarea
              placeholder={`Option ${option.option_number}`}
              value={option.option_text}
              onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
            />
          </div>
          <div className="col-span-1 flex items-center justify-center">
            <Switch
              checked={option.is_correct}
              onCheckedChange={(checked) => {
                // For multiple choice, only one option can be correct
                const newOptions = options.map((opt, i) => ({
                  ...opt,
                  is_correct: i === index ? checked : false
                }));
                setOptions(newOptions);
              }}
            />
          </div>
          <div className="col-span-1">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => removeOption(index)}
              disabled={options.length <= 2}
            >
              ✕
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}