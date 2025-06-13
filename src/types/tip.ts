
import { PaymentMethod } from '@/types';

export interface Tip {
  amount: number;
  barberId: string;
  paymentMethod: PaymentMethod;
}

export interface TipSummary {
  barberId: string;
  barberName: string;
  totalAmount: number;
  tipsByMethod: {
    cash: number;
    card: number;
    transfer: number;
  };
}
