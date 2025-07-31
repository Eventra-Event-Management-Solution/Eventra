import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { 
  doc, getDoc, setDoc, collection, addDoc, serverTimestamp, 
  query, getDocs, where, orderBy 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  FiSave, FiX, FiAlertCircle, FiCheckCircle, FiPlus, 
  FiTrash2, FiCalendar, FiDollarSign 
} from 'react-icons/fi';
import { useLocation } from '../../contexts/LocationContext';

const InvoiceForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { formatCurrency, getCurrencySymbol } = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch clients
        const clientsRef = collection(db, 'clients');
        const clientsQuery = query(clientsRef, orderBy('lastName'));
        const clientsSnapshot = await getDocs(clientsQuery);
        const clientsList = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClients(clientsList);
        
        // Fetch events
        const eventsRef = collection(db, 'events');
        const eventsQuery = query(eventsRef, orderBy('date'));
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsList);
        
        // If editing, fetch invoice data
        if (mode === 'edit' && id) {
          const invoiceDoc = await getDoc(doc(db, 'invoices', id));
          
          if (invoiceDoc.exists()) {
            const invoiceData = { id: invoiceDoc.id, ...invoiceDoc.data() };
            setInvoice(invoiceData);
            
            // Set selected client and event
            if (invoiceData.clientId) {
              const client = clientsList.find(c => c.id === invoiceData.clientId);
              setSelectedClient(client || null);
            }
            
            if (invoiceData.eventId) {
              const event = eventsList.find(e => e.id === invoiceData.eventId);
              setSelectedEvent(event || null);
            }
          } else {
            setError('Invoice not found');
            navigate('/invoices');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [mode, id, navigate]);

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  };

  const initialValues = {
    invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
    clientId: invoice?.clientId || '',
    eventId: invoice?.eventId || '',
    issueDate: invoice?.issueDate ? formatDateForInput(invoice.issueDate) : formatDateForInput(new Date()),
    dueDate: invoice?.dueDate ? formatDateForInput(invoice.dueDate) : '',
    status: invoice?.status || 'Draft',
    items: invoice?.items || [
      { description: '', quantity: 1, unitPrice: 0, amount: 0 }
    ],
    subtotal: invoice?.subtotal || 0,
    taxRate: invoice?.taxRate || 0,
    taxAmount: invoice?.taxAmount || 0,
    discountType: invoice?.discountType || 'percentage',
    discountValue: invoice?.discountValue || 0,
    discountAmount: invoice?.discountAmount || 0,
    amount: invoice?.amount || 0,
    notes: invoice?.notes || ''
  };

  const validationSchema = Yup.object({
    invoiceNumber: Yup.string().required('Invoice number is required'),
    clientId: Yup.string().required('Client is required'),
    issueDate: Yup.date().required('Issue date is required'),
    dueDate: Yup.date().required('Due date is required'),
    status: Yup.string().required('Status is required'),
    items: Yup.array().of(
      Yup.object().shape({
        description: Yup.string().required('Description is required'),
        quantity: Yup.number().required('Quantity is required').min(1, 'Quantity must be at least 1'),
        unitPrice: Yup.number().required('Unit price is required').min(0, 'Unit price cannot be negative')
      })
    ).min(1, 'At least one item is required')
  });

  // Format date for input field
  function formatDateForInput(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toISOString().split('T')[0];
  }

  // Calculate item amount
  const calculateItemAmount = (quantity, unitPrice) => {
    return parseFloat(quantity) * parseFloat(unitPrice);
  };

  // Calculate invoice totals
  const calculateTotals = (values) => {
    // Calculate subtotal
    const subtotal = values.items.reduce((total, item) => {
      return total + calculateItemAmount(item.quantity, item.unitPrice);
    }, 0);
    
    // Calculate tax amount
    const taxAmount = (subtotal * values.taxRate) / 100;
    
    // Calculate discount amount
    let discountAmount = 0;
    if (values.discountType === 'percentage') {
      discountAmount = (subtotal * values.discountValue) / 100;
    } else {
      discountAmount = parseFloat(values.discountValue) || 0;
    }
    
    // Calculate total amount
    const amount = subtotal + taxAmount - discountAmount;
    
    return {
      subtotal,
      taxAmount,
      discountAmount,
      amount
    };
  };

  const handleClientChange = (e, setFieldValue) => {
    const clientId = e.target.value;
    setFieldValue('clientId', clientId);
    
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      setSelectedClient(client || null);
      
      // Filter events by client
      if (client) {
        const clientEvents = events.filter(event => event.clientId === clientId);
        if (clientEvents.length === 1) {
          setFieldValue('eventId', clientEvents[0].id);
          setSelectedEvent(clientEvents[0]);
        } else {
          setFieldValue('eventId', '');
          setSelectedEvent(null);
        }
      }
    } else {
      setSelectedClient(null);
      setFieldValue('eventId', '');
      setSelectedEvent(null);
    }
  };

  const handleEventChange = (e, setFieldValue) => {
    const eventId = e.target.value;
    setFieldValue('eventId', eventId);
    
    if (eventId) {
      const event = events.find(e => e.id === eventId);
      setSelectedEvent(event || null);
    } else {
      setSelectedEvent(null);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null);
      setSuccess(false);
      
      // Calculate totals
      const totals = calculateTotals(values);
      
      const invoiceData = {
        ...values,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        amount: totals.amount,
        items: values.items.map(item => ({
          ...item,
          amount: calculateItemAmount(item.quantity, item.unitPrice)
        })),
        issueDate: new Date(values.issueDate),
        dueDate: new Date(values.dueDate),
        updatedAt: serverTimestamp()
      };
      
      if (mode === 'edit' && id) {
        // Update existing invoice
        await setDoc(doc(db, 'invoices', id), invoiceData, { merge: true });
        setSuccess(true);
        setTimeout(() => {
          navigate(`/invoices/${id}`);
        }, 1500);
      } else {
        // Create new invoice
        invoiceData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/invoices/${docRef.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError('Failed to save invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'edit' ? 'Edit Invoice' : 'Create Invoice'}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
          <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{mode === 'edit' ? 'Invoice updated successfully!' : 'Invoice created successfully!'}</span>
        </div>
      )}

      <div className="card bg-white shadow-sm">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, touched, errors, isSubmitting }) => {
            // Recalculate totals when items, tax rate, or discount changes
            React.useEffect(() => {
              const totals = calculateTotals(values);
              setFieldValue('subtotal', totals.subtotal);
              setFieldValue('taxAmount', totals.taxAmount);
              setFieldValue('discountAmount', totals.discountAmount);
              setFieldValue('amount', totals.amount);
            }, [values.items, values.taxRate, values.discountType, values.discountValue]);
            
            // Update item amounts when quantity or unit price changes
            React.useEffect(() => {
              values.items.forEach((item, index) => {
                const amount = calculateItemAmount(item.quantity, item.unitPrice);
                if (item.amount !== amount) {
                  setFieldValue(`items[${index}].amount`, amount);
                }
              });
            }, [values.items]);
            
            return (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Invoice Number */}
                  <div>
                    <label htmlFor="invoiceNumber" className="label">
                      Invoice Number *
                    </label>
                    <Field
                      type="text"
                      id="invoiceNumber"
                      name="invoiceNumber"
                      className={`input ${touched.invoiceNumber && errors.invoiceNumber ? 'border-red-500' : ''}`}
                    />
                    <ErrorMessage name="invoiceNumber" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="label">
                      Status *
                    </label>
                    <Field
                      as="select"
                      id="status"
                      name="status"
                      className={`input ${touched.status && errors.status ? 'border-red-500' : ''}`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Partial">Partially Paid</option>
                      <option value="Overdue">Overdue</option>
                    </Field>
                    <ErrorMessage name="status" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Client */}
                  <div>
                    <label htmlFor="clientId" className="label">
                      Client *
                    </label>
                    <Field
                      as="select"
                      id="clientId"
                      name="clientId"
                      className={`input ${touched.clientId && errors.clientId ? 'border-red-500' : ''}`}
                      onChange={(e) => handleClientChange(e, setFieldValue)}
                    >
                      <option value="">Select a client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name || `${client.firstName} ${client.lastName}`}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="clientId" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Event */}
                  <div>
                    <label htmlFor="eventId" className="label">
                      Event
                    </label>
                    <Field
                      as="select"
                      id="eventId"
                      name="eventId"
                      className="input"
                      onChange={(e) => handleEventChange(e, setFieldValue)}
                      disabled={!values.clientId}
                    >
                      <option value="">Select an event</option>
                      {events
                        .filter(event => !values.clientId || event.clientId === values.clientId)
                        .map(event => (
                          <option key={event.id} value={event.id}>
                            {event.name} ({formatDateForInput(event.date)})
                          </option>
                        ))}
                    </Field>
                  </div>

                  {/* Issue Date */}
                  <div>
                    <label htmlFor="issueDate" className="label">
                      Issue Date *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="date"
                        id="issueDate"
                        name="issueDate"
                        className={`input pl-10 ${touched.issueDate && errors.issueDate ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <ErrorMessage name="issueDate" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label htmlFor="dueDate" className="label">
                      Due Date *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        className={`input pl-10 ${touched.dueDate && errors.dueDate ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <ErrorMessage name="dueDate" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Invoice Items</h3>
                  
                  <FieldArray name="items">
                    {({ remove, push }) => (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Description
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Quantity
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Unit Price
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                  <span className="sr-only">Actions</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {values.items.map((item, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Field
                                      type="text"
                                      name={`items[${index}].description`}
                                      placeholder="Item description"
                                      className={`input ${touched.items?.[index]?.description && errors.items?.[index]?.description ? 'border-red-500' : ''}`}
                                    />
                                    <ErrorMessage name={`items[${index}].description`} component="div" className="text-red-500 text-sm mt-1" />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Field
                                      type="number"
                                      name={`items[${index}].quantity`}
                                      min="1"
                                      className={`input ${touched.items?.[index]?.quantity && errors.items?.[index]?.quantity ? 'border-red-500' : ''}`}
                                    />
                                    <ErrorMessage name={`items[${index}].quantity`} component="div" className="text-red-500 text-sm mt-1" />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="relative">
                                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400">{getCurrencySymbol()}</span>
                                      </div>
                                      <Field
                                        type="number"
                                        name={`items[${index}].unitPrice`}
                                        min="0"
                                        step="0.01"
                                        className={`input pl-10 ${touched.items?.[index]?.unitPrice && errors.items?.[index]?.unitPrice ? 'border-red-500' : ''}`}
                                      />
                                    </div>
                                    <ErrorMessage name={`items[${index}].unitPrice`} component="div" className="text-red-500 text-sm mt-1" />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="relative">
                                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400">{getCurrencySymbol()}</span>
                                      </div>
                                      <Field
                                        type="number"
                                        name={`items[${index}].amount`}
                                        disabled
                                        className="input pl-10 bg-gray-50"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {values.items.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <FiTrash2 className="h-5 w-5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div>
                          <button
                            type="button"
                            onClick={() => push({ description: '', quantity: 1, unitPrice: 0, amount: 0 })}
                            className="inline-flex items-center text-primary hover:text-primary-dark"
                          >
                            <FiPlus className="mr-1 h-5 w-5" />
                            Add Item
                          </button>
                        </div>
                      </div>
                    )}
                  </FieldArray>
                </div>

                {/* Invoice Totals */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="flex flex-col items-end space-y-3">
                    <div className="flex justify-between w-full md:w-1/2">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(values.subtotal)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center w-full md:w-1/2">
                      <div className="flex items-center">
                        <span className="text-gray-700 mr-2">Tax Rate (%):</span>
                        <Field
                          type="number"
                          name="taxRate"
                          min="0"
                          max="100"
                          step="0.01"
                          className="input w-20"
                        />
                      </div>
                      <span className="font-medium">
                        {formatCurrency(values.taxAmount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center w-full md:w-1/2">
                      <div className="flex items-center">
                        <span className="text-gray-700 mr-2">Discount:</span>
                        <Field
                          as="select"
                          name="discountType"
                          className="input w-32 mr-2"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount ({getCurrencySymbol()})</option>
                        </Field>
                        <Field
                          type="number"
                          name="discountValue"
                          min="0"
                          step={values.discountType === 'percentage' ? '0.01' : '1'}
                          max={values.discountType === 'percentage' ? '100' : ''}
                          className="input w-20"
                        />
                      </div>
                      <span className="font-medium">
                        {formatCurrency(values.discountAmount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between w-full md:w-1/2 text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">
                        {formatCurrency(values.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-6">
                  <label htmlFor="notes" className="label">
                    Notes
                  </label>
                  <Field
                    as="textarea"
                    id="notes"
                    name="notes"
                    rows="4"
                    className="input"
                    placeholder="Add any notes or payment instructions"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/invoices')}
                    className="btn btn-secondary inline-flex items-center"
                  >
                    <FiX className="-ml-1 mr-2 h-5 w-5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary inline-flex items-center"
                  >
                    <FiSave className="-ml-1 mr-2 h-5 w-5" />
                    {isSubmitting ? 'Saving...' : 'Save Invoice'}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default InvoiceForm;