import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  User,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  KeyRound,
} from 'lucide-react';
import { Utilizador, PerfilUtilizador } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { atualizarPerfilUtilizador } from '../services/firestoreService';
import { formatarDataHora } from '../utils/formatters';
import { ConfirmModal } from '../components/ConfirmModal';

interface UtilizadoresProps {
  utilizadores: Utilizador[];
}

export const UtilizadoresPage: React.FC<UtilizadoresProps> = ({ utilizadores }) => {
  const { userProfile, isAdmin, register } = useAuth();

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Utilizador | null>(null);
  const [usuarioDesativar, setUsuarioDesativar] = useState<Utilizador | null>(null);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [bi, setBi] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<PerfilUtilizador>('Agente');
  const [ativo, setAtivo] = useState(true);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const abrirModalCadastro = () => {
    setUsuarioEditando(null);
    setNome('');
    setEmail('');
    setBi('');
    setSenha('');
    setPerfil('Agente');
    setAtivo(true);
    setErro(null);
    setSucesso(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (u: Utilizador) => {
    setUsuarioEditando(u);
    setNome(u.nome);
    setEmail(u.email);
    setBi(u.bi || '');
    setSenha('');
    setPerfil(u.perfil);
    setAtivo(u.ativo);
    setErro(null);
    setSucesso(null);
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !userProfile) {
      setErro('Apenas administradores podem gerir utilizadores.');
      return;
    }

    if (!nome.trim() || !email.trim()) {
      setErro('Nome e email são obrigatórios.');
      return;
    }

    setSalvando(true);
    setErro(null);
    setSucesso(null);

    try {
      if (usuarioEditando && usuarioEditando.id) {
        await atualizarPerfilUtilizador(
          usuarioEditando.id,
          {
            nome,
            bi,
            perfil,
            ativo,
          },
          userProfile
        );
        setSucesso('Utilizador actualizado com sucesso.');
      } else {
        if (!senha || senha.length < 6) {
          throw new Error('A palavra-passe deve conter no mínimo 6 caracteres.');
        }
        await register(email, senha, nome, bi || '000000000LA000', perfil);
        setSucesso('Novo utilizador criado com sucesso no sistema.');
      }
      setTimeout(() => {
        setModalAberto(false);
      }, 1000);
    } catch (err: any) {
      setErro(err.message || 'Erro ao gravar utilizador.');
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarDesativacao = async () => {
    if (!usuarioDesativar || !usuarioDesativar.id || !userProfile) return;
    try {
      await atualizarPerfilUtilizador(
        usuarioDesativar.id,
        { ativo: !usuarioDesativar.ativo },
        userProfile
      );
      setUsuarioDesativar(null);
    } catch (err) {
      console.error(err);
    }
  };

  const utilizadoresFiltrados = utilizadores.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase().trim()) ||
      u.email.toLowerCase().includes(busca.toLowerCase().trim()) ||
      u.perfil.toLowerCase().includes(busca.toLowerCase().trim())
  );

  return (
    <div id="utilizadores-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            Gestão de Utilizadores & Perfis de Acesso
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administração de contas com perfis de Administrador, Agente e Consulta
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="busca-utilizador-input"
              type="text"
              placeholder="Pesquisar utilizador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl w-60 sm:w-72 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          {isAdmin && (
            <button
              id="novo-utilizador-btn"
              onClick={abrirModalCadastro}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Utilizador
            </button>
          )}
        </div>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
            <Shield className="w-4 h-4 text-amber-500" />
            Administrador
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Acesso total: criar, editar e excluir registos, gerir utilizadores, visualizar relatórios e auditoria.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
            <User className="w-4 h-4 text-blue-500" />
            Agente de Trânsito
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Cadastrar condutores e viaturas, registrar e consultar multas e emitir guias. Não pode eliminar registos críticos.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Eye className="w-4 h-4 text-slate-500" />
            Consulta
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Acesso estritamente somente leitura. Não pode criar, editar ou eliminar registos do sistema.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase">
              <tr>
                <th className="py-3.5 px-4">Utilizador / Nome</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">BI</th>
                <th className="py-3.5 px-4">Perfil / Papel</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Data de Registo</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {utilizadoresFiltrados.length > 0 ? (
                utilizadoresFiltrados.map((u) => (
                  <tr key={u.id || u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {u.nome}
                        {u.uid === userProfile?.uid && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                            Tu
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono">{u.email}</td>
                    <td className="py-3 px-4 font-mono">{u.bi || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.perfil === 'Administrador'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : u.perfil === 'Agente'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.perfil}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.ativo
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {u.ativo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.ativo ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {formatarDataHora(u.dataCriacao)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            id={`editar-utilizador-${u.uid}`}
                            onClick={() => abrirModalEdicao(u)}
                            title="Editar Utilizador"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {u.uid !== userProfile?.uid && (
                            <button
                              id={`desativar-utilizador-${u.uid}`}
                              onClick={() => setUsuarioDesativar(u)}
                              title={u.ativo ? 'Desactivar Conta' : 'Activar Conta'}
                              className={`p-1.5 rounded-lg cursor-pointer ${
                                u.ativo
                                  ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400'
                              }`}
                            >
                              {u.ativo ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum utilizador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {modalAberto && (
        <div
          id="modal-utilizador-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="modal-utilizador"
            className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 overflow-hidden animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-500" />
                {usuarioEditando ? 'Editar Utilizador' : 'Criar Novo Utilizador'}
              </h3>
              <button
                id="close-modal-utilizador"
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

            {sucesso && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {sucesso}
              </div>
            )}

            <form onSubmit={handleSalvar} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  id="utilizador-form-nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Agente Domingos Pascoal"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Institucional *
                </label>
                <input
                  id="utilizador-form-email"
                  type="email"
                  required
                  disabled={!!usuarioEditando}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agente.domingos@policia.ao"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bilhete de Identidade (BI)
                </label>
                <input
                  id="utilizador-form-bi"
                  type="text"
                  value={bi}
                  onChange={(e) => setBi(e.target.value.toUpperCase())}
                  placeholder="004819283LA034"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl uppercase font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              {!usuarioEditando && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Palavra-passe (Mín. 6 caracteres) *
                  </label>
                  <input
                    id="utilizador-form-senha"
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Perfil de Permissão *
                </label>
                <select
                  id="utilizador-form-perfil"
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value as PerfilUtilizador)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="Agente">Agente (Registo e Consulta de Multas)</option>
                  <option value="Administrador">Administrador (Controlo Total)</option>
                  <option value="Consulta">Consulta (Apenas Leitura)</option>
                </select>
              </div>

              {usuarioEditando && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="utilizador-form-ativo"
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <label htmlFor="utilizador-form-ativo" className="font-bold text-slate-700 dark:text-slate-300">
                    Conta Activa para Acesso ao Sistema
                  </label>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  id="cancel-utilizador-btn"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="salvar-utilizador-btn"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? 'A guardar...' : usuarioEditando ? 'Atualizar Perfil' : 'Criar Utilizador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação Desativação */}
      <ConfirmModal
        isOpen={!!usuarioDesativar}
        title={usuarioDesativar?.ativo ? 'Desactivar Utilizador' : 'Reactivar Utilizador'}
        message={`Deseja ${usuarioDesativar?.ativo ? 'desactivar o acesso de' : 'reactivar o acesso para'} ${usuarioDesativar?.nome}?`}
        confirmLabel={usuarioDesativar?.ativo ? 'Sim, Desactivar' : 'Sim, Activar'}
        isDestructive={!!usuarioDesativar?.ativo}
        onConfirm={handleConfirmarDesativacao}
        onCancel={() => setUsuarioDesativar(null)}
      />
    </div>
  );
};
