# CLAUDE-SONRAKI-OTURUM — 88. Oturum

> 87'yi takip eder. Ana iş: tanımsız malzeme akışını sıfırdan, doğru vizyonla yaz.
> 87.C revert edildi (`dad5307`), saha 86.D Phase 1 (sadece okuma) hâlinde.
> Detaylı vizyon: **`docs/88-VIZYON-TANIMSIZLAR.md`** mutlaka oku.

---

## Açılış Ritüeli (CLAUDE.md disiplini + MK-87.1)

2 cevap zorunlu:

1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3`
2. Bugün ne yapmak istiyorsun?

**Sonra Claude şunları okur:**
- `.github/son-durum.md` (kök)
- `docs/CLAUDE-SON-OTURUM.md` (87 detay)
- `docs/CLAUDE-SONRAKI-OTURUM.md` (bu dosya)
- **`docs/88-VIZYON-TANIMSIZLAR.md`** (88 vizyon — kritik)
- `docs/PROJE-HARITASI.md`, `docs/CIHAT-PROFIL.md`, `docs/SPOOL-AI-VIZYON.md` (genel)

---

## 88'in Ana Hedefi

**Tanımsız malzeme akışını yeniden tasarla, vizyona uyumlu yaz.** Üç prensip:

1. **Sıklık = sistemde gerçek tekrar sayısı**, kullanıcı tıklamasına bağlı değil
2. **Kullanıcıya iş yükleme** — sistem otomatik tespit eder
3. **Süper admin sıfırdan araştırmasın** — kütüphane bilinçli sorgu pre-fill yapar

---

## 88 Görev Listesi (Sıralı)

### 88.0 — CLAUDE.md ritüel path düzeltmesi (~5 dk, MK-87.1)

Açılış ritüeli mevcut metni `son-durum.md` ve `CLAUDE-SONRAKI-OTURUM.md`'nin nerede olduğunu net belirtmeli (kök vs `docs/`). 86'da yanlış teşhise yol açmıştı. Tek dosya patch.

### 88.A — `v_tanimsiz_havuz` VIEW migration (~30 dk)

Yeni migration `065_v_tanimsiz_havuz.sql`:

```sql
CREATE OR REPLACE VIEW v_tanimsiz_havuz AS
SELECT
  'boru' AS parca_tipi,
  ROUND(sm.dis_cap_mm::numeric, 3) AS dis_cap_mm,
  ROUND(sm.et_mm::numeric, 3)      AS et_mm,
  sm.kalite_kod_normalize          AS kalite,
  md5('boru|' || ROUND(sm.dis_cap_mm::numeric, 3)::text || '|' ||
      ROUND(sm.et_mm::numeric, 3)::text || '|' || coalesce(sm.kalite_kod_normalize, '')) AS hash_anahtari,
  COUNT(DISTINCT sm.spool_id)      AS siklik,
  COUNT(DISTINCT s.devre_id)       AS devre_sayisi,
  COUNT(DISTINCT s.tenant_id)      AS tenant_sayisi,
  MIN(sm.olusturma_at)             AS ilk_gorulme,
  MAX(sm.olusturma_at)             AS son_gorulme
FROM spool_malzemeleri sm
LEFT JOIN spooller s ON sm.spool_id = s.id
WHERE sm.boru_olculer_id IS NULL
  AND coalesce(sm.tip, '?') = 'boru'
  AND sm.dis_cap_mm IS NOT NULL
  AND sm.et_mm IS NOT NULL
