#!/usr/bin/env bash
# AresPipe oturum sağlık kontrolü
# MK-55.1: Oturum açılış/kapanış mekanik kontrolü.
#
# Kullanım:
#   ./scripts/oturum-saglik.sh 55              # açılış modu
#   ./scripts/oturum-saglik.sh 55 --kapanis    # kapanış modu
#
# Açılış modu: Üç ritüel dosyasının başlığı bu oturumla tutarlı mı kontrol eder.
#   - CLAUDE-SONRAKI-OTURUM.md başlığı '# N. Oturum' ile başlamalı (N = bu oturum)
#   - CLAUDE-SON-OTURUM.md başlığı '# (N-1). Oturum' ile başlamalı (geçen oturum özeti)
#   - .github/son-durum.md son N hafta içinde değiştirilmiş olmalı
#   Tutarsızsa BAYAT exit 1, tutarlıysa TEMIZ exit 0.
#
# Kapanış modu: Üç dosyanın başlığı bu oturumla eşleşiyor mu, mtime bugünkü mü?
#   Eşleşiyorsa: git add + git commit + gp (otomatik push).
#   Eşleşmiyorsa: hangi dosyayı güncellemen gerektiğini söyler, exit 1.

set -euo pipefail

# === Argüman kontrolü ===
if [[ $# -lt 1 ]]; then
  echo "❌ Kullanım: $0 <oturum_no> [--kapanis]"
  echo "   Örnek (açılış):  $0 55"
  echo "   Örnek (kapanış): $0 55 --kapanis"
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

SONRAKI_DOSYA="CLAUDE-SONRAKI-OTURUM.md"
SON_DOSYA="CLAUDE-SON-OTURUM.md"
DURUM_DOSYA=".github/son-durum.md"

# === Yardımcı: dosya başlığını oku ===
basligi_oku() {
  local dosya="$1"
  if [[ ! -f "$dosya" ]]; then
    echo "__YOK__"
    return
  fi
  head -1 "$dosya"
}

# === Yardımcı: başlıktan oturum no çıkar ===
# "# 55. Oturum — ..." → 55
# "# 54. Oturum (kapanış)" → 54
# Eşleşmezse __YOK__
basliktan_no() {
  local baslik="$1"
  local no
  # "# <NUM>. Oturum" pattern'i (esnek: # ile başlasın, sayı, nokta, "Oturum")
  no=$(echo "$baslik" | grep -oE '^#+\s*[0-9]+\s*\.\s*[Oo]turum' | grep -oE '[0-9]+' | head -1)
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
  # macOS: stat -f %Sm -t %Y%m%d  | Linux: stat -c %y | cut -d' ' -f1 | tr -d '-'
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

# ============================================================
# AÇILIŞ MODU
# ============================================================
acilis_kontrol() {
  echo "🔎 Oturum $OTURUM_NO açılış sağlık kontrolü"
  echo ""

  # === Önce git durumu ===
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

  # === Ritüel dosyaları ===
  echo "── Ritüel dosyaları ──"
  local sonraki_baslik son_baslik durum_baslik
  sonraki_baslik=$(basligi_oku "$SONRAKI_DOSYA")
  son_baslik=$(basligi_oku "$SON_DOSYA")
  durum_baslik=$(basligi_oku "$DURUM_DOSYA")

  local sonraki_no son_no
  sonraki_no=$(basliktan_no "$sonraki_baslik")
  son_no=$(basliktan_no "$son_baslik")

  printf "  %-32s  %s\n" "$SONRAKI_DOSYA" "$(mtime_oku $SONRAKI_DOSYA)"
  printf "  %-32s    başlık: %s\n" "" "$sonraki_baslik"
  printf "  %-32s  %s\n" "$SON_DOSYA" "$(mtime_oku $SON_DOSYA)"
  printf "  %-32s    başlık: %s\n" "" "$son_baslik"
  printf "  %-32s  %s\n" "$DURUM_DOSYA" "$(mtime_oku $DURUM_DOSYA)"
  echo ""

  # === Bayatlık kararı ===
  local bayat=0
  local bayat_listesi=()

  # SONRAKI: bu oturum için yazılmış mı?
  if [[ "$sonraki_no" != "$OTURUM_NO" ]]; then
    bayat=1
    if [[ "$sonraki_no" == "__YOK__" ]]; then
      bayat_listesi+=("$SONRAKI_DOSYA: başlığı '# $OTURUM_NO. Oturum' formatında değil")
    else
      bayat_listesi+=("$SONRAKI_DOSYA: '$sonraki_no. Oturum' yazıyor, '$OTURUM_NO. Oturum' beklendi")
    fi
  fi

  # SON: önceki oturum için mi?
  if [[ "$son_no" != "$ONCEKI_NO" ]]; then
    bayat=1
    if [[ "$son_no" == "__YOK__" ]]; then
      bayat_listesi+=("$SON_DOSYA: başlığı '# $ONCEKI_NO. Oturum' formatında değil")
    else
      bayat_listesi+=("$SON_DOSYA: '$son_no. Oturum' yazıyor, '$ONCEKI_NO. Oturum' beklendi (geçen oturumun özeti)")
    fi
  fi

  # === Sonuç ===
  if [[ $bayat -eq 0 ]]; then
    echo "✅ TEMİZ — Ritüel dosyaları $OTURUM_NO. oturum için güncel."
    echo ""
    echo "Sıradaki adım: gündem konuşmaya başla."
    exit 0
  else
    echo "❌ BAYAT — Ritüel dosyaları güncellenmemiş:"
    for sat in "${bayat_listesi[@]}"; do
      echo "   • $sat"
    done
    echo ""
    echo "🔧 Onarım modu gerekli (MK-55.1):"
    echo "   1. Önce eksik oturumların özetini topla:"
    echo "      git log --oneline --since=\"\$(stat -f %Sm -t %Y-%m-%d $SONRAKI_DOSYA)\" main"
    echo "   2. CLAUDE-SON-OTURUM.md'yi güncelle (geçen oturum özeti)"
    echo "   3. CLAUDE-SONRAKI-OTURUM.md'yi $OTURUM_NO için yaz"
    echo "   4. .github/son-durum.md'yi güncelle"
    echo "   5. Bu script'i tekrar çalıştır → TEMİZ olmalı"
    echo ""
    echo "Bu kontrol geçmeden gündem işine başlanmaz."
    exit 1
  fi
}

# ============================================================
# KAPANIŞ MODU
# ============================================================
kapanis_kontrol() {
  echo "🔒 Oturum $OTURUM_NO kapanış kontrolü"
  echo ""

  local sonraki_baslik son_baslik
  sonraki_baslik=$(basligi_oku "$SONRAKI_DOSYA")
  son_baslik=$(basligi_oku "$SON_DOSYA")

  local sonraki_no son_no
  sonraki_no=$(basliktan_no "$sonraki_baslik")
  son_no=$(basliktan_no "$son_baslik")

  # Kapanış için beklentiler:
  # - SON_DOSYA: bu oturumun özeti (# 55. Oturum)
  # - SONRAKI_DOSYA: bir sonraki oturum için (# 56. Oturum)
  local SONRAKI_NO_BEKLENEN=$((OTURUM_NO + 1))

  local hata=0
  local hata_listesi=()

  # SON: bu oturum için yazılmış mı?
  if [[ "$son_no" != "$OTURUM_NO" ]]; then
    hata=1
    hata_listesi+=("$SON_DOSYA: '# $OTURUM_NO. Oturum' başlığı bekleniyor, '$son_baslik' var")
  fi

  # SONRAKI: gelecek oturum için mi?
  if [[ "$sonraki_no" != "$SONRAKI_NO_BEKLENEN" ]]; then
    hata=1
    hata_listesi+=("$SONRAKI_DOSYA: '# $SONRAKI_NO_BEKLENEN. Oturum' başlığı bekleniyor, '$sonraki_baslik' var")
  fi

  # Mtime kontrolü
  if ! bugun_mu "$SON_DOSYA"; then
    hata=1
    hata_listesi+=("$SON_DOSYA: bugün değiştirilmemiş ($(mtime_oku $SON_DOSYA))")
  fi
  if ! bugun_mu "$SONRAKI_DOSYA"; then
    hata=1
    hata_listesi+=("$SONRAKI_DOSYA: bugün değiştirilmemiş ($(mtime_oku $SONRAKI_DOSYA))")
  fi
  if ! bugun_mu "$DURUM_DOSYA"; then
    hata=1
    hata_listesi+=("$DURUM_DOSYA: bugün değiştirilmemiş ($(mtime_oku $DURUM_DOSYA))")
  fi

  if [[ $hata -eq 1 ]]; then
    echo "❌ Kapanış reddedildi:"
    for sat in "${hata_listesi[@]}"; do
      echo "   • $sat"
    done
    echo ""
    echo "Üç dosyayı güncelle, sonra tekrar çalıştır."
    exit 1
  fi

  echo "✅ Üç dosya $OTURUM_NO için güncel ve bugün değiştirilmiş."
  echo ""

  # Git durumunu kontrol et
  local degisen
  degisen=$(git status --porcelain "$SON_DOSYA" "$SONRAKI_DOSYA" "$DURUM_DOSYA" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$degisen" -eq 0 ]]; then
    echo "ℹ️  Üç dosya stage'lenmemiş ya da zaten commitlenmiş."
    echo "    git status:"
    git status --short
    echo ""
    echo "Eğer commit gerekmiyorsa burada dur. Push gerekiyorsa: gp"
    exit 0
  fi

  echo "── Commit + push ──"
  git add "$SON_DOSYA" "$SONRAKI_DOSYA" "$DURUM_DOSYA"
  git commit -m "docs($OTURUM_NO): oturum kapanış — son+sonraki+son-durum güncellendi"

  # gp shell function olduğu için bash script'inden direkt çağrılamaz.
  # Kullanıcıya söyleyelim.
  echo ""
  echo "✅ Commit hazır. Push için sen 'gp' çalıştır:"
  echo "   gp"
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
