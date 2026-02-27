// ── Zodiac Signs ──
export interface ZodiacSign {
    id: string;
    name: string;
    symbol: string;
    element: string;
    elementEmoji: string;
    modality: string;
    planet: string;
    dateRange: string;
    traits: string[];
    lucky: { numbers: number[]; color: string; day: string; stone: string };
    compatible: string[];
    incompatible: string[];
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
    { id: "aries", name: "Koç", symbol: "♈", element: "Ateş", elementEmoji: "🔥", modality: "Kardinal", planet: "Mars", dateRange: "21 Mar - 19 Nis", traits: ["Cesur", "Enerjik", "Lider", "Sabırsız"], lucky: { numbers: [1, 9, 17], color: "Kırmızı", day: "Salı", stone: "Elmas" }, compatible: ["Aslan", "Yay", "İkizler"], incompatible: ["Yengeç", "Terazi"] },
    { id: "taurus", name: "Boğa", symbol: "♉", element: "Toprak", elementEmoji: "🌍", modality: "Sabit", planet: "Venüs", dateRange: "20 Nis - 20 May", traits: ["Kararlı", "Sadık", "Sabırlı", "İnatçı"], lucky: { numbers: [2, 6, 24], color: "Yeşil", day: "Cuma", stone: "Zümrüt" }, compatible: ["Başak", "Oğlak", "Yengeç"], incompatible: ["Aslan", "Kova"] },
    { id: "gemini", name: "İkizler", symbol: "♊", element: "Hava", elementEmoji: "💨", modality: "Değişken", planet: "Merkür", dateRange: "21 May - 20 Haz", traits: ["Meraklı", "İletişimci", "Çok yönlü", "Kararsız"], lucky: { numbers: [3, 5, 14], color: "Sarı", day: "Çarşamba", stone: "Akik" }, compatible: ["Terazi", "Kova", "Koç"], incompatible: ["Başak", "Balık"] },
    { id: "cancer", name: "Yengeç", symbol: "♋", element: "Su", elementEmoji: "💧", modality: "Kardinal", planet: "Ay", dateRange: "21 Haz - 22 Tem", traits: ["Duygusal", "Koruyucu", "Sezgisel", "Hassas"], lucky: { numbers: [2, 7, 11], color: "Gümüş", day: "Pazartesi", stone: "İnci" }, compatible: ["Akrep", "Balık", "Boğa"], incompatible: ["Koç", "Terazi"] },
    { id: "leo", name: "Aslan", symbol: "♌", element: "Ateş", elementEmoji: "🔥", modality: "Sabit", planet: "Güneş", dateRange: "23 Tem - 22 Ağu", traits: ["Karizmatik", "Cömert", "Yaratıcı", "Gururlu"], lucky: { numbers: [1, 4, 19], color: "Altın", day: "Pazar", stone: "Yakut" }, compatible: ["Koç", "Yay", "Terazi"], incompatible: ["Boğa", "Akrep"] },
    { id: "virgo", name: "Başak", symbol: "♍", element: "Toprak", elementEmoji: "🌍", modality: "Değişken", planet: "Merkür", dateRange: "23 Ağu - 22 Eyl", traits: ["Analitik", "Düzenli", "Yardımsever", "Mükemmeliyetçi"], lucky: { numbers: [5, 14, 23], color: "Lacivert", day: "Çarşamba", stone: "Safir" }, compatible: ["Boğa", "Oğlak", "Akrep"], incompatible: ["İkizler", "Yay"] },
    { id: "libra", name: "Terazi", symbol: "♎", element: "Hava", elementEmoji: "💨", modality: "Kardinal", planet: "Venüs", dateRange: "23 Eyl - 22 Eki", traits: ["Adil", "Diplomatik", "Estetik", "Kararsız"], lucky: { numbers: [6, 15, 24], color: "Pembe", day: "Cuma", stone: "Opal" }, compatible: ["İkizler", "Kova", "Aslan"], incompatible: ["Yengeç", "Oğlak"] },
    { id: "scorpio", name: "Akrep", symbol: "♏", element: "Su", elementEmoji: "💧", modality: "Sabit", planet: "Plüton", dateRange: "23 Eki - 21 Kas", traits: ["Tutkulu", "Kararlı", "Gizemli", "Kıskanç"], lucky: { numbers: [8, 11, 18], color: "Bordo", day: "Salı", stone: "Topaz" }, compatible: ["Yengeç", "Balık", "Başak"], incompatible: ["Aslan", "Kova"] },
    { id: "sagittarius", name: "Yay", symbol: "♐", element: "Ateş", elementEmoji: "🔥", modality: "Değişken", planet: "Jüpiter", dateRange: "22 Kas - 21 Ara", traits: ["Özgür", "İyimser", "Filozof", "Sorumsuz"], lucky: { numbers: [3, 9, 12], color: "Mor", day: "Perşembe", stone: "Turkuaz" }, compatible: ["Koç", "Aslan", "Kova"], incompatible: ["Başak", "Balık"] },
    { id: "capricorn", name: "Oğlak", symbol: "♑", element: "Toprak", elementEmoji: "🌍", modality: "Kardinal", planet: "Satürn", dateRange: "22 Ara - 19 Oca", traits: ["Disiplinli", "Hırslı", "Gelenekçi", "Mesafeli"], lucky: { numbers: [4, 8, 22], color: "Kahverengi", day: "Cumartesi", stone: "Garnet" }, compatible: ["Boğa", "Başak", "Balık"], incompatible: ["Koç", "Terazi"] },
    { id: "aquarius", name: "Kova", symbol: "♒", element: "Hava", elementEmoji: "💨", modality: "Sabit", planet: "Uranüs", dateRange: "20 Oca - 18 Şub", traits: ["Yenilikçi", "Bağımsız", "İnsancıl", "Asi"], lucky: { numbers: [4, 7, 11], color: "Elektrik Mavisi", day: "Cumartesi", stone: "Ametist" }, compatible: ["İkizler", "Terazi", "Yay"], incompatible: ["Boğa", "Akrep"] },
    { id: "pisces", name: "Balık", symbol: "♓", element: "Su", elementEmoji: "💧", modality: "Değişken", planet: "Neptün", dateRange: "19 Şub - 20 Mar", traits: ["Empatik", "Hayalperest", "Sanatsal", "Kaçınmacı"], lucky: { numbers: [3, 7, 12], color: "Deniz Yeşili", day: "Perşembe", stone: "Akvamarin" }, compatible: ["Yengeç", "Akrep", "Oğlak"], incompatible: ["İkizler", "Yay"] },
];

