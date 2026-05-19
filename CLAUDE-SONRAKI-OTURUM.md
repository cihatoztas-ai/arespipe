# 100. Oturum — Devre Detay'da Belge Listesi + Excel Generic Parser

> **Önce:** 99 wizard altyapısını kurdu (Storage + DB + kuyruk), 24 dosya yüklendi ve `devre_dokumanlari` tablosunda duruyor.
> **Şimdi:** İki paralel iş — (a) yüklenen belgeleri **kullanıcıya gösterme** (acil, UX kırıldı) + (b) **Excel BOM parser** entegrasyonu (asıl 100 gündemi). a) önce, b) sonra.

---

## Açılış Ritüeli (CLAUDE.md disiplini)

2 kısa kontrol:

1. **`git pull` temiz mi?**
   ```bash
   cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
   ```

2. **Bugün ne yapmak istiyorsun?** → Cevap: **99'un belge altyapısı üstüne (a) devre detay belge listesi UI + (b) Excel parser entegrasyonu.**

---

## 100'ün Ana İşi — İki Adım

### Adım A — Devre Detay'da Belge Listesi UI (~1 saat, ACIL)

**Sorun:** Kullanıcı wizard'la dosya yüklüyor, "Devreyi Görüntüle" butonuna basıyor, devre_detay sayfasına gidiyor, **yüklediği dosyaları göremez**. UX yarım.

**Çözüm:** `devre_detay.html`'e yeni bir "Belgeler" sekmesi/bölümü ekle:

- DB sorgusu: `SELECT * FROM devre_dokumanlari WHERE devre_id = ? AND silindi != true ORDER BY klasor_yolu, dosya_adi`
- UI: klasör hiyerarşisi (tree veya gruplanmış liste)
- Her satırda: dosya adı, klasör yolu, tip, boyut, yüklenme tarihi
- Aksiyonlar: indir (Storage signed URL), tip değiştir (manuel override), sil (soft delete: `silindi=true`)
- Sayfa boş değilse — wizard ile yüklenenler ile mevcut izometri batch yüklemeleri ayrı/birleşik gösterilebilir, karar Adım A.1'de

**Adım A.1 — Mevcut devre_detay yapısını gör:**
```bash
cd ~/Desktop/arespipe && \
grep -n "<nav\|tab\|section\|izometri" devre_detay.html | head -30 && \
wc -l devre_detay.html
```

Bu çıktıdan **belgelerin nereye konacağına** karar veririz: (1) yeni tab, (2) mevcut bir tab'a alt-bölüm, (3) sayfanın altına liste.

**Adım A.2 — UI yaz, smoke test.**

### Adım B — Excel Generic Parser (~2-3 saat, asıl 100 gündemi)

**Hedef:** `bom_excel` tipindeki yüklenen dosyalar otomatik parse edilsin, `pipeline_malzemeleri` tablosuna kayıt atılsın.

**Yaklaşım:**
- **L1 sözlük match** — `excel_format_tanimlari` (varsa) tablosundan kolon eşleşmesi
- **L2 pattern** — başlık satırını bul (genelde "Malzeme", "Çap", "Standart" geçen ilk satır), kolonları eşle
- **L3 Haiku fallback** — L1+L2 başarısızsa Anthropic Haiku ile AI parse (sonraki oturuma erteleme opsiyonu)

**Parser entry point:** Şu an `parser_yolu='sakla'` ile yazılıyor, kuyruk işlenmiyor. 100'de:
1. Wizard `bom_excel` tipinde dosya yüklediğinde `parser='excel-generic'` ve `durum='bekliyor'` ile kuyruğa atsın
2. Yeni endpoint: `api/kuyruk-isle-excel.js` (veya bunun gibi) — kuyruğu işler, Excel'i okur, malzemeleri çıkarır

**Excel okuma:** Wizard'da `xlsx@0.18.5` zaten yüklü, bunu kullan.

**`pipeline_malzemeleri` INSERT:** Migration 080'le bu tablo var, kaynak_dokuman_id UUID ile devre_dokuman_id'ye bağlanır.

### Adım C — Smoke Test (15 dk)

**Test seti:** 99'da yüklediğin `Donatım Kontrol Formu.xlsx` veya başka gerçek bir BOM Excel.

