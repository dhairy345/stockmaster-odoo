
import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { OperationType, Product } from '../types';
import { Package, Truck, Activity, ScanBarcode, Search, ArrowRight, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { ScannerModal } from '../components/ScannerModal';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
    onNavigate: (page: string, params?: any) => void;
}

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { getKPIs, moves, products } = useInventory();
  const kpis = getKPIs();
  const [scanQuery, setScanQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const processScan = (query: string) => {
      if (!query) return;
      // Simulate scanning: Find product by SKU or Name
      const product = products.find(p => 
          p.sku.toLowerCase() === query.toLowerCase() || 
          p.name.toLowerCase().includes(query.toLowerCase())
      );

      if (product) {
          // Navigate to products page with filter to show this product
          onNavigate('products', { filter: query });
      } else {
          alert(`Product with SKU/Name "${query}" not found.`);
      }
      setScanQuery('');
  };

  const handleScanSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      processScan(scanQuery);
  };

  // --- ANALYTICS CALCULATIONS ---

  // 1. Value by Category
  const categoryData = useMemo(() => {
      const stats: Record<string, number> = {};
      products.forEach(p => {
          const val = p.stockLevel * p.cost;
          stats[p.category] = (stats[p.category] || 0) + val;
      });
      return Object.entries(stats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort highest value first
  }, [products]);

  const totalInventoryValue = useMemo(() => {
      return products.reduce((acc, p) => acc + (p.stockLevel * p.cost), 0);
  }, [products]);

  // 2. Weekly Flow (Last 7 Days)
  const activityData = useMemo(() => {
      const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
      });

      return last7Days.map(date => {
          const dayMoves = moves.filter(m => m.date === date);
          
          // Sum quantities for done moves only to show actual movement
          const incoming = dayMoves
            .filter(m => m.type === OperationType.RECEIPT && m.status === 'Done')
            .reduce((acc, m) => acc + m.lines.reduce((s, l) => s + l.quantity, 0), 0);

          const outgoing = dayMoves
            .filter(m => m.type === OperationType.DELIVERY && m.status === 'Done')
            .reduce((acc, m) => acc + m.lines.reduce((s, l) => s + l.quantity, 0), 0);

          // Format date MM-DD
          const dateLabel = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return {
              name: dateLabel,
              in: incoming,
              out: outgoing,
          };
      });
  }, [moves]);

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
        <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-700">
            <p className="font-bold mb-1">{label}</p>
            {payload.map((entry: any, index: number) => (
                <p key={index} style={{ color: entry.color }}>
                    {entry.name}: <span className="font-mono font-bold">{typeof entry.value === 'number' && entry.name === 'value' ? `$${entry.value.toLocaleString()}` : entry.value}</span>
                </p>
            ))}
        </div>
        );
    }
    return null;
  };

  return (
    <div className="pb-20">
        {isScannerOpen && (
            <ScannerModal 
                onScan={(result) => {
                    setIsScannerOpen(false);
                    processScan(result);
                }}
                onClose={() => setIsScannerOpen(false)}
            />
        )}

        {/* Staff Greeting & Quick Scan Header */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white mb-10 relative overflow-hidden shadow-2xl shadow-slate-900/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Floor Ops</h2>
                    <p className="text-slate-400 text-lg font-medium">Shift Dashboard</p>
                </div>
                
                {/* Scanner Input */}
                <form onSubmit={handleScanSubmit} className="w-full md:w-[450px] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex items-center focus-within:bg-white/20 transition-all">
                    <button 
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="p-3 text-violet-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        title="Open Camera Scanner"
                    >
                        <ScanBarcode size={32} />
                    </button>
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="Scan SKU / Barcode..." 
                        className="bg-transparent border-none outline-none text-white placeholder-slate-400 text-xl font-bold w-full px-2"
                        value={scanQuery}
                        onChange={(e) => setScanQuery(e.target.value)}
                    />
                    <button type="submit" className="p-3 bg-violet-600 rounded-xl hover:bg-violet-500 transition-colors text-white">
                        <ArrowRight size={24} />
                    </button>
                </form>
            </div>
        </div>

        {/* Action Cards - Large Touch Targets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            
            {/* INBOUND */}
            <div className="bg-emerald-50 rounded-[2rem] p-8 border-2 border-emerald-100 relative overflow-hidden group transition-all hover:border-emerald-300">
                <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Package size={120} className="text-emerald-900" />
                </div>
                
                <h3 className="text-emerald-800 text-sm font-black uppercase tracking-widest mb-4">Inbound / Receiving</h3>
                
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50">
                        <span className="block text-5xl font-black text-emerald-600 mb-1">{kpis.receiptsToReceive}</span>
                        <span className="text-sm font-bold text-slate-500">Pending</span>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50">
                        <span className="block text-5xl font-black text-amber-500 mb-1">{kpis.receiptsLate}</span>
                        <span className="text-sm font-bold text-slate-500">Late</span>
                    </div>
                </div>

                <button 
                    onClick={() => onNavigate('operations', { filter: OperationType.RECEIPT })}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-transform active:scale-95 flex items-center justify-center gap-3"
                >
                    <ScanBarcode /> Process Receipts
                </button>
            </div>

            {/* OUTBOUND */}
            <div className="bg-blue-50 rounded-[2rem] p-8 border-2 border-blue-100 relative overflow-hidden group transition-all hover:border-blue-300">
                <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Truck size={120} className="text-blue-900" />
                </div>
                
                <h3 className="text-blue-800 text-sm font-black uppercase tracking-widest mb-4">Outbound / Picking</h3>
                
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-blue-100/50">
                        <span className="block text-5xl font-black text-blue-600 mb-1">{kpis.deliveriesToDeliver}</span>
                        <span className="text-sm font-bold text-slate-500">Pick Ready</span>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-blue-100/50">
                        <span className="block text-5xl font-black text-amber-500 mb-1">{kpis.deliveriesWaiting}</span>
                        <span className="text-sm font-bold text-slate-500">Waiting</span>
                    </div>
                </div>

                <button 
                    onClick={() => onNavigate('operations', { filter: OperationType.DELIVERY, status: 'ready' })}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-transform active:scale-95 flex items-center justify-center gap-3"
                >
                    <ScanBarcode /> Start Picking
                </button>
            </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            
            {/* Value by Category */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><PieChartIcon size={20} className="text-violet-500"/> Inventory Value</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">By Category</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-slate-900">${totalInventoryValue.toLocaleString()}</p>
                        <p className="text-xs font-bold text-emerald-500 uppercase">Total Valuation</p>
                    </div>
                </div>
                
                <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle" 
                                formatter={(value) => <span className="text-slate-500 font-bold text-xs ml-1">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Weekly Moves */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col">
                 <div className="mb-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><BarChart3 size={20} className="text-blue-500"/> Stock Movement</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Last 7 Days (Units Processed)</p>
                </div>

                <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                verticalAlign="top" 
                                align="right"
                                iconType="circle" 
                                formatter={(value) => <span className="text-slate-500 font-bold text-xs ml-1 capitalize">{value}</span>}
                            />
                            <Bar dataKey="in" name="Incoming" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="out" name="Outgoing" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Recent Tasks (Simplified List) */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    Latest Moves
                </h3>
            </div>
            <div className="space-y-3">
                {moves.slice(0, 5).map((move) => (
                    <div 
                        key={move.id} 
                        onClick={() => onNavigate('operations', { filter: move.type })}
                        className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100 active:bg-stone-100 cursor-pointer transition-colors hover:bg-slate-50"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                                move.type === OperationType.RECEIPT ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {move.type === OperationType.RECEIPT ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                            </div>
                            <div>
                                <p className="font-black text-slate-800">{move.reference}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase">{move.contact || 'Internal'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase ${
                                move.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                                {move.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
