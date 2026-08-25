import React from 'react';
import { X, Printer, Shield, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Multa } from '../types';
import { formatarData, formatarKz, getGravidadeBadgeClass, getStatusBadgeClass } from '../utils/formatters';

interface AutoNoticiaModalProps {
  multa: Multa | null;
  onClose: () => void;
}

export const AutoNoticiaModal: React.FC<AutoNoticiaModalProps> = ({ multa, onClose }) => {
  if (!multa) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="auto-noticia-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="auto-noticia-modal"
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 dark:bg-slate-900 dark:border-slate-800"
      >
        {/* Header Action Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold">Auto de Notificação e Guia de Multa</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              id="print-auto-noticia-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
            <button
              id="close-auto-noticia-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Content */}
        <div className="p-8 space-y-6 text-slate-800 dark:text-slate-200 printable-area">
          {/* Official Document Header */}
          <div className="text-center border-b pb-4 border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              República de Angola
            </div>
            <div className="text-sm font-black uppercase text-slate-900 dark:text-white">
              Comando Geral da Polícia Nacional
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Direcção de Trânsito e Segurança Rodoviária (DTSER)
            </div>
            <div className="inline-block mt-2 px-4 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-mono text-xs font-black tracking-wider text-slate-900 dark:text-amber-400 border border-slate-300 dark:border-slate-700">
              AUTO DE CONTRAVENÇÃO: {multa.numeroMulta}
            </div>
          </div>

          {/* Status & Notification Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Nº Notificação</p>
              <p className="font-bold text-slate-900 dark:text-white">{multa.numeroNotificacao}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Data da Infração</p>
              <p className="font-bold text-slate-900 dark:text-white">{formatarData(multa.dataMulta)}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Estado do Pagamento</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md font-bold text-[11px] border ${getStatusBadgeClass(multa.statusPagamento)}`}>
                {multa.statusPagamento}
              </span>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Notificado no Local</p>
              <p className="font-bold text-slate-900 dark:text-white">{multa.notificado}</p>
            </div>
          </div>

          {/* Dados do Infractor e Viatura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Infractor */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Dados do Condutor / Infrator
              </h4>
              <div className="text-xs space-y-1.5">
                <p><strong className="text-slate-600 dark:text-slate-400">Nome:</strong> {multa.nomeCondutor || 'Condutor Registado'}</p>
                <p><strong className="text-slate-600 dark:text-slate-400">BI:</strong> {multa.bi}</p>
                <p><strong className="text-slate-600 dark:text-slate-400">Nº Carta:</strong> {multa.numeroCarta || '-'}</p>
                <p><strong className="text-slate-600 dark:text-slate-400">Telefone:</strong> {multa.telefone || '-'}</p>
                <p><strong className="text-slate-600 dark:text-slate-400">Endereço:</strong> {multa.endereco || '-'}</p>
              </div>
            </div>

            {/* Viatura & Agente */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Viatura & Agente Autuante
              </h4>
              <div className="text-xs space-y-1.5">
                <p><strong className="text-slate-600 dark:text-slate-400">Matrícula:</strong> <span className="font-mono font-bold">{multa.matricula}</span></p>
                <p><strong className="text-slate-600 dark:text-slate-400">Doc. Apreendido/Apresentado:</strong> {multa.tipoDocumento}</p>
                <p><strong className="text-slate-600 dark:text-slate-400">Agente Autuante:</strong> {multa.agenteNome}</p>
                <p><strong className="text-slate-600 dark:text-slate-400">Local da Ocorrência:</strong> {multa.localInfracao || 'Via Pública'}</p>
              </div>
            </div>
          </div>

          {/* Descrição da Infração */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Infração Tipificada
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getGravidadeBadgeClass(multa.gravidade)}`}>
                Gravidade: {multa.gravidade}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {multa.tipoInfracao}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {multa.descricaoArtigo}
            </p>
          </div>

          {/* Valores e Conversão UCF */}
          <div className="border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs space-y-1">
              <p className="text-slate-600 dark:text-slate-400">
                Unidade de Conta Fiscal (UCF): <strong className="text-slate-900 dark:text-white">{multa.ucf} UCF</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Valor Base por UCF: <strong className="text-slate-900 dark:text-white">{formatarKz(multa.valorUcfKz)}</strong>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Total a Pagar</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatarKz(multa.valorTotal)}
              </p>
              {multa.valorPago !== undefined && multa.valorPago > 0 && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Valor Pago: <strong className="text-emerald-600">{formatarKz(multa.valorPago)}</strong> | Saldo: <strong className="text-red-600">{formatarKz(multa.saldoDevedor)}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Instruções de Pagamento */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t pt-4 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              INSTRUÇÕES DE PAGAMENTO (CÓDIGO DE ESTRADA DE ANGOLA):
            </p>
            <p>1. O pagamento voluntário da coima deve ser efectuado no prazo regulamentar de 15 (quinze) dias úteis.</p>
            <p>2. Pagamento disponível via RUPE (Referência Única de Pagamento ao Estado), Multicaixa Express, TPA ou nos postos da DTSER.</p>
            <p>3. A falta de pagamento no prazo fixado implica a cobrança coerciva e agravamento de encargos legais.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
