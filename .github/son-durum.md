# AresPipe — Son Durum (her oturum sonunda güncellenir)

> Bu dosya her oturum açıldığında Claude tarafından **zorunlu olarak okunur.**
> İçeriği hafıza değil kayıt. Unutma imkansız — dosya burada.

---

## Son Oturum: 25 (23 Nisan 2026) — Sistem Sağlığı Kartı + Sıfır Uyarı ✅✨

### CI Durumu
- **Son build:** YEŞİL ✅ (23/04/2026, run #477 sonrası)
- **Sonuç:** **0 hata, 0 uyarı** (22'den 0'a — baseline değil, mükemmel)
- **Taranan dosya:** 74

### Aktif Kural Sayısı (değişmedi)
- **Hata seviyesi:** 5 (yasak renkler 3 + flash prev 1 + theme 1)
- **Uyarı seviyesi:** 9 (history.back, kumsaat, ARES_NORMALIZE_EKSIK, G03_HAM_MALZEME, G03_HAM_KALITE, G03_HAM_YUZEY, G03_HAM_MALZEME_TEMPLATE, G03_HAM_KALITE_TEMPLATE, I18N_EKSIK)
- **Zorunlu her HTML:** 2 (ARES_LAYOUT_EKSIK hata, ARES_NORMALIZE_EKSIK uyarı)
- **TOPLAM:** 14 ayrı kural aktif

### Bu Oturumda Yapılanlar

**Saat 1 — `kontrol.js` → `--json` bayrağı eklendi**
- Yeni bayrak: `node .github/kontrol.js --json` → `.github/ci-son-rapor.json` yazar
- Rapor formatı: kural koduna göre gruplu (pano için) + dosya bazlı detay
- Commit SHA, workflow run no, yeşil/sarı/kırmızı durum ile birlikte
- Mevcut console çıktısı + exit code bire bir korundu
- Self-test dokunulmadı
- Test: sahte repo üzerinde JSON yazımı + syntax doğrulandı

**Saat 2 — `kontrol.yml` güncellendi**
- `--json` bayrağıyla çalıştırma
- Rapor dosyası main push'ta otomatik commit + push
- `paths-ignore: [.github/ci-son-rapor.json]` + `[skip ci]` commit mesajı ile **infinite loop kapalı**
- `permissions: contents: write` eklendi
- Kırmızı CI'da bile rapor commit'lenir (önce rapor, sonra fail)
- Not: İlk yüklemede yanlışlıkla `.github/workflows/` yerine `.github/` kök seviyesine yüklendi, sonra düzeltildi — 26. oturum öğrenilen dersler listesine

**Saat 3 — `admin/panel.html` → 🩺 Sistem Sağlığı kartı eklendi**
- Oturum Panosu sekmesine yeni `pano-bolum`: CI Durumu'nun hemen altına
- Özet kart (X hata · Y uyarı), yeşil/sarı/kırmızı renk kodu
- Kural grupları: kod + sayı + mesaj, tık-aç dosya listesi (satır numaralarıyla)
- Sıfır uyarıda ✨ "Sistem Sağlıklı" kutlama kartı
- Kaynak: `raw.githubusercontent.com/.../.github/ci-son-rapor.json` (cache-bypass timestamp'lı)
- 404 toleransı: "Rapor henüz oluşmamış" uyarısı
- `panoOturumYukle` → her sekme açılışında yenilenir
- Panel.html: 2178 → 2343 satır (+165)

**Saat 4 — 22 uyarı temizliği (22 → 0)**

| Kural | Adet | Nasıl |
|---|---|---|
| ARES_NORMALIZE_EKSIK | 16 | 16 sayfaya `<script src="ares-normalize.js"></script>` eklendi (sed + git push) |
| YUKLENIYOR_KUMSAAT | 2 | `cmn_yukleniyor` ölü anahtarı 3 dilden silindi; `kurallar.html`'de dokümantasyon emojisi `&#x23F3;` entity'ye çevrildi |
| HISTORY_BACK | 1 | `is_baslat.html`'deki 3 yorum satırında `history.back()` → `history.back` (parantez kaldırıldı, false-positive temizliği) |
| G03_HAM_KALITE | 1 | `devre_yeni.html` izometri tablosunda `esc(s.kalite)` → malzeme satırıyla aynı pattern (`typeof ARES_NORM!=='undefined'?ARES_NORM.kaliteGoster(...):...`) |
| I18N_EKSIK | 2 | `cmn_yuzey_epoksi` + `sp_note_confirm_delete` anahtarları 3 dile eklendi (tr/en/ar) |

**Saat 5 — Kapanış**
- Pano canlı: "0 hata · 0 uyarı · Sistem Sağlıklı ✨"
- Bot `ci-son-rapor.json` commit'i otomatik çalışıyor
- 3 kapanış dosyası güncellendi

### Öğrenilen Dersler (25. Oturum)

1. **Workflow dosyası path:** `.github/workflows/` klasörüne yüklenmeli (çoğul, `workflows/`). Kök seviyedeki `.github/kontrol.yml` GitHub tarafından görülmez. GitHub web arayüzünde "Upload files" her zaman bulunduğun klasöre yükler — doğru klasöre girip oradan yüklemek şart. Aksi halde yüklenmiş görünür ama çalışmaz.

2. **`sed` idempotent DEĞİL:** Aynı pattern iki kez sed'e girerse, ilk seferde eklenen satır ikinci seferde yeniden tetiklenebilir. 25. oturumda index.html'de iki kopya ares-normalize.js oluştu, `sed '212d'` ile temizlendi. Ders: toplu sed'den önce tek dosyada test etmek lazım; test edilmiş dosyayı toplu komuttan dışarıda bırakmak veya idempotent pattern seçmek (örn. "bu satır zaten varsa atla") güvenli.

3. **CI kuralları bağlam görmez:** Bu oturumda 3 false-positive temizledik — `kurallar.html`'de dokümantasyon emojisi, `is_baslat.html`'de kod yorumları, her ikisi de gerçek ihlal değildi. CI kuralları string/regex arar, "bu yorum mu kod mu?" ayırt etmez. Gelecekte buna karar vermek gerekecek: (a) yorumları HTML entity/escape ile kaçırmak, (b) yorumu yeniden yazmak, (c) dosyayı istisnaya eklemek. Tercih genelde (a) ya da (b) — (c) kuralı körleştirir.

4. **CDN cache CI rapor'unu gecikmeli yansıtır:** `raw.githubusercontent.com` commit'lenen bir dosyayı genelde 2-5 dk gecikmeyle sunar. Pano cache-bypass timestamp (`?t=` query param) ile bunu çoğu zaman aşıyor ama bazen hard refresh gerekebiliyor. Sorun değil, kullanıcı da anlaşılabilir süre içinde günceli görür.

### Kural Sağlık Kontrolü
- **Son self-test:** 23 Nisan 2026, 08:47 (23. oturum) — 3/3 başarılı ✅
- **Sonraki self-test:** 28. oturum — Claude hatırlatacak
- Komut: `node .github/kontrol.js --self-test`

### Bekleyen Faz B Kalemleri (ve sonrası)
- 🟡 **CLAUDE.md split** (2592 satır → 600 + `docs/rules/` + `docs/sessions/`) — 23. oturumdan kalma
- 🟡 **Şablonlar** (`docs/templates/`) — 23. oturumdan kalma
- 🟡 **Husky + package.json** (opsiyonel) — 23. oturumdan kalma
- 🟡 **Profil in-app edit** (Pano'dan `CIHAT-PROFIL.md` düzenleme) — 24. oturumdan kalma

### 25. Oturumda Bitenler (borçtan düşenler)
- ✅ Sistem Sağlığı kartı (Pano > Oturum Panosu altında) — 24'ten borç
- ✅ 22 ARES_NORMALIZE_EKSIK uyarısı (ve diğerleri) — 24'ten borç
- ✅ CI JSON rapor altyapısı (yeni — gelecekte başka kartların da kaynağı olabilir)

---

## 📖 Aktif Belgeler (Yaşayan — Her Oturumda Gündemde)

### Vizyon: `docs/SPOOL-AI-VIZYON.md`
Spool AI ürün vizyonu: 7 katman, 5 faz, prototipler, AI döngüsü. **Katman regex'i:** `## L1 — Ad` formatı — Pano bu formata bağlı parse ediyor, format korunmalı.

### Pano Tasarımı: `docs/PANO-TASARIM.md`
Süper Admin Yönetim Panosu. 24. oturumda implement edildi, 25. oturumda Sistem Sağlığı kartı eklendi. 3 sekme + 4 bölüm canlıda.

### Kullanıcı Profili: `docs/CIHAT-PROFIL.md` ⚠ ZORUNLU
Her oturum başı Claude bu dosyayı okur. Cihat'a "kimsin" diye sormaz.

### Pano (canlı): `admin/panel.html`
Süper admin çalışma merkezi. Tek yerden: görev, geri bildirim, CI durumu, **Sistem Sağlığı**, profil, oturum geçmişi.

### CI Rapor (yeni): `.github/ci-son-rapor.json`
CI her main push'ta JSON rapor üretir. Pano Sistem Sağlığı kartı bu dosyayı okur. Format: `ozet`, `kurallar` (koda göre gruplu), `dosyalar` (dosya bazlı detay).

---

## Bir Sonraki Oturumda Claude Bunları Yapacak

**1. Oturum açılır açılmaz, ilk tool call'dan ÖNCE ritüel:**

> "Oturum başlangıç ritüeli. Şunu çalıştır ve çıktıyı yapıştır:
> ```
> cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
> ```
> Ayrıca GitHub Actions sekmesinde son build yeşil mi kontrol et."

**2. Ritüel tamamlanmadan hiçbir teknik iş başlama.**

**3. Ritüel biter bitmez `docs/CIHAT-PROFIL.md`'yi oku.**

**4. 26. oturumun gündemi:**
- `CLAUDE-SONRAKI-OTURUM.md` aç — 26. oturum için seçenekler var
- Cihat'a "hangisiyle başlayalım?" sor

**5. Her 5 oturumda bir self-test hatırlat:** 28, 33, 38. oturumlar.

---

## Oturum İçinde Uyulacak Disiplin

- **Kural çakışması varsa dur, sor** (A/B/C seçeneği)
- **"Hatırlıyorum" deme** — dosyaya bak
- **Yeni kural söylendiğinde 3 iş:** `kurallar.json` + kanıt + self-test
- **Komutları üst üste verme** — birer birer, açıklamalı (CIHAT-PROFIL.md'de yazılı)
- **Büyük değişikliklerde tam dosya** — patch değil
- **CHECK değişiminde:** DROP → UPDATE → ADD sırası
- **FK eklerken:** Mevcut embed sorgularını `table!fk_kolonu` ile disambiguate et
- **Workflow dosyaları `.github/workflows/` altına** — kök seviyeye değil (25. oturum dersi)
- **Toplu sed öncesi tek dosyada test** — idempotent değil (25. oturum dersi)

---

_Bu dosyayı her oturum sonu Claude günceller. Kullanıcı sadece yükler._
