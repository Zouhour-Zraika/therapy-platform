'use strict';
// Offline route tests. No real network, Supabase, Resend, Google or Zoom calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const SOURCE = process.argv[2] || 'aan-omt-admin-routes-review.txt';
const UUID = '11111111-1111-4111-8111-111111111111';
const ADMIN = '22222222-2222-4222-8222-222222222222';
const raw = fs.readFileSync(SOURCE, 'utf8');
const sections = {};
const re = /^========== (src\/app\/api\/admin\/[^\r\n]+\/route\.ts) ==========\s*$/gm;
const matches = [...raw.matchAll(re)];
for (let i = 0; i < matches.length; i++) sections[matches[i][1]] = raw.slice(matches[i].index + matches[i][0].length, i + 1 < matches.length ? matches[i+1].index : raw.length);
const paths = ['omt-review','omt-pack-review','omt-prepare','omt-meeting','omt-confirm','omt-finalize','omt-notifications'];
for (const name of paths) assert.ok(sections[`src/app/api/admin/${name}/route.ts`], `Missing ${name} source`);
function makeDb(config = {}) {
  const calls = [], writes = [], sent = [], meetings = [];
  const tables = config.tables || {};
  const rpc = config.rpc || {};
  const db = {
    auth: {
      getUser: async () => ({ data: { user: config.unauth ? null : { id: ADMIN } }, error: null }),
      admin: { getUserById: async id => ({ data: { user: { email: id === ADMIN ? 'admin@example.test' : 'recipient@example.test', user_metadata: { language: 'fr' } } }, error: null }) }
    },
    rpc: async (name, args) => { calls.push({name, args}); const value = rpc[name]; return typeof value === 'function' ? value(args) : value ?? {data: null, error: null}; },
    from(table) {
      const state = {table, op:'read', filters:[], update:null};
      const chain = {
        select() { return chain; },
        eq(k,v) { state.filters.push([k,v]); return chain; },
        gt(k,v) { state.filters.push([k,v]); return chain; },
        is(k,v) { state.filters.push([k,v]); return chain; },
        update(value) { state.op='update'; state.update=value; writes.push({table,value}); return chain; },
        async maybeSingle() { return result(); },
        async single() { return result(); },
        then(resolve,reject) { return Promise.resolve(result()).then(resolve,reject); }
      };
      function result() {
        if (table === 'profiles') return {data:{role:config.role || 'admin'},error:null};
        const value = tables[table];
        if (typeof value === 'function') return value(state);
        if (state.op === 'update') return {data:{id:UUID},error:null};
        return value ?? {data:null,error:null};
      }
      return chain;
    }
  };
  return {db,calls,writes,sent,meetings};
}
function load(name, config={}) {
  const harness = makeDb(config);
  const mod = {exports:{}};
  const mocks = {
    '@supabase/supabase-js': {createClient: () => harness.db},
    'next/server': {NextResponse: {json: (body, options={}) => ({status:options.status || 200, body})}},
    'resend': {Resend: class { emails = {send: async args => {harness.sent.push(args); return {data:{id:'mock-message'},error:null};}} }},
    '@/lib/googleCalendar': {
      createGoogleMeetForBooking: async args => {harness.meetings.push('google');return {meetingUrl:'https://meet.example.test/abc',calendarEventId:'evt'};},
      createGoogleMeetContinuationForBooking: async args => {harness.meetings.push('google-backup');return {meetingUrl:'https://meet.example.test/backup',calendarEventId:'evt2'};},
      createGoogleCalendarEventForBooking: async args => {harness.meetings.push('calendar');return {calendarEventId:'evt3'};}
    },
    '@/lib/zoomMeetings': {createZoomMeetingForBooking: async args => {harness.meetings.push(args.continuation?'zoom-backup':'zoom');return {joinUrl:'https://zoom.example.test/j',startUrl:'https://zoom.example.test/s'};}}
  };
  const routePath = `src/app/api/admin/${name}/route.ts`;
  const routeSource = fs.existsSync(routePath) ? fs.readFileSync(routePath, 'utf8') : sections[routePath];
  const code = ts.transpileModule(routeSource, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const context = {module:mod,exports:mod.exports,require(id){if (!(id in mocks)) throw Error('Unexpected import: '+id);return mocks[id];},
    process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'offline-only',RESEND_API_KEY:'offline-only',RESEND_FROM_EMAIL:'sender@example.test',OMT_INTERNAL_ORIGIN:'https://internal.example.test',...config.env}},
    console:{error(...args){if(process.env.DEBUG_OMT) console.error(...args)}},Date,Intl,URL,crypto:{randomUUID:()=>UUID},
    fetch:async (url,options) => {if(!config.fetch) throw Error('External fetch blocked: '+url);return config.fetch(url,options);},
    setTimeout(){throw Error('Timers blocked');}
  };
  vm.runInNewContext(code,context,{filename:name+'.js',timeout:2000});
  return {...harness,POST:mod.exports.POST};
}
function request(body={},auth=true) {return {headers:{get:k => k==='authorization' && auth ? 'Bearer mock-token' : null},json:async()=>body};}
const tests=[];
function test(name,fn){tests.push([name,fn]);}
for (const route of paths) {
  test(route+' denies missing authentication',async()=>{
    const h=load(route);const r=await h.POST(request({},false));assert.equal(r.status,401);assert.equal(h.calls.length,0);assert.equal(h.sent.length,0);assert.equal(h.meetings.length,0);
  });
  test(route+' denies patient role',async()=>{
    const h=load(route,{role:'patient'});const r=await h.POST(request({bookingId:UUID,declarationId:UUID,decision:'approved',notificationType:'patient_confirmation'}));assert.equal(r.status,403);assert.equal(h.calls.length,0);assert.equal(h.sent.length,0);assert.equal(h.meetings.length,0);
  });
}
for(const route of ['omt-review','omt-pack-review']){
  const rpcName=route==='omt-review'?'review_omt_payment_declaration':'review_omt_patient_pack_declaration';
  test(route+' approves through admin RPC only',async()=>{
    const h=load(route,{rpc:{[rpcName]:{data:[{id:UUID,status:'approved'}],error:null}}});
    const r=await h.POST(request({declarationId:UUID,decision:'approved'}));assert.equal(r.status,200);assert.equal(r.body.success,true);assert.equal(h.calls[0].name,rpcName);assert.equal(h.calls[0].args.p_admin_id,ADMIN);assert.equal(h.sent.length,0);
  });
  test(route+' rejects invalid decision before RPC',async()=>{
    const h=load(route);const r=await h.POST(request({declarationId:UUID,decision:'other'}));assert.equal(r.status,400);assert.equal(h.calls.length,0);
  });
  test(route+' maps duplicate review to conflict',async()=>{
    const h=load(route,{rpc:{[rpcName]:{data:null,error:{message:'DECLARATION_ALREADY_REVIEWED'}}}});
    const r=await h.POST(request({declarationId:UUID,decision:'approved'}));assert.equal(r.status,409);
  });
}
test('prepare creates payment then receipt, no emails',async()=>{
  const h=load('omt-prepare',{rpc:{record_approved_omt_payment:{data:[{id:'payment'}],error:null},create_approved_omt_payment_receipt:{data:[{id:'receipt'}],error:null}}});
  const r=await h.POST(request({bookingId:UUID}));assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.success,true);assert.deepEqual(h.calls.map(c=>c.name),['record_approved_omt_payment','create_approved_omt_payment_receipt']);assert.equal(r.body.emailsSent,false);
});
test('prepare marks receipt failure retryable',async()=>{
  const h=load('omt-prepare',{rpc:{record_approved_omt_payment:{data:[{id:'payment'}],error:null},create_approved_omt_payment_receipt:{data:null,error:{message:'failed'}}}});
  const r=await h.POST(request({bookingId:UUID}));assert.equal(r.status,503,JSON.stringify(r.body));assert.equal(r.body.retryable,true);
});
const booking={id:UUID,status:'pending',manual_payment_status:'approved',therapist_id:ADMIN,therapist_name:'Therapist',patient_email:'patient@example.test',scheduled_start:'2026-11-05T10:00:00Z',scheduled_end:'2026-11-05T11:00:00Z',service_type:'individual',meeting_provider:null,meeting_url:null,zoom_join_url:null,zoom_start_url:null,calendar_event_id:null,backup_join_url:null};
function meetingConfig(provider,connected){return {rpc:{claim_omt_meeting_preparation:{data:true,error:null}},tables:{bookings:state=>{
 if(state.op==='update')return {data:{id:UUID},error:null};
 if(state.filters.some(([k])=>k==='omt_meeting_lock_token'))return {data:{id:UUID},error:null};
 if(state.filters.some(([k])=>k==='manual_payment_status'))return {data:booking,error:null};
 if(state.filters.some(([k])=>k==='id'))return {data:booking,error:null};
 return {data:booking,error:null};},payments:{data:{id:'payment'},error:null},payment_receipts:{data:{id:'receipt'},error:null},therapists:{data:{preferred_meeting_provider:provider},error:null},therapist_google_connections:{data:{meet_enabled:provider==='google_meet'&&connected,calendar_enabled:false},error:null},therapist_zoom_connections:{data:provider==='zoom'&&connected?{therapist_id:ADMIN}:null,error:null}}};}
