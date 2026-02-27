import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// In-memory cache: signName -> { data, timestamp }
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const body = await req.json();
        const { signName, signSymbol, element, planet, moonPhase, birthDate, birthTime, risingSign } = body;

        // Check cache first (per sign, per day)
        const today = new Date().toISOString().split("T")[0];
        const cacheKey = `${signName}-${today}-${risingSign || "none"}`;

        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json(cached.data);
        }

        // Check API key
        if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
            return NextResponse.json(generateFallback(signName, element, moonPhase), { status: 200 });
        }

        const ai = new GoogleGenAI({ apiKey });
        const todayStr = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

        const prompt = `Sen deneyimli bir astroloji uzmanısın. Türkçe cevap ver. Bugünün tarihi: ${todayStr}.

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

        // Try multiple models in order
        const models = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];
        let lastError = null;

        for (const model of models) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                });

                const text = response.text || "";
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) continue;

                const horoscope = JSON.parse(jsonMatch[0]);

                // Cache it
                cache.set(cacheKey, { data: horoscope, timestamp: Date.now() });

                return NextResponse.json(horoscope);
            } catch (err: unknown) {
                lastError = err;
                // If rate limited, try next model
                if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 429) {
                    continue;
                }
                break;
            }
        }

        // All models failed — return smart fallback
        console.error("All AI models failed, using fallback:", lastError);
        const fallback = generateFallback(signName, element, moonPhase);
        return NextResponse.json(fallback);

    } catch (error: unknown) {
        console.error("Horoscope API error:", error);
        return NextResponse.json(generateFallback("Koç", "Ateş", "Dolunay"));
    }
}

// ── Smart Fallback Generator (no AI needed) ──
function generateFallback(signName: string, element: string, moonPhase: string) {
    const now = new Date();
    const seed = now.getDate() + now.getMonth() * 31 + signName.charCodeAt(0) + signName.charCodeAt(signName.length - 1);

    const generalPool = [
        `Bugün ${signName} burcu için kozmik enerjiler güçlü. ${moonPhase} etkisiyle iç dünyanızda önemli farkındalıklar yaşayabilirsiniz. Sezgilerinize güvenin ve akışa bırakın.`,
        `${element} elementinin gücüyle bugün kendinizi her zamankinden daha kararlı hissedeceksiniz. ${moonPhase} bu hissi pekiştiriyor. Önemli kararlar için iyi bir gün.`,
        `Yıldızlar bugün ${signName} burcuna cesaret ve netlik sunuyor. Ertelediğiniz o konuyu ele almanın tam zamanı. Evren sizinle.`,
        `Bugün ${signName} için dönüm noktası niteliğinde bir gün olabilir. ${moonPhase} enerjisi duygusal derinliğinizi artırıyor. Kalbinizin sesini dinleyin.`,
        `${element} enerjisi bugün doruk noktasında. ${signName} olarak yaratıcılığınızı kullanabileceğiniz fırsatlar kapınızı çalabilir. Gözlerinizi açık tutun.`,
        `Bugün evrenin size gönderdiği mesajlara dikkat edin. ${moonPhase} döneminde ${signName} burcu için senkronizasyonlar artıyor. Rastlantı diye bir şey yok.`,
        `${signName} burcu bugün ilham dolu bir gün geçirecek. ${element} elementinin etkisiyle zihniniz berrak, kararlarınız net olacak.`,
    ];

    const lovePool = [
        "Duygusal bağlarınız bugün derinleşiyor. Partnerinizle veya sevdiklerinizle kaliteli vakit geçirmek için ideal bir gün.",
        "Kalbiniz bugün ekstra hassas. Bu hassasiyeti bir zayıflık olarak değil, güç olarak kullanın. Sevgi vermekten korkmayın.",
        "Romantik enerjiler yükselişte. Beklenmedik bir mesaj veya bakış bugünü özel kılabilir.",
        "İlişkinizde dürüst bir konuşma başlatmanın tam zamanı. Kırılganlık göstermek cesaret ister.",
        "Bugün aşk gezegeniniz Venüs size gülümsüyor. İster yeni tanıştığınız biri olsun, ister uzun süreli partneriniz — bağ güçleniyor.",
    ];

    const careerPool = [
        "İş hayatınızda bugün önemli bir gelişme olabilir. Hazırlıklı olun ve fırsatları değerlendirin.",
        "Finansal kararlar için sezgilerinize güvenin ama mantığınızı da elden bırakmayın. Denge anahtardır.",
        "Kreatif projeler bugün ön plana çıkıyor. Fikirlerinizi paylaşmaktan çekinmeyin, destek bulabilirsiniz.",
        "Kariyerinizde sabır meyvesini veriyor. Yakında emeklerinizin karşılığını göreceksiniz.",
        "Bugün iş ortamında liderlik enerjiniz güçlü. Takım arkadaşlarınız size güveniyor.",
    ];

    const healthPool = [
        "Bedeninizi dinleyin. Bugün hafif bir yürüyüş veya meditasyon enerjinizi yükseltebilir.",
        "Enerji seviyeniz stabil ama kendimize biraz daha özen göstermemiz gereken bir gün. Bol su için.",
        "Fiziksel enerjiniz yüksek. Bu enerjiyi spor veya yaratıcı bir aktiviteye yönlendirin.",
        "Stres seviyeleri yükselmeye meyilli. Doğada vakit geçirmek veya nefes egzersizleri yapmanızı öneririm.",
    ];

    const advicePool = [
        "Bugün kendinize karşı şefkatli olun — her şeyi mükemmel yapmanız gerekmiyor.",
        "Bırakmayı öğrenin; tutunmak her zaman güç değildir.",
        "Küçük jestler bugün büyük farklar yaratabilir.",
        "Sezgileriniz aklınızdan daha keskin — onlara güvenin.",
        "Bugün bir şeye 'hayır' demek, kendinize 'evet' demek anlamına gelebilir.",
        "Her kapanış yeni bir açılıştır — değişimi kucaklayın.",
    ];

    const moodPool = ["Huzurlu", "Enerjik", "Düşünceli", "Tutkulu", "Sakin", "İlhamlı", "Kararlı"];
    const hours = ["09:00-11:00", "11:00-13:00", "14:00-16:00", "16:00-18:00", "19:00-21:00"];

    return {
        general: generalPool[seed % generalPool.length],
        love: lovePool[(seed + 3) % lovePool.length],
        career: careerPool[(seed + 7) % careerPool.length],
        health: healthPool[(seed + 11) % healthPool.length],
        advice: advicePool[(seed + 5) % advicePool.length],
        luckyHour: hours[(seed + 2) % hours.length],
        energy: (seed % 5) + 5, // 5-9 range
        mood: moodPool[(seed + 1) % moodPool.length],
    };
}
