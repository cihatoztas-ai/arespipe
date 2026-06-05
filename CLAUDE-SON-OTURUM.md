# CLAUDE-SON-OTURUM.md — Oturum 159 özeti

## Tek cümle
İş emri numarası terfiye taşındı ve sayaç matematiğiyle canlı kanıtlandı (taslak/iptal artık
numara yakmıyor, P26-218=bcmbvö); NOT okuma "koptu" şüphesi format-bazlı SQL + KISMI/imalat_not
ekran kanıtıyla kapandı; profesyonel araç kıyası "çelişki yok, ters istikamet + 4 konumlanmış
boşluk" sonucunu verdi ve Cihat'ın iki cümlelik teşhisi (zayıf satır düzenleme + format yönetim
mantığı) spool modalı zenginleştirmesi (PDF'i aç + Malzemeler köprüsü) ile 160'ın ana işini
(FORMAT YÖNETİM MİMARİSİ) doğurdu.

## Kanıt zinciri (oturumun omurgası)
1. Migration 101 dry-run ihlal=0 → COMMIT → is_nullable=YES. Ön-kontrol SQL: constraint envanteri
   + sonraki_no RPC tanımı (atomik UPDATE…RETURNING) + durum dağılımı (numarasız 0) — CHECK kararı
   veriye dayandı.
2. Sayaç turu: taslak açma 217→217 · iptal sabit · terfi 217→218 · P26-218 aktif listede 1. satır
   (bcmbvö) · eski taslak P26-216 koruyarak terfi, sayaç sabit. "216 < 218 sonra canlıya girdi"
   itirazı tasarım sohbetine döndü → kural istisnasızlaştırıldı (kalan taslaklar NULL,
   sifirlanan=1 dry-run; COMMIT teyidi 160'a).
3. NOT taraması: ilk SQL şablonu `is_tipi` kolon varsayımıyla patladı → şema KODDAN okundu
   (parser='izometri', spoollar[] spool-başına, format top-level) → düzeltilmiş LATERAL sorgu:
   İmalat 515/555 not_var / Montaj+PAOR 0 (yapısal). Ekran: KISMI rozeti + QR'da iki personel
   uyarısı — mekanizma uçtan uca canlı.
4. Modal işi read-before-write turu BÜYÜK tasarruf çıkardı: 146/B kalem rötuşu (UI + upsert +
   aktar.kalemDuzeltmeler) ZATEN TAMDI — iş "yeniden yaz"dan "iki köprü kur"a indi (PDF'i aç +
   Malzemeler→kalemDuzeltAc). Canlı görünüm ekran kanıtlı; tıklama testleri 160'a.
5. Çapa stub kaldırıldı — Cihat kararı: görsel okuma format_tanit'te (ayrı modül, tek altyapı,
   çift taraflı); wizard'a ikinci PDF görüntüleyici gömülmedi.

## Süreç dersleri (159)
- **MK-159.3:** Devir hafızası eskiyebilir; kod gerçeği > devir kaydı (146/B vakası). 158'in
  "taze teşhis ≠ doğru teşhis" dersinin ikizi: "eski borç kaydı ≠ hâlâ borç".
- SQL şablonu kolon varsayımı bir kez daha yaşandı (is_tipi) — MK-126.8: kuyruk şeması koddan
  doğrulanmadan sorgu yazılmaz. Hızlı telafi: select/filtre kolonları api/*.js grep'iyle çıkarıldı.
- "Bence olmadı" itirazlarında önce TASARIMI hatırlat, sonra kuralı kullanıcının istediği yöne
  netleştir: 216-vakası bug değildi (eski taslak koruması tasarımdı) ama Cihat'ın "numara = terfi
  sırası, istisnasız" tercihi daha temiz kuraldı — veri temizliğiyle (NULL) benimsendi, kod
  değişmedi.
- Profesyonel kıyas web kanıtıyla yapıldı (Hexagon/Spoolgen/SpoolFab): PCF-merkezli dünya ile
  PDF-tersine-mühendislik konumlanması ayrıştırıldı; 4 boşluk Cihat cevaplarıyla UFUK'a işlendi.

## Dosyalar (159)
devre_wizard_v3.html (1840→1907: iş emri null+terfi üretimi · PDF'i aç · Malzemeler köprüsü ·
çapa temizliği; son MD5 2a4a6d973cb1221fbd844303315b1933) · devre_detay.html (3294→3295:
TASLAK_KIP "Terfide üretilecek"; MD5 e378eeece9d22b7700501c631b90240b) · lang/tr+en+ar.json
(dv_is_emri_terfide) · migrations/101_is_emri_terfide.sql. 3 kod commit (+159c teyit bekliyor) +
kapanış doc. izometri-oku DOKUNULMADI. 12/12 ✓.

## Kapanış durumu
Ana iş 1 ✓ (canlı kanıt) + ana iş 2 ✓ (SQL+ekran kanıt) + modal zenginleştirme gemide (tıklama
testi açık). Açık: 159c commit teyidi · taslak NULL COMMIT teyidi · KARARLAR.md MK-157/158/159 ·
160 = FORMAT YÖNETİM MİMARİSİ. Test yatağı: g200 + aw231 korunuyor; NB1137 chvvnb taslağı modal
testleri için ideal (3 kalemli S01).
