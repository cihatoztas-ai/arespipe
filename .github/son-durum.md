# Son Durum — 129. Oturum (27-28 Mayıs 2026)

> 128 → 129 geçişi. Terfi-yeniden-eşle (MK-127.4) **DB seviyesinde tam kapatıldı**;
> `eslestirme-backfill` (110'dan kalan) mükerrer endpoint girişimi temizlendi, alias fix'i
> ile PDF↔spool bağı çalıştı, v3 `onayEt`'e entegre edildi. Ama yeni v3 testinde spool
> detay sayfasında **imalat izometri sekmesi boş, sadece montaj görünüyor** — bu çelişki
> 130'un baş maddesi. Ayrıca derin bir keşif: **PDF içeriği × Excel kabuk çapraz
> doğrulaması yapılmıyor** — POAR'daki malzeme listesi Excel BOM ile çakıştırılmıyor,
> dosya adı yanlışsa sistem sessizce yanlış bağ kuruyor. Bu, omurganın eksik kalmış
> büyük katmanı.

---

## Bu Oturumun Sonucu

**129 kısmi başarıyla kapatıldı.** Birincil hedef (terfi-yeniden-eşle, MK-127.4/A1) DB
seviyesinde **iki ayrı vakada kanıtlandı** (eski devre `7fbdde63` + yeni v3 devresi
`3ce020f6`). v3 `onayEt` entegrasyonu push edildi, toast'ta "8 izometri eşleşmesi"
yazısı görüldü. Ama spool detay UI'da imalat sekmesi boş çıkıyor — DB doğru, ekran
yanlış. Ek olarak **mimari boşluk** yüzeye çıktı: çapraz doğrulama katmanı eksik.

### Yapılanlar (sırasıyla)

1. **Mevcut kodu okuma (MK-126.8):** `api/kuyruk-isle-izometri.js` — `birIsIsle`,
   `eslestir`, `montajEslestir` gövdeleri canlı incelendi. Kuyruk şeması Supabase'den
   doğrulandı (`devre_dokuman_id` FK, kuyrukta `devre_id` kolonu YOK; bağ
   `devre_dokumanlari` üzerinden). `eslestir(supa, devreId, kuyrukId, okuJson,
   devreDokumanId)` imzası teyit edildi.

2. **İlk yanlış adım — mükerrer endpoint (MK-126.8 ihlali):** `api/devre-eslesme-yenile.js`
   (145 satır) yazıldı, push edildi. Ama `api/eslestirme-backfill.js` (110/MK-110.1 ile
   yazılmış) zaten **birebir aynı işi** yapıyordu (`{devre_id, kuru, limit}` body,
   `eslestir` import, idempotent). Üstelik Vercel **Hobby plan 12 function limiti**
   bu yeni dosya ile aşıldı → deploy 3 commit boyunca Error. `git rm` + `gp` ile geri
   alındı, 12'ye dönüldü, deploy yeşillendi.

3. **`eslestirme-backfill.js` fix'i (2 aşamalı, oturum içinde):**
   - **B-1 (yetersiz):** select'e `devre_dokuman_id` eklendi, `eslestir`'in 4. argümanı
     `is.devre_dokuman_id` olarak geçildi. Push edildi, deploy oldu — ama snapshot SQL
     `bagli_dok=0` döndü, fix yansımadı.
   - **B-2 (alias fix, MK-129.x):** PostgREST'te `devre_dokuman_id` (FK kolonu) +
     `devre_dokumanlari!inner(devre_id)` (embed) çakışıyor → FK ham uuid gölgeleniyor.
     Select'te `dok_id:devre_dokuman_id` alias'ı ile çözüldü. Push (`31f22e4`),
     deploy Ready. Test: `curl` çıktısında her kayıtta `dok_id: "uuid-..."` görüldü →
     snapshot SQL `bagli_dok=1` (8/8 spool) → spool detayda (`A-001036`) izometri
     sekmesinde PDF göründü ✓ (eski devre `7fbdde63` testi).

4. **v3 `onayEt` entegrasyonu (`6b28df6`):** `devre_wizard_v3.html` `onayEt`
   fonksiyonuna, terfi sonrası best-effort `await` ile backfill çağrısı eklendi:
   - Toast birleştirme: "+ N izometri eşleşmesi" veya hata durumunda uyarı
   - Hata yutar, terfi'yi geri almaz (terfi DB'de zaten oldu)
   - Hata varsa yönlendirme 2.5 sn (mesaj okunabilsin), yoksa 1 sn
   - **Yeni dosya yok, function limiti etkilenmez.**

