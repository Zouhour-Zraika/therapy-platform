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

const englishPath = path.join(generatedDirectory, "en.json");
const arabicPath = path.join(generatedDirectory, "ar.json");
const manifestPath = path.join(generatedDirectory, "manifest.json");

const model =
  process.env.OPENAI_TRANSLATION_MODEL || "gpt-5-mini";

function createHash(text) {
  return crypto
    .createHash("sha256")
    .update(text)
    .digest("hex");
}

async function readJson(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
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
    Object.entries(data).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB),
    ),
  );

  await fs.mkdir(path.dirname(filePath), {
    recursive: true,
  });

  await fs.writeFile(
    filePath,
    `${JSON.stringify(sortedData, null, 2)}\n`,
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

async function translateTexts(client, entries) {
  const textsToTranslate = Object.fromEntries(entries);

  const response = await client.responses.create({
    model,
    store: false,
    input: [
      {
        role: "system",
        content:
          "Translate the provided English interface texts into natural Modern Standard Arabic. " +
          "The website is a professional psychotherapy and mental-health platform. " +
          "Use a warm, respectful, clear and clinically appropriate tone. " +
          "Keep every JSON key exactly unchanged. " +
          "Preserve placeholders, email addresses, URLs, HTML and punctuation. " +
          "Return only a valid JSON object. Do not return explanations or Markdown.",
      },
      {
        role: "user",
        content: JSON.stringify(textsToTranslate),
      },
    ],
  });

  const cleanedResponse = cleanJsonResponse(
    response.output_text,
  );

  return JSON.parse(cleanedResponse);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is missing from .env.local",
    );
  }

  const master = await readJson(masterPath);
  const currentArabic = await readJson(arabicPath);
  const currentManifest = await readJson(manifestPath);

  const english = {};
  const missingEntries = [];

  for (const [key, value] of Object.entries(master)) {
    if (typeof value !== "string") {
      throw new Error(
        `The value of "${key}" must be a string.`,
      );
    }

    english[key] = value;

    const currentHash = createHash(value);
    const previousHash = currentManifest[key];

    if (
      !currentArabic[key] ||
      currentHash !== previousHash
    ) {
      missingEntries.push([key, value]);
    }
  }

  await writeJson(englishPath, english);

  const validKeys = new Set(Object.keys(master));

  for (const key of Object.keys(currentArabic)) {
    if (!validKeys.has(key)) {
      delete currentArabic[key];
      delete currentManifest[key];
    }
  }

  if (missingEntries.length === 0) {
    await writeJson(arabicPath, currentArabic);
    await writeJson(manifestPath, currentManifest);

    console.log("No translation is required.");
    return;
  }

  console.log(
    `Translating ${missingEntries.length} text(s) with ${model}...`,
  );

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const newTranslations = await translateTexts(
    client,
    missingEntries,
  );

  for (const [key, englishText] of missingEntries) {
    const translatedText = newTranslations[key];

    if (
      typeof translatedText !== "string" ||
      translatedText.trim() === ""
    ) {
      throw new Error(
        `OpenAI did not return a valid translation for "${key}".`,
      );
    }

    currentArabic[key] = translatedText.trim();
    currentManifest[key] = createHash(englishText);
  }

  await writeJson(arabicPath, currentArabic);
  await writeJson(manifestPath, currentManifest);

  console.log("Arabic translations generated successfully.");
}

main().catch((error) => {
  console.error("Translation failed:");
  console.error(error.message);
  process.exitCode = 1;
});