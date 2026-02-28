export type NormalizedTimelineItem = {
  stepName: string
  actorName: string
  actorTitle: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO'
  at?: Date
  comment?: string
}

export type NormalizedPrintDoc = {
  title: string
  number: string
  createdAt: Date
  currentStepLabel: string
  statusLabel: string
  metaRows: Array<{ label: string; value: string }>
  timeline: NormalizedTimelineItem[]
}
