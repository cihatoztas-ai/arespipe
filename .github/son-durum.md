# Son Durum — 113. Oturum (22-23 May 2026)

> 112 → 113 geçişi. ANA TEMA: **izometri parse hattındaki Vercel 508 hatasının kökten çözümü
> — client-loop orkestrasyonu + tek paylaşılan altyapı (MK-113.1/113.2)** + **wizard "yeni devre
> oluşturma" akışı (MK-113.3)**. İki ana iş de tamamlandı ve canlı doğrulandı. Kapanışta
> **format öğrenme döngüsünün tanısı** çıkarıldı (sonraki oturumun ana teması).

---

## Bu Oturumun Sonucu

**113 başarıyla kapandı. İki iş de canlıda çalışıyor.**

- **İş 1 — 508 fix (client-loop):** İzometri drenajı artık server→server self-invocation YAPMIYOR.
  Tarayıcı döngüyü tutuyor, her PDF için izometri-oku'yu doğrudan çağırıyor → Vercel
  INFINITE_LOOP_DETECTED (508) **kökten bitti.** devre_detay + wizard AYNI `ares-izometri-drenaj.js`
  motorunu kullanıyor (tek paylaşılan altyapı).
- **İş 2 — Wizard yeni devre:** Wizard artık "+ Yeni Devre" ile sıfırdan devre oluşturabiliyor
  (Adım 1 mod toggle + dedup + finalize INSERT + kabuk sonrası özet senkronu). Canlı test: "deneme"
  devresi (P26-151) oluştu, 142 kg + Karbon Çelik + Galvaniz özeti spool'lardan doğru türedi.

---

## YAPILANLAR

### İş 1 — İzometri 508 fix: client-loop orkestrasyonu (MK-113.1/113.2)

**Kök neden (Vercel doc + koddan kesin):** `kuyruk-isle-izometri.js` drenaj modu, `izometri-oku`'yu
AYNI deployment'ta (`SELF_BASE_URL=arespipe.vercel.app/api/izometri-oku`) HTTP ile çağırıyordu.
112'de drenaj agresifleşince (iç-döngü 4 iş + frontend MAX_TUR=60) çağrı yoğunluğu patladı → Vercel
508 INFINITE_LOOP_DETECTED ("uygulama kendine/harici API'ye sonsuz istek yapınca"). `izometri-oku.js`
508 DÖNDÜRMÜYOR (200/400/405/500/502); 508 platformdan. Belirti: 302 bekliyor + 18 hata
"izometri-oku HTTP 508", drenaj MAX_ARDISIK_HATA=3'te durup backlog'u kilitliyordu.

