# Guia de Deploy - Styllus App

## Ambientes

### 1. Desenvolvimento (Development)
- **Branch**: `develop`
- **URL Local**: http://localhost:3000
- **Supabase**: Projeto de desenvolvimento
- **Deploy**: Automático via Docker Compose

### 2. Homologação (Staging)
- **Branch**: `staging`
- **URL**: Preview URL do Vercel ou http://localhost:3001 (Docker)
- **Supabase**: Projeto de staging
- **Deploy**: Automático via GitHub Actions + Vercel Preview

### 3. Produção (Production)
- **Branch**: `main`
- **URL**: https://seu-dominio.vercel.app
- **Supabase**: Projeto de produção
- **Deploy**: Automático via GitHub Actions + Vercel

## Configuração Inicial

### 1. Criar Projetos Supabase

Crie 3 projetos no Supabase:
- `styllus-dev` (desenvolvimento)
- `styllus-staging` (homologação)
- `styllus-prod` (produção)

Execute os scripts SQL em cada projeto na ordem:
\`\`\`bash
001_create_tables.sql
002_create_profile_trigger.sql
003_seed_data.sql
...
013_add_missing_columns.sql
\`\`\`

### 2. Configurar Variáveis de Ambiente

#### Desenvolvimento
\`\`\`bash
cp .env.development.example .env.development
# Edite .env.development com as credenciais do Supabase Dev
\`\`\`

#### Staging
\`\`\`bash
cp .env.staging.example .env.staging
# Edite .env.staging com as credenciais do Supabase Staging
\`\`\`

#### Produção (Vercel)
Configure as variáveis no painel do Vercel:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

### 3. Configurar GitHub Actions

Adicione os seguintes secrets no GitHub:
- `VERCEL_TOKEN`: Token de acesso do Vercel
- `VERCEL_ORG_ID`: ID da organização Vercel
- `VERCEL_PROJECT_ID`: ID do projeto Vercel

## Executar com Docker

### Desenvolvimento
\`\`\`bash
# Iniciar ambiente de desenvolvimento
docker-compose up styllus-dev

# Acessar em http://localhost:3000
\`\`\`

### Homologação
\`\`\`bash
# Build e iniciar staging
docker-compose up styllus-staging

# Acessar em http://localhost:3001
\`\`\`

### Produção Local
\`\`\`bash
# Build e iniciar produção
docker-compose up styllus-production

# Acessar em http://localhost:3002
\`\`\`

### Todos os Ambientes
\`\`\`bash
# Iniciar todos os ambientes
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar todos
docker-compose down
\`\`\`

## Fluxo de Trabalho (Git Flow)

### 1. Desenvolvimento
\`\`\`bash
git checkout develop
git pull origin develop
git checkout -b feature/nova-funcionalidade
# Faça suas alterações
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
# Crie PR para develop
\`\`\`

### 2. Homologação
\`\`\`bash
# Após merge no develop, criar PR para staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging
# Deploy automático para staging
\`\`\`

### 3. Produção
\`\`\`bash
# Após testes em staging, criar PR para main
git checkout main
git pull origin main
git merge staging
git push origin main
# Deploy automático para produção
\`\`\`

## Comandos Úteis

### Docker
\`\`\`bash
# Rebuild de uma imagem específica
docker-compose build styllus-dev

# Ver logs de um serviço
docker-compose logs -f styllus-staging

# Executar comando dentro do container
docker-compose exec styllus-dev pnpm add nova-dependencia

# Limpar tudo
docker-compose down -v
docker system prune -a
\`\`\`

### Desenvolvimento Local (sem Docker)
\`\`\`bash
# Instalar dependências
pnpm install

# Desenvolvimento
pnpm dev

# Build
pnpm build

# Produção local
pnpm start
\`\`\`

## Monitoramento

### Vercel
- Acesse o dashboard do Vercel para ver deploys
- Cada branch tem sua preview URL
- Logs em tempo real disponíveis

### Supabase
- Monitore queries no dashboard
- Verifique logs de autenticação
- Acompanhe uso de storage

## Troubleshooting

### Erro de Build
\`\`\`bash
# Limpar cache e reinstalar
rm -rf .next node_modules
pnpm install
pnpm build
\`\`\`

### Erro de Docker
\`\`\`bash
# Rebuild sem cache
docker-compose build --no-cache

# Verificar logs
docker-compose logs styllus-dev
\`\`\`

### Erro de Supabase
- Verifique se as variáveis de ambiente estão corretas
- Confirme que os scripts SQL foram executados
- Verifique as políticas RLS no dashboard
\`\`\`

```json file="" isHidden
