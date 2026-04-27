# AresPipe — Son Durum

**Son güncelleme:** 26 Nisan 2026 Pazar, 34. oturum sonu

---

## 34. Oturumda Olanlar (özet)

**Tema:** Defter temizliği (D3 + db-backup) + G-08 yaygınlaştırma başlangıcı (devre_detay 1/22) + İzometri Batch tasarım + Ekran 1 frontend

**Tamamlananlar (6):**

1. ✅ **CI fix — `kontrol.yml` push retry-with-rebase** — Paralel workflow race fix.
2. ✅ **D3 — `tersaneIsEmriKaydet` Vercel doğrulama** — Defterden silindi.
3. ✅ **db-backup canlı doğrulama (kısmi)** — Sistem çalışıyor (saat hâlâ kayık, GitHub Actions gecikmesi muhtemel). 27-30 Nis sabahları izlemeye devam. **Önemli keşif:** `db-backup.yml` `arespipe-backups` repo'sunda yaşıyor, ana repoda yok.
4. ✅ **G-08 — devre_detay.html (1/22 sayfa)** — G-05 standardı yayıldı + skeleton fix + 5 ek bug fix (badge class temizleme, cascade animation).
5. ✅ **İzometri Batch — Tasarım + 10 Mimari Karar** — `docs/IZOMETRI-BATCH-KARAR.md` yazıldı, brief Madde 19 eklendi, Madde 12 iptal edildi. Tüm akış 8 adımla netleşti.
6. ✅ **İzometri Batch — Ekran 1 Frontend** — `izometri-batch.html` 536 → 707 satır, +171 (yeni stat kartı, format badge, banner, durum kolonu, manuel onay butonu, demo modu).

**Yarım kalan / 35'e devir:**

1. 🟡 **db-backup saat kontrolü** — 27-30 Nis sabahları izlenecek
2. 🟡 **G-08 yaygınlaştırma** — 21 sayfa kaldı, devre_detay pattern hazır
3. 🟡 **Cihat'tan 2-3 örnek PAOR/AVEVA PDF** — 36-37 oturumlarında lazım

---

## ⚠ Aktif Borçlar — 35. Oturum Başında Dikkat

- 🔴 **35. oturum: ASME Lookup tam sistemi** — İzometri Batch'in önkoşulu (KARAR.md Karar 5 — A1). Yeni `js/ares-asme.js` + `js/ares-agirlik.js` + `asme_olculer` DB tablosu. Detay: `CLAUDE-SONRAKI-OTURUM.md`.
- 🟡 **db-backup saat kontrolü** — 27 Nis sabah ilk kontrol
- 🟡 **G-08 yaygınlaştırma** — 21 sayfa, pattern hazır (devre_detay referans)
- 🟡 **Vercel ignoreCommand fix** — `vercel.json`
- 🟡 **SBD-01 vs GitHub Issues kararı** — Cihat seçecek

**Önceki dönemlerden devreden:**
- 🟢 `sorgula.js` JWT-bazlı auth refactor (güvenlik açığı)
- 🟢 Audit Log pano sekmesi
- 🟢 Tablo Render Standardı (G-06)
- 🟢 Operasyon sayfaları %100 — Kesim/Büküm/Markalama bitirme
- 🟢 Mobil sayfalar — MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara
- 🟢 G-05 CI lint kuralı
- 🟢 help.html

