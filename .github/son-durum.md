# AresPipe — Son Durum (63. oturum sonu)

> 6 Mayıs 2026 — 63. oturum kapanışı

---

## CI Son Durum

- **Build:** ✅ YEŞİL (en son `b139a60` fix(mob/63.5) MDevreler olusturma kolon adi)
- **Vercel mob:** ✅ Production = `b139a60` (Ready)
- **Vercel web:** ✅ Production
- **Lint:** Faz B baseline'ı korundu

## Son Commit Zinciri (63. oturum)

```
b139a60 fix(mob/63.5): MDevreler olusturma kolon adi - 400 Bad Request
722e08b chore(ci): ci-son-rapor.json güncelle [skip ci]
47e67e3 chore(ci): ci-son-rapor.json güncelle [skip ci]
c7fe6e6 fix(mob/63.4): MQRTara payload parse + okunur durum chip
6ea42bf chore(ci): ci-son-rapor.json güncelle [skip ci]
156113f chore(ci): ci-son-rapor.json güncelle [skip ci]
536ca9e fix(mob/63.3): MDevreler ve MQRTara icin yonlendirme baglantilari
ed6e1a6 chore(ci): ci-son-rapor.json güncelle [skip ci]
546bd76 chore(ci): ci-son-rapor.json güncelle [skip ci]
4ef6c6e feat(mob/63.2): MQRTara React port - vanilla qr.html mobile karsilik
23e4beb chore(ci): ci-son-rapor.json güncelle [skip ci]
e90bf50 chore(ci): ci-son-rapor.json güncelle [skip ci]
4c7c77f fix(mob/63.1): MDevreler zone_no kolon hatasi - 400 Bad Request
acab92b feat(mob/63): MDevreler React port - vanilla devreler.html mobile karsilik
```

Net: 63. oturumda 5 feat/fix commit + GitHub Actions otomatik CI raporları.

## Bu Oturumda Yapılanlar

1. **MDevreler.jsx** (MK-63) — vanilla devreler.html mobile React port'u (1178 satır)
2. **MQRTara.jsx** (MK-63.2) — vanilla qr.html mobile React port'u (845 satır, payload parse dahil)
3. **App.jsx** — `/devreler` ve `/qr` route'ları
4. **MAnasayfaYonetici/MIslemler** — dashboard yönlendirmeleri (Aktif Devre kartı → /devreler, QR Tara kartı → /qr)
5. **lang/{tr,en,ar}.json** — 1752 → 1800 anahtar (+48: 31 m_dvr_*, 17 m_qr_*)
6. **5 canlı bug fix**: zone_no kolonu, olusturma vs olusturulma kolon adı, payload parse formatı, durum chip okunabilirliği, dashboard yönlendirmeleri

## Lang Anahtar Sayıları

- TR/EN/AR: **1800** (önceki: 1752, +48)
- 3 dilde set eşitliği ✓

## Açık Borçlar (öncelik sırası)

### 64. oturum birincil işi
- **MIsBaslat.jsx** — 1500-2000 satır, 10 ekran state machine. R-10 mockup-first ile 5-batch protokol önerisi (CLAUDE-SONRAKI-OTURUM.md detayda)

### MQRTara — gelecek oturum patch'leri
- Cross-tenant uyarısı: payload'daki tenant kodu (örn `B-`) kullanıcının tenant'ından (`A-`) farklıysa "Bu spool X firmasına aittir" uyarı ekranı (6. oturum planı)
- `is_durumu === 'devam_ediyor'` mükerrer iş uyarısı — başkası işliyor, devralma akışı
- Operatör için MIsBaslat yönlendirmesi: `rol === 'operator' ? '/is-baslat/:id' : '/spool/:id'`

### Mobile genel
- **MK-58.1** alıştırma enum lowercase migration — kod uppercase 'VAR'/'KISMI'/'YOK' okuyor, lowercase'a geçiş tek seferde yapılacak (MDevreler + MIsBaslat dönüşümünden sonra)
- **MK-62.3** README.md mobile/src/lang/ predev silme problemi — predev script (`rm -rf src/lang && mkdir -p src/lang && cp ../lang/*.json src/lang/`) README'yi siliyor, predev'e README üretme satırı eklenmeli
- **MK-58.5** Panel.html mobile preview UUID input

### Web genel (önceki oturumlardan kalan)
- 5 MK adayı vizyon konsolidasyonu (65-70)
- EN/AR dil dosyalarında 348/319 anahtar Türkçe (legacy çeviri eksikliği)

## 63. Oturumda Çıkan Yeni Disiplin Notları

- **MK-63.A:** DB sütun adlarını varsayma — vanilla'da geçen kolon adına direkt güvenme. Knowledge base'de `olusturma TIMESTAMPTZ` açıkça yazıyordu, "olusturulma" yazdım. Sed ile patch atılabilir ama önlem: SELECT yazarken information_schema kontrolü veya canlı supabase MCP query.

- **MK-63.B:** Briefing'deki "planlandı" notu = "yapılmamış" değil. 6. oturumda QR payload `KOD-NUMARA:UUID` formatı "planlandı" diye yazılmıştı, 7. oturumda implemente edilmiş. Ben planlandı notuna takılıp vanilla qr.html'de cross-check yapmadan eski format için kod yazdım. Vanilla dosyayı kontrol etseydim 5 dakikada anlardım.

- **MK-63.C:** Bilgi karışımına dikkat — knowledge base'deki `mobile/src/lang/` 61 m_* anahtarı sayısı 54. oturum öncesinden eski bilgi. Şu anda mobile/src/lang/ git'te yok (54. oturumda silindi, predev kopyalıyor). Knowledge base bayatlık konusunda baseline kontrol şart: `wc -l`, `git log --oneline`, `cat package.json | grep predev`.

## Önemli Sayılar

- **Toplam MK:** 63 oturum, sayım takibi briefing-v2.md'de
- **Mobile ekran sayısı:** 7 tamamlandı (MGiris, MAnasayfa, MAnasayfaYonetici, MIslemler, MDrawer, MSpoolDetay, MDevreDetay, MDevreler, MQRTara)
- **Lang anahtar:** 1800 (TR/EN/AR senkron)
- **HEAD:** `b139a60`

---

> 64. oturum açılışında bu dosya, `CLAUDE-SON-OTURUM.md` ve `CLAUDE-SONRAKI-OTURUM.md` okunacak.
