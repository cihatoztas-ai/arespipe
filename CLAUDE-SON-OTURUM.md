# 201. Oturum — KK A-fix + Temizlik + Modül Doğrulama + Yeniden Tasarım (23 Haziran 2026)

> **Durum:** ✅ Hedef aşıldı. KK modülünün canlı çalıştığı doğrulandı, mimari A-fix yapıldı, bozuk veriler temizlendi, sayfa yeniden tasarım mockup'ı (v3) kullanıcı geri bildirimleriyle olgunlaştırıldı. Kod yazımı (rewrite) sonraki oturuma bilinçli bırakıldı — önce mockup onayı.

---

## Hedef

201 açılışında gündem: KK modülünü canlı tamamlamak (A-fix → eski davet temizliği → uçtan-uca test), kalan işleri netleştirmek. Oturum ilerledikçe KK çekirdeğinin zaten 199 rewrite'ında bitmiş olduğu görüldü; asıl değer **mimari düzeltme + veri temizliği + görsel yeniden tasarım** oldu.

---

## Yapılanlar (sıralı)

### 1. devre_detay A-fix (MK-201.1) — commit'lendi

**Sorun:** `devre_detay.html > gonderKaydet` (KK dalı) hâlâ eski modeldi — "KK gönder" butonu doğrudan `kk_davetler` + `kk_davet_spooller` junction yazıyordu. Bu, iki-katman mimarisini (havuz ≠ davet, MK-199.3) ihlal ediyordu: davet sadece KK sayfasından KK26 sayacıyla açılmalı.

