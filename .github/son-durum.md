# AresPipe — Son Durum (her oturum sonunda güncellenir)

> Bu dosya her oturum açıldığında Claude tarafından **zorunlu olarak okunur.**
> İçeriği hafıza değil kayıt. Unutma imkansız — dosya burada.

---

## Son Oturum: 26 (24 Nisan 2026) — Faz A Kapanışı + Altyapı Borçları + G-05 ✅

### CI Durumu
- **Son build:** YEŞİL ✅ (25. oturumdan devir)
- **Sonuç:** 0 hata, 0 uyarı (25'te bitirilen temizlik korunuyor)

### Bu Oturumda Yapılanlar (~4 saat)

**Saat 1 — Faz A Faz 3: Form Autocomplete** ✅
- `devre_yeni.html` + `spool_detay.html` — `kaliteleriDoldur()` yeniden yazıldı
- İki kaynak birleşik: MASTER (sistem preset + firma özel) + GEÇMİŞ (sıklık sayacı)
- `<option label>` ile kaynak ipucu (sistem / firma / geçmiş · ×N)
- Her iki dosya canlıya alındı, test edildi
- devre_yeni: 2301 → 2340 satır (+39), spool_detay: 3217 → 3266 satır (+49)

**Saat 2 — Faz A Faz 4: IFS Fuzzy Match** ✅
- Migration: `26-oturum-faz-a4-ifs-fuzzy.sql` uygulandı
- `kalite_kod_normalize()` — 8 yeni pattern: ST52, S355JR, P235GH, P265GH, 321, 321H, 304H, 316H, 2205, 2507
- `ifs_material_alias` tablosu + 3 index + 4 RLS policy (malzeme_tanimlari pattern'i)
- `malzeme_ref_bul()` — alias fallback katmanı (regex NULL → tenant alias → sistem alias → NULL)
- 7/7 regex test geçti; canlı veride 0 bağlanmamış kayıt (sistem temiz)
- **Sonuç: Faz A TAMAMEN BİTTİ** — malzeme sistemi tam kapalı döngü

**Saat 3 — CLAUDE.md Split + docs/templates/** ✅
- CLAUDE.md: 2694 → 1611 satır (%40 küçültme)
- Bölüm 11 + 11A-11H (14 eski oturum, ~1100 satır) → `docs/sessions/archive-01-22.md`
- Yerine yeni Bölüm 11: 3 satır referans (son-durum.md + archive + protokol notu)
- `docs/templates/` oluşturuldu:
  - `README.md` — şablon indeksi
  - `yeni-sayfa-sablonu.md` — yeni HTML sayfası iskeleti (zorunlu script'ler + tema + i18n)
  - `yeni-migration-sablonu.sql` — BEGIN/COMMIT + header + RLS pattern + test blokları
- Dört dosya tek commit'e yüklendi (atomik koruma)

**Saat 4 — Malzeme Renk Denetimi + G-05 + 4 Dosya Güncellemesi** ✅
- Yanlış alarm temizliği: M3_RENK bug'ı yok (22. oturum notu hatalı, doğrulandı)
- **Denetim sonucu:** 4 sayfada renk pattern'i var, 1'i (`markalama.html`) **tamamen kaymış**:
  - Paslanmaz yeşildi (olmalı: mor)
  - Bakır mordu (olmalı: turuncu)
  - Alüminyum turuncuydu (olmalı: yeşil)
  - Karbon + Diğer aynı maviye düşüyor (olmalı: farklı)
- **Kök neden:** Kod 4 farklı yerde kopya; tek kaynak doğrusu yok
- **Çözüm: G-05 — Malzeme Renk Standardı** (yeni kural)
  - `:root`'a merkezi `--mat-karbon-*`, `--mat-paslanmaz-*`, `--mat-bakir-*`, `--mat-alum-*`, `--mat-diger-*` değişken bloğu
  - `[data-theme=dark]` override: alpha %10 → %18 (kontrast)
  - `.mb-celik / .mb-pas / .mb-bakir / .mb-alum / .mb-diger` CSS değişken kullanıyor
  - `matBadge()` 4 sayfada aynı pattern, aynı class isimleri
- **Güncelleneceğine yapıldı: 4 dosya** — `markalama.html`, `devreler.html`, `bukum.html`, `kesim.html`
- Karbon'u kırmızı yapmak istenirse: 4 dosyada `--mat-karbon-bg` + `--mat-karbon-fg` güncellenir → 4 sayfa anında değişir

### Bugün Ele Alınmayan Büyük Konu

Cihat'ın yakaladığı sistemsel tutarlılık sorunu: **"Tablolardaki tüm sütunlar farklı sayfalarda farklı görünüyor"** (spool no mavi mi siyah mı, tarih format farkları, tersane adı bold mı vs.). Bu malzeme rengi değil, **sistem-seviyesi render tutarlılık borcu**. 4-5 oturumluk iş, parçalara ayrılmalı.

**Ne yaptık:** Bugün sadece malzeme rengi düzeltildi (markalama bug + 4 dosyada merkezi değişkenler). Gerisi — spool no render, tarih formatı, tersane adı, proje no, durum pill vs. — sonraki oturumlara kaldı.

### G-05 — Yeni Kural (detay)

**Kural adı:** Malzeme Renk Standardı

**Zorunluluklar:**
1. Karbon → mavi (`--ac`) ― Paslanmaz → mor (`--leg`) ― Bakır → turuncu (`--warn`) ― Alüminyum → yeşil (`--gr`) ― Diğer → gri (`--txd`)
2. Renk değerleri `:root > --mat-*` değişkenleri üzerinden okunur, hardcode yazılmaz
3. Karanlık tema için `[data-theme=dark]` alpha override eklenir (kontrast)
4. CSS class isimleri standart: `.mb-celik / .mb-pas / .mb-bakir / .mb-alum / .mb-diger`
5. `matBadge()` inline style kullanmaz, sadece class döndürür
6. Aynı renk değişken bloğu tüm sayfalarda bulunur — tek yerden güncellenince hepsi değişir
7. Yeni bir malzeme kategorisi eklenirse 4 sayfaya paralel eklenmeli (ileride `ares-layout.js > injectGlobalCSS()` merkezileştirmesi düşünülebilir)

**CI lint eklenmesi (gelecek):** "G-05_MALZEME_RENK_HARDCODE" — `.mb-*` CSS'inde `rgba(` veya hex kullanımı yasak, sadece `var(--mat-*)` kabul.

### Bugün Kapatılan Açık Borçlar
- ✅ CLAUDE.md split — 23. oturumdan beri borç
- ✅ `docs/templates/` — 23. oturumdan beri borç
- ✅ Markalama renk bug'ı — bilinen ama isimlendirilmemiş borç (denetimde ortaya çıktı)
- ✅ Malzeme renk tutarsızlığı (4 dosya) — bugün tespit + çözüm
- ✅ M3_RENK yanlış alarm notu — 22. oturumdan kalma, temizlendi

### Öğrenilen Dersler (26. Oturum)

1. **"Yanlış alarm" notları dosyalarda birikir:** 22. oturumda M3_RENK için "eski TR key'ler" notu düşülmüş ama o oturumda zaten çözülmüştü. Bugün "açık borç" zannedip baktık — kod temiz çıktı. Ders: Kapatılan borç aynı oturumda checklist'ten silinmeli; "tamamlandı" notu açıklayıcı olmalı. CLAUDE.md'deki Bölüm 10 (dosya bazında bekleyenler) periyodik temizlenmeli.

2. **Bir bug sorulduğunda genelde altında sistem-seviyesi soru vardır:** Cihat "M3_RENK bug'ı" diye başladı, kısa sürede "tablolardaki tüm sütunlar standart olmalı" gerçek sorusuna geldi. Ders: Bug teknik olarak doğrulanmadan önce "aslında ne arıyorsun?" sorusu sorulmalı — özellikle kullanıcının önceki oturumdan hatırladığı not varsa.

3. **Denetim > hızlı düzeltme:** Markalama'yı tek başına düzeltmek 10 dk'lık bir işti, ama tek başına yapılsa 3 sayfada aynı hatanın farklı varyasyonu kalırdı. Önce 7 dosyayı denetleyip haritayı çıkardık, sonra sistemik çözüm ürettik (G-05). Bugünden sonra kural CI'da kodlanabilir hale geldi. Ders: Bir bug gördüğünde "kaç yerde tekrarlanabilir bu pattern?" sorusu, her zaman.

4. **Merkezi değişken + sayfa-yerel kopya gerçekçi orta yol:** Tam merkezi (ares-layout.js enjekte) en temiz çözüm ama JS yüklenene kadar renk eksik. Tamamen sayfa-yerel (her sayfa kendi blokları) bakım cehennemi. **Orta yol:** Aynı değişken bloğu her sayfada var, ama blok 4 yerde tek kaynak gibi çalışıyor (sed/find-replace ile tek işlem). JS enjekte gerekmiyor, yine de "tek yerden değiştirilir" hedefine çok yakın.

### Kural Sağlık Kontrolü
- **Son self-test:** 23 Nisan 2026, 08:47 (23. oturum) — 3/3 başarılı ✅
- **Sonraki self-test:** 28. oturum — Claude hatırlatacak
- Komut: `node .github/kontrol.js --self-test`

### Bekleyen Borçlar

**Acil (sonraki 1-2 oturumda):**
- 🔴 **G-05 CI lint kuralı** — `.mb-*` CSS'inde hardcode rgba/hex yasağı
- 🟡 **Spool_detay + devre_detay'a matBadge ekleme** — şu an malzemeyi düz metin gösteriyorlar, renk yok

**Orta vade (27-30. oturum):**
- 🟡 **Tablo Render Standardı** (Cihat'ın yakaladığı büyük konu) — G-06 olarak tasarlanabilir
  - Spool no: mono font, bold, `--ac` mavi (4 sayfada farklı görünüyor)
  - Tarih: tek format standardı (14px, `--txd`)
  - Tersane adı, proje no, durum pill — standardize
  - İş planı: 27. oturumda 7 sayfa denetim raporu, 28'de `ares-render.js` helper kütüphanesi, 29-30'da sayfa dönüşümü
- 🟡 **Operasyon sayfaları %100** — Kesim/Büküm/Markalama bitirme (2-3 saat)
- 🟡 **Profil in-app edit** (Pano'dan CIHAT-PROFIL.md düzenleme) — 24. oturumdan borç
- 🟡 **Rol etiketi küçük harf bug'ı** — "operatör" küçük harf görünüyor; hangi ekranda olduğu Cihat'tan netleşecek

**Uzun vade (ROADMAP Faz B-C):**
- 🟢 **docs/rules/** kural ayrıştırması — G-01 i18n, G-02 tema, G-03 enum-render, G-05 malzeme renk ayrı dosyalara
- 🟢 **Lint script'leri** (5 adet) + pre-commit hook
- 🟢 **Tenant izolasyon testleri** (`tests/rls-isolation.sql`) — 27. oturum hedefi
- 🟢 **Performans bütçesi + observability** — 28. oturum hedefi
- 🟢 **Rollback + feature flag** — 29. oturum hedefi
- 🟢 **Mobil sayfalar**: MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara (ayrı sprint)

### 26. Oturumda Bitenler (borçtan düşenler)
- ✅ Faz A Faz 3 (Form Autocomplete) — Faz A planından
- ✅ Faz A Faz 4 (IFS Fuzzy Match) — Faz A planından; **Faz A tamamen bitti**
- ✅ CLAUDE.md split — 23. oturumdan
- ✅ `docs/templates/` — 23. oturumdan
- ✅ G-05 Malzeme Renk Standardı (yeni kural, 4 dosya güncellemesi)
- ✅ M3_RENK yanlış alarm notu temizlendi

---

## 📖 Aktif Belgeler (Yaşayan — Her Oturumda Gündemde)

### Vizyon: `docs/SPOOL-AI-VIZYON.md`
Spool AI ürün vizyonu: 7 katman, 5 faz, prototipler, AI döngüsü.

### Pano Tasarımı: `docs/PANO-TASARIM.md`
Süper Admin Yönetim Panosu. 24-25. oturumda implement edildi.

### Kullanıcı Profili: `docs/CIHAT-PROFIL.md` ⚠ ZORUNLU
Her oturum başı Claude bu dosyayı okur. Cihat'a "kimsin" diye sormaz.

### Pano (canlı): `admin/panel.html`
Süper admin çalışma merkezi. Tek yerden: görev, geri bildirim, CI durumu, Sistem Sağlığı, profil, oturum geçmişi.

### CI Rapor: `.github/ci-son-rapor.json`
CI her main push'ta JSON rapor üretir. Pano Sistem Sağlığı kartı bu dosyayı okur.

### Oturum Arşivi: `docs/sessions/archive-01-22.md` (YENİ — 26. oturum)
1-22. oturumların CLAUDE.md'den ayıklanmış özetleri.

### Şablonlar: `docs/templates/` (YENİ — 26. oturum)
Yeni HTML sayfası ve SQL migration için başlangıç iskeletleri.

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

**4. 27. oturumun gündemi — Cihat'a seçenek sun:**
- **Opsiyon A:** Tablo Render Standardı denetimi (Cihat'ın asıl sorusu) — 7 sayfa × kolonlar haritası çıkar, sonraki oturumlar için plan yap
- **Opsiyon B:** G-05 CI lint kuralı ekle — `.mb-*` hardcode yasağı, kontrol.js'e pattern ekle
- **Opsiyon C:** Operasyon sayfaları bitirme (Kesim/Büküm/Markalama %100)
- **Opsiyon D:** Rol etiketi küçük harf bug'ı (hangi ekranda olduğu netleşirse)
- **Opsiyon E:** ROADMAP Faz B başlat (27. oturum tenant izolasyon testleri)

**5. 28. oturumda self-test HATIRLAT:**
- 26'dan sonra 28 geliyor (her 5 oturumda bir)
- Komut: `node .github/kontrol.js --self-test`

---

## Oturum İçinde Uyulacak Disiplin

- **Kural çakışması varsa dur, sor** (A/B/C seçeneği)
- **"Hatırlıyorum" deme** — dosyaya bak
- **Yeni kural söylendiğinde 3 iş:** `kurallar.json` + kanıt + self-test
- **Komutları üst üste verme** — birer birer, açıklamalı
- **Büyük değişikliklerde tam dosya** — patch değil
- **CHECK değişiminde:** DROP → UPDATE → ADD sırası
- **FK eklerken:** Mevcut embed sorgularını `table!fk_kolonu` ile disambiguate et
- **Workflow dosyaları `.github/workflows/` altına** — kök seviyeye değil (25. oturum dersi)
- **Toplu sed öncesi tek dosyada test** — idempotent değil (25. oturum dersi)
- **Bug sorulduğunda "aslında ne arıyorsun" sor** — özellikle önceki oturumdan not varsa (26. oturum dersi)
- **Bir bug gördüğünde "kaç yerde tekrarlanabilir?" sor** — tek-düzeltme yerine denetim + sistemik çözüm (26. oturum dersi)

---

_Bu dosyayı her oturum sonu Claude günceller. Kullanıcı sadece yükler._
