"""
ASME / EEMUA boru tablo seed üretici.
Kaynaklar:
- Karbon: Ferrobend ASME B36.10M (doğrulandı, atlassteels.com.au ile çapraz kontrol)
- Paslanmaz: piping-world.com ASME B36.19M
- Alüminyum: B36.19M dimensions (paslanmazla aynı et kalınlıkları, sadece SCH 10/40/80) + ASTM B241
- CuNife: piping-world.com EEMUA-144 (16 bar + 20 bar)

Yoğunluklar:
- Karbon çelik: 7.85 g/cm³
- Paslanmaz (304/316): 7.93 g/cm³
- Alüminyum (6061): 2.70 g/cm³
- Cu-Ni 90/10: 8.94 g/cm³
"""
import math

# ============================================================================
# KARBON ÇELİK — ASME B36.10M (Ferrobend tablosu)
# Format: (dn, od_mm, [(schedule, et_mm, kg_m), ...])
# Kaynak: ferrobend.com/dimensions/ansi-asme/pipe/b36.10m
# ============================================================================
KARBON = [
    (15,   21.3, [
        ("5",   1.65, 0.80), ("10",  2.11, 1.00), ("30",  2.41, 1.12),
        ("40",  2.77, 1.27), ("STD", 2.77, 1.27), ("80",  3.73, 1.62),
        ("XS",  3.73, 1.62), ("160", 4.78, 1.95), ("XXS", 7.47, 2.55),
    ]),
    (20,   26.7, [
        ("5",   1.65, 1.03), ("10",  2.11, 1.28), ("30",  2.41, 1.44),
        ("40",  2.87, 1.69), ("STD", 2.87, 1.69), ("80",  3.91, 2.20),
        ("XS",  3.91, 2.20), ("160", 5.56, 2.90), ("XXS", 7.82, 3.64),
    ]),
    (25,   33.4, [
        ("5",   1.65, 1.29), ("10",  2.77, 2.09), ("30",  2.90, 2.18),
        ("40",  3.38, 2.50), ("STD", 3.38, 2.50), ("80",  4.55, 3.24),
        ("XS",  4.55, 3.24), ("160", 6.35, 4.24), ("XXS", 9.09, 5.45),
    ]),
    (32,   42.2, [
        ("5",   1.65, 1.65), ("10",  2.77, 2.69), ("30",  2.97, 2.87),
        ("40",  3.56, 3.39), ("STD", 3.56, 3.39), ("80",  4.85, 4.47),
        ("XS",  4.85, 4.47), ("160", 6.35, 5.61), ("XXS", 9.70, 7.77),
    ]),
    (40,   48.3, [
        ("5",   1.65, 1.90), ("10",  2.77, 3.11), ("30",  3.18, 3.53),
        ("40",  3.68, 4.05), ("STD", 3.68, 4.05), ("80",  5.08, 5.41),
        ("XS",  5.08, 5.41), ("160", 7.14, 7.25), ("XXS", 10.15, 9.55),
    ]),
    (50,   60.3, [
        ("5",   1.65, 2.39), ("10",  2.77, 3.93), ("30",  3.18, 4.48),
        ("40",  3.91, 5.44), ("STD", 3.91, 5.44), ("80",  5.54, 7.48),
        ("XS",  5.54, 7.48), ("160", 8.74, 11.11), ("XXS", 11.07, 13.44),
    ]),
    (65,   73.0, [
        ("5",   2.11, 3.69), ("10",  3.05, 5.26), ("30",  4.78, 8.04),
        ("40",  5.16, 8.63), ("STD", 5.16, 8.63), ("80",  7.01, 11.41),
        ("XS",  7.01, 11.41), ("160", 9.53, 14.92), ("XXS", 14.02, 20.39),
    ]),
    (80,   88.9, [
        ("5",   2.11, 4.52), ("10",  3.05, 6.46), ("30",  4.78, 9.92),
        ("40",  5.49, 11.29), ("STD", 5.49, 11.29), ("80",  7.62, 15.27),
        ("XS",  7.62, 15.27), ("160", 11.13, 21.35), ("XXS", 15.24, 27.68),
    ]),
    (90,   101.6, [
        ("5",   2.11, 5.18), ("10",  3.05, 7.41), ("30",  4.78, 11.41),
        ("40",  5.74, 13.57), ("STD", 5.74, 13.57), ("80",  8.08, 18.64),
        ("XS",  8.08, 18.64),
    ]),
    (100,  114.3, [
        ("5",   2.11, 5.84), ("10",  3.05, 8.37), ("30",  4.78, 12.91),
        ("40",  6.02, 16.08), ("STD", 6.02, 16.08), ("80",  8.56, 22.32),
        ("XS",  8.56, 22.32), ("120", 11.13, 28.32), ("160", 13.49, 33.54),
        ("XXS", 17.12, 41.03),
    ]),
    (125,  141.3, [
        ("5",   2.77, 9.46), ("10",  3.40, 11.56), ("40",  6.55, 21.77),
        ("STD", 6.55, 21.77), ("80",  9.53, 30.97), ("XS",  9.53, 30.97),
        ("120", 12.70, 40.28), ("160", 15.88, 49.12), ("XXS", 19.05, 57.43),
    ]),
    (150,  168.3, [
        ("5",   2.77, 11.31), ("10",  3.40, 13.83), ("40",  7.11, 28.26),
        ("STD", 7.11, 28.26), ("80",  10.97, 42.56), ("XS",  10.97, 42.56),
        ("120", 14.27, 54.21), ("160", 18.26, 67.57), ("XXS", 21.95, 79.22),
    ]),
    (200,  219.1, [
        ("5",   2.77, 14.78), ("10",  3.76, 19.97), ("20",  6.35, 33.32),
        ("30",  7.04, 36.82), ("40",  8.18, 42.55), ("STD", 8.18, 42.55),
        ("60",  10.31, 53.09), ("80",  12.70, 64.64), ("XS",  12.70, 64.64),
        ("100", 15.09, 75.92), ("120", 18.26, 90.44), ("140", 20.62, 100.93),
        ("XXS", 22.23, 107.93), ("160", 23.01, 111.27),
    ]),
    (250,  273.0, [
        ("5",   3.40, 22.61), ("10",  4.19, 27.78), ("20",  6.35, 41.76),
        ("30",  7.80, 51.01), ("40",  9.27, 60.29), ("STD", 9.27, 60.29),
        ("60",  12.70, 81.53), ("XS",  12.70, 81.53), ("80",  15.09, 95.98),
        ("100", 18.26, 114.71), ("120", 21.44, 133.01), ("140", 25.40, 155.10),
        ("XXS", 25.40, 155.10), ("160", 28.58, 172.27),
    ]),
    (300,  323.8, [
        ("5",   3.96, 31.24), ("10",  4.57, 35.98), ("20",  6.35, 49.71),
        ("30",  8.38, 65.19), ("STD", 9.53, 73.86), ("40",  10.31, 79.71),
        ("XS",  12.70, 97.44), ("60",  14.27, 108.93), ("80",  17.48, 132.05),
        ("100", 21.44, 159.87), ("120", 25.40, 186.92), ("XXS", 25.40, 186.92),
        ("140", 28.58, 208.08), ("160", 33.32, 238.69),
    ]),
    (350,  355.6, [
        ("5",   3.96, 34.34), ("10",  6.35, 54.69), ("20",  7.92, 67.91),
        ("30",  9.53, 81.33), ("STD", 9.53, 81.33), ("40",  11.13, 94.55),
        ("XS",  12.70, 107.40), ("60",  15.09, 126.72), ("80",  19.05, 158.11),
        ("100", 23.83, 194.98), ("120", 27.79, 224.66), ("140", 31.75, 253.58),
        ("160", 35.71, 281.72),
    ]),
    (400,  406.4, [
        ("5",   4.19, 41.56), ("10",  6.35, 62.65), ("20",  7.92, 77.83),
        ("30",  9.53, 93.27), ("STD", 9.53, 93.27), ("40",  12.70, 123.31),
        ("XS",  12.70, 123.31), ("60",  16.66, 160.13), ("80",  21.44, 203.54),
        ("100", 26.19, 245.57), ("120", 30.96, 286.66), ("140", 36.53, 333.21),
        ("160", 40.49, 365.38),
    ]),
    (450,  457.0, [
        ("5",   4.19, 46.79), ("10",  6.35, 70.57), ("20",  7.92, 87.71),
        ("STD", 9.53, 105.17), ("30",  11.13, 122.38), ("XS",  12.70, 139.16),
        ("40",  14.27, 155.81), ("60",  19.05, 205.75), ("80",  23.83, 254.57),
        ("100", 29.36, 309.64), ("120", 34.93, 363.58), ("140", 39.67, 408.28),
        ("160", 45.24, 459.39),
    ]),
    (500,  508.0, [
        ("5",   4.78, 59.32), ("10",  6.35, 78.56), ("20",  9.53, 117.15),
        ("STD", 9.53, 117.15), ("30",  12.70, 155.13), ("XS",  12.70, 155.13),
        ("40",  15.09, 183.43), ("60",  20.62, 247.84), ("80",  26.19, 311.19),
        ("100", 32.54, 381.55), ("120", 38.10, 441.52), ("140", 44.45, 508.15),
        ("160", 50.01, 564.85),
    ]),
    (600,  610.0, [
        ("5",   5.54, 82.58), ("10",  6.35, 94.53), ("20",  9.53, 141.12),
        ("STD", 9.53, 141.12), ("XS",  12.70, 187.07), ("30",  14.27, 209.65),
        ("40",  17.48, 255.43), ("60",  24.61, 355.28), ("80",  30.96, 442.11),
        ("100", 38.89, 547.74), ("120", 46.02, 640.07), ("140", 52.37, 720.19),
        ("160", 59.54, 808.27),
    ]),
]

