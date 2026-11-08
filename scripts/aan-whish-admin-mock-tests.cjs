'use strict';
// Offline route tests. No real network, Supabase, Resend, Google or Zoom calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const SOURCE = process.argv[2] || 'D:/projet/aan-whish-routes-review.txt';
const UUID = '11111111-1111-4111-8111-111111111111';
const ADMIN = '22222222-2222-4222-8222-222222222222';
const raw = fs.readFileSync(SOURCE, 'utf8');
const sections = {};
const re = /^========== (src\/app\/api\/admin\/[^\r\n]+\/route\.ts) ==========\s*$/gm;
const matches = [...raw.matchAll(re)];
for (let i = 0; i < matches.length; i++) sections[matches[i][1]] = raw.slice(matches[i].index + matches[i][0].length, i + 1 < matches.length ? matches[i+1].index : raw.length);
const paths = ['whish-review','whish-prepare','whish-meeting','whish-confirm','whish-finalize','whish-notifications'];
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
        not(k,operator,v) {
          state.filters.push([k, 'not.' + operator, v]);
          return chain;
        },
        limit(n) { return chain; },
        gt(k,v) { state.filters.push([k,v]); return chain; },
        is(k,v) { state.filters.push([k,v]); return chain; },
        update(value) { state.op='update'; state.update=value; writes.push({table,value}); return chain; },
        async maybeSingle() { return result(); },
        async single() { return result(); },
        then(resolve,reject) { return Promise.resolve(result()).then(resolve,reject); }
      };
      function result() {
        if (table === 'profiles') return {data:{role:config.role ?? 'admin'},error:null};
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
    'resend': {Resend: class { emails = {send: async args => {harness.sent.push(args); return config.resendResult || {data:{id:'mock-message'},error:null};}} }},
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

const booking={id:UUID,status:'pending',manual_payment_status:'approved',therapist_id:ADMIN,therapist_name:'Therapist',patient_email:'patient@example.test',scheduled_start:'2026-11-05T10:00:00Z',scheduled_end:'2026-11-05T11:00:00Z',service_type:'individual',meeting_provider:null,meeting_url:null,zoom_join_url:null,zoom_start_url:null,calendar_event_id:null,backup_join_url:null};
function meetingConfig(provider,connected){return {rpc:{claim_whish_meeting_preparation:{data:true,error:null}},tables:{bookings:state=>{
 if(state.op==='update')return {data:{id:UUID},error:null};
 if(state.filters.some(([k])=>k==='omt_meeting_lock_token'))return {data:{id:UUID},error:null};
 if(state.filters.some(([k])=>k==='manual_payment_status'))return {data:booking,error:null};
 if(state.filters.some(([k])=>k==='id'))return {data:booking,error:null};
 return {data:booking,error:null};},payments:{data:{id:'payment'},error:null},payment_receipts:{data:{id:'receipt'},error:null},therapists:{data:{preferred_meeting_provider:provider},error:null},therapist_google_connections:{data:{meet_enabled:provider==='google_meet'&&connected,calendar_enabled:false},error:null},therapist_zoom_connections:{data:provider==='zoom'&&connected?{therapist_id:ADMIN}:null,error:null}}};}
for(const provider of ['zoom','google_meet']){
 test('meeting rejects disconnected '+provider+' before external calls',async()=>{
   const cfg=meetingConfig(provider,false);
    cfg.tables.manual_payment_declarations = {
      data: {id:UUID},
      error:null
    };
    cfg.tables.bookings=state=>({data:state.op==='update'?{id:UUID}:{...booking,meeting_provider:provider},error:null});
   const h=load('whish-meeting',cfg);const r=await h.POST(request({bookingId:UUID}));assert.equal(r.status,409,JSON.stringify(r.body));assert.equal(h.meetings.length,0);assert.equal(h.calls[0].name,'claim_whish_meeting_preparation');
 });
}


test('meeting refuses missing approved Whish declaration', async () => {
  const cfg = meetingConfig('zoom', true);
  cfg.tables.bookings = state => ({
    data: state.op === 'update' ? {id:UUID} : {...booking, meeting_provider:'zoom'},
    error:null
  });
  cfg.tables.manual_payment_declarations = {data:null,error:null};

  const h = load('whish-meeting', cfg);
  const r = await h.POST(request({bookingId:UUID}));

  assert.equal(r.status, 500, JSON.stringify(r.body));
  assert.equal(h.meetings.length, 0);
  assert.equal(h.sent.length, 0);
});


test('meeting refuses unclaimed Whish lock', async () => {
  const cfg = meetingConfig('zoom', true);
  cfg.rpc.claim_whish_meeting_preparation = {
    data: false,
    error: null
  };

  const h = load('whish-meeting', cfg);
  const r = await h.POST(request({bookingId:UUID}));

  assert.equal(r.status, 409, JSON.stringify(r.body));
  assert.equal(h.meetings.length, 0);
  assert.equal(h.sent.length, 0);
});


test('prepare records Whish payment then receipt without emails', async () => {
  const h = load('whish-prepare', {
    rpc: {
      record_approved_whish_payment: {
        data: [{id:'mock-payment'}], error:null
      },
      create_approved_whish_payment_receipt: {
        data: [{id:'mock-receipt'}], error:null
      }
    }
  });

  const r = await h.POST(request({bookingId:UUID}));

  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.success, true);
  assert.deepEqual(
    h.calls.map(c => c.name),
    [
      'record_approved_whish_payment',
      'create_approved_whish_payment_receipt'
    ]
  );
  assert.equal(h.sent.length, 0);
  assert.equal(h.meetings.length, 0);
});


