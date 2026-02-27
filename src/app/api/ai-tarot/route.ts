import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const TAROT_CARDS = [
    "Büyücü", "Azize", "İmparatoriçe", "İmparator", "Aziz", "Aşıklar", "Savaş Arabası", "Güç", "Ermiş", "Kader Çarkı",
    "Adalet", "Asılmış Adam", "Ölüm", "Denge", "Şeytan", "Yıkılan Kule", "Yıldız", "Ay", "Güneş", "Mahkeme", "Dünya", "Deli",
    "Kupa As", "Kupa İki", "Kupa Üç", "Kılıç As", "Kılıç İki", "Kılıç Üç", "Asa As", "Asa İki", "Tılsım As", "Tılsım İki",
];

function drawCards(): string[] {
    const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
}

export async function POST(req: Request) {
    const { question } = await req.json();
    const cards = drawCards();
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "YOUR_API_KEY_HERE") {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Sen deneyimli bir tarot falcısısın. Türkçe cevap ver. Mistik ve samimi bir dil kullan.

Danışanın sorusu: "${question}"

Çekilen 3 kart: ${cards.join(", ")}

Bu kartları danışanın sorusuyla ilişkilendirerek detaylı bir yorum yap. Her kartı ayrı ayrı açıkla, sonra genel bir yorum ve tavsiye ver. 4-5 paragraf olsun. Kartların birbirleriyle ilişkisini de açıkla.`;

            for (const model of ["gemini-2.0-flash-lite", "gemini-2.0-flash"]) {
                try {
                    const res = await ai.models.generateContent({ model, contents: prompt });
                    if (res.text) return NextResponse.json({ cards, interpretation: res.text });
                } catch (e: unknown) {
                    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 429) continue;
                    break;
                }
            }
        } catch { }
    }

    // Fallback
    const seed = question.length + cards[0].charCodeAt(0);
    const intros = [
        `Kartlarınız ilginç bir tablo çiziyor. ${cards[0]}, ${cards[1]} ve ${cards[2]} bir araya geldiğinde güçlü bir mesaj ortaya çıkıyor.`,
        `${cards[0]} kartı başlangıç noktanızı, ${cards[1]} mevcut durumunuzu, ${cards[2]} ise geleceğinizi yansıtıyor.`,
        `Bu üç kart — ${cards[0]}, ${cards[1]}, ${cards[2]} — birlikte okunduğunda derin bir hikaye anlatıyor.`,
    ];
    const middles = [
        `İlk kartınız olan ${cards[0]}, içsel bir dönüşüme işaret ediyor. Bilinçaltınızda önemli bir değişim süreci başlamış durumda.`,
        `${cards[1]} kartı, şu anda bir kararsızlık noktasında olduğunuzu gösteriyor. Ama endişelenmeyin, netlik yakında gelecek.`,
        `Son kartınız ${cards[2]}, umut verici bir gelecek vaat ediyor. Sabırlı olursanız güzel sonuçlar sizi bekliyor.`,
    ];
    const advices = [
        "Sezgilerinize güvenin ve akışa bırakın. Evren sizin için en iyisini hazırlıyor.",
        "Bu dönemde kendinize karşı nazik olun. Her şeyin bir zamanı var ve sizin zamanınız yaklaşıyor.",
        "Geçmişi bırakın, şimdiye odaklanın. Kartlarınız yeni kapıların açılacağını müjdeliyor.",
    ];

    const interpretation = `${intros[seed % intros.length]}\n\n${middles[seed % middles.length]}\n\n${middles[(seed + 1) % middles.length]}\n\n${advices[seed % advices.length]}`;
    return NextResponse.json({ cards, interpretation });
}
