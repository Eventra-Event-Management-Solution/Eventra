import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InvoiceForm from '../../components/invoices/InvoiceForm';

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Invoice</h1>
      <InvoiceForm 
        mode="edit" 
        invoiceId={id}
        onSuccess={() => navigate(`/invoices/${id}`, { state: { message: 'Invoice updated successfully' } })}
      />
    </div>
  );
};

export default EditInvoice;