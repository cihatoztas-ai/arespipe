# CLAUDE-SONRAKI-OTURUM — 86. Oturum Gündemi

> Bu dosya 86'nın açılışında okunacak. Birlikte: `.github/son-durum.md` + `docs/CLAUDE-SON-OTURUM.md`.

---

## 86. Oturum Ana Tema

**Renk semantiği + fitting/flansh Standart sütunu + tanımsızlık frontend modal + süper admin paneli.**

85'te uç işlemi taxonomy DB tarafı tamamlandı (058+059+060+061), frontend v7 ile yiv satırları temiz, tanımsız_kayitlar tablosu altyapı hazır. 86'da kullanıcının gerçek sahada karşılaştığı UI problemleri çözülür:

1. **Renk bug**: Kütüphaneye bağsız satırlar turuncu görünmüyor (M2/M3/M4/M5 keşfi) → 86.A
2. **Fitting/flansh için Standart yok**: Sadece boru için var, fitting/flansh hücresi hep `—` → 86.B
3. **Tanımsızlık modal'ı**: confirm() placeholder yerine gerçek modal (RPC bağlantısı) → 86.C
4. **Süper admin paneli**: Önerileri toplayan, onay/red veren sayfa → 86.D (ayrı oturum olabilir)

---

## Açılış Ritüeli

```
Oturum başlangıç ritüeli. 2 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3

2. Bugün ne yapmak istiyorsun? (Önerilen: 86.A → 86.B → 86.C sırası; 86.D ayrı oturum)
```

`son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` okunur. Sonra 86.A debug ile başlanır.

---

## 86.A — Renk Semantiği Bug Fix (~30 dk, öncelik 1)

KARAR-85.5 implementasyonu. 85'te tasarım netleşti ama mevcut render'da bug var.

### Sorun

`46622aea-d732-4b66-9fba-bcadc1d354d2` spool'u açıldığında:
- M2 Pipe Seamless 139.70×4.5 → `boru_olculer_id = NULL` → kütüphaneye bağsız → **turuncu olmalı**, ama mavi/normal görünüyor
- M3 Reducer Concentric → `fitting_olculer_id = NULL` → **turuncu/gri olmalı**, görünmüyor
- M4 Ic Bilezik → aynı durum
- M5 Flange Slip-On PN 16 → aynı durum

### Açılış DB Check

```sql
-- Kütüphaneye bağsız satır sayımı (turuncu/gri olmalı, mavi değil)
SELECT
  s.spool_no,
  sm.tip, sm.tanim, sm.dis_cap_mm,
  sm.boru_olculer_id, sm.fitting_olculer_id, sm.flansh_olculer_id,
  CASE
    WHEN sm.tip='boru' AND sm.boru_olculer_id IS NULL THEN 'BAGSIZ_BORU'
    WHEN sm.tip='fitting' AND sm.fitting_olculer_id IS NULL THEN 'BAGSIZ_FITTING'
    WHEN sm.tip='flansh' AND sm.flansh_olculer_id IS NULL THEN 'BAGSIZ_FLANSH'
    WHEN sm.tip='malzeme' THEN 'UC_ISLEMI'
    ELSE 'BAGLI'
  END AS durum
FROM spool_malzemeleri sm
JOIN spooller s ON s.id = sm.spool_id
WHERE sm.tip IN ('boru','fitting','flansh')
  AND (sm.boru_olculer_id IS NULL AND sm.fitting_olculer_id IS NULL AND sm.flansh_olculer_id IS NULL)
ORDER BY sm.tip, sm.dis_cap_mm
LIMIT 30;
```

### Debug Yaklaşımı

`spool_detay.html` render fonksiyonunda:
- `geomBagli` hesabı satır 2228-2233 civarı (`!!m.boru_olculer_id` vb.)
- `!ucIslemiSatiri && (!kaliteStandart || !geomBagli)` koşulu turuncu işaretliyor
- **Şüphe:** `kaliteStandart = m.kal_kaynak === 'sistem'` — eğer master tablosu join'i tüm satırlar için `kal_kaynak='sistem'` döndürüyorsa, ikinci koşul (`!geomBagli`) yetiyor olmalı...

DOM inspect ile gerçek render'a bakılıp `trClasses`'a `malz-standartdisi` ekleniyor mu kontrol edilir.

