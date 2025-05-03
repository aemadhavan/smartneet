// src/app/admin/biology/questions/components/question-types/MatchingFields.tsx
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MatchingItem, MatchingHeaders } from './TypeInterfaces';

interface MatchingFieldsProps {
  matchingItems: MatchingItem[];
  setMatchingItems: React.Dispatch<React.SetStateAction<MatchingItem[]>>;
  matchingHeaders: MatchingHeaders;
  setMatchingHeaders: React.Dispatch<React.SetStateAction<MatchingHeaders>>;
}

export default function MatchingFields({ 
  matchingItems, 
  setMatchingItems,
  matchingHeaders,
  setMatchingHeaders
}: MatchingFieldsProps) {
  
  // Handle matching item change
  const handleMatchingItemChange = (index: number, field: keyof MatchingItem, value: string) => {
    const newItems = [...matchingItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setMatchingItems(newItems);
  };
  
  // Add more matching items
  const addMatchingItem = () => {
    const newItem = { 
      left_item_label: String.fromCharCode(65 + matchingItems.length), // A, B, C, D...
      left_item_text: '', 
      right_item_label: String.fromCharCode(80 + matchingItems.length), // P, Q, R, S...
      right_item_text: '' 
    };
    setMatchingItems([...matchingItems, newItem]);
  };
  
  // Remove matching items
  const removeMatchingItem = (index: number) => {
    if (matchingItems.length <= 2) return; // Keep at least 2 matching items
    const newItems = [...matchingItems];
    newItems.splice(index, 1);
    setMatchingItems(newItems);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Matching Items</h3>
        <Button type="button" variant="outline" size="sm" onClick={addMatchingItem}>
          Add Matching Pair
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormLabel>Left Column Header</FormLabel>
          <Input
            placeholder="Column A"
            value={matchingHeaders.left_column_header}
            onChange={(e) => setMatchingHeaders({ 
              ...matchingHeaders, 
              left_column_header: e.target.value 
            })}
          />
        </div>
        
        <div className="space-y-2">
          <FormLabel>Right Column Header</FormLabel>
          <Input
            placeholder="Column B"
            value={matchingHeaders.right_column_header}
            onChange={(e) => setMatchingHeaders({ 
              ...matchingHeaders, 
              right_column_header: e.target.value 
            })}
          />
        </div>
      </div>
      
      {matchingItems.map((item, index) => (
        <div key={index} className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-1">
            <Input
              value={item.left_item_label}
              onChange={(e) => handleMatchingItemChange(index, 'left_item_label', e.target.value)}
            />
          </div>
          <div className="col-span-4">
            <Textarea
              placeholder={`Left Item ${item.left_item_label}`}
              value={item.left_item_text}
              onChange={(e) => handleMatchingItemChange(index, 'left_item_text', e.target.value)}
            />
          </div>
          <div className="col-span-1">
            <Input
              value={item.right_item_label}
              onChange={(e) => handleMatchingItemChange(index, 'right_item_label', e.target.value)}
            />
          </div>
          <div className="col-span-4">
            <Textarea
              placeholder={`Right Item ${item.right_item_label}`}
              value={item.right_item_text}
              onChange={(e) => handleMatchingItemChange(index, 'right_item_text', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => removeMatchingItem(index)}
              disabled={matchingItems.length <= 2}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}