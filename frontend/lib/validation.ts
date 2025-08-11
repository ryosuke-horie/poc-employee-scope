import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

let validator: Ajv | null = null;
let validateFunction: any = null;
let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

const initializeValidator = async () => {
  if (validateFunction) return;
  if (initError) throw initError;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      console.log('Initializing AJV validator...');
      validator = new Ajv({ 
        allErrors: true, 
        strict: false,
        addUsedSchema: false,
        validateFormats: true
      });
      addFormats(validator);
      
      console.log('Fetching schema from /schemas/review.schema.json...');
      const response = await fetch('/schemas/review.schema.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
      }
      
      const schema = await response.json();
      console.log('Schema loaded successfully:', schema.$id || 'no $id');
      
      validateFunction = validator.compile(schema);
      console.log('Validator compiled successfully');
    } catch (error) {
      console.error('Failed to initialize validator:', error);
      initError = new Error('スキーマの読み込みに失敗しました');
      throw initError;
    }
  })();
  
  return initPromise;
};

export interface ValidationResult {
  valid: boolean;
  errors?: ErrorObject[];
}

export const validateReview = async (data: any): Promise<ValidationResult> => {
  try {
    await initializeValidator();
  } catch (error) {
    console.error('Validator initialization failed:', error);
    // 初期化に失敗しても、エラーを返すだけで処理を続行
    return {
      valid: false,
      errors: [{
        instancePath: '',
        schemaPath: '',
        keyword: 'initialization',
        params: {},
        message: 'スキーマの読み込みに失敗しました'
      } as ErrorObject]
    };
  }
  
  if (!validateFunction) {
    return {
      valid: false,
      errors: [{
        instancePath: '',
        schemaPath: '',
        keyword: 'initialization',
        params: {},
        message: 'バリデータが初期化されていません'
      } as ErrorObject]
    };
  }
  
  const valid = validateFunction(data);
  
  return {
    valid,
    errors: valid ? undefined : validateFunction.errors || []
  };
};