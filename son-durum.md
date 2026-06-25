# AresPipe — Son Durum (Oturum 204 kapanışı)

## Bu oturumda tamamlananlar

### 1. Sevkiyat sayfası (`sevkiyatlar.html`) — CANLI, çalışıyor
- **İki sekme:** Tüm Sevkiyatlar (paket master-liste + drawer) · Sevkiyat Hazırlık (devre bazlı havuz + drawer).
- **Yaşam döngüsü (ara basamak):** Havuz → seç → **Sevkiyata Hazırla** → paket `durum='hazirlaniyor'` (S26-001) → kamyona yüklendi → **Sevk Et** → `durum='sevk_edildi'` (kilitli).
- **Havuz:** `aktif_basamak='sevkiyat'` + pakete-girmemiş; devre bazlı; oran rengi (havuzda+sevk_edildi ≥ toplam → yeşil, değilse turuncu); kaynak (kk_davet_spooller.sonuc='gecti' → Kalite Onaylı, yoksa Direkt İmalat). ET NULL → "—" (B kararı).
- **Paket drawer (redesign):** düzenli header (no + tür + durum rozeti + Gönderen→Alıcı·Proje·Tarih akış bloğu), iki bilgi kartı (Teslimat/Özet, boş alanlar soluk), tam spool tablosu (Marka/Rev/Spool ID/Çap/Et/Ağırlık/Malzeme/Kalite/Yüzey + toplam).
- **Hazırlanıyorda:** spool çıkar (havuza döner), "+ Havuzdan spool ekle" (aynı tersane çoklu seç), "Sevk Et" (kilitle), "Paketi sil" (spool'lar havuza döner). **Sevk edildiyse:** kilitli.
- **Tüm Sevkiyatlar:** Durum kolonu (Hazırlanıyor sarı / Sevk edildi yeşil) + durum filtresi + tür/tarih/proje arama.
- **Sevkiyat Ekle:** 3 kart — Spool Sevkiyatı (→ Hazırlık'a yönlendir) / Giden Malzeme / Gelen Malzeme (`icerik` text).
- Son md5: `71a5567c64673046bba4aaaa06fd43fd`. Push edildi (commit `944b589`).
- Çözülen init bug: `await ARES.oturumKontrol()` ile tenant otururken bekle (tenantId null iken erken sorgu → 400).
- Üstten-kesik: `_drawerKonumla()` KK'dan birebir.

### 2. Kalite Kontrol (`kalite_kontrol.html`) — 5 düzeltme
- Oran rengi (tam yeşil / ksm turuncu) havuz + drawer.
- Proje araması (`havuzFiltreli` haystack'e `_proje_no`).
- Tarih aralığı: Açık (davet tarihi) + Arşiv (kapanış tarihi).
- İşaretli-satır filtre bug: `grupSec` artık sadece filtreli spool seçiyor.
- Drawer header redesign (hd-flow akış bloğu), aksiyonlar korundu.
- Son md5: `aaa9216662dd9cc7ea9f9accb5ec8043`. (Push: Cihat onayı sonrası.)

### 3. DB — canlıda uygulandı (migration dosyası BEKLİYOR)
- `sevkiyatlar.icerik text`, `sevkiyatlar.teslim_tel text`.
- `sevkiyatlar.durum text NOT NULL DEFAULT 'hazirlaniyor'` + check (`hazirlaniyor`/`sevk_edildi`).
- `sayac_tanimlari` tip='sevkiyat' (prefix S, yil_ekle, digits 3) → `S26-001` (`ARES.sonrakiNo('sevkiyat')`).
- ⚠ MK-200.5: durum teyidi son COMMIT sonrası `information_schema` ile doğrulanmalı.

## Şema (sabitlenmiş kolon adları — MK-85.3)
- `spooller`: spool_no, spool_id(text), pipeline_no, dis_cap_mm, **et_kalinligi_mm**, agirlik, malzeme, yuzey, kalite, rev, aktif_basamak, devre_id, silindi.
- `sevkiyatlar`: id, tenant_id, tersane_id(NOT NULL), sevk_no, sevk_fis_no, tip(check: giden_spool/serbest_giden/gelen_malzeme), durum, tarih, arac_plaka, irsaliye_no, teslim_alan, teslim_tel, not_, icerik, olusturma.
- `sevkiyat_spooller`: id, tenant_id, sevkiyat_id, spool_id, olusturma.
- `devreler`: devre_no, ad, is_emri_no, zone, proje_id. `projeler`: proje_no, gemi_adi, tersane_id. `tersaneler`: ad, kisa_ad, kod. `tenants.ad` = firma adı (logo kolonu YOK).
- No üretimi: `ARES.sonrakiNo('sevkiyat')`. Oturum: `await ARES.oturumKontrol()`. Kullanıcı: `ARES.kullaniciId()`.
