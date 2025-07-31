import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import {
  FiEdit,
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiAlertCircle,
  FiArrowLeft,
  FiFileText,
  FiBriefcase,
  FiUser
} from 'react-icons/fi';
import { useLocation } from '../../contexts/LocationContext';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency } = useLocation();
  const [client, setClient] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch client data
        const clientDoc = await getDoc(doc(db, 'clients', id));
        if (!clientDoc.exists()) {
          setError('Client not found');
          setLoading(false);
          return;
        }

        setClient({
          id: clientDoc.id,
          ...clientDoc.data()
        });

        // Fetch events for this client
        const eventsQuery = query(collection(db, 'events'), where('clientId', '==', id));
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
        }));
        
        // Sort events by date (most recent first)
        eventsList.sort((a, b) => b.date - a.date);
        setEvents(eventsList);
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError('Failed to load client data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClientData();
    }
  }, [id]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, 'clients', id));
      setShowDeleteModal(false);
      navigate('/clients', { state: { message: 'Client deleted successfully' } });
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client. Please try again.');
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
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
        <div>
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => navigate('/clients')} 
            className="mt-2 text-red-700 underline"
          >
            Return to Clients
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/clients')} 
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{client.firstName} {client.lastName}</h1>
          {client.type && (
            <span className="ml-4 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
              {client.type}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Link 
            to={`/clients/${id}/edit`} 
            className="btn btn-secondary inline-flex items-center"
          >
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main client details */}
        <div className="md:col-span-2 space-y-6">
          <div className="card bg-white shadow-sm">
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-2xl">
                {client.firstName?.[0]}{client.lastName?.[0]}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{client.firstName} {client.lastName}</h2>
                {client.company && (
                  <p className="text-gray-500">{client.company}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.email && (
                <div className="flex items-start">
                  <FiMail className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              
              {client.phone && (
                <div className="flex items-start">
                  <FiPhone className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-primary hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              
              {client.company && (
                <div className="flex items-start">
                  <FiBriefcase className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company</p>
                    <p className="text-gray-900">{client.company}</p>
                  </div>
                </div>
              )}
              
              {client.type && (
                <div className="flex items-start">
                  <FiUser className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Client Type</p>
                    <p className="text-gray-900">{client.type}</p>
                  </div>
                </div>
              )}
            </div>
            
            {(client.address || client.city || client.state || client.zipCode || client.country) && (
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                  <FiMapPin className="mr-2 h-5 w-5" />
                  Address
                </h3>
                <address className="not-italic text-gray-700">
                  {client.address && <p>{client.address}</p>}
                  {(client.city || client.state || client.zipCode) && (
                    <p>
                      {client.city && `${client.city}, `}
                      {client.state && `${client.state} `}
                      {client.zipCode && client.zipCode}
                    </p>
                  )}
                  {client.country && <p>{client.country}</p>}
                </address>
              </div>
            )}
            
            {client.notes && (
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                  <FiFileText className="mr-2 h-5 w-5" />
                  Notes
                </h3>
                <p className="text-gray-700 whitespace-pre-line">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Events section */}
          <div className="card bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Events</h2>
              <Link 
                to="/events/create" 
                state={{ clientId: id }}
                className="text-primary hover:text-primary-dark text-sm font-medium"
              >
                Add New Event
              </Link>
            </div>
            
            {events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500">{event.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{format(event.date, 'MMM dd, yyyy')}</div>
                          <div className="text-sm text-gray-500">{format(event.date, 'h:mm a')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{event.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(event.status)}`}>
                            {event.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/events/${event.id}`} className="text-primary hover:text-primary-dark">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This client doesn't have any events yet.
                </p>
                <div className="mt-6">
                  <Link 
                    to="/events/create" 
                    state={{ clientId: id }}
                    className="btn btn-primary inline-flex items-center"
                  >
                    Create Event
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Client Summary</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Events</h3>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
              
              {client.createdAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Client Since</h3>
                  <p className="text-gray-900">
                    {format(
                      client.createdAt?.toDate ? client.createdAt.toDate() : new Date(client.createdAt),
                      'MMMM d, yyyy'
                    )}
                  </p>
                </div>
              )}
              
              {events.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Event</h3>
                  <p className="text-gray-900">{format(events[0].date, 'MMMM d, yyyy')}</p>
                  <p className="text-sm text-gray-500">{events[0].title}</p>
                </div>
              )}
              
              {/* Placeholder for future metrics */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculateTotalRevenue(events))}
                </p>
              </div>
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
                      Delete Client
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {client.firstName} {client.lastName}? This action cannot be undone.
                      </p>
                      {events.length > 0 && (
                        <p className="text-sm text-red-500 mt-2">
                          Warning: This client has {events.length} associated events. Deleting this client may affect those events.
                        </p>
                      )}
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

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'tentative':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to calculate total revenue from events
const calculateTotalRevenue = (events) => {
  return events.reduce((total, event) => {
    // Only count confirmed or completed events
    if (['confirmed', 'completed'].includes(event.status?.toLowerCase())) {
      return total + (event.budget || 0);
    }
    return total;
  }, 0);
};

export default ClientDetail;