# CLAUDE — Oturum 214 Log

## Özet
Planlanan estetik cila işine hiç girilmedi; araya ACİL bir iş girdi ve tüm oturum ona
gitti: Cihat süper admin'den gerçek bir firma (ARESMAK) açmak istedi. `admin/yeni-firma.html`
wizard'ı incelendi — çalışıyordu ama alanların anlamı belirsizdi (Hesap Tipi/Plan ne yapıyor,
demo bitiş neden zorunlu görünüyor). Wizard'ın gerçek firma için "boş basamaklı tenant"
riski konuşuldu. Cihat "demo atölyeyi klonlayalım" dedi — daha doğru bir içgüdü. Config
tabloları cerrahi (beyaz-liste) klonlanarak ARESMAK tenant'ı kuruldu, 2 kullanıcı manuel
Auth + kullanicilar insert ile tanımlandı, giriş canlı doğrulandı. Sonra Cihat "projeler
sayfası sahte veri gösteriyor, gerçeğe bağlayalım" dedi; sayfa incelendi (tamamen hardcoded,
DB bağı sıfır), gerçek-veri bağlama patch'i yazıldı/doğrulandı/teslim edildi.

## Akış
1. **Ritüel** — HEAD b1f2b63 (213 kapanış [skip ci]), tree temiz, api=12. Cila park edildi
   (kaybolmadı).
2. **yeni-firma.html teşhisi** — form bozuk değil, 4 adımda gerçek iş yapıyor (tenant+modul+
   feature+davet). Cihat'ın karışıklığı: select'ler tema yüzünden gri görünüyor (disabled
   değil); demo_bitis validate'te ZORUNLU değil (init +30g otomatik dolduruyor); Hesap Tipi/
   Plan bu formda sadece tenants'a etiket, yetkiyi Adım2/3 (modul/feature) belirliyor.
3. **Klon kararı** — wizard yerine Demo Atölye klonu. Şema keşfi: 67 tenant-scoped tablo →
   config vs veri ayrımı. FK haritası: config tabloları yalnız tenants(id)'ye bağlı (aralarında
   bağ yok). rol_sablonlari.yetki_kodu düz metin (gizli ref yok). yetki_bloklari demo'da 0.
   Sayaç değerleri dolu (spool son_no=2224 vb.) → klonda SIFIRLA tuzağı yakalandı.
4. **Klon uygulandı** — dry-run (BEGIN/ROLLBACK, sayı 1·6·5·10·69·7) → kalıcı (otokomit) →
   doğrulama aynı. ARESMAK tenant `9f6fe657...`, kod A, production.
5. **Kullanıcılar** — Auth panel (Add user, Auto Confirm) + kullanicilar insert (on conflict
   do update). Cihat=firma_admin (giriş doğrulandı), Kıvanç=yonetici (şifre SQL ile atandı,
   crypt/gen_salt, pgcrypto). Davet butonu 401 verdi → panel yolu kullanıldı.
6. **giriş testi** — Cihat ARESMAK admin olarak girdi, tam panel açıldı. Kurulum çalışıyor.
7. **Davet/etiket teşhisleri** — "davet bekliyor" etiketi + davet 401. Sorgu: iki kullanıcı
   da auth'ta giriş yapmış (last_sign_in_at dolu) ama kullanicilar.son_giris NULL → etiket
   son_giris'e bakıyor, login onu yazmıyor. Davet 401 = anon anahtar admin API'ye giremez.
8. **proje_liste.html** — tamamen hardcoded (~850 satır <tr>), DB bağı yok, kolonlar tabloyla
   örtüşmüyor. Şema alındı (projeler/devreler/spooller). Gerçek-veri patch'i yazıldı, node
   --check + bütünlük + idempotency doğrulandı, MD5 ile teslim. Ekleme/düzenleme bilinçli
   dışarıda (tersane formu bozuk).
9. **Kapanış** — handoff dörtlüsü. Kod push'u olmadı (patch Cihat'ta push edilecek).

