# Configuração de Templates de Email no Supabase

## 📧 Como Configurar Templates Personalizados

### 1️⃣ **Acessar o Dashboard do Supabase**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `sigremedios`

### 2️⃣ **Ir para Configurações de Email**
1. No menu lateral, clique em **Authentication**
2. Clique em **Email Templates**

### 3️⃣ **Configurar Template de Mudança de Email**
1. Selecione: **Change Email Address** (Confirm email change)
2. Cole o conteúdo do arquivo: `supabase/email-templates/email-change.html`
3. Clique em **Save**

---

## 🎨 Templates Criados

### `email-change.html`
- **Design profissional** com gradientes coloridos
- **Header com ícone** de email
- **Box de informação** mostrando email antigo e novo
- **Botão CTA destacado** para confirmação
- **Box de aviso** para segurança
- **Footer** com branding do app
- **Responsivo** para mobile

### Variáveis do Supabase:
- `{{ .Email }}` - Email antigo
- `{{ .NewEmail }}` - Email novo
- `{{ .ConfirmationURL }}` - Link de confirmação

---

## ✅ Verificação

Após configurar, teste:
1. Tente mudar o email no perfil
2. Verifique a caixa de entrada do novo email
3. O email deve estar bonito e profissional! 🎨

---

## 📝 Notas

- Templates usam **HTML inline CSS** para compatibilidade com clientes de email
- Design matches o padrão visual do app (gradientes, cores, sombras)
- Suporta dark mode em alguns clientes de email
