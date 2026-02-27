import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { signName, signSymbol, element, planet, moonPhase, birthDate, birthTime, risingSign } = body;

        const ai = new GoogleGenAI({ apiKey });

        const today = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

        const prompt = `Sen deneyimli bir astroloji uzmanısın. Türkçe cevap ver. Bugünün tarihi: ${today}.

Kişi bilgileri:
- Güneş burcu: ${signName} (${signSymbol})
- Element: ${element}
- Yönetici gezegen: ${planet}
- Ay fazı: ${moonPhase}
${birthDate ? `- Doğum tarihi: ${birthDate}` : ""}
${birthTime ? `- Doğum saati: ${birthTime}` : ""}
${risingSign ? `- Yükselen burç: ${risingSign}` : ""}

Aşağıdaki formatta, bugün için KİŞİSELLEŞTİRİLMİŞ ve GÜNCEL bir astroloji yorumu oluştur. Her bölüm 2-3 cümle olsun. Samimi ve mistik bir dil kullan.

JSON formatında cevap ver (başka hiçbir şey yazma, sadece JSON):
{
  "general": "Genel günlük yorum...",
  "love": "Aşk ve ilişkiler yorumu...",
  "career": "Kariyer ve para yorumu...",
  "health": "Sağlık ve enerji yorumu...",
  "advice": "Günün tavsiyesi (tek cümle)...",
  "luckyHour": "Şanslı saat aralığı (ör: 14:00-16:00)...",
  "energy": 1-10 arası enerji seviyesi (sayı olarak),
  "mood": "Günün genel modu (tek kelime: Huzurlu/Enerjik/Düşünceli/Tutkulu/Sakin)"
}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        const text = response.text || "";

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
        }

        const horoscope = JSON.parse(jsonMatch[0]);
        return NextResponse.json(horoscope);

    } catch (error: unknown) {
        console.error("Horoscope API error:", error);
        return NextResponse.json({ error: "AI servis hatası" }, { status: 500 });
    }
}
