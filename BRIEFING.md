# AresPipe BRIEFING — 137. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> Detay referanslar: `docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md`, `son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md`.
>
> **Son onay:** Cihat — 31 Mayıs 2026, 137 kapanışı. Malzeme hazırlık web ucu uçtan uca + GAP 1 ağaç + migration 095/096 + mobil mockup. Son kod commit'i `dfc6128` (toplu çekim export gerçek veri), kapanış doc `a39ab38 [skip ci]`.
>
> **Not (138 açılışında düzeltilecek borç):** Bu BRIEFING 71-137 arası güncellenmedi; canlı kapanış 3-dosya sistemine (`son-durum.md` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md`) geçmişti. `oturum-saglik.sh` hâlâ BRIEFING tazeliğini ölçtüğü için 138 açılışında BAYAT verdi. Kalıcı çözüm: script'in açılış kapısını `son-durum.md`'ye bağlamak (ayrı oturuma bırakıldı, Cihat kararı).

---

## 🎯 138. Oturum Gündemi

**İlk iş — Deploy görsel teyit (kısa).** 137 sonunda export gerçek veriye bağlandı ama canlı görsel teyit yapılmadı.
- Yıldızlı devre(ler) → "Malzeme Listesi" → PDF + Excel: "henüz oluşturulmadı" değil, gerçek kalem/eksik basıyor mu.
- Yıldız çok-cihaz: bir tarayıcıda yıldızla, başka cihazda kırmızı görünüyor mu.

**Sonra, biri (öneri sırası A → B):**

**(A) Eksik → Uyarılar entegrasyonu — ORTA, dosyasız (önerilen başlangıç).**
- Personel/yönetici bir kalemi "eksik/depoda yok" işaretleyince Uyarılar sayfasına düşsün.
- Şu an UI'da "eksik" işareti var (modal + mockup), **akış YOK**.
- Karar gerekebilir: eksik nerede saklanır (`spool_malzemeleri`'ne flag mi, ayrı uyarı kaydı mı). **Önce mevcut Uyarılar yapısını/şemasını oku — körlemesine yazma (MK-126.8).**

**(B) Mobil malzeme hazırlık React inşası — BÜYÜK.**
- Mockup'a göre 2 sekme (Devreler + Toplu Çekim), `mobile/` (React/Vite PWA) altına.
- Veri: `devreler.malzeme_kuyrukta` + `spool_malzemeleri` (adet/`teslim_adet`), spool→devre zinciri.
- Teslim girişi −/+ sayaç (kısmi). Mobil neredeyse boş (~%2) → ilk gerçek modül, dikkatli.

> Öneri: 138'de **A** ile başla (küçük, dosyasız, web sistemini tamamlar). **B** ayrı büyük blok.

---

## ✅ 137'de Yapılanlar

> Konu malzeme yönetimine kaydı: "devreyi imalata almadan önce malzemesi hazırlansın → personel sahada mobilden takip etsin → yönetici devreler tablosundan görsün." Profesyonel karşılığı MRP → kitting → staging → eksik raporu. **Stok/depo bilinçli olarak DIŞARIDA** (depo yazılımı ayrı, çelişmesin). Web tarafı uçtan uca oturdu.

**Bağlam — neden bu sıra:** Web tarafı meğer ~%70 kuruluymuş (4-durumlu yıldız + malzeme kontrol modalı), ama iki yapısal hatayla: (1) yıldız durumu localStorage'da → başka cihaz/mobil göremez; (2) modal `pipeline_malzemeleri`'nden okuyordu, o tablo terk/boş — gerçek malzeme `spool_malzemeleri`'nde. İkisi de düzeltildi.

1. **GAP 1 (wizard):** `devre_wizard_v3` Adım 1 düz tablo → aç-kapa klasör ağacı (`tree1`, mevcut `fol`/`fToggle` altyapısı yeniden kullanıldı). Kontroller fitem içinde (tip-select + hover sil korundu). Eski/hariç klasörler soluk + "hariç" rozeti (KOZMETİK, akış değişmez). Ölü CSS temizlendi.
2. **Migration 095 + 096:** kuyruk + teslim_adet kolonları. 095'te `teslim_adet` yanlışlıkla `pipeline_malzemeleri`'ne eklenmişti; ölçümle (1750 kalem spool'da, 1 satır pipeline'da) gerçek kaynak görülüp **096 ile `spool_malzemeleri`'ne taşındı** (095'teki pipeline kolonu ölü/zararsız kaldı).
3. **Yıldız motoru DB'ye:** localStorage → `devreler.malzeme_kuyrukta` + renk türetme (`_kuyrukState`, teslim/ihtiyaç toplamından). Çok-cihaz/mobil görünür. `yildizToggle`/`mlKaydet`/`mlSifirla` → DB update.
4. **Malzeme kaynağı `spool_malzemeleri`:** devre bazlı toplama, anahtar `tip|dis_cap_mm|et_mm|malzeme|kalite`. Teslim satır bazında (35 satır), ekranda birleşik; kısmi (3/5) görünür. `mlKaydet` sadece **dirty** kalemleri yazar → mobilde girilen kısmi teslimleri EZMEZ.
5. **Toplu çekim export:** `var kalemler=[]` stub'ı → `_malzemeAggregateBatch` (yıldızlı devrelerin malzemesi, batch). PDF popup gesture fix (pencere tıklama anında açılır, veri gelince yazılır).
6. **Mobil 2-sekme mockup:** `malzeme_hazirlik_mockup.html` görsel referans (commit edilmedi). React inşasında kullanılacak.

**Borç temizliği:** `mobile/dist/` zaten temiz (`git ls-files` boş + `.gitignore:27`). Borç düşürüldü.

---

## 🔒 Mühürlenecek / Mühürlenen MK (137)

> 138 açılışında `docs/KARARLAR.md`'de yoksa işle:

- **MK-137.1:** Malzeme hazırlık = yıldız DB kuyruk (`devreler.malzeme_kuyrukta`); renk `spool_malzemeleri` teslim/ihtiyaç toplamından türetilir; miktar bazlı (`teslim_adet`). Stok/depo modülü DIŞARIDA.
- **MK-137.2:** Malzeme gerçek kaynağı `spool_malzemeleri` (`spool_id → spooller.devre_id` zinciri); `pipeline_malzemeleri` terk/boş. Toplama anahtarı `tip|çap|et|malzeme|kalite`. Teslim satır bazında, ekranda birleşik.
- **MK-137.3:** Web manager modalı kısmiyi ezmesin → sadece dirty kalem yazılır (mobil kısmi teslim korunur).

---

## ⚠️ KORUMA Bantları (canlı)

- **MK-49.1:** `api/izometri-oku.js`'e DOKUNMA.
- **MK-129.3:** `api/*.js` = 12 endpoint. Yeni endpoint YOK (Vercel Hobby 12 fonksiyon limiti). `ls api/*.js | wc -l` ile teyit et.
- **MK-137.1/.2/.3:** yukarıda.
- **MK-101.1:** `arespipe_kopyala` + MD5 + `git status` zorunlu (137'de 2 kez sessiz kayıp yakalandı).
- **MK-134.1:** Kod commit'i + `[skip ci]` doc aynı push'ta doc-HEAD'de gönderilmez.
- **MK-126.8:** Yeni modül/endpoint yazmadan önce mevcut kodu + DB'yi oku.

---

## 📋 138'e Açık Borçlar (öncelik)

1. **Eksik → Uyarılar entegrasyonu** — UI'da var, akış yok (138 gündem A).
2. **Mobil malzeme hazırlık React inşası** — mockup hazır (138 gündem B).
3. **Wizard tamam blokajı (GAP 2)** — düzelt-yazma + çapa, test dosyasına bağlı.
4. **Test dosyaları bekleniyor** — çoklu-gemi K2, M130.
5. **129/130** terfi-sonrası imalat-izo görünmeme.
6. **117** `yukleyen_id` null (devre dokümanları parse fail).
7. **Pipeline doğrulama** (4.4-1) — montaj PDF prefix uyumsuzluğu.
8. **Fitting kütüphane** — DIN 86087 (saddle), ASME B16.9 diğer gruplar.
9. **Toplu çekim export "yeşil hariç" davranışı** — şu an state=3 devreler eksik-odaklı çıkarılıyor; istenirse "tam liste" modu eklenebilir.
10. **oturum-saglik.sh açılış kapısını `son-durum.md`'ye bağlama** — BRIEFING terk edildiği için kalıcı çözüm.

---

## 📚 Bilgi Haritası (kısalt.)

- `docs/KARARLAR.md` — Tüm MK kararları (137 sonu: MK-137.3'e kadar)
- `docs/SAYFA-EKSIKLERI.md` — Sayfa bazlı eksik tespiti
- `docs/CIHAT-PROFIL.md` / `docs/CLAUDE-CALISMA-MODU.md` — çalışma stili + canlı talimatlar
- `CLAUDE.md` / `CLAUDE-MOBILE.md` — geliştirme kuralları (web / mobil)
- `docs/SPOOL-AI-VIZYON.md` — vizyon
- `migrations/` — DB şema (… 095 + 096)
- `scripts/oturum-saglik.sh` — açılış/kapanış sağlık scripti
- `son-durum.md` / `CLAUDE-SON-OTURUM.md` / `CLAUDE-SONRAKI-OTURUM.md` — canlı 3-dosya kapanış sistemi

---

## 📊 137 Sonu Sayılar

- **API endpoint:** 12/12 (MK-129.3 limiti). 137'de yeni endpoint yok.
- **Migration:** … 095 + 096 (DB + repo uygulandı).
- **CI:** ✅ son kod commit'i `dfc6128` yeşil; kapanış doc `a39ab38 [skip ci]`.
- **HEAD:** `a39ab38`.
- **Malzeme hazırlık durumu:** [x] yıldız DB kuyruk · [x] kaynak `spool_malzemeleri` + devre toplama · [x] miktar/satır bazlı · [x] modal kısmi görünür · [x] toplu çekim export gerçek veri · [ ] mobil React inşa · [ ] eksik → Uyarılar.

---

## 🧪 Test Verisi

- **P26-184** / `7702313c-1bd1-4eef-80b5-e6a951697774` (35 malzeme kalemi, 8 spool) — malzeme modal/export testi için.

---

## 🎯 Açılış Ritüeli (138 için)

```bash
cd ~/Desktop/arespipe
git pull origin main
./scripts/oturum-saglik.sh 138
cat BRIEFING.md
```

İlk somut adım: **deploy görsel teyit** → **A (eksik→Uyarılar)** ya da **B (mobil React)**.
Web malzeme sistemi tamam; kalan iki ucu (eksik akışı + mobil) bağlayınca uçtan uca biter.

---

## 🧠 Hatırlatmalar

- `sed` HTML/JS'de yok → atomik `str_replace` / Python.
- Çok satırlı terminal yapıştırmada `#` yorum + parantez = zsh parse error → yorumsuz, çıplak komut ver.
- Doc commit'i `[skip ci]`; kod CI tetikler.
- AI son çare: L2 deterministik tercih, L3 vision fallback (60× maliyet farkı).
