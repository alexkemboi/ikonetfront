/** A message to investors, as the platform administrator writes it. */
export interface InvestorMessageInput {
  subject: string;
  body: string;
  /** Empty = the start of the message. */
  smsText?: string;
  email: boolean;
  sms: boolean;
}

/** One investor's share of a send (backend `InvestorMessageService.Delivery`). */
export interface InvestorMessageDelivery {
  investorId: string;
  investorCode: string;
  investorName: string;
  emails: number;
  texts: number;
  /** The company whose SMS account carried the texts. */
  smsCompany: string | null;
  /** Why something could not be sent, e.g. "no phone number on record". */
  note: string | null;
}

export interface InvestorMessageResult {
  batchId: string | null;
  deliveries: InvestorMessageDelivery[];
}

/** A message already sent to one investor (backend `InvestorMessageService.Sent`). */
export interface InvestorMessageSent {
  id: number;
  batchId: string;
  subject: string | null;
  body: string;
  smsText: string | null;
  email: boolean;
  sms: boolean;
  emails: number;
  texts: number;
  smsCompany: string | null;
  sentBy: string;
  sentAt: string;
}
