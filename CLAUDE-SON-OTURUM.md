# CLAUDE — 145. Oturum Özeti

**Tek cümle:** B'nin (terfi öncesi BOM kalem rötuşu) DB temeli (`taslak_duzeltmeleri.kalem_idx`) + spool-seviyesi uyumu kuruldu ve canlı doğrulandı; iki miras "borç" (C3 devre-bağı, dirsek normalizasyon) okuma disipliniyle "borç değil" diye çürütüldü — kod yazsaydık çalışan sistemi bozardık.

## Akış
- Açılış: 145-DEVIR + 5 handoff + git pull (temiz, HEAD edaef05, 12/12). Cihat: "ağırdan kolaya, bağlam kopmadan". Sıra A (C3) → dirsek → B.
- **A (C3 devre-bağı):** MK-126.8 okuma zinciri. spooller'da kaynak-izometri FK yok (sadece devre_id). `eslestirme-backfill.js` izometri↔spool'u HER ZAMAN devre-kapsamlı eşleştirir (MK-110.2). (Cihat "backfill iptal etmiştik" dedi → geçmiş arama: iptal edilen `devre-eslesme-yenile.js` mükerrer dosyaydı 129'da, backfill canlı.) Kanıt zinciri: spooller satırı (FK yok) → 40 parse kaydında pipeline geçiyor ama spool UUID hiç yok → AT110-816-027/S01 13 taslak devrede (test kirliliği) → malzeme_flag izi SADECE g230/7ed93033'te → A-001090 (9ce6869a) açıldı → C3 DOĞRU sarı yaktı. **144 "inert" = yanlış spool test yanılgısı.** Sıfır kod.
- **Dirsek normalizasyon:** l2-parser (149-172) ham ağırlık okur, adet-çarpımı yok = doğru. malzeme-kiyas.js (155-190) zaten 3 dallı: boru/dirsek/diğer; dirsek toplam-ağırlık ±%15 (MK-133.3), diğer per-adet (MK-133.2). 6.72 vs 3.57 = %47 = gerçek çelişki. Yapacak iş yok.
- **B:** parse çıktısı yapısı (jsonb spool[0]) → kalemde kod YOK, tanım güvenilmez → kalem_idx (dizi sırası). Migration 100 (Yol A: NOT NULL DEFAULT -1, tek tam 6-kolon unique). Dry-run → COMMIT. Wizard 3-nokta uyum fix. Canlı test (DB kanıtı: kalem_idx=-1, toast ✓).

## Kararlar (MK-145.1..4) — son-durum.md'de tam
- 145.1 kalem anahtarı = kalem_idx (dizi sırası; kod yok, tanım güvenilmez).
- 145.2 Yol A: kalem_idx NOT NULL DEFAULT -1, tek tam unique (PostgREST onConflict garantili).
- 145.3 C3 doğru (144 "inert" = yanlış spool); D borcu = test kirliliği artefaktı.
- 145.4 dirsek/ağırlık çelişkisi gerçek-pozitif, normalizasyon borcu DEĞİL (K2 zaten doğru).

## Kanıt / yöntem
- Hiçbir kod körlemesine yazılmadı. İki "borç" maddesi de SQL+kod okumayla çürütüldü ÖNCE.
- C3 teşhisi: spooller şema + örnek satır + 40-kayıt pipeline taraması + 13-devre listesi + flag-izi devre sorgusu + canlı ekran. Tahmin değil.
- Migration 100: BEGIN...ROLLBACK dry-run (satır sayısı korunumu) → COMMIT → constraint teyit.
- Wizard: 10 script blok new Function denetimi (0 hata) + canlı DB doğrulama (taslak_duzeltmeleri SELECT, kalem_idx=-1).

## Hatalarım
- İki miras teşhisi ("C3 kod gerekiyor", "dirsek normalizasyon borcu") okumadan doğru sansaydım yanlış olacaktı. Ders: borç listesini de kanıtla doğrula.
- Kalem anahtarı: önce kalem_kod önerdim (Cihat onayladı), parse'ta kod olmadığını sonra gördüm → kalem_idx. Ders: anahtardan önce hedef veri alanlarını gör.
- spool_detay 4-numara: "FK NULL" dedim, SQL FK DOLU gösterdi. Tahminden önce SQL.
- Bir noktada migration SQL'ini açıklarken fazla uzattım (Cihat "niye bu kadar karışık anlattın"). Ders: adım sayısını az tut.

## 146 ana iş
A: B'nin kalanı — kalem-seviyesi rötuş UI (malzBody satır ✏️ + kalem upsert/overlay kalem_idx>=0 + terfide aktar'a taşıma). Temel hazır. Sonra spool_detay kütüphane-tıklama bug, C4 downstream damga.
