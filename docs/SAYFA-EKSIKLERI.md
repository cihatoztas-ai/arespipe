# Sayfa Eksikleri Defteri

> **Amaç:** Bir sayfa Claude'a herhangi bir görev için geldiğinde tespit edilen yarım/eksik akışları **birikmeden** kayda geçir, **görünür** tut, oturum sonu Cihat'a sun, priority kararı sende kalsın.
>
> **Kural adı:** SED-01 — Sayfa Eksik Defterini Tut. Detay: `kurallar.json`.
>
> **Format:** Her sayfa için açık eksikler ✅ kapatılan kayıtla birlikte. Aynı eksik 3+ oturumdur açıksa Claude proaktif uyarır: "şu eksik X oturumdur listede".

---

## 31. Oturum Tarama Sonuçları (25 Nisan 2026)

### `spool_detay.html`

#### ✅ Kapatıldı (31. oturum)
- **S2** — `egitim_verisi` insert'inde kolon adı bug (`foto_url` → `fotograf_url`). Schema sorgusu doğruladı, kod tek kelime düzeltildi. Spool AI eğitim verisi artık gerçekten kayıt ediliyor (vizyon kazanımı).

#### 🟡 Açık (sonraya bırakıldı)
- **S1** — `belgeKaydet` fonksiyonu (satır 2553) Supabase'e yazmıyor, sadece `BELGELER.unshift()` in-memory. "Kaydedildi" toast'ı yalan, sayfa yenilenince kayıp. **Veri kaybı riski.** Tahmin: 15-20 dk fix. Ürün dönemi (35+) iş.
- **S3** — AI toolbar gizli (satır 1562) — bilinçli, "Lambda hazır olunca açılacak". Spool AI faz planına bağlı.
- **S4** — QR indirme (satır 1989) — bilinçli yarım, NOT-02 referansıyla biliniyor.

### `devre_detay.html`

#### ✅ Kapatıldı (31. oturum)
- **D1** — `spoolEkleKaydet` Supabase'e yazıyor şimdi. Optimistic UI + rollback pattern. Veri kaybı riski kapatıldı.
- **D2** — `durdurKaydet` ve `durdurmaKaldir` `devreler.durum` + `durdurma_sebebi` UPDATE yapıyor. Optimistic UI + rollback. Yanıltıcı banner sorunu kapatıldı.

#### 🟡 Açık (sonraya bırakıldı)
- **D3** — `tersaneIsEmriKaydet` DB'ye yazmıyor (satır 1465) — kod yorumu: *"tersane_is_emri kolonu DB'de yok — sadece localStorage'da tut"*. **DB schema migration gerekir** — kolonu ekle, kodu güncelle. Tahmin: 30 dk + test. Schema değişikliği nedeniyle migration runner ile birlikte (34. oturum) yapılmalı.
- **D4** — KK & Sevkiyat listeleri UI'da hiç dolmuyor (`kkListe`, `sevkListe` divleri 394, 398). Davetler/sevkiyatlar DB'ye yazılıyor ama geri okuma yok, kullanıcı "kaydedildi mi?" şüphesinde kalıyor. Tahmin: 30-45 dk yeni `kkDavetlerYukle` + `sevkiyatlarYukle` fonksiyonları + render. Ürün dönemi (35+).
- **D5** — `belgeKaydet` (`pending:` placeholder, satır 1745) — bucket'a hiç yüklemiyor. spool_detay'daki S1 ile aynı mantık ama belgeler için. 30+ dk. Ürün dönemi (35+).
- **D6** — 8+ sessiz `console.warn` — DB hataları kullanıcıya bildirilmiyor (devreYukle, spoolYukle, spoolGuncelle, spoolDurdur, vs.). Audit log entegrasyonu + toast bildirimi. Tahmin: 20-30 dk. 36+ ürün dönemi (audit log pano sekmesi gündemiyle birlikte).

#### 🟡 Bonus eksik tespiti (Eksik 31. oturumda kapsama girmedi ama görüldü)
- **D7** — `durdurma_tarihi` kolonu `devreler` tablosunda **yok** (`spooller`'da var). Devre durdurma tarihi takip edilemiyor. Audit/raporlama için eksik. D3 ile birlikte schema migration paketinde (34. oturum).

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
4. **Kod–schema uyumsuzluğu:** Insert/update'te kullanılan kolon adı schema'da yok (information_schema sorgusuyla doğrula)
5. **UI–data kopukluğu:** UI elementi var (`<div id="...">`) ama hiçbir fonksiyon doldurmuyor
6. **Yorum kalıntıları:** `// şimdilik`, `// ileride`, `// henüz yok`, `// kolonsuz`, `// localStorage`
7. **Kapatılmış kod:** `disabled`, `display:none`, `opacity:.5` + bilinçli yorum

---

**İlk yazım:** 25 Nisan 2026 — 31. oturum. Cihat'ın "her sayfa geldiğinde bir eksik kapatılmış olsa hem hissetmezdik hem de böyle birikme olmazdı" gözlemi sonrası kuruldu.

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
/* ... 9'a kadar, her artı 45ms ... */
```

**JS gereksinimleri:**
```javascript
// Sayfa yüklenir yüklenmez (DOMContentLoaded veya benzeri)
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

// Veri geldiğinde stat sayıları için
function _animCount(el, hedef, opt) {
  if (!el) return;
  // ... format ...
  _skTemizle(el);
  el.textContent = formatted;
}

// Veri render'ında her satıra data-ci index ekle (ilk 10 için stagger)
data.forEach(function(item, i) {
  var ci = i < 10 ? i : 10; // 10+ satır anında gelir, sadece ilk 10 stagger
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

**❌ Eksik — sk:0, cascade:0 (22 sayfa, 31. oturumda taranmış):**

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
- `devre_detay.html` — spool tablosu, doküman, not, KK/sevk
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
| 🟡 Orta | 3 sayfa × 30 dk | ~1.5 saat |
| 🟢 Düşük | 4 sayfa (gerekirse) | ~2 saat |

**Gerçekçi tahmin:** Sadece 🔴 yüksek öncelik = 1.5 oturum (örn. 32 + 33). 🟡 ve 🟢 ürün dönemine ertelenebilir.

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

### Tahmini iş kapsamı

| Kapsam | Tahmin |
|---|---|
| Tek bir sayfaya G-08 ekleme | 20-30 dk |
| Eğer sayfa zaten varsa (sadece eksikse) | 10-15 dk |
| 10 sayfa × 25 dk | ~4 saat (1 oturum) |

### Önerilen plan

- **32. veya 33. oturum** gündem değişikliği önerisi: Sentry yerine **G-08 yaygınlaştırma**
- Veya: 32 hâlâ Sentry, 35 ürün dönemi ortasında G-08 sıkıştırılır
- Karar Cihat'ta — kapanış toplantısında konuşulmalı

### Kapsam dışı

G-08 sadece **tablo/liste gösteren** sayfalar için. Aşağıdaki sayfalarda gerekmez:
- Sadece form içeren sayfalar (giriş, kayıt, devre_yeni)
- Modal-ağırlıklı sayfalar (devre_duzenle, spool_yeni)
- Dashboard kartları (zaten stat shimmer pattern'i kullanılabilir ama tablo değil)
- Statik bilgi sayfaları (hata, 403, 404)

---

**G-08 ilk yazım:** 25 Nisan 2026 — 31. oturum, Cihat tarafından önerilmiştir.
