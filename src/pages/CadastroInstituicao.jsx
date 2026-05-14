import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building, Music, User, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function CadastroInstituicao() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const [formData, setFormData] = useState({
    igrejaNome: '',
    adminNome: '',
    email: '',
    senha: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    if (formData.senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            nome: formData.adminNome,
            nova_instituicao_nome: formData.igrejaNome,
            is_admin: true
          }
        }
      });

      if (error) throw error;

      setSucesso(true);
    } catch (err) {
      console.error("Erro no cadastro:", err);
      setErro(err.message || "Ocorreu um erro ao realizar o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center max-w-md border border-slate-100">
          <div className="bg-green-100 text-green-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">Igreja Cadastrada!</h2>
          <p className="text-slate-500 font-medium mb-8">
            Sua conta de administrador e sua instituição foram criadas com sucesso. Agora você pode fazer login e começar a organizar seu ministério.
          </p>
          <Link to="/" className="block w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition">
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl shadow-blue-100/50 w-full max-w-xl border border-slate-100">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm mb-8 transition-colors">
          <ArrowLeft size={18} /> Voltar
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200">
            <Building size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Cadastrar Nova Igreja</h1>
            <p className="text-slate-500 font-medium">Crie um ambiente isolado para o seu ministério.</p>
          </div>
        </div>

        {erro && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm text-center font-bold">{erro}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Dados da Instituição</h3>
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                required type="text" placeholder="Nome da Igreja / Ministério" 
                value={formData.igrejaNome} onChange={e => setFormData({...formData, igrejaNome: e.target.value})}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Dados do Administrador</h3>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                required type="text" placeholder="Seu Nome Completo" 
                value={formData.adminNome} onChange={e => setFormData({...formData, adminNome: e.target.value})}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                required type="email" placeholder="E-mail de Acesso" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                required type="password" placeholder="Sua Senha (mín. 6 caracteres)" 
                value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Criar Igreja e Minha Conta'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm font-medium">
          Ao cadastrar, você concorda que esta instituição terá seus dados totalmente isolados de outras organizações no sistema.
        </p>
      </div>
    </div>
  );
}