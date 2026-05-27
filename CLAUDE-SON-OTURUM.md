# Oturum 128 — Devre Wizard v3 İnceleme & Onay frontend iskelesi (canlı test edildi)

**`devre_wizard_v3.html` yazıldı, push edildi, Demo Atölye'de gerçek veriyle test edildi.** İnceleme +
B canlı dolum + terfi üçü de kanıtlandı. Mevcut `devre_wizard.html` (v2) sıfır dokunuş (MK-127.2).
Bir mimari boşluk (terfi-yeniden-eşle) yüzeye çıktı → 129.

## Bağlam

- Açılış: CI yeşil (127 push; emoji riski tetiklenmedi). HEAD `755d8bd` (docs AUTO).
- Okunanlar: omurga v3.1 (tam) + `devre_wizard.html` v2 (1505 satır, DOM + modül yüzeyi) + mockup v5
  (362) + `ares-kabuk.js` / `ares-normalize.js` / `ares-izometri-drenaj.js` (statik doğrulama için).
- Cihat'ın yön çizgisi: "burası programın kalbi, geçiştirmeyelim" + "fonksiyon-önce yazmıştım, yeniden
  düzenleme bu kadar zor olacak demedim" (refactor zorluğu = DOM/modül kontratını bozmadan yapıyı
  değiştirmek; gerçek bir zorluk, normal).

## Kilitlenen karar (FAZ-1 yolu = A)

- Omurga ideal (terfiye kadar devreler yok) taslak modu fazını (`taslak_haric`/`taslak_not` + nullable
  kolonlar) gerektiriyor → omurga 18.d, sonraki faz. FAZ-1 için **canlı-kod yolu**: "İncele"de devre
  `durum='taslak'`; terfide spool/QR + `'aktif'`. Belge yüklemek için devre_id şart (`devre_dokumanlari.
  devre_id` NOT NULL + FK), bu yüzden devre Adım 1'de oluşur.

## Yazılanlar / değişenler

| Dosya | Ne | Durum |
|---|---|---|
| `devre_wizard_v3.html` | FAZ-1 iskele (1038 satır / 73178 byte): 2 adım, /api/devre-inceleme render, B drenaj, terfi. Flag arkasında, canlıya alınmaz | yazıldı + push |
| `migrations/094_devreler_durum_taslak.sql` | devreler.durum CHECK + 'taslak' (idempotent) | yazıldı + push + canlı ALTER |
| DB (SQL Editor) | feature_flags master 'devre_wizard_v3' + tenant_features flag (Demo Atölye) | uygulandı |

## Doğrulananlar

- **Statik (canlı modülden):** `grupla().spoollar` alanları endpoint `kabuk_spoollar` ile birebir
  (MK-128.3) → ana risk çözüldü, map yok. `ARES_NORM.marka/revFmt/malzemeEtiket`, `izometriDreneEt`
  (`onIlerleme.faz`='bitti'/'tamam'), `aktar` imzaları tuttu.
- **Canlı (Demo Atölye, gerçek IFS .xlsm + izometri PDF):**
  - Adım 1: dosya auto-detect (bom_excel/izometri/diger), gizli atlandı, Excel-gate çalıştı.
  - Terfi: iki devre, 8'er spool, kabuk doğru (çap/et/ağırlık/malzeme St37/Karbon Çelik/Galvaniz/
    spool ID A-xxxx/marka NB1137-... ve NB1099C-...).
  - İnceleme (Adım 2): 4-durum tablosu doldu (🟢4 okundu / 🔴4 eksik), "8 PDF işleniyor" şeridi
    döndü (B drenaj canlı), izometri eşleşme `L2 %100` (dosya adı + seviye). → gündem 2+3+5 kanıt.

## KEŞİF — terfi-yeniden-eşle boşluğu (MK-127.4)

devre_detay (terfi sonrası canlı) izometriyi "okumuyor": v3 drenajı İnceleme'de (taslak, spool YOK)
çalışıyor; kanonik eşleştirici `spooller`'dan okuduğu için terfiden önce bağ kuramıyor, terfiden sonra
yeniden-eşle olmadığı için izometri öksüz. **İnceleme tablosu (taslak) izometriyi doğru okuyor** (test
kanıtı); eksik olan terfi sonrası bağ. Çözüm 129 (öneri A: parse_sonuc'tan ucuz re-eşle, $0).

## Hatalar & düzeltmeler (bu oturum)

- Flag INSERT iki kez FK'ye takıldı: `tenant_features.feature_kod` master `feature_flags`'te yokmuş
  (kolon `kod`, `feature_kod` değil) → master-önce ekleyince geçti (MK-128.2). Sütun adı uydurulmadı,
  canlı SELECT ile doğrulandı.
- Malzeme sekmesi ilk yazımda ham satır alanlarıyla (`r.kod/r.boy_mm`) basıyordu; raw satırlar
  `ifs_kod/uzunluk_mm` kullanıyor → grupla `.bom` konsolide alanlarına çevrildi (kozmetik).

## Süreç notu

İskele büyük (1038 satır) ama tek parça yazıldı çünkü tüm girdiler (v2 + mockup + 3 modül) okunup
statik doğrulandı; her kablolama (endpoint alanları, modül imzaları) canlı kaynaktan teyit edildi
(uydurma yok). Cihat arka planı göremediği için her DB adımı tek SELECT'le kanıtlandı (constraint,
flag master, tenant). Push + canlı test Cihat tarafından yapıldı; iskele flag arkasında, pilot bitene
kadar canlıya alınmaz.

---

> 129 açılışında: `son-durum.md` + omurga v3.1 + `CLAUDE-SONRAKI-OTURUM.md` oku.
> İlk iş: terfi-yeniden-eşle (MK-127.4 = A teyidi sonrası) — "tam okuma"yı bu çözer.
