export type NotificationTypeValue =
  | 'budget_overrun'
  | 'budget_threshold'
  | 'deadline_approaching'
  | 'project_overdue'
  | 'status_change';

export type NotificationType = {
  id: number;
  title: string;
  message: string;
  notification_type: NotificationTypeValue;
  object_id: number | null;
  is_read: boolean;
  date_created: string;
};

export type NotificationPreferenceType = {
  id: number;
  notify_budget_overrun: boolean;
  notify_budget_threshold: boolean;
  notify_deadline_approaching: boolean;
  notify_project_overdue: boolean;
  notify_status_change: boolean;
  budget_threshold_percent: number;
  deadline_alert_days: number;
  date_created: string;
  date_updated: string;
};

export type NotificationPreferenceFormValues = {
  notify_budget_overrun: boolean;
  notify_budget_threshold: boolean;
  notify_deadline_approaching: boolean;
  notify_project_overdue: boolean;
  notify_status_change: boolean;
  budget_threshold_percent: number;
  deadline_alert_days: number;
  globalError: string;
};
