# son-durum.md — Oturum 154 (2026-06-05)

## Bu oturumda ne yapıldı
1. **Yapısal öncelik kararı (Cihat, açılış):** format işleri (W-3.9 + Y200 öğretimi → W-1.6 kanıtı)
   ERTELENDİ; oturum sistemin iskelet eksiklerine ayrıldı.
2. **W-2.13 KAPANDI — yetim keşfi + onarımı:** envanter sorgusu onay havuzunun %32'sinin
   (oneri_hazir'ın 319/1011'i) taslak/silinmiş devrelere ait olduğunu gösterdi. Onarım (MK-153.2
   tek-statement disipliniyle, kademeli): 294 silinmiş-devre yetimi → 'iptal'; 20 taslak test
   kolonisi (klavye-ezmesi, 0 spool) silindi → 44 işi daha 'iptal'; toplam 356, hepsi
   hata_mesaji='yetim: devre silinmis (154 onarimi)' etiketli. tamamlandi'lara DOKUNULMADI.
   **bekliyor 3→0: IFS xlsm'ler de yetimmiş → W-4.7 kendiliğinden cevaplandı.**
3. **W-2.13 kod tarafı — `1e89804`:** (a) wizardIptal: silinme_tarihi + kuyruk temizliği
   (bekliyor/oneri_hazir/manuel_onay → 'iptal'; .select('id') ile "gerçekten taslaktı" doğrulaması);
   (b) ares-izometri-drenaj.js: silinmiş devrenin işi HİÇ alınmaz (iki dal; sorgu hatasında
   düşürmez — sigorta yanlış pozitif üretmez); (c) vercel.json drenaj no-cache (W-4.6).
   Canlı kanıt: 2 test devresi, 6 iş iptale çekildi, sayılar birebir.
4. **W-2.6 ÇÖZÜLDÜ (B / MK-154.1):** durum kolonu eklenMEdi — işleniyor/hazır kuyruktan türetilir.
   Keşif: devreler CHECK'i zaten taslak/aktif/iptal tutuyordu, wizard zaten durum='taslak' yazıyordu.
5. **W-2.7 GEMİDE — `e7cd787`:** İşlenenler (wizard panel 3): mockup→onay→kod (R-10). Stepper
   girişi + rozet; devreler.html'e v3-flag'li buton (?sekme=islenenler); türetilmiş durum satırları;
   öneri/manuel sayaçları (dar kapsam kararı); İncele→taslagiAc (MK-136 altyapısı, sıfır yeni akış);
   satır iptali→_taslakIptalEt çekirdeği (wizardIptal'dan ayrıştı, kopya yok); "Bekleyenleri işle"
   = global drenajın kalıcı UI yüzü → W-1.2 de [x], konsol devri bitti. 5-adım canlı tur ✓.
6. **W-2.8 kod okumasıyla [x]:** onayEt zaten sıralı (terfi→backfill→toast→otomatik devre_detay).
7. **W-2.11 = A kilitlendi:** devre_detay ?taslak=1 kipi; uygulama 155 ana işi.

## Bulgular (154)
- **153 "aktif hayalet" bulgusu doğrulanmadı:** aktif+spoolsuz+silinmemiş devre 0 çıktı; 138/A
  filtresi çalışıyordu. Ders: eski oturum bulgusu da yeniden ölçülür.
- devreler.html ~1294 stat sayacı filtresiz şüphesi (155'e not).
- MK-85.3 iki kez: devreler.created_at YOK (olusturma) · hata_mesaji tahmini şanslı tuttu.
- Push reddi: CI rapor commit'i (f89a79e) araya girdi → `git pull --rebase` temiz çözdü.

## Commit'ler (154)
| Hash | Mesaj |
|------|-------|
| `1e89804` | fix(154): W-2.13 yetim onleme — wizard iptali kuyrugu temizler, drenaj silinmis devreyi atlar; drenaj JS no-cache (W-4.6) |
| `e7cd787` | feat(154): W-2.7 Islenenler sekmesi — taslak havuzu, turetilmis durum, global drenaj UI yuzu + devreler.html girisi |
DB (veri UPDATE, migration YOK): 356 yetim 'iptal' + 20 taslak silindi. CI yeşil. 12/12 ✓.
izometri-oku DOKUNULMADI ✓.

## MK kayıtları (KARARLAR.md'ye işlenecek)
- **MK-154.1:** Devre işleme durumu (işleniyor/hazır) kolon değil TÜRETMEdir — tek doğruluk kaynağı
  dosya_isleme_kuyrugu. Durum-senkron kodu yazılmaz; UI her açılışta kuyruktan sayar.
- **MK-154.2:** Taslak iptal çekirdeği `_taslakIptalEt`: soft-delete (silindi+silinme_tarihi) +
  terminal-olmayan işler (bekliyor/oneri_hazir/manuel_onay) 'iptal'. 'isleniyor' yarış koşulu
  nedeniyle dokunulmaz; 'tamamlandi' tarihsel kayıt. Çağrılır, kopyalanmaz.

## KUYRUK SON DURUM
oneri_hazir=690 · tamamlandi=367+ · iptal=356+ · manuel_onay=263 · hata=1 (Donatım, beklenen) ·
bekliyor=0. Gerçek onay havuzu ~953 — onay UI akıbeti tasarlanmadı (155+ tartışma).

## 155 ANA İŞ
1) W-2.11/A uygulaması (devre_detay ?taslak=1: önce yazma noktaları envanteri, sonra kilit+filigran).
2) MK-153.3 av turu (yukleyen_id NULL INSERT akışı).
3) Küçükler: stat sayacı şüphesi · onay havuzu tasarım tartışması · ertelenmiş format paketi.
