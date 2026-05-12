-- Adicionar equipe_id à tabela de escalas se ainda não existir
ALTER TABLE public.escalas 
ADD COLUMN IF NOT EXISTS equipe_id uuid REFERENCES public.equipes(id) ON DELETE SET NULL;

-- Atualizar RLS se necessário (geralmente não precisa se for apenas uma nova coluna e as policies usarem select *)
