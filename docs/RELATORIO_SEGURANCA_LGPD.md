# 🛡️ Relatório Técnico de Segurança & Conformidade LGPD
**Projeto:** NexusPay Treasury Portal — Aprovações de Alto Valor via FIDO2 / WebAuthn  
**Data:** 2026  
**Público-Alvo:** Avaliadores Acadêmicos, Diretores de Segurança da Informação (CISO) e Auditores de Compliance

---

## 1. Introdução e Contexto Operacional

Transferências corporativas de alto valor (superiores a R$ 1.000.000,00) representam o alvo prioritário de quadrilhas de crime cibernético especializadas em:
- **Phishing de Alta Precisão (Spear Phishing):** Criação de portais bancários clones para captura de credenciais corporativas.
- **Sequestro de Sessão (Session Hijacking):** Roubo de cookies de autenticação válidos através de infecções por *infostealers* ou ataques XSS.
- **Ataques Man-in-the-Middle (MitM) e SIM Swapping:** Interceptação de senhas dinâmicas de uso único (SMS/OTP) e aplicativos de autenticação em software.

Para solucionar essas vulnerabilidades estruturais, a **NexusPay** implementou o protocolo **WebAuthn (W3C)** sob o framework **FIDO2**, substituindo credenciais compartilhadas (senhas) por criptografia assimétrica ancorada em hardware.

---

## 2. Reflexão de Segurança: A Biometria Viaja pela Internet?

> ### ❓ Pergunta do Desafio:
> *A impressão digital do usuário viaja pela internet ou fica salva apenas no hardware do celular/computador?*

### 🔒 Resposta Técnica:
**A impressão digital JAMAIS viaja pela internet e JAMAIS sai do dispositivo do usuário.**

### Detalhamento do Funcionamento no Hardware:
1. **Isolamento em Hardware Criptográfico Dedicado:**
   - No Windows, a biometria é gerenciada pelo **Windows Hello** e protegida pelo chip **TPM (Trusted Platform Module)**.
   - Em dispositivos Apple (macOS / iOS), o processamento é conduzido pelo **Apple Secure Enclave (SEP)**.
   - No Android, o isolamento ocorre na **TEE (Trusted Execution Environment)** ou no chip Titan M/Knox.
2. **A Biometria como "Gatilho Local":**
   - O sensor biométrico extrai apenas as *minúcias biométricas* (vetores matemáticos derivados da digital, nunca a imagem fotográfica do dedo) e as compara internamente na memória isolada do chip.
   - Caso a digital coincida, o chip libera o uso de uma **Chave Privada Criptográfica (ECDSA P-256 ou Ed25519)** gerada especificamente para este domínio bancário.
3. **O que é transmitido pela rede:**
   - O servidor da Fintech envia um número pseudoaleatório de uso único chamado **Challenge (Desafio Criptográfico)**.
   - O chip seguro do notebook do Diretor assina digitalmente esse desafio utilizando a sua Chave Privada.
   - O navegador envia para a Fintech apenas o pacote contendo:
     - O identificador da credencial (`credentialID`);
     - Os metadados de presença (`authenticatorData` com a flag `userVerified: true`);
     - A **Assinatura Digital gerada** (`signature`).
   - Mesmo que um atacante monitore 100% dos pacotes da rede (inclusive quebrando TLS com certificado falso em proxy corporativo), ele capturará unicamente uma assinatura descartável de 64 bytes. **Nenhum byte de dado biométrico existe na comunicação.**

---

## 3. Proteção contra Vazamento de Banco de Dados (Comparativo com a Aula 1)

> ### ❓ Pergunta do Desafio:
> *Como esse modelo protege contra vazamento de banco de dados (como o que fizemos na Aula 1)?*

### ⚠️ O Cenário da Aula 1 (Modelo Tradicional de Senhas):
Na Aula 1, os sistemas utilizavam o modelo de autenticação baseado em segredo compartilhado:
- O usuário digita uma senha; o servidor calcula um hash (MD5, SHA-256, bcrypt ou argon2) e armazena na tabela de usuários.
- **Vulnerabilidade:** Se invasores invadirem o banco de dados SQL (via SQL Injection, dump acidental de backup ou acesso não autorizado à infraestrutura em nuvem), eles obtêm a lista de hashes.
- Com poder computacional moderno (clusters de GPUs) e dicionários como *RockYou* ou *Rainbow Tables*, bilhões de senhas são quebradas em minutos ou reutilizadas em ataques de *Credential Stuffing*.
- Uma vez descoberta a senha, o invasor pode logar de qualquer lugar do mundo (da Rússia, China ou de uma VPN anônima) e aprovar transferências milionárias.

