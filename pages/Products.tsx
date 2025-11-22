
import React, { useState, useEffect, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product, OperationType, StockMove, OperationStatus, TrackingStrategy } from '../types';
import { Plus, Search, Filter, MoreHorizontal, Package, AlertCircle, X, Trash2, Edit2, BarChart3, Minus, RefreshCw, ScanBarcode, Hash, Box, Check, Map, MapPin, ArrowLeft, History, TrendingUp, Wallet, Calendar } from 'lucide-react';
import { ScannerModal } from '../components/ScannerModal';

interface ProductsProps {
    initialParams?: {
        filter?: string;
    }
}

export const Products: React.FC<ProductsProps> = ({ initialParams }) => {
  const { products, addProduct, updateProduct, deleteProduct, locations, getFreeToUse, addMove, moves } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [isStockMapOpen, setIsStockMapOpen] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Detail View State
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);
  const viewingProduct = useMemo(() => products.find(p => p.id === viewingProductId), [products, viewingProductId]);
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // State for Quick Qty Update
  const [qtyUpdateValue, setQtyUpdateValue] = useState<number>(0);

  useEffect(() => {
    if (initialParams?.filter) {
        setSearchTerm(initialParams.filter);
        if (initialParams.filter === 'lowStock') {
            setSearchTerm('');
            setShowLowStock(true);
        }
    }
  }, [initialParams]);

  // Debounce Search Term
  useEffect(() => {
      const handler = setTimeout(() => {
          setDebouncedSearchTerm(searchTerm);
      }, 300);
      return () => clearTimeout(handler);
  }, [searchTerm]);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', sku: '', category: 'Raw Material', uom: 'Units', stockLevel: 0, minStock: 0, location: 'WH/Stock', cost: 0, tracking: TrackingStrategy.NONE
  });

  // Optimized Filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const lowerTerm = debouncedSearchTerm.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(lowerTerm) || 
                              p.sku.toLowerCase().includes(lowerTerm);
        const matchesStock = showLowStock ? p.stockLevel <= p.minStock : true;
        return matchesSearch && matchesStock;
      });
  }, [products, debouncedSearchTerm, showLowStock]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const openCreateModal = () => {
      setNewProduct({ name: '', sku: '', category: 'Raw Material', uom: 'Units', stockLevel: 0, minStock: 0, location: 'WH/Stock', cost: 0, tracking: TrackingStrategy.NONE });
      setIsEditMode(false);
      setIsModalOpen(true);
  };

  const openEditModal = (product: Product, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setNewProduct(product);
      setIsEditMode(true);
      setIsModalOpen(true);
  };
  
  const openQtyModal = (product: Product, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedProduct(product);
      setQtyUpdateValue(product.stockLevel);
      setIsQtyModalOpen(true);
      setActiveDropdown(null);
  };

  // NOTE: Stock Map Modal is largely replaced by Detail View, but kept for compatibility if needed elsewhere
  const openStockMap = (product: Product, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedProduct(product);
      setIsStockMapOpen(true);
      setActiveDropdown(null);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if(window.confirm('Are you sure you want to delete this product?')) {
          deleteProduct(id);
          setActiveDropdown(null);
          if (viewingProductId === id) setViewingProductId(null);
          showNotification('Product deleted successfully');
      }
  };

  const adjustQty = (amount: number) => {
      setQtyUpdateValue(prev => Math.max(0, prev + amount));
  };

  const handleQtyUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProduct) return;
      
      const diff = qtyUpdateValue - selectedProduct.stockLevel;
      if (diff === 0) { setIsQtyModalOpen(false); return; }

      // Create an Adjustment Move to track this change
      const move: StockMove = {
          id: `m${Date.now()}`,
          reference: `INV/ADJ/${Date.now().toString().slice(-4)}`,
          type: OperationType.ADJUSTMENT,
          status: OperationStatus.DONE, // Instant adjustment
          sourceLocation: diff > 0 ? 'Inventory Adjustment' : 'WH/Stock',
          destLocation: diff > 0 ? 'WH/Stock' : 'Inventory Adjustment',
          date: new Date().toISOString().split('T')[0],
          lines: [{
              id: `l${Date.now()}`,
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              quantity: Math.abs(diff),
              lotNumber: selectedProduct.tracking !== TrackingStrategy.NONE ? 'Auto-Adj' : undefined
          }]
      };

      await addMove(move);
      
      // Manual update for immediate reflection in simple context logic
      const currentLocStock = { ...(selectedProduct.locationStock || {}) };
      const targetLoc = 'WH/Stock'; // Default adjust location
      currentLocStock[targetLoc] = (currentLocStock[targetLoc] || 0) + diff;
      if (currentLocStock[targetLoc] <= 0) delete currentLocStock[targetLoc];

      await updateProduct({ 
          ...selectedProduct, 
          stockLevel: qtyUpdateValue,
          locationStock: currentLocStock
      });
      
      setIsQtyModalOpen(false);
      showNotification(`Stock updated for ${selectedProduct.name}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.name && newProduct.sku) {
      if (isEditMode) {
          updateProduct(newProduct as Product);
          showNotification(`Product "${newProduct.name}" updated`);
      } else {
          addProduct({
            ...newProduct,
            id: `p${Date.now()}`,
            stockLevel: Number(newProduct.stockLevel),
            minStock: Number(newProduct.minStock),
            cost: Number(newProduct.cost)
          } as Product);
          showNotification(`Product "${newProduct.name}" created`);
      }
      setIsModalOpen(false);
      setNewProduct({ name: '', sku: '', category: 'Raw Material', uom: 'Units', stockLevel: 0, minStock: 0, location: 'WH/Stock', cost: 0, tracking: TrackingStrategy.NONE });
    }
  };

  const getTrackingIcon = (strategy: TrackingStrategy) => {
      switch (strategy) {
          case TrackingStrategy.SERIAL: return <ScanBarcode size={16} className="text-violet-500" />;
          case TrackingStrategy.LOT: return <Hash size={16} className="text-blue-500" />;
          default: return <Box size={16} className="text-slate-400" />;
      }
  };

  return (
    <div className="space-y-8 pb-20" onClick={() => setActiveDropdown(null)}>
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-8 right-8 z-[120] animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-none">
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl bg-slate-900 text-white font-bold border border-slate-800">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-emerald-500 text-emerald-900' : 'bg-red-500 text-white'}`}>
                    {notification.type === 'success' ? <Check size={18} strokeWidth={3} /> : <AlertCircle size={18} strokeWidth={3} />}
                </div>
                <p>{notification.message}</p>
            </div>
        </div>
      )}

      {/* Scanner Modal */}
      {isScannerOpen && (
          <ScannerModal 
            onScan={(result) => {
                setSearchTerm(result);
                setIsScannerOpen(false);
                showNotification(`Scanned: ${result}`);
            }}
            onClose={() => setIsScannerOpen(false)}
          />
      )}

      {/* Toggle between Detail View and List View */}
      {viewingProductId && viewingProduct ? (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Detail View Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                <button onClick={() => setViewingProductId(null)} className="self-start p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">{viewingProduct.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono font-bold text-slate-500">{viewingProduct.sku}</span>
                        {viewingProduct.tracking !== TrackingStrategy.NONE && (
                            <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-bold flex items-center gap-1">
                                <Hash size={10}/> {viewingProduct.tracking}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 self-end md:self-auto">
                    <button onClick={(e) => openQtyModal(viewingProduct, e)} className="p-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-200 flex items-center gap-2 active:scale-95 transition-transform">
                        <RefreshCw size={18} /> <span className="hidden md:inline">Adjust Stock</span>
                    </button>
                    <button onClick={(e) => openEditModal(viewingProduct, e)} className="p-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-transform">
                        <Edit2 size={18} />
                    </button>
                    <button onClick={(e) => handleDelete(viewingProduct.id, e)} className="p-3 bg-white border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-50 active:scale-95 transition-transform">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Stock Level */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Package size={100} /></div>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-1">Total On Hand</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-slate-900">{viewingProduct.stockLevel}</span>
                        <span className="text-sm font-bold text-slate-400 mb-1.5">{viewingProduct.uom}</span>
                    </div>
                    <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${viewingProduct.stockLevel <= viewingProduct.minStock ? 'text-red-500' : 'text-emerald-500'}`}>
                        {viewingProduct.stockLevel <= viewingProduct.minStock ? <AlertCircle size={12} /> : <TrendingUp size={12} />}
                        {viewingProduct.stockLevel <= viewingProduct.minStock ? 'Below Min Stock' : 'Stock Healthy'}
                    </p>
                </div>

                {/* Valuation */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet size={100} /></div>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-1">Inventory Value</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-slate-900">${(viewingProduct.stockLevel * viewingProduct.cost).toLocaleString()}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-2">
                        @ ${viewingProduct.cost} per {viewingProduct.uom.toLowerCase()}
                    </p>
                </div>
                
                {/* Availability */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Check size={100} /></div>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-1">Available to Promise</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-emerald-600">{getFreeToUse(viewingProduct.id)}</span>
                        <span className="text-sm font-bold text-emerald-600/50 mb-1.5">{viewingProduct.uom}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-2">
                        {viewingProduct.stockLevel - getFreeToUse(viewingProduct.id)} units reserved
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Location Stock Breakdown */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 h-fit">
                    <h3 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2"><MapPin size={20} className="text-violet-500" /> Stock by Location</h3>
                    <div className="space-y-3">
                        {viewingProduct.locationStock && Object.entries(viewingProduct.locationStock).length > 0 ? (
                            Object.entries(viewingProduct.locationStock).map(([loc, qty]) => (
                                <div key={loc} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-slate-400">
                                            <Box size={14} />
                                        </div>
                                        <span className="font-bold text-slate-700 text-sm">{loc}</span>
                                    </div>
                                    <span className="font-black text-slate-900">{qty} <span className="text-xs text-slate-400 font-medium">{viewingProduct.uom}</span></span>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 bg-slate-50 rounded-2xl text-center border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold text-sm">No distributed stock data.</p>
                                <p className="text-xs text-slate-400 mt-1">All stock is considered in default location.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Moves */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                         <h3 className="font-black text-slate-900 text-lg flex items-center gap-2"><History size={20} className="text-blue-500" /> Stock History</h3>
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last movements</span>
                    </div>
                    
                    <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {moves.filter(m => m.lines.some(l => l.productId === viewingProduct.id)).length === 0 ? (
                            <div className="text-center p-12 bg-slate-50 rounded-3xl">
                                <div className="inline-flex p-4 bg-white rounded-full text-slate-300 mb-3 shadow-sm"><Calendar size={24} /></div>
                                <p className="text-slate-500 font-bold">No movement history found.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="text-xs font-black text-slate-400 uppercase bg-white sticky top-0 z-10">
                                    <tr>
                                        <th className="pb-4">Date</th>
                                        <th className="pb-4">Reference</th>
                                        <th className="pb-4">Source / Destination</th>
                                        <th className="pb-4 text-right">Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {moves
                                        .filter(m => m.lines.some(l => l.productId === viewingProduct.id))
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map(move => {
                                            const line = move.lines.find(l => l.productId === viewingProduct.id);
                                            if (!line) return null;
                                            
                                            // Determine direction logic
                                            const isInc = move.type === OperationType.RECEIPT || move.destLocation.includes('WH/Stock');
                                            
                                            return (
                                                <tr key={move.id} className="border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 font-medium text-slate-500 align-top w-28">{move.date}</td>
                                                    <td className="py-4 font-bold text-slate-700 align-top">
                                                        <span className="block text-slate-900">{move.reference}</span>
                                                        <span className="text-xs font-bold text-slate-400 uppercase">{move.type.replace('Incoming ','').replace(' Order','')}</span>
                                                    </td>
                                                    <td className="py-4 align-top">
                                                        <div className="flex flex-col gap-1 text-xs font-bold">
                                                            <div className="flex items-center gap-2 text-slate-500">
                                                                <span className="w-8 text-slate-300 uppercase text-[10px]">From</span> {move.sourceLocation}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-500">
                                                                <span className="w-8 text-slate-300 uppercase text-[10px]">To</span> {move.destLocation}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={`py-4 text-right font-black text-lg align-top ${isInc ? 'text-emerald-500' : 'text-slate-800'}`}>
                                                        {isInc ? '+' : '-'}{line.quantity}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <>
          {/* List View Hero & Stats */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Products</h2>
                  <p className="text-slate-500 font-medium">Manage your inventory master data</p>
              </div>
              <button 
                onClick={openCreateModal}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-bold shadow-xl shadow-slate-900/20 flex items-center gap-3 transition-all active:scale-95"
              >
                <Plus size={20} />
                Create New
              </button>
          </div>

          {/* Search Bar - Big Touch Target */}
          <div className="relative w-full group mb-6">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                
                <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-slate-100 hover:bg-violet-100 text-slate-400 hover:text-violet-600 rounded-xl transition-all"
                    title="Scan Barcode"
                >
                    <ScanBarcode size={20} />
                </button>

                <input 
                    type="text" 
                    placeholder="Scan or Search Products..."
                    className="w-full pl-14 pr-16 py-5 rounded-2xl border-2 border-slate-200 bg-white shadow-sm text-slate-900 focus:ring-4 focus:ring-violet-100 focus:border-violet-500 outline-none font-bold text-lg transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
          </div>

          {/* Table View */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                          <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Product</th>
                          <th className="hidden md:table-cell p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Tracking</th>
                          <th className="hidden md:table-cell p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Cost</th>
                          <th className="p-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">On Hand</th>
                          <th className="hidden md:table-cell p-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Free To Use</th>
                          <th className="p-6 w-10"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map(product => (
                          <tr key={product.id} className="hover:bg-slate-50 group transition-colors cursor-pointer" onClick={() => setViewingProductId(product.id)}>
                              <td className="p-6">
                                  <div>
                                      <p className="font-bold text-slate-900 text-lg">{product.name}</p>
                                      <p className="text-sm text-slate-500 font-mono mt-1 bg-slate-100 inline-block px-2 rounded">{product.sku}</p>
                                  </div>
                              </td>
                              <td className="hidden md:table-cell p-6">
                                 <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                    {getTrackingIcon(product.tracking || TrackingStrategy.NONE)}
                                    <span>{product.tracking === TrackingStrategy.SERIAL ? 'Unique Serial' : product.tracking === TrackingStrategy.LOT ? 'Lots / Batches' : 'No Tracking'}</span>
                                 </div>
                              </td>
                              <td className="hidden md:table-cell p-6 font-medium text-slate-600">${product.cost?.toLocaleString()}</td>
                              <td className="p-6 text-right">
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        {/* Location Stock Indicator */}
                                        {product.locationStock && Object.keys(product.locationStock).length > 1 && (
                                            <div 
                                                className="text-violet-600 bg-violet-50 p-1 rounded"
                                                title="Multiple Locations"
                                            >
                                                <Map size={14} />
                                            </div>
                                        )}
                                        <span className={`font-black text-xl ${product.stockLevel <= product.minStock ? 'text-red-500' : 'text-slate-900'}`}>
                                            {product.stockLevel}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-bold uppercase">{product.uom}</span>
                                  </div>
                              </td>
                              <td className="hidden md:table-cell p-6 text-right">
                                  <span className="font-bold text-slate-700">{getFreeToUse(product.id)}</span> <span className="text-xs text-slate-400">{product.uom}</span>
                              </td>
                              <td className="p-6 relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveDropdown(activeDropdown === product.id ? null : product.id);
                                        }}
                                        className="p-3 rounded-xl bg-stone-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                    {activeDropdown === product.id && (
                                        <div className="absolute right-12 top-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            <button onClick={(e) => { e.stopPropagation(); setViewingProductId(product.id); }} className="w-full text-left px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                                                <MapPin size={18} className="text-emerald-600" /> View Details
                                            </button>
                                            <button onClick={(e) => openQtyModal(product, e)} className="w-full text-left px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                                                <BarChart3 size={18} className="text-violet-600" /> Quick Count
                                            </button>
                                            <button onClick={(e) => openEditModal(product, e)} className="w-full text-left px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                                                <Edit2 size={18} /> Edit Details
                                            </button>
                                            <button onClick={(e) => handleDelete(product.id, e)} className="w-full text-left px-6 py-4 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-slate-100">
                                                <Trash2 size={18} /> Delete
                                            </button>
                                        </div>
                                    )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
        </>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                <h2 className="text-3xl font-black text-slate-900 mb-6">{isEditMode ? 'Edit Product' : 'Create Product'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required type="text" placeholder="Product Name" className="w-full p-4 bg-stone-50 border-2 border-stone-200 rounded-xl font-bold outline-none focus:border-violet-500" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input required type="text" placeholder="SKU" className="w-full p-4 bg-stone-50 border-2 border-stone-200 rounded-xl font-bold outline-none focus:border-violet-500" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                        <input type="number" placeholder="Cost Price" className="w-full p-4 bg-stone-50 border-2 border-stone-200 rounded-xl font-bold outline-none focus:border-violet-500" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Min Stock" className="w-full p-4 bg-stone-50 border-2 border-stone-200 rounded-xl font-bold outline-none focus:border-violet-500" value={newProduct.minStock} onChange={e => setNewProduct({...newProduct, minStock: Number(e.target.value)})} />
                         <input type="text" placeholder="UOM (e.g. Units)" className="w-full p-4 bg-stone-50 border-2 border-stone-200 rounded-xl font-bold outline-none focus:border-violet-500" value={newProduct.uom} onChange={e => setNewProduct({...newProduct, uom: e.target.value})} />
                    </div>
                    
                    {/* Default Location Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Default Location</label>
                        <select 
                            className="w-full p-4 bg-stone-50 border-2 border-stone-200 rounded-xl font-bold outline-none focus:border-violet-500"
                            value={newProduct.location}
                            onChange={e => setNewProduct({...newProduct, location: e.target.value})}
                        >
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tracking Strategy */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Traceability</label>
                        <select 
                            className="w-full p-4 bg-stone-50 border-2 border-stone-200 rounded-xl font-bold outline-none focus:border-violet-500"
                            value={newProduct.tracking || TrackingStrategy.NONE}
                            onChange={e => setNewProduct({...newProduct, tracking: e.target.value as TrackingStrategy})}
                        >
                            <option value={TrackingStrategy.NONE}>No Tracking</option>
                            <option value={TrackingStrategy.LOT}>By Lots</option>
                            <option value={TrackingStrategy.SERIAL}>By Unique Serial Number</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                        <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Update Qty Modal - WAREHOUSE STYLE */}
      {isQtyModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-8">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Stock Adjustment</h2>
                    <p className="text-2xl font-black text-slate-900 leading-tight">{selectedProduct.name}</p>
                    <p className="text-slate-500 font-mono font-bold">{selectedProduct.sku}</p>
                </div>
                
                <form onSubmit={handleQtyUpdate}>
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <button type="button" onClick={() => adjustQty(-1)} className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all border-2 border-red-100">
                            <Minus size={32} strokeWidth={3} />
                        </button>
                        
                        <div className="flex-1 relative">
                             <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Current: {selectedProduct.stockLevel}</div>
                             <input 
                                type="number" 
                                className="w-full h-20 text-5xl font-black text-center bg-stone-50 border-2 border-stone-200 rounded-2xl outline-none focus:border-violet-500 text-slate-900" 
                                value={qtyUpdateValue} 
                                onChange={e => setQtyUpdateValue(Number(e.target.value))} 
                            />
                        </div>

                        <button type="button" onClick={() => adjustQty(1)} className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all border-2 border-emerald-100">
                            <Plus size={32} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Quick Add Buttons */}
                    <div className="grid grid-cols-4 gap-2 mb-8">
                         <button type="button" onClick={() => adjustQty(5)} className="py-2 rounded-lg bg-slate-50 font-bold text-slate-600 hover:bg-slate-100">+5</button>
                         <button type="button" onClick={() => adjustQty(10)} className="py-2 rounded-lg bg-slate-50 font-bold text-slate-600 hover:bg-slate-100">+10</button>
                         <button type="button" onClick={() => adjustQty(50)} className="py-2 rounded-lg bg-slate-50 font-bold text-slate-600 hover:bg-slate-100">+50</button>
                         <button type="button" onClick={() => setQtyUpdateValue(selectedProduct.stockLevel)} className="py-2 rounded-lg bg-slate-50 font-bold text-slate-400 hover:text-red-500 hover:bg-red-50"><RefreshCw size={16} className="mx-auto" /></button>
                    </div>
                    
                    {/* Note about tracking */}
                    {selectedProduct.tracking !== TrackingStrategy.NONE && (
                         <div className="mb-4 p-4 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold text-center">
                             Note: Quick adjustment will assign a generic 'Auto-Adj' batch/serial to the diff. For specific items, use Operations.
                         </div>
                    )}

                    <div className="flex gap-4">
                        <button type="button" onClick={() => setIsQtyModalOpen(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl">Cancel</button>
                        <button type="submit" className="flex-[2] py-4 bg-violet-600 text-white text-lg font-black rounded-2xl hover:bg-violet-700 shadow-lg shadow-violet-200 active:scale-[0.98] transition-transform">Confirm</button>
                    </div>
                </form>
            </div>
        </div>
      )}
      
      {/* Stock Map Modal - Legacy Support, usually detail view covers this */}
      {isStockMapOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-white/20">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 leading-tight">Stock by Location</h2>
                        <p className="text-slate-500 text-sm font-medium">{selectedProduct.name}</p>
                    </div>
                    <button onClick={() => setIsStockMapOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                </div>
                
                <div className="space-y-4 mb-8">
                    {!selectedProduct.locationStock || Object.keys(selectedProduct.locationStock).length === 0 ? (
                        <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500 font-bold">
                            No stock currently recorded in specific locations.
                        </div>
                    ) : (
                        Object.entries(selectedProduct.locationStock).map(([loc, qty]) => (
                            <div key={loc} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-stone-200 text-emerald-600">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{loc}</p>
                                        <p className="text-xs text-slate-400 font-bold uppercase">Warehouse</p>
                                    </div>
                                </div>
                                <span className="text-xl font-black text-slate-900">{qty}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl flex justify-between items-center text-white">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Total On Hand</span>
                    <span className="text-2xl font-black">{selectedProduct.stockLevel}</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
