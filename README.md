# Styllus App - Sistema de Agendamento para Salão de Beleza

Sistema robusto e escalável de agendamento online para salão de beleza e estética, desenvolvido com Next.js 15 e preparado para suportar até 500 usuários simultâneos.

## 🚀 Características

- **Interface Elegante**: Design sofisticado com paleta de cores dourada/ouro
- **Agendamento Online**: Sistema completo de reservas com seleção de serviços, profissionais, data e horário
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Performance**: Otimizado para alta performance e escalabilidade
- **PWA Ready**: Preparado para ser instalado como app em dispositivos móveis

## 🛠️ Tecnologias

- **Next.js 15**: Framework React com App Router
- **TypeScript**: Tipagem estática para maior segurança
- **Tailwind CSS v4**: Estilização moderna e responsiva
- **shadcn/ui**: Componentes de UI de alta qualidade
- **Lucide Icons**: Ícones modernos e elegantes

## 📱 Deploy

### Vercel (Recomendado)
1. Clique no botão "Publish" no topo da página
2. Conecte sua conta Vercel
3. O deploy será feito automaticamente

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
- **Otimização de Imagens**: Next.js Image para carregamento eficiente
- **Code Splitting**: Carregamento sob demanda de componentes
- **Edge Runtime**: Deploy em edge para menor latência

## 🎨 Personalização

As cores e estilos podem ser personalizados no arquivo `app/globals.css` através das variáveis CSS.

## 📄 Licença

MIT License - Livre para uso comercial e pessoal.
