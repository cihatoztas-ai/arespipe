# AresPipe — Güncel Durum (son güncelleme: Oturum 107, 21 May 2026)

## Bu oturumda yapılanlar (107)

### 1) MK-49.B CANLI — Wizard izometri PDF routing (kod tamam, doğrulandı)
103-B eksik halkası kapandı. izometri PDF artık `'sakla'` (arşiv) değil, parse ediliyor.
- **Yeni worker `api/kuyruk-isle-izometri.js`** — `kuyruk-isle-excel.js` desenini birebir izler.
  Kuyruktan `parser='izometri'` işi alır → lock → `devre_dokumanlari`'ndan storage_yolu +
  yukleyen_id → PDF indir → base64 → `/api/izometri-oku`'yu HTTP ile çağırır (MK-49.1: dokunma,
  çağır) → sonucu `parse_sonuc`'a yazar → durum oneri_hazir/manuel_onay/hata.
- **`devre_wizard.html`** — `adim3_yukle`'ye üçüncü dal: izometri → `parser='izometri'`,
  `durum='bekliyor'`, `parse_durumu='bekliyor'` → ayrı `tetiklenecekIzo` listesi →
  `/api/kuyruk-isle-izometri {is_id}` tetikle + "İzometri ayrıştırma" sonuç özeti.
- **Env:** `SELF_BASE_URL=https://arespipe.vercel.app` (Vercel, Production+Preview, Sensitive KAPALI).
  Worker fallback: SELF_BASE_URL → yoksa VERCEL_URL → yoksa 500.
- **Migration GEREKMEDİ:** `dosya_isleme_kuyrugu.durum` CHECK'i oneri_hazir/manuel_onay zaten
  içeriyor; `parser` kolonunda CHECK yok → `parser='izometri'` serbest (MK-101.5 ✓).
- **Commit:** `280ec54` — feat(107): MK-49.B wizard izometri PDF routing. CI yeşil, Vercel Ready.

### 2) Canlı test — 15/15 dosya, parse zinciri çalıştı
M100-306 (SP12+SP27) + M100-317 devresi yüklendi. SQL teyidi: 15/15 izometri satırı
`parse_var=true`, `spoollar_tipi=array`, adetler ekranla birebir (detay PDF=1 spool,
montaj sayfası=5 spool), `hata_mesaji` hepsi NULL. Worker→izometri-oku→parse_sonuc kusursuz.
"Spool aktarım önizlemesi" modalı parse_sonuc'u okuyor (boru/fitting/DN/kg dolu).
Not: önizleme ≠ kayıt — "Aktar" butonuna basılınca spooller'a INSERT olur.

### 3) Kabuk Excel'den çıkıyor — KANITLANDI (kod yazmadan, SQL ile)
IFS Excel parse_sonuc'unda her satırda `pipeline_no` + `spool_no` VAR. SQL group-by ile
25 benzersiz spool temiz çıktı: kalem sayısı, toplam ağırlık, malzeme, system (yüzey kaynağı).
Yani K1 (kabuk IFS Excel'den doğar) onaylandı, K2 şablon GEREKMEZ. Ağırlıklar makul
(M100-317 S01=471kg, S02=680kg ağır deniz suyu; küçükler 5-40kg).
- Gözlem: `S03A_1/S03B_1` alt-parça spool'ları (kabuk ayrı sayar, doğru).
- Gözlem: `malzeme="St*, ST37"` — "St*" parse artığı, düzeltme sözlüğünün ilk müşterisi.

## Veri envanteri — izometri PDF'ten ne çıkarıyoruz (kod teyidi)
**Spool seviyesi:** pipeline_no, spool_no, dn, cap_mm, et_mm(+kaynagi), boy_mm, agirlik_kg,
malzeme_en_kodu, malzeme_astm_kodu, kalite, **yuzey** (Galvaniz/Boyali/Asit/null), rev,
guven_skoru, not_metni + alistirma_ipucu (106).
**Her BOM kalemi:** kod, kategori(PIPES/FITTINGS/FLANGES), tanim, malzeme, kalite, dis_cap_mm,
et_mm, boy_mm, adet, agirlik_kg(+kaynagi), sertifika_tipi, malzeme_notu, boyut_standardi,
malzeme_standardi.
**EKSİK (3D için kritik):** geometri/yön — `yon_dizilim`, açı, koordinat, segment YOK.
Bugünkü veri = BOM + skaler ölçü; 3D için geometri yeni bir parse boyutu olarak eklenmeli.

## Mimari kararlar (107)
- **MK-107.1 (Kabuk akışı = A):** Excel→kabuk tablosu→onay→spool'lar `spooller`'a "çizim
  bekliyor" damgalı INSERT→sen sonraki devreye geç→PDF'ler ARKADA (async) işlenir→dön,
  kontrol et, düzeltme varsa yap, kaydet. Kabuk onayında spool'lar HEMEN yazılır (mutabakat
  sonrası değil). Otorite kabuktur (MK-WIZARD). Eksik PDF ≠ eksik spool (MK-WIZARD.2).
