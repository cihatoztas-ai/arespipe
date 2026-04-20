# Sonraki Oturum İçin Gündem

**Hazırlanma tarihi:** 20 Nisan 2026 (6. oturum sonu)
**Son durum:** Tenant prefix sistemi yarım — DB + devre_yeni.html hazır. Yeni spool'lar `A-0504` formatında üretiliyor (test edildi). Ama QR tarafı ve qr_tara.html entegrasyonu **yapılmadı** — cross-tenant çakışma riski hâlâ mevcut.

---

## 🎯 Bu Oturumda İlk İş: Öncelik 1 — Tenant Prefix Tamamlama (QR + qr_tara)

Bu iş 6. oturumun yarım bıraktığı ana iş. Şu an:
- ✅ `tenants.kod` kolonu var, 7 tenant'a kod atandı (A-G)
- ✅ `devre_yeni.html` yeni spool'lara prefix ekliyor (`A-0504`)
- ✅ `spool_detay.html` DB'den spool_id okuyor, başlıkta `A-0504` gösteriyor
- ❌ **QR payload hâlâ sadece kısa kod** — cross-tenant okunursa çakışma riski
- ❌ **qr_tara.html prefix'i bilmiyor** — cross-tenant kontrolü yok

**Hedef format:** QR içeriği `A-0504:<UUID>` (prefix + kısa kod + iki nokta + UUID).

Yeni sohbet açarken önce kullanıcıya sor: "Tenant prefix sistemini bitirelim mi, yoksa başka öncelik var mı?"

---

## Başlarken — Yeni Sohbete Yükle

Yeni sohbet açınca şu 4 dosyayı yükle:
1. `CLAUDE.md` — ana proje bağlamı
2. `CLAUDE-MOBILE.md` — mobil kurallar
3. `CLAUDE-SONRAKI-OTURUM.md` — bu dosya (öncelikli iş listesi)
4. `CLAUDE-SON-OTURUM.md` — en son oturumun deploy/test özeti

---

## Öncelik 1 — Tenant Prefix Tamamlama (QR + qr_tara)