test('prepare reports retryable Whish receipt failure', async () => {
  const h = load('whish-prepare', {
    rpc: {
      record_approved_whish_payment: {
        data: [{id:'mock-payment'}], error:null
      },
      create_approved_whish_payment_receipt: {
        data:null, error:{message:'Simulated receipt failure'}
      }
    }
  });

  const r = await h.POST(request({bookingId:UUID}));

  assert.equal(r.status, 503, JSON.stringify(r.body));
  assert.equal(r.body.retryable, true);
  assert.deepEqual(
    h.calls.map(c => c.name),
    [
      'record_approved_whish_payment',
      'create_approved_whish_payment_receipt'
    ]
  );
  assert.equal(h.sent.length, 0);
  assert.equal(h.meetings.length, 0);
});


test('confirm flags therapist assignment conflict after Whish confirmation', async () => {
  const h = load('whish-confirm', {
    tables: {
      bookings: {
        data: {
          id:UUID,
          status:'pending',
          manual_payment_status:'approved',
          whish_meeting_lock_until:null
        },
        error:null
      }
    },
    rpc: {
      confirm_fulfilled_whish_booking: {
        data:[{
          booking_id:UUID,
          booking_status:'paid',
          manual_payment_status:'approved',
          payment_provider:'whish',
          meeting_url:'https://meet.example.test/fictitious'
        }],
        error:null
      },
      assign_whish_booking_therapist: {
        data:null,
        error:{message:'ACTIVE_THERAPIST_CONFLICT'}
      }
    }
  });

  const r = await h.POST(request({bookingId:UUID}));

  assert.equal(r.status, 409, JSON.stringify(r.body));
  assert.equal(r.body.bookingConfirmed, true);
  assert.equal(r.body.assignmentCompleted, false);
  assert.equal(r.body.manualReviewRequired, true);
  assert.deepEqual(
    h.calls.map(c => c.name),
    [
      'confirm_fulfilled_whish_booking',
      'assign_whish_booking_therapist'
    ]
  );
  assert.equal(h.sent.length, 0);
  assert.equal(h.meetings.length, 0);
});


test('finalize stops before notifications when Whish confirmation fails', async () => {
  const urls = [];
  const h = load('whish-finalize', {
    fetch: async url => {
      urls.push(url);
      return {
        ok:false,
        status:409,
        json:async()=>({success:false,error:'Simulated confirmation failure'})
      };
    }
  });

  const r = await h.POST(request({bookingId:UUID}));

  assert.equal(r.status,409,JSON.stringify(r.body));
  assert.equal(r.body.notificationsStarted,false);
  assert.equal(urls.length,1);
  assert.ok(urls[0].endsWith('/api/admin/whish-confirm'));
  assert.equal(h.sent.length,0);
  assert.equal(h.meetings.length,0);
});


