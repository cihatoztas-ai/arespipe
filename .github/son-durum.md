# AresPipe — Güncel Durum (son güncelleme: Oturum 103, 20 May 2026)

## Bu oturumda yapılanlar (103)

### 1) 103-A — Wizard BOM Excel oto-yönlendirme + tespit (KOD TAMAM, CANLI TEST BEKLİYOR)
102'de onay modalı tam çalışıyordu AMA wizard'dan yüklenen dosyalar kuyruğa `parser='sakla'`
ile giriyordu → parse otomatik tetiklenmiyordu (102'de elle UPDATE ile test edilmişti). Ayrıca
BOM oto-tespiti yanlış Excel'i seçiyordu. İkisi de düzeltildi:

- **A1 (oto-tetik):** `devre_wizard.html` `adim3_yukle()` — `bom_excel` artık kuyruğa
  `parser='excel-generic'`, `durum='bekliyor'` giriyor; `parse_durumu='bekliyor'`. Upload bitince
  her BOM işi için sırayla `POST /api/kuyruk-isle-excel` ({is_id}) tetikleniyor. Sonuç
  (oneri_hazir/manuel_onay/hata) yükleme ekranında özetleniyor. Worker patlasa/ağ kopsa bile
  upload akışı bozulmuyor (iş kuyrukta 'bekliyor' kalır, gece cron'u alır).
- **A2 (tespit):** `autoDetect(ad, klasor_yolu, uzanti)` — imza değişti, dosya adı eklendi.
  Excel uzantılarında (xls/xlsx/xlsm) artık uzantı/klasör değil DOSYA ADI karar veriyor:
  ad "malzeme listesi / material list / bom / spool list / mto" gibi kalıba uyarsa `bom_excel`,
  uymazsa (kontrol formu, teslim tutanağı) `diger`. Muhafazakâr: emin değilse `diger`
  (kullanıcı dropdown'dan elle çevirir; yanlış oto-BOM parse+spool zincirini boşa tetikler).
  Klasör eşleşmesi hâlâ önce (açık sinyal). `parserBul`'a `bom_excel -> excel-generic` kısayolu
  (xlsm seed'de yok, tip_kodu üzerinden yakalanıyor — MIGRATION GEREKMEDİ).
- **Dedup (103 ek):** `dosyalariEkle` — aynı dosya (ad+klasör+boyut) listeye iki kez girmiyor.
  Drop zone altında görünür uyarı (`#dosyaUyari`). A1'den sonra kritik: aynı BOM iki kez ->
  iki parse -> çift spool riski.
- KÖK NEDEN (kayıt): `dokuman_tipleri`'nde `.xlsm` HİÇ yoktu; `xlsx` hem bom_excel hem diger'e
  bağlıydı, sıralamada bom_excel/xlsx önce -> her xlsx yanlışlıkla bom_excel, her xlsm diger.
- Test (kodla, Supabase'siz): A2 tespit 24/24 Excel; A1 tetik 5/5 senaryo; dedup 5/5. JS temiz.
- **Dosya:** `devre_wizard.html` MD5 `27175d4c786666fb7d0daf9298eb2b3b`. Commit edilmiş olmalı
  (rebase'de a6cbc6b..739e1a5 çekildi — git log ile teyit et).

### 2) Sayaç tenant-scope — AÇIK BORÇ #1 KAPANDI (CANLI)
- Tablo `sayac_tanimlari` zaten doğruydu: `tenant_id` kolonu + `UNIQUE(tenant_id,tip)` vardı.
  Bug yalnızca RPC `sonraki_no(p_tip)`'deydi — `tenant_id` filtresi yoktu.
- **Migration 085** (canlıda çalıştırıldı): B-G tenant'larına A config'i seed (son_no=0) +
  RPC `sonraki_no(p_tenant_id uuid, p_tip text)` olarak yeniden yazıldı (DROP eski text imza).
- **Kod** `ares-store.js` (commit bc097dd, MD5 `38e8532a327aff2ddbf38bad8251597f`):
  `sonrakiNo` helper'ı RPC'ye `p_tenant_id: tenantId()` geçiyor; local fallback anahtarı
  `tenant:tip` (offline tutarlılık). Helper imzası `sonrakiNo(tip)` AYNI kaldı → 3 çağıran
  (devre_yeni, devre_detay, kurallar.html) değişmedi.
- Dry-run (BEGIN...ROLLBACK) doğrulandı: A 594->595,596 | E 0->1,2. ✅
- **Davranış kararı (kalıcı):** Her firma kendi serisinden sıralı numara. A serisi korundu (594).
  spool_id anlamsız-ama-benzersiz surrogate; gemi/proje/devre = devre_id->proje_id zinciri.
  NB1124/NB1125 (aynı tenant, ayrı proje) tek seriden karışık numara alır — istenen bu.

## Mimari kararlar (103)
- **MK-103.1** — Excel BOM tespiti DOSYA ADI ile yapılır (uzantı/klasör Excel'i ayırt edemez:
  kontrol formu / teslim tutanağı da .xlsx/.xlsm). Muhafazakâr: emin değilse `diger`.
- **MK-103.2** — bom_excel routing'i `tip_kodu`'na bağlanır, uzantıya değil (xlsm seed'de yok;
  parserBul kısayolu `bom_excel -> excel-generic` tüm Excel uzantılarını kapsar).
- **MK-103.3** — Wizard dedup anahtarı = ad + klasör + boyut. A1 sonrası çift parse/çift spool önler.
- **MK-103.4** — Sayaç tenant-scope: `sonraki_no(p_tenant_id, p_tip)`. Her tenant kendi serisi.
  spool_id surrogate; numaraya gemi/proje yansımaz. RPC imza değişimi = kod+migration eşzamanlı deploy.
- **KARAR-103.1** — Sayaç şema değişikliği YOK (tablo zaten tenant-scope'luydu); sadece RPC + seed.

## AÇIK BORÇLAR (sıra önemli)
1. ~~Sayaç tenant-scope~~ — **KAPANDI (103, migration 085 + bc097dd).** Not: `is_emri`(P-147),
   `kesim_listesi`(KL-30), `markalama_listesi`(ML-5), `fason_bukum`(FB-0) sayaçları da artık
   tenant-scope (aynı RPC). B-G hepsi 0'dan seed'lendi. Bunlar için ayrı iş gerekmiyor — RPC ortak.
2. **spooller çift-kolon drift** — `agirlik`+`agirlik_kg`, `durum`+`is_durumu`, `yuzey`+`yuzey_islemi`
   birlikte var. İkisi de dolduruluyor (MK-102.2). İleride tek kanonik kolona indir.
3. **`devre_dokumanlari.parse_durumu` constraint** `oneri_hazir`/`manuel_onay` İÇERMİYOR
   (CHECK: bekliyor/isleniyor/tamamlandi/hata/saklama). Buton kuyruk durumunu okuduğu için sorun
   değil; worker da devre_dokumanlari'ni güncellemiyor (sadece kuyruk satırı). İstenirse senkron.
4. **103-A canlı test (3 nokta)** — deploy sonrası doğrulanacak: (a) kuyruğa excel-generic/bekliyor
   satırı RLS engeline takılmadan giriyor + .select('id') id dönüyor mu; (b) worker bekliyor satırını
   alıp Storage'dan Excel indirip parse ediyor mu (env SUPABASE_SERVICE_KEY Vercel'de var mı);
   (c) devre_detay Dökümanlar butonu oneri_hazir olunca elle UPDATE olmadan çıkıyor mu.
5. **i18n eksik anahtarlar** (fallback'le TR çalışıyor) — Wizard tamamlanınca (B/C sonrası) tek
   seferde toplanacak: `dv_onay_*` (102 modal), `dv_tab_docs`, `dv_dok_acilamadi`, ve 103 metinleri
   (banner `dw_p3_note`, parse-sonuç özeti, dedup uyarısı). TR/EN/AR. Hangi lang dosyası → Cihat paylaşacak.
6. **Sayaç config cache + tenant değişimi** — `_sayacConfig` cache'i `tenantId()` değişince
   temizlenmiyor (sadece `sayacConfigSifirla()`). Aynı oturumda tenant değiştiren super_admin için
   yanlış config riski. Düşük olasılık. Tenant değişiminde `sayacConfigSifirla()` çağrılmalı.
7. **Dosya içi önizleme** (PDF/resim viewer) — on the horizon. Şu an "↗" yeni sekmede açıyor.

## Wizard kalan işler (104+ roadmap)
- **A** ✅ (103, canlı test bekliyor)
- **B** (öncelik 1, YENİ SOHBET) — İzometri PDF yönlendirme (`batch-baslat`/`batch-kuyruga-al`) +
  paylaşılan PDF upload komponenti (wizard Step 2 atla-butonlu + devre_detay İzometri sekmesi) —
  MK-49.B. Bugünkü "çıplak pdf -> 3d_pdf" tespit quirk'i de burada düzelir (uzantı pdf ilk eşleşme
  3d_pdf'e düşüyor; klasör yoksa yanlış). 102 Dökümanlar sekmesi zemin oldu.
- **C** — Wizard sıfırdan yeni devre+iş emri oluşturma (şu an sadece mevcut devreye yüklüyor).
- **D** — Faz 2 arka plan zenginleştirme (Kaydet sonrası async PDF/3D parse, manuel_onay işaretleme).

## Şema notları (değişmedi — 102'den geçerli)
- `sayac_tanimlari`: tenant_id, tip, son_no, prefix, yil_ekle, digits, aciklama. UNIQUE(tenant_id,tip).
  spool: digits=6, yil_ekle=false, prefix='' (harf app-side). A son_no=594 (103 öncesi).
- `dosya_isleme_kuyrugu`: tenant_id, devre_dokuman_id(FK), parser, oncelik(def 5), durum(def 'bekliyor'),
  olusturma(def now()), parse_sonuc(jsonb). durum 084 ile 7 değer.
- `devre_dokumanlari`: parse_durumu CHECK = bekliyor/isleniyor/tamamlandi/hata/saklama.
- `dokuman_tipleri`: bom_excel -> xls,xlsx (xlsm YOK); diger -> pdf,xlsx; izometri -> pdf(izometri-oku);
  pdf uzantisi cok tip'e bagli, find() ilk eslesme 3d_pdf doner (103-B'de düzelecek).
