# Son Durum (80. oturum)

**Tarih**: 12 May 2026 (Salı)
**Son hash**: `b5f9226` (Migration 051 rebase sonrası)
**Kendi commit'ler**: `ad57157` (050), `c3f6f84` → rebase → `b5f9226` (051)
**Beklenmedik commit (rebase'e dahil edildi)**: `cf8e462` — kaynak doğrulanmalı (paralel chat batch olabilir)

---

## 80'de Tamamlanan

| Migration | Cephe | Satır UPDATE | Kaynak |
|---|---|---:|---|
| 050 | B16.11 SW fitting ağırlık | 105 | Bonney Forge primary + pipingpipeline secondary |
| 051 | B16.9 reducer ağırlık | 176 | Wermac BW Reducers (Hackney Ladish) |

**fitting_olculer ağırlık doluluğu**: 171 → **452** satır (~%30 → ~%78, **+281 satır**)

---

## CI Durumu

Son push (`b5f9226`) sonrası CI rengi 81 açılışında kontrol edilmeli.

---

## Açık Borç (81 İçin)

| Yol | İş | Süre | Öncelik |
|---|---|---:|---|
| **C** | Flanş ağırlık (B16.5 + EN 1092-1, 173 satır) | ~1.5 sa | P1 |
| **D** | B16.9 γ ağırlık (büyük NPS + 3D, 65 satır) | ~1 sa | P1 |
| **B-γ** | B16.9 reducer γ (52 satır, DN 800-1000 + 600-550 + 700-450) | ~45 dk | P2 |
| F-J | 78'den taşınan: EN 1092-1 PN 25, M_K low temp, B16.11 reducing/threaded, stub_end MSS SP-43 | — | P2-P3 |
| K | fitting_malzeme_uyum script tasarımı | ~1 sa | P2 |

**81 önerisi**: Yol C tek (~1.5sa) — flanş cephe %0 → %100, bağımsız tablo.

---

## Aktif Mimari Kararlar (80'de eklenen)

- **MK-80.1**: Fitting ağırlık için üretici tablosu primary + aggregator secondary; %30-50 varyansta yazım hatası kontrolü zorunlu
- **MK-80.2**: CLAUDE-SONRAKI-OTURUM yazılırken her açık borç DB live state ile teyit edilmeli (hayalet borç önleme — 79'da E yolu bu hatanın ürünüydü)
- **MK-80.3**: β-mini-extended pattern — STD ana kolon, JSON multi-schedule (null'lar kabul)
- **KARAR-80.1**: ASME standardı mass tablosu içermezse üretici tablosu primary
- **KARAR-80.2**: BF eksik NPS'lerde PP secondary fallback, JSON'da flag
- **KARAR-80.3**: Multi-source fitting ağırlık → iki ayrı migration daha temiz

---

## Bilinen Sorunlar (Hâlâ Aktif)

- File transfer >45KB Claude→Mac güvenilmez (workaround: heredoc base64 + git apply)
- macOS `base64 -d` stdin redirect syntax (`base64 -d < file`)
- Downloads klasörü numaralı duplicate dosya birikimi