// ── Get zodiac sign from date ──
export function getZodiacSign(month: number, day: number): ZodiacSign {
    const idx =
        (month === 3 && day >= 21) || (month === 4 && day <= 19) ? 0 :
            (month === 4 && day >= 20) || (month === 5 && day <= 20) ? 1 :
                (month === 5 && day >= 21) || (month === 6 && day <= 20) ? 2 :
                    (month === 6 && day >= 21) || (month === 7 && day <= 22) ? 3 :
                        (month === 7 && day >= 23) || (month === 8 && day <= 22) ? 4 :
                            (month === 8 && day >= 23) || (month === 9 && day <= 22) ? 5 :
                                (month === 9 && day >= 23) || (month === 10 && day <= 22) ? 6 :
                                    (month === 10 && day >= 23) || (month === 11 && day <= 21) ? 7 :
                                        (month === 11 && day >= 22) || (month === 12 && day <= 21) ? 8 :
                                            (month === 12 && day >= 22) || (month === 1 && day <= 19) ? 9 :
                                                (month === 1 && day >= 20) || (month === 2 && day <= 18) ? 10 : 11;
    return ZODIAC_SIGNS[idx];
}

// ── Moon phase calculation (More Precise for 2026) ──
export function getMoonPhase(date: Date): { name: string; emoji: string; desc: string } {
    // Reference: Known New Moon on Jan 18, 2026, 22:53 (TR Time)
    const newMoonRef = new Date(2026, 0, 18, 22, 53).getTime();
    const synodicMonth = 29.530588 * 24 * 60 * 60 * 1000;
    const diff = date.getTime() - newMoonRef;
    const phase = ((diff % synodicMonth) + synodicMonth) % synodicMonth;
    const age = phase / (24 * 60 * 60 * 1000);

    if (age < 1.84) return { name: "Yeni Ay", emoji: "🌑", desc: "Yeni başlangıçlar ve niyet belirleme zamanı." };
    if (age < 5.53) return { name: "Hilal (Büyüyen)", emoji: "🌒", desc: "Niyetlerinizi eyleme dökme zamanı." };
    if (age < 9.22) return { name: "İlk Dördün", emoji: "🌓", desc: "Kararlılık ve karar verme zamanı." };
    if (age < 12.91) return { name: "Şişkin Ay", emoji: "🌔", desc: "Sabır ve olgunlaşma zamanı." };
    if (age < 16.61) return { name: "Dolunay", emoji: "🌕", desc: "Tamamlanma ve aydınlanma zamanı." };
    if (age < 20.30) return { name: "Şişkin Ay (Küçülen)", emoji: "🌖", desc: "Minnettarlık ve paylaşım zamanı." };
    if (age < 23.99) return { name: "Son Dördün", emoji: "🌗", desc: "Bırakma ve arınma zamanı." };
    if (age < 27.68) return { name: "Hilal (Küçülen)", emoji: "🌘", desc: "İç gözlem ve dinlenme zamanı." };
    return { name: "Yeni Ay", emoji: "🌑", desc: "Yeni başlangıçlar ve niyet belirleme zamanı." };
}

