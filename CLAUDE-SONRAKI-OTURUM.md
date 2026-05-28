# Oturum 130 — Parser & Yükleme Akışı belgesi + spool detay UI çelişkisi + çapraz doğrulama

## Açılış ritüeli

Git pull/status/log → CI rengi (129 push'unda KOD vardı: `eslestirme-backfill.js` alias
fix + `devre_wizard_v3.html` onayEt entegrasyonu — sarı/yeşil beklenir, kırmızı
olmamalı) → bu üç dosya oku: `son-durum.md`, `CLAUDE-SON-OTURUM.md`, bu dosya →
ayrıca `docs/DEVRE-WIZARD-OMURGA.md` (v3.1) → gündem teyidi.

**Function sayımı zorunlu (MK-129.3):** `ls api/*.js | wc -l` → 12 görmeli. 12'ye
yaklaşıldığında konsolidasyon/Pro kararı.

## 129 nerede bıraktı — kısa hatırlatma

- A1 (terfi-yeniden-eşle, MK-127.4) **DB seviyesinde tam çalıştı**, iki vakada
  kanıtlandı (`7fbdde63` + `3ce020f6`). v3 `onayEt`'e entegre, toast "8 izometri
  eşleşmesi" gösteriyor.
- **AMA:** yeni v3 testinde spool detay UI'da imalat izometri PDF görünmedi, sadece
  montaj PDF var. Bu DB-UI çelişkisi 130'un ilk işi.
- **Daha büyük keşif:** Cihat'ın tetikçi testi (POAR'ı kopyalayıp yeni isimle yükledi)
  çapraz doğrulama katmanının eksikliğini açığa çıkardı — PDF içeriği × Excel kabuk
  uyumsuzluğunu sistem yakalamıyor. Omurganın yapılmamış büyük adımı.

## Yapılacaklar (sıra)

### 1. **`docs/PARSER-VE-YUKLEME-AKISI.md` belgesi (Cihat onayı, 00:35) — yarım gün**

**Kod yazılmadan belge yazılır.** İçerik:

- **Klasör yükleme akışı:** drop/folderInput → `dosyalariEkle` → `autoDetect` (uzantı +
  klasör sözlüğü + BOM heuristic) → tip seçimi (UI override) → kuyruğa al → parser
  yönlendirme (`bom_excel`→excel-generic, `izometri`→izometri, diğer→sakla).
- **Katman katman sömürme planı (omurganın eksik kalan kısmı):**
  1. **Katman 0: Güvenlik** — Excel kabuk zorunlu (MK-125.3). Excel yoksa İncele kapalı.
  2. **Katman 1: Kabuk türetme** — `ARES_KABUK.grupla(satirlar)` → spool listesi
     (pipeline, spool_no, çap, et, ağırlık, malzeme, kalite, yüzey).
  3. **Katman 2: PDF içerik sömürme** — POAR/PAOR/AVEVA formatları, L1 (text-layer),
     L2 (regex+layout), L3 (AI okuma — manuel toggle, **otomatik karar 130'a eklenecek**).
  4. **Katman 3: Çapraz doğrulama (EKSİK)** — PDF içeriği × Excel kabuk:
     - Pipeline çelişkisi (dosya adı vs PDF içindeki başlık metni)
     - Et/çap/ağırlık (`bindir()` zaten var, %3 tolerans, `bindirme_flag` set ediyor
       ama UI'da görünür değil)
     - **Malzeme listesi karşılaştırması (HİÇ YOK)** — POAR'daki BOM tablosu Excel BOM
       ile çakıştırılmalı, fark olunca operatöre göster
  5. **Katman 4: Operatör onayı** — çelişki varsa "Düzelt" akışı (omurga 18.d "çapa")
- **Parser kuralları:** `lib/excel-parser.js` tier'ları (L1 dictionary, L2 word-boundary
  substring, sheet priority All/import, summary row filter), `api/izometri-oku.js`
  format detection (POAR/PAOR/AVEVA), `dosyaAdiParse` regex'i (pipeline+spool
  çıkarma), `bindir()` toleransları.
- **Kayıt şeması:** `devre_dokumanlari` (`spool_id`, `parse_durumu`, `yukleyen_id`),
  `dosya_isleme_kuyrugu` (`parser`, `durum` states, `parse_sonuc` JSONB yapısı),
  `spooller.cizim_durumu` state machine (`bekliyor`→`kismi`→`tam`), `montaj_json`
  şeması, `parse_sonuc._eslesme` özet alanı.
- **MK referansları:** MK-49.x, MK-72.x, MK-97.x, MK-98.x, MK-99.x, MK-110.x,
  MK-125.x, MK-126.x, MK-127.x, MK-128.x, MK-129.x — KARARLAR.md'den birebir.

**Okuma sırası (130 ilk saat):** `KARARLAR.md` → `docs/DEVRE-WIZARD-OMURGA.md` →
`lib/excel-parser.js` → `api/izometri-oku.js` → `api/kuyruk-isle-izometri.js`
(`eslestir` + `bindir` + `montajEslestir`) → `ares-kabuk.js` (`grupla`, `aktar`) →
`ares-normalize.js` → `devre_wizard.html` v2 (yükleme akışı kanonik). Belge yazılırken
bu dosyalara birebir referans verilecek.

### 2. **Spool detay UI çelişkisi (DB-UI uyumsuzluğu)**

Yeni v3 testinde (`de0dbbdf-...`) toast doğru çıktı ama spool detayda imalat sekmesi
boş, montaj geldi. Eski devrede (`7fbdde63`) tersi olmuştu. **SQL'le başla:**

