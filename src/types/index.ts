export type OSStatus = 'PENDING' | 'ANALYZING' | 'WAITING_PARTS' | 'REPAIRING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type OSPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface UsedPart {
  id: string;
  name: string;
  cost: number;
}

export interface ServiceOrder {
  id: string;
  protocol: string;
  orderNumber?: number;
  clientId: string;
  clientName: string;
  clientPhone: string;
  deviceModel: string;
  serialNumber?: string;
  problemDescription: string;
  status: OSStatus;
  priority: OSPriority;
  partsCost?: number;
  usedParts?: UsedPart[];
  laborCost?: number;
  discount?: number;
  totalCost: number;
  entryDate: string;
  deliveryDate?: string;
  updatedAt: string;
  images?: string[];
  createdBy?: string;
  accessories?: string[];
  physicalCondition?: string;
  contactNotes?: {
    id: string;
    date: string;
    text: string;
    author: string;
  }[];
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  cep?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  createdAt: string;
}
