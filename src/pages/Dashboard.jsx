import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  Cake, 
  Music, 
  ChevronRight, 
  Star, 
  Clock, 
  Bell, 
  CalendarCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard({ session }) {
  const [minhasEscalas, setMinhasEscalas] = useState([]);
  const [aniversariantes, setAniversariantes] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState('');

  useEffect(() => {
    // Só dispara a busca se houver uma sessão ativa
    if (session?.user?.id) {
      fetchDados();
    }
  }, [session]);

  async function fetchDados() {
    try {
      setLoading(true);
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;

      // 1. BUSCA O NOME REAL DO USUÁRIO LOGADO
      const { data: perfilLogado, error: perfilError } = await supabase
        .from('perfis') 
        .select('nome')
        .eq('id', session.user.id) // Filtra pelo ID da conta logada
        .single();
      
      if (perfilLogado) {
        setNomeUsuario(perfilLogado.nome.split(' ')[0]);
      } else {
        // Fallback caso o perfil não tenha nome cadastrado
        setNomeUsuario('Membro');
      }

      // 2. BUSCA ESCALAS DO USUÁRIO LOGADO
      const { data: participacoes } = await supabase
        .from('escala_membros')
        .select('funcao_na_escala, escalas(id, titulo, data_escala)')
        .eq('membro_id', session.user.id);
      
      if (participacoes) {
        const filtradas = participacoes
          .filter(item => {
            if (!item.escalas?.data_escala) return false;
            const d = new Date(item.escalas.data_escala + 'T00:00:00');
            return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
          })
          .sort((a, b) => new Date(a.escalas.data_escala) - new Date(b.escalas.data_escala));
        setMinhasEscalas(filtradas);
      }

      // 3. ANIVERSARIANTES
      const { data: niverData } = await supabase
        .from('perfis')
        .select('nome, aniversario_dia, aniversario_mes')
        .eq('aniversario_mes', mesAtual)
        .order('aniversario_dia', { ascending: true });

      setAniversariantes(niverData || []);

      // 4. AVISOS
      const { data: av } = await supabase
        .from('avisos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2);
      setAvisos(av || []);

    } catch (err) {
      console.error("Erro no Dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-4 animate-fade-in pb-20">
      
      {/* HEADER DINÂMICO */}
      <div className="px-2">
        <h2 className="text-5xl font-black text-slate-800 tracking-tighter italic">
          Olá, {loading ? '...' : nomeUsuario}! 👋
        </h2>
        <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
          <Calendar size={14} className="text-indigo-500" />
          Painel do Integrante • {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* AGENDA PESSOAL */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <CalendarCheck size={18} className="text-indigo-500" /> Minha Agenda
          </h3>
          
          <div className="flex-1 space-y-4">
            {loading ? (
              <p className="text-center py-10 text-slate-300 font-bold animate-pulse">Buscando suas escalas...</p>
            ) : minhasEscalas.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Clock className="mx-auto text-slate-200" size={32} />
                <p className="text-slate-400 italic text-sm font-medium">Você não está escalado para este mês.</p>
              </div>
            ) : (
              minhasEscalas.map((item, i) => (
                <Link 
                  key={i} 
                  to="/escalas" 
                  className="p-5 bg-slate-50 rounded-[2rem] flex justify-between items-center group hover:bg-indigo-600 transition-all border border-transparent"
                >
                  <div className="flex items-center gap-5">
                    <div className="bg-white p-3 rounded-xl shadow-sm font-black text-indigo-600 text-center min-w-[55px] group-hover:scale-110 transition-transform">
                      {new Date(item.escalas?.data_escala + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit'})}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg group-hover:text-white transition-colors tracking-tight">
                        {item.escalas?.titulo}
                      </p>
                      <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest group-hover:text-indigo-200 transition-colors">
                        {item.funcao_na_escala}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* ANIVERSARIANTES */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 px-2">
            <Cake size={18} className="text-rose-500" /> Equipe Despertar
          </h3>
          
          <div className="space-y-3">
            {aniversariantes.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <p className="text-slate-300 italic text-sm font-medium">Nenhum aniversariante em Maio.</p>
              </div>
            ) : (
              aniversariantes.map((n, i) => (
                <div key={i} className="flex items-center justify-between p-5 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 group">
                  <div className="flex items-center gap-4">
                    <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm group-hover:scale-110 transition-all">
                      <Star size={20} fill="currentColor" />
                    </div>
                    <span className="font-black text-slate-700 block">{n.nome}</span>
                  </div>
                  <div className="bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-black">
                    Dia {String(n.aniversario_dia).padStart(2, '0')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BLOCO INFERIOR */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[3rem] text-white space-y-8">
          <h3 className="font-black text-amber-400 uppercase text-xs tracking-widest flex items-center gap-2">
            <Bell size={18} /> Mural de Avisos
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {avisos.map(a => (
              <div key={a.id} className="border-l-2 border-white/10 pl-6">
                <p className="font-black text-xl mb-1">{a.titulo}</p>
                <p className="text-slate-400 text-sm line-clamp-2">{a.mensagem}</p>
              </div>
            ))}
          </div>
        </div>

        <Link to="/repertorio" className="bg-indigo-600 p-10 rounded-[3rem] text-white flex flex-col justify-between group hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100">
          <Music size={40} />
          <div>
            <h4 className="text-3xl font-black leading-tight mb-2 tracking-tighter">Estudar <br />Músicas</h4>
            <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest">Repertório Completo</p>
          </div>
          <ChevronRight size={32} className="self-end group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </div>
  );
}