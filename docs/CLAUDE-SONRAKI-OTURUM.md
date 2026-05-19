# 101. Oturum — Önizleme + Excel Parser + İzometri Wrapper

> **100'den gelen plan.** Hedef: Devre detay'da doküman önizleme + wizard yüklemelerinin **otomatik parse** edilmesi. 100'de UI tamamlandı, şimdi veri katmanı.

---

## Açılış Ritüeli (CLAUDE.md disiplini)

2 kısa kontrol:

1. **`git pull` temiz mi?**
   ```bash
   cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5
   ```

2. **Bugün ne yapmak istiyorsun?**

Cevap geldikten sonra Claude şu dosyaları okur:
- `.github/son-durum.md` (100 kapanışı)
- `docs/CLAUDE-SON-OTURUM.md` (detaylı 100 özeti)
- Bu dosya
- `docs/IZOMETRI-BATCH-KARAR.md` (mevcut izometri-oku.js mimarisi için referans)

---

## 100 Sonu Durumu (Özet)

- **Migration:** 82'de duruyor (100 sadece UI)
- **CI:** ✅ YEŞİL, 22 uyarı (Faz B baseline)
- **Vercel:** Production = 100 sonu, son commit `6579c2e` (önizleme revert sonrası temiz hâl)
- **Wizard:** Canlıda, pilot tenant A+E aktif, 15+ smoke test dosyası yüklendi/silindi
- **Devre detay:** İki kaynaklı belge listesi (📎 modal + 📁 wizard tree) + arama (≥8 dosyada) çalışıyor
- **Önizleme:** Yok (100'de iki kez denendi, syntax bug, revert)

---

## 101'in 3 Ana İşi

### İş 1 — Önizleme Modal v3 (~1 saat) **— ÖNCE BU**

#### Sorun
Kullanıcı dosyayı görmek için indirip açmak zorunda. Pilot için UX yarım.

#### 100'de Ne Denendi (Başarısızlık Bağlamı)

İki patch (patch-100e, patch-100f) yazıldı. İkisi de `devre_detay.html`'in içine inline JS ekledi. İki kez `Uncaught SyntaxError: Invalid or unexpected token` çıktı (farklı satırlarda). 

**Kök neden:** Python heredoc içinde uzun JS string'leri oluştururken escape karmaşası (`\\'`, `\u{...}`). Patch script'in **kendisi** Python olarak geçerliydi (`compile` testi geçti, `node --check` geçti), ama HTML/JS sınırına yerleştirildikten sonra bir noktada syntax kırıldı.

**MK-100.2 disiplini bunun için yazıldı:** *"Python heredoc ile büyük JS patch yazma anti-pattern'i."*

#### 101'de Yeni Yaklaşım

**Anti-pattern'den kaç:**
- ❌ `devre_detay.html` içine inline yazma
- ❌ Python heredoc + string concat
- ❌ Inline `onclick="dokOnizle('id')"` attribute'ları

**Doğru yaklaşım:**
- ✅ **Ayrı dosya:** `js/dok-onizle.js` (yeni)
- ✅ Bu dosya doğrudan yazılır (`create_file` ile), heredoc YOK
- ✅ `devre_detay.html`'a tek satır eklenir: `<script src="js/dok-onizle.js"></script>` (kalan kod orada)
- ✅ DOM API: `createElement` + `appendChild` (inline string concat **YASAK**)
- ✅ Event delegation: dokListesi'ne tek listener, `data-doc-id` attribute'una göre yönlendirme
- ✅ Modal HTML de JS'in içinde DOM ile oluştur, ayrı HTML attribute string olmasın

#### İmplementasyon Detay

`js/dok-onizle.js` taslağı (sözde-kod):

```javascript
// js/dok-onizle.js
(function(){
  // Global API: window.dokOnizle(id)
  
  function ensureModal() {
    if (document.getElementById('mDokOnizle')) return;
    const modal = document.createElement('div');
    modal.id = 'mDokOnizle';
    // ... DOM API ile yapı kur
    document.body.appendChild(modal);
  }
  
  function open(d) {
    ensureModal();
    const ext = (d.dosyaAdi||'').split('.').pop().toLowerCase();
    const fmt = {
      pdf: 'pdf',
      png: 'img', jpg: 'img', jpeg: 'img', gif: 'img', webp: 'img',
      txt: 'txt', csv: 'txt', log: 'txt', md: 'txt',
      xlsx: 'xls', xls: 'xls', xlsm: 'xls'
    }[ext];
    
    if (!fmt) renderUnsupported(d);
    else if (fmt === 'pdf') renderPDF(d);
    else if (fmt === 'img') renderImg(d);
    else if (fmt === 'txt') renderTxt(d);
    else if (fmt === 'xls') renderXls(d);  // SheetJS lazım
  }
  
  function renderPDF(d) {
    const iframe = document.createElement('iframe');
    iframe.src = d.dosyaUrl;
    // ... style
    body.replaceChildren(iframe);
  }
  
  // ... diğer render fonksiyonları
  
  window.dokOnizle = function(id) {
    const d = (window.DOKUMANLAR||[]).find(x => x.id === id);
    if (d) open(d);
  };
})();
```

`devre_detay.html`'a ekleme:
```html
<script src="js/dok-onizle.js"></script>
```

`renderDokumanlar()` satır onclick'i:
```javascript
// satirHTML içinde:
<div class="dok-row" data-doc-id="${id}" style="cursor:pointer;...">
```

dokListesi event delegation:
```javascript
dokListesi.addEventListener('click', e => {
  const row = e.target.closest('.dok-row');
  if (row && !e.target.closest('.dok-row-del')) {
    dokOnizle(row.dataset.docId);
  }
});
```

**Önemli:** ↗ butonu kaldırıldı (100'deki son tasarım). Kullanıcı modal'dan "Yeni Sekme" ile açar.

#### Test Senaryoları (101'de smoke)
- PDF satırına tıkla → iframe açılır
- Excel satırına tıkla → ilk 100 satır, çoklu sheet için tab bar
- ✕ butonuna tıkla → SADECE sil onayı, modal AÇILMAZ
- ESC → modal kapanır
- Dış tıklama → kapanır
- DWG/STP gibi format → "Önizleme yok, indirin" mesajı

---

### İş 2 — Excel Generic Parser (~2 saat)

#### Hedef
Wizard `bom_excel` tipi yüklemeleri **otomatik parse** edilsin, `pipeline_malzemeleri`'ne yazılsın.

#### Mevcut Durum (100 sonu)
- Wizard `bom_excel` dosyaları `dosya_isleme_kuyrugu`'na `parser='sakla'` ile atıyor → atıl
- Parser endpoint yok

#### Mimari

```
Wizard upload (bom_excel) 
  → dosya_isleme_kuyrugu (parser='excel-generic', durum='bekliyor')
  → api/kuyruk-isle-excel.js (yeni endpoint, cron veya manuel tetik)
  → SheetJS read → L1 sözlük match → L2 pattern fallback
  → pipeline_malzemeleri INSERT
  → durum='tamamlandi' veya 'hata'
```

#### Parser Katmanları

**L1 — Sözlük match (~30 dk implementasyon)**
- `excel_format_tanimlari` tablosu (varsa) — yoksa şimdilik hardcoded sözlük
- Excel başlık satırını ilk 5 satır içinde ara
- Bilinen kolon adları: `["Çap", "DN", "Diameter"] → boyut`, `["Malzeme", "Material", "Mat"] → malzeme`, vb.
- Hepsi eşleşirse L1 başarılı, satırları map et

**L2 — Pattern fallback (~45 dk)**
- Başlık satırı bulunamazsa veya sözlükte eşleşmezse
- Pattern: "ilk satırda metin var, sonraki satırlarda sayı var" → metin = başlık
- Heuristic kolon tanıma: sayısal sütunlar = `dn`, `cap`, `et`, `adet`; metin sütunlar = `malzeme`, `kalite`, `tanim`
- L2 başarısızsa: kuyrukta `durum='manuel_onay'` + UI'da kullanıcıya gönder

**L3 — Haiku fallback (102+'a ertelendi)**
- Anthropic Haiku ile parse
- Maliyet düşük (~$0.001/Excel)
- L1+L2 yetersizse fallback

#### Endpoint İskeleti

`api/kuyruk-isle-excel.js`:
```javascript
// Pseudo:
import XLSX from 'xlsx';

export default async function handler(req, res) {
  // 1) Kuyruktan bekleyen excel-generic işleri çek (limit 1)
  // 2) Storage'dan dosyayı indir
  // 3) XLSX.read(buffer)
  // 4) L1 sözlük match dene
  //    → başarılı: satırları pipeline_malzemeleri'ne INSERT
  // 5) Yetmedi: L2 pattern dene
  // 6) Yetmedi: durum='manuel_onay', kullanıcıya bildirim
  // 7) Başarılı: durum='tamamlandi'
}
```

#### Test Verisi (Elimizdeki)
- `Donatım Kontrol Formu.xlsx` — wizard'la yüklenmiş, AT110-Drencher-Galv devresinde
- `IFS Malzeme List.xlsm` — aynı yer
- `Resim Teslim Tutanağı.xlsm` — aynı yer (bom_excel değil olabilir, kontrol)

**MK-50.3 disiplini:** En az 3 farklı format ile L1 yaz. Şu an 2-3 var, 4. format için pilot bekleyebiliriz.

---

### İş 3 — İzometri Parser Wrapper (~1.5 saat)

#### Hedef
Wizard `izometri` tipi PDF'leri **otomatik parse** olsun, spool/malzeme çıksın.

#### KARAR-100.A: Ortak Kuyruk

```
Wizard upload (izometri.pdf)
  ↓
İzometri Batch sayfası (PDF seç)
  ↓
       (her ikisi de aynı yere)
  ↓
dosya_isleme_kuyrugu (parser='izometri-oku', durum='bekliyor')
  ↓
api/kuyruk-isle-izometri.js (yeni wrapper)
  ↓
api/izometri-oku.js (mevcut, MİNİMUM değişiklik — MK-49.1)
  ↓
spool_malzemeleri / pipeline_malzemeleri INSERT
```

#### Önemli — MK-49.1 İhlali Değil

Konuştuğumuz mimari ileri vade:
```
api/
├─ izometri-oku.js           ← dispatcher (kısa, format eşleştirir)
├─ parsers/
│  ├─ aveva-paor.js          ← pilot PAOR varyantı
│  ├─ aveva-e3d.js
│  ├─ smart3d.js
│  └─ vision-fallback.js     ← L3 AI fallback
```

**101'de yapılacak:**
- Mevcut `izometri-oku.js`'i wrapper'dan **HTTP POST** ile çağır (in-process değil, bağımsız endpoint)
- `izometri-oku.js`'in **iç kodu değişmiyor**, sadece wrapper'dan tüketiliyor
- **Eğer zaman elveriyorsa:** PAOR kodu `parsers/aveva-paor.js`'e taşınır + `izometri-oku.js` dispatcher haline gelir. Bu refactor'ün iç davranışı **aynı** — sadece dosya yeri değişir. MK-49.1 hâlâ geçerli.

#### Wrapper İskeleti

`api/kuyruk-isle-izometri.js`:
```javascript
// Pseudo:
export default async function handler(req, res) {
  // 1) Kuyruktan bekleyen izometri-oku işi çek
  // 2) Storage'dan PDF indir → base64
  // 3) Mevcut /api/izometri-oku endpoint'ine POST (kendine çağrı, hot-loop tehlikesi yok çünkü farklı endpoint)
  // 4) Yanıt: spool/malzeme JSON
  // 5) Halüsinasyon koruması (K3/36 — 7 madde) çalıştır
  //    → şüpheli satırlar: durum='manuel_onay'
  //    → temiz satırlar: spool_malzemeleri INSERT
  // 6) İzometri batch sayfası kuyruktan okuyup gösterir (mevcut UI)
}
```

#### İzometri Batch Sayfası Etkilenir

Mevcut `izometri-batch.html` artık **kuyruğun UI penceresi** olacak:
- "PDF Yükle" → wizard ile aynı kuyruğa yazar
- Kuyruktaki bekleyen/işlenen/hatalı işleri listeler
- Hata varsa manuel onay UI'sı buradan açılır
- Format öğretme UI'sı buradan tetiklenir

**101'de yapılacak değişiklik:** Minimum — sadece kuyruğa yazma noktası. UI değişiklikleri 102+ (füzyon ekranı).

---

## Sıralama Önerisi (101 için)

```
0:00-0:15  Açılış ritüeli + dosyaları oku
0:15-1:15  İş 1: Önizleme modal v3 (js/dok-onizle.js)
1:15-1:30  Önizleme smoke test + commit
1:30-3:30  İş 2: Excel parser (api/kuyruk-isle-excel.js)
3:30-4:00  Excel parser smoke test (3 dosya) + commit
4:00-5:30  İş 3: İzometri wrapper (api/kuyruk-isle-izometri.js)
5:30-5:45  İzometri smoke test (1 PDF) + commit
5:45-6:00  Kapanış belgeleri
```

**Toplam:** ~6 saat. Bu yoğun bir oturum — Cihat tercihine göre 101 sadece **İş 1 + İş 2**, İş 3 102'ye kayabilir.

---

## Diğer 101 Açık Borçları (Süre kalırsa)

- ⚪ **Slugify kozmetik** — `Tutanağı.xlsm` → `Tutanagi.xlsm`. wizard kodunda 10 dk fix.
- ⚪ **i18n anahtarları** — 100'de eklenen `dv_dok_grp_modal`, `dv_dok_grp_wizard`, `dv_dok_search_*` ana dil dosyalarına eklenmeli (tr/en/ar). Şu an fallback metin gösteriliyor, çalışıyor ama temiz değil.

---

## Dikkat Etmesi Gerekenler

### MK-100.2 (Yeni — 100'den ders)

**Python heredoc ile büyük JS patch yazma anti-pattern'i.** 100'de iki kez yenildi (patch-100e, patch-100f). Alternatifler:
1. **Ayrı `.js` dosyası** (ÖNERILEN — İş 1 bunu kullanır)
2. **Küçük str_replace patch'leri** (10-20 satırlık değişiklikler için OK)
3. **DOM API + event delegation** (inline string concat yerine)

### MK-51.1 (arespipe_kopyala MD5)

Hâlâ geçerli. Patch script kopyalarken MD5'i Claude verir, gerçek md5 mismatch'inde reddedilir. 100'de bir defa yanlış MD5 vermedik (iyi disiplin).

### MK-98.1 (DB Şema Keşif)

100'de bir kez `tip` kolonu varsayımı patladı (`dokuman_tipi` doğru imiş). **Yeni tabloya yazmadan önce mecburi:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='<TABLO>'
ORDER BY ordinal_position;
```

### `dosya_isleme_kuyrugu` Şeması (101'de Lazım)

```sql
id, tenant_id, devre_dokuman_id, sayfa_no, parser,
oncelik, durum, hata_mesaji, deneme_sayisi,
alindi_at, bitis_at, olusturma
```

`parser` alanı text — Wrapper'lar `parser` değerine göre seçer:
- `'excel-generic'` → api/kuyruk-isle-excel.js
- `'izometri-oku'` → api/kuyruk-isle-izometri.js
- `'sakla'` → işlem yok (eski varsayılan)

### Browser Console Testi (Patch Sonrası Mecburi)

100'de `node --check` JS syntax doğruladı ama HTML/JS sınırı bağlamı doğrulanmadı → iki kez kabul edilebilir patch HTML içinde patladı. **101'de patch sonrası:**

1. Tarayıcıda `Cmd+Shift+R` ile hard refresh
2. Console temiz mi? (Hata satırı var mı?)
3. Yoksa devam, varsa **hemen geri al** (`cp $(ls -t devre_detay.html.bak-* | head -1) devre_detay.html`)

---

## 102 Bakış (Hatırlatma)

102'de **füzyon motoru** var:
- Excel BOM + İzometri PDF + STP aynı spool'a denk düşüyor mu?
- Çelişki tespit (boyut farkı, malzeme farkı, adet farkı)
- Manuel onay ekranı: "BOM 1 dirsek diyor, izometri 2 diyor — hangisi doğru?"
- Cihat'ın bilgi felsefesi: hangi kaynak öncelikli? (101 sonu konuşulur)

Bu **karar günü** olacak, kod günü değil.

---

## Yardımcı Komut Cebi

```bash
# Açılış
cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5

# Kuyruktaki bekleyen işler
psql -c "SELECT parser, durum, COUNT(*) FROM dosya_isleme_kuyrugu GROUP BY parser, durum;"

# Wizard ile yüklenmiş bekleyen dosyalar
psql -c "SELECT k.parser, k.durum, d.dosya_adi FROM dosya_isleme_kuyrugu k JOIN devre_dokumanlari d ON d.id=k.devre_dokuman_id WHERE k.durum='bekliyor' LIMIT 10;"

# Bir devrenin tüm dokümanları
psql -c "SELECT dosya_adi, dokuman_tipi, klasor_yolu FROM devre_dokumanlari WHERE devre_id='<UUID>' AND silindi=false;"

# Migration
arespipe_kopyala ~/Downloads/<dosya>.sql ~/Desktop/arespipe/migrations/<dosya>.sql <md5>
git add migrations/<dosya>.sql && git commit -m "feat(101): ..." && gp
```

---

İyi başlangıçlar, 101. 100 wizard'ı görünür hale getirdi, **sen onu işlevsel hale getireceksin**.

— 100 Claude
