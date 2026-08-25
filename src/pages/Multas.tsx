import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  DollarSign,
  Printer,
  Filter,
  X,
  AlertCircle,
  FileText,
  User,
  Car,
  Shield,
} from 'lucide-react';
import { Multa, Condutor, Viatura, GravidadeInfracao, StatusPagamento, TipoDocumento } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { criarMulta, atualizarMulta, eliminarMulta } from '../services/firestoreService';
import {
  formatarData,
  formatarKz,
  gerarNumeroMulta,
  gerarNumeroNotificacao,
  getStatusBadgeClass,
  getGravidadeBadgeClass,
  formatarMatricula,
} from '../utils/formatters';
import { INFRACOES_CATALOGO, VALOR_UCF_PADRAO_KZ } from '../data/infracoes';
import { ConfirmModal } from '../components/ConfirmModal';

interface MultasProps {
  multas: Multa[];
  condutores: Condutor[];
  viaturas: Viatura[];
  onOpenAutoNoticia: (multa: Multa) => void;
  onOpenPagamentoParaMulta: (multa: Multa) => void;
  modalCadastroAberto?: boolean;
  onCloseModalCadastro?: () => void;
}

export const Multas: React.FC<MultasProps> = ({
  multas,
  condutores,
  viaturas,
  onOpenAutoNoticia,
  onOpenPagamentoParaMulta,
  modalCadastroAberto = false,
  onCloseModalCadastro,
}) => {
  const { userProfile, canEdit, isAdmin } = useAuth();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroGravidade, setFiltroGravidade] = useState<string>('todos');

  const [modalAberto, setModalAberto] = useState(modalCadastroAberto);
  const [multaEditando, setMultaEditando] = useState<Multa | null>(null);
  const [multaEliminar, setMultaEliminar] = useState<Multa | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    numeroMulta: '',
    numeroNotificacao: '',
    notificado: 'Sim' as 'Sim' | 'Não',
    bi: '',
    nomeCondutor: '',
    numeroCarta: '',
    endereco: '',
    telefone: '',
    email: '',
    matricula: 'LD-',
    agenteId: userProfile?.uid || '',
    agenteNome: userProfile?.nome || 'Agente de Trânsito',
    valorUcfKz: VALOR_UCF_PADRAO_KZ,
    ucf: 100,
    valorTotal: 8800,
    dataMulta: new Date().toISOString().split('T')[0],
    tipoInfracao: 'Uso de Telemóvel durante a Condução',
    descricaoArtigo: 'Artigo 84º do Código de Estrada',
    gravidade: 'Grave' as GravidadeInfracao,
    tipoDocumento: 'Carta de Condução' as TipoDocumento,
    statusPagamento: 'Pendente' as StatusPagamento,
    localInfracao: 'Avenida Principal, Luanda',
    observacoes: '',
  });

  const abrirModalCadastro = () => {
    setMultaEditando(null);
    const ucfPadrao = 100;
    const valorUcf = VALOR_UCF_PADRAO_KZ;
    setFormData({
      numeroMulta: gerarNumeroMulta(),
      numeroNotificacao: gerarNumeroNotificacao(),
      notificado: 'Sim',
      bi: '',
      nomeCondutor: '',
      numeroCarta: '',
      endereco: '',
      telefone: '+244 ',
      email: '',
      matricula: 'LD-',
      agenteId: userProfile?.uid || '',
      agenteNome: userProfile?.nome || 'Agente de Trânsito',
      valorUcfKz: valorUcf,
      ucf: ucfPadrao,
      valorTotal: ucfPadrao * valorUcf,
      dataMulta: new Date().toISOString().split('T')[0],
      tipoInfracao: 'Uso de Telemóvel durante a Condução',
      descricaoArtigo: 'Artigo 84º do Código de Estrada',
      gravidade: 'Grave',
      tipoDocumento: 'Carta de Condução',
      statusPagamento: 'Pendente',
      localInfracao: 'Via Pública',
      observacoes: '',
    });
    setErro(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (m: Multa) => {
    setMultaEditando(m);
    setFormData({
      numeroMulta: m.numeroMulta,
      numeroNotificacao: m.numeroNotificacao,
      notificado: m.notificado,
      bi: m.bi,
      nomeCondutor: m.nomeCondutor || '',
      numeroCarta: m.numeroCarta || '',
      endereco: m.endereco || '',
      telefone: m.telefone || '',
      email: m.email || '',
      matricula: m.matricula,
      agenteId: m.agenteId,
      agenteNome: m.agenteNome,
      valorUcfKz: m.valorUcfKz,
      ucf: m.ucf,
      valorTotal: m.valorTotal,
      dataMulta: m.dataMulta,
      tipoInfracao: m.tipoInfracao,
      descricaoArtigo: m.descricaoArtigo,
      gravidade: m.gravidade,
      tipoDocumento: m.tipoDocumento,
      statusPagamento: m.statusPagamento,
      localInfracao: m.localInfracao || '',
      observacoes: m.observacoes || '',
    });
    setErro(null);
    setModalAberto(true);
  };

  // Selecionar do Catálogo de Infrações
  const handleSelecionarInfracaoCatalogo = (codigo: string) => {
    const item = INFRACOES_CATALOGO.find((i) => i.codigo === codigo);
    if (item) {
      const valorTotal = item.ucf * formData.valorUcfKz;
      setFormData({
        ...formData,
        tipoInfracao: item.tipoInfracao,
        descricaoArtigo: `${item.artigo} - ${item.descricao}`,
        gravidade: item.gravidade,
        ucf: item.ucf,
        valorTotal,
      });
    }
  };

  // Recalcular valor quando UCF ou taxa muda
  const handleUcfChange = (ucfVal: number) => {
    const total = ucfVal * formData.valorUcfKz;
    setFormData({ ...formData, ucf: ucfVal, valorTotal: total });
  };

  const handleValorUcfKzChange = (taxa: number) => {
    const total = formData.ucf * taxa;
    setFormData({ ...formData, valorUcfKz: taxa, valorTotal: total });
  };

  // Selecionar condutor cadastrado
  const handleSelecionarCondutor = (condutorId: string) => {
    const c = condutores.find((item) => item.id === condutorId);
    if (c) {
      setFormData({
        ...formData,
        bi: c.bi,
        nomeCondutor: c.nome,
        numeroCarta: c.numeroCarta || formData.numeroCarta,
        telefone: c.telefone || formData.telefone,
        endereco: c.endereco || formData.endereco,
        email: c.email || formData.email,
      });
    }
  };

  // Selecionar viatura cadastrada
  const handleSelecionarViatura = (viaturaMatricula: string) => {
    const v = viaturas.find((item) => item.matricula === viaturaMatricula);
    if (v) {
      setFormData({
        ...formData,
        matricula: v.matricula,
        bi: formData.bi || v.proprietarioBi || '',
        nomeCondutor: formData.nomeCondutor || v.proprietarioNome || '',
      });
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    if (!formData.bi.trim()) {
      setErro('O BI do condutor ou infrator é obrigatório.');
      return;
    }
    if (!formData.matricula.trim()) {
      setErro('A matrícula da viatura é obrigatória.');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const dadosParaSalvar = {
        ...formData,
        matricula: formatarMatricula(formData.matricula),
      };

      if (multaEditando && multaEditando.id) {
        await atualizarMulta(multaEditando.id, dadosParaSalvar, userProfile);
      } else {
        await criarMulta(dadosParaSalvar, userProfile);
      }
      setModalAberto(false);
      if (onCloseModalCadastro) onCloseModalCadastro();
    } catch (err: any) {
      setErro(err.message || 'Erro ao emitir o auto de multa.');
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!multaEliminar || !multaEliminar.id || !userProfile) return;
    try {
      await eliminarMulta(multaEliminar.id, multaEliminar.numeroMulta, userProfile);
      setMultaEliminar(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtros combinados
  const multasFiltradas = useMemo(() => {
    return multas.filter((m) => {
      // Filtro texto
      if (busca) {
        const q = busca.toLowerCase().trim();
        const bate =
          m.numeroMulta.toLowerCase().includes(q) ||
          m.bi.toLowerCase().includes(q) ||
          (m.nomeCondutor && m.nomeCondutor.toLowerCase().includes(q)) ||
          m.matricula.toLowerCase().includes(q) ||
          (m.numeroCarta && m.numeroCarta.toLowerCase().includes(q)) ||
          m.agenteNome.toLowerCase().includes(q) ||
          m.tipoInfracao.toLowerCase().includes(q);
        if (!bate) return false;
      }

      // Filtro status
      if (filtroStatus !== 'todos' && m.statusPagamento !== filtroStatus) {
        return false;
      }

      // Filtro gravidade
      if (filtroGravidade !== 'todos' && m.gravidade !== filtroGravidade) {
        return false;
      }

      return true;
    });
  }, [multas, busca, filtroStatus, filtroGravidade]);

  return (
    <div id="multas-container" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Gestão de Autos de Multa
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registo de contravenções, emissão de autos e controlo de liquidação
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="busca-multas-input"
              type="text"
              placeholder="Pesquisar nº auto, BI, nome, matrícula..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl w-60 sm:w-72 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Filter Status */}
          <select
            id="filtro-status-multas"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden"
          >
            <option value="todos">Todos os Estados</option>
            <option value="Pendente">Pendente</option>
            <option value="Parcialmente Pago">Parcialmente Pago</option>
            <option value="Pago">Pago</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          {/* Filter Gravidade */}
          <select
            id="filtro-gravidade-multas"
            value={filtroGravidade}
            onChange={(e) => setFiltroGravidade(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden"
          >
            <option value="todos">Todas as Gravidades</option>
            <option value="Leve">Leve</option>
            <option value="Grave">Grave</option>
            <option value="Muito Grave">Muito Grave</option>
          </select>

          {canEdit && (
            <button
              id="nova-multa-btn"
              onClick={abrirModalCadastro}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Emitir Auto de Multa
            </button>
          )}
        </div>
      </div>

      {/* Multas Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nº Auto / Notificação</th>
                <th className="py-3.5 px-4">Condutor / BI</th>
                <th className="py-3.5 px-4">Matrícula</th>
                <th className="py-3.5 px-4">Infração & Artigo</th>
                <th className="py-3.5 px-4">Gravidade</th>
                <th className="py-3.5 px-4">Valor Total</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {multasFiltradas.length > 0 ? (
                multasFiltradas.map((m) => (
                  <tr
                    key={m.id || m.numeroMulta}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {m.numeroMulta}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {m.numeroNotificacao}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {m.nomeCondutor || 'Condutor'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">BI: {m.bi}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {m.matricula}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {m.tipoInfracao}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {m.descricaoArtigo}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getGravidadeBadgeClass(
                          m.gravidade
                        )}`}
                      >
                        {m.gravidade}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formatarKz(m.valorTotal)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {m.ucf} UCF ({formatarKz(m.valorUcfKz)}/UCF)
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${getStatusBadgeClass(
                          m.statusPagamento
                        )}`}
                      >
                        {m.statusPagamento}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {formatarData(m.dataMulta)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          id={`auto-noticia-btn-${m.numeroMulta}`}
                          onClick={() => onOpenAutoNoticia(m)}
                          title="Visualizar Auto / Guia de Multa"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-amber-500" />
                        </button>
                        {canEdit && m.statusPagamento !== 'Pago' && (
                          <button
                            id={`liquidar-multa-btn-${m.numeroMulta}`}
                            onClick={() => onOpenPagamentoParaMulta(m)}
                            title="Registar Pagamento"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 cursor-pointer"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            id={`editar-multa-btn-${m.numeroMulta}`}
                            onClick={() => abrirModalEdicao(m)}
                            title="Editar Multa"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            id={`eliminar-multa-btn-${m.numeroMulta}`}
                            onClick={() => setMultaEliminar(m)}
                            title="Eliminar Multa"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nenhum auto de multa encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Emissão / Edição de Multa */}
      {modalAberto && (
        <div
          id="modal-multa-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="modal-multa"
            className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl p-6 overflow-hidden animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  {multaEditando ? `Editar Auto de Multa: ${multaEditando.numeroMulta}` : 'Emitir Novo Auto de Multa'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preenchimento oficial nos termos do Código de Estrada da República de Angola
                </p>
              </div>
              <button
                id="close-modal-multa"
                onClick={() => setModalAberto(false)}
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

            <form onSubmit={handleSalvar} className="mt-4 space-y-4 text-xs">
              {/* Números Gerados e Data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Número Único da Multa
                  </label>
                  <p className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                    {formData.numeroMulta || 'AUTO-GERADO'}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Nº de Notificação
                  </label>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formData.numeroNotificacao}
                  </p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Ocorrência *
                  </label>
                  <input
                    id="multa-form-data"
                    type="date"
                    required
                    value={formData.dataMulta}
                    onChange={(e) => setFormData({ ...formData, dataMulta: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notificado no Local?
                  </label>
                  <select
                    id="multa-form-notificado"
                    value={formData.notificado}
                    onChange={(e) => setFormData({ ...formData, notificado: e.target.value as 'Sim' | 'Não' })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="Sim">Sim (No acto da autuação)</option>
                    <option value="Não">Não (Por via postal / eletrónica)</option>
                  </select>
                </div>
              </div>

              {/* Seleção Rápida de Catálogo de Infrações */}
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40">
                <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                  Tabela Oficial de Infrações (Seleção Rápida)
                </label>
                <select
                  id="multa-form-catalogo-select"
                  onChange={(e) => handleSelecionarInfracaoCatalogo(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">-- Escolha uma Infração do Código de Estrada --</option>
                  {INFRACOES_CATALOGO.map((inf) => (
                    <option key={inf.codigo} value={inf.codigo}>
                      [{inf.gravidade.toUpperCase()}] {inf.tipoInfracao} ({inf.ucf} UCF - {formatarKz(inf.ucf * formData.valorUcfKz)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dados do Condutor & Viatura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Condutor Section */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-500" />
                      Dados do Condutor / Infrator
                    </h4>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Preencher de Condutor Existente (Opcional):
                    </label>
                    <select
                      id="multa-select-condutor-existente"
                      onChange={(e) => handleSelecionarCondutor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Seleccionar da Lista --</option>
                      {condutores.map((c) => (
                        <option key={c.id || c.bi} value={c.id}>
                          {c.nome} ({c.bi})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        BI do Condutor *
                      </label>
                      <input
                        id="multa-form-bi"
                        type="text"
                        required
                        value={formData.bi}
                        onChange={(e) => setFormData({ ...formData, bi: e.target.value.toUpperCase() })}
                        placeholder="000000000LA000"
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono uppercase text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Nº Carta de Condução
                      </label>
                      <input
                        id="multa-form-carta"
                        type="text"
                        value={formData.numeroCarta}
                        onChange={(e) => setFormData({ ...formData, numeroCarta: e.target.value.toUpperCase() })}
                        placeholder="C-000000/LA"
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono uppercase text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Nome do Condutor
                    </label>
                    <input
                      id="multa-form-nome"
                      type="text"
                      value={formData.nomeCondutor}
                      onChange={(e) => setFormData({ ...formData, nomeCondutor: e.target.value })}
                      placeholder="Nome completo do autuado"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Telefone
                      </label>
                      <input
                        id="multa-form-telefone"
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="+244 923 000 000"
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Documento Apresentado
                      </label>
                      <select
                        id="multa-form-tipodoc"
                        value={formData.tipoDocumento}
                        onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value as TipoDocumento })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      >
                        <option value="Carta de Condução">Carta de Condução</option>
                        <option value="BI">BI</option>
                        <option value="Livrete">Livrete</option>
                        <option value="Passaporte">Passaporte</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Viatura & Agente Section */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-amber-500" />
                    Viatura & Agente Autuante
                  </h4>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Preencher de Viatura Existente (Opcional):
                    </label>
                    <select
                      id="multa-select-viatura-existente"
                      onChange={(e) => handleSelecionarViatura(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Seleccionar da Frota --</option>
                      {viaturas.map((v) => (
                        <option key={v.id || v.matricula} value={v.matricula}>
                          {v.matricula} - {v.marca} {v.modelo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Matrícula da Viatura *
                    </label>
                    <input
                      id="multa-form-matricula"
                      type="text"
                      required
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })}
                      placeholder="Ex: LD-12-34-AA"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold uppercase text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Agente Autuante
                    </label>
                    <input
                      id="multa-form-agente-nome"
                      type="text"
                      value={formData.agenteNome}
                      onChange={(e) => setFormData({ ...formData, agenteNome: e.target.value })}
                      placeholder="Identificação do Agente de Trânsito"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Local da Infração
                    </label>
                    <input
                      id="multa-form-local"
                      type="text"
                      value={formData.localInfracao}
                      onChange={(e) => setFormData({ ...formData, localInfracao: e.target.value })}
                      placeholder="Ex: Estrada de Catete, Km 14, Luanda"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Infração, Artigo e Gravidade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Infração *
                  </label>
                  <input
                    id="multa-form-tipo-infracao"
                    type="text"
                    required
                    value={formData.tipoInfracao}
                    onChange={(e) => setFormData({ ...formData, tipoInfracao: e.target.value })}
                    placeholder="Descrição sumária da infração"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gravidade da Infração
                  </label>
                  <select
                    id="multa-form-gravidade"
                    value={formData.gravidade}
                    onChange={(e) => setFormData({ ...formData, gravidade: e.target.value as GravidadeInfracao })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                  >
                    <option value="Leve">Leve</option>
                    <option value="Grave">Grave</option>
                    <option value="Muito Grave">Muito Grave</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição do Artigo Legal / Enquadramento
                  </label>
                  <input
                    id="multa-form-descricao-artigo"
                    type="text"
                    value={formData.descricaoArtigo}
                    onChange={(e) => setFormData({ ...formData, descricaoArtigo: e.target.value })}
                    placeholder="Ex: Artigo 84º do Código de Estrada"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Valores em UCF e Cálculo Automático */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Unidades Fiscais (UCF)
                    </label>
                    <input
                      id="multa-form-ucf"
                      type="number"
                      min="10"
                      value={formData.ucf}
                      onChange={(e) => handleUcfChange(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-amber-400 font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Valor 1 UCF (Kz)
                    </label>
                    <input
                      id="multa-form-valor-ucf"
                      type="number"
                      value={formData.valorUcfKz}
                      onChange={(e) => handleValorUcfKzChange(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Estado do Pagamento
                    </label>
                    <select
                      id="multa-form-status"
                      value={formData.statusPagamento}
                      onChange={(e) => setFormData({ ...formData, statusPagamento: e.target.value as StatusPagamento })}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-xs"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Parcialmente Pago">Parcialmente Pago</option>
                      <option value="Pago">Pago</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Total da Coima</p>
                  <p className="text-2xl font-black text-amber-400">
                    {formatarKz(formData.valorTotal)}
                  </p>
                </div>
              </div>

              {/* Botões do Formulário */}
              <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  id="cancel-multa-form-btn"
                  onClick={() => {
                    setModalAberto(false);
                    if (onCloseModalCadastro) onCloseModalCadastro();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="salvar-multa-form-btn"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? 'A processar...' : multaEditando ? 'Atualizar Auto' : 'Emitir e Registar Multa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={!!multaEliminar}
        title="Eliminar Auto de Multa"
        message={`Tem certeza que deseja cancelar e remover permanentemente o auto ${multaEliminar?.numeroMulta}?`}
        confirmLabel="Sim, Eliminar"
        isDestructive
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setMultaEliminar(null)}
      />
    </div>
  );
};
