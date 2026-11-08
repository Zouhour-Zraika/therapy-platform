const fs = require("fs");
const vm = require("vm");
const path = require("path");
const ts = require("typescript");

const source = fs.readFileSync(
  "src/app/api/admin/omt-notifications/route.ts",
  "utf8"
);

const start = source.indexOf("function languageOf(");
const end = source.indexOf("\nexport async function POST(", start);

if (start < 0 || end < 0) {
  throw new Error("Impossible d'isoler les modèles OMT");
}

const code = source.slice(start, end);

const javascript = ts.transpileModule(code, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.None
  }
}).outputText;

const context = vm.createContext({
  Intl,
  Date,
  Number,
  String,
  console
});

vm.runInContext(javascript, context);

const booking = {
  id: "TEST-SIMULATION-OMT",
  scheduled_start: "2026-11-05T10:00:00Z",
  meeting_provider: "zoom",
  meeting_url: "https://example.com/simulation",
  zoom_join_url: "https://example.com/patient",
  zoom_start_url: "https://example.com/therapist",
  backup_join_url: null,
  backup_host_url: null
};

const receipt = {
  receipt_number: "SIMULATION-OMT-001",
  amount: 60,
  payment_transaction_id: "SIMULATION-NON-PAYEE"
};

const types = [
  "patient_confirmation",
  "therapist_confirmation",
  "payment_receipt"
];

const output = path.join("scripts", "omt-email-previews");
fs.mkdirSync(output, { recursive: true });

for (const language of ["fr", "en", "ar"]) {
  for (const type of types) {
    const email = vm.runInContext(
      `emailContent(${JSON.stringify({
        type,
        language,
        booking,
        receipt,
        therapistName: "Spécialiste TEST"
      })})`,
      context
    );

    const html = email.html.replace(
      /<main\b/,
      '<div style="background:#fff3cd;padding:15px;text-align:center;font-weight:bold">SIMULATION TEST — AUCUN PAIEMENT RÉEL — AUCUNE RÉSERVATION CONFIRMÉE</div><main'
    );

    fs.writeFileSync(
      path.join(output, `${language}-${type}.html`),
      html,
      "utf8"
    );

    console.log("OK :", language, type, "|", email.subject);
  }
}

console.log("9 aperçus HTML créés dans :", output);
console.log("Aucun e-mail envoyé. Aucune donnée Supabase modifiée.");