```sql
-- Yeni v3 testinin durumu
select s.spool_no, s.cizim_durumu,
  (select count(*) from devre_dokumanlari dd
     where dd.devre_id = s.devre_id and dd.spool_id = s.id) as bagli_dok,
  (s.montaj_json is not null) as montaj_var
from spooller s
where s.devre_id = 'de0dbbdf-7c34-4f82-ad2e-5bd154fc864a'
  and s.silindi = false
order by s.spool_no;
```

Eğer `bagli_dok=1` ama UI boş → `spool_detay.html:1241-1243` sorgusunda `tenant_id`
veya başka bir filtre eksik. Eğer `bagli_dok=0` → backfill çalışmadı ama toast yanlış
sayı verdi (`toplam_yukseltilen` fallback'i `|| 0` ama gerçek 0 mı, eşleşen mi karışmış).

### 3. **Çapraz doğrulama tasarımı** (belge yazıldıktan sonra)

Belgeden çıkacak somut adımlar — şu an taslak:
- `bindirme_flag` UI'da gösterilmeli (spool tablosunda "çelişki var" + detay popup)
- Pipeline doğrulama: PDF içeriğindeki ana başlık (POAR header) `dosyaAdiParse`
  çıktısıyla çakıştırılmalı, fark varsa uyarı
- Malzeme listesi karşılaştırma: POAR BOM tablosu × Excel BOM, satır bazlı diff
- L3 otomatik karar: PDF'in resim-PDF olduğu tespitinde otomatik L3 tetik (operatör
  onaylar)

### 4. **Klasör ağacı + işaretleme** (128'den devreden, mockup v5)

Adım 1'de Windows-gezgini benzeri aç-kapa klasör ağacı. İşaretleme (revizyon-öncesi
klasörü eşleştirmeye sokma). `dokKlasorToggle` deseni var (devre_detay), Adım 2
Dökümanlar sekmesinde Adım 1'e taşınacak.

### 5. **"Fazla" UX hatası**

Montaj/genel PDF'leri (dosya adı pipeline regex tutmayanlar) "fazla" olarak
gösteriliyor — yanlış kategori. Mockup'ta "fazla" = `spool_no aday` çıkarılabilen
ama kabukta olmayan (X26 örneği). Çözüm: `dosya_adi_pipeline_yok` sebepli olanlar
ayrı kategori ("Montaj/Genel") veya Dökümanlar sekmesine.

### 6. **Diğer borçlar** (sıra dışı, hazır olduklarında)

- Onayla-drenaj guard + tooltip (128 borcu)
- Devreler girişi (MK-126.4) — sidebar "Devre Yükle" + "Onay Bekleyen" liste +
  canlı listelere `durum<>'taslak'` filtresi
- Function limiti stratejisi (MK-129.3): konsolidasyon planı çıkar
- 117 borcu (`yukleyen_id` null), web-spool sync (`aktif_basamak`/`ilerleme`)
- Fitting kütüphanesi (DIN 86087, ASME B16.9)

## KORUMA bantları

- **KORUMA-1:** Kanonik modüller (`ARES_KABUK`, `ARES_NORM`, `ARES_IZO_DRENAJ`,
  `izometri-oku`, `eslestir`) **çağır, kopyalama.**
- **KORUMA-2:** Canlı sayfalara dokunuş (devreler.html, proje_detay.html) → smoke test.
- **KORUMA-3:** v3 izolasyonu (MK-127.2) — v2'ye dokunma.
- **KORUMA-4 (yeni):** `ls api/*.js | wc -l` zorunlu (MK-129.3); 12'ye yaklaşma.
- **KORUMA-5 (yeni):** Yeni endpoint yazmadan önce mevcut `api/*` envanteri zorunlu
  + benzer adlı dosyaları aç (MK-129.2, MK-126.8 güçlendirmesi).

## Sonraki fazlar (omurga 18.d — 130'da DEĞİL)

- Çapa görsel arayüzü (PDF'te işaretle → formatın tümüne öğret)
- Taslak modu tam: `taslak_haric`/`taslak_not` + nullable kolonlar
- A2 et/çap çelişkisi: client `grupla` çıktısına çap (`capCikar`/`boyutParse`)

## Hatırlatmalar

- MK-49.1: `izometri-oku.js`'e DOKUNMA
- MK-126.8 + MK-129.2: yeni endpoint öncesi mevcut kod + DB + `api/*` envanteri
- MK-129.1: PostgREST FK kolonu + embed çakışmasında alias zorunlu
- MK-129.3: Hobby 12-function tavan kontrolü
- MK-129.4: v3 terfi → backfill best-effort, hata yutar
- Env: `SUPABASE_SERVICE_KEY` (ROLE değil, MK-101.4)
- Storage path: `{tenant_id}/...` (MK-99.2)
- Dry-run schema: `BEGIN...ROLLBACK` (MK-98.2)
- Migration: `DROP IF EXISTS` idempotent (MK-99.1)

## Plan tablosu (129 onayı)

| Servis | Şimdi | Pilot tetiğinde | ~Maliyet |
|---|---|---|---|
| Vercel | Hobby | **Pro şart** | ~$20/ay |
| Supabase | Free | **Pro şart** | ~$25/ay |
| GitHub | Free | Free yeterli | $0 |

Toplam pilot tetiğinde ~$45/ay. Tetik = ilk gerçek tersane anlaşması.

---

> **130'un ilk somut adımı: belge yaz, kod yazma.** `docs/PARSER-VE-YUKLEME-AKISI.md`
> hem 130-140 oturumlarının paylaşılan referansı, hem çapraz doğrulama katmanının
> mimari yerini netleştirecek. Cihat onayı: 129 kapanışında alındı.
