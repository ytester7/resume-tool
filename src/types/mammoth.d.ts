declare module 'mammoth/mammoth.browser.js' {
  export interface MammothMessage {
    type: string;
    message: string;
  }

  export interface MammothExtractResult {
    value: string;
    messages: MammothMessage[];
  }

  export interface Mammoth {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothExtractResult>;
  }

  const mammoth: Mammoth;
  export default mammoth;
}
