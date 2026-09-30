# 🎤 Roteiro de Apresentação: Pitch Técnico de 5 Minutos
**Projeto:** NexusPay Treasury — Portal de Aprovação de Alto Valor com Biometria FIDO2  
**Formato:** Pitch Técnico com Demonstração Prática ao Vivo  
**Tempo Total:** 5 minutos cronometrados

---

## ⏱️ Cronograma Minuto a Minuto

```text
[00:00 - 01:00]  1. O Problema: Fraudes Bancárias e Limitações das Senhas
[01:00 - 02:00]  2. A Solução Técnica: Protocolo FIDO2 e WebAuthn API
[02:00 - 03:30]  3. Demonstração Prática ao Vivo (Cadastro + Aprovação de R$ 2,45M)
[03:30 - 04:30]  4. Reflexão de Segurança & LGPD (Por que a digital nunca sai do chip?)
[04:30 - 05:00]  5. Conclusão, Impacto de Negócio e Encerramento
```

---

## 🎙️ Roteiro com Falas Sugeridas e Ações de Tela

### Minuto 0:00 a 1:00 — O Problema (O "Gancho" Inicial)
- **Ação na tela:** Abrir o Portal da NexusPay na Aba 1 ("Aprovação de Transferências"), exibindo as transferências de R$ 2,45 milhões e R$ 5,8 milhões pendentes.
- **Fala sugerida:**
  > *"Boa noite, professor e colegas. Imaginem o seguinte cenário de pesadelo em uma Fintech: uma quadrilha cibernética envia um e-mail de phishing convincente para o Diretor Financeiro, clona a página de login e rouba a senha dele e o token do celular. Minutos depois, uma transferência não autorizada de R$ 2,5 milhões é aprovada e desaparece no sistema bancário.*
  >
  > *Como vimos na Aula 1, sistemas baseados em senhas e hashes no banco de dados falham diante de vazamentos, infecções por malware e engenharia social. Para movimentações corporativas milionárias, senhas tradicionais tornaram-se inaceitáveis. Foi para resolver essa vulnerabilidade crítica que criamos o **NexusPay Treasury**."*

---

### Minuto 1:00 a 2:00 — A Solução Técnica
- **Ação na tela:** Alternar brevemente para a Aba 3 ("Inspetor Criptográfico FIDO2") e apontar para o diagrama de 4 etapas.
- **Fala sugerida:**
  > *"Nossa solução foi desenhada com o padrão ouro da indústria: o protocolo **FIDO2** e a **WebAuthn API** nativa dos navegadores modernos, utilizando no backend o `@simplewebauthn/server` em Node.js.
  >
  > O grande diferencial: **nós eliminamos completamente o uso de senhas e OTPs**. Para autorizar qualquer transação acima de R$ 1 milhão, o sistema exige uma assinatura criptográfica gerada diretamente pelo chip seguro do hardware do Diretor — seja pelo Windows Hello no notebook, Touch ID no Mac ou biometria no celular. A chave privada fica fisicamente isolada no chip TPM do computador."*

---

### Minuto 2:00 a 3:30 — Demonstração Prática ao Vivo (O Clímax do Pitch!)
- **Ação na tela:**
  1. Clicar na Aba 2 ("Vincular Biometria do Dispositivo").
  2. Apontar o **Termo de LGPD** com o checkbox de consentimento e marcar a caixa.
  3. Clicar no botão verde **"Vincular Biometria do Dispositivo (Windows Hello / Touch ID)"**.
  4. Mostrar o prompt nativo do Windows Hello / Touch ID abrindo na tela e encostar o dedo no leitor biométrico (ou usar o PIN/simulador).
  5. Mostrar o alerta de sucesso e o badge verde ativando: *"Biometria Vinculada (Hardware FIDO2 Ativo)"*.
  6. Voltar para a Aba 1 ("Aprovação de Transferências").
  7. Localizar a transferência de **R$ 2.450.000,00** para a *Datacenter Cloud do Brasil*.
  8. Clicar em **"Aprovar com Biometria"**.
  9. Exibir o modal com os dados bancários da transação e clicar em **"Autorizar e Abrir Leitor Biométrico"**.
  10. O prompt nativo do sistema operacional surge novamente. Encostar a digital para assinar a transferência!
  11. O modal do **Comprovante Criptográfico Oficial** surge imediatamente com o Hash da assinatura, contador anti-replay e carimbo de tempo.
