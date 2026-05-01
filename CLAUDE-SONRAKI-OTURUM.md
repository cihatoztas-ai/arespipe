# 52. Oturum — parser_kural İyileştirme + Görünürlük

> 51'i takip eder. L2 mekanizması canlıda hazır, ama parser_kural regex'leri eksik → her PDF L3'e düşüyor. 52'nin asıl işi parser_kural'ı 5+ örnekle test edip L2 başarı oranını ölçülebilir hale getirmek.

---

## Açılış Ritüeli (CLAUDE.md disiplini)

5 kontrol cevabı zorunlu:

1. **`git pull` temiz mi?** → `cd ~/Desktop/arespipe && git pull origin main`
2. **CI yeşil mi?** → `https://github.com/cihatoztas-ai/arespipe/actions`
3. **`son-durum.md` güncel mi?** → 51 sonu durumu yansıtmalı
4. **Bekleyen migration var mı?** → Bilgi: 51'de migration yok, sadece DB UPDATE (Spool fingerprint)
5. **Cihat'tan geri bildirim var mı?** → Sor

---

## 52'nin Hedefi

L2 mekanizması canlıda **çalışıyor ama hiç başarılı olmadı.** parser_kural regex'leri çok dar (3 örnekten yazıldı). Bu oturumda parser_kural'ı genişletip **canlıda en az bir L2 başarısı** görmek hedef.

### Ana İş 1 — `pipeline_no` Regex Düzeltme (öncelik 1)

51 log'unda görüldü: `[L2-FAIL] sebep: 'zorunlu_eksik: pipeline_no'`. Mevcut regex:

```
-(G\d{3}-\d{3}-[A-Z0-9]+)
```

Sorun: `\d{3}` (sadece 3 rakam) — `303S` gibi varyantları yakalayamıyor (51'in dosya_adi_regex bug'ıyla aynı pattern). Düzeltme:

