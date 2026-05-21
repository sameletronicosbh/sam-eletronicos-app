import { useTheme } from '../lib/ThemeContext';
import { Moon, Sun, Monitor, Shield, Database, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  const sections = [
    {
      title: "Visual & Interface",
      items: [
        {
          id: 'theme',
          label: 'Modo de Visualização',
          description: 'Alternar entre tema claro e escuro',
          icon: theme === 'dark' ? Moon : Sun,
          action: (
            <button 
              onClick={toggleTheme}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-[var(--sonic-gray-light)] border border-[var(--sonic-border)] transition-colors focus:outline-none"
            >
              <div
                className={cn(
                  "inline-block h-6 w-6 transform rounded-full bg-[var(--sonic-green)] transition-transform shadow-sm",
                  theme === 'dark' ? "translate-x-7" : "translate-x-1"
                )}
              />
            </button>
          )
        }
      ]
    },
    {
      title: "Sistema & Segurança",
      items: [
        {
          id: 'backup',
          label: 'Backup de Dados',
          description: 'Sincronização automática com a nuvem',
          icon: Database,
          action: <div className="text-[10px] font-black uppercase text-[var(--sonic-green)] bg-[var(--sonic-green-light)] px-3 py-1 rounded-full">Ativo</div>
        },
        {
          id: 'security',
          label: 'Segurança da Conta',
          description: 'Gerenciar permissões e acessos',
          icon: Shield,
          action: <button className="text-[10px] font-black uppercase text-gray-500 hover:text-[var(--sonic-green)] underline transition-colors">Gerenciar</button>
        }
      ]
    },
    {
      title: "Notificações",
      items: [
        {
          id: 'whatsapp',
          label: 'Alertas WhatsApp',
          description: 'Notificar clientes automaticamente via API',
          icon: Smartphone,
          action: <div className="text-[10px] font-black uppercase text-gray-500 bg-[var(--sonic-gray-light)] px-3 py-1 rounded-full">Premium</div>
        }
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <header className="pb-8 border-b border-[var(--sonic-border)]">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--sonic-text)]">Configurações<span className="text-[var(--sonic-green)]">.</span></h2>
        <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 mt-1">Personalize sua experiência no Sam.OS</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {sections.map((section, idx) => (
            <motion.section 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 px-4">{section.title}</h3>
              <div className="bg-[var(--sonic-card)] border border-[var(--sonic-border)] rounded-3xl overflow-hidden shadow-sm">
                {section.items.map((item, itemIdx) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "p-8 flex items-center justify-between transition-colors hover:bg-[var(--sonic-gray-light)]/30",
                      itemIdx !== section.items.length - 1 && "border-b border-[var(--sonic-border)]"
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-[var(--sonic-gray-light)] rounded-2xl flex items-center justify-center text-[var(--sonic-green)] transition-colors">
                        <item.icon size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-[var(--sonic-text)]">{item.label}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{item.description}</p>
                      </div>
                    </div>
                    <div>
                      {item.action}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <div className="space-y-8">
          <div className="bg-[var(--sonic-green)] p-10 rounded-3xl text-white shadow-xl shadow-[var(--sonic-green)]/20 relative overflow-hidden group">
            <Shield className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">Sam Pro<span className="text-white/50">.</span></h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-relaxed mb-8">
                Desbloqueie relatórios avançados, integrações com WhatsApp e temas personalizados.
              </p>
              <button className="w-full py-4 bg-white text-[var(--sonic-green)] font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all active:scale-[0.98]">
                Conhecer Planos
              </button>
            </div>
          </div>

          <div className="bg-[var(--sonic-card)] border border-[var(--sonic-border)] p-8 rounded-3xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[var(--sonic-gray-light)] rounded-2xl flex items-center justify-center text-[var(--sonic-green)] mb-4">
               <Monitor size={28} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Versão do Sistema</p>
            <p className="text-xl font-black uppercase tracking-tighter text-[var(--sonic-text)] italic">v2.1.4-build</p>
            <div className="mt-6 pt-6 border-t border-[var(--sonic-border)] w-full">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">© 2026 Sam.OS Enterprise</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
