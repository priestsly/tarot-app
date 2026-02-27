import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const { month, year } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
            return NextResponse.json({ error: "API Key eksik" }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
            Sen profesyonel bir astrolog ve astronom veri uzmanısın. 
            ${year} yılı ${month}. ayı (1-Ocak, 12-Aralık şeklinde) için Türkiye yerel saatine göre gerçekleşecek gerçek kozmik olayları sağla.
            
            Özellikle şunları dahil et:
            - Yeni Ay (New Moon) ve Dolunay (Full Moon) tarihleri ve saatleri.
            - Varsa Güneş veya Ay Tutulmaları.
            - Gezegenlerin burç değiştirmesi (Güneş, Merkür, Venüs, Mars, Jüpiter, Satürn).
            - Retrograd (Geri hareket) başlangıç ve bitişleri.
            - Önemli astrolojik portallar (8-8, 11-11 vb.) veya ekinokslar.

            Yanıtı SADECE ve kesinlikle aşağıdaki JSON formatında ver, başka hiçbir metin ekleme:
            {
                "events": [
                    {
                        "date": "MM-DD",
                        "name": "Olay Adı",
                        "emoji": "☀️",
                        "type": "new_moon" | "full_moon" | "retrograde" | "eclipse" | "season" | "portal",
                        "sign": "Burç Adı (opsiyonel)",
                        "time": "HH:mm (opsiyonel)",
                        "desc": "Kısa ve Türk astroloji terminolojisine uygun açıklama"
                    }
                ],
                "monthlySummary": "Bu ayın genel enerjisi hakkında kısa, mistik ve profesyonel bir özet."
            }
        `;

        const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
        let lastError = null;

        for (const model of models) {
            try {
                const result = await ai.models.generateContent({
                    model: model,
                    contents: prompt
                });

                const responseText = result.text || "";
                const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
                const data = JSON.parse(cleanJson);
                return NextResponse.json(data);
            } catch (err: any) {
                lastError = err;
                console.warn(`${model} failed, trying next...`, err.message);
                if (err.status !== 429) break; // If it's not a quota error, stop
            }
        }

        throw lastError;
    } catch (error: any) {
        console.error("Calendar API Final Error:", error);
        return NextResponse.json({
            error: error.status === 429 ? "AI Kotası Doldu (Lütfen biraz bekleyin)" : "Veriler alınamadı"
        }, { status: error.status || 500 });
    }
}
