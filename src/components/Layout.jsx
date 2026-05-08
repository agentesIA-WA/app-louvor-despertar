import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Home, 
  CalendarDays, 
  Music, 
  Bell, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Layout({ children, session }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user) {
      checkAdminStatus();
    }
  }, [session]);

  async function checkAdminStatus() {
    const { data } = await supabase
      .from('perfis')
      .select('is_admin')
      .eq('id', session.user.id)
      .maybeSingle();
    
    setIsAdmin(data?.is_admin || false);
  }

  async function handleLogoff() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      alert("Erro ao sair: " + err.message);
    }
  }

  // DEFINIÇÃO DOS LINKS COM FILTRO DE ADMIN
  const menuItems = [
    { path: '/', label: 'Início', icon: Home, visible: true },
    { path: '/escalas', label: 'Escalas', icon: CalendarDays, visible: true },
    { path: '/repertorio', label: 'Repertório', icon: Music, visible: true },
    { path: '/avisos', label: 'Avisos', icon: Bell, visible: true },
    // O PERFIL SÓ É VISÍVEL SE FOR ADMIN
    { path: '/perfil', label: 'Perfil', icon: User, visible: isAdmin },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* OVERLAY MOBILE */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" onClick={closeMenu} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col h-full transform transition-transform duration-300 md:relative md:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-8 pb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">D</div>
            <div>
              <h1 className="font-black text-slate-800 text-xl tracking-tight">Despertar</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Louvor</p>
            </div>
          </div>
          <button onClick={closeMenu} className="md:hidden text-slate-400"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.filter(item => item.visible).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-50">
          <button onClick={handleLogoff} className="w-full flex items-center gap-4 px-4 py-4 text-slate-400 hover:text-rose-600 font-bold hover:bg-rose-50 rounded-2xl transition-all">
            <LogOut size={20} /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="md:hidden bg-white border-b border-slate-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">D</div>
            <span className="font-black text-slate-800">Despertar</span>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-500"><Menu size={24} /></button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}