import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { card, allCards, allCardsDetailed, clientName, focus } = body;

        // Danışan ismi kontrolü
        const name = clientName || "Danışanımız";
        const intentText = focus ? `Danışanın Odaklandığı Konu/Niyet: ${focus}` : "";

        // Ücretsiz çalışan Pollinations.ai Text API'si
        const systemPrompt = `Sen 'Mistik Tarot' adında, kadim bilgilere sahip bir tarot yorumcususun. 
        GÖREVİN: 
        1. Asla imla hatası yapma. Akıcı ve saygın bir İstanbul Türkçesi kullan.
        2. Bir yapay zeka olduğunu asla belli etme, doğrudan ruhsal bir rehber gibi konuş.
        3. Kartların birbiriyle olan element ve ruhsal geçişlerinden bahset.
        4. En fazla 6-7 cümle kullan ama çok derin ve etkileyici olsun.`;

        let userPrompt = "";

        if (card) {
            // Tek bir kart yorumu
            const orientation = card.isReversed ? "Ters (Reversed)" : "Düz";
            let contextText = "";
            if (allCards && allCards.length > 1) {
                const otherCards = allCards.filter((c: string) => c !== card.name);
                if (otherCards.length > 0) {
                    contextText = `Masadaki diğer açılmış kartlar: ${otherCards.join(', ')}. Tasvirini bu kartların kolektif enerjisiyle harmanla.`;
                }
            }

            userPrompt = `Danışan Adı: ${name}
            Seçilen Kart: ${card.name} (${orientation})
            Element: ${card.element}
            Anlamı: ${card.meaning}
            ${intentText}
            ${contextText}
            
            Lütfen bu kartın taşıdığı mesajı mistik bir dille fısılda. Kart ters ise uyarıcı ol.`;
        } else if (allCardsDetailed && allCardsDetailed.length > 0) {
            // Tüm masanın genel yorumu
            const cardsInfo = allCardsDetailed.map((c: any) => `- ${c.name} (${c.isReversed ? 'Ters' : 'Düz'}) [Element: ${c.element}]`).join('\n');
            userPrompt = `Danışan Adı: ${name}
            Masa Üzerindeki Tüm Kartlar:
            ${cardsInfo}
            ${intentText}
            
            Lütfen masadaki bu tüm kartların birleşiminden doğan genel bir kehanet ve ruhsal okuma yap. Kartların birbirini nasıl etkilediğini ve danışanın yolculuğundaki genel mesajı mistik ve akıcı bir Türkçeyle anlat.`;
        } else {
            return NextResponse.json({ error: "Kart bilgisi eksik." }, { status: 400 });
        }

        const res = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: 'openai',
                seed: Math.floor(Math.random() * 100000),
            }),
        });

        if (!res.ok) throw new Error(`AI Api hatası: ${res.statusText}`);
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
