/**
 * NexusPay Treasury Portal - Frontend WebAuthn & FIDO2 Controller
 * Gerencia a comunicação com a WebAuthn API nativa do navegador e endpoints do backend.
 */

// Estado global da aplicação
let appState = {
  currentUser: null,
  users: [],
  transfers: [],
  auditLogs: [],
  selectedTransfer: null,
};

// =========================================================================
// INICIALIZAÇÃO
// =========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  checkWebAuthnSupport();
  await loadState();
  setupUserSelectorListener();
});

// Verifica suporte nativo do navegador à WebAuthn API
function checkWebAuthnSupport() {
  const isSupported = window.SimpleWebAuthnBrowser && window.SimpleWebAuthnBrowser.browserSupportsWebAuthn();
  const hardwareLabel = document.getElementById('detectedHardware');
  
  if (!isSupported) {
    if (hardwareLabel) {
      hardwareLabel.innerHTML = '<span class="text-rose-400 font-semibold">Navegador não suporta WebAuthn nativo</span>';
    }
    console.warn('Este navegador não suporta a WebAuthn API nativamente.');
  } else {
    // Detecta plataforma aproximada
    const ua = navigator.userAgent;
    let os = 'Dispositivo FIDO2 Seguro';
    if (ua.includes('Windows')) os = 'Windows Hello (Biometria / PIN TPM)';
    else if (ua.includes('Macintosh') || ua.includes('iPhone')) os = 'Apple Touch ID / Face ID (Secure Enclave)';
    else if (ua.includes('Android')) os = 'Android Biometrics (TEE)';
    else if (ua.includes('Linux')) os = 'FIDO2 Security Key / Biometrics';

    if (hardwareLabel) {
      hardwareLabel.innerText = os;
    }
  }
}

// Carrega estado completo do servidor
async function loadState() {
  try {
    const res = await fetch('/api/state');
    const data = await res.json();

    appState.currentUser = data.currentUser;
    appState.users = data.users;
    appState.transfers = data.transfers;
    appState.auditLogs = data.auditLogs;

    renderHeader();
    renderUserSelector();
    renderTransfers();
    renderEnrollmentTab();
    renderAuditLogs();
    updateMetrics();
  } catch (error) {
    console.error('Erro ao carregar estado do servidor:', error);
  }
}

// =========================================================================
// RENDERIZAÇÃO DE COMPONENTES
// =========================================================================

// Atualiza cabeçalho e badges do Diretor
function renderHeader() {
  const { currentUser } = appState;
  if (!currentUser) return;

  const headerDirectorName = document.getElementById('headerDirectorName');
  const headerDirectorRole = document.getElementById('headerDirectorRole');
  const userBiometricBadge = document.getElementById('userBiometricBadge');

  if (headerDirectorName) headerDirectorName.innerText = currentUser.displayName;
  if (headerDirectorRole) headerDirectorRole.innerText = currentUser.role;

  if (userBiometricBadge) {
    if (currentUser.hasPasskey) {
      userBiometricBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      userBiometricBadge.innerHTML = `
        <i class="ph-bold ph-fingerprint text-base text-emerald-400"></i>
        <span>Biometria Vinculada (${currentUser.passkeysCount} chave${currentUser.passkeysCount > 1 ? 's' : ''})</span>
      `;
    } else {
      userBiometricBadge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse';
      userBiometricBadge.innerHTML = `
        <i class="ph-bold ph-warning-circle text-base"></i>
        <span>Biometria Pendente de Registro</span>
      `;
    }
  }

  // Atualiza ponto de status na aba de registro
  const enrollmentStatusDot = document.getElementById('enrollmentStatusDot');
  if (enrollmentStatusDot) {
    enrollmentStatusDot.className = currentUser.hasPasskey ? 'w-2 h-2 rounded-full bg-emerald-400' : 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
  }
}

// Atualiza o select de Diretores
function renderUserSelector() {
  const selector = document.getElementById('userSelector');
  if (!selector) return;

  selector.innerHTML = '';
  appState.users.forEach((user) => {
    const option = document.createElement('option');
    option.value = user.id;
    option.innerText = `${user.displayName} - ${user.role} ${user.hasPasskey ? '✓ Biometria' : '(Sem Biometria)'}`;
    if (user.id === appState.currentUser.id) {
      option.selected = true;
    }
    selector.appendChild(option);
  });
}