test('notifications skip duplicate Whish email without sending', async () => {
  const h = load('whish-notifications', {
    tables: {
      bookings: {
        data: {
          id:UUID,
          status:'paid',
          manual_payment_status:'approved',
          payment_provider:'whish',
          patient_pack_id:null,
          patient_id:null,
          patient_email:'patient@example.test',
          therapist_id:'22222222-2222-4222-8222-222222222222',
          therapist_name:'Mock Therapist',
          scheduled_start:'2026-11-10T10:00:00Z',
          meeting_provider:'google_meet',
          meeting_url:'https://meet.example.test/mock',
          zoom_join_url:null,
          zoom_start_url:null,
          backup_join_url:null,
          backup_host_url:null
        },
        error:null
      },
      payment_receipts: {
        data: {
          receipt_number:'TEST-WHISH-001',
          amount:50,
          payment_transaction_id:'MOCK-001',
          status:'paid',
          issued_at:'2026-11-02T10:00:00Z'
        },
        error:null
      }
    },
    rpc: {
      claim_whish_notification: {
        data:false,
        error:null
      }
    }
  });

  const r = await h.POST(request({
    bookingId:UUID,
    notificationType:'patient_confirmation'
  }));

  assert.equal(r.status,200,JSON.stringify(r.body));
  assert.equal(r.body.success,true);
  assert.equal(r.body.sent,false);
  assert.equal(r.body.skipped,true);
  assert.deepEqual(
    h.calls.map(c=>c.name),
    ['claim_whish_notification']
  );
  assert.equal(h.sent.length,0);
  assert.equal(h.meetings.length,0);
});


test('finalize accepts already sent notification and completes remaining steps', async () => {
  const urls = [];
  const h = load('whish-finalize', {
    tables: {
      whish_notification_deliveries: {
        data:{status:'sent'},
        error:null
      }
    },
    fetch: async url => {
      urls.push(url);
      if (url.endsWith('/api/admin/whish-confirm')) {
        return {
          ok:true,
          status:200,
          json:async()=>({
            success:true,
            bookingConfirmed:true,
            assignmentCompleted:true
          })
        };
      }
      return {
        ok:true,
        status:200,
        json:async()=>(
          urls.length === 2
            ? {success:true,sent:false,skipped:true}
            : {success:true,sent:true}
        )
      };
    }
  });

  const r = await h.POST(request({bookingId:UUID}));

  assert.equal(r.status,200,JSON.stringify(r.body));
  assert.equal(r.body.success,true);
  assert.equal(r.body.notificationsComplete,true);
  assert.deepEqual(
    Array.from(r.body.notificationResults, x=>x.status),
    ['already_sent','sent','sent']
  );
  assert.equal(urls.length,4);
  assert.equal(h.sent.length,0);
  assert.equal(h.meetings.length,0);
});


test('finalize stops on uncertain Whish notification delivery', async () => {
  const urls = [];
  const h = load('whish-finalize', {
    tables: {
      whish_notification_deliveries: {
        data:{status:'processing'},
        error:null
      }
    },
    fetch: async url => {
      urls.push(url);
      if (url.endsWith('/api/admin/whish-confirm')) {
        return {
          ok:true,
          status:200,
          json:async()=>({
            success:true,
            bookingConfirmed:true,
            assignmentCompleted:true
          })
        };
      }
      return {
        ok:true,
        status:200,
        json:async()=>({
          success:true,
          sent:false,
          skipped:true
        })
      };
    }
  });

  const r = await h.POST(request({bookingId:UUID}));

  assert.equal(r.status,409,JSON.stringify(r.body));
  assert.equal(r.body.success,false);
  assert.equal(r.body.manualReviewRequired,true);
  assert.equal(r.body.bookingConfirmed,true);
  assert.equal(r.body.assignmentCompleted,true);
  assert.deepEqual(
    Array.from(r.body.notificationResults, x=>x.status),
    ['manual_review']
  );
  assert.equal(urls.length,2);
  assert.equal(h.sent.length,0);
  assert.equal(h.meetings.length,0);
});


