# Oturum 131 — Montaj yol kararı (K4) + v3 giydirmesinde K1/K3

## Açılış ritüeli

Git pull/status/log → CI rengi (130 sadece doc push'u, `[skip ci]` → yeşil olmalı, kod yok) →
şu dosyalar oku: `son-durum.md`, `CLAUDE-SON-OTURUM.md`, bu dosya → `docs/PARSER-VE-YUKLEME-AKISI.md`
(özellikle **Bölüm 7 teşhis + Bölüm 8 kararlar**) → `docs/DEVRE-WIZARD-OMURGA.md` (v3.1) →
gündem teyidi.

**Function sayımı zorunlu (MK-129.3):** `ls api/*.js | wc -l` → 12 görmeli.

## 130 nerede bıraktı — kısa hatırlatma

- `docs/PARSER-VE-YUKLEME-AKISI.md` yazıldı (5 katman, kod yok). Tetikçi + montaj **tam teşhis**.
- İki problem de mekanik bug değil mimari karar. **K1-K5 alındı** (Bölüm 8).
- Kod bilinçli 131'e bırakıldı (gereksiz risk + bağlam).

## Yapılacaklar (sıra)

### 1. **K4 — Montaj yol kararı + kod (baş iş)**

**Teşhis (130, kesin):** Montaj tespiti yalnız L2'de var (`lib/l2-parser.js` montaj_modu); L3'te
montaj kavramı yok → format tanınmayan devrelerde montaj asla `montaj_json`'a yazılmıyor → spool
detayda görünmüyor. `montajEslestir` + `spool_detay.html` okuma yolu **doğru çalışıyor** (sorun
tespitte, eşleştirme/UI'da değil).

**Karar (ilk iş):**
- **Yol 2 (önerilen, kalıcı):** AT110/Demo Atölye formatı için `parser_kural` + `montaj_modu`
  öğret → L2 yoluna gir → montaj otomatik çıkar, $0, içerik okur. Format motoru zaten var.
- **Yol 1 (evrensel emniyet ağı):** L3 prompt'a montaj/genel tespiti branch'i. **`izometri-oku.js`'e
  dokunur (MK-49.1!)** + L3 maliyeti + MK-125.2 gerilimi. Çakışma kapısından (MK-127.1) geçir.
- **Yol 3 elendi:** Cihat "içi okunarak" dedi.

**Önce:** Bu test devresinin (`7702313c` / AT110) S-segmentsiz PDF'lerinin **gerçekte ne olduğunu**
doğrula — montaj çizimi mi yoksa pipeline genel/kapak sayfası mı? (Dosya adları `1(2)`/`2(2)` =
"sayfa 1/2" gibi.) Montaj değilse K4'ün bu devredeki semptomu farklı kategoriye gidebilir.

### 2. **K1 + K3 — bindirme_flag UI (v3 İnceleme)**

`_eslesme.detay[].bindirme_flag` zaten DB'de (`flag_sayisi` doğru). Eksik: v3 İnceleme ekranında
🟡 "doğrulanmadı" + düzelt popup (mockup v5'te tasarlı — `mbadge`/`islemCell`). cizim_durumu
enum'a DOKUNMA (K1). Bu, v3 İnceleme & Onay giydirmesinin parçası.

### 3. **K2 — malzeme listesi kıyası** (İnceleme UI sonrası)

Excel BOM × PDF `malzeme_listesi` diff. L3 `malzeme_listesi` zaten üretiliyor, hiç kullanılmıyor.
Excel'de liste varsa kıyas + fark göster; yoksa PDF'ten oluştur (K2). Füzyon gerilimi (WN/SO flanş)
→ "sıkı diff değil, fark varsa operatöre göster".

### 4. **K5 — function konsolidasyon planı**

Katman 3 server-side okuma endpoint'i (MK-127.3) = 13. function → tavan aşımı. Önce konsolidasyon
planı: `kuyruk-isle-*` dosyalarını tek router'a indir. Pilot tetiğinde Pro (~$45/ay), şimdi değil.

### 5. **MK-61.4 borcu**

`BRIEFING.md` bilgi haritasına `PARSER-VE-YUKLEME-AKISI.md` satırı eklenmeli (130'da yazıldı, harita
satırı eklenmedi). Ayrıca repo'daki **güncel `KARARLAR.md`'yi doğrula** — 130'da yüklenen bayattı
(MK-74.3). 130 K1-K5 kararları + montaj/L3 boşluğu MK olarak işlenmeli.

### 6. **Diğer borçlar** (sıra dışı)

- "fazla" UX: S-segmentsiz montaj/genel PDF kategorisi (Problem 2 ile birleşik)
- 117 (`yukleyen_id`), web-spool sync (`aktif_basamak`/`ilerleme`)
- Fitting (DIN 86087, ASME B16.9), `spool_dokumanlari` bağ tablosu

## KORUMA bantları

- **KORUMA-1:** Kanonik modüller (`ARES_KABUK`, `ARES_NORM`, `izometri-oku`, eşleştirme primitifleri)
  çağrılır, kopyalanmaz.
- **KORUMA-3:** v3 izolasyonu (MK-127.2) — v2'ye dokunma.
- **KORUMA-4:** `ls api/*.js | wc -l` zorunlu; 12'ye yaklaşma (MK-129.3).
- **MK-49.1:** `izometri-oku.js`'e dokunma — Yol 1 seçilirse çakışma kapısından (MK-127.1) geçir.

## Hatırlatmalar

- Env: `SUPABASE_SERVICE_KEY` (MK-101.4) · Storage path `{tenant_id}/...` (MK-99.2)
- Dry-run schema `BEGIN...ROLLBACK` (MK-98.2) · Migration `DROP IF EXISTS` (MK-99.1)
- Yeni durum değeri eklemeden `pg_get_constraintdef` kontrol (MK-101.5)
- `sed` özel karakter/uzun dosyada kullanma → `create_file`/`str_replace` (129 dersi)

---

> **131'in ilk somut adımı: K4 montaj yol kararı (2 vs 1).** Önce S-segmentsiz PDF'lerin gerçekte
> ne olduğunu doğrula, sonra yolu seç. Kod yazmadan önce omurga + Bölüm 8 + çakışma kapısı (MK-127.1).