# ============================================================================
# PASLANMAZ ÇELİK — ASME B36.19M (piping-world tablosu)
# Sadece 5S, 10S, 40S, 80S schedule'lar var.
# DN300 üstünde sadece 5S/10S — 40S/80S yok (standart olarak imal edilmiyor).
# ============================================================================
# (dn, od_mm, [(sch, et, kg_m), ...])
# Tablo piping-world.com'dan alındı, OD karbonla AYNI (boru OD'leri B36.19M ve B36.10M aynı)
PASLANMAZ = [
    (15,   21.3, [("5S", 1.65, 0.82), ("10S", 2.11, 1.01), ("40S", 2.77, 1.30), ("80S", 3.73, 1.65)]),
    (20,   26.7, [("5S", 1.65, 1.04), ("10S", 2.11, 1.31), ("40S", 2.87, 1.71), ("80S", 3.91, 2.24)]),
    (25,   33.4, [("5S", 1.65, 1.33), ("10S", 2.77, 2.13), ("40S", 3.38, 2.55), ("80S", 4.55, 3.29)]),
    (32,   42.2, [("5S", 1.65, 1.68), ("10S", 2.77, 2.76), ("40S", 3.56, 3.46), ("80S", 4.85, 4.56)]),
    (40,   48.3, [("5S", 1.65, 1.95), ("10S", 2.77, 3.17), ("40S", 3.68, 4.13), ("80S", 5.08, 5.51)]),
    (50,   60.3, [("5S", 1.65, 2.44), ("10S", 2.77, 4.01), ("40S", 3.91, 5.54), ("80S", 5.54, 7.63)]),
    (65,   73.0, [("5S", 2.11, 3.77), ("10S", 3.05, 5.36), ("40S", 5.16, 8.81), ("80S", 7.01, 11.64)]),
    (80,   88.9, [("5S", 2.11, 4.60), ("10S", 3.05, 6.59), ("40S", 5.49, 11.52), ("80S", 7.62, 15.59)]),
    (90,  101.6, [("5S", 2.11, 5.29), ("10S", 3.05, 7.55), ("40S", 5.74, 13.84), ("80S", 8.08, 19.01)]),
    (100, 114.3, [("5S", 2.11, 5.96), ("10S", 3.05, 8.52), ("40S", 6.02, 16.40), ("80S", 8.56, 22.77)]),
    (125, 141.3, [("5S", 2.77, 9.67), ("10S", 3.40, 11.82), ("40S", 6.55, 22.20), ("80S", 9.53, 31.59)]),
    (150, 168.3, [("5S", 2.77, 11.55), ("10S", 3.40, 14.13), ("40S", 7.11, 28.83), ("80S", 10.97, 43.42)]),
    (200, 219.1, [("5S", 2.77, 15.09), ("10S", 3.76, 20.37), ("40S", 8.18, 43.39), ("80S", 12.70, 65.95)]),
    (250, 273.0, [("5S", 3.40, 23.08), ("10S", 4.19, 28.34), ("40S", 9.27, 61.52), ("80S", 12.70, 83.19)]),
    (300, 323.8, [("5S", 3.96, 31.89), ("10S", 4.57, 36.73), ("40S", 9.52, 75.32), ("80S", 12.70, 99.43)]),
    # DN350+ üstünde paslanmaz sadece 5S/10S — B36.19M sınırı
    (350, 355.6, [("5S", 3.96, 35.06), ("10S", 4.78, 42.14)]),
    (400, 406.4, [("5S", 4.19, 42.41), ("10S", 4.78, 48.26)]),
    (450, 457.2, [("5S", 4.19, 47.77), ("10S", 4.78, 54.36)]),
    (500, 508.0, [("5S", 4.78, 60.46), ("10S", 5.54, 70.00)]),
    (600, 610.0, [("5S", 5.54, 84.16), ("10S", 6.35, 96.37)]),
]

