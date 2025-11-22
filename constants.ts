
import { Product, OperationType, OperationStatus, StockMove, TrackingStrategy } from './types';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

export const INITIAL_PRODUCTS: Product[] = [
  // Furniture
  { id: 'p1', name: 'Office Desk', sku: 'FURN-DESK-001', category: 'Furniture', uom: 'Units', stockLevel: 45, cost: 120, location: 'WH/Stock', minStock: 10, tracking: TrackingStrategy.NONE, locationStock: { 'WH/Stock': 45 } },
  { id: 'p2', name: 'Ergonomic Chair', sku: 'FURN-CHAIR-PRO', category: 'Furniture', uom: 'Units', stockLevel: 12, cost: 250, location: 'WH/Stock', minStock: 15, tracking: TrackingStrategy.NONE, locationStock: { 'WH/Stock': 10, 'WH/Showroom': 2 } },
  { id: 'p3', name: 'Conference Table', sku: 'FURN-TABLE-CONF', category: 'Furniture', uom: 'Units', stockLevel: 3, cost: 800, location: 'WH/Stock', minStock: 2, tracking: TrackingStrategy.NONE, locationStock: { 'WH/Stock': 3 } },
  { id: 'p4', name: 'Bookshelf', sku: 'FURN-SHELF-01', category: 'Furniture', uom: 'Units', stockLevel: 20, cost: 80, location: 'WH/Stock', minStock: 5, tracking: TrackingStrategy.NONE, locationStock: { 'WH/Stock': 20 } },

  // Electronics
  { id: 'p5', name: 'Monitor 27"', sku: 'ELEC-MON-27', category: 'Electronics', uom: 'Units', stockLevel: 30, cost: 220, location: 'WH/Stock', minStock: 10, tracking: TrackingStrategy.SERIAL, locationStock: { 'WH/Stock': 30 } },
  { id: 'p6', name: 'Mechanical Keyboard', sku: 'ELEC-KB-MECH', category: 'Electronics', uom: 'Units', stockLevel: 50, cost: 90, location: 'WH/Stock', minStock: 20, tracking: TrackingStrategy.SERIAL, locationStock: { 'WH/Stock': 50 } },
  { id: 'p7', name: 'Wireless Mouse', sku: 'ELEC-MOUSE-WL', category: 'Electronics', uom: 'Units', stockLevel: 75, cost: 40, location: 'WH/Stock', minStock: 25, tracking: TrackingStrategy.NONE, locationStock: { 'WH/Stock': 75 } },
  { id: 'p8', name: 'Docking Station', sku: 'ELEC-DOCK-USBC', category: 'Electronics', uom: 'Units', stockLevel: 15, cost: 150, location: 'WH/Stock', minStock: 5, tracking: TrackingStrategy.SERIAL, locationStock: { 'WH/Stock': 15 } },

  // Consumables / Raw
  { id: 'p9', name: 'Packing Tape', sku: 'MAT-TAPE-01', category: 'Consumables', uom: 'Rolls', stockLevel: 200, cost: 2, location: 'WH/Stock', minStock: 50, tracking: TrackingStrategy.LOT, locationStock: { 'WH/Stock': 150, 'WH/Packing': 50 } },
  { id: 'p10', name: 'Cardboard Box (L)', sku: 'MAT-BOX-L', category: 'Consumables', uom: 'Units', stockLevel: 500, cost: 1.5, location: 'WH/Stock', minStock: 100, tracking: TrackingStrategy.NONE, locationStock: { 'WH/Stock': 500 } },
  { id: 'p11', name: 'Steel Rod 10mm', sku: 'RAW-ST-10', category: 'Raw Material', uom: 'Meters', stockLevel: 100, cost: 15, location: 'WH/Stock', minStock: 20, tracking: TrackingStrategy.LOT, locationStock: { 'WH/Stock': 100 } },
  { id: 'p12', name: 'Pine Wood Plank', sku: 'RAW-WOOD-PINE', category: 'Raw Material', uom: 'Units', stockLevel: 0, cost: 25, location: 'WH/Stock', minStock: 40, tracking: TrackingStrategy.LOT, locationStock: {} },
];

