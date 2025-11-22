
import React, { useState, useEffect, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { OperationType, OperationStatus, StockMove, TrackingStrategy } from '../types';
import { Plus, Check, RefreshCw, Calendar, X, Trash, LayoutGrid, List as ListIcon, User, Search, ScanBarcode, ArrowRight, Hash, MapPin } from 'lucide-react';

interface OperationsProps {
    initialParams?: {
        filter?: string;
        status?: string; 
        action?: string;
        type?: string;
    }
}

export const Operations: React.FC<OperationsProps> = ({ initialParams }) => {
  const { moves, products, addMove, updateMove, validateMove, deleteMove, checkAvailability, locations } = useInventory();
  const [filterType, setFilterType] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newMove, setNewMove] = useState<Partial<StockMove>>({
    type: OperationType.RECEIPT,
    sourceLocation: 'Vendor',
    destLocation: 'WH/Stock',
    status: OperationStatus.DRAFT,
    contact: '',
    scheduleDate: new Date().toISOString().split('T')[0]
  });
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [lotNumber, setLotNumber] = useState<string>(''); // State for Lot/Serial

  // Derived state for product tracking type
  const selectedProductObj = products.find(p => p.id === selectedProductId);
  const isTracked = selectedProductObj && selectedProductObj.tracking !== TrackingStrategy.NONE;
  const trackingType = selectedProductObj?.tracking;

  useEffect(() => {
    if (initialParams) {
        if (initialParams.filter) setFilterType(initialParams.filter);
        if (initialParams.status) setStatusFilter(initialParams.status);
        else setStatusFilter(null);

        if (initialParams.action === 'create') {
            handleOpenCreate();
            if (initialParams.type) {
                setNewMove(prev => ({
                    ...prev,
                    type: initialParams.type as OperationType,
                    sourceLocation: initialParams.type === OperationType.RECEIPT ? 'Vendor' : 'WH/Stock',
                    destLocation: initialParams.type === OperationType.DELIVERY ? 'Customer' : 'WH/Stock'
                }));
            }
        }
    }
  }, [initialParams]);

  // Debounce Search
  useEffect(() => {
      const handler = setTimeout(() => {
          setDebouncedSearchTerm(searchTerm);
      }, 300);
      return () => clearTimeout(handler);
  }, [searchTerm]);

  // Base Filter (Applies Type + Search) - Shared by List and Kanban
  const baseFilteredMoves = useMemo(() => {
      const lowerTerm = debouncedSearchTerm.toLowerCase();
      return moves.filter(m => {
          const typeMatch = filterType === 'All' || m.type === filterType;
          const searchMatch = !lowerTerm ||
                              m.reference.toLowerCase().includes(lowerTerm) || 
                              (m.contact && m.contact.toLowerCase().includes(lowerTerm)) ||
                              (m.lines[0]?.lotNumber && m.lines[0].lotNumber.toLowerCase().includes(lowerTerm));
          return typeMatch && searchMatch;
      });
  }, [moves, filterType, debouncedSearchTerm]);

  // Final List Filter (Applies Base + Status Filter)
  const filteredMoves = useMemo(() => {
      return baseFilteredMoves.filter(m => {
        let statusMatch = true;
        const today = new Date().toISOString().split('T')[0];

        if (statusFilter === 'late') {
            statusMatch = m.status !== OperationStatus.DONE && m.status !== OperationStatus.CANCELLED && (m.scheduleDate || '') < today;
        } else if (statusFilter === 'ready') {
            statusMatch = m.status === OperationStatus.READY;
        } else if (statusFilter === 'waiting') {
            statusMatch = m.status === OperationStatus.WAITING;
        } else if (statusFilter === 'todo') {
            statusMatch = m.status === OperationStatus.DRAFT || m.status === OperationStatus.READY || m.status === OperationStatus.WAITING;
        }
        return statusMatch;
      });
  }, [baseFilteredMoves, statusFilter]);

  const handleOpenCreate = () => {
      setNewMove({
        type: OperationType.RECEIPT,
        sourceLocation: 'Vendor',
        destLocation: 'WH/Stock',
        status: OperationStatus.DRAFT,
        contact: '',
        scheduleDate: new Date().toISOString().split('T')[0]
      });
      setSelectedProductId('');
      setQuantity(1);
      setLotNumber('');
      setIsEditMode(false);
      setEditingId(null);
      setIsModalOpen(true);
  };

  const handleOpenEdit = (move: StockMove) => {
      setNewMove(move);
      setIsEditMode(true);
      setEditingId(move.id);
      if (move.lines.length > 0) {
          setSelectedProductId(move.lines[0].productId);
          setQuantity(move.lines[0].quantity);
          setLotNumber(move.lines[0].lotNumber || '');
      }
      setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const lineItem = {
        id: isEditMode ? (newMove.lines?.[0]?.id || `l${Date.now()}`) : `l${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity: Number(quantity),
        lotNumber: isTracked ? lotNumber : undefined
    };

    if (isEditMode && editingId) {
        const updatedMove: StockMove = {
            ...newMove as StockMove,
            lines: [lineItem]
        };
        updateMove(updatedMove);
    } else {
        const move: StockMove = {
            id: `m${Date.now()}`,
            reference: `WH/${newMove.type === OperationType.RECEIPT ? 'IN' : newMove.type === OperationType.DELIVERY ? 'OUT' : 'INT'}/${Date.now().toString().slice(-4)}`,
            type: newMove.type!,
            status: OperationStatus.DRAFT,
            sourceLocation: newMove.sourceLocation!,
            destLocation: newMove.destLocation!,
            date: new Date().toISOString().split('T')[0],
            scheduleDate: newMove.scheduleDate,
            contact: newMove.contact,
            lines: [lineItem]
        };
        addMove(move);
    }
    
    setIsModalOpen(false);
  };

  const clearFilters = () => {
      setFilterType('All');
      setStatusFilter(null);
      setSearchTerm('');
  };

  const renderKanbanColumn = (status: OperationStatus, title: string) => {
      // Use Base Filtered Moves (ignores status filter, as Kanban shows columns)
      const columnMoves = baseFilteredMoves.filter(m => m.status === status);

      return (
          <div className="flex-1 min-w-[320px] bg-slate-100/50 rounded-3xl p-4 flex flex-col h-full border border-slate-200/50">
              <h3 className="font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between px-2">
                  {title}
                  <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-md font-black">{columnMoves.length}</span>
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                  {columnMoves.map(move => (
                      <div key={move.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer relative group" onClick={() => handleOpenEdit(move)}>
                           <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl ${
                               move.type === OperationType.RECEIPT ? 'bg-emerald-500' : 'bg-blue-500'
                           }`}></div>
                           
                           <div className="flex justify-between items-start mb-3 pl-3">
                                <span className="font-black text-slate-800 text-lg">{move.reference}</span>
                           </div>
                           <div className="pl-3 text-sm text-slate-600 mb-3 flex items-center gap-2">
                               <div className="p-1 bg-slate-100 rounded-md"><User size={14} /></div> 
                               <span className="font-bold">{move.contact || 'Internal'}</span>
                           </div>
                           {/* Product & Lot Info */}
                            <div className="pl-3 mb-3">
                                <p className="font-bold text-slate-800 text-sm truncate">{move.lines[0]?.productName}</p>
                                {move.lines[0]?.lotNumber && (
                                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-violet-50 text-violet-600 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                        <Hash size={10} /> {move.lines[0].lotNumber}
                                    </div>
                                )}
                            </div>

                           <div className="pl-3 text-xs text-slate-400 flex justify-between items-center pt-3 border-t border-slate-100">
                                <span className={`${move.scheduleDate && move.scheduleDate < new Date().toISOString().split('T')[0] ? 'text-red-500 font-black bg-red-50 px-2 py-1 rounded' : ''}`}>
                                    {move.scheduleDate}
                                </span>
                                <span className="font-black text-slate-700 text-sm bg-slate-100 px-2 py-1 rounded-lg">x{move.lines[0]?.quantity}</span>
                           </div>
                           
                           {/* Action Buttons directly on card */}
                           <div className="pl-3 mt-4 flex gap-2">
                                {status === OperationStatus.READY && (
                                    <button onClick={(e) => { e.stopPropagation(); validateMove(move.id); }} className="flex-1 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform">VALIDATE</button>
                                )}
                           </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Operations</h2>
                <p className="text-slate-500 font-medium">Manage warehouse tasks</p>
            </div>
            <button 
                onClick={handleOpenCreate}
                className="bg-violet-600 hover:bg-violet-700 text-white h-14 w-14 md:w-auto md:px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-200 transition-all hover:scale-105 active:scale-95"
            >
                <Plus size={24} /> <span className="hidden md:inline">New Order</span>
            </button>
        </div>

        {/* Search Bar (Scanner Style) */}
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <ScanBarcode size={24} />
            </div>
            <input 
                type="text" 
                placeholder="Scan Reference, Lot, or Contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-4 py-5 bg-white border-2 border-slate-200 rounded-2xl text-lg font-bold focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 shadow-sm transition-all"
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                    <X size={16} />
                </button>
            )}
        </div>

        {/* Quick Filters */}
        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 no-scrollbar">
             {['All', OperationType.RECEIPT, OperationType.DELIVERY].map(type => (
                <button 
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap border-2
                        ${filterType === type 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' 
                            : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}
                    `}
                >
                    {type === 'All' ? 'All Ops' : type.replace('Incoming ', '').replace(' Order', '')}
                </button>
            ))}
            
            <div className="w-px bg-slate-200 mx-2"></div>
            
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                <button onClick={() => setViewMode('list')} className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}><ListIcon size={20}/></button>
                <button onClick={() => setViewMode('kanban')} className={`p-3 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}><LayoutGrid size={20}/></button>
            </div>
        </div>
        
        {statusFilter && (
            <div className="inline-flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Active Filter:</span>
                <span className="bg-violet-100 text-violet-700 px-4 py-2 rounded-xl text-sm font-black uppercase flex items-center gap-2">
                    {statusFilter}
                    <button onClick={() => setStatusFilter(null)} className="hover:bg-violet-200 rounded-full p-1"><X size={14} /></button>
                </span>
            </div>
        )}
      </div>

      {/* Content View */}
      {viewMode === 'list' ? (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
             {filteredMoves.length === 0 ? (
                 <div className="p-20 text-center">
                     <div className="inline-flex p-6 rounded-full bg-slate-50 mb-6 text-slate-300"><Search size={48} /></div>
                     <p className="text-slate-900 font-black text-xl mb-2">No operations found</p>
                     <p className="text-slate-500 font-medium">Try scanning a different code or clear filters.</p>
                     <button onClick={clearFilters} className="text-violet-600 font-bold text-lg mt-6 hover:underline">Clear All Filters</button>
                 </div>
             ) : (
              <table className="w-full text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                      <tr>
                          <th className="p-6 pl-8 text-xs font-black text-slate-400 uppercase tracking-widest">Reference</th>
                          <th className="hidden md:table-cell p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Details</th>
                          <th className="hidden lg:table-cell p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Traceability</th>
                          <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="p-6 pr-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredMoves.map(move => (
                          <tr key={move.id} className="hover:bg-slate-50 transition-colors group cursor-pointer relative" onClick={() => handleOpenEdit(move)}>
                              <td className="p-6 pl-8">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-1.5 h-12 rounded-full ${move.type === OperationType.RECEIPT ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                    <div>
                                        <span className="font-black text-slate-900 text-lg block">{move.reference}</span>
                                        <span className="text-slate-500 font-bold text-xs uppercase">{move.contact || 'Internal'}</span>
                                    </div>
                                  </div>
                              </td>
                              <td className="hidden md:table-cell p-6">
                                  <p className="text-slate-700 font-bold text-base">{move.lines[0]?.productName}</p>
                                  <div className="flex gap-2 mt-1">
                                      <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">Qty: {move.lines.reduce((a,b) => a + b.quantity, 0)}</span>
                                      {move.lines.length > 1 && <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">+{move.lines.length - 1} items</span>}
                                  </div>
                              </td>
                              <td className="hidden lg:table-cell p-6">
                                   {move.lines[0]?.lotNumber ? (
                                       <div className="flex items-center gap-2">
                                           <span className="h-6 w-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center"><Hash size={14} /></span>
                                           <span className="font-mono text-sm font-bold text-slate-700">{move.lines[0].lotNumber}</span>
                                       </div>
                                   ) : (
                                       <span className="text-slate-300 text-xs font-bold uppercase">N/A</span>
                                   )}
                              </td>
                              <td className="p-6">
                                  <span className={`text-xs px-4 py-2 rounded-xl font-black uppercase tracking-wide border inline-block
                                      ${move.status === 'Done' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                        move.status === 'Ready' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                        move.status === 'Waiting' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                        'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                      {move.status}
                                  </span>
                              </td>
                              <td className="p-6 pr-8 text-right">
                                  {move.status === OperationStatus.DRAFT && move.type === OperationType.RECEIPT && (
                                      <button onClick={(e) => { e.stopPropagation(); validateMove(move.id); }} className="text-sm font-bold bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200">Validate</button>
                                  )}
                                  {(move.status === OperationStatus.DRAFT || move.status === OperationStatus.WAITING) && move.type === OperationType.DELIVERY && (
                                      <button onClick={(e) => { e.stopPropagation(); checkAvailability(move.id); }} className="text-sm font-bold bg-blue-100 text-blue-700 px-5 py-3 rounded-xl hover:bg-blue-200">Check</button>
                                  )}
                                  {move.status === OperationStatus.READY && (
                                      <button onClick={(e) => { e.stopPropagation(); validateMove(move.id); }} className="text-sm font-bold bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20">Validate</button>
                                  )}
                                  {move.status === OperationStatus.DONE && (
                                      <span className="text-emerald-500 font-bold flex items-center justify-end gap-1"><Check size={16} /> Done</span>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
             )}
          </div>
      ) : (
          <div className="flex gap-6 overflow-x-auto pb-6 min-h-[60vh] custom-scrollbar">
              {renderKanbanColumn(OperationStatus.DRAFT, 'Draft')}
              {renderKanbanColumn(OperationStatus.WAITING, 'Waiting')}
              {renderKanbanColumn(OperationStatus.READY, 'Ready')}
              {renderKanbanColumn(OperationStatus.DONE, 'Done')}
          </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                         <h2 className="text-3xl font-black text-slate-900 tracking-tight">{isEditMode ? newMove.reference : 'New Stock Operation'}</h2>
                         {isEditMode && <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold uppercase text-slate-500">{newMove.status}</span>}
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                </div>

                {/* Status Bar Workflow - Big Buttons */}
                {isEditMode && newMove.status !== OperationStatus.DONE && (
                    <div className="mb-8 flex flex-col md:flex-row justify-end gap-3 p-6 bg-stone-50 rounded-3xl border border-stone-100">
                        <div className="flex-1 flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-2 md:mb-0">
                             Recommended Action:
                        </div>
                        {newMove.type === OperationType.DELIVERY && (newMove.status === OperationStatus.DRAFT || newMove.status === OperationStatus.WAITING) && (
                             <button onClick={() => { checkAvailability(newMove.id!); setIsModalOpen(false); }} className="bg-blue-100 text-blue-700 px-6 py-4 rounded-2xl font-black hover:bg-blue-200 transition-colors flex items-center justify-center gap-2">
                                <RefreshCw size={20} /> Check Avail.
                             </button>
                        )}
                        {(newMove.status === OperationStatus.READY || (newMove.type === OperationType.RECEIPT && newMove.status === OperationStatus.DRAFT)) && (
                             <button onClick={() => { validateMove(newMove.id!); setIsModalOpen(false); }} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
                                <Check size={20} /> VALIDATE
                             </button>
                        )}
                        <button onClick={() => { deleteMove(newMove.id!); setIsModalOpen(false); }} className="bg-white border-2 border-red-100 text-red-500 px-4 py-4 rounded-2xl font-bold hover:bg-red-50 transition-colors">
                             <Trash size={20} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Contact</label>
                            <div className="relative">
                                <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-14 pr-4 py-5 bg-stone-50 border-2 border-stone-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-violet-100 focus:border-violet-500 outline-none transition-all text-lg"
                                    placeholder="Vendor or Customer"
                                    value={newMove.contact}
                                    onChange={e => setNewMove({...newMove, contact: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Scheduled Date</label>
                            <div className="relative">
                                <Calendar size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="date" 
                                    className="w-full pl-14 pr-4 py-5 bg-stone-50 border-2 border-stone-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-violet-100 focus:border-violet-500 outline-none transition-all text-lg"
                                    value={newMove.scheduleDate}
                                    onChange={e => setNewMove({...newMove, scheduleDate: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Locations Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Source Location</label>
                            <div className="relative">
                                <MapPin size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select 
                                    className="w-full pl-14 pr-4 py-5 bg-stone-50 border-2 border-stone-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-violet-100 focus:border-violet-500 outline-none transition-all text-lg appearance-none"
                                    value={newMove.sourceLocation}
                                    onChange={e => setNewMove({...newMove, sourceLocation: e.target.value})}
                                >
                                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Destination Location</label>
                            <div className="relative">
                                <MapPin size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select 
                                    className="w-full pl-14 pr-4 py-5 bg-stone-50 border-2 border-stone-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-violet-100 focus:border-violet-500 outline-none transition-all text-lg appearance-none"
                                    value={newMove.destLocation}
                                    onChange={e => setNewMove({...newMove, destLocation: e.target.value})}
                                >
                                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-8">
                        <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Line Items</h4>
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <div className="w-full md:flex-[3]">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Product</label>
                                <select 
                                    required
                                    className="w-full border-2 border-stone-200 rounded-2xl p-5 bg-white focus:ring-4 focus:ring-violet-100 focus:border-violet-500 outline-none font-bold text-slate-700 transition-shadow text-lg h-[72px]"
                                    value={selectedProductId}
                                    onChange={e => setSelectedProductId(e.target.value)}
                                >
                                    <option value="">Select Product...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Total: {p.stockLevel})</option>)}
                                </select>
                            </div>
                            <div className="w-full md:flex-1">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Qty</label>
                                <input 
                                    required
                                    type="number" 
                                    min="1"
                                    className="w-full border-2 border-stone-200 rounded-2xl p-5 bg-white focus:ring-4 focus:ring-violet-100 focus:border-violet-500 outline-none font-black text-center text-slate-900 transition-shadow text-xl h-[72px]" 
                                    placeholder="Qty"
                                    value={quantity}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        
                        {/* LOT/SERIAL INPUT */}
                        {isTracked && (
                             <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-violet-600 uppercase mb-1 ml-1">
                                    {trackingType === TrackingStrategy.SERIAL ? 'Serial Number Required' : 'Lot/Batch Number'}
                                </label>
                                <div className="relative">
                                    <Hash size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-violet-400" />
                                    <input 
                                        required
                                        type="text"
                                        className="w-full pl-14 pr-4 py-5 bg-violet-50 border-2 border-violet-100 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-violet-200 focus:border-violet-500 outline-none transition-all text-lg"
                                        placeholder={trackingType === TrackingStrategy.SERIAL ? "e.g. SN-998877" : "e.g. LOT-2023-X"}
                                        value={lotNumber}
                                        onChange={e => setLotNumber(e.target.value)}
                                    />
                                </div>
                                {trackingType === TrackingStrategy.SERIAL && quantity > 1 && (
                                    <p className="text-red-500 text-xs font-bold mt-2 ml-1">Warning: Serial numbers are usually unique per unit. Consider splitting lines for unique serials.</p>
                                )}
                             </div>
                        )}
                    </div>

                    <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">Close</button>
                        {newMove.status === OperationStatus.DRAFT && (
                            <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] text-lg">
                                Save Operation
                            </button>
                        )}
                        {newMove.status !== OperationStatus.DRAFT && (
                             <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] text-lg">
                                Update Operation
                             </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