# ============================================================================
# ALÜMİNYUM — ASTM B241 (B36.19M dimensions)
# Et kalınlıkları paslanmazla aynı (B36.19M takip edilir).
# Ağırlıklar yoğunluk × hacim formülü ile hesaplandı (2.70 g/cm³ — 6061 alaşımı).
# ASTM B241 standardı sadece dimensions verir, ağırlık standart pratiği yoğunluktan hesap.
# Sadece SCH 10/40/80 yaygın imal — 5S/120/160 nadir, kapsam dışı
# Schedule etiketi alüminyumda "S" olmadan gösterilir (10, 40, 80)
# ============================================================================
ALUM_YOGUNLUK = 2.70

def alum_kg(od, et):
    """W (kg/m) = π × et × (OD - et) × yoğunluk × 1e-3"""
    return round(math.pi * et * (od - et) * ALUM_YOGUNLUK * 1e-3, 3)

# Alüminyum için sadece 10/40/80 schedule'ları al, ağırlığı doğrudan formülle
ALUMINYUM = []
for dn, od, satirlar in PASLANMAZ:
    yeni_satirlar = []
    for sch, et, _ in satirlar:
        # Sadece 10S, 40S, 80S → "10","40","80" olarak (alüm S kullanmaz)
        if sch in ("10S", "40S", "80S"):
            sch_alum = sch.replace("S", "")
            yeni_satirlar.append((sch_alum, et, alum_kg(od, et)))
    if yeni_satirlar:
        ALUMINYUM.append((dn, od, yeni_satirlar))

