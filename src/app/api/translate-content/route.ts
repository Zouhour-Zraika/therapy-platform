import OpenAI from "openai";
import { NextResponse } from "next/server";

type Language = "en" | "fr" | "ar";

type TranslationRequest = {
  sourceLanguage: Language;
  targetLanguage: Language;
  fields: Record<string, string>;
};

type TranslationResponse = {
  translations: Record<string, string>;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageNames: Record<Language, string> = {
  en: "English",
  fr: "French",
  ar: "Arabic",
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is missing.",
        },
        {
          status: 500,
        },
      );
    }

    const body =
      (await request.json()) as Partial<TranslationRequest>;

    if (
      !body.sourceLanguage ||
      !body.targetLanguage ||
      !body.fields ||
      typeof body.fields !== "object"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid translation request.",
        },
        {
          status: 400,
        },
      );
    }

    const supportedLanguages: Language[] = [
      "en",
      "fr",
      "ar",
    ];

    if (
      !supportedLanguages.includes(
        body.sourceLanguage,
      ) ||
      !supportedLanguages.includes(
        body.targetLanguage,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported language.",
        },
        {
          status: 400,
        },
      );
    }

    const cleanFields =
      Object.fromEntries(
        Object.entries(
          body.fields,
        )
          .filter(
            (
              [, value],
            ) =>
              typeof value ===
              "string",
          )
          .map(
            (
              [key, value],
            ) => [
              key,
              value.trim(),
            ],
          )
          .filter(
            (
              [, value],
            ) =>
              value.length > 0,
          ),
      );

    if (
      Object.keys(
        cleanFields,
      ).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No text was provided.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.sourceLanguage ===
      body.targetLanguage
    ) {
      return NextResponse.json({
        translations:
          cleanFields,
      });
    }

    const sourceLanguageName =
      languageNames[
        body.sourceLanguage
      ];

    const targetLanguageName =
      languageNames[
        body.targetLanguage
      ];

    const response =
      await openai.responses.create({
        model:
          process.env
            .OPENAI_TRANSLATION_MODEL ||
          "gpt-5-mini",

        instructions: [
          "You are a professional translator for a mental health and specialist consultation platform.",
          `Translate from ${sourceLanguageName} to ${targetLanguageName}.`,
          "Use professional, natural, compassionate and clinically appropriate language.",
          "Do not add medical claims or information that is not present in the source text.",
          "Preserve URLs, email addresses, phone numbers, dates, numbers and formatting.",
          "Preserve line breaks when they are meaningful.",
          "Keep professional titles accurate and natural in the target language.",
          "When translating a person's full name into Arabic, transliterate the name naturally into Arabic script. Do not translate its meaning.",
          "When translating a person's full name into French or English, keep the original Latin-script spelling unless the source itself uses another established spelling.",
          "For lists such as services, languages, certifications or education, preserve the list structure and item order.",
          "Return only valid JSON.",
          'Use exactly this structure: {"translations":{"originalKey":"translated text"}}.',
          "Keep exactly the same keys as the input.",
          "Do not add explanations.",
          "Do not add markdown.",
        ].join(" "),

        input: [
          "Return the translation as valid JSON.",
          "Use exactly this structure:",
          '{"translations":{"originalKey":"translated text"}}',
          "Keep exactly the same keys as the provided fields.",
          "",
          JSON.stringify({
            fields:
              cleanFields,
          }),
        ].join("\n"),

        text: {
          format: {
            type:
              "json_object",
          },
        },
      });

    if (
      !response.output_text
    ) {
      throw new Error(
        "OpenAI returned an empty response.",
      );
    }

    const parsed =
      JSON.parse(
        response.output_text,
      ) as Partial<TranslationResponse>;

    if (
      !parsed.translations ||
      typeof parsed.translations !==
        "object"
    ) {
      throw new Error(
        "OpenAI returned an invalid JSON structure.",
      );
    }

    const translations =
      Object.fromEntries(
        Object.keys(
          cleanFields,
        ).map(
          (key) => {
            const translatedValue =
              parsed
                .translations?.[
                key
              ];

            return [
              key,
              typeof translatedValue ===
                "string" &&
              translatedValue
                .trim()
                .length > 0
                ? translatedValue.trim()
                : cleanFields[
                    key
                  ],
            ];
          },
        ),
      );

    return NextResponse.json({
      translations,
    });
  } catch (error) {
    console.error(
      "Automatic translation error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown translation error.";

    return NextResponse.json(
      {
        error:
          "The automatic translation could not be completed.",
        details:
          message,
      },
      {
        status: 500,
      },
    );
  }
}