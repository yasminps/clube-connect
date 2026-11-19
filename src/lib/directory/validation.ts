const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (input: unknown): input is string => typeof input === "string" && uuid.test(input);
export const unitColors = ["purple", "blue", "green", "orange"] as const;

export function isDate(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const value = new Date(input + "T00:00:00Z");
  return !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === input;
}
export function readField(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}
export type DirectoryState = { error?: string; success?: string };
