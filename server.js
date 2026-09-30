const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { isoBase64URL } = require('@simplewebauthn/server/helpers');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilita suporte a proxies reversos de nuvem (Render, Railway, Fly.io, etc)
app.set('trust proxy', 1);

// Configuração de Sessão e JSON
app.use(express.json());
app.use(cors());
app.use(
  session({
    secret: 'nexuspay-secret-key-fido2-production-2026',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Permite rodar em localhost sem HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
    },
  })
);

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// =========================================================================
// BANCO DE DADOS EM MEMÓRIA (Com suporte a Múltiplos Usuários e Persistência)
// =========================================================================

// Usuários pré-cadastrados (Diretores da Fintech)
const INITIAL_USERS = [
  {
    id: 'user_roberto_cfo',
    username: 'roberto.almeida@nexuspay.com.br',
    displayName: 'Dr. Roberto Almeida',
    role: 'Diretor Financeiro (CFO)',
    passkeys: [],
  },
  {
    id: 'user_helena_coo',
    username: 'helena.castro@nexuspay.com.br',
    displayName: 'Dra. Helena Castro',
    role: 'Diretora de Operações (COO)',
    passkeys: [],
  },
];

// Transferências Bancárias Pendentes de Alto Valor (> R$ 1 Milhão)
const INITIAL_TRANSFERS = [
  {
    id: 'TRX-94821',
    beneficiary: 'Datacenter Cloud do Brasil S.A.',
    cnpj: '12.345.678/0001-90',
    bank: '341 - Banco Itaú Unibanco',
    account: 'Ag 0452 | C/C 89120-4',
    amount: 2450000.0,
    amountFormatted: 'R$ 2.450.000,00',
    description: 'Aquisição de Clusters de IA e Servidores Bare-Metal de Baixa Latência',
    category: 'Infraestrutura de TI',
    status: 'PENDENTE',
    riskLevel: 'CRÍTICO (> R$ 1 MILHÃO)',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null,
    signatureProof: null,
  },
  {
    id: 'TRX-94822',
    beneficiary: 'Investimentos & Participações Alpha S.A.',
    cnpj: '98.765.432/0001-11',
    bank: '237 - Banco Bradesco',
    account: 'Ag 1234 | C/C 55432-1',
    amount: 5800000.0,
    amountFormatted: 'R$ 5.800.000,00',
    description: 'Distribuição de Dividendos e Juros sobre Capital Próprio Q3',
    category: 'Tesouraria Corporativa',
    status: 'PENDENTE',
    riskLevel: 'CRÍTICO (> R$ 1 MILHÃO)',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null,
    signatureProof: null,
  },
  {
    id: 'TRX-94823',
    beneficiary: 'Global Exchange Liquidity Ltd.',
    cnpj: '45.678.901/0001-23',
    bank: '033 - Banco Santander',
    account: 'Ag 0001 | C/C 77889-0',
    amount: 1200000.0,
    amountFormatted: 'R$ 1.200.000,00',
    description: 'Liquidação de Contrato de Câmbio e Proteção Cambial (Hedge USD/BRL)',
    category: 'Operações de Câmbio',
    status: 'PENDENTE',
    riskLevel: 'CRÍTICO (> R$ 1 MILHÃO)',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null,
    signatureProof: null,
  },
];

let users = JSON.parse(JSON.stringify(INITIAL_USERS));
let transfers = JSON.parse(JSON.stringify(INITIAL_TRANSFERS));
let auditLogs = [
  {
    id: 'LOG-001',
    timestamp: new Date().toISOString(),
    event: 'PORTAL_INITIALIZATION',
    detail: 'Portal de Tesouraria NexusPay inicializado com protocolo FIDO2/WebAuthn ativo.',
    severity: 'INFO',
  },
];

// Helper para obter Host, Origin e RP ID dinamicamente em qualquer nuvem
function getOriginAndRPID(req) {
  if (req.headers.origin) {
    try {
      const parsedUrl = new URL(req.headers.origin);
      return {
        origin: req.headers.origin,
        rpID: parsedUrl.hostname,
        rpName: 'NexusPay - Portal Executivo de Tesouraria',
      };
    } catch (e) {}
  }
  const host = req.get('host') || `localhost:${PORT}`;
  const hostname = host.split(':')[0]; // Remove a porta para o RP ID
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const origin = `${protocol}://${host}`;
  return { origin, rpID: hostname, rpName: 'NexusPay - Portal Executivo de Tesouraria' };
}

