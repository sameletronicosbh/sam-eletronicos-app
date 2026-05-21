export const auth = {
  currentUser: { uid: 'system_user_demo' }
};

// --- REAL-TIME LOCAL STORAGE DATABASE FALLBACK LAYER ---
// This ensures 100% functionality and persistence without requiring cloud setup.
const LISTENERS: Array<{
  id: string;
  path: string;
  callback: (snapshot: any) => void;
}> = [];

// Initialize default mock data if empty
const initMockData = () => {
  // Safe migration of existing client and order data from old brand
  if (localStorage.getItem('sonic_os_local_clients') && !localStorage.getItem('sam_tec_local_clients')) {
    localStorage.setItem('sam_tec_local_clients', localStorage.getItem('sonic_os_local_clients')!);
  }
  if (localStorage.getItem('sonic_os_local_service_orders') && !localStorage.getItem('sam_tec_local_service_orders')) {
    localStorage.setItem('sam_tec_local_service_orders', localStorage.getItem('sonic_os_local_service_orders')!);
  }

  if (!localStorage.getItem('sam_tec_local_clients')) {
    const initialClients = [
      { id: 'cli_1', name: 'ANA SOUZA', phone: '(11) 98888-1111', cpf: '123.456.789-00', email: 'ana@gmail.com', cep: '01001-000', address: 'Praça da Sé, 100', neighborhood: 'Sé', city: 'São Paulo', createdAt: new Date().toISOString() },
      { id: 'cli_2', name: 'CARLOS SILVA', phone: '(21) 97777-2222', cpf: '987.654.321-11', email: 'carlos@yahoo.com', cep: '20040-002', address: 'Avenida Rio Branco, 500', neighborhood: 'Centro', city: 'Rio de Janeiro', createdAt: new Date().toISOString() },
    ];
    localStorage.setItem('sam_tec_local_clients', JSON.stringify(initialClients));
  }
  
  const ordersStr = localStorage.getItem('sam_tec_local_service_orders');
  if (!ordersStr || !ordersStr.includes('os_3')) {
    const initialOrders = [
      {
        id: 'os_1',
        protocol: 'OS-8342',
        orderNumber: 1,
        clientId: 'cli_1',
        clientName: 'ANA SOUZA',
        clientPhone: '(11) 98888-1111',
        deviceModel: 'IPHONE 13 PRO MAX',
        serialNumber: 'DX38YFKLMS',
        problemDescription: 'TELA VERDE TRINCADA COM TOUCH PARCIALMENTE AGINDO SOZINHO',
        status: 'PENDING',
        priority: 'MEDIUM',
        partsCost: 350,
        laborCost: 150,
        discount: 20,
        totalCost: 480,
        entryDate: new Date(Date.now() - 3600000 * 24 * 12).toISOString(), // 12 days ago (Stagnant!)
        images: [],
        accessories: ['CAPINHA', 'PELÍCULA'],
        physicalCondition: 'Trincado de leve nos cantos traseiros, marcas normais de uso.',
        contactNotes: [
          { id: 'n1', date: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), text: 'Cliente avisado de que a tela precisaria ser encomendada.', author: 'Sam Técnico' },
          { id: 'n2', date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), text: 'Tentativa de contato para avisar sobre atraso na transportadora.', author: 'Sam Atendimento' }
        ],
        createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
      },
      {
        id: 'os_2',
        protocol: 'OS-9214',
        orderNumber: 2,
        clientId: 'cli_2',
        clientName: 'CARLOS SILVA',
        clientPhone: '(21) 97777-2222',
        deviceModel: 'SAMSUNG GALAXY S23 ULTRA',
        serialNumber: 'RF9W123XYZ',
        problemDescription: 'NÃO CARREGA - APARENTE PROBLEMA NO CONECTOR TYPE-C OU PLACA DE CARGA',
        status: 'REPAIRING',
        priority: 'HIGH',
        partsCost: 120,
        laborCost: 230,
        discount: 0,
        totalCost: 350,
        entryDate: new Date(Date.now() - 3600000 * 24 * 4).toISOString(), // 4 days ago
        images: [],
        accessories: ['CARREGADOR TIPO C', 'CABO'],
        physicalCondition: 'Perfeito estado de conservação, sem arranhões visíveis.',
        contactNotes: [
          { id: 'n3', date: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), text: 'Orçamento aprovado pelo cliente por telefone.', author: 'Sam Atendimento' }
        ],
        createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
      },
      {
        id: 'os_3',
        protocol: 'OS-1033',
        orderNumber: 3,
        clientId: 'cli_1',
        clientName: 'ANA SOUZA',
        clientPhone: '(11) 98888-1111',
        deviceModel: 'XIAOMI POCO X5',
        serialNumber: 'SNPOCOX599',
        problemDescription: 'REBOOT LOOP INFINITO APÓS ATUALIZAÇÃO - APARENTE BRICK SYSTEM OU BATERIA RUIM',
        status: 'WAITING_PARTS',
        priority: 'HIGH',
        partsCost: 200,
        laborCost: 100,
        discount: 10,
        totalCost: 290,
        entryDate: new Date(Date.now() - 3600000 * 24 * 28).toISOString(), // 28 days ago! Highly stagnant!
        images: [],
        accessories: [],
        physicalCondition: 'Película de vidro bem trincada, tampa traseira arranhada.',
        contactNotes: [
          { id: 'n4', date: new Date(Date.now() - 3600000 * 24 * 26).toISOString(), text: 'Identificado loop de software. Aguardando chegada da peça PMIC para teste de placa.', author: 'Técnico Senior' },
          { id: 'n5', date: new Date(Date.now() - 3600000 * 24 * 15).toISOString(), text: 'Cobrado fornecedor sobre envio da peça.', author: 'Compras' }
        ],
        createdAt: new Date(Date.now() - 3600000 * 24 * 28).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString()
      }
    ];
    localStorage.setItem('sam_tec_local_service_orders', JSON.stringify(initialOrders));
  }
};

