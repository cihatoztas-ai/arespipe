# Son Durum — 130. Oturum (28 Mayıs 2026)

> 129 → 130 geçişi. **Belge oturumu + derin teşhis** — bilinçli olarak kod yazılmadı.
> `docs/PARSER-VE-YUKLEME-AKISI.md` yazıldı (kod yazmadan, 8 kaynak dosya birebir okunarak):
> klasör yükleme → kabuk → PDF sömürme → çapraz doğrulama → onay, beş katman. Ardından Cihat'ın
> tetikçi testi + montaj sorunu **canlı SQL + kod** ile tam teşhis edildi. İki problem de mekanik
> bug değil, **mimari karar** (K1-K5 alındı). Kod sonraki oturuma — taze bağlamla — bırakıldı.

---

## Bu Oturumun Sonucu

**130 başarıyla kapatıldı (belge + teşhis).** Kilitli baş iş (`PARSER-VE-YUKLEME-AKISI.md`) bitti,
canlı-veri kanıtıyla mühürlendi. İki problemin kök sebebi kesinleşti; beş karar (K1-K5) Cihat
onayıyla alındı. Function tavanı 12/12 teyit edildi (yeni endpoint yok — KORUMA-4 korundu).

### Yapılanlar (sırasıyla)

1. **Açılış ritüeli** — git temiz, HEAD `f557669`, CI yeşil (129 deploy Ready). 8 reading-order
   dosyası birebir okundu (KARARLAR bayat çıktı — MK-74.3'te kalmış, kullanılmadı; MK'lar omurga
   v3.1 + canlı kod + 129 devirden alındı).

2. **`docs/PARSER-VE-YUKLEME-AKISI.md` yazıldı** — beş katman (0 Güvenlik / 1 Kabuk / 2 PDF
   sömürme / 3 Çapraz doğrulama EKSİK / 4 Onay), her katman koddan birebir referansla. MK-61.4
   ile sahip + tazelik penceresi başlığa kondu. (BRIEFING.md bilgi haritası satırı **eklenmeli** —
   açık borç.)

3. **Faz 0 teşhis (SQL + spool_detay.html):**
   - **Tetikçi testi (`7702313c`):** sistem körü körüne kabul ETMEDİ — L3 okudu, `bindir` çelişki
     yakaladı (`celiski_et_cap_farkli`, flag:true), `manuel_onay`'a düştü. AMA: (a) çelişkiye rağmen
     `spool_id` yazıldı + `kismi` oldu, (b) **malzeme kıyası yok** (boyut tutsaydı kaçardı),
     (c) flag UI'da görünmüyor.
   - **Montaj UI bug DEĞİL:** `spool_detay.html:1262` montaj okuma yolu doğru; `montaj_json` null
     olduğu için boş. Kök: **montaj tespiti yalnız L2'de var**; bu devre L3'e gitti (format
     tanınmadı), L3 montaj bilmez → `montaj_json` hiç yazılmadı.

4. **K1-K5 kararları alındı** (detay: PARSER-VE-YUKLEME-AKISI.md Bölüm 8).

---

## Oturum 130 Kararları (K1-K5)

| # | Karar |
|---|---|
| K1 | Çelişki varsa uyarı ver (İnceleme 🟡); aktif öğrenme düzeltmelerle zenginleşir; cizim_durumu enum'a dokunma |
| K2 | Excel'de malzeme listesi varsa PDF ile karşılaştır, yoksa PDF'ten oluştur (malzeme her hâlükârda okunmalı) |
| K3 | bindirme_flag → v3 İnceleme 🟡 + düzelt popup (mockup v5'te tasarlı) |
| K4 | Montaj PDF ilgili spool'ların detayında görünmeli; içi okunarak eşleştirilmeli. **Yol kararı sonraki oturum:** 2 (format öğret, kalıcı) vs 1 (L3 montaj, evrensel) — yol 3 elendi |
| K5 | Function tavanı 12/12; Katman 3 endpoint öncesi konsolidasyon; Pro'yu pilota sakla (MK-129.3) |

---

## CI Son Durum

- HEAD `f557669` (129 kapanış doc, `[skip ci]`). Bu oturumda **kod push yok** — sadece doküman.
- Function sayısı: **12/12** (Hobby tavanı, teyit edildi `ls api/*.js | wc -l`).

---

## 131'e Açık Borç (önceliğe göre)

1. **Montaj tespiti — yol kararı (K4):** Yol 2 (format öğret, AT110/Demo Atölye `parser_kural` +
   `montaj_modu`) mı, Yol 1 (L3 prompt montaj branch, MK-49.1 dokunur) mı? Karar + kod.
2. **K1+K3 — bindirme_flag UI:** v3 İnceleme ekranında 🟡 + düzelt popup. Function tavanı bağımlı.
3. **K2 — malzeme listesi kıyası:** Excel BOM × PDF `malzeme_listesi` diff. İnceleme UI sonrası.
4. **K5 — function konsolidasyon planı:** kuyruk-isle-* tek router'a indirme (Katman 3 endpoint için yer aç).
5. **MK-61.4 borcu:** `BRIEFING.md` bilgi haritasına `PARSER-VE-YUKLEME-AKISI.md` satırı eklenmeli.
6. **v3 İnceleme & Onay giydirmesi (büyük, çok-oturumluk):** mockup v5 → v3, okuma endpoint'i
   (MK-127.3) + 4-durum render + çapa/füzyon UI. K1-K3 bunun içinde çözülür.
7. **Önceden açık (taşındı):** 117 (`yukleyen_id`), web-spool sync, fitting (DIN 86087/ASME B16.9),
   `spool_dokumanlari` bağ tablosu, "fazla" UX (S-segmentsiz montaj/genel kategori).

---

## Push Paketi

| Dosya | Repo yolu | Tür |
|-------|-----------|-----|
| PARSER-VE-YUKLEME-AKISI.md | `docs/PARSER-VE-YUKLEME-AKISI.md` | **YENİ doc (130 baş iş)** |
| son-durum.md | `.github/son-durum.md` | doc |
| CLAUDE-SON-OTURUM.md | `CLAUDE-SON-OTURUM.md` | doc |
| CLAUDE-SONRAKI-OTURUM.md | `CLAUDE-SONRAKI-OTURUM.md` | doc |

Hepsi doc → commit `[skip ci]` ile gidebilir.

---

> 131 açılışında: `son-durum.md` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` +
> `docs/PARSER-VE-YUKLEME-AKISI.md` (Bölüm 8 kararlar) + omurga v3.1 okunur. İlk iş: **K4 montaj
> yol kararı** (2 vs 1), sonra v3 giydirmesinde K1+K3.
