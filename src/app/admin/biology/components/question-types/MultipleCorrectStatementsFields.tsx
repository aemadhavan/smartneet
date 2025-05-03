// src/app/admin/biology/questions/components/question-types/MultipleCorrectStatementsFields.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Statement } from './TypeInterfaces';

interface MultipleCorrectStatementsFieldsProps {
  statements: Statement[];
  setStatements: React.Dispatch<React.SetStateAction<Statement[]>>;
}

export default function MultipleCorrectStatementsFields({ 
  statements, 
  setStatements 
}: MultipleCorrectStatementsFieldsProps) {
  
  // Handle statement change
  const handleStatementChange = (index: number, field: keyof Statement, value: string | boolean) => {
    const newStatements = [...statements];
    
    // Type-safe approach to update fields based on their expected types
    if (field === 'statement_label' || field === 'statement_text') {
      if (typeof value === 'string') {
        newStatements[index][field] = value;
      }
    } else if (field === 'is_correct') {
      if (typeof value === 'boolean') {
        newStatements[index].is_correct = value;
      }
    }
    
    setStatements(newStatements);
  };
  
  // Add more statements
  const addStatement = () => {
    const newStatement = { 
      statement_label: String.fromCharCode(65 + statements.length), // A, B, C, D...
      statement_text: '', 
      is_correct: false 
    };
    setStatements([...statements, newStatement]);
  };
  
  // Remove statements
  const removeStatement = (index: number) => {
    if (statements.length <= 2) return; // Keep at least 2 statements
    const newStatements = [...statements];
    newStatements.splice(index, 1);
    setStatements(newStatements);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Statements</h3>
        <Button type="button" variant="outline" size="sm" onClick={addStatement}>
          Add Statement
        </Button>
      </div>
      
      {statements.map((statement, index) => (
        <div key={index} className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-1">
            <Input
              value={statement.statement_label}
              onChange={(e) => handleStatementChange(index, 'statement_label', e.target.value)}
            />
          </div>
          <div className="col-span-9">
            <Textarea
              placeholder={`Statement ${statement.statement_label}`}
              value={statement.statement_text}
              onChange={(e) => handleStatementChange(index, 'statement_text', e.target.value)}
            />
          </div>
          <div className="col-span-1 flex items-center justify-center">
            <Switch
              checked={statement.is_correct}
              onCheckedChange={(checked) => handleStatementChange(index, 'is_correct', checked)}
            />
          </div>
          <div className="col-span-1">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => removeStatement(index)}
              disabled={statements.length <= 2}
            >
              ✕
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}