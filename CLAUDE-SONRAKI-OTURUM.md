# Oturum 133 — Hijyen push (132 düzeltmeleri) + K2 malzeme listesi kıyası

## Açılış ritüeli

Git pull/status/log → CI rengi (132 push: 3 doc + izometri-oku comment-only + KARARLAR +
PARSER) → şu dosyalar oku: `son-durum.md`, `CLAUDE-SON-OTURUM.md`, bu dosya →
`docs/PARSER-VE-YUKLEME-AKISI.md` (Bölüm 7.4 = 132 düzeltmesi, 7.3 İPTAL) →
`docs/DEVRE-WIZARD-OMURGA.md` (v3.1) → gündem teyidi.

**Function sayımı (MK-129.3):** `ls api/*.js | wc -l` → 12 görmeli.

## 132 nerede bıraktı — kısa hatırlatma

- **GLYPH/TANIMA KONUSU KAPALI.** 131'in glyph band-B tezi canlı kodla çürütüldü. Parse
  yolağı sağlam: band-A+B onarıyor, tanıma onarılmış metni skorluyor, dispatch L2'ye giriyor,
  kaymış montaj `montaj{}` üretiyor. Dört PDF'in dördü de L2. Yapacak glyph işi YOK.
- 130'un montaj_json-null symptom'u = parse bug'ı değil; muhtemel bayat veri (122 öncesi L3).
- 132 kod yazmadı; hijyen kararları aldı (aşağıda).

## Yapılacaklar (sıra)

### 0. **Hijyen push (132 kararları) — açılışta hızlıca**

- **izometri-oku.js:887-890** bayat yorum düzeltmesi (comment-only, son-durum 132'de tam metin).
- **KARARLAR.md:** MK-132.1 + MK-132.2 ekle. **131.1-131.4 EKLEME** (yanlış teşhis).
- **PARSER-VE-YUKLEME-AKISI.md:** Bölüm 7.4 ekle (7.3/8 glyph tezini iptal eder; metin
  son-durum/SON-OTURUM 132'de).
- (Opsiyonel) izometri-oku.js:637 yorumunu "band-A+B" yap.
- Doc'lar `[skip ci]`; izometri-oku comment-only → CI tetikler, lint geçer.

### 1. **K2 — malzeme listesi kıyası (baş iş)**

Excel BOM × PDF `malzeme_listesi` diff. En self-contained gerçek iş. Katman 3 ayağı (PARSER
Bölüm 4 + K2 kararı). Plan:
- L2/L3 çıktısındaki `malzeme_listesi` zaten var (132'de E100/M100 imalatta üretildiği
  doğrulandı: boru/fitting/islem satırları, kalite+ağırlık+boy).
- Excel BOM kabuğuyla (ARES_KABUK) pipeline+spool bazında kıyas: PDF'te olan-Excel'de yok,
  Excel'de olan-PDF'te yok, ağırlık/çap sapması.
- Çıktı: çelişki listesi → İnceleme UI'da 🟡 (K1/K3 ile bağ).
- **Function tavanı:** yeni endpoint EKLEME (12/12). Kıyas mevcut akışa/okuma yoluna girsin.

### 2. **K1 + K3 — bindirme_flag UI** (v3 İnceleme 🟡 + düzelt popup). Function tavanı bağımlı.

### 3. **(opsiyonel) Bayat-veri teyidi**

130'un gerçek devresini (NB1137 vb.) söyle; spool'larında montaj_json null mı bak. Null +
eski tarihliyse re-parse (backfill). Kuvvetle muhtemel veri işi, kod değil.

### 4. **Diğer borçlar** (sıra dışı)
- "Montaj Resmi" (`tersan_cadmatic_isometry`, aktif=false) emekli formatın silinmesi/ad düzeltmesi.
- K5 function konsolidasyon, v3 giydirme (büyük), 117 (`yukleyen_id`), web-spool sync,
  fitting (DIN 86087/ASME B16.9), `spool_dokumanlari` bağ tablosu, "fazla" UX.

## KORUMA bantları

- **MK-49.1:** izometri-oku.js'e DOKUNMA. (132 istisna: yalnız comment-only düzeltme.)
- **MK-119.2:** AILE_KAYIT'teki format için parse kuralı kod paketlerinden; DB parser_kural
  parse'ı etkilemez (yalnız tanıma fingerprint'i için).
- **MK-129.3 / KORUMA-4:** `ls api/*.js | wc -l` = 12; yeni endpoint yok.
- **MK-132.1:** Teşhis canlı yolak uçtan uca koşulmadan kapatılmaz.

## Hatırlatmalar

- Env: `SUPABASE_SERVICE_KEY` (MK-101.4) · Storage path `{tenant_id}/...` (MK-99.2)
- Dry-run schema `BEGIN...ROLLBACK` (MK-98.2) · Migration `DROP IF EXISTS` (MK-99.1)
- `sed` özel karakter/uzun dosyada kullanma → `create_file`/`str_replace`
- Tanıma ve parse AYRI katman (MK-132.3 ~ eski 131.3) — ama ikisi de bugün çalışıyor.

---

> **133'ün ilk somut adımı: hijyen push (132 kararları), sonra K2 (malzeme listesi kıyası).**
> Glyph artık karar değil, kapalı defter. K2 gerçek Katman-3 işi.
