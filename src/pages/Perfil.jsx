import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Save, 
  Users, 
  CheckCircle2,
  Settings2,
  X,
  AlertCircle
} from 'lucide-react';

export default function Perfil({ session, perfilProp }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfilForm, setPerfilForm] = useState({
    nome: '',
    aniversario_dia: '',
    aniversario_mes: '',
    is_admin: false
  });
  const [equipe, setEquipe] = useState([]);
  const [pendingUsuarios, setPendingUsuarios] = useState([]); // Usuários aguardando validação
  const [aprovandoId, setAprovandoId] = useState(null);
  const [notificacao, setNotificacao] = useState(null);

  // Estados para Equipes
  const [todasEquipes, setTodasEquipes] = useState([]);
  const [vinculosEquipes, setVinculosEquipes] = useState([]); // [{perfil_id, equipe_id}]

  function mostrarNotificacao(tipo, texto) {
    setNotificacao({ tipo, texto });
    setTimeout(() => setNotificacao(null), 3000);
  }
  
  // Estado para controlar qual membro está sendo editado no Modal
  const [membroEditando, setMembroEditando] = useState(null);
  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false);

  const [perfil, setPerfil] = useState(perfilProp);

  useEffect(() => {
    setPerfil(perfilProp);
  }, [perfilProp]);

  useEffect(() => {
    if (session?.user && !perfil) {
      fetchPerfil();
    }
  }, [session]);

  async function fetchPerfil() {
    const { data } = await supabase.from('perfis').select('id, nome, is_admin, acesso_escalas, acesso_repertorio, acesso_avisos, aniversario_dia, aniversario_mes').eq('id', session.user.id).maybeSingle();
    if (data) setPerfil(data);
  }

  useEffect(() => {
    if (session?.user && (perfil || perfilProp)) {
      fetchDados();
    }
  }, [session, perfil]);

  async function fetchDados() {
    try {
      setLoading(true);
      const usuarioLogado = perfil || perfilProp;

      if (usuarioLogado) { 
        setPerfilForm({
          nome: usuarioLogado.nome || '',
          aniversario_dia: usuarioLogado.aniversario_dia != null ? String(usuarioLogado.aniversario_dia) : '',
          aniversario_mes: usuarioLogado.aniversario_mes != null ? String(usuarioLogado.aniversario_mes) : '',
          is_admin: usuarioLogado.is_admin || false
        });

        // Buscar lista de equipe para todos — admins recebem campos adicionais para edição
        if (usuarioLogado.is_admin) {
          const [{ data: listaEquipe }, { data: equipesExistentes }, { data: vinculos }] = await Promise.all([
            supabase.from('perfis').select('id, nome, is_admin, acesso_escalas, acesso_repertorio, acesso_avisos, aniversario_dia, aniversario_mes').neq('id', session.user.id).order('nome', { ascending: true }),
            supabase.from('equipes').select('*').order('nome'),
            supabase.from('perfil_equipes').select('perfil_id, equipe_id')
          ]);
          
          setEquipe(listaEquipe || []);
          setTodasEquipes(equipesExistentes || []);
          setVinculosEquipes(vinculos || []);

          // Buscar usuários pendentes (sem acessos)
          const { data: pendentes } = await supabase
            .from('perfis')
            .select('id, nome, is_admin, acesso_escalas, acesso_repertorio, acesso_avisos, aniversario_dia, aniversario_mes')
            .eq('is_admin', false)
            .eq('acesso_escalas', false)
            .eq('acesso_repertorio', false)
            .eq('acesso_avisos', false)
            .order('nome', { ascending: true });
          console.log('[Perfil] pendentes fetched', pendentes);
          setPendingUsuarios(pendentes || []);
        } else {
          const { data: listaEquipe } = await supabase
            .from('perfis')
            .select('id, nome, is_admin, aniversario_dia, aniversario_mes')
            .neq('id', session.user.id)
            .order('nome', { ascending: true });
          setEquipe(listaEquipe || []);
          setPendingUsuarios([]);
        }
      }
    } catch (err) {
      console.error("Erro ao sincronizar perfil:", err);
    } finally {
      setLoading(false);
    }
  }

  // Salva os dados do PRÓPRIO usuário
  async function handleUpdate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      const { error } = await supabase
        .from('perfis')
        .update({
          nome: perfilForm.nome,
          aniversario_dia: perfilForm.aniversario_dia ? parseInt(perfilForm.aniversario_dia) : null,
          aniversario_mes: perfilForm.aniversario_mes ? parseInt(perfilForm.aniversario_mes) : null
        })
        .eq('id', session.user.id);

      if (error) throw error;
      mostrarNotificacao('sucesso', "Seus dados foram atualizados com sucesso!");
      fetchPerfil();
    } catch (err) {
      mostrarNotificacao('erro', "Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Gerenciar vínculos de equipe no estado local do Modal
  function toggleEquipe(equipeId) {
    if (!membroEditando) return;
    
    const jaTem = membroEditando.equipesIds?.includes(equipeId);
    let novosIds = jaTem 
      ? membroEditando.equipesIds.filter(id => id !== equipeId)
      : [...(membroEditando.equipesIds || []), equipeId];
    
    setMembroEditando({ ...membroEditando, equipesIds: novosIds });
  }

  // Salva as permissões do MEMBRO DA EQUIPE (Ação de Admin)
  async function salvarPermissoesMembro() {
    try {
      setSalvandoPermissoes(true);
      
      // 1. Atualiza dados do perfil
      const { error } = await supabase
        .from('perfis')
        .update({
          is_admin: membroEditando.is_admin,
          acesso_escalas: membroEditando.acesso_escalas,
          acesso_repertorio: membroEditando.acesso_repertorio,
          acesso_avisos: membroEditando.acesso_avisos
        })
        .eq('id', membroEditando.id);
        
      if (error) throw error;

      // 2. Atualiza vínculos de equipe
      // Primeiro remove todos os vínculos atuais
      await supabase.from('perfil_equipes').delete().eq('perfil_id', membroEditando.id);
      
      // Depois insere os novos selecionados
      if (membroEditando.equipesIds?.length > 0) {
        const novosVinculos = membroEditando.equipesIds.map(eqId => ({
          perfil_id: membroEditando.id,
          equipe_id: eqId
        }));
        await supabase.from('perfil_equipes').insert(novosVinculos);
      }
      
      // Atualiza lista de vínculos global
      const { data: novosVinculosGlobal } = await supabase.from('perfil_equipes').select('perfil_id, equipe_id');
      setVinculosEquipes(novosVinculosGlobal || []);
      
      // Atualiza a lista local para não precisar fazer um novo fetch no banco
      setEquipe(equipe.map(m => m.id === membroEditando.id ? membroEditando : m));
      setMembroEditando(null); // Fecha o modal
      alert('Dados e permissões atualizados com sucesso!');
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSalvandoPermissoes(false);
    }
  }

  // Aprovar usuário pendente
  async function aprovarUsuario(usuarioId) {
    try {
      console.log('[Perfil] aprovarUsuario called for', usuarioId);
      setAprovandoId(usuarioId);
      const res = await supabase.from('perfis').update({
        acesso_escalas: true,
        acesso_repertorio: true,
        acesso_avisos: true
      }).eq('id', usuarioId);
      console.log('[Perfil] supabase update result:', res);
      const error = res.error;
      if (error) throw error;

      // atualizar listas locais
      setPendingUsuarios(prev => prev.filter(u => u.id !== usuarioId));
      const { data: novoUsuario } = await supabase.from('perfis').select('id, nome, is_admin, acesso_escalas, acesso_repertorio, acesso_avisos').eq('id', usuarioId).maybeSingle();
      if (novoUsuario) setEquipe(prev => [novoUsuario, ...prev]);

      mostrarNotificacao('sucesso', 'Usuário aprovado com sucesso!');
    } catch (err) {
      console.error('Erro aprovando usuário:', err);
      mostrarNotificacao('erro', 'Erro ao aprovar usuário: ' + (err.message || JSON.stringify(err)));
    } finally {
      setAprovandoId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-4 animate-fade-in pb-20">
      {notificacao && (
        <div className="fixed top-5 right-5 z-[70] animate-fade-in">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white font-bold ${notificacao.tipo === 'sucesso' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notificacao.tipo === 'sucesso' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            {notificacao.texto}
          </div>
        </div>
      )}

      <div className="px-2">
        <h2 className="text-5xl font-black text-slate-800 tracking-tighter italic">
          Configurações
        </h2>
        <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
          <ShieldCheck size={14} className={perfil?.is_admin ? "text-amber-500" : "text-indigo-500"} />
          {perfil?.is_admin ? 'Acesso Administrativo' : 'Perfil de Integrante'}
        </p>

        {/* Banner informativo para não-admins */}
        {!perfil?.is_admin && (
          <div className="mt-6 bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-2xl flex items-start gap-3">
            <ShieldCheck size={20} className="mt-1 text-amber-600" />
            <div>
              <p className="font-bold">Atenção</p>
              <p className="text-sm">Somente usuários administradores podem editar perfis e gerenciar permissões. Aqui você pode visualizar a equipe cadastrada.</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-10">
        
        {/* BLOCO SUPERIOR: MEU PERFIL */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2 font-sans">
            <User size={18} className="text-indigo-500" /> Minhas Informações
          </h3>

          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-14 pr-6 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all"
                    value={perfilForm.nome}
                    onChange={e => setPerfilForm({...perfilForm, nome: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 opacity-60">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="email"
                    disabled
                    className="w-full bg-slate-100 border-none rounded-2xl py-5 pl-14 pr-6 font-bold text-slate-400 cursor-not-allowed"
                    value={session?.user?.email}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Dia Nasc.</label>
                  <input 
                    type="number"
                    min="1"
                    max="31"
                    className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-center"
                    value={perfilForm.aniversario_dia}
                    onChange={e => setPerfilForm({...perfilForm, aniversario_dia: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Mês Nasc.</label>
                  <input 
                    type="number"
                    min="1"
                    max="12"
                    className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-center"
                    value={perfilForm.aniversario_mes}
                    onChange={e => setPerfilForm({...perfilForm, aniversario_mes: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Gravando...' : <><Save size={22} /> Salvar Meus Dados</>}
              </button>
            </div>
          </form>
        </div>

        {/* BLOCO INFERIOR: CONTROLE DE EQUIPE (SÓ ADMIN) */}
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-10 relative overflow-hidden">
          <div className="absolute right-[-10%] top-[-20%] opacity-5">
            <Users size={350} />
          </div>

          <div className="relative z-10 space-y-2">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 font-sans">
              <Users size={18} /> Gestão e Permissões
            </h3>
            <p className="text-3xl font-black leading-tight tracking-tighter">
              Equipe Cadastrada
            </p>
          </div>

          <div className="relative z-10">
            {perfil?.is_admin && pendingUsuarios.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2.5rem] mb-10 border border-white/20 shadow-2xl animate-pulse-slow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-amber-500 p-2 rounded-xl">
                    <User size={20} className="text-slate-900" />
                  </div>
                  <h4 className="text-lg font-black text-white tracking-tight">Novos Cadastros Pendentes</h4>
                </div>
                
                <div className="space-y-3">
                  {pendingUsuarios.map(u => (
                    <div key={u.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/10 transition-all gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center font-black text-indigo-400 text-xl">
                          {u.nome?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-base leading-tight">{u.nome || 'Usuário sem nome'}</p>
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">
                            Aguardando Liberação de Acesso
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                          onClick={() => setMembroEditando({...u, is_admin: false, acesso_escalas: true, acesso_repertorio: true, acesso_avisos: true})}
                          className="flex-1 md:flex-none px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-colors"
                        >
                          Ver Detalhes
                        </button>
                        <button 
                          onClick={() => aprovarUsuario(u.id)} 
                          disabled={aprovandoId===u.id} 
                          className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-6 py-3 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-50"
                        >
                          {aprovandoId===u.id ? 'Aprovando...' : 'Aprovar Agora'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {perfil?.is_admin ? (
              <div className="grid md:grid-cols-2 gap-4">
                {equipe.length === 0 ? (
                  <p className="text-white/40 italic text-sm py-10">Nenhum outro membro encontrado.</p>
                ) : (
                  equipe.map((membro) => (
                    <button 
                      key={membro.id}
                      onClick={() => {
                        const meusVinculos = vinculosEquipes
                          .filter(v => v.perfil_id === membro.id)
                          .map(v => v.equipe_id);
                        setMembroEditando({ ...membro, equipesIds: meusVinculos });
                      }}
                      className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black shrink-0 ${membro.is_admin ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                          {membro.nome.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm mb-1 truncate">{membro.nome}</p>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] text-white/40 uppercase font-black tracking-widest mr-2">
                              {membro.is_admin ? 'Admin' : 'Membro'}
                            </span>
                            {vinculosEquipes.filter(v => v.perfil_id === membro.id).map(v => {
                              const eq = todasEquipes.find(te => te.id === v.equipe_id);
                              return eq ? <span key={eq.id} className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase">{eq.nome}</span> : null;
                            })}
                          </div>
                        </div>
                      </div>
                      <Settings2 size={20} className="text-white/20 group-hover:text-amber-400 transition-colors shrink-0" />
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {equipe.length === 0 ? (
                  <p className="text-white/40 italic text-sm py-10">Nenhum membro encontrado.</p>
                ) : (
                  equipe.map((m) => (
                    <div key={m.id} className="bg-white/5 p-5 rounded-2xl border border-white/10 text-left">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black shrink-0 ${m.is_admin ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                          {m.nome.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm mb-1 truncate">{m.nome}</p>
                          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{m.is_admin ? 'Admin' : 'Membro'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL DE EDIÇÃO DE PERMISSÕES (Fica por cima de tudo quando ativo) */}
      {membroEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative">
            
            <button 
              onClick={() => setMembroEditando(null)}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 bg-slate-50 p-2 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">
                Acessos do Usuário
              </h3>
              <p className="text-indigo-600 font-bold text-sm">{membroEditando.nome}</p>
            </div>

            <div className="space-y-4">
              {/* Toggle Admin */}
              <label className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl cursor-pointer hover:bg-amber-100 transition-colors border border-amber-100">
                <span className="font-black text-amber-700 text-sm">Privilégio de Administrador</span>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-amber-600"
                  checked={membroEditando.is_admin}
                  onChange={e => setMembroEditando({...membroEditando, is_admin: e.target.checked})}
                />
              </label>

              <hr className="border-slate-100 my-4" />

              {/* Toggle Módulos */}
              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <span className="font-bold text-slate-700 text-sm">Acesso a Escalas</span>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-indigo-600"
                  checked={membroEditando.acesso_escalas ?? true} // Fallback caso o banco traga null
                  onChange={e => setMembroEditando({...membroEditando, acesso_escalas: e.target.checked})}
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <span className="font-bold text-slate-700 text-sm">Acesso a Repertório</span>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-indigo-600"
                  checked={membroEditando.acesso_repertorio ?? true}
                  onChange={e => setMembroEditando({...membroEditando, acesso_repertorio: e.target.checked})}
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <span className="font-bold text-slate-700 text-sm">Acesso a Avisos</span>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-indigo-600"
                  checked={membroEditando.acesso_avisos ?? true}
                  onChange={e => setMembroEditando({...membroEditando, acesso_avisos: e.target.checked})}
                />
              </label>

              <hr className="border-slate-100 my-4" />
              
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Vínculo com Equipes</p>
                <div className="grid grid-cols-2 gap-2">
                  {todasEquipes.map(eq => (
                    <button
                      key={eq.id}
                      onClick={() => toggleEquipe(eq.id)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        membroEditando.equipesIds?.includes(eq.id)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                        : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'
                      }`}
                    >
                      <p className="font-bold text-[10px] uppercase truncate">{eq.nome}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={salvarPermissoesMembro}
              disabled={salvandoPermissoes}
              className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {salvandoPermissoes ? 'Salvando...' : 'Confirmar Permissões'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
