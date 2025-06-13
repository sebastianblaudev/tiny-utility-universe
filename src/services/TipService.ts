
import { PaymentMethod } from '@/types';

export interface Tip {
  id: string;
  amount: number;
  barberId: string;
  barberName?: string;
  saleId?: string;
  paymentMethod: PaymentMethod;
  date: string;
  createdAt: string;
}

class TipService {
  private tips: Tip[] = [];

  async addTip(tip: Omit<Tip, 'id' | 'createdAt'>): Promise<Tip> {
    const newTip: Tip = {
      ...tip,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    
    this.tips.push(newTip);
    return newTip;
  }

  async getTips(): Promise<Tip[]> {
    return [...this.tips];
  }

  async getTipsByBarber(barberId: string): Promise<Tip[]> {
    return this.tips.filter(tip => tip.barberId === barberId);
  }

  async getTipsByDate(date: string): Promise<Tip[]> {
    return this.tips.filter(tip => tip.date === date);
  }

  async updateTip(tip: Tip): Promise<void> {
    const index = this.tips.findIndex(t => t.id === tip.id);
    if (index !== -1) {
      this.tips[index] = tip;
    }
  }

  async deleteTip(id: string): Promise<void> {
    this.tips = this.tips.filter(tip => tip.id !== id);
  }

  loadTips(tips: Tip[]): void {
    this.tips = [...tips];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}

export const tipService = new TipService();
