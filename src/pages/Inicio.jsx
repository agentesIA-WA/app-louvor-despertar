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

export default function Inicio({ session }) {
  const [minhasEscalas, setMinhasEscalas] = useState([]);
  const [aniversariantes, setAniversariantes] = useState([]);
  const [avisosRecentes, setAvisosRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboard();
    }
  }, [session]);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1; // 1-12

      // 1. Buscar Nome do Usuário Logado
      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome')
        .eq('id', session.user.id)
        .maybeSingle();
      if (perfil) setNomeUsuario(perfil.nome.split(' ')[0]);

      // 2. Buscar Avisos (Design atualizado)
      const { data: avisos } = await supabase
        .from('avisos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2);
      setAvisosRecentes(avisos || []);

      // 3. Buscar TODAS as escalas do membro (Filtro de mês feito no JS para segurança)
      const { data: participacoes } = await supabase
        .from('escala_membros')
        .select(`
          funcao_na_escala,
          escalas ( id, titulo, data_escala )
        `)
        .eq('membro_id', session.user.id);

      if (participacoes) {
        const filtradas = participacoes
          .filter(item => {
            if (!item.escalas?.data_escala) return false;
            // Verifica se a escala pertence ao mês e ano atuais
            const d = new Date(item.escalas.data_escala + 'T00:00:00');
            return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
          })
          .sort((a, b) => new Date(a.escalas.data_escala) - new Date(b.escalas.data_escala));
        setMinhasEscalas(filtradas);
      }

      // 4. Buscar Aniversariantes do Mês
      const { data: todosPerfis } = await supabase
        .from('perfis')
        .select('nome, data_nascimento')
        .not('data_nascimento', 'is', null);

      if (todosPerfis) {
        const doMes = todosPerfis.filter(p => {
          const mNasc = parseInt(p.data_nascimento.split('-')[1]);
          return mNasc === mesAtual;
        }).sort((a, b) => parseInt(a.data_nascimento.split('-')[2]) - parseInt(b.data_nascimento.split('-')[2]));
        setAniversariantes(doMes);
      }

    } catch (error) {
      console.error("Erro no carregamento do Dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      
      {/* HEADER DINÂMICO */}
      <div className="px-2">
        <h2 className="text-5xl font-black text-slate-800 tracking-tighter italic">
          Olá, {nomeUsuario || 'Wesley'}! 👋
        </h2>
        <p className="text-slate-500 font-bold mt-2 flex items-center gap-2 uppercase text-[10px] tracking-[0.3em]">
          <Calendar size={14} className="text-indigo-500" /> 
          Dashboard de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* COLUNA 1: ESCALAS E AVISOS */}
        <div className="lg:col-span-7 space-y-10">
          
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Minha Agenda</h3>
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[200px] flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center p-10 font-black text-slate-300 animate-pulse">ATUALIZANDO...</div>
              ) : minhasEscalas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <div className="bg-slate-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                    <CalendarCheck size={40} />
                  </div>
                  <p className="text-slate-400 font-bold italic text-sm">Nenhuma escala para você este mês.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {minhasEscalas.map((item, idx) => (
                    <div key={idx} className="p-8 hover:bg-slate-50 transition flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className="bg-slate-900 text-white w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center shadow-xl">
                          <span className="text-[10px] font-black uppercase opacity-60">
                            {new Date(item.escalas.data_escala + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                          </span>
                          <span className="text-2xl font-black">
                            {new Date(item.escalas.data_escala + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit' })}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-xl tracking-tight">{item.escalas.titulo}</h4>
                          <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 inline-block">
                            {item.funcao_na_escala}
                          </span>
                        </div>
                      </div>
                      <Link to="/escalas" className="bg-white p-4 rounded-2xl shadow-sm text-slate-300 group-hover:text-indigo-600 transition-all"><ChevronRight /></Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Avisos Recentes</h3>
            <div className="grid gap-4">
              {avisosRecentes.map(aviso => (
                <div key={aviso.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center gap-5 group">
                  <div className="bg-amber-50 text-amber-500 p-4 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Bell size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{aviso.titulo}</h4>
                    <p className="text-slate-500 text-sm line-clamp-1">{aviso.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* COLUNA 2: ANIVERSARIANTES E REPERTÓRIO */}
        <div className="lg:col-span-5 space-y-10">
          
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Aniversariantes</h3>
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8">
              {aniversariantes.length === 0 ? (
                <p className="text-center text-slate-300 py-10 italic">Nenhum aniversariante este mês.</p>
              ) : (
                <div className="space-y-4">
                  {aniversariantes.map((niver, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-rose-50 rounded-[2rem] transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm group-hover:rotate-12 transition-transform">
                          <Star size={20} fill="currentColor" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{niver.nome}</p>
                          <p className="text-[10px] font-black text-rose-400 uppercase">Dia {niver.data_nascimento.split('-')[2]}</p>
                        </div>
                      </div>
                      <Cake size={20} className="text-rose-100 group-hover:text-rose-500 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="bg-indigo-600 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-100 group">
            <div className="absolute right-[-10%] bottom-[-10%] opacity-10 group-hover:scale-125 transition-transform duration-1000">
              <Music size={250} />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="bg-white/10 w-16 h-16 rounded-3xl flex items-center justify-center backdrop-blur-xl">
                <Music size={32} />
              </div>
              <h3 className="text-4xl font-black leading-[0.9] tracking-tighter">Prepare o seu <br />Coração</h3>
              <Link to="/repertorio" className="inline-flex items-center gap-3 bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black shadow-xl hover:bg-indigo-50 transition-all active:scale-95">
                Ver Repertório <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}