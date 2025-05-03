// src/app/admin/biology/questions/components/question-types/AssertionReasonFields.tsx
import { FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssertionReason } from './TypeInterfaces';

interface AssertionReasonFieldsProps {
  assertionReason: AssertionReason;
  setAssertionReason: React.Dispatch<React.SetStateAction<AssertionReason>>;
}

export default function AssertionReasonFields({ 
  assertionReason, 
  setAssertionReason 
}: AssertionReasonFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Assertion-Reason Format</h3>
      
      <div className="grid gap-4">
        <div className="space-y-2">
          <FormLabel>Assertion</FormLabel>
          <Textarea
            placeholder="Enter the assertion statement"
            value={assertionReason.assertion_text}
            onChange={(e) => setAssertionReason({ 
              ...assertionReason, 
              assertion_text: e.target.value 
            })}
          />
        </div>
        
        <div className="space-y-2">
          <FormLabel>Reason</FormLabel>
          <Textarea
            placeholder="Enter the reason statement"
            value={assertionReason.reason_text}
            onChange={(e) => setAssertionReason({ 
              ...assertionReason, 
              reason_text: e.target.value 
            })}
          />
        </div>
        
        <div className="space-y-2">
          <FormLabel>Correct Option</FormLabel>
          <Select
            value={assertionReason.correct_option || undefined}
            onValueChange={(value) => setAssertionReason({ 
              ...assertionReason, 
              correct_option: value 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select the correct option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A. Both Assertion and Reason are true and Reason is the correct explanation of Assertion</SelectItem>
              <SelectItem value="B">B. Both Assertion and Reason are true but Reason is not the correct explanation of Assertion</SelectItem>
              <SelectItem value="C">C. Assertion is true but Reason is false</SelectItem>
              <SelectItem value="D">D. Assertion is false but Reason is true</SelectItem>
              <SelectItem value="E">E. Both Assertion and Reason are false</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}