- **MK-107.2 (Öğrenme = 4 deterministik depo):** (1) düzeltme sözlüğü, (2) referans
  kütüphaneleri (malzeme + boru_olculer), (3) format kuralları (parser_kural), (4) geometri
  corpus'u (STEP/Rhino + izometri yön + etiketli foto). "Öğrenme" = AI eğitimi DEĞİL, depo
  dolması. Her veri bir depoya yazılmazsa kayıptır; yazılırsa öğrenmedir. Sorular zamanla
  azalır çünkü depolar dolar (ölçülebilir hedef: tersane 1. devre ~%40 manuel onay → 5.
  devre ~%10 → 10. devre ~%3).
- **MK-107.3 (Düzeltme sözlüğü):** Yanlış sınıflandırma düzeltilince (a) o kayıt anında
  düzelir + (b) bir kural doğar `(desen, doğru_sonuç, kapsam)`. Sonraki parse'lar deterministik
  (sıfır AI) bu sözlükten geçer. Politika: akıllı varsayılan + sessiz işle + sadece belirsizde
  tek-tık kapsam sorusu (asla sınav). Çoğu düzeltme sessiz+evrensel-aday. "Field Butt welding"
  örneği = işlem, malzeme değil → BOM'dan ayrıl, kaynak sayısına git (parca_tipi="Standard Comp."
  + agirlik_kg=0 + tanım "welding" = işlem sinyali).
- **MK-107.4 (Her alan düzenlenebilir, güven kilit değil):** Güven skoru öneridir, kilit değil.
  %100 güvenli alan da düzenlenebilir. EN TEHLİKELİ hata sistemin EMİN olduğu hatadır (sessiz
  geçer). Yüksek güvenli alandaki düzeltme = KÖR NOKTA sinyali → sözlükte `kor_nokta=true`,
  öncelikli işlenir.
- **MK-107.5 (Üç katmanlı evrenselleştirme):** (1) Tenant-özel: firma düzeltmesi önce SADECE
  kendi tenant'ına yazılır, anında çalışır, başka firmada GÖRÜNMEZ. (2) Aday havuzu: aynı desen
  birden fazla bağımsız tenant'tan gelince "evrensel aday" işaretlenir (MK-96 çapraz doğrulama
  felsefesi). (3) Admin onayı: süper admin "Evrensel Kural Adayları" ekranında adayı görür
  (desen, kaç tenant, örnekler) → tek tıkla evrenselleştir (sistem preset, tenant_id IS NULL,
  herkese uygulanır) / reddet / tenant-özel bırak. Otomatik evrenselleştirme YOK — kapı hep insan.
  Admin = İKİ ŞAPKA: kullanıcı olarak (devre yüklerken) diğer firmalarla aynı, düzeltmesi kendinde
  kalır; admin olarak (panel) aday havuzunu yönetir. EVRENSELLEŞEN KURALDIR, VERİ DEĞİL (anonim,
  hangi firmadan geldiği taşınmaz — MK-48.6 veri sahipliği ile uyumlu).
