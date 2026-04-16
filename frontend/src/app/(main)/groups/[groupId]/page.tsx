import GroupClient from './GroupClient';

// Required for Next.js static export: must return at least one entry
export function generateStaticParams() {
  return [{ groupId: 'placeholder' }];
}

export default function GroupPage({ params }: { params: { groupId: string } }) {
  const groupId = parseInt(params.groupId, 10);
  if (isNaN(groupId)) return <div>Grupo não encontrado</div>;
  return <GroupClient groupId={groupId} />;
}
