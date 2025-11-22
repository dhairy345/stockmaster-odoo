
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Product, StockMove, OperationType, OperationStatus, KPIMetrics } from '../types';
import { INITIAL_PRODUCTS, INITIAL_MOVES, LOCATIONS as INITIAL_LOCATIONS } from '../constants';

interface InventoryContextType {
  products: Product[];
  moves: StockMove[];
  locations: string[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addMove: (move: StockMove) => Promise<void>;
  updateMove: (move: StockMove) => Promise<void>;
  deleteMove: (id: string) => Promise<void>;
  validateMove: (moveId: string) => Promise<void>;
  checkAvailability: (moveId: string) => Promise<void>;
  addLocation: (location: string) => Promise<void>;
  removeLocation: (location: string) => Promise<void>;
  getKPIs: () => KPIMetrics;
  getFreeToUse: (productId: string) => number;
  resetData: () => void; // Added Reset
  isLoading: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: Fetch all data (Local Storage Only)
  const fetchData = async () => {
    setIsLoading(true);
    
    const localProds = localStorage.getItem('stock_products');
    const localMoves = localStorage.getItem('stock_moves');
    const localLocs = localStorage.getItem('stock_locations');

    setProducts(localProds ? JSON.parse(localProds) : INITIAL_PRODUCTS);
    setMoves(localMoves ? JSON.parse(localMoves) : INITIAL_MOVES);
    setLocations(localLocs ? JSON.parse(localLocs) : INITIAL_LOCATIONS);
    setIsLoading(false);
  };

  useEffect(() => {
      fetchData();
  }, []);

  const syncLocal = (key: string, data: any) => {
      localStorage.setItem(key, JSON.stringify(data));
  };

  const resetData = () => {
      setProducts(INITIAL_PRODUCTS);
      setMoves(INITIAL_MOVES);
      setLocations(INITIAL_LOCATIONS);
      syncLocal('stock_products', INITIAL_PRODUCTS);
      syncLocal('stock_moves', INITIAL_MOVES);
      syncLocal('stock_locations', INITIAL_LOCATIONS);
      alert("Data reset to demo defaults.");
  };

  const addProduct = async (product: Product) => {
    // Initialize location stock for new product
    const newProduct = {
        ...product,
        locationStock: product.stockLevel > 0 ? { [product.location]: product.stockLevel } : {}
    };
    const newProds = [...products, newProduct];
    setProducts(newProds);
    syncLocal('stock_products', newProds);
  };

  const updateProduct = async (product: Product) => {
    const newProds = products.map(p => p.id === product.id ? product : p);
    setProducts(newProds);
    syncLocal('stock_products', newProds);
  };

  const deleteProduct = async (id: string) => {
    const newProds = products.filter(p => p.id !== id);
    setProducts(newProds);
    syncLocal('stock_products', newProds);
  };

  const addMove = async (move: StockMove) => {
    const newMoves = [move, ...moves];
    setMoves(newMoves);
    syncLocal('stock_moves', newMoves);
  };

  const updateMove = async (move: StockMove) => {
    const newMoves = moves.map(m => m.id === move.id ? move : m);
    setMoves(newMoves);
    syncLocal('stock_moves', newMoves);
  };

  const deleteMove = async (id: string) => {
    const newMoves = moves.filter(m => m.id !== id);
    setMoves(newMoves);
    syncLocal('stock_moves', newMoves);
  };

  const addLocation = async (locationName: string) => {
      const newLocs = [...locations, locationName];
      setLocations(newLocs);
      syncLocal('stock_locations', newLocs);
  };

  const removeLocation = async (locationName: string) => {
      const newLocs = locations.filter(l => l !== locationName);
      setLocations(newLocs);
      syncLocal('stock_locations', newLocs);
  };

  // Helper to calculate reserved stock (In READY state outgoing moves)
  const getReservedStock = useCallback((productId: string) => {
    return moves
      .filter(m => m.status === OperationStatus.READY && m.type === OperationType.DELIVERY)
      .flatMap(m => m.lines)
      .filter(l => l.productId === productId)
      .reduce((acc, l) => acc + l.quantity, 0);
  }, [moves]);

  // Calculate Free To Use
  const getFreeToUse = useCallback((productId: string) => {
     const product = products.find(p => p.id === productId);
     if (!product) return 0;
     const reserved = getReservedStock(productId);
     return product.stockLevel - reserved;
  }, [products, getReservedStock]);

  // Check Availability Logic
  const checkAvailability = useCallback(async (moveId: string) => {
    const move = moves.find(m => m.id === moveId);
    if (!move || move.type !== OperationType.DELIVERY) return;

    let allAvailable = true;

    for (const line of move.lines) {
        const product = products.find(p => p.id === line.productId);
        // For availability check, we look at "Free To Use" excluding the current move if it was already reserved,
        // but simplest mock logic: Check if (Stock - ReservedByOthers) >= LineQuantity
        
        const reservedByOthers = moves
            .filter(m => m.status === OperationStatus.READY && m.type === OperationType.DELIVERY && m.id !== moveId)
            .flatMap(m => m.lines)
            .filter(l => l.productId === line.productId)
            .reduce((acc, l) => acc + l.quantity, 0);
        
        const available = (product?.stockLevel || 0) - reservedByOthers;
        
        if (available < line.quantity) {
            allAvailable = false;
        }
    }

    const newStatus = allAvailable ? OperationStatus.READY : OperationStatus.WAITING;
    const updatedMoves = moves.map(m => m.id === moveId ? { ...m, status: newStatus } : m);
    setMoves(updatedMoves);
    syncLocal('stock_moves', updatedMoves);
  }, [moves, products]);


  // Validate Move (Done)
  const validateMove = useCallback(async (moveId: string) => {
    const move = moves.find(m => m.id === moveId);
    if (!move || move.status === OperationStatus.DONE) return;

    // Update Products Logic
    let updatedProducts = [...products];
    
    for (const line of move.lines) {
        const prodIndex = updatedProducts.findIndex(p => p.id === line.productId);
        if (prodIndex === -1) continue;
        
        const product = updatedProducts[prodIndex];
        let newStock = product.stockLevel;
        
        // Location Stock Map (initialize if empty)
        const locStock = { ...(product.locationStock || {}) };
        
        // Define Internal/External logic
        // Assume locations starting with 'WH/' or 'Inventory Adjustment' are tracked, 
        // 'Vendor', 'Customer', 'Scrap' are considered external for stock counting purposes.
        // However, strictly speaking, we can just track quantities in ALL named locations.
        
        // 1. Decrease from Source
        if (locStock[move.sourceLocation]) {
             locStock[move.sourceLocation] -= line.quantity;
             if (locStock[move.sourceLocation] <= 0) delete locStock[move.sourceLocation];
        } else {
            // If stock wasn't tracked there but we are moving it, technically it goes negative or we ignore.
            // For this prototype, we allow negative temporary tracking if needed, or just ignore if source is 'Vendor'
             if (!['Vendor', 'Customer'].includes(move.sourceLocation)) {
                 // locStock[move.sourceLocation] = -line.quantity; 
                 // Let's not do negatives for now to keep UI clean, unless strictly needed.
             }
        }

        // 2. Increase at Dest
        if (!['Vendor', 'Customer', 'Scrap'].includes(move.destLocation)) {
             locStock[move.destLocation] = (locStock[move.destLocation] || 0) + line.quantity;
        }

        // 3. Update Global Stock Level (Only if crossing boundary of Internal Warehouse)
        const isIncoming = move.type === OperationType.RECEIPT || (move.destLocation.includes('WH/') && !move.sourceLocation.includes('WH/'));
        const isOutgoing = move.type === OperationType.DELIVERY || (move.sourceLocation.includes('WH/') && !move.destLocation.includes('WH/'));
        const isAdjustment = move.type === OperationType.ADJUSTMENT;

        if (isAdjustment) {
             if (move.sourceLocation === 'Inventory Adjustment') newStock += line.quantity;
             else newStock -= line.quantity;
        } else {
            // Internal transfers (WH -> WH) do not change global stock level, just locationStock
            const isInternal = move.sourceLocation.includes('WH/') && move.destLocation.includes('WH/');
            
            if (!isInternal) {
                if (isIncoming) newStock += line.quantity;
                else if (isOutgoing) newStock -= line.quantity;
            }
        }
        
        updatedProducts[prodIndex] = { 
            ...product, 
            stockLevel: newStock,
            locationStock: locStock 
        };
    }

    const updatedMoves = moves.map(m => m.id === moveId ? { ...m, status: OperationStatus.DONE } : m);
    
    setProducts(updatedProducts);
    setMoves(updatedMoves);
    syncLocal('stock_products', updatedProducts);
    syncLocal('stock_moves', updatedMoves);
  }, [moves, products]);

  const getKPIs = useCallback((): KPIMetrics => {
    const today = new Date().toISOString().split('T')[0];

    return {
      totalProducts: products.length,
      lowStockItems: products.filter(p => p.stockLevel <= p.minStock).length,
      
      receiptsLate: moves.filter(m => m.type === OperationType.RECEIPT && m.status !== OperationStatus.DONE && m.status !== OperationStatus.CANCELLED && (m.scheduleDate || '') < today).length,
      receiptsToReceive: moves.filter(m => m.type === OperationType.RECEIPT && (m.status === OperationStatus.READY || m.status === OperationStatus.DRAFT)).length,
      
      deliveriesLate: moves.filter(m => m.type === OperationType.DELIVERY && m.status !== OperationStatus.DONE && m.status !== OperationStatus.CANCELLED && (m.scheduleDate || '') < today).length,
      deliveriesToDeliver: moves.filter(m => m.type === OperationType.DELIVERY && m.status === OperationStatus.READY).length,
      deliveriesWaiting: moves.filter(m => m.type === OperationType.DELIVERY && (m.status === OperationStatus.WAITING || m.status === OperationStatus.DRAFT)).length
    };
  }, [products, moves]);

  return (
    <InventoryContext.Provider value={{ 
        products, moves, locations, 
        addProduct, updateProduct, deleteProduct, 
        addMove, updateMove, deleteMove, validateMove, checkAvailability,
        addLocation, removeLocation, 
        getKPIs, getFreeToUse, resetData, isLoading
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