// ── Daily horoscope messages (seeded by date + sign) ──
const DAILY_MESSAGES: Record<string, string[]> = {
    general: [
        "Bugün yıldızlar senin lehine dizilmiş durumda. İç sesinı dinle ve cesur adımlar at.",
        "Evrenin sana gönderdiği işaretlere dikkat et. Beklenmedik kapılar açılabilir.",
        "Bugün enerjin yüksek, ancak sabırlı olmayı unutma. Doğru zamanlama her şeydir.",
        "Geçmişte kalan bir konuyla yüzleşme zamanı gelmiş olabilir. Bırakmayı öğren.",
        "Yaratıcılığın doruk noktasında. Bu enerjiyi somut bir projeye yönlendir.",
        "İlişkilerinde açık iletişim bugün ekstra önemli. Kalbini aç, ama sınırlarını koru.",
        "Maddi konularda dikkatli ol. Ani kararlar almak yerine planla ve bekle.",
    ],
    love: [
        "Aşk hayatında yeni bir sayfa açılıyor. Kalbini yeni deneyimlere aç.",
        "Partnerinle derin bir sohbet başlatmanın tam zamanı.",
        "Beklenmedik bir kişi hayatına girebilir. Önyargısız ol.",
        "Duygularını ifade etmekten korkma. Savunmasızlık güçtür.",
    ],
    career: [
        "Kariyerinde önemli bir dönüm noktasına yaklaşıyorsun.",
        "Liderlik yeteneklerin ön plana çıkıyor. Sorumluluk al.",
        "Yaratıcı fikirlerin bugün fark edilecek. Paylaşmaktan çekinme.",
        "Sabırlı ol, emeklerin yakında meyvelerini verecek.",
    ],
};

export function getDailyMessage(signName: string, category: string = "general"): string {
    const today = new Date();
    const seed = today.getDate() + today.getMonth() * 31 + signName.charCodeAt(0);
    const messages = DAILY_MESSAGES[category] || DAILY_MESSAGES.general;
    return messages[seed % messages.length];
}

// ── Current planetary highlights ──
export interface PlanetaryEvent {
    planet: string;
    emoji: string;
    status: string;
    desc: string;
}

