import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Music } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setMensagem(null);

    if (isLogin) {
      // Fazendo Login
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setErro('Credenciais inválidas. Tente novamente.');
    } else {
      // Criando nova conta
      const { data, error } = await supabase.auth.signUp({ email, password: senha });
      if (error) {
        setErro('Erro ao criar conta. A senha deve ter no mínimo 6 caracteres.');
      } else {
        // Insere perfil inicial na tabela 'perfis' para que o administrador conceda permissões
        try {
          const user = data?.user;
          if (user) {
            const { error: perfilError } = await supabase.from('perfis').insert([{ 
              id: user.id,
              nome: '',
              is_admin: false,
              acesso_escalas: false,
              acesso_repertorio: false,
              acesso_avisos: false
            }]);
            if (perfilError) console.error('Erro criando perfil inicial:', perfilError);

            // Cria um aviso administrativo para notificar administradores sobre novo cadastro
            try {
              const adminTitle = `ADMIN: Novo usuário cadastrado - ${email}`;
              const adminMessage = `Um novo usuário se registrou com o e-mail ${email} (id: ${user.id}). Conceda acessos no painel de Perfis.`;
              const { error: avisoError } = await supabase.from('avisos').insert([{ titulo: adminTitle, mensagem: adminMessage, autor_id: user.id }]);
              if (avisoError) console.error('Erro criando aviso admin:', avisoError);
            } catch (errAviso) {
              console.error('Erro ao criar aviso de admin:', errAviso);
            }
          }
        } catch (err) {
          console.error('Erro ao criar perfil inicial:', err);
        }

        setMensagem('Conta criada com sucesso! Aguarde a aprovação do administrador para obter acesso.');
        setIsLogin(true);
        setSenha('');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-100/50 w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200">
            <Music size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Despertar Louvor</h2>
        <p className="text-center text-slate-500 mb-8 font-medium">
          {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta para acessar o app'}
        </p>
        
        {erro && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-4 text-sm text-center font-bold">{erro}</div>}
        {mensagem && <div className="bg-green-50 text-green-600 p-4 rounded-2xl mb-4 text-sm text-center font-bold">{mensagem}</div>}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              placeholder="seu@email.com" required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
            <input 
              type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              placeholder="Mínimo 6 caracteres" required minLength={6}
            />
          </div>
          
          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-100"
          >
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setErro(null); setMensagem(null); }}
            className="text-slate-500 text-sm font-semibold hover:text-blue-600 transition"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  );
}