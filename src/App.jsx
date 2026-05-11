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
        const { data } = await supabase.from('perfis').select('id, nome, is_admin, acesso_escalas, acesso_repertorio, acesso_avisos').eq('id', session.user.id).maybeSingle();
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

  // Enquanto verificando, mostrar loading
  if (checkingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 italic font-black text-indigo-600 animate-pulse">
        CARREGANDO...
      </div>
    );
  }

  const aprovado = perfil && (perfil.is_admin || perfil.acesso_escalas || perfil.acesso_repertorio || perfil.acesso_avisos);

  // Se usuário não aprovado, mostrar tela de aguardando aprovação
  if (!aprovado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-100/50 w-full max-w-md border border-slate-100 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Aguardando aprovação</h2>
          <p className="text-slate-600 mb-6">Sua conta foi criada com sucesso, mas precisa ser aprovada por um administrador antes de obter acesso ao sistema. Você receberá um aviso quando for aprovado.</p>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold">Sair</button>
        </div>
      </div>
    );
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
          
          <Route path="/perfil" element={<Perfil session={session} />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}