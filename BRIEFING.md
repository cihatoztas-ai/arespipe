# AresPipe BRIEFING — 66. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 6 Mayıs 2026, 66 kapanışı (`oturum-saglik.sh 66 --kapanis` MK-65.8 disiplinine uygun çalıştırıldı, MK-56.2 yeniden canlı kalıyor)

---

## 🎯 67. Oturum Gündemi

**Birincil iş 1: MIsBaslat Ekran 3 (IbSpoolDetay) — R-10 mockup-first, 66'da başarısız tur.** 66'da 7 iterasyon yapıldı, hiçbiri prod'a girmedi (MK-66.3'ün doğum sebebi). Yeni Claude için strateji baştan belli: **vanilla `is_baslat.html`'in 1930 satırını bütün okumadan iterasyona başlama**. 66'daki turda repo'daki 1772 satır referans alındı, gerçek prod 1930 — 158 satır boşluk fark edilmeden 4 iterasyon harcandı (MK-63.B'nin tam tetiklenmesi). 67'de açılış sorusu: *"Mevcut ekran prod'da çalışıyor — neyi değiştirmek istiyoruz?"* — özgür tasarım sunma, Cihat'ın değiştirmek istediği maddelerden başla. Alternatif daha az tartışmalı yollar: Ekran 7 (Basamak Seç) veya `mobile/src/lib/normalize.js` portu.

