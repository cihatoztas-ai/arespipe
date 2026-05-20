# 102. Oturum — Manuel Onay UI + INSERT Akışı

> **101'den gelen plan.** Hedef: parser çıktısını kullanıcıya göster, onay sonrası `spooller` + `spool_malzemeleri`'ne INSERT.
> 101'de pipeline canlıda, parse_sonuc JSONB hazır. Şimdi UI ve INSERT katmanı.

---

## Açılış Ritüeli

```
2 kısa kontrol:

1. Şunu çalıştırır mısın ve çıktıyı yapıştırır mısın:
   cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5

2. Bugün ne yapmak istiyorsun? (Manuel onay UI mu, başka konu mu?)
```

Cevap geldikten sonra Claude şu dosyaları okur:
- `.github/son-durum.md` (101 kapanışı)
- `docs/CLAUDE-SON-OTURUM.md` (detaylı 101 özeti)
- Bu dosya
- `devre_yeni.html` `ifsOnayla` fonksiyonu (referans — INSERT mantığı)

---

## 101 Sonu Durumu (Özet)

- **CI:** ✅ YEŞİL
- **Migration:** 84 (083 parse_sonuc + 084 durum 7 değer)
- **Endpoint:** `POST /api/kuyruk-isle-excel` canlıda, IFS xlsm test L1 %95
- **DB:** `dosya_isleme_kuyrugu.parse_sonuc JSONB` doluyor
- **Test verisi:** Kuyrukta `id=eb23f38a-...` durum=`oneri_hazir`, parse_sonuc dolu (4 satır IFS BOM)

---

## 102'nin 3 Ana İşi

### İş 1 — Manuel Onay UI (~2 saat) **— ÖNCELİK**

#### Konum
`devre_detay.html` — yeni sekme veya modal. Mevcut "Belgeler" sekmesinden bir adım ileri.

#### Veri Kaynağı
```sql
SELECT k.id, k.parse_sonuc, k.durum,
       d.dosya_adi, d.dokuman_tipi, d.devre_id
FROM dosya_isleme_kuyrugu k
JOIN devre_dokumanlari d ON d.id = k.devre_dokuman_id
WHERE d.devre_id = '<DEVRE_UUID>'
  AND k.durum IN ('oneri_hazir', 'manuel_onay')
  AND d.silindi = false;
```

#### UI Akışı

```
┌──────────────────────────────────────────────────────┐
│ 📋 Parse Sonuçları (2 dosya onay bekliyor)          │
├──────────────────────────────────────────────────────┤
│ • IFS Malzeme Listesi.xlsm                  [Aç ↓]   │
│   ✅ L1 başarılı · %95 güven · 4 satır              │
│                                                       │
│ • Donatım Kontrol Formu.xlsx                [Aç ↓]   │
│   ⚠ Tanınamadı · 7 sayfa kontrol formu              │
│   [Tipini düzelt] [Sil]                              │
└──────────────────────────────────────────────────────┘
```

"Aç" tıklanınca expand:

```
Tablo: parse_sonuc.satirlar
┌─────────┬────────┬─────────┬──────────┬─────────┬────────┐
│ ✓ Seç   │ Spool  │ Boru/Fit│ DN/Boyut │ Malzeme │ Uzun.  │
├─────────┼────────┼─────────┼──────────┼─────────┼────────┤
│ ☑       │ S01    │ Pipe    │ 60.3x4.5 │ ST37    │ 3126   │
│ ☑       │ S01    │ Pipe    │ 60.3x4.5 │ ST37    │ 204    │
│ ☑       │ S01    │ Coupling│ DN50     │ St*     │ —      │
│ ☑       │ -      │ Std.Comp│ DN50     │ A536    │ —      │
└─────────┴────────┴─────────┴──────────┴─────────┴────────┘
[Tümünü Aktar] [İptal]
```

