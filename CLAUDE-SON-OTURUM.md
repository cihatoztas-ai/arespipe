# CLAUDE-SON-OTURUM — Oturum 103 (20 May 2026)

## Ne yapıldı (3 iş)

### 1) 103-A: Wizard BOM Excel oto-yönlendirme + ad-katmanı tespit + dedup
- `devre_wizard.html` (MD5 `27175d4c786666fb7d0daf9298eb2b3b`)
- A1: bom_excel -> kuyruğa `excel-generic`/`bekliyor` + upload sonrası `POST /api/kuyruk-isle-excel`
  ({is_id}) ile oto-parse tetiği. Sonuç ekranda özetleniyor. Hata-toleranslı (worker patlasa upload bozulmaz).
- A2: `autoDetect(ad, klasor, uzanti)` — Excel'de dosya ADI karar verir (malzeme listesi -> bom_excel,
  kontrol formu/teslim tutanağı -> diger). Muhafazakâr (emin değilse diger).
- Dedup: aynı ad+klasör+boyut iki kez listeye girmez (görünür uyarı).
- Kod testleri: A2 24/24, A1 5/5, dedup 5/5. Canlı test BEKLİYOR (deploy sonrası 3 nokta — son-durum #4).

### 2) Sayaç tenant-scope — açık borç #1 KAPANDI (canlı)
- Tablo zaten tenant-scope'luydu (UNIQUE(tenant_id,tip)); bug sadece RPC'deydi (tenant filtresi yok).
- Migration 085: B-G seed (son_no=0) + RPC `sonraki_no(p_tenant_id, p_tip)` yeniden yazıldı.
- `ares-store.js` (commit bc097dd, MD5 `38e8532a327aff2ddbf38bad8251597f`): helper RPC'ye tenant_id
  geçiyor + local fallback tenant-scope. Helper imzası aynı (3 çağıran değişmedi).
- Dry-run doğrulandı: A 594->595,596 | E 0->1,2. A serisi korundu.
- KARAR: spool_id anlamsız-benzersiz surrogate; her firma kendi serisi; numaraya gemi/proje yansımaz.

### 3) Migration 085 dosyası repoya eklendi
- `085_sayac_tenant_scope.sql` — çalıştırılan kalıcı SQL (BEGIN/ROLLBACK'siz).

## Yöntem notları (işe yarayan)
- "Görmeden yazma" disiplini bu oturumda 3 kez bug yakaladı: (1) gerçek tablo adı `sayac_tanimlari`
  idi, RPC tanımından çıktı (`sonraki_no` değil); (2) tablo zaten tenant-scope'luydu — şema
  değişikliği gereksizdi, iş RPC+seed'e indi; (3) `.xlsm` seed eksikliği A2 hipotezini doğrulattı.
- Kodla test (Supabase'siz): fonksiyonları dosyadan eval ile çekip gerçek dosya adları/senaryolarla
  koşturmak — entegrasyonun mantık kısmını canlıya gitmeden doğruladı.
- RPC imza değişimi = kod + migration eşzamanlı deploy (eski helper anında uyumsuz).

## Mimari kararlar: MK-103.1..4, KARAR-103.1 (detay son-durum.md)
