# 51. Oturum — Tersan L2 Canli Entegrasyon

> Hedef oturum acilis, 50'yi takip eder

---

## Acilis Ritueli (CLAUDE.md disiplini)

5 kontrol cevabi:
1. git pull temiz mi?
2. CI yesil mi?
3. son-durum.md guncel mi?
4. Bekleyen migration var mi?
5. Cihat'tan geri bildirim var mi?

---

## 51'in Hedefi

L2 prototip hazir, **lokal test 3/3 yesil**. Simdi canliya baglanir.

### Ana Is — izometri-oku.js parserKuralIle STUB'ini gercek L2'ye bagla

**MK-49.1 disiplini:** sadece 3 satir degisiklik. Asagidaki gibi:

```javascript
// izometri-oku.js, parserKuralIle fonksiyonu
async function parserKuralIle(text, format) {
  if (!format.parser_kural || Object.keys(format.parser_kural).length === 0) {
    return { ok: false, sebep: 'parser_kural_yok', parser_seviye: 'l3' };
  }
  
  const { parse } = await import('../lib/l2-parser.js');
  return parse(text, format.parser_kural);
}
```

Test plani: Tersan PDF'i tekrar yukle, log'a parser_seviye='l2' yazsin, AI cagrisi yapilmasin, sonuc kullanicinin manuel onayina dussun.

### Ikincil Isler

1. **L2 metrikleri** — ai_api_log.parser_seviye kolonu izometri-oku.js'te doldurulsun (cache_hit / l2 / l3)
2. **Format envanter UI** — super_admin icin /admin/formatlar sayfasi (hangi format L2 aktif, basari orani, son N kullanim, parser_kural goruntuleme)
3. **Malzeme satir pattern temizligi** — "WELDING NUMBERCUT NUMBER" gibi false positive'ler ele
4. **Etkilesimli format ogretme modal** — yeni format kesfedilince AI L3 sonucunu goster, parser_kural taslagi onerip kullaniciya onaylat
5. **AI taslak uret endpoint** — L3 sonucu + 2. AI prompt -> parser_kural taslagi
6. **tv() i18n eksiklikleri** — 28 uyari var, lang/tr.json ve lang/en.json doldur
7. **Hatali kayit aksiyonlari** — kuyruk-yeniden-dene, kuyruk-sil, kuyruk-pdf-indir endpoint'leri

---

## Kritik Hatirlatmalar

- izometri-oku.js'e DOKUNMA (MK-49.1) — sadece parserKuralIle fonksiyonu, 3 satir
- Hassas anahtar Claude'a verme (MK-50.1)
- Yeni format icin parser_kural yazmadan once 3+ basarili AI ornek (MK-50.3)
- Dotfile olusturduktan sonra ls -la kontrol et (MK-50.4)
- Image-PDF formatlari L2 yapamaz (MK-50.2)

---

## 51'de Veriyle Tasarim

L2 baglandiktan sonra:
- Tersan'da yeni PDF yukle, parser_seviye='l2' kolonuna dustugunu kontrol et
- 5-10 farkli Tersan PDF birikince malzeme pattern'lerini tekrar bak (50'de 3 ornekle yazdik, MK-50.3 prensibi)
- L3 fallback orani %15+ olursa "format eskiyor" uyarisi mantigini kur

---

## 52+ Vizyonu

- Format evolution — L3 fallback metrikleri
- SCH parsing — 2"SCH40 -> DN50, dis cap + et lookup (boru_olculer tablosuna)
- Image-PDF icin L2.5 — Pre-trained AI prompt cache (PAOR gibi formatlarda tutarlilik)
- Pasif ogrenme — Manuel onay duzeltmeleri parser_kural'a feedback
