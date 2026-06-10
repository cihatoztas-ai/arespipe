# CLAUDE-SON-OTURUM.md — Oturum 176 özeti

## Ana tema
Terfi-sonrası izometri eşleştirme (129/130 borcu) **gerçek kökünden** kapatıldı: backfill TIMEOUT.
Yan kazanım: Faz 2 DATA ile gereksiz çıkıp kapatıldı (boş kod yazılmadı).

## Yapılanlar
1. **Faz 2 kapatıldı (MK-176.1).** Sıradaki "büyük iş" sanılan Faz 2 (çelişki kazananı), DATA ile
   ele alındı: excel-generic 184/184 referans, manuel-flip 0 vaka. `bindir` mevcut davranışı (kabuk
   kazanır + flag) %100 doğru. "İki ıraksak yol" kurmak yerine kapatmak doğru karar (MK-158.1 kazanımı).
2. **Cihat'ın devre_detay "Onay Kuyruğu" sorusu → kök teşhise dönüştü.** "Canlı devrede tekrar onay
   mantıksız" → incelendi: izometri verisi zaten canlı (eslestir yazıyor), Kapat=sadece durum geçişi;
   ama 228+ kuyruk birikmesinin sebebi → terfi backfill TIMEOUT → izoHata → auto-close atlanıyor.
3. **Backfill 4 iterasyonla sağlamlaştırıldı (MK-176.2/3/4):** sayfalama → kabuk-cache → budget-girişten
   + batch=40. Her adım ÖLÇÜME dayalı (MK-158.1/132.1), tahmine değil. Kanıt: 356 PDF, 8 tur, timeout YOK,
   spooller bekliyor→0.
4. **Wizard terfi client-loop (MK-176.5)** + **devre_detay recovery butonu (MK-176.6).** Recovery canlı
   test geçti (kfukfuyk: oneri 311→0, tamamlandi 3→314).

## Yöntem / disiplin (bu oturumda işe yarayanlar)
- **MK-158.1 (DATA→UI→code) iki kez kurtardı:** (a) Faz 2'yi koda girmeden DATA gereksiz gösterdi;
  (b) timeout teşhisinde her hipotez SQL/curl/`time` ile doğrulandı — "deploy yarışı" iki kez yakalandı
  (yeni JSON alanları eski koda düşmüyor → push'tan saniyeler sonra curl eski sürüme gidiyor).
- **MK-132.1 (gerçek pipeline çalıştır):** backfill'i curl'le canlı koşturmak, "sayfalama yeter mi"
  tahminini çürüttü (yetmiyordu, kabuk-cache + budget-fix gerekti). Test devresinde (mutasyon serbest) ölçüldü.
- **MK-126.8 (önce oku):** her patch öncesi `eslestir`/`montajEslestir`/terfi/onayTopluKapat birebir okundu;
  ctx'in drenaj yolunu bit-aynı koruması, `_tkKilit`'in aktif devrede tetiklenmemesi koddan teyit edildi.
- **MK-109.1 korundu:** `eslestir` shared, ctx OPSİYONEL — ctx yoksa eski 3 SELECT aynen koşar; drenaj
  davranışı değişmedi. Importerlar (kuyruk-isle, devre-inceleme) etkilenmedi.
- HTML yamaları: str_replace + inline JS çıkarıp `node --check` (raw HTML değil). JS dosyaları `node --check`.
  MD5 doğrulamalı `arespipe_kopyala`.

## Cihat'ın kritik müdahaleleri
1. "Onay kuyruğunu kaldırmayacak mıydık?" → mimari netleşti: kaldırma kararı yoktu; rahatsızlık BUG'dı,
   düzeltildi. Sağlıklı devrede zaten görünmüyor.
2. "Wizard düzenleme ekranını spool_detay'da göstersek?" → MK-176.7, sonraki oturumun ANA konusu olarak
   yakalandı (kapsam araştırması gerek, aceleye getirilmedi — IS2 deseni).
3. Terminal disiplini: `dquote>` takılması (yapıştırma tırnak kazası) → kısa, tireli commit mesajları + tek-tek komut.

## Tuzaklar / öğrenmeler
- **Deploy yarışı:** push sonrası ~90sn beklemeden curl = eski sürüm. Yeni JSON alanı (`son_id`/`bitti`/
  `kesildi`) varlığı, hangi sürümün serviste olduğunun en kesin işareti.
- **Vercel budget guard fetch'i saymalı:** zaman bütçesi fonksiyon GİRİŞİNDEN ölçülmeli; ağır JSONB
  fetch'i wall-clock'u yer, fetch-sonrası başlatılan budget 60sn tavanını aştırır.
- **Küçük batch yanıltıcı benchmark:** ctx kabuk ön-yüklemesi (tüm devre) küçük batch'e bölününce
  amortize olmaz → cache haksız yere kötü görünür. Gerçek test = tam drenaj.

## Karar günlüğü
KARARLAR.md'ye MK-176.1-7 + bekleyen **MK-169/170/171 boşluğu** (koddan türetilerek dolduruldu).
