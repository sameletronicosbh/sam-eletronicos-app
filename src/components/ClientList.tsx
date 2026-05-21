import { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, addDoc, orderBy } from '../lib/firebase';
import { Client } from '../types';
import { Users, UserPlus, Search, X, MapPin, Phone, Fingerprint } from 'lucide-react';
import { format } from 'date-fns';
import { formatPhone, formatCPF, formatCEP, normalizeSearch } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Client)));
    });
    return unsubscribe;
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'clients'), {
        name,
        phone,
        email,
        cpf,
        cep,
        address,
        neighborhood,
        city,
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      resetForm();
    } catch (error) {
      console.error("Error adding client:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCpf('');
    setCep('');
    setAddress('');
    setNeighborhood('');
    setCity('');
  };

  const filteredClients = clients.filter(client => {
    const term = normalizeSearch(searchTerm);
    return normalizeSearch(client.name).includes(term) || 
           client.phone.includes(term) || 
           (client.cpf && client.cpf.includes(term));
  });

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[var(--sonic-border)]">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--sonic-text)]">Clientes<span className="text-[var(--sonic-green)]">.</span></h2>
          <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 mt-1">Base de Dados e CRM Ativo</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[var(--sonic-green)] text-white px-8 py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[var(--sonic-green)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <UserPlus size={18} />
          Novo Cadastro
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="BUSCAR POR NOME, TELEFONE OU CPF..."
          className="w-full bg-[var(--sonic-card)] border border-[var(--sonic-border)] pl-16 pr-6 py-6 rounded-2xl font-bold uppercase tracking-tight text-sm outline-none focus:ring-2 focus:ring-[var(--sonic-green)]/20 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client) => (
            <motion.div 
              layout
              key={client.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="metro-card p-8 flex flex-col group transition-all hover:border-[var(--sonic-green)]/20 rounded-xl shadow-sm"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-12 h-12 bg-[var(--sonic-green-light)] text-[var(--sonic-green)] flex items-center justify-center rounded-xl transition-colors">
                  <Users size={22} />
                </div>
                <div className="text-[8px] font-black uppercase text-gray-400 bg-[var(--sonic-gray-light)] px-3 py-1 rounded-full">
                  ID: {client.id.slice(0, 5)}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--sonic-text)] group-hover:text-[var(--sonic-green)] transition-colors">{client.name}</h3>
                
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone size={14} className="text-[var(--sonic-green)]" />
                  <span className="text-xs font-bold font-mono">{formatPhone(client.phone)}</span>
                </div>

                {client.cpf && (
                  <div className="flex items-center gap-3 text-gray-400">
                    <Fingerprint size={14} className="text-[var(--sonic-green)]" />
                    <span className="text-xs font-bold font-mono">{client.cpf}</span>
                  </div>
                )}

                {client.address && (
                  <div className="mt-6 pt-6 border-t border-[var(--sonic-border)] space-y-2">
                     <div className="flex items-start gap-3 text-gray-400">
                      <MapPin size={14} className="shrink-0 mt-0.5 text-[var(--sonic-green)]" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tight text-[var(--sonic-text)]">{client.address}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">{client.neighborhood}, {client.city}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 pt-4 border-t border-[var(--sonic-border)] flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
                  CADASTRO {client.createdAt ? format(new Date(client.createdAt), 'MM/yyyy') : '--'}
                </span>
                <button className="text-[8px] font-black uppercase tracking-widest text-[var(--sonic-green)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                  Histórico →
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              onClick={() => setIsAdding(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl max-h-[90vh] bg-[var(--sonic-card)] flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-[var(--sonic-border)]"
            >
              <div className="px-10 py-8 flex justify-between items-center border-b border-[var(--sonic-border)] bg-[var(--sonic-green-light)]">
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none text-[var(--sonic-text)]">Novo Cadastro<span className="text-[var(--sonic-green)]">.</span></h2>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="bg-[var(--sonic-card)] text-[var(--sonic-text)] p-2 hover:bg-[var(--sonic-text)] hover:text-[var(--sonic-bg)] transition-colors rounded-xl shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">Nome Completo *</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl px-4 py-3 font-bold uppercase"
                      value={name}
                      onChange={(e) => setName(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">WhatsApp *</label>
                      <input 
                        required
                        type="tel" 
                        placeholder="(00) 00000-0000"
                        className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl px-4 py-3 font-bold"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">CPF</label>
                      <input 
                        type="text" 
                        placeholder="000.000.000-00"
                        className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl px-4 py-3 font-bold"
                        value={cpf}
                        onChange={(e) => setCpf(formatCPF(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">E-mail</label>
                    <input 
                      type="email" 
                      className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl px-4 py-3 font-bold"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    />
                  </div>

                  <div className="pt-6 border-t border-[var(--sonic-border)] space-y-6">
                    <p className="text-[10px] font-black text-[var(--sonic-green)] uppercase tracking-[0.2em]">Endereço</p>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">CEP</label>
                        <input 
                          type="text" 
                          placeholder="00000-000"
                          className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl px-4 py-3 font-bold"
                          value={cep}
                          onChange={(e) => setCep(formatCEP(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">Rua / Número</label>
                        <input 
                          type="text" 
                          className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl px-4 py-3 font-bold"
                          value={address}
                          onChange={(e) => setAddress(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">Bairro</label>
                        <input 
                          type="text" 
                          className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl px-4 py-3 font-bold"
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1">Cidade</label>
                        <input 
                          type="text" 
                          className="w-full bg-[var(--sonic-bg)] border border-[var(--sonic-border)] rounded-xl px-4 py-3 font-bold"
                          value={city}
                          onChange={(e) => setCity(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full bg-[var(--sonic-text)] text-[var(--sonic-bg)] hover:text-black py-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[var(--sonic-green)] transition-all shadow-xl disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Finalizar Cadastro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
