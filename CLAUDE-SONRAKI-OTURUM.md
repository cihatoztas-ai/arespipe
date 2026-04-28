# CLAUDE — 41. OTURUM GÜNDEMİ

> **Bu dosya 40 kapanışında oluşturuldu. 41 başında ilk okunacak.**

---

## 41 Açılış Mottosu

40'ta iki büyük şey oldu:

**A. Teknik:** 4 operasyon sayfası standartlaştı, markalama listeler akordeon→tablo+modal'a çevrildi, 46 i18n eklendi.

**B. Vizyon:** Cihat ile uzun kahve sohbeti — 9 farklı damar konuşuldu, **vizyon belgesi yazıldı**. *"Parça Kimliği Prensibi"* ana karar olarak çıktı.

41'de en önemli şey: **Faz B'deki sohbeti hatırlama**. Vizyon belgesini açılışta oku.

---

## 1. Açılış Ritüeli (~5 dk)

5 soru zorunlu:

```
Oturum başlangıç ritüeli. 5 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -10

2. GitHub Actions sekmesinde son build rengi?

3. .github/son-durum.md içeriği?

4. 40'ta yüklenecek 12 dosya yüklendi mi (4 HTML + 3 JSON + 5 MD)?

5. admin/panel.html → Geri Bildirim sekmesinde kaç açık feedback var?
```

5 cevap geldikten sonra:
- Git temiz mi
- CI yeşil mi
- son-durum.md borçları oku
- **`docs/CIHAT-PROFIL.md`'yi oku** (40'ta upload=seçim, korku=uyarı pattern'leri eklenmeli)
- **`docs/VIZYON-VE-MODULER-MIMARI.md`'yi oku** ⭐ (40'ta yazıldı, prensipler burada)
- **`docs/KUTUPHANE-KAPSAM.md`'yi göz at** (Vizyon 9 destekleyici)

---

## 2. 40 Sonrası Doğrulama (~15 dk)

40'ta 12 dosya yüklendi. CI yeşil ve canlıda çalıştığı teyit edilmeli.

```bash
cd ~/Desktop/arespipe && git pull origin main

# Lint
node .github/kontrol.js --self-test 2>&1 | tail -10

# Anahtar sayısı 1651 mi (3 dilde eşit)
node -e "for(const f of ['tr','en','ar']) console.log(f+':', Object.keys(JSON.parse(require('fs').readFileSync('lang/'+f+'.json'))).length)"

# I18N_EKSIK uyarı sayısı (40 hedefi: 0)
node .github/kontrol.js 2>&1 | grep -c "I18N_EKSIK"
```

Beklenen: ✓ 3/3 self-test, 1651 anahtar 3 dilde, 0 I18N_EKSIK.

---

## 3. Canlı Uçtan Uca Test (~45 dk — EN YÜKSEK ÖNCELİK)

40'ta yapılan işler hâlâ canlı test edilmedi. Açılışta öncelik bu olmalı.

### A. Markalama Listeler — Yeni Modal Akışı (10 dk)
1. https://arespipe.vercel.app/markalama.html
2. Bekleyen sekmesinde 5+ kayıt seç (aynı parça adı + çap)
3. "Markalama Listesi Oluştur" → numarayı boş bırak → Oluştur
4. **Kontrol:** Akordeon değil tablo görünmeli. Liste 1 satır.
5. Satıra tıkla → modal açılsın (mlDetayModal)
6. Modal: progress bar + 4 buton + checkbox tablo
7. "Tümünü İşaretle" → satırlar işaretlensin
8. "Kaydet & Kapat" → modal kapansın → Tamamlanan'a geçsin

### B. Tamamlanan + Manuel Modal (10 dk)
- Tamamlanan satırına tıkla → view-only modal (Excel İndir butonu var, checkbox yok)
- Manuel kayıt için bekleyen'de "manuel işaretle" → Tamamlanan'da "Manuel" liste no ile görünsün
- Manuel satırına tıkla → İşaret Tarihi sütunlu modal

### C. Bukum Modal (5 dk)
- bukum.html → bekleyen kalemde ✓ butonuna tıkla
- modalBukumOnayi açılsın (önceden null hata veriyordu)
- "Evet, Büküldü" → Bükülenler'e geçsin

### D. KK + Sevkiyat Görsel (5 dk)
- KK: hero+stat-pill row, yeşil tema
- Sevkiyat: hero+stat-pill row, mavi tema, renk lejandı doğru (broken HTML değil)
- Mobile responsive

### E. 39'un PAOR Akışı (15 dk — geçen oturumdan kalan)
- izometri-batch → PDF yükle → AI okusun
- "İncele →" → izometri-batch-incele.html
- Spool onayla → IFS Excel İndir enable
- Excel indir → 92 sütun
- devre_yeni.html → IFS sürükle-bırak → toast: "✅ N satır · M pipeline · K spool"

### Test Sonucu
- Hepsi geçer: ana işe geç
- Bir adım kırılır: ekran görüntüsü iste, fix
- Beklenmeyen davranışlar: feedback'e kaydet

---

## 4. Sırada — Ne Yapacağız (Cihat'ın Korku Dengesine Saygı)

Cihat 40'ta dedi ki: *"Onu da yapalım bunu yapalım derken elimizden de olmayalım."*

Bu yüzden 41-50 arasında **vizyondan sıfır madde** alıyoruz. Sadece:

