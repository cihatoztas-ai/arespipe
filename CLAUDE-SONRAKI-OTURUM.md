# 25. Oturum Gündemi — Claude İçin Önizleme

> Bu dosya 25. oturum açılışında Claude tarafından okunacak.
> Amaç: gündemi Cihat'a seçenek olarak sunmak, "serbest kaldık, hangi işten başlayalım?" diye sormak.

---

## 🎯 Durum Özeti (24. oturum sonunda)

- ✅ **Süper Admin Pano canlıda** — 3 sekme, tüm CRUD'lar çalışıyor
- ✅ **feedback_kayitlari** 5 durum akışına geçti, 26 kayıt eşlendi
- ✅ **panel_gorevler** tablosu kuruldu, 3 seed görev + Saat 3'te dönüşmüş görevler
- ✅ **CI yeşil** — 0 hata, 22 uyarı (baseline)
- ✅ **Cihat tek yerden takip edebiliyor** — %80

Kalan iş artık **altyapı değil, bakım + özellik.** Cihat serbesttir, sıra seçmelidir.

---

## 📋 25. Oturum — 4 Seçenek

### A) Sistem Sağlığı Kartı (Pano'ya) — "%80 → %100"

**Sorun:** "22 uyarı hangi 11 sayfada?" — Cihat hâlâ GitHub Actions log'una gitmek zorunda.

**Çözüm:** Pano > Oturum Panosu'na yeni bir bölüm: **"🩺 Sistem Sağlığı"**
- Son CI run'ının detay çıktısı (JSON)
- Uyarı kategorileri: ARES_NORMALIZE_EKSIK (22), I18N_EKSIK, G03_HAM_*, vb.
- Her kategori açılır → dosya + satır numarası + fix önerisi
- "Fix kopyala" butonu (tek satır JS ekleme önerisi)

**Gerekli altyapı:**
- `.github/kontrol.js` → JSON çıktı modu (`--json` flag veya default mode)
- GitHub Actions artifact olarak yayınla (`actions/upload-artifact@v4`)
- Pano'da artifact fetch (GitHub API) → parse → render

**Süre:** 2-3 saat. Tamamlanınca "tek yerden takip" %100 olur.

**Öncelik:** Cihat zaten 24. oturumda bu eksikliği dile getirdi. **Makul ilk tercih.**

---

### B) CLAUDE.md Split — 23. Oturumdan Kalma Faz B Borcu

**Sorun:** `CLAUDE.md` 2592 satır — büyük, yönetilmez. Oturum açılışında bütün dosyanın Claude'a yüklenmesi verimsiz.

**Çözüm:**
- `CLAUDE.md` ~600 satıra iner (sadece pointer + meta)
- `docs/rules/` altına kural dosyaları (ör: `docs/rules/g03-render.md`, `docs/rules/g02-hero-pill.md`)
- `docs/sessions/` altına oturum özetleri (ör: `docs/sessions/23.md`, `docs/sessions/24.md`)
- Bu oturum sonrası artık `CLAUDE-SON-OTURUM.md` yerine `docs/sessions/{N}.md` formatı

**Süre:** 2-3 saat (içerik bölme + link güncelleme + referans testleri).

**Etki:** Claude oturum açılışı hızlanır, ilgili kural dosyası on-demand okunur. Ama görünür bir kullanıcı getirisi yok — arka plan iyileştirmesi.

---

### C) Profil In-App Edit — Pano'dan CIHAT-PROFIL.md Düzenleme

**Sorun:** Cihat `CIHAT-PROFIL.md`'yi güncellemek istediğinde ya Claude'a yazmak ya da GitHub üzerinden düzenlemek zorunda.

**Çözüm:**
- Pano > Oturum Panosu > Cihat Profili bölümüne "✏️ Düzenle" butonu
- Tıklayınca markdown metni textarea'ya düşer
- "Kaydet" → GitHub Contents API → otomatik commit (`docs: profil güncelleme`)
- Vercel deploy → 30 sn → panel yeniler, yeni profil görünür

**Gerekli altyapı:**
- GitHub Personal Access Token (repo write yetkisi) — Vercel env var olarak
- Backend endpoint: `api/profil-guncelle.js` (Vercel Function, POST body = yeni markdown)
- Frontend: textarea + Kaydet butonu + loading state

**Süre:** 2 saat (token kurulumu + endpoint + UI).

**Öncelik:** Kullanıcı rahatlığı için değerli ama günlük iş akışını çok değiştirmez.

---

### D) Şablonlar (`docs/templates/`) — 23. Oturumdan Kalma Faz B Borcu

**Sorun:** Yeni HTML sayfa eklenirken mevcut sayfalara bakıp kopyalıyoruz. Standartlara uyumsuzluk riski.

**Çözüm:**
- `docs/templates/sayfa-iskeleti.html` — G-02 Hero Pill + G-03 render + ARES_LAYOUT + ARES_NORMALIZE + i18n
- `docs/templates/form-modal.html` — modal-box + modal-foot + form-row + form-label
- `docs/templates/tablo-sayfasi.html` — stat-card + tbl-wrap + arama
- `docs/templates/liste-sayfasi.html` — kart grid + filter
- README ile kullanım örnekleri

**Süre:** 2 saat (4 şablon + README).

**Etki:** Sonraki sayfa eklemelerinde lint hatası bir anda düşer, tutarlılık artar. Şu an acil olmadığı için ertelenebilir.

---

## 🔀 Claude'un Önerisi

**A (Sistem Sağlığı Kartı)** öncelikli olmalı — sebepleri:
1. Cihat bu ihtiyacı 24. oturumda dile getirdi, bekleniyor.
2. Pano'nun "tek yerden takip" vaadini %100'e tamamlıyor.
3. B/C/D altyapısı değil, direkt kullanıcı getirisi.
4. 2-3 saat, 25. oturumun orta ağırlıkta tek işi.

**B (CLAUDE.md Split)** 26. oturumda — altyapı borcu, gün geçtikçe ağırlaşır.

**C (Profil edit)** 27-28. oturum — A ile birlikte Pano'yu tam bağımsız kılar.

**D (Şablonlar)** sonra — yeni sayfa eklenmesi gündeme geldiğinde.

---

## 🚨 Oturum Başında Yapılacak (her zaman)

**1. Zorunlu ritüel** (son-durum.md'de tam metin):
- `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3`
- GitHub Actions yeşil mi?
- `docs/CIHAT-PROFIL.md` oku.

**2. 24. oturumun çıktılarını doğrula:**
- Cihat Pano'yu aktif kullandı mı, sorun yaşadı mı?
- `panel_gorevler`'de yeni el-ekli görevler var mı? (olabilir, Cihat "+Yeni Görev" deneyecek)
- Feedback → Göreve Dönüştür'ün çalıştığını görev listesinde (↗ feedback_donusumu etiketi) doğrula.

**3. Sonra:** Cihat'a 4 seçeneği göster → seçim al → Saat bölümleri tanımla → başla.

---

## 📌 Uzun Vadeli Hatırlatıcılar

- **28. oturum:** Self-test hatırlat (`node .github/kontrol.js --self-test`)
- **Faz B tamamlanmaya yakın:** CLAUDE.md split + şablonlar bittiğinde Faz B ✅ kapanır
- **Faz C:** Tenant izolasyon testleri (henüz konuşulmadı, ileride)

---

_Bu dosyayı her oturum sonu Claude yazar. 25. oturum açılışında Cihat gündemi buradan görür._
