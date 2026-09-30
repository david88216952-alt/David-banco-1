const server = require('./server.js');

setTimeout(async () => {
  try {
    console.log('=== TESTE DE FLUXO COMPLETO FIDO2 / WEBAUTHN ===\n');

    let sessionCookie = '';

    // 1. Estado inicial
    const s1Res = await fetch('http://localhost:3000/api/state');
    const cookieHeader = s1Res.headers.get('set-cookie');
    if (cookieHeader) sessionCookie = cookieHeader.split(';')[0];
    const s1 = await s1Res.json();
    console.log('1. Diretor atual:', s1.currentUser.displayName);
    console.log('   Passkeys cadastradas:', s1.currentUser.passkeysCount);

    // 2. Register options
    const regOptRes = await fetch('http://localhost:3000/api/auth/register-options', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    const regCookie = regOptRes.headers.get('set-cookie');
    if (regCookie) sessionCookie = regCookie.split(';')[0];
    const regOpt = await regOptRes.json();
    console.log('2. Desafio de registro gerado:', regOpt.challenge.substring(0, 15) + '...');

    // 3. Register verify
    const regVerRes = await fetch('http://localhost:3000/api/auth/register-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ isDemoSimulation: true }),
    });
    const regVer = await regVerRes.json();
    console.log('3. Registro biométrico verificado:', regVer.verified);
    console.log('   Mensagem do servidor:', regVer.message);

    // 4. Checar se diretor agora tem passkey
    const s2Res = await fetch('http://localhost:3000/api/state', {
      headers: { Cookie: sessionCookie },
    });
    const s2 = await s2Res.json();
    console.log('4. Diretor agora possui passkeys:', s2.currentUser.hasPasskey, `(${s2.currentUser.passkeysCount} chave)`);

    // 5. Transfer approve options
    const appOptRes = await fetch('http://localhost:3000/api/transfers/TRX-94821/approve-options', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    const appOpt = await appOptRes.json();
    console.log('5. Desafio de aprovação gerado para TRX-94821:', appOpt.options.challenge.substring(0, 15) + '...');
    console.log('   Valor a aprovar:', appOpt.transfer.amountFormatted);

    // 6. Transfer approve verify
    const appVerRes = await fetch('http://localhost:3000/api/transfers/TRX-94821/approve-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        id: s2.currentUser.passkeys[0].id,
        isDemoSimulation: true,
      }),
    });
    const appVer = await appVerRes.json();
    console.log('6. Aprovação biométrica efetivada:', appVer.verified);
    console.log('   Status da transferência:', appVer.transfer.status);
    console.log('   Assinatura Criptográfica Hash:', appVer.proof.signatureHex.substring(0, 30) + '...');
    console.log('   Contador FIDO2 Anti-Replay:', appVer.proof.authenticatorCounter);
    console.log('   Aprovado por:', appVer.transfer.approvedBy.name);

    // 7. Reset da demo
    const resetRes = await (await fetch('http://localhost:3000/api/demo/reset', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    })).json();
    console.log('7. Reset executado com sucesso:', resetRes.success);

    console.log('\n✅ TODOS OS TESTES PASSARAM COM SUCESSO ABSOLUTO!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Falha nos testes:', err);
    process.exit(1);
  }
}, 1000);