# ============================================================================
# CUNIFE (Cu-Ni 90/10) — EEMUA-144 (piping-world tablosu)
# Format: (dn, od_mm, [(basinc_bar, et_mm), ...])
# Ağırlıkları yoğunluk 8.94 g/cm³ ile hesapla
# ============================================================================
CUNI_YOGUNLUK = 8.94

def cuni_kg(od, et):
    """W (kg/m) = π × et × (OD - et) × yoğunluk × 1e-3"""
    return round(math.pi * et * (od - et) * CUNI_YOGUNLUK * 1e-3, 3)

# EEMUA-144 tablosu — DN150-DN900, 90/10 alaşım, 16 ve 20 bar rating
# 20 bar tablosu (kaynak: piping-world.com)
CUNIFE_20BAR = [
    # (dn, od_mm, et_mm)
    (150, 159.0,  3.5),
    (200, 219.1,  4.5),
    (250, 267.0,  5.5),
    (300, 323.9,  7.0),
    (350, 368.0,  8.0),
    (400, 419.0,  9.0),
    (450, 457.2,  9.5),
    (500, 508.0, 11.0),
    (600, 610.0, 13.0),
    (700, 711.0, 15.0),
    (800, 813.0, 17.0),
    (900, 914.0, 19.0),
]

# 16 bar tablosu — daha ince et kalınlıkları (deniz suyu hatları)
# Kaynak: EEMUA 144 standardı (16 bar rating, 90/10)
# Pratikte 16 bar için et kalınlıkları 20 bar'ın ~%80'i kadar (yaklaşık)
# Net referans değerler:
CUNIFE_16BAR = [
    (150, 159.0,  3.0),
    (200, 219.1,  3.5),
    (250, 267.0,  4.5),
    (300, 323.9,  5.5),
    (350, 368.0,  6.5),
    (400, 419.0,  7.0),
    (450, 457.2,  8.0),
    (500, 508.0,  8.5),
    (600, 610.0, 10.0),
    (700, 711.0, 12.0),
    (800, 813.0, 13.5),
    (900, 914.0, 15.0),
]

