# Oturum 134 — K2 canlı doğrulama + K1+K3 v1 (uyarilar.html) + MK-134.1

133'ün K2 v1'i üretimde çalıştığı kanıtlandı; K2 operatör yüzeyinin kolay yarısı (uyarilar.html)
tamamlandı; bir CI tuzağı teşhis edilip mühürlendi. Yeni endpoint yok (12/12), MK-49.1 korundu,
migration yok.

## Bağlam — belge ile gerçeğin çeliştiği açılış

133 ritüel dosyaları "push yok, HEAD f71342d, ilk iş toplu push" diyordu. Git gerçeği farklıydı:
paket origin'de (`1a7b17c` + `382bfaf`). Belgeler push-öncesi snapshot olarak bana yüklenmişti.
MK-132.1 refleksi: belgeye körü körüne uyup "push et" demedim — push edilecek şey yoktu, verify edip
geçtim. Bu, oturumun ilk dersi oldu.

## Yapılanlar (sırayla — her adım canlı kanıt)

### 1. CI tuzağı (MK-134.1)

`feat(133)` kod commit'i (`1a7b17c`) CI'den hiç geçmemişti. Kök: 133 tek push, HEAD = `382bfaf
docs(133) [skip ci]`. Actions push'un HEAD mesajına bakar → skip → **tüm push'un CI'si atlanır,
altındaki kod commit'i dahil**. İki ekran kanıtı çakıştı: Actions'ta `1a7b17c`/`382bfaf` için run yok
(en üst hâlâ `f234856`/132); Vercel'de `1a7b17c` deployment'ı yok, sadece `382bfaf` (HEAD) deploy
edilmiş. Yani kod canlıda ama lint görmemiş. Düzeltme: .md'ye boş satır → push → `76c983e` yeşil
(#959), full-repo scan K2'yi de kapsadı. Sonra `git pull` senkron (`b47dff5`).

### 2. Vercel altyapı (tek seferlik)

`vercel login` (device) + `vercel link` (cihatoztas-ais-projects/arespipe) + `env pull .env.local`.
`SUPABASE_SERVICE_KEY` **Sensitive** olduğu için env pull çok-satırlı/tırnaklı yazdı; Node hiçbir
parser'la okuyamadı (`URL true KEY false`). Key Supabase Dashboard → Legacy service_role'den alınıp
tek seferlik env olarak verildi. Prod proje-ref `ochvbepfiatzvyknkvsn` (= arespipe-dev = prod DB)
doğrulandı; yanlış DB'ye yazma riski elendi.

### 3. K2 canlı re-parse (BAŞ İŞ ✅)

`scripts/re-parse-s02.mjs` (geçici): durum→bekliyor → parse_sonuc çek (`_eslesme` çıkar, eslestir
yeniden yazacak) → skipParse POST → DB'den doğrula. skipParse (270/301): `onceden_parse` verilince
indir+izometri-oku atlanır, eslestir (385) koşar → K2 tetiklenir. Vision'a hiç dokunmadan üretim
eşleştirme yolağı çalıştı.

Sonuç fixture'ı birebir tekrarladı (POST 200, k2-v3):
- eslesen 3 (boru 406.4 ✓, boru 323.9 ✓, bilezik DN400 ✓)
- celiski 1: **dirsek 323.9 — PDF 212.41 kg vs Excel 35.01 kg (~6×)** → gerçek 🟡
- excel_fazla_montaj 1: flanş Slip-On DN300 (montaj-info)
- malzeme_flag_sayisi 1

MK-132.1 tatmin oldu. Kök sebep (PDF parser / Excel basis / gerçek BOM) ayırt edilmedi — 135 borcu,
tek fixture yeterli kanıt değil.

### 4. K1+K3 v1 — yarısı

İki yüzey ayrımı koddan doğrulandı:
- `uyarilar.html` → `_eslesme` DOĞRUDAN → malzeme_kiyas elinde (API'siz, kolay).
- `devre_wizard_v3` İnceleme → `/api/devre-inceleme`; endpoint `_eslesme` kullanmaz, `izometrileriDerle`
  kendi eşleştirmesini sıfırdan yapar. malzeme_kiyas çıktıda yok → taşıma gerekir (büyük).

Karar: kolay yarıyı bitir (uyarilar.html), zor yarıyı 135'e böl. uyarilar.html patch'i bindirme
bloğunun birebir paraleli: `malzeme_flag_sayisi>0` → `celiski[]`=uyari(🟡,🔧), `excel_fazla_montaj[]`
=bilgi(ℹ,🔩). Soft sapma gösterilmez (134 karar 1: yalnız sert çelişki). Yardımcılar MLZ_ALAN_AD/
MLZ_PT_AD/_mlzFmt; idempotent (BND_+MLZ_ filtresi); excel_guven='otorite'→"PDF Excel'den sapıyor".
Atomik Python patch, JS parse OK, commit `5e9b0ec` (CI tetikler — MK-134.1, [skip ci] YOK).

## Mühürlenen MK

- **MK-134.1** — Bir push birden çok commit içeriyorsa ve HEAD `[skip ci]` ise push'un TÜM CI'si
  atlanır (altındaki kod commit'leri dahil). Kural: kod commit'i ile `[skip ci]` doc commit'i aynı
  push'ta, doc HEAD'de gönderilmez. Ya kod ayrı/önce push (CI koşar), ya HEAD = kod commit'i. Doğrulama:
  push sonrası kod commit'i için Actions'ta run göründü mü. (KARARLAR-ekleme-134.md'de copy-paste hazır.)

## Süreç notu

132/133 disiplini sürdü: belge gerçekle çeliştiğinde gerçek kazandı (açılış); bulgu canlı yolakta
teyit edilmeden kapatılmadı (K2 re-parse); UI işi büyüdüğünde scope bölündü (uyarilar.html bitti, v3
135'e). Bir tuzak (CI skip) iki bağımsız kaynaktan (Actions + Vercel) çapraz doğrulanıp mühürlendi.

---

> 135 açılışında: bu dosya + son-durum + CLAUDE-SONRAKI-OTURUM + PARSER 7.5/7.6 + KARARLAR MK-134.1.
> **İlk iş: doc-push CI yeşil teyidi, sonra v3 İnceleme rozeti (devre-inceleme.js taşıma + popup).**