for(const provider of ['zoom','google_meet']){
 test('meeting rejects disconnected '+provider+' before external calls',async()=>{
   const cfg=meetingConfig(provider,false);cfg.tables.bookings=state=>({data:state.op==='update'?{id:UUID}:{...booking,meeting_provider:provider},error:null});
   const h=load('omt-meeting',cfg);const r=await h.POST(request({bookingId:UUID}));assert.equal(r.status,409,JSON.stringify(r.body));assert.equal(h.meetings.length,0);assert.equal(h.calls[0].name,'claim_omt_meeting_preparation');
 });
}
test('meeting refuses unclaimed lock before external calls',async()=>{
 const h=load('omt-meeting',{rpc:{claim_omt_meeting_preparation:{data:false,error:null}}});const r=await h.POST(request({bookingId:UUID}));assert.equal(r.status,409);assert.equal(h.meetings.length,0);
});
test('confirm requires approved booking',async()=>{
 const h=load('omt-confirm',{tables:{bookings:{data:{...booking,manual_payment_status:'pending'},error:null}}});const r=await h.POST(request({bookingId:UUID}));assert.equal(r.status,409);assert.equal(h.calls.length,0);
});
test('confirm reports assignment failure after confirmation',async()=>{
 const h=load('omt-confirm', { tables: { bookings: {data: booking, error:null} }, rpc: { confirm_fulfilled_omt_booking: {data:[{booking_id:UUID,booking_status:'paid',manual_payment_status:'approved',payment_provider:'omt',meeting_url:'https://meet.example.test'}],error:null}, assign_omt_booking_therapist: {data:null,error:{message:'ACTIVE_THERAPIST_CONFLICT'}} } });
 const r=await h.POST(request({bookingId:UUID}));assert.equal(r.status,409);assert.equal(r.body.bookingConfirmed,true);assert.equal(r.body.manualReviewRequired,true);
});
test('finalize stops before notifications when confirmation fails',async()=>{
 const urls=[];const h=load('omt-finalize',{fetch:async url=>{urls.push(url);return {ok:false,status:409,json:async()=>({success:false,error:'not ready'})};}});
 const r=await h.POST(request({bookingId:UUID}));assert.equal(r.status,409);assert.equal(r.body.notificationsStarted,false);assert.equal(urls.length,1);assert.ok(urls[0].endsWith('/api/admin/omt-confirm'));
});
test('finalize invokes three notifications in sequence on success',async()=>{
 const urls=[];const h=load('omt-finalize',{fetch:async (url,opts)=>{urls.push({url,body:JSON.parse(opts.body)});return {ok:true,status:200,json:async()=>url.endsWith('/omt-confirm')?{success:true,bookingConfirmed:true,assignmentCompleted:true}:{success:true,sent:true}};}});
 const r=await h.POST(request({bookingId:UUID}));assert.equal(r.status,200);assert.equal(r.body.notificationsComplete,true);assert.deepEqual(urls.slice(1).map(x=>x.body.notificationType),['patient_confirmation','therapist_confirmation','payment_receipt']);
});
test('finalize stops at uncertain notification',async()=>{
 const urls=[];const h=load('omt-finalize',{fetch:async (url,opts)=>{urls.push(url);return {ok:true,status:200,json:async()=>url.endsWith('/omt-confirm')?{success:true,bookingConfirmed:true,assignmentCompleted:true}:{success:true,skipped:true}};}});
 const r=await h.POST(request({bookingId:UUID}));assert.equal(r.status,409);assert.equal(r.body.manualReviewRequired,true);assert.equal(urls.length,2);
});
test('notifications refuse unconfirmed booking without sending',async()=>{
 const h=load('omt-notifications',{tables:{bookings:{data:{...booking,patient_pack_id:null,payment_provider:'omt'},error:null}}});const r=await h.POST(request({bookingId:UUID,notificationType:'patient_confirmation'}));assert.equal(r.status,409);assert.equal(h.sent.length,0);
});
test('notifications skip when claim is not acquired',async()=>{
 const confirmed={...booking,status:'paid',payment_provider:'omt',patient_pack_id:null,patient_id:null,meeting_url:'https://meet.example.test'};
 const h=load('omt-notifications',{tables:{bookings:{data:confirmed,error:null},payment_receipts:{data:{receipt_number:'R1',amount:60,payment_transaction_id:'REF',status:'paid'},error:null}},rpc:{claim_omt_notification:{data:false,error:null}}});
 const r=await h.POST(request({bookingId:UUID,notificationType:'patient_confirmation'}));assert.equal(r.status,200);assert.equal(r.body.skipped,true);assert.equal(h.sent.length,0);
});
test('notifications send mocked email only after claim and complete tracking',async()=>{
 const confirmed={...booking,status:'paid',payment_provider:'omt',patient_pack_id:null,patient_id:null,meeting_url:'https://meet.example.test',booking_language:'fr'};
 const h=load('omt-notifications',{tables:{bookings:{data:confirmed,error:null},payment_receipts:{data:{receipt_number:'R1',amount:60,payment_transaction_id:'REF',status:'paid'},error:null}},rpc:{claim_omt_notification:{data:true,error:null},complete_omt_notification:{data:true,error:null}}});
 const r=await h.POST(request({bookingId:UUID,notificationType:'patient_confirmation'}));assert.equal(r.status,200);assert.equal(r.body.sent,true);assert.equal(h.sent.length,1);assert.equal(h.calls[0].name,'claim_omt_notification');assert.equal(h.calls[1].name,'complete_omt_notification');
});
(async()=>{let count=0;for(const [name,fn] of tests){try{await fn();console.log('PASS '+name);count++;}catch(e){console.error('FAIL '+name+' — '+e.message);process.exitCode=1;}}console.log(`RESULT: ${count}/${tests.length} admin mock tests passed; no external requests or database writes`);})().catch(e=>{console.error(e);process.exitCode=1});
