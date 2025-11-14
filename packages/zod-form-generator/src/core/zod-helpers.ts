import * as z from "zod/v4/core";

export const generateEmptyObjectFromSchema = <Schema extends z.$ZodObject>(
  schema: Schema
): DeepNullable<z.infer<Schema>> => {
  const jsonSchema = z.toJSONSchema(schema, { io: "input" });

  const parseJsonSchema = (
    jsonSchema: z.JSONSchema._JSONSchema
  ): ReturnType<typeof generateEmptyObjectFromSchema<Schema>> => {
    let result: Partial<DeepNullable<z.infer<Schema>>> = {};

    if (typeof jsonSchema === "boolean")
      return result as DeepNullable<z.infer<Schema>>;

    for (const [key, value] of Object.entries(jsonSchema.properties ?? {})) {
      if (typeof value === "boolean") {
        continue;
      }

      if (value.type === "object" && value.properties) {
        result = {
          ...result,
          [key]: parseJsonSchema(value),
        };
        continue;
      }

      result = {
        ...result,
        [key]: null,
      };
    }

    return result as DeepNullable<z.infer<Schema>>;
  };

  return parseJsonSchema(jsonSchema);
};
