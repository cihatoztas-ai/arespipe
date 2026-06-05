# AresPipe BRIEFING — 154. Oturum Kapanışı

> **Tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> İlerleme aynası: docs/WIZARD-YOL-HARITASI.md (154 işaretleri işlendi).

## HEAD
- `e7cd787` feat(154): W-2.7 İşlenenler sekmesi (+ `1e89804` W-2.13 yetim önleme, araya CI raporu girdi → pull --rebase ile çözüldü).
- **DB:** migration YOK. Endpoint YOK (12/12). Veri onarımı: 356 yetim kuyruk işi 'iptal' + 20 test taslağı silindi.

## 154 — yapılanlar (yapısal öncelik kararı: format işleri ERTELENDİ, sistem iskeleti tamamlandı)
1. **W-2.13 KAPANDI (canlı kanıtlı):** onay havuzunun %32'si (350 iş) silinmiş/taslak devrelerin
   yetimi çıktı → veri onarımı (356 iş 'iptal', hata_mesaji etiketli) + 20 taslak koloni silindi.
   Kod: wizardIptal → `_taslakIptalEt` çekirdeği (soft-delete + silinme_tarihi + kuyruk temizliği;
   'isleniyor' yarış koşulu nedeniyle HARİÇ — MK-154.2) + drenaj ikinci savunma hattı (silinmiş
   devrenin işi hiç alınmaz, konsola yazılır). Canlı test: 2 devre × 3 iş iptale çekildi, birebir.
2. **W-2.6 ÇÖZÜLDÜ (B kararı / MK-154.1):** işleniyor/hazır KOLON DEĞİL, kuyruktan türetilir.
   Migration sıfır, senkron borcu sıfır. CHECK zaten taslak/aktif/iptal tutuyordu (138 mirası).
3. **W-2.7 GEMİDE (canlı kanıtlı):** İşlenenler — wizard panel 3 + stepper girişi + devreler.html
   rozetli buton (v3 flag'iyle, ?sekme=islenenler). Türetilmiş durum satırları + öneri/manuel
   sayaçları (dar kapsam) + İncele→taslagiAc + satır iptali + **"Bekleyenleri işle" = global
   drenajın kalıcı UI yüzü** → konsoldan koşturma devri bitti (W-1.2 de [x]).
4. **W-2.8 zaten sıralıymış:** kod okuması — onayEt zaten terfi→backfill→toast→otomatik devre_detay.
   Paralel "görüntüle" butonu yok. Kod değişmedi, harita [x].
5. **W-4.6** drenaj JS no-cache ✓ · **W-4.7 cevaplandı:** 3 IFS xlsm yetimmiş (excel hattı tetiksiz
   değildi) → bekliyor=0.
6. **W-2.11 KARARI = A:** devre_detay ?taslak=1 kipi (filigran + yazma kilidi, render'a dokunulmaz).
   Kanıt: hgtrghh taslağını sayfa sorunsuz açmıştı. UYGULAMA 155 ana işi.

## Bulgular
- "Aktif hayalet" (153 bulgusu) DOĞRULANMADI: 138/A filtresi zaten çalışıyordu; hgtrghh aktif değildi.
  Sorun yalnız kuyruk yetimleriydi.
- devreler.html ~1294 stat sayacı `select('id',{count:'exact'})` filtresiz görünüyor — taslak+silinmiş
  kayıtlar stat pill'i şişiriyor olabilir. 155'te bakılacak (kod kanıtı yok, sadece şüphe).
- MK-153.3 hâlâ açık: yukleyen_id NULL INSERT atan akış meçhul (yeni vaka görülmedi).
- MK-85.3 yine ders verdi: devreler'de created_at yok (olusturma); hata_mesaji tahmini şanslı tuttu.

## MK (KARARLAR.md'ye)
- **MK-154.1** Devre işleme durumu (işleniyor/hazır) kolonda tutulmaz, kuyruktan türetilir — tek
  doğruluk kaynağı dosya_isleme_kuyrugu; senkron kodu yazılmaz.
- **MK-154.2** Taslak iptali = soft-delete (silindi+silinme_tarihi) + terminal-olmayan kuyruk işleri
  (bekliyor/oneri_hazir/manuel_onay) 'iptal'; 'isleniyor' yarış koşulu nedeniyle dokunulmaz,
  'tamamlandi' tarihsel kayıt. Çekirdek `_taslakIptalEt` — kopyalanmaz, çağrılır.

## KUYRUK SON DURUM (son ölçüm + kanıt turu)
oneri_hazir=690 · tamamlandi=367+ · iptal=356+ · manuel_onay=263 · hata=1 (Donatım, beklenen) ·
**bekliyor=0**. Gerçek onay havuzu ilk kez net: ~953 iş — onay UI akıbeti hâlâ tasarlanmadı.

## 155 ANA İŞ
1) **W-2.11/A uygulaması:** devre_detay.html ?taslak=1 kipi — taslak görsel dili (W-2.12: filigran/
   rozet) + yazma işlemleri kilidi. Read-before-write: devre_detay'ın yazma noktaları envanteri önce.
2) **MK-153.3 av turu:** yukleyen_id NULL INSERT atan akışın tespiti (grep + muhtemel tek satır fix).
3) Küçükler: devreler.html stat sayacı filtre şüphesi · manuel_onay 263 + oneri_hazir 690 onay UI
   tasarım tartışması · (ertelenmiş format işleri: W-3.9 panzehiri + Y200 satır öğretimi → W-1.6).

## NEREDEYIZ — ÖZET
Faz 1 TAM kapandı (W-1.2 son parçaydı). Faz 2'nin omurgası kuruldu: durum türetme (W-2.6) +
İşlenenler (W-2.7) + iptal hijyeni (W-2.13) canlı; sıra taslak önizlemede (W-2.11/A → 155).
Format/kanıt işleri (W-1.6, W-3.9) bilinçli ertelendi — yapısal öncelik kararı (Cihat, 154 açılışı).
