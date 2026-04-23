# AresPipe — 22. Oturum Gündemi

## 🗺️ Oturum Öncesi Not — Uzun Vadeli Plan Onayı

**22. oturuma girmeden, 21. oturum sonunda AresPipe'ın uzun vadeli yol haritası üzerinde mutabakata varılmıştır.**

Detay: `docs/ROADMAP.md`. Özet:
- Hedef: 1-2 yıl içinde çoklu tersane/firma SaaS
- Faz A (22, 25, 26): Malzeme sistemi tamamlanması — **22 ŞU ANDA**
- Faz B (23, 24): Altyapı güvencesi — dosya mimarisi + lint + şablon + mevcut kod temizliği
- Faz C (27, 28, 29): SaaS hazırlığı — tenant izolasyon + performans + rollback

**22. oturum Faz A'nın bir parçası** — Admin UI eklenerek malzeme sistemi işlevsel olarak tamamlanacak. 23. oturumda **Faz B başlayacak** (altyapı yatırımı), oradan sonra kod mimari disiplinine geçilecek.

Bu bağlam önemli çünkü 22. oturumda yazılan her kodun 23-24. oturumda lint'ten geçeceğini biliyoruz. Bu yüzden 22. oturumda yazılan tüm yeni kodlar (admin UI'nın yaklaşık 300-500 satırı) **G-01, G-02, G-03, B-01, E-01 kurallarının hepsine baştan uyumlu** olmalı. Üstelik sonradan lint geldiğinde yeni ihlal çıkmamalı.

---

## Oturum Başı Ritüeli
1. **CLAUDE.md oku** — özellikle:
   - Bölüm 2.13 → E-01 + E-06 Master Tablo (sistem tanıdığı)
   - Bölüm 2.18 → **G-03 Render Standardı** (21. oturumda formalleştirildi — yeni sayfalar bu kurala tabi)
   - Bölüm 4 → `malzeme_tanimlari` şeması ve RLS policy'leri
2. **CLAUDE-SON-OTURUM.md oku** — 21. oturum özeti (render süpürmesi)
3. **docs/ROADMAP.md oku (2 dk)** — hangi fazın içinde olduğumuzu hatırlat
4. **Deploy durumu teyit:**
   - 21. oturum 11 HTML + CLAUDE.md canlıda mı?
   - DB: `SELECT COUNT(*) FROM malzeme_tanimlari WHERE tenant_id IS NULL;` → **12** (sistem preset)
   - DB: `SELECT COUNT(*) FROM malzeme_tanimlari WHERE tenant_id IS NOT NULL;` → **0** (henüz tenant özel yok — 22. oturum bunu kullanmaya başlayacak)
5. **Canlı render testi (1 dk):** `spool_detay.html > Büküm Ekle` → `Karbon Çelik — St 37 — 219,1 mm` görünmeli (ham `karbon` değil). Eğer hâlâ görünüyorsa 21. oturum deploy'u eksik.

---

## 🎯 ANA TEMA — Faz 2 Admin UI: `tanimlar.html` Malzeme Havuzu Sekmesi

### Hedef
Firmanın kendi kalite kodlarını (master tabloya tenant-scoped) UI'dan ekleyip yönetebilmesi. 19. oturumda altyapı (tablo + trigger + 12 sistem preset) kuruldu; 20. oturumda yazma bug'ı çözüldü; 21. oturumda render tarafı standardize edildi. Sıra **CRUD UI**'da.

### Kullanıcı Hikayeleri

1. **Okuma:** Admin kullanıcı `tanimlar.html > Malzeme Havuzu` sekmesine gider; iki alt tab görür:
   - **Sistem Kaliteleri** (read-only, 12 preset): `ST37`, `316L`, `CUNI9010`, ...
   - **Firma Kaliteleri** (CRUD): başlangıçta boş, admin ekledikçe dolar
