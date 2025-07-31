import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, deleteDoc, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useLocation } from '../../hooks/useLocation';
import { 
  FiFileText, FiPlusCircle, FiSearch, FiFilter, 
  FiTrash2, FiEdit, FiEye, FiAlertCircle, FiCheckCircle, FiDollarSign, FiCalendar 
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const Invoices = () => {
  const { formatCurrency } = useLocation();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

useEffect(() => {
  if (user) {
    fetchInvoices();
  }
}, [user]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const invoicesRef = collection(db, 'invoices');
      // Add where clause to filter by user ID
      const invoicesQuery = query(invoicesRef, where("userId", "==", user.uid), orderBy('createdAt', 'desc'));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      
      const invoicesList = [];
      
      for (const invoiceDoc of invoicesSnapshot.docs) {
        const invoiceData = {
          id: invoiceDoc.id,
          ...invoiceDoc.data()
        };
        
        // Fetch client data if client ID exists
        if (invoiceData.clientId) {
          try {
            const clientDoc = await getDoc(doc(db, 'clients', invoiceData.clientId));
            if (clientDoc.exists()) {
              invoiceData.client = {
                id: clientDoc.id,
                ...clientDoc.data()
              };
            }
          } catch (err) {
            console.error('Error fetching client for invoice:', err);
          }
        }
        
        // Fetch event data if event ID exists
        if (invoiceData.eventId) {
          try {
            const eventDoc = await getDoc(doc(db, 'events', invoiceData.eventId));
            if (eventDoc.exists()) {
              invoiceData.event = {
                id: eventDoc.id,
                ...eventDoc.data()
              };
            }
          } catch (err) {
            console.error('Error fetching event for invoice:', err);
          }
        }
        
        invoicesList.push(invoiceData);
      }
      
      setInvoices(invoicesList);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'invoices', invoiceToDelete.id));
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceToDelete.id));
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
      setSuccessMessage('Invoice deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setInvoiceToDelete(null);
  };

  // Format currency is now provided by LocationContext

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  // Filter and search invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.event?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link to="/invoices/create" className="btn btn-primary inline-flex items-center">
          <FiPlusCircle className="-ml-1 mr-2 h-5 w-5" />
          New Invoice
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
          <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="card bg-white shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search invoices..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="input pl-10 pr-10 appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
              <option value="Partial">Partial</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiFileText className="mr-2 h-5 w-5 text-gray-400" />
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber || `INV-${invoice.id.substring(0, 6)}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.client ? (
                        <div className="text-sm text-gray-900">
                          <Link to={`/clients/${invoice.clientId}`} className="hover:text-primary">
                            {invoice.client.firstName} {invoice.client.lastName}
                          </Link>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.event ? (
                        <div className="text-sm text-gray-900">
                          <Link to={`/events/${invoice.eventId}`} className="hover:text-primary">
                            {invoice.event.title}
                          </Link>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FiDollarSign className="mr-1 h-4 w-4 text-gray-400" />
                        {invoice.amount ? formatCurrency(invoice.amount) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.status ? (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <FiCalendar className="mr-1 h-4 w-4" />
                        {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link to={`/invoices/${invoice.id}`} className="text-gray-500 hover:text-gray-700">
                          <FiEye className="h-5 w-5" />
                        </Link>
                        <Link to={`/invoices/${invoice.id}/edit`} className="text-blue-500 hover:text-blue-700">
                          <FiEdit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(invoice)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {invoices.length === 0
                ? 'Get started by creating a new invoice.'
                : 'Try adjusting your search or filter to find what you\'re looking for.'}
            </p>
            {invoices.length === 0 && (
              <div className="mt-6">
                <Link to="/invoices/create" className="btn btn-primary inline-flex items-center">
                  <FiPlusCircle className="-ml-1 mr-2 h-5 w-5" />
                  New Invoice
                </Link>
              </div>
            )}
          </div>
        )}
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
                        Are you sure you want to delete invoice {invoiceToDelete?.invoiceNumber || `INV-${invoiceToDelete?.id.substring(0, 6)}`}? This action cannot be undone.
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

export default Invoices;