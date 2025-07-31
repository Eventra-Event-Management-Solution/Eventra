import React from 'react';
import { useNavigate } from 'react-router-dom';
import InvoiceForm from '../../components/invoices/InvoiceForm';

const CreateInvoice = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Invoice</h1>
      <InvoiceForm 
        mode="create" 
        onSuccess={(id) => navigate(`/invoices/${id}`, { state: { message: 'Invoice created successfully' } })}
      />
    </div>
  );
};

export default CreateInvoice;