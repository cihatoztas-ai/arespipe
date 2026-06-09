# UI-BORC.md — Sayfa Gorunum/Cila Borc Envanteri

> Amac: "sonra duzeltiriz" deyip biriken gorsel/UX borcunu BELIRSIZLIKTEN cikarip listeye dokmek.
> 171 karari (1+4): once liste, sonra dert etme — bir sayfada "kaba" gordukce buraya tek satir ekle,
> isleyince cilala. Korku belirsizliktendi; bu tablo onu somutlastirir.
>
> NASIL DOLDURULUR: Cihat bir sayfada rahatsiz eden seyi gorunce satiri doldurur. Tarama bu listede
> bos basliyor (sohbetten otomatik taranamaz — dosyalar lokalde). Claude Code oturumu ya da
> screenshot/sed ile birlikte doldurulabilir.
>
> DURUM legendi:  🟢 iyi (dokunma)  ·  🟡 orta (ufak cila)  ·  🔴 kaba (elden gecmeli)  ·  ⚪ bakilmadi
> ONCELIK:  P1 (yakin)  ·  P2 (sonra)  ·  P3 (ilerde)  ·  — (yok)

## OZET
- Toplam sayfa: 37
- Bakilan: 1 (devre_wizard_v3 — 171'de elden gecti 🟢)
- Bekleyen: 36 (⚪)

## TABLO

| Sayfa | Durum | Ne eksik / kaba | Oncelik | Not |
|---|---|---|---|---|
| devre_wizard_v3.html | 🟢 | 171'de form+animasyon+popup elden gecti | — | referans seviye |
| devre_detay.html | ⚪ |  |  |  |
| devre_duzenle.html | ⚪ |  |  |  |
| devre_yeni.html | ⚪ |  |  |  |
| devreler.html | ⚪ |  |  |  |
| spool_detay.html | ⚪ |  |  | 170 acik: terfi sonrasi PDF gostermeme |
| kesim.html | ⚪ |  |  | bilinen: Excel export i18n eksik (eski) |
| bukum.html | ⚪ |  |  |  |
| markalama.html | ⚪ |  |  |  |
| kalite_kontrol.html | ⚪ |  |  |  |
| is_baslat.html | ⚪ |  |  |  |
| sevkiyatlar.html | ⚪ |  |  |  |
| sorgula.html | ⚪ |  |  |  |
| raporlar.html | ⚪ |  |  |  |
| izometri-batch.html | ⚪ |  |  |  |
| izometri-batch-incele.html | ⚪ |  |  |  |
| etiketleme.html | ⚪ |  |  |  |
| qr_tara.html | ⚪ |  |  |  |
| proje_detay.html | ⚪ |  |  |  |
| proje_liste.html | ⚪ |  |  |  |
| tersaneler.html | ⚪ |  |  |  |
| kullanicilar.html | ⚪ |  |  |  |
| kullanici_detay.html | ⚪ |  |  |  |
| ayarlar.html | ⚪ |  |  |  |
| tanimlar.html | ⚪ |  |  |  |
| tezgahlar.html | ⚪ |  |  |  |
| kurallar.html | ⚪ |  |  |  |
| uyarilar.html | ⚪ |  |  |  |
| log.html | ⚪ |  |  |  |
| testler.html | ⚪ |  |  |  |
| format_tanit.html | ⚪ |  |  | uzman atolye (kullanici menusunde degil) |
| index.html | ⚪ |  |  |  |
| giris.html | ⚪ |  |  |  |
| session-expired.html | ⚪ |  |  |  |
| 403.html / 404.html / 500.html | ⚪ |  |  | hata sayfalari |
| devre_wizard.html | ⚪ |  |  | eski wizard — hala kullaniliyor mu? |

## NOTLAR
- devre_wizard.html (eski) hala duruyor — v3 ana akis. Eski hala link veriliyorsa ya silinmeli ya
  yonlendirilmeli; once kullanimda mi teyit.
- Ortak bilesen adaylari (171'de yazilanlar — tekrar kullanim icin aday): modal (#sonucKuti/backdrop),
  form-grid (.row2/.fld scoped), drop-zone (iki-buton picker), tarama animasyonu (.ai-tarama).
  Birden cok sayfada ayni desen cikarsa ortak CSS'e tasimaya deger (171 "sistem" tartismasi).