### Bu iş için gerekli dosyalar
- `spool_detay.html` (son 6. oturum çıktısı — 12 patch'li)
- `qr_tara.html` (henüz yüklenmedi, bu oturumda ilk kez bakılacak)

### Adım 1 — spool_detay.html: QR payload formatı
Mevcut satır ~1730'da: `var qrIcerik = SP.spoolId || SP.supaId || 'ARES';`

Hedef: `var qrIcerik = SP.spoolId && SP.supaId ? (SP.spoolId + ':' + SP.supaId) : (SP.spoolId || SP.supaId || 'ARES');`

Yani yeni QR'ların içeriği: `A-0504:f0cd6ae8-eddf-430b-aec0-ca637f7168f7`
Eski spool'ların QR'ları hâlâ `0504` (prefix yok) — bozmuyoruz, okuma tarafında iki formatı da parse edeceğiz.

### Adım 2 — qr_tara.html: Parse + cross-tenant kontrol
Parse mantığı:
```js
function parseQR(raw) {
  // Format 1 (yeni): "A-0504:UUID" → {prefix, kisaKod, uuid}
  // Format 2 (eski): "0504" → {uuid:null, kisaKod}
  // Format 3 (hiçbiri): ham değer, spool_no olarak dene
  
  if (raw.includes(':')) {
    var [kod, uuid] = raw.split(':');
    var [prefix, kisa] = kod.includes('-') ? kod.split('-') : [null, kod];
    return {prefix, kisaKod: kisa, uuid, tamKod: kod};
  }
  if (raw.match(/^\d{4}$/)) {
    return {prefix: null, kisaKod: raw, uuid: null, tamKod: raw};
  }
  return {prefix: null, kisaKod: raw, uuid: null, tamKod: raw};
}
```

Cross-tenant kontrolü:
```js
var parsed = parseQR(raw);
if (parsed.prefix) {
  var kendiTenantKod = await ARES.tenantKod(); // yeni helper - ares-store.js'e ekle
  if (parsed.prefix !== kendiTenantKod) {
    // Başka firmaya ait - adı çek ve uyarı göster
    var res = await supa.from('tenants').select('ad').eq('kod', parsed.prefix).single();
    var firmaAdi = res?.data?.ad || 'başka bir firmaya';
    toast('Bu spool "' + firmaAdi + '" aittir, sisteminizde görüntülenemiyor.', 'er');
    return;
  }
}
// Normal lookup — UUID varsa onunla, yoksa spool_id ile
```

### Adım 3 — ARES.tenantKod() helper (ares-store.js)
`ARES.tenantId()` gibi benzer pattern:
```js
var _tenantKodCache = null;
async function tenantKod() {
  if (_tenantKodCache) return _tenantKodCache;
  var res = await ARES.supabase().from('tenants').select('kod').eq('id', ARES.tenantId()).single();
  _tenantKodCache = res?.data?.kod || null;
  return _tenantKodCache;
}
ARES.tenantKod = tenantKod;
```

Böylece `devre_yeni.html`'deki inline sorguyu da sadeleştirebiliriz (opsiyonel refactor).

**Süre tahmini:** 1-2 saat

---

## Öncelik 2 — Kalite UX + Veri Temizliği

### Sorun (6. oturumda tespit edildi)
DB'de `spooller.kalite` alanı canonical malzeme kodları (`karbon`, `paslanmaz`, `diger`) tutuyor. Örnek kayıt:
```
spool_malzeme: "paslanmaz" ✓
spool_kalite:  "karbon" ← YANLIŞ, kalite = alaşım standardı olmalı (ST37, A106-B, 304L...)
```

### Kaynak
`devre_yeni.html`'deki form'da "kalite" alanı muhtemelen ikinci bir malzeme radio grubu olarak tasarlanmış. Benzer sorun IFS import (satır 786) ve PDF import (satır 1668) yollarında da var.

### Karar gerektiren tasarım sorusu

**Seçenek A (serbest text + autocomplete):**
- Form'da kalite metin kutusu
- Geçmiş değerlerden autocomplete (ST37, A106-B, CuNi10Fe1Mn, 304L, 316L...)
- Kullanıcı kendi bilgi tabanını büyütür
- Esnek ama validasyon yok

**Seçenek B (datalist + yeni ekleme):**
- `<datalist>` ile sistemde kayıtlı kaliteler
- "Listede yok → yeni ekle" akışı
- `kalite_standartlari` diye bir tablo + tenant_id
- Kontrollü ama daha fazla UI iş

**Seçenek C (yapay zeka asistan):**
- Kullanıcı serbest yazar
- Sistem "bu ST37-A mı, yoksa A53-A mı?" diye sorar (gerekirse)
- AI veya regex ile normalize
- En gelişmiş ama karmaşık

**Benim önerim:** Seçenek A ile başla — basit, esnek, kullanıcının gerçek kalite kodları zaman içinde ortaya çıkar. Sonra Seçenek B'ye migrate etmek kolay (`SELECT DISTINCT kalite FROM spooller` ile başlangıç verisi).

### Yapılacaklar
1. `devre_yeni.html` form tasarım değişikliği (kalite radio → text+autocomplete)
2. `devre_duzenle.html` aynı değişiklik
3. IFS import (satır 786) + PDF import (satır 1668) — kalite alanının doğru kaynaktan gelmesi
4. DB temizliği:
   ```sql
   -- Önce dağılımı gör
   SELECT kalite, COUNT(*) FROM spooller WHERE silindi = false GROUP BY kalite;
   -- Bozuk değerleri NULL'a çek (karbon/paslanmaz gibi değerler)
   UPDATE spooller SET kalite = NULL 
   WHERE kalite IN ('karbon','paslanmaz','bakir','alum','diger');
   -- Kullanıcı manuel yeniden girsin veya boş kalsın
   ```
5. spool_malzemeleri için aynı sorun var mı kontrol et (CLAUDE.md'de "kalite='diger' 2 kayıt UX sorunu" notu vardı)

**Süre tahmini:** 2-3 saat (tasarım kararı + UI + veri)

---

## Öncelik 3 — Spool No → Marka Gösterimi

### Sorun
Tablolarda "S01" tek başına anlamsız. Operatör bakınca bağlam yok.
Şu an devre_detay.html spool listesinde:
```
PIPELINE NO       SPOOL NO  REV  SPOOL ID
M100-262-302-47   S01       —    A-0512
```

### Seçenekler
**(a) SPOOL NO sütununu birleşik yap:** `M100-262-302-47-S01` — okunaklı ama uzun
**(b) SPOOL NO sütununu kaldır** — PIPELINE NO + SPOOL ID yeter
**(c) Ekran aynı, sadece Excel/PDF çıktılarda marka birleşsin**

### Etkilenen sayfalar
- `devre_detay.html` (ana liste)
- `kesim.html`
- `markalama.html`
- `sevkiyat.html`
- `kalite_kontrol.html`
- `raporlar.html`

Ayrıca spool_detay.html başlığında zaten `NB1137-M100-262-302-47-S01` formatında gösteriliyor — tutarlı olması için diğer sayfalara yayılmalı.

**Süre tahmini:** 1-2 saat

---

## Öncelik 4 — Admin UI: Tenant Kod Yönetimi

### Kural özeti (6. oturumda karar verildi)
- Kod admin tarafından manuel atanır
- Sistem çakışma uyarısı verir ama override edilebilir (iki aşamalı onay)
- Önce eski sahipten kodu al, sonra yenisine ver (çakışma sırasında)
- Yasak kod listesi (AM, OC, GO, SI vb. uygunsuz çağrışımlı kodlar)
- Format: 1-4 harf, A-Z (DB CHECK zaten var, gevşek bırakıldı)

### Yapılacaklar
1. `tanimlar.html` veya ayrı bir admin sayfası
2. Yeni firma oluştururken kod input'u + "kullanılmış kodlar" listesi + uyarı
3. Mevcut firmanın kodunu değiştirme (uyarı: "tüm spool_id'ler bozulur")
4. Yasak kod tablosu (isterseniz):
   ```sql
   CREATE TABLE tenants_kod_yasak (kod VARCHAR(4) PRIMARY KEY, sebep TEXT);
   INSERT INTO tenants_kod_yasak VALUES 
     ('AM', 'Uygunsuz çağrışım'),
     ('OC', 'Uygunsuz çağrışım'),
     ('GO', 'Uygunsuz çağrışım');
   ```
5. UI tarafında yasak kod seçilmeye çalışılırsa uyarı

**Süre tahmini:** 2 saat

---

## Öncelik 5 — spool_detay.html Performans

**Sorun:** 
- 3007 satır tek dosya
- Ana select: `spool_malzemeleri + fotograflar + belgeler + devreler + projeler + tersaneler` büyük join
- 5 paralel ek query (islem_log, notlar, kesim, bukum, markalama)
- 3D THREE.js render kodu (lazy load edilmeli)

**Hedef:** Sayfa açılma süresi ~3s → <1s

**Yapılacaklar:**
1. Ana select'i böl — spool detayı önce, alt listeler lazy load
2. 3D kodunu ayrı dosyaya çıkar + dinamik import (`ares-3d.js`)
3. İşlem log + notlar: kullanıcı tab'a tıklayınca yükle (şu an hep yükleniyor)
4. Fotoğraflar: thumbnail lazy load + infinite scroll

**Süre tahmini:** Ayrı bir oturum (refactor işi)

---

## Öncelik 6 — devreler.malzeme Canonical Migration (4. oturumdan devam)

DB'de `devreler.malzeme` hâlâ Türkçe format ("Karbon Çelik", "Paslanmaz", "Bakır Alaşım"). spooller gibi canonical'e çekilmeli.

```sql
-- Dağılım
SELECT malzeme, COUNT(*) FROM devreler WHERE silindi = false GROUP BY malzeme;

-- Canonical migration
UPDATE devreler SET malzeme='karbon'    WHERE malzeme IN ('Karbon Çelik','karbon_celik');
UPDATE devreler SET malzeme='paslanmaz' WHERE malzeme = 'Paslanmaz';
UPDATE devreler SET malzeme='bakir'     WHERE malzeme IN ('Bakır Alaşım','bakir_alasim');
UPDATE devreler SET malzeme='alum'      WHERE malzeme IN ('Alüminyum','aluminyum');
```

**Süre tahmini:** 30 dk

---

## Öncelik 7 — CLAUDE.md Güncellemesi

Bu oturumda öğrenilen şemaları CLAUDE.md'ye yansıt:

### Bölüm 4.2 — Kritik Kolon Adları
Ekle:
- **spool_malzemeleri:** `dis_cap_mm`, `et_mm`, `boy_mm`, `agirlik_kg`, `kalite`, `malzeme`, `adet`, `boyut`, `kod`, `tip`, `tanim`, `heat_no`, `sertifikali` (önemli — `et_mm`, `agirlik_kg` spooller'la UYUMSUZ isimler ama bu tabloda CANONICAL)
- **markalama_kalemleri.et_mm** (numeric, plaka markalama için)
- **fotograflar.yapan_id:** legacy TEXT kolon — 11 eski kayıtta email tutuluyordu, 20 Nisan'da `yukleyen_id`'ye migrate edildi. Kolon silinmedi (iz olarak)
- **tenants.kod:** VARCHAR(4) — tenant prefix, spool_id'nin başına gelir (A-0504 gibi)
- **spooller.agirlik_kg:** legacy kolon, tüm kayıtlarda NULL — ileride DROP yapılabilir

### Bölüm 2.13 — Enum Normalize (ekle)
- Tenant prefix sistemi (E-03 diye yeni kural eklenebilir)
- Format: `^[A-Z]{1,4}$`
- Her firma kendi prefix'ini seçer, admin onaylar

### Bölüm 11 — 6. oturum özeti
CLAUDE-SON-OTURUM.md içeriği ana tarihçeye taşınır.

**Süre tahmini:** 30 dk (dokümantasyon)

---

## Mobil İşler (Rafta Bekliyor)

Önceki oturumlardan devam eden:
- **MProfil.jsx** — avatar + kişisel bilgi düzenleme (1 oturum)
- **MIsBaslat.jsx** — operatör iş akışı (2-3 oturum)
- **MDevreler, MDevreDetay, MSpoolDetay, MQRTara** — mockup-first ile

---

## Kesinlikle BU OTURUMDA YAPILMAYACAKLAR

- Sayfa yeniden yazma (spool_detay.html refactor gibi büyük işler — ayrı oturum)
- Admin UI'nın tam implementasyonu — Öncelik 1 ile birlikte yapılırsa dağılırız
- Mobil ekranlar — web tarafı öncelikli şu an

---

## Kural Hatırlatmaları (Sonraki Oturum için Claude'a)

- **Toplu silme/değişiklik yapmadan önce dry-run + kullanıcı onayı**
- **DB şemasını varsayma, sorgu at** — 6. oturumun temel dersi: "canlı DB'yi sor, dokümantasyona güvenme"
- **Sessiz fail arama:** `_supaInsert` ve benzer helper'lar console.warn atıyor, toast yok. Bu yüzden çoğu "ekleme başarılı" aslında başarısız olabiliyor. Benzer pattern'lere dikkat.
- **Migration-in-progress durumları:** `fotograflar.yapan_id`/`yukleyen_id`, `spooller.agirlik`/`agirlik_kg` gibi ikili kolonlar. Yeni bir tane bulursan aynı pattern'le çöz (canonical'e yaz, fallback'i UI'da tut, legacy migration'ı ayrı yap).
- **"Tamamlandı" skeptik oku:** 5. ve 6. oturumun dersi — oturum özetinde "X bitti" yazıyorsa bile **DB'den doğrula**. Önceki oturum özetleri hep iyimserdi.

---

## 6. Oturum Dersleri

**1. "78 yanlış referans" tahmini büyük ölçüde yanlıştı.** Gerçek: 5-6 net bug + 6 ek sessiz bug (ağırlık, spool ID, et kalınlığı). Bunlar kolon adı değil, **mantık eksikleri** veya **yarım kalmış migration'lar**. Yani "kolon adlarını düzelt" odağı yerine "her INSERT/UPDATE'in form state ile simetrik mi" bakışıyla tarama daha verimli.

**2. DB şemasını varsayma, sorgu at.** CLAUDE.md Bölüm 4.2 eksikti — `spool_malzemeleri` şeması hiç yazılmamıştı. Kodu okurken sık sık "bu kolon gerçekten var mı" diye tereddüt yaşadım. Sorgu atmak 10 saniye, varsaymak bir bug yaratır.

**3. Sessiz fail en sinsi düşman.** `_supaInsert` helper'ı console.warn atıyor ama toast yok — kullanıcıya "başarılı" gibi gösteriliyor, DB'ye yazılmıyor. Notlar, ağırlık, fotoğraflar hep bu pattern'in kurbanıydı. Sonraki oturumlarda benzer helper'lara dikkat.

**4. Migration-in-progress pattern'i yaygın.** `fotograflar.yapan_id`/`yukleyen_id` dualizmi benzeri yerler olabilir. `spooller.agirlik`/`agirlik_kg` de öyle. Her yeni kolon bulunduğunda "bu yeni mi, eski mi, ikisi de dolu mu" sorgusu yapılmalı.

**5. Tip uyumsuzluğu sessiz bug yaratır.** `fotograflar.yapan_id` TEXT, `yukleyen_id` UUID — tip değişimi göz ardı ederse INSERT patlıyor. 5. patch'imde bu hatayı yaptım, kullanıcı uyardı, düzelttim. Şemaya dikkat.

**6. Oturum uzunluğu gerilim yaratıyor — özet dosyalar kritik.** Kullanıcı sürekli oturum değişmesinden yoruldu. Bu iki dosyanın her oturum sonunda tam yazılması, sonraki oturumun "hatırlamak" yerine "direkt koda gir" olmasını sağlıyor. İhmal edilmemeli.

---

## Strateji Özeti (Değişmedi)

**3 Katmanlı Hibrit Yaklaşım:**
- **Katman 1:** Altyapı düzeltmeleri (script ile toplu) ✅
- **Katman 2:** Revizyon geldikçe sayfa yeniden yaz — strangler fig
- **Katman 3:** Küçük çalışan sayfalar dokunulmaz

**Dil Stratejisi: Freeze & Translate**
- Proje stabil olunca `tr.json` freeze
- Profesyonel translator / CAT tool

**Enum Stratejisi: Kod bazlı DB + tv() wrapper** ✅
- Kanonik liste kilitli: 5 malzeme + 5 yüzey + uyum matrisi

**YENİ — Tenant Prefix Stratejisi** (6. oturumda başladı, 7. oturumda bitecek):
- DB'de `tenants.kod` (1-4 harf)
- Spool ID formatı: `A-0504` (prefix-kısakod)
- QR payload: `A-0504:UUID` (cross-tenant güvenli)
- Admin manuel kod atar, sistem çakışma kontrolü yapar

---

## Son Söz

6. oturumda 12 fix atıldı — 2 dosya, 3 DB migration. Ana tema: sessiz bug avı + tenant prefix temelleri. Kullanıcı formda ve motivasyonluydu, oturum sonunda oturum değişimi yorgunluğu nedeniyle biraz tansiyon arttı — bu tamamen makul, uzun iş.

**Sıradaki en kritik iş — Öncelik 1:** QR payload formatı + qr_tara.html parse + cross-tenant kontrolü. `qr_tara.html`'i yüklemeden başlama. Sonra Öncelik 2 (kalite UX) — tasarım kararı istiyor, kullanıcıyla sakin tartışarak ilerle.

İyi çalışmalar. 🚀
