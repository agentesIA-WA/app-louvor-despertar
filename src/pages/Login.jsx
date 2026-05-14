import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Music } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  
  const [instituicoes, setInstituicoes] = useState([]);
  const [instituicaoId, setInstituicaoId] = useState('');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const submittingRef = useRef(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  // Buscar a lista de instituições ao carregar o componente
  useEffect(() => {
    async function fetchInstituicoes() {
      // Alterado para usar a função RPC segura, que retorna apenas ID e Nome.
      const { data, error } = await supabase.rpc('get_instituicoes_publicas');
      if (error) {
        console.error('Erro ao buscar instituições:', error);
      }
      if (data) setInstituicoes(data);
    }
    fetchInstituicoes();
  }, []);

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

      // Valida se a instituição foi selecionada
      if (!instituicaoId) {
        setErro('Selecione uma instituição / igreja.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password: senha,
          options: {
            data: {
              nome: nome,
              funcao: funcao || '',
              telefone: telefone || '',
              aniversario_dia: aniversario_dia ? parseInt(aniversario_dia) : null,
              aniversario_mes: aniversario_mes ? parseInt(aniversario_mes) : null,
              whatsapp: whatsapp || '',
              email_contato: email,
              instituicao_id: instituicaoId
            }
          }
        });
        console.log('signUp response', { data, error });

        if (error) {
          // ... (mantém lógica de erro/cooldown)
          if (error.status === 429) {
            const cooldownMs = 60 * 1000; // 60s
            setCooldownUntil(Date.now() + cooldownMs);
            setErro('Muitas requisições. Tente novamente em alguns segundos.');
          } else {
            setErro(error.message || 'Erro ao criar conta. Tente novamente.');
          }
        } else {
          // O perfil agora é criado automaticamente pelo TRIGGER no banco,
          // usando os dados que passamos no metadata acima.
          
          setMensagem('Conta criada com sucesso! Aguarde a aprovação do administrador para obter acesso.');

          if (!erro) {
            setIsLogin(true);
            setSenha('');
          }
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
            <label className="block text-sm font-bold text-slate-700 mb-2">Instituição / Igreja</label>
            <select 
              value={instituicaoId} 
              onChange={e => setInstituicaoId(e.target.value)} 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" required
            >
              <option value="">Selecione sua instituição...</option>
              {instituicoes.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.nome}</option>
              ))}
            </select>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Dia de nascimento</label>
                  <input type="number" min="1" max="31" value={aniversario_dia} onChange={e => setAniversarioDia(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Mês de nascimento</label>
                  <input type="number" min="1" max="12" value={aniversario_mes} onChange={e => setAniversarioMes(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
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

        <div className="mt-8 text-center space-y-4">
          <button 
            onClick={() => { setIsLogin(!isLogin); setErro(null); setMensagem(null); }}
            className="text-slate-500 text-sm font-semibold hover:text-blue-600 transition block w-full"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Fazer Login'}
          </button>
          
          {isLogin && (
            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Líder ou Pastor?</p>
              <Link 
                to="/solicitar-cadastro"
                className="text-blue-600 text-sm font-black hover:underline"
              >
                Solicite o acesso para sua Igreja aqui →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}