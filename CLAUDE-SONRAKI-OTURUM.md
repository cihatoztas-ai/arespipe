# AresPipe — 18. Oturum Gündemi

## Oturum Başı Ritüeli
1. CLAUDE.md oku
2. CLAUDE-SON-OTURUM.md oku
3. Kullanıcıya sor: "Bugün öncelik nedir?"

## Deploy Kontrol Listesi
Şu dosyalar deploy edilmeli:
- `kesim.html`
- `spool_detay.html`
- `devre_detay.html`
- `devre_yeni.html`
- `tr.json`, `en.json`, `ar.json`

Test noktaları (kesim.html):
- Filtrele → liste oluştur → "oluşturuldu" toast çıkıyor mu?
- Sayfayı yenile → liste duruyor mu?
- Listeye tıkla → wizard açılıyor mu?
- Adım 1 → Adım 2 → Adım 3 akışı çalışıyor mu?
- Excel/PDF çalışıyor mu?
- Kesildi kaydet → Kesilen Listeler'e geçiyor mu?
- Kapalı liste borularının havuzda görünmediğini doğrula

## 🟡 ÖNCELİK 1 — Yarım Kalanlar

### bukum.html
1. Export (Excel + PDF)
2. Arama haystack genişletme
3. Font fix

### markalama.html
1. Arama çubuğu
2. Export (Excel + PDF)
3. Font fix

## 🟢 ÖNCELİK 2 — G-02 Kalan Sayfalar
anasayfa → kalite_kontrol → sevkiyatlar → tersaneler → uyarilar → kullanicilar

## 🔵 Teknik Borçlar
- `kesim_kalemleri` eski kayıtlarda `spool_id=null` — spool_detay'da görünmüyor:
```sql
UPDATE kesim_kalemleri k
SET spool_id = sm.spool_id
FROM spool_malzemeleri sm
WHERE sm.id = k.malzeme_id AND k.spool_id IS NULL;
```
