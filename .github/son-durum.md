# AresPipe — Son Durum (her oturum sonunda güncellenir)

> Bu dosya her oturum açıldığında Claude tarafından **zorunlu olarak okunur.**
> İçeriği hafıza değil kayıt. Unutma imkansız — dosya burada.

---

## Son Oturum: 23 (23 Nisan 2026) — Faz B ✅ + Pano Tasarımı ✅

### CI Durumu
- **Son build:** YEŞİL ✅ (23/04/2026 09:40, commit #453)
- **Sonuç:** 0 hata, 22 uyarı
- **Taranan dosya:** 74

### Aktif Kural Sayısı
- **Hata seviyesi:** 5 (yasak renkler 3 + flash prev 1 + theme 1)
- **Uyarı seviyesi:** 9 (history.back, kumsaat, ARES_NORMALIZE_EKSIK, G03_HAM_MALZEME, G03_HAM_KALITE, G03_HAM_YUZEY, G03_HAM_MALZEME_TEMPLATE, G03_HAM_KALITE_TEMPLATE, I18N_EKSIK)
- **Zorunlu her HTML:** 2 (ARES_LAYOUT_EKSIK hata, ARES_NORMALIZE_EKSIK uyarı)
- **TOPLAM:** 14 ayrı kural aktif

### Açık Borç (24+ oturumlar temizleyecek)
- **22 adet ARES_NORMALIZE_EKSIK uyarısı** — 11 sayfada `ares-normalize.js` script satırı eksik
  - Karar: Fırsatta temizlenir, her sayfa dokunulduğunda kapanır

### Bu Oturumda Yapılanlar
- `.github/kontrol.js` genişletildi: regex + self-test + ham gösterim/i18n kontrolleri
- `.github/kurallar.json` genişletildi: 9 → 14 kural
- `.github/bozuk-ornekler/` kuruldu: her kural için kanıt dosyası
- `.github/KONTROL-SISTEMI.md` yazıldı: kullanım rehberi
- GitHub'a yüklendi, CI yeşil, baseline çıkarıldı
- **`docs/SPOOL-AI-VIZYON.md`** — vizyon belgesi kalıcı yerine kondu
- **`docs/PANO-TASARIM.md`** — Süper Admin Pano tasarım belgesi (24. oturumda implement)
- **`docs/CIHAT-PROFIL.md`** — Claude'un Cihat'ı tanıması için dosya

### Kural Sağlık Kontrolü
- **Son self-test:** 23 Nisan 2026, 08:47 — 3/3 başarılı ✅
- **Sonraki self-test:** 28. oturum — Claude hatırlatacak

### Bekleyen Faz B Kalemleri
- 🟡 CLAUDE.md split (2592 satır → 600 + docs/rules/ + docs/sessions/)
- 🟡 Şablonlar (docs/templates/)
- 🟡 Husky + package.json (opsiyonel)
- 🟡 `hedef_dosyalar` kural tipi — 24. oturum panosunda ihtiyaç doğabilir

---

## 📖 Aktif Belgeler (Yaşayan — Her Oturumda Gündemde)

### Vizyon: `docs/SPOOL-AI-VIZYON.md`
Spool AI ürün vizyonu: 7 katman, 5 faz, prototipler, AI döngüsü. Her yeni karar buraya değişiklik kaydıyla eklenir.

### Pano Tasarımı: `docs/PANO-TASARIM.md`
Süper Admin Yönetim Panosu. **24. oturumun ana işi.** 3 sekme: Görev Takibi, Geri Bildirim Yönetimi, Oturum Panosu. `panel_gorevler` tablosu kurulacak.

### Kullanıcı Profili: `docs/CIHAT-PROFIL.md` ⚠ ZORUNLU
Her oturum başı Claude bu dosyayı okur. Cihat'a "kimsin" diye sormaz. Çalışma tarzı, tercihler, allerjiler burada. Yeni öğrenilen şey olursa Claude dosyaya ekler (Cihat'a onaylatır).

---

## Bir Sonraki Oturumda Claude Bunları Yapacak

**1. Oturum açılır açılmaz, ilk tool call'dan ÖNCE şunu söyle:**

> "Oturum başlangıç ritüeli. Şunu çalıştır ve çıktıyı yapıştır:
> ```
> cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
> ```
> Ayrıca GitHub Actions sekmesinde son build yeşil mi kontrol et."

**2. Ritüel tamamlanmadan hiçbir teknik iş başlama.**

**3. Ritüel biter bitmez `docs/CIHAT-PROFIL.md`'yi oku.** Cihat'a kim olduğunu sormadan devam et.

**4. 24. oturumun ana işi: Pano implementasyonu.**
- `docs/PANO-TASARIM.md` aç, saat-saat plan orada
- Cihat'a "plana sadık kalalım mı, ayarlama lazım mı?" sor
- 5 saatlik iş — saat saat ilerle, her saatin sonunda ara ver ve özet ver

**5. Her 5 oturumda bir self-test hatırlat:** 28, 33, 38. oturumlar. Komut: `node .github/kontrol.js --self-test`

---

## Oturum İçinde Uyulacak Disiplin

- **Kural çakışması varsa dur, sor** (A/B/C seçeneği)
- **"Hatırlıyorum" deme** — dosyaya bak
- **Yeni kural söylendiğinde 3 iş:** kurallar.json + kanıt + self-test
- **Komutları üst üste verme** — birer birer, açıklamalı (CIHAT-PROFIL.md'de yazılı)
- **Büyük değişikliklerde tam dosya** — patch değil

---

_Bu dosyayı her oturum sonu Claude günceller. Kullanıcı sadece yükler._