5. **Yeni v3 canlı testi (Demo Atölye, gerçek IFS .xlsm + izometri PDF):**
   - Adım 1 → Adım 2 → Onayla → toast'ta "✓ 8 spool ID + QR + 8 izometri eşleşmesi" ✓
   - devre_detay açıldı: spool listesi geldi, ama DURUM hâlâ "Bekliyor" görünüyor,
     spool detayında **imalat izometri PDF YOK, sadece montaj PDF var** ✗
   - DB kontrolünde toast doğruysa `cizim_durumu` `kismi` olmalı, `bagli_dok>=1` olmalı.
     **DB-UI çelişkisi** — 130'un ilk işi.

---

## Yeni MK Kararları (129)

| MK | Karar |
|----|-------|
| MK-129.1 | PostgREST select'inde FK kolonu ile aynı tablo embed'i çakışırsa kolon ham uuid yerine embed objesine dönüşebilir — alias kullan (`dok_id:devre_dokuman_id`). Sebep: 14:13 koşusu cizim_durumu döndü ama spool_id bağı yazılamadı, kök sebep buydu. |
| MK-129.2 | Yeni endpoint yazmadan önce mevcut `api/*` envanteri zorunlu (`ls api/*.js`) + adı benzer dosyaları aç (MK-126.8 güçlendirmesi). Bu oturumun mükerrer `devre-eslesme-yenile.js` hatası bu kontrolün atlanmasıyla oluştu. |
| MK-129.3 | Vercel Hobby plan 12 serverless function tavanı: yeni `api/*` eklerken `ls api/*.js \| wc -l` ile sayım zorunlu, 11'de durup konsolidasyon/Pro kararı verilmeli. Pilot tetiğinde Pro'ya geçilir (lisans + hard-cap + cron + timeout zaten gerektiriyor). |
| MK-129.4 | v3 terfi → backfill çağrısı **best-effort await**: hata terfi'yi geri almaz, kullanıcıya toast'ta uyarı verilir, manuel `/api/eslestirme-backfill {devre_id}` ile telafi edilebilir. Hata durumunda yönlendirme 2.5 sn (mesaj okunabilsin). |

---

## ALTI ÇİZİLECEK KEŞİF — Çapraz doğrulama katmanı eksik (130'un en büyük maddesi)

Cihat'ın tetikçi testi (bir POAR PDF'i kopyalayıp yeni isimle yükledi) şunu açığa çıkardı:
**sistem PDF içeriği × Excel kabuğu çakıştırmasını yapmıyor.** Mevcut durum:

- Pipeline kaynağı **yalnız dosya adı** (`api/kuyruk-isle-izometri.js:458` — koddaki
  yorum açık). PDF içindeki pipeline metni doğrulanmıyor. Yanlış adlandırma → yanlış bağ.
- `bindir()` fonksiyonu sadece **et/çap/ağırlık/yüzey** çelişkisini yakalıyor (%3
  tolerans, `bindirme_flag`). **Malzeme listesi karşılaştırması YOK** — POAR'daki
  BOM tablosu Excel BOM ile çakıştırılmıyor.
- `bindirme_flag` ham hâlde DB'ye yazılıyor ama UI'da operatöre **görünür değil**
  (sadece spool tablosunda "çelişki" yazısı, fark detayı yok).
