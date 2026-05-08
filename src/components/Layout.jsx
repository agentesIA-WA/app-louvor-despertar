import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Music, Bell, User, Users } from 'lucide-react';


export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/escalas', icon: CalendarDays, label: 'Escalas' },
    { path: '/repertorio', icon: Music, label: 'Repertório' },
    { path: '/avisos', icon: Bell, label: 'Avisos' },
    { path: '/perfil', icon: User, label: 'Perfil' },
    { path: '/equipe', icon: Users, label: 'Equipe' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col md:flex-row">
      
      {/* 💻 Menu Lateral - Exclusivo Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0 p-6 z-40">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
            D
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 leading-tight">Despertar</h1>
            <p className="text-xs text-slate-500 font-medium">Louvor</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Card do Usuário Logado no Desktop */}
        <div className="mt-auto flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-10 h-10 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold shrink-0">
            W
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-800 truncate">Wesley</p>
            <p className="text-xs text-slate-500 truncate">Membro</p>
          </div>
        </div>
      </aside>

      {/* Espaçador para compensar o menu fixo no desktop */}
      <div className="hidden md:block w-64 shrink-0"></div>

      {/* 📱 Conteúdo Principal */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 pb-24 md:pb-8 relative">
        {/* Cabeçalho - Exclusivo Mobile */}
        <header className="flex justify-between items-center mb-8 pt-4 md:hidden">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Despertar Louvor</h1>
            <p className="text-sm text-gray-500">Olá, Wesley!</p>
          </div>
          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">
            W
          </div>
        </header>

        <Outlet />
      </main>

      {/* 📱 Menu Inferior - Exclusivo Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-6 py-2 flex justify-between items-center z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 w-16 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`p-1.5 rounded-2xl ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}