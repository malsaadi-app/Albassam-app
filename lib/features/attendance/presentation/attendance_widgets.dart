import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../data/attendance_models.dart';

Widget buildRecordsCard({
  required bool loading,
  required List<AttendanceRecord> records,
  required String title,
  required String emptyText,
  required bool isArabic,
}) {
  final timeFmt = DateFormat('HH:mm');
  final dateFmt = DateFormat('yyyy-MM-dd');

  return Card(
    elevation: 0,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          if (loading)
            const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator()))
          else if (records.isEmpty)
            Text(emptyText, style: TextStyle(color: Colors.grey[600]))
          else
            ...records.map((r) {
              final inStr = timeFmt.format(r.checkIn.toLocal());
              final outStr = r.checkOut != null ? timeFmt.format(r.checkOut!.toLocal()) : '—';
              final branch = r.branchName ?? '';
              final date = dateFmt.format(r.date.toLocal());

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(date, style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                        if (branch.isNotEmpty)
                          Flexible(
                            child: Text(
                              branch,
                              textAlign: TextAlign.end,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: _kv(isArabic ? 'الدخول' : 'In', inStr)),
                        const SizedBox(width: 10),
                        Expanded(child: _kv(isArabic ? 'الخروج' : 'Out', outStr)),
                      ],
                    ),
                    if (r.workHours != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        '${isArabic ? 'ساعات العمل' : 'Work hours'}: ${r.workHours!.toStringAsFixed(1)}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF065F46), fontWeight: FontWeight.w600),
                      ),
                    ]
                  ],
                ),
              );
            }).toList(),
        ],
      ),
    ),
  );
}

Widget _kv(String k, String v) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(k, style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
      const SizedBox(height: 4),
      Text(v, style: const TextStyle(fontWeight: FontWeight.w700)),
    ],
  );
}
