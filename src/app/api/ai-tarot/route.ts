import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const TAROT_CARDS = [
    { name: "Deli", image: "/Cards/00-TheFool.jpg" },
    { name: "Büyücü", image: "/Cards/01-TheMagician.jpg" },
    { name: "Azize", image: "/Cards/02-TheHighPriestess.jpg" },
    { name: "İmparatoriçe", image: "/Cards/03-TheEmpress.jpg" },
    { name: "İmparator", image: "/Cards/04-TheEmperor.jpg" },
    { name: "Aziz", image: "/Cards/05-TheHierophant.jpg" },
    { name: "Aşıklar", image: "/Cards/06-TheLovers.jpg" },
    { name: "Savaş Arabası", image: "/Cards/07-TheChariot.jpg" },
    { name: "Güç", image: "/Cards/08-Strength.jpg" },
    { name: "Ermiş", image: "/Cards/09-TheHermit.jpg" },
    { name: "Kader Çarkı", image: "/Cards/10-WheelOfFortune.jpg" },
    { name: "Adalet", image: "/Cards/11-Justice.jpg" },
    { name: "Asılmış Adam", image: "/Cards/12-TheHangedMan.jpg" },
    { name: "Ölüm", image: "/Cards/13-Death.jpg" },
    { name: "Denge", image: "/Cards/14-Temperance.jpg" },
    { name: "Şeytan", image: "/Cards/15-TheDevil.jpg" },
    { name: "Yıkılan Kule", image: "/Cards/16-TheTower.jpg" },
    { name: "Yıldız", image: "/Cards/17-TheStar.jpg" },
    { name: "Ay", image: "/Cards/18-TheMoon.jpg" },
    { name: "Güneş", image: "/Cards/19-TheSun.jpg" },
    { name: "Mahkeme", image: "/Cards/20-Judgement.jpg" },
    { name: "Dünya", image: "/Cards/21-TheWorld.jpg" }
];

function drawCards(): { name: string, image: string }[] {
    const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
}

export async function POST(req: Request) {
    const { question } = await req.json();
    const drawnCards = drawCards();
    const cardNames = drawnCards.map(c => c.name);
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "YOUR_API_KEY_HERE") {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Sen deneyimli bir tarot falcısısın. Türkçe cevap ver. Mistik ve samimi bir dil kullan.

Danışanın sorusu: "${question}"

Çekilen 3 kart: ${cardNames.join(", ")}

Bu kartları danışanın sorusuyla ilişkilendirerek detaylı bir yorum yap. Her kartı ayrı ayrı açıkla, sonra genel bir yorum ve tavsiye ver. 4-5 paragraf olsun. Kartların birbirleriyle ilişkisini de açıkla.`;

            for (const model of ["gemini-2.0-flash-lite", "gemini-2.0-flash"]) {
                try {
                    const res = await ai.models.generateContent({ model, contents: prompt });
                    if (res.text) return NextResponse.json({ cards: drawnCards, interpretation: res.text });
                } catch (e: unknown) {
                    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 429) continue;
                    break;
                }
            }
        } catch { }
    }

    // Fallback
    const seed = question.length + cardNames[0].charCodeAt(0);
    const intros = [
        `Kartlarınız ilginç bir tablo çiziyor. ${cardNames[0]}, ${cardNames[1]} ve ${cardNames[2]} bir araya geldiğinde güçlü bir mesaj ortaya çıkıyor.`,
        `${cardNames[0]} kartı başlangıç noktanızı, ${cardNames[1]} mevcut durumunuzu, ${cardNames[2]} ise geleceğinizi yansıtıyor.`,
        `Bu üç kart — ${cardNames[0]}, ${cardNames[1]}, ${cardNames[2]} — birlikte okunduğunda derin bir hikaye anlatıyor.`,
    ];
    const middles = [
        `İlk kartınız olan ${cardNames[0]}, içsel bir dönüşüme işaret ediyor. Bilinçaltınızda önemli bir değişim süreci başlamış durumda.`,
        `${cardNames[1]} kartı, şu anda bir kararsızlık noktasında olduğunuzu gösteriyor. Ama endişelenmeyin, netlik yakında gelecek.`,
        `Son kartınız ${cardNames[2]}, umut verici bir gelecek vaat ediyor. Sabırlı olursanız güzel sonuçlar sizi bekliyor.`,
    ];
    const advices = [
        "Sezgilerinize güvenin ve akışa bırakın. Evren sizin için en iyisini hazırlıyor.",
        "Bu dönemde kendinize karşı nazik olun. Her şeyin bir zamanı var ve sizin zamanınız yaklaşıyor.",
        "Geçmişi bırakın, şimdiye odaklanın. Kartlarınız yeni kapıların açılacağını müjdeliyor.",
    ];

    const interpretation = `${intros[seed % intros.length]}\n\n${middles[seed % middles.length]}\n\n${middles[(seed + 1) % middles.length]}\n\n${advices[seed % advices.length]}`;
    return NextResponse.json(
        { cards: drawnCards, interpretation },
        { 
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            } 
        }
    );
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}
