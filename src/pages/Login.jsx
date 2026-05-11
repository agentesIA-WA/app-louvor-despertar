import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Music } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  // Registration fields
  const [nome, setNome] = useState('');
  const [funcao, setFuncao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [aniversario_dia, setAniversarioDia] = useState('');
  const [aniversario_mes, setAniversarioMes] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [data_nascimento, setDataNascimento] = useState('');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const submittingRef = useRef(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const handleAuth = async (e) => {
    e.preventDefault();

    // Cooldown/lock checks
    if (Date.now() < cooldownUntil) {
      const secs = Math.ceil((cooldownUntil - Date.now()) / 1000);
      setErro(`Muitas requisições. Tente novamente em ${secs} segundos.`);
      return;
    }
    if (submittingRef.current) return; // já enviando

    submittingRef.current = true;
    setLoading(true);
    setErro(null);
    setMensagem(null);

    if (isLogin) {
      // Fazendo Login
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setErro('Credenciais inválidas. Tente novamente.');
    } else {
      // Criando nova conta
      // Validação cliente para evitar mensagens genéricas
      if (!senha || senha.length < 6) {
        setErro('Erro ao criar conta. A senha deve ter no mínimo 6 caracteres.');
        setLoading(false);
        return;
      }

      // valida nome
      if (!nome || nome.trim().length < 2) {
        setErro('Informe seu nome completo.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({ email, password: senha });
        console.log('signUp response', { data, error });

        if (error) {
          // Tratamento específico para 429 (rate limit)
          if (error.status === 429) {
            const cooldownMs = 60 * 1000; // 60s
            setCooldownUntil(Date.now() + cooldownMs);
            setErro('Muitas requisições. Tente novamente em alguns segundos.');
          } else {
            setErro(error.message || 'Erro ao criar conta. Tente novamente.');
          }
        } else {
          // Insere perfil na tabela 'perfis' com os dados do formulário
          try {
            const user = data?.user;
            if (user) {
              // Derivar dia/mês de data_nascimento se informado
              let dia = aniversario_dia || null;
              let mes = aniversario_mes || null;
              if (data_nascimento) {
                const d = new Date(data_nascimento + 'T00:00:00');
                if (!isNaN(d)) {
                  dia = String(d.getUTCDate());
                  mes = String(d.getUTCMonth() + 1);
                }
              }

              const perfilPayload = {
                id: user.id,
                nome: nome || '',
                funcao: funcao || '',
                telefone: telefone || null,
                is_admin: false,
                aniversario_dia: dia ? parseInt(dia) : null,
                aniversario_mes: mes ? parseInt(mes) : null,
                whatsapp: whatsapp || null,
                email_contato: email || null,
                data_nascimento: data_nascimento || null,
                acesso_escalas: false,
                acesso_repertorio: false,
                acesso_avisos: false
              };

              const { error: perfilError } = await supabase.from('perfis').insert([perfilPayload]);
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
      } catch (err) {
        console.error('Erro no signUp:', err);
        setErro('Erro ao criar conta. Tente novamente mais tarde.');
      }
    }
    
    // liberar lock
    submittingRef.current = false;
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

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nome completo</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="Seu nome" required />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Função (ex: Vocal, Violão)</label>
                <input type="text" value={funcao} onChange={e => setFuncao(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="Funções separadas por vírgula" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Telefone</label>
                  <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="(DDD) 9XXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp</label>
                  <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="WhatsApp" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Dia de nascimento</label>
                  <input type="number" min="1" max="31" value={aniversario_dia} onChange={e => setAniversarioDia(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Mês de nascimento</label>
                  <input type="number" min="1" max="12" value={aniversario_mes} onChange={e => setAniversarioMes(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Data de Nascimento</label>
                  <input type="date" value={data_nascimento} onChange={e => setDataNascimento(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                </div>
              </div>
            </>
          )}

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