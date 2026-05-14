# 02. Arquitetura

## Stack Tecnológica

### Frontend
- **React 19**: Biblioteca principal para interface.
- **Vite**: Build tool e servidor de desenvolvimento.
- **Tailwind CSS 4**: Framework de estilização utilitário.
- **React Router DOM 7**: Gerenciamento de rotas.
- **Lucide React**: Biblioteca de ícones.
- **Date-fns**: Manipulação de datas.

### Backend & Infrastructure
- **Supabase**: Backend-as-a-Service (BaaS).
    - **PostgreSQL**: Banco de dados relacional.
    - **Supabase Auth**: Gestão de usuários e sessões.
    - **Row Level Security (RLS)**: Segurança a nível de linha no banco de dados.

## Estrutura de Pastas
```text
/
├── public/           # Ativos estáticos públicos
├── src/
│   ├── assets/       # Imagens e vetores
│   ├── components/   # Componentes reutilizáveis (Layout, Modais)
│   ├── lib/          # Configurações de bibliotecas (supabase.js)
│   ├── pages/        # Componentes de página (rotas principais)
│   ├── App.jsx       # Componente raiz e definição de rotas
│   └── main.jsx      # Ponto de entrada da aplicação
├── spec/             # Documentos de especificação auxiliares
└── speckit/          # Este kit de especificações
```
