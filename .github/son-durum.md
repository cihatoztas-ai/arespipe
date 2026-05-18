# AresPipe — Son Durum

> **97. oturum kapanışı — 18 Mayıs 2026**
> Bu dosya her oturum başında ilk okunan kayıttır. Güncel CI durumu + açık borçlar + sonraki oturum gündemi burada.

---

## CI Son Durum

- **Build:** ✅ YEŞİL (97 öncesi son commit `bea9002 docs(96): oturum 96 kapanis`, sonra `c50d615` otomatik ci-son-rapor.json)
- **Lint:** 0 hata, 22 uyarı (Faz B baseline'ı korundu)
- **Vercel:** ✅ Production aktif
- **Migration sayısı:** 79 (son: `079_din_86090_86088_cuni_kme.sql` — 96'da)
- **97 sonrası:** `migrations/080_devre_wizard_v2_schema.sql` yüklenmeyi bekliyor (henüz commit edilmedi)

---

## 97. Oturum Özeti

**Ana tema:** Devre yükleme wizard'ı mimari planı — sürükle bırak çoklu dosya, dosya tipi dispatch, klasör hiyerarşisi, çapraz veri füzyonu.

**Süreç:** 97 alışılmadık bir oturum oldu — kod yazımı değil, **uzun mimari sohbet**. Cihat devre yükleme vizyonunu detaylı yazdı, ben de gerçekleştirilebilirliği test ettim ("hayalci olmayalım"). 13 KARAR alındı, 8 yeni tablonun migration dosyası yazıldı, gelecek 6 oturumun yol haritası çıkarıldı.

**Yazılan dosyalar (4):**
- `migrations/080_devre_wizard_v2_schema.sql` (527 satır — 8 tablo + 16 index + 8 RLS policy + 62 seed + 1 ALTER + feature flag)
- `docs/DEVRE-WIZARD-V2-MIMARISI.md` (97'nin asıl mimari belgesi)
- `CLAUDE-SON-OTURUM.md` (97 detaylı özeti)
- `CLAUDE-SONRAKI-OTURUM.md` (98 gündemi)

**DB değişikliği yapıldı mı?** Hayır — migration **97'de yazıldı, 98'de çalıştırılacak.** Bilinçli karar: önce CI'da görsün, sonra Cihat aradan mola alıp uykusuyla bir kontrol katmanı daha ekler.

**13 KARAR (97.0 – 97.13):** Detayı `docs/DEVRE-WIZARD-V2-MIMARISI.md`'de. Özet:
- 97.0: Yeni tablolar mevcut tablolara FK kurmaz (tek istisna opsiyonel izleme)
- 97.1: Tek spool = bir dosya (STP/Rhino parse edilebilir)
- 97.2: Füzyon alan başına öncelik (JSONB skor)
- 97.3: Yüksek risk manuel, düşük otomatik
- 97.4: Çelişki kararları loglanır, 5+ aynı = sistem önerisi
- 97.5: İki boyutlu skor (parse güveni × kaynak içerik önceliği)
- 97.6: Devre detay Windows Gezgini görünümü
- 97.7: Çok-spoollu PDF tek dosya + N satır (sayfa aralık)
- 97.8: Multi-spool ortak BOM `pipeline_malzemeleri`'ne
- 97.9: Token limit aşan PDF sayfa-başına AI + kuyruk
- 97.10: Storage hiyerarşisi `tenants/projeler/devreler/{klasör}/dosya`
- 97.11: STP AVEVA HarmonyWare B-spline parse + montaj koordinatı bonus
- 97.12: Soft delete 30 gün
- 97.13: RLS canlı pattern (DATABASE.md uyumsuzluğu not edildi)

**STP analiz bulgusu:** Cihat yükledi `1030-3531-103-PS07.stp` (322 KB, AVEVA HarmonyWare). Silindir/torus yok, sadece B-spline yüzeyleri. Parser tahminim **2-3 oturum → 3-5 oturum** revize edildi. Bonus: gemi global koordinatlar otomatik montaj noktası etiketleme sağlıyor.

**Yan keşif:** `pipeline_malzemeleri` tablosu 19'da kurulmuş, multi-spool ortak BOM için tam yeri. Yeni tablo gerekmedi, sadece `kaynak_dokuman_id UUID NULL` kolonu eklenecek.

---

## Açık Borçlar (97 sonu)

### Acil (98 gündemi)
- ⚪ **Migration çalıştırma** — Supabase SQL Editor'de kuru çalıştırma + gerçek + 5 smoke test
- ⚪ **CI yeşil teyit** — `MIG_*` uyarı yok mu

### Önemli (99+)
- ⚪ 99: `devre_wizard.html` iskelet + drag-drop + dosya tipi auto-detect
- ⚪ 100: Excel generic parser (L1 sözlük + L2 pattern, L3 Haiku ileride)
- ⚪ 101: İzometri batch entegrasyonu + Faz 1/Faz 2 kuyruğu
- ⚪ 102: Füzyon motoru + çelişki ekranı + manuel onay
- ⚪ 103: STP tek-spool parser (B-spline → silindir fitting)
- ⚪ 104: Rhino parser + Windows Gezgini UI + spool detay "Belgeler" sekmesi

### Opsiyonel
- ⚪ AVEVA AP214 çıkış denemesi (Cihat tersanedeki adımı sorabilir, başarılı olursa STP parser 5 dakikalık iş olur)
- ⚪ `docs/DATABASE.md` RLS uyumsuzluğu (4 policy disiplinine geçiş veya doküman güncelleme)
- ⚪ Soft delete cron işi (30 gün sonra kalıcı silme) — 100+ oturumda

### Geri kalan (97'den önceki listeden devam)
- ⚪ Format envanter UI (super_admin)
- ⚪ Etkileşimli format öğretme modal
- ⚪ tv() i18n eksiklikleri
- ⚪ Hatalı kayıt aksiyonları (kuyruk-yeniden-dene, kuyruk-sil, kuyruk-pdf-indir endpoint'leri)

---

## Aktif Süreç Disiplinleri

- **MK-48.6:** Supabase SQL Editor Unicode hassasiyeti — em-dash, typografik apostrofe paste etme
- **MK-49.1:** `izometri-oku.js`'e dokunma — minimum değişiklik
- **MK-50.1:** Hassas anahtar Claude'a verme
- **MK-50.3:** Yeni format için parser_kural yazmadan önce 3+ başarılı AI örneği
- **MK-50.4:** Dotfile oluşturduktan sonra `ls -la` kontrol
- **MK-51.1:** Dosya kopyalamadan önce `~/Downloads`'da MD5 + satır sayısı doğrula
- **MK-51.2:** Parser_kural regex'lerini en az 5 farklı gerçek dosya örneğiyle test et
- **MK-52.1:** `arespipe_kopyala` MD5 doğrulamalı dosya kopyalama
- **MK-52.2:** `gp` otomatik rebase + push (manuel `git push` yerine)
- **KARAR-97.0:** Yeni tablolar mevcut sisteme dokunmaz (geri alma garantisi)

---

## Performans

- **L2 parse (lokal):** 1-2 ms/PDF
- **L3 vision parse (canlı):** 11-25 sn/PDF
- **Format tanıma:** <100 ms/PDF
- **Hız farkı (L2 başarılı):** ~10,000× (deterministik vs AI)

---

## 98 Hazırlık Notu

98 sadece 30 dakikalık iş. Sıralı adımlar:
1. CI yeşil teyit (5 dk)
2. Supabase'de kuru çalıştırma — `BEGIN...ROLLBACK` (10 dk)
3. Gerçek çalıştırma — `BEGIN...COMMIT` (5 dk)
4. 5 smoke test sorgusu (10 dk)

Detay: `CLAUDE-SONRAKI-OTURUM.md`.

---

> 98. oturum açılışında bu dosya + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` okunur.
