# 54. Oturum — parser_kural Canlı L2 Başarısı

> 53'ü takip eder. 53 dökümantasyon revizyonuna ayrıldı (KARARLAR.md, PROJE-HARITASI.md, ROADMAP+PANO arşiv). 54'ün asıl işi: 51-52'den ertelenmiş L2 başarı oranı ölçümü ve canlıda en az bir L2 başarısı görmek.

---

## Açılış Ritüeli (CLAUDE.md MK-52.3)

2 madde:

1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3`
2. Bugün ne yapmak istiyorsun? (önerilen sıra aşağıda)

---

## 54'ün Hedefi

L2 mekanizması canlıda **çalışıyor ama hiç başarılı olmadı**. parser_kural regex'leri çok dar (3 örnekten yazıldı, MK-50.3 ihlali). Bu oturumda:

1. parser_kural'ı 5+ örnekle test edip genişlet
2. `_l2_meta` / `_l2_fallback` ai_api_log'a yaz (görünürlük)
3. Canlıda en az **bir L2 başarısı** gör

### Ana İş 1 — `pipeline_no` Regex Düzeltme (öncelik 1)

51 log'unda görüldü: `[L2-FAIL] sebep: 'zorunlu_eksik: pipeline_no'`. Mevcut regex:

```
-(G\d{3}-\d{3}-[A-Z0-9]+)
```

Sorun: `\d{3}` (sadece 3 rakam) — `303S` gibi varyantları yakalayamıyor. Düzeltme:

```sql
-- 54: parser_kural pipeline_no regex genişletme
UPDATE izometri_format_tanimlari
SET parser_kural = jsonb_set(
  parser_kural,
  '{alanlar,pipeline_no,regex}',
  '"-(G\\d+-[\\dA-Z]+-[A-Z]+\\d+)"'::jsonb
),
  guncelleme_at = now()
