# CLAUDE-SONRAKI-OTURUM.md — Oturum 177 giriş planı

## Ritüel (önce)
`git pull && git status && git log --oneline -5` + fonksiyon 12/12 + handoff oku. HEAD bekle: eab6532
(+ 176 doc commit'i).

## Bağlam: nerede kaldık
176'da terfi-sonrası izometri eşleştirme borcu (129/130) **kökünden** kapandı — kök backfill TIMEOUT'tu.
Backfill artık sayfalı/cache'li/güvenli; wizard terfi client-loop; devre_detay'da recovery butonu.
Faz 2 (Excel↔PDF çelişki kazananı) DATA ile gereksiz çıkıp KAPATILDI (MK-176.1).

## SIRADAKİ İŞ

### 1) MK-176.7 — Onay Kuyruğu → İnceleme ekranı taşıma ⭐ (Cihat'ın ana fikri)
Cihat: aktif devrede ayrı "onay kuyruğu" yerine, wizard İnceleme/düzenleme ekranını
spool_detay/devre_detay'da göster → veri isteyen oraya bakar, ayrı kuyruğa gerek kalmaz.
**KOD YAZMADAN ÖNCE kapsam araştırması (MK-126.8):**
- `devre-inceleme.js` (saf-okuma, 4-durum) **taslak-dışı/aktif** devrede çalışır mı, anlamı ne? Şu an
  "İnceleme = terfinin önizlemesi"; aktif devrede terfi yok → eylem semantiği (düzeltme/eşleştirme) ne olur?
- `spool_detay.html` mevcut yapısı (bu oturumda HİÇ açılmadı — yükletilmeli).
- `izo-eslesme.js` saf çekirdek (var); UI taşıma sadece render + endpoint çağrısı meselesi mi?
- Karar: Onay Kuyruğu sekmesini İnceleme görünümüyle DEĞİŞTİR mi, yoksa spool_detay'a EK bir görünüm mü?
- Not: atanmamış/manuel/post-terfi-Excel sinyalleri sessizce kaybolmamalı (B-6) — yeni görünüm bunları taşımalı.

### 2) 13 kirli devrenin recovery'si tamamlanmalı
kfukfuyk (P26-227) temizlendi. Kalan 13 aktif devrede recovery butonu tek tek çalıştırılmalı. Yaygınlık
sorgusu (176'da: 14 devre / 1127 kuyruk) tekrar koşulup ilerleme izlenebilir:
```sql
SELECT COUNT(DISTINCT d.id) AS etkilenen, SUM(1) AS acik
FROM devreler d JOIN devre_dokumanlari dd ON dd.devre_id=d.id
JOIN dosya_isleme_kuyrugu k ON k.devre_dokuman_id=dd.id
WHERE d.durum='aktif' AND k.parser='izometri' AND k.durum IN ('oneri_hazir','manuel_onay');
```

### 3) B testi (wizard terfi loop canlı doğrulama)
Yeni test devresi (Tersan BOM + birkaç izometri) → terfi → "İzometri eşleştiriliyor… (N)" → aktif olunca
Onay Kuyruğu 0/gizli olmalı (temizler terfide otomatik kapandı, MK-176.5). A testi geçti, B teyit için.

## ESKİ AÇIK
- **Recovery i18n:** `dv_onayk_recovery` + `_calisiyor` + `_hata` + `_ok` (4 anahtar × 3 dil) — şu an
  `tv()` TR fallback. EN/AR için lang dosyalarına eklenmeli (G-01).
- **`1 1/4"` boşluklu kesir bug:** `olcuParse("1 1/4\"")`→1 (regex boşlukta kesiliyor). `ares-olcu.js`
  branch-1 regex + ondalık NPS (1.25/1.5). Düşük öncelik (175'ten).
- **MK-117 (yukleyen_id null):** wizard yüklemeleri artık `yukleyen_id` dolu (devre_wizard_v3:999), borç
  DİĞER yükleme yolları için. Açık.
- **Gece cron (03:00):** hâlâ ispatsız (gündüz drenajı + recovery kuyruğu boşaltıyor).
- **Backfill throughput follow-up (opsiyonel):** ~0.45sn/kayıt; yazma round-trip'leri baskın. `_eslesme`
  writeback'in re-read'i (kuyruk-isle-izometri ~725) backfill'de gereksiz (okuJson zaten elde) — opsiyonel
  parametreyle atlanabilir → ~0.6→0.45sn'ye. Sadece UX hızlanır; doğruluk etkilenmez. Gerekirse.

## İLK HAMLE (177)
`spool_detay.html`'i yükle + `devre-inceleme.js`'in aktif-devre semantiğini incele → MK-176.7 için
"taşı mı / ek görünüm mü" kararını A/B sun → ancak ondan sonra kod. Bu oturumun keystone'u MK-176.7.

## Açık takip: 176'da KAPANAN
- ✅ Backfill timeout (129/130 borcu) — kökünden, kanıtlı.
- ✅ Faz 2 — kapatıldı (gereksiz).
- ✅ Wizard terfi temizliği + devre_detay recovery.
