-- 1. Tabela de Equipes
CREATE TABLE IF NOT EXISTS public.equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Tabela de Relacionamento Perfil <-> Equipes (Muitos-para-Muitos)
CREATE TABLE IF NOT EXISTS public.perfil_equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid REFERENCES public.perfis(id) ON DELETE CASCADE,
  equipe_id uuid REFERENCES public.equipes(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(perfil_id, equipe_id)
);

-- 3. Habilitar RLS
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_equipes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para Equipes
CREATE POLICY "equipes_select_policy" ON public.equipes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "equipes_admin_all_policy" ON public.equipes
FOR ALL TO authenticated
USING (public.admin_check() = true)
WITH CHECK (public.admin_check() = true);

-- 5. Políticas para Perfil Equipes
CREATE POLICY "perfil_equipes_select_policy" ON public.perfil_equipes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "perfil_equipes_admin_all_policy" ON public.perfil_equipes
FOR ALL TO authenticated
USING (public.admin_check() = true)
WITH CHECK (public.admin_check() = true);

-- 6. Inserir algumas equipes padrão
INSERT INTO public.equipes (nome) VALUES ('Ministério de Louvor'), ('Mídia'), ('Sonoplastia'), ('Intercessão')
ON CONFLICT (nome) DO NOTHING;
