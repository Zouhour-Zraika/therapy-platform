import OpenAI from "openai";
import { NextResponse } from "next/server";

type TranslationRequest = {
  sourceLanguage: "en" | "ar";
  targetLanguage: "en" | "ar";
  fields: Record<string, string>;
};

type TranslationResponse = {
  translations: Record<string, string>;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as Partial<TranslationRequest>;

    if (
      !body.sourceLanguage ||
      !body.targetLanguage ||
      !body.fields ||
      typeof body.fields !== "object"
    ) {
      return NextResponse.json(
        { error: "Invalid translation request." },
        { status: 400 },
      );
    }

    const cleanFields = Object.fromEntries(
      Object.entries(body.fields)
        .filter(([, value]) => typeof value === "string")
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value.length > 0),
    );

    if (Object.keys(cleanFields).length === 0) {
      return NextResponse.json(
        { error: "No text was provided." },
        { status: 400 },
      );
    }

    if (body.sourceLanguage === body.targetLanguage) {
      return NextResponse.json({
        translations: cleanFields,
      });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_TRANSLATION_MODEL || "gpt-5-mini",

      instructions: [
        "You are a professional translator for a psychotherapy platform.",
        `Translate from ${body.sourceLanguage} to ${body.targetLanguage}.`,
        "Use professional, natural and compassionate language.",
        "Preserve names, URLs, email addresses, numbers and formatting.",
        "Return only valid JSON.",
        'Use exactly this structure: {"translations":{"originalKey":"translated text"}}.',
        "Keep exactly the same keys as the input.",
        "Do not add explanations or markdown.",
      ].join(" "),

      input: [
            "Return the translation as valid json.",
            "Use exactly this structure:",
            '{"translations":{"originalKey":"translated text"}}',
            "Keep exactly the same keys as the provided fields.",
            "",
            JSON.stringify({
                fields: cleanFields,
            }),
     ].join("\n"),

      text: {
        format: {
          type: "json_object",
        },
      },
    });

    if (!response.output_text) {
      throw new Error("OpenAI returned an empty response.");
    }

    const parsed = JSON.parse(
      response.output_text,
    ) as Partial<TranslationResponse>;

    if (
      !parsed.translations ||
      typeof parsed.translations !== "object"
    ) {
      throw new Error("OpenAI returned an invalid JSON structure.");
    }

    const translations = Object.fromEntries(
      Object.keys(cleanFields).map((key) => {
        const translatedValue = parsed.translations?.[key];

        return [
          key,
          typeof translatedValue === "string" &&
          translatedValue.trim().length > 0
            ? translatedValue.trim()
            : cleanFields[key],
        ];
      }),
    );

    return NextResponse.json({
      translations,
    });
  } catch (error) {
    console.error("Automatic translation error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown translation error.";

    return NextResponse.json(
      {
        error: "The automatic translation could not be completed.",
        details: message,
      },
      {
        status: 500,
      },
    );
  }
}