**Birincil iş 2 (Ekran 3'ün önkoşulu olarak duruyor): `mobile/src/lib/normalize.js` portu.** `ares-normalize.js`'in mobile karşılığı: `markaId()` (6→4 hane display), `marka()` (E-04 helper), `malzemeEtiket()` (i18n + map), `yuzeyEtiket()`, `revFmt()`. 65'te IbQRTara'da `padStart(6, '0')` geçici fix yazıldı (MK-65.2), kalıcı çözüm bu port. **format.js ile çakışmaz** — format.js veri biçimleme, normalize.js domain dönüşümü.

**İkincil iş: MIsBaslat Ekran 4 (IbUyari) — R-10 mockup turu.** Üç senaryo tek mockup'ta: cross-tenant kırmızı + `is_durumu === 'devam_ediyor'` sarı (devral/iptal) + rol uyumsuzluğu kırmızı/sarı. **Karar noktası 67 başında:** `aktif_basamak` × rol matriksi netleştirilmeli (MK-65.3 ile askıya alınmıştı, 66'da Ekran 3'e geçildiği için yine açıldı), kontroller ondan sonra hub'a geri döner.

**Etkilenen dosyalar:** `mobile/src/components/isbaslat/IbSpoolDetay.jsx` (yeni), `mobile/src/components/isbaslat/IbUyari.jsx` (yeni), `mobile/src/lib/normalize.js` (yeni), `mobile/src/screens/MIsBaslat.jsx` (Ekran 3+4 placeholder'ları gerçek bileşene çevrilir), `lang/{tr,en,ar}.json` (`m_ib_sd_*`, `m_ib_uy_*` anahtarları).

**Diğer açık borçlar (gündem değil, çözülecek):**
- MK-58.1 — `spooller.alistirma` kanonik enum migration (lowercase'e standardize)
- MK-62.3 — `mobile/src/lang/README.md` predev silme problemi
- MK-58.5 — Panel.html mobile preview UUID input alanı
- **Prod RLS migration** — dev'de 032+033 yeşil, prod Supabase'inde aynı SQL koşulmalı (MK-66.1 disiplini gereği aynı dosya, aynı sıra)

---

## ✅ 66'da Yapılanlar

> 66, **63-64-65 sapma onarımı + Supabase RLS güvenlik fix + Ekran 3 mockup turu (başarısız) + 4 yeni MK kararı** üretti. Kayda değer iki başarı: `MK-56.2`'nin yeniden hayata dönmesi ve **5 publicly-accessible tablo + USING(true) policy'sinin kapatılması**.

### 1. Sapma onarımı (66 açılışı)

63-64-65'te yeniden canlanan 3-dosya kapanış mimarisi (`.github/son-durum.md` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md`) `docs/arsiv/*-65-yanlis-yazim.md` adıyla arşive taşındı (commit `193e49f`). BRIEFING.md ve KARARLAR.md restorasyonu yapıldı (`c5dd95f`): 14 yeni MK kararı (MK-63.A/B/C, MK-64.1-5, MK-65.1-8) MK-62.3'ün altına eklendi, BRIEFING.md "65. Oturum Kapanışı" başlığıyla yeniden doğdu. **Onarım scripti `onarim_66`** kaynak dosyaları kopyaladı, KARARLAR.md'ye append etti, sanity check + sağlık scripti çalıştırdı.

### 2. Supabase RLS güvenlik fix (66 ortası)

Cihat'ın paylaştığı 03 Mayıs 2026 Supabase Security Advisor mailindeki 5 tablo RLS açığı kapatıldı:

**`migrations/032_rls_fix_5_tablo.sql`** (ilk kanonik migration disiplini uygulanışı):
- `testler` — multi-tenant policy (`tenant_id = get_tenant_id()`)
- `tenant_features` — multi-tenant SELECT + super_admin ALL
- `egitim_verisi` — multi-tenant policy (HASSAS, AI eğitim verisi)
- `yetki_tanimlari` — sistem sözlük (read public + super_admin write)
- `basamak_sablonlari` — sistem sözlük (read public + super_admin write)
- 8 yeni policy, hepsi `TO authenticated` filtresi ile (anon erişim kapalı)

**`migrations/033_tenant_features_eski_policy_temizlik.sql`** (kritik bulgu):
- `tenant_features_all` policy'si silindi — `USING (true), roles {public}, cmd ALL` ile fiilen RLS'i bypass eden eski policy. **Anon dahil herkese tam erişim veriyordu** — RLS açıldıktan sonra bile bu policy OR mantığıyla güvenliği iptal ediyordu.
- `super_admin_feature_yonet` silindi — eski JWT format (`app_metadata.rol`), 032'nin yeni policy'siyle (`auth.jwt() ->> 'rol'`) duplikat.
- Bu bulguya `MK-66.2` doğdu: RLS aktif eden migration'larda **`pg_policies` ile eski policy taraması zorunlu**.

**Numaralandırma düzeltmesi (önemli):** İlk yazımda dosya adı `066_rls_fix_5_tablo.sql` olarak verildi (oturum numarasıyla karıştırma). Cihat fark etti — repo'daki son migration `031`, sıralı devam etmesi gerekiyordu. Düzeltildi: `032_rls_fix_5_tablo.sql`. Bu hata `MK-66.1`'in temel netliğini doğurdu: **migration dosya adı sıralı (NNN_), oturum numarasından bağımsız**, oturum referansı dosya yorumunda verilir.

**Manuel uygulama akışı (Supabase SQL Editor):**
1. 032 yapıştırıldı → "Success. No rows returned" → 5 tablo RLS aktif
2. Doğrulama sorgusu çalıştırıldı → 10 policy bulundu (beklenen 8) → tenant_features'ta 2 fazla
3. Detay sorgusu → `tenant_features_all USING(true)` tehlikesi tespit edildi
4. 033 yazıldı, BEGIN/COMMIT'siz çalıştırıldı (Supabase SQL Editor nested transaction kabul etmedi, bu **MK-66.5** olarak yazıldı: "BEGIN/COMMIT migration dosyasında kalır, Supabase Editor'de çalıştırırken atlanır")
5. Final doğrulama: `tenant_features` artık 2 policy (select + super_admin), 5 tablo TRUE, 8 policy total

**Etki:** Supabase Security Advisor'ın `arespipe-dev` (`ochvbepfiatzvyknkvsn`) için verdiği uyarı kapanmış olmalı. Prod tehlikede değildi (mailde sadece dev), ama aynı SQL prod'a da koşulacak (67'de).

### 3. Ekran 3 (IbSpoolDetay) mockup turu — 7 iterasyon, prod'a girmedi

**MK-66.3 doğum hikayesi.** Vanilla `is_baslat.html` repo'da 1772 satır, prod'da 1930 satır — 158 satır fark fark edilmeden iterasyona başlandı (MK-63.B'nin tam tetiklenmesi). 7 iterasyon:

- **v1:** dark theme + 6-step aşama tracker + bilgi grid (uydurma elementler, vanilla'da yok)
- **v2:** light-anthracite tema, vanilla satır listesine birebir hizalı (Cihat: "ben hatırlamıyorum")
- **v3:** 7 düzeltme — kare foto, devam_ediyor sarı şerit, "Spool Detay" topbar, A-0575 4 hane (1. defa düzeltildi), "Ön İmalat" lokalize
- **v4:** 7 yeni feedback — "ön imalat yerine spool ID", yüzey "Galvaniz" sade, devam_ediyor sarı şerit yanlış, Rev/alıştırma duplikasyonu, notlar dipte yanlış, **uyarılar radikal tasarım gerektiriyor**
- **v5:** sol uyarı rail + "ŞU AN İŞLEMDE" bandı + izometri bölümü (panel layout shift problemi)
- **v6:** sağ kenardan slide-in panel, 3 renkli stripe, A-0575 (4 hane! 4. defa düzeltildi)
- **v7:** Cihat'ın isteği üzerine "Claude'un özgür tasarımı" — hero (marka soldan + foto thumb sağdan), durum bandı, mini istat grid, ilerleme progress bar, sticky uyarı çubuğu + bottom sheet pattern

**Visualizer 2 kez timeout** (4 dk her biri, Anthropic tarafında geçici sorun) — v7 alternatif HTML dosyası olarak verildi (`~/Downloads/ekran3_v7_ozgun_tasarim.html`). Cihat yorgun bitirdi, oturumu kapattı, RLS işine geçildi.

**67 stratejisi** (gündem maddesinde tekrar yazılı): vanilla'yı **bütün** okuyarak başla, "neyi değiştirmek istiyoruz?" sorusuyla aç, özgür tasarım sunma. Alternatif: Ekran 7 (Basamak Seç) veya normalize.js portu.

### 4. 4 yeni MK kararı (`docs/KARARLAR.md`'ye yazılacak — şu an taslakta)

- **MK-66.1** — Migration disiplini başlangıcı: dosya numarası **sıralı (NNN_)**, oturum numarasından bağımsız. Oturum referansı dosya yorumunda. README.md migration formatı korundu (BEGIN/COMMIT, idempotent DROP IF EXISTS, geri alma notu).
- **MK-66.2** — RLS aktif eden migration'larda **`pg_policies` ile eski policy taraması zorunlu**. RLS kapalıyken yazılmış policy'ler "uyuyabilir", RLS açılınca uyanır ve yeni policy'lerle çakışır. Migration öncesi her tabloda `SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'X';` — boş dönmüyorsa eski policy'ler ya migration'a `DROP IF EXISTS` ile dahil edilir ya da uyumlu hale getirilir. **`USING (true)` görünce alarm ver** — bu RLS'i fiilen iptal eder.
- **MK-66.3** — Mockup-first turunda (R-10) vanilla'yı **bütün okumadan** iterasyona başlama yasağı. 66'da 158 satırlık prod-repo farkı görmeden 7 iterasyon harcandı. Yeni protokol: vanilla'nın gerçek satır sayısı + grep'le kritik fonksiyonlar (uyarilariTopla, ROL_BASAMAKLAR, foot CTA dinamiği) çıkarılır, sonra mockup başlar. **Açılış sorusu özgür tasarım değil:** "Mevcut ekran çalışıyor, neyi değiştiriyoruz?"
- **MK-66.5** — Supabase SQL Editor nested transaction kabul etmiyor (`BEGIN; ... COMMIT;` parse error verir). Migration dosyasında BEGIN/COMMIT **kalır** (psql ile çalıştırılma uyumu için, kanonik form), ama Supabase SQL Editor'de çalıştırırken **atlanır** — sadece DDL/DML komutları yapıştırılır. Editor zaten kendi transaction'ında çalışır.

### 5. Commitler (66'nın tamamı)

```
193e49f fix(mimari): 63-64-65 sapma - terk edilen dosyalar arsive geri tasindi (MK-56.2)
c685e30 chore(ci): ci-son-rapor.json güncelle [skip ci]
c5dd95f docs(66): BRIEFING + KARARLAR restorasyonu - 63-64-65 sapma onarimi (MK-56.2, MK-65.8)
26a6119 chore(ci): ci-son-rapor.json güncelle [skip ci]
b4c7286 fix(security): RLS aktif 5 tablo + tenant_features eski policy temizlik - oturum 66
```

### 66'da yapılmayanlar (bilinçli + zaman/sapma kaynaklı)

- **Ekran 3 prod'a alınmadı** — 7 iterasyon başarısız, 67'ye devredildi
- **Ekran 4 mockup'ı yazılmadı** — Ekran 3 takılınca sıraya gelmedi
- **`mobile/src/lib/normalize.js` portu** — Ekran 3'ün önkoşuluydu, başlanmadı
- **Smoke test** — RLS migration sonrası uygulama smoke testi yapılmadı (Cihat yorgundu, "yeşilse commit" stratejisi seçildi). Risk: süper admin paneli + tenant feature sayfası + operatör spool aç akışında 67 başında bir sorun olabilir; `migrations/034_*` ile fix yazılır eğer çıkarsa
- **Prod RLS migration** — 032+033 sadece dev'de çalıştırıldı, prod Supabase'inde aynı SQL koşulmalı (67 açılış işi)
- **`oturum-saglik.sh 66 --kapanis` çağrısı** — yapıldı ✅ (MK-65.8 disiplinine uyuldu, BRIEFING güncellemesi olmadan reddetti, brifing yazılınca yeşil oldu)

---

## 📚 Bilgi Haritası

> Hangi soruda hangi dosyaya bakacağını söyler. Kategori belgeleri (sahip + tazelik penceresi) yıldızla işaretli.

**Vizyon ve mimari:**
- `docs/SPOOL-AI-VIZYON.md` — AI özelinde vizyon v2.1
- `docs/AI-VE-3D-VIZYON-v3.md` — Operasyonel veri merkezli vizyon v3
- `docs/VIZYON-VE-MODULER-MIMARI.md` — Modüler altyapı taahhütleri (40)
- `docs/KUTUPHANE-KAPSAM.md` — Standart kütüphane kapsam haritası (40)
- `docs/KUTUPHANE-YUKLEME-TAKIP.md` — P0 kütüphane yükleme trajektorisi
- ⭐ `docs/VIZYON-OTURUMLARI.md` — Vizyon/strateji sohbetleri (kategori belgesi, 61'de doğdu)

**Karar ve süreç:**
- `docs/KARARLAR.md` — Tüm MK kararları (66 sonu: MK-66.5'e kadar)
- ⭐ `docs/CIHAT-PROFIL.md` — Cihat'ın çalışma stili + Claude'un farkındalıkları
- `docs/CLAUDE-CALISMA-MODU.md` — Claude'a canlı talimatlar
- `CLAUDE.md` — Geliştirme kuralları (web)
- `CLAUDE-MOBILE.md` — Geliştirme kuralları (mobil)

**Operasyonel:**
- `docs/SAYFA-EKSIKLERI.md` — Sayfa bazlı eksik tespit metodu
- `docs/IZOMETRI-BATCH-KARAR.md` + `docs/IZOMETRI-BATCH-NOTLARI.md` — İzometri batch parser
- `docs/L2-PARSER-NOTLARI.md` — L2 deterministik parser kararları
- `docs/KAPANIS-ORKESTRA-TASARIM.md` — Kapanış orkestra protokolü tasarımı
- `scripts/oturum-saglik.sh` — Oturum açılış/kapanış sağlık scripti (MK-55.1, MK-60.3, MK-65.8)
- `migrations/` — DB şema değişiklikleri (000_initial → 033 tenant_features temizlik); README disiplini
- `docs/ROADMAP.md` — Faz B/C planı

**Onboarding:**
- `docs/ONBOARDING.md` — Yeni geliştirici giriş yolu (32)

**Arşiv (referans, aktif değil):**
- `docs/arsiv/CLAUDE-SON-OTURUM-65-yanlis-yazim.md`
- `docs/arsiv/CLAUDE-SONRAKI-OTURUM-65-yanlis-yazim.md`
- `docs/arsiv/son-durum-65-yanlis-yazim.md`
  → 63-64-65'te yanlış mimaride yazılan üç dosya, MK-56.2 sapmasının delili olarak korundu (193e49f).

---

## 📊 66 Sonu Sayılar

- **i18n anahtarları (kök `lang/`):** 1834 (66'da değişmedi — Ekran 3 ilerlemeyince yeni anahtar eklenmedi). Trend: 62→1752, 63→1800, 64→1816, 65→1834, 66→1834
- **Mobil ekran sayısı:** 9 tam ekran + MIsBaslat hub'ında 2 alt ekran (IbRolSec, IbQRTara) + 2 ortak komponent. ⏳ Bekleyen: MIsBaslat Ekran 3-10 + MProfil
- **Toplam MK kararı:** MK-66.5'e kadar (65→66 arası +4: MK-66.1, MK-66.2, MK-66.3, MK-66.5 — *MK-66.4 atlandı, numara boş bırakıldı*)
- **Migration dosyası:** 33 (031 → 033, 66'da +2: RLS fix + tenant_features temizlik). Sıralı disiplin (MK-66.1) ilk uygulandı.
- **CI:** ✅ son commit yeşil (`b4c7286`)
- **HEAD:** `b4c7286`
- **Lint:** Faz B baseline'ı korundu

---

## 🔄 66'dan 67'ye Geçiş Notları

- **MK-65.8 disiplinine uyuldu**: `oturum-saglik.sh 66 --kapanis` çalıştırıldı, BRIEFING.md başlığı yanlışken script kapanışı reddetti, brifing güncellendi sonra commit zinciri akıttı.
- **Prod RLS migration 67'nin ilk işi.** `migrations/032_rls_fix_5_tablo.sql` + `033_tenant_features_eski_policy_temizlik.sql` aynı sırayla **prod Supabase**'inde SQL Editor'e yapıştırılır (BEGIN/COMMIT atlanır — MK-66.5). Doğrulama: 5 tablo TRUE + 8 policy + tenant_features 2 policy. Prod'da `tenant_features_all` ve `super_admin_feature_yonet` policy'leri **muhtemelen yok** (dev'de tarihsel artıktı), ama 033'ün `DROP IF EXISTS` ifadeleri zarar vermez.
- **Ekran 3 mockup turu yeniden başlar — vanilla 1930 satırı bütün okunarak.** 66'daki 7 iterasyon zihinsel olarak "sıfırlanır" (referans olarak v7'nin HTML dosyası `~/Downloads/`'ta), Cihat'ın değiştirmek istediği maddelerden başlanır. Açılış sorusu Claude'a yasak: "Sana özgür tasarım yapayım mı?" — bunun yerine "Şu an çalışan ekrandan neyi değiştirmek istiyorsun?". MK-66.3 budur.
- **`aktif_basamak` × rol matriksi 67'de gerçek DB sorgusuyla netleşir.** 65'te tahminliydi, 66'da Ekran 3'e geçildiği için ertelendi. Ekran 4 (uyari) bu matrise bağlı.
- **`mobile/src/lib/normalize.js` portu** Ekran 3'ün önkoşulu olarak duruyor. Cihat 67 açılışında *"önce Ekran 3 mockup mı, normalize portu mu?"* tercihini yapar. Port önce yapılırsa Ekran 3 mockup'ı `markaId()` + `marka()` çağrılarıyla gerçekçi yazılır.
- **Geçici borç:** `mobile/src/lang/README.md` (MK-62.3) hâlâ `.gitignore` satır 27 ignore ediyor.
- **Ekran 3 visualizer crash'i 66'da Anthropic tarafında geçiciydi** — 67'de denemek değer. Hâlâ crash ediyorsa HTML dosyası alternatifi (66'da kullanıldı) çalışıyor.

---

## 🎯 Açılış Ritüeli (67 için)

```bash
cd ~/Desktop/arespipe
git pull origin main
./scripts/oturum-saglik.sh 67
cat BRIEFING.md
```

Sağlık scripti yeşilse Claude'a `cat BRIEFING.md` çıktısı yapıştırılır, **iki seçenek sunulur**:

1. **Prod RLS migration** (15 dk iş, kapatılması gereken tek somut açık) → Supabase prod SQL Editor'de 032+033 koş, doğrula, smoke test, 67 ilk commit'i `chore(security): prod RLS - 5 tablo (oturum 67)` olarak boş kalan repo durumunu güncelleyebilir veya sadece dev/prod senkronu için belge kaydı bırakılabilir.

2. **Ekran 3 mockup-first ikinci tur** (vanilla 1930 satırı bütün okuyarak) ya da **normalize.js portu** (mockup'tan daha az tartışmalı sıcak temas).

Cihat tercihini söyler, oradan başlanır. **Açılışta özgür tasarım sunulmaz** — bu MK-66.3 disiplinidir.
