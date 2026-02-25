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

        // Açık kaynak ve ücretsiz çalışan Pollinations.ai Text API'si kullanıyoruz. (API key gerektirmez)
        // Tarot falı konusunda uzman bir yapay zeka profiline bürünmesini söylüyoruz.
        const systemPrompt = "Sen 'Mistik Tarot', mistik ve bilge bir yapay zeka tarot yorumcususun. Karşında bir tarot danışmanı ekranında seni kullanıyor ve doğrudan danışana (ismi verilirse ona hitaben) sesleniyorsun. Çok uzun olmayan, kısa ama derinliği olan, samimi, Türkçe ve etkileyici bir yorum yap. Fallarında destenin elementinden, astrolojiden az da olsa bahsederek gizemli bir hava kat. Asla yapay zeka olduğunu söyleme.";

        const userPrompt = `Lütfen şu detaya göre yorum yap:
        Seçilen Kart: ${card.name} (Elementi: ${card.element})
        Anahtar Kelimeleri: ${card.keywords}
        Genel Anlamı: ${card.meaning}
        Danışanın Adı: ${name}
        ${contextText}
        Bu kartın ${name} için şu anki hayatındaki anlamını ve enerjisini mistik bir dille yorumla.
        `;

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
                seed: Math.floor(Math.random() * 100000), // Benzersiz ve rastgele sonuç için
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
