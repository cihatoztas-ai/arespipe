# Son Durum — 54. Oturum Sonu (3 Mayıs 2026)

> **Durum:** ✅ Mobile vizyonu netleşti, i18n altyapısı kuruldu (prebuild). 28 CI uyarısı 55'e devredildi. MK-55.1 onarım modu aktif.

---

## CI Son Durum

- **Build:** ✅ YEŞİL (sarı uyarı)
- **Hata:** 0
- **Uyarı:** 28
  - `izometri-batch.html`: 18 i18n eksik (`izb_*`)
  - `spool_detay.html`: 9 i18n eksik (`flansh_*`)
  - `devre_detay.html:1428`: 1 G-03 ham yüzey
- **Vercel:** ✅ Production aktif
- **Workflow run:** 688

---

## Açık Borçlar (önceliğe göre)

### 55'in Birincil İşi
1. **`spool_detay.html` flansh_* i18n** — 9 anahtar (3485-3510) üç dile eklenecek
2. **`izometri-batch.html` izb_* i18n** — 18 anahtar üç dile eklenecek
3. **`devre_detay.html:1428` G-03** — `esc(x.yuzey)` → `ARES_NORM.yuzeyEtiket(x.yuzey)`
4. **CI yeşil doğrulama** — yukarıdakiler kapandıktan sonra `uyari: 0` görmek

### 55'in İkincil İşi (zaman kalırsa)
5. **MK-54.1** — Mobile M ekranları `useT()` bypass denetimi (5 dosya: MGiris, MAnasayfa, MAnasayfaYonetici, MIslemler, MDrawer)

### 56+ İçin Bekleyen Büyük İşler
6. **MK-49.A** — spool_detay 3D model deterministik render (PDF parse → yon_dizilim JSON → Three.js)
7. **MK-49.B** — İzometri PDF yükleme bileşeni (devre wizard Adım 2 + devre detay sekmesi)
8. **parser_kural pipeline_no regex** — 51 L2-FAIL, `\d{3}` dar
9. **`_l2_meta` / `_l2_fallback` ai_api_log** — görünürlük borcu (51'den)
10. **5+ Tersan PDF testi** — L2 başarı oranı ölçümü (51'den)

### Henüz Karar Olmayan Gözlemler
- DB migration disiplini (51-52'den beri konuşuluyor) — `migrations/NNN_*.sql` zorunluluğu kararı yok
- `CALISMA-MODU.md` ↔ `CIHAT-PROFIL.md` overlap — Cihat tanımı iki dosyada
- `asme_borular`/`cuni_borular` silme durumu belirsiz (35'te dondu, 37-38'de silinecekti)

---

## Son Oturumlarda Eklenen Kararlar

| Karar | Kategori | Özet |
|-------|----------|------|
| MK-53.1 | DISIPLIN | KARARLAR.md kanonik karar günlüğü |
| MK-53.2 | DISIPLIN | Terminal komut çıktı disiplini |
| MK-53.3 | DISIPLIN | Dökümantasyon revizyonu (AKTIF/ARSIV/UYUR kategorisi) |
| MK-53.4 | DISIPLIN | PROJE-HARITASI canlılık disiplini |
| MK-53.5 | DISIPLIN | Etki taraması (anlık karar yakalama) |
| MK-54.A | VIZYON | Mobile = web'in light versiyonu |
| MK-54.B | DISIPLIN | Web öncül, mobile follower |
| MK-54.C | VIZYON | Vanilla mobile referans, kopyalanmaz |
| MK-54.D | ALTYAPI | Mobile prebuild pattern (web lang/ paylaşımlı) |
| MK-54.E | TASARIM | MSpoolDetay 3 sekme, 3D yok |
| MK-54.F | TASARIM | MSpoolDetay tipografisi (kompakt + WCAG) |
| MK-54.G | TASARIM | İşlem Durumu n/N format + tema-spesifik renkler |
| MK-54.1 | BORÇ | M ekranları useT() bypass |
| **MK-55.1** | **DISIPLIN** | **Oturum sağlık script'i (mekanik açılış/kapanış kontrolü)** |

---

## Son Commit'ler

| Hash | Mesaj |
|------|-------|
| `f58c8d4` | chore(ci): ci-son-rapor.json güncelle [skip ci] |
| `7467b10` | docs(54): oturum arşivi + 7 yeni MK kararı + PROJE-HARITASI mobil bölümü güncellendi |
| `f227253` | feat(mobile-54): i18n altyapısı kuruldu, prebuild ile web lang/ paylaşımlı |
| `1998538` | docs(53): dökümantasyon revizyonu — KARARLAR güncel, PROJE-HARITASI doğdu, ROADMAP+PANO arşivlendi |
| `40e8851` | docs: KARARLAR.md doğdu — kanonik karar günlüğü (53) |

---

## DB Değişiklikleri

53 ve 54'te DB'ye dokunulmadı.

---

## Kritik Hatırlatmalar

- **MK kuralları tek dosyada:** `docs/KARARLAR.md`. Tekrar yapılmaz, oradan referans verilir.
- **MK-55.1 aktif:** Her oturum açılışı `./scripts/oturum-saglik.sh N` ile başlar. BAYAT durumunda gündem yok, onarım modu çalışır.
- **MK-53.5 aktif:** Anlık karar yakalama — sohbette karar geçince bekleme, anında KARARLAR.md'ye işle.

---

> 55 açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunur.
> 54'ün detayı için: `docs/CLAUDE-SON-OTURUM.md`.
> Karar günlüğü için: `docs/KARARLAR.md`.
> Modül durum panosu için: `docs/PROJE-HARITASI.md`.
