# Sayfa Eksikleri Defteri

> **Amaç:** Bir sayfa Claude'a herhangi bir görev için geldiğinde tespit edilen yarım/eksik akışları **birikmeden** kayda geçir, **görünür** tut, oturum sonu Cihat'a sun, priority kararı sende kalsın.
>
> **Kural adı:** SED-01 — Sayfa Eksik Defterini Tut. Detay: `kurallar.json`.
>
> **Format:** Her sayfa için açık eksikler ✅ kapatılan kayıtla birlikte. Aynı eksik 3+ oturumdur açıksa Claude proaktif uyarır: "şu eksik X oturumdur listede".

---

## 32. Oturum Tarama Sonuçları (25 Nisan 2026)

### `spool_detay.html`

#### ✅ Kapatıldı (32. oturum)
- **S1** — `belgeKaydet` artık DB'ye yazıyor (bucket upload + DB insert + optimistic UI rollback). Belge sayfa yenilemede kalıyor. F5 + sayfadan çıkıp gelme testi geçti.
- **belgeSil DB bug (defter dışı bonus)** — Mevcut kod sadece BELGELER array'inden çıkarıyordu, F5'te belge geri geliyordu. Soft delete pattern (silindi=true + silinme_tarihi) ile kapatıldı.
- **tur/tip drift bug (yan tespit)** — DB kolonu `tur` ama okuma+render kodu `b.tip` kullanıyordu. Belge türü ekranda hep boş görünüyordu. Tüm kod `tur`'a çevrildi. (S2'nin kardeş bug'ı — ders: schema değişiklikleri uçtan uca tarama gerek, sadece insert noktası değil.)

#### ✅ Kapatıldı (31. oturum)
- **S2** — `egitim_verisi` insert'inde kolon adı bug (`foto_url` → `fotograf_url`). Schema sorgusu doğruladı, kod tek kelime düzeltildi. Spool AI eğitim verisi artık gerçekten kayıt ediliyor (vizyon kazanımı).

#### 🟡 Açık (sonraya bırakıldı)
- **S3** — AI toolbar gizli (satır 1562) — bilinçli, "Lambda hazır olunca açılacak". Spool AI faz planına bağlı.
- **S4** — QR indirme (satır 1989) — bilinçli yarım, NOT-02 referansıyla biliniyor.

---

### `devre_detay.html`