2. **Ekleme:** Admin "+ Yeni Kalite Ekle" butonu → modal → kategori dropdown (karbon/paslanmaz/bakir/alum/diger) + kalite kodu input + gösterim input + standart input + açıklama (TR/EN/AR) → kaydet → yeni satır tabloya gelir
3. **Düzenleme:** Admin satır yanındaki kalem simgesi → modal (pre-filled) → güncelle
4. **Silme:** Admin ✕ simgesi → önce FK violation check (`spool_malzemeleri`, `pipeline_malzemeleri`'de kullanılıyor mu?) → eğer kullanılıyorsa "Bu kalite X spoolda kullanılıyor, silinemez. Önce kayıtları güncelleyin." → değilse onay → sil

### Mockup-First (R-10 kuralı)
- **Oturum başında** `tanimlar.html`'e yeni sekme (sadece HTML + CSS, fonksiyonsuz) ekle
- Kullanıcıyla mockup üzerinden gez, layout onayı al
- Onay sonrası JS fonksiyonları ve Supabase çağrıları eklenir

---

## Öncelik 1 — Yetki Kontrolü

`blok_tanimlar_malzeme` yeni izin anahtarı eklensin mi, yoksa mevcut `blok_tanimlar_kategori` altında mı çalışsın? 
- **Öneri:** Mevcut `blok_tanimlar_kategori` altında, sadece admin + müdür rolleri erişebilsin
- Karar: ilk 10 dk kullanıcıyla netleştir

## Öncelik 2 — UI Yapısı

### Yeni sekme (`tanimlar.html`)
```html
<div class="tab-content" id="t_malzeme_havuzu">
  <!-- Alt tab bar -->
  <div class="sub-tabs">
    <button class="sub-tab active" data-subtab="sistem">Sistem Kaliteleri (12)</button>
    <button class="sub-tab" data-subtab="firma">Firma Kaliteleri (<span id="firmaKaliteSayi">0</span>)</button>
  </div>
  
  <!-- Sistem tab (read-only) -->
  <div id="subtab_sistem">
    <div class="info-box">Bu kaliteler tüm firmalar tarafından kullanılabilir. Düzenlenemez.</div>
    <table>
      <thead><tr><th>Kategori</th><th>Kod</th><th>Gösterim</th><th>Standart</th></tr></thead>
      <tbody id="sistemKaliteBody"></tbody>
    </table>
  </div>
  
  <!-- Firma tab (CRUD) -->
  <div id="subtab_firma" hidden>
    <button class="btn btn-ac" onclick="kaliteEkleModalAc()">+ Yeni Kalite Ekle</button>
    <table>
      <thead><tr><th>Kategori</th><th>Kod</th><th>Gösterim</th><th>Standart</th><th>Açıklama</th><th></th></tr></thead>
      <tbody id="firmaKaliteBody"></tbody>
    </table>
  </div>
</div>

<!-- Ekleme/Düzenleme modal -->
<div class="mov" id="kaliteModal">...</div>
```

### JS Fonksiyonları

```js
async function kalitelerYukle() {
  var supa = ARES.supabase();
  // Sistem preset (tenant_id IS NULL)
  var sistem = await supa.from('malzeme_tanimlari').select('*')
    .is('tenant_id', null).eq('aktif', true).order('kategori_kod').order('kalite_kod');
  // Firma özel (tenant_id = current tenant)
  var firma = await supa.from('malzeme_tanimlari').select('*')
    .eq('tenant_id', ARES.tenantId()).eq('aktif', true).order('kategori_kod').order('kalite_kod');
  // render...
}

async function kaliteKaydet(kaliteObj) {
  var supa = ARES.supabase();
  var insert = {
    tenant_id: ARES.tenantId(),  // RLS policy bunu şart koşar
    kategori_kod: kaliteObj.kategori,
    kalite_kod: kaliteObj.kod.toUpperCase().replace(/\s+/g,''),
    kalite_goster: kaliteObj.goster,
    standart: kaliteObj.standart || null,
    aciklama_tr: kaliteObj.aciklama_tr || null,
    aciklama_en: kaliteObj.aciklama_en || null,
    aciklama_ar: kaliteObj.aciklama_ar || null,
    aktif: true,
    sistem_preset: false
  };
  // UNIQUE(tenant_id, kategori_kod, kalite_kod) → çakışma kontrolü
  var res = await supa.from('malzeme_tanimlari').insert(insert);
  if (res.error) {
    if (res.error.code === '23505') {
      showToast('Bu kalite zaten eklenmiş', 'e');
    } else {
      showToast(res.error.message, 'e');
    }
    return;
  }
  await kalitelerYukle();
  showToast('Kalite eklendi', 'success');
}

async function kaliteSil(id) {
  var supa = ARES.supabase();
  // FK violation ön-kontrol
  var kullanim1 = await supa.from('spool_malzemeleri').select('id', {count:'exact', head:true}).eq('malzeme_ref_id', id);
  var kullanim2 = await supa.from('pipeline_malzemeleri').select('id', {count:'exact', head:true}).eq('malzeme_ref_id', id);
  var toplam = (kullanim1.count||0) + (kullanim2.count||0);
  if (toplam > 0) {
    showToast(`Bu kalite ${toplam} kayıtta kullanılıyor, silinemez`, 'e');
    return;
  }
  if (!confirm('Silmek istediğine emin misin?')) return;
  var res = await supa.from('malzeme_tanimlari').delete().eq('id', id);
  if (res.error) { showToast(res.error.message, 'e'); return; }
  await kalitelerYukle();
  showToast('Kalite silindi', 'success');
}
```

## Öncelik 3 — RLS Policy Teyidi

19. oturumda 4 policy yazılmıştı:
- `malzeme_tanimlari_select`: sistem preset (tenant_id NULL) + kendi tenant → herkes okur
- `malzeme_tanimlari_insert`: sadece `tenant_id = auth.tenant_id()` INSERT edebilir (sistem preset kimse INSERT edemez)
- `malzeme_tanimlari_update`: sadece kendi tenant'ını UPDATE edebilir
- `malzeme_tanimlari_delete`: sadece kendi tenant'ını DELETE edebilir

**Test (22. oturum başında):**
```sql
-- Kendi tenant olarak giriş yap, bu komut başarılı olmalı:
INSERT INTO malzeme_tanimlari (tenant_id, kategori_kod, kalite_kod, kalite_goster, standart, aktif, sistem_preset)
VALUES (auth.tenant_id(), 'paslanmaz', '321', '321', 'ASTM A240', true, false);

-- Bu başarısız olmalı (sistem preset'e dokunma):
DELETE FROM malzeme_tanimlari WHERE tenant_id IS NULL;  -- RLS reddeder
```

## Öncelik 4 — Trigger Guard 1 Gevşetme

20. oturumda `20-oturum-trigger-guard-gevsetme.sql` hazırlanmıştı, ertelendi. 22. oturumda admin UI üzerinden yeni kalite eklenmeye başlayınca `kalite_kod = kategori_kod` olan meşru durumlar çıkabilir (örn. admin yanlışlıkla kategori kodu yazarsa). Guard 1 gereksiz, Guard 2 (kalite_kod_normalize NULL) zaten yeterli.

**Karar:** 22. oturumda `tanimlar.html` UI çalışır hale geldikten sonra `20-oturum-trigger-guard-gevsetme.sql` çalıştır.

## Öncelik 5 — Frontend Autocomplete (opsiyonel — zaman kalırsa)

`spool_detay.html > kaliteleriDoldur()` fonksiyonu şu an geçmiş kayıtlardan tenant-scoped datalist dolduruyor. Master tablo geldiğine göre bu **artık `malzeme_tanimlari`'dan okumalı** — daha temiz + canonical. Fonksiyon 2-3 satır değişir.

```js
async function kaliteleriDoldur(){
  var supa = ARES.supabase();
  // Sistem preset + tenant özel birleşik
  var res = await supa.from('malzeme_tanimlari')
    .select('kalite_goster')
    .or(`tenant_id.is.null,tenant_id.eq.${ARES.tenantId()}`)
    .eq('aktif', true);
  // datalist doldur...
}
```

## Öncelik 6 — M3_RENK ve duplicate `<td>` yan bug'ları (21. oturumdan devir)

Oturum sonunda (15 dk) 2 yan bug:

1. **`spool_detay.html:2657-2665` M3_RENK.** Key'leri kategori koduna çevir:
```js
var M3_RENK = {
  'karbon':     0x7a7d82,
  'paslanmaz':  0xb0b8c1,
  'bakir':      0xb87333,
  'alum':       0xc0c0c8,
  'diger':      0x8888aa,
  '_flans':     0x5c6070,
  '_reduktor':  0x6e7178,
  '_dirsek':    0x7a7d82,
  '_default':   0x8888aa
};
```
ve `m3Mat(malzeme, tip)` fonksiyonu içinde `malzeme`'yi önce `ARES_NORM.malzemeKod(malzeme)` ile kategori koduna çevirsin.

2. **`devre_detay.html:1609-1611` duplicate `<td>`.** Iki satır tekrarlanmış, ikincisi silinecek.

---

## Oturum Planı

**Tahmini süre: 90-120 dakika**

1. **İlk 10 dk — Ritüel + mockup:**
   - CLAUDE.md + CLAUDE-SON-OTURUM
   - Deploy teyidi
   - `tanimlar.html` HTML-only mockup ekle
   - Kullanıcıyla gez, layout onayı

2. **30 dk — Sistem + Firma tabları:**
   - `kalitelerYukle()` fonksiyonu
   - Sistem tab render (read-only)
   - Firma tab render (CRUD butonlu, başlangıçta boş)
   - Yetki kontrolü (`blok_tanimlar_kategori`)

3. **30 dk — Ekleme/Düzenleme modal:**
   - `kaliteEkleModalAc()`, `kaliteDuzenleModalAc(id)`
   - `kaliteKaydet()` — UNIQUE çakışma + `kalite_kod_normalize` doğrulama
   - RLS canlı test

4. **15 dk — Silme + FK koruması:**
   - `kaliteSil()` + FK ön-kontrol
   - Kullanılıyor toast mesajı
   - Silme onay popup'ı

5. **15 dk — Yan işler:**
   - Guard 1 gevşetme SQL çalıştır
   - `spool_detay.html` `kaliteleriDoldur()` master tablodan oku
   - M3_RENK + duplicate `<td>` fix

6. **10 dk — Kapanış:**
   - CLAUDE.md Bölüm 10 güncelle (Faz 2 checkbox kapat, Faz 3 bekleyen)
   - CLAUDE-SON-OTURUM (22. oturum özeti)
   - CLAUDE-SONRAKI-OTURUM (23. oturum — Faz 3 form refactor: autocomplete dropdown)

---

## Risk Yönetimi

1. **RLS policy bug.** 19. oturumda yazılan policy'ler canlı test edilmedi (sadece preset seed'i çalıştı). 22. oturumun ilk INSERT'ü hata verirse policy'leri revize etmek gerekebilir.

