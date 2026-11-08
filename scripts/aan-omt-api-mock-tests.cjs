const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const project = process.cwd();
const ts = require(path.join(project, 'node_modules/typescript'));
const patient = '11111111-1111-4111-8111-111111111111';
const booking = '22222222-2222-4222-8222-222222222222';
const therapist = '33333333-3333-4333-8333-333333333333';
const service = '44444444-4444-4444-8444-444444444444';
const declaration = '55555555-5555-4555-8555-555555555555';
const pack = '66666666-6666-4666-8666-666666666666';
const routes = {
  individual: 'src/app/api/manual-payment/declare/route.ts',
  pack: 'src/app/api/patient-pack/omt-declare/route.ts'
};
function makeDb(config, calls) {
  return {
    auth: { getUser: async token => {
      calls.tokens.push(token);
      return { data: { user: config.unauthorized ? null : { id: patient } }, error: null };
    } },
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() {
          if (table === 'profiles') return { data: { role: config.role || 'patient' }, error: null };
          if (table === 'bookings') return { data: config.booking || {
            id: booking, patient_id: patient, status: 'pending', price: 60,
            hold_expires_at: new Date(Date.now() + 600000).toISOString(),
            manual_payment_status: null, payment_provider: null,
            payment_transaction_id: null, patient_pack_id: null, payment_source: null
          }, error: null };
          throw Error('Unexpected table: ' + table);
        }
      };
    },
    async rpc(name, args) {
      calls.rpc.push({ name, args });
      if (config.rpcError) return { data: null, error: config.rpcError };
      return { data: config.rpcResult || (name === 'submit_omt_payment_declaration'
        ? [{ declaration_id: declaration, declaration_status: 'pending', declaration_submitted_at: '2026-11-02T10:00:00Z' }]
        : [{ declaration_id: declaration, pack_id: pack }]), error: null };
    }
  };
}
function loadRoute(file, config, calls) {
  const code = ts.transpileModule(fs.readFileSync(path.join(project, file), 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} };
  const mockedRequire = name => {
    if (name === '@supabase/supabase-js') return { createClient: () => makeDb(config, calls) };
    if (name === 'next/server') return { NextResponse: { json: (body, options) => Response.json(body, options) } };
    throw Error('Unexpected import: ' + name);
  };
  vm.runInNewContext('(function(require,module,exports,process,console,Date){' + code + '\n})',
    {}, { filename: file })(mockedRequire, module, module.exports,
      { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://mock.invalid', SUPABASE_SERVICE_ROLE_KEY: 'mock-only' } },
      { error() {} }, Date);
  return module.exports.POST;
}
async function check(label, kind, config, body, expectedStatus, verify) {
  const calls = { rpc: [], tokens: [] };
  const post = loadRoute(routes[kind], config, calls);
  const response = await post(new Request('http://localhost/mock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer simulated-token' },
    body: JSON.stringify(body)
  }));
  const data = await response.json();
  assert.equal(response.status, expectedStatus, `${label}: ${JSON.stringify(data)}`);
  verify(data, calls);
  console.log('PASS ' + label + ' — HTTP ' + response.status);
}
(async () => {
  const individualBody = { bookingId: booking, provider: 'omt', transactionReference: 'AAN-MOCK-ONLY' };
  const packBody = { therapistId: therapist, serviceId: service, transactionReference: 'AAN-MOCK-ONLY' };
  await check('Individual accepted', 'individual', {}, individualBody, 201, (data, calls) => {
    assert.equal(data.paymentConfirmed, false);
    assert.equal(data.status, 'under_review');
    assert.equal(calls.rpc.length, 1);
    assert.equal(calls.rpc[0].name, 'submit_omt_payment_declaration');
    assert.equal(calls.rpc[0].args.p_patient_id, patient);
    assert.equal(calls.rpc[0].args.p_booking_id, booking);
  });
  await check('Individual ineligible booking', 'individual', {
    booking: { id: booking, patient_id: patient, status: 'confirmed', price: 60 }
  }, individualBody, 409, (_data, calls) => assert.equal(calls.rpc.length, 0));
  await check('Individual duplicate reference', 'individual', {
    rpcError: { message: 'REFERENCE_ALREADY_DECLARED', code: 'P0001' }
  }, individualBody, 409, (data, calls) => {
    assert.equal(data.code, 'REFERENCE_ALREADY_DECLARED');
    assert.equal(calls.rpc.length, 1);
  });
  await check('Pack accepted', 'pack', {}, packBody, 201, (data, calls) => {
    assert.equal(data.paymentConfirmed, false);
    assert.equal(data.status, 'under_review');
    assert.equal(calls.rpc.length, 1);
    assert.equal(calls.rpc[0].name, 'submit_omt_patient_pack_declaration');
    assert.equal(calls.rpc[0].args.p_patient_id, patient);
    assert.equal(calls.rpc[0].args.p_therapist_id, therapist);
    assert.equal(calls.rpc[0].args.p_service_id, service);
  });
  await check('Pack business rejection', 'pack', {
    rpcError: { message: 'REFERENCE_ALREADY_DECLARED', code: 'P0001' }
  }, packBody, 409, (_data, calls) => assert.equal(calls.rpc.length, 1));
  await check('Pack missing RPC', 'pack', {
    rpcError: { message: 'missing', code: 'PGRST202' }
  }, packBody, 503, (_data, calls) => assert.equal(calls.rpc.length, 1));
  await check('Individual nonpatient rejected', 'individual', { role: 'admin' }, individualBody, 403,
    (_data, calls) => assert.equal(calls.rpc.length, 0));
  await check('Pack nonpatient rejected', 'pack', { role: 'admin' }, packBody, 403,
    (_data, calls) => assert.equal(calls.rpc.length, 0));
  console.log('RESULT: 8/8 mock API tests passed; no network requests or database writes');
})().catch(error => { console.error('FAIL', error); process.exitCode = 1; });
