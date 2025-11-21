import * as z from 'zod/v4/core';

import type { DeepNullable } from './types';

export const generateEmptyObjectFromSchema = <Schema extends z.$ZodObject>(
  schema: Schema
): DeepNullable<z.infer<Schema>> => {
  const jsonSchema = toJSONSchema(schema);

  const parseJsonSchema = (
    jsonSchema: z.JSONSchema._JSONSchema
  ): ReturnType<typeof generateEmptyObjectFromSchema<Schema>> => {
    let result: Partial<DeepNullable<z.infer<Schema>>> = {};

    if (typeof jsonSchema === 'boolean') {
      return result as DeepNullable<z.infer<Schema>>;
    }

    for (const [key, value] of Object.entries(jsonSchema.properties ?? {})) {
      if (typeof value === 'boolean') {
        continue;
      }

      if (value.type === 'object' && value.properties) {
        result = {
          ...result,
          [key]: parseJsonSchema(value),
        };
        continue;
      }

      const isRequired = jsonSchema.required?.includes(key);
      const valueToSet = determineFieldStartingValue(value, isRequired);

      result = {
        ...result,
        [key]: valueToSet,
      };
    }

    return result as DeepNullable<z.infer<Schema>>;
  };

  return parseJsonSchema(jsonSchema);
};

export const toJSONSchema = <Schema extends z.$ZodObject>(
  schema: Schema
): z.JSONSchema._JSONSchema => {
  return z.toJSONSchema(schema, { io: 'input' });
};

export const determineFieldStartingValue = (
  field: z.JSONSchema.JSONSchema,
  isInRequiredArray?: boolean
): string | number | boolean | null | undefined => {
  if (field.default !== undefined) {
    return field.default as string | number;
  }

  if (field.nullable) {
    return null;
  }

  if (!isInRequiredArray) {
    return undefined;
  }

  switch (field.type) {
    case 'boolean':
      return false;
    default:
      return null;
  }
};
