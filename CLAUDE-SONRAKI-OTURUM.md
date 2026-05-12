# CLAUDE-SONRAKI-OTURUM.md

**Hedef oturum: 81**
**Önceki oturum: 80 (12 May 2026), nihai hash `b5f9226` (Migration 051 rebase sonrası)**

---

## 81 Açılış Ritüeli (5 Çek)

MK-80.2 disiplini gereği **her açık borç DB live state ile teyit edilmeli** — aşağıdaki kapsamlar yazılırken kontrol edilen durumdur; oturum başında **mutlaka yeniden doğrulanmalı** (örneğin C yolundaki flanş satır sayımı, D yolundaki γ kapsamı vs.).

1. `git status` — temiz mi?
2. CI rengi — son commit'ten sonra yeşil mi?
3. Bu dosya (`CLAUDE-SONRAKI-OTURUM.md`) — gündem teyidi
4. Açık feedback sayımı
5. **DB live state checks** (önerilen yol seçildikten sonra)

---

## Açık Borç Tablosu

| Yol | İş | Tahmini Süre | Öncelik | Notlar |
|---|---|---:|---|---|
| **C** | Flanş ağırlık dolum (B16.5 + EN 1092-1) | ~1.5 sa | P1 | 173 satır (112 + 61) |
| **D** | B16.9 γ ağırlık (büyük NPS + 3D küçük NPS) | ~1 sa | P1 | 65 satır, ProjectMaterials/Octalsteel |
| **B-γ** | B16.9 reducer γ (Wermac kapsam dışı) | ~45 dk | P2 | 52 satır (DN 800-1000, 600-550, 700-450) |
| **F** | EN 1092-1 PN 25 ağırlık | ~30 dk | P2 | 60 satır (78'den taşınan) |
| **G** | M_K düşük sıcaklık karbon | — | P2 | Spec araştırma (78'den) |
| **H** | B16.11 reducing coupling | — | P2 | Yeni geometri tipi (78'den) |
| **I** | B16.11 threaded fittings | — | P2 | SW dışı diş tipi (78'den) |
| **J** | B16.9 stub_end MSS SP-43 short pattern | — | P3 | Stainless steel hat (78'den) |
| **K** | fitting_malzeme_uyum script tasarımı | ~1 sa | P2 | İlk script, library bağlama |

---

## Önerilen Yol Açıklamaları

### Yol C: Flanş Ağırlık Dolum (B16.5 + EN 1092-1) — Önerilen 81 ana cephesi

**Tahmini etki**: flanş tablosu (henüz hiç ağırlık dolu değil) %0 → %100. fitting_olculer tablosundan farklı bir tabloda, bağımsız cephe.

**Kaynak stratejisi (MK-75.3)**:
- **B16.5** (112 satır): Wermac flange weight tabloları + ProjectMaterials cross-check
- **EN 1092-1** (61 satır): EN standartı tablosu (PN 6/10/16/25/40) + üretici cross-check

**Açılış DB check (MK-80.2 zorunlu)**:
```sql
-- Flanş tablo varlığı + sayım + ağırlık doluluk
SELECT geometri_std, COUNT(*) AS sayim, COUNT(agirlik_kg) AS dolu
FROM flansh_olculer  -- (veya doğru tablo adı: flansh_olculer, flange_olculer?)
GROUP BY geometri_std;

-- Schema kontrol
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name LIKE '%flansh%' OR table_name LIKE '%flange%'
ORDER BY ordinal_position;
```

Tablo adı doğrulandıktan sonra:
- B16.5 sınıfları: 150/300/600/900/1500/2500 (rating-bağımlı ağırlık)
- EN 1092-1 PN: 6/10/16/25/40 (PN-bağımlı ağırlık)

### Yol D: B16.9 γ Ağırlık (kalan büyük NPS ve 3D küçük NPS)

**Tahmini etki**: fitting_olculer ağırlık doluluğu **452 → 517** (~%89).

**Kapsam**:
- 90LR/45LR/tee_eq/cap büyük NPS γ satırları (NPS 32-40, DN 800-1000)
- 3D küçük NPS γ satırları (Wermac kapsamına girmeyenler)

**Kaynak**: ProjectMaterials/Octalsteel/üretici katalogları.

**Açılış DB check**:
```sql
SELECT parca_tipi, COUNT(*) AS sayim, COUNT(agirlik_kg) AS dolu,
       COUNT(*) - COUNT(agirlik_kg) AS bos
FROM fitting_olculer
WHERE geometri_std = 'ASME B16.9' AND agirlik_kg IS NULL
GROUP BY parca_tipi
ORDER BY parca_tipi;
```

### Yol B-γ: B16.9 Reducer γ (80'in kalanı)

**Tahmini etki**: fitting_olculer reducer doluluğu **88/114 → 114/114** her iki parça için (yani 176 → 228).

**Kapsam** (80'de tespit edildi):
- DN 800-1000 büyük NPS: 24 satır × 2 = 48 (Wermac NPS 30 sınırı dışı)
- DN 600-550 (24-22): 1 × 2 = 2 (Wermac "-")
- DN 700-450 (28-18): 1 × 2 = 2 (Wermac yok)
- **Toplam: 52 satır**

**Kaynak**: Sandvik / Vallourec / Octalsteel büyük NPS reducer katalogları, NPS 32-40 (DN 800-1000) için spesifik üretici aranmalı.

### Yol F-J (78'den taşınan, durum 80'de değişmedi)

Detayları 78. oturum dosyalarında. 80'de bu cephelere dokunulmadı.

---

## Tahmini Süreler ve Kombinasyonlar

- **Tekli**: C tek (~1.5sa) veya D tek (~1sa) veya B-γ tek (~45dk)
- **İkili**: C + B-γ (~2.5sa) **önerilen**, çünkü iki bağımsız cephe; veya D + B-γ (~1.75sa)
- **Üçlü**: C + D + B-γ (~3.5sa) — çok uzun, sonraki kapanış zayıflar

**Tavsiye (80'den öğrenme)**: Tekli + kapanış (2 sa toplam), iki büyük cephe bir oturumda yorgunluk yaratıyor. C tek ile fitting cephe %100'e yaklaştırılır.

---

## 80'den Taşınan Disiplinler (81'de aktif)

- **MK-80.1**: Üretici primary + aggregator secondary, varyans %30-50'de yazım hatası kontrolü
- **MK-80.2**: DB live state verify CLAUDE-SONRAKI-OTURUM yazımında
- **MK-80.3**: β-mini-extended pattern (ana kolon STD, JSON multi-schedule)
- **KARAR-80.1**: ASME mass tablosu yokluk kontrolü
- **KARAR-80.2**: BF eksikse PP secondary fallback flag'i
- **KARAR-80.3**: Çift-cephe stratejisi tek-migration yerine ikili migration

---

## Açık Sorular (81 başında sorulacak)

1. **Push hash zinciri**: 80'de `cf8e462` (beklenmedik commit, rebase sonrası içerildi) ne içeriyor? Library batch chat'lerden mi geldi? Eğer öyleyse, library content population (B0-B14) durumu güncellenmeli.
2. **flansh_olculer tablo adı doğru mu** (yoksa flange_olculer veya başka bir ad)?
3. **C yolu için B16.5 sınıf detayı**: Hangi class'lar (150-2500) DB'de mevcut? Class-bağımlı ağırlık pattern'i için DB live state kontrolü.

---

## 81 İçin Başlangıç Komut Önerisi

```bash
# Açılış 5 check
git status
ls migrations/ | tail -5

# Library batch durumu (cf8e462 sorgusu)
git log --oneline cf8e462 -5

# CI ve son durum
cat .github/son-durum.md
```