initMockData();

const getLocalCollection = (path: string): any[] => {
  const data = localStorage.getItem(`sam_tec_local_${path}`);
  return data ? JSON.parse(data) : [];
};

const saveLocalCollection = (path: string, items: any[]) => {
  localStorage.setItem(`sam_tec_local_${path}`, JSON.stringify(items));
  // Notify listeners
  const matched = LISTENERS.filter(l => l.path === path);
  matched.forEach(l => {
    l.callback({
      docs: items.map(item => ({
        id: item.id,
        data: () => item
      }))
    });
  });
};

export const db = {
  type: 'mock'
};

export const collection = (_dbInstance: any, path: string) => {
  return { type: 'collection', path };
};

export const doc = (_dbInstance: any, path: string, docId: string) => {
  return { type: 'document', path, id: docId };
};

export const query = (collectionRef: any, ...modifiers: any[]) => {
  return { type: 'query', collectionRef, modifiers };
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  return { type: 'orderBy', field, direction };
};

export const limit = (n: number) => {
  return { type: 'limit', n };
};

export const getDocs = async (queryOrRef: any) => {
  const path = queryOrRef.type === 'query' ? queryOrRef.collectionRef.path : queryOrRef.path;
  const items = getLocalCollection(path);
  return {
    docs: items.map(item => ({
      id: item.id,
      data: () => item
    }))
  };
};

export const addDoc = async (collectionRef: any, data: any) => {
  const path = collectionRef.path;
  const items = getLocalCollection(path);
  const idValue = data.id || `${path.slice(0, 3)}_${Math.random().toString(36).substr(2, 9)}`;
  const newItem = { id: idValue, ...data };
  items.push(newItem);
  saveLocalCollection(path, items);
  return { id: idValue, ...newItem };
};

export const updateDoc = async (docRef: any, data: any) => {
  const path = docRef.path;
  const id = docRef.id;
  const items = getLocalCollection(path);
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...data, id };
    saveLocalCollection(path, items);
  }
  return { id };
};

export const onSnapshot = (queryOrRef: any, callback: (snapshot: any) => void, _onError?: (error: any) => void) => {
  const path = queryOrRef.type === 'query' ? queryOrRef.collectionRef.path : queryOrRef.path;
  const listenerId = Math.random().toString(36).substr(2, 9);
  
  LISTENERS.push({ id: listenerId, path, callback });
  
  // Instant emit
  const emit = () => {
    const items = getLocalCollection(path);
    let processedItems = [...items];
    if (queryOrRef.type === 'query') {
      const modifiers = queryOrRef.modifiers || [];
      const orderByMod = modifiers.find((m: any) => m.type === 'orderBy');
      if (orderByMod) {
        processedItems.sort((a, b) => {
          const valA = a[orderByMod.field];
          const valB = b[orderByMod.field];
          if (typeof valA === 'string' && typeof valB === 'string') {
            return orderByMod.direction === 'desc' 
              ? valB.localeCompare(valA) 
              : valA.localeCompare(valB);
          }
          return orderByMod.direction === 'desc' 
            ? (valB > valA ? 1 : -1) 
            : (valA > valB ? 1 : -1);
        });
      }
      const limitMod = modifiers.find((m: any) => m.type === 'limit');
      if (limitMod) {
        processedItems = processedItems.slice(0, limitMod.n);
      }
    }

    callback({
      docs: processedItems.map(item => ({
        id: item.id,
        data: () => item
      }))
    });
  };

  emit();

  return () => {
    const index = LISTENERS.findIndex(l => l.id === listenerId);
    if (index !== -1) {
      LISTENERS.splice(index, 1);
    }
  };
};
