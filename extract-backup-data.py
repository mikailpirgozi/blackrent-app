#!/usr/bin/env python3
"""
Skript na extrahovanie a zobrazenie dát z PostgreSQL zálohy
"""

import re
import json
from datetime import datetime

def extract_table_data(sql_content, table_name):
    """Extrahuje dáta pre konkrétnu tabuľku"""
    # Nájdi sekciu s COPY príkazom pre tabuľku
    pattern = f"COPY public.{table_name} \\((.*?)\\) FROM stdin;(.*?)\\\\\\."
    match = re.search(pattern, sql_content, re.DOTALL)
    
    if not match:
        return None, None
    
    columns = match.group(1).split(', ')
    data_section = match.group(2).strip()
    
    if not data_section:
        return columns, []
    
    # Parsuj riadky dát
    rows = []
    for line in data_section.split('\n'):
        if line.strip():
            # PostgreSQL COPY formát používa \t ako delimiter
            values = line.split('\t')
            rows.append(values)
    
    return columns, rows

def display_table(name, columns, rows, limit=10):
    """Zobrazí tabuľku v prehľadnom formáte"""
    print(f"\n{'='*80}")
    print(f"📊 TABUĽKA: {name.upper()} ({len(rows)} záznamov)")
    print('='*80)
    
    if not rows:
        print("❌ Žiadne dáta")
        return
    
    # Zobraz hlavičku
    print("\n" + " | ".join(columns[:5]))  # Zobraz prvých 5 stĺpcov
    print("-" * 80)
    
    # Zobraz prvých N riadkov
    for i, row in enumerate(rows[:limit], 1):
        display_row = []
        for j, val in enumerate(row[:5]):  # Prvých 5 hodnôt
            if val == '\\N':
                display_row.append('NULL')
            elif len(str(val)) > 30:
                display_row.append(str(val)[:27] + '...')
            else:
                display_row.append(str(val))
        print(f"{i}. " + " | ".join(display_row))
    
    if len(rows) > limit:
        print(f"\n... a ďalších {len(rows) - limit} záznamov")

def main():
    print("📂 Načítavam zálohu...")
    
    # Načítaj SQL súbor
    with open('r2-recovered-backups/extracted-backup.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    print(f"✅ Záloha načítaná ({len(sql_content)} bajtov)")
    
    # Tabuľky ktoré chceme zobraziť
    tables_to_extract = [
        'users',
        'users_advanced', 
        'customers',
        'rentals',
        'vehicles',
        'companies',
        'expenses',
        'settlements',
        'vehicle_documents'
    ]
    
    print("\n🔍 Extrahujem dáta z tabuliek...")
    
    for table_name in tables_to_extract:
        columns, rows = extract_table_data(sql_content, table_name)
        if columns:
            display_table(table_name, columns, rows)
        else:
            print(f"\n⚠️ Tabuľka {table_name} nebola nájdená v zálohe")
    
    # Špeciálne - zobraz všetkých users detailne
    print("\n" + "="*80)
    print("👥 DETAILNÝ PREHĽAD POUŽÍVATEĽOV")
    print("="*80)
    
    columns, rows = extract_table_data(sql_content, 'users')
    if rows:
        for i, row in enumerate(rows, 1):
            print(f"\n👤 Používateľ #{i}:")
            for j, col in enumerate(columns[:10]):  # Prvých 10 stĺpcov
                value = row[j] if j < len(row) else 'N/A'
                if value == '\\N':
                    value = 'NULL'
                print(f"  {col}: {value}")
    
    # Zobraziť štatistiky
    print("\n" + "="*80)
    print("📈 SUMÁRNE ŠTATISTIKY")
    print("="*80)
    
    stats = {}
    for table_name in tables_to_extract:
        columns, rows = extract_table_data(sql_content, table_name)
        if columns:
            stats[table_name] = len(rows)
    
    for table, count in sorted(stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  • {table}: {count} záznamov")
    
    print("\n✅ Analýza dokončená!")

if __name__ == "__main__":
    main()
