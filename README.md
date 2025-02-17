# School Timeline

Uma timeline de fotos escolar moderna e interativa, desenvolvida com tecnologias web de ponta para compartilhamento de memórias.

## 🚀 Tecnologias

- Frontend: React + TypeScript
- Backend: Express
- Banco de Dados: PostgreSQL
- Autenticação: Passport.js
- Upload de Fotos: Multer
- Estilização: Tailwind CSS + shadcn/ui

## 📋 Funcionalidades

- ✅ Autenticação de usuários (registro/login)
- 📸 Upload de fotos com descrição
- ❤️ Sistema de curtidas
- 🗑️ Exclusão de fotos próprias
- 📱 Design responsivo

## 🛠️ Instalação

```bash
# Clone o repositório
git clone https://github.com/Sana201p/TugasNijas.git

# Entre no diretório
cd TugasNijas

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env com as seguintes variáveis:
DATABASE_URL=sua_url_do_postgres
SESSION_SECRET=seu_segredo_de_sessao

# Execute o projeto em desenvolvimento
npm run dev
```

## 🔧 Variáveis de Ambiente

- `DATABASE_URL`: URL de conexão com o banco PostgreSQL
- `SESSION_SECRET`: Chave secreta para as sessões de usuário

## 📁 Estrutura do Projeto

```
├── client/             # Código do frontend
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── hooks/     # Hooks personalizados
│   │   ├── lib/       # Utilitários
│   │   └── pages/     # Páginas da aplicação
├── server/            # Código do backend
│   ├── routes.ts     # Rotas da API
│   ├── storage.ts    # Camada de dados
│   └── auth.ts       # Configuração de autenticação
└── shared/           # Código compartilhado
    └── schema.ts     # Esquema do banco de dados
```

## 🤝 Contribuindo

Sinta-se à vontade para contribuir com o projeto. Abra uma issue ou envie um pull request!

## 📝 Licença

Este projeto está sob a licença MIT.
