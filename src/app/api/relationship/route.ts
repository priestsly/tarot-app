import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    const { question, history } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "YOUR_API_KEY_HERE") {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const context = (history || []).map((m: { role: string; text: string }) => `${m.role === "user" ? "Danışan" : "Koç"}: ${m.text}`).join("\n");

            const prompt = `Sen empatik ve bilge bir ilişki koçusun. Türkçe cevap ver. Samimi, destekleyici ve yapıcı bir dil kullan. Psikolojik kavramları basit açıkla.

Önceki konuşma:
${context}

Danışanın yeni mesajı: "${question}"

Somut ve uygulanabilir tavsiyeler ver. 2-3 paragraf yeterli. Empati göster ama gerçekçi ol.`;

            for (const model of ["gemini-2.0-flash-lite", "gemini-2.0-flash"]) {
                try {
                    const res = await ai.models.generateContent({ model, contents: prompt });
                    if (res.text) return NextResponse.json({ response: res.text });
                } catch (e: unknown) {
                    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 429) continue;
                    break;
                }
            }
        } catch { }
    }

    // Fallback
    const responses = [
        "Anlattıklarınızdan, ilişkinizde iletişim eksikliği olduğunu görüyorum. İletişim, her ilişkinin temelidir ve bunu güçlendirmek için şunu deneyin: Her gün 15 dakika, telefonsuz, göz göze sohbet edin.\n\nPartnerinize 'sen hep böyle yapıyorsun' yerine 'ben böyle hissediyorum' demeyi deneyin. Bu küçük dil değişikliği savunmacılığı azaltır.\n\nUnutmayın: Mükemmel ilişki yoktur, ama birlikte büyüyen ilişki vardır. 💕",
        "Bu durumda kendinize şefkat göstermeniz çok önemli. Bir ilişkinin sağlıklı olması için önce kendinizle olan ilişkinizin sağlam olması gerekir.\n\nSize tavsiyem: Bu hafta kendinize bir 'öz bakım günü' ayırın. Sevdiğiniz bir aktivite yapın, kendinizi şımartın. Partnerinize bağımlı olmadan mutlu olabilmeniz, ilişkinizi de güçlendirecektir.\n\nGüvenlik ihtiyacınızı partnerinizde değil, kendinizde bulun. Siz bütünken gelen aşk, çok daha güçlüdür. ✨",
        "Anlattığınız durum çok yaygın ve çözülebilir. Burada anahtar kelime 'sınırlar' — sağlıklı sınırlar koymak sevgisizlik değil, tam tersine kendine ve karşı tarafa saygıdır.\n\nŞunu deneyin: 'Hayır' demeniz gereken durumlarda bir nefes alın, duygularınızı hissedin ve sonra kararınızı söyleyin. Uyum sağlamak adına kendinizi feda etmeyin.\n\nHer ilişkide iki birey vardır. Bireyselliğinizi korumak, birlikteliğinizi zayıflatmaz — güçlendirir. 🌟",
    ];
    const seed = question.length + question.charCodeAt(0);
    return NextResponse.json({ response: responses[seed % responses.length] });
}
