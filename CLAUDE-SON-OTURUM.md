# CLAUDE — Son Oturum Özeti (182)

## Yapılan iş
PAOR/AVEVA L3 spool-bölme okumasını paylaşılan kabuk→incele→terfi hattına bağladım. ÜÇ kod parçası, ikisi commit'li:
1. **Matcher fix** (commit `3ec8f4e`): PAOR dosya-adı deseni + spool normalize.
2. **#2a wizard aktivasyon** (commit `3ec8f4e`): L3 açıkken PAOR fab PDF L3 yoluna.
3. **Pozisyon-bazlı düzeltme** (bu oturum son commit): matcher kimliği array-index'ten (canlı veri keşfi sonrası — aşağı).

## En önemli ders: "test etmeden #2b'ye geçelim" → canlı veri matcher'ı çürüttü
Cihat #2b'ye test dosyasız geçmek istedi. Test dosyası yoktu ama **mevcut 3616 batch kaydı** vardı. SQL ile şekli kilitlerken üç sessiz hata yakalandı (canlı testte değil, şema-keşfinde — MK-158.1 DATA→UI→kod):
- **L3 `spool_no` GÜVENİLİR KİMLİK DEĞİL.** 4 format varyantı (`[1]`/`1`/`S01`/`S03_1`) + **9 kayıt çakışan no** (`[1]/[1]`, `S01/S01`: L3 iki spool'a aynı no vermiş). Metin-normalize çakışanı tek anahtara indirir → ikinci spool birinciyi ezer (B-6 sessiz kayıp). → Kimlik POZİSYONA çevrildi (idx0→S01). MK-182.2-DÜZELTME.
- **Malzeme yeri KAYIT-BAZLI**, "hep pipeline-seviyesi" yanlış. Kimi kayıt malzemeyi yalnız spool[0]'da (s1=0), kimi her spool'da tam (s1=11) tutuyor. → #2b malzemeyi kayıttan türetmeli. MK-182.5.
- **Kapsam dar:** 2862 kayıt 1-spool (#2a yeter), yalnız ~34 çok-spool (gerçek #2b), 754 sıfır-spool (ayrı kategori). MK-182.6.

## Pozisyon-bazlı fix (uygulandı, node --check + 7/7 varyant testi)
`DOSYA_DESENLERI` PAOR satırı `sp_kaynak:'pozisyon'`. `eslestir` (kuyruk-isle-izometri.js) + devre-inceleme eşleştirme döngüsü index'li: PAOR'da `spoolHam='S'+(idx+1)`, L3 `spool_no` yok sayılır. `else` dalı = Tersan, BİREBİR değişmedi (regresyon yok). 7/7 varyant (çakışanlar dahil) benzersiz S0n. MD5: kuyruk `0a65b39b...`, devre-inceleme `f125c676...`.

## Mimari netleşme (181 handoff düzeltmeleri)
- "PAOR L3 iptal/kopuk" YANLIŞ — batch'te çalışıyor (0 hata). "İptal" = devre-eşleştirme silosu, batch değil. (MK-182.1)
- "Pipeline dosya adında yok" YANLIŞ — var (`52600-102773`); eksik olan dosyaAdiParse deseniydi. (MK-182.2)
- Revert boşluğu YOK; MK-181/169/170/171 sağlam; borç 117 düzeltilmiş.

## Test edilmedi (test dosyası yoktu) — 183'te toplu test
Mantık + sözdizimi + canlı-veri-şekli doğrulandı, ama uçtan-uca CANLI test EDİLMEDİ.

## Disiplin
Server JS: `node --check` + MD5 `arespipe_kopyala`. HTML (wizard): anchor-Python patch. `izometri-oku.js` + `paor.js` dokunulmadı. Kod commit'leri `[skip ci]` YOK.