export const INITIAL_MOVES: StockMove[] = [
  // --- PAST DONE MOVES ---
  {
    id: 'm1',
    reference: 'WH/IN/0001',
    type: OperationType.RECEIPT,
    status: OperationStatus.DONE,
    contact: 'Azure Interior',
    scheduleDate: lastWeek,
    sourceLocation: 'Vendor',
    destLocation: 'WH/Stock',
    date: lastWeek,
    lines: [{ id: 'l1', productId: 'p1', productName: 'Office Desk', quantity: 50 }]
  },
  {
    id: 'm2',
    reference: 'WH/IN/0002',
    type: OperationType.RECEIPT,
    status: OperationStatus.DONE,
    contact: 'Tech Solutions Inc.',
    scheduleDate: lastWeek,
    sourceLocation: 'Vendor',
    destLocation: 'WH/Stock',
    date: lastWeek,
    lines: [{ id: 'l2', productId: 'p5', productName: 'Monitor 27"', quantity: 30, lotNumber: 'SN-MON-0998' }]
  },
  {
    id: 'm3',
    reference: 'WH/OUT/0001',
    type: OperationType.DELIVERY,
    status: OperationStatus.DONE,
    contact: 'Deco Addict',
    scheduleDate: lastWeek,
    sourceLocation: 'WH/Stock',
    destLocation: 'Customer',
    date: lastWeek,
    lines: [{ id: 'l3', productId: 'p1', productName: 'Office Desk', quantity: 5 }]
  },

  // --- READY DELIVERIES (To Deliver) ---
  {
    id: 'm4',
    reference: 'WH/OUT/0005',
    type: OperationType.DELIVERY,
    status: OperationStatus.READY,
    contact: 'Gemini Furniture',
    scheduleDate: tomorrow,
    sourceLocation: 'WH/Stock',
    destLocation: 'Customer',
    date: today,
    lines: [{ id: 'l4', productId: 'p2', productName: 'Ergonomic Chair', quantity: 2 }] // Available (Stock 12)
  },
  {
    id: 'm5',
    reference: 'WH/OUT/0006',
    type: OperationType.DELIVERY,
    status: OperationStatus.READY,
    contact: 'StartUp Hub',
    scheduleDate: today,
    sourceLocation: 'WH/Stock',
    destLocation: 'Customer',
    date: today,
    lines: [{ id: 'l5', productId: 'p7', productName: 'Wireless Mouse', quantity: 10 }] // Available (Stock 75)
  },

  // --- WAITING DELIVERIES (Waiting for Stock) ---
  {
    id: 'm6',
    reference: 'WH/OUT/0007',
    type: OperationType.DELIVERY,
    status: OperationStatus.WAITING,
    contact: 'MegaCorp',
    scheduleDate: nextWeek,
    sourceLocation: 'WH/Stock',
    destLocation: 'Customer',
    date: today,
    lines: [{ id: 'l6', productId: 'p3', productName: 'Conference Table', quantity: 5 }] // Not Available (Stock 3)
  },
  {
    id: 'm7',
    reference: 'WH/OUT/0008',
    type: OperationType.DELIVERY,
    status: OperationStatus.WAITING,
    contact: 'WoodWorks',
    scheduleDate: tomorrow,
    sourceLocation: 'WH/Stock',
    destLocation: 'Customer',
    date: today,
    lines: [{ id: 'l7', productId: 'p12', productName: 'Pine Wood Plank', quantity: 20, lotNumber: 'LOT-WD-44' }] // Not Available (Stock 0)
  },

  // --- LATE DELIVERIES ---
  {
    id: 'm8',
    reference: 'WH/OUT/0004',
    type: OperationType.DELIVERY,
    status: OperationStatus.READY,
    contact: 'Late Customer LLC',
    scheduleDate: yesterday, // LATE
    sourceLocation: 'WH/Stock',
    destLocation: 'Customer',
    date: lastWeek,
    lines: [{ id: 'l8', productId: 'p6', productName: 'Mechanical Keyboard', quantity: 1, lotNumber: 'SN-KB-1122' }]
  },

  // --- RECEIPTS TO PROCESS ---
  {
    id: 'm9',
    reference: 'WH/IN/0010',
    type: OperationType.RECEIPT,
    status: OperationStatus.READY,
    contact: 'Raw Materials Co.',
    scheduleDate: today,
    sourceLocation: 'Vendor',
    destLocation: 'WH/Stock',
    date: today,
    lines: [{ id: 'l9', productId: 'p12', productName: 'Pine Wood Plank', quantity: 100, lotNumber: 'LOT-WD-55' }]
  },
  {
    id: 'm10',
    reference: 'WH/IN/0011',
    type: OperationType.RECEIPT,
    status: OperationStatus.DRAFT,
    contact: 'Office Supplies Ltd.',
    scheduleDate: nextWeek,
    sourceLocation: 'Vendor',
    destLocation: 'WH/Stock',
    date: today,
    lines: [{ id: 'l10', productId: 'p9', productName: 'Packing Tape', quantity: 50, lotNumber: 'LOT-TP-88' }]
  },

  // --- LATE RECEIPT ---
  {
    id: 'm11',
    reference: 'WH/IN/0009',
    type: OperationType.RECEIPT,
    status: OperationStatus.READY,
    contact: 'Global Imports',
    scheduleDate: yesterday, // LATE
    sourceLocation: 'Vendor',
    destLocation: 'WH/Stock',
    date: lastWeek,
    lines: [{ id: 'l11', productId: 'p4', productName: 'Bookshelf', quantity: 10 }]
  }
];

export const LOCATIONS = [
  'Vendor',
  'Customer',
  'WH/Stock',
  'WH/Input',
  'WH/Output',
  'WH/Packing',
  'WH/Showroom',
  'WH/Production',
  'Inventory Adjustment',
  'Scrap'
];
