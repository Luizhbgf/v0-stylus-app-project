# Styllus App - Sistema de Agendamento para Salão de Beleza

Sistema robusto e escalável de agendamento online para salão de beleza e estética, desenvolvido com Next.js 15, Supabase e preparado para suportar até 500 usuários simultâneos.

## 🚀 Características

- **Interface Elegante**: Design sofisticado com paleta de cores preto, branco e dourado
- **Modo Escuro**: Alternância entre tema claro e escuro
- **Sistema de Solicitações**: Clientes solicitam agendamentos e profissionais aprovam
- **Notificações em Tempo Real**: Sistema completo de notificações com Supabase Realtime
- **Lembretes Automáticos**: Notificações 1 dia e 1 hora antes dos agendamentos
- **Níveis de Usuário**: 
  - 10: Cliente - Solicita agendamentos e visualiza histórico
  - 20: Staff - Aprova solicitações e gerencia agenda
  - 30: Admin - Acesso completo ao painel administrativo
  - 40: Super Admin - Configurações avançadas do sistema
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Performance**: Otimizado para alta performance e escalabilidade
- **PWA Ready**: Preparado para ser instalado como app em dispositivos móveis
- **Docker**: Ambientes containerizados para desenvolvimento, homologação e produção
- **CI/CD**: Pipeline automatizado com GitHub Actions

## 🛠️ Tecnologias

- **Next.js 15**: Framework React com App Router
- **TypeScript**: Tipagem estática para maior segurança
- **Supabase**: Backend completo com autenticação, banco de dados PostgreSQL e Realtime
- **Tailwind CSS v4**: Estilização moderna e responsiva
- **shadcn/ui**: Componentes de UI de alta qualidade
- **Lucide Icons**: Ícones modernos e elegantes
- **Sonner**: Sistema de notificações toast
- **Docker**: Containerização para ambientes isolados
- **GitHub Actions**: CI/CD automatizado

## 🔐 Autenticação e Segurança

- Autenticação completa com Supabase Auth
- Row Level Security (RLS) para proteção de dados
- Middleware para proteção de rotas
- Políticas de acesso baseadas em níveis de usuário

## 📊 Banco de Dados

### Tabelas Principais

- **profiles**: Perfis de usuários com níveis de acesso
- **services**: Serviços oferecidos pelo salão
- **staff_services**: Relacionamento entre profissionais e serviços
- **appointments**: Agendamentos confirmados
- **appointment_requests**: Solicitações de agendamento pendentes
- **notifications**: Notificações dos usuários

### Scripts SQL

Execute os scripts na ordem para configurar o banco de dados:

1. `scripts/001_create_tables.sql` - Cria tabelas principais
2. `scripts/002_create_profile_trigger.sql` - Trigger para criar perfil automaticamente
3. `scripts/003_seed_data.sql` - Dados iniciais de serviços
4. `scripts/004_create_notifications.sql` - Sistema de notificações
5. `scripts/005_create_client_features.sql` - Funcionalidades do cliente
6. `scripts/006_create_appointment_requests.sql` - Sistema de solicitações
7. `scripts/007_create_staff_features.sql` - Funcionalidades do staff
8. `scripts/008_add_staff_portfolio.sql` - Portfolio dos profissionais
9. `scripts/009_create_feedback_system.sql` - Sistema de feedback
10. `scripts/010_allow_appointments_without_client.sql` - Eventos sem cliente
11. `scripts/011_fix_services_rls.sql` - Correção de políticas RLS
12. `scripts/012_enhance_appointments_system.sql` - Melhorias no sistema de agendamentos
13. `scripts/013_add_missing_columns.sql` - Colunas adicionais

## 🔔 Sistema de Notificações

O sistema envia notificações automáticas para clientes:

- **Confirmação**: Quando o profissional aprova a solicitação
- **Lembrete 1 dia antes**: 24 horas antes do agendamento
- **Lembrete 1 hora antes**: 60 minutos antes do agendamento

Para ativar os lembretes automáticos, configure um cron job para executar a função `send_appointment_reminders()` a cada hora.

## 🐳 Ambientes e Docker

O projeto suporta três ambientes isolados:

