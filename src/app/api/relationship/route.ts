import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    const { question, history } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        return NextResponse.json({ error: "Gemini API Anahtarı eksik. Lütfen .env.local dosyasını kontrol edin." }, { status: 500 });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const context = (history || []).map((m: { role: string; text: string }) => `${m.role === "user" ? "Danışan" : "Koç"}: ${m.text}`).join("\n");

        const prompt = `Sen empatik ve bilge bir ilişki koçusun. Türkçe cevap ver. Samimi, destekleyici ve yapıcı bir dil kullan. Psikolojik kavramları basit açıkla.

Önceki konuşma:
${context}

Danışanın yeni mesajı: "${question}"

Somut ve uygulanabilir tavsiyeler ver. 2-3 paragraf yeterli. Empati göster ama gerçekçi ol.`;

        const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
        let lastError = null;

        for (const model of models) {
            try {
                const res = await ai.models.generateContent({ model, contents: prompt });
                if (res.text) return NextResponse.json({ response: res.text });
            } catch (e: any) {
                lastError = e;
                if (e?.status === 429) continue;
                console.error(`AI Model Error (${model}):`, e);
            }
        }

        throw lastError;

    } catch (error: any) {
        console.error("Relationship API Error:", error);
        return NextResponse.json({
            error: "Yapay zeka yanıt üretirken bir hata oluştu. Lütfen tekrar deneyin."
        }, { status: 500 });
    }
}
