import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  X,
  LayoutGrid,
  Edit2
} from 'lucide-react';

export default function Equipes({ session, perfil }) {
  const [equipes, setEquipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacao, setNotificacao] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nomeEquipe, setNomeEquipe] = useState('');
  const [descricaoEquipe, setDescricaoEquipe] = useState('');
  const [equipeParaEditar, setEquipeParaEditar] = useState(null);

  useEffect(() => {
    fetchEquipes();
  }, []);

  function mostrarNotificacao(tipo, texto) {
    setNotificacao({ tipo, texto });
    setTimeout(() => setNotificacao(null), 3000);
  }

  async function fetchEquipes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('nome');
      if (error) throw error;
      setEquipes(data || []);
    } catch (err) {
      console.error('Erro ao buscar equipes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarEquipe(e) {
    e.preventDefault();
    if (!nomeEquipe.trim()) return;

    try {
      const payload = { nome: nomeEquipe, descricao: descricaoEquipe };
      const { error } = equipeParaEditar 
        ? await supabase.from('equipes').update(payload).eq('id', equipeParaEditar.id)
        : await supabase.from('equipes').insert([payload]);
      
      if (error) throw error;
      
      mostrarNotificacao('sucesso', `Equipe ${equipeParaEditar ? 'atualizada' : 'criada'} com sucesso!`);
      setNomeEquipe('');
      setDescricaoEquipe('');
      setEquipeParaEditar(null);
      setIsModalOpen(false);
      fetchEquipes();
    } catch (err) {
      mostrarNotificacao('erro', 'Erro ao salvar equipe: ' + err.message);
    }
  }

  async function excluirEquipe(id, nome) {
    if (!confirm(`Deseja realmente excluir a equipe "${nome}"? Isso removerá o vínculo de todos os usuários com esta equipe.`)) return;

    try {
      const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      mostrarNotificacao('sucesso', 'Equipe excluída!');
      fetchEquipes();
    } catch (err) {
      mostrarNotificacao('erro', 'Erro ao excluir: ' + err.message);
    }
  }

  if (!perfil?.is_admin) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-500 italic">Acesso exclusivo para administradores.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-4 animate-fade-in pb-20">
      {notificacao && (
        <div className="fixed top-5 right-5 z-[70] animate-fade-in">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white font-bold ${notificacao.tipo === 'sucesso' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notificacao.tipo === 'sucesso' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            {notificacao.texto}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-5xl font-black text-slate-800 tracking-tighter italic">Equipes</h2>
          <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
            <ShieldCheck size={14} className="text-amber-500" /> Gestão de Ministérios
          </p>
        </div>
        <button 
          onClick={() => { setEquipeParaEditar(null); setNomeEquipe(''); setDescricaoEquipe(''); setIsModalOpen(true); }}
          className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl hover:bg-slate-800 transition-all active:scale-95"
        > 
          <Plus size={24} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          <p className="col-span-2 text-center py-20 text-slate-400 animate-pulse font-bold uppercase tracking-widest text-xs">Carregando Equipes...</p>
        ) : equipes.length === 0 ? (
          <div className="col-span-2 bg-white border-2 border-dashed border-slate-100 p-20 rounded-[3rem] text-center">
            <p className="text-slate-300 font-bold italic">Nenhuma equipe cadastrada.</p>
          </div>
        ) : (
          equipes.map(eq => (
            <div key={eq.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-indigo-100 transition-all flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl">
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight">{eq.nome}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                    {eq.descricao || 'Ministério Ativo'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEquipeParaEditar(eq); setNomeEquipe(eq.nome); setDescricaoEquipe(eq.descricao || ''); setIsModalOpen(true); }}
                  className="text-slate-200 hover:text-indigo-600 p-2 rounded-xl hover:bg-indigo-50 transition-all"
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={() => excluirEquipe(eq.id, eq.nome)}
                  className="text-slate-200 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-black text-slate-800 mb-2">{equipeParaEditar ? 'Editar' : 'Nova'} Equipe</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">
              {equipeParaEditar ? 'Atualize os dados do ministério ou área de atuação.' : 'Cadastre um novo ministério ou área de atuação.'}
            </p>

            <form onSubmit={handleSalvarEquipe} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome da Equipe</label>
                <input 
                  autoFocus
                  type="text" 
                  value={nomeEquipe}
                  onChange={e => setNomeEquipe(e.target.value)}
                  placeholder="Ex: Ministério de Louvor"
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição</label>
                <textarea 
                  value={descricaoEquipe}
                  onChange={e => setDescricaoEquipe(e.target.value)}
                  placeholder="Breve descrição da equipe..."
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-700 h-24 resize-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition active:scale-95"
              >
                {equipeParaEditar ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
