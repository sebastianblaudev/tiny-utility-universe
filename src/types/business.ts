
export interface BusinessData {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  licenseKey?: string;
  isActive?: boolean;
  trialStarted?: Date;
  trialEndsAt?: Date;
}
