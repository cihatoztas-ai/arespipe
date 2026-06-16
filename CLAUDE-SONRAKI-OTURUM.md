# CLAUDE — Sonraki Oturum (188) Brifingi

## Açılış ritüeli
```bash
cd ~/Desktop/arespipe
git pull --rebase
git status
git log --oneline -6
ls api/*.js | wc -l    # 12 olmali (MK-129.3)
```
Sonra oku: bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md + BRIEFING.md. CI yeşil mi, Vercel "Ready" mi.

## DURUM: 187 spool sayım emniyetini kurdu (B + A1 + A2-override), hepsi canlı
- **MK-187.1 (B, 1afe670):** sessiz-fallback → manuel_onay (crop yok + spool_kaynak=pozisyon).
- **MK-187.2 (A1, 87dc444):** Dökümanlar'da görsel çetele (kırpılan kutu + PDF sayısı, istemcide yeniden-üret).
- **MK-187.3 (A2-dilim1, c93d66e):** spool sayısı operator override → sentetik fazla → _paorBolShell.
- **MK-187.4 (A2-fix, 0e50dd3):** idempotent N-ayarla + inceleGetir(bolAtla) + panel kabuk-gerçeği.

## ⚠️ SIRADAKİ ASIL İŞ — A2-dilim2: eklenen spool "Eksik" damgası + sıralama
**Sorun (canlı kanıt, NB138 vövö):** Operatör override ile spool ekleyince (örn. 102769'a S03), liste'de "🔴 Eksik / döküman yok" çıkıyor ve sıralama karışık (S01 üstte, S02+ listenin altında dağınık).

**Cihat'ın doğru itirazı:** "PDF 2 spool için çizilmiş, model 1 okudu, ben 2 dedim — eklenen spool'un izometrisi o PDF'in KENDİSİ. Eksik değil." → "döküman yok" damgası YANLIŞ.

**Kök sebep (kodla doğrulandı):** Eşleştirme `normPipeline(pipeline)|normSpoolNo(spool_no)` anahtarıyla (devre-inceleme.js, izometrileriDerle + incelemeTablosu). PDF parse yalnız bulduğu spool'lar için anahtar üretir; override ile eklenen S03'ün anahtarı izometri tarafında YOK → eşleşmez → 🔴 Eksik. Sıralama da eşleşmeyenleri sona attığı için karışıyor.

**Çözüm yönü (tasarla + DATA ile doğrula):**
1. **İzometri devralma:** `_paorBolShell` shell üretirken kardeş S01'in `is_id` + `dosya_adi`'sini (izometri bağını) shell'e koysun → eklenen spool aynı PDF'e bağlı sayılsın. (Şu an shell bu bağı taşımıyor — onun için "döküman yok".)
2. **Eşleştirme/durum:** devre-inceleme, aynı çizimin (cizim_no) izometrisi VARSA, o çizimin override-eklenen spool'larını "Eksik/döküman yok" yerine "okundu/zayif (aynı PDF)" saysın. Anahtar üretimini override'a göre genişlet VEYA render'da sibling'in durumunu devral.
3. **Sıralama:** spoollar `pipeline` + `spoolNo` (S01→S02→S03) ardışık sıralansın (renderInceleme veya server sonuç sırası).
- ÖNCE DATA: incelemeTablosu'nun spool sonuç şekli + durum atama + mevcut sıralama alanını oku (api/devre-inceleme.js, `incelemeTablosu` ve izometrileriDerle anahtar üretimi). MK-158.1.

## Diğer açık işler (carry — taze SQL, MK-163.1)
- **shell malzeme devralma (MK-182.5):** Override-eklenen S0n malzemesi "—" boş. S01'in pipeline malzemesini (`pipeline_malzemeleri`) paylaşsın. `_paorBolShell` shell'i bom/cap/et boş üretiyor.
- **A2 aşağı-düzeltme:** PDF'ten az sayı yazınca kalan spool'lar `fazla` render olur (honest ama UI'da netleştir).
- **`b4af5c2b` cizim_no=null devreler:** override sibling'i cizim_no ile bulamazsa genişlemez (toast: "kardeş S01 eşleşmedi"). Bu devrelerin kabuğu nasıl null cizim_no aldı — gerekirse incele.
- **Override kalıcılığı:** `WIZ._kabukSpoollar` bellekte; terfi etmeden sayfa kapanırsa kaybolur → terfide kesinleşir. TASARIM (bug değil), istenirse taslak-kaydet eklenebilir.
- **186 carry:** crop sertleştirme (çok-spool 5-6 ucu testi, _SPOOL_KIRP ayarı), format_id=null 251 cache envanteri, NPS→mm bug (Tersan Faz2).

## Notlar (187 canlı-doğrulanmış)
- PAOR spool kaynağı = PDF-pozisyon (devre-inceleme.js:148, idx→S0n). Excel YALNIZ S01 verir (farkli_spool=1), `pipeline_malzemeleri` pipeline-seviyesi.
- 1→N genişleme = `_paorBolShell` (devre_wizard_v3.html, 184/A MK-182.6). PDF fazla'sını boş shell olarak enjekte. Override aynı motoru sentetik fazla ile kullanır.
- B sinyali: `_sayim_kirpimsiz = !spool_kirpim_b64` (izometri-oku vision yolu). spool_kaynak='pozisyon' (dosyaAdiParse) ile birlikte manuel_onay.
- A1 paneli: `_gozOnayiRender` (devre_wizard_v3.html), `_spoolKirpim` (ARES_IZO_DRENAJ.spoolKirpim) istemcide. `_SPOOL_KIRP` = {x0:0.44,y0:0,x1:1.0,y1:0.62}.
- A2 override: `_a2SayiYukselt(cizimNo, hedef)` — idempotent SET. `inceleGetir(bolAtla=true)` ile çağrılır (re-expansion atlanır).
- crop input_tokens: ~6582 = crop gitti, ~4821 = gitmedi (B yakalar).