- **Fala sugerida:**
  > *"Vejam isso acontecendo na prática. Primeiro, na tela de cadastro, o Diretor concorda com o Termo de Privacidade da LGPD. Ao clicar em Vincular Biometria, o navegador aciona o hardware seguro do computador. O prompt nativo do Windows Hello abre e eu toco no leitor de impressão digital. Pronto: o par de chaves assimétricas foi gerado e a chave pública registrada no servidor.
  >
  > Agora vamos para a tesouraria. Temos aqui um TED de R$ 2.450.000,00 para compra de servidores de IA. Clicamos em Aprovar com Biometria. O sistema emite um desafio único atrelado a este valor e CNPJ. Eu encosto o dedo novamente no sensor biométrico... e a transferência é aprovada!
  >
  > Aqui na tela está o nosso **Comprovante Criptográfico Imutável**: o hash da assinatura digital ECDSA, o contador de uso do chip para evitar ataques de repetição e o selo de auditoria com carimbo de tempo."*

---

### Minuto 3:30 a 4:30 — Reflexão de Segurança & LGPD
- **Ação na tela:** Alternar para a Aba 4 ("Relatório Técnico de Segurança & LGPD").
- **Fala sugerida:**
  > *"Agora, a reflexão mais importante que todo executivo de segurança nos faz: **A impressão digital do diretor viajou pela internet ou foi salva no banco de dados da Fintech?**
  >
  > A resposta categórica é: **NÃO. A biometria NUNCA sai do hardware do computador.**
  > A leitura biométrica é processada 100% dentro do chip TPM ou Secure Enclave. Ela serve apenas para autorizar o chip a assinar o desafio. O que trafega pela internet é somente uma assinatura matemática descartável de 64 bytes.
  >
  > E em comparação com a Aula 1: **E se o banco de dados da Fintech for 100% vazado por um hacker?**
  > No modelo tradicional de senhas, o invasor quebra os hashes e assume as contas. No nosso modelo FIDO2, o banco só guarda a **Chave Pública**. Como a chave pública só serve para conferir assinaturas, o invasor não consegue forjar nenhuma aprovação sem ter o notebook físico e o dedo do Diretor.
  >
  > Além disso, atendemos ao Artigo 5º da **LGPD**: como não coletamos nem armazenamos biometria na nuvem, o risco de incidente com dados sensíveis é reduzido a zero."*

---

### Minuto 4:30 a 5:00 — Conclusão e Impacto no Negócio
- **Ação na tela:** Voltar para a tela inicial com o painel executivo e as métricas atualizadas.
- **Fala sugerida:**
  > *"Em conclusão: transformamos uma operação de tesouraria de alto risco em um fluxo ultra-seguro, imune a Phishing, imune a vazamento de banco de dados e com experiência do usuário em menos de 3 segundos com apenas um toque no sensor.
  >
  > Esse é o padrão de segurança adotado pelos maiores bancos mundiais e pronto para a regulação do Banco Central.
  >
  > Muito obrigado a todos e estamos à disposição para dúvidas!"*

---

## 💡 Dicas de Ouro para a Apresentação
1. **Treinem a passagem de telas:** Deixem a aplicação aberta em `http://localhost:3000` em tela cheia (F11 no navegador).
2. **Usem o botão 'Resetar Demo':** Caso queiram treinar antes ou precisem demonstrar mais de uma vez durante as perguntas da banca, basta clicar em "Resetar Demo" no canto superior direito.
3. **Resiliência do Hardware:** Se o computador da apresentação não tiver Windows Hello configurado, o sistema possui detecção automática e permite demonstrar através do simulador integrado sem que a apresentação trave.
