# Oturum 135 — v3 İnceleme K2 rozeti (K1+K3 zor yarı) + dirsek kök tespiti

## Açılış ritüeli

Git pull/status/log → CI rengi (134 push: `5e9b0ec` kod CI'den geçti + doc paketi `[skip ci]`) →
şu dosyalar oku: `son-durum.md` (134), `CLAUDE-SON-OTURUM.md` (134), bu dosya →
`docs/PARSER-VE-YUKLEME-AKISI.md` **Bölüm 7.5 + 7.6** (K2 canlı + K1+K3 v1) → KARARLAR **MK-134.1** →
gündem teyidi.

**Function sayımı (MK-129.3):** `ls api/*.js | wc -l` → 12 görmeli. (135'te de yeni endpoint YOK.)

## 134 nerede bıraktı — kısa hatırlatma

- K2 v1 **üretimde doğrulandı**: S02 re-parse, dirsek 🟡 (PDF 212.41 vs Excel 35.01 kg, ~6×) +
  montaj-info (flanş). 3/1/1 fixture birebir.
- K1+K3 v1 **yarısı bitti**: `uyarilar.html` K2 uyarıları canlı (çelişki=uyarı, montaj-info=bilgi).
- **v3 İnceleme rozeti yapılmadı** (bu oturumun baş işi): `devre-inceleme.js` `_eslesme`'yi taşımıyor,
  `izometrileriDerle` kendi eşleştirmesini yapıyor → malzeme_kiyas çıktıda yok.
- MK-134.1 mühürlendi (CI [skip ci] çok-commit tuzağı).
- Vercel CLI link'li + `.env.local` prod env yerelde (gitignore). `scripts/re-parse-s02.mjs` geçici
  (gitignore) — başka spool doğrulamak için tekrar kullanılabilir.

## Yapılacaklar (sıra)

### 0. Doc-push CI teyidi — açılışta

134 kod commit'i (`5e9b0ec`) push'ta CI'den geçti mi (Actions yeşil run var mı) doğrula. Doc paketi
ayrı `[skip ci]` ile gitmiş olmalı. Eğer 134 sonunda push yapılmadıysa: önce `5e9b0ec` push (kod, CI)
→ yeşil → sonra doc'lar (MK-134.1 sıra).

### 1. v3 İnceleme K2 rozeti (BAŞ İŞ) — K1+K3 zor yarı

**Sorun:** `api/devre-inceleme.js` `izometrileriDerle` (satır 55) parse_sonuc'tan kendi eşleştirmesini
yapar; `_eslesme.detay[].malzeme_kiyas`'a hiç bakmaz. v3 İnceleme (satır 746) bu endpoint'in çıktısını
render eder → malzeme_kiyas görünmez.

**İki seçenek (135 başında karar):**
- **A)** `izometrileriDerle` içinde, eşleşen her spool için `_eslesme`'den ilgili `detay[]` kaydını
  bulup `malzeme_flag` + `malzeme_kiyas`'ı çıktıya iliştir. (Endpoint zaten parse_sonuc'u çekiyor;
  `_eslesme` orada — ek sorgu yok. En küçük dokunuş.)
- **B)** `malzemeKiyas` lib'ini endpoint'te yeniden koş (spool_malzemeleri fetch gerekir — endpoint
  şu an çekmiyor). Daha ağır; gereksiz (eslestir zaten hesapladı, A onu okur).
- **Öneri: A.** DRY — eslestir'in ürettiği malzeme_kiyas'ı taşı, yeniden hesaplama.

**UI tarafı (devre_wizard_v3.html):**
- Satır 746 `izoCell(s.izometri, s.bindirme_flag)` → ek `s.malzeme_flag` parametresi / ayrı rozet.
- 🟡 rozet (bindirme rozetiyle yan yana ya da birleşik). Tıkla → düzelt popup'ına malzeme_kiyas dökümü:
  celiski[] (sert sapma, agirlik_kg_toplam) + excel_fazla_montaj[] (montaj-info). Soft sapma gizli (134 karar 1).
- `meta.excel_guven` dili: otorite→"PDF Excel'den sapıyor, PDF kontrol", parite→"ikisi de kontrol".
- Mevcut düzelt popup'ı (duzeltAc, satır ~904) zaten bindirme detayını gösteriyor olabilir — malzeme
  bölümünü oraya ekle (yeni popup değil).

### 2. Dirsek bulgusu kök tespiti

S02 dirsek PDF 212.41 vs Excel 35.01 kg (~6×). Üç hipotez, ayırt edilmedi:
- PDF parser dirsek ağırlığını yanlış çıkarıyor (per-elbow ~35 → toplam 212 mantıklı mı? 6×35=210 ≈ 212
  → PDF "adet × birim" topluyor olabilir; Excel "birim" veriyor olabilir → BASIS farkı!).
- Excel BOM parse basis (35.01 = tek dirsek mi, 6'nın toplamı mı?).
- Gerçek BOM hatası.
- **İlk bakış hipotezi:** 212.41 / 6 ≈ 35.4 ≈ Excel 35.01. Yani **PDF toplam, Excel birim** olabilir →
  MK-133.2 (agirlik_kg satır-toplam semantik) PDF tarafında ihlal? l2-parser dirsek satırını nasıl
  topluyor, kontrol et. Bu doğruysa K2 bug'ı değil parser normalizasyon farkı — düzeltme l2-parser'da.
- 2-3 farklı devre örneğiyle doğrula.

### 3. (opsiyonel) excel_guven otomatik türetme — MK-133.1 backlog

Format paketinden/parser_kural'dan: L1 + IFS format_id → otorite; aksi parite. Küçük helper, K2 lib'i değişmez.

### 4. Diğer borçlar (öncelik dışı)

Pipeline doğrulama (4.4-1), "Montaj Resmi" emekli format, K5 function konsolidasyon, 117 (`yukleyen_id`),
web-spool sync, fitting (DIN 86087/ASME B16.9), `spool_dokumanlari` bağ tablosu, dirsek bin-packing v2 (MK-133.3).

## KORUMA bantları

- **MK-49.1:** izometri-oku.js'e DOKUNMA.
- **MK-129.3 / KORUMA-4:** `ls api/*.js | wc -l` = 12; yeni endpoint yok.
- **MK-132.1:** Teşhis canlı yolak uçtan uca koşulmadan kapatılmaz.
- **MK-133.1/.2/.3:** Excel kaynak güveni / agirlik_kg satır-toplam / dirsek malzeme-korunumu.
- **MK-134.1:** Kod commit'i + `[skip ci]` doc'u aynı push'ta doc-HEAD'de gönderilmez (CI atlanır).

## Hatırlatmalar

- Env: `.env.local` prod (gitignore) · `SUPABASE_SERVICE_KEY` Sensitive (env pull bozuk okur — Supabase
  Dashboard Legacy service_role'den al, tek seferlik env ver).
- re-parse testi: `node scripts/re-parse-s02.mjs https://arespipe.vercel.app` (SK env'iyle).
- `sed` HTML'de kullanma → atomik Python patch / `str_replace`.
- Doc `[skip ci]`; kod CI tetikler — koddan SONRA push (MK-134.1).

---

> **135'in ilk somut adımı: doc-push CI teyidi, sonra v3 İnceleme malzeme_kiyas taşıma (seçenek A) +
> rozet/popup.** Dirsek kök tespiti güçlü ikinci aday (212/6 ≈ Excel → basis hipotezi).
