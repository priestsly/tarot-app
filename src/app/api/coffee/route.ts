import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "YOUR_API_KEY_HERE" && image) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const base64 = image.split(",")[1];
            const mimeType = image.split(";")[0].split(":")[1] || "image/jpeg";

            const prompt = `Sen deneyimli bir kahve falcısısın. Bu fincan fotoğrafını analiz et ve Türkçe yorum yap.

Fincandaki şekilleri, sembolleri ve desenleri yorumla. Mistik ve samimi bir dil kullan.

JSON formatında cevap ver (sadece JSON):
{
  "reading": "Genel okuma, 3-4 cümle...",
  "symbols": ["Sembol1", "Sembol2", "Sembol3", "Sembol4"],
  "future": "Gelecek yorumu, 2 cümle...",
  "love": "Aşk yorumu, 2 cümle...",
  "career": "Kariyer yorumu, 2 cümle..."
}`;

            for (const model of ["gemini-2.0-flash-lite", "gemini-2.0-flash"]) {
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
                    const match = (res.text || "").match(/\{[\s\S]*\}/);
                    if (match) return NextResponse.json(JSON.parse(match[0]));
                } catch (e: unknown) {
                    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 429) continue;
                    break;
                }
            }
        } catch { }
    }

    // Fallback
    const seed = Date.now() % 4;
    const fallbacks = [
        { reading: "Fincanınızda yolculuk ve özgürlük sembolleri hakim. Yakın zamanda hayatınızda güzel bir değişiklik olacağını gösteriyor. Uzaklardan bir haber gelebilir.", symbols: ["Kuş", "Yol", "Yıldız", "Ağaç"], future: "Önünüzde açık bir yol var. Cesaret gösterirseniz güzel fırsatlar sizi bekliyor.", love: "Duygusal hayatınızda yenilenme dönemi. Kalbinizi açık tutun.", career: "İş hayatında yükseliş işaretleri görüyorum. Sabrınızın karşılığını alacaksınız." },
        { reading: "Fincanınızda kalp ve çiçek figürleri belirgin. Sevgi dolu bir dönem sizi bekliyor. Etrafınızdaki insanların size karşı duyguları samimi.", symbols: ["Kalp", "Çiçek", "Güneş", "Balık"], future: "Güzel günler yakın. Bu dönemde attığınız adımlar uzun vadede meyvelerini verecek.", love: "Aşk hayatınız çiçek açıyor. İster yeni ister eski bir bağ, derinleşecek.", career: "Yaratıcı projeler ön plana çıkıyor. Fikirlerinize güvenin." },
        { reading: "Fincanda dağ ve merdiven sembolleri görüyorum. Hedefinize ulaşmak için tırmanmanız gereken bir yol var ama zirve yakın. Azminizi kaybetmeyin.", symbols: ["Dağ", "Merdiven", "Kartal", "Anahtar"], future: "Zorlu ama ödüllendirici bir dönemdesiniz. Sonuç sizi mutlu edecek.", love: "İlişkinizde güven teması ön plana çıkıyor. Açık iletişim şart.", career: "Büyük bir başarıya doğru ilerliyorsunuz. Hedeften şaşmayın." },
        { reading: "Fincanınızda su ve nehir şekilleri hakim. Hayatınızda duygusal bir akış başlamak üzere. Sezgileriniz çok güçlü, onlara güvenin.", symbols: ["Nehir", "Ay", "Kelebek", "Göz"], future: "Dönüşüm dönemindesiniz. Eski alışkanlıkları bırakmanın tam zamanı.", love: "Ruh eşinizle karşılaşma potansiyeli yüksek. İşaretlere dikkat edin.", career: "Sezgisel kararlar almanız gereken bir dönem. Mantık her zaman yetmez." },
    ];
    return NextResponse.json(fallbacks[seed]);
}
