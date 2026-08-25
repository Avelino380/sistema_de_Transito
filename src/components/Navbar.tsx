import React, { useState } from 'react';
import { 
  Menu, 
  Shield, 
  User, 
  Clock, 
  ChevronDown, 
  Moon, 
  Sun, 
  Search,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Multa, PerfilUtilizador } from '../types';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenMobileSidebar?: () => void;
  pageTitle?: string;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
  multas?: Multa[];
  onOpenMultaDetalhes?: (multa: Multa) => void;
  onNavigate?: (page: string) => void;
  onQuickSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenMobileSidebar,
  pageTitle,
  isDarkMode,
  toggleDarkMode,
  multas = [],
  onOpenMultaDetalhes,
  onNavigate,
  onQuickSearchClick,
}) => {
  const { userProfile, quickLoginAs } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificacoesOpen, setNotificacoesOpen] = useState(false);

  const handleToggle = () => {
    if (onOpenMobileSidebar) onOpenMobileSidebar();
    if (onToggleSidebar) onToggleSidebar();
  };

  const hoje = new Date().toLocaleDateString('pt-AO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const multasPendentes = multas.filter((m) => m.statusPagamento === 'Pendente');

  const perfis: { perfil: PerfilUtilizador; label: string; desc: string }[] = [
    {
      perfil: 'Administrador',
      label: 'Administrador',
      desc: 'Acesso total a todos os menus, utilizadores e auditoria',
    },
    {
      perfil: 'Agente',
      label: 'Agente de Trânsito',
      desc: 'Registo de autos, condutores, viaturas e pagamentos',
    },
    {
      perfil: 'Consulta',
      label: 'Consulta / Auditor',
      desc: 'Visualização de relatórios e fichas de infração',
    },
  ];

  return (
    <header
      id="top-navbar"
      className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-xs transition-colors"
    >
      {/* Left section: Toggle + Title */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          id="toggle-sidebar-btn"
          type="button"
          onClick={handleToggle}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {pageTitle || 'Sistema Integrado de Gestão de Multas'}
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {hoje}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline font-medium text-slate-600 dark:text-slate-300">
              DTSER / Polícia Nacional de Angola
            </span>
          </div>
        </div>
      </div>

      {/* Right section: Search button, notifications, dark mode, role switch */}
      <div className="flex items-center space-x-1.5 sm:space-x-3">
        {/* Quick Search trigger */}
        {onNavigate && (
          <button
            type="button"
            onClick={() => {
              if (onQuickSearchClick) onQuickSearchClick();
              else onNavigate('pesquisa');
            }}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            title="Pesquisa Rápida"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificacoesOpen(!notificacoesOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 relative cursor-pointer"
            title="Notificações de Multas"
          >
            <Bell className="w-4 h-4" />
            {multasPendentes.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {notificacoesOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificacoesOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Autos Pendentes ({multasPendentes.length})
                  </span>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('multas');
                        setNotificacoesOpen(false);
                      }}
                      className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Ver todos
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {multasPendentes.slice(0, 5).map((m) => (
                    <div
                      key={m.id || m.numeroMulta}
                      onClick={() => {
                        if (onOpenMultaDetalhes) onOpenMultaDetalhes(m);
                        setNotificacoesOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {m.numeroMulta}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {m.valorTotal?.toLocaleString('pt-AO')} Kz
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                        {m.tipoInfracao}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {m.nomeCondutor || m.bi} • {m.matricula}
                      </p>
                    </div>
                  ))}
                  {multasPendentes.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Não há multas pendentes de regularização.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dark Mode Switch */}
        {toggleDarkMode && (
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            id="role-switch-dropdown-btn"
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 cursor-pointer"
            title="Alternar Perfil para Testes"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline text-slate-500 dark:text-slate-400 text-[11px]">Perfil:</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs">
              {userProfile?.perfil || 'Administrador'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRoleDropdownOpen(false)}
              />
              <div
                id="role-switch-menu"
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 dark:bg-slate-900 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Alternar Perfil de Acesso
                </div>
                {perfis.map((p) => (
                  <button
                    key={p.perfil}
                    id={`switch-profile-${p.perfil}`}
                    type="button"
                    onClick={() => {
                      quickLoginAs(p.perfil);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start space-x-2.5 cursor-pointer ${
                      userProfile?.perfil === p.perfil
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 font-bold'
                        : ''
                    }`}
                  >
                    <div
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        p.perfil === 'Administrador'
                          ? 'bg-amber-500'
                          : p.perfil === 'Agente'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {p.label}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                        {p.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs">
            {userProfile?.nome?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {userProfile?.nome?.split(' ')[0] || 'Administrador'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[120px]">
              {userProfile?.email || 'admin@transito.gov.ao'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