**Tanı (read-before-write, MK-158.1):**
- `spooller` CHECK'leri tarandı → `aktif_basamak` üzerinde CHECK yok, `'on_kontrol'` serbest. DDL gerekmedi.
- `supaId` map'i: satır 1534 `supaId:s.id` (uuid). Patch `.in('id',okIds)` doğru.
- ET ikiliği teyit: `spooller.et_kalinligi_mm` vs `spool_malzemeleri/pipeline.et_mm` (gonderKaydet'i etkilemiyor).

**Patch (idempotent Python, .bak yedekli, 3 anchor):**
- ① hedef etiketi `KK` → `Ön Kontrol`
- ② KK dalı: `kk_davetler.insert`+junction **KALDIR** → `supa.from('spooller').update({aktif_basamak:'on_kontrol'}).in('id',okIds)`
- ③ log `kk_daveti`→`on_kontrole_gonderildi`, toast "Ön Kontrol havuzuna gönderildi"
- Teyit: `aktif_basamak:'on_kontrol'`=1, `kk_davetler.insert`=0, marker=1, `</html>`=2 (ikisi de baştan vardı). 

**Canlı sonuç:** 10 spool `on_kontrol`'e düştü. KK gönder artık davet yaratmıyor.

### 2. Bozuk davet temizliği (MK-201.2)

- Envanter: 14 davet `KK-xxxxx` (Date.now, sayaç-dışı) + ~59 junction toplam (12'si KK26'ya bağlı).
- `kk_davetler.durum` CHECK `{bekliyor,tamamlandi}` → `iptal` yazılamaz. Status-set yolu kapalı.
- Karar (Cihat onayı): bunlar bozuk test verisi (yanlış mimariyle üretildi, iş anlamı yok) → **DELETE**. "Veri silinmez" kuralı üretim iş kaydı içindi.
- `kk_davet_spooller_davet_id_fkey` confdeltype=`c` (CASCADE) → tek `DELETE FROM kk_davetler WHERE davet_no NOT LIKE 'KK26-%'`.
- Yedek SELECT alındı (14 satır). Sonuç: `kalan_eski=0`, junction 59→12. Yalnız KK26-003/004/005 kaldı.

### 3. KK modülü doğrulama (kod değişmedi)

`kalite_kontrol.html` (199 rewrite, 581 satır) incelendi — **fonksiyonel tam**:
- `veriYukle` (268): havuz `aktif_basamak='on_kontrol'`, davetler `kk_davetler` + junction nested select (ET dahil) ✅
- `davetiyeOnayla` (399): `ARES.sonrakiNo('kk')` → KK26 sayaç · tersane-tek guard · junction `bekliyor` · `aktif_basamak on_kontrol→kk` (eq guard'lı) ✅
- `sonucKaydet` (495): junction patch, `gecti/tamir/hatali` ✅
- `daveti kapat` (530): `gecti→sevkiyat`, `tamir→on_kontrol`, davet `tamamlandi`+`kapanis_ts` ✅
- `sonucEtiket/sonucCls`: `gecti→Onay`, `tamir→Ret`, `hatali→Hatalı` (MK-200.1) ✅

Canlı e2e: KK26-006 oluştu → 2 spool sonuç (1 onay 1 ret) → kapat → arşiv. ET `4,5` doğru.

### 4. Sayaç yanlış-alarm çözümü

Tanımlar panelinde "kk" satırı bozuk görünüyordu (boş prefix, digits=6, örnek `000003`). Şema sorgusu: prod tenant satırı **doğru** (`prefix=KK, yil_ekle=true, digits=3, son_no=5`). Paneldeki bozuk satır başka test tenant'ına ait. `sonrakiNo(tip)` → `_supa.rpc('sonraki_no',{p_tenant_id:tenantId(),p_tip:tip})` her tenant kendi satırını kullanır. Prod etkilenmiyor.

### 5. KK sayfası yeniden tasarım — mockup v3

Üç tur geri bildirimle olgunlaştı (v1→v2→v3):

**v1→v2 değişiklikler:**
- "Havuz" → "Davet Bekleyenler" (Cihat'ın daha önce işaretlediği)
- İki-katmanlı sıkışık başlık → **devreler-sayfası gruplu satır** (Tersane·Gemi·Devre·Zone·Spool X/Y·Ağırlık·Malzeme·Yüzey)
- Renkler aktif devreler ile aynı (Karbon mavi, Bakır amber, Paslanmaz mor; yüzey renkli metin; tersane pill)
- Gruplar kapalı açılır; ok'a tıkla → devre_detay tarzı alt tablo
- "Müşteriye Gönder" kaldırıldı (mail entegrasyonu yok)
- Müşteri davet PDF'i tasarlandı (A4: başlık·tersane/gemi·devre-grup·spool tablosu·X/Y·toplamlar·imza)

**v2→v3 değişiklikler:**
- Alt tablo `table-layout:fixed`+colgroup → kolonlar hizalı, Marka tek satır (kırılma giderildi), tam genişlik
- Açık/Arşiv **iki kademe accordion** (paket satırı → devre → spool); koca kart kalktı, paketler çoğalınca derli toplu
- **Belgeler popup**: yatay-kaydırmalı resim galerisi (çok resimde bozulmaz) + davet notları + belge listesi; her dosyada paket/spool kapsam etiketi; satırda 📁 ikonu (rozet=dosya sayısı)

---

## Öğrenmeler

1. **"Yeniden yaz" demeden önce mevcudu oku.** 199 tasarım dosyası "eski sayfa terk → rewrite" diyordu; gerçekte 199 rewrite'ı zaten yapmış, sayfa canlı çalışıyordu. Boş yere rewrite'a girilmedi — doğrulama + görsel iyileştirmeye odaklanıldı.
2. **Panel UI ≠ DB gerçeği.** Sayaç "bozuk" göründü ama doğru tenant satırı sağlamdı. Şema sorgusu (`information_schema` + satır SELECT) yanlış alarmı kapattı. Ekran görüntüsüne değil DB'ye güven.
3. **CASCADE yönünü kontrol et.** 3 FK'dan sadece `davet_id` CASCADE'di; doğru olan da oydu (`spool_id`/`tenant_id` `a` ama ters yön). Tek DELETE yetti.
4. **Mockup iterasyonu ucuz, rewrite pahalı.** Üç tur geri bildirim mockup'ta birkaç dakika; bunu koda yansıtsaydık saatler. R-10 (önce mockup) disiplini işe yaradı.
5. **Tasarım dosyası eskiyebilir.** TASARIM.md `sonuc∈{bekliyor,onay,ret}` diyordu; canlı `{gecti,hatali,tamir,bekliyor}` (MK-200.1). Dosya güncellendi.

---

## Değişen / üretilen dosyalar
- `devre_detay.html` — A-fix (commit'lendi)
- `docs/kalite-kontrol-mockup.html` — v3 (repoya konacak)
- `docs/KALITE-KONTROL-TASARIM.md` — son hal (bu oturum delta'sıyla)
- DB: 14 davet + ~47 junction silindi (panel)

## Yeni kural kayıtları
- **MK-201.1:** KK gönder (devre_detay) yalnız `aktif_basamak='on_kontrol'` set eder; davet/junction yazmaz. Davet tek kapı: kalite_kontrol.html + KK26 sayaç.
- **MK-201.2:** Mimari hatadan doğan test çöpü (sayaç-dışı davet) DELETE edilebilir (yedek + CASCADE teyidi sonrası); "veri silinmez" üretim kaydı içindir.
- **MK-201.3:** Panel UI sayaç/şema göstermini DB satır SELECT ile doğrula — tenant context paneli yanıltabilir.
