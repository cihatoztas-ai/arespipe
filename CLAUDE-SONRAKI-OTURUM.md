# CLAUDE — Sonraki Oturum (113) Gündemi

## Açılış ritüeli (52'den beri sade — 2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -8`
   (HEAD 112 kod commit'leri + doküman commit'i olmalı; son kod commit'i uyarilar bindirme).
2. Bugün ne yapmak istiyorsun?
Sonra Claude: git temiz mi, CI rengi (son commit), `docs/PROJE-HARITASI.md` + bu 3 dosya oku, gündem onayla.
**Mid-cycle scope ekleme yok.**

## Oturum başı doğrulama (Supabase SQL Editor → düz ASCII)
```sql
-- 112 drenaj canli mi: bekleyen izometri dagilimi
select durum, count(*) from dosya_isleme_kuyrugu where parser='izometri' group by 1 order by 1;

-- Bindirme flag'li spool'lar (uyarilar sayfasi kaynagi) duruyor mu
select (parse_sonuc->'_eslesme'->>'bindirme_flag_sayisi') flag, count(*)
from dosya_isleme_kuyrugu
where parser='izometri' and (parse_sonuc->'_eslesme'->>'bindirme_flag_sayisi')::int > 0
group by 1;

-- PDF<->spool bagi (kac spool'a izometri bagli)
select count(*) from devre_dokumanlari where spool_id is not null;
```

---

## ⭐ ÖNCELİK 1 — WIZARD "yeni devre ekleme" akışı (🔴 doğrulanmamış, kritik olabilir)

**Belirti/şüphe:** Cihat 111+112'de defalarca dedi: "henüz YENİ devre ekleyemiyoruz, sadece MEVCUDA
ilave ediyoruz." Wizard'ın "yeni devre oluştur" yolu yarım/yok olabilir. Bu büyük bir eksik olabilir
ve henüz CANLI bakılmadı — 112'de Wizard'a hiç dokunulmadı.

**113'te (veriyi gör, varsayma):**
1. `devre_wizard.html`'i oku — 4 adımlı wizard (proje/devre seçimi → drag-drop → özet → yükle).
   "Yeni devre" seçeneği var mı, varsa hangi tabloya nasıl INSERT ediyor (`devreler`)?
2. Mevcut akış sadece "var olan devreye dosya ekle" mi? Yeni devre oluşturma UI'si eksik mi yarım mı?
3. Wizard yükleme sonrası kuyruk akışı 112 drenaj değişiklikleriyle uyumlu mu? (Wizard is_id ile
   spesifik tetik yapıyordu — MK-108.1; o yol korundu. Test: wizard'dan yükle, parse ilerliyor mu?)
4. A/B/C: yeni devre oluşturma akışını nasıl kuralım? (Cihat ile tasarım — büyük olabilir.)

## ÖNCELİK 2 — Mobil yönetici ekranında izometri PDF teşhisi
İş Başlat (personel) ekranında izometri PDF GÖRÜNDÜ (A-0764, canlı kanıt). Cihat yönetici ekranında
göremedi. grep: "Başka Spool Tara" + "FotoCarousel" AYNI dosya (IbSpoolDetay.jsx) çıktı — ama davranış
farklı görünüyor. 113'te: (a) yönetici ekranı gerçekten farklı bir bileşen mi (grep'in metni görmediği)?
(b) yoksa yönetici A-000764 dışında, bağ olmayan bir spool'a mı baktı (boş = doğru)? Console + hangi
spool'a bakıldığı netleşmeli. NOT: A-000764 dışında PDF↔spool bağı YOK — başka spoolda boş DOĞRU.

## ÖNCELİK 3 — Format öğrenme / manuel_onay oranı (M200-355C + M235)
112'de gözlem: bu formatlar yüksek oranda `manuel_onay`'a düşüyor (10 bindirme-flag'li kaydın çoğu).
Düşük güven parse → manuel onay. Format envanter UI + öğretme döngüsü (eski borç MK-107.x). Ayrıca
bindirme çelişkileri çoğu çap/et parser asimetrisinden olabilir (111 dersi) — gerçek veri çelişkisi mi
parser eksikliği mi ayır.

## ÖNCELİK 4 — "Başka tersane klasörü yükledim, olmadı" (Cihat, 112'de ertelendi)
Cihat 112'de başka bir tersanenin klasörünü yükledi, "olmadı" dedi, teşhis ertelendi. Muhtemelen
M200-355C formatı (manuel_onay'a düşüyor) ile aynı kök. 113'te katman teşhisi: yükleme mi (kuyruğa
girdi mi), parse mı (hata/manuel_onay), eşleşme mi (atanmamis)? SQL:
```sql
select q.durum, d.dosya_adi, q.hata_mesaji
from dosya_isleme_kuyrugu q join devre_dokumanlari d on d.id=q.devre_dokuman_id
where q.parser='izometri' and q.olusturma > now() - interval '3 days'
order by q.olusturma desc limit 20;
```

## Açık borçlar (öncelik sonrası)
5. **Personel İş Başlat ekranında izometri — kalsın mı?** IbSpoolDetay.jsx tek dosya olduğu için
   izometri hem yönetici hem personele geldi. Cihat "personele sonra" demişti ama saha için faydalı.
   Karar: kalsın mı / iki ekran ayrılsın mı.
6. **Bindirme uyarıları "Git →" linki.** uyariKartHtml `onclick="navigateUyari(u)"` — u runtime'da
   tanımsız (mock'larda da kırık olabilir). link `spool_detay.html?id=uuid` set edildi; navigateUyari
   davranışı doğrulanmadı. Test/düzelt.
7. **i18n borcu (G-01).** Fallback'le çalışan ama lang/*.json'da OLMAYAN anahtarlar:
   `dv_izo_drenaj_hata`, `dv_izo_drenaj_kismi`, `sp_izo_baslik`, `sp_izo_ac`, `sp_izo_acilamadi`,
   `sp_izo_eslesen`. TR dışı dilde TR fallback görünür. tr/en/ar.json'a eklenecek.
8. **`_N` alt-spool fallback (MK-110.2 eksiği).** S01_1 PDF → kök S01 (pafta eki): önce birebir,
   yoksa _N at + kök dene. S08_1 gibi gerçek ayrı spool'u bozmadan.
9. **İkiz kolon temizliği** (agirlik/agirlik_kg, durum/is_durumu — MK-108.2) + web spool durum senkronu
   (devre_detay tablo + spool_detay aktif_basamak/ilerleme DB-truth okusun).
10. **Test verisi temizliği.** İçeride GERÇEK veri yok; ikiz devreler + fakir/mükerrer test spool'ları
    topluca silinebilir (Cihat istediğinde).
11. **Yön/3D hattı (MK-49.A).** Bindirme yön getirmedi (parse'ta kaynak yok). 3D girdisi ayrı iş.

## Destekleyen kararlar (akılda tut)
- **MK-49.1:** izometri-oku.js'e DOKUNMA — sadece çağır.
- **MK-108.1:** Wizard kuyruğu = dosya_isleme_kuyrugu + devre-belgeleri + kuyruk-isle-izometri.js (is_id).
- **MK-108.4:** Kolon adı yazmadan information_schema ile doğrula. (112'de yine işe yaradı — devre_id
  kuyrukta yok, is_emri_no doğru ad.)
- **MK-109.1:** Çalışan kodu yeniden yazma — çıkar/çağır. (drenajTuru birIsIsle'yi çağırır; eslestir
  dokunulmadı; dosyaUrlAl deseni paylaşıldı.)
- **MK-109.5 / MK-51.1:** cp + md5 gözle teyit. (112'de her push'ta uygulandı.)
- **MK-110.4:** Emin değilsen eşleştirme/bindirme ZORLAMA — atanmamış bırak.
- **MK-110.5:** Kuru çalışma + birim test önce. (drenajTuru 25/25 mock test, sonra canlı.)
- **MK-111.2:** bindirme survivorship — boş→doldur, çelişki→flag, ağırlık %3 tolerans, sessiz ezme yok.
- **MK-112.1:** Vercel fire-and-forget self-chain güvenilmez → iç-döngü drenaj.
- **MK-112.2:** otomatik drenaj → Vercel Cron + drenajTuru (bağlantı hazır, monte edilmedi).
- **MK-112.3:** drenaj/erişim bağlama-özgü; kuyrukta devre_id yok → devre_dokuman_id .in().
- **MK-112.4:** dosya-url-al çok-bucket (allow-list, default uyumlu); helper'lar bucket param.
- **MK-112.5:** bindirme çelişkileri _eslesme JSONB'den okunur.

## Önemli hatırlatmalar (disiplinler)
- **Veriyi gör, varsayma.** Kolon adı / şema / bucket / JSONB yapısı — hepsini bakarak doğrula.
- **cp + md5 gözle teyit. git status dosya sayısını DOĞRULA.** Yeni dosya → git add.
- **Push sırası: pull --rebase → (migration COMMIT) → commit → push.** CI commit'leri rebase ile gelir.
- **HTML/JS:** tam dosya yerine cerrahi str_replace + izole node --check (büyük HTML'de). JSX → babel parse.
- **zsh:** çok satırlı komut + yorum yapıştırma `quote>`/`parse error` yapar — tek satır kullan.
- **Şema migration:** BEGIN...ROLLBACK dry-run → COMMIT (MK-98.2). Supabase SQL düz ASCII.
- Env: SUPABASE_SERVICE_KEY; SELF_BASE_URL=https://arespipe.vercel.app; mobil VITE_API_BASE.
- **Proje bilgisi ~52'de donmuş** — güncel durum yalnız bu dosyalar + git'ten.

---

## 113'e tek cümle özet
"112'de izometri drenaj buton tetik sorunu (iç-döngü + devre-özgü), spool detayda eşleşen izometri PDF
erişimi (mobil+web+çok-bucket endpoint) ve uyarılar sayfasında bindirme çelişki uyarıları bitti, üçü de
canlı doğrulandı; 113'te önce WIZARD 'yeni devre ekleme' akışını canlı doğrula (büyük eksik olabilir),
sonra mobil yönetici izometri teşhisi + format/manuel_onay oranı."