// Configura o evento de troca de usuário
function setupUserSelectorListener() {
  const selector = document.getElementById('userSelector');
  if (!selector) return;

  selector.addEventListener('change', async (e) => {
    const userId = e.target.value;
    if (!userId) return;

    try {
      const res = await fetch('/api/users/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        await loadState();
      }
    } catch (err) {
      console.error('Erro ao trocar diretor:', err);
    }
  });
}

// Atualiza os cards das métricas
function updateMetrics() {
  const pendingTransfers = appState.transfers.filter((t) => t.status === 'PENDENTE');
  const pendingCount = pendingTransfers.length;
  const pendingTotal = pendingTransfers.reduce((acc, t) => acc + t.amount, 0);

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(pendingTotal);

  const metricAmount = document.getElementById('metricPendingAmount');
  const metricCount = document.getElementById('metricPendingCount');
  const badgePendingTransfersCount = document.getElementById('badgePendingTransfersCount');

  if (metricAmount) metricAmount.innerText = formattedTotal;
  if (metricCount) metricCount.innerHTML = `<i class="ph ph-clock"></i> ${pendingCount} transferências aguardando biometria`;
  if (badgePendingTransfersCount) {
    badgePendingTransfersCount.innerText = pendingCount;
    badgePendingTransfersCount.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
}

// Renderiza a lista de transferências
function renderTransfers() {
  const container = document.getElementById('transfersList');
  if (!container) return;

  if (appState.transfers.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-slate-400">Nenhuma transferência cadastrada.</div>';
    return;
  }

  container.innerHTML = appState.transfers
    .map((transfer) => {
      const isApproved = transfer.status === 'APROVADA';
      const currentUserHasPasskey = appState.currentUser && appState.currentUser.hasPasskey;

      return `
      <div class="transition-card p-5 rounded-2xl bg-[#0b142c] border ${isApproved ? 'border-emerald-500/40' : 'border-slate-800'} relative overflow-hidden">
        
        <!-- Indicador de Status Superior -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs text-slate-400 font-bold">${transfer.id}</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              isApproved
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
            }">
              ${isApproved ? '✓ APROVADA COM BIOMETRIA' : 'AGUARDANDO ASSINATURA FIDO2'}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 font-semibold tracking-wide flex items-center gap-1">
              <i class="ph ph-shield-warning text-xs"></i>
              ${transfer.riskLevel}
            </span>
          </div>
        </div>

        <!-- Conteúdo Principal -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 items-center">
          
          <!-- Favorecido e Dados Bancários -->
          <div class="md:col-span-6 space-y-1">
            <span class="text-xs text-slate-400 block font-medium">Favorecido (Beneficiário)</span>
            <h4 class="text-base font-bold text-white tracking-tight">${transfer.beneficiary}</h4>
            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span class="font-mono">${transfer.cnpj}</span>
              <span>&bull;</span>
              <span>${transfer.bank}</span>
              <span>&bull;</span>
              <span class="font-mono">${transfer.account}</span>
            </div>
            <p class="text-xs text-slate-300 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <span class="text-slate-400 font-semibold">Finalidade:</span> ${transfer.description}
            </p>
          </div>

          <!-- Valor e Alerta -->
          <div class="md:col-span-3 text-left md:text-right">
            <span class="text-xs text-slate-400 block font-medium">Valor da Transferência</span>
            <span class="text-2xl font-black text-amber-400 tracking-tight block mt-0.5">${transfer.amountFormatted}</span>
            <span class="text-[11px] text-slate-400 mt-1 block">Liquidação TED/PIX Corporativo</span>
          </div>

          <!-- Ação de Aprovação -->
          <div class="md:col-span-3 flex flex-col items-stretch md:items-end justify-center gap-2">
            ${
              isApproved
                ? `
                <div class="text-right w-full">
                  <div class="text-xs font-semibold text-emerald-400 flex items-center md:justify-end gap-1.5">
                    <i class="ph-bold ph-seal-check text-base"></i>
                    <span>Assinada por: ${transfer.approvedBy?.name || 'Diretor'}</span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono block mt-0.5">
                    ${new Date(transfer.approvedAt).toLocaleTimeString('pt-BR')} - FIDO2 Chip Validado
                  </span>
                  <button onclick="viewReceipt('${transfer.id}')" class="mt-2 text-xs text-slate-300 hover:text-white underline font-medium">
                    Ver Comprovante Criptográfico
                  </button>
                </div>
              `
                : `
                <button onclick="openApprovalModal('${transfer.id}')" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer">
                  <i class="ph-bold ph-fingerprint text-base"></i>
                  <span>Aprovar com Biometria</span>
                </button>
                ${
                  !currentUserHasPasskey
                    ? `
                  <span class="text-[10px] text-amber-300/90 text-center flex items-center justify-center gap-1">
                    <i class="ph ph-info"></i> Diretor sem biometria. Vá na Aba 2.
                  </span>
                `
                    : ''
                }
              `
            }
          </div>

        </div>

      </div>
    `;
    })
    .join('');
}

// Renderiza a aba de Onboarding / Cadastro de Biometria
function renderEnrollmentTab() {
  const { currentUser } = appState;
  if (!currentUser) return;

  const enrollDirectorName = document.getElementById('enrollDirectorName');
  const enrollDirectorEmail = document.getElementById('enrollDirectorEmail');
  const enrollDirectorRole = document.getElementById('enrollDirectorRole');
  const registeredKeysCount = document.getElementById('registeredKeysCount');
  const credentialsList = document.getElementById('credentialsList');

  if (enrollDirectorName) enrollDirectorName.value = currentUser.displayName;
  if (enrollDirectorEmail) enrollDirectorEmail.value = currentUser.username;
  if (enrollDirectorRole) enrollDirectorRole.value = currentUser.role;

  if (registeredKeysCount) {
    registeredKeysCount.innerText = `${currentUser.passkeysCount} vinculada${currentUser.passkeysCount > 1 ? 's' : ''}`;
  }

  if (credentialsList) {
    if (currentUser.passkeys.length === 0) {
      credentialsList.innerHTML = `
        <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
          <i class="ph ph-fingerprint-slash text-2xl text-slate-500 mb-1"></i>
          <p class="text-xs text-slate-400 font-medium">Nenhum hardware biométrico vinculado para este Diretor.</p>
          <p class="text-[11px] text-slate-500 mt-1">Marque a caixa de LGPD ao lado e clique em Vincular Biometria.</p>
        </div>
      `;
    } else {
      credentialsList.innerHTML = currentUser.passkeys
        .map(
          (k, idx) => `
          <div class="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2.5">
              <i class="ph-bold ph-shield-check text-emerald-400 text-base"></i>
              <div>
                <span class="text-slate-200 font-semibold block">Hardware FIDO2 #${idx + 1} (${k.deviceType})</span>
                <span class="text-[10px] font-mono text-slate-400 block truncate max-w-[200px]">ID: ${k.id}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">Ativa</span>
          </div>
        `
        )
        .join('');
    }
  }
}

// Renderiza a tabela de logs de auditoria
function renderAuditLogs() {
  const tbody = document.getElementById('auditLogsBody');
  if (!tbody) return;

  if (appState.auditLogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-500">Nenhum log registrado.</td></tr>';
    return;
  }

  tbody.innerHTML = appState.auditLogs
    .map((log) => {
      let severityClass = 'text-slate-400';
      if (log.severity === 'SUCCESS' || log.severity === 'CRITICAL_SUCCESS') severityClass = 'text-emerald-400 font-bold';
      if (log.severity === 'WARNING') severityClass = 'text-amber-400 font-bold';
      if (log.severity === 'ERROR') severityClass = 'text-rose-400 font-bold';

      const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');

      return `
      <tr class="hover:bg-slate-900/50">
        <td class="py-2.5 px-3 text-slate-400">${time}</td>
        <td class="py-2.5 px-3 text-slate-300 font-semibold">${log.event}</td>
        <td class="py-2.5 px-3 text-slate-400">${log.detail}</td>
        <td class="py-2.5 px-3 ${severityClass}">${log.severity}</td>
      </tr>
    `;
    })
    .join('');
}

// =========================================================================
// AÇÃO 1: REGISTRO DE BIOMETRIA DO DISPOSITIVO (WEBAUTHN REGISTRATION)
// =========================================================================

async function handleBiometricEnrollment(event) {
  event.preventDefault();

  const termsAccepted = document.getElementById('termsAccepted');
  if (!termsAccepted || !termsAccepted.checked) {
    alert('É obrigatório aceitar os Termos de Proteção de Dados e Registro em Hardware Seguro conforme a LGPD.');
    return;
  }

  const btn = document.getElementById('btnEnrollBiometrics');
  const btnText = document.getElementById('btnEnrollText');
  const originalText = btnText.innerText;

  try {
    btn.disabled = true;
    btnText.innerText = '1/3 Solicitando Desafio FIDO2 ao Servidor...';

    // 1. Obter opções e challenge do servidor
    const optRes = await fetch('/api/auth/register-options', { method: 'POST' });
    if (!optRes.ok) {
      const err = await optRes.json();
      throw new Error(err.error || 'Falha ao gerar desafio de registro.');
    }
    const options = await optRes.json();

    btnText.innerText = '2/3 Toque no leitor biométrico (Windows Hello / Touch ID)...';

    // 2. Chamar a WebAuthn API nativa do navegador
    let attestationResponse;
    let isDemoSimulation = false;

    try {
      attestationResponse = await SimpleWebAuthnBrowser.startRegistration({ optionsJSON: options });
    } catch (webAuthnError) {
      console.warn('WebAuthn nativo gerou exceção:', webAuthnError);

      const useSim = confirm(
        `O leitor biométrico nativo retornou: "${webAuthnError.message || webAuthnError}".\n\n` +
        `Isso ocorre comumente se o Windows Hello / Touch ID não estiver cadastrado no Windows ou se o prompt for fechado.\n\n` +
        `Deseja ativar o "Simulador de Hardware TPM / Secure Enclave (Modo Apresentação)" para demonstrar a vinculação criptográfica e a aprovação de R$ 1 Milhão?`
      );

      if (useSim) {
        isDemoSimulation = true;
        attestationResponse = { isDemoSimulation: true };
      } else {
        throw new Error(`Registro cancelado pelo usuário ou sem hardware biométrico.`);
      }
    }

    btnText.innerText = '3/3 Validando assinatura criptográfica no servidor...';

    // 3. Enviar a credencial (Chave Pública) para validação e armazenamento no servidor
    const verifyRes = await fetch('/api/auth/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attestationResponse),
    });

    const verifyResult = await verifyRes.json();
    if (!verifyRes.ok || !verifyResult.verified) {
      throw new Error(verifyResult.error || 'Falha na verificação da assinatura do hardware.');
    }

    // Sucesso!
    await loadState();
    alert('🎉 SUCESSO!\n\nBiometria vinculada com sucesso ao processador seguro do seu dispositivo (TPM/Secure Enclave)!\n\nAgora este Diretor está apto a aprovar transferências acima de R$ 1 Milhão.');
    switchTab('transfersTab');
  } catch (error) {
    console.error('Erro no fluxo de registro biométrico:', error);
    alert(`Atenção no Registro Biométrico:\n${error.message}`);
  } finally {
    btn.disabled = false;
    btnText.innerText = originalText;
  }
}

