# CLAUDE-SONRAKI-OTURUM.md — Oturum 160 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. CI: kapanış commit'i sonrası oto-rapor kanıt · 4. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md
   + docs/WIZARD-YOL-HARITASI.md oku · 5. Kod okuma: repo raw (working tree temizse dosya isteme)
   · 6. Teşhis sırası: VERİ (SQL) → UI → kod (MK-158.1) · 7. Ajanda onayı (Cihat sıralar)

## AÇILIŞ TEYİTLERİ (159'dan devreden, 5 dk)
1. **159c commit'i pushlu mu?** `fix(159): capa stub kaldirildi` — MD5
   2a4a6d973cb1221fbd844303315b1933. Değilse transfer+commit önce.
2. **Taslak NULL temizliği COMMIT edildi mi?** (dry-run sifirlanan=1 görülmüştü)
   `SELECT count(*) FROM devreler WHERE durum='taslak' AND silindi IS NOT TRUE AND is_emri_no IS NOT NULL;`
   → 0 beklenir; değilse UPDATE bloğunu COMMIT'le.
3. **Modal tıklama testleri (159b/c canlı):** NB1137 chvvnb taslağı, M130-817-008-S01 —
   (a) Malzemeler ✏️ → kalem modalı → "← Spool'a dön" geri getiriyor; (b) kalem düzelt → kaydet →
   dönüşte "düzelt" rozeti; (c) 📄 PDF'i aç doğru dosyayı yeni sekmede açıyor;
   (d) REGRESYON: Malzeme sekmesinden açılan kalem modalında "Spool'a dön" GÖRÜNMEMELİ.

## ANA İŞ — FORMAT YÖNETİM MİMARİSİ (Cihat teşhisi: "altyapı olarak tanımlanan formatların
## yönetim mantığını doğru kurabilirsek oldu bu iş")
Tasarım + ilk uygulama dilimi. Cevaplanacak sorular (159 Bulgular):
1. **Tek otorite:** DB `parser_kural` vs `lib/format-paketleri.js` ikiliği (MK-155.1 —
   AILE_KAYIT'lı formatta DB okunmuyor). Seçenekler: paket→DB senkron / format_tanit paket-taslağı
   üretir (PR akışı) / aileler DB'ye taşınır. Read-before-write: izometri-oku:902 aileBirlestir
   zinciri + AILE_KAYIT listesi.
2. **Öğretim adresi tablosu:** hangi format türü nereye yazar (format_tanit "neyi nereye
   yazdığını" bilmeli — SPEC 156 notunun ürünleşmesi).
3. **DEĞER kipi (B2) format_tanit'e:** sol bilgi + sağ PDF ekranında operatör değer yazarsa →
   `taslak_duzeltmeleri` (işaretli, MK-111.2); "bu alan hep burada" derse → B1 kural patch.
   İki kip tek ekranda ayrışır.
4. **Köprüler (W-3.1/3.2):** wizard inceleme Düzelt/rozetli satır + izometri batch satırı →
   `format_tanit?is_id=` (dosya+format+spool bağlamı işten okunur; operatör dosya ARAMAZ —
   159'un UX şikâyetinin kalıcı çözümü). PDF'i aç butonu köprü gelince modal-içi rolünü devreder.
5. **W-3.4 kardeş yayılımı:** kural kaydedilince aynı devrenin/ailenin kardeş işleri kuyruğa geri
   (155 reçetesi: deploy → sha düşür [SONRASI dahil] → reset → kanıt).
Çıktı: docs/FORMAT-YONETIM-MIMARI.md (karar tablosu) + en az 1 köprü canlı.

## SONRAKİ SIRADA (Cihat sıralamasına göre)
- W-2.18: önizlemede izometri parse overlay (Cihat akışı: L2'nin söktüğü her şey terfiden ÖNCE
  önizlemede — MK-157.1 yapısal sınırının üstüne kuyruk-okur katman).
- Format hattı klasiği: Y200 ST37 satır öğretimi + W-3.9 panzehiri (adres dersi MK-155.1:
  a093eaaa=DB, e1fb879d=paket) · Sefine şablonu (IFS köprüsü) · W-2.4 sınıflandırma tasarımı.

## KÜÇÜKLER
- KARARLAR.md'ye MK-157.1/2/3/4 + MK-158.1/2/3 + MK-159.1/2/3 + "kuyruk=truth" işle (birikti!).
- EN/AR: dv_tab_onay, dv_onayk_* ailesi, dv_taslak_spool_yok (TR fallback çalışıyor).
- hhbjşlö 1 excel önerisi (onay modalından aktar — veya Cihat bilinçli bekletiyor, sor).
- 6 B1124 PDF'ini ORİJİNAL adlarla yükle (MK-52.1) · IZO-KANIT v4 yapıştır + ad kararı ·
  ✖ sessiz-kayıp doğrulaması (tetiksiz satır ham_satir'a düşüyor mu).
- Montaj/PAOR kurallarına not_metni alanı (159 taraması: 0 üretiyorlar — yapısal; ihtiyaç doğunca).

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz, doc ayrı ·
MK-126.8 TAM dosya oku + SQL'den önce kolonları koddan doğrula (159'da is_tipi bir kez daha
yaşandı) · MK-157.1 kabukta_yok'ta İLK kontrol devre durumu · MK-157.2 Vercel repro = node@20.11 ·
MK-157.4 kuyruk durumu ≠ eşleşme durumu · MK-158.1 VERİ→UI→kod + benzer adlı devre ≠ aynı devre ·
MK-159.1 numara yalnız terfide · MK-159.2 görsel okuma format_tanit'te, modal-içi çapa İPTAL ·
MK-159.3 kod gerçeği > devir hafızası (146/B vakası) · SQL şablonlarında YER TUTUCU VERME ·
DML sonrası kalıcılık teyidi · bitis_at UTC · arespipe_kopyala MD5 + _arsiv ·
test yatağı: g200 (54m+86ö) + aw231 atanmamışlı + NB1137 chvvnb (modal testi) — silme!

> 160 açılışı: ritüel → 3 açılış teyidi → FORMAT YÖNETİM MİMARİSİ (read-before-write:
> aileBirlestir zinciri + format_tanit kip yapısı + kuyruk is satırı alanları) → karar tablosu →
> ilk köprü canlı → kapanış.
