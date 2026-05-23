# CLAUDE -- Sonraki Oturum (115) Gundemi

## Acilis ritueli (2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -8`
   (HEAD 114 kod commit'i `0cd0f89` + kapanis doc commit'i olmali).
2. Bugun ne yapmak istiyorsun?
Sonra Claude: git temiz mi, CI rengi, `docs/PROJE-HARITASI.md` + bu 3 dosya oku, gundem onayla.
**Mid-cycle scope ekleme yok.**

## Oturum basi dogrulama (Supabase SQL Editor -> duz ASCII)
```sql
-- montaj formati canli mi, tek mi
select id, ad, format_kodu, aktif, parse_disi, requires_ai,
       (parser_kural->>'montaj_modu') montaj_modu
from izometri_format_tanimlari where format_kodu='tersan_cadmatic_montaj';

-- montaj L2'ye dusuyor mu? (114 sonrasi yeni montaj islendiyse)
select coalesce(format_id::text,'(YOK)') fmt, parser_seviye, count(*), sum(coalesce(maliyet_usd,0)) usd
from ai_api_log where olusturma_at > '2026-05-23 09:00:00+00'
group by 1,2 order by 1,2;

-- kuyruk sagligi (508 hala yok mu)
select durum, count(*) from dosya_isleme_kuyrugu where parser='izometri' group by 1 order by 1;
```

---

## ⭐ ANA TEMA -- MONTAJ ESLESME + GOSTERIM (114'un B-ertelemesi)

114'te montaj TANIMA + L2 HASAT indirildi (canli, CI+Vercel yesil). Montaj ciktisi `parse_sonuc`'a
yaziliyor AMA spool detayda gorunmuyor + spool'larla eslesmemis. 115 bunu tamamlar -- **yarim is
birakma.**

### Adim 1 -- Canli montaj L2 dogrulama (ONCE bu)
- Yeni bir montaj PDF'i isle (cache MISS, `_S##_` icermeyen `_1.pdf`). Beklenen: format_id =
  tersan_cadmatic_montaj, parser_seviye='l2', maliyet=0, parse_sonuc'ta `montaj:{}` dolu.
- DB'den teyit (yukaridaki ai_api_log sorgusu). L3'e dustuyse parser/fingerprint kontrolu.
- **Risk:** pipe_no su an `[[PIPE:...]]` isaretini text'ten okuyor; izometri-oku henuz enjekte
  ETMIYOR -> pipe_no null gelir (spool_listesi yine dolar). Bu Adim 2'de cozulecek.

