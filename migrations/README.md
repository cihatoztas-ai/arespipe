Migrations
AresPipe veritabanı şema değişikliklerinin kayıtlı olduğu klasör.
Neden
Bu klasör olmadan:

DB değişikliklerinin geçmişi yoktu — hangi SQL ne zaman çalıştırıldı belirsizdi
Yeni bir Supabase projesi kurmak için 50+ SQL komutunu elle yazmak gerekiyordu
"Geçen hafta ne değiştirdim" sorusunun cevabı yoktu

Bu klasörle:

Her DB değişikliği numaralı dosya olarak kayıt altında
Yeni DB kurulumu tek komutla yapılabilir (sırayla çalıştır)
Yedekten dönüş + migration = tam restore


Dosya Adlandırma
NNN_kisa_aciklama.sql

NNN — 3 haneli sıra numarası (000, 001, 002, ..., 099, 100)
kisa_aciklama — snake_case, 2-5 kelime, ne yaptığını özetler
.sql — uzantı

Örnekler
000_initial_schema.sql                    ← Sıfır noktası (24 Nisan 2026)
001_zone_no_kolonu_dusur.sql
002_malzeme_tanimlari_master_tablo.sql
003_ifs_material_alias_tablosu.sql
004_fotograflar_yapan_id_migration.sql
Kural: Sıra numarası tekrarlanamaz
Birden fazla geliştirici aynı gün iki migration yazarsa, ikincisi sonraki numarayı alır. Çakışma varsa son commit eden numarayı değiştirir.

Migration Dosyasının İçeriği
Her migration dosyası şablondan başlatılır:
docs/templates/yeni-migration-sablonu.sql
Zorunlu parçalar
Her migration dosyası mutlaka şunları içerir:

Header yorumu — tarih, oturum, kısa açıklama, geri alma notu
BEGIN / COMMIT — atomik çalışma (yarıda kesilirse hiçbir değişiklik olmaz)
RLS politikaları — yeni tabloda her zaman
Test bloğu (opsiyonel) — değişikliğin beklendiği gibi çalıştığını doğrular


Yeni Migration Oluşturma Adımları

Sıradaki numarayı bul: ls migrations/ — son dosyanın numarasına 1 ekle
Şablondan başlat:

   cp docs/templates/yeni-migration-sablonu.sql migrations/NNN_aciklama.sql

Header'ı doldur — tarih, açıklama, geri alma
SQL yaz — BEGIN/COMMIT içinde
Supabase SQL editor'de çalıştır (canlıda)
Dosyayı commit et — kaydın DB ile senkronu

⚠️ Kritik: Canlıda çalıştırmadan commit yapma. Dosya = yapılmış değişikliğin kaydı, plan değil.

Mevcut Dosyalar
000_initial_schema.sql (24 Nisan 2026 — 27. oturum)
AresPipe DB'nin sıfır noktası. pg_dump --schema-only ile üretildi.
İçerik:

51 tablo (public schema)
85 index
17 trigger
18 fonksiyon (RLS helper'lar, audit, malzeme normalize)
90 RLS policy
Storage schema (arespipe-dosyalar bucket dahil)

Not: Bu dosya tek başına yeterli değildir. Supabase otomatik kurulan auth, realtime, supabase_* şemaları bu dump'a dahil değildir — onlar Supabase projesi oluşturulduğunda otomatik gelir.
Kurulum sırası (yeni Supabase projesi için):

Supabase'de yeni proje oluştur
SQL editor'e git
000_initial_schema.sql içeriğini yapıştır, Run
Sonra 001_*.sql, 002_*.sql, ... sırayla çalıştır
En son veri yedekten geri yüklenir (opsiyonel)


Yedekleme ile İlişkisi
Yedekleme (arespipe-backups repo): Her gece tüm DB + Storage'ın anlık kopyası alınır. Felaket anında dönüş için.
Migrations (bu klasör): DB'nin gelişim hikayesi. Yeni ortam kurulumu için.
İkisi birbirini tamamlar:

Kod + Migrations + son yedek = tam restore
Kod + Migrations + veri yok = yeni boş proje (staging vb.)


Geçmiş SQL Dosyaları

oturumdan önce yazılmış bazı SQL dosyaları dağınık biçimde repo'da duruyor (örn. 22-oturum-trigger-guard-gevsetme.sql, 26-oturum-faz-a4-ifs-fuzzy.sql). Bunlar canlıda zaten uygulanmış durumda, yani 000_initial_schema.sql içinde eksiksiz yansıyor.

Opsiyonel iş: Bu eski dosyaları referans amaçlı bu klasöre taşımak (001 ile 099 arası). Sıfır noktası 000, geçmişe dönük dosyalar 100+ numarayla yeni eklemelerden ayırt edilebilir. Bu karar şu an ertelendi, ileride verilir.

Disiplin Notları

⚠️ Supabase dashboard'ta SQL editor'de yazıp run artık tek başına yeterli değil. Her değişiklik bu klasöre yazılır.
⚠️ Migration dosyası oluşturmadan önce mevcut numaraları kontrol et — çakışma olmasın.
⚠️ Canlıda çalıştırmadan önce yedek olduğundan emin ol (son yedek bugünlük ise tamam).
⚠️ Geri alma (rollback) bölümünü boş bırakma — en azından "geri alınamaz" yaz.

Bu disiplin 3 yıl sonra hayat kurtarır.
