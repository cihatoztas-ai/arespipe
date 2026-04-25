# CLAUDE — 34. Oturum Gündemi

**Hazırlanma tarihi:** 25 Nisan 2026 — 33. oturum sonu
**Beklenen tarih:** 26 Nisan 2026 (yarın) veya sonrası

---

## 🎯 34. Oturumun Teması

**Geçiş oturumu:** Vercel-bağımsız son işleri kapat + **kullanıcı değeri moduna geç**

33'te Cihat sordu: "altyapı için yapılacak daha neyimiz var, normal sayfalara devam edebilir miyiz?". Cevap: %70 hazır, kalan kritik 3 madde (email, tenant izolasyon, Sentry) **SaaS satışı öncesi** yapılır. **Şimdi kullanıcı değerine dönüş zamanı.**

---

## 🔥 İlk 5 dakika — hızlı kontroller

### 1. Backup doğrulama (1 dk)

26 Nis ise mutlaka kontrol et:

```
https://github.com/cihatoztas-ai/arespipe-backups/commits/main
```

Son `backup: 2026-04-26_*` commit'inin saatine bak:
- **TR 03:00-03:30 arası** ise ✅ kapat, defterden çıkar
- **TR 05:55** ise sürükleyici aranır (timeout? queue gecikmesi?)

### 2. D3 Vercel test

Vercel açıldıysa (rate limit sıfırlandıysa):

```javascript
// Tarayıcı console'da
tersaneIsEmriKaydet.toString().includes('supa.from')
// → true olmalı (yeni kod canlıda)
```

Eğer `true` ise:
- Devre aç, "tersane iş emri" gir, kaydet, F5 → kalıcı mı?
- Kalıcıysa D3 ✅ defterde kapat

Eğer `false` ise: deploy hâlâ yapılmamış, ileri ertele.

---

## 📋 34. Oturum İçin Önerilen Gündem

### Sırayla (önerilen):

**A — Defter kapanışları (10-15 dk)**
1. db-backup ✅ (eğer 26 Nis sabah saati doğruysa)
2. D3 ✅ (eğer Vercel deploy temizse)

**B — G-08 görsel fark tespiti (20 dk)**
- 32'den devir. devre_detay.html ve devreler.html'i yan yana iki sekmede aç
- Cihat'ın "tam aynı değil" gözlemini somutlaştır
- Üç ihtimal:
  1. Somut bir CSS farkı bulunur → tek satır düzeltilir
  2. Fark yok, "kapatıyoruz" denir
  3. Cihat'ın aklındaki şey başka bir şey, beraber gözden geçirilir

**C — KULLANICI DEĞERİ MODU başlat (asıl iş)**

Üç yol var, Cihat seçecek:

#### Yol 1: Operasyon sayfalarını bitir
- **Kesim sayfası** (14. oturumda %80 idi) — eksik: tablo export, manuel parça ekleme validasyonu, KK entegrasyonu
- **Büküm + Markalama** — benzer eksikler
- Bitirilince operasyon akışı uçtan uca çalışır → kullanıcılar tek bir spoolu sıfırdan sevkiyata kadar takip edebilir

#### Yol 2: Mobil sayfaları aç
- **MProfil** (avatar yükleme + kişisel bilgi) — mockup-first kuralıyla
- **MIsBaslat** (operatör iş akışı) — eski is_baslat.html'den uyarlanır
- Mobil kullanıcılar operatörler — bu sayfalar kritik

#### Yol 3: Spool AI vizyonuna geçiş
- **Katman 3 — Parça Kütüphanesi** — DN25-DN300, ASME B36.10 ölçüleri
- 31'de kazanç var (egitim_verisi insert çalışıyor)
- Vizyon dokümanına göre Katman 1 (spool_usta.html) ve Katman 2 (spool_3d_montaj.html) hazır

---

## ⚠ Aktif Borçlar (33'ten devir)

- 🟡 **D3 deploy doğrulama** — Vercel açıldığında ilk iş
- 🟡 **db-backup canlı doğrulama** — 26 Nis sabah yedek saati
- 🟡 **G-08 görsel fark tespiti** — 32'den
- 🟡 **Vercel ignoreCommand fix** — `arespipe-mob` için `mobile/` haricinde build skip
- 🟡 **SBD-01 vs GitHub Issues kararı** — 32'de atlandı, Cihat seçecek
- 🟡 **G-08 yaygınlaştırma** — 21 sayfa eksik, 34-35'e dağıtılabilir

**Ürün dönemi öncesi (37+ için):**
- 🟢 Email sistemi — şifre sıfırlama, davet, bildirim
- 🟢 Tenant izolasyon testleri — RLS yazıyor, kanıt yok
- 🟢 Sentry / error tracking
- 🟢 Staging Supabase

**Yeşil borçlar:**
- 🟢 sorgula.js JWT-bazlı auth refactor
- 🟢 Audit Log pano sekmesi
- 🟢 Tablo Render Standardı (G-06) — 26'dan
- 🟢 G-05 CI lint kuralı — `.mb-*` hardcode rgba/hex yasağı
- 🟢 help.html son kullanıcı dokümantasyonu

---

## 🆕 33'te Doğan Açık Konular

### D8 — Spool numara formatı (potansiyel)

D4 testinde gözlemlendi: KK listesinde spool numaraları "S01, S01, S01, S02, S03, S04, S05, S06" şeklinde tekrar ediyor. `spool_no` field'ı kısaltılmış formatta tutulu olabilir. Tam formatı (örn. `NB1137-AT110-816-026-S01`) görmek istiyorsa render mantığı düzeltilebilir.

**Karar 34'te:** Cihat'a sor — kısa "S01" gösterimi tercih mi (mevcut), tam isim mi gösterilmeli?

---

## 📐 Disiplin Hatırlatmaları

- **Self-test:** 38'de zorunlu (33→38, 5 oturum)
- **Schema değişikliklerinde:** information_schema sorgusu + uçtan uca tarama (S2/32 + D7/33 dersi)
- **Atomik patch script'i:** errs listesi + write koşullu — yarım yamalak değişiklik bırakma
- **Cron değişikliği:** Bir sonraki tetiklemeden uygulanır, hemen kontrol etme (33 dersi)
- **Defter notuna saygı, ama kullanıcı isteği üstün** — uyar, sonra uygula
- **Commit zinciri kırılırsa:** `git pull --rebase origin main && git push` — CI bot ci-son-rapor.json basar, normal

---

## 💡 34. Oturum Başlangıç Önerisi (Claude için)

5 ritüel sorusunu sor + şunları ek olarak dahil et:

1. "26 Nis sabah backup saati nedir?" (backups repo commits)
2. "Vercel deploy açıldı mı? D3 kod canlıda mı?" (console testi)
3. "Bugün hangi yola gitmek istiyorsun: A (defter kapanışı) → B (G-08) → C (kullanıcı değeri)?"

Cihat'ın yorgunluk seviyesini dikkate al — 33 yoğun bir oturumdu (~2.5 saat, 5 commit). Eğer "hızlı + somut" istiyorsa A+B 30 dk'da bitirilir, C için yeni bir oturum açılır.

---

## 🎯 34'ün Başarı Kriteri

- ✅ db-backup ve D3 (Vercel açıksa) defterde kapanmış
- ✅ G-08 ya kapanmış ya da somut karara bağlanmış
- ✅ Bir sonraki adımın hangi yol olduğu (Kesim? MProfil? Spool AI?) net karara bağlanmış
- ✅ CI yeşil, commit zinciri temiz
