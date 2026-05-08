import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Repertorio from './pages/Repertorio';
import Avisos from './pages/Avisos';
import Perfil from './pages/Perfil';
import Membros from './pages/Membros';
import Escalas from './pages/Escalas';
import Inicio from './pages/Inicio';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Fica escutando mudanças (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Se não tem sessão, vai pro Login. Se tem, vai pro Layout principal */}
        {!session ? (
          <Route path="*" element={<Login />} />
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard session={session} />} />
            <Route path="escalas" element={<Escalas session={session} />} />
            <Route path="/" element={<Inicio session={session} />} />
            <Route path="avisos" element={<Avisos session={session} />} />
            <Route path="perfil" element={<Perfil session={session} />} />
            <Route path="equipe" element={<Membros session={session} />} />
            <Route path="repertorio" element={<Repertorio />} />
            <Route path="avisos" element={<div className="p-4">Tela de Avisos</div>} />
            <Route path="perfil" element={
              <button onClick={() => supabase.auth.signOut()} className="p-4 text-red-600 font-bold">Sair do App</button>
            } />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;