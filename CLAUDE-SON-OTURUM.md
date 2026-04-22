# AresPipe — 17. Oturum Özeti (22 Nisan 2026)

## Değişen Dosyalar
- `kesim.html` — wizard UX, v3 kart, tüm bug fix'ler
- `spool_detay.html` — spool_id insert fix
- `devre_detay.html` — nested select rewrite
- `devre_yeni.html` — notlar kolon fix
- `tr.json`, `en.json`, `ar.json` — 11 yeni anahtar

## DB Migrasyonlar (tümü çalıştırıldı)
```sql
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS boru_ids JSONB DEFAULT '[]';
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS kriter JSONB DEFAULT '{}';
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS kesim_plani JSONB;
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS kapali BOOLEAN DEFAULT false;
ALTER TABLE kesim_listeleri ADD COLUMN IF NOT EXISTS arsiv JSONB DEFAULT '[]';
ALTER TABLE kesim_kalemleri ADD COLUMN IF NOT EXISTS kesim_listesi_id UUID;
```

## kesim.html Ana Değişiklikler

**Wizard Modal (wizardModal):**
- 3 adım tek popup: Boru Listesi → Parametreler → Kesim Planı
- `openKLDetay` → `openWizard(klId, step)` — plan varsa adım 3'ten açar
- `wzGoStep(n)` — adım geçişi, step bar güncelleme, footer buton değişimi
- `wzHesapla()` — algoritma çalıştır, adım 3'e geç
- CSS: `.wz-modal`, `.wz-stepbar`, `.wz-step`, `.wz-num`, `.wz-sc` vb.

**V3 Kart (`_renderV3`):**
- `statEl`: 6 kolonlu grid (Parça/Yeni/Parça Boru/Toplam/Artan/Fire)
- `cardsEl`: stok başına kart — çizgi şema başlıkta + iç tablo
- `pipeTags`: malzeme/kalite/çap/et etiketleri

**Bug fix'ler:**
- Kapalı liste borularının havuzda görünmesi → `kapaliListeIds` kontrolü
- Liste kaybolma → `kesim_plani` fallback SELECT
- Duplicate liste → `unshift` ile başa ekleme
- Toast async → DB save sonrası
- `badgeTam is not defined` → kaldırıldı

## spool_detay.html
`kesimKaydet`, `bukumKaydet`, markalama insert'lerine `spool_id: SP.supaId` eklendi.

## devre_detay.html
`spoolYukle` direkt Supabase nested select ile rewrite:
```js
supa.from('spooller')
  .select('*, kesim_kalemleri(id,kesildi), bukum_kalemleri(id,bukuldu), markalama_kalemleri(id,markalandi)')
  .eq('devre_id', devreId)
```

## devre_yeni.html
`devreler` insert'ten `notlar` kaldırıldı → devreId alındıktan sonra `notlar` tablosuna yazılıyor.

## Dil Dosyaları (11 yeni anahtar)
cmn_disa_aktar, cmn_tur, ks_bos_kesilen, ks_bos_listeler, ks_col_liste_no,
ks_excel_lib_hata, ks_excel_olusturuldu, ks_export_bos, ks_export_hazirlaniyor,
ks_filter_uc, ks_pdf_hazirlandi
