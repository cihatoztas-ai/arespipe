# 51. Oturum — Tersan L2 Canlı Entegrasyon

> **Hedef oturum açılışı**, 50'yi takip eder.

---

## Açılış Ritüeli (CLAUDE.md disiplini)

5 kontrol cevabı zorunlu:

1. **`git pull` temiz mi?** → `cd ~/Desktop/arespipe && git pull origin main`
2. **CI yeşil mi?** → `https://github.com/cihatoztas-ai/arespipe/actions`
3. **`son-durum.md` güncel mi?** → 50 sonu durumu yansıtmalı
4. **Bekleyen migration var mı?** → Yoktur (024, 025, 026 hepsi uygulandı)
5. **Cihat'tan geri bildirim var mı?** → Sor

---

## 51'in Hedefi

L2 prototip hazır, **lokal test 3/3 yeşil**. Şimdi canlıya bağlanır.

### Ana İş — `izometri-oku.js` `parserKuralIle` STUB'ını gerçek L2'ye bağla

**MK-49.1 disiplini:** sadece **3 satır değişiklik**. Aşağıdaki gibi:

```javascript
// izometri-oku.js, parserKuralIle fonksiyonu
async function parserKuralIle(text, format) {
  if (!format.parser_kural || Object.keys(format.parser_kural).length === 0) {
    return { ok: false, sebep: 'parser_kural_yok', parser_seviye: 'l3' };
  }
  
  const { parse } = await import('../lib/l2-parser.js');
  return parse(text, format.parser_kural);
}
```

**Test planı:** Tersan PDF'i tekrar yükle, log'a `parser_seviye='l2'` yazsın, AI çağrısı yapılmasın, sonuç kullanıcının manuel onayına düşsün.

### İkincil İşler

1. **L2 metrikleri** — `ai_api_log.parser_seviye` kolonu izometri-oku.js'te doldurulsun (cache_hit / l2 / l3)
2. **Format envanter UI** — super_admin için `/admin/formatlar` sayfası (hangi format L2 aktif, başarı oranı, son N kullanım, parser_kural görüntüleme)
3. **Malzeme satır pattern temizliği** — "WELDING NUMBERCUT NUMBER" gibi false positive'ler ele
4. **Etkileşimli format öğretme modal** — yeni format keşfedilince AI L3 sonucunu göster, parser_kural taslağı önerip kullanıcıya onaylat
5. **AI taslak üret endpoint** — L3 sonucu + 2. AI prompt → parser_kural taslağı
6. **tv() i18n eksiklikleri** — 28 uyarı var, `lang/tr.json` ve `lang/en.json` doldur
7. **Hatalı kayıt aksiyonları** — kuyruk-yeniden-dene, kuyruk-sil, kuyruk-pdf-indir endpoint'leri

---

## Kritik Hatırlatmalar

- **`izometri-oku.js`'e DOKUNMA** (MK-49.1) — sadece `parserKuralIle` fonksiyonu, 3 satır
- **Hassas anahtar Claude'a verme** (MK-50.1) — Vercel/Supabase Dashboard → Mac terminal env → Claude'a sadece çıktı
- **Yeni format için parser_kural yazmadan önce 3+ başarılı AI örneği** (MK-50.3)
- **Dotfile oluşturduktan sonra `ls -la` kontrol et** (MK-50.4)
- **Image-PDF formatları L2 yapamaz** (MK-50.2 — PAOR cache+L3'te kalır)

---

## 51'de Veriyle Tasarım

L2 bağlandıktan sonra:

- Tersan'da yeni PDF yükle, `parser_seviye='l2'` kolonuna düştüğünü kontrol et
- 5-10 farklı Tersan PDF birikince malzeme pattern'lerini tekrar bak (50'de 3 örnekle yazdık, MK-50.3 prensibi)
- L3 fallback oranı %15+ olursa "format eskiyor" uyarısı mantığını kur

---

## 52+ Vizyonu

- **Format evolution** — L3 fallback metrikleri
- **SCH parsing** — `2"SCH40` → DN50, dış çap + et lookup (`boru_olculer` tablosuna, 44'te kurulu altyapı)
- **Image-PDF için L2.5** — Pre-trained AI prompt cache (PAOR gibi formatlarda tutarlılık)
- **Pasif öğrenme** — Manuel onay düzeltmeleri parser_kural'a feedback

---

## Storage Path'leri (Tersan Test PDF'leri — 50'de kullanıldı)

```
S08: 00000000-0000-0000-0000-000000000001/8a56c1f7-8d9d-4f18-985e-b54d0c1a206c/g200-303-bs15-4-5-.s08.1-momo0h57-80.pdf
S09: 00000000-0000-0000-0000-000000000001/8a56c1f7-8d9d-4f18-985e-b54d0c1a206c/g200-303-bs15-4-5-.s09.1-momo0h56-681.pdf
S10: 00000000-0000-0000-0000-000000000001/8a56c1f7-8d9d-4f18-985e-b54d0c1a206c/g200-303-bs15-5-5-.s10.1-momo0h55-968.pdf
```

51'de canlı test yaparken bunlar yeniden kullanılabilir (cache HIT olur, L2'nin ikinci yüklemede çalıştığını görmek için yeni PDF yükle).

---

## Süreç Disiplinleri (50'den taşınan)

- **Heredoc yöntemi** dosya yazma için tercih edilir (Mac indirme bozuk)
- **`cat > ... <<'EOF'`** çoklu dosya yazımında etkili
- **`ls -la`** dotfile kontrolü için zorunlu
- **`git stash`** + **`git pull --rebase`** + **`git stash pop`** modified `.DS_Store` durumlarında
- **Vim açılırsa:** `Esc` → `:q!` → `Enter` (kaydetmeden çık) — sonra abort
- **Çakışma çözümü:** `git checkout --ours <dosya>` (rebase'de HEAD = remote)

---

> 51. oturum açılışında bu dosya, `son-durum.md` ve `docs/CLAUDE-SON-OTURUM.md` okunur. Sonra Cihat'a "Hangi işle başlayalım?" sorusu sorulur.
