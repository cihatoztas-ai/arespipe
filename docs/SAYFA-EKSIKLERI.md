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
