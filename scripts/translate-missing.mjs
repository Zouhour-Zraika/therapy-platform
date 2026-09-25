import OpenAI from "openai";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDirectory = process.cwd();

const masterPath = path.join(
  rootDirectory,
  "src",
  "i18n",
  "master.json",
);

const generatedDirectory = path.join(
  rootDirectory,
  "src",
  "i18n",
  "generated",
);

const englishPath = path.join(
  generatedDirectory,
  "en.json",
);

const frenchPath = path.join(
  generatedDirectory,
  "fr.json",
);

const arabicPath = path.join(
  generatedDirectory,
  "ar.json",
);

const manifestPath = path.join(
  generatedDirectory,
  "manifest.json",
);

const model =
  process.env.OPENAI_TRANSLATION_MODEL ||
  "gpt-5-mini";

function createHash(text) {
  return crypto
    .createHash("sha256")
    .update(text)
    .digest("hex");
}

async function readJson(filePath) {
  try {
    const content = await fs.readFile(
      filePath,
      "utf8",
    );

    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeJson(filePath, data) {
  const sortedData = Object.fromEntries(
    Object.entries(data).sort(
      ([keyA], [keyB]) =>
        keyA.localeCompare(keyB),
    ),
  );

  await fs.mkdir(
    path.dirname(filePath),
    {
      recursive: true,
    },
  );

  await fs.writeFile(
    filePath,
    `${JSON.stringify(
      sortedData,
      null,
      2,
    )}\n`,
    "utf8",
  );
}

function cleanJsonResponse(text) {
  return text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

async function translateTexts(
  client,
  entries,
  targetLanguage,
) {
  const textsToTranslate =
    Object.fromEntries(entries);

  const targetInstructions =
    targetLanguage === "fr"
      ? [
          "Translate the provided English interface texts into natural French.",
          "Use clear, professional French suitable for a psychotherapy and mental-health platform.",
          "Use natural wording for patients and healthcare professionals.",
          "Do not translate brand names such as AAN, Zoom, Google Meet or Stripe.",
        ].join(" ")
      : [
          "Translate the provided English interface texts into natural Modern Standard Arabic.",
          "The website is a professional psychotherapy and mental-health platform.",
          "Use a warm, respectful, clear and clinically appropriate tone.",
          "Do not translate brand names such as AAN, Zoom, Google Meet or Stripe.",
        ].join(" ");

  const response =
    await client.responses.create({
      model,
      store: false,
      input: [
        {
          role: "system",
          content:
            `${targetInstructions} ` +
            "Keep every JSON key exactly unchanged. " +
            "Preserve placeholders, email addresses, URLs, HTML and punctuation. " +
            "Return only a valid JSON object. " +
            "Do not return explanations or Markdown.",
        },
        {
          role: "user",
          content:
            JSON.stringify(
              textsToTranslate,
            ),
        },
      ],
    });

  const cleanedResponse =
    cleanJsonResponse(
      response.output_text,
    );

  return JSON.parse(cleanedResponse);
}

function getLanguageManifest(
  manifest,
  language,
) {
  /*
   * Ancien format :
   *
   * {
   *   "some.key": "hash"
   * }
   *
   * Il correspondait uniquement à l'arabe.
   *
   * Nouveau format :
   *
   * {
   *   "fr": { ... },
   *   "ar": { ... }
   * }
   */
  if (
    manifest &&
    typeof manifest === "object" &&
    manifest[language] &&
    typeof manifest[language] ===
      "object"
  ) {
    return {
      ...manifest[language],
    };
  }

  if (language === "ar") {
    const oldArabicManifest = {};

    for (const [key, value] of Object.entries(
      manifest || {},
    )) {
      if (
        key !== "fr" &&
        key !== "ar" &&
        typeof value === "string"
      ) {
        oldArabicManifest[key] = value;
      }
    }

    return oldArabicManifest;
  }

  return {};
}

function removeInvalidKeys(
  translations,
  languageManifest,
  validKeys,
) {
  for (const key of Object.keys(
    translations,
  )) {
    if (!validKeys.has(key)) {
      delete translations[key];
    }
  }

  for (const key of Object.keys(
    languageManifest,
  )) {
    if (!validKeys.has(key)) {
      delete languageManifest[key];
    }
  }
}

async function generateLanguage({
  client,
  language,
  master,
  translations,
  languageManifest,
}) {
  const missingEntries = [];

  for (const [key, value] of Object.entries(
    master,
  )) {
    const currentHash =
      createHash(value);

    const previousHash =
      languageManifest[key];

    /*
     * Une traduction existante sans entrée de manifest
     * est conservée.
     *
     * Cela évite de retraduire tout le fr.json existant
     * lors de la première exécution de cette nouvelle
     * version du script.
     */
    if (
      typeof translations[key] ===
        "string" &&
      translations[key].trim() !== "" &&
      !previousHash
    ) {
      languageManifest[key] =
        currentHash;

      continue;
    }

    if (
      !translations[key] ||
      currentHash !== previousHash
    ) {
      missingEntries.push([
        key,
        value,
      ]);
    }
  }

  if (missingEntries.length === 0) {
    console.log(
      `No ${language.toUpperCase()} translation is required.`,
    );

    return;
  }

  console.log(
    `Translating ${missingEntries.length} text(s) to ${language.toUpperCase()} with ${model}...`,
  );

  const newTranslations =
    await translateTexts(
      client,
      missingEntries,
      language,
    );

  for (const [
    key,
    englishText,
  ] of missingEntries) {
    const translatedText =
      newTranslations[key];

    if (
      typeof translatedText !==
        "string" ||
      translatedText.trim() === ""
    ) {
      throw new Error(
        `OpenAI did not return a valid ${language.toUpperCase()} translation for "${key}".`,
      );
    }

    translations[key] =
      translatedText.trim();

    languageManifest[key] =
      createHash(englishText);
  }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is missing from .env.local",
    );
  }

  const master =
    await readJson(masterPath);

  const currentFrench =
    await readJson(frenchPath);

  const currentArabic =
    await readJson(arabicPath);

  const currentManifest =
    await readJson(manifestPath);

  const english = {};

  for (const [
    key,
    value,
  ] of Object.entries(master)) {
    if (typeof value !== "string") {
      throw new Error(
        `The value of "${key}" must be a string.`,
      );
    }

    english[key] = value;
  }

  /*
   * L'anglais reste la source de vérité :
   * master.json -> en.json
   */
  await writeJson(
    englishPath,
    english,
  );

  const validKeys =
    new Set(Object.keys(master));

  const frenchManifest =
    getLanguageManifest(
      currentManifest,
      "fr",
    );

  const arabicManifest =
    getLanguageManifest(
      currentManifest,
      "ar",
    );

  removeInvalidKeys(
    currentFrench,
    frenchManifest,
    validKeys,
  );

  removeInvalidKeys(
    currentArabic,
    arabicManifest,
    validKeys,
  );

  const client = new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY,
  });

  await generateLanguage({
    client,
    language: "fr",
    master,
    translations:
      currentFrench,
    languageManifest:
      frenchManifest,
  });

  await generateLanguage({
    client,
    language: "ar",
    master,
    translations:
      currentArabic,
    languageManifest:
      arabicManifest,
  });

  await writeJson(
    frenchPath,
    currentFrench,
  );

  await writeJson(
    arabicPath,
    currentArabic,
  );

  await writeJson(
    manifestPath,
    {
      fr: frenchManifest,
      ar: arabicManifest,
    },
  );

  console.log(
    "French and Arabic translations generated successfully.",
  );
}

main().catch((error) => {
  console.error(
    "Translation failed:",
  );

  console.error(error.message);

  process.exitCode = 1;
});