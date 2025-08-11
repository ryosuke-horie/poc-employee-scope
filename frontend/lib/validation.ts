import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

let validator: Ajv | null = null;
let validateFunction: any = null;

const initializeValidator = async () => {
  if (validator) return;
  
  validator = new Ajv({ allErrors: true, strict: false });
  addFormats(validator);
  
  try {
    const response = await fetch('/schemas/review.schema.json');
    const schema = await response.json();
    validateFunction = validator.compile(schema);
  } catch (error) {
    console.error('Failed to load schema:', error);
    throw new Error('スキーマの読み込みに失敗しました');
  }
};

export interface ValidationResult {
  valid: boolean;
  errors?: ErrorObject[];
}

export const validateReview = async (data: any): Promise<ValidationResult> => {
  await initializeValidator();
  
  if (!validateFunction) {
    throw new Error('バリデータが初期化されていません');
  }
  
  const valid = validateFunction(data);
  
  return {
    valid,
    errors: valid ? undefined : validateFunction.errors || []
  };
};