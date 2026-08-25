import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Receipt,
  DollarSign,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Building,
  User,
} from 'lucide-react';
import { Pagamento, Multa, MetodoPagamento } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { registrarPagamento } from '../services/firestoreService';
import {
  formatarData,
  formatarDataHora,
  formatarKz,
  getStatusBadgeClass,
} from '../utils/formatters';

interface PagamentosProps {
  pagamentos: Pagamento[];
  multas: Multa[];
  onOpenReciboModal: (pagamento: Pagamento, multa?: Multa) => void;
  multaPreSelecionada?: Multa | null;
  onLimparMultaPreSelecionada?: () => void;
}

export const Pagamentos: React.FC<PagamentosProps> = ({
  pagamentos,
  multas,
  onOpenReciboModal,
  multaPreSelecionada,
  onLimparMultaPreSelecionada,
}) => {
  const { userProfile, canEdit } = useAuth();

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(!!multaPreSelecionada);
  const [multaSelecionada, setMultaSelecionada] = useState<Multa | null>(multaPreSelecionada || null);

  const [valorPagoInput, setValorPagoInput] = useState<number>(
    multaPreSelecionada ? (multaPreSelecionada.saldoDevedor !== undefined ? multaPreSelecionada.saldoDevedor : multaPreSelecionada.valorTotal) : 0
  );
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('Multicaixa Express');
  const [referencia, setReferencia] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Abrir modal de novo pagamento
  const abrirModal = (multa?: Multa) => {
    if (multa) {
      setMultaSelecionada(multa);
      setValorPagoInput(multa.saldoDevedor !== undefined ? multa.saldoDevedor : multa.valorTotal);
    } else {
      setMultaSelecionada(null);
      setValorPagoInput(0);
    }
    setReferencia(`RUPE-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setObservacao('');
    setErro(null);
    setModalAberto(true);
  };

  const handleSelecionarMultaDropdown = (multaId: string) => {
    const m = multas.find((item) => item.id === multaId);
    if (m) {
      setMultaSelecionada(m);
      const saldo = m.saldoDevedor !== undefined ? m.saldoDevedor : m.valorTotal;
      setValorPagoInput(saldo > 0 ? saldo : m.valorTotal);
    } else {
      setMultaSelecionada(null);
      setValorPagoInput(0);
    }
  };

  const handleSalvarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    if (!multaSelecionada || !multaSelecionada.id) {
      setErro('Por favor, seleccione uma multa para efectuar o pagamento.');
      return;
    }

    if (valorPagoInput <= 0) {
      setErro('O valor a pagar deve ser superior a zero.');
      return;
    }

    const saldoMaximo = multaSelecionada.saldoDevedor !== undefined
      ? multaSelecionada.saldoDevedor
      : multaSelecionada.valorTotal;

    if (saldoMaximo > 0 && valorPagoInput > saldoMaximo) {
      setErro(`O valor inserido (${formatarKz(valorPagoInput)}) é superior ao saldo devedor actual (${formatarKz(saldoMaximo)}).`);
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const novoPagamento = {
        multaId: multaSelecionada.id,
        numeroMulta: multaSelecionada.numeroMulta,
        valorPago: Number(valorPagoInput),
        metodoPagamento,
        referencia: referencia || `TRANS-${Date.now().toString().slice(-6)}`,
        operadorId: userProfile.uid,
        operadorNome: userProfile.nome,
        observacao,
      };

      const pagId = await registrarPagamento(novoPagamento, userProfile);
      setModalAberto(false);
      if (onLimparMultaPreSelecionada) onLimparMultaPreSelecionada();

      // Abrir recibo após salvar
      onOpenReciboModal({ ...novoPagamento, id: pagId, dataPagamento: new Date().toISOString() }, multaSelecionada);
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar o pagamento.');
    } finally {
      setSalvando(false);
    }
  };

  // Filtro de pagamentos
  const pagamentosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return pagamentos;
    return pagamentos.filter(
      (p) =>
        p.numeroMulta.toLowerCase().includes(q) ||
        p.referencia.toLowerCase().includes(q) ||
        p.metodoPagamento.toLowerCase().includes(q) ||
        p.operadorNome.toLowerCase().includes(q)
    );
  }, [pagamentos, busca]);

  const multasComSaldo = multas.filter((m) => m.statusPagamento !== 'Pago' && m.statusPagamento !== 'Cancelado');

  const totalArrecadadoHistorico = pagamentos.reduce((acc, p) => acc + (p.valorPago || 0), 0);

  return (
    <div id="pagamentos-container" className="space-y-6">
      {/* Header & Metric Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Caixa & Pagamentos de Coimas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Liquidação total e parcial de autos de infração e emissão de recibos oficiais
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="busca-pagamento-input"
              type="text"
              placeholder="Pesquisar nº auto, referência RUPE, operador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl w-64 sm:w-80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {canEdit && (
            <button
              id="novo-pagamento-btn"
              onClick={() => abrirModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registar Pagamento
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Cobrado no Histórico
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatarKz(totalArrecadadoHistorico)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nº de Transações Efetuadas
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {pagamentos.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Multas Aguardando Liquidação
            </p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {multasComSaldo.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pagamentos Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nº da Multa</th>
                <th className="py-3.5 px-4">Valor Liquidado</th>
                <th className="py-3.5 px-4">Método de Pagamento</th>
                <th className="py-3.5 px-4">Referência / RUPE</th>
                <th className="py-3.5 px-4">Data & Hora</th>
                <th className="py-3.5 px-4">Operador</th>
                <th className="py-3.5 px-4 text-right">Comprovativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {pagamentosFiltrados.length > 0 ? (
                pagamentosFiltrados.map((p) => {
                  const multaCorresp = multas.find((m) => m.id === p.multaId || m.numeroMulta === p.numeroMulta);
                  return (
                    <tr
                      key={p.id || p.referencia}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {p.numeroMulta}
                        </span>
                        {multaCorresp && (
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border ${getStatusBadgeClass(multaCorresp.statusPagamento)}`}>
                            {multaCorresp.statusPagamento}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatarKz(p.valorPago)}
                      </td>
                      <td className="py-3 px-4 font-medium">{p.metodoPagamento}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {p.referencia || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {formatarDataHora(p.dataPagamento)}
                      </td>
                      <td className="py-3 px-4">{p.operadorNome}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`ver-recibo-btn-${p.numeroMulta}`}
                          onClick={() => onOpenReciboModal(p, multaCorresp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Recibo
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum registo de pagamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Pagamento */}
      {modalAberto && (
        <div
          id="modal-pagamento-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="modal-pagamento"
            className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl p-6 overflow-hidden animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Registar Pagamento de Multa
              </h3>
              <button
                id="close-modal-pagamento"
                onClick={() => {
                  setModalAberto(false);
                  if (onLimparMultaPreSelecionada) onLimparMultaPreSelecionada();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {erro}
              </div>
            )}

            <form onSubmit={handleSalvarPagamento} className="mt-4 space-y-4 text-xs">
              {/* Multa Seleção */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Selecione a Multa a Liquidar *
                </label>
                <select
                  id="pagamento-select-multa"
                  value={multaSelecionada?.id || ''}
                  onChange={(e) => handleSelecionarMultaDropdown(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">-- Seleccione uma Multa Pendente ou Parcial --</option>
                  {multas.map((m) => {
                    const saldo = m.saldoDevedor !== undefined ? m.saldoDevedor : m.valorTotal;
                    return (
                      <option key={m.id || m.numeroMulta} value={m.id}>
                        [{m.statusPagamento}] {m.numeroMulta} - {m.nomeCondutor || m.bi} ({m.matricula}) - Saldo: {formatarKz(saldo)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Informações da Multa Selecionada */}
              {multaSelecionada && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Infração: {multaSelecionada.tipoInfracao}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(multaSelecionada.statusPagamento)}`}>
                      {multaSelecionada.statusPagamento}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                    <div>
                      <p className="text-slate-400">Total da Coima:</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatarKz(multaSelecionada.valorTotal)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Já Liquidado:</p>
                      <p className="font-bold text-emerald-600">{formatarKz(multaSelecionada.valorPago || 0)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Saldo Devedor:</p>
                      <p className="font-bold text-red-600">{formatarKz(multaSelecionada.saldoDevedor !== undefined ? multaSelecionada.saldoDevedor : multaSelecionada.valorTotal)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Opções de Valor: Total ou Parcial */}
              {multaSelecionada && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-pagamento-total"
                    onClick={() => {
                      const saldo = multaSelecionada.saldoDevedor !== undefined ? multaSelecionada.saldoDevedor : multaSelecionada.valorTotal;
                      setValorPagoInput(saldo);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      valorPagoInput === (multaSelecionada.saldoDevedor !== undefined ? multaSelecionada.saldoDevedor : multaSelecionada.valorTotal)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Liquidação Total ({formatarKz(multaSelecionada.saldoDevedor !== undefined ? multaSelecionada.saldoDevedor : multaSelecionada.valorTotal)})
                  </button>

                  <button
                    type="button"
                    id="btn-pagamento-parcial"
                    onClick={() => {
                      const saldo = multaSelecionada.saldoDevedor !== undefined ? multaSelecionada.saldoDevedor : multaSelecionada.valorTotal;
                      setValorPagoInput(Math.round(saldo / 2));
                    }}
                    className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Pagamento Parcial (50%)
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valor a Pagar (Kz) *
                  </label>
                  <input
                    id="pagamento-form-valor"
                    type="number"
                    min="1"
                    required
                    value={valorPagoInput}
                    onChange={(e) => setValorPagoInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-base text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                  />
                  {multaSelecionada && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Saldo restante após este pagamento:{' '}
                      <strong>
                        {formatarKz(
                          Math.max(
                            0,
                            (multaSelecionada.saldoDevedor !== undefined
                              ? multaSelecionada.saldoDevedor
                              : multaSelecionada.valorTotal) - valorPagoInput
                          )
                        )}
                      </strong>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Método de Pagamento *
                  </label>
                  <select
                    id="pagamento-form-metodo"
                    value={metodoPagamento}
                    onChange={(e) => setMetodoPagamento(e.target.value as MetodoPagamento)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  >
                    <option value="Multicaixa Express">Multicaixa Express</option>
                    <option value="TPA (Terminal de Pagamento)">TPA (Terminal de Pagamento)</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Depósito Bancário">Depósito Bancário</option>
                    <option value="Numerário / Caixa">Numerário / Caixa</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Referência Bancária / Comprovativo RUPE
                  </label>
                  <input
                    id="pagamento-form-referencia"
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Ex: RUPE-92817290182 ou ID de Transação"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Observações Adicionais
                  </label>
                  <input
                    id="pagamento-form-observacao"
                    type="text"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Ex: Pagamento da 1ª prestação autorizado pelo comando"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  id="cancel-pagamento-form-btn"
                  onClick={() => {
                    setModalAberto(false);
                    if (onLimparMultaPreSelecionada) onLimparMultaPreSelecionada();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="salvar-pagamento-form-btn"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? 'A processar...' : 'Confirmar e Emitir Recibo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
