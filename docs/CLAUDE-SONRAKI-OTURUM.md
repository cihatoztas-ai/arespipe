# CLAUDE-SONRAKI-OTURUM — 84. Oturum Gündemi

> Bu dosya 84'ün açılışında okunacak. Birlikte: `.github/son-durum.md` + `docs/CLAUDE-SON-OTURUM.md`.

---

## 84. Oturum Ana Tema

**Uç işlemi taxonomy refactor (KARAR-83.2) + Kütüphane FK bağlama tamamlama.**

83'te kütüphane bağlama altyapısı kuruldu (3 FK kolonu + master join + iki boyutlu standartlık) ama veri tarafında üç açık iş kaldı:
1. 36 Victaulic Groove-Steel kaydı yanlış kategoride (parça değil, uç işlemi)
2. 41 boş `boru_olculer_id` (kütüphane kapsamı veya yazım farkı)
3. Fitting + Flansh için FK bağlama mekanizması henüz yok (sadece 1 flansh kaydı migrate edildi)

84 bunları kapatır.

---

## Açılış Ritüeli (CLAUDE.md disiplini, kısaltılmış 2-soru hâli)

```
Oturum başlangıç ritüeli. 2 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3

2. Bugün ne yapmak istiyorsun? (Önerilen: 84 gündemi A→B→C→D sırası)
```

`son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` (bu dosya) okunur. Sonra 84.A'ya başlanır.

---

## 84.A — Migration 057: Uç İşlemi Refactor (öncelik 1, ~1 saat)

KARAR-83.2'nin DB tarafı.

### Plan

**1. Şema değişikliği** — `spool_malzemeleri` (veya parent boruyu tutmak için `spooller`) tablosuna iki kolon:

```sql
ALTER TABLE spool_malzemeleri
ADD COLUMN IF NOT EXISTS uc_a_islemi TEXT,
ADD COLUMN IF NOT EXISTS uc_b_islemi TEXT;

-- Kabul edilen değerler: 'plain' (düz), 'bevel' (kaynak ağzı), 'groove_victaulic' (yiv), 'threaded' (diş), 'socket' (cep)
ALTER TABLE spool_malzemeleri
DROP CONSTRAINT IF EXISTS spool_malzemeleri_uc_islemi_chk;

ALTER TABLE spool_malzemeleri
ADD CONSTRAINT spool_malzemeleri_uc_islemi_chk
CHECK (
  (uc_a_islemi IS NULL OR uc_a_islemi IN ('plain','bevel','groove_victaulic','threaded','socket')) AND
  (uc_b_islemi IS NULL OR uc_b_islemi IN ('plain','bevel','groove_victaulic','threaded','socket'))
);
```

Karar noktası: Boru kalemleri için uç işlemi mantıklı (her boru iki uçludur). Fitting/flansh için anlamlı mı? Fitting de kaynak ağızlı olabilir (BW fitting) — yine de kolonlar `spool_malzemeleri`'nde dursun, tip-bağımsız.

**2. Mevcut Victaulic kayıtlarını parent boruya migrate et**

36 Victaulic satırının her biri için: aynı `spool_id`'deki boru kalemi(leri)ne `uc_a_islemi='groove_victaulic'` ata. Hangi uca (A veya B)? İlk yaklaşım: her ikisine `groove_victaulic` ata (Victaulic genelde iki ucu da yivlidir → kelepçe-kelepçe bağlantı). Daha sonra izometri parser'ı düzeltilirken doğru ucu belirleyebilir.

```sql
WITH parent_boru AS (
  SELECT v.id AS victaulic_id, v.spool_id, v.dis_cap_mm,
         (SELECT b.id FROM spool_malzemeleri b
          WHERE b.spool_id = v.spool_id
            AND b.tip = 'boru'
            AND b.dis_cap_mm = v.dis_cap_mm
          ORDER BY b.olusturma LIMIT 1) AS boru_id
  FROM spool_malzemeleri v
  WHERE v.tanim ILIKE '%victaulic%'
)
UPDATE spool_malzemeleri sm
SET uc_a_islemi = 'groove_victaulic',
    uc_b_islemi = 'groove_victaulic'
FROM parent_boru pb
WHERE sm.id = pb.boru_id;
```

