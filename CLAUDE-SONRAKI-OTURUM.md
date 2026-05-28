# Oturum 132 — Glyph band-B decode tablosu (baş iş) + dry-run AT110 + bulk hazırlığı

## Açılış ritüeli

Git pull/status/log → CI rengi (131 sadece doc, `[skip ci]` → yeşil olmalı, kod yok) →
şu dosyalar oku: `son-durum.md`, `CLAUDE-SON-OTURUM.md`, bu dosya → `docs/PARSER-VE-YUKLEME-AKISI.md`
(Bölüm 7 + 7.3 eklenecek) → `docs/DEVRE-WIZARD-OMURGA.md` (v3.1) → gündem teyidi.

**Function sayımı (MK-129.3):** `ls api/*.js | wc -l` → 12 görmeli. (glyph fix lib/'e, yeni endpoint yok.)

## 131 nerede bıraktı — kısa hatırlatma

- K4 ikilemi **çözüldü:** ne Yol 2 (öğret) ne Yol 1 (L3 montaj). Tersan formatı zaten öğretilmiş
  (119 spool / 120 montaj). AT110 L3'e düşüyor çünkü **tanınmıyor.**
- Kök: gömülü-değil **ArialMT Identity-H + ToUnicode yok** → pdf-parse glyph çözemiyor → fingerprint
  band-B çapaları (`Continue:`/`Malzeme Listesi`/`Cut&Bending`) kaçırılıyor → skor 1<2 → L3.
- Hem tanıma (pdfIpucuCikar 634) hem L2 (parserKuralIle 882) pdf-parse kullanır (`-layout` değil).
- Çöp→doğru **deterministik** (38/0). Band-A (+29) var; **band-B sabit tablo YOK** = boşluk.

## Yapılacaklar (sıra)

### 1. **Glyph band-B decode tablosu — baş iş**

**Yer:** `lib/glyph-onar.js` (metinNormalle). izometri-oku.js'e DOKUNMA (MK-49.1).

- **a) Tabloyu tamamla:** 131'de türetilen 38 girişin band-B kısmı + eksik a-z (b,c,d,f,j,k,p,q,w,x,z)
  + Türkçe (ç,ğ,ı,ö,ş,ü). Kaynak: AT110 + M100 PDF'leri (pdf-parse çöp ↔ pdftotext doğru hizalama).
  **Font-seviyesi iş, over-fit değil** (parse deseni değil, ArialMT glyph sırası).
- **b) Onarımı ekle:** band-A (+29, mevcut) + band-B (tablo, yeni). **Gated kalmalı** — ham metinde
  çapa varsa (temiz export) DOKUNMA (sıfır regresyon; mevcut band-A kapı mantığını izle).
- **c) Dry-run:** AT110 montaj+imalat → (1) `fingerprintSkor` ≥2 mı (tanınıyor mu), (2) montaj parse
  ediyor mu, (3) imalat malzeme satırları ham'dan çıkıyor mu. M100 ile tekrarla.
- **Beklenen:** tek değişiklik tanıma + montaj + kaymış spool malzeme tablosu (NB1137 borcu) üçünü açar.

### 2. **Bulk doğrulaması (örnekler gelince)**

Gelen gemilerin font sınıfını ölç: kaçı gömülü-değil ArialMT Identity-H (tablo kapsar), kaçı temiz
(zaten okunuyor), kaçı POAR raster (L3, ayrı). Tablo bu sınıfın hepsini tek seferde kapatır.
Malzeme satır desenini (boşluk/kolon varyantları) bulk ile güçlendir — 4x4.

### 3. **K1 + K3 — bindirme_flag UI** (v3 İnceleme 🟡 + düzelt popup). Function tavanı bağımlı.

### 4. **K2 — malzeme listesi kıyası** (Excel BOM × PDF malzeme_listesi diff, İnceleme UI sonrası).

### 5. **MK + doc borçları**
- 131 MK adayları (131.1-131.4, PARSER Bölüm 9'da işli) KARARLAR'a — güncel KARARLAR doğrulanınca.
- PARSER-VE-YUKLEME-AKISI.md Bölüm 7.3 + Bölüm 8 K4 mührü **131'de eklendi** (tamam).
- BRIEFING bilgi haritası satırı (MK-61.4 borcu — hâlâ açık).

### 6. **Diğer borçlar** (sıra dışı)
- K5 function konsolidasyon, v3 giydirme (büyük), 117 (`yukleyen_id`), web-spool sync,
  fitting (DIN 86087/ASME B16.9), `spool_dokumanlari` bağ tablosu, "fazla" UX.

## KORUMA bantları

- **MK-49.1:** `izometri-oku.js`'e DOKUNMA. Glyph fix `lib/glyph-onar.js`'te.
- **KORUMA-1:** Kanonik modüller çağrılır, kopyalanmaz.
- **KORUMA-4:** `ls api/*.js | wc -l` = 12; yeni endpoint yok (glyph fix lib/).
- **Gated onarım:** temiz metinde no-op — band-A kapı mantığını birebir izle (regresyon yok).

## Hatırlatmalar

- Env: `SUPABASE_SERVICE_KEY` (MK-101.4) · Storage path `{tenant_id}/...` (MK-99.2)
- Dry-run schema `BEGIN...ROLLBACK` (MK-98.2) · Migration `DROP IF EXISTS` (MK-99.1)
- `sed` özel karakter/uzun dosyada kullanma → `create_file`/`str_replace`
- Tanıma ve parse AYRI katman (MK-131.3) — ikisini ayrı doğrula.

---

> **132'nin ilk somut adımı: glyph band-B decode tablosu (lib/glyph-onar.js), gated.** Önce tabloyu
> tamamla, sonra dry-run AT110 (tanıma skor ≥2 + parse), sonra bulk dağılımı. K4 artık kod işi, karar değil.
