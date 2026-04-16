// Static export: redirect to group detail which has events tab
export function generateStaticParams() {
  return [{ groupId: 'placeholder' }];
}

export default function GroupEventsPage({ params }: { params: { groupId: string } }) {
  return (
    <meta httpEquiv="refresh" content={`0; url=/groups/${params.groupId}`} />
  );
}