- L3 (AI okuma) **manuel toggle**, otomatik karar yok. POAR resim formatında L3
  gerekli ama sistem onu otomatik tetiklemiyor.

**Cihat'ın hatırlattığı omurga sözü:** "klasör yüklüyoruz, önce güvenlik için Excel
kabuk çıkıyor, sonra katman katman dosyada ne varsa sömürüp elde edilebilecek tüm
bilgileri sömürecektik, uyumsuzlukları uyaracaktık." Bunun büyük kısmı **yapılmadı.**
İlk katman (et/çap bindirme) kısmen var, gerisi yok. Bu A1 hatası değil, omurganın
yapılmamış büyük adımı.

**130 baş maddesi:** `docs/PARSER-VE-YUKLEME-AKISI.md` belgesi + çapraz doğrulama
katmanı tasarımı. Belge yazılmadan kod yazılmayacak (Cihat kararı, 00:18).

---

## CI Son Durum

- Son push `6b28df6 feat(129): v3 onayEt'e backfill cagrisi`. CI koştu.
- Önceki Error'lar (`5ff4b99`, `a7799fc`, `81cc59e`) **çözüldü** — mükerrer dosya
  silinip 12'ye dönülünce deploy Ready, sonraki tüm push'lar Ready.
- Function sayısı şu an: **12/12** (Hobby tavanı). 130'da yeni endpoint = tavan aşımı,
  konsolidasyon veya Pro kararı şart.

---

## 130'a Açık Borç (önceliğe göre)

1. **`docs/PARSER-VE-YUKLEME-AKISI.md` belgesi (Cihat onayı, 00:35).** İçerik: klasör
   yükleme akışı (drop → autoDetect → kuyruk → parse), katman katman sömürme planı
   (Excel kabuk → POAR içerik → tutarlılık check), parser kuralları (`lib/excel-parser.js`
   tier'ları, `api/izometri-oku.js` L1/L2/L3 mantığı, dosya-adı regex, POAR/PAOR/AVEVA
   format farkları), kayıt şeması (`devre_dokumanlari`, `dosya_isleme_kuyrugu`,
   `spooller.cizim_durumu` state machine, `montaj_json` yapısı), MK referansları.
   Belge yazılmadan yeni kod yok. **Yarım gün ayrılır.**

2. **Spool detay UI çelişkisi (v3 testinde imalat sekmesi boş, montaj var):** Toast
   doğru çıktı ("8 izometri eşleşmesi"), DB seviyesinde A1 önceki testte (eski devre
   `7fbdde63`) kanıtlanmıştı ama yeni v3 devresinde spool detayda imalat PDF görünmedi.
   Hipotez: `tenant_id` filtresi farkı, `silindi=false` durumu, veya devre_detay/
   spool_detay'ın cache problemi. 130 açılışında: yeni devrenin `devre_id`'siyle SQL
   snapshot + hard-refresh testi.

3. **Çapraz doğrulama tasarımı** (yukarıdaki "Altı çizilecek keşif"in pratik adımları,
   belge yazıldıktan sonra). PDF içeriği × Excel kabuk uyumsuzluk yakalama:
   pipeline doğrulama, malzeme listesi karşılaştırma, `bindirme_flag` UI gösterimi,
   L3 otomatik tetik kararı.