// =========================================================================
// AÇÃO 2: APROVAÇÃO BIOMÉTRICA DE TRANSFERÊNCIA (> R$ 1 MILHÃO)
// =========================================================================

function openApprovalModal(transferId) {
  const transfer = appState.transfers.find((t) => t.id === transferId);
  if (!transfer) return;

  if (!appState.currentUser || !appState.currentUser.hasPasskey) {
    alert(`O Diretor ${appState.currentUser?.displayName} ainda não possui biometria vinculada.\n\nPor favor, vá para a Aba 2 ("Vincular Biometria do Dispositivo") primeiro para registrar seu Windows Hello ou Touch ID.`);
    switchTab('enrollmentTab');
    return;
  }

  appState.selectedTransfer = transfer;

  document.getElementById('modalTransferId').innerText = transfer.id;
  document.getElementById('modalBeneficiary').innerText = transfer.beneficiary;
  document.getElementById('modalCnpj').innerText = transfer.cnpj;
  document.getElementById('modalBank').innerText = transfer.bank;
  document.getElementById('modalAccount').innerText = transfer.account;
  document.getElementById('modalAmount').innerText = transfer.amountFormatted;
  document.getElementById('modalDescription').innerText = transfer.description;

  openModal('transferModal');
}

async function executeBiometricApproval() {
  const transfer = appState.selectedTransfer;
  if (!transfer) return;

  const btn = document.getElementById('btnAuthorizeWithBiometrics');
  const btnText = document.getElementById('btnAuthorizeText');
  const originalText = btnText.innerText;

  try {
    btn.disabled = true;
    btnText.innerText = '1/3 Solicitando Desafio da Transação...';

    // 1. Obter opções de autenticação FIDO2 do servidor vinculadas a esta transferência
    const optRes = await fetch(`/api/transfers/${transfer.id}/approve-options`, { method: 'POST' });
    if (!optRes.ok) {
      const err = await optRes.json();
      throw new Error(err.error || 'Falha ao solicitar autorização para esta transferência.');
    }
    const data = await optRes.json();

    btnText.innerText = '2/3 Abra o leitor biométrico (Windows Hello / Touch ID)...';

    // 2. Chamar o prompt nativo de biometria via WebAuthn
    let assertionResponse;
    let isDemoSimulation = false;

    try {
      assertionResponse = await SimpleWebAuthnBrowser.startAuthentication({ optionsJSON: data.options });
    } catch (webAuthnError) {
      console.warn('WebAuthn authentication gerou exceção:', webAuthnError);

      const useSim = confirm(
        `O leitor biométrico retornou: "${webAuthnError.message || webAuthnError}".\n\n` +
        `Deseja autorizar via "Simulador de Assinatura TPM / Hardware Seguro (Modo Apresentação)" para demonstrar a emissão do comprovante criptográfico e a aprovação de R$ ${transfer.amountFormatted}?`
      );

      if (useSim) {
        isDemoSimulation = true;
        assertionResponse = {
          id: appState.currentUser.passkeys[0]?.id || 'demo_cred_id',
          isDemoSimulation: true,
        };
      } else {
        throw new Error(`Aprovação cancelada ou sem biometria.`);
      }
    }

    btnText.innerText = '3/3 Validando prova criptográfica no servidor...';

    // 3. Enviar a assinatura criptográfica gerada pelo TPM para verificação no servidor
    const verifyRes = await fetch(`/api/transfers/${transfer.id}/approve-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assertionResponse),
    });

    const verifyResult = await verifyRes.json();
    if (!verifyRes.ok || !verifyResult.verified) {
      throw new Error(verifyResult.error || 'Assinatura biométrica rejeitada pelo servidor.');
    }

    // Sucesso! Fecha modal de aprovação e exibe o comprovante criptográfico
    closeModal('transferModal');
    await loadState();
    showReceiptModal(verifyResult.transfer, verifyResult.proof);
  } catch (error) {
    console.error('Erro na aprovação biométrica:', error);
    alert(`Erro na Aprovação:\n${error.message}`);
  } finally {
    btn.disabled = false;
    btnText.innerText = originalText;
  }
}

// Exibe o Comprovante Oficial Criptográfico
function showReceiptModal(transfer, proof) {
  const container = document.getElementById('receiptContent');
  if (!container) return;

  const dateFormatted = new Date(transfer.approvedAt).toLocaleString('pt-BR');

  container.innerHTML = `
    <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
      <div class="flex justify-between items-center pb-2 border-b border-slate-800/80">
        <span class="text-slate-400">Identificador da Transferência:</span>
        <span class="font-mono font-bold text-white">${transfer.id}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-slate-400">Valor Efetivado:</span>
        <span class="text-base font-bold text-amber-400">${transfer.amountFormatted}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-slate-400">Favorecido:</span>
        <span class="text-slate-200 font-semibold">${transfer.beneficiary}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-slate-400">Diretor Assinante:</span>
        <span class="text-emerald-400 font-semibold">${transfer.approvedBy.name} (${transfer.approvedBy.role})</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-slate-400">Data e Hora da Assinatura:</span>
        <span class="text-slate-300 font-mono">${dateFormatted}</span>
      </div>
    </div>

    <!-- Prova Criptográfica FIDO2 Imutável -->
    <div class="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1.5 font-mono text-[11px]">
      <div class="flex items-center gap-2 text-emerald-400 font-bold mb-1">
        <i class="ph ph-lock-key"></i>
        <span>Prova Criptográfica de Hardware (Imutável)</span>
      </div>
      <div class="text-slate-400 truncate">
        <strong>Hash da Assinatura Digital (ECDSA/Ed25519):</strong>
        <p class="text-slate-300 text-[10px] break-all select-all bg-slate-900 p-1.5 rounded mt-0.5">${proof.signatureHex}</p>
      </div>
      <div class="grid grid-cols-2 gap-2 pt-1 text-slate-400">
        <div>Contador FIDO2 Anti-Replay: <strong class="text-white">${proof.authenticatorCounter}</strong></div>
        <div>Biometria Validada no Chip: <strong class="text-emerald-400">SIM (UV=1)</strong></div>
      </div>
      <div class="text-slate-500 text-[10px] pt-1">
        RP ID Vínculo: ${proof.rpID} &bull; Origem Segura: ${proof.origin}
      </div>
    </div>
  `;

  openModal('receiptModal');
}

// Permite visualizar comprovante de transferências já aprovadas
function viewReceipt(transferId) {
  const transfer = appState.transfers.find((t) => t.id === transferId);
  if (!transfer || !transfer.signatureProof) return;
  showReceiptModal(transfer, transfer.signatureProof);
}

// =========================================================================
// CADASTRO DE NOVO DIRETOR E RESET
// =========================================================================

async function handleCreateDirector(event) {
  event.preventDefault();

  const displayName = document.getElementById('newDirectorName').value;
  const username = document.getElementById('newDirectorEmail').value;
  const role = document.getElementById('newDirectorRole').value;

  try {
    const res = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, username, role }),
    });

    if (res.ok) {
      closeModal('newDirectorModal');
      await loadState();
      alert(`Diretor ${displayName} cadastrado com sucesso! Agora vincule a biometria dele na Aba 2.`);
      switchTab('enrollmentTab');
    }
  } catch (err) {
    console.error('Erro ao criar diretor:', err);
    alert('Falha ao cadastrar diretor.');
  }
}

async function resetDemo() {
  if (!confirm('Deseja reiniciar todas as transferências pendentes para demonstrar novamente?')) return;

  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    if (res.ok) {
      await loadState();
      alert('Demonstração resetada com sucesso! As transferências voltaram para o estado PENDENTE.');
    }
  } catch (err) {
    console.error('Erro ao resetar demonstração:', err);
  }
}

async function refreshAuditLogs() {
  await loadState();
}

// =========================================================================
// NAVEGAÇÃO DE ABAS E MODAIS
// =========================================================================

function switchTab(tabId) {
  // Esconde todas as abas
  document.querySelectorAll('.tab-content').forEach((tab) => {
    tab.classList.add('hidden');
    tab.classList.remove('block');
  });

  // Remove estado ativo de todos os botões
  document.querySelectorAll('.tab-button').forEach((btn) => {
    btn.classList.remove('active');
  });

  // Mostra a aba selecionada
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.classList.remove('hidden');
    selectedTab.classList.add('block');
  }

  // Ativa o botão correspondente
  if (tabId === 'transfersTab') document.getElementById('tabBtnTransfers')?.classList.add('active');
  if (tabId === 'enrollmentTab') document.getElementById('tabBtnEnrollment')?.classList.add('active');
  if (tabId === 'inspectorTab') document.getElementById('tabBtnInspector')?.classList.add('active');
  if (tabId === 'reportTab') document.getElementById('tabBtnReport')?.classList.add('active');
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}
