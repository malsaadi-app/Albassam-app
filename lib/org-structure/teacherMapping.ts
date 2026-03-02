export function normalizeOrgLabel(s: string) {
  return String(s || '')
    .trim()
    .replace(/^قسم\s+/u, '')
    .replace(/\s+/g, ' ')
}

const SCIENCE_KEYWORDS = [
  'علوم',
  'فيزياء',
  'كيمياء',
  'أحياء',
  'جيولوجيا',
  'علوم الأرض',
  'الفضاء',
  'science',
  'physics',
  'chem',
  'bio',
]

export function mapTeacherToDepartmentName(opts: { department?: string | null; specialization?: string | null }) {
  const dept = normalizeOrgLabel(opts.department || '')
  const spec = normalizeOrgLabel(opts.specialization || '')

  const hay = `${dept} ${spec}`.toLowerCase()

  // Science bucket
  if (SCIENCE_KEYWORDS.some((k) => hay.includes(k.toLowerCase()))) {
    return 'قسم المواد العلمية'
  }

  // Prefer explicit department if present
  if (dept) return dept.startsWith('قسم ') ? dept : `قسم ${dept}`

  if (spec) return spec.startsWith('قسم ') ? spec : `قسم ${spec}`

  return null
}
