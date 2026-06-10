# son-durum.md — Oturum 176 kapanışı (HEAD eab6532)

## Özet
**Terfi-sonrası izometri eşleştirme borcu (129/130) gerçek kökünden kapatıldı.** Önce Faz 2
(Excel↔PDF çelişki kazananı) DATA ile gereksiz bulunup kapatıldı; sonra Cihat'ın devre_detay
"Onay Kuyruğu" sorusu, kuyruğun temizlenememesinin **terfi-sırası backfill TIMEOUT'u** olduğunu
ortaya çıkardı. Backfill sayfalandı + kabuk-cache + budget-sağlamlaştırma yapıldı; wizard terfi
client-loop'a çevrildi; devre_detay'a recovery butonu eklendi. Canlı test geçti.

## Yapılanlar (sırayla)
1. **Faz 2 KAPATILDI (MK-176.1):** excel-generic 184/184 referans (L1/95), manuel-flip 0 vaka.
   Mevcut `bindir` (kabuk kazanır + flag) %100 doğru. Kod yazılmadı.
2. **Kök teşhis (MK-176.2):** devre_detay Onay Kuyruğu 228+ → DATA: 14 aktif devre / 1127 açık kuyruk.
   spooller 206 bekliyor / 19 kısmi; %70 atanmamış (çoğu BAYAT). Backfill curl → `FUNCTION_INVOCATION_TIMEOUT`.
   Ölçüm: non-kuru ~1.3sn/kayıt, 356 kayıt > 60sn → timeout → izoHata → auto-close atlanıyor (domino).
3. **Backfill sayfalama (MK-176.2, PUSH e9f28e1):** keyset imleç + batch + budget + `son_id`/`bitti`.
4. **Backfill kabuk-cache (MK-176.3, PUSH ced2672, 2 dosya):** `kabukYukle` export + `eslestir`/`montaj`
   opsiyonel `ctx`. ctx yoksa drenaj BİT-AYNI (MK-109.1). Promote sonrası bellek cizim_durumu güncel.
5. **Backfill budget+batch (MK-176.4, PUSH 7803420):** `_t0` fonksiyon girişinde, BUTCE 40s, batch 40,
   montaj NaN guard. **Kanıt:** kfukfuyk 356 PDF → 8 tur, timeout YOK, spooller bekliyor→0.
6. **Wizard terfi client-loop (MK-176.5, PUSH c51ad31):** tek-fetch → loop, izoHata→auto-close kökü kapandı.
7. **devre_detay recovery butonu (MK-176.6, PUSH eab6532):** "↻ İzometriyi yeniden eşleştir".
   **Kanıt:** kfukfuyk önce oneri 311/manuel 45 → sonra tamamlandi 314/manuel 45/oneri 0.

## Canlı durum
- HEAD = eab6532, origin/main senkron, working tree temiz. **Fonksiyon: 12/12** (yeni endpoint yok).
- Değişen dosyalar (4): api/eslestirme-backfill.js, api/kuyruk-isle-izometri.js, devre_wizard_v3.html,
  devre_detay.html.
- kfukfuyk (P26-227, test devresi) temiz: spooller hepsi kismi, kuyruk oneri_hazir 0.

## Açık (sonraki oturum)
- **13 kirli devre kaldı:** recovery butonu her birinde tek tek çalıştırılmalı (kfukfuyk hariç 13).
- **B testi yapılmadı:** yeni devre terfi → wizard loop canlı doğrulama (A geçti, B'nin de geçmesi olası).
- **MK-176.7 (ana sonraki konu):** Onay Kuyruğu yerine wizard İnceleme ekranını spool_detay/devre_detay'da
  göster (Cihat fikri). Kapsam araştırması gerek — kod yazmadan önce devre-inceleme.js taslak-dışı bağlam
  + spool_detay.html.
- Recovery i18n: 4 anahtar × 3 dil eksik (`dv_onayk_recovery`, `_calisiyor`, `_hata`, `_ok` — şu an TR fallback).
- `1 1/4"` boşluklu-kesir bug (ares-olcu.js, düşük öncelik, 175'ten).
- Gece cron (03:00) hâlâ ispatsız.
- Backfill throughput follow-up (opsiyonel): `_eslesme` writeback re-read'ini okuJson'dan türetip atla.

## Dosya md5 (bu oturum, push edilmiş)
- api/eslestirme-backfill.js   = 7d54016fdbb80de63c6d7afb77269c2f
- api/kuyruk-isle-izometri.js  = 6ab41f02de523a133fee1608471d52da
- devre_wizard_v3.html         = f74e12469366b69c13784c588d428a96
- devre_detay.html             = 3db37a83ffcd5870de0b0bef85f3af5d
