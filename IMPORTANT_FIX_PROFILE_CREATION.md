# 🔧 CORREÇÃO URGENTE: Perfis não estão sendo criados

## Problema Identificado
O trigger `on_auth_user_created` que cria automaticamente perfis na tabela `profiles` quando um usuário se registra está **DESABILITADO** no banco de dados.

## Solução

### Passo 1: Acesse o Supabase Dashboard
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto: **stylus_database**
3. Clique em **SQL Editor** no menu lateral

### Passo 2: Execute o Script de Correção
Copie e cole o conteúdo do arquivo `scripts/031_recreate_profile_trigger.sql` no SQL Editor e execute.

**OU** copie este código diretamente:

\`\`\`sql
-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the trigger function with all necessary fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    user_level,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'user_level')::INTEGER, 10),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger is created and enabled
SELECT 
  t.tgname AS trigger_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA'
    WHEN 'A' THEN 'ALWAYS'
    ELSE 'UNKNOWN'
  END as status,
  n.nspname || '.' || c.relname AS table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname = 'on_auth_user_created';
\`\`\`

### Passo 3: Desabilitar Confirmação de Email (Opcional mas Recomendado)

Para permitir que usuários façam login imediatamente após o cadastro:

1. No Supabase Dashboard, vá para **Authentication** > **Providers**
2. Role até **Email** provider
3. Desmarque a opção **"Confirm email"**
4. Clique em **Save**

### Passo 4: Verificar

Após executar o script:

1. O último SELECT deve retornar:
   - `trigger_name`: `on_auth_user_created`
   - `status`: `ENABLED`
   - `table_name`: `auth.users`

2. Teste criando um novo usuário em:
   - `/auth/sign-up` (cadastro público)
   - `/staff/clientes/criar` (staff criando cliente)

3. Verifique no **Table Editor** > **profiles** que o perfil foi criado automaticamente

## O que foi corrigido

✅ **Trigger recriado**: Agora cria perfis automaticamente quando usuários se registram
✅ **Campo `phone` adicionado**: O trigger agora inclui o telefone no perfil
✅ **SECURITY DEFINER**: O trigger bypassa RLS policies, permitindo criar perfis mesmo sem autenticação
✅ **Metadados corretos**: Lê `full_name`, `phone` e `user_level` dos metadados do usuário

## Após a Correção

Ambos os fluxos funcionarão perfeitamente:

1. **Cadastro Público** (`/auth/sign-up`):
   - Usuário preenche formulário
   - Supabase cria conta de autenticação
   - Trigger cria perfil automaticamente na tabela `profiles`
   - Login imediato (se confirmação de email estiver desabilitada)

2. **Staff Cria Cliente** (`/staff/clientes/criar`):
   - Staff preenche formulário
   - Supabase cria conta de autenticação para o cliente
   - Trigger cria perfil automaticamente
   - Cliente pode fazer login imediatamente
