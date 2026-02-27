export type HRRequestType =
  | 'LEAVE'
  | 'TICKET_ALLOWANCE'
  | 'FLIGHT_BOOKING'
  | 'SALARY_CERTIFICATE'
  | 'HOUSING_ALLOWANCE'
  | 'VISA_EXIT_REENTRY_SINGLE'
  | 'VISA_EXIT_REENTRY_MULTI'
  | 'RESIGNATION';

export type HRRequestField =
  | 'startDate'
  | 'endDate'
  | 'leaveType'
  | 'destination'
  | 'travelDate'
  | 'departureDate'
  | 'returnDate'
  | 'amount'
  | 'period'
  | 'purpose'
  | 'recipientOrganization'
  | 'reason';

export interface HRRequestTypeConfig {
  requiredFields: HRRequestField[];
  /**
   * Optional UI-only list of required attachment “kinds”.
   * Server-side enforcement is not strict because uploads happen after creation.
   */
  requiredAttachments?: string[];
  fastTrack?: boolean;
  fastTrackLabel?: string;
}

export const HR_REQUEST_TYPE_CONFIG: Record<HRRequestType, HRRequestTypeConfig> = {
  LEAVE: {
    requiredFields: ['startDate', 'endDate', 'leaveType'],
    requiredAttachments: []
  },
  TICKET_ALLOWANCE: {
    requiredFields: ['destination', 'travelDate', 'amount'],
    requiredAttachments: []
  },
  FLIGHT_BOOKING: {
    requiredFields: ['destination', 'departureDate', 'returnDate'],
    requiredAttachments: ['Passport / ID (optional)']
  },
  SALARY_CERTIFICATE: {
    requiredFields: ['purpose'],
    requiredAttachments: [],
    fastTrack: true,
    fastTrackLabel: '⚡ سريع'
  },
  HOUSING_ALLOWANCE: {
    requiredFields: ['amount', 'period'],
    requiredAttachments: []
  },

  VISA_EXIT_REENTRY_SINGLE: {
    requiredFields: ['departureDate', 'returnDate', 'reason'],
    requiredAttachments: ['Passport / Iqama (optional)']
  },
  VISA_EXIT_REENTRY_MULTI: {
    requiredFields: ['departureDate', 'returnDate', 'reason'],
    requiredAttachments: ['Passport / Iqama (optional)']
  },
  RESIGNATION: {
    requiredFields: ['endDate', 'reason'],
    requiredAttachments: []
  }
};

export function isFastTrackRequestType(type: string): boolean {
  return (HR_REQUEST_TYPE_CONFIG as any)[type]?.fastTrack === true;
}
