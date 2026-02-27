import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    const { dream } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // Try AI first
    if (apiKey && apiKey !== "YOUR_API_KEY_HERE") {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Sen bir rüya yorumcususun. Türkçe cevap ver. Psikolojik ve mistik açıdan yorumla.

Rüya: "${dream}"

JSON formatında cevap ver (sadece JSON):
{
  "interpretation": "Detaylı rüya yorumu (3-4 cümle)...",
  "symbols": ["Sembol1", "Sembol2", "Sembol3"],
  "advice": "Tek cümle tavsiye...",
  "mood": "Tek kelime mod (Huzurlu/Dikkatli/Umutlu/Uyarıcı/İlhamlı)"
}`;

            for (const model of ["gemini-2.0-flash-lite", "gemini-2.0-flash"]) {
                try {
                    const res = await ai.models.generateContent({ model, contents: prompt });
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
    const seed = dream.length + dream.charCodeAt(0);
    const interps = [
        "Rüyanız bilinçaltınızın size önemli bir mesaj gönderdiğini gösteriyor. Dönüşüm ve yenilenme temaları ön plana çıkıyor. İç dünyanızda büyük bir değişimin eşiğinde olabilirsiniz.",
        "Bu rüya, bastırılmış duyguların yüzeye çıkmaya çalıştığına işaret ediyor. Geçmişte çözülmemiş bir konu bilinçaltınızda işlenmeye devam ediyor. Kendinize zaman tanıyın.",
        "Rüyanızdaki semboller özgürlük ve keşif arzunuzu yansıtıyor. Rutinden sıkılmış olabilirsiniz. Yeni deneyimlere kendinizi açma zamanı gelmiş.",
        "Koruma ve güvenlik temaları bu rüyada belirgin. Sevdikleriniz için endişe duyuyor olabilirsiniz. Güveninizi yeniden inşa etmeniz gerekebilir.",
    ];
    const symbols = [["Dönüşüm", "Bilinçaltı", "Yenilenme"], ["Duygular", "Geçmiş", "Arınma"], ["Özgürlük", "Keşif", "Değişim"], ["Koruma", "Güvenlik", "Bağ"]];
    const advices = ["Rüyanızı bir günlüğe yazın ve tekrarlarını izleyin.", "Meditasyon yaparak bilinçaltınızla bağlantınızı güçlendirin.", "Bu mesajı hayatınızdaki güncel olaylara bağlamaya çalışın.", "İç sesinize güvenin, doğru yoldasınız."];
    const moods = ["Düşünceli", "Umutlu", "Uyarıcı", "İlhamlı"];

    return NextResponse.json({
        interpretation: interps[seed % interps.length],
        symbols: symbols[seed % symbols.length],
        advice: advices[seed % advices.length],
        mood: moods[seed % moods.length],
    });
}
