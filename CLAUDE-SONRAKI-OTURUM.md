# CLAUDE-SONRAKI-OTURUM.md — 64. Oturum

> 63'ü takip eder. **Birincil iş: MIsBaslat.jsx** — operatör çekirdek akışı, vanilla `is_baslat.html` 1930 satır, mobile React port'u.

---

## Açılış Ritüeli (CLAUDE.md disiplini, 52. oturumda sadeleşti)

2 kontrol cevabı zorunlu:

1. **`git pull` temiz mi + CI yeşil mi?** →
   ```bash
   cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
   ```

2. **Bugün ne yapmak istiyorsun?** → Önerilen: MIsBaslat.jsx (briefing'in birincil işi)

---

## 64'ün Hedefi

**MIsBaslat.jsx** mobile React port'u. Vanilla `is_baslat.html` (1930 satır) operatörlerin günlük çekirdek akışı:

- Rol seçimi → QR tara → Spool detayı gör → İşe başla → Çalış → Foto çek + Basamak seç → Tamamla
- 10 ekranlı state machine
- LocalStorage persistance (`ares_is_aktif` — sayfa yenilenirse devam eder)
- Foto upload (Supabase Storage `arespipe-dosyalar` bucket)
- 3 ayrı foto akışı: not ekle (opsiyonel), kapanış (zorunlu), son foto SF (on_kontrol basamağı)
- Uyarı sistemi: alıştırma VAR/KISMI, test tanımlı, `qr_goster=true` notlar

---

## 64. Oturum Yaklaşımı (R-10 mockup-first 5-batch)

Tek seferde tüm 10 ekranı mockup yapmak imkansız. Batch-batch ilerle:

### Batch 1 — Rol Seç + QR + Spool Detay (mockup)

İlk 3 ekran. R-10: önce 3-mockup yan yana, kullanıcı onayı, gerekirse iterasyon.

Önemli noktalar:
- **Rol Seç:** `ARES.kullaniciBloklari()` çağrısı, ISLEM_BLOKLARI = ['İmalat', 'Kaynak', 'Büküm', 'Kesim', 'Markalama', 'Ön Kontrol']. Tek blok varsa otomatik geç (800ms sonra rolDevam).
- **QR Tara (ekran 2):** MQRTara'dan kopya değil — burada modal değil tam ekran kamera + manuel input alt-alta. Cross-tenant uyarı + payload parse zaten 63.4'te yapıldı, kod paylaşılabilir.
- **Spool Detay:** Foto carousel + 2 sekme (Genel/Malzeme) + dinamik foot (`is_durumu` durumuna göre "İşe Başla" veya "İşi Kapat + Not Ekle + İptal").

### Batch 2 — Uyarı + Not Ekle (mockup)

Akış: Spool detay → "İşe Başla" tıkla → uyarı listesi varsa Uyarı ekranı ara adım → onay → DB update → durum "devam_ediyor".

- **Uyarı:** 3 tip — kırmızı (alıştırma VAR), sarı (alıştırma KISMI veya qr_goster=true notlar), mavi (test tanımlı)
- **Not Ekle:** Textarea + foto upload (multi-select) + not geçmişi listesi (`notlar` tablosu)

### Batch 3 — Foto Kapat + Basamak Seç + Tamamla (mockup)

Akış: Devam eden iş → "İşi Kapat" → Foto Kapat (zorunlu file input) → Basamak Seç (rol'e göre filtreli) → Tamamla → DB update.

- **Foto Kapat:** Tek dosya, kamera/galeri açar, önizleme, "Devam Et" butonu (foto seçilene kadar disabled)
- **Basamak Seç:** ROL_BASAMAKLAR map'i — `İmalat`/`Kaynak` → `argon_kaynagi`/`gazalti_kaynagi`/`on_kontrol`, diğer roller sadece `on_kontrol`. Alıştırma=VAR ise kaynak basamakları disabled.
- **Tamamla:** DB update (aktif_basamak, is_durumu='bekliyor', guncelleme), is_kayitlari INSERT, foto upload, 2sn sonra QR'a dön

### Batch 4 — SF Akışı (on_kontrol için, mockup)

Spool `aktif_basamak === 'on_kontrol'` ise farklı akış: spoolYukle direkt SF ekranına gider (Spool Detay atlanır). Bu akış imalat çıkış fotoğrafı içindir, basamak değişmez.

### Batch 5 — Kod Port (5 batch onaylanınca)

Tüm mockup'lar onaylandıktan sonra MIsBaslat.jsx tek seferde yazılır. Tahmini boyut: 1500-2000 satır.

---

## Vanilla Referans Detayları

`is_baslat.html` (1930 satır) okundu, ana yapısı:

### Sabit veriler (script üst kısmı)

```js
var ISLEM_BLOKLARI = ['İmalat', 'Kaynak', 'Büküm', 'Kesim', 'Markalama', 'Ön Kontrol']

var ROL_BASAMAKLAR = {
  'İmalat':     ['argon_kaynagi', 'gazalti_kaynagi', 'on_kontrol'],
  'Kaynak':     ['argon_kaynagi', 'gazalti_kaynagi', 'on_kontrol'],
  'Büküm':      ['on_kontrol'],
  'Kesim':      ['on_kontrol'],
  'Markalama':  ['on_kontrol'],
  'Ön Kontrol': ['on_kontrol']
}

var BASAMAK_TANIMLARI = [
  { sistem_adi: 'argon_kaynagi',  ad: tv('mob_is_bsm_argon',   'Argon Kaynağı'),   renk: '#d97706' },
  { sistem_adi: 'gazalti_kaynagi',ad: tv('mob_is_bsm_gazalti', 'Gazaltı Kaynağı'), renk: '#d97706' },
  { sistem_adi: 'on_kontrol',     ad: tv('mob_is_bsm_on_kontrol','Ön Kontrol'),    renk: '#7c3aed' }
]
```

### Spool yükleme arama mantığı

```js
// UUID → id, sadece rakam → spool_id, diğer → spool_no
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
var aramaKolonu = UUID_RE.test(val) ? 'id'
                : /^[0-9]+$/.test(val) ? 'spool_id'
                : 'spool_no'
```

### Spool SELECT (ana sorgu)

```js
'id, spool_no, spool_id, pipeline_no, dis_cap_mm, et_kalinligi_mm, agirlik, malzeme, kalite, yuzey_islemi, rev, aktif_basamak, is_durumu, ilerleme, durdurma_sebebi, alistirma, devreler(id, ad), fotograflar(...), spool_malzemeleri(...), kesim_kalemleri(...), bukum_kalemleri(...), markalama_kalemleri(...)'
```

5 alt-tablo sorgusu Promise.all ile paralel atılıyor (`_safe` wrapper ile).

### Foto upload helper

```js
async function fotoyukle(file, islemTuru) {
  // Dosya adı: tenant_id + '/' + spool_id + '/' + Date.now() + '_' + islemTuru + '.' + uzanti
  // Bucket: arespipe-dosyalar
  // Önce storage.upload, sonra getPublicUrl, sonra fotograflar tablosuna INSERT
}
```

### LocalStorage persistance

`ares_is_aktif` key — `{id, rol}` JSON. `is_durumu='devam_ediyor'` set edilince yazılır, sıfırlanınca silinir. Sayfa açılışında kontrol: aktif iş varsa direkt o spool yüklenir.

---

## Açık Borç (önceliğe göre)

1. **MIsBaslat.jsx 5-batch port** (yukarıda detay)
2. **MQRTara cross-tenant uyarısı** — 6. oturum planı, MIsBaslat sırasında MQRTara'da da fix atılır (paylaşılan akış)
3. **MK-58.1 alıştırma enum migration** — MIsBaslat'ta da uppercase 'VAR'/'KISMI'/'YOK' okunacak, tüm mobile dönüşümü sonra tek seferde lowercase'a
4. **MK-62.3 README açığı** — predev script `mobile/src/lang/README.md`'yi siliyor, predev'e README üretme satırı eklenmeli (MIsBaslat sırasında natural moment)

---

## 64'te Veriyle Tasarım

Mockup-first protokolü zaman alıyor — 5 batch için tahmini 60-90 dakika sadece mockup. Buna karşılık kod aşaması ~30 dakika sürecek (port iş, kreatif iş değil). Toplam 90-120 dakika. Vakit darsa Batch 1+2 mockup, kullanıcı onayıyla Batch 3'te kod yazımına geçilebilir, Batch 4 (SF) sonraki oturum.

---

## Kritik Hatırlatmalar (63'ten taşınanlar)

### MK-63.A — DB sütun adlarını varsayma
Vanilla'daki kolon adına direkt güven. Ezbere yazma. Knowledge base bayat olabilir.

### MK-63.B — "Planlandı" ≠ "Yapılmadı"
Briefing'deki plan notları sonraki oturumda gerçekleştirilmiş olabilir. Vanilla dosyayı cross-check et.

### MK-63.C — Knowledge Base Sayım/Tarih Bayatlığı
`wc -l`, `git log`, `cat package.json` ile baseline kontrol.

### MK-51.1 — Dosya kopyalama protokolü (51'den)
`cp` öncesi `wc -l` ile boyut doğrula. Tarayıcı suffix'leri (`tr (13).json` vs `tr (12).json`) için en yenisini al.

### MK-51.2 — Yeterli ornek prensibi
Regex/parse kuralları en az 5 farklı gerçek örnekle test edilir.

---

## Süreç Disiplinleri (62 + 63'ten)

- **Heredoc/sed yöntemi** dosya patch için (Mac indirme bozuk olabilir)
- **`git pull --rebase origin main`** her push öncesi (GitHub Actions otomatik commit ekliyor)
- **Vercel "Canceled"** = ardışık push, panic değil
- **Filesystem I/O hatası** olursa dosyaları yeniden yükle (sandbox geçici sorun)
- **Sadece terminal git akışı** (51'den, GitHub web upload kullanma)

---

## Bonus İşler (64'te zaman kalırsa)

- **MK-62.3 README açığı** kapat — predev script güncellemesi
- **MAnasayfa kart yönlendirmeleri** — Bekleyen Spool, KK Bekleyen, vs. henüz `yakinda(...)`. MIsBaslat tamamlanınca operatörler için anlamlı yönlendirme.
- **MQRTara cross-tenant uyarısı** — küçük iş (6. oturum planı), MIsBaslat'ın QR ekranıyla beraber halledilebilir

---

## Storage Bucket'ı (Bilinen)

```
arespipe-dosyalar/
  {tenant_id}/
    {spool_id}/
      {timestamp}_{islem_turu}.{uzanti}
```

`islem_turu` değerleri: `not_imalat`, `not_kaynak`, `imalat`, `kaynak`, `on_kontrol` vb.

---

## Sayılar Hatırlama

- HEAD: `b139a60` (63 sonu)
- Lang: 1800 anahtar TR/EN/AR senkron
- Mobile ekran: 9 tamamlandı (MGiris, MAnasayfa, MAnasayfaYonetici, MIslemler, MDrawer, MSpoolDetay, MDevreDetay, MDevreler, MQRTara)
- Bekleyen ekran: MIsBaslat (1500-2000 satır), MProfil (avatar yükleme)

---

> 64. oturum açılışında `son-durum.md` + `CLAUDE-SON-OTURUM.md` + bu dosya okunur. Sonra Cihat'a "Hangi işle başlayalım?" sorusu sorulur. Önerilen: MIsBaslat Batch 1 mockup ile başla.
