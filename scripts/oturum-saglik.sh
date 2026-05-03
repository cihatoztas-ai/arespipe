#!/usr/bin/env bash
# AresPipe oturum sağlık kontrolü
# MK-55.1: Oturum açılış/kapanış mekanik kontrolü.
# MK-56.2: BRIEFING.md tek aktif bağlam dosyası.
# MK-56.3: Tazelik kapısı — yavaş değişen dosyalar için periyodik gözden geçirme uyarısı.
#
# Kullanım:
#   ./scripts/oturum-saglik.sh 57              # açılış modu
#   ./scripts/oturum-saglik.sh 56 --kapanis    # kapanış modu
#
# Açılış modu (N = bu oturum):
#   - BRIEFING.md başlığı '# AresPipe BRIEFING — (N-1). Oturum Kapanışı' olmalı
#     (yani önceki oturumun kapanışı, çünkü o oturum bizim için "Son" oturum)
#   - BRIEFING.md var ve okunur olmalı
#   - Tazelik kapısı: BRIEFING'in "🔄 Tazelik Durumu" tablosundaki
#     'sonraki_zorunlu' ≤ N olan dosyalar uyarı listesi olarak gösterilir
#   Tutarsızsa BAYAT exit 1, tutarlıysa TEMIZ exit 0.
#
# Kapanış modu (N = bu oturum):
#   - BRIEFING.md başlığı '# AresPipe BRIEFING — N. Oturum Kapanışı' olmalı
#   - BRIEFING.md mtime bugün olmalı
#   - Eşleşiyorsa: git add + git commit. Push manuel `gp` ile.

set -euo pipefail

# === Argüman kontrolü ===
if [[ $# -lt 1 ]]; then
  echo "❌ Kullanım: $0 <oturum_no> [--kapanis]"
  echo "   Örnek (açılış):  $0 57"
  echo "   Örnek (kapanış): $0 56 --kapanis"
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
#
# Not: em dash (—) parsing sorunlarını önlemek için basit regex kullanıyoruz —
# başlıkta "<NUM>. Oturum" pattern'ini bul, ilk sayıyı al. BRIEFING tek satırlık
# başlıkta zaten tek "X. Oturum" geçer, çakışma riski yok.
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

# === Yardımcı: tazelik kapısı kontrolü ===
# BRIEFING.md'nin "🔄 Tazelik Durumu" tablosundaki sonraki_zorunlu değerlerini
# bu oturum no ile karşılaştır, geçenleri uyarı listesine al.
#
# Tablo formatı (BRIEFING.md içinde):
# | `SPOOL-AI-VIZYON.md` | Cihat | 56 | 76 (20 oturum) | ... |
#
# Beklenen kolon sırası: dosya | sahip | son_gozden_gecirme | sonraki_zorunlu | tetikleyici
tazelik_kapisi() {
  if [[ ! -f "$BRIEFING" ]]; then
    return 0
  fi

  # "🔄 Tazelik Durumu" başlığından "---" satırına kadar olan tabloyu çıkar
  local tablo
  tablo=$(awk '/## 🔄 Tazelik Durumu/,/^---$/' "$BRIEFING" 2>/dev/null || true)

  if [[ -z "$tablo" ]]; then
    return 0
  fi

  # Tablo satırlarını işle (| ile başlayan, --- ve başlık satırlarını eleyen)
  local uyari_var=0
  local uyari_listesi=()

  while IFS= read -r satir; do
    # Sadece veri satırları (| ile başla, |---| pattern'i değil, başlık değil)
    if [[ "$satir" =~ ^\| ]] && [[ ! "$satir" =~ \|---\| ]] && [[ ! "$satir" =~ Dosya.*Sahip ]] && [[ ! "$satir" =~ ^\|[[:space:]]*-+ ]]; then
      # Kolonları ayıkla: pipe ile böl
      local dosya sahip son_no sonraki_no_raw sonraki_no
      dosya=$(echo "$satir"      | awk -F'|' '{print $2}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '`')
      sahip=$(echo "$satir"      | awk -F'|' '{print $3}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
      son_no=$(echo "$satir"     | awk -F'|' '{print $4}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -oE '^[0-9]+' | head -1)
      sonraki_no_raw=$(echo "$satir" | awk -F'|' '{print $5}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
      sonraki_no=$(echo "$sonraki_no_raw" | grep -oE '^[0-9]+' | head -1)

      # Geçerli sayı mı?
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
# KAPANIŞ MODU
# ============================================================
kapanis_kontrol() {
  echo "🔒 Oturum $OTURUM_NO kapanış kontrolü"
  echo ""

  if [[ ! -f "$BRIEFING" ]]; then
    echo "❌ Kapanış reddedildi: $BRIEFING dosyası yok."
    exit 1
  fi

  local briefing_baslik
  briefing_baslik=$(basligi_oku "$BRIEFING")
  local briefing_oturum_no
  briefing_oturum_no=$(briefing_no "$briefing_baslik")

  local hata=0
  local hata_listesi=()

  # BRIEFING bu oturum için yazılmış mı?
  if [[ "$briefing_oturum_no" != "$OTURUM_NO" ]]; then
    hata=1
    hata_listesi+=("$BRIEFING: '# AresPipe BRIEFING — $OTURUM_NO. Oturum Kapanışı' başlığı bekleniyor, '$briefing_baslik' var")
  fi

  # Mtime bugün mü?
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
  echo ""

  # Git durumunu kontrol et — BRIEFING + olası diğer değişen dosyalar
  echo "── Değişen dosyalar ──"
  git status --short
  echo ""

  local degisen
  degisen=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$degisen" -eq 0 ]]; then
    echo "ℹ️  Hiç değişen dosya yok ya da hepsi zaten commitlenmiş."
    echo "Eğer push gerekiyorsa: gp"
    exit 0
  fi

  echo "── Onay bekleniyor (MK-56.1) ──"
  echo ""
  echo "Cihat 'doğru, push' demeden bu script otomatik commit yapmaz."
  echo "Manuel akış:"
  echo "   1. Üstteki 'Değişen dosyalar' listesini incele."
  echo "   2. Sorun yoksa: git add -A && git commit -m \"docs($OTURUM_NO): oturum kapanış\""
  echo "   3. Push: gp"
  echo ""
  echo "MK-56.1 kapısı: Cihat onayı zorunlu, otomasyon değil."
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
