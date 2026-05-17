# CLAUDE-SONRAKI-OTURUM — 94. Oturum Gündemi

> 93'ten gelen plan. Hedef: **olusturma_at tam rename + fitting/flansh için "Kütüphaneye Ekle" RPC'leri + UI iyileştirmeleri.** Kütüphane sayfası 93'te tam çalışır hale geldi, 94 mimari tutarlılığı tamamlayacak.

---

## Açılış Ritüeli (CLAUDE.md'den)

94 başlangıcında Cihat'a 2 kontrol:

```
1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
2. Bugün ne yapmak istiyorsun? (Kaldığımız yerden, yeni konu, vb.)
```

Cevap geldikten sonra Claude şu dosyaları okur:
- `.github/son-durum.md` (93 kapanışı)
- `docs/CLAUDE-SON-OTURUM.md` (detaylı 93 özeti)
- Bu dosya (`CLAUDE-SONRAKI-OTURUM.md`)
- `docs/93-DEVRALINAN-BUGLAR.md` (referans, 92→93 devir notları, hâlâ çözülmüş borçların bağlamı)
- `docs/KUTUPHANE-VERI-BESLEME-VIZYONU.md` (89'da yazılan ana vizyon belgesi)

---

## 93 Sonu Durumu (özet)

- **Migration:** 075'e kadar gidiyor (070-075 yeni). Tüm DB değişiklikleri canlı.
- **CI:** SARI (34 i18n + G-03 uyarısı, 0 hata). 51'den beri açık borç.
- **Vercel:** Production = 93 sonu, son commit `b235f79`.
- **Kütüphane sayfası:** Tam çalışır (boru/fitting/flansh detay, filtre, satır tıklama, panel, SVG).
- **Modal:** Sch opsiyonel, tenant_id ekleniyor, 88'den beri ilk kez çalışıyor.

---

## 94'ün Birincil İşi — Migration 076 (olusturma_at tam rename)

**P0 — Anlamlı, dikkatli.**

### Bağlam

DB'de iki kolon adı yaşıyor:
- `olusturma` (51 tablo, çoğunluk, doğru olan)
- `olusturma_at` (18 tablo, azınlık, 92 öncesi farklı convention)

Migration 072'de `boru_malzeme_uyum` + `flansh_malzeme_uyum`'u rename ettik (yeni tablolardı, etki sıfırdı). Geri kalan 16 tablo daha büyük etki taşır.

### Etkilenen 18 Tablo (DB tarafı)

```
ai_api_log
asme_borular
boru_olculer
boru_olculer_public
boru_standart_sozluk
cuni_borular
endustri_form_astm
endustri_malzemeler
endustri_urun_formlari
is_kuyrugu
izometri_batch_kayitlari
izometri_format_tanimlari
malzeme_kataloglari
ozel_parcalar
spec_kural
tanimsiz_kayitlar
tenant_spec_seti
uc_islemi_tipleri
```

Bunlardan **fitting_malzeme_uyum** kontrolü de yapılmalı (93'te `boru_malzeme_uyum` + `flansh_malzeme_uyum`'a baktık, fitting'i 91 öncesinden gelen tablo, atlanmış olabilir).

### Etkilenen Kod (kod tarafı, 93'te `grep` ile tespit edildi)

```
admin/kutuphane-cakismalar.html — 1 referans (r.ozel_olusturma_at)
api/izometri-oku.js — 4 referans (sorgu + cache hit yapısı)
api/kuyruk-durum.js — 5 referans (batch + kuyruk select)
api/kuyruk-isle.js — 1 referans (order by)
```

**Kritik:** `api/izometri-oku.js`, `api/kuyruk-isle.js`, `api/kuyruk-durum.js` izometri parse pipeline'ının canlı path'leri. Bunlar bozulursa **PDF parse durur**, pilot için kabul edilemez.

### Plan

1. **Adım 1 (test bağlam):** Local'de bir izometri PDF parse edebileceğimiz tek bir test akışı bul (var mı acaba? Yoksa Cihat'la 94'te konuş — test parse'a takılmadan ilerleyemeyiz)
2. **Adım 2 (kod refactor):** Yukarıdaki 4 dosyada `olusturma_at` → `olusturma` (Python heredoc patch güvenli yöntem)
3. **Adım 3 (Migration 076):** 16 tablo (072'nin atladığı geri kalan) için `ALTER TABLE ... RENAME COLUMN`
4. **Adım 4 (test):** Kuyruk akışı, izometri parse, kütüphane detay — hepsi çalışmalı
5. **Adım 5 (commit + push):** TEK commit — kod + migration aynı anda. Cron job ve API çağrıları başka pencereden olmuş olabilir, rollback ihtimaline karşı dikkat.

**Süre tahmini:** 1-1.5 saat (test + refactor + migration).

---

## Diğer 94 İşleri (öncelik sırasıyla)

### P1 — Fitting/flansh için "Kütüphaneye Ekle" RPC'leri

`ozel_parca_boru_kaydet` 93'te düzeltildi (073 + 074). Ama kullanıcı fitting veya flansh için **özel parça** önerisi alırsa şu an çare yok:

```sql
CREATE FUNCTION ozel_parca_fitting_kaydet(...) -- yok
CREATE FUNCTION ozel_parca_flansh_kaydet(...)  -- yok
```

Süre: Her biri ~30-45 dk (boru'nun deseni elimizde var). Toplamda ~1 saat.

Boru ile farklılıklar:
- Fitting tablosunda DN değil `cap_buyuk_dn` + `cap_kucuk_dn` çift kolon (redüksiyonlar için)
- Flansh tablosunda Class (basinc_sinifi) + flansh_tipi (WN, SO, BL...)
- Modal UI da bunlara göre yazılmalı (`kutuphane-oneriler.html` boru için yazılmış, fitting/flansh önerisi gelirse şu an aynı modal açılıyor ama RPC patlar)

Önce kontrol: `v_tanimsiz_havuz` veya benzeri view fitting/flansh için öneri üretiyor mu? Üretmiyorsa bu işin önceliği düşer.

### P1 — kutuphane-detay "Ek Dosyalar" paneli (Cihat'ın isteği)

Şu an şöyle:
```
EK DOSYALAR (STANDART GENELİ)
[📷 - foto]  [🎲 - 3D]  [📐 - DXF]
medya tablosu 90+
```

Cihat dedi ki: "satıra tıkladığımız zaman o satırın değerleri yukarıda çıkıyordu. ek dosyaları seçtiğimiz satırın dosyaları olmalı."

İki katmanlı iş:
1. **Medya tablosu yarat** (90+ borç, daha önce ertelenmiş)
2. **UI'da satır seçilince panel güncellesin** (satır id'sine göre medya tablosundan fetch)

Süre: Medya tablosu + UI bağlantısı toplam ~2 saat. Eğer medya tablosu hâlâ tasarlanmadıysa karar gerekli — küçük migration mi, ayrı oturum mu?

### P2 — Bug 1 Seçenek B (mimari temizlik)

93'te Seçenek A pragmatik (UPDATE 'karbon') seçildi. Seçenek B doğru mimari:

```sql
ALTER TABLE fitting_olculer DROP COLUMN malzeme_grubu;
ALTER TABLE flansh_olculer DROP COLUMN malzeme_grubu;
```

Sonra UI tarafında:
- `kutuphane-detay.html`'de filtreleme `malzeme_grubu` yerine **çapraz uyum** tablolarından gelmeli
- "Bu fitting hangi malzemelerden üretilebilir?" widget'ı (`fitting_malzeme_uyum`, `flansh_malzeme_uyum` join)

Süre: 2-3 saat (DROP + UI refactor + widget).

**Bu işi yapmadan önce 070'in geri alımı planlanmalı** — UPDATE 'karbon' nasıl temizlenir? Aslında DROP COLUMN bunu otomatik halleder, ama eğer başka kod yerinde fitting/flansh `malzeme_grubu`'na referans varsa onlar da temizlenmeli.

### P2 — İnceleme listesi sayfası

Ana sayfada "BEKLEYEN ÖNERİLER" kartında "2 havuz · 1 inceleme" yazıyor. **İnceleme sayfası yok**, kullanıcı tıklayamıyor. `kutuphane-inceleme.html` yaratılacak. Süre: ~45 dk.

### P2 — i18n + G-03 uyarıları (CI sarı → yeşil)

51'den beri açık borç:
- 33 i18n key (devre_detay 6 + izometri-batch 18 + spool_detay 9)
- 1 G-03 ham yüzey (devre_detay:1467)

Çeviriler tr/en/ar 3 dile, mekanik iş. Süre: ~45 dk.

### P3 — Fitting'e ikinci filtre dropdown

Şu an sadece parça_tipi. Schedule (`schedule_kod`) da eklenebilir, ama tek seferde 2 dropdown'lı filtre kombinasyonu kod karmaşıklığı.

### P3 — Boru için NPS kolonu

`boru_olculer`'da NPS kolonu yok, DN'den türetilebilir bir bilgi. İki yol:
- Kolon ekle + seed (büyük iş)
- UI tarafında DN→NPS lookup tablosu (basit, hızlı)

İkincisi daha pragmatik, ama mimari kararı gerek.

### P3 — Standart bazlı medya tablosu

90+ borç. Detay sayfasında "Ek dosyalar (standart geneli)" placeholder'ı bunun yerini tutuyor. Gerçek tabloyla değiştirmek için tasarım gerek.

---

## Açılış Önerisi (94'ün ilk 10 dakikası)

1. **Ritüel:** git status + log
2. **Mevcut durum dosyalarını oku** (özellikle bu dosya + son-durum.md)
3. **Cihat'a sun:** "Birincil iş Migration 076 (olusturma_at rename). Bunu yapalım mı, yoksa fitting/flansh RPC mi öncelik?"
4. Cihat'ın seçimine göre adım planı

---

## Dikkat Etmesi Gerekenler

### MK-51.1 (arespipe_kopyala MD5 kontrolü)

93'te bir kez yanlış MD5 verdim (`7330b48a...`), reddedildi. Doğru MD5'ler:
- Cihat'ın `md5 -q dosya.sql` çıktısını kullan
- Tahmin yürütme, "..." kullanma
- Reddedilirse hata bende

### sed yerine Python heredoc

`zsh: parse error near '<'` ve benzeri shell quoting sorunları için sed güvenilmez. Python heredoc + dict-based replace daha temiz, başarı/başarısızlık raporu da net.

### BEGIN/COMMIT Supabase SQL Editor sorunu

Migration dosyalarında `BEGIN; ... COMMIT;` bloğu var. Supabase SQL Editor bu yapıyı reddediyor (`syntax error at or near ";"`). Çözüm: Editor'de BEGIN/COMMIT olmadan çalıştırılır, dosya tarafında bloklar geçmiş kaydı için durur. Bu repo'ya migration olarak commit edilince psql ile çalışacağı için sorun değil.

### Tablo şeması değişiminde DB ve kod aynı PR'de

Bug 1 katman 4 örneği: TABLO_KONFIG'de yanlış kolon adı (`nps_inch`, `yuzey_m2_m`) 88 oturum boyunca farkedilmedi çünkü DB yıllar önce farklıydı. Migration 076'da bu hata tekrarlanmasın: kod refactor + DB rename aynı commit'te olsun, kontrol et.

### Çok katmanlı bug yaklaşımı

93'te Bug 1 dört katmana çıktı. Bir sayfanın "boş görünmesi" tek bir sebepten olmayabilir. Test sırası:
1. DB'de veri var mı? (`COUNT(*)`)
2. RLS izin veriyor mu? (`pg_policies` + console RPC çağrısı)
3. UI doğru kolon adıyla istiyor mu? (`information_schema`)
4. Frontend kodu doğru render ediyor mu? (`devtools`)

Hızlı tanı için tüm 4 katmana bakmak daha hızlı.

---

## Yardımcı Komut Cebi

```bash
# Tablodaki kolonları gör
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '<TABLO>'
ORDER BY ordinal_position;

# Policy kontrolü
SELECT tablename, policyname, cmd, qual FROM pg_policies
WHERE tablename = '<TABLO>' ORDER BY cmd;

# Kod tarafında olusturma_at arama
grep -rn "olusturma_at" --include="*.html" --include="*.js" admin/ api/

# Migration commit + push pattern
arespipe_kopyala ~/Downloads/<dosya>.sql ~/Desktop/arespipe/migrations/<dosya>.sql <md5>
git add migrations/<dosya>.sql
git commit -m "fix(94): ..."
gp
```

---

İyi başlangıçlar.

— 93 Claude
