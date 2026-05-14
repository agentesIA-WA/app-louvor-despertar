import { useState } from 'react';
import { Mail, Building, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SolicitarCadastro() {
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    igreja: '',
    mensagem: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Como não temos um backend de e-mail configurado, 
    // vamos usar o mailto para abrir o cliente de e-mail do usuário
    // com os dados pré-preenchidos.
    const subject = encodeURIComponent(`Solicitação de Cadastro: ${formData.igreja}`);
    const body = encodeURIComponent(
      `Olá Wesley,\n\nGostaria de solicitar a liberação do cadastro para a minha instituição no app Despertar Louvor.\n\n` +
      `Nome: ${formData.nome}\n` +
      `E-mail: ${formData.email}\n` +
      `Igreja/Ministério: ${formData.igreja}\n` +
      `Mensagem adicional: ${formData.mensagem}\n\n` +
      `Aguardo o link para cadastro.`
    );

    window.location.href = `mailto:wesley.alves.costa@gmail.com?subject=${subject}&body=${body}`;
    
    // Simulamos o sucesso após o redirecionamento
    setTimeout(() => {
      setEnviado(true);
      setLoading(false);
    }, 1000);
  };

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center max-w-md border border-slate-100">
          <div className="bg-green-100 text-green-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">Solicitação Iniciada!</h2>
          <p className="text-slate-500 font-medium mb-8">
            Seu cliente de e-mail foi aberto com os dados da solicitação. Certifique-se de enviar o e-mail para <strong>wesley.alves.costa@gmail.com</strong>.
          </p>
          <p className="text-slate-400 text-sm mb-8">
            Após a confirmação, você receberá um link exclusivo por e-mail para concluir o cadastro da sua instituição.
          </p>
          <Link to="/" className="block w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition">
            Voltar para o Login
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
            <Mail size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Solicitar Cadastro</h1>
            <p className="text-slate-500 font-medium">Peça liberação para sua igreja ou ministério.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Seu Nome</label>
              <input 
                required type="text" placeholder="Nome completo" 
                value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Seu E-mail</label>
              <input 
                required type="email" placeholder="email@exemplo.com" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Nome da Igreja / Ministério</label>
              <Building className="absolute left-4 top-[3.25rem] text-slate-400" size={20} />
              <input 
                required type="text" placeholder="Ex: Igreja Batista Central" 
                value={formData.igreja} onChange={e => setFormData({...formData, igreja: e.target.value})}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Mensagem (Opcional)</label>
              <textarea 
                placeholder="Conte-nos um pouco sobre sua necessidade..." 
                value={formData.mensagem} onChange={e => setFormData({...formData, mensagem: e.target.value})}
                rows="3"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition resize-none"
              ></textarea>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? 'Preparando...' : (
              <>
                <Send size={20} />
                Enviar Solicitação via E-mail
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm font-medium">
          Sua solicitação será revisada manualmente para garantir a segurança da plataforma.
        </p>
      </div>
    </div>
  );
}
