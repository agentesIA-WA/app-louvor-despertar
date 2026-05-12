import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  CalendarDays, Plus, Trash2, Edit2, CheckCircle, AlertCircle, 
  X, Users, Music, Settings2, ListMusic, Calendar, Search, Printer, 
  CalendarOff, UserCheck, Info, Clock, ChevronRight
} from 'lucide-react';

export default function Escalas({ session, perfil }) {
  const [escalas, setEscalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacao, setNotificacao] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('escalas');

  // Ranking de participação
  const [rankingStart, setRankingStart] = useState('');
  const [rankingEnd, setRankingEnd] = useState('');
  const [rankingResults, setRankingResults] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedParticipations, setSelectedParticipations] = useState([]);

  // Estados Admin (Escala e Montagem)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [escalaParaEditar, setEscalaParaEditar] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [dataEscala, setDataEscala] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [equipes, setEquipes] = useState([]);
  const [equipeId, setEquipeId] = useState('');
  const [filtroEquipeId, setFiltroEquipeId] = useState('todas');

  const [escalaAtiva, setEscalaAtiva] = useState(null);
  const [membrosDisponiveis, setMembrosDisponiveis] = useState([]);
  const [musicasDisponiveis, setMusicasDisponiveis] = useState([]);
  const [escalaMembros, setEscalaMembros] = useState([]);
  const [escalaMusicas, setEscalaMusicas] = useState([]);
  
  const [membrosParaAdicionar, setMembrosParaAdicionar] = useState([]);
  const [musicasParaAdicionar, setMusicasParaAdicionar] = useState([]);
  const [escalaParaVer, setEscalaParaVer] = useState(null);
  
  // Busca no repertório (Painel Montagem)
  const [buscaMusica, setBuscaMusica] = useState('');

  // Estados Indisponibilidade Geral (Admin)
  const [todasIndisponibilidades, setTodasIndisponibilidades] = useState([]);
  const [filtroIndStart, setFiltroIndStart] = useState('');
  const [filtroIndEnd, setFiltroIndEnd] = useState('');
  const [loadingIndisponibilidade, setLoadingIndisponibilidade] = useState(false);

  // Estados Disponibilidade (Membro)
  const [minhasIndisponibilidades, setMinhasIndisponibilidades] = useState([]);
  const [dataIndisponivel, setDataIndisponivel] = useState('');
  const [motivoIndisponivel, setMotivoIndisponivel] = useState('');

  useEffect(() => {
    fetchDados();
  }, [session, perfil]);

  function mostrarNotificacao(tipo, texto) {
    setNotificacao({ tipo, texto });
    setTimeout(() => setNotificacao(null), 3000);
  }

  async function fetchDados() {
    try {
      setLoading(true);
      const { data: escalasData } = await supabase
        .from('escalas')
        .select('*, equipes(nome)')
        .order('data_escala', { ascending: true });
      setEscalas(escalasData || []);

      const { data: equipesData } = await supabase
        .from('equipes')
        .select('*')
        .order('nome');
      setEquipes(equipesData || []);

      if (session?.user) {
        fetchMinhasIndisponibilidades(session.user.id);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  // --- LÓGICA DE INDISPONIBILIDADE ---
  async function fetchMinhasIndisponibilidades(userId) {
    const { data } = await supabase.from('indisponibilidade').select('*').eq('membro_id', userId).order('data_bloqueio');
    setMinhasIndisponibilidades(data || []);
  }

  async function fetchTodasIndisponibilidades() {
    try {
      setLoadingIndisponibilidade(true);
      let query = supabase
        .from('indisponibilidade')
        .select('*, perfis(nome)')
        .order('data_bloqueio', { ascending: true });

      if (filtroIndStart) query = query.gte('data_bloqueio', filtroIndStart);
      if (filtroIndEnd) query = query.lte('data_bloqueio', filtroIndEnd);

      const { data, error } = await query;
      if (error) throw error;
      setTodasIndisponibilidades(data || []);
    } catch (err) {
      console.error('Erro ao buscar indisponibilidades gerais:', err);
      mostrarNotificacao('erro', 'Erro ao carregar indisponibilidades.');
    } finally {
      setLoadingIndisponibilidade(false);
    }
  }

  async function registrarIndisponibilidade() {
    if (!dataIndisponivel) return mostrarNotificacao('erro', 'Selecione uma data.');
    const { error } = await supabase.from('indisponibilidade').insert([{ 
      membro_id: session.user.id, 
      data_bloqueio: dataIndisponivel,
      motivo: motivoIndisponivel
    }]);
    if (!error) {
      mostrarNotificacao('sucesso', 'Data bloqueada com sucesso!');
      fetchMinhasIndisponibilidades(session.user.id);
      setDataIndisponivel('');
      setMotivoIndisponivel('');
    }
  }

  // --- LÓGICA DE MONTAGEM ---
  async function abrirPainelMontagem(escala) {
    setEscalaAtiva(escala);
    setMembrosParaAdicionar([]);
    setMusicasParaAdicionar([]);
    try {
      let query = supabase.from('perfis').select('id, nome').order('nome');
      
      if (escala.equipe_id) {
        const { data: vinculos } = await supabase
          .from('perfil_equipes')
          .select('perfil_id')
          .eq('equipe_id', escala.equipe_id);
        const idsMembros = vinculos?.map(v => v.perfil_id) || [];
        query = query.in('id', idsMembros);
      }

      const { data: perfis } = await query;
      const { data: bloqueados } = await supabase.from('indisponibilidade').select('membro_id').eq('data_bloqueio', escala.data_escala);
      const idsBloqueados = bloqueados?.map(b => b.membro_id) || [];
      setMembrosDisponiveis(perfis?.filter(p => !idsBloqueados.includes(p.id)) || []);
      const { data: repertorio } = await supabase.from('repertorio').select('id, titulo').order('titulo');
      setMusicasDisponiveis(repertorio || []);
      await carregarDetalhes(escala.id);
    } catch (error) { 
      console.error(error);
      mostrarNotificacao('erro', 'Erro ao carregar dados.'); 
    }
  }

  async function carregarDetalhes(escalaId) {
    const [{ data: m }, { data: mus }] = await Promise.all([
      supabase.from('escala_membros').select('id, membro_id, funcao_na_escala, perfis(nome)').eq('escala_id', escalaId),
      supabase.from('escala_musicas').select('id, musica_id, ordem, repertorio(titulo)').eq('escala_id', escalaId).order('ordem')
    ]);
    setEscalaMembros(m || []);
    setEscalaMusicas(mus || []);
  }

  // --- RANKING DE PARTICIPAÇÃO ---
  async function fetchRanking(start, end) {
    try {
      setLoadingRanking(true);
      const { data } = await supabase.from('escala_membros').select('membro_id, perfis(id,nome), escalas(data_escala)');
      const entries = data || [];
      const s = start ? new Date(start + 'T00:00:00') : new Date('1970-01-01');
      const e = end ? new Date(end + 'T23:59:59') : new Date('9999-12-31');
      const counts = {};
      for (const en of entries) {
        const dStr = en.escalas?.data_escala;
        if (!dStr) continue;
        const d = new Date(dStr + 'T00:00:00');
        if (d >= s && d <= e) {
          const id = en.membro_id;
          const nome = en.perfis?.nome || 'Desconhecido';
          if (!counts[id]) counts[id] = { id, nome, count: 0 };
          counts[id].count += 1;
        }
      }
      const arr = Object.values(counts).sort((a,b) => b.count - a.count);
      setRankingResults(arr);
    } catch (err) {
      console.error('Erro ao buscar ranking:', err);
      setRankingResults([]);
    } finally {
      setLoadingRanking(false);
    }
  }

  // Busca participações detalhadas de um membro dentro do intervalo atual
  async function fetchParticipations(membroId, start, end) {
    try {
      const s = start ? new Date(start + 'T00:00:00') : new Date('1970-01-01');
      const e = end ? new Date(end + 'T23:59:59') : new Date('9999-12-31');
      const { data } = await supabase
        .from('escala_membros')
        .select('escalas(titulo,data_escala)')
        .eq('membro_id', membroId);
      const participations = (data || [])
        .map(item => item.escalas)
        .filter(es => !!es)
        .filter(es => {
          const d = new Date(es.data_escala + 'T00:00:00');
          return d >= s && d <= e;
        })
        .sort((a,b) => new Date(a.data_escala) - new Date(b.data_escala));
      return participations;
    } catch (err) {
      console.error('Erro ao buscar participações:', err);
      return [];
    }
  }

  async function handleOpenDetails(membroId, nome) {
    setSelectedUserId(membroId);
    setSelectedUserName(nome);
    const parts = await fetchParticipations(membroId, rankingStart, rankingEnd);
    setSelectedParticipations(parts);
    setShowDetailsModal(true);
  }

  useEffect(() => {
    if (abaAtiva === 'indisponibilidade-geral') {
      fetchTodasIndisponibilidades();
    }
  }, [abaAtiva]);

  async function handleSalvarEscalaBase(e) {
    e.preventDefault();
    try {
      const payload = { titulo, data_escala: dataEscala, observacoes, equipe_id: equipeId || null };
      const { error } = escalaParaEditar 
        ? await supabase.from('escalas').update(payload).eq('id', escalaParaEditar.id)
        : await supabase.from('escalas').insert([payload]);
      if (error) throw error;
      setIsModalOpen(false);
      fetchDados();
      mostrarNotificacao('sucesso', 'Data salva!');
    } catch (error) { mostrarNotificacao('erro', error.message); }
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4">
      {/* NOTIFICAÇÃO */}
      {notificacao && (
        <div className="fixed top-5 right-5 z-[200] animate-fade-in bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
          {notificacao.tipo === 'sucesso' ? <CheckCircle className="text-emerald-400"/> : <AlertCircle className="text-rose-400"/>}
          <span className="font-bold text-sm">{notificacao.texto}</span>
        </div>
      )}

      {/* HEADER & NAVEGAÇÃO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Escalas</h2>
          <div className="flex bg-slate-100 p-1 rounded-2xl mt-4 w-fit">
            <button onClick={() => setAbaAtiva('escalas')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${abaAtiva === 'escalas' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Visualizar Escalas</button>
            <button onClick={() => setAbaAtiva('minha-disponibilidade')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${abaAtiva === 'minha-disponibilidade' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Minha Disponibilidade</button>
            {perfil?.is_admin && (
              <button onClick={() => setAbaAtiva('indisponibilidade-geral')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${abaAtiva === 'indisponibilidade-geral' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Indisponibilidade Geral</button>
            )}
            <button onClick={() => setAbaAtiva('ranking')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${abaAtiva === 'ranking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Ranking de Participação</button>
          </div>
        </div>
        {perfil?.is_admin && abaAtiva === 'escalas' && (
          <button onClick={() => { setEscalaParaEditar(null); setTitulo(''); setDataEscala(''); setObservacoes(''); setEquipeId(''); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-2 font-black hover:bg-indigo-700 transition-all active:scale-95">
            <Plus size={20} /> Nova Escala
          </button>
        )}
      </div>

      {/* ABA ESCALAS */}
      {abaAtiva === 'escalas' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filtro por Equipe */}
          <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm w-fit">
            <Users size={18} className="text-slate-400 ml-2" />
            <select 
              value={filtroEquipeId} 
              onChange={e => setFiltroEquipeId(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-sm text-slate-600 pr-8 cursor-pointer"
            >
              <option value="todas">Todas as Equipes</option>
              {equipes.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4">
            {escalas.filter(e => filtroEquipeId === 'todas' || e.equipe_id === filtroEquipeId).length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-100 p-20 rounded-[3rem] text-center">
                <p className="text-slate-300 font-bold italic">Nenhuma escala encontrada para esta equipe.</p>
              </div>
            ) : (
              escalas
                .filter(e => filtroEquipeId === 'todas' || e.equipe_id === filtroEquipeId)
                .map(e => (
                <div key={e.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-indigo-100 transition-all">
              <div className="flex items-center gap-6">
                <div className="bg-slate-50 text-indigo-600 p-5 rounded-[1.8rem] group-hover:bg-indigo-50 transition-colors"><CalendarDays size={32} /></div>
                <div>
                  <h3 className="font-black text-slate-800 text-xl tracking-tight">{e.titulo}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <p className="text-indigo-600 font-bold text-sm flex items-center gap-2">
                      <Calendar size={14}/> {new Date(e.data_escala).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </p>
                    {e.equipes?.nome && (
                      <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
                        <Users size={14}/> {e.equipes.nome}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={async () => {
                  const [{ data: m }, { data: mus }] = await Promise.all([
                    supabase.from('escala_membros').select('funcao_na_escala, perfis(nome)').eq('escala_id', e.id),
                    supabase.from('escala_musicas').select('ordem, repertorio(titulo, tom)').eq('escala_id', e.id).order('ordem')
                  ]);
                  setEscalaParaVer({ ...e, membros: m, musicas: mus });
                }} className="flex-1 md:flex-none p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center justify-center gap-2 font-bold text-sm"><Search size={18}/> Detalhes</button>
                {perfil?.is_admin && (
                  <>
                    <button onClick={() => {
                      setEscalaParaEditar(e);
                      setTitulo(e.titulo);
                      setDataEscala(e.data_escala);
                      setObservacoes(e.observacoes || '');
                      setEquipeId(e.equipe_id || '');
                      setIsModalOpen(true);
                    }} className="flex-1 md:flex-none p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center justify-center gap-2 font-bold text-sm"><Edit2 size={18}/> Editar</button>
                    <button onClick={() => abrirPainelMontagem(e)} className="flex-[2] md:flex-none bg-indigo-600 text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-50 active:scale-95"><Settings2 size={18} /> Montar</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
          </div>
        </div>
      )}

      {abaAtiva === 'indisponibilidade-geral' && perfil?.is_admin && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <CalendarOff size={18} className="text-rose-500" /> Indisponibilidade da Equipe
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data Inicial</label>
                <input type="date" value={filtroIndStart} onChange={e => setFiltroIndStart(e.target.value)} className="w-full p-3 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-rose-500 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data Final</label>
                <input type="date" value={filtroIndEnd} onChange={e => setFiltroIndEnd(e.target.value)} className="w-full p-3 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-rose-500 transition-all" />
              </div>
              <div className="flex items-end">
                <button onClick={fetchTodasIndisponibilidades} className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black hover:bg-slate-800 transition active:scale-[0.98]">Filtrar Período</button>
              </div>
            </div>

            {loadingIndisponibilidade ? (
              <div className="text-center py-10"><p className="text-slate-400 animate-pulse font-bold">Carregando bloqueios...</p></div>
            ) : todasIndisponibilidades.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 italic">Nenhum bloqueio encontrado para este período.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {todasIndisponibilidades.map(ind => (
                  <div key={ind.id} className="bg-slate-50 p-6 rounded-[2.2rem] border border-slate-100 flex items-start gap-4">
                    <div className="bg-white text-rose-500 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm shrink-0 border border-rose-50">
                      <span className="text-[9px] font-black uppercase leading-none mb-1">{new Date(ind.data_bloqueio).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })}</span>
                      <span className="text-xl font-black leading-none">{new Date(ind.data_bloqueio).toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' })}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-slate-800 text-sm leading-none">{ind.perfis?.nome || 'Usuário Removido'}</p>
                      <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Ausência Comunicada</p>
                      <p className="text-slate-500 text-xs font-medium italic mt-1 leading-relaxed">"{ind.motivo || 'Sem motivo detalhado'}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {abaAtiva === 'ranking' && (
        <>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Users size={18} /> Ranking de Participação</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Início</label>
              <input type="date" value={rankingStart} onChange={e => setRankingStart(e.target.value)} className="w-full p-3 bg-slate-50 rounded-2xl" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fim</label>
              <input type="date" value={rankingEnd} onChange={e => setRankingEnd(e.target.value)} className="w-full p-3 bg-slate-50 rounded-2xl" />
            </div>
            <div className="flex items-end">
              <button onClick={() => fetchRanking(rankingStart, rankingEnd)} className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold">Gerar Ranking</button>
            </div>
          </div>

          {loadingRanking ? (
            <div className="text-center py-8">Gerando ranking...</div>
          ) : rankingResults.length === 0 ? (
            <p className="text-slate-500 italic">Nenhuma participação encontrada no período selecionado.</p>
          ) : (
            <div className="space-y-3">
              {rankingResults.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center font-black">{i+1}</div>
                    <div>
                      <p className="font-black text-slate-800"><button onClick={() => handleOpenDetails(r.id, r.nome)} className="text-left underline font-black text-slate-800">{r.nome}</button></p>
                      <p className="text-[10px] text-slate-400 uppercase">Participações: {r.count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6">
              <div className="flex justify-between items-start">
                <h4 className="font-black text-lg">Participações de {selectedUserName}</h4>
                <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 font-bold">Fechar</button>
              </div>
              <div className="mt-4 space-y-3">
                {selectedParticipations.length === 0 ? (
                  <p className="text-slate-500 italic">Nenhuma participação neste período.</p>
                ) : (
                  selectedParticipations.map((p, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl">
                      <p className="font-bold">{p.titulo}</p>
                      <p className="text-sm text-slate-400">{new Date(p.data_escala).toLocaleDateString('pt-BR')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {/* ABA INDISPONIBILIDADE (LAYOUT REDESENHADO) */}
      {abaAtiva === 'minha-disponibilidade' && (
        <div className="grid lg:grid-cols-12 gap-8 animate-fade-in">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-rose-500"><CalendarOff size={80} /></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-slate-800 mb-2">Bloquear Agenda</h3>
                <p className="text-slate-500 text-sm font-medium mb-8">Informe datas em que você não poderá servir.</p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data da Ausência</label>
                    <input type="date" value={dataIndisponivel} onChange={e => setDataIndisponivel(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-rose-200 focus:bg-white transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Motivo detalhado</label>
                    <textarea value={motivoIndisponivel} onChange={e => setMotivoIndisponivel(e.target.value)} placeholder="Ex: Estarei viajando a trabalho..." className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-rose-200 focus:bg-white transition-all h-28 resize-none text-sm font-medium" />
                  </div>
                  <button onClick={registrarIndisponibilidade} className="w-full bg-rose-500 text-white py-5 rounded-2xl font-black shadow-xl shadow-rose-100 hover:bg-rose-600 transition flex items-center justify-center gap-3 active:scale-[0.98]">Confirmar Bloqueio</button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Minhas Datas Bloqueadas</h4>
              <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1 rounded-full">{minhasIndisponibilidades.length} REGISTROS</span>
            </div>
            <div className="grid gap-4">
              {minhasIndisponibilidades.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-100 p-16 rounded-[3rem] text-center"><p className="text-slate-300 font-bold italic">Nenhum bloqueio registrado.</p></div>
              ) : (
                minhasIndisponibilidades.map(ind => (
                  <div key={ind.id} className="bg-white p-6 rounded-[2.2rem] border border-slate-50 shadow-sm flex items-start justify-between group hover:border-rose-100 transition-all">
                    <div className="flex gap-6">
                      <div className="bg-rose-50 text-rose-500 w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-black uppercase leading-none mb-1">{new Date(ind.data_bloqueio).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })}</span>
                        <span className="text-2xl font-black leading-none">{new Date(ind.data_bloqueio).toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' })}</span>
                      </div>
                      <div className="space-y-1 py-1">
                        <p className="font-black text-slate-800 text-xs uppercase tracking-tighter">Ausência Confirmada</p>
                        <p className="text-slate-500 text-sm font-medium">{ind.motivo || "Nenhum motivo informado."}</p>
                      </div>
                    </div>
                    <button onClick={async () => { if(confirm('Liberar esta data?')) { await supabase.from('indisponibilidade').delete().eq('id', ind.id); fetchMinhasIndisponibilidades(session.user.id); } }} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition"><Trash2 size={20}/></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAINEL DE MONTAGEM (ADMIN) */}
      {escalaAtiva && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-2 md:p-6">
          <div className="bg-white w-full max-w-6xl h-full md:h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Escala: {escalaAtiva.titulo}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-indigo-100 text-sm font-bold flex items-center gap-2"><UserCheck size={16}/> Filtrando membros disponíveis</p>
                  <p className="text-indigo-100 text-sm font-bold flex items-center gap-2"><Calendar size={16}/> {new Date(escalaAtiva.data_escala).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                </div>
              </div>
              <button onClick={() => setEscalaAtiva(null)} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 grid lg:grid-cols-2 gap-12">
              {/* EQUIPE */}
              <div className="space-y-6">
                <h4 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b pb-4"><Users className="text-indigo-600" /> Equipe</h4>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {membrosDisponiveis.map(m => {
                      const jaNaEscala = escalaMembros.some(em => em.membro_id === m.id);
                      const selecionadoPendente = membrosParaAdicionar.some(i => i.id === m.id);
                      
                      return (
                        <button 
                          key={m.id} 
                          disabled={jaNaEscala}
                          onClick={() => {
                            if(selecionadoPendente) setMembrosParaAdicionar(membrosParaAdicionar.filter(i => i.id !== m.id));
                            else setMembrosParaAdicionar([...membrosParaAdicionar, {...m, funcao: 'Vocal'}]);
                          }} 
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                            jaNaEscala ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50' :
                            selecionadoPendente ? 'bg-indigo-600 text-white' : 
                            'bg-white text-slate-600 hover:border-indigo-300 border border-transparent'
                          }`}
                        >
                          {m.nome} {jaNaEscala && '(Já escalado)'}
                        </button>
                      );
                    })}
                  </div>
                  {membrosParaAdicionar.length > 0 && (
                    <div className="space-y-3 pt-6 border-t border-slate-200">
                      {membrosParaAdicionar.map(m => (
                        <div key={m.id} className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-indigo-50 shadow-sm">
                          <span className="flex-1 text-sm font-black text-slate-700 pl-2">{m.nome}</span>
                          <select value={m.funcao} onChange={e => setMembrosParaAdicionar(membrosParaAdicionar.map(i => i.id === m.id ? {...i, funcao: e.target.value} : i))} className="text-xs font-bold p-2 bg-slate-50 rounded-xl outline-none">
                            <option value="Ministro">Ministro</option><option value="Vocal">Vocal</option><option value="Violão">Violão</option><option value="Guitarra">Guitarra</option><option value="Teclado">Teclado</option><option value="Baixo">Baixo</option><option value="Bateria">Bateria</option><option value="Som/Mídia">Som/Mídia</option>
                          </select>
                        </div>
                      ))}
                      <button onClick={async () => {
                        const payload = membrosParaAdicionar.map(m => ({ escala_id: escalaAtiva.id, membro_id: m.id, funcao_na_escala: m.funcao }));
                        const { error } = await supabase.from('escala_membros').insert(payload);
                        if(!error) { setMembrosParaAdicionar([]); carregarDetalhes(escalaAtiva.id); mostrarNotificacao('sucesso', 'Equipe salva!'); }
                      }} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700">Confirmar Selecionados</button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {escalaMembros.map(em => (
                    <div key={em.id} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-3xl">
                      <div><p className="font-black text-slate-800 text-sm">{em.perfis?.nome}</p><p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{em.funcao_na_escala}</p></div>
                      <button 
                        onClick={async () => { 
                          if(confirm(`Remover ${em.perfis?.nome} desta escala?`)) {
                            const { error } = await supabase.from('escala_membros').delete().eq('id', em.id); 
                            if(!error) {
                              carregarDetalhes(escalaAtiva.id);
                              mostrarNotificacao('sucesso', 'Membro removido!');
                            }
                          }
                        }} 
                        className="text-slate-200 hover:text-rose-500 transition"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* REPERTÓRIO */}
              <div className="space-y-6">
                <h4 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b pb-4"><Music className="text-indigo-600" /> Repertório</h4>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4">
                  {/* Busca de Músicas */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar música..."
                      className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all text-sm"
                      value={buscaMusica}
                      onChange={e => setBuscaMusica(e.target.value)}
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {musicasDisponiveis
                      .filter(m => m.titulo.toLowerCase().includes(buscaMusica.toLowerCase()))
                      .map(m => (
                      <label key={m.id} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-transparent hover:border-indigo-200 cursor-pointer transition">
                        <input type="checkbox" checked={musicasParaAdicionar.includes(m.id)} onChange={() => {
                          if(musicasParaAdicionar.includes(m.id)) setMusicasParaAdicionar(musicasParaAdicionar.filter(id => id !== m.id));
                          else setMusicasParaAdicionar([...musicasParaAdicionar, m.id]);
                        }} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm font-bold text-slate-700">{m.titulo}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={async () => {
                    const payload = musicasParaAdicionar.map((id, idx) => ({ escala_id: escalaAtiva.id, musica_id: id, ordem: escalaMusicas.length + idx + 1 }));
                    const { error } = await supabase.from('escala_musicas').insert(payload);
                    if(!error) { setMusicasParaAdicionar([]); carregarDetalhes(escalaAtiva.id); mostrarNotificacao('sucesso', 'Repertório atualizado!'); setBuscaMusica(''); }
                  }} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl">Adicionar à Setlist</button>
                </div>
                <div className="space-y-2">
                  {escalaMusicas.map((em, idx) => (
                    <div key={em.id} className="flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-3xl">
                      <span className="bg-slate-100 text-slate-400 font-black text-[10px] w-8 h-8 flex items-center justify-center rounded-full">{idx+1}</span>
                      <p className="font-black text-slate-800 flex-1 truncate text-sm">{em.repertorio?.titulo}</p>
                      <button 
                        onClick={async () => { 
                          if(confirm(`Remover "${em.repertorio?.titulo}" da setlist?`)) {
                            const { error } = await supabase.from('escala_musicas').delete().eq('id', em.id); 
                            if(!error) {
                              carregarDetalhes(escalaAtiva.id);
                              mostrarNotificacao('sucesso', 'Música removida!');
                            }
                          }
                        }} 
                        className="text-slate-200 hover:text-rose-500 transition"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO PARA IMPRESSÃO */}
      {escalaParaVer && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 print:p-0">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] shadow-2xl print:max-h-full print:rounded-none">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center print:hidden">
              <h3 className="font-black text-slate-800 text-xl">Ficha da Escala</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"><Printer size={18}/> PDF</button>
                <button onClick={() => setEscalaParaVer(null)} className="bg-slate-100 p-3 rounded-full hover:bg-slate-200 transition"><X size={20} /></button>
              </div>
            </div>
            <div className="p-12 space-y-12 print:p-8">
              <div className="text-center space-y-4 border-b pb-12">
                <h2 className="text-4xl font-black text-indigo-600 uppercase tracking-tighter">{escalaParaVer.titulo}</h2>
                <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
                   <span>{new Date(escalaParaVer.data_escala).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                   {escalaParaVer.equipes?.nome && (
                     <>
                       <span className="text-indigo-200">•</span>
                       <span>Equipe: {escalaParaVer.equipes.nome}</span>
                     </>
                   )}
                   <span className="text-indigo-200">•</span>
                   <span>Despertar Louvor</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-16">
                <div className="space-y-6">
                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-500 border-l-4 border-indigo-500 pl-4">Equipe</h4>
                  <div className="space-y-4">
                    {escalaParaVer.membros?.map((m, i) => (
                      <div key={i} className="flex justify-between border-b border-slate-50 pb-3">
                        <span className="font-black text-slate-700 text-sm">{m.perfis?.nome}</span>
                        <span className="text-[9px] font-black bg-slate-50 px-2 py-1 rounded text-slate-400 uppercase tracking-tighter">{m.funcao_na_escala}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-500 border-l-4 border-emerald-500 pl-4">Setlist</h4>
                  <div className="space-y-4">
                    {escalaParaVer.musicas?.map((m, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <span className="font-black text-slate-700 text-sm truncate pr-2">{m.repertorio?.titulo}</span>
                        <span className="font-black text-emerald-500 text-[10px] bg-emerald-50 px-2 py-1 rounded">{m.repertorio?.tom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {escalaParaVer.observacoes && (
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2 tracking-widest"><Info size={14}/> Observações Gerais</h5>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">{escalaParaVer.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR/EDITAR DATA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-8">{escalaParaEditar ? 'Ajustar' : 'Nova'} Escala</h3>
            <form onSubmit={handleSalvarEscalaBase} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nome do Culto</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Santa Ceia" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Data</label>
                <input type="date" value={dataEscala} onChange={e => setDataEscala(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Equipe Responsável</label>
                <select 
                  value={equipeId} 
                  onChange={e => setEquipeId(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                >
                  <option value="">Selecione uma equipe</option>
                  {equipes.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.nome}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Avisos</label>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Horário de chegada..." className="w-full p-4 bg-slate-50 rounded-2xl h-24 outline-none focus:ring-2 focus:ring-indigo-600 resize-none font-medium" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
