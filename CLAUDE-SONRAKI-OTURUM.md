# Oturum 136 — K2 kapsamlı görsel + çoklu-gemi testi (+ wizard taslak-açma)

## Açılış ritüeli

Git pull/status/log → CI rengi (135 push: kapanış HEAD = `style(135)` kod commit'i, CI koşmuş olmalı;
doc paketi `[skip ci]`) → şu dosyalar oku: `son-durum.md` (135), `CLAUDE-SON-OTURUM.md` (135), bu dosya
→ `docs/PARSER-VE-YUKLEME-AKISI.md` **Bölüm 7.5–7.7** → KARARLAR **MK-135.1 / MK-135.2** → gündem teyidi.

**Function sayımı (MK-129.3):** `ls api/*.js | wc -l` → 12 görmeli. (136'da da yeni endpoint YOK.)

## 135 nerede bıraktı — kısa hatırlatma

- **v3 İnceleme K2 rozeti BİTTİ** (A2, MK-135.1): server enjeksiyonu canlı kanıtlı (lambda + SQL + smoke).
  AMA **rozet/popup gerçek tabloda gözle GÖRÜLMEDİ** — wizard `?devre_id=` ile taslak açamıyor (borç #2).
- **Dirsek kökü çözüldü** (MK-135.2): Excel BOM hatalı, PDF doğru. K2 bug değil. Parser'a dokunma.
- Kozmetik: izo-eslesme self-test yorumu düzeltildi.
- Commit'ler: `e6db101` (K2 rozeti kod) + kapanış paketi.

## Yapılacaklar (sıra)

### 1. v3 wizard taslak-açma (`?devre_id=`) — görsel testin ÖN KOŞULU

**Sorun:** `devre_wizard_v3.html` URL'deki `devre_id`'yi okumuyor (`WIZ.devre_id` null kalıyor); var olan
`oneri_hazir` taslağı yeniden açıp İnceleme'ye getiremiyoruz → rozet ekranda görülemiyor.
**Yapılacak:** Açılışta `new URLSearchParams(location.search).get('devre_id')` varsa: devreyi+kabuğu
(BOM) yükle, Adım 2'ye (İnceleme) geç, `inceleGetir()` çağır. Mevcut sıfırdan-oluştur akışını bozmadan
(param yoksa eski davranış). ~20 dk, orta risk (WIZ durum akışı). Atomik patch + node --check.

**Bittiğinde GÖRSEL TEYİT (MK-132.1 görsel ayağı):**
`arespipe.vercel.app/devre_wizard_v3.html?devre_id=b310cfc5-2a09-41be-8d3a-78c1af43b591` → S02 satırında
🟡 malzeme rozeti + Düzelt popup'ta "🔧 Dirsek çelişkisi PDF 212.41 ↔ Excel 35.01" + "🔩 Flanş DN300 ×6".

### 2. Çoklu-gemi / çoklu-format K2 testi

Farklı gemi projelerinden gerçek örneklerle K2 rozeti + popup'ı pekiştir:
- Dirsek-tipi Excel ağırlık tutarsızlığı (MK-135.2) **başka gemilerde de var mı** → desen mi, tek vaka mı.
- Desen ise: IFS BOM `agirlik_kg` bazı satırlarda adet×birim çarpmıyor olabilir → K2 toleransı yerine
  **IFS-normalizasyon kuralı** (adet>1 & per-adet fiziksel-imkansız → satır-toplam varsay) düşünülür.
- Boru/bilezik/montaj kapsam ayrımının farklı formatlarda doğru çalıştığını gör (PARÇA_SOZLUK kapsama).
- Excel'i manuel (parite) olan bir devre varsa: `excel_guven` dili farkını gözle.

### 3. (opsiyonel) excel_guven otomatik türetme — MK-133.1 backlog

Format paketinden/parser_kural'dan: L1+IFS → otorite; aksi parite. MK-135.2 ışığında: fitting ağırlık
tutarsızlığında otorite olsa bile dil yumuşatılabilir (simetrik). Küçük helper, K2 lib değişmez.

### 4. Diğer borçlar (öncelik dışı)

Pipeline doğrulama (4.4-1), "Montaj Resmi" emekli format, K5 function konsolidasyon, 117 (`yukleyen_id`),
web-spool sync, fitting (DIN 86087/ASME B16.9), `spool_dokumanlari` bağ tablosu, dirsek bin-packing v2 (MK-133.3).

## KORUMA bantları

- **MK-49.1:** izometri-oku.js'e DOKUNMA.
- **MK-129.3:** `ls api/*.js | wc -l` = 12; yeni endpoint yok.
- **MK-132.1:** Teşhis canlı yolak uçtan uca koşulmadan kapatılmaz (135 görsel ayağı 136'ya kaldı).
- **MK-133.1/.2/.3:** Excel kaynak güveni / agirlik_kg satır-toplam / dirsek malzeme-korunumu.
- **MK-134.1:** Kod commit'i + `[skip ci]` doc'u aynı push'ta doc-HEAD'de gönderilmez (CI atlanır).
- **MK-135.1:** v3 K2 enjeksiyonu handler'da (A2); lib saf.
- **MK-135.2:** Dirsek sapması = Excel BOM hatası, parser doğru. Dokunma; desen 136'da araştırılır.

## Hatırlatmalar

- Env: `.env.local` prod (gitignore) · `SUPABASE_SERVICE_KEY` Sensitive (Supabase Dashboard Legacy
  service_role'den tek seferlik al). re-parse: `node scripts/re-parse-s02.mjs <url>` (geçici, gitignore).
- `sed` HTML/JS'de kullanma → atomik Python patch / `str_replace` (MK-129.3 ruhu).
- Doc `[skip ci]`; kod CI tetikler — tek push/çok commit ise HEAD = kod (MK-134.1).
- v3 test devresi: `g200` / `b310cfc5-2a09-41be-8d3a-78c1af43b591` (S02 dirsek çelişkili, K2 verisi hazır).

---

> **136'nın ilk somut adımı: wizard taslak-açma (#1) → görsel teyit → çoklu-gemi testi (#2).**
> K2'nin server tarafı bitti; kalan iş onu gözle görmek ve farklı gemilerle pekiştirmek.
