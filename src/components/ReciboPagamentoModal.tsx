import React from 'react';
import { X, Printer, CheckCircle, Receipt, Building2 } from 'lucide-react';
import { Pagamento, Multa } from '../types';
import { formatarDataHora, formatarKz } from '../utils/formatters';

interface ReciboPagamentoModalProps {
  pagamento: Pagamento | null;
  multa?: Multa | null;
  onClose: () => void;
}

export const ReciboPagamentoModal: React.FC<ReciboPagamentoModalProps> = ({
  pagamento,
  multa,
  onClose,
}) => {
  if (!pagamento) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="recibo-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="recibo-modal"
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 dark:bg-slate-900 dark:border-slate-800"
      >
        {/* Top Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between no-print border-b border-emerald-800">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">Comprovativo de Pagamento de Coima</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              id="print-recibo-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Recibo
            </button>
            <button
              id="close-recibo-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 space-y-6 text-slate-800 dark:text-slate-200 printable-area">
          <div className="text-center border-b pb-4 border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              República de Angola
            </div>
            <div className="text-base font-black uppercase text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Recibo de Liquidação de Multa de Trânsito
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              RECIBO Nº: REC-{pagamento.id?.slice(0, 8).toUpperCase() || Date.now().toString().slice(-6)}
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" /> Pagamento Processado com Sucesso
            </div>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
              {formatarKz(pagamento.valorPago)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Método: <strong className="text-slate-900 dark:text-white">{pagamento.metodoPagamento}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">Nº da Multa Liquidada:</p>
              <p className="font-bold text-sm text-slate-900 dark:text-white">{pagamento.numeroMulta}</p>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Data e Hora da Operação:</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatarDataHora(pagamento.dataPagamento)}</p>
            </div>
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">Referência / Transação:</p>
              <p className="font-bold text-sm text-slate-900 dark:text-white font-mono">{pagamento.referencia || 'N/A'}</p>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Operador Responsável:</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{pagamento.operadorNome || 'Caixa Central'}</p>
            </div>
          </div>

          {multa && (
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p><strong className="text-slate-600 dark:text-slate-400">Condutor:</strong> {multa.nomeCondutor || multa.bi}</p>
              <p><strong className="text-slate-600 dark:text-slate-400">Viatura:</strong> {multa.matricula}</p>
              <p><strong className="text-slate-600 dark:text-slate-400">Infração:</strong> {multa.tipoInfracao}</p>
              <p><strong className="text-slate-600 dark:text-slate-400">Saldo Remanescente da Multa:</strong> <span className="font-bold text-slate-900 dark:text-white">{formatarKz(multa.saldoDevedor)}</span></p>
            </div>
          )}

          {pagamento.observacao && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Observação: {pagamento.observacao}
            </p>
          )}

          <div className="text-[11px] text-center text-slate-500 dark:text-slate-400 border-t pt-4">
            Documento emitido eletronicamente pelo Sistema de Gestão de Multas de Trânsito de Angola. Válido como prova de quitação perante as autoridades competentes.
          </div>
        </div>
      </div>
    </div>
  );
};