```sql
-- 52: parser_kural pipeline_no regex genişletme
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

### Ana İş 2 — `_l2_meta` / `_l2_fallback` DB'ye Yaz (görünürlük)

Şu an L2 başarılı olsa bile **ai_api_log'a hiç yazılmıyor** (`cevap_full` sadece AI parsed JSON). 52'de:

**Seçenek A — Yeni log fonksiyonu:** L2 başarısı için `aiApiLogYaz({ kaynak: 'izometri_oku', cagri_tipi: 'L2_deterministic', parser_seviye: 'l2', ... })` çağır. Token/maliyet 0. Cevap_full = ham_cevap.

**Seçenek B — Mevcut visionAIParse log'una meta ekle:** Fallback durumunda `cevap_full.parsed._l2_fallback = ...` set edilsin DB'ye yazılmadan önce.

**Önerim: A** — temiz ayrım, parser_seviye filtresi ile metrik çıkarma kolay.

### Ana İş 3 — `parser_kural` Diğer Alanları Test (5+ örnek prensibi, MK-51.2)

pipeline_no düzeldikten sonra hâlâ fail edebilecek alanlar:
- `kalite` whitelist: `ST37|S235JR|A106B|316L|304L|316|304` — başka kalite varsa fail
- `cap_mm`, `et_mm`, `boy_mm`: `(\d+(?:\.\d+)?)x(\d\.\d)(\d{3,5})` — DN50 dışı çapları (DN20, DN100) yakalar mı?
- `agirlik_kg`: `(\d+(?:\.\d+)?)\s*kg` — birden fazla kg geçiyorsa hangisini alıyor?
- `proje_kodu`: `\b(?:NB|B)(\d{4})\b` — başka proje kod formatı varsa fail
- Malzeme satır pattern'leri (`boru`, `fitting`, `islem`): 50'de 3 örnekle yazıldı

**Plan:**
1. 5+ farklı Tersan PDF yükle (yapı çeşitliliği için)
2. Her birinde L2 fail sebebini gör (`sebep` log'u)
3. Hangi alan en sık fail ediyor → onu düzelt → tekrar test
4. %80+ L2 başarı oranı hedefi

---

## İkincil İşler

### "Tersan M110 Montaj Resmi" formatı temizlik kararı

84c12f61 formatı son 3 oturumda hep yanlış tanıma sonucu hit aldı. Gerçekten "Montaj Resmi" PDF'i hiç gelmedi mi? İki seçenek:

- **(A) Sil:** Aktif=false yap. Eğer ileride gelirse log'da format yok diye çıkar, kullanıcı bildirir, yeniden tanımlanır.
- **(B) Tut, fingerprint'i daraltsa:** Belirli pattern'i `M\d+-\d+-\d+\.\d+\.pdf` ile sınırla. Yanlış pozitif olmasın.

Karar: 52'de Cihat'a sor, Tersan'da Montaj Resmi gelir mi diye.

### Format envanter UI (super_admin)

`/admin/formatlar` sayfası:
- Liste: format_kodu, ad, parser_kural durumu (boş/dolu), kullanim_sayisi
- Her format için L2 fail oranı (51 → 52'de log_yazma eklendiğinde mümkün)
- parser_kural JSON görüntüleme (read-only başlangıçta)
- Yan ileride: parser_kural editör

### Etkileşimli Format Öğretme Modal

L3 başarılı olunca + format_kodu yeni veya parser_kural eksikse:
- Modal: "Bu format için L2 kuralı yazılsın mı?"
- AI'nın L3'te ne çıkardığı + dosya_adi_regex önerisi göster
- Kullanıcı onayla → parser_kural taslağı DB'ye yazılır
- 53+ oturumlarda manuel düzeltmelerle iyileşir (pasif öğrenme)

### tv() i18n eksiklikleri

CI'da 28 uyarı var, `lang/tr.json` + `lang/en.json` doldurulacak. Hızlı iş.

### Hatalı kayıt aksiyonları

`kuyruk-yeniden-dene`, `kuyruk-sil`, `kuyruk-pdf-indir` endpoint'leri eksik. izometri-batch sayfası bu butonları gösteriyor ama backend yok.

---

## Kritik Hatırlatmalar (51 + öncesi)

- **`izometri-oku.js`'e DOKUNMA** (MK-49.1) — minimum değişiklik, sadece ilgili fonksiyon
- **Hassas anahtar Claude'a verme** (MK-50.1)
- **Yeni format için parser_kural yazmadan önce 3+ başarılı AI örneği** (MK-50.3)
- **Dotfile oluşturduktan sonra `ls -la` kontrol et** (MK-50.4)
- **Image-PDF formatları L2 yapamaz** (MK-50.2 — PAOR cache+L3'te kalır)
- **MK-51.1:** Dosya kopyalamadan önce `~/Downloads`'da MD5 + satır sayısı doğrula. `~/Downloads/_arsiv/` ile eski sürümleri ayır.
- **MK-51.2:** Parser_kural regex'lerini en az 5 farklı gerçek dosya örneğiyle test et.
- **MK-51.3:** Yeni kod yolu eklerken DB log şemasıyla uyumluluk kontrolü yap (cevap_full'a meta yazılır mı?).
- **MK-51.4:** DB schema değişikliği yapılırken kod tarafında SELECT/INSERT cümlelerini grep'le tara.

---

## Süreç Disiplinleri (50 + 51'den)

- **Heredoc yöntemi** dosya yazma için (Mac indirme bozuk)
- **`cat > ... <<'EOF'`** çoklu dosya yazımında
- **`ls -la`** dotfile kontrolü için zorunlu
- **`git stash`** + **`git pull --rebase`** + **`git stash pop`** modified `.DS_Store` durumlarında
- **Vim açılırsa:** `Esc` → `:q!` → `Enter` (kaydetmeden çık), sonra abort
- **Çakışma çözümü:** `git checkout --ours <dosya>` (rebase'de HEAD = remote)
- **Vercel logs zaman dilimi:** UTC saklar; SQL'de `AT TIME ZONE 'Europe/Istanbul'` kullan
- **DB sütun adı uyumsuzluğu:** `information_schema.columns` ile her zaman doğrula, Postgres "Perhaps you meant" hint'ine bak
- **Sadece terminal git akışı:** GitHub web UI upload kullanma (51'de "Add files via upload" karışıklığı yaşandı)

---

## 52'de Veriyle Tasarım

L2 başarısı görüldükten sonra:
- Format envanter UI'da L2 fail oranını gözlemle
- 5-10 farklı Tersan PDF birikince malzeme pattern'lerini tekrar bak
- L3 fallback oranı %30'un altına düşmeli (ölçülebilir hedef)
- Pilot tersane ile konuşulmadan önce **L2 başarı oranı %70+** olmalı (vizyon ekonomisi: 60× maliyet farkı)

---

## 53+ Vizyonu

- **Format evolution** — L3 fallback metrikleri biriktiğinde
- **SCH parsing** — `2"SCH40` → DN50, dış çap + et lookup (`boru_olculer` tablosuna, 44'te kurulu altyapı)
- **Image-PDF için L2.5** — Pre-trained AI prompt cache (PAOR formatları)
- **Pasif öğrenme** — Manuel onay düzeltmeleri parser_kural'a feedback

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

52'de canlı test için bu pattern'lerin **dışındaki** yeni PDF'ler önerilir (cache MISS olsun, L2 yolu gerçekten çalışsın).

---

## Bonus İşler (52'de zaman kalırsa)

- AI taslak üret endpoint (L3 sonucu → parser_kural taslağı)
- Malzeme satır pattern temizliği ("WELDING NUMBERCUT NUMBER" false positive)
- "Format eskiyor" uyarı mantığı (L3 fallback oranı %15+ olursa)

---

> 52. oturum açılışında bu dosya, `son-durum.md` ve `docs/CLAUDE-SON-OTURUM.md` okunur. Sonra Cihat'a "Hangi işle başlayalım?" sorusu sorulur. Önerilen sıra: pipeline_no fix → DB log yazma → parser_kural test (5+ PDF).