#### ✅ Kapatıldı (32. oturum)
- **D5** — `dokKaydet` artık bucket'a upload + DB'ye düzgün `dosya_url` (placeholder yerine gerçek path). Ek: render'a aç butonu (↗) eklendi, signed URL helper ile çalışıyor. Eski "pending:" kayıtlar için backward-compat (görünür kalır, açma yok). F5 + aç testi geçti.
- **D6** — 10 sessiz `console.warn` toast bildirimine dönüştü:
  - Kullanıcı action (kritik): `spoolGuncelle`, `spoolDurdur`, `spoolDurdurmaKaldir`, `softSil`, `terminKaydet` — hata olunca toast + erken `return` (yanıltıcı başarı toast'ı önlendi)
  - Yükleme hataları: `devreYukle`, `spoolYukle`, `plMalzYukle`, `belgelerYukle`, `loguGetir`, `malzemeleriGetir` — "yüklenemedi" toast
  - Dokunulmayan: `_basamakMapYukle`, `_skBaslat` (init), `dokKaydet` (zaten toast var)

#### 🟡 Yarı kapatıldı — deploy bekliyor (32. oturum sonu)
- **D3** — `tersane_is_emri` artık DB kolonu (001 migration eklendi, manuel SQL atıldı). Kod fix: `devreYukle` DB'den okur, `tersaneIsEmriKaydet` DB'ye yazar (optimistic UI + rollback). **Vercel rate limit nedeniyle son commit deploy edilemedi**, canlı doğrulama 33. oturumda yapılacak. Beklenen davranış: tersane iş emri gir → kaydet → F5 → değer durur. Test komutu: tarayıcı console'da `tersaneIsEmriKaydet.toString().includes('supa.from')` → `true` olmalı (deploy doğrulama).
- **G-08** — Skeleton + cascade pattern uygulandı (CSS, JS helpers, render data-ci, HTML stat shimmer). Cihat "tam aynı değil" geri bildirimi verdi, somut fark belirtilmedi. **Görsel karşılaştırma + fark tespiti 33. oturuma**. devreler.html birebir referans alındı (CSS class isimleri, 15 satır skeleton, 0-19 cascade delays).

#### ✅ Kapatıldı (31. oturum)
- **D1** — `spoolEkleKaydet` Supabase'e yazıyor şimdi. Optimistic UI + rollback pattern.
- **D2** — `durdurKaydet` ve `durdurmaKaldir` `devreler.durum` + `durdurma_sebebi` UPDATE yapıyor.

#### 🟡 Açık (sonraya bırakıldı)
- **D4** ✅ — KK ve Sevkiyat listeleri devre_detay sayfasında render ediliyor (33. oturum, 25 Nis 2026). Yeni `kkSevkYukle()` fonksiyonu: kk_davet_spooller ve sevkiyat_spooller'dan inverse sorgu, master tabloları çekiyor. DOMContentLoaded + pageshow + visibilitychange + gonderKaydet zincirlerinde otomatik yenileme. Canlı test: AT110-Drencher-Galv devresinde KK-926323 daveti 8 spool ile göründü. Commit `7db5979`. Defterin 35+ tahmininden çok önce kapandı (~45 dk).
- **D7** ✅ — `durdurma_tarihi` kolonu `devreler` tablosuna eklendi (33. oturum, 25 Nis 2026). Migration `002_devreler_durdurma_tarihi_ekle.sql`. devre_detay + devreler write/read uçtan uca tarandı, canlı test geçti (durdur → tarih dolu, kaldır → tarih null). Commit `ad9fb27`.

---

## Birikme Önleme

Bu defter güncel kalmalı. **Aynı sayfa 2. kez tarama gördüğünde:**
- Açık eksiklerin hâlâ var olup olmadığı doğrulanır (kod silinmiş/değiştirilmiş olabilir)
- Yeni eksikler eklenir
- 3+ oturumdur listede olan eksikler `🔴 BIRIKEN` etiketiyle işaretlenir, Cihat'a "bunu artık halletsek mi?" diye sorulur

---

## Sayfa Bazlı Tarama Kontrolleri

Her sayfa için Claude şu pattern'leri arar:

1. **In-memory only akışlar:** `array.push/unshift/splice` var ama Supabase insert/update yok
2. **Sessiz hatalar:** `console.warn`/`console.error` ile yutulan DB hataları (toast/audit yok)
3. **Mock placeholder'lar:** `'pending:'`, `'TODO'`, `'mock'`, `'fake'`, `null` ile kaydedilen kalıcı değerler
4. **Kod–schema uyumsuzluğu:** Insert/update/read/render'da kullanılan kolon adı schema'da yok ya da farklı (information_schema sorgusuyla doğrula — **uçtan uca**, sadece insert değil read/render dahil)
5. **UI–data kopukluğu:** UI elementi var (`<div id="...">`) ama hiçbir fonksiyon doldurmuyor
6. **Yorum kalıntıları:** `// şimdilik`, `// ileride`, `// henüz yok`, `// kolonsuz`, `// localStorage`
7. **Kapatılmış kod:** `disabled`, `display:none`, `opacity:.5` + bilinçli yorum
8. **Yanıltıcı başarı toast'ı:** Hata yutulduktan sonra "kaydedildi" toast atılıyorsa kritik (kullanıcıya yalan söylüyor) — try/catch'te toast + erken return olmalı

---

## Yan Dersler — 32. Oturumdan

1. **Deploy doğrulama tekniği:** "Yeni kod canlıda mı?" sorusunun en hızlı cevabı tarayıcı console'da `fnAdı.toString().includes('yeniEklendiSatır')`. Saat kaybetmeden cache mi/henüz yüklenmedi mi/RLS mi belirler.

2. **Schema drift uçtan uca:** S2 (foto_url/fotograf_url) ve tur/tip bug'ı aynı dersi veriyor — schema değişikliklerinde sadece insert noktasına bakmak yetmez, **read + render + map** noktaları da taranmalı. `information_schema.columns` sorgusu kolayca yazılır, drift'i kanıtlar.

3. **Vercel Hobby plan = 100 deploy/gün** — her push iki projeyi (arespipe + arespipe-mob) tetikliyorsa fiili limit 50 push/gün. Aktif çalışılan oturumlarda kolayca aşılır. `vercel.json` ignoreCommand'a `mobile/` dışındakiler için arespipe-mob'u devre dışı bırakacak kural eklenmeli (33+ önceliği).

---

**İlk yazım:** 25 Nisan 2026 — 31. oturum.
**Son güncelleme:** 25 Nisan 2026 — 32. oturum sonu.

---

## G-08 — Sayfa Açılış Ritüeli (UI/UX Standart)

> **31. oturumda Cihat tarafından eklenmiştir.** Önce devreler.html'deki mevcut akış kanıt referans alınmıştır.

### Kural

Tablo veya liste gösteren bir sayfa açıldığında:

1. **Skeleton aşaması:** Veri çekilirken kullanıcı boş ekran veya spinner görmemeli. Gerçek satır sayısına yakın (typically 15) **fake satır** shimmer animasyonuyla görünmeli. Stat kartları da aynı shimmer ile başlamalı.
2. **Cascade aşaması:** Veri geldiğinde gerçek satırlar **yukarıdan aşağı stagger** ile açılmalı (her satır arasında ~45ms gecikme). Stat kartlarındaki sayılar shimmer'dan değer'e geçmeli.

Bu pattern **görsel tutarlılık** sağlar, sayfa açılış UX'i profesyonelleşir, "veri yükleniyor mu?" şüphesi azalır.

### Teknik Spec — devreler.html referansı

**CSS gereksinimleri:**
```css
/* Skeleton shimmer */
@keyframes _skShimmer {
  0%   { background-position: -340px 0; }
  100% { background-position: calc(340px + 100%) 0; }
}
.sk {
  display:inline-block;
  background:linear-gradient(90deg, var(--bor) 0%, var(--sur2) 50%, var(--bor) 100%);
  background-size:340px 100%;
  animation:_skShimmer 1.4s ease-in-out infinite;
  border-radius:4px;
  color:transparent !important;
  vertical-align:middle;
  user-select:none;
}
.sk-num   { width:56px; height:22px; }
.sk-bar   { width:100%; height:12px; margin-top:4px; display:block; }
.sk-cell  { width:78%; height:14px; }
.sk-cell-s{ width:42%; height:14px; }
.sk-row td { padding:12px !important; }
tr.sk-row { animation:none !important; opacity:1 !important; cursor:default !important; }

/* Cascade in (yukarıdan aşağı stagger) */
@keyframes _cascadeIn { from{opacity:0;transform:translateY(-10px);} to{opacity:1;transform:translateY(0);} }
.data-table tbody tr { opacity:0; animation:_cascadeIn .22s ease forwards; }
.data-table tbody tr[data-ci="0"]  { animation-delay:0ms; }
.data-table tbody tr[data-ci="1"]  { animation-delay:45ms; }
/* ... 19'a kadar, her artı 45ms ... */
```

**JS gereksinimleri:**
```javascript
function _skRender() {
  var tbody = document.getElementById('tableBody');
  var rows = '';
  for (var i = 0; i < 15; i++) {
    rows += '<tr class="sk-row">' +
      // Sayfanın kolon sayısı kadar <td><span class="sk sk-cell"></span></td>
    '</tr>';
  }
  tbody.innerHTML = rows;
}
function _skTemizle(el) {
  if (el && el.classList) el.classList.remove('sk', 'sk-num', 'sk-bar');
}

// Veri render'ında her satıra data-ci index ekle (ilk 10 için stagger)
data.forEach(function(item, i) {
  var ci = i < 10 ? i : 10;
  rows += '<tr data-ci="' + ci + '">' + ...;
});
```

**HTML gereksinimleri:**
```html
<!-- Stat kart sayıları başlangıçta skeleton -->
<span id="stDevre" class="sk sk-num">—</span>
<span id="stSpool" class="sk sk-num">—</span>
<!-- Bar elementleri başlangıçta skeleton -->
<div class="seg-bar sk sk-bar" id="malzemeBar"></div>
```

### Envanter — hangi sayfalarda var, hangisinde yok? (31. oturum kanıtı)

**✅ Tam — sk + cascade var (4 sayfa, 14. oturumda eklenmiş):**
- `devreler.html` (referans kaynak — sk:7, cascade:23)
- `kesim.html` (sk:2, cascade:26)
- `bukum.html` (sk:2, cascade:23)
- `markalama.html` (sk:2, cascade:23)

**🟡 Yarı uygulandı (32. oturum):**
- `devre_detay.html` — kod birebir uyarlandı (CSS, helpers, HTML class'lar) ama Cihat "tam aynı değil" geri bildirimi verdi. Görsel karşılaştırma + fark tespiti 33. oturumda.

**❌ Eksik — sk:0, cascade:0 (21 sayfa, 31. oturumda taranmış):**

**🔴 Yüksek öncelik (gerçek liste sayfası — Supabase'den veri çekiyor):**
- `proje_liste.html` — proje listesi
- `proje_detay.html` — devre listesi
- `kullanicilar.html` — kullanıcı listesi
- `tanimlar.html` — sekmeli tablolar (malzeme, basamak, kategori, vs.)
- `kalite_kontrol.html` — KK davet listesi
- `sevkiyatlar.html` — sevkiyat listesi
- `testler.html` — test listesi
- `tezgahlar.html` — tezgah listesi
- `raporlar.html` — rapor liste
- `log.html` — işlem log liste
- `kurallar.html` — kural liste
- `admin/panel.html` — feedback + görev listesi (en yoğun)
- `admin/firma.html` — firma listesi
- `admin/firma-detay.html` — firma detay listeleri
- `admin/index.html` — admin dashboard

**🟡 Orta öncelik (detay sayfa — alt liste içeriyor):**
- `spool_detay.html` — foto + belge + işlem listesi
- `kullanici_detay.html` — yetki + log listesi

**🟢 Düşük öncelik (form-ağırlıklı, tablo görsel grid):**
- `devre_yeni.html` — form, tablo sayısı yüksek ama grid layout için
- `index.html` — dashboard, sadece 2 tablo
- `izometri-batch.html` — toplu işlem ekranı
- `sorgula.html` — sorgu formu

### Envanter — gerçek iş kapsamı (31. oturum tahmini)

| Öncelik | Sayfa | Tahmin |
|---|---|---|
| 🔴 Yüksek | 15 sayfa × 25 dk | ~6 saat (1.5 oturum) |
| 🟡 Orta | 2 sayfa × 30 dk | ~1 saat |
| 🟢 Düşük | 4 sayfa (gerekirse) | ~2 saat |

**Gerçekçi tahmin:** Sadece 🔴 yüksek öncelik = 1.5 oturum. 🟡 ve 🟢 ürün dönemine ertelenebilir. Önce 33. oturumda devre_detay görsel uyumsuzluğu çözülmeli, sonra yaygınlaştırma.

### Tarama komutu (her oturumda tekrarlanabilir)

```bash
cd ~/Desktop/arespipe && for f in *.html admin/*.html; do
  if [ -f "$f" ]; then
    has_sk=$(grep -c "_skShimmer\|sk-row" "$f")
    has_cascade=$(grep -c "_cascadeIn\|data-ci=" "$f")
    has_table=$(grep -c "tbody\|<table" "$f")
    if [ "$has_table" -gt 0 ]; then
      printf "%-30s tablo:%s sk:%s cascade:%s\n" "$f" "$has_table" "$has_sk" "$has_cascade"
    fi
  fi
done
```

### Önerilen plan

- **33. oturum** önce devre_detay görsel fark tespiti (Cihat "tam aynı değil" dedi, somut fark görmedik). Sonra Sentry vs G-08 yaygınlaştırma kararı (32'den devir).

### Kapsam dışı

G-08 sadece **tablo/liste gösteren** sayfalar için. Aşağıdaki sayfalarda gerekmez:
- Sadece form içeren sayfalar (giriş, kayıt, devre_yeni)
- Modal-ağırlıklı sayfalar (devre_duzenle, spool_yeni)
- Dashboard kartları (zaten stat shimmer pattern'i kullanılabilir ama tablo değil)
- Statik bilgi sayfaları (hata, 403, 404)

---

**G-08 ilk yazım:** 25 Nisan 2026 — 31. oturum, Cihat tarafından önerilmiştir.
**Güncelleme:** 25 Nisan 2026 — 32. oturum, devre_detay yarım uygulama.


---

## MSpoolDetay React Sayfası — 58. Oturum Notları

`mobile/src/screens/MSpoolDetay.jsx` (775 satır, 4 Mayıs 2026'da doğdu). Vanilla `mobile/spool_detay.html` (635 satır) port'u + MK-54.E/F/G + 58 düzeltmeleri.

### Açık eksikler (SED-58-NN)

#### SED-58-01 [BORÇ — MK-58.6] — 4 Supabase sorgusu 400 Bad Request

Vanilla'dan miras schema uyumsuzluğu. Etkilenen UI bölümleri MSpoolDetay'da boş gözüküyor:

- **Belgeler satırı** (Spool Bilgileri sonu) — `belgeler` tablosu kolon adları DB'de farklı
- **Kalite Kontrol satırı** (Spool Bilgileri) — `kk_davetler` sorgu yapısı belirsiz
- **Sevkiyat satırı** (Spool Bilgileri) — `sevkiyat_spooller` tablo/kolon belirsiz
- **İşlem Kayıtları sekmesi** — `islem_log` kolon `t_id` mi `spool_id` mi belirsiz

**Fix yolu:** Supabase SQL editor'de `information_schema.columns` ile gerçek kolon isimleri tespit, MSpoolDetay.jsx'teki sorgular düzeltilir. Detay: KARARLAR.md MK-58.6.

**Etki:** Birincil işlev (Spool Bilgileri, marka, sekmeler, n/N, Alıştırma) çalışıyor. Bu 4 alan boş ama UX kırılmıyor.

#### SED-58-02 [BORÇ — MK-58.5] — Süper admin paneli hardcoded UUID

`admin/panel.html` Mobile Önizleme sekmesi şu an tek bir test UUID hardcoded: `c79d0983-e0f3-406f-afde-bb7bc9ad92c3`. Başka spool'u önizlemek için elle URL düzenlemek gerekiyor.

**Fix yolu:** Panel'e UUID input alanı veya son N spool dropdown. Detay: KARARLAR.md MK-58.5.

#### SED-58-03 [BORÇ — MK-58.1] — spooller.alistirma enum tutarsızlığı

Aynı kolon vanilla mobile'da `tam|kismi|yok` lowercase, vanilla devre_detay.html'de `VAR|KISMI|YOK` uppercase okunuyor. MSpoolDetay defensive handler ile her ikisini kabul ediyor.

**Fix yolu:** `SELECT DISTINCT alistirma FROM spooller` ile kanonik değer tespit, lowercase'e standardize migration. Detay: KARARLAR.md MK-58.1.

#### SED-58-04 [REFAKTÖR] — Helper fonksiyonlarını lib'e taşı

MSpoolDetay'da inline 6 helper var (MDevreDetay ve diğer sayfalar da kullanacak):

- `formatSpoolId(id)` — spool ID min 4 basamak pad (MK-58.7)
- `revFmt(rev)` — rev>0 ise `Rev{n}`, yoksa boş
- `markaHesapla(sp, devre, proje)` — tam marka birleştirme (E-02 formatı)
- `nNRenkler(tamam, toplam)` — n/N renk pill class
- `formatTarih(s)`, `formatTarihSaat(s)`, `formatSure(dk)` — tarih/saat formatlama
- `alistirmaBilgi(v, tv)` — defensive enum handler (MK-58.1 çözülünce sadeleşir)

**Fix yolu:** `mobile/src/lib/format.js` doğsun. MSpoolDetay'dan import edilsin. MDevreDetay yazılmadan önce yapılmalı (ikisi de kullanır).

#### SED-58-05 [TEMİZLİK] — Kullanılmayan screen dosyaları

`mobile/src/screens/Devreler.jsx` ve `mobile/src/screens/IsBaslat.jsx` App.jsx'te route'a bağlı değil. 9-16. oturumlarda eski deneme dosyaları olabilir.

**Fix yolu:** İçeriği incele — kullanılıyor mu (başka dosyadan import ediliyor mu) kontrol et. Kullanılmıyorsa sil. Kullanılıyorsa İsim/route belirle.

```bash
grep -rn "import.*Devreler\|import.*IsBaslat" mobile/src/
```

#### SED-58-06 [TEMİZLİK] — mobile/.gitignore eksik

`mobile/.DS_Store` git'te tracked, oysa macOS sistem dosyası, gitignore'da olmalı.

**Fix yolu:**

```bash
echo ".DS_Store" >> mobile/.gitignore
git rm --cached mobile/.DS_Store
```

### Çözülen eksikler (58'de kapatıldı)

- **Topbar ID format:** Vanilla'da `spool_no` (S03, kısa) gösteriyordu. 58'de `formatSpoolId(spool_id)` ile A-XXXX formatına geçildi (MK-58.7).
- **Ağırlık desimal:** Vanilla'da raw değer (`53.755801999...`). 58'de `toFixed(1)` ile tek desimal (`53.8 kg`).
- **SPA fallback (mobile genel):** `mobile/vercel.json` yokluğunda doğrudan `/spool/:id` URL'i 404 veriyordu. 58'de rewrite eklendi, tüm mobile rotaları artık F5'lenebilir/doğrudan açılabilir.
- **Süper admin paneli mobile preview:** Eski vanilla `../mobile/spool_detay.html` yollarına gidiyordu (artık deploy'da yok). 58'de React canlı URL'lerine (`https://arespipe-mob.vercel.app/...`) güncellendi.

---

## 68. Oturum Tarama Sonuçları (7 Mayıs 2026)

### `devre_yeni.html`

#### 🟡 Açık (sonraya bırakıldı)
- **SED-68-01** — Form validation: `proje_no` ve `gemi_adi` alanlarında karışım engeli. 68b'de canlı verilerde iki proje (`NB1124`, `NB138`) için `gemi_adi` alanına em-dash + proje_no prefix yazıldığı görüldü ("NB1124 — Kargo Gemisi", "NB138 — Yük Gemisi"). Mobil üst bant kuralı (MK-68.3) sadece `proje_no` kullanıyor; ama `gemi_adi`'a yanlış format girilmesi başka ekranlarda (devre listesi, proje detayı) yanıltıcı olabilir. **Fix yolu:** `devre_yeni.html` form'unda iki kural — `proje_no` alanı `^[A-Z0-9]+$` regex (em-dash, boşluk, tire yasak), `gemi_adi` alanı em-dash içeremez ve `^NB\d+` ile başlayamaz (proje no prefix yasak). Hata mesajı: "Gemi adı sadece geminin adı olmalı, proje numarası proje no alanına gider." 68b'de iki kayıt manuel UPDATE ile temizlendi, validation eklenmezse tekrarlar.

### `mobile/src/components/isbaslat/` ekosistemi (Ib-prefix component'leri, 68b CI uyarıları)

#### 🟡 Açık (sonraya bırakıldı)
- **SED-68-02** — i18n borç temizliği. 68b CI raporu (`AresPipe Kod Kalite Kontrolü`) 1 hata + 80 uyarı tespit etti. Hata düzeltildi (MK-68.2'de `#22c55e` → `var(--gr)`), 6 uyarı kapatıldı (`m_ib_uy_yu_*` 6 anahtar tr/en/ar üçüne eklendi). **~75 uyarı hâlâ açık** — `tv()` çağrısında kullanılan ama lang dosyalarında olmayan anahtarlar:
  - `IbQRTara.jsx` — 3 anahtar (`m_ib_uy_ct_*`)
  - `IbUyariDrawer.jsx` — 16 anahtar (`m_ib_uy_ct_*`, `m_ib_uy_de_*`, `m_ib_uy_ab_*`)
  - `IbSpoolDetay.jsx` — kalan ~25 anahtar (`m_ib_sd_*`, `m_ib_sd_g_*`)
  - `izometri-batch.html` — 18 anahtar (`izb_*` web tarafı)
  - `spool_detay.html` — 9 anahtar (`flansh_*`)
  - `MDevreDetay.jsx` — 1 anahtar (`mob_filtre_temizle`)
  - `devre_detay.html` — 1 hardcode renk benzeri uyarı (`G03_HAM_YUZEY` esc(x.yuzey))

  Şu an hepsi `tv()` fallback ile çalışıyor (UI bozulmuyor, sadece i18n disiplini kırık). Deploy'u kesmiyor. **Fix yolu:** Her dosya için eksik anahtarlar tespit edilir, fallback string'leri tr/en/ar'a yazılır. Tek seferde toplu patch (3 lang dosyası + N JSX/HTML değişikliği yok, sadece JSON ekleme).

### CI ve push akışı

#### 🟡 Açık (sonraya bırakıldı)
- **SED-68-03** — CI bot push rebase çakışması. `AresPipe Kod Kalite Kontrolü` workflow'u her push sonrası `.github/ci-son-rapor.json` dosyasını güncelleyen bir `[skip ci]` rapor commit'i atıyor. 68b push'unda iki paralel commit (kullanıcı push'u + bot rapor commit'i) çakıştı, bot tarafında rebase fail oldu (`CONFLICT (content): Merge conflict in .github/ci-son-rapor.json`). Workflow `Error: Rebase başarısız — manuel müdahale gerek` ile sonlandı. Deploy'u kesmiyor (Vercel paralel çalışıyor) ama log'da kirlilik bırakıyor. **Fix yolu:** Workflow'da fetch + rebase loop'u (3-5 deneme) veya farklı strateji — rapor commit'ini `force-with-lease` ile push, ya da farklı branch'e (`ci-reports`) yazıp ana branch'i etkilemeyen pattern. Detay araştırma 69'a.

---


## 69. Oturum Tarama Sonuçları (9 Mayıs 2026)

### `fotograflar` tablosu / web upload akışı

#### 🟡 Açık (sonraya bırakıldı)
- **SED-69-01** — `fotograflar.islem_turu` web upload UI'sından NULL geliyor. 69. oturum 3b'de mobile foto carousel canlı testinde A-0575 spool'unda 2 foto vardı ama her ikisinin `islem_turu` alanı NULL. Mobile carousel meta chip'i `m.tv('m_ib_foto_islem_' + islem_turu, ...)` ile lokalize ediyor; NULL geldiğinde fallback olarak chip sadece "Yükleyen · Tarih" gösteriyor (degraded gracefully). **Fix yolu:** Web `spool_detay.html`'in foto upload akışında (muhtemelen `fotoUpload` veya benzeri fonksiyon) form alanına/event handler'a `islem_turu` zorunlu seçim eklenmeli (kesim/bukum/markalama/kk/genel — mobile zaten bu enum'u tanıyor, `m_ib_foto_islem_*` anahtarları kök lang'de var). Mevcut NULL kayıtlar için ya manuel `'genel'` UPDATE'i ya da migration ile düzeltme.

### `mobile/` predev script disiplini

#### 🟡 Açık (sonraya bırakıldı)
- **SED-69-02** — Mobile predev script bypass kolaylığı. `npm run dev` çalıştırıldığında `predev` script lang dosyalarını kök `lang/`'tan `mobile/src/lang/`'a kopyalıyor (MK-62.3 + MK-68.5 disiplini). Ancak geliştirici doğrudan `vite` çağırırsa veya VS Code/IDE entegrasyonundan başlatırsa predev atlanıyor → `mobile/src/lang/` boş kalıyor → import error (lang dosyaları bundle'a girmiyor). 69. oturumda Cihat'ın bu durumu yaşadığına dair işaret yok ama disiplin yapısal olarak kırılgan. **Fix yolu:** İki seçenek — (a) Vite plugin yazıp `dev` config'inde her başlangıçta lang kopyalamayı tetikle (predev script gerek yok); (b) CLAUDE-MOBILE.md'ye uyarı + `mobile/.env.example` dosyası eklenirken yanına README satırı (her zaman `npm run dev` çağır). Seçenek (a) daha sağlam.

### Mobile Vercel deploy mimarisi

#### 🟢 Belgelendi (canlı disiplin)
- **SED-69-03** — `arespipe-mob` mobile project'te kök `api/` klasörü yok, cross-origin endpoint pattern. 69. oturum 3b-fix3'te yaşandı: mobile build'de `arespipe-mob.vercel.app` domain'i, repo kökündeki `api/` Vercel serverless fonksiyonlarını **görmez** (mobile project root'u `/mobile`, kök `api/` kapsamı dışı). Mobile'ın endpoint çağrıları cross-origin olarak `arespipe.vercel.app/api/*`'a gider. Bu endpoint'lerin CORS header'ı zaten açık (`Access-Control-Allow-Origin: '*'`). Disiplin: yeni mobile endpoint çağrısı eklerken `VITE_API_BASE` üzerinden absolute URL kullan, relative path kullanma. Bu durum MK-69.1 (env var disiplini) ile birlikte belgelendi. **Aktif iş gerektirmiyor** ama yeni geliştiriciler için CLAUDE-MOBILE.md'ye satır eklenmeli — mobile/web Vercel projeleri ayrı, api/ web project'inde.

### `IbQRTara.jsx` + `IbUyariDrawer.jsx` (sertifika konusu)

#### 🟡 Açık (sonraya bırakıldı, saha kritik)
- **SED-69-04** — QR okutunca sertifikalı malzeme uyarısı. 69. oturum 3c'de Cihat saha senaryosunu açıkladı: bazı spool'larda gemi gövdesi gibi MTC/3.1 sertifikası gerektiren malzemeler kullanılıyor (`spool_malzemeleri.sertifikali=true`, BOM'da baştan tanımlı, mühendislik kararı). Operatör QR okuttuğunda bu spool'da sertifikalı malzeme olduğunu **bilgilendirici uyarı** olarak görmeli — yanlış malzeme kullanmasın. Akış-kesici değil (operatör hâlâ işe başlayabilir). **Fix yolu:** `IbUyariDrawer.jsx`'e yeni bir yumuşak kart tipi eklenir (sarı zemin, "Bu spool sertifikalı malzeme içeriyor" başlık + malzeme listesi + uyarı metni). `IbQRTara.jsx`'in `handleScan` callback'i bu spool'un `spool_malzemeleri` tablosunda `sertifikali=true` satırı var mı kontrol eder, varsa drawer'a sarı kart bağlar (mevcut not kartı pattern'iyle aynı). Yeni i18n: `m_ib_uy_yu_sert_baslik`, `m_ib_uy_yu_sert_mesaj` × 3 dil = 6 anahtar.

### Spool sertifika evrak yükleme akışı

#### 🟡 Açık (büyük iş, sonraki oturumlar)
- **SED-69-05** — Spool sertifika evrakı yükleme akışı. Cihat'ın saha bağlamı: sertifikalı malzeme kullanılan spool'larda **sertifika evrakı (PDF/fotoğraf)** spool'a yüklenmeli. Devre imalatı bittiğinde tüm spool sertifikaları + diğer kalite belgeleri tek bir **devre kalite dosyası** olarak agregate edilecek (müşteriye teslim edilen kalite paketi). **Fix yolu:** Çok aşamalı iş — (a) `belgeler` tablosu kontrolü/oluşturma (tip='sertifika' ayrımı, spool_id + tenant_id), (b) IbSpoolDetay'da yeni "Belgeler" sekmesi VEYA Malzeme kartında "+ sertifika ekle" butonu, (c) Foto/PDF upload akışı (yeni `lib/yukle.js` helper, MK-69.2 muadili), (d) Devre detayında agregat görüntü ("Bu devrenin N spool'undan M sertifika yüklü"), (e) Devre imalatı bitirildi flag'i + kalite dosyası export (PDF birleştirme, uzun vadeli). Bu işin tamamı tek oturumda olmaz, parça parça gelir. 70'te belki sadece (a) + (b) aşamaları + temel upload.


## 70. Oturum Tarama Sonuçları (9 Mayıs 2026)

### Kapatılan eksikler (70'te)

#### ✅ SED-69-04 — KAPATILDI (70 3d-fix2)
QR okutunca sertifikalı malzeme uyarısı `IbUyariDrawer.jsx`'e yumuşak sarı/mavi kart olarak eklendi (3d-fix2, commit `da93bf1`). Spool'un `spool_malzemeleri` tablosunda `sertifikali=true` satır varsa drawer'a "Bu spool'da sertifikalı malzeme var" başlıklı kart bağlanır (sertifikalı sayı + ilk 3 kod gösterimi). 4 ayrı renk grubu (alıştırma kırmızı, sertifika mavi, test mor, not amber). Akış-kesici değil — bilgilendirici. Saha test ✅.

### `mobile/src/components/isbaslat/IbSpoolDetay.jsx` ekosistemi (70b.A persistence)

#### 🔴 KRİTİK — Saha doğrulaması bekleyen
- **SED-71-01** — 70b.A saha doğrulaması (RLS fix sonrası). 70'in son saatinde keşfedildi: `is_kayitlari` tablosunun eski `tenant_isolation` policy'si silent INSERT fail üretiyordu (subquery RLS chaining + `with_check NULL`). Manuel SQL fix Supabase Studio'da uygulandı (DROP `tenant_isolation` + CREATE `is_kayitlari_tenant` `get_tenant_id()` pattern), policy doğrulandı (`pg_policies` SELECT'i temiz). Ama Cihat henüz yeni İşe Başla testini yapmadı, RLS fix sonrası `is_kayitlari` INSERT'in gerçekten çalıştığı doğrulanmadı. **Test sırası:** (1) iPhone Safari → Settings → Safari → Clear History and Website Data; (2) demo.imalatci@arespipe.dev / Demo1234! ile giriş; (3) bekleyen yeni spool seç (mevcut 6 yetim devam_ediyor olanları DEĞİL) → İşe Başla; (4) Supabase Studio: `select * from is_kayitlari order by olusturma desc limit 3` → yeni satır görünmeli, `bitis=NULL`, `personel_id='9aecf3aa-2e99-448b-9a06-7611bf5940dc'`, `qr_baslangic=true`. Eğer hâlâ "no rows" dönerse derinlemesine debug (console hataları, RLS başka kolon, vb.). **71'in birinci işi.**

### `migrations/` klasörü

#### 🔴 KRİTİK — Repo'ya migration eklenmeli
- **SED-71-02** — RLS migration repo'ya. 70'te manuel uygulanan `is_kayitlari` policy değişimi (DROP `tenant_isolation` + CREATE `is_kayitlari_tenant` `get_tenant_id()` pattern) repo'da yok. Staging/prod ortamlarında bu RLS bug tekrarlayacak. **Fix yolu:** `migrations/034_is_kayitlari_rls_get_tenant_id.sql` (033'ten sonra, MK-66.1 sıralı disiplini). Header: tarih + oturum 70 + amac (silent INSERT fail düzeltmesi) + idempotent (DROP IF EXISTS + CREATE). 71'in ikinci işi.

### `mobile/src/components/isbaslat/IbSpoolDetay.jsx` 3f.1 (saha doğrulaması bekleyen)

#### 🟡 Saha doğrulaması bekleyen
- **SED-71-03** — 3f.1 saha doğrulaması (70b.A test edildikten sonra). 70b.A pattern (UPDATE `bitis` + `sure_dakika` hesaplanmış) RLS fix sonrası 3f.1 İşi Kapat akışında doğrulanmalı. **Test sırası:** (1) SED-71-01 başarılıysa açılan spool'da "İşi Kapat" → "Tamam, kapat"; (2) Hub'a yönlendiriliyorsa Supabase Studio: `select bitis, sure_dakika from is_kayitlari order by olusturma desc limit 3` → en üst kayıt `bitis IS NOT NULL`, `sure_dakika > 0` (gerçek hesap, eski 3f.1'de hep 0 yazılıyordu). 71'in beşinci işi.

### Web `is_baslat.html` (saha kritik bug)

#### 🟡 Açık (web tarafı fix)
- **SED-71-04** — `is_baslat.html` `is_kayitlari` INSERT yanlış kolon adlarıyla yazıyor (satır 1517 civarı):
  ```js
  // Web kodu — fail ediyor (silent):
  {
    kullanici_id: oturum.id,         // DB'de: personel_id
    basamak:      _seciliBasamak.x,  // DB'de: islem_tipi
    tarih:        new Date().toIso() // DB'de: baslangic (NOT NULL)
  }
  ```
  DB schema'da bu kolon adları yok. NOT NULL ihlaliyle silent fail. Web tarafı `/* opsiyonel */` yorumuyla try/catch yutuyor — bu yüzden web tarafı muhtemelen `is_kayitlari` tablosuna **hiç** kayıt yazmamış. **Fix yolu:** `is_baslat.html`'in `isTamamla` fonksiyonunda (satır 1480-1620) INSERT pattern düzeltilmeli — kolon adları DB schema'ya göre (`personel_id`, `islem_tipi`, `baslangic`, `bitis`, `sure_dakika`, `qr_baslangic`, `qr_bitis`). Mobile zaten doğru yazıyor (3f.1 + 70b.A). Web fix'inden sonra `is_kayitlari` web girişlerinden de dolmaya başlar — log/rapor sayfaları için kritik.

### Web `devre_detay.html` (saha kritik bug — UI mismatch)

#### 🟡 Açık (web tarafı fix)
- **SED-71-05** — `devre_detay.html` tablo `durum` kolonunu okuyor, `is_durumu`'nu görmüyor. DB'de iki ayrı kolon var: `is_durumu` (text NOT NULL default 'bekliyor', mobile + 70b.A pattern yazıyor) ve `durum` (text nullable, eski sistem kalıntısı, web okuyor). 70 sonu DB sorgusu kanıtladı: 6 spool `is_durumu='devam_ediyor'` ama hepsinin `durum='Bekliyor'` — web tarafı `durum` okuduğu için mobile UPDATE'lerini görmüyor. **Saha gözlemi (Cihat 70):** A-000585 web'de "İmalat" görünüyordu (aktif_basamak'tan), A-000577 hâlâ "Bekliyor" — ikisinin de `is_durumu='devam_ediyor'`, ama web `durum`'a bakıyor. **Fix yolu:** `devre_detay.html` ve diğer web tablolarındaki spool durum render'ları `is_durumu` kolonunu okuyacak şekilde düzeltilir. `durum` kolonu deprecation kararı ayrı (ya kaldırılır, ya is_durumu sync trigger'ı yazılır). Mobile zaten doğru kolonu yazıyor.

### DB temizlik (test artığı)

#### 🟢 Küçük — opsiyonel temizlik
- **SED-71-06** — 6 yetim `is_durumu='devam_ediyor'` spool. 70'te oluşan test artıkları, RLS bug yüzünden `is_kayitlari` kayıtsız kaldılar. Manuel SQL ile temizlenebilir:
  ```sql
  UPDATE spooller
  SET is_durumu = 'bekliyor', guncelleme = now()
  WHERE is_durumu = 'devam_ediyor'
    AND tenant_id = '00000000-0000-0000-0000-000000000001'
    AND id NOT IN (SELECT spool_id FROM is_kayitlari WHERE bitis IS NULL);
  ```
  71 saha doğrulaması (SED-71-01) için bu spool'lar engelleyici değil (yeni Bekliyor spool'la test edilebilir), ama temiz başlangıç için 71 başında çalıştırılabilir.

---
