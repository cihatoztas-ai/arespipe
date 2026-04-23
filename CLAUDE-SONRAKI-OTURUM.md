# AresPipe — 24. Oturum Gündemi

## 🗺️ Oturum Öncesi Not — Pano Implementasyon Günü

**23. oturum sapmama sistemini kurdu + Pano tasarımını netleştirdi.** 24. oturum **hem sapmama sisteminin ilk gerçek testi, hem de Panonun hayata geçmesi.**

**Süper kritik: İlk adım ritüel.** CLAUDE.md'nin tepesindeki ZORUNLU RİTÜEL uygulanacak. Kullanıcı "atla" dese bile saygıyla ısrar edilecek.

---

## 🔒 Oturum Başı — Claude'un İlk Mesajı

```
24. oturum başlangıç ritüeli. 4 kısa kontrol:

1. Şunu çalıştırır mısın ve çıktıyı yapıştırır mısın:
   cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3

2. GitHub Actions sekmesinde son build rengi? (yeşil / sarı / kırmızı)

3. .github/son-durum.md dosyasını yükler misin veya içeriğini yapıştırır mısın?

4. Bugün pano implementasyonuna başlıyoruz. docs/PANO-TASARIM.md açabilir misin?
```

Cevaplar geldikten sonra Claude:
- `docs/CIHAT-PROFIL.md`'yi **sessizce** okur. Cihat'a "sen kimsin?" diye **sormaz**.
- `docs/PANO-TASARIM.md`'yi açar, saat-saat planı anımsar.
- `docs/SPOOL-AI-VIZYON.md`'yi hatırlar (pano bu dosyayı render edecek).

---

## 🎯 ANA TEMA — Süper Admin Pano Implementasyonu

### Hedef
`docs/PANO-TASARIM.md`'de yazılı 3 sekmeli Panoyu `admin/panel.html` içine inşa etmek. Mevcut "Yol Haritası" ve "Geri Bildirimler" bölümleri temizlenecek.

### Süre Tahmini: 5 saat (molalarla)

### Saat Saat Plan (docs/PANO-TASARIM.md'den)

**Saat 1 — Hazırlık**
1. `admin/panel.html` mevcut durumu incele (hangi bölümler var, hangileri kaldırılıyor)
2. Mevcut `feedback`/`geri_bildirimler` tablosu var mı? Yoksa oluştur.
3. Yeni `panel_gorevler` tablosu migration (`24-oturum-panel-gorevler.sql`)
4. RLS politikaları ekle
5. Cihat'a SQL'i Supabase'de çalıştırmasını söyle, doğrulamasını al

