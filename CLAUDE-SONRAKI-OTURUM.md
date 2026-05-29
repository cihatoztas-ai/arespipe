# Oturum 134 — Toplu push (133 paketi) + canlı re-parse doğrulama + K1+K3 UI başlangıcı

## Açılış ritüeli

Git pull/status/log → CI rengi (133 push: lib/malzeme-kiyas + kuyruk-isle-izometri 5-patch + KARARLAR
+ PARSER + 3 doc) → şu dosyalar oku: `son-durum.md` (133), `CLAUDE-SON-OTURUM.md` (133), bu dosya →
`docs/PARSER-VE-YUKLEME-AKISI.md` **Bölüm 7.5** (K2 v1 canlı) + Bölüm 4.4 notu → gündem teyidi.

**Function sayımı (MK-129.3):** `ls api/*.js | wc -l` → 12 görmeli (sabit; K2 lib altı `lib/`).

## 133 nerede bıraktı — kısa hatırlatma

- K2 v1 canlı: `lib/malzeme-kiyas.js` saf fonksiyon + `kuyruk-isle-izometri.js` eslestir wiring
  (5 noktasal patch, +27 satır).
- Üç MK mühürlendi: **MK-133.1** (Excel kaynak güveni), **MK-133.2** (`agirlik_kg` satır-toplam),
  **MK-133.3** (dirsek malzeme-korunumu invariantı).
- Çıktı `parse_sonuc._eslesme.detay[].malzeme_kiyas` + `malzeme_flag`; ozet'te `malzeme_flag_sayisi`.
- S02 fixture'da v3 testi: 3 eşleşen, 1 çelişki (dirsek 🟡 toplam kg 212 vs 35), 1 montaj-info (flanş).

## Yapılacaklar (sıra)

### 0. **Toplu push (133 paketi) — açılışta**

Push paketi (sıra olarak):
1. `lib/malzeme-kiyas.js` (YENİ, 225 satır)
2. `api/kuyruk-isle-izometri.js` (5 noktasal patch, +27 satır)
3. `KARARLAR.md` (MK-133.1 + .2 + .3 append; içerik `KARARLAR-ekleme-133.md`'de copy-paste hazır)
4. `docs/PARSER-VE-YUKLEME-AKISI.md` (Bölüm 4.4 notu + 7.5 yeni + 8 K2 satırı + 9 MK ekleri)
5. `.github/son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` (133 üçlü kapanış)

Doc'lar `[skip ci]`; kod (`lib/` + `api/kuyruk-isle-izometri`) CI tetikler, lint/syntax geçmesi
beklenir.

### 1. **Canlı re-parse doğrulama (baş iş)**

S02 dirsek bulgusu fixture'da gözlendi, ama gerçek devre verisinde teyidi şart (132 bayat-veri
pattern'i: 122 öncesi parse'lar yanıltabilir). Plan:

- `f713eee4-1442-4d65-9b36-515617695d88` kuyruk kaydını manuel yeniden parse ettir
  (`api/kuyruk-isle-izometri` çağrısı, devre `b310cfc5...`, kuyrukId yukarıdaki).
- Beklenti:
  - `_eslesme.detay[0].malzeme_kiyas.eslesen_sayisi = 3`
  - `_eslesme.detay[0].malzeme_kiyas.celiski_sayisi = 1` (dirsek)
  - `_eslesme.detay[0].malzeme_kiyas.excel_fazla_montaj_sayisi = 1` (flanş)
  - `_eslesme.detay[0].malzeme_flag = true`
  - `_eslesme.malzeme_flag_sayisi >= 1`
- Sorgu:
  ```sql
  -- Supabase SQL Editor ->
  select jsonb_pretty(k.parse_sonuc -> '_eslesme' -> 'detay' -> 0 -> 'malzeme_kiyas') as mk
  from dosya_isleme_kuyrugu k
  where k.id = 'f713eee4-1442-4d65-9b36-515617695d88';
  ```
