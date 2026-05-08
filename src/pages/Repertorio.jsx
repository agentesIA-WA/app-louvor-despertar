import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Music, Trash2, X, PlaySquare, FileText, CheckCircle, AlertCircle, Edit } from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao'; // Importe o modal

export default function Repertorio() {
  const [musicas, setMusicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Estado para o Modal de Exclusão
  const [modalExclusao, setModalExclusao] = useState({ isOpen: false, id: null });
  
  // Estado para as Notificações (Toast)
  const [notificacao, setNotificacao] = useState(null);

  // Estados do formulário
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [tom, setTom] = useState('');
  const [bpm, setBpm] = useState(''); // BPM da música
  const [linkYoutube, setLinkYoutube] = useState('');
  const [linkCifra, setLinkCifra] = useState('');

  // Função para exibir mensagem temporária (Toast)
  function mostrarNotificacao(tipo, texto) {
    setNotificacao({ tipo, texto });
    setTimeout(() => setNotificacao(null), 3000); // Some após 3 segundos
  }

  useEffect(() => {
    fetchMusicas();
  }, []);

  async function fetchMusicas() {
    setLoading(true);
    const { data, error } = await supabase.from('repertorio').select('*').order('titulo', { ascending: true });
    if (!error && data) setMusicas(data);
    setLoading(false);
  }

  async function handleSaveMusica(e) {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('repertorio').update({
        titulo, artista, tom, bpm: bpm ? parseInt(bpm) : null, link_youtube: linkYoutube, link_cifra: linkCifra
      }).eq('id', editingId);

      if (!error) {
        setTitulo(''); setArtista(''); setTom(''); setBpm(''); setLinkYoutube(''); setLinkCifra('');
        setIsModalOpen(false);
        setEditingId(null);
        mostrarNotificacao('sucesso', 'Música atualizada!');
        fetchMusicas();
      } else {
        mostrarNotificacao('erro', 'Erro ao atualizar música. Tente novamente.');
      }
    } else {
      const { error } = await supabase.from('repertorio').insert([{ 
        titulo, artista, tom, bpm: bpm ? parseInt(bpm) : null, link_youtube: linkYoutube, link_cifra: linkCifra 
      }]);

      if (!error) {
        setTitulo(''); setArtista(''); setTom(''); setBpm(''); setLinkYoutube(''); setLinkCifra('');
        setIsModalOpen(false);
        mostrarNotificacao('sucesso', 'Música adicionada ao repertório!');
        fetchMusicas(); 
      } else {
        mostrarNotificacao('erro', 'Erro ao salvar música. Tente novamente.');
      }
    }
  }

  // 1. Abre o modal em vez de usar window.confirm
  function confirmarExclusao(id) {
    setModalExclusao({ isOpen: true, id });
  }

  // 2. Executa a exclusão de fato
  async function executarExclusao() {
    const { error } = await supabase.from('repertorio').delete().eq('id', modalExclusao.id);
    if (!error) {
      mostrarNotificacao('sucesso', 'Música removida.');
      fetchMusicas();
    }
    setModalExclusao({ isOpen: false, id: null }); // Fecha o modal
  }

  // Abrir modal para adicionar nova música (limpa campos)
  function openAddModal() {
    setTitulo(''); setArtista(''); setTom(''); setBpm(''); setLinkYoutube(''); setLinkCifra(''); setEditingId(null); setIsModalOpen(true);
  }

  // Abrir modal para editar música existente
  function openEditModal(musica) {
    setTitulo(musica.titulo || '');
    setArtista(musica.artista || '');
    setTom(musica.tom || '');
    setBpm(musica.bpm != null ? String(musica.bpm) : '');
    setLinkYoutube(musica.link_youtube || '');
    setLinkCifra(musica.link_cifra || '');
    setEditingId(musica.id);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setTitulo(''); setArtista(''); setTom(''); setBpm(''); setLinkYoutube(''); setLinkCifra('');
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Sistema de Notificação (Toast) Flutuante */}
      {notificacao && (
        <div className="fixed top-5 right-5 z-[70] animate-fade-in">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white font-bold ${notificacao.tipo === 'sucesso' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notificacao.tipo === 'sucesso' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            {notificacao.texto}
          </div>
        </div>
      )}

      {/* Componente Modal de Confirmação */}
      <ModalConfirmacao 
        isOpen={modalExclusao.isOpen}
        titulo="Remover Música"
        mensagem="Tem certeza que deseja remover esta música do repertório? Esta ação não pode ser desfeita."
        onConfirm={executarExclusao}
        onCancel={() => setModalExclusao({ isOpen: false, id: null })}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Repertório</h2>
        <button onClick={openAddModal} className="bg-blue-600 text-white p-3 rounded-2xl shadow-md hover:bg-blue-700 transition flex items-center gap-2 font-bold text-sm">
          <Plus size={20} /> <span className="hidden md:inline">Nova Música</span>
        </button>
      </div>

      {/* Lista de Músicas (Apenas substitua a chamada do botão delete) */}
      {loading ? (
        <p className="text-center text-slate-500 py-10">Carregando canções...</p>
      ) : musicas.length === 0 ? (
        <div className="text-center bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
          <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Music size={32} /></div>
          <p className="text-slate-500">Nenhuma música cadastrada ainda.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {musicas.map((musica) => (
            <div key={musica.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4 truncate">
                <div className="bg-slate-50 p-3 rounded-2xl text-blue-600 shrink-0"><Music size={20} /></div>
                <div className="truncate">
                  <h4 className="font-bold text-slate-800 truncate">{musica.titulo}</h4>
                  <p className="text-xs text-slate-500 truncate">{musica.artista}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {musica.tom && <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl mr-2">{musica.tom}</span>}
                {musica.bpm != null && <span className="bg-emerald-50 text-emerald-500 text-xs font-bold px-3 py-1.5 rounded-xl mr-2">{musica.bpm} BPM</span>}
                {musica.link_cifra && <a href={musica.link_cifra} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-orange-500 transition p-1"><FileText size={20} /></a>}
                {musica.link_youtube && <a href={musica.link_youtube} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-500 transition p-1"><PlaySquare size={20} /></a>}
                
                <button onClick={() => openEditModal(musica)} className="text-slate-300 hover:text-slate-500 transition p-1 ml-1">
                  <Edit size={18} />
                </button>
                {/* Aqui substituímos a chamada antiga pela nova função confirmarExclusao */}
                <button onClick={() => confirmarExclusao(musica.id)} className="text-slate-300 hover:text-red-500 transition p-1 ml-1">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* O Modal de Nova Música continua igual ao código anterior... */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* ... resto do seu formulário modal de cadastro ... */}
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Música' : 'Adicionar Música'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveMusica} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título da Música *</label>
                  <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ex: Lindo És"/>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Artista</label>
                    <input type="text" value={artista} onChange={(e) => setArtista(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ex: Livres"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tom Principal</label>
                    <input type="text" value={tom} onChange={(e) => setTom(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none uppercase" placeholder="Ex: G, Am" maxLength={5}/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">BPM</label>
                    <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ex: 120" min={1}/>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <FileText size={16} /> Link da Cifra
                  </label>
                  <input type="url" value={linkCifra} onChange={(e) => setLinkCifra(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="https://www.cifraclub.com.br/..."/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <PlaySquare size={16} /> Link do YouTube
                  </label>
                  <input type="url" value={linkYoutube} onChange={(e) => setLinkYoutube(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="https://youtube.com/watch?v=..."/>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition mt-4">
                  Salvar no Repertório
                </button>
              </form>
            </div>
         </div>
      )}
    </div>
  );
}