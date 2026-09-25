import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

type Language = "en" | "fr" | "ar";
type ProfileTranslation = {
  full_name: string;
  occupation: string;
  education_level: string;
};
type TranslationResponse = Record<Language, ProfileTranslation>;

const model = process.env.OPENAI_TRANSLATION_MODEL || "gpt-5-mini";

function cleanJsonResponse(text: string) {
  return text.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Translation service is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const sourceLanguage: Language = ["en", "fr", "ar"].includes(body.sourceLanguage) ? body.sourceLanguage : "en";
    const source: ProfileTranslation = {
      full_name: String(body.fullName || "").trim(),
      occupation: String(body.occupation || "").trim(),
      education_level: String(body.educationLevel || "").trim(),
    };

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model,
      store: false,
      input: [
        {
          role: "system",
          content:
            "You translate patient profile display data for a professional psychotherapy platform. " +
            "Return natural versions in English (en), French (fr), and Modern Standard Arabic (ar). " +
            "The input language is supplied separately. Preserve meaning exactly and never add information. " +
            "For full_name, do not translate the person's identity: preserve it in Latin-script languages and use a careful phonetic transliteration for Arabic when appropriate; if already Arabic, provide a conservative Latin transliteration for en/fr. " +
            "Translate occupation and education_level naturally. Preserve empty strings. Return only valid JSON with exactly this shape: " +
            '{"en":{"full_name":"","occupation":"","education_level":""},"fr":{"full_name":"","occupation":"","education_level":""},"ar":{"full_name":"","occupation":"","education_level":""}}.',
        },
        {
          role: "user",
          content: JSON.stringify({ sourceLanguage, profile: source }),
        },
      ],
    });

    const translations = JSON.parse(cleanJsonResponse(response.output_text)) as TranslationResponse;
    for (const lang of ["en", "fr", "ar"] as const) {
      if (!translations?.[lang]) throw new Error(`Missing ${lang} translation`);
      for (const key of ["full_name", "occupation", "education_level"] as const) {
        if (typeof translations[lang][key] !== "string") throw new Error(`Invalid ${lang}.${key}`);
      }
    }

    // The exact text entered by the patient remains authoritative in its source language.
    translations[sourceLanguage] = source;
    return NextResponse.json({ translations });
  } catch (error) {
    console.error("Patient profile translation failed:", error);
    return NextResponse.json({ error: "Unable to translate patient profile" }, { status: 500 });
  }
}
