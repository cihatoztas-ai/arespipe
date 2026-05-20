# CLAUDE-SONRAKI-OTURUM — Oturum 104 gündemi

## Açılış ritüeli (CLAUDE.md = 2 kontrol)
1. `git pull` + `git status` + `git log -1` (temiz mi, son commit ne)
2. Bugünkü hedef onayı

> Not: 103 son commit'leri — `bc097dd` (ares-store sayaç) ve wizard (`27175d4...`).
> CI yeşil mi bak. son-durum.md = oturum 103.

## İLK İŞ — 103-A canlı test (deploy sonrası, kod yazmadan)
103-A kodu yazıldı + kodla test edildi ama CANLI test edilmedi. Önce şunu doğrula
(son-durum.md borç #4):
- Gerçek klasörü (`G200-P2`, 3 Excel + 2 PDF) wizard'dan o test devresine yükle.
  - Adım 2 etiketleri: IFS Malzeme Listesi=bom_excel, Donatım Kontrol Formu + Resim Teslim
    Tutanağı=diger, PDF'ler=izometri (klasör eşleşmesi).
  - Yükleme sonrası ekranda "BOM ayrıştırılıyor -> öneri hazır ✓ (L1, %.., N satır)" görmeli.
  - devre_detay > Dökümanlar: "Önizle/Onayla" butonu elle UPDATE OLMADAN çıkmalı.
- Test öncesi temizlik (dup önle): o devredeki S01/G200-303S-BS18-P2 spool'unu + spool_malzemeleri'ni
  sil; eski yanlış "Donatım Kontrol Formu" bom_excel kuyruk satırını sil. Dosyalar zaten yüklüyse
  Storage upsert:false "already exists" verir -> yeni devreye yükle ya da eski kayıtları temizle (MK-99.5).
- 3 noktadan biri patlarsa düzelt; hepsi yeşilse B'ye geç.

## HEDEF — B: İzometri PDF yönlendirme (MK-49.B) [YENİ SOHBET — büyük iş]
**Neden:** Wizard'da PDF'ler hâlâ `sakla` ile giriyor (parse yok). İzometriler tamamen pasif
yükleniyor. Ortak PDF upload komponenti hem wizard hem devre_detay İzometri sekmesini besleyecek.
Bugünkü "çıplak pdf -> 3d_pdf" tespit quirk'i de burada düzelir.

**Başlamadan istenecek dosyalar (Cihat paylaşacak):**
- `api/batch-baslat.js`, `api/batch-kuyruga-al.js` (PDF backend ne bekliyor — kuyruk formatı, batch id).
- `devre_detay.html` İzometri sekmesi (mevcut PDF upload kodu varsa — ortak komponent oraya da takılacak).
- `devre_wizard.html` (mevcut — A'dan).
- `api/izometri-oku.js` (worker — PDF parse tetiği nasıl).

**İki alt-iş (tahmini):**
1. Wizard: izometri PDF'leri `izometri-oku`/`batch-baslat` akışına yönlendir (şu an sakla). Çıplak
   pdf tespit quirk'ini düzelt (klasör yoksa izometri varsayımı? — Cihat ile karara bağla).
2. Paylaşılan PDF upload komponenti: wizard Step 2 (atla butonlu) + devre_detay İzometri sekmesi,
   aynı backend (`batch-baslat` + `batch-kuyruga-al`).

## Sonraki adımlar (B sonrası)
- **C** — Wizard sıfırdan yeni devre+iş emri oluşturma.
- **D** — Faz 2 arka plan zenginleştirme.
- **i18n** — Wizard (A+B+C) bitince TEK SEFERDE topla: dv_onay_*, dv_tab_docs, dw_p3_note,
  103 parse-sonuç + dedup metinleri. TR/EN/AR. Lang dosyasını Cihat paylaşacak. (Cihat: "wizard bitince" dedi.)

## Açık borçlar (detay son-durum.md) — fırsat çıkarsa
- spooller çift-kolon drift sadeleştirme (#2).
- devre_dokumanlari.parse_durumu constraint genişletme (#3, opsiyonel).
- Sayaç config cache + tenant değişimi (#6, düşük öncelik — sayacConfigSifirla on tenant switch).

## Önemli hatırlatmalar
- **Sayaç tenant-scope CANLI (103).** E pilotunda artık gerçek spool üretilebilir (numara karışmaz).
  A serisi 594'ten devam (ilk üretim A-000595 olmalı).
- RPC imza değişiklikleri kod+migration eşzamanlı deploy ister.
- Çalışma disiplini: >45KB dosya -> MD5'li arespipe_kopyala; str_replace -> inline JS node --check ->
  outputs -> md5 -> present_files. Şema-dokunur -> MK-98.2 dry-run + pg_get_constraintdef.
  SQL Editor Unicode bozar -> düz ASCII.
