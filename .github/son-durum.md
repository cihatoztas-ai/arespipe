# AresPipe — Son Durum

> **Son güncelleme:** 28 Nisan 2026 — 40. oturum kapandı
> **CI:** YEŞİL (henüz yüklenmemiş 12 dosyanın upload sonrası beklenen durum)
> **Aktif oturum sayısı:** 40

---

## 40. Oturum Özeti

**İki ana faz:**

**Faz A — Operasyon sayfaları toplama + Markalama dönüşümü + 46 i18n** (~5 saat)

**Faz B — Uzun kahve sohbeti (vizyon ve modüler altyapı)** (~3 saat, sabaha karşı)

Faz B sohbet havasında ama 9 farklı vizyon damarına yayıldı. **Vizyon belgesinin temelini attı.** İleri planlama açısından 40'ın en değerli kısmı.

**Çıktılar (12 dosya):**
- 4 HTML (bukum, markalama, kalite_kontrol, sevkiyatlar)
- 3 lang JSON (tr, en, ar) — 1651 anahtar
- son-durum.md (bu dosya)
- CLAUDE-SON-OTURUM.md (40 detaylı arşivi)
- CLAUDE-SONRAKI-OTURUM.md (41 gündemi)
- **VIZYON-VE-MODULER-MIMARI.md** (Faz B sonucu, vizyonun ana belgesi)
- **KUTUPHANE-KAPSAM.md** (standart kütüphane referansı, Vizyon 9 destekleyici)

---

## Faz A — Yapısal İşler

**bukum.html** (991→1013): modalBukumOnayi HTML'i yoktu (null hatası bug), eklendi. aciklama scope bug fix. 8 i18n.

**markalama.html** (1439→1569): **Akordeon kaldırıldı**, kesim ile aynı tablo+modal yapısı geldi. mlDetayModal yeni, 3 mod (aktif/arşiv/manuel). 17 i18n. EN BÜYÜK İŞ.

**kalite_kontrol.html** (782→822): hero+stat-pill standardı (yeşil --kk-c). TR yazım fix (Agirlik→Ağırlık vb.). 7 i18n.

**sevkiyatlar.html** (1162→1225): hero+stat-pill standardı (mavi --sev-c). Renk lejandı broken HTML fix (`</div attr=...>` → span). 12 i18n.

