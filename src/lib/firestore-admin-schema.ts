export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'millisTimestamp';

export interface FieldRule {
  type: FieldType;
  required?: boolean;
  min?: number; // for numbers
  max?: number; // for numbers
}

export interface CollectionSchema {
  fields: Record<string, FieldRule>;
}

// Optional: define per-collection schemas here (dev-only tooling)
const SCHEMAS: Record<string, CollectionSchema> = {
  // example:
  // ucs_ase: {
  //   fields: {
  //     valor: { type: 'number', required: true, min: 0 },
  //     timestamp: { type: 'millisTimestamp', required: true },
  //     fonte: { type: 'string' },
  //   },
  // },
};

export function getCollectionSchema(collectionId: string): CollectionSchema | undefined {
  return SCHEMAS[collectionId];
}

export function validateAgainstSchema(
  schema: CollectionSchema,
  data: Record<string, any>,
  opts?: { partial?: boolean }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const partial = !!opts?.partial;
  const fields = schema.fields || {};

  // required checks (skip if partial and field not present)
  for (const [name, rule] of Object.entries(fields)) {
    if (rule.required && !partial) {
      if (!(name in data)) errors.push(`Campo obrigatório ausente: ${name}`);
    }
  }

  for (const [name, value] of Object.entries(data)) {
    const rule = fields[name];
    if (!rule) continue; // unknown fields allowed by default

    const t = typeof value;
    switch (rule.type) {
      case 'string':
        if (value != null && t !== 'string') errors.push(`Campo ${name} deve ser string`);
        break;
      case 'number':
        if (value != null && t !== 'number') errors.push(`Campo ${name} deve ser number`);
        if (t === 'number') {
          if (rule.min != null && value < rule.min) errors.push(`Campo ${name} < min (${rule.min})`);
          if (rule.max != null && value > rule.max) errors.push(`Campo ${name} > max (${rule.max})`);
        }
        break;
      case 'boolean':
        if (value != null && t !== 'boolean') errors.push(`Campo ${name} deve ser boolean`);
        break;
      case 'object':
        if (value != null && (t !== 'object' || Array.isArray(value))) errors.push(`Campo ${name} deve ser objeto`);
        break;
      case 'array':
        if (value != null && !Array.isArray(value)) errors.push(`Campo ${name} deve ser array`);
        break;
      case 'millisTimestamp':
        if (value != null) {
          const isNum = typeof value === 'number' && isFinite(value);
          const looksMillis = isNum && value >= 1e12 && value <= 4102444800000;
          if (!looksMillis) errors.push(`Campo ${name} deve ser millis (timestamp)`);
        }
        break;
      default:
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}
