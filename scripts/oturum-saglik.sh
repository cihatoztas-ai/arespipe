#!/usr/bin/env bash
# AresPipe oturum sağlık kontrolü
# MK-55.1: Oturum açılış/kapanış mekanik kontrolü.
# MK-56.2: BRIEFING.md tek aktif bağlam dosyası.
# MK-56.3: Tazelik kapısı — yavaş değişen dosyalar için periyodik gözden geçirme uyarısı.
# MK-56.4: Kapanış orkestra protokolü — üç katmanlı kapanış (script + Claude + Cihat).
#          Detay: docs/KAPANIS-ORKESTRA-TASARIM.md
#
# Kullanım:
#   ./scripts/oturum-saglik.sh 60              # açılış modu
#   ./scripts/oturum-saglik.sh 60 --kapanis    # kapanış modu (Katman 1)
#
# Açılış modu (N = bu oturum):
#   - BRIEFING.md başlığı '# AresPipe BRIEFING — (N-1). Oturum Kapanışı' olmalı
#   - BRIEFING.md var ve okunur olmalı
#   - Tazelik kapısı: 'sonraki_zorunlu' ≤ N olan dosyalar uyarı listesi
#   Tutarsızsa BAYAT exit 1, tutarlıysa TEMIZ exit 0.
#
# Kapanış modu (N = bu oturum) — MK-56.4 Katman 1:
#   - BRIEFING.md başlığı '# AresPipe BRIEFING — N. Oturum Kapanışı' olmalı
#   - BRIEFING.md mtime bugün olmalı
#   - Bu oturumun commit listesi (önceki kapanıştan HEAD'e)
#   - Working tree değişimleri (henüz commit'lenmedi)
#   - 7 kritik kategori dosyası taraması (KARARLAR/ARCHITECTURE/CIHAT-PROFIL/...)
#   - Tazelik kapısı uyarıları
#   Çıktı Claude'un raporunu (Katman 2) üretmesi için organize bilgi.
#   Otomatik commit YAPILMAZ — Cihat onayı (Katman 3) zorunlu (MK-56.1).

set -euo pipefail

