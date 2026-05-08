import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Layout from './components/Layout';
import Login from "./pages/Login";
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import Escalas from './pages/Escalas'; 
import Repertorio from './pages/Repertorio';
import Avisos from './pages/Avisos';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 italic font-black text-indigo-600 animate-pulse">
        CARREGANDO...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <Router>
      {/* PASSAMOS A SESSION PARA O LAYOUT PARA ELE CHECAR O ADMIN */}
      <Layout session={session}>
        <Routes>
          <Route path="/" element={<Dashboard session={session} />} />
          <Route path="/escalas" element={<Escalas session={session} />} />
          <Route path="/repertorio" element={<Repertorio session={session} />} />
          <Route path="/avisos" element={<Avisos session={session} />} />
          
          {/* O PERFIL SÓ CARREGA SE O USUÁRIO FOR ADMIN NO FUTURO, 
              POR ENQUANTO O LAYOUT JÁ ESCONDE O BOTÃO */}
          <Route path="/perfil" element={<Perfil session={session} />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}