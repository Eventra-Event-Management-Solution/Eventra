import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useLocation } from '../../hooks/useLocation';
import { FiCalendar, FiClock, FiUser, FiMail, FiPhone, FiMapPin, FiDollarSign, FiFileText, FiEdit, FiTrash2, FiSend, FiAlertCircle, FiCheckCircle, FiDownload } from 'react-icons/fi';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { useAuth } from '../../hooks/useAuth';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333333',
  },
  subHeader: {
    fontSize: 18,
    marginBottom: 10,
    color: '#555555',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginBottom: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderColor: '#bfbfbf',
    borderBottomColor: '#000000',
    borderWidth: 1,
    backgroundColor: '#f0f0f0',
    textAlign: 'center',
    padding: 5,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderColor: '#bfbfbf',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    margin: 'auto',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 'auto',
    fontSize: 10,
  },
  total: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 10,
  },
});

// Create Document Component
const InvoicePDF = ({ invoice, client, event, formatCurrency, formatDate }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>Invoice</Text>

        <Text style={styles.subHeader}>Invoice Details</Text>
        <Text style={styles.text}>Invoice Number: {invoice.invoiceNumber || `#${invoice.id.substring(0, 6)}`}</Text>
        <Text style={styles.text}>Issue Date: {formatDate(invoice.issueDate)}</Text>
        <Text style={styles.text}>Due Date: {formatDate(invoice.dueDate)}</Text>
        <Text style={styles.text}>Total Amount: {formatCurrency(invoice.amount || 0)}</Text>

        {client && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.subHeader}>Client Information</Text>
            <Text style={styles.text}>Client Name: {client?.firstName} {client?.lastName || 'N/A'}</Text>
            {client.email && <Text style={styles.text}>Email: {client.email}</Text>}
            {client.phone && <Text style={styles.text}>Phone: {client.phone}</Text>}
            {(client.address || client.city || client.state || client.zipCode) && (
              <Text style={styles.text}>
                Address: {client.address || ''}, {[client.city, client.state, client.zipCode].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        )}

        {event && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.subHeader}>Event Information</Text>
            <Text style={styles.text}>Event: {event?.title || 'N/A'}</Text>
            <Text style={styles.text}>Event Date: {formatDate(event.date)}</Text>
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={styles.subHeader}>Invoice Items</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Description</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Quantity</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Unit Price</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Amount</Text></View>
            </View>
            {invoice.items && invoice.items.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{item.description}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{item.quantity}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(item.unitPrice)}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(item.amount)}</Text></View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.total}>Subtotal: {formatCurrency(invoice.subtotal || 0)}</Text>
        {invoice.taxRate > 0 && (
          <Text style={styles.total}>Tax ({invoice.taxRate}%): {formatCurrency(invoice.taxAmount || 0)}</Text>
        )}
        {invoice.discountAmount > 0 && (
          <Text style={styles.total}>
            Discount {invoice.discountType === 'percentage' ? ` (${invoice.discountValue}%)` : ''}:
            -{formatCurrency(invoice.discountAmount || 0)}
          </Text>
        )}
        <Text style={styles.total}>Total: {formatCurrency(invoice.amount || 0)}</Text>

        {invoice.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.subHeader}>Notes</Text>
            <Text style={styles.text}>{invoice.notes}</Text>
          </View>
        )}
      </View>
    </Page>
  </Document>
);

