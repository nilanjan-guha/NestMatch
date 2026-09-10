import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';
import EditPropertyForm from '@/components/EditPropertyForm';

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session || ((session.user as any)?.role !== 'owner' && (session.user as any)?.role !== 'admin')) {
    redirect('/login');
  }

  await connectToDatabase();
  const property = await PGProperty.findById(id).lean();

  if (!property) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Property not found.</div>;
  }

  if ((session.user as any).role !== 'admin' && property.owner_id.toString() !== (session.user as any).id) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Unauthorized to edit this property.</div>;
  }

  return (
    <EditPropertyForm property={JSON.parse(JSON.stringify(property))} />
  );
}
