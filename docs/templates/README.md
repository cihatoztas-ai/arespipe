# docs/templates/ — AresPipe Şablonları

Bu dizin, yeni bir kayıt açmadan önce hangi iskelete başlanacağını gösterir.
Şablonlar **yaşayan** dosyalar: kural değiştiğinde şablon da güncellenir.

## İçerik

### `yeni-sayfa-sablonu.md`
Yeni bir HTML sayfası (admin panel, portal sayfası, operasyon ekranı vb.) açarken başlanacak iskelet. CI'nin zorunlu tuttuğu script yüklemeleri, tema, i18n helper'ları, temel layout entegrasyonu dahildir. HTML kodu markdown code block içindedir — kopyala, yapıştır, yeni `.html` dosyan olarak kaydet.

**Ne zaman kullan:**
- Yeni bir operasyon sayfası (örn. `montaj.html`, `boyama.html`)
- Yeni bir admin alt-sekmesi (örn. `tanimlar.html`'de yeni bir sub-tab ekleme)
- Portal tarafında yeni bir rapor sayfası

**Ne zaman kullanma:**
- Mevcut bir sayfaya küçük düzenleme yapılırken (mevcut dosyayı kopyala, şablona gitme)
- Mobil React sayfası (CLAUDE-MOBILE.md ve `mobile/src/screens/`'e git)

### `yeni-migration-sablonu.sql`
Veritabanı migration dosyası açarken başlanacak iskelet. Atomik wrapping (`BEGIN; ... COMMIT;`), üst yorum bloğu, rollback notu, test query bloğu standart formatı içerir.

**Ne zaman kullan:**
- Yeni tablo / kolon / index / trigger / RLS policy eklerken
- Mevcut fonksiyonu yeniden yazarken (CREATE OR REPLACE)
- Data migration (UPDATE/DELETE toplu işlemler)

**Dosya adı kuralı:** `<oturum-no>-oturum-<konu>.sql`
Örnek: `26-oturum-faz-a4-ifs-fuzzy.sql`

## Şablonu Değiştirme

Bir şablon yeni bir kurala uymuyorsa:
1. Şablonu güncelle
2. `.github/son-durum.md`'e not düş
3. Yeni oturumda tutarsız kullanımları grep ile yakala (opsiyonel)

## Yokluğu

Mobil (React) ve test şablonları henüz yok — yapıldıkça eklenir.
