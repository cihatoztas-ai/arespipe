# CLAUDE-SONRAKI-OTURUM — Oturum 105 gündemi

## Açılış ritüeli (CLAUDE.md = 2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3`
2. Bugünkü hedef onayı.
> Son commit 104'te `48026e0` (normal Excel). CI yeşil mi bak. son-durum.md = oturum 104.

## NET SIRALAMA (104'te kararlaştırıldı — değer vs efor dengesi)
- **105 (bu oturum):** Hızlı tasarruf + Montaj teyidi (küçük, anlık para).
- **106+:** B-geometri (Tersan metin-PDF deterministik parser → $0 + 3D verisi). EN YÜKSEK GETİRİ.
- **Sonra:** B-öğrenme (düzeltme → parser_kural geri-yazma, MK-48.5) + cache düzeltme taşıma.
- **En son:** Wizard'ı bu hazır backend'e bağla (MK-49.B).

## 105 — HEDEF: Hızlı tasarruf + temizlik (küçük, AI maliyeti $0)

### İş 1 — PAOR isometric_view L3'e gitmesin
PAOR iki dosya geliyor: `...-A.pdf` (ana çizim, metin DOLU) + `...-Isometric_View.pdf` (metin BOŞ, image).
İkincisi tablo içermiyor ama L3'e gidip para yakıyor olabilir.
- **Önce ÖLÇ:** isometric_view dosyaları gerçekten L3'e gidiyor mu? `ai_api_log`'da dosya/format bak.
- **Çözüm yönü:** format dispatcher / dosya tipi katmanında "isometric_view" / metni-boş PDF'i parse dışı
  bırak ya da "3d_pdf"e ayır (parse etme, sadece sakla). izometri-oku.js'e DOKUNMADAN (MK-49.1) — tercihen
  wizard/dispatch tarafında ya da kuyruk-isle filtresinde. **Cihat ile karara bağla:** isometric_view ne olsun
  (hiç yükleme / sakla / 3D için ayrı tut).

### İş 2 — Tersan M110 Montaj yanlış-tanıma teyidi (51-52'den taşınan şüphe)
"Tersan M110 Montaj Resmi" formatı geçmişte "gerçek PDF görülmedi, yanlış tanıma" diye işaretlenmişti;
104 ölçümünde 7 L3 · $0.21 görünüyor.
- **Teyit:** o 7 çağrı gerçek montaj PDF'i mi yoksa başka formatın yanlış ataması mı?
  `ai_api_log` + `izometri_format_tanimlari` (fingerprint) bak. Cihat 1 örnek montaj PDF'i versin.
- Yanlışsa: fingerprint düzelt ya da formatı pasifle → boşa para kesilir.

## 106+ — B-geometri (büyük, kendi MK belgesiyle)
Tersan metin-PDF'inde geometri METİNDE (104'te doğrulandı: 45°, R=130, segment boyları, Rotation Angle,
Cut & Bending Info). Hedef: deterministik parser hem spool tablosunu hem `yon_dizilim` JSON'unu çeksin →
o format $0 + MK-49.A 3D render verisi. Başlamadan istenecek: bir Tersan metin-PDF örneği daha (varyasyon),
`lib/l2-parser.js`, ilgili `parser_kural` satırı (`izometri_format_tanimlari`).
Ölçülebilir hedef: Tersan İmalat'ta L3 oranını %65 → %20 altına indir.

## Açık borçlar (detay son-durum.md)
- Normal Excel "Standart" sütunu boş (Açıklama'dan regex ile ayıklanabilir) — küçük.
- Alan-bazlı AI güven (prompt, MK-49.1) — ertelendi.
- batch↔incele cache: onay sonrası batch sayfası `_tumSpooller` tazelenmiyor — küçük.
- `excelIndir`/`manuelOnayAc` ölü kod (zararsız).
- i18n: 104'te eklenen anahtarlar fallback'le TR çalışıyor (`izb_btn_incele_tum`, `izbi_legend_*`,
  `izbi_excel_normal`, `izbi_sheet_*`, `izbi_excel_indi`, `izbi_eksik`, `izbi_ai_guven`) — wizard/batch
  bitince tek seferde TR/EN/AR toplanacak.

## Önemli hatırlatmalar
- **İzometri batch = SADECE Excel** (MK-104.1). Devreye bağlama yok.
- **PAOR image-PDF kalıcı AI gideri** (MK-104.5) — B-öğrenme onu çözmez, sadece azaltılır.
- izometri-oku.js'e DOKUNMA (MK-49.1). Maliyet/öğrenme işleri dispatch/worker/parser_kural tarafında.
- Çalışma disiplini: >45KB → MD5'li transfer; str_replace → node --check → grep dangling → outputs → md5
  → present_files. Şema-dokunur → MK-98.2 dry-run + pg_get_constraintdef. SQL Editor düz ASCII.
- Sadece terminal git akışı (web UI upload yok).
