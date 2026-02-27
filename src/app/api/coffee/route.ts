import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        return NextResponse.json({ error: "API Anahtarı eksik. Lütfen .env.local dosyasını kontrol edin." }, { status: 500 });
    }

    if (!image) {
        return NextResponse.json({ error: "Fincan fotoğrafı yüklenemedi." }, { status: 400 });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const base64 = image.split(",")[1];
        const mimeType = image.split(";")[0].split(":")[1] || "image/jpeg";

        const prompt = `Sen Türkiye'de yetişmiş, 30 yıllık deneyime sahip usta bir kahve falcısısın. Bu fincan fotoğrafını çok dikkatli incele.

ÖNEMLİ KURALLAR:
1. Fotoğraftaki ŞEKİLLERİ, DESENLERİ ve LEKELERI gerçekten analiz et ve onlara göre yorum yap.
2. Her seferinde aynı şeyleri söyleme. Fotoğrafa ÖZEL yorumlar yap.
3. Fincan çevirme geleneğine uygun, otantik bir dil kullan.
4. Fincandaki sembolleri detaylıca açıkla.
5. Samimi ve sıcak bir dil kullan, sanki karşındaki kişiyle oturuyormuşsun gibi.

Lütfen sadece saf JSON formatında yanıt ver. Asla Markdown veya backtick kullanma.
{
  "reading": "Fincanı inceleyerek yaptığın genel yorum. Gördüğün şekilleri açıkla. 4-5 cümle.",
  "symbols": ["Fincanda gördüğün 4 sembol"],
  "future": "Gelecek hakkında 2-3 cümle.",
  "love": "Aşk ve duygusal hayat hakkında 2 cümle.",
  "career": "İş ve kariyer hakkında 2 cümle."
}`;

        const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
        let lastError = null;

        for (const model of models) {
            try {
                const res = await ai.models.generateContent({
                    model,
                    contents: [
                        {
                            role: "user", parts: [
                                { text: prompt },
                                { inlineData: { data: base64, mimeType } }
                            ]
                        }
                    ],
                });
                const text = res.text || "";
                const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                const match = cleanText.match(/\{[\s\S]*\}/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (parsed.reading) return NextResponse.json(parsed);
                }
            } catch (e: any) {
                lastError = e;
                if (e?.status === 429) continue;
                console.error(`Coffee AI Error (${model}):`, e);
            }
        }

        throw lastError;

    } catch (error: any) {
        console.error("Coffee API Error:", error);
        return NextResponse.json({
            error: "Yapay zeka fincanınızı yorumlarken bir hata oluştu. Lütfen tekrar deneyin."
        }, { status: 500 });
    }
}
