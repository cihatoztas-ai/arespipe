# 98. Oturum — Migration 080 Canlıya Alındı (KAPATILDI ✅)

> **Tarih:** 19 Mayıs 2026
> **Ana tema:** `migrations/080_devre_wizard_v2_schema.sql` canlıya çalıştırma + 5 smoke test
> **Çıktı:** 8 tablo + 16 index + 8 RLS policy + 62 seed satır + 1 ALTER + feature flag (7 tenant × 1 satır) canlıda
> **Kod yazıldı mı?** Hayır — 97'nin yazdığı migration çalıştırıldı. Tek müdahale: bir FK hata düzeltmesi (master tablo INSERT'i eklendi).

---

## Konuşmanın akışı

98 dar kapsamlı bir oturum — 97'nin planına göre tek iş: migration'ı canlıya almak + doğrulamak. Plan ~30 dk öngörmüştü, FK hatası nedeniyle ~45 dk sürdü ama disiplin kazandırdı.

### Adım 1 — CI yeşil teyit

`gh` auth'lu değildi, Actions sayfasından bakıldı: 97'nin `aafaf58` commit'i yeşil, `MIG_HEADER_EKSIK` veya `MIG_ISIM_BOZUK` uyarısı yok. Migration dosyası CI kurallarından geçmişti.

### Adım 2 — Kuru çalıştırma (`BEGIN...ROLLBACK`)

Raw view'dan kopyalanan SQL, en alt `COMMIT;` → `ROLLBACK;` ile çalıştırıldı.

**Sonuç:** Hata. `ERROR: 23503: insert or update on table "tenant_features" violates foreign key constraint "tenant_features_feature_kod_fkey" — Key (feature_kod)=(devre_wizard_v2) is not present in table "feature_flags"`

**Kök neden:** 97 mimari yazımında `feature_flags` master tablosunun varlığı gözden kaçmıştı. `tenant_features.feature_kod` bir FK, master tabloya satır eklenmeden child INSERT patlıyordu. ROLLBACK sayesinde canlıya hiçbir yazma olmadı.

### Adım 2.5 — Düzeltme

`feature_flags` şeması canlıdan keşfedildi:
```
columns: id, kod, ad, aciklama, varsayilan
mevcut satır: 5 (ai_izometri, musteri_portal, vs.)
convention: kod == ad
```

3 seçenek tartışıldı (A: 080'i düzelt / B: 081 ayrı / C: feature flag'i ertele). **A seçildi** — migration henüz canlıya hiç ulaşmamıştı, dürüst tarih = "yazıldığında eksikti, düzeltildi".

Migration dosyasına Bölüm 6.1 eklendi:
```sql
INSERT INTO feature_flags (kod, ad, aciklama, varsayilan)
VALUES ('devre_wizard_v2', 'devre_wizard_v2',
        'Devre yukleme wizard v2 - coklu dokuman, otomatik dispatch, fuzyon motoru (KARAR-97)',
        false)
ON CONFLICT (kod) DO NOTHING;
```

DOWN bloğuna da `feature_flags` DELETE adımı eklendi (child önce, parent sonra).

Düzeltme: 527 → 542 satır (+15). Commit `f8f44cd`, `gp` ile push, CI yeşil.

### Adım 3 — Gerçek çalıştırma

Kullanıcı kuru çalıştırma adımını atladı (terminoloji konusunda kafa karışıklığı oldu, açıklığa kavuşturuldu) — düzeltilmiş 080'i doğrudan `COMMIT;` ile çalıştırdı. PostgreSQL atomic transaction garantisi sayesinde sonuç aynı: ya hep ya hiç.

**Sonuç:** "Success. No rows returned" — migration canlıda.

### Adım 4 — 5 Smoke Test

| Test | Beklenen | Gerçek |
|---|---|---|
| 1. 8 tablo oluştu | 8 satır | ✅ 8 satır |
| 2. Sistem seed verisi (dokuman_tipleri / klasor_isim_sozluk / alan_oncelik_kurallari) | 14, 33, 15 | ✅ 14, 33, 15 |
| 3. RLS policy'leri (8 tablo × 1 policy) | 8 satır | ✅ 8 satır, isimler birebir |
| 4. `pipeline_malzemeleri.kaynak_dokuman_id` | uuid, YES | ✅ uuid, YES |
| 5. Tenant flag = tenant sayısı, master = 1 | 7=7, 1 | ✅ 7=7, 1 |

---

## Yazılan/değişen dosyalar (98)

| Dosya | Önce | Sonra | Açıklama |
|---|---:|---:|---|
| `migrations/080_devre_wizard_v2_schema.sql` | 527 | 542 | Bölüm 6.1 (`feature_flags` master INSERT) + DOWN düzeltmesi |
| `.github/son-durum.md` | — | — | 98 kapanış (CI son, açık borçlar, yapılanlar) |
| `CLAUDE-SON-OTURUM.md` | bu dosya | — | 98 özeti |
| `CLAUDE-SONRAKI-OTURUM.md` | — | — | 99 gündemi (devre_wizard.html iskelet) |

**Toplam commit:** 1 fix commit (`f8f44cd`) + kapanış commit (bu yazıyı yazarken push).

---

## Yeni Karar/Öğrenme Adayları (98)

### MK-98.1 — Master tablo varsayım kontrolü

Yeni feature flag eklerken `feature_flags` (master) tablosuna önce satır eklenmeli, sonra `tenant_features`. Master kayıt yoksa FK constraint patlar. Bundan sonra her FK içeren INSERT'te master kaydı önce gelir (ON CONFLICT idempotent ile).

