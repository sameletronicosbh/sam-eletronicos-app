import { ServiceOrder } from '../types';
import { format } from 'date-fns';
import { formatPhone } from '../lib/utils';
import { X, Printer, Info, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface PrintOrderProps {
  order: ServiceOrder;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function PrintOrder({ order, isOpen = false, onClose }: PrintOrderProps) {
  const [printTriggered, setPrintTriggered] = useState(false);

  const formatOrderNumber = (num?: number) => {
    return num ? num.toString().padStart(4, '0') : '0000';
  };

  const handlePrintAction = () => {
    setPrintTriggered(true);
    setTimeout(() => {
      window.print();
    }, 200);
    setTimeout(() => {
      setPrintTriggered(false);
    }, 3000);
  };

  const renderSingleVia = (viaTitle: string, subtitle: string, isScreenView = false) => {
    return (
      <div className={`w-full flex flex-col justify-between bg-white text-black font-sans select-none overflow-hidden text-left ${
        isScreenView 
          ? 'p-6 md:p-8 min-h-[350px] md:min-h-[480px]' 
          : 'h-[148.5mm] p-12 box-border'
      }`}>
        {/* Header Section */}
        <div>
          <div className="flex justify-between items-start border-b-[3px] border-black pb-3 mb-3 md:pb-4 md:mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter m-0 leading-none">SAM ELETRÔNICOS</h1>
              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] mt-1 text-gray-700">Sam Tec • Assistência Técnica & Reparo Especializado</p>
              <p className="text-[7px] md:text-[8px] font-bold text-gray-500 mt-1 uppercase">Avenida Barão do Rio Branco, 1234 • Centro • Tel: (11) 99999-9999</p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-black text-white px-2 py-0.5 md:px-3 md:py-1 text-[7px] md:text-[8px] font-black uppercase tracking-widest rounded mb-1 md:mb-2">
                {viaTitle}
              </div>
              <div className="text-[8px] md:text-[9px] font-black uppercase tracking-wider text-gray-500">{subtitle}</div>
              <div className="text-xl md:text-2xl font-black mt-0.5 md:mt-1 text-black">OS #{formatOrderNumber(order.orderNumber)}</div>
              <div className="text-[8px] md:text-[10px] font-bold text-gray-600 mt-0.5">
                {format(new Date(order.entryDate), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-6">
            <div className="space-y-2 md:space-y-4">
              <div>
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] text-gray-500 block mb-0.5 md:mb-1">Dados do Cliente</span>
                <p className="text-sm md:text-md font-extrabold uppercase leading-tight text-black">{order.clientName}</p>
                <p className="text-xs font-bold text-gray-700 mt-0.5 md:mt-1">{formatPhone(order.clientPhone)}</p>
                {order.clientId && (
                  <p className="text-[7.5px] md:text-[8px] font-black text-gray-400 mt-0.5 uppercase tracking-wide">ID do Cliente: {order.clientId}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2 md:space-y-4">
              <div>
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] text-gray-500 block mb-0.5 md:mb-1">Dados do Equipamento</span>
                <p className="text-sm md:text-md font-extrabold uppercase leading-tight text-black">{order.deviceModel}</p>
                {order.serialNumber && (
                  <p className="text-xs font-bold text-gray-700 mt-0.5 md:mt-1">S/N: <span className="font-mono bg-gray-50 px-1 py-0.5 rounded text-gray-800">{order.serialNumber}</span></p>
                )}
                <p className="text-[7.5px] md:text-[8px] font-black uppercase tracking-widest text-gray-500 mt-1">
                  PROTOCOLO: <span className="text-black font-mono font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{order.protocol}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area / Diagnostics */}
          <div className="mb-4">
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] text-gray-500 block mb-1">Relato Técnico / Problema Reclamado</span>
            <div className={`border border-black p-3 md:p-3 overflow-hidden text-xs md:text-xs font-medium leading-relaxed bg-gray-50/50 rounded-lg italic text-gray-800 ${
              isScreenView ? 'min-h-[45px] max-h-[80px]' : 'min-h-[45px] max-h-[70px]'
            }`}>
              "{order.problemDescription}"
            </div>
          </div>

          {/* Peças & Orçamentos no Espelho */}
          {((order.usedParts && order.usedParts.length > 0) || (order.totalCost && order.totalCost > 0)) && (
            <div className="mb-4 grid grid-cols-2 gap-4 border-t border-b border-black py-2">
              <div>
                <span className="text-[7px] font-black uppercase tracking-[0.15em] text-gray-550 block mb-1">Peças Detalhadas</span>
                {order.usedParts && order.usedParts.length > 0 ? (
                  <div className="space-y-0.5 max-h-[75px] overflow-hidden">
                    {order.usedParts.map((item, idx) => (
                      <div key={item.id || idx} className="flex justify-between text-[8px] font-bold uppercase leading-none">
                        <span className="truncate pr-2">{idx + 1}. {item.name}</span>
                        <span className="font-mono">R$ {item.cost.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[8px] font-medium text-gray-500 italic uppercase">Nenhuma peça listada individualmente</span>
                )}
              </div>
              <div className="flex flex-col justify-end text-right border-l border-gray-300 pl-4 space-y-0.5">
                <div className="flex justify-between text-[8px] font-bold text-gray-650">
                  <span>VALOR PEÇAS:</span>
                  <span className="font-mono">R$ {(order.partsCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[8px] font-bold text-gray-655">
                  <span>MÃO DE OBRA:</span>
                  <span className="font-mono">R$ {(order.laborCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[8px] font-bold text-gray-655">
                  <span>DESCONTO:</span>
                  <span className="font-mono text-red-650">- R$ {(order.discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-black pt-1 border-t border-dotted border-black">
                  <span>VALOR TOTAL:</span>
                  <span className="font-mono">R$ {(order.totalCost || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer and Terms */}
        <div className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-2 gap-4 md:gap-8 pt-3 md:pt-4 border-t border-black">
            <div>
              <p className="text-[6.5px] md:text-[7.5px] text-gray-500 uppercase font-medium leading-normal text-justify">
                Autorizo a abertura, análise e ensaios necessários para a elaboração do diagnóstico técnico do meu equipamento, estando de acordo com as normas de vistoria técnica.
              </p>
              <div className="mt-4 md:mt-6 border-t border-black w-4/5 pt-1">
                <p className="text-[6.5px] md:text-[7.5px] font-black uppercase text-center tracking-widest text-black">Assinatura do Cliente</p>
              </div>
            </div>
            <div className="flex flex-col justify-end items-end">
              <div className="border-t border-black w-4/5 pt-1 text-center">
                <p className="text-[6.5px] md:text-[7.5px] font-black uppercase tracking-widest text-gray-800">Assinatura do Técnico</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[6px] md:text-[7.5px] font-black uppercase tracking-widest text-gray-400">
            <span>SAM.OS ENTERPRISE V2.5</span>
            <span>TERMOS DE DIAGNÓSTICO ENTRADA</span>
            <span>OBRIGADO PELA PREFERÊNCIA!</span>
          </div>
        </div>
      </div>
    );
  };

  // Safe fallback detection of iframe container
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <>
      {/* 1. STANDALONE PRINT ELEMENT ONLY SHOWS UP DURING BROWSER printing */}
      <div className="print-layout-container invisible absolute left-0 top-0 w-[210mm] h-[297mm] bg-white text-black p-0 m-0 flex flex-col justify-between box-border overflow-hidden">
        {/* Via 1: Empresa */}
        {renderSingleVia('1ª Via - Empresa', 'Comprovante Técnico')}

        {/* Cutting Line Helper */}
        <div className="w-full relative h-0">
          <div className="absolute left-0 right-0 top-0 border-t-2 border-dashed border-gray-400 flex items-center justify-center -translate-y-1/2 z-50">
            <span className="bg-white px-4 py-0.5 text-[8px] font-black tracking-[0.3em] text-gray-400 uppercase flex items-center gap-1.5 border border-gray-200 rounded-full shadow-sm">
              ✂️ CORTE AQUI PARA SEPARAR AS DUAS VIAS A5
            </span>
          </div>
        </div>

        {/* Via 2: Cliente */}
        {renderSingleVia('2ª Via - Cliente', 'Comprovante de Entrada')}
      </div>

      {/* 2. ON-SCREEN MODERN PRINT PREVIEW MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md overflow-y-auto p-4 md:p-6 no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-4xl bg-[var(--sonic-bg)] text-[var(--sonic-text)] border border-[var(--sonic-border)] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
            >
              {/* Top Controls Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-[var(--sonic-card)] border-b border-[var(--sonic-border)] gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[var(--sonic-text)] flex items-center gap-2">
                    <Printer className="text-[var(--sonic-green)]" />
                    Visualização do Espelho de Impressão
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Duas Vias A5 em folha A4 (Empresa & Cliente)</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrintAction}
                    className="flex-1 md:flex-initial bg-[var(--sonic-green)] hover:bg-[#00b35e] text-black font-black uppercase text-[10px] tracking-widest px-6 py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {printTriggered ? (
                      <>
                        <Check size={16} />
                        Abrindo janela...
                      </>
                    ) : (
                      <>
                        <Printer size={16} />
                        Confirmar e Imprimir
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="h-12 w-12 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl flex items-center justify-center transition-all border border-[var(--sonic-border)]-light"
                    title="Fechar"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Central Sheet Preview Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-zinc-900/60 flex items-center justify-center custom-scrollbar">
                {/* Simulated A4 Sheet */}
                <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-700 text-black flex flex-col gap-0 divide-y-2 divide-dashed divide-zinc-300 relative">
                  {/* Cutting scissors decor inside center */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 text-white rounded-full px-4 py-1 text-[8.5px] font-black uppercase tracking-[0.25em] z-50 flex items-center gap-1.5 shadow-lg select-none">
                    <span>✂️ Linha de Corte (Meio da Folha)</span>
                  </div>

                  {/* Top Via - Empresa */}
                  <div className="relative">
                    {renderSingleVia('1ª Via - Empresa', 'Comprovante Técnico', true)}
                  </div>

                  {/* Bottom Via - Cliente */}
                  <div className="relative">
                    {renderSingleVia('2ª Via - Cliente', 'Comprovante de Entrada', true)}
                  </div>
                </div>
              </div>

              {/* Bottom Environment Notice */}
              {isInIframe && (
                <div className="px-6 py-4 md:px-8 bg-amber-500/10 border-t border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-3">
                  <Info size={16} className="shrink-0 flex-none" />
                  <span>
                    Nota de Sandbox: Navegadores bloqueiam janelas de impressão direta dentro do preview de edição. Para imprimir de verdade, clique em "Shared App" ou no ícone de "Nova Aba" no canto superior direito do painel!
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
