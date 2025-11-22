
import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { MapPin, Settings as SettingsIcon, X, Plus, Check, RefreshCw } from 'lucide-react';

export const Settings: React.FC = () => {
  const { locations, addLocation, removeLocation, resetData } = useInventory();
  const [multiWarehouse, setMultiWarehouse] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);

  // Add Location State
  const [isAddingLoc, setIsAddingLoc] = useState(false);
  const [newLocName, setNewLocName] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newLocName.trim()) {
          addLocation(newLocName.trim());
          setNewLocName('');
          setIsAddingLoc(false);
      }
  };

  const handleRemoveLocation = (loc: string) => {
      if (window.confirm(`Are you sure you want to remove location "${loc}"?`)) {
          removeLocation(loc);
      }
  };

  const handleReset = () => {
      if (window.confirm("This will wipe all current changes and restore the initial demo data. Continue?")) {
          resetData();
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Header */}
        <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-2">Configuration</h2>
            <p className="text-slate-500 text-lg font-medium">Manage your warehouse locations and system alerts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* General Card */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-stone-50 rounded-2xl text-slate-600"><SettingsIcon size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">General Preferences</h3>
                        <p className="text-slate-400 text-sm font-bold">System-wide behaviors</p>
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setMultiWarehouse(!multiWarehouse)}>
                        <div>
                            <p className="font-bold text-lg text-slate-800 group-hover:text-violet-600 transition-colors">Multi-Warehouse Mode</p>
                            <p className="text-sm text-slate-400 font-medium mt-1">Allow transfers between locations</p>
                        </div>
                        <div className="relative inline-flex items-center pointer-events-none">
                            <input type="checkbox" className="sr-only peer" checked={multiWarehouse} readOnly />
                            <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet-600 transition-colors"></div>
                        </div>
                    </div>
                    <div className="w-full h-px bg-stone-100"></div>
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setLowStockAlerts(!lowStockAlerts)}>
                        <div>
                            <p className="font-bold text-lg text-slate-800 group-hover:text-violet-600 transition-colors">Low Stock Notifications</p>
                            <p className="text-sm text-slate-400 font-medium mt-1">Email alerts for minimum rules</p>
                        </div>
                        <div className="relative inline-flex items-center pointer-events-none">
                            <input type="checkbox" className="sr-only peer" checked={lowStockAlerts} readOnly />
                            <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet-600 transition-colors"></div>
                        </div>
                    </div>
                    
                    <div className="w-full h-px bg-stone-100"></div>
                    
                    <button 
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw size={18} /> Reset to Demo Data
                    </button>
                </div>
            </div>

            {/* Locations Card */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-stone-50 rounded-2xl text-slate-600"><MapPin size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Active Warehouses</h3>
                        <p className="text-slate-400 text-sm font-bold">Stock locations</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    {locations.map(loc => (
                        <div key={loc} className="flex items-center gap-2 px-5 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl hover:bg-white hover:border-violet-200 hover:shadow-lg transition-all duration-300 cursor-default group animate-in zoom-in duration-300">
                            <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-sm group-hover:scale-125 transition-transform"></div>
                            <span className="text-slate-700 font-bold text-sm">{loc}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveLocation(loc); }}
                                className="ml-2 p-1 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"
                                title="Remove Location"
                            >
                                <X size={12} strokeWidth={3} />
                            </button>
                        </div>
                    ))}
                    
                    {!isAddingLoc ? (
                        <button 
                            onClick={() => setIsAddingLoc(true)}
                            className="px-5 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-violet-500 hover:text-violet-600 hover:bg-violet-50 transition-all duration-300 flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Location
                        </button>
                    ) : (
                        <form onSubmit={handleAddSubmit} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                            <input 
                                type="text" 
                                autoFocus
                                className="px-4 py-3 bg-stone-50 border-2 border-violet-500 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none w-40 shadow-lg shadow-violet-100"
                                placeholder="WH/..."
                                value={newLocName}
                                onChange={e => setNewLocName(e.target.value)}
                                onBlur={() => !newLocName && setIsAddingLoc(false)}
                            />
                            <button 
                                type="submit"
                                className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
                            >
                                <Check size={16} />
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIsAddingLoc(false)}
                                className="p-3 text-slate-400 hover:bg-stone-100 rounded-xl transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