Onay → `ifsOnayla` mantığını çağır (mevcut kod, yeniden uydurma):
1. Spool gruplama (pipeline_no + spool_no)
2. `spool_id` üretimi (`A-0001` formatı, `spoolIdFormatla(kisaKodlar[idx])`)
3. spool_no'da rev ayrımı (`_spoolRevAyir` regex)
4. Boyut parse (`_boyutParcala`)
5. Malzeme canonical (`ARES_NORM.malzemeKod`)
6. Sertifika tespiti (desc'te `3.2|3.3`)
7. INSERT `spooller` + `spool_malzemeleri`
8. Kuyrukta `durum='tamamlandi'`, doküman tablosunda `parse_durumu='tamamlandi'`
9. Devre detay yenile, kullanıcı yeni spool'ları görür

#### Test Senaryoları (smoke)
- `oneri_hazir` dosya açılır, satırlar görünür ✓
- Bazı satırlar seçilir, onaylanır → o satırlar INSERT olur, diğerleri kalmaz
- `manuel_onay` dosyada kolon eşleme modal'ı (102'nin Bonus İşi)
- `hata` dosyada "tanınamadı, tip düzelt" UI

---

### İş 2 — Wizard Auto-Detect Düzeltmesi (~30 dk)

#### Sorun
Test'te gördük: `303S-Sludge System-G200-P2 IFS Malzeme Listesi.xlsm` → `dokuman_tipi='diger'` etiketlendi (yanlış). `Donatım Kontrol Formu.xlsx` → `bom_excel` etiketlendi (yine yanlış). Wizard auto-detect kuralı dar.