**Pattern:**
```sql
INSERT INTO master_tablo (kod, ...) VALUES (...) ON CONFLICT (kod) DO NOTHING;
INSERT INTO child_tablo (master_fk, ...) SELECT ... ;
```

### MK-98.2 — Kuru çalıştırma vazgeçilmez

`BEGIN...ROLLBACK` testi bu oturumda canlıyı kurtardı. 8 tablo + 62 seed + FK içeren büyük migration için 30 saniyelik koruyucu adım, FK hatasını hiçbir yazma olmadan yakaladı. Bundan sonra her şema migration'ında **kuru çalıştırma zorunlu** — `COMMIT;` → `ROLLBACK;` → çalıştır → temizse `ROLLBACK;` → `COMMIT;` → tekrar çalıştır.

### MK-98.3 — Toplu shell komutu hassasiyeti

macOS Terminal'de `-m "metin"` + `\` line-continuation kullanılan komutlar yapıştırırken **açık tırnak hatası** verdi (`quote>` prompt'unda kaldı). Sebep: kopya-yapıştırda bir karakter kırıldı. Bundan sonra:
- Çok parametreli `-m`'leri tek `-m "paragraf 1\n\nparagraf 2"` (gerçek satır sonlu) kullan
- `\` line continuation yerine `&&` zinciri tercih et
- Çok uzunsa heredoc

### MK-98.4 — Terminal vs SQL Editor netliği

SQL sorgularını terminale (zsh) yapıştırma ihtimali var. SQL'i her zaman "Supabase SQL Editor →" başlığıyla ver, terminal komutlarını "```bash" bloğunda — karışmasın. (zsh `count(*)` içindeki `*` karakterini glob sandı, no matches found verdi.)

---

## DB değişikliği yapıldı mı?

**Evet — 8 yeni tablo + 16 index + 8 policy + 62 seed satır + 1 kolon (`pipeline_malzemeleri.kaynak_dokuman_id`) + 1 master feature_flag + 7 tenant_features satırı.**

Mevcut verilerde kayıp: **YOK** (KARAR-97.0 garantisi tutuldu).

---

## Yan keşifler

**`feature_flags` master tablosu canlıda mevcutmuş.** 97 mimari yazımı sırasında bu tablo "yok varsayıldı" — gerçekte 5 satırla çalışan kurulu bir tabloydu (`ai_izometri`, `musteri_portal`, `raporlar_gelismis`, `hakedis`, `yh_admin_panel_yol_haritasi_sekmesi`). DB keşif sorgusu yapılmadan tablo varsayımı yapmanın bedeli: 1 FK hatası + 1 düzeltme commit'i + 30 dk ekstra iş. **Ders:** Migration yazılırken FK target tabloları için `\d feature_flags` (veya `information_schema.columns` sorgusu) çalıştırılmalı.

**Kullanıcı kuru çalıştırma terminolojisini bilmiyormuş.** "ROLLBACK" terimini ilk defa duydu. Disipline ne kadar alışmış olursak olalım, terimleri **her kullanırken kısa parantez açıklama** vermek yararlı. "Kuru çalıştırma (BEGIN...ROLLBACK ile gerçek yazmadan test)" gibi.

---

## 99'a devreden borçlar

1. **Pilot tenant feature flag aktivasyonu** — Şu an 7 tenant'ta `aktif=false`. Wizard UI iskeleti çıkınca pilot tenant'a `UPDATE tenant_features SET aktif=true WHERE tenant_id=... AND feature_kod='devre_wizard_v2';`. Pilot tenant kararı 99'da Cihat verir.
2. **`devre_wizard.html` iskeleti** — 99'un ana işi. ~300 satır, sidebar entegrasyonu, drag-drop, dosya listesi (parse yok)
3. **AVEVA AP214 çıkış denemesi** — opsiyonel, ertelendi
4. **`docs/DATABASE.md` RLS uyumsuzluğu** — belge sweep oturumunda

---

## Felsefe + öğrenme notları

**1. Kuru çalıştırma adımını şanstan kurtardı.** Bu oturumun en büyük dersi: prosedüre uyduğumuz için canlıya FK hatası ulaşmadı. Eğer `BEGIN...ROLLBACK` adımı atlansaydı (kullanıcı atladı bile, ama biz Adım 2'yi formel yaptık ilk seferinde), yarım transaction'la (atomic olmasa) kalırdık. PostgreSQL atomic garantisi bizi yine de kurtarırdı ama "neyi geri almalıyım" sorusuyla başlardık.

**2. Düzeltme öz-eleştirisi tarih bırakıyor.** Düzeltme commit'inin mesajı açıkça yazdı: "97 mimari yaziminda master tablo varligi gozden kacmisti". Bu **gelecek-Claude için bir trail** — 6 ay sonra migration tarihçesini okuyan biri "neden bu master INSERT var?" sorusunun cevabını dosyada bulacak.

**3. Cihat'ın "ROLLBACK ne demek" sorusu disiplini güçlendirdi.** Terminoloji açıklığa kavuştu. Bundan sonra teknik terimleri ilk kullandığımda kısa parantezle tanımlayacağım.

**4. KARAR-97.0 işe yaradı.** Mevcut tablolara dokunulmaması garantisi sayesinde "geri al" senaryosu hiç gündeme gelmedi — yeni tablolar + tek opsiyonel kolon, hepsi izolasyonda. Sonuç: stresiz kapanış.

---

> **98. oturum kapanışı:** Migration canlıda, 5 smoke test yeşil, 99'da wizard UI iskeleti başlar.
