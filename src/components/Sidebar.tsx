import React from 'react';
import {
  LayoutDashboard,
  Users,
  Car,
  ShieldAlert,
  CreditCard,
  Search,
  FileBarChart2,
  UserCheck,
  History,
  Bot,
  LogOut,
  ShieldCheck,
  X,
  Sparkles,
  Database,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export type PageId =
  | 'dashboard'
  | 'condutores'
  | 'viaturas'
  | 'multas'
  | 'pagamentos'
  | 'pesquisa'
  | 'relatorios'
  | 'utilizadores'
  | 'auditoria'
  | 'assistente-ia'
  | 'configuracoes';

export interface SidebarProps {
  activeTab?: string;
  currentPage?: PageId;
  setActiveTab?: (page: string) => void;
  onNavigate?: (page: PageId) => void;
  isOpen: boolean;
  setIsOpen?: (open: boolean) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentPage,
  setActiveTab,
  onNavigate,
  isOpen,
  setIsOpen,
  onClose,
}) => {
  const { userProfile, logout, isAdmin } = useAuth();

  const currentActive = (currentPage || activeTab || 'dashboard') as PageId;

  const handleNavigate = (page: PageId) => {
    if (onNavigate) onNavigate(page);
    if (setActiveTab) setActiveTab(page);
    if (onClose) onClose();
    if (setIsOpen) setIsOpen(false);
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (setIsOpen) setIsOpen(false);
  };

  const menuItems: {
    id: PageId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    adminOnly?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Painel Principal', icon: LayoutDashboard },
    { id: 'multas', label: 'Gestão de Multas', icon: ShieldAlert },
    { id: 'pagamentos', label: 'Pagamentos & Caixa', icon: CreditCard },
    { id: 'condutores', label: 'Condutores', icon: Users },
    { id: 'viaturas', label: 'Viaturas', icon: Car },
    { id: 'pesquisa', label: 'Pesquisa Global', icon: Search },
    { id: 'relatorios', label: 'Relatórios & Mapas', icon: FileBarChart2 },
    { id: 'assistente-ia', label: 'Assistente IA (Gemini)', icon: Bot, badge: 'IA' },
    { id: 'utilizadores', label: 'Utilizadores & Perfis', icon: UserCheck },
    { id: 'auditoria', label: 'Logs de Auditoria', icon: History },
    { id: 'configuracoes', label: 'Base de Dados & MySQL', icon: Database, badge: 'SQL' },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={handleClose}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight text-white leading-none">
                SIG-MULTAS
              </h1>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                DTSER • Angola
              </p>
            </div>
          </div>
          <button
            id="close-sidebar-btn"
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card */}
        <div className="mx-3 my-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs">
            {userProfile?.nome ? userProfile.nome.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {userProfile?.nome || 'Operador'}
            </p>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  userProfile?.perfil === 'Administrador'
                    ? 'bg-amber-400'
                    : userProfile?.perfil === 'Agente'
                    ? 'bg-blue-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-[10px] font-medium text-slate-400">
                {userProfile?.perfil || 'Administrador'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List - All 10 Menus */}
        <nav className="flex-1 px-3 py-1.5 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Todos os Menus do Sistema
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentActive === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Icon
                    className={`w-4 h-4 mr-2.5 shrink-0 ${
                      isActive ? 'text-slate-950' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            id="sidebar-logout-btn"
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl border border-red-900/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Terminar Sessão
          </button>
        </div>
      </aside>
    </>
  );
};