4. **Klasör ağacı + işaretleme (128'den devreden borç):** Adım 1'de düz dosya tablosu
   yerine mockup v5'teki Windows-gezgini benzeri aç-kapa klasör ağacı. Klasör
   işaretleme (bilgi amaçlı / revizyon-öncesi → eşleştirmeye sokma). Şu an Adım 2
   Dökümanlar sekmesinde var, Adım 1'e taşınacak.

5. **"Fazla" UX hatası:** Mockup'ta "fazla" = "kabukta olmayan spool adayı"
   (örn. mockup'taki X26). Canlı v3'te montaj/genel PDF'ler de "fazla" olarak
   görünüyor (`dosya_adi_pipeline_yok` sebebiyle) — yanlış kategori. Montaj PDF'leri
   ayrı bir kategori (örn. "Montaj/Genel") veya doğrudan Dökümanlar sekmesine.

6. **Montaj PDF spool detayda eksik (önceden açıktı):** `spool_detay.html:1262`
   `montaj_json`'dan okuyor ama bu testte sadece o görünüyor, imalat tersine. (2.
   madde ile birleşik bakılacak.)

7. **Onayla-drenaj guard + tooltip (128'den devreden borç).**

8. **Devreler girişi (MK-126.4) — sidebar "Devre Yükle" + "Onay Bekleyen Devreler"
   listesi + canlı listelere `durum<>'taslak'` filtresi.**

9. **Function limiti stratejisi (MK-129.3'ün pratiği):** pilot tetiğine kadar
   konsolidasyon (örn. `kuyruk-isle-*` dosyalarını tek router'a indirme), pilot
   tetiğinde Vercel Pro + Supabase Pro (~$45/ay).

10. **Önceden açık borçlar (taşındı):** 117 (`yukleyen_id`), web-spool sync
    (`aktif_basamak`/`ilerleme`), fitting (DIN 86087 / ASME B16.9),
    `spool_dokumanlari` bağ tablosu.

---

## Push Paketi

| Dosya | Repo yolu | Tür | Durum |
|-------|-----------|-----|-------|
| api/eslestirme-backfill.js | `api/eslestirme-backfill.js` | **fix (B-2 alias)** | push edildi (`31f22e4`) |
| devre_wizard_v3.html | `devre_wizard_v3.html` | **feat (onayEt → backfill)** | push edildi (`6b28df6`) |
| son-durum.md | `.github/son-durum.md` | doc | bu commit |
| CLAUDE-SON-OTURUM.md | `CLAUDE-SON-OTURUM.md` | doc | bu commit |
| CLAUDE-SONRAKI-OTURUM.md | `CLAUDE-SONRAKI-OTURUM.md` | doc | bu commit |

**Önceki başarısız commit'ler (referans):**
- `5ff4b99 feat(129): /api/devre-eslesme-yenile` → mükerrer, deploy reddedildi (12-function)
- `28a63cd revert(129): devre-eslesme-yenile sil` → düzeltme, 12'ye dön
- `0a0e3b3 fix(129): backfill eslestir'e devre_dokuman_id gecir` → yetersiz, alias yoktu

---

## Plan Tablosu (129 onayı, kapanışta yazılı)

| Servis | Şimdi | Pilot tetiğinde | Sebep | ~Maliyet |
|---|---|---|---|---|
| Vercel | Hobby | **Pro şart** | Ticari lisans + hard-cap + function 60s/cron 10s + sık cron | ~$20/ay |
| Supabase | Free | **Pro şart** | Haftalık auto-pause + 1GB storage limiti | ~$25/ay |
| GitHub | Free | Free yeterli | Sadece kod+CI, müşteriye dokunmuyor | $0 |

**Toplam pilot tetiğinde:** ~$45/ay. Tetik = ilk gerçek tersane anlaşması. Şu an
free/Hobby'de kalınır.

---

> 130 açılışında bu dosya + `CLAUDE-SONRAKI-OTURUM.md` + `docs/DEVRE-WIZARD-OMURGA.md`
> (v3.1) okunur. İlk iş: **`docs/PARSER-VE-YUKLEME-AKISI.md` belgesini yazmak** —
> kod yazılmadan, mevcut dosyalar (`lib/excel-parser.js`, `api/izometri-oku.js`,
> `ares-kabuk.js`, `ares-normalize.js`, `KARARLAR.md`) sistematik okunup belgelenecek.
> Sonra spool detay UI çelişkisi (2. madde) → çapraz doğrulama tasarımı (3. madde).
