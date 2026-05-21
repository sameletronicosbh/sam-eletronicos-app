import { useState } from 'react';
import { LayoutDashboard, ClipboardList, UserPlus, Users, Settings, Menu, X, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../lib/ThemeContext';

interface NavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Control', icon: LayoutDashboard },
    { id: 'orders', label: 'Ordens de Serviço', icon: ClipboardList },
    { id: 'new-order', label: 'Novo Registro', icon: UserPlus },
    { id: 'clients', label: 'Base de Clientes', icon: Users },
    { id: 'settings', label: 'Estatísticas & Config', icon: Settings },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--sonic-bg)] border-b border-[var(--sonic-border)] flex items-center justify-between px-6 z-[60]">
        <h1 className="text-xl font-black tracking-tighter text-[var(--sonic-green)]">SAM<span className="text-[var(--sonic-text)]">.TEC</span></h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-[var(--sonic-green)]">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-[var(--sonic-bg)] border-r border-[var(--sonic-border)] transition-transform duration-300 ease-in-out z-[70]",
        "md:translate-x-0 md:static h-screen flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[var(--sonic-green)]">
            SAM<span className="text-[var(--sonic-text)]">.TEC</span>
          </h1>
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 mt-1">SISTEMA TÉCNICO V2</p>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-xl font-bold uppercase tracking-tight text-[11px] transition-all",
                activeTab === item.id 
                  ? "bg-[var(--sonic-green)] text-white shadow-lg" 
                  : "text-gray-500 hover:bg-[var(--sonic-gray-light)]"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-[var(--sonic-border)] space-y-4">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-[var(--sonic-gray-light)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--sonic-green)]/10 transition-colors"
          >
            <span className="flex items-center gap-3">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </button>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 text-center opacity-50">
            Sam.OS Enterprise v2.5
          </p>
        </div>
      </aside>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[65] md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