### Renk Ayrımı (KARAR-85.5)

Tek `malz-standartdisi` yerine iki ayrı class:
- `malz-arasolc` — 🟠 turuncu, kütüphaneye bağlı ama sistem-preset değil (tenant-özel ara ölçü)
- `malz-tanimsiz` — ⚪ gri, kütüphaneye hiç bağlı değil (modal tıklanır)

CSS:
```css
tr.malz-arasolc{border-left:3px solid var(--warn);}     /* turuncu */
tr.malz-tanimsiz{border-left:3px solid var(--txd);cursor:pointer;}  /* gri */
```

Render mantığı:
```js
if(!ucIslemiSatiri){
  if(!geomBagli){
    // Hiç kütüphaneye bağsız — gri, modal tıklanır
    trClasses.push('malz-tanimsiz');
    trOnclick = ' onclick="tanimsizModalAc(\\''+esc(m.id)+'\\')"';
  } else if(/* tenant-özel = master.tenant_id IS NOT NULL */) {
    // Kütüphaneye bağlı ama sistem-preset değil — turuncu, ara ölçü
    trClasses.push('malz-arasolc');
  }
  // else: mavi (sistem preset, normal)
}
```

**Önemli detay:** `master.tenant_id` kontrolü ile sistem/tenant ayrımı yapılır. 85.C MAP'te `kal_kaynak: master ? (master.tenant_id ? 'firma' : 'sistem') : 'serbest'` zaten var. Yani `kal_kaynak === 'firma'` → turuncu, `kal_kaynak === 'sistem'` → mavi.

### Çıktı

- `spool_detay.html` v8
- DB ile UI senkron — kütüphane bağsız satırlar gri, ara ölçüler turuncu, normal sistem-preset satırlar mavi

---

## 86.B — fitting/flansh için Standart Sütunu (v9, ~20 dk)

84'te keşfedildi, 85'te boru için yapıldı, fitting/flansh hâlâ `—` görünüyor.

### MK-84.2 Zorunlu — Açılış DB Check

```sql
-- fitting_olculer + flansh_olculer şema doğrulama
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('fitting_olculer','flansh_olculer')
  AND column_name LIKE '%standart%' OR column_name LIKE '%geom%'
ORDER BY table_name, column_name;
```

Beklenen: `fitting_olculer.geometri_std`, `flansh_olculer.geometri_std`, `flansh_olculer.flansh_tipi`, `flansh_olculer.basinc_sinifi` (parantezde).

### SELECT'e nested join

```js
// 86.B — fitting/flansh için Standart sütunu
fitting_lib:fitting_olculer_id(geometri_std,parca_tipi,class_no),
flansh_lib:flansh_olculer_id(geometri_std,flansh_tipi,basinc_sinifi)
```

### MAP'te tip-bağımlı geom belirleme

```js
var geom, geom_extra = '';
if(tipR === 'boru' && m.boru_lib){
  geom = m.boru_lib.standart;
  geom_extra = m.boru_lib.schedule_kod || '';
} else if(tipR === 'fitting' && m.fitting_lib){
  geom = m.fitting_lib.geometri_std;
} else if(tipR === 'flansh' && m.flansh_lib){
  geom = m.flansh_lib.geometri_std;
  geom_extra = (m.flansh_lib.flansh_tipi || '') + ' ' + (m.flansh_lib.basinc_sinifi || '');
}
```

### Çıktı

- 43 fitting + 11 flansh satırının Standart hücresi (varsa) dolar
- M3 Reducer Concentric → `ASME B16.9` (varsa) göstermeli
- M5 Flange Slip-On → `ASME B16.5 · Class 150` gibi

---

## 86.C — Tanımsızlık Frontend Modal (RPC bağlantısı, ~1 saat)

KARAR-85.3 implementasyonu. 85.E'de DB altyapısı kuruldu, modal placeholder `tanimsizModalAc` hâlâ `confirm()` ile çalışıyor.

### Modal Tasarım (Mavi BORU BİLGİSİ ile simetrik)