**lang/*.json**: 1605→1651 anahtar (+46). 7 anahtar HTML'de kullanılıyor ama lang'da yokmuş — sessiz borç tamamlandı.

---

## Faz B — Kahve Sohbeti (9 Vizyon Damarı)

Cihat oturum sonunda mola moduna geçti, vizyon konularını derinlemesine konuştuk. Sırayla:

1. **3D yön çıkarımı** — Three.js zaten hazır, sorun AI'ın yön bilgisi vermemesi.

2. **Klasör yükleme + format tanıma** — Devre yüklerken tek klasör drag-drop, sistem dosyaları pattern + header ile tanır. İlk gemi $2-5, ikinci $0.50.

3. **Çapraz validasyon (3 katman)** — AI çıktı vs IFS, 3-görünüş yön, 3D thumbnail karşılaştırma.

4. **STEP/IGES koordinat çıkarımı** — Cihat'ın anahtar buluşu: *"Bize STEP'in görseli/render'ı lazım değil, sadece koordinatlar."* Bu yaklaşım Lambda dönüşüm servisini gereksiz kılıyor, 1-2 oturumluk işe düşürüyor.

5. **Tier'lı servis modeli** — 4 tier müşteri tipi (random AutoCAD / sadece liste / IFS+PAOR / STEP dahil), gelen veriye göre hizmet seviyesi ve fiyat.

6. **Lazer tarama (as-built)** — iPhone Pro LiDAR + Polycam → STEP karşılaştırma → sapma haritası. Tier 3 premium.

7. **Pasif öğrenme** (RAG + tersane profili + feedback log) — Cihat'ın "atölye temizlikçi" benzetmesi. Modeli yeniden eğitmek değil, daha iyi context vermek.

8. **Standart kütüphane stratejisi** — 7 malzeme grubu, ~12.000 satır kapsam tavanı, organik dolma.

9. **Parça Kimliği Prensibi (en önemli)** — Cihat son cümlede netleştirdi: *"Sisteme giren bir malzeme yazı değil, fiziksel nesne olarak tanımlansın."* Vizyonun **belkemiği**.

### Cihat'ın Korku Dengesi

Cihat *"Onu da yapalım bunu yapalım derken elimizden de olmayalım"* dedi. Bu doğru içgüdü. Vizyon belgesinin yapısı bu korkuya cevap olarak şekillendi:

- Kategori A (bugün) / B (pilot sonrası 3 ay) / C (6+ ay sonrası)
- Hiçbir madde tarih bazlı değil, **sinyal bazlı**
- *"Tetik koşulu olmadan iş yok"* prensibi
- Modüler altyapı bugünden hazır olsun, vakit gelince yeniden yazma yok

---

## Açık Borçlar (40 Sonu)

| Borç | Detay | Öncelik |
|---|---|---|
| Canlı uçtan uca test (39 + 40) | PDF→AI→onay→IFS + markalama listeler modal | YÜKSEK |
| Pre-A.3 çoklu sayfa dispatcher | pdf-lib + parallel/sequential | ORTA |
| vercel.json ignoreCommand fix | Sadece kod değişince build | ORTA |
| Test Yönetimi sayfası | Hero+stat-pill standardı | ORTA |
| 4 yönetim sayfası | Aynı standart | DÜŞÜK |
| Kesim son %10 | Excel TR | DÜŞÜK |
| Pano implementasyonu | 23'ten beri tasarım hazır | DÜŞÜK |
| Sevkiyat yıl filtresi | "Bu Yıl Spool" | DÜŞÜK |
| Markalama eski toggleArc temizlik | Boş fonksiyon | DÜŞÜK |
| Kütüphane DB schema (Vizyon 9 — Aşama 1) | Pilot öncesi altyapı | YÜKSEK / Pilot tetikli |

---

## Yeni Kararlar (40)

| Kod | İçerik |
|---|---|
| **K19** | Operasyon sayfaları arası tutarlılık şart |
| **K20** | Akordeon yerine tablo+modal |
| **K21** | Renk değişkeni: --SAYFA-c yerel olsun |
| **K22** | **Parça Kimliği Prensibi** — sisteme giren her malzeme yazı değil nesne olarak tanımlanır. Vizyonun belkemiği. |
| **K23** | Vizyon belgesi karar çerçevesi olarak işler. Tetik koşulu olmadan iş yok. Modüler altyapı bugünden hazır olsun. |
| **K24** | Standart kütüphane organik dolar — 12.000 satırı önceden manuel girmek yerine pilot kullanılınca büyür. |

---

## 40 Dersleri

1. **İlk grep aldatıcı** — 50+ satır oku, tahmin verme.
2. **Dürüstlük güven artırır** — "Hata yaptım" demek kolaylaştırıyor.
3. **JS dokunmazsa risk küçülür** — DOM ID'leri sabit tut.
4. **Cihat upload = seçim sinyali** — Metin beklemeye girme.
5. **"Aynı formata çevir" = büyük iş** — Saat tahminini 2-3x yap.
6. **i18n borcu** — HTML'e data-i18n eklediğimde hemen lang'a da ekleyeyim.
7. **Broken HTML attribute** — `</div attr=...>` regex'i lint'e eklenmeli.
8. **Vizyon sohbetinde acele etme** — Cihat 9 damarı gezdi, hepsi birbirine bağlandı.
9. **Cihat'ın stratejik soruları sezgi sinyalidir** — Korku ifadeleri scope drift uyarısı, ciddiye al.
10. **"Kütüphane = ölçü tablosu" değil** — Cihat'ın asıl niyeti: *"parça yazı değil nesne olsun"*. Netleşmesi 5 mesaj sürdü ama netleşince tüm vizyon parçaları birbirine bağlandı.

---

> Bu dosya 40 kapanışında oluşturuldu. Faz A teknik iş, Faz B vizyon çerçevesi.