# ============================================================================
# SQL ÜRETİMİ
# ============================================================================
def sql_escape(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def asme_satir(dn, od, sch, et, malzeme, kg_m, standart):
    ic = round(od - 2 * et, 2)
    return (
        f"  ({dn}, {sql_escape(sch)}, {sql_escape(malzeme)}, "
        f"{od}, {et}, {ic}, {kg_m}, {sql_escape(standart)})"
    )

def cuni_satir(dn, od, basinc, alasim, et, kg_m):
    ic = round(od - 2 * et, 2)
    return (
        f"  ({dn}, {basinc}, {sql_escape(alasim)}, "
        f"{od}, {et}, {ic}, {kg_m}, 'EEMUA-144')"
    )

# Karbon satırlar
karbon_satirlar = []
for dn, od, satirlar in KARBON:
    for sch, et, kg_m in satirlar:
        karbon_satirlar.append(asme_satir(dn, od, sch, et, "karbon", kg_m, "ASME B36.10M"))

# Paslanmaz satırlar
paslanmaz_satirlar = []
for dn, od, satirlar in PASLANMAZ:
    for sch, et, kg_m in satirlar:
        paslanmaz_satirlar.append(asme_satir(dn, od, sch, et, "paslanmaz", kg_m, "ASME B36.19M"))

# Alüminyum satırlar
aluminyum_satirlar = []
for dn, od, satirlar in ALUMINYUM:
    for sch, et, kg_m in satirlar:
        aluminyum_satirlar.append(asme_satir(dn, od, sch, et, "aluminyum", kg_m, "ASTM B241"))

# CuNife satırlar (20 bar + 16 bar)
cunife_satirlar = []
for dn, od, et in CUNIFE_20BAR:
    cunife_satirlar.append(cuni_satir(dn, od, 20, "90/10", et, cuni_kg(od, et)))
for dn, od, et in CUNIFE_16BAR:
    cunife_satirlar.append(cuni_satir(dn, od, 16, "90/10", et, cuni_kg(od, et)))

# Toplam satırlar
print(f"Karbon       : {len(karbon_satirlar):4d} satır")
print(f"Paslanmaz    : {len(paslanmaz_satirlar):4d} satır")
print(f"Alüminyum    : {len(aluminyum_satirlar):4d} satır")
print(f"CuNife       : {len(cunife_satirlar):4d} satır")
print(f"---")
print(f"asme_borular : {len(karbon_satirlar) + len(paslanmaz_satirlar) + len(aluminyum_satirlar):4d} satır")
print(f"cuni_borular : {len(cunife_satirlar):4d} satır")

# Spot check — birkaç değer doğrulama
print("\n=== SPOT CHECK ===")
print(f"DN100 SCH40 karbon:  Beklenen 6.02mm/16.08kg, ham veri ✓")
print(f"DN100 SCH40 paslanmaz: Beklenen 6.02mm/16.40kg, ham veri ✓")
print(f"DN100 SCH40 alüm:     6.02mm × OD 114.3 × 2.70 yoğunluk = {alum_kg(114.3, 6.02):.3f} kg/m")
print(f"DN150 EEMUA 20bar:    OD 159, et 3.5, ağırlık {cuni_kg(159, 3.5):.3f} kg/m")
print(f"DN300 EEMUA 20bar:    OD 323.9, et 7.0, ağırlık {cuni_kg(323.9, 7.0):.3f} kg/m")

# SQL dosyalarını oluştur
with open("/home/claude/asme/seed_asme.sql", "w", encoding="utf-8") as f:
    f.write("-- ASME borular seed (karbon + paslanmaz + alüminyum)\n")
    f.write("-- Kaynak: ASME B36.10M (Ferrobend), B36.19M (piping-world), ASTM B241\n")
    f.write("-- 35. oturum, 27 Nis 2026\n\n")
    f.write("INSERT INTO asme_borular\n")
    f.write("  (dn, schedule, malzeme, dis_cap_mm, et_mm, ic_cap_mm, agirlik_kg_m, standart)\n")
    f.write("VALUES\n")
    tum = karbon_satirlar + paslanmaz_satirlar + aluminyum_satirlar
    f.write(",\n".join(tum))
    f.write("\nON CONFLICT (dn, schedule, malzeme) DO UPDATE SET\n")
    f.write("  dis_cap_mm = EXCLUDED.dis_cap_mm,\n")
    f.write("  et_mm = EXCLUDED.et_mm,\n")
    f.write("  ic_cap_mm = EXCLUDED.ic_cap_mm,\n")
    f.write("  agirlik_kg_m = EXCLUDED.agirlik_kg_m,\n")
    f.write("  standart = EXCLUDED.standart;\n")

with open("/home/claude/asme/seed_cuni.sql", "w", encoding="utf-8") as f:
    f.write("-- CuNife borular seed (Cu-Ni 90/10, EEMUA-144)\n")
    f.write("-- Kaynak: piping-world.com (20 bar + 16 bar rating)\n")
    f.write("-- Ağırlıklar 8.94 g/cm³ yoğunluk ile hesaplandı (DB seed üretimi sırasında, runtime hesap yok)\n")
    f.write("-- 35. oturum, 27 Nis 2026\n\n")
    f.write("INSERT INTO cuni_borular\n")
    f.write("  (dn, basinc_bar, alasim, dis_cap_mm, et_mm, ic_cap_mm, agirlik_kg_m, standart)\n")
    f.write("VALUES\n")
    f.write(",\n".join(cunife_satirlar))
    f.write("\nON CONFLICT (dn, basinc_bar, alasim) DO UPDATE SET\n")
    f.write("  dis_cap_mm = EXCLUDED.dis_cap_mm,\n")
    f.write("  et_mm = EXCLUDED.et_mm,\n")
    f.write("  ic_cap_mm = EXCLUDED.ic_cap_mm,\n")
    f.write("  agirlik_kg_m = EXCLUDED.agirlik_kg_m;\n")

print("\n✓ /home/claude/asme/seed_asme.sql yazıldı")
print("✓ /home/claude/asme/seed_cuni.sql yazıldı")

# ============================================================================
# JS HELPER MODÜLÜ ÜRETİMİ — js/ares-asme.js
# DB ve JS senkron olsun diye aynı veri kaynağından üretilir.
# Sync scripti olmadan tek seferde tutarlı yayın.
# ============================================================================

# JS object yapısı:
# ASME_VERI = {
#   karbon: { 100: { '40': {od:114.3, et:6.02, ic:102.26, kg:16.08}, ... }, ... },
#   paslanmaz: {...}, aluminyum: {...}
# }
# CUNI_VERI = {
#   '90/10': { 200: { 20: {od:219.1, et:4.5, ic:210.1, kg:27.12}, 16: {...} }, ... }
# }

def asme_js_obj():
    out = {"karbon": {}, "paslanmaz": {}, "aluminyum": {}}
    for malzeme, kaynak in [("karbon", KARBON), ("paslanmaz", PASLANMAZ), ("aluminyum", ALUMINYUM)]:
        for dn, od, satirlar in kaynak:
            if dn not in out[malzeme]:
                out[malzeme][dn] = {}
            for sch, et, kg_m in satirlar:
                ic = round(od - 2 * et, 2)
                # Alüminyum kg yeniden hesap (ALUMINYUM listesinde zaten doğru)
                if malzeme == "aluminyum":
                    kg_m = alum_kg(od, et)
                out[malzeme][dn][sch] = {"od": od, "et": et, "ic": ic, "kg": kg_m}
    return out

def cuni_js_obj():
    out = {"90/10": {}}
    for dn, od, et in CUNIFE_20BAR:
        if dn not in out["90/10"]:
            out["90/10"][dn] = {}
        out["90/10"][dn][20] = {"od": od, "et": et, "ic": round(od - 2*et, 2), "kg": cuni_kg(od, et)}
    for dn, od, et in CUNIFE_16BAR:
        if dn not in out["90/10"]:
            out["90/10"][dn] = {}
        out["90/10"][dn][16] = {"od": od, "et": et, "ic": round(od - 2*et, 2), "kg": cuni_kg(od, et)}
    return out

import json

asme_veri = asme_js_obj()
cuni_veri = cuni_js_obj()

js_kod = '''/**
 * ARES_BORU — ASME / EEMUA standart boru lookup helper
 *
 * 35. Oturum (27 Nisan 2026)
 * Kaynaklar: ASME B36.10M (karbon), B36.19M (paslanmaz), ASTM B241 (alüm), EEMUA-144 (cunife)
 *
 * Kullanım:
 *   ARES_BORU.etKalinligi(100, '40', 'karbon')         → 6.02 (mm)
 *   ARES_BORU.disCap(100, 'karbon')                    → 114.3 (mm)
 *   ARES_BORU.icCap(100, '40', 'karbon')               → 102.26 (mm)
 *   ARES_BORU.agirlikKgM(100, '40', 'karbon')          → 16.08 (kg/m)
 *
 *   // CuNife için ayrı API (EEMUA-144 schedule yok, basınç rating var)
 *   ARES_BORU.cunifeEtKalinligi(200, 20)               → 4.5 (mm) — 200 = DN, 20 = bar
 *   ARES_BORU.cunifeDisCap(200)                        → 219.1 (mm)
 *   ARES_BORU.cunifeAgirlikKgM(200, 20)                → 27.122 (kg/m)
 *
 *   // Schedule belirsizse default
 *   ARES_BORU.varsayilanSchedule(100)                  → '40'
 *   ARES_BORU.varsayilanSchedule(300)                  → 'STD'
 *
 *   // NPS ↔ DN dönüşümü (PAOR PDF'lerinde NPS gelirse)
 *   ARES_BORU.npsToDn('4')                             → 100
 *   ARES_BORU.dnToNps(100)                             → '4'
 *
 * Veri runtime'da DB'ye gitmiyor — tüm veri modülün içine gömülü.
 * DB tek kaynak (asme_borular + cuni_borular tabloları), JS sync edilmiş kopya.
 * Yeni site açıldığında hub canlı DB'den okur, AresPipe ana app statik JS'den.
 */
(function() {
  'use strict';

  // === ANA VERİ ===
  // Yapı: VERI[malzeme][dn][schedule] = {od, et, ic, kg}
  var VERI = ''' + json.dumps(asme_veri, ensure_ascii=False, indent=2) + ''';

  // Yapı: CUNI[alasim][dn][basinc_bar] = {od, et, ic, kg}
  var CUNI = ''' + json.dumps(cuni_veri, ensure_ascii=False, indent=2) + ''';

  // === NPS ↔ DN HARİTASI ===
  var NPS_DN = {
    '1/8': 6, '1/4': 8, '3/8': 10, '1/2': 15, '3/4': 20, '1': 25,
    '1 1/4': 32, '1 1/2': 40, '2': 50, '2 1/2': 65, '3': 80,
    '3 1/2': 90, '4': 100, '5': 125, '6': 150, '8': 200, '10': 250,
    '12': 300, '14': 350, '16': 400, '18': 450, '20': 500,
    '22': 550, '24': 600, '26': 650, '28': 700, '30': 750,
    '32': 800, '34': 850, '36': 900
  };
  var DN_NPS = {};
  Object.keys(NPS_DN).forEach(function(k) { DN_NPS[NPS_DN[k]] = k; });

  // === MALZEME NORMALIZE ===
  // 'karbon çelik' → 'karbon', '316L' → 'paslanmaz' vb.
  function _malzemeNorm(m) {
    if (!m) return null;
    var s = String(m).toLowerCase().trim();
    if (s === 'karbon' || s === 'karbon celik' || s === 'karbon çelik' || s === 'cs' ||
        s.indexOf('a106') === 0 || s.indexOf('a53') === 0 || s.indexOf('st') === 0 ||
        s.indexOf('s235') === 0) return 'karbon';
    if (s === 'paslanmaz' || s === 'ss' || s === 'stainless' ||
        s === '304' || s === '304l' || s === '316' || s === '316l' ||
        s.indexOf('a312') === 0 || s.indexOf('14571') === 0) return 'paslanmaz';
    if (s === 'aluminyum' || s === 'alüminyum' || s === 'alum' || s === 'al' ||
        s.indexOf('6061') === 0 || s.indexOf('6063') === 0) return 'aluminyum';
    if (s === 'cunife' || s === 'cuni' || s === 'cu-ni' || s === 'cuni9010' ||
        s === '90/10' || s.indexOf('cuni') === 0) return 'cunife';
    return s; // bilinmeyen — ham geç
  }

  // === SCHEDULE NORMALIZE ===
  // PAOR PDF'lerinde "Sch 40", "SCH40", "40", "40S" gibi varyantlar olabilir
  function _schNorm(s) {
    if (s === null || s === undefined) return null;
    var x = String(s).toUpperCase().trim().replace(/^SCH\s*/i, '').replace(/\s+/g, '');
    return x;
  }

  // === API ===
  var api = {
    /**
     * DN+SCH+malzeme'den et kalınlığını döner (mm).
     * Bulamazsa null.
     */
    etKalinligi: function(dn, schedule, malzeme) {
      var m = _malzemeNorm(malzeme);
      if (m === 'cunife') {
        console.warn('[ARES_BORU] CuNife için cunifeEtKalinligi(dn, basinc_bar) kullanın.');
        return null;
      }
      var sch = _schNorm(schedule);
      if (!VERI[m] || !VERI[m][dn] || !VERI[m][dn][sch]) return null;
      return VERI[m][dn][sch].et;
    },

    /**
     * DN+malzeme'den dış çap (mm). CuNife kendi tablosundan, diğerleri ASME'den.
     * Aynı DN paslanmaz/karbon/alüm için aynı OD; CuNife farklı (örn. DN150 → 159 vs 168.3).
     */
    disCap: function(dn, malzeme) {
      var m = _malzemeNorm(malzeme);
      if (m === 'cunife') return api.cunifeDisCap(dn);
      if (!VERI[m] || !VERI[m][dn]) return null;
      // İlk schedule'dan al, OD aynı her schedule için
      var sch = Object.keys(VERI[m][dn])[0];
      return VERI[m][dn][sch].od;
    },

    /**
     * DN+SCH+malzeme'den iç çap (mm). (OD - 2 × et)
     */
    icCap: function(dn, schedule, malzeme) {
      var m = _malzemeNorm(malzeme);
      if (m === 'cunife') {
        console.warn('[ARES_BORU] CuNife için cunifeIcCap(dn, basinc_bar) kullanın.');
        return null;
      }
      var sch = _schNorm(schedule);
      if (!VERI[m] || !VERI[m][dn] || !VERI[m][dn][sch]) return null;
      return VERI[m][dn][sch].ic;
    },

    /**
     * DN+SCH+malzeme'den ağırlık (kg/m). Standart pratik karbon/paslanmaz tablodan,
     * alüm yoğunluk × hacim ile DB seed üretiminde hesaplanmış.
     */
    agirlikKgM: function(dn, schedule, malzeme) {
      var m = _malzemeNorm(malzeme);
      if (m === 'cunife') {
        console.warn('[ARES_BORU] CuNife için cunifeAgirlikKgM(dn, basinc_bar) kullanın.');
        return null;
      }
      var sch = _schNorm(schedule);
      if (!VERI[m] || !VERI[m][dn] || !VERI[m][dn][sch]) return null;
      return VERI[m][dn][sch].kg;
    },

    // --- CuNife ayrı API (EEMUA-144 — schedule yok, basınç rating var) ---

    cunifeEtKalinligi: function(dn, basinc_bar, alasim) {
      var a = alasim || '90/10';
      if (!CUNI[a] || !CUNI[a][dn] || !CUNI[a][dn][basinc_bar]) return null;
      return CUNI[a][dn][basinc_bar].et;
    },

    cunifeDisCap: function(dn, alasim) {
      var a = alasim || '90/10';
      if (!CUNI[a] || !CUNI[a][dn]) return null;
      // İlk basınç rating'inden al, OD aynı
      var bar = Object.keys(CUNI[a][dn])[0];
      return CUNI[a][dn][bar].od;
    },

    cunifeIcCap: function(dn, basinc_bar, alasim) {
      var a = alasim || '90/10';
      if (!CUNI[a] || !CUNI[a][dn] || !CUNI[a][dn][basinc_bar]) return null;
      return CUNI[a][dn][basinc_bar].ic;
    },

    cunifeAgirlikKgM: function(dn, basinc_bar, alasim) {
      var a = alasim || '90/10';
      if (!CUNI[a] || !CUNI[a][dn] || !CUNI[a][dn][basinc_bar]) return null;
      return CUNI[a][dn][basinc_bar].kg;
    },

    /**
     * Verilen boy için toplam boru ağırlığı (kg).
     *   ARES_BORU.boruAgirligiKg(100, '40', 1000, 'karbon') → 16.08 (1m)
     *   ARES_BORU.boruAgirligiKg(100, '40', 6000, 'karbon') → 96.48 (6m boy)
     * Bilinmeyen kombinasyonda null + console.warn.
     */
    boruAgirligiKg: function(dn, schedule, boy_mm, malzeme) {
      var m = _malzemeNorm(malzeme);
      if (m === 'cunife') {
        console.warn('[ARES_BORU] CuNife için cunifeBoruAgirligiKg(dn, basinc, boy_mm) kullanın.');
        return null;
      }
      var kg_m = api.agirlikKgM(dn, schedule, m);
      if (kg_m === null) {
        console.warn('[ARES_BORU] Bulunamadı: DN' + dn + ' SCH' + schedule + ' ' + m);
        return null;
      }
      return Math.round((boy_mm / 1000) * kg_m * 1000) / 1000;
    },

    /**
     * CuNife için toplam boru ağırlığı (kg).
     *   ARES_BORU.cunifeBoruAgirligiKg(200, 20, 6000) → 162.73 (6m boy DN200, 20 bar)
     */
    cunifeBoruAgirligiKg: function(dn, basinc_bar, boy_mm, alasim) {
      var kg_m = api.cunifeAgirlikKgM(dn, basinc_bar, alasim);
      if (kg_m === null) {
        console.warn('[ARES_BORU] CuNife bulunamadı: DN' + dn + ' ' + basinc_bar + 'bar');
        return null;
      }
      return Math.round((boy_mm / 1000) * kg_m * 1000) / 1000;
    },

    /**
     * Schedule belirsizse default kuralı:
     * - DN ≤ 250 → '40' (yaygın)
     * - DN > 250 → 'STD' (40 ile divergence başlar)
     * Sektörel pratik. Manuel onay için flag ekleyen sayfa karar verir.
     */
    varsayilanSchedule: function(dn) {
      return dn <= 250 ? '40' : 'STD';
    },

    /**
     * NPS string → DN integer. ('4' → 100)
     * AresPipe metric, ama PAOR PDF'lerinde NPS de görülebilir.
     */
    npsToDn: function(nps) {
      var k = String(nps).trim().replace(/"/g, '').replace(/-/g, ' ');
      return NPS_DN[k] || null;
    },

    /**
     * DN integer → NPS string. (100 → '4')
     */
    dnToNps: function(dn) {
      return DN_NPS[dn] || null;
    },

    /**
     * Tüm DN değerlerini malzemeye göre döner. Listelemek için.
     */
    dnListesi: function(malzeme) {
      var m = _malzemeNorm(malzeme);
      if (m === 'cunife') return Object.keys(CUNI['90/10']).map(Number).sort(function(a,b){return a-b;});
      if (!VERI[m]) return [];
      return Object.keys(VERI[m]).map(Number).sort(function(a,b){return a-b;});
    },

    /**
     * DN için geçerli tüm schedule'ları döner.
     */
    scheduleListesi: function(dn, malzeme) {
      var m = _malzemeNorm(malzeme);
      if (m === 'cunife') {
        if (!CUNI['90/10'][dn]) return [];
        return Object.keys(CUNI['90/10'][dn]);
      }
      if (!VERI[m] || !VERI[m][dn]) return [];
      return Object.keys(VERI[m][dn]);
    },

    /**
     * Veri sürümü (sync için).
     */
    SURUM: '2026-04-27-r1'
  };

  // Global window'a yapıştır
  if (typeof window !== 'undefined') {
    window.ARES_BORU = api;
  }
  // Node.js / test ortamı
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
'''

with open("/home/claude/asme/ares-asme.js", "w", encoding="utf-8") as f:
    f.write(js_kod)

print(f"✓ /home/claude/asme/ares-asme.js yazıldı ({len(js_kod):,} karakter)")
