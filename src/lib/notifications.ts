export interface BookingNotificationPayload {
  referenceCode: string;
  recipientEmail?: string | null;
  recipientPhone: string;
  recipientName: string;
  doctorName: string;
  appointmentTime: string; // Formatted display time
  status: string;
}

export interface NotificationService {
  sendBookingConfirmation(payload: BookingNotificationPayload): Promise<boolean>;
  sendCancellationNotice(payload: BookingNotificationPayload): Promise<boolean>;
  sendStaffAlert(message: string, metadata?: Record<string, unknown>): Promise<boolean>;
}

class MockNotificationService implements NotificationService {
  async sendBookingConfirmation(payload: BookingNotificationPayload): Promise<boolean> {
    // In production, dispatch via provider (e.g. SendGrid, Twilio, AWS SES)
    // Avoid logging sensitive patient data
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[NotificationService] Dispatched confirmation for booking reference: ${payload.referenceCode}`
      );
    }
    return true;
  }

  async sendCancellationNotice(payload: BookingNotificationPayload): Promise<boolean> {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[NotificationService] Dispatched cancellation notice for booking reference: ${payload.referenceCode}`
      );
    }
    return true;
  }

  async sendStaffAlert(message: string): Promise<boolean> {
    if (process.env.NODE_ENV === "development") {
      console.log(`[NotificationService] Staff alert: ${message}`);
    }
    return true;
  }
}

export const notificationService: NotificationService = new MockNotificationService();
