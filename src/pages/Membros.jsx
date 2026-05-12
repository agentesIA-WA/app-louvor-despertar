import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, ShieldCheck, UserCircle, Edit2, X, CheckCircle, AlertCircle, Save, UserPlus, Phone, Mail } from 'lucide-react';

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function Membros({ session, perfil }) {
  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacao, setNotificacao] = useState(null);
  
  const [isModalNovoOpen, setIsModalNovoOpen] = useState(false);
  const [membroParaEditar, setMembroParaEditar] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '', whatsapp: '', email_contato: '', dia: '', mes: '', isAdmin: false, funcao: ''
  });

  useEffect(() => { 
    fetchDados(); 
  }, [session, perfil]);

  async function fetchDados() {
    setLoading(true);
    try {
      const { data: membros } = await supabase.from('perfis').select('*').order('nome');
      if (membros) setEquipe(membros);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
    setLoading(false);
  }

  function mostrarNotificacao(tipo, texto) {
    setNotificacao({ tipo, texto });
    setTimeout(() => setNotificacao(null), 3000);
  }

 async function handleSalvarMembro(e) {
  e.preventDefault();
  setLoading(true);

  try {
    const isEdicao = !!membroParaEditar;
    
    // REGRA DE OURO: Se é edição, usa o ID existente. 
    // Se é NOVO, gera um UUID agora para não ir nulo.
    const idParaSalvar = isEdicao ? membroParaEditar.id : crypto.randomUUID();
    
    const dadosOrigem = isEdicao ? membroParaEditar : formData;

    const payload = {
      id: idParaSalvar, // Nunca mais será nulo
      nome: dadosOrigem.nome,
      whatsapp: dadosOrigem.whatsapp,
      email_contato: dadosOrigem.email_contato,
      aniversario_dia: parseInt(isEdicao ? dadosOrigem.aniversario_dia : dadosOrigem.dia) || null,
      aniversario_mes: parseInt(isEdicao ? dadosOrigem.aniversario_mes : dadosOrigem.mes) || null,
      funcao: dadosOrigem.funcao,
      is_admin: isEdicao ? dadosOrigem.is_admin : dadosOrigem.isAdmin
    };

    const { error } = await supabase
      .from('perfis')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;

    mostrarNotificacao('sucesso', isEdicao ? 'Membro atualizado!' : 'Membro cadastrado!');
    setIsModalNovoOpen(false);
    setMembroParaEditar(null);
    setFormData({ nome: '', whatsapp: '', email_contato: '', dia: '', mes: '', isAdmin: false, funcao: '' });
    fetchDados();
  } catch (error) {
    console.error("Erro detalhado:", error);
    mostrarNotificacao('erro', 'Erro: ' + error.message);
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
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
          <h2 className="text-2xl font-bold text-slate-800">Equipe</h2>
          <p className="text-sm text-slate-500">Gestão de membros e acessos</p>
        </div>
        {perfil?.is_admin && (
          <button onClick={() => setIsModalNovoOpen(true)} className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg flex items-center gap-2 font-bold hover:bg-blue-700 transition">
            <UserPlus size={20} /> <span className="hidden md:inline">Novo Membro</span>
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {equipe.map(membro => (
          <div key={membro.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white ${membro.is_admin ? 'bg-slate-800' : 'bg-blue-500'}`}>
                {membro.nome?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  {membro.nome || 'Pendente'} {membro.is_admin && <ShieldCheck size={14} className="text-blue-600" />}
                </h4>
                <p className="text-xs text-slate-500">{membro.funcao || 'Membro'}</p>
              </div>
            </div>
            {perfil?.is_admin && (
              <button onClick={() => setMembroParaEditar(membro)} className="text-slate-400 hover:text-blue-600 p-2 transition">
                <Edit2 size={20} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* MODAL NOVO MEMBRO */}
      {isModalNovoOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Novo Cadastro</h3>
              <button onClick={() => setIsModalNovoOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSalvarMembro} className="space-y-4">
              <input required type="text" placeholder="Nome Completo" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="WhatsApp" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
                <input type="email" placeholder="E-mail" value={formData.email_contato} onChange={e => setFormData({...formData, email_contato: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
              </div>
              <div className="flex gap-3">
                <input type="number" placeholder="Dia" value={formData.dia} onChange={e => setFormData({...formData, dia: e.target.value})} className="w-24 p-4 bg-slate-50 border rounded-2xl outline-none" />
                <select value={formData.mes} onChange={e => setFormData({...formData, mes: e.target.value})} className="flex-1 p-4 bg-slate-50 border rounded-2xl outline-none">
                  <option value="">Mês de Aniversário</option>
                  {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <input type="text" placeholder="Função (Ex: Vocal)" value={formData.funcao} onChange={e => setFormData({...formData, funcao: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
              <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-sm text-blue-800">Administrador?</span>
                <button type="button" onClick={() => setFormData({...formData, isAdmin: !formData.isAdmin})} className={`w-12 h-6 rounded-full relative transition-colors ${formData.isAdmin ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isAdmin ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg disabled:opacity-50">
                {loading ? 'Salvando...' : 'Finalizar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {membroParaEditar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Editar Membro</h3>
              <button onClick={() => setMembroParaEditar(null)} className="bg-slate-100 p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSalvarMembro} className="space-y-4">
              <input required type="text" value={membroParaEditar.nome || ''} onChange={e => setMembroParaEditar({...membroParaEditar, nome: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="WhatsApp" value={membroParaEditar.whatsapp || ''} onChange={e => setMembroParaEditar({...membroParaEditar, whatsapp: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
                <input type="email" placeholder="E-mail" value={membroParaEditar.email_contato || ''} onChange={e => setMembroParaEditar({...membroParaEditar, email_contato: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
              </div>
              <div className="flex gap-3">
                <input type="number" value={membroParaEditar.aniversario_dia || ''} onChange={e => setMembroParaEditar({...membroParaEditar, aniversario_dia: e.target.value})} className="w-24 p-4 bg-slate-50 border rounded-2xl outline-none" />
                <select value={membroParaEditar.aniversario_mes || ''} onChange={e => setMembroParaEditar({...membroParaEditar, aniversario_mes: e.target.value})} className="flex-1 p-4 bg-slate-50 border rounded-2xl outline-none">
                  {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <input type="text" value={membroParaEditar.funcao || ''} onChange={e => setMembroParaEditar({...membroParaEditar, funcao: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
              <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-sm text-blue-800">Administrador?</span>
                <button type="button" onClick={() => setMembroParaEditar({...membroParaEditar, is_admin: !membroParaEditar.is_admin})} className={`w-12 h-6 rounded-full relative transition-colors ${membroParaEditar.is_admin ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${membroParaEditar.is_admin ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}