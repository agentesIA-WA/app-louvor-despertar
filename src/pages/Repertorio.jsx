import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Music, Trash2, X, PlaySquare, FileText, 
  CheckCircle, AlertCircle, Edit, Search,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao'; // Importe o modal

export default function Repertorio({ perfil }) {
  const [musicas, setMusicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busca, setBusca] = useState('');

  // Estados para Ordenação e Paginação
  const [sortConfig, setSortConfig] = useState({ key: 'titulo', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const isAdmin = perfil?.is_admin === true;
  
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
      const payload = {
        titulo,
        artista,
        tom,
        bpm: bpm ? parseInt(bpm) : null,
        link_youtube: linkYoutube,
        link_cifra: linkCifra,
      };
      console.log('Atualizando repertório', { editingId, payload });
      const { data, error } = await supabase.from('repertorio').update(payload).eq('id', editingId).select();
      console.log('Resposta update repertorio', { data, error });

      // Se a atualização não retornou erro mas também não retornou linhas, tratar como falha (p.ex. RLS ou mismatch de id)
      if (!error && data && data.length > 0) {
        console.log('Update bem-sucedido, rows retornadas:', data);
        setTitulo(''); setArtista(''); setTom(''); setBpm(''); setLinkYoutube(''); setLinkCifra('');
        setIsModalOpen(false);
        setEditingId(null);
        mostrarNotificacao('sucesso', 'Música atualizada!');
        fetchMusicas();
      } else {
        console.error('Falha ao atualizar repertório — nenhuma linha afetada ou erro:', error, data);
        // Mensagem mais útil ao usuário
        const detalhe = error?.message || (data && data.length === 0 ? 'nenhuma linha afetada. Verifique permissões (RLS) ou se o registro ainda existe.' : 'tente novamente');
        mostrarNotificacao('erro', `Erro ao atualizar música: ${detalhe}`);
      }
    } else {
      const payload = [{ 
        titulo, artista, tom, bpm: bpm ? parseInt(bpm) : null, link_youtube: linkYoutube, link_cifra: linkCifra 
      }];
      const { data, error } = await supabase.from('repertorio').insert(payload).select();

      if (!error) {
        setTitulo(''); setArtista(''); setTom(''); setBpm(''); setLinkYoutube(''); setLinkCifra('');
        setIsModalOpen(false);
        mostrarNotificacao('sucesso', 'Música adicionada ao repertório!');
        fetchMusicas(); 
      } else {
        console.error('Erro inserindo repertorio:', error);
        mostrarNotificacao('erro', `Erro ao salvar música: ${error.message || 'tente novamente'}`);
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

  // Função para mudar a ordenação
  function requestSort(key) {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  // Lógica de filtragem, ordenação e paginação
  const musicasFiltradas = musicas
    .filter(musica => 
      musica.titulo.toLowerCase().includes(busca.toLowerCase()) || 
      (musica.artista && musica.artista.toLowerCase().includes(busca.toLowerCase()))
    )
    .sort((a, b) => {
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';
      
      if (typeof valA === 'string') {
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
    });

  const totalPages = Math.ceil(musicasFiltradas.length / itemsPerPage);
  const musicasPaginadas = musicasFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Resetar página ao buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [busca]);

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Repertório</h2>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por título ou artista..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          {isAdmin && (
            <button onClick={openAddModal} className="bg-blue-600 text-white p-3 rounded-2xl shadow-md hover:bg-blue-700 transition flex items-center gap-2 font-bold text-sm">
              <Plus size={20} /> <span className="hidden md:inline">Nova Música</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de Músicas em Tabela */}
      {loading ? (
        <p className="text-center text-slate-500 py-10">Carregando canções...</p>
      ) : musicas.length === 0 ? (
        <div className="text-center bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
          <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Music size={32} /></div>
          <p className="text-slate-500">Nenhuma música cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th onClick={() => requestSort('titulo')} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">Título <SortIcon column="titulo" /></div>
                  </th>
                  <th onClick={() => requestSort('artista')} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">Artista <SortIcon column="artista" /></div>
                  </th>
                  <th onClick={() => requestSort('tom')} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">Tom <SortIcon column="tom" /></div>
                  </th>
                  <th onClick={() => requestSort('bpm')} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:bg-slate-100 transition-colors text-center">
                    <div className="flex items-center justify-center gap-2">BPM <SortIcon column="bpm" /></div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Links</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {musicasPaginadas.map((musica) => (
                  <tr key={musica.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-xl group-hover:bg-white transition-colors">
                          <Music size={16} />
                        </div>
                        <span className="font-bold text-slate-700">{musica.titulo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{musica.artista || '-'}</td>
                    <td className="px-6 py-4">
                      {musica.tom ? (
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1 rounded-lg">
                          {musica.tom}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {musica.bpm ? (
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-lg">
                          {musica.bpm}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {musica.link_cifra && (
                          <a href={musica.link_cifra} target="_blank" rel="noopener noreferrer" className="bg-slate-50 text-slate-400 hover:text-orange-500 p-2 rounded-xl transition-all">
                            <FileText size={18} />
                          </a>
                        )}
                        {musica.link_youtube && (
                          <a href={musica.link_youtube} target="_blank" rel="noopener noreferrer" className="bg-slate-50 text-slate-400 hover:text-red-500 p-2 rounded-xl transition-all">
                            <PlaySquare size={18} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && (
                          <>
                            <button onClick={() => openEditModal(musica)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => confirmarExclusao(musica.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
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