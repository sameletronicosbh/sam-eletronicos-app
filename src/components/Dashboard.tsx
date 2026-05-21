import { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, orderBy, limit } from '../lib/firebase';
import { ServiceOrder } from '../types';
import { Clock, CheckCircle2, TrendingUp, Wrench, UserPlus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    repairing: 0,
    ready: 0,
    completedMonth: 0,
    stagnantCount: 0,
    anticipatedRevenue: 0,
    receivedRevenue: 0,
    waitingPartsCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<ServiceOrder[]>([]);
  const [stagnantOrders, setStagnantOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    // Fetch recent updates
    const q = query(collection(db, 'service_orders'), orderBy('updatedAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ServiceOrder));
      setRecentOrders(orders);
    }, (error: any) => console.error("Firebase dashboard error:", error));

    const qAll = query(collection(db, 'service_orders'));
    const unsubscribeStats = onSnapshot(qAll, (snapshot) => {
      const all = snapshot.docs.map((doc: any) => doc.data() as ServiceOrder);
      const now = Date.now();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Anything open for more than 5 days is stagnant
      const stagnantThreshold = now - (5 * 24 * 3600 * 1000);
      const itemsStagnant = all.filter((o: ServiceOrder) => {
        const isNotFinished = o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
        const entryTimestamp = new Date(o.entryDate).getTime();
        return isNotFinished && entryTimestamp < stagnantThreshold;
      });

      const revenueAnticipated = all
        .filter((o: ServiceOrder) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
        .reduce((sum: number, o: ServiceOrder) => sum + (o.totalCost || 0), 0);

      const revenueReceived = all
        .filter((o: ServiceOrder) => o.status === 'DELIVERED' && o.deliveryDate && o.deliveryDate >= monthStart)
        .reduce((sum: number, o: ServiceOrder) => sum + (o.totalCost || 0), 0);

      setStagnantOrders(itemsStagnant);

      setStats({
        total: all.length,
        open: all.filter((o: ServiceOrder) => o.status === 'PENDING').length,
        repairing: all.filter((o: ServiceOrder) => o.status === 'REPAIRING').length,
        ready: all.filter((o: ServiceOrder) => o.status === 'READY').length,
        completedMonth: all.filter((o: ServiceOrder) => o.status === 'DELIVERED' && o.deliveryDate && o.deliveryDate >= monthStart).length,
        stagnantCount: itemsStagnant.length,
        anticipatedRevenue: revenueAnticipated,
        receivedRevenue: revenueReceived,
        waitingPartsCount: all.filter((o: ServiceOrder) => o.status === 'WAITING_PARTS').length
      });
    });

    return () => {
      unsubscribe();
      unsubscribeStats();
    };
  }, []);

  return (
    <div className="space-y-20">
      <header className="relative overflow-hidden p-16 rounded-[3rem] bg-[var(--sonic-text)] text-[var(--sonic-bg)] border border-[var(--sonic-border)] group">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--sonic-green)] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-[var(--sonic-green)] text-black rounded-full font-black uppercase tracking-widest text-[9px] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
            </span>
            System Live State
          </div>
          
          <h2 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] m-0">
            CONTROL<br />
            <span className="text-[var(--sonic-green)]">CENTER.</span>
          </h2>
          
          <div className="flex flex-wrap gap-4 mt-12">
            <button 
              onClick={() => setActiveTab('new-order')}
              className="bg-[var(--sonic-green)] text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[var(--sonic-green)]/20"
            >
              Abrir Registro Técnico
            </button>
            <button 
              onClick={() => setActiveTab('clients')}
              className="bg-transparent text-white border-2 border-white/10 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all"
            >
              Base de Clientes
            </button>
          </div>
        </div>
      </header>

      {/* FINANCIAL & SYSTEM STATISTICS GRID */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 text-gray-400">DESEMPENHO FINANCEIRO & OPERACIONAL</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[
            { label: 'Em Aberto', value: stats.open, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { label: 'Sob Manutenção', value: stats.repairing, icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Prontos p/ Retirada', value: stats.ready, icon: CheckCircle2, color: 'text-[var(--sonic-green)]', bg: 'bg-[var(--sonic-green-light)]' },
            { 
              label: 'Previsto Estimado', 
              value: `R$ ${stats.anticipatedRevenue.toFixed(2)}`, 
              icon: TrendingUp, 
              color: 'text-[var(--sonic-green)]', 
              bg: 'bg-[var(--sonic-green-light)]',
              isCurrency: true
            },
            { 
              label: 'Realizado (Mes)', 
              value: `R$ ${stats.receivedRevenue.toFixed(2)}`, 
              icon: TrendingUp, 
              color: 'text-purple-500', 
              bg: 'bg-purple-50 dark:bg-purple-950/30',
              isCurrency: true
            },
            { 
              label: 'Parados/Estagnados (>5d)', 
              value: stats.stagnantCount, 
              icon: Clock, 
              color: stats.stagnantCount > 0 ? 'text-red-500' : 'text-gray-400', 
              bg: stats.stagnantCount > 0 ? 'bg-red-500/10' : 'bg-gray-100 dark:bg-gray-800/30',
              isAlert: stats.stagnantCount > 0
            }
          ].map((item, idx) => (
            <div key={idx} className={cn(
              "metro-card flex flex-col justify-between p-6 min-h-[140px]",
              item.isAlert && "border-red-500/30 hover:border-red-500/50"
            )}>
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 leading-tight pr-2">{item.label}</p>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.bg, item.color)}>
                  <item.icon size={16} />
                </div>
              </div>
              <div className={cn(
                "text-2xl font-black mt-4 font-mono leading-none tracking-tight",
                item.isAlert && "text-red-500 animate-pulse",
                item.isCurrency ? "text-[21px]" : "text-3xl"
              )}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DYNAMIC ALERT: STAGNANT / IDLE ORDERS NEEDING CONTACT */}
      {stagnantOrders.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h3 className="text-xl font-black uppercase tracking-tighter text-red-500 text-shadow-sm">
              ALERTA: {stats.stagnantCount} ORDENS PARADAS HÁ MAIS DE 5 DIAS
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stagnantOrders.map((order) => {
              const days = Math.floor((Date.now() - new Date(order.entryDate).getTime()) / (1000 * 3600 * 24));
              return (
                <div 
                  key={order.id} 
                  onClick={() => setActiveTab('orders')}
                  className="metro-card p-6 border-red-500/20 bg-red-500/5 hover:border-red-500/40 cursor-pointer flex flex-col justify-between group transition-all"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[9px] font-black text-red-400 font-mono">#{order.orderNumber?.toString().padStart(4, '0')}</span>
                      <span className="text-[8px] font-black uppercase bg-red-500 text-white px-2 py-0.5 rounded leading-none">
                        {days} DIAS PARADO
                      </span>
                    </div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-[var(--sonic-text)] group-hover:text-red-400 transition-colors">{order.deviceModel}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">— Clie: {order.clientName}</p>
                    {order.contactNotes && order.contactNotes.length > 0 ? (
                      <p className="text-[9.5px] font-medium text-gray-500 bg-black/10 p-2.5 rounded-lg border border-[var(--sonic-border)] mt-4 line-clamp-2 uppercase">
                        obs: {order.contactNotes[order.contactNotes.length - 1].text}
                      </p>
                    ) : (
                      <p className="text-[9.5px] font-medium text-gray-500 italic mt-4 uppercase">Nenhum retorno/contato registrado ainda.</p>
                    )}
                  </div>
                  <div className="border-t border-red-500/10 pt-4 mt-6 flex justify-between items-center">
                    <span className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none">Status: {order.status}</span>
                    <span className="text-[9px] font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-1">Ver OS →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 pt-8">
        <section className="xl:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-2xl font-black uppercase tracking-tighter">Atividades Recentes</h3>
            <button onClick={() => setActiveTab('orders')} className="text-[10px] font-black uppercase tracking-widest text-[var(--sonic-green)] hover:underline">Ver Todas →</button>
          </div>
          <div className="metro-card overflow-hidden p-0 border-none shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--sonic-gray-light)] text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-8 py-6">Equipamento</th>
                  <th className="px-8 py-6">Progresso</th>
                  <th className="px-8 py-6">Data Entrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sonic-border)] bg-[var(--sonic-card)]">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--sonic-green)]/5 transition-colors cursor-pointer group" onClick={() => setActiveTab('orders')}>
                    <td className="px-8 py-6">
                      <div className="font-black text-sm uppercase tracking-tight text-[var(--sonic-text)] group-hover:text-[var(--sonic-green)] transition-colors">{order.deviceModel}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1 opacity-60">{order.clientName}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 bg-[var(--sonic-gray-light)] rounded-lg border border-[var(--sonic-border)] text-gray-500">{order.status}</span>
                    </td>
                    <td className="px-8 py-6 text-[11px] font-black font-mono text-gray-400">
                      {format(new Date(order.entryDate), 'dd.MM.yy')}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-16 text-center text-gray-400 uppercase font-black tracking-widest text-xs opacity-30 italic">AGUARDANDO NOVOS REGISTROS...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-8">
          <h3 className="text-2xl font-black uppercase tracking-tighter px-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveTab('new-order')}
              className="metro-tile aspect-square"
            >
              <UserPlus size={32} className="text-[var(--sonic-green)]" />
              <span className="text-[9px] font-black leading-tight border-b-2 border-transparent hover:border-[var(--sonic-green)] pb-1">Cadastrar OS</span>
            </button>
            <button 
              onClick={() => setActiveTab('clients')}
              className="metro-tile aspect-square"
            >
              <Users size={32} className="text-blue-500" />
              <span className="text-[9px] font-black leading-tight">Clientes</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className="metro-tile aspect-square"
            >
              <TrendingUp size={32} className="text-purple-500" />
              <span className="text-[9px] font-black leading-tight">Relatórios</span>
            </button>
            <button 
              className="metro-tile aspect-square group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-red-500/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              <Clock size={32} className="text-gray-400 group-hover:text-red-500 transition-colors z-10" />
              <span className="text-[9px] font-black leading-tight z-10">Urgências</span>
            </button>
          </div>
          
          <div className="metro-card bg-[var(--sonic-text)] text-[var(--sonic-bg)] dark:bg-[var(--sonic-card)] dark:text-[var(--sonic-text)] dark:border dark:border-[var(--sonic-border)] border-none p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Wrench size={80} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--sonic-green)] mb-2">Suporte Técnico</p>
            <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-6">Precisa de ajuda com o sistema?</h4>
            <button className="text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--sonic-bg)] text-[var(--sonic-text)] dark:bg-white dark:text-black px-6 py-3 rounded-xl hover:bg-[var(--sonic-green)] hover:text-black transition-all">Abrir Ticket →</button>
          </div>
        </section>
      </div>
    </div>
  );
}