GROUP BY parca_tipi, dis_cap_mm, et_mm, sm.kalite_kod_normalize, hash_anahtari
HAVING COUNT(DISTINCT sm.spool_id) > 0
ORDER BY siklik DESC, son_gorulme DESC;
```

**Açık karar noktaları (88 başında):**
- `spool_malzemeleri` şemasında `kalite_kod_normalize` kolonu var mı? `tip` kolonu var mı? (`information_schema.columns` sorgu)
- View RLS otomatik kalıtır mı, yoksa SECURITY DEFINER fonksiyon mu? (Şema testi)
- `tanimsiz_kayitlar`'daki red kararları view'a JOIN edilsin mi? (Liste'de "reddedildi" rozeti için)

### 88.B — Kullanıcı "Kaydet" akışı kaldır (~15 dk)

`spool_detay.html`:
- `tanimsizModalAc()` ve `tanimsizModalKaydet()` fonksiyonları sök
- Gri/tıklanır kalsın ama tıklayınca info toast: *"Bu malzeme süper admin envanterine düştü, kütüphaneye eklenince otomatik bağlanacak"*
- `tanimsiz_kayit_onerisi` RPC çağrısı kaldırılır

### 88.C — `kutuphane-oneriler.html` listeYukle → v_tanimsiz_havuz (~30 dk)

- `SUPA.from('tanimsiz_kayitlar')` → `SUPA.from('v_tanimsiz_havuz')`
- Kolonlar: tip, parça, ölçü, kalite, **sıklık** (büyük), **devre sayısı**, **tenant sayısı**, ilk görülme
- Sıklık rozetinin anlamı netleşir: 36 spool = 36 yerde bağlanamamış malzeme

### 88.D — Detay paneline "Kütüphane Bilinçli Yardım" (~45 dk)

3 paralel sorgu:

**1. ASME yakın eşleşme:**
```sql
SELECT id, standart, dn, schedule_kod, dis_cap_mm, et_mm, malzeme_grubu
FROM boru_olculer
WHERE ABS(dis_cap_mm - $1) < 0.5 AND ABS(et_mm - $2) < 0.3 AND sistem_preset = true
ORDER BY ABS(dis_cap_mm - $1) + ABS(et_mm - $2) ASC LIMIT 5;
```
Eşleşme varsa: **"Bu ölçü kütüphanede!"** + `[Otomatik bağla]` butonu

**2. Kalite katalog kontrolü:**
```sql
SELECT id FROM malzeme_kataloglari
WHERE lower(regexp_replace(grade, '[^a-z0-9]', '', 'g')) = $1;
```
Boşsa: *"DIN 17100 (St 37 ailesi) kataloga eklenmemiş — `0XX_din_17100_seed.sql` öner"*

**3. STD_KILAVUZ JS lookup:**
50-100 satır yaygın kombinasyon (Cihat'ın referans listesinden + ProjectMaterials.com'dan). Eşleşme varsa modal pre-fill için kullanılır.

### 88.E — `oneri_kutuphaneye_bagla` RPC (~30 dk)

Yeni migration `066_oneri_bagla_rpc.sql`:

```sql
CREATE OR REPLACE FUNCTION oneri_kutuphaneye_bagla(
  p_dis_cap_mm NUMERIC,
  p_et_mm NUMERIC,
  p_kalite TEXT,
  p_boru_olculer_id UUID
) RETURNS INT  -- kaç spool_malzemesi güncellendi
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin_id UUID;
  v_count INT;
BEGIN
  v_admin_id := auth.uid();
  IF NOT EXISTS (SELECT 1 FROM kullanicilar WHERE id = v_admin_id AND rol = 'super_admin') THEN
    RAISE EXCEPTION 'Yetkisiz' USING ERRCODE = '42501';
  END IF;

  UPDATE spool_malzemeleri
  SET boru_olculer_id = p_boru_olculer_id
  WHERE boru_olculer_id IS NULL
    AND ROUND(dis_cap_mm::numeric, 3) = ROUND(p_dis_cap_mm::numeric, 3)
    AND ROUND(et_mm::numeric, 3) = ROUND(p_et_mm::numeric, 3)
    AND lower(regexp_replace(coalesce(kalite_kod_normalize, ''), '[^a-z0-9]', '', 'g')) = lower(regexp_replace(p_kalite, '[^a-z0-9]', '', 'g'))
    AND coalesce(tip, '?') = 'boru';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;
