# Configuração de Login Social (OAuth)

Este guia explica como configurar o login com Google e Apple no Styllus App.

## Pré-requisitos

- Projeto Supabase criado e configurado
- Acesso ao painel do Supabase Dashboard

## Configurando Google OAuth

### 1. Configurar no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services > OAuth consent screen**
4. Preencha as informações do aplicativo
5. Vá para **APIs & Services > Credentials**
6. Clique em **Create Credentials > OAuth client ID**
7. Selecione **Web application**
8. Configure:
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (desenvolvimento)
     - `https://seu-dominio.vercel.app` (produção)
   - **Authorized redirect URIs**:
     - Copie a URL de callback do Supabase Dashboard
     - Formato: `https://seu-projeto.supabase.co/auth/v1/callback`

### 2. Configurar no Supabase Dashboard

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **Authentication > Providers**
3. Encontre **Google** na lista
4. Ative o provedor
5. Cole o **Client ID** e **Client Secret** do Google Cloud Console
6. Salve as configurações

### 3. Configurar Redirect URLs

1. No Supabase Dashboard, vá para **Authentication > URL Configuration**
2. Adicione as seguintes URLs de redirecionamento:
   - `http://localhost:3000/**` (desenvolvimento)
   - `https://seu-dominio.vercel.app/**` (produção)

## Configurando Apple OAuth

### 1. Configurar no Apple Developer

1. Acesse [Apple Developer](https://developer.apple.com/)
2. Vá para **Certificates, Identifiers & Profiles**
3. Crie um novo **App ID** ou use um existente
4. Habilite **Sign in with Apple**
5. Configure o **Service ID**:
   - Adicione domínios e redirect URLs
   - Use a URL de callback do Supabase

### 2. Configurar no Supabase Dashboard

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **Authentication > Providers**
3. Encontre **Apple** na lista
4. Ative o provedor
5. Cole o **Client ID**, **Team ID** e **Key ID** do Apple Developer
6. Faça upload da **Private Key** (.p8 file)
7. Salve as configurações

## Variáveis de Ambiente

Certifique-se de que as seguintes variáveis de ambiente estão configuradas:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
\`\`\`

## Testando

1. Acesse a página de login: `/auth/login`
2. Clique em "Continuar com Google" ou "Continuar com Apple"
3. Complete o fluxo de autenticação
4. Você será redirecionado para o dashboard apropriado baseado no seu nível de usuário

## Solução de Problemas

### Erro: "Unsupported provider: provider is not enabled"

**Causa**: O provedor OAuth não está habilitado no Supabase.

**Solução**: 
1. Vá para o Supabase Dashboard
2. Authentication > Providers
3. Habilite o provedor desejado (Google ou Apple)
4. Configure as credenciais corretamente

### Erro: "Invalid redirect URL"

**Causa**: A URL de redirecionamento não está configurada corretamente.

**Solução**:
1. Verifique se a URL está adicionada em **Authentication > URL Configuration**
2. Certifique-se de que a URL corresponde exatamente ao domínio do seu app
3. Use `/**` no final para permitir wildcards

### Erro: "Invalid client credentials"

**Causa**: Client ID ou Client Secret incorretos.

**Solução**:
1. Verifique as credenciais no Google Cloud Console ou Apple Developer
2. Copie e cole novamente no Supabase Dashboard
3. Certifique-se de não ter espaços extras

## Recursos Adicionais

- [Documentação Supabase OAuth](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
