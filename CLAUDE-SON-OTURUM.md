# CLAUDE-SON-OTURUM — Oturum 107 (21 May 2026)

## Özet
Bir icraat + bir derin tasarım. (1) MK-49.B kodlandı, deploy edildi, canlı test edildi,
doğrulandı: wizard izometri PDF'leri artık parse ediliyor (sakla → kuyruk + worker).
(2) Kabuk-first akış + öğrenme döngüsü mimarisi baştan sona netleştirildi — Cihat'ın
"gri alan" dediği öğrenme mekanizması altı MK kararına bağlandı.

## 1. MK-49.B — Wizard izometri PDF routing (commit 280ec54)
**Yeni: `api/kuyruk-isle-izometri.js`** (295 satır) — `kuyruk-isle-excel.js` deseninin birebir
izometri karşılığı. Fark: excel lokalde buffer parse eder; izometri storage'dan indirip base64'e
çevirip `/api/izometri-oku`'yu HTTP ile çağırır (MK-49.1: dokunma, çağır).
- Akış: kuyruk al → lock (isleniyor) → devre_dokumanlari (storage_yolu + yukleyen_id) → download
  → base64 (7MB pre-check) → izometri-oku POST → durum eşle → parse_sonuc yaz.
- Durum eşlemesi: ok+0manuel→oneri_hazir, ok+>0manuel→manuel_onay, !ok→hata (excel worker aynalı).
- kullanici_id = devre_dokumanlari.yukleyen_id (null ise net hatayla kapat).
- config maxDuration 60 (izometri-oku Vision 11-25 sn bekler).

**`devre_wizard.html`** (882→944 satır) — adim3_yukle üç dal:
- bomExcelMi → parser='excel-generic' (mevcut)
- izometriMi → parser='izometri', durum='bekliyor', tetiklenecekIzo
- else → parser='sakla', durum='tamamlandi' (sertifika/şartname/3d_pdf vb.)
- Excel döngüsünden sonra izometri tetik döngüsü + "İzometri ayrıştırma" özeti.
- parse_durumu (bomExcelMi||izometriMi)?'bekliyor':'tamamlandi'.
- İnfo banner güncellendi (izometri artık arşivlenmiyor).
- JS syntax doğrulandı (node --check).

**Şema teyitleri:** durum CHECK oneri_hazir/manuel_onay zaten var, parser CHECK yok →
migration GEREKMEDİ. dokuman_tipleri izometri satırı parser_yolu='izometri-oku' (ama wizard
JS'i sadece bom_excel'i ayırıp gerisini sakla'ya basıyordu — eksik halka buydu).

**Env:** SELF_BASE_URL=https://arespipe.vercel.app (Production+Preview, Sensitive KAPALI —
public URL, sır değil). Save → sonra push (sıra doğru, deploy env'i aldı).

## 2. Canlı test (15/15 başarılı)
M100-306 (SP12×5 + SP27×5) + M100-317 devresi. SQL teyidi:
- 15 izometri kuyruk satırı: parse_var=true, spoollar_tipi=array, hata_mesaji NULL.
- Detay PDF=1 spool, montaj sayfası (M100-306-SP12.1 / SP27.1)=5 spool, manuel_onay.
- Önizleme modalı parse_sonuc okuyor (boru/fitting/DN/kg dolu). Önizleme≠kayıt; "Aktar"=INSERT.

## 3. Kabuk Excel'den çıkıyor (kanıt — kod yazmadan SQL)
IFS parse_sonuc satırlarında pipeline_no + spool_no VAR. group-by → 25 benzersiz spool temiz.
K1 onaylandı (kabuk IFS'ten), K2 şablon gerekmez. yuzey üç kaynakta: izometri yuzey alanı +
Excel system token ("M100-Galv") + klasör adı. Alıştırma Excel'de YOK → izometriden gelir
(kabukta boş, PDF arkada dolar — MK-107.1 akışının özü).

## 4. Öğrenme döngüsü mimarisi (Cihat'ın 4 sorusu → 6 MK)
Cihat'ın "gri alan" dediği öğrenme mekanizması açıldı:
- **Düzeltme nasıl işlenir?** Anında kayıt düzelir + kural doğar (MK-107.3).
- **Her düzeltmede evrensel/özel sorulur mu?** Hayır — akıllı varsayılan + nadir tek-tık (MK-107.3).
- **Sorular zamanla azalır mı?** Evet, depolar dolduğu için (MK-107.2, ölçülebilir hedef).
- **%100 emin ama yanlışsa düzeltilebilir mi?** Evet, her alan; yüksek güven düzeltmesi = kör
  nokta sinyali (MK-107.4).
- **Başka firma düzeltmesi nasıl evrenselleşir?** 3 katman: tenant-özel → aday havuzu → admin
  onayı; kural anonim evrenselleşir, veri taşınmaz (MK-107.5).
- **STEP doğrulama?** STEP truth → izometri validate + boşluk doldur (MK-107.6).
- **Süper admin alanı?** Evrensel Kural Adayları + öğrenme yönetimi ekranı (MK-107.7).

Sahne netleşti (A firması düzeltir → kendi tenant'ında; B firması GÖRMEZ; iki firma aynı
düzeltirse aday havuzu; admin tek tıkla evrenselleştirir → herkese; admin de kullanıcı
şapkasıyla düzeltirken otomatik evrenselleştirmez).

## Mimari kararlar (107)
MK-107.1 (kabuk akışı=A), MK-107.2 (öğrenme=4 depo), MK-107.3 (düzeltme sözlüğü),
MK-107.4 (her alan düzenlenebilir + kör nokta), MK-107.5 (3 katman evrenselleştirme),
MK-107.6 (STEP geri-doğrulama), MK-107.7 (süper admin öğrenme yönetimi).

## Commit'ler
| Hash | Mesaj |
|------|-------|
| 280ec54 | feat(107): MK-49.B wizard izometri PDF routing (sakla -> kuyruk + worker) |

## Sonraki oturum (108)
ANA HEDEF: kabuk-first akış icraatı (MK-107.1). Detay: CLAUDE-SONRAKI-OTURUM.md.
"108'de icraata geçelim" — Cihat. Tasarım bitti, kod zamanı.
