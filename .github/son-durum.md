# son-durum.md — Oturum 156 (2026-06-05)

## Bu oturumda ne yapıldı
1. **ONAY HAVUZU TASARIMI BAĞLANDI (3 karar, kod yok):** (a) onay yüzü = devre_detay'a yeni
   "Onay Kuyruğu" sekmesi + devreler.html rozet — KANIT: 953 işin TAMAMI aktif devrelerdeydi,
   İşlenenler taslak yüzüdür (MK-156.2); (b) tek liste iki davranış — oneri_hazir yeşil/toplu,
   manuel_onay amber/tekil, uyarı içeriği parse_sonuc.spoollar[].uyarilar'dan (kod+mesaj+agirlik,
   yeni veri üretimi YOK; atanmamis ayrı alt grup "eşleştir" butonlu); (c) toplu onay YALNIZ
   oneri_hazir + devre kapsamı, kritik uyarılı satır toplu akışa girmez. 157 read-before-write:
   "onayla" tüketicisi kodda var mı?
2. **TEST ÇÖPÜ TEMİZLİĞİ (671 iş iptal):** dry-run + üç istisna (g200, 265-overboard, hhbjşlö)
   → havuz 998→327 (230 öneri + 97 manuel). hata_mesaji='oturum 156: test devresi temizligi'.
   157 onay UI'ının test yatağı bilinçli korundu.
3. **İşlenenler→"Önizle" GEMİDE — `df11ac1` (canlı kanıtlı):** satıra 👁 buton →
   devre_detay?id=X&taslak=1 YENİ SEKMEDE (bilinçli: drenaj client-loop'u ölmesin, MK-153.1).
   Bant+kilit+toast canlı ✓. W-2.11 köprüsü kapandı.
4. **YAPISAL BULGU — MK-156.1:** taslak önizleme BOŞ GÖVDE gösterir: devre_detay spooller'dan
   render eder, taslaklar spooller'a YAZMAZ (MK-127.4, spooller=0 kanıtlı). B-4 vaadi delik —
   önizleme taslak VERİ katmanını (kabuk grupla + kuyruk önerileri) okumalı = W-2.14 (157+ tasarım).
5. **NB1124 (hhbjşlö) KABUK TEŞHİSİ MÜHÜRLENDİ — MK-156.3:** kabuk SAĞLAM (Excel 66 satır →
   22 spool, temiz anahtarlar: 10Ax6A|S01...). Kırık taraf PDF KİMLİĞİ: 44 PDF'in 37'si
   pipeline_no NULL. Anatomi: 22 dosya format NULL = TABLOSUZ ÇİZİM (W-2.4 vakası, L3'e gidip
   manuel_onay'ı şişirmiş); e1fb879d ailesinde 20/22 dosya `10Ax6A 1(2).S01.1.pdf` kalıbı kimlik
   çıkarımı dışı (yalnız `12Ax12D.S01.1.pdf` kalıbı çözülmüş, 2 dosya). Satır değil KİMLİK sorunu.
6. **İZO-KANIT-SETİ v4 EKİ HAZIR** (B1124 = 5. gemi, 6 PDF): yeni sınıflar Flanş Dablin ⚠ +
   Tee metrik ? (matriste hiç yoktu, tip teyidi gerek) + kaynak "- Saha" varyantı; Lama 2.,
   Detay A 3., çift-hane et 2., 4-segment 2. kanıt; Continue+sayfa eki ("M110-722-509 1(2)");
   "gemi başına tek adlandırma" varsayımı ÖLDÜ (B1124'te zone'lu + zone'suz yan yana).
7. **31-PDF yol haritası eleştirisi:** belge yalnız SATIR kapsaması; üç katman olmalı —
   KİMLİK + SATIR + BELGE SINIFI (dışlama). Madde 0 (pipeline kimlik çıkarımı) iş paketine eklendi.

## Bulgular (156)
- devre_dokumanlari.parse_durumu 'bekliyor' kalıyor (kuyruk işleri bitmiş olsa da, hhbjşlö 44 PDF
  + bom excel) — senkron borcu mu bilinçli mi, 157 teyit.
- B1124 PDF'leri Downloads "(1)" ekiyle geldi — sisteme ORİJİNAL adla yüklenmeli (MK-52.1).
- ✖ "sessiz kayıp" iddiası belge analizinden; motor tetiksiz satırı ham_satir'a düşürüyor mu
  tek canlı örnekle teyit edilmeli (ediyorsa ✖→⚠, öncelik değişir).

## Commit'ler (156)
| Hash | Mesaj |
|------|-------|
| `df11ac1` | feat(156): Islenenler satirina Onizle butonu — ?taslak=1 koprusu yeni sekmede (W-2.11 acik ucu kapandi) |
DB (veri UPDATE, migration YOK): 671 kuyruk işi → iptal (test temizliği). CI yeşil. 12/12 ✓.
izometri-oku DOKUNULMADI ✓. Repo raw erişimiyle kod okuma yapıldı (yeni yöntem, işe yaradı).

## MK kayıtları (KARARLAR.md'ye işlenecek)
- **MK-156.1:** Taslak önizleme kipi (?taslak=1) spooller'dan render eder; taslak spooller'a
  yazmaz (MK-127.4) → her taslak önizlemesi yapısal boş gövde. B-4, önizleme taslak veri
  katmanını okuyana dek (W-2.14) kapanmaz.
- **MK-156.2:** Onay yükü AKTİF devrelerde yaşar — onay yüzü İşlenenler'e (taslak yüzü) değil
  devre_detay'a kurulur. Tasarım yerleşimi sezgiyle değil yük dağılımı sorgusuyla seçilir.
- **MK-156.3:** Format kapsaması ÜÇ katman: KİMLİK çıkarımı + SATIR tipleri + BELGE SINIFI
  (dışlama). Üçü ayrı ayrı kırılabilir; kabukta_yok teşhisinde sıra: kabuk anahtarları → PDF
  anahtarları → format/kimlik kıyası.

## 157 ANA İŞ
1) Format Tur 1 — NB1124 kapanışı: kimlik çıkarımı read-before-write (NEREDE yaşıyor?) →
   Madde 0 kalıpları + flange_en + W-2.4 dışlama kararı + Tee grep teyidi → kanıt hedefi
   kabukta_yok 22→0 (saha hazır: hhbjşlö).
2) Onay Kuyruğu sekmesi: "onayla" tüketicisi read-before-write → implementasyon (157-158).
3) W-2.14 taslak önizleme veri katmanı (tasarım).
4) Küçükler: parse_durumu senkron teyidi · IZO-KANIT-SETI v4 yapıştır (+ad sadeleştirme kararı) ·
   6 B1124 PDF'ini orijinal adlarla yükle · Y200 ST37 + W-3.9 (sıra gelirse).
