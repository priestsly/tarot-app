import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { card, allCards, clientName } = body;

        if (!card) {
            return NextResponse.json({ error: "Kart bilgisi eksik." }, { status: 400 });
        }

        // Danışan ismi kontrolü
        const name = clientName || "Danışanımız";

        // Masa üzerinde başka açık kartlar da varsa yorumu ona göre zenginleştirebilmek için:
        let contextText = "";
        if (allCards && allCards.length > 1) {
            const otherCards = allCards.filter((c: string) => c !== card.name);
            if (otherCards.length > 0) {
                contextText = `Masadaki diğer açık kartlar: ${otherCards.join(', ')}. Lütfen o anki destedeki enerji bağlamını da kısaca düşün.`;
            }
        }

        // Ücretsiz çalışan Pollinations.ai Text API'si - Daha kaliteli sonuç için modeli 'search' ve 'creative' dengesinde tutuyoruz.
        const systemPrompt = `Sen 'Mistik Tarot' adında, kadim bilgilere sahip, Türkçe diline ve imla kurallarına mükemmel derecede hakim bir tarot yorumcususun. 
        GÖREVİN: 
        1. Asla imla hatası yapma. Cümle başları büyük harf olsun, noktalamaya dikkat et.
        2. Akıcı, saygın ve mistik bir İstanbul Türkçesi kullan. 'Slm', 'nası' gibi kısaltmalar asla kullanma.
        3. Bir yapay zeka olduğunu asla belli etme, doğrudan ruhsal bir rehber gibi konuş.
        4. Kartın elementinden ve gizemli enerjisinden bahset. 
        5. Kısa (en fazla 4-5 cümle) ama çok etkileyici konuş.`;

        const intentText = body.focus ? `Danışanın Odaklandığı Konu/Niyet: ${body.focus}` : "";

        const userPrompt = `Danışan Adı: ${name}
        Seçilen Kart: ${card.name}
        Element: ${card.element}
        Anahtar Kelimeler: ${card.keywords}
        Anlamı: ${card.meaning}
        ${intentText}
        ${contextText}
        
        Lütfen yukarıdaki bilgiler ve özellikle danışanın niyeti (eğer belirtilmişse) ışığında, bu kartın ${name} için taşıdığı mesajı mistik ve kusursuz bir Türkçeyle fısılda.`;

        const res = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: 'openai', // Public API'de openai taklidi yapan daha kaliteli modeli seçiyoruz
                seed: Math.floor(Math.random() * 100000),
            }),
        });

        if (!res.ok) {
            throw new Error(`AI Api hatası: ${res.statusText}`);
        }

        const data = await res.text();

        return NextResponse.json({ interpretation: data });
    } catch (error) {
        console.error("AI yorumlama hatası:", error);
        return NextResponse.json(
            { interpretation: "Pusların arkası şu an görünmüyor... Kartlarımız biraz yoruldu, lütfen biraz sonra tekrar deneyin." },
            { status: 500 }
        );
    }
}
