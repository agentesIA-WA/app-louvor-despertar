import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, LogOut, Save, Users, Cake, Check, CheckCircle, AlertCircle, ShieldCheck, UserCircle, Phone, Mail, ChevronRight } from 'lucide-react';

const OPCOES_FUNCAO = [
  "Vocal", "Violão", "Guitarra", "Baixo", "Bateria", 
  "Teclado", "Líder", "Sonoplastia", "Projeção", "Backing Vocal"
];

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Perfil({ session }) {
  // Estados do Formulário
  const [membroId, setMembroId] = useState('');
  const [nome, setNome] = useState('');
  const [funcoesSelecionadas, setFuncoesSelecionadas] = useState([]);
  const [diaAniversario, setDiaAniversario] = useState('');
  const [mesAniversario, setMesAniversario] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Estados de Controle
  const [meuPerfil, setMeuPerfil] = useState(null);
  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificacao, setNotificacao] = useState(null);

  function mostrarNotificacao(tipo, texto) {
    setNotificacao({ tipo, texto });
    setTimeout(() => setNotificacao(null), 3000);
  }

  useEffect(() => {
    fetchDadosIniciais();
  }, [session]);

  async function fetchDadosIniciais() {
    setLoading(true);
    // 1. Busca o perfil de quem está logado
    const { data: perfilLogado } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();
    if (perfilLogado) {
      setMeuPerfil(perfilLogado);
      carregarNoFormulario(perfilLogado); // Inicia com os dados do próprio usuário
    }
    
    // 2. Busca toda a equipe
    const { data: membros } = await supabase.from('perfis').select('*').order('nome');
    if (membros) setEquipe(membros);
    setLoading(false);
  }

  // Função para carregar qualquer membro no formulário de edição
  function carregarNoFormulario(membro) {
    setMembroId(membro.id);
    setNome(membro.nome || '');
    setWhatsapp(membro.whatsapp || '');
    setEmailContato(membro.email_contato || '');
    setDiaAniversario(membro.aniversario_dia || '');
    setMesAniversario(membro.aniversario_mes || '');
    setIsAdmin(membro.is_admin || false);
    setFuncoesSelecionadas(membro.funcao ? membro.funcao.split(', ') : []);
    
    // Rola a tela para o topo para facilitar a edição
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const toggleFuncao = (funcao) => {
    setFuncoesSelecionadas(prev => 
      prev.includes(funcao) ? prev.filter(f => f !== funcao) : [...prev, funcao]
    );
  };

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from('perfis').upsert({
      id: membroId,
      nome,
      whatsapp,
      email_contato: emailContato,
      funcao: funcoesSelecionadas.join(', '), 
      aniversario_dia: parseInt(diaAniversario) || null,
      aniversario_mes: parseInt(mesAniversario) || null,
      is_admin: isAdmin
    });

    if (!error) {
      mostrarNotificacao('sucesso', 'Dados salvos com sucesso!');
      // Se eu alterei meu próprio perfil, atualizo o estado local do admin
      if (membroId === session.user.id) {
        setMeuPerfil(prev => ({ ...prev, is_admin: isAdmin }));
      }
      // Atualiza a lista da equipe para refletir as mudanças
      const { data: membros } = await supabase.from('perfis').select('*').order('nome');
      if (membros) setEquipe(membros);
    } else {
      mostrarNotificacao('erro', 'Erro ao salvar alterações.');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10 relative">
      
      {notificacao && (
        <div className="fixed top-5 right-5 z-[70] animate-fade-in">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white font-bold ${notificacao.tipo === 'sucesso' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notificacao.tipo === 'sucesso' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            {notificacao.texto}
          </div>
        </div>
      )}

      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-100">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {membroId === session.user.id ? 'Meu Perfil' : `Editando: ${nome}`}
              </h2>
              <p className="text-sm text-slate-500">
                {membroId === session.user.id ? session.user.email : 'Cadastro de Integrante'}
              </p>
            </div>
          </div>
          {membroId !== session.user.id && (
            <button 
              onClick={() => carregarNoFormulario(meuPerfil)}
              className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition"
            >
              Voltar para meu Perfil
            </button>
          )}
        </div>

        <form onSubmit={handleSalvar} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Coluna 1: Dados Pessoais */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-4 text-slate-400" />
                    <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white outline-none" placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">E-mail de Contato</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-4 text-slate-400" />
                    <input type="email" value={emailContato} onChange={(e) => setEmailContato(e.target.value)} className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white outline-none" placeholder="email@teste.com" />
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Cake size={18} className="text-pink-500" /> Data de Aniversário
                </label>
                <div className="flex gap-3">
                  <input type="number" min="1" max="31" placeholder="Dia" value={diaAniversario} onChange={(e) => setDiaAniversario(e.target.value)} className="w-24 p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition" />
                  <select value={mesAniversario} onChange={(e) => setMesAniversario(e.target.value)} className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition">
                    <option value="">Selecione o Mês</option>
                    {MESES.map((mes, index) => (
                      <option key={mes} value={index + 1}>{mes}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Controle de Admin: Só aparece se você for admin OU estiver editando seu próprio perfil (para se tornar admin no primeiro acesso) */}
              {(meuPerfil?.is_admin || membroId === session.user.id) && (
                <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
                  <label className="block text-sm font-bold text-blue-800 mb-4">Nível de Acesso no App</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setIsAdmin(false)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${!isAdmin ? 'border-blue-600 bg-white text-blue-700 font-bold' : 'border-transparent bg-transparent text-slate-400'}`}>
                      <UserCircle size={24} />
                      <span className="text-xs">Membro</span>
                    </button>
                    <button type="button" onClick={() => setIsAdmin(true)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${isAdmin ? 'border-blue-600 bg-white text-blue-700 font-bold' : 'border-transparent bg-transparent text-slate-400'}`}>
                      <ShieldCheck size={24} />
                      <span className="text-xs">Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna 2: Funções */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-4">Funções no Ministério</label>
              <div className="grid grid-cols-2 gap-2">
                {OPCOES_FUNCAO.map(funcao => {
                  const selecionada = funcoesSelecionadas.includes(funcao);
                  return (
                    <button key={funcao} type="button" onClick={() => toggleFuncao(funcao)} className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-sm transition-all ${selecionada ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                      {funcao}
                      {selecionada && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-slate-100">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-lg shadow-blue-100">
              <Save size={20} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button type="button" onClick={() => supabase.auth.signOut()} className="bg-slate-100 text-red-600 font-bold py-4 px-8 rounded-2xl hover:bg-red-50 transition flex items-center justify-center gap-2">
              <LogOut size={20} /> Sair
            </button>
          </div>
        </form>
      </section>

      {/* Lista da Equipe Interativa */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <Users size={24} className="text-slate-800" />
            <h3 className="text-xl font-bold text-slate-800">Equipe do Ministério</h3>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-50 uppercase tracking-tighter">
            {meuPerfil?.is_admin ? 'Clique para editar' : `${equipe.length} membros`}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {equipe.map(membro => (
            <div 
              key={membro.id} 
              onClick={() => meuPerfil?.is_admin && carregarNoFormulario(membro)}
              className={`bg-white p-5 rounded-[2rem] border transition-all relative ${
                membroId === membro.id ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-100'
              } ${meuPerfil?.is_admin ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''}`}
            >
              {membro.is_admin && (
                <div className="absolute top-4 right-4 text-blue-600">
                  <ShieldCheck size={16} />
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl ${membro.is_admin ? 'bg-slate-800' : 'bg-blue-500'}`}>
                  {membro.nome ? membro.nome.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-slate-800 truncate">{membro.nome || 'Membro'}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                    {membro.funcao || 'Sem função'}
                  </p>
                </div>
                {meuPerfil?.is_admin && <ChevronRight size={16} className="text-slate-300" />}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}