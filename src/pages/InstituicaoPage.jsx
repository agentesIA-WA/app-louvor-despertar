import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Building, User, Phone, MapPin } from 'lucide-react';

export default function InstituicaoPage() {
  const [profile, setProfile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [enderecoCompleto, setEnderecoCompleto] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [dirigentePrincipal, setDirigentePrincipal] = useState('');

  const fetchProfileAndInstituicao = useCallback(async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('perfis')
      .select('id, is_admin, instituicao_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      setError("Não foi possível carregar o perfil do usuário.");
      setLoading(false);
      return;
    }
    
    setProfile(profileData);

    if (!profileData.is_admin) {
      setError("Acesso negado. Esta página é apenas para administradores.");
      setLoading(false);
      return;
    }

    if (profileData.instituicao_id) {
      const { data: instituicaoData, error: instituicaoError } = await supabase
        .from('instituicoes')
        .select('*')
        .eq('id', profileData.instituicao_id)
        .single();

      if (instituicaoError) {
        setError('Não foi possível carregar os dados da instituição. Verifique as permissões (RLS).');
      } else if (instituicaoData) {
        setNome(instituicaoData.nome || '');
        setEnderecoCompleto(instituicaoData.endereco_completo || '');
        setTelefoneContato(instituicaoData.telefone_contato || '');
        setDirigentePrincipal(instituicaoData.dirigente_principal || '');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfileAndInstituicao();
  }, [fetchProfileAndInstituicao]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile || !profile.is_admin) {
      setError('Ação não permitida.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    const { error: updateError } = await supabase
      .from('instituicoes')
      .update({
        nome: nome,
        endereco_completo: enderecoCompleto,
        telefone_contato: telefoneContato,
        dirigente_principal: dirigentePrincipal,
      })
      .eq('id', profile.instituicao_id);

    if (updateError) {
      setError('Erro ao salvar as alterações. Verifique suas permissões e tente novamente.');
      console.error(updateError);
    } else {
      setMessage('Dados da instituição atualizados com sucesso!');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 text-center font-medium text-slate-600">Carregando dados do administrador...</div>;
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-2xl m-8 text-sm text-center font-bold">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-100/50 w-full max-w-2xl mx-auto border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200">
            <Building size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestão da Instituição</h1>
            <p className="text-slate-500 font-medium">Edite os dados da sua igreja ou ministério.</p>
          </div>
        </div>

        {message && <div className="bg-green-50 text-green-600 p-4 rounded-2xl mb-4 text-sm text-center font-bold">{message}</div>}
        
        <form onSubmit={handleSave} className="space-y-5">
          <InputField label="Nome da Instituição" value={nome} onChange={setNome} placeholder="Nome da sua igreja" Icon={Building} required />
          <InputField label="Endereço Completo com CEP" value={enderecoCompleto} onChange={setEnderecoCompleto} placeholder="Rua, Número, Bairro, Cidade - Estado, CEP" Icon={MapPin} />
          <InputField label="Telefone de Contato" value={telefoneContato} onChange={setTelefoneContato} placeholder="(DDD) 9XXXX-XXXX" Icon={Phone} type="tel" />
          <InputField label="Nome do Dirigente Principal" value={dirigentePrincipal} onChange={setDirigentePrincipal} placeholder="Nome do pastor ou líder responsável" Icon={User} />

          <button type="submit" disabled={saving || loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-100 mt-4">
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}

const InputField = ({ label, value, onChange, placeholder, Icon, type = 'text', required = false }) => (
  <div>
    <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition" placeholder={placeholder} required={required} />
    </div>
  </div>
);