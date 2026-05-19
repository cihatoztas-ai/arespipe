# AresPipe — Son Durum

> **98. oturum kapanışı — 19 Mayıs 2026**
> Bu dosya her oturum başında ilk okunan kayıttır. Güncel CI durumu + açık borçlar + sonraki oturum gündemi burada.

---

## CI Son Durum

- **Build:** ✅ YEŞİL (98 düzeltme commit'i `f8f44cd fix(080): feature_flags master INSERT eklendi`, sonra bu kapanış commit'i)
- **Lint:** 0 hata, 22 uyarı (Faz B baseline'ı korundu)
- **Vercel:** ✅ Production aktif
- **Migration sayısı:** 80 (son: `080_devre_wizard_v2_schema.sql` — 97'de yazıldı, 98'de canlıda çalıştı)
- **98 sonrası:** Migration 080 canlıda, 5/5 smoke test yeşil. Pilot tenant feature flag aktivasyonu 99'a aktarıldı.

---

## 98. Oturum Özeti

**Ana tema:** `migrations/080_devre_wizard_v2_schema.sql` canlıya çalıştırma + 5 smoke test.

**Süreç:** Plan 30 dk öngörmüştü, FK hata düzeltmesi nedeniyle ~45 dk sürdü. 4 adım: (1) CI yeşil teyit → (2) kuru çalıştırma `BEGIN...ROLLBACK` → FK hata yakalandı → (2.5) düzeltme commit'i `f8f44cd` → (3) gerçek çalıştırma → (4) 5 smoke test.

**Yazılan/değişen dosyalar (5):**
- `migrations/080_devre_wizard_v2_schema.sql` (527 → 542 satır — Bölüm 6.1 `feature_flags` master INSERT eklendi + DOWN düzeltmesi)
- `.github/son-durum.md` (bu dosya, 98 kapanış)
- `CLAUDE-SON-OTURUM.md` (98 detaylı özeti)
- `CLAUDE-SONRAKI-OTURUM.md` (99 gündemi)
- (otomatik) `.github/ci-son-rapor.json` — bot CI raporu

**DB değişikliği yapıldı mı?** Evet — **8 tablo + 16 index + 8 RLS policy + 62 seed satır + 1 ALTER (`pipeline_malzemeleri.kaynak_dokuman_id` UUID NULL) + 1 master feature_flag (`devre_wizard_v2`) + 7 tenant_features satırı** canlıda. Mevcut tablolarda veri kaybı: YOK (KARAR-97.0 garantisi tutuldu).

**Smoke test (5/5 ✅):**
| Test | Beklenen | Gerçek |
|---|---|---|
| 1. 8 tablo oluştu | 8 satır | ✅ 8 |
| 2. Seed (`dokuman_tipleri`/`klasor_isim_sozluk`/`alan_oncelik_kurallari`) | 14, 33, 15 | ✅ 14, 33, 15 |
| 3. RLS policy (8 tablo × 1 policy) | 8 satır | ✅ 8 (isimler birebir) |
| 4. `pipeline_malzemeleri.kaynak_dokuman_id` | uuid, YES | ✅ uuid, YES |
| 5. Tenant flag = tenant sayısı, master = 1 | 7=7, 1 | ✅ 7=7, 1 |

**FK hata düzeltmesi (Adım 2.5):** Kuru çalıştırma `tenant_features.feature_kod -> feature_flags.kod` FK constraint'ini yakaladı. 97 mimari yazımında `feature_flags` master tablosunun varlığı gözden kaçmıştı (canlıda 5 satırla aktif kurulu: `ai_izometri`, `musteri_portal`, `raporlar_gelismis`, `hakedis`, `yh_admin_panel_yol_haritasi_sekmesi`). Düzeltme: Bölüm 6.1 olarak `INSERT INTO feature_flags ... ON CONFLICT (kod) DO NOTHING` eklendi, DOWN bloğunda da silme adımı (child önce, parent sonra). **Canlıya hiç hatalı yazma olmadı** — kuru çalıştırma disiplini kurtardı.

**Yan keşif:** `feature_flags` master tablosu DB keşif sorgusu yapılmadan varsayılmıştı. Ders: Migration yazılırken FK target tabloları için `information_schema.columns` veya `\d` sorgusu zorunlu.

---

## Açık Borçlar (98 sonu)

### Acil (99 gündemi)
- ⚪ **Pilot tenant feature flag aktivasyonu** — `UPDATE tenant_features SET aktif=true WHERE tenant_id=<PILOT> AND feature_kod='devre_wizard_v2'` (99 Adım 1, 5 dk)
- ⚪ **`devre_wizard.html` iskeleti** — sidebar entegrasyonu (feature-flag'li) + 4-adım wizard UI + drag-drop + dosya tipi auto-detect + Storage upload + `dosya_isleme_kuyrugu` "saklama" parser'ı (99 Adım 2-4, ~2-3 saat)
- ⚪ **Smoke test (99 Adım 5)** — pilot tenant'la basit klasör yükleme + tip auto-detect + DB+Storage teyit

### Önemli (100+)
- ⚪ 100: Excel generic parser (L1 sözlük + L2 pattern, L3 Haiku ileride) + `pipeline_malzemeleri` INSERT (multi-spool BOM)
- ⚪ 101: İzometri batch entegrasyonu + Faz 1/Faz 2 kuyruğu (mevcut `api/izometri-oku.js` wrapper)
- ⚪ 102: Füzyon motoru + çelişki ekranı + manuel onay
- ⚪ 103: STP tek-spool parser (B-spline → silindir fitting)
- ⚪ 104: Rhino parser + Windows Gezgini UI + spool detay "Belgeler" sekmesi

### Opsiyonel
- ⚪ AVEVA AP214 çıkış denemesi (Cihat tersanedeki adımı sorabilir, başarılı olursa STP parser 5 dakikalık iş olur)
- ⚪ `docs/DATABASE.md` RLS uyumsuzluğu (4 policy disiplinine geçiş veya doküman güncelleme — belge sweep oturumunda)
- ⚪ Soft delete cron işi (30 gün sonra kalıcı silme) — 100+ oturumda

### Geri kalan (97'den önceki listeden devam)
- ⚪ Format envanter UI (super_admin)
- ⚪ Etkileşimli format öğretme modal
- ⚪ tv() i18n eksiklikleri
- ⚪ Hatalı kayıt aksiyonları (kuyruk-yeniden-dene, kuyruk-sil, kuyruk-pdf-indir endpoint'leri)

---

## Aktif Süreç Disiplinleri

- **MK-48.6:** Supabase SQL Editor Unicode hassasiyeti — em-dash, typografik apostrofe paste etme (Raw view'dan kopyala)
- **MK-49.1:** `izometri-oku.js`'e dokunma — minimum değişiklik
- **MK-50.1:** Hassas anahtar Claude'a verme
- **MK-50.3:** Yeni format için parser_kural yazmadan önce 3+ başarılı AI örneği
- **MK-50.4:** Dotfile oluşturduktan sonra `ls -la` kontrol
- **MK-51.1:** Dosya kopyalamadan önce `~/Downloads`'da MD5 + satır sayısı doğrula
- **MK-51.2:** Parser_kural regex'lerini en az 5 farklı gerçek dosya örneğiyle test et
- **MK-52.1:** `arespipe_kopyala` MD5 doğrulamalı dosya kopyalama
- **MK-52.2:** `gp` otomatik rebase + push (manuel `git push` yerine)
- **MK-98.1:** Yeni feature flag eklerken `feature_flags` master kayıt önce, `tenant_features` sonra (FK kuralı). Master tablo için DB keşif sorgusu zorunlu, varsayım yasak.
- **MK-98.2:** Şema migration'larında `BEGIN...ROLLBACK` kuru çalıştırma **zorunlu**. Önce `COMMIT;` → `ROLLBACK;` ile test, temizse `ROLLBACK;` → `COMMIT;` ile tekrar çalıştır.
- **MK-98.3:** Terminal yapıştırmada `\` line continuation yerine `&&` zinciri tercih et. Çok parametreli `-m` yerine tek `-m "paragraf 1\n\nparagraf 2"` (gerçek satır sonlu) kullan, veya heredoc.
- **MK-98.4:** SQL'i her zaman "Supabase SQL Editor →" başlığıyla ver, terminal komutlarını `bash` bloğunda. Karışmasın (zsh `count(*)` içindeki `*` karakterini glob sanar).
- **KARAR-97.0:** Yeni tablolar mevcut sisteme dokunmaz (geri alma garantisi)

---

## Performans

- **L2 parse (lokal):** 1-2 ms/PDF
- **L3 vision parse (canlı):** 11-25 sn/PDF
- **Format tanıma:** <100 ms/PDF
- **Hız farkı (L2 başarılı):** ~10,000× (deterministik vs AI)

---

## 99 Hazırlık Notu

99 ~2-3 saatlik iş. Sıralı adımlar:
1. Pilot tenant feature flag aktivasyonu (5 dk)
2. Sidebar entegrasyonu — `dashboard.html` veya merkezi sidebar, feature-flag'li link (15 dk)
3. `devre_wizard.html` iskeleti — ~300 satır, 4 adım wizard, drag-drop + auto-detect + Storage upload + kuyruk INSERT (~2 saat)
4. Smoke test — pilot tenant'la basit klasör yükleme + tip auto-detect + DB+Storage teyit (15 dk)

**Parser yok henüz** — sadece "saklama" parser'ı (durum güncelle, metadata yok). Gerçek parse 100+'a kalıyor.

Detay: `CLAUDE-SONRAKI-OTURUM.md`.

---

> 99. oturum açılışında bu dosya + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` okunur.