## Kararlar / öğrenmeler
- **Klon > wizard (bu senaryoda).** Çalışan bir tenant'ın config'ini klonlamak, wizard'ın
  boş-basamak riskinden iyi. Ama "klonla" tek buton değil: config vs test-veri ayrımı +
  sayaç sıfırlama + FK/gizli-ref kontrolü şart. Bu üçü doğrulanınca klon güvenli.
- **Config tabloları izole** (yalnız tenants'a bağlı) → id remap zinciri gerekmedi; sadece
  tenant_id çevir + yeni id (default). Bu, klonu basit ve güvenli yaptı.
- **Sayaç tuzağı:** klonda son_no taşınırsa yeni firma demo'nun numarasından devam eder
  (spool 2225'ten). son_no=0 zorunlu; prefix/digits yapısı korunur.
- **Auth != kullanicilar.** Auth kullanıcı (giriş) ve kullanicilar satırı (uygulama kimliği/
  tenant/rol) AYRI. Kullanıcı kurmak = ikisi birden. Panelde Auth + SQL ile kullanicilar.
- **Davet akışı tarayıcıdan çalışmaz** (inviteUserByEmail = service_role). İki sayfada 401.
  Kalıcı çözüm Sıra 8. Şimdilik panel+SQL yolu tek geçerli kullanıcı ekleme yöntemi.
- **son_giris ayrı alan** — Supabase last_sign_in_at ≠ kullanicilar.son_giris. Login akışı
  son_giris'i güncellemiyor; bu hem "davet bekliyor" etiketini hem MK-207.2 dormant tespitini
  bozuyor. Login'de kullanicilar.son_giris=now() yazılmalı.
- **proje_liste bağlama deseni:** hardcoded satırları KALDIR + aynı 12-hücre yapıda dinamik
  üret → mevcut DOM makinesi (filtre/sıralama/export/boş durum) HİÇ değişmeden çalışır.
  Yeniden yazma değil, veri kaynağı değişimi. Düşük risk.
- **UI kolonu ≠ tablo kolonu.** Hardcoded UI, projeler'de olmayan alanları (Başlangıç, Durum)
  uydurmuştu. Gerçeğe bağlarken: Başlangıç=olusturma, Durum=ilerlemeden türet, Tersane=
  ana_yuklenici (tersane_id bozuk), toplamlar=devreler/spooller agregasyonu.

## Teslim edilenler
- ARESMAK tenant + config klonu + 2 kullanıcı (CANLI, DB'de kalıcı).
- proje_liste.html gerçek-veri patch'i (MD5 d484e9e0345ca66fe1ab866a5944be1c) — Cihat'ta
  kopyalanıp PUSH edilecek. Yedek: proje_liste.html.bak.
- Yeni endpoint yok; api/*.js=12.

## Disiplin uygulananlar
- MK-158.1 (DATA→UI→kod): her adımda önce information_schema/SELECT ile veri görüldü,
  sonra dosya okundu, sonra yazıldı. Silme/klon öncesi proje sayıları teyit edildi.
- MK-85.3 (kolon teyidi): tenants/kullanicilar/projeler/devreler/spooller/config kolonları
  information_schema ile alındı; körlemesine kolon adı yazılmadı.
- MK-200.5 (BEGIN/ROLLBACK dry-run → doğrula → COMMIT): klon dry-run'la test edildi, sayılar
  eşleşti, sonra kalıcı yapıldı, tekrar doğrulandı.
- MK-126.8 (yazmadan önce oku): proje_liste tam JS okundu (init/silRow/projeyeGit/filtre/
  export) — makineyi kırmamak için.
- Patch: Python anchor + .bak + ABORT-on-mismatch + MARKER idempotency + node --check +
  bütünlük (grep </html>=1) + MD5. Container'da test edildi, idempotency doğrulandı.
- Kod push'u [skip ci]'siz olacak; kapanış doc'ları [skip ci] VAR. Push öncesi pull --rebase.
