-- 1. Função que será disparada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email_contato, is_admin, acesso_escalas, acesso_repertorio, acesso_avisos)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nome', ''), 
    new.email, 
    false, 
    false, 
    false, 
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger que executa a função sempre que um novo usuário for criado no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Correção de RLS para permitir que o trigger (que roda como SECURITY DEFINER) funcione
-- e que o usuário consiga atualizar seus próprios dados depois.
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis são visíveis por todos os autenticados" ON public.perfis
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar o próprio perfil" ON public.perfis
  FOR UPDATE USING (auth.uid() = id);

-- NOTA: Como o trigger agora cuida do INSERT, não precisamos de política de INSERT 
-- para usuários comuns, o que aumenta a segurança.
