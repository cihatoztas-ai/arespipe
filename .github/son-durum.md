# son-durum.md — Oturum 152 (2026-06-04)

## Bu oturumda ne yapıldı
1. **İçerik-öncelikli fingerprint (MK-151.5) GEMİDE — `0246eb0`:** format_tanit: fn KİMLİKTEN ÇIKTI
   (otomatik basılmaz, placeholder "öneri", kip dönüşünde boşa döner — a093eaaa kanalı kökten kapalı) ·
   `tablo_baslik_regex` 4. sinyal (UI alanı + sentez tetikleyicisinden otomatik dolum, escape'li) ·
   İÇERİK GATE (baslik_regex zorunlu + ≥2 içerik sinyali + açık PDF metninde tutma kontrolü) ·
   dedup İÇERİK-öncelikli (baslik birincil anahtar, fn fallback; uyum testi dosya adına değil PDF METNİNE).
   Mekanik kanıt: `test-fingerprint-icerik.mjs` 5/5 (fingerprintSkor izometri-oku'dan SALT-OKUNUR ayıklanır,
   MK-49.1 ✓). İlk koşu kırmızısı ders oldu: ipucu alanları `producer/creator` (`pdf_uretici` değil).
2. **Düzeltme kipine tablo köprüsü — `6699bef`:** taze sentez `malzeme_tablosu` patch'ine girer;
   `kabul_kriterleri` BİLEREK dokunulmaz (min_malzeme_satir=0 kalır → tablosu öğretilmemiş kardeş aile
   L3'e GERİLEMEZ; a093eaaa onarımı korunur).
3. **AI-oku kip fix — `87676a4`:** 150 kalıntısı koşulsuz `_mode='yeni'` kaldırıldı (düzeltme kipi korunur;
   "Başlık regex zorunlu" yanlış tetiği bitti) + düzeltme kipinde ÇALIŞAN kayıtlı kural AI doğrulamasında
   EZİLMEZ, yalnız doğrulanır (MK-111.2).
4. **İLK KURAL KAYDI (tablo motoru canlıda):** a093eaaa "tersan deneme" → `format_kodu=cadmatic_spool_nps_v1`,
   `satir_tipleri=2` (Y100-817-018.S01 sentezi), min_satir=0 ✓. Erteleme kararına bilinçli tek-kayıt istisnası.
5. **Veri onarımları (SQL UPDATE, migration DEĞİL):** a093eaaa fingerprint → baslik `Cut\s*&\s*Bending\s+Info`
   (konsol kanıtlı) + tablo_baslik `No\s+Adet\s+A.{0,2}klama` + fn tie-breaker `^Y\d+-\d+-\d+\.S\d+`.
6. **Canlı kuyruk turu (3 taze Y100 S03/S04):** L2 ✓ $0 ✓ ama format **e1fb879d** kazandı → 3-3 içerik
   beraberliği CANLIDA yakalandı (kardeş formatlar aynı şablon, içerik ayıramaz) → fn tie-breaker gerekçesi
   saha kanıtlı. Et=3.68 (Sch40 körü fallback) ≠ doğru 2.77 (PDF SCH10S + Excel uyumlu) — **schedule
   zincirinin düzelteceği yanlış-et bug'ı iki ayrı exportta belgelendi.**

## Bulgular (152)
- **MK-85.3 ihlal dersi (Claude):** `fingerprint ? 'key'` ANAHTAR-varlığına bakar; null değeri dolu sandım →
  a093eaaa fiilen skor 1'e düşmüştü (routing kör). Denetim sorgusu `->>'key' IS NOT NULL` ile yapılır.
- **İKİ KUYRUK gerçeği:** `is_kuyrugu` (kuyruk-isle.js, cron 03:00 + iç-döngü) ↔ `dosya_isleme_kuyrugu`
  (kuyruk-isle-izometri.js, **TETİKSİZ** — hiçbir sayfa çağırmıyor, cron bakmıyor). 100+ kayıt 22 Mayıs'tan
  beri bekliyor, deneme_sayisi=0. MK-49.B batch bileşeni devre detay'da YOK (plan, yapılmış sanıldı).
- **Cache engeli:** pdf_sha256 cache'i 25 Mayıs sonuçlarını döndürüyor → yeni kural kanıtı TAZE dosya ister.
  Elde girilmemiş Y100 kalmadı → final kanıt 153'e (cache-bypass tasarımı zorla-L3 ile aynı küme, kuyruğa).
- et_mm UX: schedule'lı ailede "bunu işaretle" yanlış yönlendirme (et metinde YOK, runtime ASME doldurur).

## Commit'ler (152)
| Hash | Mesaj |
|------|-------|
| `0246eb0` | feat(152): icerik-oncelikli fingerprint (MK-151.5) — fn hizlandirici, tablo 4. sinyal, gate+dedup; kanit 5/5 |
| `60d2897` | feat(152): duzeltme kipine tablo sentez koprusu — kabul_kriterleri korunur |
| `0bac952` | fix(152): AI-oku duzeltme kipini korur + calisan kural ezilmez (MK-111.2) |
CI: tümü yeşil (oto-rapor `56d6044`, `a1183d0` rebase'lerde kanıt). 12/12 ✓. izometri-oku DOKUNULMADI ✓
(test salt-okunur ayıklar). DB: migration YOK (a093eaaa fingerprint/format_kodu/satir_tipleri veri UPDATE).

## MK kayıtları (KARARLAR.md'ye işlenecek)
- **MK-152.1:** Format kimliği İÇERİK sinyalidir (baslik zorunlu + ≥2 sinyal, gate format_tanit'te);
  dosya_adi_regex = hızlandırıcı + KARDEŞ-format tie-breaker'ı (3-3 beraberlik saha vakası).
- **MK-152.2:** JSONB denetimde `?` operatörü yasak-tuzak (anahtar≠değer); doluluk `->>'k' IS NOT NULL`.
- **MK-152.3:** Kuyruk envanteri: is_kuyrugu=cron+chain CANLI · dosya_isleme_kuyrugu=TETİKSİZ (Faz 2 borcu,
  MK-117 ile aynı küme). Yeni akış eklerken tetik haritası önce çıkarılır.
- **MK-152.4:** Yeni kural kanıtı cache yüzünden yalnız TAZE (sha256 girilmemiş) dosyayla alınır.

## 153 ANA İŞ: final kanıt + Faz 2 tetikler
1) **Taze Y100 final kanıtı:** yeni spool PDF tedarik et (veya cache-bypass tasarla, izometri-oku DEĞİŞMEDEN)
   → beklenti `format_id=a093eaaa` + **et=2.77** + malzeme satırları (schedule zinciri kapanış kanıtı).
2) **Faz 2:** wizard inceleme "Formatı düzelt" butonu (`?format_id=&alan=` hazır) + dosya_isleme_kuyrugu
   tetiği + **MK-117 yukleyen_id** (152'de planlıydı, teşhisle birleşti) + 100+ bekleyen tahliyesi.
3) **Faz 3:** propagasyon (eslestirme-backfill ile eski L3/yanlış-format aileyi yeniden parse).

## Açık kuyruk (öncelik korunarak)
Faz 2 tetikler + MK-117 + tahliye · propagasyon · cache-bypass/zorla-L3 teaching · et_mm UX mesajı ·
kaydet modal UX · format_kodu otomatik öneri · bbox normalize · Windows render · Band-B · dirsek 323.9 ·
E120 prefix · folder tree · "Düzelt" modal (B2) ↔ format_tanit (B1) köprü anlatımı UI'da.