### 🛡️ O Cenário FIDO2 / WebAuthn (NexusPay):
No modelo implementado com `@simplewebauthn`:
- O banco de dados da Fintech armazena **apenas a Chave Pública** (`publicKey`) e o `credentialID`.
- A Chave Pública, por definição matemática:
  - Pode ser disponibilizada abertamente para qualquer pessoa;
  - Serve **exclusivamente para verificar** se uma assinatura é válida;
  - **É matematicamente impossível** deduzir a Chave Privada a partir da Chave Pública (Problema do Logaritmo Discreto em Curvas Elípticas);
  - **Não contém nenhuma relação** com a impressão digital do Diretor.
- **Resultado em caso de vazamento total do banco de dados:**
  - Se um hacker vazar 100% da base de dados da NexusPay, ele terá apenas um arquivo com chaves públicas.
  - Ele **não** consegue gerar assinaturas válidas;
  - Ele **não** consegue aprovar nenhuma transferência;
  - Ele **não** possui a biometria nem o dispositivo físico do Diretor.

---

## 4. Por que o WebAuthn é Imune a Phishing e Engenharia Social?

Em ataques de Phishing convencionais, mesmo a autenticação em dois fatores (2FA via SMS ou aplicativo Authenticator TOTP) pode ser burlada através de ferramentas como *Evilginx* (Reverse Proxies transparentes).

O WebAuthn resolve isso na raiz através do conceito de **RP ID Binding (Vínculo Criptográfico de Origem)**:
1. Quando a credencial biométrica é criada, ela fica atrelada ao domínio do navegador (ex: `nexuspay.com.br`).
2. Se o Diretor for enganado e clicar em um link malicioso que o leve a um site clone idêntico em `nexuspay-seguranca.com`, o navegador envia o domínio falso para o chip TPM.
3. O chip seguro compara o RP ID solicitado com a credencial registrada e **recusa a assinatura**, pois as origens não coincidem.
4. O phishing torna-se matematicamente impossível de ser consumado.

---

## 5. Documento de Termos de Uso e LGPD (Lei 13.709/2018)

> **Nota:** Este parágrafo está inserido de forma destacada e obrigatória na tela de cadastro da aplicação, com caixa de seleção de consentimento formal.

### Termo de Consentimento e Privacidade de Dados Biométricos:
```text
TERMO DE PRIVACIDADE E PROTEÇÃO DE DADOS BIOMÉTRICOS (LGPD Art. 5º, II e Art. 11)

Em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), 
informamos que a NexusPay adota a arquitetura de Privacidade por Design (Privacy by Design) 
e Minimização Extrema de Dados (Art. 6º, III).

Seus dados biométricos (impressão digital ou mapa facial) JAMAIS são digitalizados, capturados, 
transmitidos pela internet ou armazenados em servidores da Fintech ou de terceiros em nuvem. 

A validação biométrica ocorre de forma 100% local e isolada no processador de segurança do seu 
próprio equipamento pessoal (chip TPM 2.0 no Windows, Apple Secure Enclave em macOS/iOS, ou TEE 
em Android). 

Nossos servidores recebem unicamente uma prova criptográfica descartável de 64 bytes (assinatura 
assimétrica FIDO2/WebAuthn), acompanhada da sua chave pública de auditoria. Desta forma, mesmo na 
eventualidade de um vazamento integral de nossa base de dados, suas características físicas e 
impressão digital permanecem perpetuamente invioláveis e protegidas sob custódia exclusiva do seu hardware.
```

---

## 6. Tabela Comparativa de Arquiteturas de Segurança

| Vetor de Risco | Senha + SMS / App OTP | Certificado Digital A1 em Arquivo | Biometria FIDO2 / WebAuthn (NexusPay) |
| :--- | :---: | :---: | :---: |
| **Phishing / Site Falso** | Vulnerável | Vulnerável | **Imune (RP ID Binding Nativo)** |
| **Vazamento de Banco de Dados** | Crítico (Cracking de Hashes) | Seguro (Salva Chave Pública) | **Inviolável (Chave Pública Apenas)** |
| **Infostealer / Trojan no PC** | Captura Senha e Código | Rouba arquivo `.pfx` | **Imune (Chave Privada trancada no TPM)** |
| **Privacidade Biométrica (LGPD)** | N/A | N/A | **100% Retida no Hardware Local** |
| **Experiência do Diretor (UX)** | Lenta (Digitar códigos) | Difícil instalação | **Instantânea (1 Toque no leitor)** |

---

## 7. Conclusão da Auditoria Técnica

A implementação desenvolvida atende rigorosamente aos padrões da indústria financeira global (FIDO Alliance, W3C Web Authentication Level 3) e às resoluções de segurança cibernética do Banco Central do Brasil (Resolução CMN nº 4.893 e Resolução BCB nº 85), proporcionando alçada de aprovação inviolável para movimentações de tesouraria de alto valor.