**Saat 2 — Sekme 1 (Görev Takibi)**
1. 3 sekmeli tab yapısı (tanimlar.html pattern'ı)
2. Özet kartları (G-02 Hero+Pill)
3. Katman haritası (SPOOL-AI-VIZYON.md fetch + markdown parse)
4. ROADMAP tablosu (ROADMAP.md fetch + parse)
5. Manuel görev listesi (panel_gorevler DB)
6. +YENİ GÖREV modalı
7. Görev detay modalı (vizyon bağlama özelliği)

**Saat 3 — Sekme 2 (Geri Bildirim)**
1. Geri bildirim listesi (filtreli, paginate)
2. Yanıtla / göreve dönüştür / durum değiştir akışları
3. Yanıt şablonu metin kutusu

**Saat 4 — Sekme 3 (Oturum Panosu)**
1. Profil dosyası fetch + markdown render (marked.js CDN)
2. Profil **view-only** başlangıçta (edit 25. oturumda)
3. Oturum geçmişi (son-durum.md'den)
4. CI durumu — başlangıçta son-durum.md'den (GitHub Actions API entegrasyonu sonraya)

**Saat 5 — Test + Temizlik**
1. Tüm yetki kontrolü — super_admin haricinde görmüyor
2. Mevcut "Yol Haritası" ve "Geri Bildirimler" bölümleri sil
3. Lint kontrol (`node .github/kontrol.js`) — CI yeşil kalacak
4. Manuel test: görev ekle, feedback yanıtla, durum değiştir
5. Deploy, CI doğrulama, Cihat'la test

---

## Claude'un Oturum Boyunca Uyacakları

### 1. Komut Verme Disiplini (CIHAT-PROFIL.md'den)
- **Birer birer, açıklamalı.** Üst üste 3 komut gönderme.
- **Terminal yerine önce "işte dosya, yükle" demeyi tercih et.**
- SQL migration gibi zorunlu durumlarda: "Şu SQL'i Supabase'de çalıştırır mısın, dönüşü göster" → sadece o komut, başka şey yok.

### 2. Büyük Dosyalar Tam, Patch Değil
Pano HTML'i muhtemelen 500+ satır olacak. **Tam dosya ver**, "şu satırı değiştir" yerine "işte yeni panel.html, üstüne yaz."

### 3. Lint Uyumu
Yazacağın her kod mevcut lint'ten temiz geçecek:
- ✅ `var(--ac)` / `var(--gr)` — hard-coded hex yasak
- ✅ `tv('anahtar', 'fallback')` — her metin
- ✅ `[data-theme=dark]` tırnaksız
- ✅ `ares-layout.js` + `ares-normalize.js` yüklü
- ✅ Barlow font, min 14px
- ✅ `ARES.supabase()`, `ARES.sayfaYetkiKontrol(['super_admin'])`
- ✅ ARES_NORM kullanımı (malzeme/yüzey görüntülenirse)

### 4. Her Saatin Sonunda Ara + Özet
Saat 1 bitince: "Saat 1 bitti — DB hazır, şuralar yapıldı, şimdi Saat 2'ye geçiyoruz. Cihat onaylar mısın?" Böyle ilerle. Hepsini tek mesajda vermek yerine.

### 5. Yeni Kural Konuşması
Cihat "bundan sonra hep şöyle olsun" derse 3 iş: kurallar.json + bozuk-ornekler + self-test.

### 6. Oturum Sonu Kapanışı (Zorunlu)
Oturum biterken:
- `.github/son-durum.md` güncelle (yeni CI durumu, aktif kural, Pano implement durumu)
- `CLAUDE-SON-OTURUM.md` — 24. oturum özeti
- `CLAUDE-SONRAKI-OTURUM.md` — 25. oturum gündemi
- `docs/PANO-TASARIM.md` Değişiklik Kayıtları tablosuna satır ekle (kod yazıldı, hangi parçalar eksik)

---

## Başarı Kriteri (24. Oturum Sonu)

**Minimum:**
- [ ] Ritüel çalıştı, Cihat'a "kimsin?" diye sorulmadı
- [ ] `panel_gorevler` tablosu kuruldu
- [ ] En az 2 sekme tam çalışıyor
- [ ] Eski "Yol Haritası" + "Geri Bildirimler" temiz
- [ ] CI yeşil kaldı (yeni hata yok)
- [ ] son-durum.md güncel

**İdeal:**
- [ ] 3 sekme de çalışıyor
- [ ] Feedback yanıtla + göreve dönüştür aktif
- [ ] Markdown render (vizyon haritası, profil) çalışıyor
- [ ] En az 1-2 ARES_NORMALIZE_EKSIK uyarısı fırsatta kapandı

---

## Risk Notları

### Risk 1 — Supabase `feedback` tablosu adı
Adı tam bilmiyoruz. Panel.html'e bakıp teyit et. Yoksa geri_bildirimler olarak aç, gerekirse Cihat'a "tablo adı şu mu?" diye sor.

### Risk 2 — Markdown render kütüphanesi
marked.js CDN → hızlı, güvenilir. Başka seçenek: prisma.js veya showdown.js. marked yeterli.

### Risk 3 — 5 saat çok uzun olabilir
Cihat yorulursa 2 saatlik blok halinde bölelim: 2 saat şimdi, 3 saat başka oturumda. Plan esnek.

### Risk 4 — GitHub API entegrasyonu için token
CI durumunu GitHub Actions API'den çekmek token gerektirir. Bu oturumda yapma — son-durum.md dosyasını fetch etmekle yetin. Token konusunu 25. oturuma bırak.

---

## Hazır DB Objeleri (Referans)

```sql
-- Yeni tablo (24. oturum başında kurulacak)
panel_gorevler (id, baslik, aciklama, durum, oncelik, kategori, hedef_katman,
                hedef_oturum, kaynak, kaynak_id, olusturma)

-- RLS: sadece super_admin
```

## JS API (Referans — değişmedi)

```js
ARES.supabase()
ARES.sayfaYetkiKontrol(['super_admin'])
ARES_NORM.malzemeEtiket(kod)
tv('anahtar', 'fallback')
```

## Aktif Lint Kuralları (23. oturum sonu)

**Hata:** YASAK_RENK_* (5), FLASH_DARK, THEME_LIGHT, ARES_LAYOUT_EKSIK
**Uyarı:** HISTORY_BACK, YUKLENIYOR_KUMSAAT, ARES_NORMALIZE_EKSIK, G03_HAM_* (5), I18N_EKSIK

---

## Kapanış Beklentisi (24. oturum sonu)

- Pano 2-3 sekmesi canlıda çalışıyor
- `panel_gorevler` tablosu hazır, ilk kayıtlar girilebilir
- Geri bildirim akışı artık yönetiliyor
- Profil dosyası pano üzerinden görünür
- CI yeşil, uyarı ≤ 22 (ideal: azaldı)
- Cihat ilk kez "her şey tek ekranda" diyebilir