const InvoiceDetail = () => {
  const {user} = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency } = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const invoiceDoc = await getDoc(doc(db, 'users', user.uid, 'invoices', id));
      
      if (invoiceDoc.exists()) {
        const invoiceData = { id: invoiceDoc.id, ...invoiceDoc.data() };
        setInvoice(invoiceData);
        
        // Fetch client data if client ID exists
        if (invoiceData.clientId) {
          const clientDoc = await getDoc(doc(db, 'clients', invoiceData.clientId));
          if (clientDoc.exists()) {
            const clientData = { id: clientDoc.id, ...clientDoc.data() };
            setClient(clientData);
            console.log('Fetched Client Data for PDF:', clientData);
          }
        }
        
        // Fetch event data if event ID exists
        if (invoiceData.eventId) {
          const eventDoc = await getDoc(doc(db, 'users', user.uid, 'events', invoiceData.eventId));
          if (eventDoc.exists()) {
            const eventData = { id: eventDoc.id, ...eventDoc.data() };
            setEvent(eventData);
            console.log('Fetched Event Data for PDF:', eventData);
          }
        }
      } else {
        setError('Invoice not found');
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'invoices', id));
      navigate('/invoices', { state: { message: 'Invoice deleted successfully' } });
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice. Please try again.');
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Format currency is now provided by LocationContext

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Unpaid':
        return 'bg-red-100 text-red-800';
      case 'Overdue':
        return 'bg-orange-100 text-orange-800';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  // Mock function for sending invoice
  const handleSendInvoice = () => {
    alert('Email sending functionality would be implemented with a service like SendGrid or Firebase Cloud Functions');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
        <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Invoice {invoice.invoiceNumber || `#${invoice.id.substring(0, 6)}`}
          </h1>
          {invoice.status && (
            <span className={`mt-2 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
              {invoice.status}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {invoice && client && event && (
            <PDFDownloadLink
              document={<InvoicePDF invoice={invoice} client={client} event={event} formatCurrency={formatCurrency} formatDate={formatDate} />}
              fileName={`invoice_${invoice.invoiceNumber || invoice.id.substring(0, 6)}.pdf`}
            >
              {({ blob, url, loading, error }) =>
                <button
                  className="btn btn-secondary inline-flex items-center"
                  disabled={loading}
                >
                  <FiDownload className="-ml-1 mr-2 h-5 w-5" />
                  {loading ? 'Generating PDF...' : 'Download PDF'}
                </button>
              }
            </PDFDownloadLink>
          )}

          <Link to={`/invoices/${id}/edit`} className="btn btn-secondary inline-flex items-center">
            <FiEdit className="-ml-1 mr-2 h-5 w-5" />
            Edit
          </Link>
          <button
            onClick={handleDeleteClick}
            className="btn btn-accent inline-flex items-center"
          >
            <FiTrash2 className="-ml-1 mr-2 h-5 w-5" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold">Invoice Details</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(invoice.amount || 0)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Invoice Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Invoice Information</h3>
                
                <div className="flex items-center">
                  <FiCalendar className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p>{formatDate(invoice.issueDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FiClock className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p>{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
              </div>
              
              {/* Client Information */}
              {client && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Client Information</h3>
                  
                  <div className="flex items-center">
                    <FiUser className="mr-2 h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <Link to={`/clients/${client.id}`} className="font-medium hover:text-primary">
                        {client.firstName} {client.lastName}
                      </Link>
                    </div>
                  </div>
                  
                  {client.email && (
                    <div className="flex items-center">
                      <FiMail className="mr-2 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a href={`mailto:${client.email}`} className="hover:text-primary">
                          {client.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {client.phone && (
                    <div className="flex items-center">
                      <FiPhone className="mr-2 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <a href={`tel:${client.phone}`} className="hover:text-primary">
                          {client.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {(client.address || client.city || client.state || client.zipCode) && (
                    <div className="flex items-start">
                      <FiMapPin className="mr-2 h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <div>
                          {client.address && <p>{client.address}</p>}
                          {(client.city || client.state || client.zipCode) && (
                            <p>
                              {[client.city, client.state, client.zipCode].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Event Information */}
            {event && (
              <div className="mb-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4">Event Information</h3>
                
                <div className="flex items-start">
                  <FiFileText className="mr-2 h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Event</p>
                    <Link to={`/events/${event.id}`} className="font-medium hover:text-primary">
                      {event.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(event.date)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Invoice Items */}
            <div className="mb-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Invoice Items</h3>
              
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items && invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Invoice Totals */}
            <div className="mb-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col items-end space-y-2">
                <div className="flex justify-between w-full md:w-1/2">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.subtotal || 0)}
                  </span>
                </div>
                
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between w-full md:w-1/2">
                    <span className="text-gray-700">Tax ({invoice.taxRate}%):</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.taxAmount || 0)}
                    </span>
                  </div>
                )}
                
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between w-full md:w-1/2">
                    <span className="text-gray-700">
                      Discount 
                      {invoice.discountType === 'percentage' ? 
                        ` (${invoice.discountValue}%)` : 
                        ''}:
                    </span>
                    <span className="font-medium">
                      -{formatCurrency(invoice.discountAmount || 0)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between w-full md:w-1/2 text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-primary">
                    {formatCurrency(invoice.amount || 0)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Notes */}
            {invoice.notes && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>



      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiAlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Invoice
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this invoice? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;