### Desenvolvimento
\`\`\`bash
# Iniciar ambiente de desenvolvimento
npm run docker:dev
# ou
docker-compose up styllus-dev

# Acesse em http://localhost:3000
\`\`\`

### Homologação (Staging)
\`\`\`bash
# Iniciar ambiente de homologação
npm run docker:staging
# ou
docker-compose up styllus-staging

# Acesse em http://localhost:3001
\`\`\`

### Produção (Local)
\`\`\`bash
# Iniciar ambiente de produção
npm run docker:prod
# ou
docker-compose up styllus-production

# Acesse em http://localhost:3002
\`\`\`

### Todos os Ambientes
\`\`\`bash
# Iniciar todos os ambientes simultaneamente
npm run docker:all

# Ver logs
npm run docker:logs

# Parar todos
npm run docker:down
\`\`\`

## 📱 Deploy

### Vercel (Recomendado para Produção)
1. Clique no botão "Publish" no topo da página
2. Conecte sua conta Vercel
3. Configure as variáveis de ambiente do Supabase
4. O deploy será feito automaticamente

O Vercel oferece:
- **Preview Deployments**: Cada branch/PR gera uma URL de preview automaticamente
- **Production**: Branch `main` é deployado em produção
- **Edge Network**: Deploy global para menor latência

### Variáveis de Ambiente Necessárias

Configure no painel da Vercel ou na seção "Vars" do v0:

#### Desenvolvimento
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase Dev
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase Dev
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`: http://localhost:3000/auth/callback

#### Staging
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase Staging
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase Staging
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`: https://staging.seu-dominio.com/auth/callback

#### Produção
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase Prod
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase Prod
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`: https://seu-dominio.com/auth/callback

### Outras Plataformas
- **Google Play**: Use Capacitor para gerar APK
- **App Store**: Use Capacitor para gerar IPA

## 🔧 Configuração Local

### Sem Docker
\`\`\`bash
# Instalar dependências
pnpm install

# Rodar em desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Iniciar produção
pnpm start
\`\`\`

### Com Docker
\`\`\`bash
# Copiar arquivos de exemplo
cp .env.development.example .env.development
cp .env.staging.example .env.staging
cp .env.production.example .env.production

# Editar os arquivos .env com suas credenciais Supabase

# Iniciar ambiente desejado
pnpm docker:dev
\`\`\`

## 🔄 CI/CD Pipeline

O projeto inclui pipeline automatizado com GitHub Actions:

### Fluxo de Trabalho

1. **Push para `develop`**: 
   - Executa testes de qualidade (lint, type check)
   - Build de desenvolvimento
   
2. **Push para `staging`**:
   - Executa testes de qualidade
   - Build de staging
   - Cria imagem Docker

3. **Push para `main`**:
   - Executa testes de qualidade
   - Deploy automático para Vercel Production

### Configurar GitHub Actions

Adicione os seguintes secrets no GitHub (Settings > Secrets):
- `VERCEL_TOKEN`: Token de acesso do Vercel
- `VERCEL_ORG_ID`: ID da organização Vercel
- `VERCEL_PROJECT_ID`: ID do projeto Vercel

## 📊 Escalabilidade

O sistema foi desenvolvido para suportar até 500 usuários simultâneos através de:

- **Server Components**: Renderização no servidor para melhor performance
- **Supabase**: Banco de dados PostgreSQL escalável
- **Realtime Subscriptions**: Notificações em tempo real eficientes
- **Otimização de Imagens**: Next.js Image para carregamento eficiente
- **Code Splitting**: Carregamento sob demanda de componentes
- **Edge Runtime**: Deploy em edge para menor latência
- **Docker**: Isolamento e escalabilidade horizontal
- **Load Balancing**: Suporte a múltiplas instâncias

## 🎨 Personalização

As cores e estilos podem ser personalizados no arquivo `app/globals.css` através das variáveis CSS:

- `--background`: Cor de fundo principal
- `--foreground`: Cor do texto principal
- `--gold`: Cor dourada para acentos
- `--primary`: Cor primária do tema
- E outras variáveis de design tokens

## 🚀 Funcionalidades por Nível de Usuário

### Cliente (Nível 10)
- Solicitar agendamentos
- Visualizar agendamentos confirmados
- Ver histórico de serviços
- Receber notificações em tempo real
- Visualizar solicitações pendentes
- Gerenciar favoritos
- Acompanhar pagamentos e assinaturas

### Staff (Nível 20)
- Aprovar/rejeitar solicitações de agendamento
- Definir data e hora final do agendamento
- Visualizar agenda do dia
- Gerenciar seus agendamentos
- Marcar serviços como concluídos
- Adicionar clientes esporádicos
- Criar eventos sem cliente
- Gerenciar serviços oferecidos
- Personalizar perfil com portfolio

### Admin (Nível 30)
- Acesso a todas as funcionalidades de Staff
- Visualizar estatísticas gerais
- Gerenciar clientes
- Gerenciar todos os serviços
- Gerenciar profissionais
- Visualizar relatórios detalhados
- Acessar agenda de todos os profissionais
- Gerenciar planos de assinatura
- Gerenciar cursos
- Análise de feedback e lucratividade

### Super Admin (Nível 40)
- Acesso a todas as funcionalidades de Admin
- Configurações avançadas do sistema
- Gerenciar níveis de acesso de usuários

## 📚 Documentação Adicional

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia completo de deploy e ambientes
- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - Configuração de login social (Google/Apple)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - Livre para uso comercial e pessoal.
