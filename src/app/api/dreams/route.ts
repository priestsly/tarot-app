import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    const { dream } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        return NextResponse.json({ error: "Gemini API Anahtarı eksik. Lütfen .env.local dosyasını kontrol edin." }, { status: 500 });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Sen mistik ve derin psikolojik analizler yapan profesyonel bir rüya yorumcususun. Danışan sana rüyasını anlatıyor.
Lütfen sadece JSON formatında yanıt ver. Yanıtında asla Markdown ('\`\`\`json') kullanma, sadece saf JSON metni döndür.

Danışanın rüyası: "${dream}"

JSON formatı şu şekilde olmalı:
{
  "interpretation": "Rüyanın derin, mistik ve psikolojik yorumu (en az 3-4 cümle).",
  "symbols": ["Sembol1", "Sembol2", "Sembol3"],
  "advice": "Rüyadan çıkarılacak tek cümlelik derin bir tavsiye.",
  "mood": "Tek kelimelik duygu durumu (Huzurlu/Dikkatli/Karışık/Aydınlatıcı vs.)"
}`;

        // Just try gemini-2.5-flash as the primary, fallback to 2.0 if needed
        const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
        let lastError = null;

        for (const model of models) {
            try {
                const res = await ai.models.generateContent({ model, contents: prompt });
                const text = res.text || "";

                // Clean markdown code blocks if AI still adds them despite instruction
                const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

                return NextResponse.json(JSON.parse(cleanText));
            } catch (e: any) {
                lastError = e;
                if (e?.status === 429) continue; // Try next model on rate limit
                console.error(`AI Model Error (${model}):`, e);
            }
        }

        throw lastError;

    } catch (error: any) {
        console.error("Dream API Error:", error);
        return NextResponse.json({
            error: "Yapay zeka rüyanızı yorumlarken bir hata oluştu. Lütfen tekrar deneyin."
        }, { status: 500 });
    }
}
