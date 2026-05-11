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
    if (session?.user) {
      fetchDados();
    }
  }, [session]);

  async function fetchDados() {
    try {
      setLoading(true);
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const userId = session.user.id;

      // 1. BUSCA O NOME (LÓGICA BLINDADA CONTRA ERRO 406)
      // Pedimos um array com limite de 1. Assim, se vier vazio ou vierem 5, não dá erro.
      const { data: perfilDataArray, error: perfilError } = await supabase
        .from('perfis')
        .select('nome, is_admin')
        .eq('id', userId)
        .limit(1);

      if (perfilError) {
        console.error("Erro na consulta do perfil:", perfilError.message);
        setNomeUsuario('Membro');
      } else if (perfilDataArray && perfilDataArray.length > 0 && perfilDataArray[0].nome) {
        // Pega o primeiro nome da string que veio do banco
        setNomeUsuario(perfilDataArray[0].nome.split(' ')[0]);
      } else {
        // Se a busca deu certo mas o array está vazio
        console.warn(`ID ${userId} não encontrado na tabela 'perfis'.`);
        setNomeUsuario('Membro');
      }

      // 2. BUSCA ESCALAS DO USUÁRIO
      const { data: escData } = await supabase
        .from('escala_membros')
        .select('funcao_na_escala, escalas(id, titulo, data_escala)')
        .eq('membro_id', userId);
      
      if (escData) {
        const filtradas = escData
          .filter(item => {
            if (!item.escalas?.data_escala) return false;
            const d = new Date(item.escalas.data_escala + 'T00:00:00');
            return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
          })
          .sort((a, b) => new Date(a.escalas.data_escala) - new Date(b.escalas.data_escala));
        setMinhasEscalas(filtradas);
      }

      // 3. ANIVERSARIANTES DO MÊS
      const { data: niverData } = await supabase
        .from('perfis')
        .select('nome, aniversario_dia, aniversario_mes')
        .eq('aniversario_mes', mesAtual)
        .order('aniversario_dia', { ascending: true });

      setAniversariantes(niverData || []);

      // 4. AVISOS (apenas avisos em vigência)
      const hojeISO = new Date().toISOString().split('T')[0];
      let queryAvisos = supabase.from('avisos').select('*').or(`data_expiracao.is.null,data_expiracao.gte.${hojeISO}`);
      // se o perfil não for admin, filtra avisos administrativos
      const isAdmin = perfilDataArray && perfilDataArray.length > 0 && perfilDataArray[0].is_admin;
      if (!isAdmin) queryAvisos = queryAvisos.not('titulo', 'like', 'ADMIN:%');
      const { data: avData } = await queryAvisos.order('created_at', { ascending: false });
      setAvisos(avData || []);

    } catch (err) {
      console.error("Falha geral ao sincronizar o Dashboard:", err);
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
          <CalendarCheck size={14} className="text-indigo-500" />
          Painel de Controle • {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* CARD: MINHA AGENDA */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-500" /> Minhas Escalas
          </h3>
          
          <div className="flex-1 space-y-4">
            {loading ? (
              <div className="text-center py-10 animate-pulse text-slate-300 font-bold uppercase text-[10px]">Sincronizando...</div>
            ) : minhasEscalas.length === 0 ? (
              <div className="text-center py-10 space-y-2 border border-dashed border-slate-100 rounded-[2.5rem]">
                <Clock className="mx-auto text-slate-200" size={32} />
                <p className="text-slate-400 italic text-sm font-medium">Você não possui escalas para este mês.</p>
              </div>
            ) : (
              minhasEscalas.map((item, i) => (
                <Link 
                  key={i} 
                  to="/escalas" 
                  className="p-5 bg-slate-50 rounded-[2rem] flex justify-between items-center group hover:bg-indigo-600 transition-all border border-transparent shadow-sm hover:shadow-indigo-100"
                >
                  <div className="flex items-center gap-5">
                    <div className="bg-white p-3 rounded-2xl shadow-sm font-black text-indigo-600 text-center min-w-[55px] group-hover:scale-110 transition-transform">
                      <span className="text-[9px] block opacity-40 leading-none mb-1 uppercase">Dia</span>
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

        {/* CARD: ANIVERSARIANTES */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 px-2">
            <Cake size={18} className="text-rose-500" /> Aniversariantes do Mês
          </h3>
          
          <div className="space-y-3">
            {aniversariantes.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-100">
                <p className="text-slate-300 italic text-sm font-medium">Nenhum aniversariante encontrado.</p>
              </div>
            ) : (
              aniversariantes.map((n, i) => (
                <div key={i} className="flex items-center justify-between p-5 hover:bg-rose-50 rounded-2xl transition-all group border border-transparent">
                  <div className="flex items-center gap-4">
                    <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm group-hover:rotate-6 transition-transform">
                      <Star size={20} fill="currentColor" />
                    </div>
                    <div>
                      <span className="font-black text-slate-700 block tracking-tight">{n.nome}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Integrante da Equipe</span>
                    </div>
                  </div>
                  <div className="bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm">
                    Dia {String(n.aniversario_dia).padStart(2, '0')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FOOTER: COMUNICADOS E REPERTÓRIO */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] opacity-5"><Bell size={140} /></div>
          <h3 className="font-black text-amber-400 uppercase text-xs tracking-widest flex items-center gap-2 relative z-10">
            <Bell size={18} /> Comunicados da Liderança
          </h3>
          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            {avisos.length > 0 ? avisos.map(a => (
              <div key={a.id} className="space-y-2 border-l border-white/20 pl-6">
                <p className="font-black text-xl leading-tight">{a.titulo}</p>
                <p className="text-slate-400 text-sm font-medium leading-relaxed line-clamp-2">{a.mensagem}</p>
              </div>
            )) : (
              <p className="text-slate-500 italic text-sm">Não há novos avisos no momento.</p>
            )}
          </div>
        </div>

        <Link to="/repertorio" className="bg-indigo-600 p-10 rounded-[3rem] text-white flex flex-col justify-between group hover:bg-indigo-700 transition-all relative overflow-hidden shadow-2xl shadow-indigo-100">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <Music size={160} />
          </div>
          <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md mb-4">
            <Music size={28} />
          </div>
          <div className="relative z-10">
            <h4 className="text-3xl font-black leading-[0.9] mb-2 tracking-tighter">Estudar <br />Repertório</h4>
            <p className="text-indigo-100 text-[10px] font-bold opacity-80 uppercase tracking-widest">Cifras e Letras</p>
          </div>
          <ChevronRight size={32} className="self-end relative z-10 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </div>
  );
}