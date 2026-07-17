'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Modal, ChangeHistory } from '@unerp/ui';
import { DetailView, FormView, RouteGuard } from '@unerp/framework';
import { contactResource } from '@/modules/crm';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [showEdit, setShowEdit] = useState(false);

  return (
    <RouteGuard permission="crm.contact.read">
      <div className="ui-stack-6">
        <DetailView
          resource={contactResource}
          id={id}
          onEdit={() => setShowEdit(true)}
          actions={
            <Button variant="outline" onClick={() => router.push('/crm/contacts')}>
              Back to List
            </Button>
          }
        >
          <ChangeHistory entityType="Contact" entityId={id} />
        </DetailView>

        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Contact">
          <FormView
            resource={contactResource}
            id={id}
            onSuccess={() => setShowEdit(false)}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
