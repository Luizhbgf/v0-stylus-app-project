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

## 🛠️ Tecnologias

- **Next.js 15**: Framework React com App Router
- **TypeScript**: Tipagem estática para maior segurança
- **Supabase**: Backend completo com autenticação, banco de dados PostgreSQL e Realtime
- **Tailwind CSS v4**: Estilização moderna e responsiva
- **shadcn/ui**: Componentes de UI de alta qualidade
- **Lucide Icons**: Ícones modernos e elegantes
- **Sonner**: Sistema de notificações toast

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

## 🔔 Sistema de Notificações

O sistema envia notificações automáticas para clientes:

- **Confirmação**: Quando o profissional aprova a solicitação
- **Lembrete 1 dia antes**: 24 horas antes do agendamento
- **Lembrete 1 hora antes**: 60 minutos antes do agendamento

Para ativar os lembretes automáticos, configure um cron job para executar a função `send_appointment_reminders()` a cada hora.

## 📱 Deploy

### Vercel (Recomendado)
1. Clique no botão "Publish" no topo da página
2. Conecte sua conta Vercel
3. Configure as variáveis de ambiente do Supabase
4. O deploy será feito automaticamente

### Variáveis de Ambiente Necessárias

Configure no painel da Vercel ou na seção "Vars" do v0:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`: URL de redirect para desenvolvimento (opcional)

### Outras Plataformas
- **Google Play**: Use Capacitor para gerar APK
- **App Store**: Use Capacitor para gerar IPA

## 🔧 Configuração Local

\`\`\`bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
\`\`\`

## 📊 Escalabilidade

O sistema foi desenvolvido para suportar até 500 usuários simultâneos através de:

- **Server Components**: Renderização no servidor para melhor performance
- **Supabase**: Banco de dados PostgreSQL escalável
- **Realtime Subscriptions**: Notificações em tempo real eficientes
- **Otimização de Imagens**: Next.js Image para carregamento eficiente
- **Code Splitting**: Carregamento sob demanda de componentes
- **Edge Runtime**: Deploy em edge para menor latência

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

### Staff (Nível 20)
- Aprovar/rejeitar solicitações de agendamento
- Definir data e hora final do agendamento
- Visualizar agenda do dia
- Gerenciar seus agendamentos
- Marcar serviços como concluídos

### Admin (Nível 30)
- Acesso a todas as funcionalidades de Staff
- Visualizar estatísticas gerais
- Gerenciar clientes
- Gerenciar serviços
- Gerenciar profissionais
- Visualizar relatórios

### Super Admin (Nível 40)
- Acesso a todas as funcionalidades de Admin
- Configurações avançadas do sistema
- Gerenciar níveis de acesso de usuários

## 📄 Licença

MIT License - Livre para uso comercial e pessoal.
