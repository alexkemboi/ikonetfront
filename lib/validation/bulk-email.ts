import * as Yup from "yup";

export const NOTIFICATION_CHANNELS = ["EMAIL", "SMS"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const AUDIENCE_SOURCES = ["customers", "users"] as const;
export type AudienceSource = (typeof AUDIENCE_SOURCES)[number];

export const bulkEmailSchema = Yup.object({
  channel: Yup.mixed<NotificationChannel>().oneOf(NOTIFICATION_CHANNELS).required(),
  source: Yup.mixed<AudienceSource>().oneOf(AUDIENCE_SOURCES).required(),
  recipientIds: Yup.array(Yup.string().required())
    .min(1, "Select at least one recipient.")
    .required(),
  templateId: Yup.string().required(),
  subject: Yup.string()
    .trim()
    .when("channel", {
      is: "EMAIL",
      then: (schema) => schema.required("Enter a subject line."),
      otherwise: (schema) => schema.notRequired(),
    }),
  body: Yup.string().trim().required("Write a message body."),
});

// `subject` is conditionally required (email only) per the schema's `.when()`, which makes
// Yup infer it as optional — but Formik always keeps it in `values` as a controlled string.
export type BulkEmailValues = Omit<Yup.InferType<typeof bulkEmailSchema>, "subject"> & {
  subject: string;
};

export const BULK_EMAIL_INITIAL_VALUES: BulkEmailValues = {
  channel: "EMAIL",
  source: "customers",
  recipientIds: [],
  templateId: "blank",
  subject: "",
  body: "",
};
