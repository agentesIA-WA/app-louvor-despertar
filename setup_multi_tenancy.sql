-- 0. EXTENSÕES E ESTRUTURA BASE
CREATE TABLE IF NOT EXISTS public.instituicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco_completo TEXT,
  telefone_contato TEXT,
  dirigente_principal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. ADIÇÃO DE COLUNAS DE TENANCY
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id);
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id);
ALTER TABLE public.equipes ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id);
ALTER TABLE public.escalas ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id);
ALTER TABLE public.repertorio ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id);

-- Ajuste de unicidade de equipe por instituição
ALTER TABLE public.equipes DROP CONSTRAINT IF EXISTS equipes_nome_key;
ALTER TABLE public.equipes ADD CONSTRAINT equipes_nome_instituicao_unique UNIQUE (nome, instituicao_id);

-- 2. TRIGGER DE CRIAÇÃO DE USUÁRIO COM ONBOARDING DE INSTITUIÇÃO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_inst_id UUID;
  meta_inst_id UUID;
  new_inst_name TEXT;
BEGIN
  meta_inst_id := (new.raw_user_meta_data->>'instituicao_id')::UUID;
  new_inst_name := new.raw_user_meta_data->>'nova_instituicao_nome';

  -- Se foi passado o nome de uma nova instituição, cria ela primeiro
  IF new_inst_name IS NOT NULL AND new_inst_name <> '' THEN
    INSERT INTO public.instituicoes (nome) VALUES (new_inst_name) RETURNING id INTO new_inst_id;
  ELSE
    new_inst_id := meta_inst_id;
  END IF;

  INSERT INTO public.perfis (
    id, 
    nome, 
    email_contato, 
    funcao, 
    telefone, 
    whatsapp, 
    aniversario_dia, 
    aniversario_mes, 
    instituicao_id,
    is_admin, 
    acesso_escalas, 
    acesso_repertorio, 
    acesso_avisos
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nome', ''), 
    new.email,
    COALESCE(new.raw_user_meta_data->>'funcao', ''),
    COALESCE(new.raw_user_meta_data->>'telefone', ''),
    COALESCE(new.raw_user_meta_data->>'whatsapp', ''),
    (new.raw_user_meta_data->>'aniversario_dia')::int,
    (new.raw_user_meta_data->>'aniversario_mes')::int,
    new_inst_id,
    (new_inst_name IS NOT NULL AND new_inst_name <> ''), -- Se criou instituição, é admin
    true, -- Se criou instituição, tem acessos base
    true, 
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO AUXILIAR PARA RLS (Performance)
CREATE OR REPLACE FUNCTION public.get_my_instituicao()
RETURNS UUID AS $$
  SELECT instituicao_id FROM public.perfis WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. RE-IMPLEMENTAÇÃO DE RLS (ISOLAMENTO TOTAL)

-- Função Admin Check (considerando instituição)
CREATE OR REPLACE FUNCTION public.admin_check()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- TABELA: PERFIS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perfis_select_policy" ON public.perfis;
CREATE POLICY "perfis_select_policy" ON public.perfis
FOR SELECT USING (instituicao_id = public.get_my_instituicao());

DROP POLICY IF EXISTS "perfis_update_policy" ON public.perfis;
CREATE POLICY "perfis_update_policy" ON public.perfis
FOR UPDATE USING (
  (auth.uid() = id AND instituicao_id = public.get_my_instituicao())
  OR 
  (public.admin_check() AND instituicao_id = public.get_my_instituicao())
);

-- TABELA: AVISOS
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "avisos_select_policy" ON public.avisos;
CREATE POLICY "avisos_select_policy" ON public.avisos
FOR SELECT USING (instituicao_id = public.get_my_instituicao());

DROP POLICY IF EXISTS "avisos_all_admin_policy" ON public.avisos;
CREATE POLICY "avisos_all_admin_policy" ON public.avisos
FOR ALL USING (public.admin_check() AND instituicao_id = public.get_my_instituicao());

-- TABELA: EQUIPES
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "equipes_select_policy" ON public.equipes;
CREATE POLICY "equipes_select_policy" ON public.equipes
FOR SELECT USING (instituicao_id = public.get_my_instituicao());

DROP POLICY IF EXISTS "equipes_all_admin_policy" ON public.equipes;
CREATE POLICY "equipes_all_admin_policy" ON public.equipes
FOR ALL USING (public.admin_check() AND instituicao_id = public.get_my_instituicao());

-- TABELA: ESCALAS
ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "escalas_select_policy" ON public.escalas;
CREATE POLICY "escalas_select_policy" ON public.escalas
FOR SELECT USING (instituicao_id = public.get_my_instituicao());

DROP POLICY IF EXISTS "escalas_all_admin_policy" ON public.escalas;
CREATE POLICY "escalas_all_admin_policy" ON public.escalas
FOR ALL USING (public.admin_check() AND instituicao_id = public.get_my_instituicao());

-- TABELA: REPERTORIO
ALTER TABLE public.repertorio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "repertorio_select_policy" ON public.repertorio;
CREATE POLICY "repertorio_select_policy" ON public.repertorio
FOR SELECT USING (instituicao_id = public.get_my_instituicao());

DROP POLICY IF EXISTS "repertorio_all_admin_policy" ON public.repertorio;
CREATE POLICY "repertorio_all_admin_policy" ON public.repertorio
FOR ALL USING (public.admin_check() AND instituicao_id = public.get_my_instituicao());

-- TABELA: INSTITUICOES (Segurança especial)
ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instituicoes_select_own" ON public.instituicoes
FOR SELECT USING (id = public.get_my_instituicao());

CREATE POLICY "instituicoes_update_own_admin" ON public.instituicoes
FOR UPDATE USING (id = public.get_my_instituicao() AND public.admin_check());
