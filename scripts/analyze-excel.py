#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import json
from collections import Counter

# قراءة ملف Excel
file_path = '/data/.openclaw/workspace/albassam-tasks/data/employees_data.xlsx'

print("\n📊 تحليل ملف بيانات الموظفين:")
print("=" * 80)

try:
    # قراءة الملف
    df = pd.read_excel(file_path, sheet_name=0)
    
    print(f"\n✅ تم قراءة الملف بنجاح!")
    print(f"📋 عدد الموظفين: {len(df)}")
    print(f"📋 عدد الأعمدة: {len(df.columns)}")
    
    print("\n📑 أسماء الأعمدة:")
    for i, col in enumerate(df.columns, 1):
        print(f"   {i}. {col}")
    
    print("\n" + "=" * 80)
    print("\n🔍 عينة من البيانات (أول 3 صفوف):")
    print(df.head(3).to_string())
    
    # تحليل المسميات الوظيفية
    print("\n" + "=" * 80)
    if 'الوظيفة' in df.columns or 'المسمى الوظيفي' in df.columns or 'position' in df.columns:
        job_col = None
        for col in df.columns:
            if 'وظيف' in str(col).lower() or 'مسمى' in str(col).lower() or 'position' in str(col).lower():
                job_col = col
                break
        
        if job_col:
            print(f"\n💼 المسميات الوظيفية (العمود: {job_col}):")
            jobs = df[job_col].dropna().value_counts()
            print(f"\n   إجمالي المسميات المختلفة: {len(jobs)}")
            print("\n   أكثر 20 مسمى تكراراً:")
            for job, count in jobs.head(20).items():
                print(f"      {count:3d}x - {job}")
    
    # تحليل الأقسام
    print("\n" + "=" * 80)
    if 'القسم' in df.columns or 'department' in df.columns:
        dept_col = None
        for col in df.columns:
            if 'قسم' in str(col).lower() or 'department' in str(col).lower():
                dept_col = col
                break
        
        if dept_col:
            print(f"\n🏢 الأقسام (العمود: {dept_col}):")
            depts = df[dept_col].dropna().value_counts()
            print(f"\n   إجمالي الأقسام المختلفة: {len(depts)}")
            print("\n   القائمة الكاملة:")
            for dept, count in depts.items():
                print(f"      {count:3d}x - {dept}")
    
    # تحليل الفروع
    print("\n" + "=" * 80)
    if 'الفرع' in df.columns or 'branch' in df.columns:
        branch_col = None
        for col in df.columns:
            if 'فرع' in str(col).lower() or 'branch' in str(col).lower():
                branch_col = col
                break
        
        if branch_col:
            print(f"\n🏭 الفروع (العمود: {branch_col}):")
            branches = df[branch_col].dropna().value_counts()
            print(f"\n   إجمالي الفروع المختلفة: {len(branches)}")
            print("\n   القائمة الكاملة:")
            for branch, count in branches.items():
                print(f"      {count:3d}x - {branch}")
    
    # حفظ ملخص JSON
    summary = {
        "total_employees": len(df),
        "total_columns": len(df.columns),
        "columns": list(df.columns),
        "sample_data": df.head(5).to_dict('records')
    }
    
    with open('/data/.openclaw/workspace/albassam-tasks/data/analysis_summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 80)
    print("\n✅ تم حفظ الملخص في: data/analysis_summary.json")
    
except Exception as e:
    print(f"\n❌ خطأ: {e}")
    import traceback
    traceback.print_exc()
