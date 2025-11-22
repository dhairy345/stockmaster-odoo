import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Package, ArrowLeftRight, FileText, Settings, LogOut, Menu, X, Box, ChevronDown, Clock, BadgeCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'US';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'products', label: 'Products', icon: <Package size={20} /> },
    { id: 'operations', label: 'Operations', icon: <ArrowLeftRight size={20} /> },
    { id: 'ledger', label: 'Move History', icon: <FileText size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
          isScrolled ? 'bg-slate-900/95 backdrop-blur-md border-slate-800 shadow-xl py-3' : 'bg-slate-900 border-transparent py-5'
        }`}>
        <div className="max-w-[1800px] mx-auto px-6 md:px-8 flex justify-between items-center">
            
            {/* Logo Area */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
                <div className="bg-violet-600 p-2 rounded-lg shadow-lg shadow-violet-900/50">
                    <Box size={22} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">StockMaster</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hidden md:block">IMS Platform v2.0</p>
                </div>
            </div>

            {/* Desktop Navigation - Centered */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`
                            px-5 py-2.5 rounded-xl flex items-center gap-2.5 text-sm font-bold transition-all duration-300
                            ${activePage === item.id 
                                ? 'bg-white text-slate-900 shadow-lg shadow-black/20 scale-105' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}
                        `}
                    >
                        <span className={activePage === item.id ? 'text-violet-600' : ''}>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-6">
                 
                 {/* Staff Profile Section */}
                 <div className="relative" ref={profileRef}>
                     <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`flex items-center gap-3 pl-4 py-1.5 pr-3 rounded-xl border transition-all duration-200 group
                            ${isProfileOpen ? 'bg-slate-800 border-slate-700 shadow-lg' : 'border-transparent hover:bg-slate-800/50'}
                        `}
                     >
                        <div className="text-right hidden xl:block">
                            <p className="text-white text-sm font-bold leading-tight group-hover:text-violet-300 transition-colors">{user?.name || 'Staff Member'}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">On Shift</p>
                            </div>
                        </div>
                        
                        {/* ID Badge Style Icon */}
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 shadow-inner relative overflow-hidden group-hover:border-violet-500/50 transition-colors">
                            {initials}
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div> 
                        </div>
                        
                        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                     </button>

                     {/* Profile Dropdown Menu */}
                     {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            {/* Dropdown Header */}
                            <div className="p-5 bg-slate-900 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 rounded-full blur-[40px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                                <div className="relative z-10 flex items-center gap-4 mb-3">
                                    <div className="h-14 w-14 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-lg border border-slate-700 shadow-lg">
                                        {initials}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg leading-tight">{user?.name}</p>
                                        <p className="text-slate-400 text-xs font-mono mt-0.5 text-ellipsis overflow-hidden w-32 whitespace-nowrap">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Menu Items */}
                            <div className="p-2 space-y-1">
                                <button 
                                    onClick={() => { onNavigate('settings'); setIsProfileOpen(false); }} 
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 hover:bg-stone-50 hover:text-slate-900 font-bold text-sm transition-colors group"
                                >
                                    <div className="p-2 rounded-lg bg-stone-100 text-slate-400 group-hover:text-violet-600 group-hover:bg-violet-50 transition-colors">
                                        <BadgeCheck size={18} />
                                    </div>
                                    My Information
                                </button>
                                <button 
                                    onClick={() => { setIsProfileOpen(false); alert('Shift logs feature coming soon'); }} 
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 hover:bg-stone-50 hover:text-slate-900 font-bold text-sm transition-colors group"
                                >
                                    <div className="p-2 rounded-lg bg-stone-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                        <Clock size={18} />
                                    </div>
                                    Shift History
                                </button>
                            </div>

                            <div className="p-2 border-t border-slate-100 mt-1">
                                <button 
                                    onClick={() => onNavigate('login')}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 font-bold text-sm transition-colors group"
                                >
                                    <div className="p-2 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
                                        <LogOut size={18} />
                                    </div>
                                    End Shift / Sign Out
                                </button>
                            </div>
                        </div>
                     )}
                 </div>
            </div>

            {/* Mobile Toggle */}
            <button 
                className="lg:hidden p-2 text-white"
                onClick={() => setIsMobileMenuOpen(true)}
            >
                <Menu size={28} />
            </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
              <div className="absolute right-0 top-0 h-full w-[280px] bg-slate-900 p-6 shadow-2xl flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                      <span className="font-black text-white text-xl">Menu</span>
                      <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>
                  
                  {/* Mobile Profile Summary */}
                  <div className="mb-8 p-4 bg-slate-800 rounded-2xl flex items-center gap-3 border border-slate-700">
                      <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center text-white font-bold">{initials}</div>
                      <div>
                          <p className="text-white font-bold text-sm">{user?.name}</p>
                          <p className="text-emerald-500 text-xs font-bold uppercase">On Shift</p>
                      </div>
                  </div>

                  <div className="space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`
                                w-full flex items-center px-4 py-4 rounded-xl transition-all
                                ${activePage === item.id 
                                    ? 'bg-violet-600 text-white font-bold' 
                                    : 'text-slate-400 font-medium hover:bg-slate-800 hover:text-white'}
                            `}
                        >
                            <span className="mr-4">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                  </div>
                  <div className="mt-auto border-t border-slate-800 pt-6">
                      <button onClick={() => onNavigate('login')} className="flex items-center gap-3 text-slate-400 hover:text-red-400 font-bold">
                          <LogOut size={20} />
                          Sign Out
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Main Content Wrapper */}
      <main className="pt-28 pb-12 px-4 md:px-8 max-w-[1800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
         {children}
      </main>
    </div>
  );
};