```
┌─────────────────────────────────────────────┐
│ BORU BİLGİSİ · KÜTÜPHANEYE EKLENMEMIŞ   [X] │
│ St 37 · DN??? · 139.7×4.5 mm                │
│                                             │
│ [Şema yok — kütüphane güncellemesi bekleniyor] │
│                                             │
│ Standart        — (kütüphaneye eklenmemiş)  │
│ Ürün formu      boru                         │
│ Anma çapı       — (tahmini: DN125, NPS 5")  │
│ Dış çap         139,7 mm                    │
│ Et kalınlığı    4,5 mm                      │
│ Kalite          St 37                        │
│ Birim ağırlık   — (hesaplanamadı)           │
│                                             │
│ ─────────────────────────────────────────── │
│ NEDEN KÜTÜPHANEDE YOK?                      │
│ ( ) Standartta var ama eklenmemiş           │
│ ( ) Standartta yok, özel ölçü               │
│ ( ) Veri hatalı / eksik                     │
│                                             │
│ Açıklama: [_________________________]       │
│                                             │
│ [İptal]  [Süper admin onayına gönder]      │
└─────────────────────────────────────────────┘
```

### Tahmini DN Hesabı

```js
function tahminiDN(dis_cap_mm){
  // 139.70 → DN125 (yakın anma çap)
  // ASME B36.10M tablosundan en yakın DN bulunur
  var dnTablo = [
    {dn:15,od:21.3}, {dn:20,od:26.7}, {dn:25,od:33.4},
    {dn:32,od:42.2}, {dn:40,od:48.3}, {dn:50,od:60.3},
    {dn:65,od:73.0}, {dn:80,od:88.9}, {dn:100,od:114.3},
    {dn:125,od:141.3}, {dn:150,od:168.3}, ...
  ];
  // En yakın eşleşmeyi bul, fark > 5mm ise "(tahmini değil, ölçü standart dışı)"
  ...
}
```

### RPC Call

```js
async function tanimsizOneriGonder(form){
  var hash_data = {
    tip: form.tip,
    dis_cap_mm: form.dis_cap,
    et_mm: form.et,
    kalite: form.kalite,
    tahmini_dn: form.tahminiDN,
    tanim: form.tanim,
    malzeme: form.malzeme
  };

  const { data, error } = await supa.rpc('tanimsiz_kayit_onerisi', {
    p_tip: form.tip === 'boru' ? 'std_disi' : ...,
    p_dis_cap_mm: form.dis_cap,
    p_et_mm: form.et,
    p_kalite: form.kalite,
    p_ham_data: hash_data,
    p_tenant_id: AresStore.tenantId,
    p_user_id: AresStore.userId,
    p_spool_malzeme_id: form.malzemeId,
    p_kullanici_sebep: form.sebep,
    p_kullanici_aciklama: form.aciklama
  });

  if(error) toast('Hata: ' + error.message, 'error');
  else toast('Süper admin onayına gönderildi', 'success');
}
```

### Çıktı

- Gri satıra tıklayınca modal açılır
- Form 3 alanlı (sebep + açıklama + tahmin onayı)
- "Süper admin onayına gönder" → RPC → `tanimsiz_kayitlar` upsert
- Aynı kullanıcı tekrar gönderirse → siklik_sayisi += 1

---

## 86.D — Süper Admin Paneli `admin/oneriler.html` (~2 saat, ayrı oturum)

KARAR-85.4 + KARAR-85.6 + KARAR-85.7 implementasyonu.

### Sayfa Yapısı

- Sidebar'a "Öneriler" linki (super_admin only)
- Üst: 4 metric kart (Bekleyen / Bu Hafta Gelen / Toplam Onaylanan / Reddedilen)
- Filtre çubuğu: Durum / Tip / Tenant / Sıklık
- Tablo:
  - **Sağ tarafta kırmızı rozet ile `siklik_sayisi`** (KARAR-85.7)
  - Ham veri özeti (tip, dis_cap, et, kalite, tanim)
  - Kullanıcı sebebi + açıklama
  - 3 buton: **Sisteme Ekle** | **Tenant-Özel Onayla** | **Reddet**
- Detay popup: tam ham_data, ilgili spool linki, kullanıcı bilgisi

### Karar Sonrası Eylem

