import { useState, useEffect, useRef } from 'react';
import { db, auth, collection, addDoc, getDocs } from '../lib/firebase';
import { OSPriority, Client, UsedPart } from '../types';
import { UserPlus, Search, Smartphone, Mic, MicOff, CheckCircle2, MessageCircle, Printer, Camera, X, Calendar, Plus, Trash2 } from 'lucide-react';
import { cn, formatPhone, normalizeSearch } from '../lib/utils';
import { format } from 'date-fns';
import PrintOrder from './PrintOrder';

interface OrderFormProps {
  onSuccess: () => void;
}

export default function OrderForm({ onSuccess }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);

  // Client states
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    cpf: '',
    email: '',
    cep: '',
    address: '',
    neighborhood: '',
    city: ''
  });

  // OS states
  const [deviceModel, setDeviceModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [priority, setPriority] = useState<OSPriority>('MEDIUM');
  const [images, setImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  // Financial and modern receipt details
  const [usedParts, setUsedParts] = useState<UsedPart[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartCost, setNewPartCost] = useState('');
  const [partsCost, setPartsCost] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [accessories, setAccessories] = useState<string[]>([]);
  const [physicalCondition, setPhysicalCondition] = useState('');
  const [initialNote, setInitialNote] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      const querySnapshot = await getDocs(collection(db, 'clients'));
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    };
    fetchClients();
  }, []);

  const handleWhatsAppShare = (order: any) => {
    const message = `*SAM ELETRÔNICOS - Protocolo #${String(order.orderNumber || '').padStart(4, '0')}*

Olá, ${order.clientName}! 
Sua Ordem de Serviço foi gerada com sucesso.

*Dispositivo:* ${order.deviceModel}
*Protocolo:* ${order.protocol}
*Status:* Pendente
*Data de Entrada:* ${format(new Date(), "dd/MM/yyyy")}

Você pode acompanhar o status do seu serviço entrando em contato conosco.
Obrigado pela preferência!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = order.clientPhone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz nativo. Por favor, utilize o Google Chrome ou Microsoft Edge no computador.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const currentResultIndex = event.resultIndex;
        const transcript = event.results[currentResultIndex][0].transcript;
        if (transcript) {
          setProblemDescription(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event);
        stopRecording();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Failed to stop speech recognition:", err);
      }
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const costNum = parseFloat(newPartCost) || 0;
    const newPart: UsedPart = {
      id: 'part_' + Math.random().toString(36).substring(2, 9),
      name: newPartName.trim().toUpperCase(),
      cost: costNum
    };
    const updatedParts = [...usedParts, newPart];
    setUsedParts(updatedParts);
    setNewPartName('');
    setNewPartCost('');

    // Automatically sum details to partsCost
    const totalPartsCost = updatedParts.reduce((sum, part) => sum + part.cost, 0);
    setPartsCost(totalPartsCost);
  };

  const handleRemovePart = (id: string) => {
    const updatedParts = usedParts.filter(part => part.id !== id);
    setUsedParts(updatedParts);
    const totalPartsCost = updatedParts.reduce((sum, part) => sum + part.cost, 0);
    setPartsCost(totalPartsCost);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalClientId = selectedClientId;
      let clientName = '';
      let clientPhone = '';

      if (isAddingNewClient) {
        const docRef = await addDoc(collection(db, 'clients'), {
          ...newClient,
          createdAt: new Date().toISOString()
        });
        finalClientId = docRef.id;
        clientName = newClient.name;
        clientPhone = newClient.phone;
      } else {
        const client = clients.find(c => c.id === selectedClientId);
        clientName = client?.name || '';
        clientPhone = client?.phone || '';
      }

      const protocol = `OS-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderNumber = Math.floor(Math.random() * 1000);

      const calculatedTotal = Math.max(0, (partsCost + laborCost) - discount);
      
      // Determine the timestamp for entry
      let finalEntryDate = new Date().toISOString();
      if (entryDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (entryDate !== todayStr) {
          // If different, backdate to noon on that day to prevent timezone shifts
          finalEntryDate = new Date(`${entryDate}T12:00:00`).toISOString();
        }
      }

      const initialNotesArr = initialNote.trim() 
        ? [{ id: 'init_' + Math.random().toString(36).substring(2, 9), date: new Date().toISOString(), text: initialNote, author: 'Atendente' }] 
        : [];

      const orderData = {
        protocol,
        orderNumber,
        clientId: finalClientId || '',
        clientName,
        clientPhone,
        deviceModel: deviceModel.toUpperCase(),
        serialNumber: serialNumber.toUpperCase(),
        problemDescription,
        status: 'PENDING' as const,
        priority,
        partsCost,
        usedParts,
        laborCost,
        discount,
        totalCost: calculatedTotal,
        entryDate: finalEntryDate,
        images,
        createdBy: auth.currentUser?.uid,
        updatedAt: new Date().toISOString(),
        accessories,
        physicalCondition: physicalCondition.toUpperCase(),
        contactNotes: initialNotesArr
      };

      await addDoc(collection(db, 'service_orders'), orderData);
      setLastCreatedOrder(orderData);
    } catch (error) {
      console.error("Error creating OS:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const term = normalizeSearch(searchTerm);
    return normalizeSearch(client.name).includes(term) || 
           client.phone.includes(term) || 
           (client.cpf && client.cpf.includes(term));
  });

  if (lastCreatedOrder) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-12">
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 bg-[var(--sonic-green)] text-white rounded-full flex items-center justify-center shadow-xl shadow-[var(--sonic-green)]/20">
            <CheckCircle2 size={48} />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--sonic-text)]">OS GERADA COM SUCESSO!</h2>
            <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 mt-2">Protocolo: {lastCreatedOrder.protocol}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <button 
            onClick={() => handleWhatsAppShare(lastCreatedOrder)}
            className="flex flex-col items-center justify-center gap-4 p-10 bg-[var(--sonic-card)] border border-[var(--sonic-border)] hover:border-[var(--sonic-green)] hover:bg-[var(--sonic-green-light)]/50 transition-all rounded-3xl group"
          >
            <div className="w-16 h-16 bg-[var(--sonic-green-light)] rounded-full flex items-center justify-center text-[var(--sonic-green)] group-hover:bg-[var(--sonic-green)] group-hover:text-white transition-colors">
              <MessageCircle size={32} />
            </div>
            <span className="font-black uppercase tracking-widest text-[11px] text-[var(--sonic-text)]">Enviar via WhatsApp</span>
          </button>

          <button 
            onClick={() => setIsPrintOpen(true)}
            className="flex flex-col items-center justify-center gap-4 p-10 bg-[var(--sonic-card)] border border-[var(--sonic-border)] hover:border-[var(--sonic-text)] hover:bg-[var(--sonic-gray-light)]/50 transition-all rounded-3xl group"
          >
            <div className="w-16 h-16 bg-[var(--sonic-gray-light)] rounded-full flex items-center justify-center text-gray-400 group-hover:bg-[var(--sonic-text)] group-hover:text-[var(--sonic-bg)] transition-colors">
              <Printer size={32} />
            </div>
            <span className="font-black uppercase tracking-widest text-[11px] text-[var(--sonic-text)]">Imprimir Protocolo</span>
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button 
            onClick={onSuccess}
            className="bg-[var(--sonic-text)] text-[var(--sonic-bg)] hover:text-black px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[var(--sonic-green)] transition-all shadow-xl active:scale-[0.98]"
          >
            Voltar ao Dashboard
          </button>
        </div>
        {lastCreatedOrder && <PrintOrder order={lastCreatedOrder} isOpen={isPrintOpen} onClose={() => setIsPrintOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-20">
      <header className="pb-8 border-b border-[var(--sonic-border)]">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--sonic-text)]">Sam<span className="text-[var(--sonic-green)]">.OS</span></h2>
        <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 mt-1">Geração de Novo Ticket de Serviço</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-[var(--sonic-card)] border border-[var(--sonic-border)] p-10 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-10 border-b border-[var(--sonic-border)] pb-6">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-[var(--sonic-text)]">
              <UserPlus size={20} className="text-[var(--sonic-green)]" />
              IDENTIFICAÇÃO DO CLIENTE
            </h3>
            <button 
              type="button"
              onClick={() => {
                setIsAddingNewClient(!isAddingNewClient);
                setSelectedClientId(null);
              }}
              className="text-[10px] font-black uppercase tracking-widest text-[var(--sonic-green)] hover:underline"
            >
              {isAddingNewClient ? "Selecionar Existente" : "Cadastrar Novo Cliente"}
            </button>
          </div>

          {!isAddingNewClient ? (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="DIGITE NOME, TELEFONE OU CPF PARA BUSCAR..."
                  className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] pl-12 pr-6 py-4 rounded-xl font-bold uppercase text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowClientSearch(true)}
                />
              </div>

              {searchTerm && showClientSearch && (
                <div className="mt-4 border border-[var(--sonic-border)] rounded-xl overflow-hidden divide-y divide-[var(--sonic-border)] shadow-lg bg-[var(--sonic-card)]">
                  {filteredClients.map(client => (
                    <div 
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setSearchTerm(client.name);
                        setShowClientSearch(false);
                      }}
                      className={cn(
                        "flex items-center justify-between p-6 cursor-pointer transition-all",
                        selectedClientId === client.id 
                          ? "border-[var(--sonic-green)] bg-[var(--sonic-green-light)]/50 ring-1 ring-[var(--sonic-green)]" 
                          : "hover:bg-[var(--sonic-gray-light)]"
                      )}
                    >
                      <div>
                        <p className="font-black uppercase tracking-tight text-[var(--sonic-text)]">{client.name}</p>
                        <p className="font-bold text-[10px] text-gray-400 mt-1">{formatPhone(client.phone)} — {client.cpf || 'SEM CPF'}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-[var(--sonic-border)] flex items-center justify-center">
                        <div className={cn("w-3 h-3 rounded-full transition-all", selectedClientId === client.id ? "bg-[var(--sonic-green)] scale-125" : "bg-gray-200")} />
                      </div>
                    </div>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="p-10 text-center text-gray-400 uppercase font-black tracking-widest text-[10px]">
                      Nenhum cliente encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">Nome completo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl px-4 py-3 font-bold uppercase"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">WhatsApp</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl px-4 py-3 font-bold"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: formatPhone(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[var(--sonic-card)] border border-[var(--sonic-border)] p-10 rounded-2xl shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 mb-10 border-b border-[var(--sonic-border)] pb-6 text-[var(--sonic-text)]">
            <Smartphone size={20} className="text-[var(--sonic-green)]" />
            DETALHES DO DISPOSITIVO
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--sonic-green)] uppercase tracking-[0.3em] px-1">MODELO DO APARELHO *</label>
                <input 
                  required
                  placeholder="Ex: IPHONE 15 PRO"
                  type="text" 
                  className="w-full px-6 py-5 bg-[var(--sonic-bg)] border border-[var(--sonic-green)]/10 outline-none font-black uppercase tracking-tight text-xl text-[var(--sonic-text)] rounded-xl shadow-sm focus:ring-2 focus:ring-[var(--sonic-green)]/30 transition-all"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--sonic-green)] uppercase tracking-[0.3em] px-1">IMEI / NÚMERO DE SÉRIE</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-5 bg-[var(--sonic-bg)] border border-[var(--sonic-green)]/10 outline-none font-black uppercase tracking-tight text-xl text-[var(--sonic-text)] rounded-xl shadow-sm focus:ring-2 focus:ring-[var(--sonic-green)]/30 transition-all"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-[var(--sonic-green)] uppercase tracking-[0.3em] px-1">RELATO DO PROBLEMA *</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-[var(--sonic-card)] text-[var(--sonic-green)] border border-[var(--sonic-green)]/10 hover:bg-[var(--sonic-green)] hover:text-white transition-all rounded-lg shadow-sm cursor-pointer">
                    <Camera size={14} />
                    Checklist
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <button 
                    type="button"
                    onClick={toggleRecording}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-lg shadow-sm",
                      isRecording ? "bg-red-500 text-white animate-pulse" : "bg-[var(--sonic-card)] text-[var(--sonic-green)] border border-[var(--sonic-green)]/10 hover:bg-[var(--sonic-green)] hover:text-white"
                    )}
                  >
                    {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                    {isRecording ? "Gravando..." : "Voz"}
                  </button>
                </div>
              </div>
              <textarea 
                required
                rows={5}
                placeholder="Descreva o problema relatado pelo cliente..."
                className="w-full px-8 py-6 bg-[var(--sonic-bg)] border border-[var(--sonic-green)]/10 outline-none font-medium resize-none focus:ring-2 focus:ring-[var(--sonic-green)]/30 transition-all text-[var(--sonic-text)] text-lg rounded-2xl shadow-inner scroll-smooth custom-scrollbar"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
              />
              {images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--sonic-border)] shrink-0">
                      <img src={img} alt="upload" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0 right-0 bg-black/50 text-white p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PRO CAPTURE: RECEIPT DETAILS, BACKDATING & ACCESSORIES */}
        <div className="bg-[var(--sonic-card)] border border-[var(--sonic-border)] p-10 rounded-2xl shadow-sm space-y-10">
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 border-b border-[var(--sonic-border)] pb-6 text-[var(--sonic-text)]">
            <Calendar size={20} className="text-[var(--sonic-green)]" />
            RECEBIMENTO, DATA E CHECKLIST
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">DATA DE ENTRADA (MUDE PARA RETROATIVO se já estiver parado)</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3.5 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] outline-none font-bold text-sm text-[var(--sonic-text)] rounded-xl focus:ring-2 focus:ring-[var(--sonic-green)]/30 transition-all uppercase"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider px-1">Por padrão, hoje. Mude para cadastrar aparelhos antigos parados em sua assistência.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">ESTADO FÍSICO DO APARELHO NA ENTRADA</label>
                <input 
                  type="text"
                  placeholder="EX: EXTREMIDADES COM RISCOS, TELA TRINCADA, TAMPA TRASEIRA IMPECÁVEL"
                  className="w-full px-4 py-3.5 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] outline-none font-bold text-xs uppercase text-[var(--sonic-text)] rounded-xl focus:ring-2 focus:ring-[var(--sonic-green)]/30 transition-all placeholder:text-gray-500"
                  value={physicalCondition}
                  onChange={(e) => setPhysicalCondition(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1 block">ÍTENS DEIXADOS (CHECKLIST)</label>
              <div className="grid grid-cols-2 gap-3">
                {['CARREGADOR', 'CABO USB', 'CAPINHA', 'PELÍCULA', 'CHIP/CHAVE_SIM', 'FONE DE OUVIDO'].map((item) => {
                  const hasItem = accessories.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (hasItem) {
                          setAccessories(prev => prev.filter(x => x !== item));
                        } else {
                          setAccessories(prev => [...prev, item]);
                        }
                      }}
                      className={cn(
                        "py-3 px-4 text-[9px] font-black uppercase tracking-wider border rounded-xl text-left flex items-center justify-between transition-all",
                        hasItem 
                          ? "bg-[var(--sonic-green-light)] border-[var(--sonic-green)] text-[var(--sonic-green)] dark:text-white dark:bg-[var(--sonic-green)]/20" 
                          : "bg-[var(--sonic-bg)] border-[var(--sonic-border)] text-gray-400 hover:border-gray-500"
                      )}
                    >
                      <span>{item.replace('_', ' ')}</span>
                      <span className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold",
                        hasItem ? "bg-[var(--sonic-green)] text-black border-[var(--sonic-green)]" : "border-gray-600"
                      )}>
                        {hasItem && "✕"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* PRO CAPTURE: FINANCIAL VALUES AND HISTORICAL OR FIRST NOTES */}
        <div className="bg-[var(--sonic-card)] border border-[var(--sonic-border)] p-10 rounded-2xl shadow-sm space-y-10">
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 border-b border-[var(--sonic-border)] pb-6 text-[var(--sonic-text)]">
            <span className="text-[var(--sonic-green)]">$</span>
            FINANCEIRO & OBSERVAÇÕES DE ATENDIMENTO
          </h3>

          {/* Listagem de Peças Usadas */}
          <div className="border border-[var(--sonic-border)] rounded-2xl p-6 bg-[var(--sonic-bg)]/40 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-[var(--sonic-text)] flex items-center gap-2">
              🔧 DETALHAMENTO DE PEÇAS USADAS (OPCIONAL)
            </h4>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-1">
                <input 
                  type="text" 
                  placeholder="EX: TELA FRONTAL RETINA IPHONE 11"
                  className="w-full px-4 py-3 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl font-bold uppercase text-[10px] text-[var(--sonic-text)] outline-none focus:border-[var(--sonic-green)]/35 "
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48 space-y-1">
                <input 
                  type="number" 
                  placeholder="VALOR (R$)"
                  min="0"
                  step="any"
                  className="w-full px-4 py-3 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl font-bold text-[10px] text-[var(--sonic-text)] font-mono outline-none focus:border-[var(--sonic-green)]/35"
                  value={newPartCost}
                  onChange={(e) => setNewPartCost(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleAddPart}
                className="bg-[var(--sonic-text)] text-[var(--sonic-bg)] hover:bg-[var(--sonic-green)] hover:text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-wider transition-colors flex items-center justify-center gap-2 shrink-0 outline-none"
              >
                <Plus size={14} /> ADICIONAR PEÇA
              </button>
            </div>

            {/* List of parts */}
            {usedParts.length > 0 ? (
              <div className="border border-[var(--sonic-border)] rounded-xl overflow-hidden divide-y divide-[var(--sonic-border)] bg-[var(--sonic-card)]">
                {usedParts.map((part) => (
                  <div key={part.id} className="flex justify-between items-center p-4">
                    <span className="text-[10px] font-black uppercase text-[var(--sonic-text)]">{part.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold font-mono text-[var(--sonic-green)]">R$ {part.cost.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePart(part.id)}
                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="p-4 flex justify-between items-center bg-[var(--sonic-bg)]">
                  <span className="text-[10px] font-black uppercase text-gray-400">Total das Peças Adicionadas</span>
                  <span className="text-xs font-black font-mono text-[var(--sonic-green)]">R$ {partsCost.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Nenhuma peça individual listada para o reparo. Você pode preencher discriminando as peças acima ou preenchendo diretamente no campo abaixo.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">VALOR DAS PEÇAS (R$)</label>
              <input 
                type="number"
                min="0"
                step="any"
                disabled={usedParts.length > 0}
                className={cn(
                  "w-full px-4 py-3.5 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] outline-none font-bold text-sm text-[var(--sonic-text)] rounded-xl focus:ring-2 focus:ring-[var(--sonic-green)]/30 transition-all font-mono",
                  usedParts.length > 0 && "opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-dashed"
                )}
                value={partsCost || ''}
                onChange={(e) => setPartsCost(parseFloat(e.target.value) || 0)}
              />
              {usedParts.length > 0 && (
                <p className="text-[8px] text-[var(--sonic-green)] font-black uppercase tracking-wider px-1">Trazido do detalhamento acima ↑</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">VALOR MÃO DE OBRA (R$)</label>
              <input 
                type="number"
                min="0"
                step="any"
                className="w-full px-4 py-3.5 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] outline-none font-bold text-sm text-[var(--sonic-text)] rounded-xl focus:ring-2 focus:ring-[var(--sonic-green)]/30 transition-all font-mono"
                value={laborCost || ''}
                onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">DESCONTO (R$)</label>
              <input 
                type="number"
                min="0"
                step="any"
                className="w-full px-4 py-3.5 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] outline-none font-bold text-sm text-[var(--sonic-text)] rounded-xl focus:ring-2 focus:ring-[var(--sonic-green)]/30 transition-all font-mono"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="p-6 bg-[var(--sonic-bg)] rounded-2xl border border-[var(--sonic-border)] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Estimado Gerado Automaticamente</p>
              <p className="text-sm font-bold text-gray-500 mt-1 uppercase">SOMA: PEÇAS (R$ {partsCost.toFixed(2)}) + MÃO DE OBRA (R$ {laborCost.toFixed(2)}) - DESCONTO (R$ {discount.toFixed(2)})</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] block">VALOR TOTAL DE REPARO</span>
              <span className="text-3xl font-black font-mono text-[var(--sonic-green)]">R$ {Math.max(0, (partsCost + laborCost) - discount).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">PRIMEIRO RETORNO COM O CLIENTE / OBSERVAÇÃO DE ENTRADA</label>
            <textarea 
              rows={3}
              placeholder="Ex: Registro técnico de contato com o cliente para aprovar orçamento da tela, notas sobre ligações de acompanhamento..."
              className="w-full px-6 py-4 bg-[var(--sonic-bg)] border border-[var(--sonic-border)] outline-none font-bold text-xs uppercase text-[var(--sonic-text)] rounded-xl focus:ring-2 focus:ring-[var(--sonic-green)]/30 transition-all custom-scrollbar"
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
            />
          </div>
        </div>

        <div className="p-10 bg-[var(--sonic-card)] border border-[var(--sonic-border)] rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4 flex-1">
              <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--sonic-text)]">PRIORIDADE DO SERVIÇO</h3>
              <div className="flex gap-4">
                {(['LOW', 'MEDIUM', 'HIGH'] as OSPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-2 transition-all rounded-xl",
                      priority === p 
                        ? "bg-[var(--sonic-green)] border-[var(--sonic-green)] text-black shadow-lg" 
                        : "bg-[var(--sonic-card)] border-[var(--sonic-border)] text-gray-500 hover:border-[var(--sonic-green)]/30"
                    )}
                  >
                    {p === 'LOW' ? 'Normal' : p === 'MEDIUM' ? 'Urgente' : 'Crítico'}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full md:w-auto">
              <button 
                disabled={loading || (!selectedClientId && !isAddingNewClient) || !deviceModel || !problemDescription}
                type="submit"
                className="w-full md:w-72 bg-[var(--sonic-text)] text-[var(--sonic-bg)] hover:text-black py-8 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[var(--sonic-green)] transition-all shadow-xl disabled:opacity-50 disabled:grayscale hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Processando...' : 'FINALIZAR E GERAR OS'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
