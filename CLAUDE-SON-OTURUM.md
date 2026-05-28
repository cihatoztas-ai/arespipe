# Oturum 129 — Terfi-yeniden-eşle (MK-127.4/A1) + v3 entegrasyon + çapraz doğrulama keşfi

**`api/eslestirme-backfill.js`'e iki aşamalı fix (devre_dokuman_id select + alias) +
`devre_wizard_v3.html` `onayEt`'e best-effort await backfill çağrısı.** A1 DB
seviyesinde iki vakada kanıtlandı. Ama yeni v3 testinde spool detay imalat sekmesi
boş çıktı, montaj geldi — DB-UI çelişkisi 130'a. Ek olarak **omurganın çapraz
doğrulama katmanının eksikliği yüzeye çıktı** — Cihat'ın tetikçi testiyle.

## Bağlam

- Açılış: CI sarı (81 uyarı, 0 hata — I18N + G03 baseline, kozmetik). HEAD `43807bb`.
- Boş `kök` dosyası kazara redirect kalıntısı, silindi (`rm "kök"`).
- Cihat'ın yön çizgisi: "burası programın kalbi, geçiştirmeyelim" — A1 için en ucuz
  yol seçildi (yeni kod yok, mevcut `eslestirme-backfill` kullanıldı).

## Karar yolu (sırayla)

1. **MK-127.4/A1 onayı (Cihat):** terfi sonrası parse_sonuc'tan kanonik `eslestir()`
   re-eşle (PDF/AI yok, $0). Yeni endpoint VEYA mevcut matcher giriş — A1 seçildi
   (izole).

2. **Mevcut kod okuma (MK-126.8):**
   - `eslestir` (satır 498) export var, `montajEslestir` (satır 645) içinden çağrılıyor
   - Argümanlar: `(supa, devreId, kuyrukId, okuJson, devreDokumanId)`
   - `okuJson` = `parse_sonuc` (satır 369'da yazılan içerik) — PDF gerek yok
   - `cizim_durumu` yükseltme filtreli (`bekliyor` → `kismi`), tekrar çağrı güvenli
   - `okuJson.montaj` varsa erken return → `montajEslestir`. Tek `eslestir` çağrısı
     hem imalat hem montaj kapsıyor
   - `if (devreDokumanId)` bloğu `devre_dokumanlari.spool_id` yazıyor (satır 587-590)
   - Kuyrukta `devre_id` kolonu **YOK** — bağ `devre_dokuman_id` üzerinden

3. **İlk yanlış adım — `api/devre-eslesme-yenile.js` (145 satır) yazıldı:**
   Push edildi, deploy **Error**. Build geçti ama deploy reddedildi: *"No more than
   12 Serverless Functions can be added to a Deployment on the Hobby plan."*
   `ls api/*.js | wc -l` = 13. **MK-126.8 ihlali:** `api/eslestirme-backfill.js`
   (110/MK-110.1) zaten birebir aynı işi yapıyordu (`{devre_id, kuru, limit}` body,
   `eslestir` import, idempotent). Grep'te ismi gördüm ama içine bakmadan yeni dosya
   yazdım. `git rm` + `gp` ile geri alındı → 12'ye döndü → deploy Ready.

4. **`eslestirme-backfill` fix (B-1 yetersiz):**
   - Select'e `devre_dokuman_id` eklendi (`sed` ile, `!` history-expansion engeli
     yüzünden iki tur tökezledi — sonunda `create_file` + `str_replace` ile temizlendi)
   - `eslestir` çağrısı: `eslestir(supa, dvId, is.id, okuJson, is.devre_dokuman_id)`
   - Push `0a0e3b3`. Test: snapshot SQL hâlâ `bagli_dok=0`. Fix yansımadı.

5. **Kök sebep — PostgREST FK embed çakışması (MK-129.1):**
   `.select('id, devre_dokuman_id, parse_sonuc, devre_dokumanlari!inner(devre_id)')` →
   `devre_dokuman_id` (FK kolonu) `devre_dokumanlari` (embed) ile çakışıyor → ham uuid
   gölgeleniyor, `is.devre_dokuman_id` undefined.

6. **`eslestirme-backfill` fix (B-2 alias, MK-129.1):**
   - Select: `'id, dok_id:devre_dokuman_id, parse_sonuc, devre_dokumanlari!inner(devre_id)'`
   - Çağrı: `eslestir(supa, dvId, is.id, okuJson, is.dok_id)` (`dokId` değişkeniyle)
   - Rapora `dok_id` eklendi (kanıt için)
   - Push `31f22e4`. Test:
     - curl çıktısı → her kayıtta `dok_id: "uuid-..."` ✓
     - snapshot SQL → 8/8 spool `cizim_durumu='kismi'`, `bagli_dok=1` ✓
     - eski devre `7fbdde63` spool A-001036 detay → "İzometri Çizimleri" altında
       `AT110-816-026 1(2).S01.1.pdf` görünüyor, "eşleşen izometri" etiketi ✓

7. **v3 `onayEt` entegrasyon (`6b28df6`):**
   - `await fetch('/api/eslestirme-backfill', {devre_id})` terfi sonrası
   - Hata yutar, `izoEslesen` ve `izoHata` değişkenleri toplanır
   - Toast birleştirme: başarıysa "+ N izometri eşleşmesi", hata varsa uyarı
   - Yönlendirme: 1 sn (başarı) veya 2.5 sn (hata, okunabilsin)
   - `devre_wizard_v3.html` 1064 satır (1038 + 26)

