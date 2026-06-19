# 📋 Doküman Sağlık Taraması — SALT OKUMA RAPORU

## 1) ENVANTER

Toplam **79 `.md`** dosyası (node_modules hariç). Aynı isimden birden çok kopya taşıyan gruplar:

| Dosya adı | Kopya | Konumlar |
|---|---|---|
| **son-durum.md** | 4 | `./` , `docs/` , `.github/` , `_arsiv/` 🗄️ |
| **CLAUDE-SON-OTURUM.md** | 3 | `./` , `docs/` , `_arsiv/` 🗄️ |
| **CLAUDE-SONRAKI-OTURUM.md** | 3 | `./` , `docs/` , `_arsiv/` 🗄️ |
| **KARARLAR.md** | 2 | `./` , `docs/` |
| **BRIEFING.md** | 2 | `./` , `docs/` |
| **README.md** | 4 | `./` , `mobile/` , `migrations/` , `docs/templates/` |

🗄️ = arşiv kopyası. Ek olarak `docs/arsiv/` altında `CLAUDE-SON-OTURUM-65-yanlis-yazim.md`, `CLAUDE-SONRAKI-OTURUM-65-yanlis-yazim.md`, `son-durum-65-yanlis-yazim.md` gibi tarihli/etiketli arşiv varyantları var (isim farklı olduğu için "kopya" sayılmadı, ama aynı soydan).

> Not: `KUTUPHANE-DURUM.md` tek kopya (`docs/`). `docs/KUTUPHANE-BRIEFING.md`, `KUTUPHANE-KAPSAM.md` vb. ayrı dosyalar — kopya değil.

---

## 2) KOPYA ANALİZİ (md5 + içerik)

| Grup | Sınıf | Detay |
|---|---|---|
| **son-durum.md** (kök/docs/.github) | ✅ ÖZDEŞ | Üçü de `0f34546…`, hepsi **193. oturum**, mtime bugün (19 Haz). Senkron. |
| ↳ `_arsiv/son-durum.md` | 🗄️ ARŞİV | Farklı (`60ca1e6…`), Oturum 103 (20 May). Kasıtlı arşiv. |
| **CLAUDE-SON-OTURUM.md** (kök/docs) | ✅ ÖZDEŞ | İkisi de `056cc7d…`, **193**. Senkron. |
| ↳ `_arsiv/…` | 🗄️ ARŞİV | Oturum 103. |
| **CLAUDE-SONRAKI-OTURUM.md** (kök/docs) | ✅ ÖZDEŞ | İkisi de `7aea528…`, **194 brifingi**. Senkron. |
| ↳ `_arsiv/…` | 🗄️ ARŞİV | Oturum 104. |
| **KARARLAR.md** (kök vs docs) | ⛔ **ÇATALLANMIŞ** | Kökte 139 benzersiz satır, docs'ta 897 benzersiz. İkisinde de diğerinde olmayan içerik var. Aşağıda (bölüm 3). |
| **BRIEFING.md** (kök vs docs) | ⛔ **ÇATALLANMIŞ + ÇAPRAZ** | Kök=187, docs=167. Kökte 36, docs'ta 65 benzersiz satır. Yön ters (bkz. risk notu). |
| **README.md** (4 adet) | ✅ MEŞRU FARKLI | Farklı kapsamlar (kök proje / mobile / migrations / templates). Kopya değil, sorun yok. |

---

## 3) KARARLAR ÖZEL ANALİZİ — Gerçek MK Numara Çakışmaları

`docs/KARARLAR.md` → **MK-193.1'e kadar, 250 MK referansı** (güncel, bugün güncellenmiş).
`./KARARLAR.md` → **MK-172.6'da donmuş, 108 MK referansı** (12 Haz'da kalmış).

İki dosya ~MK-135.1'e kadar uyumlu; sonra çatallanıyor. **Aynı numara, içerikçe farklı karar** olan 7 vaka:

| MK No | KÖK KARARLAR.md | docs/KARARLAR.md |
|---|---|---|
| **MK-135.2** | Dirsek 🟡 bulgusunun kökü: Excel BOM hatalı, PDF doğru | REVİZYON (MK-136.1 ışığında) |
| **MK-172.1** | Belge anteti tek kaynak (helper mimarisi) | Devreler tek giriş: yeşil "Devre Ekle" → wizard v3 |
| **MK-172.2** | Logo renk bağlamı (print sabit / ekran tema-uyumlu) | Devreler tablosunda "Son güncelleme" damgası |
| **MK-172.3** | Menü daraltma: gizlenen wordmark display:none | İmalat sıra numarası kaldırıldı |
| **MK-172.4** | Tarama core rengi MAVİ (#4C8DF5) | Native termin takvimi |
| **MK-172.5** | Tenant logo akışı | Büyük `.in()` listelerini DİLİMLE (Bad Request koruması) |
| **MK-172.6** | (SÜREÇ/UYARI) Upload bütünlüğü kontrolü | İşlenenler ekranı redesign (kutu-per-satır) |

⚠️ Bu **çok tehlikeli**: MK-172.1–172.6 numaraları iki dosyada tamamen farklı 6 karara atanmış. Bir kişi köke, biri docs'a bakarsa "MK-172.4" dediğinde farklı şey anlar. Çakışma MK-135.2'den itibaren başlıyor; arası (136–171) uyumlu görünüyor.

---

## 4) ÖZET TABLO

| Dosya | Kopya | Durum | Önerilen otorite | Risk notu |
|---|---|---|---|---|
| son-durum.md | 3+1 | ÖZDEŞ (+arşiv) | hepsi senkron | Düşük — 3 yer aynı, 193 |
| CLAUDE-SON-OTURUM.md | 2+1 | ÖZDEŞ (+arşiv) | senkron | Düşük |
| CLAUDE-SONRAKI-OTURUM.md | 2+1 | ÖZDEŞ (+arşiv) | senkron | Düşük |
| **KARARLAR.md** | 2 | **ÇATALLANMIŞ** | **`docs/KARARLAR.md`** (193, bugün, 250 MK) | 🔴 Yüksek — kök 172'de donmuş + 7 MK numara çakışması. Kök silinmeli/yönlendirilmeli değil ama **kök bayat ve yanıltıcı** |
| **BRIEFING.md** | 2 | **ÇATALLANMIŞ** | **`./BRIEFING.md`** (187, 16 Haz) | 🟠 Orta — docs/BRIEFING 167'de bayat (8 Haz). **Ama kök BRIEFING bile 187'de — handoff'lar 193'e güncellenmiş, BRIEFING geride** |
| README.md ×4 | 4 | MEŞRU FARKLI | her biri kendi dizini | Yok |

---

## 5) GENEL OTORİTE DİZİNİ GÖZLEMİ — ÇAPRAZ TUTARSIZLIK

Tek bir "otorite dizin" **yok** — ve asıl tehlike bu:

- **KARARLAR için otorite = `docs/`** (193, bugün). Kök bayat.
- **BRIEFING için otorite = kök `./`** (187). `docs/` bayat (167).
- **Handoff üçlüsü** (son-durum / CLAUDE-SON / CLAUDE-SONRAKI) **kök ↔ docs ↔ .github senkron** tutulmuş (193).

Yani aynı repoda iki dosya için otorite ters yönde. CLAUDE.md MK-56.2 "BRIEFING tek aktif bağlam" diyor ve kök BRIEFING'i işaret ediyor — bu BRIEFING için tutarlı. Ama KARARLAR'ın canlısı `docs/`, kökteki ise eski bir çatal. Birisi "kök dizin otoritedir" diye düşünüp kök KARARLAR'ı okursa MK-172+ kararlarını yanlış öğrenir.

**Ek bayatlık bulgusu (kopya sorunu değil ama dikkat çekici):** Handoff dosyaları 193'e güncellenmiş, ama **otorite BRIEFING (kök) hâlâ 187'de** — yani "tek aktif bağlam" dosyası, kendi handoff'larından 6 oturum geride.

---

**Birleştirme/düzeltme yapılmadı** — talep edildiği gibi yalnızca bulgular sunuldu. En kritik iki nokta: (a) iki KARARLAR.md arasındaki 7 MK numara çakışması, (b) KARARLAR ile BRIEFING'in otorite dizinlerinin ters olması. Karar kullanıcıya aittir.