# === Argüman kontrolü ===
if [[ $# -lt 1 ]]; then
  echo "❌ Kullanım: $0 <oturum_no> [--kapanis]"
  echo "   Örnek (açılış):  $0 60"
  echo "   Örnek (kapanış): $0 60 --kapanis"
  exit 2
fi

OTURUM_NO="$1"
MOD="${2:-acilis}"

if ! [[ "$OTURUM_NO" =~ ^[0-9]+$ ]]; then
  echo "❌ Oturum numarası sayı olmalı: '$OTURUM_NO'"
  exit 2
fi

ONCEKI_NO=$((OTURUM_NO - 1))

# === Repo kökünde miyiz? ===
if [[ ! -f "CLAUDE.md" ]] || [[ ! -d ".github" ]]; then
  echo "❌ Bu script repo kökünden çalıştırılmalı (CLAUDE.md ve .github/ görmüyor)."
  echo "   Şu an: $(pwd)"
  exit 2
fi

BRIEFING="BRIEFING.md"

# === Yardımcı: dosya başlığını oku ===
basligi_oku() {
  local dosya="$1"
  if [[ ! -f "$dosya" ]]; then
    echo "__YOK__"
    return
  fi
  head -1 "$dosya"
}

# === Yardımcı: BRIEFING başlığından oturum no çıkar ===
# "# AresPipe BRIEFING — 56. Oturum Kapanışı" → 56
# Eşleşmezse __YOK__
briefing_no() {
  local baslik="$1"
  local no
  no=$(echo "$baslik" | grep -oE '[0-9]+\.\s*[Oo]turum' | grep -oE '[0-9]+' | head -1)
  if [[ -z "$no" ]]; then
    echo "__YOK__"
  else
    echo "$no"
  fi
}

# === Yardımcı: dosya bugün değiştirildi mi? ===
bugun_mu() {
  local dosya="$1"
  if [[ ! -f "$dosya" ]]; then
    return 1
  fi
  local mtime
  if stat -f %Sm -t %Y%m%d "$dosya" >/dev/null 2>&1; then
    mtime=$(stat -f %Sm -t %Y%m%d "$dosya")
  else
    mtime=$(stat -c %y "$dosya" | cut -d' ' -f1 | tr -d '-')
  fi
  local bugun
  bugun=$(date +%Y%m%d)
  [[ "$mtime" == "$bugun" ]]
}

# === Yardımcı: dosya mtime'ı (insan okur formatta) ===
mtime_oku() {
  local dosya="$1"
  if [[ ! -f "$dosya" ]]; then
    echo "(yok)"
    return
  fi
  if stat -f "%Sm" "$dosya" >/dev/null 2>&1; then
    stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$dosya"
  else
    stat -c "%y" "$dosya" | cut -d. -f1
  fi
}

# === Yardımcı: önceki kapanış commit'inin SHA'sını bul ===
# Önce: "docs(N-1): kapanis" pattern'i ara.
# Bulunamazsa fallback: BRIEFING.md'ye en son dokunan commit.
# Hiç yoksa: boş string (çağıran tarafa bilgi verir).
onceki_kapanis_sha() {
  local sha
  sha=$(git log --grep="docs($ONCEKI_NO).*[Kk]apan" --format="%H" -1 2>/dev/null || true)
  if [[ -z "$sha" ]]; then
    sha=$(git log --format="%H" -1 -- "$BRIEFING" 2>/dev/null || true)
  fi
  echo "$sha"
}

# === Yardımcı: tazelik kapısı kontrolü ===
# BRIEFING.md'nin "🔄 Tazelik Durumu" tablosundaki sonraki_zorunlu değerlerini
# bu oturum no ile karşılaştır, geçenleri uyarı listesine al.
tazelik_kapisi() {
  if [[ ! -f "$BRIEFING" ]]; then
    return 0
  fi

  local tablo
  tablo=$(awk '/## 🔄 Tazelik Durumu/,/^---$/' "$BRIEFING" 2>/dev/null || true)

  if [[ -z "$tablo" ]]; then
    return 0
  fi

  local uyari_var=0
  local uyari_listesi=()

  while IFS= read -r satir; do
    if [[ "$satir" =~ ^\| ]] && [[ ! "$satir" =~ \|---\| ]] && [[ ! "$satir" =~ Dosya.*Sahip ]] && [[ ! "$satir" =~ ^\|[[:space:]]*-+ ]]; then
      local dosya sahip son_no sonraki_no_raw sonraki_no
      dosya=$(echo "$satir"      | awk -F'|' '{print $2}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '`')
      sahip=$(echo "$satir"      | awk -F'|' '{print $3}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
      son_no=$(echo "$satir"     | awk -F'|' '{print $4}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -oE '^[0-9]+' | head -1)
      sonraki_no_raw=$(echo "$satir" | awk -F'|' '{print $5}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
      sonraki_no=$(echo "$sonraki_no_raw" | grep -oE '^[0-9]+' | head -1)

      if [[ -n "$sonraki_no" ]] && [[ "$sonraki_no" =~ ^[0-9]+$ ]]; then
        if [[ "$sonraki_no" -le "$OTURUM_NO" ]]; then
          uyari_var=1
          uyari_listesi+=("$dosya — sonraki_zorunlu: $sonraki_no, son_gozden_gecirme: ${son_no:-?}, ŞIMDI: $OTURUM_NO")
        fi
      fi
    fi
  done <<< "$tablo"

  if [[ $uyari_var -eq 1 ]]; then
    echo ""
    echo "── Tazelik kapısı (MK-56.3) ──"
    echo "⚠️  Bu oturumda gözden geçirilmesi gereken yavaş dosyalar:"
    for u in "${uyari_listesi[@]}"; do
      echo "   • $u"
    done
    echo ""
    echo "   Her biri için: dosyayı aç, oku, ya tarihi ileri al ya değişiklik yap."
    echo "   BRIEFING.md 'Tazelik Durumu' tablosunu güncelle."
  fi
}

# === Yardımcı: 7 kritik kategori dosyası taraması (MK-56.4) ===
# Her dosya için: önceki kapanıştan HEAD'e diff + working tree diff
# Çıktı Claude'un raporunda "X kategorisi dokunuldu/dokunulmadı" tespitine input.
kategori_taramasi() {
  local onceki="$1"

  echo "── MK-56.4 kategori taraması ──"
  echo "(Claude'un kapanış raporu için temel — her birinin bu oturumda dokunulmuş olması beklenir mi?)"
  echo ""

  # Format: "dosya|kategori_adı"
  local kategoriler=(
    "docs/KARARLAR.md|Yeni MK kararı"
    "docs/ARCHITECTURE.md|Mimari değişiklik"
    "docs/CIHAT-PROFIL.md|Yeni alerji/tercih"
    "docs/SAYFA-EKSIKLERI.md|Sayfa eksiği"
    "SPOOL-AI-VIZYON.md|Vizyon katman değişimi"
    "kurallar.json|Yeni CI kuralı"
  )

  local sat dosya tur commit_diff working_diff
  for sat in "${kategoriler[@]}"; do
    IFS='|' read -r dosya tur <<< "$sat"
    if [[ ! -f "$dosya" ]]; then
      printf "  ? %-30s (dosya yok — %s)\n" "$dosya" "$tur"
      continue
    fi

    commit_diff=""
    working_diff=""
    if [[ -n "$onceki" ]]; then
      commit_diff=$(git diff --shortstat "$onceki..HEAD" -- "$dosya" 2>/dev/null | sed 's/^ *//;s/, /,/g' || true)
    fi
    working_diff=$(git diff --shortstat HEAD -- "$dosya" 2>/dev/null | sed 's/^ *//;s/, /,/g' || true)

    if [[ -n "$commit_diff" ]] && [[ -n "$working_diff" ]]; then
      printf "  ✓ %-30s commit:[%s] + ws:[%s]\n" "$dosya" "$commit_diff" "$working_diff"
    elif [[ -n "$commit_diff" ]]; then
      printf "  ✓ %-30s commit:[%s]\n" "$dosya" "$commit_diff"
    elif [[ -n "$working_diff" ]]; then
      printf "  ✓ %-30s ws:[%s]\n" "$dosya" "$working_diff"
    else
      printf "  · %-30s dokunulmadı (%s bu oturumda yok mu?)\n" "$dosya" "$tur"
    fi
  done

  # migrations/ klasörü ayrı (dosya değil dizin)
  if [[ -d "migrations" ]]; then
    local yeni_migration="" working_mig=0
    if [[ -n "$onceki" ]]; then
      yeni_migration=$(git log --name-only --format="" "$onceki..HEAD" -- "migrations/" 2>/dev/null | sort -u | grep -v '^$' || true)
    fi
    working_mig=$(git status --porcelain -- "migrations/" 2>/dev/null | wc -l | tr -d ' ')

    if [[ -n "$yeni_migration" ]] || [[ "$working_mig" -gt 0 ]]; then
      echo "  ✓ migrations/                    DB değişimi var:"
      if [[ -n "$yeni_migration" ]]; then
        echo "$yeni_migration" | sed 's/^/      commit: /'
      fi
      if [[ "$working_mig" -gt 0 ]]; then
        git status --short -- "migrations/" | sed 's/^/      ws: /'
      fi
    else
      printf "  · %-30s dokunulmadı (DB değişimi yok mu?)\n" "migrations/"
    fi
  fi
}

# ============================================================
# AÇILIŞ MODU
# ============================================================
acilis_kontrol() {
  echo "🔎 Oturum $OTURUM_NO açılış sağlık kontrolü"
  echo ""

  # === Git durumu ===
  echo "── Git durumu ──"
  local kirli
  kirli=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$kirli" -gt 0 ]]; then
    echo "⚠️  Çalışma alanı temiz değil ($kirli dosya değişmiş/yeni):"
    git status --short | head -10
    echo ""
  else
    echo "✅ Çalışma alanı temiz"
  fi

  echo ""
  echo "── Son 3 commit ──"
  git log --oneline -3
  echo ""

  # === BRIEFING.md kontrolü ===
  echo "── BRIEFING.md ──"
  if [[ ! -f "$BRIEFING" ]]; then
    echo "❌ BAYAT — $BRIEFING dosyası yok!"
    echo ""
    echo "🔧 Onarım modu gerekli (MK-55.1 + MK-56.2):"
    echo "   1. Önceki oturumun BRIEFING.md'sini geri yükle (git log + git show)"
    echo "   2. Bu oturum için güncel BRIEFING.md yaz"
    echo "   3. Bu script'i tekrar çalıştır → TEMIZ olmalı"
    exit 1
  fi

  local briefing_baslik
  briefing_baslik=$(basligi_oku "$BRIEFING")
  local briefing_oturum_no
  briefing_oturum_no=$(briefing_no "$briefing_baslik")

  printf "  %-32s  %s\n" "$BRIEFING" "$(mtime_oku $BRIEFING)"
  printf "  %-32s    başlık: %s\n" "" "$briefing_baslik"
  echo ""

  # Beklenti: BRIEFING önceki oturumun kapanışı için yazılmış olmalı (yani N-1)
  if [[ "$briefing_oturum_no" != "$ONCEKI_NO" ]]; then
    echo "❌ BAYAT — BRIEFING.md güncellenmemiş:"
    if [[ "$briefing_oturum_no" == "__YOK__" ]]; then
      echo "   • Başlık formatı '# AresPipe BRIEFING — N. Oturum Kapanışı' değil"
    else
      echo "   • '$briefing_oturum_no. Oturum Kapanışı' yazıyor, '$ONCEKI_NO. Oturum Kapanışı' beklendi"
      echo "     (yani önceki oturum $ONCEKI_NO için kapanış yapılmamış)"
    fi
    echo ""
    echo "🔧 Onarım modu gerekli (MK-55.1):"
    echo "   1. git log --oneline ile $ONCEKI_NO'in commitlerini topla"
    echo "   2. BRIEFING.md'yi $ONCEKI_NO. oturum kapanışı için yaz"
    echo "   3. docs/KARARLAR.md son N kararını oku, eksik kayıt varsa ekle"
    echo "   4. Bu script'i tekrar çalıştır → TEMIZ olmalı"
    echo ""
    echo "Bu kontrol geçmeden gündem işine başlanmaz."
    exit 1
  fi

  echo "✅ TEMIZ — BRIEFING.md $ONCEKI_NO. oturum kapanışı için güncel."

  # === Tazelik kapısı (uyarı, BAYAT yapmaz) ===
  tazelik_kapisi

  echo ""
  echo "Sıradaki adım: gündem konuşmaya başla. (Cihat'ın 2. soruya cevabı esastır.)"
  exit 0
}

# ============================================================
# KAPANIŞ MODU — MK-56.4 Katman 1 (deterministik bilgi sunma)
# ============================================================
kapanis_kontrol() {
  echo "🔒 Oturum $OTURUM_NO kapanış kontrolü (MK-56.4 Katman 1)"
  echo ""

  if [[ ! -f "$BRIEFING" ]]; then
    echo "❌ Kapanış reddedildi: $BRIEFING dosyası yok."
    exit 1
  fi

  # === BRIEFING başlık + mtime ===
  local briefing_baslik
  briefing_baslik=$(basligi_oku "$BRIEFING")
  local briefing_oturum_no
  briefing_oturum_no=$(briefing_no "$briefing_baslik")

  local hata=0
  local hata_listesi=()

  if [[ "$briefing_oturum_no" != "$OTURUM_NO" ]]; then
    hata=1
    hata_listesi+=("$BRIEFING: '# AresPipe BRIEFING — $OTURUM_NO. Oturum Kapanışı' başlığı bekleniyor, '$briefing_baslik' var")
  fi

  if ! bugun_mu "$BRIEFING"; then
    hata=1
    hata_listesi+=("$BRIEFING: bugün değiştirilmemiş ($(mtime_oku $BRIEFING))")
  fi

  if [[ $hata -eq 1 ]]; then
    echo "❌ Kapanış reddedildi:"
    for sat in "${hata_listesi[@]}"; do
      echo "   • $sat"
    done
    echo ""
    echo "BRIEFING.md'yi güncelle, sonra tekrar çalıştır."
    exit 1
  fi

  echo "✅ BRIEFING.md $OTURUM_NO için güncel ve bugün değiştirilmiş."
  echo "   $(mtime_oku $BRIEFING)"
  echo ""

  # === Önceki kapanış commit'i ===
  local onceki_sha
  onceki_sha=$(onceki_kapanis_sha)

  # === Bu oturumun commit'leri ===
  echo "── $OTURUM_NO oturumu commit'leri ──"
  if [[ -n "$onceki_sha" ]]; then
    local commit_say
    commit_say=$(git log --oneline "$onceki_sha..HEAD" 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$commit_say" -gt 0 ]]; then
      git log --oneline "$onceki_sha..HEAD" 2>/dev/null
      echo ""
      echo "($commit_say commit, önceki kapanış: ${onceki_sha:0:7})"
    else
      echo "(önceki kapanıştan beri commit yok — bu BRIEFING güncellemesi tek değişiklik)"
    fi
  else
    echo "(önceki kapanış commit'i bulunamadı, son 10 commit:)"
    git log --oneline -10
  fi
  echo ""

  # === Working tree değişimleri ===
  echo "── Working tree değişimleri (henüz commit'lenmedi) ──"
  local working_say
  working_say=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$working_say" -gt 0 ]]; then
    git status --short
  else
    echo "(temiz)"
  fi
  echo ""

  # === 7 kategori dosyası taraması ===
  kategori_taramasi "$onceki_sha"
  echo ""

  # === Tazelik kapısı (uyarı, kapanışı durdurmaz) ===
  tazelik_kapisi

  # === Cihat onayı talimatı (MK-56.1 + MK-56.4 Katman 3) ===
  echo ""
  echo "── Onay akışı (MK-56.4) ──"
  echo ""
  echo "Katman 2 (Claude): Yukarıdaki çıktıyı oku, kapanış raporu üret."
  echo "   Şablon: 'Bu oturumda olanlar: [konu] → [dosya] güncellendi/güncellenmedi'"
  echo "   İki yönlü çelişki kontrolü:"
  echo "      • Sohbette konuşulan iş kategori taramasında dokunulmadı görünüyorsa → ALARM"
  echo "      • Kategori taramasında değişen dosya rapora yazılmamışsa → ALARM"
  echo ""
  echo "Katman 3 (Cihat): Raporu yargıla."
  echo "   • 'Doğru, push'  → commit + push"
  echo "   • 'X kaçtı'      → Claude düzeltir, başka tur"
  echo ""
  echo "Onay sonrası:"
  echo "   git add -A && git commit -m \"docs($OTURUM_NO): kapanis ...\""
  echo "   git pull --rebase origin main && git push origin main"
  echo ""
  echo "MK-56.1 kapısı: Cihat onayı zorunlu, otomasyon değil."
  echo "MK-56.4 detay: docs/KAPANIS-ORKESTRA-TASARIM.md"
  exit 0
}

# ============================================================
# Dispatcher
# ============================================================
case "$MOD" in
  --kapanis|-k|kapanis)
    kapanis_kontrol
    ;;
  acilis|--acilis|-a|"")
    acilis_kontrol
    ;;
  *)
    echo "❌ Bilinmeyen mod: $MOD"
    echo "   Kullanılabilir: (boş veya --acilis) | --kapanis"
    exit 2
    ;;
esac