**Çözüm:** Drenaj orkestrasyonu backend'den TARAYICIYA taşındı. Tarayıcı bekleyen listesini bir kez
çeker, her PDF için: imzalı URL → base64 → POST /api/izometri-oku (browser'dan, server→server YOK)
→ POST /api/kuyruk-isle-izometri {is_id, onceden_parse}. Her PDF bir kez işlenir, re-pay yok.
MK-49.1 korundu: izometri-oku'ya dokunulmadı, sadece çağıran taraf browser oldu.

**Aşama 1 — `kuyruk-isle-izometri.js` skip-parse modu (deploy `67c944f`):** `birIsIsle`'ye
`opts.oncedenParse` eklendi — gelirse server indir+izometri-oku adımını ATLAR, sadece kaydet+eslestir
çalışır. Opts yoksa eski server yolu aynen (sıfır regresyon). Handler `is_id` modu
`req.body.onceden_parse/onceden_parse_http` geçiriyor.

**Aşama 1 — `ares-izometri-drenaj.js` (YENİ, deploy `67c944f`):** `ARES_IZO_DRENAJ.izometriDreneEt
({supa, tid, filtre:{devreId}|{}, bucket, onIlerleme})`. Liste BİR KEZ çekilir, tek tek browser-loop:
`ARES.dosyaUrlAl(yol,bucket)` (imzalı URL string) → base64 → izometri-oku → kuyruk-isle-izometri.
`onIlerleme` callback {faz, sira, toplam, dosya, sonuc?, ozet}; sonda `ozet.kalan`.

**Aşama 2 — `devre_detay.html` (deploy `67c944f`):** `bekleyenIzometriIsle` MAX_TUR=60 server-tetik
döngüsünden helper çağrısına çevrildi (`filtre:{devreId}, bucket:'devre-belgeleri'`). Script include
eklendi (ares-kabuk sonrası). **Canlı test GEÇTİ:** test devresi (NB1124/ballast) tam drene oldu —
508 YOK, manuel_onay:4 + oneri_hazir:8 = 12, bekliyor/hata=0. Spool detayda izometri PDF link ile geldi.

**Aşama 3 — `devre_wizard.html` izometri drenajı (deploy `9425984`):** Wizard da aynı helper'a bağlandı.
ESKİ fire-and-forget server tetiği (`fetch '/api/kuyruk-isle-izometri' body:'{}'`) KALDIRILDI;
`wizBekleyenleriIsle` server-tetik+8-tur polling'den `ARES_IZO_DRENAJ.izometriDreneEt({filtre:{devreId}})`'a
çevrildi. Ölü `WIZ._izoIds` temizlendi (helper devre_id ile çeker). Script include eklendi.

**Aşama 4 — Ölü kod temizliği (C kapsamı):** Frontend taraması yapıldı; devre_detay + wizard'da
temizlenecek ölü kod KALMADI (Aşama 2-3'te zaten temiz). Backend `drenajTuru` + `kuyruk-isle.js`
self-chain temizliği bilinçli olarak **test sonrasına ertelendi (4b)** — çalışan ama kullanılmayan kod,
aktif tehlike yok (`is_id` modu dispatch'i drenajdan önce). Batch sayfaları henüz client-loop'a
GEÇMEDİ — onlar "ölü kod" değil, Aşama 3'ün devamı (ayrı iş).

### İş 2 — Wizard "yeni devre oluşturma" akışı (MK-113.3, deploy `b2aad81`)

**Teşhis (koddan):** Wizard SADECE mevcut devreye dosya ekliyordu, `devreler`'e INSERT yoktu — "yeni
devre" yolu bilinçli olarak hiç yapılmamıştı (basitten başlanmış, sırası gelmişti). Devre oluşturma
`devre_yeni.html`'de yaşıyordu. Ama wizard'ın Adım 4'ünde kabuk türetme + `ARES_KABUK.aktar` (spool+BOM
INSERT) zaten çalışıyordu — eksik tek şey `devreler` satırının kendisiydi (~%90 hazır).

**Çözüm (B seçeneği + dedup b, 6 cerrahi edit):**
- **Adım 1 mod toggle:** "Mevcut Devre" (eski davranış aynen) / "+ Yeni Devre" (devre_no/zone/termin input).
- **Dedup:** Yeni modda aynı proje+devre_no(+zone) varsa "Mevcut moduna geçeyim mi?" (zone boşsa IS NULL).
- **Devre INSERT — `adim3_yukle` başında** (dosya upload'tan önce; vazgeçilirse öksüz devre kalmaz).
  Alanlar `devre_yeni`'den çağrılarak (MK-109.1, yeniden yazma yok): `is_emri_no=ARES.sonrakiNo('is_emri')`,
  `basamak_snapshot=ARES.basamakSnapshotOlustur()`, malzeme/yuzey=null, agirlik=0.
- **Kabuk sonrası özet senkronu:** `kabukOnayla`'da `aktar()` başarılıysa VE yalnız yeni devrede,
  `_devreOzetSenkron` eklenen spool'lardan (DB-truth) devrenin malzeme/yuzey/agirlik'ini doldurur.
  Mevcut devreye DOKUNULMAZ → sıfır regresyon.

**Canlı test GEÇTİ:** "deneme" devresi P26-151 oluştu — 3 spool, 142 kg, Karbon Çelik, Galvaniz,
St 37 kalite, çap/et hepsi doğru türedi. Özet senkronu çalıştı.

---

## Commit'ler (113)

| Hash | Mesaj |
|------|-------|
| `b2aad81` | feat(113/B): wizard yeni devre olusturma — mod toggle + dedup + finalize INSERT + ozet senkron (MK-113.3) |
| `67c944f` | feat(113/A): izometri client-loop drenaj — server->server self-invocation kaldirildi (508 fix). ares-izometri-drenaj.js + kuyruk-isle-izometri skip-parse + devre_detay helper |
| `9425984` | feat(113/A): wizard izometri drenaji client-loop helper'ina baglandi (508 fix, tek altyapi) |
| `(doc)`   | chore(113): kapanis dokumanlari [skip ci] |

CI: aradaki CI commit'leri (`ci-son-rapor.json [skip ci]`) pull-rebase ile düzgün alındı, çakışma yok.

---

## Mimari Kararlar (113)

- **MK-113.1:** Vercel'de 508 INFINITE_LOOP_DETECTED = bir serverless fonksiyonun AYNI deployment'taki
  başka fonksiyonu (veya kendini) yoğun HTTP ile çağırması. İzometri parse drenajı bu yüzden 508
  üretiyordu. Çözüm: **client-loop orkestrasyonu** — tarayıcı döngüyü tutar, her PDF için izometri-oku'yu
  browser'dan çağırır. Server→server self-invocation tamamen kaldırılır. Takas: işlerken tab açık kalmalı.
- **MK-113.2:** İzometri drenajı için **tek paylaşılan altyapı** — `ares-izometri-drenaj.js`. devre_detay
  + wizard (+ ileride batch) aynı helper'ı çağırır. `filtre:{devreId}` devre-özgü, `{}` global. Her
  tüketici sayfa kendi server-tetik/polling mantığını YAZMAZ.
- **MK-113.3:** Wizard'a yeni devre oluşturma eklenirken devre satırı `adim3_yukle` başında (finalize'da)
  oluşturulur — öksüz devre riskine karşı. Devre alanları `devre_yeni`'den ÇAĞRILIR (MK-109.1). Yeni
  devrede malzeme/yuzey/agirlik null/0 doğar, kabuk sonrası spool'lardan DB-truth ile senkronlanır.
  Mevcut devreye dokunulmaz (sıfır regresyon).

---

## 🔬 Format Öğrenme Döngüsü — TANI (sonraki oturumun ana teması)

Kapanışta çıkarılan en kritik bulgu. "Sistemde öğrenme ne aşamada, ne kadar yol var?" sorusunun
veriyle cevabı:

**Cache (PDF-seviyesi) ÇALIŞIYOR:** `pdf_sha256` ile aynı PDF ikinci kez L3'e gitmiyor. Mükerrer
fazlalık 7/233 (~%3, gürültü). Toplam L3 maliyeti ~$6.21, tamamı L3'ten (L2 bedava, 13ms).

**Format öğrenme (desen-seviyesi) KISMEN çalışıyor, ÜÇ DELİK var** (`ai_api_log` format_id dağılımı):

| format_id | L2 (bedava) | L3 (paralı) | Tanı |
|---|---|---|---|
| **(format_id YOK)** | — | 156 / **$3.44** | 🔴 Fingerprint eşleşmiyor, formata bağlanamıyor |
| `84c12f61...` | 181 | 15 / $0.37 | 🟡 Öğrenmiş ama L3 sızıntısı (kural kırılgan) |
| `e1fb879d...` | 47 | 15 / $0.46 | 🟡 Aynı |
| `15243262...` | 0 | 16 / $0.33 | 🔴 Hiç L2 kuralı yok, %100 L3 |
| `995b5514...` | 0 | 35 / $1.27 | 🔴 Hiç L2 kuralı yok, %100 L3 |

- **D1 — Fingerprint zayıf ($3.44, en büyük delik):** Çağrıların yarısı `format_id YOK` — PDF bir
  formata eşleşemiyor → L3'e atılıyor. Eşleşme eşiği/sinyalleri dar.
- **D2 — Öğrenilmiş formatta L3 sızıntısı ($0.83 + kalite):** L2 kuralı var ama bazı varyasyonları
  yakalayamayıp L3'e fallback ediyor. **Tersan alıştırma+not eksiği de buraya:** alıştırma PDF'te
  AÇIKÇA var (spool adı `...-ALS-...` eki + "NOT: Alistirma Parcasidir" satırı) ama L2 ikisini de
  kaçırıyor (`alistirma_ipucu: null`, `not_metni: null`).
- **D3 — 2 format hiç öğrenilmemiş ($1.60):** `15243262`, `995b5514` — tanınıyor ama kural yok.
- **D4 — Müşteri-öğretir UI:** Asıl çözüm. Müşteri manuel_onay'da PDF'i işaretler → kural çıkar →
  `izometri_format_tanimlari`'na kaydedilir → o tersane bir daha sormadan otomatik L2. Vizyondaki B+C adımları.

**Format tablosu adı:** `izometri_format_tanimlari` (NOT `formatlar`). Diğerleri:
`excel_format_tanimlari`, `izometri_batch_kayitlari`.

**STRATEJİ KARARI (Cihat):** Çok format eşzamanlı DEĞİL → **tek format derinlemesine.** Sıra:
**D1 yatay (sistem geneli fingerprint) → sonra Tersan dikey (D2 kural + alıştırma/not + D4 UI prototipi
Tersan üzerinde uçtan uca) → sonra çoğalt.** Tersan en olgun zemin (181 bedava L2, _tersan_meta kurulu,
gerçek PDF'ler elde). Tek formatta tüm boru hattını çalıştır = diğerleri için şablon.

**Spool detayda gösterilmeyen parse katmanları (D2 zenginleştirme kapsamı):** `malzeme_listesi`
(her boru/dirsek/redüser/flanş ayrı satır, boy+ağırlık+kategori), `_tersan_meta` (çizen/tarih/sertifika),
PDF'te VAR ama HİÇ çıkarılmayan: kaynak no, kesim no, rotation angle, cut/bending info, FR pozisyonları,
spool boyları — 3D render + imalat için değerli.

---

## 114'e Açık Borç (önceliğe göre)

1. **🔴 FORMAT ÖĞRENME DÖNGÜSÜ — sonraki oturumun ANA TEMASI.** Sıra: D1 (fingerprint, $3.44) →
   Tersan dikey (D2 kural+alıştırma/not + D4 UI). Üstteki tanı bölümü tam yol haritası.
2. **Aşama 4b — backend ölü kod temizliği.** `kuyruk-isle-izometri.js::drenajTuru` + DRENAJ modu
   dispatch (artık hiçbir frontend çağırmıyor) + `kuyruk-isle.js` self-chain (satır 148) + frontend
   MAX_TUR kalıntıları. Client-loop canlı kanıtlandı; güvenle silinebilir.
3. **Batch sayfaları client-loop'a geçir (Aşama 3 devamı).** `izometri-batch.html` +
   `izometri-batch-incele.html` hâlâ eski fire-and-forget+polling. Farklı bucket (`izometri-pdfs`) +
   `batch_id` kullanıyor; queue yapısı `dosya_isleme_kuyrugu` ile aynı mı doğrulanacak. `ARES_IZO_DRENAJ`'a bağlanacak.
4. **Wizard yeni-devre UI redesign.** Fonksiyon çalışıyor; Cihat "fonksiyon önce, UI mockup/redesign sonra"
   dedi. Toggle + input'lar mockup sonrası elden geçecek.
5. **i18n borcu (G-01).** Wizard 113/B: `dw_mode_mevcut`, `dw_mode_yeni`, `dw_info_yeni`. Eski 112 borcu:
   `dv_izo_drenaj_hata/kismi`, `sp_izo_baslik/ac/acilamadi/eslesen`. Fallback'le çalışıyor, lang/*.json'da yok.
6. **Mobil yönetici ekranında izometri PDF teşhisi (112'den devir).** İş Başlat'ta göründü, yönetici
   ekranında görülmedi. IbSpoolDetay.jsx tek dosya — davranış neden farklı? (Bu oturumda bakılmadı.)
7. **`_N` alt-spool fallback (MK-110.2).** S01_1 PDF → kök S01: önce birebir, yoksa _N at + kök dene.
8. **İkiz kolon temizliği** (agirlik/agirlik_kg, durum/is_durumu — MK-108.2) + web spool durum senkronu
   (devre_detay tablo + spool_detay aktif_basamak/ilerleme DB-truth okusun).
9. **Test verisi temizliği.** Gerçek veri yok; ikiz/test devreleri topluca silinebilir (Cihat istediğinde).

---

## Kritik Hatırlatmalar (113 dersleri)

- **Veriyi gör, varsayma — yine işe yaradı.** `ai_api_log` kolon adı `olusturma_at` (`olusturma`
  değil — Postgres hint), dosya kimliği `pdf_sha256` (information_schema ile bulundu), `formatlar`
  tablosu YOK → gerçek ad `izometri_format_tanimlari`. 508'in izometri-oku'da değil platformda olduğu
  koddan kanıtlandı (508 hiç döndürmüyor). PDF görülmeden alıştırma "yok mu, çıkarılamıyor mu" denemedi.
- **"76 ≠ 12" paniği veriyle çözüldü.** L3 mükerrer şüphesi → sha256 sorgusu → her PDF kez=1, mükerrer
  fazlalık 7/233. Para sızmıyordu; 76 = farklı PDF'lerin birikimi. Şüpheyi tahminle değil sorguyla kapat.
- **md5 + tek-dosya teyidi her push'ta uygulandı.** Yeni dosya (ares-izometri-drenaj.js) git add edildi.
- **Push sırası: pull --rebase → commit → push.** CI commit'i her seferinde rebase ile temiz alındı.
- **zsh yorumlu satır yapıştırma `number expected` verir (zararsız).** Tek satır komut kullan.
- **Kapsam disiplini.** Format öğrenme döngüsü ortaya çıkınca kapsama EKLENMEDİ — tanı çıkarılıp
  sonraki oturuma bırakıldı. Notlar "0 not" = beklenen (elle eklenen alan), bug değil.
- **Env:** `SUPABASE_SERVICE_KEY`; `SELF_BASE_URL=https://arespipe.vercel.app`. Mobil: `VITE_API_BASE`.
- **Proje bilgisi ~52'de donmuş** — güncel durum yalnız bu dosyalar + git'ten.

---

> 114 açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
> 114 ANA TEMA: **Format öğrenme döngüsü** — önce D1 (fingerprint, en pahalı delik), sonra Tersan'ı
> uçtan uca (kural + alıştırma/not + müşteri-öğretir UI). Çok format değil, tek format derinlemesine.
