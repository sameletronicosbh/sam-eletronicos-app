import { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, orderBy, updateDoc, doc } from '../lib/firebase';
import { ServiceOrder, OSStatus, UsedPart } from '../types';
import { Search, Calendar, ChevronRight, MessageCircle, Printer, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatPhone } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import PrintOrder from './PrintOrder';

const statusMap: Record<OSStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: 'Pendente', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100 dark:border-amber-900/30' },
  ANALYZING: { label: 'Em Análise', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100 dark:border-amber-900/30' },
  WAITING_PARTS: { label: 'Ag. Peças', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-100 dark:border-orange-900/30' },
  REPAIRING: { label: 'Em Reparo', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-100 dark:border-blue-900/30' },
  READY: { label: 'Pronto', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-100 dark:border-purple-900/30' },
  DELIVERED: { label: 'Entregue', color: 'text-[var(--sonic-green)]', bg: 'bg-[var(--sonic-green-light)] dark:bg-[var(--sonic-green)]/10', border: 'border-[var(--sonic-green)]/20' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-100 dark:border-red-900/30' },
};

export default function OrderList() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Advanced features and values edits
  const [noteInput, setNoteInput] = useState('');
  const [partsEdit, setPartsEdit] = useState<number>(0);
  const [usedPartsEdit, setUsedPartsEdit] = useState<UsedPart[]>([]);
  const [editPartName, setEditPartName] = useState('');
  const [editPartCost, setEditPartCost] = useState('');
  const [laborEdit, setLaborEdit] = useState<number>(0);
  const [discountEdit, setDiscountEdit] = useState<number>(0);
  const [isEditingCosts, setIsEditingCosts] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'service_orders'), orderBy('entryDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbOrders = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ServiceOrder));
      setOrders(dbOrders);
      
      // Keep selected order updated with real-time snapshot
      if (selectedOrder) {
        const found = dbOrders.find((o: ServiceOrder) => o.id === selectedOrder.id);
        if (found) setSelectedOrder(found);
      }
    });
    return unsubscribe;
  }, [selectedOrder?.id]);

  // Sync edit states when selection changes
  useEffect(() => {
    if (selectedOrder) {
      setPartsEdit(selectedOrder.partsCost || 0);
      setUsedPartsEdit(selectedOrder.usedParts || []);
      setLaborEdit(selectedOrder.laborCost || 0);
      setDiscountEdit(selectedOrder.discount || 0);
      setIsEditingCosts(false);
      setNoteInput('');
      setEditPartName('');
      setEditPartCost('');
    }
  }, [selectedOrder?.id]);

  const getDaysStagnant = (entryDate: string) => {
    try {
      const diff = Date.now() - new Date(entryDate).getTime();
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  const handleStatusUpdate = async (newStatus: OSStatus) => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, 'service_orders', selectedOrder.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === 'DELIVERED' ? { deliveryDate: new Date().toISOString() } : {})
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditAddPart = () => {
    if (!editPartName.trim()) return;
    const costNum = parseFloat(editPartCost) || 0;
    const newPart: UsedPart = {
      id: 'part_' + Math.random().toString(36).substring(2, 9),
      name: editPartName.trim().toUpperCase(),
      cost: costNum
    };
    const updatedParts = [...usedPartsEdit, newPart];
    setUsedPartsEdit(updatedParts);
    setEditPartName('');
    setEditPartCost('');

    const totalPartsCost = updatedParts.reduce((sum, p) => sum + p.cost, 0);
    setPartsEdit(totalPartsCost);
  };

  const handleEditRemovePart = (id: string) => {
    const updatedParts = usedPartsEdit.filter(p => p.id !== id);
    setUsedPartsEdit(updatedParts);
    
    const totalPartsCost = updatedParts.reduce((sum, p) => sum + p.cost, 0);
    setPartsEdit(totalPartsCost);
  };

  const handleUpdateFinancials = async () => {
    if (!selectedOrder) return;
    try {
      const calculatedTotal = Math.max(0, (partsEdit + laborEdit) - discountEdit);
      await updateDoc(doc(db, 'service_orders', selectedOrder.id), {
        partsCost: partsEdit,
        usedParts: usedPartsEdit,
        laborCost: laborEdit,
        discount: discountEdit,
        totalCost: calculatedTotal,
        updatedAt: new Date().toISOString()
      });
      setIsEditingCosts(false);
    } catch (e) {
      console.error("Error updating financials", e);
    }
  };

  const handleAddContactNote = async () => {
    if (!selectedOrder || !noteInput.trim()) return;
    try {
      const newNote = {
        id: 'note_' + Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        text: noteInput.trim().toUpperCase(),
        author: 'SUPORTE TÉCNICO'
      };
      
      const currentNotes = selectedOrder.contactNotes || [];
      const updatedNotes = [...currentNotes, newNote];

      await updateDoc(doc(db, 'service_orders', selectedOrder.id), {
        contactNotes: updatedNotes,
        updatedAt: new Date().toISOString()
      });

      setNoteInput('');
    } catch (e) {
      console.error("Error adding contact note", e);
    }
  };

  const handleWhatsAppShare = (order: ServiceOrder) => {
    const statusLabel = statusMap[order.status].label;
    const message = `*SAM ELETRÔNICOS - Atualização OS #${String(order.orderNumber || '').padStart(4, '0')}*

Olá, ${order.clientName}! 
Temos uma atualização sobre o seu serviço.

*Dispositivo:* ${order.deviceModel}
*Protocolo:* ${order.protocol}
*Status Atual:* ${statusLabel.toUpperCase()}

Você pode acompanhar os detalhes entrando em contato.
Obrigado!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = order.clientPhone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const filteredOrders = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.protocol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[var(--sonic-border)]">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--sonic-text)]">Ordens de Serviço<span className="text-[var(--sonic-green)]">.</span></h2>
          <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 mt-1">Gerenciamento Técnico e Atendimentos</p>
        </div>
        <div className="flex bg-[var(--sonic-gray-light)] p-1.5 rounded-2xl border border-[var(--sonic-border)]">
          {(['ALL', 'PENDING', 'DELIVERED'] as const).map((filter) => (
            <button key={filter} className={cn(
              "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
              filter === 'ALL' ? "bg-[var(--sonic-card)] text-[var(--sonic-text)] shadow-sm" : "text-gray-400 hover:text-[var(--sonic-text)]"
            )}>
              {filter === 'ALL' ? 'Todos' : filter === 'PENDING' ? 'Em Aberto' : 'Finalizados'}
            </button>
          ))}
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="BUSCAR POR CLIENTE, PROTOCOLO OU DISPOSITIVO..."
          className="w-full bg-[var(--sonic-card)] border border-[var(--sonic-border)] pl-16 pr-6 py-6 rounded-2xl font-bold uppercase tracking-tight text-sm outline-none focus:ring-2 focus:ring-[var(--sonic-green)]/20 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => (
            <motion.div 
              layout
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedOrder(order)}
              className="metro-card p-8 border border-[var(--sonic-border)] shadow-sm cursor-pointer group flex flex-col relative overflow-hidden transition-all hover:border-[var(--sonic-green)]/20 rounded-xl"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-[var(--sonic-green)] uppercase tracking-widest leading-none">#{order.orderNumber?.toString().padStart(4, '0')}</span>
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] border",
                  statusMap[order.status].bg,
                  statusMap[order.status].color,
                  statusMap[order.status].border
                )}>
                  {statusMap[order.status].label}
                </div>
              </div>

              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2 text-[var(--sonic-text)] group-hover:text-[var(--sonic-green)] transition-colors line-clamp-1">{order.deviceModel}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mb-4">— {order.clientName}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <>
                    {getDaysStagnant(order.entryDate) >= 7 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8.5px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20 rounded-md animate-pulse">
                        ⚠️ ALERTA: {getDaysStagnant(order.entryDate)} DIAS PARADO
                      </span>
                    ) : getDaysStagnant(order.entryDate) >= 3 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8.5px] font-black uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-md">
                        ⏱️ {getDaysStagnant(order.entryDate)} DIAS PARADO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8.5px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                        ⏱️ {getDaysStagnant(order.entryDate)} DIA(S) NO LAB
                      </span>
                    )}
                  </>
                )}

                {order.totalCost > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8.5px] font-black uppercase bg-[var(--sonic-green)]/15 text-[var(--sonic-green)] border border-[var(--sonic-green)]/30 rounded-md font-mono">
                    R$ {order.totalCost.toFixed(2)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8.5px] font-black uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md">
                    REPARO S/ VALOR
                  </span>
                )}
              </div>
              
              <div className="mt-auto pt-6 flex justify-between items-center bg-[var(--sonic-gray-light)]/50 -mx-8 -mb-8 px-8 py-6 rounded-b-xl border-t border-[var(--sonic-border)]">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[var(--sonic-green)]" />
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                    {format(new Date(order.entryDate), 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--sonic-text)] flex items-center gap-2">
                  DETALHES <ChevronRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--sonic-card)] flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-[var(--sonic-border)]"
            >
              <div className="p-10 border-b border-[var(--sonic-border)] flex justify-between items-start bg-[var(--sonic-green-light)]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[var(--sonic-green)]">PROT: {selectedOrder.protocol}</p>
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none text-[var(--sonic-text)]">{selectedOrder.deviceModel}</h3>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="bg-[var(--sonic-card)] text-[var(--sonic-text)] p-3 hover:bg-[var(--sonic-text)] hover:text-[var(--sonic-bg)] transition-colors rounded-2xl shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 overflow-y-auto space-y-12 custom-scrollbar flex-1">
                <div className="grid grid-cols-2 gap-12 border-b border-[var(--sonic-border)] pb-8">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-gray-400">Cliente</h4>
                    <p className="text-xl font-black uppercase text-[var(--sonic-text)] leading-tight">{selectedOrder.clientName}</p>
                    <p className="text-xs font-bold text-gray-400 mt-2">{formatPhone(selectedOrder.clientPhone)}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-gray-400">Status OS</h4>
                    <div className={cn(
                      "inline-flex px-4 py-2 rounded-xl text-[10px] font-black uppercase border mb-2",
                      statusMap[selectedOrder.status].bg,
                      statusMap[selectedOrder.status].color,
                      statusMap[selectedOrder.status].border
                    )}>
                      {statusMap[selectedOrder.status].label}
                    </div>
                    {/* Stagnant warning directly in details */}
                    {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                      <div className="mt-2">
                        {getDaysStagnant(selectedOrder.entryDate) >= 7 ? (
                          <span className="block text-[10px] font-black text-red-500 uppercase tracking-wider animate-pulse">
                            🚨 PARADO HÁ {getDaysStagnant(selectedOrder.entryDate)} DIAS NA EMPRESA!
                          </span>
                        ) : (
                          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            ⏱️ TEMPO PARADO: {getDaysStagnant(selectedOrder.entryDate)} DIA(S)
                          </span>
                        )}
                        <span className="text-[9px] text-gray-500 block">Entrada em {format(new Date(selectedOrder.entryDate), 'dd/MM/yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACCESSORIES & PHYSICAL CONDITION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[var(--sonic-border)] pb-8">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-gray-400">Estado Físico de Entrada</h4>
                    <p className="text-xs font-bold uppercase text-[var(--sonic-text)] bg-[var(--sonic-bg)] p-4 rounded-xl border border-[var(--sonic-border)]">
                      {selectedOrder.physicalCondition || 'NENHUMA OBSERVAÇÃO DE ESTADO FÍSICO REGISTRADA.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-gray-400">Ítens Deixados (Checklist)</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.accessories && selectedOrder.accessories.length > 0 ? (
                        selectedOrder.accessories.map((acc, i) => (
                          <span key={i} className="px-3 py-1.5 bg-[var(--sonic-green-light)] dark:bg-[var(--sonic-green)]/10 text-[9px] font-black border border-[var(--sonic-green)]/20 text-[var(--sonic-green)] dark:text-white rounded-lg uppercase">
                            ✓ {acc.replace('_', ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 font-bold uppercase">Nenhum acessório deixado.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* FINANCIAL MANAGEMENT BOX */}
                <div className="bg-[var(--sonic-bg)] border border-[var(--sonic-border)] p-8 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center border-b border-[var(--sonic-border)] pb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--sonic-green)]">VALORES E ORÇAMENTO DO SERVIÇO</h4>
                    <button
                      onClick={() => setIsEditingCosts(!isEditingCosts)}
                      className="px-4 py-2 border border-[var(--sonic-border)] text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-[var(--sonic-text)] hover:text-[var(--sonic-bg)] transition-colors"
                    >
                      {isEditingCosts ? "CONCLUIR EDICÃO" : "EDITAR VALORES"}
                    </button>
                  </div>

                  {isEditingCosts ? (
                    <div className="space-y-4">
                      {/* Form de Edição de Peças */}
                      <div className="border border-[var(--sonic-border)] rounded-xl p-4 bg-[var(--sonic-card)] space-y-4">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          🔧 Detalhamento de Peças Usadas
                        </span>
                        
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="NOME DA PEÇA (EX: TELA IPHONE 11)"
                            className="flex-1 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] px-3 py-2 text-xs font-bold rounded-lg outline-none text-[var(--sonic-text)] uppercase"
                            value={editPartName}
                            onChange={(e) => setEditPartName(e.target.value)}
                          />
                          <input 
                            type="number" 
                            placeholder="VALOR R$"
                            className="w-24 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] px-3 py-2 text-xs font-bold rounded-lg outline-none text-[var(--sonic-text)] font-mono"
                            value={editPartCost}
                            onChange={(e) => setEditPartCost(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={handleEditAddPart}
                            className="bg-[var(--sonic-green)] text-black hover:bg-black hover:text-white px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-wider transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {usedPartsEdit.length > 0 ? (
                          <div className="border border-[var(--sonic-border)] rounded-lg overflow-hidden divide-y divide-[var(--sonic-border)] bg-[var(--sonic-bg)]/50">
                            {usedPartsEdit.map((part) => (
                              <div key={part.id} className="flex justify-between items-center p-3">
                                <span className="text-[10px] font-bold uppercase text-[var(--sonic-text)]">{part.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] font-bold font-mono text-[var(--sonic-green)]">R$ {part.cost.toFixed(2)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleEditRemovePart(part.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[9px] uppercase font-bold text-gray-500">Nenhuma peça discriminada para este orçamento ainda.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-2">PEÇAS (R$)</label>
                          <input
                            type="number"
                            disabled={usedPartsEdit.length > 0}
                            className={cn(
                              "w-full bg-[var(--sonic-card)] border border-[var(--sonic-border)] px-3 py-2 text-xs font-bold rounded-lg outline-none text-[var(--sonic-text)] font-mono",
                              usedPartsEdit.length > 0 && "opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-dashed"
                            )}
                            value={partsEdit || ''}
                            onChange={(e) => setPartsEdit(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-2">MÃO DE OBRA (R$)</label>
                          <input
                            type="number"
                            className="w-full bg-[var(--sonic-card)] border border-[var(--sonic-border)] px-3 py-2 text-xs font-bold rounded-lg outline-none text-[var(--sonic-text)] font-mono"
                            value={laborEdit || ''}
                            onChange={(e) => setLaborEdit(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-2">DESCONTO (R$)</label>
                          <input
                            type="number"
                            className="w-full bg-[var(--sonic-card)] border border-[var(--sonic-border)] px-3 py-2 text-xs font-bold rounded-lg outline-none text-[var(--sonic-text)] font-mono"
                            value={discountEdit || ''}
                            onChange={(e) => setDiscountEdit(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleUpdateFinancials}
                          className="flex-1 py-3 bg-[var(--sonic-green)] text-black rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all shadow-md"
                        >
                          CONFIRMAR E SALVAR VALORES
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingCosts(false);
                            setPartsEdit(selectedOrder.partsCost || 0);
                            setUsedPartsEdit(selectedOrder.usedParts || []);
                            setLaborEdit(selectedOrder.laborCost || 0);
                            setDiscountEdit(selectedOrder.discount || 0);
                          }}
                          className="px-4 py-3 bg-[var(--sonic-card)] border border-[var(--sonic-border)] text-gray-400 hover:text-[var(--sonic-text)] rounded-lg font-black uppercase text-[10px] tracking-widest"
                        >
                          CANCELAR
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 block uppercase">PEÇAS</span>
                        <span className="text-sm font-black font-mono text-[var(--sonic-text)]">R$ {(selectedOrder.partsCost || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 block uppercase">MÃO DE OBRA</span>
                        <span className="text-sm font-black font-mono text-[var(--sonic-text)]">R$ {(selectedOrder.laborCost || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 block uppercase">DESCONTO</span>
                        <span className="text-sm font-black font-mono text-red-500">R$ {(selectedOrder.discount || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-l border-[var(--sonic-border)] pl-4">
                        <span className="text-[8px] font-black text-[var(--sonic-green)] block uppercase">TOTAL FINAL</span>
                        <span className="text-lg font-black font-mono text-[var(--sonic-green)]">R$ {(selectedOrder.totalCost || 0).toFixed(2)}</span>
                      </div>

                      {selectedOrder.usedParts && selectedOrder.usedParts.length > 0 && (
                        <div className="col-span-2 md:col-span-4 mt-6 pt-6 border-t border-[var(--sonic-border)] space-y-3">
                          <h5 className="text-[9px] font-black uppercase text-gray-450 tracking-wider">📦 PEÇAS DISCRIMINADAS NESTE CONSERTO</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedOrder.usedParts.map((part) => (
                              <div key={part.id} className="flex justify-between items-center p-3 bg-[var(--sonic-card)] border border-[var(--sonic-border)] rounded-xl">
                                <span className="text-[10px] font-black uppercase text-gray-300">{part.name}</span>
                                <span className="text-[10px] font-bold font-mono text-[var(--sonic-green)]">R$ {part.cost.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-gray-400">Relato Técnico Inicial</h4>
                  <div className="bg-[var(--sonic-bg)] p-8 rounded-2xl border border-[var(--sonic-border)] text-[var(--sonic-text)] text-sm leading-relaxed font-medium">
                    {selectedOrder.problemDescription}
                  </div>
                </div>

                {/* CONTACT LOGS & TIMELINE */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Histórico de Contatos & Observações</h4>
                  
                  {/* Timeline representation */}
                  <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {selectedOrder.contactNotes && selectedOrder.contactNotes.length > 0 ? (
                      selectedOrder.contactNotes.map((note, index) => (
                        <div key={note.id || index} className="flex gap-4 items-start bg-[var(--sonic-bg)]/40 p-4 rounded-xl border border-[var(--sonic-border)]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--sonic-green)] mt-1.5 shrink-0 shadow-[0_0_8px_var(--sonic-green)]" />
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{note.author}</span>
                              <span className="text-[8px] font-semibold text-gray-500 font-mono">
                                {format(new Date(note.date), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="text-xs font-bold uppercase text-[var(--sonic-text)] leading-relaxed">{note.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 font-bold uppercase py-2">Nenhum contato registrado com este cliente.</p>
                    )}
                  </div>

                  {/* Add note interface */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="REGISTRAR ATENDIMENTO OU DETALHES DE CONTATO..."
                      className="flex-1 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] px-4 py-3 text-xs font-bold uppercase rounded-xl outline-none focus:ring-2 focus:ring-[var(--sonic-green)]/30 text-[var(--sonic-text)]"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddContactNote(); }}
                    />
                    <button
                      onClick={handleAddContactNote}
                      disabled={!noteInput.trim()}
                      className="px-6 py-3 bg-[var(--sonic-text)] text-[var(--sonic-bg)] hover:bg-[var(--sonic-green)] hover:text-black transition-colors rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      REGISTRAR
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Atualizar Progresso</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.keys(statusMap).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(status as OSStatus)}
                        className={cn(
                          "py-4 text-[9px] font-black uppercase tracking-widest border-2 transition-all rounded-xl",
                          selectedOrder.status === status 
                            ? "bg-[var(--sonic-green)] border-[var(--sonic-green)] text-black shadow-lg" 
                            : "bg-[var(--sonic-card)] border-[var(--sonic-border)] text-gray-400 hover:border-[var(--sonic-green)]/30 hover:text-[var(--sonic-green)]"
                        )}
                      >
                        {statusMap[status as OSStatus].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[var(--sonic-gray-light)] border-t border-[var(--sonic-border)] flex gap-4 no-print rounded-b-2xl">
                <button 
                  onClick={() => handleWhatsAppShare(selectedOrder)}
                  className="h-16 w-16 bg-[var(--sonic-card)] text-[var(--sonic-green)] flex items-center justify-center hover:bg-[var(--sonic-green)] hover:text-white border border-[var(--sonic-border)] rounded-2xl transition-all shadow-sm group"
                  title="Enviar via WhatsApp"
                >
                  <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={() => setIsPrintOpen(true)}
                  className="h-16 w-16 bg-[var(--sonic-card)] text-[var(--sonic-text)] flex items-center justify-center hover:bg-[var(--sonic-text)] hover:text-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-2xl transition-all shadow-sm"
                  title="Imprimir Protocolo"
                >
                  <Printer size={24} />
                </button>
                <button 
                  onClick={() => handleStatusUpdate(selectedOrder.status)}
                  className="flex-1 bg-[var(--sonic-green)] text-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {selectedOrder && <PrintOrder order={selectedOrder} isOpen={isPrintOpen} onClose={() => setIsPrintOpen(false)} />}
    </div>
  );
}
