import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import { 
  FiEdit, FiTrash2, FiUser, 
  FiMail, FiPhone, FiGlobe, FiMapPin, FiCalendar, FiDollarSign, FiFileText
} from 'react-icons/fi';
import { useLocation } from '../../contexts/LocationContext';

const VendorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency, getCurrencySymbol } = useLocation();
  const [vendor, setVendor] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const vendorDoc = await getDoc(doc(db, 'vendors', id));
      
      if (vendorDoc.exists()) {
        const vendorData = { id: vendorDoc.id, ...vendorDoc.data() };
        setVendor(vendorData);
        
        // Fetch events associated with this vendor
        const eventsRef = collection(db, 'events');
        const eventsQuery = query(eventsRef, where('vendors', 'array-contains', id));
        const eventsSnapshot = await getDocs(eventsQuery);
        
        const eventsData = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setEvents(eventsData);
      } else {
        setError('Vendor not found');
      }
    } catch (err) {
      console.error('Error fetching vendor:', err);
      setError('Failed to load vendor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, 'vendors', id));
      navigate('/vendors', { state: { message: 'Vendor deleted successfully' } });
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setError('Failed to delete vendor. Please try again.');
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Helper function to format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function for status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
        <div className="flex space-x-3">
          <Link to={`/vendors/${id}/edit`} className="btn btn-secondary inline-flex items-center">
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
        {/* Vendor Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Vendor Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                
                {vendor.contactName && (
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">{vendor.contactName}</p>
                  </div>
                )}
                
                {vendor.email && (
                  <div className="flex items-center">
                    <FiMail className="mr-2 h-5 w-5 text-gray-400" />
                    <a href={`mailto:${vendor.email}`} className="hover:text-primary">
                      {vendor.email}
                    </a>
                  </div>
                )}
                
                {vendor.phone && (
                  <div className="flex items-center">
                    <FiPhone className="mr-2 h-5 w-5 text-gray-400" />
                    <a href={`tel:${vendor.phone}`} className="hover:text-primary">
                      {vendor.phone}
                    </a>
                  </div>
                )}
                
                {vendor.website && (
                  <div className="flex items-center">
                    <FiGlobe className="mr-2 h-5 w-5 text-gray-400" />
                    <a 
                      href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {vendor.website}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Address Information */}
              {(vendor.address || vendor.city || vendor.state || vendor.zipCode) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Address</h3>
                  
                  <div className="flex items-start">
                    <FiMapPin className="mr-2 h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      {vendor.address && <p>{vendor.address}</p>}
                      {(vendor.city || vendor.state || vendor.zipCode) && (
                        <p>
                          {[vendor.city, vendor.state, vendor.zipCode].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vendor Type */}
                {vendor.type && (
                  <div>
                    <p className="text-sm text-gray-500">Vendor Type</p>
                    <p className="font-medium">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {vendor.type}
                      </span>
                    </p>
                  </div>
                )}
                
                {/* Rate */}
                {vendor.rate && (
                  <div>
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    <p className="font-medium flex items-center">
                      <span className="mr-1 text-gray-400">{getCurrencySymbol()}</span>
                      {vendor.rate}/hr
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notes */}
            {vendor.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <div className="flex items-start">
                  <FiFileText className="mr-2 h-5 w-5 text-gray-400 mt-0.5" />
                  <p className="text-gray-700 whitespace-pre-line">{vendor.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Events with this Vendor */}
        <div className="space-y-6">
          <div className="card bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Associated Events</h2>
            
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map(event => (
                  <div key={event.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                    <Link to={`/events/${event.id}`} className="block">
                      <h3 className="font-medium text-primary">{event.name}</h3>
                      
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <FiCalendar className="mr-1 h-4 w-4" />
                        {formatDate(event.date)}
                      </div>
                      
                      {event.status && (
                        <div className="mt-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No events associated with this vendor.</p>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link to="/events/create" className="text-primary hover:text-primary-dark font-medium">
                + Create New Event
              </Link>
            </div>
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
                      Delete Vendor
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {vendor.name}? This action cannot be undone.
                        {events.length > 0 && (
                          <span className="block mt-2 font-semibold">
                            Warning: This vendor is associated with {events.length} event{events.length !== 1 ? 's' : ''}.
                          </span>
                        )}
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

export default VendorDetail;