8. **Yeni v3 canlı test (Demo Atölye, aynı IFS .xlsm + izometri PDF):**
   - Adım 1 → Adım 2 → Onayla → toast "8 izometri eşleşmesi" ✓
   - devre_detay açıldı (`de0dbbdf-...`):
     - 8 spool listelendi, YÜZEY=Galvaniz dolu (mockup'a uygun)
     - **DURUM "Bekliyor" görünüyor, İlerleme 0/6** (kismi bekleniyordu)
     - Spool detayında **imalat izometri PDF YOK, sadece montaj PDF var** ✗
   - **Çelişki:** toast DB'nin doğru olduğunu söylüyor, ama spool_detay UI farklı
     gösteriyor. Eski devrede tersi davranış gördük. **Hipotez:** spool_detay sorgusu
     `tenant_id` veya `silindi=false` filtresi yüzünden yeni terfi spool'unu farklı
     handle ediyor olabilir, veya `devre_dokumanlari` parse_durumu hâlâ 'bekliyor'.
     130'da SQL ile kontrol edilecek.

## ALTI ÇİZİLECEK KEŞİF — Cihat'ın tetikçi testi

Bir POAR PDF'i kopyalayıp **yeni isim verdi**, sistem onu parse etti, kabul etti,
hiçbir uyumsuzluk uyarısı vermedi. Cihat'ın yorumu (00:33):

> "herşey dosya adı değil ki malzemelerde var. poardaki resim formatında zaten l3 e
> gitmesi gerekiyordu. burada poar üzerindeki malzeme listesi ile excel uyumsuz bunu
> da uyarmadı. biz şöyle karar almıştık, klasör olarak yüklüyoruz, önce güvenlik için
> excel kabuk çıkıyor sonra katman katman dosyada ne varsa sömürüp elde edilebilecek
> tüm bilgileri sömürecektik. şu an bu seneryo çalışmıyor."

**Kod kontrolünde doğrulandı:**
- `api/kuyruk-isle-izometri.js:458` — *"PIPELINE KAYNAGI = DOSYA ADI"* (bilinçli karar,
  belgesel, ama tek başına yetersiz)
- `bindir()` (satır 553) sadece et/çap/ağırlık/yüzey çelişkisini yakalıyor (%3 tolerans),
  `bindirme_flag` set ediyor. **Malzeme listesi karşılaştırması YOK**
- `bindirme_flag` ham hâlde DB'ye yazılıyor ama UI'da operatöre **görünür değil**
- L3 manuel toggle, otomatik karar yok (resim-PDF için L3 gerekirken sistem fark etmiyor)

**Bu, omurganın "katman katman sömürüp uyumsuzluk uyar" sözünün yapılmamış kısmı.**
Omurga 18.d'de örtük var ("değer düzeltme yazma + çapa") ama dar yazılmış. 130'un
baş maddesi: tam mimari belgesi + çapraz doğrulama tasarımı.

## Yeni MK'lar

| MK | Karar |
|----|-------|
| MK-129.1 | PostgREST select'inde FK kolonu + aynı tablo embed çakışması → alias zorunlu |
| MK-129.2 | Yeni endpoint öncesi `ls api/*.js` + benzer adlı dosyaları aç (MK-126.8 güçlendirmesi) |
| MK-129.3 | Vercel Hobby 12-function tavanı: 11'de dur, konsolidasyon/Pro kararı ver |
| MK-129.4 | v3 terfi → backfill best-effort await; hata terfi'yi geri almaz, kullanıcıya uyarı |

## Hatalar & düzeltmeler (bu oturum)

- **`api/devre-eslesme-yenile.js` mükerrer endpoint** (MK-126.8 ihlali): `eslestirme-backfill`
  zaten varmış, içine bakmadan yeni yazdım. Push'tan sonra Hobby 12-function tavanı
  reddetti. Düzeltme: `git rm` + revert commit.
- **`sed` history-expansion `!inner(devre_id)` üzerinde patladı** (zsh `!`).
  `set +H` da işe yaramadı (zsh için `unsetopt banghist` lazımmış). Düzeltme: tam
  dosya `create_file` + `str_replace`. **Ders (kişisel):** dosya >50 satır olduğunda
  ve özel karakter (`!`, `$`, backticks) varsa `sed` denemeyeceğim — direkt
  `create_file` veya `str_replace`.
- **Toast'ın yanlış yansıması:** ilk gerçek curl'de `toplam_yukseltilen: null` döndü
  (kuru raporda var, gerçekte yok — eslestir summary alanı farklı). Rapora `dok_id`
  eklenince ikinci turda doğru görüldü. v3'te `bfJson.toplam_yukseltilen || 0`
  fallback'i bu yüzden var.

## Süreç notu

Oturum çok uzadı (öğleden gece yarısına). Çok sayıda küçük tökezleme oldu:
- `sed` ile iki tur yanlış adım
- Vercel deployment URL'ini bilmemek (Cihat dashboard'dan kontrol etti)
- SQL'i terminale yapıştırma kazaları (zsh parse error)
- Çapraz doğrulama keşfini ilk önerimde eksik yorumladım (Cihat düzeltti)
- Plan limiti tartışması "konsolidasyon yeterli mi" sorusunu doğurdu; Pro tetiği
  pilot anlaşmasına bağlandı (Cihat onayı)

Yorgunluk gerçek; gece yarısı kapsamlı parser belgesi yazmayı bilinçli olarak
130'a ertelediğimiz iyi oldu — Claude'un context'i de yarım hatırlı şeylerle dolu,
yarın temizlenecek.

---

> 130 açılışında: `son-durum.md` + bu dosya + `CLAUDE-SONRAKI-OTURUM.md` + omurga.
> İlk iş: `docs/PARSER-VE-YUKLEME-AKISI.md` belgesi. Kod yazılmadan belge yazılır.
