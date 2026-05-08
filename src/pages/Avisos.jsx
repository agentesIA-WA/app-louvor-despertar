import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Plus, Trash2, Edit2, Send, CheckCircle, AlertCircle, X, Megaphone, MessageSquare, Calendar } from 'lucide-react';

export default function Avisos({ session }) {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meuPerfil, setMeuPerfil] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avisoParaEditar, setAvisoParaEditar] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [dataExpiracao, setDataExpiracao] = useState(''); // Novo estado
  const [notificacao, setNotificacao] = useState(null);

  useEffect(() => {
    fetchDados();
  }, [session]);

  function mostrarNotificacao(tipo, texto) {
    setNotificacao({ tipo, texto });
    setTimeout(() => setNotificacao(null), 3000);
  }

  async function fetchDados() {
    try {
      setLoading(true);
      const hoje = new Date().toISOString().split('T')[0];

      // Busca avisos que NÃO expiraram OU que não têm data de expiração
      const { data: avisosData, error: avisosError } = await supabase
        .from('avisos')
        .select('*')
        .or(`data_expiracao.is.null,data_expiracao.gte.${hoje}`)
        .order('created_at', { ascending: false });
        
      if (avisosError) throw avisosError;
      if (avisosData) setAvisos(avisosData);

      if (session?.user) {
        const { data: perfil } = await supabase.from('perfis').select('*').eq('id', session.user.id).maybeSingle();
        if (perfil) setMeuPerfil(perfil);
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  }

  function abrirEdicao(aviso) {
    setAvisoParaEditar(aviso);
    setTitulo(aviso.titulo);
    setMensagem(aviso.mensagem);
    setDataExpiracao(aviso.data_expiracao || '');
    setIsModalOpen(true);
  }

  function fecharModal() {
    setIsModalOpen(false);
    setAvisoParaEditar(null);
    setTitulo('');
    setMensagem('');
    setDataExpiracao('');
  }

  async function handleSalvarAviso(e) {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) return mostrarNotificacao('erro', 'Preencha os campos obrigatórios.');
    
    try {
      setLoading(true);
      const isEditando = !!avisoParaEditar;

      const payload = {
        titulo,
        mensagem,
        data_expiracao: dataExpiracao || null, // Salva a data ou nulo
        autor_id: session.user.id
      };

      let error;
      if (isEditando) {
        const res = await supabase.from('avisos').update(payload).eq('id', avisoParaEditar.id);
        error = res.error;
      } else {
        const res = await supabase.from('avisos').insert([payload]);
        error = res.error;
      }

      if (error) throw error;

      mostrarNotificacao('sucesso', isEditando ? 'Aviso atualizado!' : 'Aviso publicado!');
      fecharModal();
      fetchDados();
    } catch (error) {
      mostrarNotificacao('erro', 'Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function excluirAviso(id) {
    if (window.confirm('Tem certeza que deseja apagar este aviso?')) {
      const { error } = await supabase.from('avisos').delete().eq('id', id);
      if (!error) {
        mostrarNotificacao('sucesso', 'Aviso apagado.');
        fetchDados();
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {notificacao && (
        <div className="fixed top-5 right-5 z-[70] animate-fade-in">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white font-bold ${notificacao.tipo === 'sucesso' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notificacao.tipo === 'sucesso' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            {notificacao.texto}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quadro de Avisos</h2>
          <p className="text-sm text-slate-500">Avisos ativos no momento</p>
        </div>
        {meuPerfil?.is_admin && (
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg flex items-center gap-2 font-bold hover:bg-blue-700 transition">
            <Plus size={20} /> <span className="hidden md:inline">Novo Aviso</span>
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-center text-slate-500 py-10">Carregando mural...</p>
        ) : avisos.length === 0 ? (
          <div className="text-center bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
            <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Bell size={32} /></div>
            <p className="text-slate-500 font-medium">Nenhum aviso ativo.</p>
          </div>
        ) : (
          avisos.map((aviso) => (
            <div key={aviso.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500 rounded-l-[2rem]"></div>
              <div className="pl-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Megaphone size={18} className="text-blue-500" /> {aviso.titulo}
                  </h3>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full">
                      Postado: {new Date(aviso.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {aviso.data_expiracao && (
                      <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full flex items-center gap-1">
                        <Calendar size={10} /> Expira: {new Date(aviso.data_expiracao).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed mb-4">{aviso.mensagem}</p>
                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-50 pt-4">
                  {meuPerfil?.is_admin && (
                    <>
                      <button onClick={() => abrirEdicao(aviso)} className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition">
                        <Edit2 size={14} /> Editar
                      </button>
                      <button onClick={() => excluirAviso(aviso.id)} className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition">
                        <Trash2 size={14} /> Apagar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {avisoParaEditar ? 'Editar Aviso' : 'Publicar Aviso'}
              </h3>
              <button onClick={fecharModal} className="bg-slate-100 p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSalvarAviso} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Título do Comunicado</label>
                <input 
                  type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600" 
                  placeholder="Ex: Ensaio de Sábado" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Mensagem</label>
                <textarea 
                  value={mensagem} onChange={(e) => setMensagem(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 min-h-[120px] resize-none" 
                  placeholder="Escreva os detalhes..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Exibir até (Opcional)</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-4 text-slate-400" />
                  <input 
                    type="date" value={dataExpiracao} onChange={(e) => setDataExpiracao(e.target.value)} 
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 ml-1">O aviso sumirá automaticamente após esta data. Deixe vazio para fixar.</p>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg mt-2">
                {loading ? 'Salvando...' : avisoParaEditar ? 'Atualizar Aviso' : 'Publicar Aviso'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}