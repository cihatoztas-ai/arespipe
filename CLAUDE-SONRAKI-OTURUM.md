# Sonraki Oturum İçin Gündem

**Hazırlanma tarihi:** 20 Nisan 2026 (5. oturum sonu)
**Son durum:** Malzeme-yüzey uyum sistemi tamamlandı — matris + CHECK constraint + fark tespit popup + yüzey "Diğer" + yuzey_aciklama kolonu. Generic diff framework gelecekte yeni alanlara genişletilebilir.

---

## Başlarken — Yeni Sohbete Yükle

Yeni sohbet açınca şu 4 dosyayı yükle:
1. `CLAUDE.md` — ana proje bağlamı (mimari kurallar, DB şema, oturum arşivi Bölüm 11'de)
2. `CLAUDE-MOBILE.md` — mobil React uygulamasının kuralları
3. `CLAUDE-SONRAKI-OTURUM.md` — bu dosya (öncelikli iş listesi)
4. `CLAUDE-SON-OTURUM.md` — en son oturumun deploy/test özeti

---

## Öncelik 1 — spool_detay.html Kolon Adları (EN KRİTİK)

**Sorun:** 78 yanlış referans → sessiz bug'lar. CLAUDE.md'deki "kritik kolon adları" listesinde dokümante, ama kodda eski isimler.

### Düzeltmeler
- `cap_mm` → `dis_cap_mm` (18 kez)
- `et_mm` → `et_kalinligi_mm` (25 kez)
- `agirlik_kg` → `agirlik` (8 kez)
- `yapan_id` → `ekleyen_id` (6 kez — notlar tablosu için)
- `url` → `dosya_url` (21 kez — fotograflar için, dikkatli replace!)

**Süre tahmini:** 1-2 oturum (her değişiklik kullanıcı tarafından test edilmeli)

---

## Öncelik 2 — devreler.malzeme Legacy Format Migration

**Sorun:** 4. oturumda `spooller.malzeme` + `spool_malzemeleri.malzeme` canonical'e çekilmişti ama `devreler.malzeme` atlanmış. 5. oturumda keşfedildi.

Şu an DB'de:
```
devreler.malzeme = "Karbon Çelik", "Paslanmaz", "Bakır Alaşım"
                   (Türkçe, kirli)
```

Olması gereken:
```
devreler.malzeme = "karbon", "paslanmaz", "bakir", "alum", "diger"
                   (canonical)
```

Okuma tarafı (ARES_NORM) Türkçe'yi otomatik normalize ediyor, ekranda görünmez — ama DB temiz değil.

### Migration SQL

```sql
-- Önce dağılım
SELECT malzeme, COUNT(*) FROM devreler 
WHERE silindi = false 
GROUP BY malzeme;

-- Sonra canonical'a çek
UPDATE devreler SET malzeme='karbon'     WHERE malzeme IN ('Karbon Çelik','karbon_celik');
UPDATE devreler SET malzeme='paslanmaz'  WHERE malzeme IN ('Paslanmaz');
UPDATE devreler SET malzeme='bakir'      WHERE malzeme IN ('Bakır Alaşım','bakir_alasim');
UPDATE devreler SET malzeme='alum'       WHERE malzeme IN ('Alüminyum','aluminyum');

-- Yuzey de gözden geçir
SELECT yuzey, COUNT(*) FROM devreler WHERE silindi = false GROUP BY yuzey;
```

**Süre tahmini:** 1 saat (sadece SQL, frontend dokunulmaz)

---

## Öncelik 3 — devre_yeni.html `devreler.yuzey_aciklama` Yazımı

**Sorun:** 5. oturumda `devreler.yuzey_aciklama` kolonu eklendi ama **devre_yeni.html sadece spool'lara yazıyor, devreye yazmıyor**. devre_duzenle.html yazıyor. Tutarsızlık.

### Yapılacak
`devre_yeni.html` → `kaydet()` içinde `supa.from('devreler').insert({...})` bloğuna:
```js
yuzey_aciklama: (yuzeySecili === 'diger') ? yuzeyAciklama : null,
```

Tek satır ekleme. **Süre:** 5 dakika.

---

## Öncelik 4 — devreler.html Excel Export'ta Ölü `d.durum`

**Sorun:** 5. oturumda durum sütunu UI'dan kaldırıldı ama Excel export'ta hâlâ `d.durum` var:

```js
liste.forEach(function(d) { 
  rows.push([d.isEmri, d.tersane, d.gemi, d.devre, d.zone, d.spool, 
             Math.round(d.agirlik), d.ilerleme, d.durum, d.sonIslem]); 
});
```

Tüm kayıtlarda "aktif" olacağı için Excel'de bilgi vermiyor. Kaldırıp başlığı da güncelle.

**Süre:** 10 dakika.

---

## Öncelik 5 — Dil Dosyası Ölü Anahtar Temizliği

**Sorun:** 5. oturumda DURUM_MAP kaldırıldı ama dil anahtarları durdu:
- `cmn_aktif` — DURUM_MAP'in fallback'iydi
- `cmn_th_durum` — tablo başlığı
- `dr_status_notstarted`, `dr_status_production`, `dr_status_qc`, `dr_status_ready`
- `dr_all_statuses` — filter dropdown

Kullanılmıyor (başka HTML'de grep'lenmeli kesin karar için).

### Yapılacak
```bash
# Her anahtar için tüm HTML/JS/JSX'lerde arama
grep -r "cmn_aktif" *.html mobile/src
# Hiç kullanım yoksa → 3 dil dosyasından kaldır
```

Ayrıca **i18n linter script'i** (Öncelik 9, 4. oturum gündeminden) — otomatik ölü anahtar tespiti:
- `scripts/i18n-check.js`
- GitHub Actions workflow

**Süre:** Linter ile 1 oturum; manuel taramayla 30 dakika.

---

## Öncelik 6 — Mobil: MProfil.jsx

**Neden önce MProfil:**
- MDrawer'daki "Profili Düzenle" döngüsü tamamlanmamış (`/profil` route var, sayfa yok)
- Avatar upload feature `kullanicilar.foto_url` kolonu hazır bekliyor
- Küçük, odaklanmış iş (mockup-first kuralıyla)

**Yapılacak:**
- MProfil.jsx ekranı mockup-first
- Avatar upload (Supabase Storage `arespipe-dosyalar` bucket'ı)
- ad_soyad, tel, brans, firma editing
- ui_tercihleri JSONB alanı kullanımı

**Süre:** 1 oturum

---

## Öncelik 7 — Mobil: MIsBaslat + Zaman Takibi

(4. oturum gündeminden devam — değişmedi)

Önce DB şema araştırması (is_kayitlari, kesim/bukum/markalama kalemleri zaman alanları), sonra mockup, sonra kod.

**Süre:** 2-3 oturum

---

## Öncelik 8 — Diğer Sayfaların Enum + Kolon Adı Refactor'ü

4. oturumda bazı sayfalar ARES_NORM'a bağlandı ama şunlar taranmadı:
- `bukum.html`
- `sevkiyat.html`
- `kalite_kontrol.html`
- `raporlar.html` (agregasyon varsa çok önemli)
- `devre_detay.html` (Supabase entegrasyonu geldiğinde)

Her sayfada:
1. `grep -E "malzeme|yuzey|_normalize|cap_mm|et_mm"` tara
2. ARES_NORM'a bağla
3. Kolon adı düzeltmeleri (Öncelik 1'in benzeri)

**Süre:** 2-3 oturum

---

## Öncelik 9 — Ortak Modüller Çıkarma

**Sorun:** spool_detay.html 132 fonksiyon, çoğu diğer sayfalarla kopya

**Yapılacak:**
- `ares-spool.js` — spool ortak fonksiyonları (kesim/büküm/kaynak iş yönetimi)
- `ares-devre.js` — devre hesaplama, filtre, sıralama
- `ares-ui.js` — ortak UI helper'ları (badge render, alert, modal)
- `ares-normalize.js` ✅ bitti (3+4+5. oturumlar)

**Süre:** 2-3 oturum

---

## Kesinlikle BU OTURUMDA YAPILMAYACAKLAR

- [ ] `_status.json` i18n yönetimi — Freeze & Translate stratejisi benimsendi
- [ ] spool_detay.html yeniden yazma — büyük iş, revizyon geldiğinde yapılacak
- [ ] Admin paneli enum yönetim ekranı — gereksiz (4. oturumda karar verildi)

---

## Kural Hatırlatmaları (Bir Sonraki Oturum için Claude'a)

- **Toplu silme/değişiklik yapmadan önce dry-run + kullanıcı onayı**
- **Tarama kapsamı:** HTML + JS + JSX hepsi birlikte
- **Mockup-first (R-10):** Yeni mobil ekran yazılmadan önce artifact mockup + onay
- **Tema için useTema (R-09):** Direct DOM manipulation yasak
- **Enum için ARES_NORM (E-01):** Malzeme/yüzey/durum her zaman ARES_NORM'dan
- **Malzeme-yüzey uyum (E-02, 5. oturum):** ARES_NORM.uyumlu + ARES_NORM.uyumluYuzeyler — form validation + DB CHECK constraint
- **Kolon adı uyumu:** Her Supabase query'sinden önce şema referansına bak
- **"Sadece X" istendiğinde sadece X verilir** — hepsini toplu verme

### 5. Oturum Dersleri

**"Tamamlandı" tamamlandı mı?** 4. oturumun özeti "Faz 2 migration bitti" diyordu ama `aluminyum → alum` dönüşümü gözden kaçmış. DB'de 83 kayıt hâlâ eski formatta. **Ders:** Oturum özeti ne derse desin, DB'yi tekrar sorgula.

**İnsertion-order baz alma kırılgandır.** `Object.keys({...})[0]` sırasına güvenip "baz malzeme" diye seçmek çalışır gibi görünür ama farklı tarayıcılarda/senaryolarda terslenir. Çoğunluk-baz (sayım + max) matematiksel olarak belirsizlik içermez.

**Generic framework scope'u büyütür.** Fark tespit popup başlangıçta sadece malzeme üzerineydi. Kullanıcı "her alan" deyince yapısal hâle geldi. Şu an 2 alan destekliyor ama 10+ alana kolayca genişler. Gelecekte yeni kural eklemek ucuz.

**Grace period UX dostu çözümdür.** Mevcut verisi uyumsuz olan formda radio'ları zorla değiştirmek şaşırtıcı olur. `_formHazir` flag'i ile sadece kullanıcı eylemi olduğunda kural işler.

---

## Strateji Özeti (Değişmedi)

**3 Katmanlı Hibrit Yaklaşım:**
- **Katman 1:** Altyapı düzeltmeleri (script ile toplu) — dil sistemi ✅, kolon adları ⏳ (Öncelik 1), enum normalize ✅, uyum kontrolü ✅
- **Katman 2:** Revizyon geldikçe sayfa yeniden yaz — strangler fig pattern
- **Katman 3:** Küçük çalışan sayfalar dokunulmaz

**Dil Stratejisi: Freeze & Translate**
- Proje stabil olunca `tr.json` freeze
- Profesyonel translator / CAT tool
- Direkt kullan, admin panel yok

**Enum Stratejisi: Kod bazlı DB + tv() wrapper** ✅ TAMAMLANDI
- DB'de kod saklanır ✅
- ARES_NORM modülü ham ↔ kod ↔ etiket dönüşümlerini tek yerden yönetir ✅
- Kanonik liste kilitli: 5 malzeme + 5 yüzey ✅
- **Uyum matrisi kilitli** (5. oturum) ✅
- Yeni tür eklerken: (1) ARES_NORM regex'e sinonim (2) 3 dil dosyasına `cmn_*` anahtarı (3) Radio seçeneği (4) Gerekirse uyum matrisine satır/sütun

---

## Son Söz

5. oturumda üç büyük iş bitti: uyum matrisi, fark tespit popup, devreler.html refactor. DB temiz (aluminyum düzeltildi, uyumsuz kayıtlar asit'e çekildi, CHECK constraint aktif). Yeni kayıtlar doğru format yazıyor ve uyum kurallarına zorunlu uyuyor.

**Sıradaki en kritik iş — Öncelik 1:** spool_detay.html kolon adları. 78 yanlış referans, sessiz bug. Sonra Öncelik 2 (devreler.malzeme migration, 1 saat). Sonra mobil MProfil.jsx ile nefes al.

İyi çalışmalar. 🚀
