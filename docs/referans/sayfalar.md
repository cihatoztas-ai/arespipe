# Sayfa Kataloğu

> Her `.html` sayfası bir satır. Derinlik akış dosyalarında (`akislar/*.md`). Burada amacı sat ve doğru akışa yönlendir. "Bu sayfa ne?" → buradan akışa atla.

| Sayfa | Amaç (tek cümle) | Ait olduğu akış | Ana tablolar |
|-------|------------------|-----------------|--------------|
| `kalite_kontrol.html` | KK havuzu, davet, sonuç, arşiv — 3 sekme | [Kalite Kontrol](../akislar/kalite-kontrol.md) | kk_davetler, kk_davet_spooller, spooller |
| `aktif_devreler.html` | Devam eden devreler listesi + yeni devre girişi | [Devre Oluşturma](../akislar/devre-olusturma-wizard.md) · (Devre) | devreler, spooller, projeler |
| `devre_detay.html` | Bir devrenin spool tablosu; KK/sevk gönderim; izometri | (Devre) · [Kalite Kontrol](../akislar/kalite-kontrol.md) | spooller, devreler, kk_davet_spooller |
| `spool_detay.html` | Tek spool: foto, malzeme, log, 3D, kesim/marka, KK/sevk/test atıfları | (Devre) · birçok akışın kesişimi | spooller, spool_malzemeleri, is_kayitlari |
| `kesim.html` | Kesim ölçü havuzu + optimizasyon + listeye verme | [Kesim](../akislar/kesim.md) | spool_malzemeleri/kesim havuzu |
| `bukum.html` | Büküm havuzu, sırayla büküm işaretleme | [Büküm](../akislar/bukum.md) | (büküm havuzu) |
| `markalama.html` | Markalama havuzu, soğuk markalama listesi | [Markalama](../akislar/markalama.md) | (markalama havuzu) |
| `sevkiyat …` | Sevk havuzu, irsaliye, sevk listeleri, teslim raporu | [Sevkiyat](../akislar/sevkiyat.md) | sevkiyatlar, sevkiyat_spooller |
| `test …` | Devre düzeyi test (örn. %5 film), test raporu | [Test](../akislar/test.md) | (test tabloları) |
| `tanimlar.html` | Yetki Blokları · Kod Serileri/Sayaçlar · Malzeme Havuzu | [Tanımlar & Yetki](../akislar/tanimlar-yetki.md) | sayac_tanimlari, yetki blokları |
| `tezgahlar …` | Anlık: kim ne işi yapıyor, başlangıç/süre/günlük adet | [İmalat & QR](../akislar/imalat-qr.md) | is_kayitlari |
| `uyarilar …` | Eksik/revizyon/durdurulmuş spool takibi | (çapraz) | spooller (durdurma alanları) |
| `etiketleme …` | Sahadan gelen foto'ların etiketlenmesi (taslak) | (vizyon) | — |

> Satırlar büyüdükçe: bu tablo `sayfalar.md`'de kalır; her hücre tek satır. Yeni sayfa → yeni satır + (gerekirse) akış dosyası.