WHERE id = 'e1fb879d-3f13-40ae-8684-59237e63d40f'
RETURNING parser_kural -> 'alanlar' -> 'pipeline_no' -> 'regex' AS yeni_regex;
```

**Test planı:** Yeni Tersan PDF yükle → log'da `[L2-FAIL]` çıkmasın → `parser_seviye='l2'` olsun → süre 1-2 sn.

**Not (53'te konuşuldu, henüz karar değil):** Bu UPDATE elle Supabase SQL Editor'da çalışıyor. Repo görmüyor. Migration disiplinine geçmeli miyiz? 54'te karar olabilir.

### Ana İş 2 — `_l2_meta` / `_l2_fallback` DB'ye Yaz

Şu an L2 başarılı olsa bile **ai_api_log'a hiç yazılmıyor** (`cevap_full` sadece AI parsed JSON).

**Seçenek A — Yeni log fonksiyonu:** L2 başarısı için `aiApiLogYaz({ kaynak: 'izometri_oku', cagri_tipi: 'L2_deterministic', parser_seviye: 'l2', ... })` çağır. Token/maliyet 0. cevap_full = ham_cevap.

**Seçenek B — Mevcut visionAIParse log'una meta ekle:** Fallback durumunda `cevap_full.parsed._l2_fallback = ...` set edilsin DB'ye yazılmadan önce.

**Önerim: A** — temiz ayrım, parser_seviye filtresi ile metrik çıkarma kolay.

### Ana İş 3 — `parser_kural` Diğer Alanları Test (5+ örnek prensibi, MK-51.2)

pipeline_no düzeldikten sonra hâlâ fail edebilecek alanlar:

- `kalite` whitelist: `ST37|S235JR|A106B|316L|304L|316|304` — başka kalite varsa fail
- `cap_mm`, `et_mm`, `boy_mm`: `(\d+(?:\.\d+)?)x(\d\.\d)(\d{3,5})` — DN50 dışı çapları yakalar mı?
- `agirlik_kg`: `(\d+(?:\.\d+)?)\s*kg` — birden fazla kg geçiyorsa hangisini alıyor?
- `proje_kodu`: `\b(?:NB|B)(\d{4})\b` — başka proje kod formatı varsa fail
- Malzeme satır pattern'leri (boru, fitting, islem): 50'de 3 örnekle yazıldı

**Plan:**
1. 5+ farklı Tersan PDF yükle (yapı çeşitliliği için)
2. Her birinde L2 fail sebebini gör (`sebep` log'u)
3. Hangi alan en sık fail ediyor → onu düzelt → tekrar test
4. %80+ L2 başarı oranı hedefi

---

## İkincil İşler (54'te zaman kalırsa)

### "Tersan M110 Montaj Resmi" formatı temizlik kararı

84c12f61 formatı son 3-4 oturumda hep yanlış tanıma sonucu hit aldı. **Cihat'a sorulacak:** Tersan'da Montaj Resmi gerçekten geliyor mu?

- **(A) Sil:** Aktif=false yap. İleride gelirse log'da format yok diye çıkar, kullanıcı bildirir.
- **(B) Tut, fingerprint daraltsa:** Belirli pattern'i `M\d+-\d+-\d+\.\d+\.pdf` ile sınırla.

### tv() i18n eksiklikleri (28 uyarı CI'da)

`lang/tr.json` + `lang/en.json` doldur, hızlı iş.

### Hatalı kayıt aksiyonları

`kuyruk-yeniden-dene`, `kuyruk-sil`, `kuyruk-pdf-indir` endpoint'leri eksik. izometri-batch sayfası bu butonları gösteriyor ama backend yok.

---

## 55+ Sıralaması (PROJE-HARITASI'den)

- **55** — Cihat karar verir: Format envanter UI (B1 görünürlük), mobil ısınma (MProfil/MIsBaslat), veya Pano implementasyon teyidi
- **56-57** — Mobil yoğun başlangıç (mockup-first)

---

## Kritik Hatırlatmalar

**MK kurallarının tek kanonik adresi:** `docs/KARARLAR.md`. Bu dosyada (CLAUDE-SONRAKI-OTURUM.md) MK tekrarı yapılmaz.

**Her oturum başında zorunlu okuma:** `CLAUDE.md` (sözleşme), `docs/PROJE-HARITASI.md` (modül durumu), `son-durum.md` (en son durum), `docs/CLAUDE-SON-OTURUM.md` (52 detayı), bu dosya (gündem).

**Her oturum kapanışında zorunlu** (MK-53.4):
- PROJE-HARITASI.md taranır, etkilenen modül satırları güncellenir
- Yeni karar varsa KARARLAR.md'ye eklenir
- O oturumun özeti `docs/oturumlar/0XX-baslik.md` olarak yazılır
- son-durum.md, CLAUDE-SON-OTURUM.md, CLAUDE-SONRAKI-OTURUM.md güncellenir
- Tek `gp` ile push

---

## Süreç Disiplinleri

- **MK-52.1 — `arespipe_kopyala`:** Dosya transferinde MD5 doğrulamalı zsh fonksiyonu
- **MK-52.2 — `gp`:** `git push origin main` yerine `gp` (otomatik rebase)
- **MK-53.2 — Komut çıktı disiplini:** Tek seferde birden fazla dosyayı `cat` etme, çıktı şişer
- **MK-53.5 — Etki taraması:** Sohbette karar alındığında **anında** ilgili dosyaya işle, kapanışı bekleme

---

## Storage Path'leri (Bilinen Tersan PDF'leri)

```
S02-S03 (51'de kullanıldı):
  G200-303-BS15 3(5).S03_1.1.pdf
  G200-303-BS15 2(5).S02_1.1.pdf

S06-S07 (51'de kullanıldı):
  G200-303-BS15 3(5).S06.1.pdf
  G200-303-BS15 4(5).S07.1.pdf

S08-S10 (50'de kullanıldı):
  G200-303-BS15 4(5).S08.1.pdf
  G200-303-BS15 4(5).S09.1.pdf
  G200-303-BS15 5(5).S10.1.pdf

S09 (303S varyantı, 51'de kullanıldı):
  G200-303S-BS18 5(5).S09.1.pdf
  G200-303S-BS18 5(5).S10.1.pdf
```

54'te canlı test için bu pattern'lerin **dışındaki** yeni PDF'ler önerilir (cache MISS olsun, L2 yolu gerçekten çalışsın).

---

## 54'te Veriyle Tasarım

L2 başarısı görüldükten sonra:

- Format envanter UI'da L2 fail oranını gözlemle
- 5-10 farklı Tersan PDF birikince malzeme pattern'lerini tekrar bak
- L3 fallback oranı %30'un altına düşmeli (ölçülebilir hedef)
- Pilot tersane ile konuşulmadan önce **L2 başarı oranı %70+** olmalı (vizyon ekonomisi: 60× maliyet farkı)

---

> Önerilen sıra: pipeline_no fix → DB log yazma → parser_kural test (5+ PDF). Cihat hangi işle başlayacağını seçecek.
