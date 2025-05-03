// src/app/admin/biology/questions/components/question-types/SequenceOrderingFields.tsx
import { Button } from "@/components/ui/button";
import { FormDescription, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SequenceItem, SequenceInfo } from './TypeInterfaces';

interface SequenceOrderingFieldsProps {
  sequenceItems: SequenceItem[];
  setSequenceItems: React.Dispatch<React.SetStateAction<SequenceItem[]>>;
  sequenceInfo: SequenceInfo;
  setSequenceInfo: React.Dispatch<React.SetStateAction<SequenceInfo>>;
}

export default function SequenceOrderingFields({ 
  sequenceItems, 
  setSequenceItems,
  sequenceInfo,
  setSequenceInfo
}: SequenceOrderingFieldsProps) {
  
  // Handle sequence item change
  const handleSequenceItemChange = (index: number, field: keyof SequenceItem, value: string | number) => {
    const newItems = [...sequenceItems];
    
    // Use a type-safe approach to update the field
    if (field === 'item_number') {
      if (typeof value === 'number') {
        newItems[index].item_number = value;
      } else {
        // Convert string to number if needed
        newItems[index].item_number = parseInt(value, 10);
      }
    } else if (field === 'item_label' || field === 'item_text') {
      if (typeof value === 'string') {
        newItems[index][field] = value;
      }
    }
    
    setSequenceItems(newItems);
  };
  
  // Add more sequence items
  const addSequenceItem = () => {
    const newItem = { 
      item_number: sequenceItems.length + 1,
      item_label: (sequenceItems.length + 1).toString(),
      item_text: '' 
    };
    setSequenceItems([...sequenceItems, newItem]);
  };
  
  // Remove sequence items
  const removeSequenceItem = (index: number) => {
    if (sequenceItems.length <= 2) return; // Keep at least 2 sequence items
    const newItems = [...sequenceItems];
    newItems.splice(index, 1);
    // Update item numbers for remaining items
    newItems.forEach((item, idx) => {
      item.item_number = idx + 1;
    });
    setSequenceItems(newItems);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Sequence Items</h3>
        <Button type="button" variant="outline" size="sm" onClick={addSequenceItem}>
          Add Item
        </Button>
      </div>
      
      <div className="space-y-2">
        <FormLabel>Introduction Text</FormLabel>
        <Textarea
          placeholder="Enter introductory text for the sequence question"
          value={sequenceInfo.intro_text}
          onChange={(e) => setSequenceInfo({ 
            ...sequenceInfo, 
            intro_text: e.target.value 
          })}
        />
      </div>
      
      {sequenceItems.map((item, index) => (
        <div key={index} className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-1">
            <Input
              value={item.item_label}
              onChange={(e) => handleSequenceItemChange(index, 'item_label', e.target.value)}
            />
          </div>
          <div className="col-span-9">
            <Textarea
              placeholder={`Item ${item.item_label}`}
              value={item.item_text}
              onChange={(e) => handleSequenceItemChange(index, 'item_text', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => removeSequenceItem(index)}
              disabled={sequenceItems.length <= 2}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      
      <div className="space-y-2">
        <FormLabel>Correct Sequence</FormLabel>
        <Input
          placeholder="Enter correct sequence (e.g. A,C,B,D)"
          value={sequenceInfo.correct_sequence}
          onChange={(e) => setSequenceInfo({ 
            ...sequenceInfo, 
            correct_sequence: e.target.value 
          })}
        />
        <FormDescription>
          Enter the correct sequence as a comma-separated list (e.g. A,C,B,D)
        </FormDescription>
      </div>
    </div>
  );
}