
import React, { useState, useEffect, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { FileText, ArrowUpRight, ArrowDownRight, Hash, Download, Search, X } from 'lucide-react';
import { OperationType } from '../types';

export const StockLedger: React.FC = () => {
  const { moves } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Optimize by flattening moves to lines first, then filtering
  const filteredRows = useMemo(() => {
    const lowerTerm = debouncedSearchTerm.toLowerCase();

    return moves.flatMap(move => 
      move.lines.map(line => ({ move, line }))
    ).filter(({ move, line }) => {
        if (!lowerTerm) return true;
        
        return move.reference.toLowerCase().includes(lowerTerm) ||
               (move.contact || '').toLowerCase().includes(lowerTerm) ||
               line.productName.toLowerCase().includes(lowerTerm) ||
               (line.lotNumber || '').toLowerCase().includes(lowerTerm) ||
               move.status.toLowerCase().includes(lowerTerm);
    });
  }, [moves, debouncedSearchTerm]);

  const handleExport = () => {
    // Define CSV Headers
    const headers = [
      'Reference', 
      'Date', 
      'Contact', 
      'Product', 
      'Lot/Serial', 
      'From Location', 
      'To Location', 
      'Quantity', 
      'Status'
    ];

    // Build Rows from Filtered Data
    const rows = filteredRows.map(({ move, line }) => {
        const isIncoming = move.type === OperationType.RECEIPT || (move.type === OperationType.ADJUSTMENT && move.destLocation === 'WH/Stock');
        const signedQty = isIncoming ? `+${line.quantity}` : `-${line.quantity}`;
        
        return [
          move.reference,
          move.date,
          move.contact || '',
          line.productName,
          line.lotNumber || '',
          move.sourceLocation,
          move.destLocation,
          signedQty,
          move.status
        ].map(field => `"${String(field).replace(/"/g, '""')}"`); // Escape quotes and wrap in quotes
    });

    // Combine Headers and Rows
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock_ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-20">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Move History</h2>
                <p className="text-slate-500 font-medium text-lg">Audit log of all stock movements.</p>
            </div>
            
            <div className="flex gap-3">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-12 pr-10 py-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 w-full md:w-64 lg:w-80 transition-all"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:bg-slate-100 rounded-full">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <button 
                    onClick={handleExport}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-bold shadow-xl shadow-slate-900/20 flex items-center gap-3 transition-all active:scale-95"
                >
                    <Download size={20} />
                    <span className="hidden md:inline">Export CSV</span>
                </button>
            </div>
       </div>

       <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-stone-50/80 border-b border-stone-100">
                <tr>
                <th className="p-6 pl-8 text-xs font-black text-slate-400 uppercase tracking-widest">Reference</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Product</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Lot / Serial</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Flow</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                <th className="p-6 pr-8 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
                {filteredRows.length === 0 ? (
                     <tr>
                        <td colSpan={8} className="p-12 text-center">
                             <p className="text-slate-500 font-bold">No movements found matching your search.</p>
                        </td>
                     </tr>
                ) : (
                    filteredRows.map(({ move, line }) => {
                        const isIncoming = move.type === OperationType.RECEIPT || (move.type === OperationType.ADJUSTMENT && move.destLocation === 'WH/Stock');
                        const colorClass = isIncoming ? 'text-emerald-600' : 'text-red-500';
                        
                        return (
                        <tr key={`${move.id}-${line.id}`} className="hover:bg-stone-50 transition-colors group">
                            <td className="p-6 pl-8">
                                <span className="font-bold text-slate-800">{move.reference}</span>
                            </td>
                            <td className="p-6 text-sm font-bold text-slate-500">{move.date}</td>
                            <td className="p-6 text-sm font-bold text-slate-500">{move.contact || '-'}</td>
                            <td className="p-6 font-bold text-slate-900 text-base">{line.productName}</td>
                            <td className="p-6">
                                {line.lotNumber ? (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Hash size={14} className="text-slate-400" />
                                        <span className="font-mono font-bold text-sm">{line.lotNumber}</span>
                                    </div>
                                ) : (
                                    <span className="text-slate-300 text-xs font-bold">-</span>
                                )}
                            </td>
                            <td className="p-6">
                                <div className="flex flex-col text-xs font-bold">
                                    <span className="text-slate-400 mb-1">From <span className="text-slate-700">{move.sourceLocation}</span></span>
                                    <span className="text-slate-400">To <span className="text-slate-700">{move.destLocation}</span></span>
                                </div>
                            </td>
                            <td className="p-6 text-right">
                                <span className={`font-black text-xl tracking-tight ${colorClass}`}>
                                    {isIncoming ? '+' : '-'}{line.quantity}
                                </span>
                            </td>
                            <td className="p-6 pr-8">
                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wide border ${move.status === 'Done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                    {move.status}
                                </span>
                            </td>
                        </tr>
                    )})
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
