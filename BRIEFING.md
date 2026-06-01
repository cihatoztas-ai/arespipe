# AresPipe BRIEFING — 138. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> Detay referanslar: `son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md`, `docs/KARARLAR.md`.
>
> **Son onay:** Cihat — 1 Haziran 2026, 138 kapanışı. Wizard inceleme: montaj ayrı bölüm + mükerrer-kayıt
> dedup + taslak hijyeni. 15 boş test-devresi temizlendi. Hepsi canlıda doğrulandı, 12/12 endpoint, MK-49.1 korundu.
>
> **Açık not (139'da çöz):** `oturum-saglik.sh` hâlâ BRIEFING tazeliği ölçüyor ama canlı kapanış 3-dosya
> sistemine geçmiş (BRIEFING 71-137 güncellenmemişti). Kalıcı çözüm: açılış kapısını `son-durum.md`'ye bağla.

---

## 🎯 139. Oturum Gündemi

**İlk iş — B-çap sürprizi (ORTA, `ares-kabuk.js`).** Taslak inceleme modalı spool `cap`/`et`'i "—" gösteriyor
ama devre canlıya terfi edince tabloda çap doluyor. Kök: `grupla()` spool BAŞLIĞINA cap/et yazmıyor (sadece
bom kalemlerine); türetme (`boyutParse/olcuParse`) yalnız `aktar()`'da (terfi) koşuyor. Fix: `grupla()`'ya
aynı `anaBoru→boyutParse` türetmesini koy → spool başlığında cap/et olsun → taslak=terfi, sürpriz biter.
Opsiyonel: modal etiketi "Excel → türetildi". Detay: `CLAUDE-SONRAKI-OTURUM.md`.

**Diğer (öncelik dışı):** Problem 1 (bayat-cache, 138/B maskeledi, acil değil) · taslak hard-delete/storage
cleanup (düşük) · oturum-saglik kapısını son-durum'a bağla · 117 yukleyen_id · pipeline doğrulama (4.4-1) ·
fitting kütüphane · mobil React + eksik→Uyarılar.

---

## ✅ 138'de Yapılanlar

> Cihat gerçek devreler yükleyip wizard inceleme sorunlarını tek tek kapattı. Üç kök sorun, hepsi ölçümle
> teşhis (DB + container birim testi), körlemesine fix yok (MK-126.8 / §11.1).

1. **Montaj "Fazla" sorunu çözüldü (fix 138/A + feat 138/B):**
   - Montaj/genel çizimler (`*.1.pdf`, S-segmentsiz) artık spool çetelesinde "🟠 Fazla" DEĞİL — ayrı
     "Montaj / genel çizimler" bölümünde. Tespit deterministik: `montajDosyaKok!=null && dosyaAdiParse==null`
     (dosya adından, AI yok, MK-49.1). `montaj{}` parse'ta olmasa da dosya adından montaj sayılır.
   - **Kök sebep:** bayat **cache** — aynı PDF bir devrede montaj{}, başkasında `cache_hit` ile montajsız
     gelmiş; boş kopya spool dalına düşüp `dosya_adi_pipeline_yok`→Fazla yapıyordu.
   - `izometrileriDerle` dosya_adi bazlı dedup eder (en bilgilendirici kayıt kazanır).
   - 4 dosya: `lib/izo-eslesme.js` (montajlar[]) + `api/devre-inceleme.js` (dedup + montaj-belge dalı) +
     `devre_wizard_v3.html` (ayrı bölüm render).
   - **Doğrulama:** G400-817-015'te "0 fazla", montaj çeteleden çıktı.
2. **Taslak hijyeni (fix 138/A+B1):**
   - `devreler.html applyFilters` → `.neq('durum','taslak')`: terfi edilmemiş taslaklar Aktif Devreler'de gizli.
   - `wizardIptal()`: İptal'de taslak `silindi=true` (soft, yalnız taslak; hard-delete/storage ertelendi MK-129.3).
   - Kök: `inceleBaslat()` "İncele →" anında taslak INSERT ediyor (devre_id storage/kuyruk için lazım).
3. **15 boş devre temizlendi** (9 taslak + 6 aktif, hepsi çöp/yarım test → `silindi=true`). 6 aktif-boş = eski
   v2 artığı (sistemik değil). `bos_kalan=0`.
4. **BRIEFING tazelendi** — 70 dönemi ajanda tasfiye, 137→güncel (oturum açılışında).

---

## 🔒 Mühürlenen MK (138 — `docs/KARARLAR.md`'ye işle)

- **MK-138.1:** İnceleme `dosya_adi` bazında dedup — aynı dosyanın mükerrer/bayat-cache kopyalarından en
  bilgilendirici kayıt kazanır (montaj{} > spoollar dolu > işlendi > boş).
- **MK-138.2:** Montaj/genel çizim = `montajDosyaKok!=null && dosyaAdiParse==null` (deterministik, dosya
  adından, AI yok). Spool çetelesine girmez, ayrı `montajlar[]` bölümünde; `montaj{}` parse'ta olmasa da
  dosya adından montaj sayılır (`icerik_okundu=false`).
- **MK-138.3:** Terfi edilmemiş taslak devreler Aktif Devreler'de gizli (`durum!='taslak'`); wizard iptalinde
  taslak soft-delete (`silindi=true`). Hard-delete/storage temizliği MK-129.3 (endpoint tavanı) nedeniyle ertelendi.

---

## ⚠️ KORUMA Bantları (canlı)

- **MK-49.1:** `api/izometri-oku.js`'e DOKUNMA.
- **MK-129.3:** `api/*.js` = 12 endpoint. Yeni endpoint YOK. `ls api/*.js | wc -l` ile teyit.
- **MK-138.1/.2/.3:** yukarıda.
- **MK-126.8:** Yeni modül/endpoint yazmadan önce mevcut kodu + DB'yi oku (138'de işe yaradı — montaj dalı
  zaten vardı, yeniden yazmadık).