test('notifications refuse missing Whish receipt without sending email', async () => {
  const h = load('whish-notifications', {
    tables: {
      bookings: {
        data: {
          id:UUID,
          status:'paid',
          manual_payment_status:'approved',
          payment_provider:'whish',
          patient_pack_id:null,
          patient_id:null,
          patient_email:'patient@example.test',
          therapist_id:'22222222-2222-4222-8222-222222222222',
          therapist_name:'Mock Therapist',
          scheduled_start:'2026-11-10T10:00:00Z',
          meeting_provider:'google_meet',
          meeting_url:'https://meet.example.test/mock',
          zoom_join_url:null,
          zoom_start_url:null,
          backup_join_url:null,
          backup_host_url:null
        },
        error:null
      },
      payment_receipts: {
        data:null,
        error:null
      }
    }
  });

  const r = await h.POST(request({
    bookingId:UUID,
    notificationType:'patient_confirmation'
  }));

  assert.equal(r.status,409,JSON.stringify(r.body));
  assert.equal(r.body.success,false);
  assert.equal(r.body.error,'Whish receipt missing');
  assert.equal(h.calls.length,0);
  assert.equal(h.sent.length,0);
  assert.equal(h.meetings.length,0);
});


test('notifications record failed Whish email delivery for manual review', async () => {
  const h = load('whish-notifications', {
    tables: {
      bookings: {
        data: {
          id:UUID,
          status:'paid',
          manual_payment_status:'approved',
          payment_provider:'whish',
          patient_pack_id:null,
          patient_id:null,
          patient_email:'patient@example.test',
          therapist_id:'22222222-2222-4222-8222-222222222222',
          therapist_name:'Mock Therapist',
          scheduled_start:'2026-11-10T10:00:00Z',
          meeting_provider:'google_meet',
          meeting_url:'https://meet.example.test/mock',
          zoom_join_url:null,
          zoom_start_url:null,
          backup_join_url:null,
          backup_host_url:null
        },
        error:null
      },
      payment_receipts: {
        data: {
          receipt_number:'TEST-WHISH-001',
          amount:50,
          payment_transaction_id:'MOCK-001',
          status:'paid',
          issued_at:'2026-11-02T10:00:00Z'
        },
        error:null
      }
    },
    rpc: {
      claim_whish_notification: {data:true,error:null},
      fail_whish_notification: {data:true,error:null}
    },
    resendResult: {
      data:null,
      error:{message:'Simulated Resend failure'}
    }
  });

  const r = await h.POST(request({
    bookingId:UUID,
    notificationType:'patient_confirmation'
  }));

  assert.equal(r.status,502,JSON.stringify(r.body));
  assert.equal(r.body.success,false);
  assert.deepEqual(
    h.calls.map(c=>c.name),
    ['claim_whish_notification','fail_whish_notification']
  );
  assert.equal(h.sent.length,1);
  assert.equal(h.meetings.length,0);
});


test('notifications require manual review when Whish delivery tracking fails', async () => {
  const h = load('whish-notifications', {
    tables: {
      bookings: {
        data: {
          id:UUID,
          status:'paid',
          manual_payment_status:'approved',
          payment_provider:'whish',
          patient_pack_id:null,
          patient_id:null,
          patient_email:'patient@example.test',
          therapist_id:ADMIN,
          therapist_name:'Mock Therapist',
          scheduled_start:'2026-11-10T10:00:00Z',
          meeting_provider:'google_meet',
          meeting_url:'https://meet.example.test/mock',
          zoom_join_url:null,
          zoom_start_url:null,
          backup_join_url:null,
          backup_host_url:null
        },
        error:null
      },
      payment_receipts: {
        data: {
          receipt_number:'TEST-WHISH-001',
          amount:50,
          payment_transaction_id:'MOCK-001',
          status:'paid',
          issued_at:'2026-11-02T10:00:00Z'
        },
        error:null
      }
    },
    rpc: {
      claim_whish_notification: {data:true,error:null},
      complete_whish_notification: {
        data:null,
        error:{message:'Simulated tracking failure'}
      }
    }
  });

  const r = await h.POST(request({
    bookingId:UUID,
    notificationType:'patient_confirmation'
  }));

  assert.equal(r.status,500,JSON.stringify(r.body));
  assert.equal(r.body.success,false);
  assert.match(r.body.error,/manual review/i);
  assert.deepEqual(
    h.calls.map(c=>c.name),
    ['claim_whish_notification','complete_whish_notification']
  );
  assert.equal(h.sent.length,1);
  assert.equal(h.meetings.length,0);
});


(async () => {
  let passed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log('PASS ' + name);
      passed++;
    } catch (error) {
      console.error('FAIL ' + name + ': ' + error.message);
      process.exitCode = 1;
    }
  }
  console.log(`RESULT: ${passed}/${tests.length} Whish authorization mock tests passed`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
