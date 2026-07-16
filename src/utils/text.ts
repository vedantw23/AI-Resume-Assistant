export function safeText(value: string | number | null | undefined): string {
  return String(value ?? '');
}