export function getCurrentPlanets(): PlanetaryEvent[] {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    // Accuracy for 2026 Mercury Retros
    const isMercuryRetro =
        (month === 1 && day >= 26) || (month === 2 && day <= 20) || // Feb 26 - Mar 20
        (month === 5 && day >= 29) || (month === 6 && day <= 23) || // Jun 29 - Jul 23
        (month === 9 && day >= 24) || (month === 10 && day <= 13);  // Oct 24 - Nov 13

    const isVenusRetro = (month === 9 && day >= 3) || (month === 10 && day <= 13); // Oct 3 - Nov 13

    const events: PlanetaryEvent[] = [
        { planet: "Güneş", emoji: "☀️", status: ZODIAC_SIGNS[((month + 9) % 12)].name + " burcunda", desc: "Bilinç ve yaşam enerjisi" },
        { planet: "Ay", emoji: "🌙", status: getMoonPhase(now).name, desc: "Duygular ve iç dünya" },
        { planet: "Merkür", emoji: "☿️", status: isMercuryRetro ? "Retrograd ⚠️" : "Direkt", desc: isMercuryRetro ? "İletişim ve cihazlara dikkat" : "İletişim ve kısa yolculuklar" },
        { planet: "Venüs", emoji: "♀️", status: isVenusRetro ? "Retrograd ⚠️" : "Direkt", desc: isVenusRetro ? "İlişkilerde geçmişi sorgulama" : "Sevgi, uyum ve değerler" },
        { planet: "Mars", emoji: "♂️", status: "Direkt", desc: "Tutku, eylem ve mücadele gücü" },
        { planet: "Jüpiter", emoji: "♃", status: month < 6 ? "Yengeç" : "Aslan", desc: "Büyüme ve fırsatlar" },
    ];
    return events;
}

// ── Element analysis ──
export function getElementAnalysis(element: string): { strength: string; advice: string; color: string } {
    switch (element) {
        case "Ateş": return { strength: "Tutku, liderlik ve cesaret. Engelleri aşma gücünüz var.", advice: "Sabırsızlığınızı dizginleyin, dinlemeyi öğrenin.", color: "text-red-400" };
        case "Toprak": return { strength: "Pratiklik, güvenilirlik ve dayanıklılık. Somut sonuçlar üretirsiniz.", advice: "Değişime daha açık olun, rutinden çıkmayı deneyin.", color: "text-emerald-400" };
        case "Hava": return { strength: "İletişim, entelektüellik ve sosyallik. Fikirleri birbirine bağlarsınız.", advice: "Düşünceleri eyleme dökmeyi unutmayın.", color: "text-sky-400" };
        case "Su": return { strength: "Sezgi, empati ve duygusal derinlik. Görünmeyeni hissedersiniz.", advice: "Duygularınızın sizi yönetmesine izin vermeyin.", color: "text-blue-400" };
        default: return { strength: "", advice: "", color: "" };
    }
}

// ── Rising Sign (Yükselen Burç) Calculation ──
// Simplified: Each sign rises for ~2 hours. Starting sign depends on birth month.
export function getRisingSign(birthMonth: number, birthDay: number, birthHour: number, birthMinute: number): ZodiacSign {
    // Get the sun sign index at birth
    const sunSign = getZodiacSign(birthMonth, birthDay);
    const sunIdx = ZODIAC_SIGNS.findIndex(s => s.id === sunSign.id);

    // Convert birth time to decimal hours
    const timeDecimal = birthHour + birthMinute / 60;

    // The Ascendant sign at sunrise (~6:00) is the same as the Sun sign.
    // Each 2 hours after sunrise, the Ascendant moves one sign forward.
    const hoursSinceSunrise = ((timeDecimal - 6) + 24) % 24;
    const signOffset = Math.floor(hoursSinceSunrise / 2);

    const risingIdx = (sunIdx + signOffset) % 12;
    return ZODIAC_SIGNS[risingIdx];
}

// ── AI Horoscope Response Type ──
export interface AIHoroscope {
    general: string;
    love: string;
    career: string;
    health: string;
    advice: string;
    luckyHour: string;
    energy: number;
    mood: string;
}