// Log de Auditoria
function logAudit(event, detail, severity = 'INFO', metadata = {}) {
  const logEntry = {
    id: `LOG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    event,
    detail,
    severity,
    metadata,
  };
  auditLogs.unshift(logEntry);
  if (auditLogs.length > 50) auditLogs.pop();
  return logEntry;
}

// =========================================================================
// ROTAS DE CONSULTA E ESTADO
// =========================================================================

// Retorna estado do sistema, usuário ativo e lista de diretores
app.get('/api/state', (req) => {
  const currentUserId = req.session.userId || users[0].id;
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  req.res.json({
    currentUser: {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      role: currentUser.role,
      hasPasskey: currentUser.passkeys.length > 0,
      passkeysCount: currentUser.passkeys.length,
      passkeys: currentUser.passkeys.map((p) => ({
        id: p.id,
        deviceType: p.deviceType,
        backedUp: p.backedUp,
        createdAt: p.createdAt,
      })),
    },
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      hasPasskey: u.passkeys.length > 0,
    })),
    transfers,
    auditLogs: auditLogs.slice(0, 15),
  });
});

// Troca de usuário ativo na sessão
app.post('/api/users/switch', (req, res) => {
  const { userId } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  req.session.userId = user.id;
  logAudit('USER_SWITCH', `Sessão alternada para o diretor: ${user.displayName} (${user.role})`, 'INFO');
  res.json({ success: true, user });
});

// Criação de novo usuário / diretor
app.post('/api/users/create', (req, res) => {
  const { username, displayName, role } = req.body;
  if (!username || !displayName) {
    return res.status(400).json({ error: 'Nome e e-mail corporativo são obrigatórios.' });
  }

  const existing = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    req.session.userId = existing.id;
    return res.json({ success: true, user: existing, message: 'Diretor já existente selecionado.' });
  }

  const newUser = {
    id: `user_${Date.now().toString(36)}`,
    username,
    displayName,
    role: role || 'Diretor Executivo',
    passkeys: [],
  };

  users.push(newUser);
  req.session.userId = newUser.id;
  logAudit('USER_CREATED', `Novo diretor cadastrado: ${displayName} (${username})`, 'INFO');
  res.json({ success: true, user: newUser });
});

// Reset de demonstração
app.post('/api/demo/reset', (req, res) => {
  transfers = JSON.parse(JSON.stringify(INITIAL_TRANSFERS));
  logAudit('DEMO_RESET', 'Transferências resetadas para o estado inicial para nova demonstração.', 'WARNING');
  res.json({ success: true, message: 'Demonstração resetada com sucesso!' });
});

// =========================================================================
// ROTAS WEBAUTHN: REGISTRO DE BIOMETRIA DO DISPOSITIVO (FIDO2)
// =========================================================================

// Passo 1 do Registro: Gerar Opções e Desafio (Challenge)
app.post('/api/auth/register-options', async (req, res) => {
  try {
    const { origin, rpID, rpName } = getOriginAndRPID(req);
    const userId = req.session.userId || users[0].id;
    const user = users.find((u) => u.id === userId) || users[0];

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: isoBase64URL.toBuffer(isoBase64URL.fromBuffer(Buffer.from(user.id))),
      userName: user.username,
      userDisplayName: user.displayName,
      attestationType: 'none', // Privacidade máxima: não expõe fabricante do hardware
      excludeCredentials: user.passkeys.map((passkey) => ({
        id: passkey.id,
        transports: passkey.transports,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Força o leitor do próprio dispositivo (Touch ID, Windows Hello, Face ID)
        userVerification: 'required', // Exige explicitamente validação biométrica ou PIN do hardware
        residentKey: 'preferred',
      },
    });

    // Armazenar o desafio na sessão para validar no passo 2
    req.session.currentChallenge = options.challenge;
    req.session.registeringUserId = user.id;

    logAudit(
      'CHALLENGE_GENERATED',
      `Desafio criptográfico gerado para registro biométrico de ${user.displayName}.`,
      'INFO',
      { challengePreview: options.challenge.substring(0, 12) + '...' }
    );

    res.json(options);
  } catch (error) {
    console.error('Erro ao gerar opções de registro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Passo 2 do Registro: Validar a Assinatura do Hardware e Salvar a Chave Pública
app.post('/api/auth/register-verify', async (req, res) => {
  try {
    const { origin, rpID } = getOriginAndRPID(req);
    const body = req.body;
    const expectedChallenge = req.session.currentChallenge;
    const userId = req.session.registeringUserId || req.session.userId;
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado para este registro.' });
    }

    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Desafio expirado ou inexistente. Reinicie o registro.' });
    }

    let verification;
    let credential;
    let credentialDeviceType = 'singleDevice';
    let credentialBackedUp = false;

    if (body.isDemoSimulation) {
      // Modo Demonstração / Simulador de Chip Seguro TPM Educacional
      const mockCredId = `demo_tpm_${Date.now().toString(36)}`;
      credential = {
        id: mockCredId,
        publicKey: Buffer.from(`mock_ecdsa_pubkey_${Date.now()}`),
        counter: 1,
        transports: ['internal'],
      };
      credentialDeviceType = 'platform_simulated_tpm';
      verification = { verified: true };
    } else {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      });

      if (verification.verified && verification.registrationInfo) {
        credential = verification.registrationInfo.credential;
        credentialDeviceType = verification.registrationInfo.credentialDeviceType;
        credentialBackedUp = verification.registrationInfo.credentialBackedUp;
      }
    }

    if (verification.verified && credential) {
      // Salvamos APENAS a Chave Pública e o ID da credencial!
      // A CHAVE PRIVADA E A BIOMETRIA FICAM 100% RETIDAS NO HARDWARE DO DISPOSITIVO (TPM/SECURE ENCLAVE)
      const newPasskey = {
        id: credential.id,
        publicKey: isoBase64URL.fromBuffer(credential.publicKey),
        counter: credential.counter || 0,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.transports || ['internal'],
        createdAt: new Date().toISOString(),
      };

      // Adiciona a passkey ao usuário
      user.passkeys.push(newPasskey);
      req.session.currentChallenge = undefined;

      logAudit(
        'BIOMETRIC_ENROLLED',
        `Biometria vinculada com sucesso para ${user.displayName}. Hardware registrado no Secure Enclave / TPM.`,
        'SUCCESS',
        {
          credentialId: credential.id.substring(0, 16) + '...',
          deviceType: credentialDeviceType,
        }
      );

      res.json({
        verified: true,
        message: 'Biometria vinculada com sucesso ao dispositivo seguro!',
        credential: {
          id: credential.id,
          deviceType: credentialDeviceType,
        },
      });
    } else {
      res.status(400).json({ verified: false, error: 'Falha na validação criptográfica do registro biométrico.' });
    }
  } catch (error) {
    console.error('Erro ao verificar registro:', error);
    res.status(400).json({ verified: false, error: error.message });
  }
});

// =========================================================================
// ROTAS WEBAUTHN: APROVAÇÃO BIOMÉTRICA DE TRANSFERÊNCIA DE ALTO VALOR
// =========================================================================

// Passo 1 da Aprovação: Gerar desafio WebAuthn vinculado à transação
app.post('/api/transfers/:id/approve-options', async (req, res) => {
  try {
    const { origin, rpID } = getOriginAndRPID(req);
    const { id } = req.params;
    const transfer = transfers.find((t) => t.id === id);

    if (!transfer) {
      return res.status(404).json({ error: 'Transferência bancária não encontrada.' });
    }

    if (transfer.status === 'APROVADA') {
      return res.status(400).json({ error: 'Esta transferência já foi aprovada anteriormente.' });
    }

    const userId = req.session.userId || users[0].id;
    const user = users.find((u) => u.id === userId);

    if (!user || user.passkeys.length === 0) {
      return res.status(400).json({
        error: 'Nenhuma credencial biométrica vinculada para este Diretor. Registre a biometria antes de aprovar.',
      });
    }

    // Gerar opções de autenticação FIDO2
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required', // Obriga verificação de usuário (biometria ou PIN seguro)
      allowCredentials: user.passkeys.map((p) => ({
        id: p.id,
        transports: p.transports,
      })),
    });

    // Armazenamos o desafio e o vínculo com a transação na sessão
    req.session.currentAuthChallenge = options.challenge;
    req.session.approvingTransferId = transfer.id;
    req.session.approvingUserId = user.id;

    logAudit(
      'TRANSFER_CHALLENGE_REQUEST',
      `Solicitação de aprovação biométrica para a transferência ${transfer.id} (${transfer.amountFormatted}). Desafio FIDO2 emitido.`,
      'WARNING',
      {
        transferId: transfer.id,
        amount: transfer.amount,
        beneficiary: transfer.beneficiary,
      }
    );

    res.json({
      options,
      transfer: {
        id: transfer.id,
        beneficiary: transfer.beneficiary,
        amountFormatted: transfer.amountFormatted,
        cnpj: transfer.cnpj,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar opções de aprovação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Passo 2 da Aprovação: Validar a assinatura biométrica e efetivar a transferência
app.post('/api/transfers/:id/approve-verify', async (req, res) => {
  try {
    const { origin, rpID } = getOriginAndRPID(req);
    const { id } = req.params;
    const body = req.body;
    const expectedChallenge = req.session.currentAuthChallenge;
    const transferId = req.session.approvingTransferId;
    const userId = req.session.approvingUserId || req.session.userId;

    if (id !== transferId) {
      return res.status(400).json({ error: 'Inconsistência entre a transferência solicitada e a validada.' });
    }

    const transfer = transfers.find((t) => t.id === id);
    if (!transfer) {
      return res.status(404).json({ error: 'Transferência não encontrada.' });
    }

    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não identificado.' });
    }

    // Localiza a credencial utilizada
    const passkey = user.passkeys.find((p) => p.id === body.id);
    if (!passkey) {
      return res.status(400).json({ error: 'Credencial biométrica não cadastrada no perfil do Diretor.' });
    }

    let verified = false;
    let newCounter = (passkey.counter || 0) + 1;
    let signatureHex = '';
    let clientDataJSON = {};
    let userVerified = true;

    if (body.isDemoSimulation) {
      verified = true;
      signatureHex = '3045022100e4b89327d9bf3c99026e6f54b6d088921cb9ec468b8b4081c72ea0b91e92c202204a91bcf80b629b3504ad03e62f012cf9cfcb1a29928425268c13f61765c9c771';
      clientDataJSON = {
        type: 'webauthn.get',
        challenge: expectedChallenge,
        origin,
        crossOrigin: false,
      };
    } else {
      const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: passkey.id,
          publicKey: isoBase64URL.toBuffer(passkey.publicKey),
          counter: passkey.counter,
          transports: passkey.transports,
        },
        requireUserVerification: true,
      });

      if (verification.verified) {
        verified = true;
        newCounter = verification.authenticationInfo.newCounter;
        signatureHex = Buffer.from(isoBase64URL.toBuffer(body.response.signature)).toString('hex');
        clientDataJSON = JSON.parse(Buffer.from(isoBase64URL.toBuffer(body.response.clientDataJSON)).toString('utf8'));
        userVerified = verification.authenticationInfo.userVerified;
      }
    }

    if (verified) {
      // Atualizar o contador da credencial (Proteção contra Replay Attack)
      passkey.counter = newCounter;

      // Atualizar o estado da transferência
      transfer.status = 'APROVADA';
      transfer.approvedAt = new Date().toISOString();
      transfer.approvedBy = {
        name: user.displayName,
        role: user.role,
        username: user.username,
      };

      // Comprovante Criptográfico Imutável
      transfer.signatureProof = {
        credentialId: passkey.id,
        signatureHex,
        clientDataJSON,
        authenticatorCounter: newCounter,
        userVerified,
        verifiedAt: new Date().toISOString(),
        origin,
        rpID,
        mode: body.isDemoSimulation ? 'SIMULADOR_TPM_EDUCACIONAL' : 'FIDO2_HARDWARE_REAL',
      };

      req.session.currentAuthChallenge = undefined;
      req.session.approvingTransferId = undefined;

      logAudit(
        'TRANSFER_APPROVED_BIOMETRIC',
        `TRANSFERÊNCIA AUTORIZADA: ${transfer.amountFormatted} aprovada com biometria por ${user.displayName}. Assinatura criptográfica válida.`,
        'CRITICAL_SUCCESS',
        {
          transferId: transfer.id,
          amount: transfer.amount,
          signer: user.displayName,
          counter: newCounter,
        }
      );

      res.json({
        verified: true,
        message: 'Transferência de alto valor aprovada com sucesso via autenticação biométrica!',
        transfer,
        proof: transfer.signatureProof,
      });
    } else {
      res.status(400).json({ verified: false, error: 'Assinatura biométrica inválida.' });
    }
  } catch (error) {
    console.error('Erro ao verificar aprovação biométrica:', error);
    res.status(400).json({ verified: false, error: error.message });
  }
});

// =========================================================================
// INICIALIZAÇÃO DO SERVIDOR
// =========================================================================
app.listen(PORT, () => {
  console.log('================================================================');
  console.log(`🚀 NexusPay Portal de Tesouraria FIDO2 / WebAuthn`);
  console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🔒 Protocolo WebAuthn ativo para autenticação biométrica local`);
  console.log('================================================================');
});
