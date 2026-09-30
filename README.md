# 🏛️ NexusPay Treasury Portal — FIDO2 & WebAuthn Biometrics
> **Portal Web de Aprovação de Transferências Bancárias de Alto Valor (> R$ 1 Milhão) com Biometria Nativa de Hardware e Proteção Anti-Phishing**

![FIDO2](https://img.shields.io/badge/Security-FIDO2%20%2F%20WebAuthn-emerald?style=for-the-badge&logo=fidoalliance)
![NodeJS](https://img.shields.io/badge/Node.js-v24-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-v5-black?style=for-the-badge&logo=express)
![LGPD](https://img.shields.io/badge/Compliance-LGPD%20Art.%205%C2%BA-blue?style=for-the-badge)

---

## 🎯 O Cenário da Fintech
Uma Fintech corporativa necessita de um mecanismo inviolável para autorizar transferências bancárias de alto valor (superiores a R$ 1 milhão). 
Senhas convencionais, códigos por SMS e tokens em software são suscetíveis a ataques remotos de **Phishing**, **Engenharia Social**, **Sequestro de Sessão** e **Vazamentos de Banco de Dados**.

Para mitigar esses riscos, foi desenvolvido este portal com suporte à **WebAuthn API**, exigindo que os diretores aprovem remessas críticas utilizando a biometria nativa do seu próprio computador ou smartphone (**Windows Hello**, **Touch ID no Mac/iPhone**, ou **Leitor Biométrico do Android**).

---

## 🚀 Requisitos e Entregáveis do Projeto

| Requisito | Status | Implementação |
| :--- | :---: | :--- |
| **1. Formulário de Registro Biométrico** | ✅ Concluído | Aba 2: Vinculação via `navigator.credentials.create` com `@simplewebauthn/browser` e armazenamento da Chave Pública no backend via `@simplewebauthn/server`. |
| **2. Aprovação de Transferência (> R$ 1M)** | ✅ Concluído | Aba 1: Disparo do prompt nativo do sistema operacional (Windows Hello / Touch ID) via `navigator.credentials.get` gerando assinatura digital imutável. |
| **3. Reflexão de Segurança (Relatório)** | ✅ Concluído | Aba 4 e documento [`docs/RELATORIO_SEGURANCA_LGPD.md`](docs/RELATORIO_SEGURANCA_LGPD.md): Análise sobre a retenção da biometria no chip TPM e proteção contra vazamento do DB (comparado à Aula 1). |
| **4. Termos de Uso e LGPD** | ✅ Concluído | Parágrafo obrigatório com checkbox de consentimento em conformidade com o Art. 5º, II e Art. 11 da LGPD na tela de cadastro. |
| **5. Pitch Técnico de 5 Minutos** | ✅ Concluído | Guia minuto a minuto para a apresentação da equipe em [`docs/PITCH_5_MINUTOS.md`](docs/PITCH_5_MINUTOS.md). |
| **6. Código em Execução e Deploy** | ✅ Concluído | Aplicação pronta para rodar localmente e guia de publicação em nuvem em [`docs/GUIA_DEPLOY_NUVEM.md`](docs/GUIA_DEPLOY_NUVEM.md). |

---

## 📂 Estrutura do Projeto

```text
fintech-webauthn/
├── server.js                          # Servidor Node.js Express com rotas WebAuthn FIDO2
├── package.json                       # Configuração de dependências e scripts de execução
├── public/
│   ├── index.html                     # Portal executivo com Tailwind CSS e navegação em abas
│   ├── app.js                         # Controlador frontend com @simplewebauthn/browser
│   ├── style.css                      # Estilos refinados e animações do leitor biométrico
│   └── vendor/
│       └── simplewebauthn-browser.umd.min.js  # Biblioteca cliente WebAuthn oficial
├── test/
│   └── test-flow.js                   # Teste automatizado do ciclo completo de autenticação
├── docs/
│   ├── RELATORIO_SEGURANCA_LGPD.md    # Relatório detalhado de segurança e análise LGPD
│   ├── PITCH_5_MINUTOS.md             # Roteiro da apresentação técnica de 5 minutos
│   └── GUIA_DEPLOY_NUVEM.md           # Passo a passo de publicação na nuvem (Render/Railway)
└── README.md                          # Este arquivo de documentação
```

---

## 🛠️ Como Executar a Aplicação Passo a Passo

### Pré-requisitos
- Node.js instalado (v18 ou superior).

### 1. Clonar ou Acessar a Pasta
```bash
cd "C:\Users\Aluno Tech\.gemini\antigravity\scratch\fintech-webauthn"
```

### 2. Instalar Dependências (se ainda não instaladas)
```bash
npm install
```

### 3. Iniciar o Servidor
```bash
npm start
```

### 4. Acessar no Navegador
Abra o navegador em:
👉 **`http://localhost:3000`**

---

## 🧪 Roteiro de Teste do Usuário na Aplicação

1. **Seleção do Diretor:**
   - No topo da tela, verifique o diretor ativo (ex: *Dr. Roberto Almeida - CFO*).
   - Note o badge âmbar: `"Biometria Pendente de Registro"`.
2. **Aba 2 — Vincular Biometria do Dispositivo:**
   - Acesse a aba **"2. Vincular Biometria do Dispositivo"**.
   - Leia a cláusula de **LGPD e Termos de Uso** e marque o checkbox de consentimento.
   - Clique no botão verde: **"Vincular Biometria do Dispositivo (Windows Hello / Touch ID)"**.
   - O prompt nativo do sistema operacional será aberto solicitando seu leitor biométrico ou PIN.
   - Após a validação, a credencial FIDO2 estará ativa e o badge ficará verde!
3. **Aba 1 — Aprovação da Transferência de Alto Valor:**
   - Volte para a aba **"1. Aprovação de Transferências (> R$ 1 Milhão)"**.
   - Localize a transferência pendente de **R$ 2.450.000,00** para a *Datacenter Cloud do Brasil*.
   - Clique em **"Aprovar com Biometria"**.
   - Confira os dados bancários no modal executivo e confirme.
   - O leitor biométrico nativo será acionado novamente. Encoste a digital para assinar!
   - O sistema emitirá o **Comprovante Criptográfico Oficial** com o hash da assinatura e o contador FIDO2.
4. **Aba 3 — Inspetor Criptográfico:**
   - Veja o fluxo pedagógico em 4 etapas e a trilha de auditoria em tempo real.
5. **Aba 4 — Relatório Técnico:**
   - Visualize a reflexão de segurança e a fundamentação teórica pronta para a avaliação dos professores.

---

## 🛡️ Destaques de Segurança (Para o Pitch e Relatório)

1. **A biometria sai do computador?**
   - **Não.** Fica retida no chip **TPM / Secure Enclave**. Apenas a assinatura digital matemática descartável e a chave pública trafegam na rede.
2. **E se o banco de dados vazar?**
   - O banco armazena apenas **Chaves Públicas**. A Chave Privada permanece inviolável dentro do hardware do Diretor. Sem o dispositivo físico e o dedo do Diretor, é impossível aprovar transações.
3. **Proteção contra Phishing:**
   - O navegador realiza o **Origin Binding (RP ID)**. Mesmo que a vítima clique em um site clone falso, o chip seguro recusa a assinatura por divergência de domínio.

---

## 📜 Licença
Desenvolvido para fins educacionais e de demonstração tecnológica bancária de alto nível.
