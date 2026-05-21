# CLAUDE-SONRAKI-OTURUM — Oturum 108 gündemi

## Açılış ritüeli (CLAUDE.md = 2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -6`
2. Bugünkü hedef onayı.
> 107 son kod commit'i: 280ec54 (MK-49.B). CI yeşil mi teyit et.
> Oku: docs/MK-WIZARD-DEVRE-YUKLEME.md (wizard omurga) + 107 son-durum.md (MK-107.1-7 kararları).

## 108 ANA HEDEF — Kabuk-first akış icraatı (MK-107.1)
Cihat: "108'de icraata geçelim artık." Tasarım 107'de bitti, kod zamanı.

**Hedef akış:** Excel→kabuk tablosu→onay→spooller INSERT ("çizim bekliyor")→sen sonraki
devreye geç→PDF'ler ARKADA işlenir→dön, kontrol et, düzelt, kaydet.

**107'de KANITLANDI:** IFS Excel parse_sonuc'unda pipeline_no+spool_no var; SQL group-by ile
25 benzersiz spool temiz çıkıyor. Yani kabuk türetimi hazır, sadece UI + insert + async kaldı.

### Önerilen sıra (parçalara böl, her biri bağımsız teslimat):
1. **Kabuk Önizleme (sadece gösterim, insert YOK):** Excel parse_sonuc → benzersiz
   (pipeline_no, spool_no) grupla → ekteki 30-spool tablosu görünümü (marka, spool_id, çap,
   ağırlık, malzeme, kalite, yüzey, alıştırma[boş]). Yüzey: Excel `system` token'ından ("Galv")
   veya izometri yuzey'inden ön-doldur (MK — sorma). Önce gözle doğrula, insert sonra.
2. **Kabuk Onayı → spooller INSERT:** "Kilitle/Onayla" → spool'lar `spooller`'a "çizim bekliyor"
   damgalı yazılır (MK-107.1, MK-WIZARD.2/MK-WIZARD.3 kabuk kilidi). Spool ID üretimi: mevcut
   tenant-prefix konvansiyonu (A-0580). Kompozit marka: proje-pipeline-spool-rev.
3. **Async PDF drenajı:** wizard senkron `await` beklemeyi BIRAK; "bekleyenleri işle" endpoint'i
   veya cron kuyruğu boşaltsın (worker zaten body'siz "sıradakini al" destekliyor). Kullanıcı
   bilgisayarı kapatsa da arka planda işlensin.
4. **PDF→kabuk eşleştirme:** izometri parse_sonuc → kabuktaki spool'a bağla (resim_no + spool_no,
   MK-WIZARD.5). Eksik bilgileri (alıştırma, yön, ek malzeme) doldur.

> NOT: 1'i bu oturum tamamlamak iyi keystone. 2-4 sığarsa devam, sığmazsa böl.

## 108 — destekleyen kararlar (icraatta uygulanacak)
- **Yüzey otomatik doldurma (hızlı kazanım):** aktarım/onay modalı `yuzey`'i ön-doldursun, sorma.
- **Düzeltme sözlüğü iskeleti (MK-107.3):** düzeltme→(a) anında kayıt (b) kural `(desen,sonuç,kapsam)`.
  Politika: akıllı varsayılan, sessiz, nadir tek-tık. "St*" ve "Field Butt welding" ilk müşteriler.
  ("Field Butt welding" = işlem değil malzeme → BOM'dan ayrıl, kaynak sayısına git.)
- **Her alan düzenlenebilir (MK-107.4):** güven kilit değil; yüksek güven düzeltmesi = kör nokta.

## 108 sonrası / açık borçlar
- **3 katman evrenselleştirme (MK-107.5)** + **süper admin Öğrenme Yönetimi ekranı (MK-107.7)**:
  tenant-özel→aday havuzu→admin onayı; kural anonim, veri taşınmaz.
- **3D hattı (MK-49.A + MK-107.6):** STEP/Rhino temel → izometri yön (yon_dizilim yeni parse
  boyutu — bugün YOK) → saha foto. STEP truth → izometri validate + boşluk doldur.
- **Yetim batch reconcile** (izometri_batch_kayitlari, izometri-oku yan etkisi).
- **Boru OD→DN türetme** (boru_olculer, MK-49.1 sınırı).

## Önemli hatırlatmalar
- **izometri-oku.js'e DOKUNMA** (MK-49.1) — HTTP ile çağır.
- **Otorite kabuktur, PDF değil** (MK-WIZARD) — sessiz eksik/fazla üretme.
- **Veri bir depoya yazılmıyorsa kayıptır** (MK-107.2) — öğrenmenin tek şartı.
- **Sistemin EMİN olduğu hata en tehlikelisi** (MK-107.4) — her alan düzenlenebilir.
- **Evrenselleşen kuraldır, veri değil** (MK-107.5) — admin onay kapısı hep insan.
- Disiplin: >45KB MD5'li transfer; arespipe_kopyala sonrası git status (MK-101.1). Şema-dokunur →
  MK-98.2 dry-run + MK-101.5. SQL Editor düz ASCII. Sadece terminal git. gp ile push. HTML/JS
  tam dosya değişimi (patch değil).
- Spool ID: spooller.spool_id benzersiz (spool_no değil); tenant-prefix A-0580; kompozit
  proje-pipeline-spool-rev.
