
export enum OperationType {
  RECEIPT = 'Incoming Receipt',
  DELIVERY = 'Delivery Order',
  INTERNAL = 'Internal Transfer',
  ADJUSTMENT = 'Inventory Adjustment'
}

export enum OperationStatus {
  DRAFT = 'Draft',
  WAITING = 'Waiting', // Added Waiting status
  READY = 'Ready',
  DONE = 'Done',
  CANCELLED = 'Cancelled'
}

export enum TrackingStrategy {
  NONE = 'No Tracking',
  LOT = 'By Lots',
  SERIAL = 'By Unique Serial Number'
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  uom: string;
  stockLevel: number; // On Hand (Total)
  locationStock?: Record<string, number>; // Detailed stock by location
  cost: number; // Added Cost
  location: string; // Default Location
  minStock: number;
  tracking: TrackingStrategy;
}

export interface StockMove {
  id: string;
  reference: string;
  type: OperationType;
  status: OperationStatus;
  contact?: string; // Added Contact (Vendor/Customer)
  scheduleDate?: string; // Added Schedule Date
  sourceLocation: string;
  destLocation: string;
  date: string; // Creation/Effective Date
  lines: StockMoveLine[];
}

export interface StockMoveLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  lotNumber?: string;
}

export interface KPIMetrics {
  totalProducts: number;
  lowStockItems: number;
  receiptsLate: number;
  receiptsToReceive: number;
  deliveriesLate: number;
  deliveriesToDeliver: number;
  deliveriesWaiting: number;
}