**Defter'deki açık SED maddeleri:**
- spool_detay: S3 (AI toolbar gizli — bilinçli), S4 (QR indirme yarım — bilinçli)
- devre_detay: ~~D3~~ ✅ (34), ~~D4~~ ✅ (33), ~~D7~~ ✅ (33)
- D8 (spool_no formatı KK'da S01 tekrar) — 35+ defter
- **Yeni gözlem:** devre_detay badge class temizleme bug pattern'i diğer sayfalarda da olabilir (G-08 yaygınlaştırma sırasında topluca taranacak)

---

## Plan / Roadmap

| Oturum | Tema | Durum |
|---|---|---|
| 30 | Bucket PRIVATE Faz 1-2 | ✅ |
| 31 | Bucket PRIVATE Faz 3-6 + SED başlangıç + G-08 envanter | ✅ |
| 32 | Defter temizliği — orphan, v5, S1, D5, D6 + D3/G-08 yarım | ✅ |
| 33 | Vercel-bağımsız işler: self-test, D7, db-backup defter, D4 | ✅ |
| **34** | **CI fix + D3 + db-backup + G-08 (devre_detay) + İzometri Batch tasarım + Ekran 1 frontend** | **✅ TAMAMLANDI** |
| **35** | **ASME Lookup tam sistemi (B1 önkoşulu)** | **Sırada** |
| 36 | İzometri Batch: DB tabloları + dispatcher + 502 fix + Ekran 2 (manuel onay) | — |
| 37 | İzometri Batch: Ekran 3 (Format Kaydet) — B Adımı + Excel upload | — |
| **38** | **İzometri Batch: C Adımı (görsel işaretleme) + genelleştirme + ZORUNLU SELF-TEST** | — |
| 39 | İzometri Batch: pilot AVEVA-PAOR canlıya + super_admin "AI API Kullanım" sekmesi | — |

**40+ ÜRÜN DÖNEMİ.**

---

### Cihat'ın 34'te Sorduğu Stratejik Soru

> "İzometri batch sayfasını güncelleyecez. Notlarda var ekte buna göre nasıl yapıyoruz."

**Cevap özeti:** Brief'i okuduk, 8 adımlı bir altyapı projesi. Cihat tasarım oturumunu açtı, sonra "geri dönmeyelim" diyerek Ekran 1 frontend yazımına geçti. 10 mimari karar alındı (KARAR.md), Ekran 1 demo modu ile çalışır halde, Ekran 2-3 ve backend sonraki oturumlara bırakıldı.

---

### Kural Sağlık Kontrolü

- **Son self-test:** 25 Nisan 2026, 33. oturum — **4/4 başarılı** ✅
- **⚠️ Sonraki zorunlu self-test:** 38. oturum (33→38, 5 oturum)
- **Komut:** `node .github/kontrol.js --self-test`

---

## 📖 Aktif Belgeler (Yaşayan)

### **`docs/IZOMETRI-BATCH-KARAR.md`** — yeni (34. oturum, 10 karar)
Mimari karar dokümanı. 35-39 oturumların referansı. Sonraki oturumlar bunu okur, kararları yeniden tartışmaz.

### **`docs/IZOMETRI-BATCH-NOTLARI.md`** — güncellendi (34. oturum)
Brief, Madde 19 eklendi (tek dosya/şişmeden prensibi), Madde 12 iptal işaretlendi, Madde 16 cevaplandı.

### **`izometri-batch.html`** — yenilendi (34. oturum)
536 → 707 satır. Demo modu (`_DEMO_MOD = true`) ile çalışır. Backend hazır olmadan görsel/akış testi mümkün.

### **`docs/SAYFA-EKSIKLERI.md`** — defter
Sayfa-bazlı eksiklerin defterli takibi. **34'te:** D3 ✅ kapatıldı. devre_detay G-08 1/22 olarak işaretlendi.

### Vizyon: `docs/SPOOL-AI-VIZYON.md`
Spool AI ürün vizyonu. Madde B1 İzometri Batch artık aktif geliştirme fazında.

### Pano Tasarımı: `docs/PANO-TASARIM.md`
Süper Admin Yönetim Panosu. **34'te yeni notlar:** "AI API Kullanım" sekmesi 39+'da eklenecek.

### Kullanıcı Profili: `docs/CIHAT-PROFIL.md` ⚠ ZORUNLU
Her oturum başı Claude bu dosyayı okur.

### Pano (canlı): `admin/panel.html`
Süper admin çalışma merkezi.

### CI Rapor: `.github/ci-son-rapor.json`
CI her main push'ta JSON rapor üretir.

### Oturum Arşivi: `docs/sessions/archive-01-22.md`
1-22. oturumların CLAUDE.md'den ayıklanmış özetleri.

### **Yedekleme Sistemi** (27. oturum)
- **Repo:** `cihatoztas-ai/arespipe-backups` (private)
- **Workflow:** `.github/workflows/db-backup.yml` — **34'te keşif:** dosya `arespipe` repo'sunda DEĞİL, `arespipe-backups` repo'sunda. 27-30 Nis sabahları saat kontrolü beklemede.

### **CI Sapmama Sistemi** (23. oturum + 34. oturum eklemesi)
- **Workflow:** `.github/workflows/kontrol.yml` — 34'te `push retry-with-rebase` eklendi (paralel workflow race fix)
- **Kurallar:** `.github/kurallar.json` — 14 aktif kural
- **Self-test:** 5 oturumda bir zorunlu (sonraki: 38)

---

## 34. Oturumun Önemli Dersleri

1. **CI altyapısının kendi sapması** — Sapmama sistemi kuralları izliyor ama CI commit altyapısı paralel race'e düşmüştü. Sistem kendisini de denetlemeli.

2. **Defter güveni vs DB güveni (S2/32 dersinin tekrarı)** — Defter "db-backup.yml `arespipe` repo'sunda 32'de düzeltildi" diyordu. Cihat `cat` denedi → "No such file". **Ders:** kritik dosya konumları defterde değil, gerçek kontrol ile tespit edilmeli.

3. **Mevcut bug'lar yeni iş sırasında ortaya çıkar** — devre_detay'daki badge class temizleme bug'ı G-08 fix'i sırasında ortaya çıktı.

4. **Brief'in kendi koyduğu kuralı uygulamak — sonra esnetmek** — Brief Madde 18 "kod yok" kuralıydı, oturumun büyük kısmı tasarım olarak geçti. Son aşamada Cihat *"bu kadar çalıştık geri dönmeyelim"* diyerek kuralı esneterek Ekran 1 frontend'i yazdırdı. Brief'i Cihat yazdı, kuralı Cihat esnetti — sapma değil, yetkili karar.

5. **Görsel karşılaştırma karar hızını artırır** — 3 mockup (Ekran 1 v1, v2, Ekran 2, Ekran 3) ile 10 karar hızlı alındı.

6. **Erken kapatma riski** — Cihat *"biz niye kapattık daha konuşuyorduk"* itirazı kritik dönüm noktasıydı. Tasarım yarımken oturumu kapatmaya çalışmıştım. Cihat'ın itirazı sonrası oturum 6 yeni karara devam etti (Karar 7-10 + Ekran 1 frontend).

7. **Kullanıcının eleştirisi brief'i tamamlar** — "Tek dosya, şişmeden" prensibi (Madde 19), "maliyet kullanıcı sayfasında olmasın" kararı, "aynı batch = aynı format" netleştirmesi, "format ilk yüklendiğinde nasıl tanıtacağız" sorusu — hepsi Cihat'tan geldi, brief'te yoktu.

8. **IFS Excel keşfi ve sınırı** — Cihat'ın spontan Excel önerisi (Karar 7) mimariyi basitleştirdi, ama %50 yaygınlık nedeniyle "sürekli mod" yerine "sadece eğitim modu" kalır. ASME Lookup hâlâ gerekli (kalan %50 PDF için).

9. **Mock data ile demo modu — backend yokken UI test mümkün** — `_DEMO_MOD = true` ile Cihat sayfayı kullanabilir, görsel akışı doğrulayabilir. Backend 36. oturumda hazır olunca `_DEMO_MOD = false`.

---

## Sonraki Oturumun (35) Açılışı

**Tema:** ASME Lookup tam sistemi (B1 önkoşulu, Karar 5 — A1)

**Açılış sırası:**

1. Standart 5 soruluk ritüel (CLAUDE.md)
2. **db-backup saat kontrolü** — `arespipe-backups` repo Commits sekmesinden 27 Nis sabah commit saati
3. **Cihat'tan örnek PDF kontrolü:** "*34'te 2-3 örnek PAOR/AVEVA PDF yükleyeceğini söylemiştin. Yüklediğin var mı?*"
4. **Ekran 1 testi sorgu:** "*izometri-batch.html'i yükleyip test ettin mi? Demo modu görsel akışı tam mı?*"
5. **Ana iş:** ASME Lookup tam sistemi — `CLAUDE-SONRAKI-OTURUM.md`'deki plan uygulanır
