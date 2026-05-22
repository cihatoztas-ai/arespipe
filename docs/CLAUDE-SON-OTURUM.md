# CLAUDE — Son Oturum Özeti (Oturum 113, 22-23 May 2026)

## Özet
İki ana iş tamamlandı ve canlı doğrulandı. **İş 1 (508 fix):** izometri parse drenajındaki Vercel 508
INFINITE_LOOP_DETECTED kökten çözüldü — server→server self-invocation (kuyruk-isle-izometri →
izometri-oku, aynı deployment) kaldırılıp **client-loop orkestrasyonuna** geçildi (tarayıcı her PDF için
izometri-oku'yu doğrudan çağırır). devre_detay + wizard AYNI `ares-izometri-drenaj.js` motorunu kullanır
(tek paylaşılan altyapı). **İş 2 (wizard yeni devre):** wizard artık "+ Yeni Devre" ile sıfırdan devre
oluşturabiliyor; canlı test geçti (P26-151, 142 kg özeti spool'lardan türedi). Kapanışta **format
öğrenme döngüsünün tanısı** çıkarıldı (üç delik + tek-format-derinlemesine stratejisi) — 114'ün ana teması.

## 1) ares-izometri-drenaj.js — YENİ paylaşılan helper (MK-113.1/113.2)
- `ARES_IZO_DRENAJ.izometriDreneEt({supa, tid, filtre:{devreId}|{}, bucket, onIlerleme})`.
- Liste BİR KEZ çekilir, tek tek browser-loop: ARES.dosyaUrlAl(yol,bucket) imzalı URL → base64 →
  POST /api/izometri-oku (browser'dan, server→server YOK) → POST /api/kuyruk-isle-izometri {is_id, onceden_parse}.
- Her PDF bir kez işlenir, re-pay yok. onIlerleme {faz, sira, toplam, dosya, sonuc?, ozet}; sonda ozet.kalan.
- Bağımlılık: ARES.supabase/tenantId/dosyaUrlAl (ares-store.js'de mevcut).

## 2) api/kuyruk-isle-izometri.js — skip-parse modu (MK-113.1)
- `birIsIsle`'ye `opts.oncedenParse` (+ oncedenParseHttp) eklendi. Gelirse server indir+izometri-oku
  adımını ATLA, sadece kaydet+eslestir çalıştır (parse zaten browser'da yapıldı).
- Opts yoksa eski server yolu AYNEN (drenajTuru hâlâ opts'suz çağırıyor → sıfır regresyon).
- Handler is_id modu req.body.onceden_parse/onceden_parse_http geçiriyor. MK-49.1 korundu.

## 3) devre_detay.html — bekleyenIzometriIsle → helper (MK-113.2)
- Eski MAX_TUR=60 server-tetik döngüsü → ARES_IZO_DRENAJ.izometriDreneEt({filtre:{devreId},
  bucket:'devre-belgeleri'}). Sayaç ucuz güncellenir, belgelerYukle her 5 PDF'de + sonda.
- Script include eklendi (ares-kabuk sonrası). Canlı test GEÇTİ (NB1124/ballast tam drene, 508 YOK).

## 4) devre_wizard.html — izometri drenajı + yeni devre (MK-113.2/113.3)
**İzometri (Aşama 3):**
- Eski fire-and-forget server tetiği (fetch '/api/kuyruk-isle-izometri' body:'{}') KALDIRILDI.
- wizBekleyenleriIsle server-tetik+8-tur setInterval polling → ARES_IZO_DRENAJ.izometriDreneEt
  ({filtre:{devreId:WIZ.devre_id}, bucket:'devre-belgeleri'}). Ölü WIZ._izoIds temizlendi.
- Script include eklendi. g_ARES_IZO_DRENAJ_VAR() guard (helper koparsa sessizce atla).

**Yeni devre (113/B, deploy ayrı `b2aad81`):**
- Adım 1 mod toggle (Mevcut/Yeni) + devre_no/zone/termin input. Dedup (proje+devre_no+zone, zone boşsa IS NULL).
- Devre INSERT adim3_yukle başında (öksüz devre yok). Alanlar devre_yeni'den çağrılarak (MK-109.1):
  is_emri_no=ARES.sonrakiNo('is_emri'), basamak_snapshot=ARES.basamakSnapshotOlustur(), malzeme/yuzey=null.
- kabukOnayla sonrası _devreOzetSenkron (yalnız yeni devrede) — spool'lardan DB-truth ile malzeme/yuzey/agirlik.

## 5) Aşama 4 — ölü kod temizliği (C kapsamı)
- Frontend tarandı: devre_detay + wizard'da temizlenecek ölü kod KALMADI (Aşama 2-3'te zaten temiz).
- Backend drenajTuru + DRENAJ modu + kuyruk-isle.js self-chain temizliği → test sonrasına ertelendi (4b).
  Çalışıyor ama kullanılmıyor; aktif tehlike yok (is_id dispatch'i drenajdan önce).
- Batch sayfaları client-loop'a GEÇMEDİ (Aşama 3 devamı, ayrı iş).

## Canlı doğrulamalar
- Aşama 2: NB1124/ballast devresi tam drene — 508 YOK, manuel_onay:4 + oneri_hazir:8 = 12, bekliyor/hata=0.
  Spool detayda izometri PDF link ile geldi (eşleşme çalışıyor).
- AI maliyet sağlıklı: cache çalışıyor (mükerrer 7/233 ~%3), her PDF bir kez L3, para sızmıyor.
- İş 2: "deneme" devresi P26-151 oluştu — 3 spool, 142 kg, Karbon Çelik, Galvaniz, St 37; özet senkronu çalıştı.

## Format öğrenme TANISI (114 ana teması)
- Cache (sha256) çalışıyor. Format öğrenme KISMEN: 3 delik — D1 fingerprint zayıf (format_id YOK,
  $3.44, en büyük), D2 öğrenilmiş formatta L3 sızıntısı + Tersan alıştırma/not eksiği ($0.83),
  D3 2 format hiç öğrenilmemiş ($1.60), D4 müşteri-öğretir UI (asıl çözüm).
- Tersan alıştırma PDF'te AÇIK (spool adı ...-ALS-... + "NOT: Alistirma Parcasidir") ama L2 kaçırıyor.
- Format tablosu: izometri_format_tanimlari. Strateji: D1 yatay → Tersan dikey (uçtan uca) → çoğalt.
  Çok format eşzamanlı DEĞİL.

## Mimari kararlar
- MK-113.1: Vercel 508 = aynı-deployment yoğun fonksiyon-fonksiyon HTTP çağrısı → client-loop orkestrasyonu.
- MK-113.2: tek paylaşılan izometri drenaj altyapısı (ares-izometri-drenaj.js); devre_detay+wizard+(batch).
- MK-113.3: wizard yeni devre — finalize'da INSERT (öksüz yok), alanlar devre_yeni'den çağrılır,
  kabuk sonrası özet senkronu, mevcut devreye dokunulmaz.

## Dersler (bu oturum)
1. **Veriyi gör, varsayma:** olusturma_at (olusturma değil), pdf_sha256, izometri_format_tanimlari
   (formatlar değil), 508 platformdan (izometri-oku 508 döndürmüyor) — hepsi bakılarak yakalandı.
   Alıştırma "yok mu/çıkarılamıyor mu" PDF görülmeden denmedi.
2. **Şüpheyi sorguyla kapat:** "76 L3 ≠ 12 PDF" paniği → sha256 sorgusu → mükerrer yok, para sızmıyor.
3. **Kapsam disiplini:** Format öğrenme döngüsü çıkınca kapsama eklenmedi, tanı çıkarılıp 114'e bırakıldı.
   "Notlar 0 not" = elle eklenen alan, bug değil — yanlış alarmı düzelttik.
4. **Ölü kod temizliğinde aceleci olma:** backend drenajTuru silmek için client-loop'un canlı kanıtı
   beklendi (4b'ye ertelendi) — geri dönüş noktasını kaybetme.

## Commit'ler
| Hash | İçerik |
|------|--------|
| b2aad81 | wizard yeni devre oluşturma (MK-113.3) |
| 67c944f | izometri client-loop drenaj — 508 fix, helper + skip-parse + devre_detay (MK-113.1/113.2) |
| 9425984 | wizard izometri drenaji helper'a baglandi (MK-113.2) |
| (doc)   | kapanış dokümanları [skip ci] |

## Değişen/yeni dosyalar
- ares-izometri-drenaj.js (YENİ — paylaşılan client-loop helper)
- api/kuyruk-isle-izometri.js (skip-parse modu)
- devre_detay.html (bekleyenIzometriIsle → helper)
- devre_wizard.html (izometri drenajı → helper + yeni devre oluşturma akışı)

## Sonraki oturum
Detay CLAUDE-SONRAKI-OTURUM.md. ANA TEMA: **Format öğrenme döngüsü** — D1 fingerprint (en pahalı delik)
→ Tersan'ı uçtan uca (kural + alıştırma/not + müşteri-öğretir UI). Tek format derinlemesine, çok format değil.
İkincil: Aşama 4b (backend ölü kod) + batch sayfaları client-loop'a geçir.