```

UI: "Otomatik bağla" → bu RPC → toast "36 spool bağlandı" → liste yenile (kayıt artık view'de görünmez).

### 88.F — STD_KILAVUZ JS lookup seed (~30 dk)

```js
const STD_KILAVUZ = {
  // ASME B36.10M karbon yaygın
  'boru:21.30:2.77':  { std:'ASME B36.10M', dn:15,  sch:'SCH40', malzeme_grubu:'karbon', urun_formu:'seamless' },
  'boru:26.70:2.87':  { std:'ASME B36.10M', dn:20,  sch:'SCH40', malzeme_grubu:'karbon', urun_formu:'seamless' },
  'boru:33.40:3.38':  { std:'ASME B36.10M', dn:25,  sch:'SCH40', malzeme_grubu:'karbon', urun_formu:'seamless' },
  'boru:48.30:3.68':  { std:'ASME B36.10M', dn:40,  sch:'SCH40', malzeme_grubu:'karbon', urun_formu:'seamless' },
  'boru:60.30:3.91':  { std:'ASME B36.10M', dn:50,  sch:'SCH40', malzeme_grubu:'karbon', urun_formu:'seamless' },
  'boru:73.00:5.16':  { std:'ASME B36.10M', dn:65,  sch:'SCH40', malzeme_grubu:'karbon', urun_formu:'seamless' },
  'boru:88.90:5.49':  { std:'ASME B36.10M', dn:80,  sch:'SCH40', malzeme_grubu:'karbon', urun_formu:'seamless' },
  'boru:114.30:6.02': { std:'ASME B36.10M', dn:100, sch:'SCH40', malzeme_grubu:'karbon', urun_formu:'seamless' },
  // DIN 2448 / EN 10216
  'boru:139.70:4.50': { std:'DIN 2448',     dn:125, sch:'4.5mm',  malzeme_grubu:'karbon', urun_formu:'seamless' },
  // ... toplam 50-100 satır
};
```

Liste Cihat'ın saha deneyiminden + ProjectMaterials.com referansından oluşturulur.

### 88.G — Manuel kaydet modal (~45 dk)

87.C'deki boru onay modal'ı refactor:
- STD_KILAVUZ eşleşmesi varsa pre-fill (Cihat sadece onaylar)
- ASME yakın eşleşme varsa modal **açılmaz**, "Otomatik bağla" yolu önerilir
- Internet araştırması "yok denecek kadar az" hedef

INSERT INTO boru_olculer **+** UPDATE spool_malzemeleri.boru_olculer_id (88.E RPC'sini reuse).

### 88.H — Saha test + commit + push (~30 dk)

3 senaryo:
1. **Yakın eşleşme akışı:** Kütüphanede var → tek tıkla 36 spool bağlanır
2. **Tam yeni kayıt:** Modal manuel doldurulur → boru_olculer'a INSERT + spool_malzemeleri UPDATE
3. **Red:** Mevcut RPC (`oneri_reddet`), tanimsiz_kayitlar audit log'a yazar

---

## Açık Sorular (88'de cevaplanacak)

1. **`spool_malzemeleri` şeması:** `tip`, `kalite_kod_normalize`, `dis_cap_mm`, `et_mm` kolonları var mı? Migration 88.A öncesi `information_schema.columns` sorgusuyla teyit edilir.

2. **`fitting_olculer` ve `flansh_olculer` için aynı view:** 88'de sadece boru phase 1 mi, yoksa 3 view birden mi? Cihat'a sor.

3. **Migration 063 RPC'leri (`oneri_reddet`, `oneri_onayla_boru`):** 88'de DROP edilsin mi yoksa kalıp 88.G manuel modal'ında reuse mu? (Tahminim: reuse — sadece UI yolu değişir, RPC mantığı tutarlı.)

4. **`tanimsiz_kayitlar` tablosu rolü:** 88'de "audit log" rolüne düşer. Yeni karar UI'sı tablo'ya `durum='reddedildi'` yazmaya devam etsin mi (red kararları için)? Onay kararları artık `spool_malzemeleri.boru_olculer_id` UPDATE'i ile dolaylı görülür — ayrı tablo gerekmiyor.

5. **STD_KILAVUZ'ı JS sabit mi yoksa DB tablosu mu yapalım?** JS sabit basit ama Cihat editleyemez. DB tablo `kilavuz_olcu_eşleme` Cihat'ın `tanimlar.html` üzerinden yönetilmesini sağlar. Karar 88'in başında.

---

## 88'de Veriyle Tasarım

- View deploy edilince Cihat'ın merak ettiği "kaç tanımsız var" sayısı görünür (sıklığa göre desc)
- "Yakın eşleşme bul" sorgusu beklenen davranış: en az 1-2 satırda gerçek eşleşme bulunmalı (sistemde 779 boru kayıt var, hash kombinasyonlarına yakınlar olmalı)
- STD_KILAVUZ kapsama oranı: ilk seed 50 satırla %30+ tanımsız hash'i pre-fill edebilmeli (hedef)

---

## Bonus İşler (88'de zaman kalırsa)

- Migration 063 RPC'leri (`oneri_reddet` + `oneri_onayla_boru`) **88.G manuel modal'ında reuse** — yeniden yazılmasın
- `fitting_olculer` ve `flansh_olculer` için `v_tanimsiz_havuz_fitting` ve `v_tanimsiz_havuz_flansh` view'leri
- "Toplu onay" özelliği — view'de aynı standart altında 10 farklı DN varsa, hepsini birden eklemek için "Standart toplu yükle" akışı

---

## Süreç Disiplinleri (87'den taşınan + öncesi)

- **MK-87.1** — Açılış ritüeli `docs/` path'i kontrol etmeli, kök değil
- **MK-87.2** — Eski admin sayfaları farklı sidebar pattern'ında, layout standardizasyonu 88+ borcu
- **MK-87.3** — Mac terminal commit mesajları tek satır olmalı
- **MK-87.4** — Sıklık counter modeli yanlış — gerçek-zamanlı view
- **MK-87.5** — Sistem otomatik tespit edebilen şeyi kullanıcıya kaydettirme
- **MK-87.6** — Süper admin internet araştırmasından önce sistem kendi kütüphanesini kontrol etmeli
- **MK-86.x** — zsh tek tırnak / base64 / heredoc tuzakları, şema+CHECK+RLS üçü doğrulanmadan migration yazılmaz
- **MK-85.x** — RLS asla kapalı, model-UI simetri, sade test
- **MK-51.1** — Dosya kopyalamadan önce `~/Downloads/_arsiv/` + MD5 doğrulama
- **MK-49.1** — Mevcut çalışan koda minimum müdahale, sadece ilgili fonksiyon

---

## Kritik Hatırlatmalar

- **`tanimsiz_kayit_onerisi` RPC ve `tanimsiz_hash_anahtari` fonksiyonu DB'de kalır.** UI çağrısı kaldırılır (88.B). Migration ile DROP 90+ oturumlara.
- **Migration 063 (`oneri_reddet`, `oneri_onayla_boru`)** DB'de atıl. 88.G reuse edebilir.
- **86.C v2.1 hotfix'i çalışıyor** — saha test sırasında bir kayıt (`std_disi|139.700|4.500|st37`) sorunsuz oluştu, CHECK constraint geçti.
- **87.A migration 062 (`ozel_parcalar`, `tenant_spec_seti`, `spec_kural`)** DB'de aktif, count = 0. P3 öncelikli, 88'de doldurulmaz.

---

> 88. oturum açılışında bu dosya, `.github/son-durum.md`, `docs/CLAUDE-SON-OTURUM.md` ve **`docs/88-VIZYON-TANIMSIZLAR.md`** okunacak. Önerilen sıra: 88.0 (CLAUDE.md ritüel fix) → 88.A (view migration) → 88.B (kullanıcı kaydet sök) → 88.C (listeYukle değişimi). Bu zincir 88'in core'u, kalan adımlar bonus.
