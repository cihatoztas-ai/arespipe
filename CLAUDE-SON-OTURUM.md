# CLAUDE-SON-OTURUM.md — Oturum 152 özeti

## Tek cümle
İçerik-öncelikli fingerprint gemiye bindi (fn kimlikten hızlandırıcı/tie-breaker'a indi, tablo_baslik 4. sinyal,
içerik gate + içerik-dedup, mekanik kanıt 5/5), AI-oku'nun 150 kalıntısı kip-dönüşü ve kural-ezme bug'ları
düzeltildi, tablo motorunun İLK kural kaydı canlıya indi (cadmatic_spool_nps_v1, satir_tipleri=2); canlı turda
3-3 kardeş-format beraberliği ve schedule-körü yanlış-et bug'ı (3.68≠2.77) saha kanıtıyla belgelendi — final
kanıt (taze Y100 → et 2.77) cache engeli yüzünden 153'e devredildi.

## Kilitli kararlar
1. **fn rolü netleşti (MK-152.1):** kimlik İÇERİK, fn = hızlandırıcı + kardeş-format tie-breaker'ı. 3-3
   beraberlik teorik değil — taze S03/S04 turunda e1fb879d kazandı, fn `^Y\d+-\d+-\d+\.S\d+` ile çözüldü.
2. **Düzeltme-kipi tablo patch'i kabul_kriterleri'ne dokunmaz:** aynı format birden çok notasyon ailesine
   hizmet edebilir (M=ODxet, Y=NPS+Sch); min_malzeme_satir yükseltmek öğretilmemiş aileyi L3'e geriletirdi.
3. **Erteleme istisnası (Cihat onayı, plan A):** tek kural kaydı yapıldı — zinciri uyandırmak + canlı
   doğrulama borcu için. Seferberlik hâlâ ertelemede (Faz 2 tetikler bağlanınca).
4. **MK-117 ayrı iş değil:** iki-kuyruk teşhisi yukleyen_id borcunu Faz 2 tetik paketinin içine yerleştirdi.

## Süreç dersleri (152)
- **Kendi kuralını çiğneme bedeli:** iki kez şema/anahtar tahmini yaptım (maliyet/dosya_adi kolonları;
  `?` operatörü null tuzağı) — ikisi de MK-85.3'ün kapsamı, ikisi de sorgu çıktısıyla yakalandı. JSONB
  doluluk denetimi artık `->>` ile (MK-152.2).
- **Test kırmızısı = testin işi:** test-fingerprint-icerik ilk koşuda 2 kırmızı verdi; kök neden testin
  uydurduğu ipucu alan adıydı (producer/creator). Gerçek koddan okumadan yazılan fixture yanıltır.
- **"Yapıldı sanılan" kontrolü:** MK-49.B bileşenini gömülü sandım, kullanıcı "öyle bir sekme yok" dedi;
  kanıt zaten elimdeydi (grep'te batch endpoint'lerini çağıran HTML yok). Plan ↔ gerçek ayrımı için grep şart.
- **Excel export = bedava saha kanıtı:** batch çıktısındaki 3.91/3.68 et değerleri Sch40-körü fallback'i iki
  ayrı turda belgeledi; Excel'in 2.77'si ground-truth görevi gördü ("Excel'i sömür" felsefesi kendini doğruladı).

## Dosyalar (152)
format_tanit.html (785→~800: fingerprint UI+gate+dedup, köprü, AI-oku fix) · test-fingerprint-icerik.mjs (YENİ).
DB (veri UPDATE): a093eaaa fingerprint{baslik, tablo_baslik, fn-tiebreaker} + format_kodu + parser_kural.malzeme_tablosu{satir_tipleri:2}.

## Kapanış durumu
0bac952 HEAD, CI yeşil, 12/12 ✓. a093eaaa routing'de 4 sinyalli (Y-spool dosyalarında +5 ile kazanır), tablo
kayıtlı ama **schedule zinciri final kanıtı bekliyor** (taze dosya yok — cache hit zinciri test ettirmiyor).
dosya_isleme_kuyrugu'da 100+ tetiksiz bekleyen duruyor (bilinçli — tahliye Faz 2/153).