#### Yer
`devre_wizard.html` (oturum 99'da yazıldı). Auto-detect fonksiyonunu bul:

```bash
grep -n "auto.*detect\|dokuman_tipi.*=\|sini\(la\|fla\)ndir\|tipi.*belirle" devre_wizard.html | head -20
```

#### Yeni Kural Tablosu

```javascript
function dokumanTipiTahminEt(dosyaAdi) {
  const ad = dosyaAdi.toLowerCase();

  // Önce kesin pattern'ler
  if (ad.includes('izometri') || ad.includes('iso ') || /\.s\d+/.test(ad)) return 'izometri';
  if (ad.includes('spool') && (ad.endsWith('.pdf') || ad.endsWith('.dwg'))) return 'spool_imalat';
  if (ad.endsWith('.stp') || ad.endsWith('.step')) return 'stp';
  if (ad.endsWith('.3dm') || ad.includes('rhino')) return 'rhino';

  // Excel/xlsm → IFS / BOM tahmini
  if (/\.(xlsx|xlsm|xls)$/.test(ad)) {
    if (ad.includes('ifs') || ad.includes('malzeme') ||
        ad.includes('bom') || ad.includes('part list')) return 'bom_excel';
    return 'diger';  // başka xlsm → diger (kontrol formu, tutanak vb.)
  }

  // PDF + akış şeması
  if (ad.includes('p&id') || ad.includes('akis') || ad.includes('flow')) return 'akis_semasi';

  // Şartname
  if (ad.includes('sartname') || ad.includes('teknik') || ad.includes('spec')) return 'sartname';

  return 'diger';
}
```

Yeni eklemeler: "ifs", "malzeme", "bom", "part list" kelimeleri → `bom_excel`.

---

### İş 3 — Wizard Kuyruk Parser Mapping (~30 dk)

#### Sorun
Mevcut 15 wizard yüklemesi hepsi `parser='sakla'`. Şu an wizard kuyruğa yazarken hep `sakla` yazıyor.

#### Yer
`devre_wizard.html` veya backend `api/wizard-yukle.js` (varsa). Kuyruğa INSERT yapan kodu bul:

```bash
grep -rn "dosya_isleme_kuyrugu.*insert\|from.*dosya_isleme" api/ devre_wizard.html
```

#### Yeni Mapping

```javascript
function parserSec(dokuman_tipi) {
  return {
    'bom_excel': 'excel-generic',
    'izometri':  'izometri-oku',
    // diğerleri (sartname, akis_semasi, spool_imalat, stp, rhino, 3d_pdf, diger)
  }[dokuman_tipi] || 'sakla';
}
```

Yani sadece **2 tip otomatik parse edilir** (bom_excel + izometri), diğerleri arşive gider.

---

## Sıralama Önerisi (102 için)

```
0:00-0:15  Açılış + dosya okuma
0:15-2:15  İş 1: Manuel Onay UI (devre_detay.html)
2:15-2:30  Smoke test 1 (mevcut eb23f38a- onayla, spool oluştur)
2:30-3:00  İş 2: Wizard auto-detect düzeltmesi
3:00-3:30  İş 3: Wizard kuyruk mapping
3:30-3:45  Smoke test 2 (yeni IFS yükle → otomatik kuyruğa → endpoint çağır → UI'da gör)
3:45-4:00  Kapanış belgeleri
```

**Toplam:** ~4 saat. Cihat tercihi: 3 işin hepsi mi yoksa sadece İş 1?

---

## Dikkat Etmesi Gerekenler

### MK-101 grubu (yeni — bunlar zorunlu)

- **MK-101.1:** `arespipe_kopyala` sonrası `git status` ile staged dosyaları doğrula
- **MK-101.2:** `npm install` sonrası `package.json + package-lock.json` aynı commit
- **MK-101.3:** `vercel.json` üzerine yazmadan önce `git show HEAD:vercel.json`
- **MK-101.4:** Env değişkeni için `grep "SUPABASE_SERVICE" api/*.js` ile sistem standardını kontrol
- **MK-101.5:** Yeni durum/enum değerleri eklerken `pg_get_constraintdef` kontrolü

### `ifsOnayla` Mantığını Kütüphaneye Çıkarma (Opsiyonel, 103+)

Şu an `ifsOnayla` browser-side function, devre_yeni.html'e gömülü. 102'de manuel onay UI yazarken aynı mantık tekrar lazım olacak (devre_detay.html). İki seçenek:

- (a) Kopyala — kısa vadede hızlı, kod tekrar
- (b) Ortak modül — `js/ifs-onay.js` veya benzeri (105+ refactor sırası)

102'de (a) seçilir, 105'te (b) yapılır.

### `_boyutParcala`, `_malzemeTipi`, `spoolIdFormatla` Yerleri

102'de UI yazılırken bunları `devre_yeni.html`'den `devre_detay.html`'e taşımalı (veya `js/` ortak modülüne). Mevcut yerleri:

```bash
grep -n "function _boyutParcala\|function _malzemeTipi\|function spoolIdFormatla" devre_yeni.html
```

### DB Şema Notları

`dosya_isleme_kuyrugu` ve `devre_dokumanlari` arasındaki ilişki:
- Kuyruk işlerinin durumunu izler (`durum`, `parse_sonuc`, `hata_mesaji`)
- Doküman tablosu üst düzey özet tutar (`parse_durumu`)
- 102'de UI bunları birlikte çekmeli, INSERT sonrası ikisini de `tamamlandi` yapmalı

---

## 103 Bakış (Hatırlatma)

103'te **İzometri wrapper**:
- `api/kuyruk-isle-izometri.js` (102'de Excel UI hazır olunca aynı pattern)
- Mevcut `api/izometri-oku.js`'i HTTP POST ile çağır
- 7-madde halüsinasyon koruması (K3/36) önce
- `parsers/aveva-paor.js` refactor (opsiyonel, MK-49.1 ihlali değil — iç davranış aynı)

---

## Yardımcı Komutlar

```bash
# Açılış
cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5

# Bekleyen onaylar
psql "$DATABASE_URL" <<EOF
SELECT k.id, k.durum, d.dosya_adi, d.devre_id
FROM dosya_isleme_kuyrugu k
JOIN devre_dokumanlari d ON d.id = k.devre_dokuman_id
WHERE k.durum IN ('oneri_hazir', 'manuel_onay')
  AND d.silindi = false;
EOF

# Manuel parse tetik (test için)
curl -X POST https://arespipe.vercel.app/api/kuyruk-isle-excel

# Belirli bir kuyruk kaydını yeniden işle
psql "$DATABASE_URL" -c "UPDATE dosya_isleme_kuyrugu SET durum='bekliyor', parse_sonuc=NULL, hata_mesaji=NULL WHERE id='<UUID>'"
```

---

## 102'nin Anlam Yükü

101 mimari kurdu, 102 **kullanıcının sistemi gerçekten kullanır hale geldiği oturum** olacak. Manuel onay UI hazır olduğunda pilot tersane Excel'i wizard'a sürükler, dakikalar içinde spool listesi otomatik dolar. Bu, Spool AI vizyonu B1 maddesinin **tam canlı çalıştığı an** olur.

---

İyi başlangıçlar, 102.

— 101 Claude
