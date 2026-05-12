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
import Equipes from './pages/Equipes';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Perfil/approval states must be declared unconditionally to avoid hooks order change
  const [perfil, setPerfil] = useState(null);
  const [checkingApproval, setCheckingApproval] = useState(false);

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

  // Quando houver sessão, dispara verificação do perfil
  useEffect(() => {
    let mounted = true;
    async function loadPerfil() {
      if (!session) return;
      setCheckingApproval(true);
      try {
        const { data } = await supabase.from('perfis').select('id, nome, is_admin, acesso_escalas, acesso_repertorio, acesso_avisos, aniversario_dia, aniversario_mes').eq('id', session.user.id).maybeSingle();
        if (!mounted) return;
        setPerfil(data);
      } catch (err) {
        console.error('Erro carregando perfil:', err);
      } finally {
        if (mounted) setCheckingApproval(false);
      }
    }
    loadPerfil();
    return () => { mounted = false; };
  }, [session]);

  if (loading || (session && checkingApproval && !perfil)) {
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
      {/* PASSAMOS O PERFIL PARA O LAYOUT E PARA AS PÁGINAS */}
      <Layout session={session} perfil={perfil}>
        <Routes>
          <Route path="/" element={<Dashboard session={session} perfil={perfil} />} />
          <Route path="/escalas" element={<Escalas session={session} perfil={perfil} />} />
          <Route path="/repertorio" element={<Repertorio session={session} perfil={perfil} />} />
          <Route path="/avisos" element={<Avisos session={session} perfil={perfil} />} />
          <Route path="/equipes" element={<Equipes session={session} perfil={perfil} />} />
          
          <Route path="/perfil" element={<Perfil session={session} perfilProp={perfil} />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}