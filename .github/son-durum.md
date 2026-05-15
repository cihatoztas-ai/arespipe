# Son Durum — 88. Oturum (14 Mayıs 2026)

> 87 → 88 geçişi. Tanımsız malzeme paradigma değişimi (counter → gerçek-zamanlı view). 88.A canlıda, 88.C deploy ama yapısal refactor gerekiyor, 88.G beklemede.

---

## Bu Oturumun Sonucu

**88 kısmi başarıyla kapatıldı.** Backend (migration + RPC'ler) canlıda ve doğrulandı. Frontend sayfa AresPipe layout pattern'ine uymadığı için 89'da komple refactor edilecek.

### Yapılanlar

1. **Paradigma kararı (KARAR-88.1)** — Tanımsız malzeme = `spool_malzemeleri.boru_olculer_id IS NULL` gerçek-zamanlı view. Counter modeli (`tanimsiz_kayitlar.siklik_sayisi`) ve kullanıcı "Kaydet" akışı tamamen kaldırıldı. Vizyon belgesi: `docs/88-VIZYON-TANIMSIZLAR.md`.
2. **Migration `064_v_tanimsiz_havuz.sql`** (canlıda, smoke test geçti)
   - `v_tanimsiz_havuz` VIEW — sıklığa göre gruplama, RLS-aware
   - `v_tanimsiz_havuz_listele()` RPC — SECURITY DEFINER + içeride super_admin auth → tüm tenant'ları kapsar
   - `ozel_parca_boru_kaydet()` RPC — INSERT + UPDATE, tolerans ±0.5mm dış çap / ±0.3mm et
3. **CHECK constraint uyumu (KARAR-88.2)** — `boru_olculer_tenant_consistency` constraint'i `sistem_preset=false ↔ tenant_id≠NULL` zorunluluğu getiriyor. Vizyon "paylaşımlı kütüphane" olduğu için RPC `sistem_preset=true, tenant_id=NULL` ile yazıyor.
4. **Smoke test canlı doğrulaması** (BEGIN/ROLLBACK ile)
   - 30 spool (`139.7×4.5 St 37`) tek INSERT+UPDATE ile bağlandı
   - 60.3×6.3 St 37 (1 spool) tolerans dışı kaldı, kazara çapraz eşleşme yok
   - GENERATED kolonlar formül uyumlu: ic_cap=130.7, et_min=3.938, et_max=5.063, hacim=13.42, yüzey=0.439
5. **`admin/kutuphane-oneriler.html` deploy edildi** (commit `dadfb18`) ama yapısal sorunlu — 89'da komple refactor.

### Canlı Tespit Edilen Sorunlar (88.C)

- `lang.js` ve `ares-supabase.js` 404 — `../` script path'leri yanlış
- Sol sidebar yok — AresPipe admin layout pattern'ine uyumsuz
- CSS değişkenleri (`var(--ac)`, `var(--sur2)`) tarayıcı default'una düştü, palet yüklenmedi
- ARES global tanımsız → RPC çağrısı yapılamadı → liste boş "Tüm malzemeler bağlı" yanıltıcı mesajı

---

## Commit'ler (88. Oturumda)

| Hash | Mesaj |
|------|-------|
| `dadfb18` | feat(88): tanimsiz malzeme havuzu - migration + liste sayfasi |

CI: ✅ YEŞİL son commit'ten itibaren.

---

## DB Değişiklikleri

```sql
-- 88.A migration (064_v_tanimsiz_havuz.sql) — özet
CREATE OR REPLACE VIEW v_tanimsiz_havuz AS ...
CREATE OR REPLACE FUNCTION v_tanimsiz_havuz_listele() RETURNS TABLE(...) SECURITY DEFINER ...
CREATE OR REPLACE FUNCTION ozel_parca_boru_kaydet(...) RETURNS TABLE(...) SECURITY DEFINER ...
GRANT EXECUTE ON FUNCTION v_tanimsiz_havuz_listele() TO authenticated;
GRANT EXECUTE ON FUNCTION ozel_parca_boru_kaydet(...) TO authenticated;
```

Mevcut veri: 40 tanımsız `spool_malzemeleri` satırı / 31 etkilenen spool / 2 benzersiz kombinasyon (139.7×4.5 St 37 ile 60.3×6.3 St 37).

---

## 89'a Açık Borç (önceliğe göre)

1. **`admin/kutuphane-oneriler.html` komple refactor** — AresPipe admin pattern'ine uyumlu yeniden yaz. Ön koşul: bir referans admin sayfası (örn. `admin/panel.html`) ilk 60 satırını gör.
2. **88.G — Detay paneli + özel parça formu** — Liste satırına tıklayınca yan panel, form (malzeme_grubu/dn/schedule/ölçü/ağırlık-auto), `ozel_parca_boru_kaydet()` RPC çağrısı, sonuç toast.
3. **DIN 17175 seed migration (opsiyonel)** — 139.7×4.5 St 37 (30 spool) için doğru çözüm aslında özel değil standart tablo yüklenmesi. 88.A'nın UPDATE mantığı zaten hazır, sadece INSERT seed.
4. **AI standart önerisi (A-AI, 89+ değil — sonra)** — Tetik koşulu: tanımsız kayıt 50+ olunca veya Cihat sinyal verince. 88'de bilinçli ertelendi.
5. **`agirlik_kg_m` GENERATED migration** — Tutarsızlık (diğer hesaplanan kolonlar GENERATED ama bu değil). Mevcut 358 satırda sapma kontrolü gerekiyor önce. 90+ oturum.

---

## Kararlar (88'de Alınanlar)

| # | Karar |
|---|---|
| **KARAR-88.1** | Tanımsız malzeme = `boru_olculer_id IS NULL` gerçek-zamanlı view. Counter modeli ve kullanıcı "Kaydet" akışı kaldırıldı. |
| **KARAR-88.2** | Özel parça `sistem_preset=true, tenant_id=NULL` — paylaşımlı kütüphane. Tenant-spesifik özel parça senaryosu (`sistem_preset=false`) ileride tetik koşulu çıkarsa açılır. |
| **KARAR-88.3** | AI standart önerisi 88'de YOK. Halüsinasyon riski yüksek, doğrulama katmanı (kaynak + fizik + cross-check) ayrı oturumluk iş. Tetik: 50+ tanımsız kayıt veya Cihat sinyali. |
| **MK-88.A** | RPC SECURITY DEFINER + içeride `auth.uid()` + `kullanicilar.rol='super_admin'` kontrolü → güvenli RLS bypass pattern'i. Diğer admin-only RPC'lerde aynı yaklaşım. |
| **MK-88.B** | CHECK constraint'leri schema tasarım sinyali. Bypass etmek yerine vizyonu constraint'le buluştur. |
| **MK-88.C** | SQL Editor `postgres` rolünde `auth.uid()=NULL` → SECURITY DEFINER RPC'leri doğrudan test edilemez. Manuel SQL ile mantığı yürüt + ROLLBACK ile teyit et. |
| **MK-88.D** | Yeni admin sayfası yazarken **mutlaka mevcut bir referans sayfayı gör**. Script path'leri, sidebar inject pattern'i, CSS yüklemesi tahminle çalışmıyor. |

---

## Kritik Hatırlatmalar (88'den dahil)

- **MK-88.D (YENİ):** Yeni admin sayfası → referans admin sayfasını gör (`admin/panel.html` veya benzeri). Yoksa tekrar aynı path/layout hatasını yaparsın.
- **MK-88.C (YENİ):** SECURITY DEFINER + auth.uid() RPC'leri SQL Editor'da test edilemez. Manuel SQL + ROLLBACK kullan.
- **MK-88.B (YENİ):** CHECK constraint vs vizyon çakışması olursa: constraint okumadan vizyonu zorla yazma, ikisini buluştur.
- **MK-52.x (Önceki):** `~/Downloads/_arsiv/` disiplin, MD5 doğrulama, terminal git akışı (web UI upload yok).

---

## CI Son Durum

- **Build:** ✅ YEŞİL (`dadfb18`)
- **Lint:** 0 hata
- **Vercel:** Production = `dadfb18`

---

> 89. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
