Claude — 43. Oturum Gundemi

Bu dosya 42 kapanisinda olusturuldu. 43 basinda ilk okunacak.


43 Acilis Mottosu
42'de AI standart cikarimi altyapisi tamamlandi. Ama 40 canli test borcu hala acik — 3. oturumdur. 41'de parking, 42'de parking. Disiplin meselesi.
Cihat 42 kapanisinda soz aldi: "birakmayacan yoksa pesimi." — 43 basi 40 borcu en yuksek oncelik. Vizyondan SIFIR madde, kutuphane'den de kapsam genisletilmez.

1. Acilis Ritueli (~5 dk)
5 cevap zorunlu (CLAUDE.md):
Oturum baslangic ritueli. 5 kisa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5
2. GitHub Actions sekmesinde son build rengi nedir?
3. .github/son-durum.md dosyasini yukle veya icerigini yapistir
4. Bugun hangi sayfayla calisilacak?
5. admin/panel.html → Geri Bildirim sekmesinde acik feedback?
5 cevap geldikten sonra:

Git durumu temiz mi (stash kalintisi, commitlenmemis degisiklik yok mu)
CI rengi yesil degilse once onu duzelt
son-durum.md'den 40 borcu detayini oku
docs/CIHAT-PROFIL.md'yi oku
docs/SPOOL-AI-VIZYON.md'yi hatirlamak


2. 40 Canli Test Borcu (~1.5-2 saat — EN YUKSEK ONCELIK, KIRMIZI)
40'ta yapilan operasyon sayfasi standardizasyonlari hala canlida uctan uca test edilmedi. 41 basinda Grup 1 ✓ test edildi, sonrasi parking edildi.
A. Markalama (15-20 dk)

✅ Grup 1 (41'de yapildi)
Grup 2: modal acilis, progress bar, 4 buton
Grup 3: manuel ekleme akisi (manuelMarkModal)
Grup 4: arsiv gorunumu
Grup 5: i18n gecisleri (TR/EN/AR)

B. Bukum (10 dk)

modalBukumOnayi aciliyor mu (40'ta null bug fix yapildi)
aciklama scope bug fix dogrula (Supabase modu kapaliyken hata yok mu)

C. Kalite Kontrol (10 dk)

Yeni hero+pill standardi gorsel onay (yesil --kk-c)
TR yazim fix kontrolu (Agirlik→Agirlik vb.)

D. Sevkiyatlar (10 dk)

Renk lejandi broken HTML fix dogrulamasi
2 textarea i18n calisiyor mu

E. 39 PAOR Akisi (15-20 dk)

40 oncesinden kalan canli test borcu
39'da yapilan PAOR (proje, aktivite, organizasyon, raporlama) akisi

Eger hata bulunursa: O hatayi coz, sonra teste devam et. "Sonra duzeltirim" deme — borc birikmesin.

3. Kutuphane Icerik Doldurma (~30-45 dk, opsiyonel — 40 borcu bittikten sonra)
42'de altyapi kuruldu ama kutuphane %95 bos. Sirayla doldurulmali:
Bence en yararli baslangic: flansh_olculer'a daha fazla A105 kaydi.

DN50, 80, 100, 150, 200, 250, 300 × 150#/300#/600# × WN/SO/BL
Her satir bir kayit, ASME B16.5 PDF'inden elle giris (Cihat'ta varsa) ya da pilot deger

Veya: boru_olculer'da paslanmaz EN kayitlari (EN 10216-5 ailesi)

DN15-DN200 × yaygin et × X2CrNiMo17-12-2

Cihat hangisini tercih ederse o yapilir. Eger 40 borcu uzun surduyse bu adim 44'e kayar.

4. Sonraki Kapsam Genisletmeleri (44+ icin parking)
Kisa vade (44-45)

Frontend cascade UI — spool_detay modal'inda kutuphane lookup gorunumu (gercek veri olunca anlamli)
Super admin UI — feature flag tenant yonetim sayfasi
Cizim klasor organizasyonu — /cizimler/flans/ standardi, isim formati

Orta vade (46-50)

boru_olculer paslanmaz EN — EN 10216-5 ailesi
fitting tablolari — A234 dirsek, B16.9 T, reduksiyon
Esleme UI — kullanici A105 girdiginde sistem otomatik oneri sunsun (auto_exact)
42 prompt'unun gercek dunya testi — yeni boyut_standardi/malzeme_standardi alanlari kac PDF'te dolu geliyor analiz

Uzun vade (50+)

AI fuzzy match — IFS yazim varyasyonlari (A106-B, ASTM A106 Gr B, SA106B → A106B)
3D yon cikarimi — kutuphane DN+tip biliyorsa B16.5 spec'inden geometri zaten hazir
Foto hata analizi — beklenen geometri kutuphaneden, foto ile diff
Pasif ogrenme + tier'li servis (vizyonun asil maddeleri)


5. Vizyon Disiplini Hatirlatmasi
42 sonunda hala vizyondan SIFIR madde kapsama almama sozu gecerli:

❌ Pasif ogrenme — vizyonda kalir
❌ Tier'li servis modeli — vizyonda kalir
❌ Lazer tarama pipeline — vizyonda kalir
❌ STEP koordinat cikarimi — vizyonda kalir
❌ Klasor yukleme + format tanima — vizyonda kalir
❌ Capraz validasyon (3 katman) — vizyonda kalir

Cihat "bunu da yapalim sistemin can damari" derse: cevap "41-42'de iki kez istisna yaptik. Ucuncusu presedan. 50. oturumdan sonra konusalim."

6. 43 Gundemi Ozet
AdimSureOncelikAcilis ritueli5 dk🔴40 canli test borcu90-120 dk🔴Kapanis (3 dosya)10 dk🔴Kutuphane icerik doldurma30-45 dk🟡 (opsiyonel)
Toplam: ~2-3 saat oturum.


42 kapanisinda yazildi. 43 basinda okunacak. 43 sonunda 44 icin yenisi yazilacak.
