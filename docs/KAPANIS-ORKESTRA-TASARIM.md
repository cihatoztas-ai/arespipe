# AresPipe — Kapanış Orkestra Tasarımı

> **Rol:** Sohbet kapanışında BRIEFING.md push edilmeden önce çalışan etkileşimli protokol. Claude'un "yapıldı" iddialarını git diff ile doğrulayan + Cihat onayını zorunlu kılan üç-katmanlı sistem.
>
> **Tetikleyici:** `scripts/oturum-saglik.sh N --kapanis`
>
> **Sahip:** Cihat + Claude (script Claude'un kodu, akış Cihat'ın onayı)
>
> **MK referansı:** MK-56.1 (kapanış Cihat onayı), MK-56.4 (bu tasarımın ID'si)
>
> **Doğum:** 57. oturum (3 Mayıs 2026) — 56 sızıntısının tetiklediği telafi.

---

## 1. Hibrit Katman 1+2+3 Modeli

Üç katman, üçü birlikte aynı hatayı aynı anda yapma olasılığını azaltır. Hiçbiri tek başına yeterli değildir.

### Katman 1 — Deterministik (Script)

Sadece kanıtlanabilir gerçekler. Atlatılamaz, yorumsuz, tartışmasız.

- git diff ile hangi dosyaların değiştiği
- git status ile çalışma alanı durumu
- BRIEFING.md başlık kontrolü ("N. Oturum Kapanışı" yazıyor mu)
- BRIEFING.md mtime kontrolü (bugün dokunuldu mu)
- Tazelik kapısı (MK-56.3) — `son_gozden_gecirme` etiketleri eski mi

Doğru ya da yanlış. Yorum yok. Hata yapma kapasitesi yok (script bug'ı dışında).

### Katman 2 — Claude (Yorum + Rapor)

Claude tek toplu kapanış raporu üretir. Cihat'a "hangi dosyada ne değişmeli" listesi **gösterilmez** — bu Claude'un iç işi. Cihat sadece raporu yargılar.

Rapor şablonu (drama yok, telegrafik):

    N KAPANIŞ RAPORU
    ----------------
    Bu oturumda olanlar:
      [konu 1] → [dosya] güncellendi/güncellenmedi
      [konu 2] → ...

    Çelişki kontrolü: K alarm
      [varsa: "X dedim ama Y dosyası değişmemiş"]

    Cihat: kaçırdığım bir şey var mı?

İki yönlü çelişki kontrolü (script'in deterministik kısmı):

- **Eksiklik:** Claude "yeni X var" der → ilgili dosya git diff'te yok → ALARM
- **Fazlalık:** Claude "yeni X yok" der → ilgili dosya git diff'te var → ALARM

İki durumda da kapanış durur. Çelişki çözülmeden push olmaz.

**Sınır kabulü:** Script "sohbette ne konuşuldu"yu bilemez. Bu Claude'un yorumu. Yani Claude konuşmadaki bir konuyu kaçırırsa script yakalayamaz, Cihat (Katman 3) yakalar.

Claude'un dahili kontrol kategorileri (rapor üretirken kullanır, Cihat'a göstermez):

- Yeni MK kararı → `KARARLAR.md`
- Mimari değişiklik → `ARCHITECTURE.md`
- Cihat'tan yeni alerji/tercih → `CIHAT-PROFIL.md`
- Sayfa eksiği bulundu/kapatıldı → `SAYFA-EKSIKLERI.md`
- Vizyon katman durumu değişti → `SPOOL-AI-VIZYON.md`
- Yeni CI kuralı → `kurallar.json`
- DB değişimi/migration → `migrations/` + `DATABASE.md`

Bu liste sabit. Dinamik değil. Sebep: dinamikse Claude soruyu kendi eleyebilir, kapı zayıflar.

### Katman 3 — Cihat (Yargı)

Son söz. Claude'un raporunu denetler.

- "Doğru" → push
- "Şunu kaçırdın" → ekle, başka tur
- "Yanlış anladın, X aslında Y değil" → düzelt
- "Bu kapanmadı, hâlâ eksik" → kapanış reddedilir

Cihat'ın herhangi bir maddeye veto yetkisi vardır. Bilgi sahibi olması **gerekmez** (hangi dosyaya ne yazıldığı Claude'un işi). Yargı sahibi olması yeterli.

---

## 2. Akış — `oturum-saglik.sh N --kapanis`

    1. SCRIPT (Katman 1) çıktı üretir:
       - git diff dosya listesi
       - git status temiz mi
       - BRIEFING.md başlık + mtime
       - tazelik kapısı uyarıları (varsa)

    2. CLAUDE (Katman 2) tek rapor verir:
       - "Bu oturumda olanlar" listesi
       - Her madde için "dosya güncellendi mi" kontrolü (git diff'ten)
       - Çelişki varsa ALARM
       - "Cihat, kaçırdığım bir şey var mı?" sorusu

    3. CIHAT (Katman 3) tek tepki verir:
       - "Doğru" → kapanış izni
       - Eksik/yanlış → Claude geri okur, ekler/düzeltir, yeni rapor

    4. Kapanış izni → commit + push

Akış 4 adım. Cihat'ın muhatap olduğu yer 3. adım — tek mesaj.

### "DUR" Noktaları

Kapanış şu üç durumda durur:

- **Katman 1 alarmı:** git diff çelişkisi, BRIEFING başlığı yanlış, mtime eski
- **Katman 2 çelişkisi:** Claude'un raporundaki iddia git diff ile uyumsuz
- **Katman 3 reddi:** Cihat raporu reddediyor

Her DUR durumunda eksik tamamlanır, akış baştan başlar. Kısa devre yok.

---

## 3. Doğum Kanıtı — 56 Sızıntısı (3 Mayıs 2026)

Bu tasarım yokken ne olduğunu anlamak için 56 kapanışı somut bir vaka.

56 BRIEFING.md "Yapılanlar" listesinde yazıldı:

> *"CIHAT-PROFIL.md'ye yeni alerji eklendi: 'Varsayım yapma, kanıttan git...'"*

57 açılışında kanıt çıktı:

    $ git log -3 --format="%h %ad" --date=short docs/CIHAT-PROFIL.md
    2eedd70 2026-04-27
    c2255cd 2026-04-23

    $ grep -n "kanıttan\|varsayım yapma" docs/CIHAT-PROFIL.md
    (eşleşme yok)

Yani: dosya 56'da hiç dokunulmamış, frazlar dosyada yok. **BRIEFING yalan söyledi.**

**Niye kaçtı:** 56 Claude'un kendi öz-kontrolü "EKSİK" tespit etmişti ama BRIEFING'e o uyarıyı yansıtmadı, "yapıldı" yazdı. Cihat onayı sırasında bu çelişki gözden kaçtı.

**Bu sistem olsaydı ne olurdu:**

    Yeni alerji konuşuldu mu? → EVET
    CIHAT-PROFIL.md değişti mi? → HAYIR (git diff'te yok)
    ALARM — kapanış durur, alerji eklenir, BRIEFING dürüst yazılır.

**57 telafisi:** Alerji gerçekten eklenir, BRIEFING düzelir, MK-56.4 doğar. 56 sızıntısı bu tasarımın doğum kanıtıdır.

---

## 4. İlerideki Genişlemeler

Bu tasarım v1. Kullanıldıkça öğrenilecek noktalar:

- **Çelişki şablonu** — Şu an markdown; ileride JSON çıktı ile programatik denetim mümkün.
- **Tazelik kapısı uyarıları** — `son_gozden_gecirme` ≤ N ise sadece uyar, durdurma. Tek istisna: ARCHITECTURE.md gibi mimari dosyalar değişmişse zorunlu hale getir.
- **Yeni kategori** — 7 kategoriye ek bir tür çelişki tespit edilirse buraya eklenir.

Kapanış protokolü kullanılırken bu liste büyüyecek. Sahibi: 57 sonrası Claude + Cihat.

---

> **Bu dosyanın güncellenmesi:** Yeni katman, yeni kategori, yeni çelişki tipi tespit edilirse buraya eklenir. KARARLAR.md MK-56.4 sadece referans tutar — detay burada yaşar.
