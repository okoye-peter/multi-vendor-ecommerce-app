declare module '@paystack/inline-js' {
  export default class Paystack {
    constructor();
    resumeTransaction(
      accessCode: string,
      callbacks: {
        onSuccess?: (transaction: { reference: string; [key: string]: unknown }) => void;
        onCancel?: () => void;
        onError?: (error: unknown) => void;
      }
    ): void;
    newTransaction(config: {
      key: string;
      email: string;
      amount: number;
      ref?: string;
      currency?: string;
      channels?: string[];
      callback?: (response: { reference: string; [key: string]: unknown }) => void;
      onClose?: () => void;
    }): void;
  }
}