### Adim 2 -- pipe_no enjeksiyonu (KARAR gerekli)
parser montaj_modu'da `cikarilan.pipe_no`'yu `alanlar.pipe_no` regex'inden (`\[\[PIPE:...\]\]`) okuyor.
izometri-oku bunu dosya adindan turetip enjekte etmeli. Iki yol (A/B/C ile Cihat'a sun):
- **A -- Enjeksiyon:** izometri-oku, montaj parse'i cagirmadan once text basina `[[PIPE:<pipe_no>]]\n`
  ekler (pipe_no = dosya_adi.split('_')[0]). Parser imzasi degismez. Hafif hack ama izole.
- **B -- Parametre:** `parse(text, parserKural, {dosya_adi})` -- parser dosya adindan pipe_no turetir.
  Daha temiz, parser imzasi + cagiranlar degisir.
- **DIKKAT MK-49.1:** izometri-oku'ya dokunmak gerekiyorsa SADECE montaj parse cagrisi etrafinda,
  fingerprint okuma/skorlama tarafina DOKUNMA. A daha guvenli (cagri etrafinda kucuk ekleme).

### Adim 3 -- Eslesme (montaj -> spooller)
- Montaj `montaj.spool_listesi` (S01,S02..) + `pipe_no` -> `spooller` satirlari (`pipeline_no`+`spool_no`).
  spooller.spool_no non-unique (devre basina tekrar) -> devre_id ile sinirla. spool_id (text) tekil.
- `montaj.alistirma` (PARCA/BAGLI) -> `spooller.alistirma` yansit. **DIKKAT:** spooller.alistirma
  zaten 3-degerli enum (YOK/VAR/KISMI -- memory). PARCA/BAGLI bunlara nasil maplenecek? KARAR:
  PARCA->VAR (kendisi alistirma), BAGLI->KISMI (?), ya da ayri bir alan. Cihat ile netlestir.
- continue_baglanti -> simdilik parse_sonuc'ta kalsin (graf sorgusu ihtiyaci dogunca tablo).
- MK-111.2 bindirme: bos->doldur, celiski->flag, sessiz ezme yok. Montaj toplam_agirlik vs imalat
  spool-agirlik -- FARKLI anlamlar, ezme yok.

### Adim 4 -- Spool detayda gosterim
- spool_detay.html: montaj katmani (spool'un ait oldugu boru, continue baglanti, alistirma,
  guverte) bir kart/sekme. Personele acik (114 karari: imalat+montaj personele, diger belgeler sistemde).
- Belge gorunurluk ekseni (personel/yonetici) ileride; simdi montaj/imalat ikisi de gorunur.

---

## IKINCIL (115'te zaman kalirsa / sonraki)

- **D1 kalan ($0.39 DIGER) + D3 ($1.60):** PAOR Ana (995b5514, kural yok %100 L3) + 15243262
  (parse_disi=true ama L3'e gitmis $0.33 -- canli mi legacy mi 1 sorguyla kapat).
- **Asama 4b backend olu kod** (drenajTuru + DRENAJ dispatch + kuyruk-isle.js self-chain).
- **Batch sayfalari client-loop'a** (izometri-batch + incele, 508 riski).

## Acik borclar (oncelik sonrasi)
1. i18n borcu (G-01): 113 wizard + 112 izo drenaj anahtarlari lang/*.json'da yok.
2. Mobil yonetici izometri PDF teshisi (112'den devir).
3. `_N` alt-spool fallback (MK-110.2).
4. Ikiz kolon temizligi (agirlik/agirlik_kg, durum/is_durumu) + web spool durum senkronu.
5. Wizard yeni-devre UI redesign (fonksiyon calisiyor, mockup sonra).
6. Test verisi temizligi.
7. **3D/walk deneyi (MK-49.A)** -- KAPANIS SONRASI DENEME olarak konusuldu. Tek cok-bukumlu spoolda
   (orn. M100-313-37-ALS) Cut&Bending Info aci/uzunluk + FR/CL/BL cipalariyla walk + kisit-cozumu.
   Montaj continue-grafi + cipalar zemini atti. Tam 3B degil, uzamsal iskelet + oz-denetim hedefi.
   STEP dosyasi gelirse Rosetta-tasi olarak token semantigi cozulebilir (gelecek arastirma hatti).

## Destekleyen kararlar (akilda tut)
- **MK-49.1:** izometri-oku.js fingerprint okuma/skorlama tarafina DOKUNMA. Montaj parse cagrisi
  etrafindaki pipe_no enjeksiyonu bu sinirda dikkatli (cagri etrafinda, skorlama degil).
- **MK-114.1..5:** montaj = format_id ayrimi; (YOK) deligi montajdi; A-siki fingerprint + guvenlik
  agi; pipe_no dosya adindan; l2-parser montaj_modu geri uyumlu.
- **MK-108.4:** kolon/tablo/CHECK adi yazmadan information_schema/pg_constraint ile dogrula.
- **MK-111.2:** bindirme survivorship -- bos->doldur, celiski->flag, sessiz ezme yok.
- **MK-99.1:** format_kodu UNIQUE degil -> idempotency guard. Migration arsivi dry-run modunda.
- **MK-101.1:** arespipe_kopyala -> git status (sessiz kayip). MK-51.1: cp + md5 gozle teyit.

## Onemli hatirlatmalar (disiplinler)
- **Veriyi gor, varsayma.** 114'te iki hatali taniyi (glyph + imalat-takiliyor) olcum curuttu.
- **Cok ornekle test.** 2 yetmez; montaj alan haritasi ancak 6 ornekte saglamlasti.
- **CHECK/enum -> pg_constraint ile dogrula** (egitim_kaynagi yakalandi). spooller.alistirma enum'unu
  PARCA/BAGLI maplemeden once gercek degerlerini sorgula.
- **Migration: dry-run ROLLBACK -> dogrula -> COMMIT.** Repoya dry-run halinde yaz. Supabase elle akis.
- **Push: add -> commit -> pull --rebase -> push.** Kod commit'i [skip ci] YOK.
- **HTML/JS:** cerrahi str_replace + izole node --check. zsh tek satir komut.
- Env: SUPABASE_SERVICE_KEY; SELF_BASE_URL=https://arespipe.vercel.app; mobil VITE_API_BASE.
- **Proje bilgisi ~52'de donmus** -- guncel durum yalniz bu dosyalar + git'ten.

---

## 115'e tek cumle ozet
"114'te format ogrenme D1 deligi tanilandi (veriyle tersine dondu: imalat zaten L2'deydi, delik
malzeme-listesi-olmayan MONTAJ cizimlerinin pahali L3'e gitmesiydi), cozuldu: yeni
tersan_cadmatic_montaj format kaydi (migration 090) + l2-parser'a geri-uyumlu montaj_modu +
liste_alanlar -> montaj artik L2 deterministik topoloji hasati (spool listesi + continue +
alistirma + agirlik), ~$3.38 L3 israfi durdu, izometri-oku'ya dokunulmadi (MK-49.1), canli (CI+Vercel
yesil). 115 ANA TEMA: montaj ESLESME + GOSTERIM + pipe_no enjeksiyonu -- once canli L2 dogrula, sonra
spool'lara bagla (pipeline_no+spool_no, alistirma->spooller.alistirma), sonra spool detayda goster.
Yarim is birakma. Sonra D1 kalan + D3."