| Buton | Eylem |
|---|---|
| **Sisteme Ekle** | İlgili kütüphane tablosuna INSERT (`sistem_preset=true, tenant_id=NULL`) + `tanimsiz_kayitlar.durum='onaylandi'` + `hedef_tablo` + `hedef_kayit_id` |
| **Tenant-Özel Onayla** | Kütüphaneye INSERT (`sistem_preset=false, tenant_id=öneren tenant`) + `durum='onaylandi'` |
| **Reddet** | `durum='reddedildi'` + `karar_notu` zorunlu (kullanıcıya neden gösterilir) |

Tüm üçü için: ilgili `spool_malzemeleri.{boru,fitting,flansh}_olculer_id` UPDATE (FK kalıcı olur, satır gri'den maviye geçer).

### Toplu Tablo Yükleme (KARAR-85.6)

"Sisteme Ekle" butonunun yanında **"Tabloyu Yükle (Excel)"** ek butonu:
- Standart adı seçilir (ASME B16.5, DIN 2448, vb.)
- Excel template indirilir (mevcut KUTUPHANE-YUKLEME-TAKIP.md pattern'i)
- Satırlar yüklenir, ilgili öneri otomatik bağlanır

---

## 86 İçin Hatırlatmalar

- **MK-85.1** — Standart üç kaynaktan biri; kategoriden TÜRETME. Müşteri raw'ı korunur, kanonik eşleştirme yapılır.
- **MK-85.2** — RLS asla kapalı bırakılmaz. Studio "Run without RLS" durup policy yaz.
- **MK-85.3** — Migration öncesi `information_schema.columns` ile şema doğrula. 86.B'de zorunlu.
- **MK-85.4** — Model ile UI simetri kontrolü. UI hilesiyle model hatasını örtme.
- **MK-84.1** — Push paketi eksiksiz olmalı; kapanışta `git status` zorunlu.
- **MK-84.5** — Müşteri raw metni saklanır, kanonik kodla eşleştirilir.

---

## 87+ Genel Yön

- **87** — Public kütüphane sayfası (`arespipe.com/kutuphane`, KARAR-83.1 + KARAR-85.5 yayın filtresi). 86 kapanınca tetiklenir.
- **88** — `parca_etiketleri` + üç-pencere etiketleme UI (81 + 82.C)
- **89** — `kutuphane_ogrenme_durumu` materialized view (81 + 82.D)
- **90** — İzometri parser ileri uygulama: Victaulic-türü kayıtlar **direkt `tip='malzeme'` olarak parse edilir** (057 reconstruct akışı kalkar, doğrudan doğru taksonomi)
- **91** — `spool_flansh_eslesme` junction DROP
- **92+** — Diğer uç işlemleri sözlüğe eklenecek (lazer kesim, expanded taper, dişli flanş)

---

## Bonus İşler (86'da zaman kalırsa)

- `mobile/dist/index.html` Vite SPA için ayrı bir CI kontrol kuralı tasarımı (şu an `mobile/` tamamen muaf)
- KUTUPHANE-YUKLEME-TAKIP.md'ye 86.D toplu tablo yükleme akışı eklenmesi
- 139.70×4.5 ölçüsü için tenant-özel ekleme örneği (86.D sonrası ilk gerçek vaka)
- 60.30×6.3 boş 2 kalemin tanısı (kütüphanede var, 056 neden bağlamadı?)

---

## Test Materyali

| Spool ID | Test Konusu |
|---|---|
| `46622aea-d732-4b66-9fba-bcadc1d354d2` | **86.A renk semantiği bug** — M2/M3/M4/M5 bağsız |
| `00d4926d-5bcf-472c-96af-0447d9feb045` | **86.B/C** — yiv satırı + bağsız reducer + flansh karması |
| `01485adf-aead-49b2-9734-00113053223d` | **86.B** — fitting içeren spool (S10) |
| `tip='malzeme'` 36 kayıt | **86.C modal** — yiv satırı tıklanmıyor (uç işlemi muaf), ama benzer test |

---

> 86. oturum açılışında bu dosya, `.github/son-durum.md` ve `docs/CLAUDE-SON-OTURUM.md` okunur. Sonra Cihat'a "86.A renk bug ile başlayalım mı?" sorulur (gündem kilitli, açılış sorusu standart).
>
> 85, AresPipe taxonomy katmanını gerçekliğe uydurma + tanımsızlık altyapısı kurma oturumuydu. 86 görselleştirme + kullanıcı akışını tamamlar.