- **MK-107.6 (STEP geri-doğrulama):** STEP varsa o GERÇEĞİN ta kendisi (deterministik geometri).
  Yön: STEP truth → izometriden okunan DN/uzunluk/fitting sayısını DOĞRULA + izometride eksik
  parçaları TAMAMLA + çelişkide bayrak kaldır (MK-96 geometriye uygulanmış hali). 3D'nin temeli
  STEP/Rhino; izometri yön bilgisi sonraki boyut; saha foto en uzun vade.
- **MK-107.7 (Süper admin Öğrenme Yönetimi alanı):** Evrensel Kural Adayları + düzeltme sözlüğü
  yönetimi + (ileride) kör nokta raporu süper admin sayfasında ayrı bir alan olmalı.

## CI Son Durum
- **Build:** son kod commit `280ec54` (MK-49.B). CI yeşil, Vercel Production Ready (SELF_BASE_URL
  içeren deploy). Bu kapanış docs commit'i `[skip ci]`.

## AÇIK BORÇLAR (108 ana teması: kabuk-first akış)
1. **Kabuk-first wizard akışı (MK-107.1) — 108 ANA HEDEF.** Excel→kabuk tablosu (ekteki
   30-spool görünümü gibi: marka, spool_id, çap, ağırlık, malzeme, kalite, yüzey, alıştırma)
   →onay→spooller INSERT ("çizim bekliyor")→async PDF drenajı→dön/kontrol/düzelt/kaydet.
   Alıştırma sütunu kabukta boş gelir (Excel'de yok), PDF arkada işlenince dolar.
2. **Async drenaj:** wizard senkron `await` beklemeyi bırak; cron veya "bekleyenleri işle"
   endpoint'i kuyruğu boşaltsın (worker zaten body'siz "sıradakini al" destekliyor).
3. **Yüzey otomatik doldurma (hızlı kazanım):** aktarım/onay modalı parse_sonuc'taki `yuzey`'i
   (veya Excel `system` token'ı "Galv") dropdown'a ön-doldursun — sorma. Şu an redundant soruyor.
4. **Düzeltme sözlüğü (MK-107.3) + 3-katman evrenselleştirme (MK-107.5):** kabuk akışının
   zorunlu parçası, ayrı kodlanır. "St*" ve "Field Butt welding" ilk müşteriler.
5. **izometri onay/insert yolu:** "Spool aktarım önizlemesi" modalı izometri parse_sonuc'unu
   okuyor; insert ("Aktar") çalışıyor. Kabuk akışıyla birleştirilecek (kabuk spool'a PDF eşleşir).
6. **Yetim batch:** her izometri PDF `izometri_batch_kayitlari`'na batch açıyor (izometri-oku
   yan etkisi, MK-49.1). Pilot için kabul, ileride reconcile.
7. **Süper admin Öğrenme Yönetimi (MK-107.7):** Evrensel Kural Adayları ekranı.
8. **3D hattı (MK-49.A + MK-107.6):** STEP/Rhino temel → izometri yön (yon_dizilim, yeni parse
   boyutu) → saha foto. Uzun vade, ayrı hat.

## Önemli öğrenmeler (107)
- **HTTP self-call serverless'ta çalışır** ama mutlak URL + stabil base gerekir → SELF_BASE_URL
  production alias'ına (Hobby + System Env açık olduğu için VERCEL_URL fallback'i de çalışır).
- **MK-49.1 disiplini tuttu:** izometri-oku'ya hiç dokunmadan, sadece HTTP ile çağırarak tam
  entegrasyon. Tam handler'ları import etmek yerine çağırmak doğru semantik.
- **"Sistemin emin olduğu hata en tehlikelisidir"** — düşük güvenli zaten manuel onaya düşüyor,
  yüksek güvenli sessiz geçiyor. Bu yüzden her alan düzenlenebilir olmalı.
- **Veri bir depoya yazılmıyorsa kayıptır** — öğrenme döngüsünün tek şartı bu.
