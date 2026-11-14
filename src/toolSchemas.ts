import { z } from "zod";

type ToolRecord = {
  shape: Record<string, z.ZodTypeAny>;
  jsonSchema: Record<string, unknown>;
  handler: (args: any, extra?: any) => Promise<any> | any;
  enabled: boolean;
  disabledReason?: string;
};

const records = new Map<string, Map<string, ToolRecord>>();
const catalogSchemas = new Map<string, Record<string, unknown>>();

export function captureToolRegistration(
  sessionId: string | undefined,
  name: string,
  inputSchema: unknown,
  handler: (args: any, extra?: any) => Promise<any> | any,
): void {
  let shape: Record<string, z.ZodTypeAny> = {};
  try {
    shape =
      inputSchema && typeof inputSchema === "object"
        ? (inputSchema as Record<string, z.ZodTypeAny>)
        : {};
  } catch {
    shape = {};
  }

  let jsonSchema: Record<string, unknown>;
  try {
    jsonSchema = z.toJSONSchema(z.object(shape), {
      target: "draft-2020-12",
    }) as Record<string, unknown>;
  } catch {
    jsonSchema = {
      type: "object",
      properties: {},
      additionalProperties: false,
    };
  }

  // A missing session is retained under a shared catalog bucket. Runtime
  // registrations always use a session-specific record for execution.
  const bucketKey = sessionId || "__catalog__";
  let bucket = records.get(bucketKey);
  if (!bucket) {
    bucket = new Map<string, ToolRecord>();
    records.set(bucketKey, bucket);
  }
  bucket.set(name, { shape, jsonSchema, handler, enabled: false });
  catalogSchemas.set(name, jsonSchema);
}

export function setToolRegistrationEnabled(
  sessionId: string,
  name: string,
  enabled: boolean,
  disabledReason?: string,
): void {
  const record = records.get(sessionId)?.get(name);
  if (record) {
    record.enabled = enabled;
    record.disabledReason = enabled ? undefined : disabledReason;
  }
}

export function getToolInputSchema(name: string): Record<string, unknown> {
  return (
    catalogSchemas.get(name) || {
      type: "object",
      properties: {},
      additionalProperties: false,
    }
  );
}

export async function executeRegisteredTool(
  sessionId: string,
  name: string,
  args: unknown,
): Promise<unknown> {
  const record = records.get(sessionId)?.get(name);
  if (!record) throw new Error("The requested tool is not registered.");
  if (!record.enabled) {
    throw new Error(
      record.disabledReason ||
        "This tool is disabled by the selected key's permissions or provider configuration.",
    );
  }
  const validated = z.object(record.shape).parse(args ?? {});
  return await record.handler(validated, {
    signal: AbortSignal.timeout(120_000),
    sessionId,
  });
}

export function clearToolRegistrations(sessionId: string): void {
  records.delete(sessionId);
}
