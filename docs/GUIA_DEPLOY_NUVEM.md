# ☁️ Guia de Deploy em Nuvem da Aplicação
**Projeto:** NexusPay Treasury Portal  
**Tecnologia:** Node.js + Express + WebAuthn FIDO2

---

## 🔒 Requisito Fundamental do WebAuthn na Nuvem: HTTPS Obrigatório
A especificação do **W3C WebAuthn** exige um contexto seguro (**Secure Context**):
- Em ambiente de desenvolvimento local, o navegador autoriza `http://localhost` e `http://127.0.0.1`.
- Em ambiente de produção na nuvem, **o uso de HTTPS com certificado SSL/TLS é obrigatório** para que o navegador permita abrir o prompt de biometria.
- Todas as plataformas de nuvem modernas listadas abaixo fornecem certificado HTTPS gratuito e automático!

---

## Opção 1: Deploy Rápido no Render (Recomendado - 100% Gratuito)

1. Crie uma conta gratuita em [render.com](https://render.com).
2. Suba o código deste repositório para o seu **GitHub** pessoal.
3. No painel do Render, clique em **New +** > **Web Service**.
4. Conecte seu repositório do GitHub.
5. Preencha as configurações básicas:
   - **Name:** `nexuspay-treasury` (ou nome de sua escolha)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan Type:** `Free`
6. Clique em **Create Web Service**.
7. O Render gerará uma URL como `https://nexuspay-treasury.onrender.com`.
8. Ao acessar a URL em HTTPS no celular ou notebook com leitor de digital, o Touch ID / Windows Hello / Biometria do Android funcionará nativamente!

---

## Opção 2: Deploy no Railway

1. Acesse [railway.app](https://railway.app) e faça login com seu GitHub.
2. Clique em **New Project** > **Deploy from GitHub repo**.
3. Selecione o repositório da aplicação.
4. O Railway detectará automaticamente o arquivo `package.json` e executará `npm install` e `npm start`.
5. Em **Settings** > **Networking**, clique em **Generate Domain** para gerar uma URL pública com HTTPS (ex: `https://nexuspay.up.railway.app`).

---

## Opção 3: Executar Localmente no Notebook para a Apresentação

Se você preferir executar diretamente no seu computador para apresentar à turma:

```bash
# 1. Navegue até a pasta do projeto
cd "C:\Users\Aluno Tech\.gemini\antigravity\scratch\fintech-webauthn"

# 2. Instale as dependências (já instaladas)
npm install

# 3. Inicie o servidor
npm start
```

Abra o navegador em:
👉 **`http://localhost:3000`**

O protocolo WebAuthn funcionará imediatamente com o **Windows Hello** (digital, reconhecimento facial ou PIN) ou **Touch ID** no Mac!
