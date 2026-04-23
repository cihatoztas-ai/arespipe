# Cihat Hakkında — Claude İçin Not

> **Bu dosya kişisel bir nottur.** Sadece Claude'un seni tanıması ve her oturumda seni baştan anlamak zorunda kalmaması için var. Herkesle paylaşılmak üzere değil.
>
> Yaşayan bir not — Cihat "şunu ekle" dediğinde Claude günceller.

---

## Özet

Cihat AresPipe'ın sahibi ve tek geliştiricisi. Yazılımcı değil — projeyi kurmaya, büyütmeye, yönetmeye odaklanıyor; teknik işi Claude'la birlikte yapıyor. Bir tersane sorununu çözen gerçek bir ürün çıkarıyor: boru imalat takip sistemi. Uzun vadede SaaS olarak satacak, şu an temel kurgusu oturuyor.

---

## Nasıl Çalışıyoruz

- **Ben kodu yazarım, Cihat gözden geçirir + GitHub'a yükler.** Akış GitHub web arayüzü üzerinden — sürükle-bırak, "Commit changes" tık.
- **Terminal komutları birer birer, açıklamalı.** Üst üste yığılınca gözden kaçıyor. Sıralı ve neden çalıştığı yanında yazılı olsun.
- **"Şunu şuraya push et, oradan sorgula" tarzı çoklu komut zincirlerinden uzak dur.** Yerine: "İşte dosya, GitHub'a yükle, yüklediğini söyle, ben devamını söyleyeceğim" gibi adım adım.
- **Büyük değişikliklerde patch yerine tam dosya ver.** "Şu satırı değiştir" yerine "işte tam CLAUDE.md, üstüne yaz". Uygulama kolay, hata riski az.

---

## Neye Tahammülü Az

- Uzun teknik açıklamalar arasında sıkışmış "yap" talimatı (talimatı bulamıyor)
- Aynı anda 3+ şeyi sorgulamak (hangi cevabı hangiye? kafası karışıyor)
- Belirsizlik — "şu ihtimal olabilir, bu da olabilir, bak gör" tarzı. Net karar, net yön tercih ediyor.
- İlerleme olmadan geçen zaman. 10 günlük ileri-geri çalışma onu çok yordu.

---

## Neyi Seviyor

- Somut ilerleme. "Şunu yaptık, şu hazır, şimdi buna geçiyoruz" tipi geri bildirim.
- Görsel karşılaştırma. "A yoksa B mi?" metni yerine iki tasarımı yan yana gösteren mockup.
- Dürüstlük. "Bilmiyorum", "hata yaptım", "riskli olabilir" — örtmek yerine söylemek.
- Kendi kararını verme alanı. Çoktan seçmeli, net seçenekli sorular.

---

## Şu An Projede Durum (Nisan 2026)

**Oturumlar:** 23 oturum tamamlandı. Web tarafı oturmuş — 40 HTML sayfa, multi-tenant, yetki sistemi, Supabase + Vercel.

**Yarım Kalanlar:**
- Operasyon sayfaları (kesim, büküm, markalama, KK, sevkiyat) %80-90'da duruyor, bitirilmeyi bekliyor
- Mobil React uygulaması %5'te kaldı (iki ekran yazıldı, geri kalan duruyor)
- Proje listesi + detay sayfası hâlâ Supabase'e bağlanmadı

**Aktif İş:**
- 23. oturumda Faz B tamamlandı — sapmama sistemi (CI + kurallar.json + self-test)
- 24. oturum: Süper Admin Yönetim Panosu (feedback + görev takibi)

**Uzun Vade Vizyon:**
- Spool AI (izometri okuma AI'ı, parça kütüphanesi, 3D montaj, eğitim döngüsü)
- Detay: `docs/SPOOL-AI-VIZYON.md`

---

## Claude'a Özel Hatırlatmalar

1. **Oturum başında Cihat'a kim olduğunu hatırlatmasına izin verme.** Bu dosyayı oku, "Cihat'ı tanıyorum" olarak devam et. Bir tek durumda sor: profilin 3 aydan eski olması ve büyük değişiklik ihtimali varsa.

2. **"Yazılımcı değil"i ezber tekrar etme.** Bu utandırıcı olabilir. Onun yerine davranış düzeyinde uyum sağla — teknik jargonu azalt, komutları açıkla, kararları netleştir.

3. **Gerekmedikçe komut verme.** İlk seçenek her zaman: "İşte dosya, GitHub'a yükle." Sadece git'in özelliklerine (pull/stash/log) gerçekten ihtiyaç varsa komut ver.

4. **Sapma uyarısı.** Cihat bir şeye takılıp 3+ oturum yerinde sayarsa (10 günlük yerinde sayma gibi), Claude bunu fark eder ve söyler: "Burada 3 oturumdur ilerleyemiyoruz, kök sebebi konuşalım."

5. **Vizyon koordinatları.** Herhangi bir görev yapılırken Cihat sorarsa: "Bu işin Spool AI hedefine katkısı nedir?" diye — Claude cevap hazır tutar, anlamsız görev yapmaz.

---

## Dosya Güncelleme Yetkisi

- Claude bu dosyayı kendi inisiyatifiyle güncelleyebilir (yeni öğrenilen şeyler: "Cihat XYZ'yi sevmiyor").
- Cihat "şunu ekle / değiştir / çıkar" dediğinde Claude günceller ve kullanıcıya "işte yeni dosya" diye verir.
- Radikal değişiklikler (örn. "yazılımcılığa geçiyorum artık, ben yazacağım") olursa Claude onay sorar, tek yönlü değiştirmez.

---

**İlk yazım:** 23 Nisan 2026 — 23. oturum kapanışı.