### Kategori A — Pilot Hazırlığı (Ana Odak)

**Test Yönetimi sayfası** (~1 saat)
- bl-ac (mavi), 5 pill: BEKLEYEN / DEVAM / TAMAMLANAN / HATALI/TAMİR / TOPLAM
- DB tablosu: testler
- Hero+stat-pill standardı

**4 yönetim sayfası** (~2-3 saat)
- Uyarılar (turuncu, 4 pill)
- Tersaneler (yeşil, 4 pill)
- Kullanıcılar (mavi, 4 pill)
- Atölye Takip (yeşil, 5 pill)

### Kategori A — Mevcut Borçlar

| Borç | Süre | Notu |
|---|---|---|
| Pre-A.3 çoklu sayfa dispatcher | 1.5 saat | pdf-lib + parallel/sequential |
| vercel.json ignoreCommand fix | 30 dk | Sadece kod değişince build |
| Pano implementasyonu | 3-4 saat | 23'ten beri tasarım hazır |
| Sevkiyat "Bu Yıl Spool" yıl filtresi | 15 dk | Yıl filtresi eksik |
| Markalama eski toggleArc temizlik | 5 dk | Boş fonksiyon |
| Kesim son %10 | 1 saat | Excel TR temizliği |
| proje_liste/detay Supabase | 1.5 saat | Hâlâ dummy |
| malzeme.html sıfırdan | 2 saat | Hiç yok |
| MIG_ISIM_BOZUK regex | 15 dk | Genişletme |

### Kategori B — Pilot Tetikli (Vizyon)

**Bunlar 41'de yapılmaz**, ama tetik gelince hızla başlanabilir:

- **Kütüphane DB schema** (Vizyon 9 — Aşama 1, 1 oturum) — pilot sözleşmesi öncesi altyapı kurulur
- AI yön çıkarımı (Vizyon 1 — 3D iyileştirme, 2-3 oturum) — pilot 3D'yi gördüğünde
- Klasör yükleme + format tanıma (Vizyon 2) — ikinci pilot tersane geldiğinde

### Kategori C — Çok Sonra

Diğer 6 vizyon (STEP, çapraz validasyon, 3-görünüş, thumbnail, lazer tarama, pasif öğrenme, tier model) **çok sonra**. Tetik koşulları vizyon belgesinde yazılı.

---

## 5. Stratejik Hatırlatmalar (40'tan)

### Parça Kimliği Prensibi (K22)
Sisteme giren her malzeme **yazı değil nesne** olarak tanımlanır. Yeni iş yaparken:
- Yeni tablo eklerken parça referansı düşün, string değil
- AI prompt'larında çıktıyı parametrik iste
- spool_malzemeleri'ne yeni kolon eklenirken referans yapısı korunsun

### Vizyon Karar Çerçevesi (K23)
Tetik koşulu olmadan iş yok. Vizyondaki bir madde "şimdi yapalım" diye iç güdüsel başlama. Müşteri sinyali şart.

### Kütüphane Organik Dolar (K24)
12.000 satırı önceden manuel girmek yerine pilot kullanılınca büyür. Boş tablolarla başla, kullanılan parçalar eklensin.

### Cihat Profili Hatırlatmalar
- **Upload = seçim sinyali** — Metin yerine dosya yükledi mi, o yöne karar vermiş demektir
- **Korku ifadeleri = scope drift uyarısı** — Ciddiye al, çerçeve oluştur
- **Stratejik soru = sezgi sinyali** — *"X harcar mı?"*, *"Y sağlam mı?"* yapısal sorun sezisi
- **Tahammülü az** — Uzun teknik açıklama içinde sıkışmış talimat verme, 3+ aynı anda soru sorma

### Tahmin Yasağı
- Tablo adı: information_schema'dan gör
- Kolon adı: information_schema'dan gör
- API field adı: backend kodundan gör

### Backend Canlı Test ≠ Frontend Canlı Test
"X canlıda" denilen şey curl ile mi yoksa frontend ile mi test edildi — netleşmeli.

---

## 6. Açılış Mesajı Önerisi (41 İlk Mesaja)

```
41 başlıyor. 40'ta iki büyük şey oldu — teknik (4 sayfa standardı + markalama
dönüşümü + 46 i18n) ve vizyon (kahve sohbeti, vizyon belgesi yazıldı, Parça
Kimliği Prensibi ana karar olarak kabul edildi).

Bu oturumda öncelik canlı test (40 işleri henüz frontend'den doğrulanmadı).
Ondan sonra Test Yönetimi veya yönetim sayfaları.

Vizyon işleri 41-50 arasında kapalı — Cihat'ın korku dengesine saygı.

[5 soru]
```

---

## 7. Kapanış Hedefi (41 Sonu)

41 başarılı sayılır eğer:
- ✅ Canlı uçtan uca test geçti (40 + 39 işleri)
- ✅ I18N_EKSIK uyarı 0 (CI'da teyit)
- ✅ En az 1 yeni operasyon sayfası standartlaştı (Test Yönetimi veya yönetim)
- ✅ Sevkiyat "Bu Yıl Spool" yıl filtresi (15 dk)
- ✅ Vizyondan **sıfır madde** dokunulmadı (disiplin testi)

---

> Bu dosya 40 kapanışında oluşturuldu. 41 başında ilk okunacak.
