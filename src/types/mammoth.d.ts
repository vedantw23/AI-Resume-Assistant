declare module 'mammoth' {
  interface ExtractRawTextResult {
    value: string;
    messages?: Array<{ message: string }>;
  }

  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractRawTextResult>;
}
