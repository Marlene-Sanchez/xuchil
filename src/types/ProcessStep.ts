export interface ProcessStep {
    id: number;
    title: string;
    estimatedTime: number;
    hasInput: boolean;
    inputType?: "number" | "text";
    unit?: string;
    description?: string;
  }
