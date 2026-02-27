export interface RumiCard {
    name: string;
    keywords: string;
    meaning: string;
}

export const rumiCards: Record<number, RumiCard> = {
    // Major Arcana
    0: {
        name: "0 Abdal",
        keywords: "Masumiyet, Yeni Başlangıçlar, Spontanlık",
        meaning: "Ruhun saf haliyle yola çıkışıdır. Korkusuzca ve tam bir teslimiyetle bilinmeyene adım atmayı temsil eder. İçinizdeki çocuğu serbest bırakın."
    },
    1: {
        name: "1 Büyücü",
        keywords: "Yaratıcılık, Beceri, İstek Gücü",
        meaning: "Gökten aldığını yere indiren, düşünceyi eyleme geçiren güçtür. Elinizdeki tüm araçları kullanarak imkansız olanı mümkün kılma vaktidir."
    },
    2: {
        name: "2 Azize",
        keywords: "Sezgi, Bilgelik, Gizem",
        meaning: "Sessizliğin içindeki sestir. Bilgi henüz eyleme dökülmemiş, tohum halindedir. Rüyalarınıza ve iç sesinize güvenin, sırlar vaktini bekler."
    },
    3: {
        name: "3 İmparatoriçe",
        keywords: "Bolluk, Yaratıcılık, Doğurganlık",
        meaning: "Doğa ana gibi besleyici ve üretken bir enerjidir. Hayatınızdaki güzelliklerin yeşerdiği, sevginin ve refahın arttığı bir dönemi müjdeler."
    },
    4: {
        name: "4 İmparator",
        keywords: "Otorite, Yapı, İstikrar",
        meaning: "Düzenin ve korumanın sembolüdür. Mantığınızla hareket ederek sınırlarınızı belirleme ve sağlam bir temel üzerine hayatınızı inşa etme gücüne sahipsiniz."
    },
    5: {
        name: "5 Pir",
        keywords: "Öğreti, Gelenek, Rehberlik",
        meaning: "İlahi bilgeliğin yeryüzündeki temsilcisidir. Manevi bir rehberden yardım almayı veya kadim öğretilerin izinden gitmeyi anlatır."
    },
    6: {
        name: "6 Aşıklar",
        keywords: "Seçim, Uyum, Gönül Birliği",
        meaning: "Kalbin en büyük sınavıdır. Sadece iki insanın birleşmesi değil, ruhun kendi parçalarıyla barışması ve yürekten bir seçim yapmasıdır."
    },
    7: {
        name: "7 Küheylan",
        keywords: "Zafer, İrade, Hız",
        meaning: "Zıt güçleri aynı dizginle yönetme sanatıdır. Azimle ve odaklanarak hedefinize doğru büyük bir süratle ilerliyorsunuz. Zafer yakındır."
    },
    8: {
        name: "8 Adalet",
        keywords: "Denge, Hak, Sebep-Sonuç",
        meaning: "Evrenin terazisi asla şaşmaz. Ne ekerseniz onu biçeceğiniz, hak ettiklerinizin size döneceği dürüstlük ve denge vaktidir."
    },
    9: {
        name: "9 Keşiş",
        keywords: "Yalnızlık, İçsel Yolculuk, Aydınlanma",
        meaning: "Gerçeği dışarıda değil, kendi karanlığınızı aydınlatarak içeride bulursunuz. Kalabalıkların arasından sıyrılıp kendi ışığınıza odaklanma zamanıdır."
    },
    10: {
        name: "10 Çarkıfelek",
        keywords: "Kader, Döngüler, Şans",
        meaning: "Hayatın tek değişmeyen kuralı değişimin kendisidir. Şansın yönü dönerken, yükselişi ve düşüşü tevekkülle karşılamayı öğrenmektir."
    },
    11: {
        name: "11 Sebat",
        keywords: "İçsel Güç, Sabır, Şefkat",
        meaning: "Aslanı kaba kuvvetle değil, sevgi ve sabırla dizginlemektir. Gerçek güç, ruhun sükunetinde ve zorluklar karşısındaki dayanıklılığındadır."
    },
    12: {
        name: "12 Asılmış Adam",
        keywords: "Teslimiyet, Bakış Açısı, Bekleyiş",
        meaning: "Farklı bir bakış açısı kazanmak için durmak gerekir. Bazı şeyler eylemle değil, tam bir teslimiyet ve kurban etme bilinciyle çözülür."
    },
    13: {
        name: "13 Ölüm",
        keywords: "Dönüşüm, Sonlanış, Yeniden Doğuş",
        meaning: "Eskinin ölmesi, yeninin doğması için bir zorunluluktur. Bu bir son değil, tırtılın kelebeğe dönüşmek üzere kozasından ayrılışıdır."
    },
    14: {
        name: "14 Denge",
        keywords: "Ilımlılık, Kimya, Sükunet",
        meaning: "İki farklı enerjiyi zarafetle harmanlamaktır. Acele etmeden, orta yolu bularak ve ruhunuzu şifalandırarak huzura erebilirsiniz."
    },
    15: {
        name: "15 Şeytan",
        keywords: "Bağımlılık, Arzu, İllüzyon",
        meaning: "Kendi yarattığınız zincirlerin tutsağı olduğunuzu hatırlatır. Maddi hırslar veya takıntılar ruhunuzu gölgeleyebilir, özgürlük seçiminizdedir."
    },
    16: {
        name: "16 Minare",
        keywords: "Yıkım, Ani Değişim, Sarsıntı",
        meaning: "Yanlış temelli olan her şey yıkılmaya mahkumdur. Bu sarsıntı can yaksa da, gerçeği görmeniz için sahte olanı yerle bir eder."
    },
    17: {
        name: "17 Yıldız",
        keywords: "Umut, İlham, Şifa",
        meaning: "Karanlık geceden sonra doğan umut ışığıdır. Evrenin sizi desteklediğini ve ruhunuzun şifalanmaya başladığını söyler. Yıldızınız parlıyor."
    },
    18: {
        name: "18 Ay",
        keywords: "Korkular, Rüyalar, Bilinçaltı",
        meaning: "Ay ışığındaki yolda her şey olduğundan farklı görünebilir. İllüzyonlara ve içsel korkulara dikkat edin, sadece sezgileriniz size doğru yolu fısıldar."
    },
    19: {
        name: "19 Güneş",
        keywords: "Başarı, Mutluluk, Aydınlık",
        meaning: "Hayatın en parlak anıdır. Enerjinizin yükseldiği, her şeyin netleştiği ve çocuksu bir neşeyle kutlama yapacağınız bir döneme girdiniz."
    },
    20: {
        name: "20 Hüküm",
        keywords: "Uyanış, Arınma, Çağrı",
        meaning: "Geçmişin muhasebesini yapıp yeni bir hayata uyanma çağrısıdır. Ruhunuzun özgürleştiği ve ilahi bir uyanışla kendinizi bulduğunuz bir andasınız."
    },
    21: {
        name: "21 Dünya",
        keywords: "Tamamlanma, Bütünlük, Seyahat",
        meaning: "Bir döngünün mükemmel bir şekilde sonlanmasıdır. Ruhun yolculuğu meyvesini vermiş, arzulanan noktaya ulaşılmış ve birlik bilincine varılmıştır."
    },

    // Suited cards can follow standard meanings with Rumi touch
    // Wands (Değnekler 22-35)
    22: { name: "Değneklerin Ası", keywords: "İlham, Tutku, Potansiyel", meaning: "Yeni bir yaratıcı enerjinin doğuşu. İçinizdeki ateşi uyandıracak bir fırsat kapıda." },
    23: { name: "Değneklerin İkilisi", keywords: "Planlama, Karar, Ufuklar", meaning: "Eski konfor alanından çıkıp daha büyük dünyalar için vizyon geliştirme zamanı." },
    24: { name: "Değneklerin Üçlüsü", keywords: "Genişleme, Bekleyiş, Ticaret", meaning: "Ektiğiniz tohumların filizlenmesini izliyor, gemilerinizin ufuktan gelmesini bekliyorsunuz." },
    25: { name: "Değneklerin Dörtlüsü", keywords: "Kutlama, Ev, Huzur", meaning: "Başarıların paylaşıldığı, temellerin sağlam atıldığı huzurlu bir dinlenme durağı." },
    26: { name: "Değneklerin Beşlisi", keywords: "Rekabet, Çatışma, Mücadele", meaning: "Küçük ego savaşları veya fikir ayrılıkları gelişiminizi tetikliyor, direnciniz azalmasın." },
    27: { name: "Değneklerin Altılısı", keywords: "Zafer, Takdir, Onay", meaning: "Çabalarınızın karşılığını aldığınız, çevreniz tarafından takdir edildiğiniz bir başarı anı." },
    28: { name: "Değneklerin Yedilisi", keywords: "Savunma, Azim, Dik Duruş", meaning: "İnandığınız değerler için geri adım atmadan mücadele etme ve konumunuzu koruma vaktidir." },
    29: { name: "Değneklerin Sekizlisi", keywords: "Hız, Haber, Hareket", meaning: "Her şey çok hızlı gelişiyor. Beklediğiniz haberler ve değişimler ok gibi hedefine ulaşıyor." },
    30: { name: "Değneklerin Dokuzlusu", keywords: "Dayanıklılık, Korunma, Bekleme", meaning: "Yorulsanız da son bir gayretle nöbetinizi tutun. Hedefe çok az kaldı, pes etmeyin." },
    31: { name: "Değneklerin Onlusu", keywords: "Sorumluluk, Yük, Bitiş", meaning: "Sırtınızdaki yükler ağırlaşmış olabilir ancak bu yükü hedefe ulaştırmak için son adımlarınızdasınız." },
    32: { name: "Değneklerin İçoğlanı", keywords: "Keşif, Haberci, Heyecan", meaning: "Yeni bir haber veya heyecan verici bir mesaj ruhunuzdaki yaratıcı kıvılcımı ateşleyecek." },
    33: { name: "Değneklerin Süvarisi", keywords: "Macera, Cesaret, Değişim", meaning: "Gözü kara bir şekilde ideallerinizin peşinden gitme zamanı. Hızınız devrim niteliğinde olabilir." },
    34: { name: "Değneklerin Sultanı", keywords: "Cazibe, Sosyallik, Güven", meaning: "Kendi enerjisine ve güzelliğine hayran bırakan, hayatın tadını çıkaran bir ruhun temsilidir." },
    35: { name: "Değneklerin Padişahı", keywords: "Liderlik, Vizyon, Girişim", meaning: "Tutkularını eyleme dökebilen, karizmatik ve yol gösterici bir otoritenin sembolüdür." },

    // Cups (Kadehlerin 36-49)
    36: { name: "Kadehlerin Ası", keywords: "Sevgi, Duygu, Ruhsal Bolluk", meaning: "Gönül kadehinin aşkla dolmasıdır. Yeni bir ilişki veya derin bir manevi huzur başlıyor." },
    37: { name: "Kadehlerin İkilisi", keywords: "Aşk, Ortaklık, Uyum", meaning: "İki ruhun karşılıklı sevgi ve saygıyla birleşmesidir. Duygusal bir kontrat ve samimiyet." },
    38: { name: "Kadehlerin Üçlüsü", keywords: "Dostluk, Kutlama, Paylaşım", meaning: "Mutlu anları sevdiklerinizle paylaşmanın, topluluk içinde neşe bulmanın vaktidir." },
    39: { name: "Kadehlerin Dörtlüsü", keywords: "Bıkkınlık, İçebakış, Kaçan Fırsat", meaning: "Sunulanlara karşı ilgisizlik yaşıyor olabilirsiniz. İçinize dönüp gerçek isteğinizi sorgulayın." },
    40: { name: "Kadehlerin Beşlisi", keywords: "Kayıp, Pişmanlık, Yas", meaning: "Dökülen kadehlere üzülürken arkanızda duran dolu kadehleri görmeyi ihmal etmeyin." },
    41: { name: "Kadehlerin Altılısı", keywords: "Nostalji, Masumiyet, Geçmiş", meaning: "Eski dostlar veya çocukluk anıları kalbinizi ısıtabilir. Saf sevginin gücünü hatırlayın." },
    42: { name: "Kadehlerin Yedilisi", keywords: "Hayaller, Seçenekler, İllüzyon", meaning: "Zihniniz pek çok seçenekle dolu ama hangisinin gerçek olduğunu ancak gönül gözünüz görür." },
    43: { name: "Kadehlerin Sekizlisi", keywords: "Vazgeçiş, Yolculuk, Arayış", meaning: "Duygusal olarak size yetmeyen bir durumu bırakıp ruhsal bir olgunluk için yola çıkma vaktidir." },
    44: { name: "Kadehlerin Dokuzlusu", keywords: "Memnuniyet, Dilek, Tatmin", meaning: "Dileklerinizin kabul olduğu, kendinizi duygusal olarak tam ve mutlu hissettiğiniz bir dönem." },
    45: { name: "Kadehlerin Onlusu", keywords: "Aile, Mutluluk, Duygusal Zirve", meaning: "Sevginin en yüksek formudur. Huzurlu bir aile ortamı ve ruhsal tatmin sizi bekliyor." },
    46: { name: "Kadehlerin İçoğlanı", keywords: "Hassasiyet, Mesaj, Sanatsal Ruh", meaning: "Duygusal bir teklif veya sezgisel bir mesaj alabilirsiniz. Kalbinizdeki yumuşaklığa izin verin." },
    47: { name: "Kadehlerin Süvarisi", keywords: "Romantizm, Teklif, Hayalperestlik", meaning: "Aşkını kalp üzerinde taşıyan, bir teklif veya güzel bir duyguyla gelen zarif bir enerjidir." },
    48: { name: "Kadehlerin Sultanı", keywords: "Şefkat, Sezgi, Dinleyici", meaning: "Tam bir empati ve sevgi pınarıdır. Başkalarının ruhuna dokunan, şifacı bir duruş." },
    49: { name: "Kadehlerin Padişahı", keywords: "Denge, Bilgelik, Hoşgörü", meaning: "Duygularını mantığıyla yönetebilen, sükunetiyle fırtınaları dindiren bilge bir lider." },

    // Swords (Kılıçların 50-63)
    50: { name: "Kılıçların Ası", keywords: "Netlik, Zihin, Gerçek", meaning: "Zihindeki bulutların dağılıp gerçeğin keskin bir kılıç gibi ortaya çıkmasıdır. Karar vakti." },
    51: { name: "Kılıçların İkilisi", keywords: "Kararsızlık, Çözümsüzlük, Denge", meaning: "Gözleriniz bağlı gibi hissedebilirsiniz; kalbinizle mantığınız arasında bir denge kurmalısınız." },
    52: { name: "Kılıçların Üçlüsü", keywords: "Kalp Kırıklığı, Keder, Ayrılık", meaning: "Gerçeğin acı veren yüzüdür. Bu sancı, ruhun arınması ve büyümesi için gerekli bir tecrübedir." },
    53: { name: "Kılıçların Dörtlüsü", keywords: "Dinlenme, Meditasyon, İnziva", meaning: "Zihinsel bir yorgunluğu aşmak için sessizliğe çekilme ve enerjinizi toplama vaktidir." },
    54: { name: "Kılıçların Beşlisi", keywords: "Pirus Zaferi, Çatışma, Kayıplar", meaning: "Kazanmış gibi görünsen de bu zafer çok pahalıya patlamış olabilir. Egoya dikkat edin." },
    55: { name: "Kılıçların Altılısı", keywords: "Geçiş, Yolculuk, Huzura Doğru", meaning: "Zorlu sulardan daha sakin kıyılara doğru kürek çekiyorsunuz. Sessiz bir iyileşme dönemi." },
    56: { name: "Kılıçların Yedilisi", keywords: "Gizlilik, Strateji, Dikkat", meaning: "Açık bir çatışma yerine akıl oyunlarıyla ilerleme veya kayıplara karşı tetikte olma zamanı." },
    57: { name: "Kılıçların Sekizlisi", keywords: "Kısıtlanma, Korku, Hapishane", meaning: "Sizi bağlayan tek şey kendi düşüncelerinizdir. Adım atmaya cesaret ederseniz bağlar çözülür." },
    58: { name: "Kılıçların Dokuzlusu", keywords: "Endişe, Uykusuzluk, Kabuslar", meaning: "Korkularınızın esiri olmayın. Gecenin en karanlık anı, şafağın en yakın olduğu andır." },
    59: { name: "Kılıçların Onlusu", keywords: "Yıkım, Acı Son, Teslimiyet", meaning: "Daha kötüye gidemeyecek bir nokta. Artık ayağa kalkma ve her şeye sıfırdan başlama vakti." },
    60: { name: "Kılıçların İçoğlanı", keywords: "Zeka, Merak, Tetiktelik", meaning: "Yeni bir fikir veya bilgi peşindesiniz. Kelimelerinizi dikkatli seçin, zihniniz keskinleşiyor." },
    61: { name: "Kılıçların Süvarisi", keywords: "Mantık, Hız, Direktlik", meaning: "Hedefe kilitlenmiş bir zihnin eylemidir. Duygusallığa yer vermeden gerçeğin peşinden gider." },
    62: { name: "Kılıçların Sultanı", keywords: "Objektiflik, Bağımsızlık, Netlik", meaning: "Tecrübeleriyle bilenmiş, duygularını değil aklını kullanan, net ve keskin bir karakter." },
    63: { name: "Kılıçların Padişahı", keywords: "Yargı, Otorite, Mantık Zirvesi", meaning: "Adaletle hükmeden, stratejik düşünen ve hakikati her zaman savunan entelektüel güç." },

    // Pentacles (Dinarların 64-77)
    64: { name: "Dinarların Ası", keywords: "Maddi Fırsat, İstikrar, Başlangıç", meaning: "Avucunuza düşen bir altın para misali, yeni bir iş veya somut bir başarı müjdesidir." },
    65: { name: "Dinarların İkilisi", keywords: "Adaptasyon, Esneklik, Denge", meaning: "Hayatın iniş çıkışlarını zarafetle yönetmeye çalışıyorsunuz. Dengede kalmak için esnek olun." },
    66: { name: "Dinarların Üçlüsü", keywords: "Ustalık, İş Birliği, Kalite", meaning: "Yeteneğinizi konuşturduğunuz ve başkalarıyla ortaklaşa güzel işler ürettiğiniz bir süreç." },
    67: { name: "Dinarların Dörtlüsü", keywords: "Koruma, Sahip Çıkma, Tutuculuk", meaning: "Elinizdekileri kaybetme korkusuyla çok sıkı tutmayın. Akışa izin vermemek bereketi kesebilir." },
    68: { name: "Dinarların Beşlisi", keywords: "Sıkıntı, İman Sınavı, Destek", meaning: "Zor bir dönemden geçerken kapının hemen yanındaki ışığı ve yardımı görmeyi unutmayın." },
    69: { name: "Dinarların Altılısı", keywords: "Cömertlik, Paylaşım, Adalet", meaning: "Elinizdekini ihtiyacı olanla paylaştıkça evrenin bereketi size daha çok akacaktır." },
    70: { name: "Dinarların Yedilisi", keywords: "Emeğin Karşılığı, Sabır, Değerlendirme", meaning: "Ektiğiniz ekinlerin büyümesini izleme vakti. Sabredin, hasat zamanı yaklaşıyor." },
    71: { name: "Dinarların Sekizlisi", keywords: "Çıraklık, Disiplin, Pratik", meaning: "Kendi sanatınızda mükemmelleşmek için bıkmadan usanmadan çalışma ve öğrenme dönemi." },
    72: { name: "Dinarların Dokuzlusu", keywords: "Lüks, Tek Başınalık, Refah", meaning: "Kendi kendine yetebilen, emeklerinin meyvesini konfor içinde yiyen asil bir ruh hali." },
    73: { name: "Dinarların Onlusu", keywords: "Miras, Soy, Kalıcı Başarı", meaning: "Köklerden gelen bereket ve gelecek nesillere bırakılacak sağlam bir maddi/manevi temel." },
    74: { name: "Dinarların İçoğlanı", keywords: "Öğrenci, Pratik Fikir, Sadakat", meaning: "Somut bir hedef için atılan ilk küçük ama sağlam adım. Çalışkanlık kazandıracaktır." },
    75: { name: "Dinarların Süvarisi", keywords: "Güven, Hizmet, Metanet", meaning: "Ağır ama emin adımlarla hedefe ilerleyen, verdiği sözü tutan ve her zaman güvenilen bir enerji." },
    76: { name: "Dinarların Sultanı", keywords: "Pratiklik, Cömertlik, Güvenli Liman", meaning: "Hem dünyevi başarıya sahip olan hem de sevdiklerini bereketle besleyen şefkatli bir varlık." },
    77: { name: "Dinarların Padişahı", keywords: "Servet, Başarı, Dünyevi Güç", meaning: "Elde ettiği başarıyı koruyan, bolluk içinde yaşayan ve cömertçe yöneten güçlü bir figür." }
};

export const getRumiMeaning = (index: number): RumiCard => {
    return rumiCards[index] || { name: "Bilinmeyen Kart", keywords: "Gizem", meaning: "Bu kartın sırrı henüz açığa çıkmadı." };
};