**Edge case'ler:**
- Victaulic var, eşleşen boru yok → kayıt yetim. 84'te bu durumlardan kaç tane var önce sayılmalı (Cihat'a sor: silinecek mi yoksa parent boru oluşturulacak mı?)
- Aynı spool'da birden fazla boru var, çapları farklı → en uygun olan seçilmeli
- Bir borunun her iki ucu groove ama tek Victaulic satırı var → her iki uca atamalıyız mı? Bu noktada Cihat'tan saha bilgisi gerekli

**3. Victaulic satırlarını sil**

```sql
DELETE FROM spool_malzemeleri
WHERE tanim ILIKE '%victaulic%';
-- Beklenen: 36 satır silinir
```

**4. Doğrulama**

```sql
SELECT count(*) FROM spool_malzemeleri WHERE tanim ILIKE '%victaulic%';
-- Beklenen: 0

SELECT count(*) FROM spool_malzemeleri
WHERE uc_a_islemi = 'groove_victaulic' OR uc_b_islemi = 'groove_victaulic';
-- Beklenen: 36'ya yakın (her Victaulic satırı tek boruya gitse 36, ama bazıları aynı boruya gitmiş olabilir → daha az)
```

---

## 84.B — Boru Kütüphanesi Doluluk Analizi (~30 dk)

29/70 boru bağlandı. 41 boş satır neden eşleşmedi? İki olasılık:

1. Kütüphanede o ölçü gerçekten yok
2. Yazım/scale farkı var (örn. spool'da `139.70` ama kütüphanede `139.7`)

```sql
-- Hangi ölçüler boş kaldı?
SELECT sm.dis_cap_mm, sm.et_mm, count(*) AS spool_adet
FROM spool_malzemeleri sm
WHERE sm.tip = 'boru' AND sm.boru_olculer_id IS NULL
GROUP BY sm.dis_cap_mm, sm.et_mm
ORDER BY spool_adet DESC;

-- Kütüphanede yakın ölçü var mı? (tolerans bazlı)
SELECT sm.dis_cap_mm AS spool_d, sm.et_mm AS spool_t,
       bo.dis_cap_mm AS lib_d, bo.et_mm AS lib_t,
       abs(sm.dis_cap_mm - bo.dis_cap_mm) AS d_fark,
       abs(sm.et_mm - bo.et_mm) AS t_fark
FROM spool_malzemeleri sm
LEFT JOIN boru_olculer bo
  ON abs(sm.dis_cap_mm - bo.dis_cap_mm) < 0.5
 AND abs(sm.et_mm - bo.et_mm) < 0.2
WHERE sm.tip = 'boru' AND sm.boru_olculer_id IS NULL
LIMIT 20;
```

Çıktıya göre:
- (a) Ölçü kütüphanede yok → kütüphaneye ekleme önceliği listesi (KUTUPHANE-YUKLEME-TAKIP'a not)
- (b) Yakın ölçü var (tolerans dahilinde) → migration 058 yazılır, tolerans-bazlı eşleştirme

---

## 84.C — Fitting & Flansh FK Bağlama (~1-2 saat)

Boru için 056 back-fill yeterli (tam ölçü eşleşmesi). Fitting/flansh için tanım parsing gerekiyor — daha riskli.

### Flansh

Tanım örnekleri:
- "Flange Slip-On PN 16 - 2.2 Certificate" → TYPE='SO', CLASS karşılığı PN16
- "International Shore Connection Flange PN16" → özel flanş, kütüphanede yok

Parsing kuralı (regex):
- TYPE: `slip[- ]on|wn|weld[- ]neck|blind|bl|so|lj|lap|threaded|th` → `'SO'|'WN'|'BL'|'LJ'|'TH'`
- CLASS: `PN ?\d+|Class ?\d+|150|300|600|...`
- DN: `dis_cap_mm`'den çıkar (60.3 → DN50, 114.3 → DN100)

**Risk**: Hayalî eşleşme. Tanım belirsizse FK doldurma, manuel onaya bırak. Önerilen yaklaşım: AI öneri + kullanıcı onay UI.

### Fitting

Tanım örnekleri yok elimizde (Victaulic temizlendikten sonra geri kalan 79-43=43 satır gerçek fitting). 84.A'dan sonra:

```sql
SELECT tanim, count(*) FROM spool_malzemeleri WHERE tip = 'fitting' GROUP BY tanim;
```

Çıkan tanımlara göre regex parser yazılır (elbow, tee, reducer, cap, vb.).

---

## 84.D — Boru Modal'ı FK Kalıcı Kaydetme (5-10 dk)

`spool_detay.html` line 3609 etrafında `boruModalAc` runtime'da eşleşmeyi buluyor ama FK kaydetmiyor. Tek UPSERT eklemek yeterli:

```js
// boru_olculer kayıt bulunduğunda
if(found && SP.malzeme_id && !m.boru_olculer_id){
  supa.from('spool_malzemeleri')
    .update({ boru_olculer_id: found.id })
    .eq('id', SP.malzeme_id)
    .then(...);
}
```

Bu sayede 41 boş satır kullanıcı tıkladıkça organik şekilde dolar.

---

## 84 İçin Hatırlatmalar

- **KARAR-83.1 uygulaması canlı** — Patch 3 push edildikten sonra turuncu rozet aktif. Yeni eklenen FK kolonları (`boru_olculer_id`, `fitting_olculer_id`, `flansh_olculer_id`) renkleri etkiliyor. 84.A migration'ı çalıştıktan sonra Victaulic satırları silineceği için "fitting" tipindeki turuncu rozet sayısı düşecek.
- **MK-83.1** İki boyutlu standartlık — her yeni rapor/yayın endpoint'inde bu filtre uygulanmalı
- **MK-83.2** Uç işlemleri taxonomy'ye eklenirken `spool_malzemeleri.tip` enum'una `'islem'` veya benzer eklenmesin — yanlış yön. İşlemler **kolon** olarak duruyor (`uc_a_islemi`, `uc_b_islemi`)
- **MK-83.3** Yeni FK eklendiğinde grep ile tüm SELECT cümlelerini tarayıp silent state oluşmasını engelle
- **MK-83.4** Supabase UPDATE sonrası `count(*) FILTER (WHERE fk IS NOT NULL)` ile gerçek etki doğrula

---

## 85+ Genel Yön (değişmedi, 83'te netleşen)

- **85.A** — İzometri parser'ı KARAR-83.2 ileri uygulama (Victaulic-türü kayıtlar parça listesine eklenmesin, uç işlemi olarak çıksın)
- **85.B** — `spool_flansh_eslesme` junction tablosu DROP (1-2 oturum gözle, sonra)
- **85.C** — Tek `parcaModalAc(spool_malzeme_id)` refactor (boru + fitting + flansh tek fonksiyon)
- **86+** — Public kütüphane sayfası (`arespipe.com/kutuphane`, KARAR-82.5 + KARAR-83.1 yayın filtresi)
- **84+ paralel** — Anomali tespiti: "groove ucuna kaynak yapılmamalı" (Cihat'ın saha gözlemi → otomatik KK uyarısı)

---

## Bonus İşler (84'te zaman kalırsa)

- "SA/A105" normalize bug fix (ARES_NORM.kaliteKodNormalize'a "SA/" prefix kuralı)
- 1 hatalı boru/A105 kaydının manuel düzeltilmesi (yanlış kalite ataması, 28 Nisan eski test verisi)
- Patch 3 öncesi M1 satırı için "ölçü kütüphanede yok" tooltip'i UI'da görsel pekiştirme (örn. bilgi ikonu)

---

## Storage / Test Spool ID'leri (83'ten faydalı)

- `00d4926d-5bcf-472c-96af-0447d9feb045` (S07) — 2 kalem, M1 (St 37/139.7×4.5 lib yok) + M2 (Victaulic/St*)
- `01485adf-aead-49b2-9734-00113053223d` (S01) — 5 kalem, hem boru hem flanş hem Victaulic
- `9911dc39-f826-4eb9-89aa-cdb40253edb1` (S01) — 3 kalem, hep St 37
- `88114af4-38bf-4b22-aa75-04c29e80e830` — boru kesit modal'ı (DN50 60.3×4.5) açılıyor, mavi tıklanabilir

84'te 84.A migration sonrası bu spool'lar yeniden test edilmeli — Victaulic satırları kaybolmuş, parent borularda `uc_a_islemi='groove_victaulic'` görünmeli (UI'da gösterimi 85'te gelir, şu an DB'de var).

---

> 84. oturum açılışında bu dosya, `.github/son-durum.md` ve `docs/CLAUDE-SON-OTURUM.md` okunur. Sonra Cihat'a "84.A migration ile başlayalım mı?" sorusu sorulur (gündem kilitli, açılış sorusu standart).
