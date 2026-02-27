import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    const { dream } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        return NextResponse.json({ error: "API Anahtarı eksik. Lütfen .env.local dosyasını kontrol edin." }, { status: 500 });
    }

    if (!dream || dream.trim().length < 5) {
        return NextResponse.json({ error: "Lütfen rüyanızı en az birkaç cümleyle anlatın." }, { status: 400 });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Sen profesyonel bir rüya analisti ve Jungian psikoloğsun. Danışanın anlattığı rüyayı dikkatle oku ve ONUN RÜYASINA ÖZEL bir yorum yap.

ÖNEMLİ KURALLAR:
1. Rüyanın içindeki HER detayı (mekanlar, kişiler, nesneler, duygular) tek tek analiz et.
2. Generic ve her rüyaya uyan genel geçer laflar YAPMA. Yorumun tamamen danışanın anlattığı rüyaya özgü olsun.
3. Sembol analizi yaparken, o sembolün bu rüya bağlamındaki özel anlamını açıkla.
4. Derin psikolojik ve mistik bir dil kullan ama anlaşılır ol.
5. Rüyada bahsedilen duyguları mutlaka ele al.

Danışanın rüyası: "${dream}"

Lütfen sadece saf JSON formatında yanıt ver. Asla Markdown veya backtick kullanma.
{
  "interpretation": "Bu rüyaya özel, detaylı ve derin bir yorum. En az 4-5 cümle olsun. Rüyadaki elementleri teker teker açıkla.",
  "symbols": ["Rüyadan çıkan en belirgin 3-4 sembol"],
  "advice": "Bu rüyadan çıkan kişisel ve uygulanabilir bir tavsiye cümlesi.",
  "mood": "Tek kelimelik enerji durumu"
}`;

        const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
        let lastError = null;

        for (const model of models) {
            try {
                const res = await ai.models.generateContent({ model, contents: prompt });
                const text = res.text || "";

                // Clean markdown code blocks if AI still adds them
                const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                const match = cleanText.match(/\{[\s\S]*\}/);

                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (parsed.interpretation) return NextResponse.json(parsed);
                }
            } catch (e: any) {
                lastError = e;
                if (e?.status === 429) continue;
                console.error(`AI Model Error (${model}):`, e);
            }
        }

        throw lastError;

    } catch (error: any) {
        console.error("Dream API Error:", error);
        return NextResponse.json({
            error: "Yapay zeka rüyanızı yorumlarken bir hata oluştu. Lütfen biraz sonra tekrar deneyin."
        }, { status: 500 });
    }
}