1. Devre detay sayfası → Belgeler tab → yüklenmiş dosyalar görünüyor mu? ✅
2. Manual: BOM dosyasının `parse_durumu`'nu `bekliyor` yap, kuyruk işleyiciyi tetikle
3. Parse sonucu: `pipeline_malzemeleri` tablosunda yeni kayıtlar mı?
4. Sözlük match: hangi kolon hangi alana eşlendi (log)

---

## Beklenmedik Senaryolar

### Excel kolon başlığı dağınıklığı
Tersane BOM'ları her firmada farklı: bazısında "Çap", bazısında "DN", bazısında "Diameter". L1 sözlük match için **3+ farklı dosya** test edilmeli (MK-50.3). 100'de en az 2 farklı format test et, L1 başarısızsa L2 pattern'e düş.

### Merged cells
Excel'de birleştirilmiş hücreler yaygın. xlsx kütüphanesi bunları nasıl raporluyor? Test gerekli.

### Multi-spool BOM
Bir BOM Excel'inde birden fazla spool olabilir (örn. SP-001 ve SP-002 aynı sayfada). 100'de **pipeline_malzemeleri** modeline geçiş yapılıyor zaten (multi-spool ortak alan) — bu test senaryosu zorunlu.

### Format öğrenme
100'de manuel kolon eşleme UI'sı opsiyonel (Adım B'nin sonu). İlk başarılı eşlemeden sonra `excel_format_tanimlari`'na satır eklenmesi format öğrenme döngüsünün başlangıcı (memory: MK-48.5).

---

## 101'e Bakış

101'de izometri parser entegrasyonu:
- Mevcut `api/izometri-oku.js` wrapper olarak kullanılır
- `parser='izometri-oku'` kuyruğa atılır
- Faz 1 / Faz 2 işleyici (yeni dosyalar Faz 1, eski yeniden işleme Faz 2)

102: Füzyon motoru (Excel BOM + izometri PDF + STP) — çelişki tespit + manuel onay
103: STP tek-spool parser
104: Rhino + Windows Gezgini UI

---

## Açık Borçlar (99 sonu — 100 başı)

### Acil (100 gündemi)
- ⚪ Devre detay belge listesi UI (Adım A) — kullanıcı yüklediğini göremez şu an
- ⚪ Excel generic parser (Adım B) — `bom_excel` tipi için L1/L2

### Önemli (100+)
- ⚪ Wizard UX iyileştirme — Adım 2'de "zaten yüklendi" badge'i + görsel polish
- ⚪ Slugify kozmetik (`Tutanag_i` → `Tutanagi`)
- ⚪ Re-açma senaryosu (pasif devreye ek spool)
- ⚪ 101: İzometri batch entegrasyonu
- ⚪ 102: Füzyon motoru
- ⚪ 103: STP parser
- ⚪ 104: Rhino + Windows Gezgini

### Opsiyonel
- ⚪ AVEVA AP214 çıkış denemesi
- ⚪ `docs/DATABASE.md` RLS uyumsuzluğu
- ⚪ i18n key consolidation (`cmn_iptal` vs `btn_iptal` vs ... )
- ⚪ Soft delete cron
- ⚪ Format envanter UI (super_admin)

---

## Hatırlatmalar

- **MK-99.1:** Migration policy'lerinde `DROP IF EXISTS ... CREATE` idempotent pattern (artık zorunlu, "already exists" hatasını önler)
- **MK-99.2:** Storage path = `{tenant_id}/...` (tenants/ prefix YOK), izometri-pdfs ile tutarlı
- **MK-99.3:** DB'de orijinal isim, Storage key slugify (kullanıcı orijinal görür)
- **MK-99.4:** `.DS_Store` ve benzeri otomatik filtrelenir
- **MK-98.1:** FK target tabloları için `information_schema` keşif zorunlu
- **MK-98.2:** Migration `BEGIN...ROLLBACK` kuru çalıştırma zorunlu
- **MK-50.3:** Yeni parser için 3+ başarılı AI örneği önce
- **Acele yok** — 100 ~3-4 saat. UI önce (1 saat), parser sonra (2-3 saat).

---

> **100. oturum açılışında bu dosya + `son-durum.md` + `CLAUDE-SON-OTURUM.md` okunacak.**
