# Oturum 130 — Parser & Yükleme Akışı belgesi + tetikçi/montaj tam teşhisi (kod yok, bilinçli)

**`docs/PARSER-VE-YUKLEME-AKISI.md` yazıldı** (8 kaynak dosya birebir okunarak, kod yazmadan).
Ardından Cihat'ın tetikçi testi + montaj sorunu canlı SQL + kod ile **tam teşhis** edildi. İki
problem de mekanik bug değil mimari karar çıktı — K1-K5 alındı. Kod, "gereksiz risk + bağlam
doluluğu" gerekçesiyle bilinçli olarak 131'e bırakıldı (Cihat'ın açık uyarısıyla).

## Bağlam

- Açılış: git temiz, HEAD `f557669`, CI yeşil (129 deploy Ready). Function 12/12 (MK-129.3 teyit).
- Yüklenen `KARARLAR.md` **bayat** (MK-74.3'te kalmış, oturum ~61 dönemi). Bayrak kaldırıldı;
  MK atıfları omurga v3.1 (Bölüm 17) + canlı kod yorumları + 129 devir dosyalarından alındı.
  Belgeyi bloklamadı.

## Yapılanlar (sırayla)

1. **8 reading-order dosyası okundu:** OMURGA v3.1 (iskelet), excel-parser.js (L1/L2 + özet filtre
   + sayfa seçimi), izometri-oku.js (format tanıma 4 fingerprint sinyali + L1/L2/L3 + halüsinasyon
   filtresi + L3 prompt POAR/AVEVA), kuyruk-isle-izometri.js (eslestir/montajEslestir/bindir +
   dosyaAdiParse regex + "PIPELINE KAYNAGI=DOSYA ADI" satır 458), ares-kabuk.js (grupla/aktar),
   ares-normalize.js, devre_wizard.html v2 (autoDetect/parserBul/excelBomMu).

2. **`docs/PARSER-VE-YUKLEME-AKISI.md` yazıldı** — 8 bölüm: kuşbakışı (5 katman), klasör yükleme
   akışı, kabuk türetme, PDF sömürme (L1/L2/L3), **çapraz doğrulama (Katman 3 — eksik, belgenin
   kalbi)**, operatör onayı, kayıt şeması, MK atıf haritası. MK-61.4: sahip (Cihat+Claude) +
   tazelik penceresi (3 oturum) başlığa kondu.

3. **Mockup v5 + genel program metni değerlendirildi:** Mockup = v3 İnceleme & Onay hedefi
   (step1 Devre&Belgeler → step2 4-sekme + 4-durum rozetleri + kaynak rozetleri xl/l2/l3 + çapa +
   düzelt/onay overlay). Cihat'ın "v2'yi giydiriyoruz" çerçevesine düzeltme: giydirme = **v3 inşa,
   v2 modüllerini çağır, v2'ye dokunma** (MK-127.2). "Fonksiyon-önce" bir hata değildi; tuzak
   v2'yi yerinde boyamak olurdu.

4. **Faz 0 — Tetikçi testi teşhisi (devre `7702313c`):**
   - Sahte PDF `AT110-816-026 1(2).S01.1.pdf`: `format_ipucu:null` → L3 → `bindir` çelişki yakaladı
     (`et 6.55/6.3 flag`, `cap 141.3/219.1 flag`, `celiski_et_cap_farkli`), `bindirme_flag:true`,
     kuyruk `manuel_onay` (diğerleri `oneri_hazir`).
   - **"Hiç okumadan kabul etti" iddiası yanlış** — DB seviyesinde yakaladı. Gerçek bug: (a)
     çelişkiye rağmen `spool_id` + `kismi`, (b) malzeme kıyası yok (boyut tutsaydı kaçardı),
     (c) flag UI'da yok. `bindir`'in çalıştığı bağımsız teyit: `de0dbbdf` S04 `cap 114.3/76.1 flag`.

5. **Faz 0/1 — Montaj teşhisi (UI bug DEĞİL):**
   - Tüm devrelerde `montaj_dali=false`, `montaj_json=null`.
   - `spool_detay.html:1262` montaj okuma yolu **doğru** (`montaj_json.kaynak_dosya` → devre_id +
     dosya_adi). Boş çünkü montaj_json hiç yazılmadı.
   - **Kök sebep: montaj tespiti yalnız L2'de.** `lib/l2-parser.js` montaj_modu `{ok, montaj:{}}`
     döner (izometri-oku 905-910); **L3'te montaj kavramı yok** (YAKLASIM_Y_PROMPT sadece spoollar).
     S-segmentsiz genel/montaj PDF'ler format tanınmadığı için L3'e gitti → montaj asla set olmadı.
   - `montajEslestir` doğru kurulu: `montaj_json.kaynak_dosya` yazar, 1 montaj → N spool eşler
     (K4'ün "ilgili spool'larda görünsün" davranışı hazır). Eksik: L3'te montaj tanınması.

6. **K1-K5 kararları (Cihat onayı):** Bölüm 8 / son-durum'da tablo.

## Yeni MK adayları (131'de KARARLAR'a — güncel dosya yüklenince)

- Çelişkili eşleşme yine de `kismi` yapıyor; karar K1 = İnceleme'de uyarı (enum değişmez).
- Montaj tespiti L3'te yok = açık mimari boşluk; K4 yol kararı (2 vs 1) bekliyor.
- KARARLAR.md repo'da güncel mi? (Yüklenen bayat çıktı — 131'de doğrula.)

## Kararların gerekçeleri (kayıt)

- **K2 netleşmesi kritik:** malzeme her hâlükârda PDF'ten okunmalı (L3 `malzeme_listesi` zaten
  üretiyor, hiç kullanılmıyor). Excel varsa kıyas, yoksa kaynak. Bu, K2'yi "sadece doğrulama"dan
  "veri kaynağı + doğrulama"ya genişletir.
- **K4 yol 3 elendi:** Cihat "içi okunarak eşleştirilmeli" dedi → sınıflandırma-seviyesi (içerik
  okumayan) çözüm yetersiz. Kalıcı = format öğret (L2), evrensel = L3 montaj.

## Süreç notu

Sağlıklı oturum. Cihat "kapatmak için erken değil mi, ama bağlamına göre riske girme, erken de
bitirme" diyerek net bir denge çizdi. Faz 1'e geçtik (montaj teşhisi tamamlandı = gerçek ilerleme),
kod yazmadan durduk (montaj kod = izometri-oku MK-49.1 ya da format öğretme, ikisi de karar + taze
bağlam isteyen iş). Belge canlı-veri kanıtıyla mühürlendi. Bağlam dolmadan temiz kapandı.

---

> 131 açılışında: bu dosya + son-durum + CLAUDE-SONRAKI-OTURUM + PARSER-VE-YUKLEME-AKISI Bölüm 8 +
> omurga v3.1. İlk iş: K4 montaj yol kararı (2 vs 1).
