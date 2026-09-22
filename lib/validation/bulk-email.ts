import * as Yup from "yup";

export const bulkEmailSchema = Yup.object({
  segmentId: Yup.string().required("Choose who should receive this email."),
  templateId: Yup.string().required(),
  subject: Yup.string().trim().required("Enter a subject line."),
  body: Yup.string().trim().required("Write a message body."),
});

export type BulkEmailValues = Yup.InferType<typeof bulkEmailSchema>;

export const BULK_EMAIL_INITIAL_VALUES: BulkEmailValues = {
  segmentId: "",
  templateId: "blank",
  subject: "",
  body: "",
};