2. **`kalite_kod_normalize` unrecognized döner.** Admin "custom" kalite girerse (örn. `A335-P91`), trigger bu kod için `kalite_kod_normalize` NULL dönebilir, `malzeme_ref_bul` başarısız olur. Çözüm: admin UI'dan gelen kalite için `kalite_kod_normalize` davranışı değiştirilsin — `malzeme_tanimlari`'da varsa o kodu kullansın.

3. **UNIQUE constraint** `(tenant_id, kategori_kod, kalite_kod)` — tenant aynı kodu farklı kategoride ekleyebilir mi? Evet (`paslanmaz/316L` vs `karbon/316L` farklı). Admin UI'da kategori dropdown bu yüzden şart.

4. **Dil dosyaları.** Yeni UI string'leri `lang/tr.json`, `en.json`, `ar.json`'a eklenmeli (`t_mh_sistem_tab`, `t_mh_firma_tab`, `t_mh_yeni_btn`, `t_mh_col_kategori`, vb.)

5. **Çakışma testleri.** Ayrı tenant'ta `ST37` eklemeye çalışınca sistem preset ile çakışmasın — partial UNIQUE zaten `tenant_id IS NULL` için ayrı.

---

## 23. Oturum (Sonraki) — Faz 3 Form Refactor

22. oturum tamamlandıktan sonra 23. oturumda:
- `devre_yeni.html` manuel ekleme formu — kalite `input` + datalist yerine **`<select>` (malzeme_tanimlari'dan doldur) + "Yeni ekle" opsiyonu**
- `spool_detay.html` malzeme modal'ında aynı
- Autocomplete Faz 3'ün içinde (admin tanım yapmasa bile geçmiş kayıtlardan öneri)

## 24. Oturum — Faz 4 IFS Fuzzy Match

- IFS Excel'indeki `Material` kolonundaki yazılımlar (örn. `St37`, `ST 37`, `st-37`) fuzzy match ile `malzeme_tanimlari`'daki canonical'e çekilsin
- Bilinmeyen kod → admin'e bildirim + "manuel eşleştir" akışı

---

## Hazır DB Objeleri (Referans — 19. oturumdan)

```sql
-- Tablolar
malzeme_tanimlari                -- 12 sistem preset

-- FK Kolonları  
spool_malzemeleri.malzeme_ref_id
pipeline_malzemeleri.malzeme_ref_id

-- Fonksiyonlar
kategori_kod_normalize(text) → text
kalite_kod_normalize(text) → text
malzeme_ref_bul(uuid, text, text) → uuid   -- Guard 1 gevşetmesi opsiyonel

-- Trigger'lar
tg_spool_malzemeleri_ref_sync     ON spool_malzemeleri      BEFORE INSERT OR UPDATE
tg_pipeline_malzemeleri_ref_sync  ON pipeline_malzemeleri   BEFORE INSERT OR UPDATE

-- RLS Policies (4 adet)
malzeme_tanimlari_select, _insert, _update, _delete
```

## JS API (Referans)

```js
// RENDER (21. oturumda sistem çapında uygulandı — G-03)
ARES_NORM.malzemeEtiket(kod)     // → "Karbon Çelik" (lokalize)
ARES_NORM.kaliteGoster(kodOrRaw) // → "St 37" (canonical)
ARES_NORM.yuzeyEtiket(kod)       // → "Asit" (lokalize)
ARES_NORM.durumEtiket(kod)       // → "Bekliyor" (lokalize)

// KOD (DB yazım için)
ARES_NORM.malzemeKod(raw)        // → "karbon"
ARES_NORM.kaliteKod(raw)         // → "ST37" veya NULL
ARES_NORM.yuzeyKod(raw)          // → "asit"

// UYUM (malzeme × yüzey)
ARES_NORM.uyumlu('paslanmaz','galvaniz')  // → false
ARES_NORM.uyumluYuzeyler('paslanmaz')     // → ['asit','diger']

// MARKA + REV
ARES_NORM.marka(proje, pipeline, spool, ARES_NORM.revFmt(rev))
// → "NB1137-M100-262-302-47-S01-Rev2"
```

## G-03 Kontrol Listesi (Yeni Sayfa İçin)

22. oturumda `tanimlar.html`'e yeni sekme eklerken G-03'ü unutma:
- [ ] Kategori dropdown'da `<option value="karbon">Karbon Çelik</option>` (value ham, text lokalize)
- [ ] Tablo render'larında `ARES_NORM.malzemeEtiket(kategori_kod)` çağrısı
- [ ] `kalite_goster` alanı zaten canonical (DB'den öyle geliyor), render'da `esc()` yeterli
- [ ] Standart (`DIN 17100`, `ASTM A240`) lokalize edilmez — uluslararası kod
- [ ] Açıklama TR/EN/AR — aktif dile göre `ARES.lang`'e göre seçim

---

## 🗺️ Sonraki Oturumlar — Kısa Çerçeveler

Her oturum için kendi detay dosyası olacak, ama mutabık kaldığımız planın hatırlatması:

### 23. Oturum — Altyapı: Dosya Mimarisi + Lint + Şablon (3-4 saat)

Faz B'nin kalbi. Detay `docs/ROADMAP.md`.

**Ana kalemler:**
1. CLAUDE.md'yi böl → CLAUDE.md (600 satır) + docs/rules/ (8 kural dosyası) + docs/sessions/ (arşiv) + docs/architecture/
2. 7 lint script (G-01 i18n, G-02 tema+fontsize, G-03 enum, B-02 local key, E-01 canonical, A-01 error handling, dead-code)
3. `scripts/health-check.sh` birleştirici
4. `.husky/pre-commit` + `.github/workflows/lint.yml` + Vercel Deploy entegrasyonu
5. `docs/templates/` — yeni sayfa/modal/SQL şablonları (kuralı pasif uygular)
6. CLAUDE.md'nin başına "ZORUNLU ilk tool call: `bash scripts/health-check.sh`" bloğu

**Hazırlık:** 22. oturum kapanışında `docs/` dizin yapısı için ön fikir yap, ROADMAP.md'yi yeniden oku.

### 24. Oturum — Mevcut Kod Temizliği + Font-Size Refactor (2-3 saat)

23'ün ilk lint çalıştırmasının çıktısını (muhtemelen 30-80 hit) temizle.

**Kritik alt iş — font-size refactor:**
- `--fs-xs: 11px`, `--fs-sm: 12px`, `--fs-base: 14px`, `--fs-lg: 16px`, `--fs-xl: 20px` değişkenleri tanımla
- Hard-coded `font-size: Npx` kullanımlarını grep'le, hepsini değişkene dönüştür
- Karakter büyüklüğü sorununun köklü çözümü

### 25. Oturum — Faz A Faz 3: Form Refactor (1-2 saat)

Malzeme sisteminin form tarafı iyileştirmesi:
- `devre_yeni.html` manuel kalite input → master tablodan `<select>` + "Yeni ekle"
- `spool_detay.html > kaliteleriDoldur()` master tablodan okusun (geçmiş kayıt yerine)
- Autocomplete (geçmiş öneri + master birleşik)

**Lint destekli çalışır** — 23-24 altyapı tamam olduğu için bu oturum çok hızlı geçer.

### 26. Oturum — Faz A Faz 4: IFS Fuzzy Match (1-2 saat)

Malzeme sistemini sonlandır:
- IFS Excel'in `Material` kolonundaki `St37`, `ST 37`, `st-37`, `StE355` varyantları fuzzy match
- Eşleşmeyen kodlar → admin bildirim + "manuel eşleştir" akışı
- `ifs_material_alias` öğrenen tablo

### 27. Oturum — SaaS: Tenant İzolasyon Testleri (3-4 saat)

Faz C başlangıcı. SaaS için **ölümcül önem**:
- Test tenant A + B migration
- `tests/rls-isolation.sql` — A kullanıcısı B'nin verilerini göremiyor mu, her tablo için
- CI'ye entegre et — izolasyon kırılması → deploy iptal
- Her yeni tablo için izolasyon test şablonu

### 28. Oturum — SaaS: Performans Bütçesi + Observability (2-3 saat)

"Yavaşlık istemiyorum" hedefinin somutlaştırılması:
- Sayfa açılış bütçeleri (spool_detay < 2s, devre_detay < 2s, kesim < 1.5s)
- Supabase sorgu bütçesi (< 500ms p95)
- Lighthouse CI
- Sentry (veya alternatif) — canlı error tracking dashboard
- Haftalık en yavaş sorgu raporu

### 29. Oturum — SaaS: Rollback + Feature Flag (2-3 saat)

Deploy bozulursa çok müşteri etkilenmesin:
- Vercel rollback prosedürü yazılı
- `ares_flags` tablosu — feature flag altyapısı
- DB migration'lar up.sql + down.sql çifti
- Canary deployment — 1 firma → 24 saat sonra hepsi

---

## ❗ Önemli: 22. Oturumda Yazılacak Kodun Geleceği

23-24. oturumda altyapı gelince ve `bash scripts/health-check.sh` ilk defa çalıştırılınca, 22. oturumda yazılan `tanimlar.html > malzeme havuzu sekmesi` kodu da lint'ten geçecek.

**Bu yüzden 22. oturumda baştan dikkat:**
- [ ] Yeni fonksiyonların hepsi `try/catch` + `res.error` kontrolü (A-01)
- [ ] Hard-coded hex yok, hard-coded `font-size: Npx` yok (G-02)
- [ ] Hard-coded TR string yok, her metin `tv('key', 'fallback')` (G-01)
- [ ] Ham enum kodu render yok (G-03)
- [ ] Destructive silme öncesi onay (B-01)
- [ ] `<option value="kod">Türkçe</option>` pattern (E-01)
- [ ] `innerHTML` kullanımda `esc()` (henüz lint yok ama alışkanlık)
- [ ] `ares-normalize.js` script yüklendi (yeni sekme olduğu için tanimlar.html'de zaten var mı teyit)

Bu titizlik **22. oturum sonrası lint çalışınca 0 yeni ihlal** demektir. Mevcut 30-80 hit sadece eski koddan gelecek, yeni kod onlara eklenmeyecek.

