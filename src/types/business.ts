
export interface BusinessData {
  id: string;
  name?: string;
  email?: string;
  createdAt?: Date;
  licenseKey?: string;
  isActive?: boolean;
  trialStarted?: Date;
  trialEndsAt?: Date;
  // Adding tax-related properties
  taxEnabled?: boolean;
  taxPercentage?: string;
}