- **MK-101.1:** `arespipe_kopyala` + MD5 + `git status` (138 patch'leri in-place Python ile, transfer yok).
- **MK-99.5:** `storage.objects` SQL DELETE yasak → Storage API.
- **MK-134.1:** Kod commit'i + `[skip ci]` doc aynı push'ta gönderilmez.

---

## 📋 139'a Açık Borçlar (öncelik)

1. **B-çap sürprizi** — `grupla()` spool başlığına cap/et türetmesi (139 ilk iş).
2. **Problem 1 (bayat-cache)** — 138/B maskeledi, cache invalidation ileri iş.
3. **Taslak hard-delete + storage yetim temizliği** — toplu cleanup, düşük öncelik.
4. **oturum-saglik kapısı → son-durum.md** — BRIEFING terk edildi, kalıcı çözüm.
5. **117 yukleyen_id · pipeline doğrulama (4.4-1) · montaj prefix · fitting (DIN 86087/ASME B16.9).**
6. **Mobil malzeme hazırlık React + eksik→Uyarılar** (mockup hazır, 137'den).

---

## 📚 Bilgi Haritası (kısalt.)

- `docs/KARARLAR.md` — MK kararları (138 sonu: MK-138.3'e kadar)
- `docs/PARSER-VE-YUKLEME-AKISI.md` — parser/yükleme/eşleştirme tek referans (137 güncel)
- `CLAUDE.md` / `CLAUDE-MOBILE.md` — geliştirme kuralları
- `son-durum.md` / `CLAUDE-SON-OTURUM.md` / `CLAUDE-SONRAKI-OTURUM.md` — canlı 3-dosya kapanış sistemi
- `migrations/` — DB şema (… 095 + 096) · `scripts/oturum-saglik.sh` — açılış/kapanış sağlık

---

## 📊 138 Sonu Sayılar

- **API endpoint:** 12/12 (MK-129.3). 138'de yeni endpoint yok.
- **Değişen dosyalar (138):** `lib/izo-eslesme.js`, `api/devre-inceleme.js`, `devre_wizard_v3.html`,
  `devreler.html` + DB (15 devre soft-delete).
- **CI:** ✅ kod commit'leri yeşil, Vercel Ready, canlı doğrulandı.
- **Wizard inceleme durumu:** [x] montaj ayrı bölüm · [x] mükerrer/bayat-cache dedup · [x] taslak gizle+iptal
  soft-delete · [x] boş devre temizliği · [ ] çap taslak önizleme (139).

---

## 🧪 Test Verisi

- **Y100-St.St** (NB1137/Watermist) — montaj (`İzometri/`) + spool (`Spool/`) ayrı klasör, IFS BOM xlsm.
- **NB1099C 582-Sanitary** — 51 spool dolu taslak (138'de wizard testinde kullanıldı).

---

## 🎯 Açılış Ritüeli (139 için)

```bash
cd ~/Desktop/arespipe
git pull origin main
./scripts/oturum-saglik.sh 139
cat BRIEFING.md
```

İlk somut adım: `ares-kabuk.js grupla()` (67-110) → spool başlığına `anaBoru→boyutParse` türetmesi → modal
"—" yerine türetilmiş çap (taslak=terfi).

---

## 🧠 Hatırlatmalar

- `sed` HTML/JS'de yok → atomik `str_replace`/Python (anchor + assertion korumalı). Çok-satırlı anchor'da
  GERÇEK dosyanın birebir formatını kullan (138'de tek-satır anchor sessiz `count==0` verdi, assertion yakaladı).
- Patch'leri container'da gerçek dosya kopyasında `node --check` + birim testten geçir, sonra ver.
- Çok satırlı terminal yapıştırmada `#` yorum + parantez = zsh parse error → yorumsuz çıplak komut.
- Doc commit'i `[skip ci]`; kod CI tetikler. Kod/doc ayrı commit (MK-134.1).
- AI son çare: L2 deterministik tercih, L3 vision fallback (60× maliyet farkı).