- Çıktı beklendiği gibiyse: ✅ K2 üretim ortamında çalışıyor, dirsek bulgusu reel.
- Çıktı boşsa/eşleşmiyorsa: eslestir akışında bir kesinti var, debug (en muhtemel: yeniden parse
  tetiklenmedi ya da spool_malzemeleri batch fetch'i devreyi bulamadı).

### 2. **K1+K3 UI 🟡 — İnceleme ekranı (PARSER Bölüm 4.4-3)**

`bindirme_flag` ve **yeni `malzeme_flag`** İnceleme ekranında 🟡 rozeti + düzelt popup. Mockup v5
vardı, server-side okuma endpoint'i mevcut (`/api/devre-inceleme` ailesi); yeni endpoint **yok**
(MK-129.3, 12/12). Plan:

- İnceleme ekranı server-side okuma'da `_eslesme.detay[].bindirme_flag || .malzeme_flag` → 🟡 rozet.
- Düzelt popup: `_eslesme.detay[i].malzeme_kiyas` görsel dökümü (eslesen/celiski/pdf_fazla/
  excel_fazla_fab/excel_fazla_montaj/islemler).
- Excel kaynak güveni: `meta.excel_guven` tag'ine göre dil:
  - `otorite` → "PDF Excel'den sapıyor. PDF'i kontrol edin."
  - `parite` → "PDF ve Excel arasında fark var. İkisini de kontrol edin."
- 134'ün baş işi adayı (1. madde tamamlandıktan sonra).

### 3. **(opsiyonel) `excel_guven` otomatik türetme — MK-133.1 backlog**

Şimdilik `eslestir` çağrısında sabit `excel_guven: 'otorite'`. Format paketinden / `parser_kural`'dan
türetimi: Excel parse'ından gelen `format_id` / parser confidence skoru üstünden basit kural
(L1 + format_id IFS pattern → otorite; aksi parite). Küçük bir helper fonksiyonu, K2 lib'i değiştirmez.

### 4. **Diğer borçlar (öncelik dışı)**

- Pipeline doğrulama (PARSER Bölüm 4.4-1): POAR header pipeline × `dosyaAdiParse` deterministik
  kıyas (text-PDF/L2 için server-side ekleme).
- Dirsek bulgusunun kök tespiti (PDF parser bug vs Excel parse basis vs gerçek BOM hatası) —
  2-3 farklı devre üstünde örnek.
- "Montaj Resmi" emekli formatın silinmesi/yeniden adlandırılması (52'den).
- K5 function konsolidasyon, v3 giydirme (büyük), 117 (`yukleyen_id`), web-spool sync, fitting
  (DIN 86087/ASME B16.9), `spool_dokumanlari` bağ tablosu, "fazla" UX.
- Dirsek tam kesim-optimizasyon (bin-packing) v2 — PDF açı verisi akmaya başlayınca (MK-133.3).

## KORUMA bantları

- **MK-49.1:** izometri-oku.js'e DOKUNMA.
- **MK-119.2:** AILE_KAYIT'teki format için parse kuralı kod paketlerinden; DB parser_kural parse'ı
  etkilemez.
- **MK-129.3 / KORUMA-4:** `ls api/*.js | wc -l` = 12; yeni endpoint yok.
- **MK-132.1:** Teşhis canlı yolak uçtan uca koşulmadan kapatılmaz. (Re-parse doğrulaması bunun
  uygulaması.)
- **MK-133.1:** `excel_guven='otorite'` v1 sabit; otomatik türetme backlog. Lib davranışı tek;
  yorum farkı UI'da.
- **MK-133.2:** `spool_malzemeleri.agirlik_kg` satır-toplam. Per-adet `agirlik/adet`.
- **MK-133.3:** Dirsek adet kıyası kapalı; toplam ağırlık invariantı (±%15). Açı parser borcu var.

## Hatırlatmalar

- Env: `SUPABASE_SERVICE_KEY` (MK-101.4) · Storage path `{tenant_id}/...` (MK-99.2)
- Dry-run schema `BEGIN...ROLLBACK` (MK-98.2) · Migration `DROP IF EXISTS` (MK-99.1)
- `sed` özel karakter/uzun dosyada kullanma → `create_file`/`str_replace`
- Doc dosyaları `[skip ci]`; kod dosyaları CI tetikler.

---

> **134'ün ilk somut adımı: toplu push, sonra canlı re-parse doğrulama (S02), sonra K1+K3 UI 🟡.**
> K2 lib + wiring yerinde, dokümanlar zenginleşti. Sıra üretim ortamında çalıştığını görmek,
> sonra operatöre bulguları göstermek.
