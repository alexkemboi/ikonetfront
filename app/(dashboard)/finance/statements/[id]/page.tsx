import StatementDetail from "../../_components/StatementDetail";

export const metadata = { title: "Statement Detail — Beesmart Billing" };

export default function StatementDetailPage(props: { params: Promise<{ id: string }> }) {
  return <StatementDetail paramsPromise={props.params} />;
}