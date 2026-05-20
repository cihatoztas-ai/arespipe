# CLAUDE-SONRAKI-OTURUM — Oturum 103 gündemi

## Açılış ritüeli (CLAUDE.md = 2 kontrol)
1. `git pull` + `git status` + `git log -1` (temiz mi, son commit ne)
2. Bugünkü hedef onayı (aşağıdaki A)

> Not: Oturum 102'nin son teslimi `devre_detay.html` (sekme refaktörü, MD5 `e8cb4fab137d4e9f9b2dfdfc738b090a`) + bu 3 kapanış dosyası **commit edilmiş** olmalı. CI yeşil mi bak.

## HEDEF — A: Wizard Excel oto-yönlendirme + etiketleme (öncelik 1)

**Neden:** 102'de onay modalı tam çalışıyor AMA wizard'dan yüklenen dosyalar kuyruğa `parser='sakla'` ile giriyor → parse otomatik çalışmıyor (102'de elle `UPDATE` ile test ettik). Bu olmadan upload→`oneri_hazir`→modal zinciri kendiliğinden tamamlanmıyor. Ayrıca BOM oto-tespiti yanlış Excel'i seçiyor.

**İki alt-iş:**
1. Wizard yükleme/kuyruk-ekleme: `bom_excel` dosyalarını `parser='excel-generic'` ile kuyruğa sok + parse worker'ını tetikle (şu an `sakla`).
2. BOM tespiti düzelt: "IFS Malzeme Listesi" gibi gerçek BOM'u `bom_excel` etiketle, "Donatım Kontrol Formu"/"Resim Teslim Tutanağı" gibileri `diger`. (102'de tersi olmuştu.)

**Başlamadan istenecek dosyalar (Cihat paylaşacak):**
- `devre_wizard.html` — dosyayı kuyruğa `sakla` ile sokan kısım + dokuman_tipi/etiket atayan kısım.
- `api/kuyruk-isle-excel.js` (dosya adını doğrula) — Excel worker; tetikleme mekanizması.
- Gerekirse: kuyruk worker'ı çağıran genel mekanizma (cron/manuel/upload-sonrası).

## Sonraki adımlar (A bittikten sonra)
- **B** — İzometri PDF yönlendirme + paylaşılan PDF upload komponenti (MK-49.B). 102'de eklenen Dökümanlar sekmesi zemin oldu.
- **C** — Wizard sıfırdan yeni devre+iş emri oluşturma.
- **D** — Faz 2 arka plan zenginleştirme.
- **i18n** — `son-durum.md` borç #6'daki anahtarları (dv_onay_*, dv_tab_docs) TR/EN/AR'ye topla. Hangi lang dosyası kullanılıyorsa Cihat paylaşsın.

## Açık borçlar (detay son-durum.md'de) — fırsat çıkarsa
- **Sayaç tenant-scope değil** — E pilotu gerçek spool üretmeden önce ŞART. Şema+RPC+seed, MK-98.2 dry-run.
- spooller çift-kolon drift sadeleştirme.
- `devre_dokumanlari.parse_durumu` constraint genişletme (opsiyonel).

## Test ipucu (modal yeniden test gerekirse)
- Devre `a9ecf0b7-47ba-4912-8308-b0dc4b0d81b9` (303S-Sludge System-G200-P2), kuyruk `eb23f38a-...`, doküman `187f9264-...`.
- Konsol: `localStorage.setItem('ares_aktif_devre_id','a9ecf0b7-47ba-4912-8308-b0dc4b0d81b9'); location.reload();`
- Buton çıkmazsa kuyruk durumunu kontrol et: `oneri_hazir` olmalı (`tamamlandi`'da gizli — doğru). Elle: `UPDATE dosya_isleme_kuyrugu SET durum='oneri_hazir' WHERE id='eb23f38a-...';`
- Aktar öncesi temizlik (dup önle): o devredeki S01/G200-303S-BS18-P2 spool'unu ve spool_malzemeleri'ni sil.

## Çalışma disiplini (hatırlatma)
- Tek dosya >45KB → her teslimde MD5'li `arespipe_kopyala`; mismatch=truncate, base64 fallback.
- devre_detay.html'de düzenleme: str_replace → inline JS `node --check` → outputs → md5 → present_files.
- Şema-dokunur işlerde MK-98.2 (BEGIN...ROLLBACK dry-run) + `pg_get_constraintdef`.
- SQL Editor Unicode bozar → düz ASCII yapıştır.
