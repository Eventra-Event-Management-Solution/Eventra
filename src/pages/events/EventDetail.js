import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import {
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiMapPin,
  FiDollarSign,
  FiUser,
  FiUsers,
  FiCheckSquare,
  FiAlertCircle,
  FiArrowLeft,
  FiFileText,
  FiClock
} from 'react-icons/fi';
import { useLocation } from '../../contexts/LocationContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency, getCurrencySymbol } = useLocation();
  const [event, setEvent] = useState(null);
  const [client, setClient] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {user} = useAuth();
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch event data
        const eventDoc = await getDoc(doc(db, 'users', user.uid, 'events', id));
        if (!eventDoc.exists()) {
          setError('Event not found');
          setLoading(faslse);
          return;
        }

        const eventData = eventDoc.data();
        // Convert Firestore timestamp to Date object
        const eventDate = eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date);
        const endTime = eventData.endTime?.toDate ? eventData.endTime.toDate() : 
                        (eventData.endTime ? new Date(eventData.endTime) : null);

        setEvent({
          id: eventDoc.id,
          ...eventData,
          date: eventDate,
          endTime: endTime
        });

        // Fetch client data if clientId exists
        if (eventData.clientId) {
          const clientDoc = await getDoc(doc(db, 'users', user.uid, 'clients', eventData.clientId));
          if (clientDoc.exists()) {
            setClient({
              id: clientDoc.id,
              ...clientDoc.data()
            });
          }
        }

        // Fetch vendors if vendorIds exist
        if (eventData.vendorIds && eventData.vendorIds.length > 0) {
          const vendorPromises = eventData.vendorIds.map(vendorId => 
            getDoc(doc(db, 'users', user.uid, 'vendors', vendorId))
          );
          const vendorDocs = await Promise.all(vendorPromises);
          const vendorData = vendorDocs
            .filter(doc => doc.exists())
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          setVendors(vendorData);
        }
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEventData();
    }
  }, [id]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'events', id));
      setShowDeleteModal(false);
      navigate('/events', { state: { message: 'Event deleted successfully' } });
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
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
            onClick={() => navigate('/events')} 
            className="mt-2 text-red-700 underline"
          >
            Return to Events
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  // Format date and time
  const formattedDate = format(event.date, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(event.date, 'h:mm a');
  const formattedEndTime = event.endTime ? format(event.endTime, 'h:mm a') : null;
  const timeDisplay = formattedEndTime 
    ? `${formattedStartTime} - ${formattedEndTime}` 
    : formattedStartTime;

  // Get status color
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/events')} 
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <span className={`ml-4 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>
        <div className="flex space-x-2">
          <Link 
            to={`/events/${id}/edit`} 
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
        {/* Main event details */}
        <div className="md:col-span-2 space-y-6">
          <div className="card bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start">
                <FiCalendar className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-gray-900">{formattedDate}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiClock className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-gray-900">{timeDisplay}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiMapPin className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-gray-900">{event.location}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="mt-1 mr-2 text-gray-400">{getCurrencySymbol()}</span>
                <div>
                  <p className="text-sm font-medium text-gray-500">Budget</p>
                  <p className="text-gray-900">
                    {event.budget ? formatCurrency(event.budget) : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
            
            {event.description && (
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
              </div>
            )}
          </div>

          {/* Tasks section */}
          <div className="card bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tasks</h2>
              <button className="text-primary hover:text-primary-dark text-sm font-medium">
                Add Task
              </button>
            </div>
            
            {event.tasks && event.tasks.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {event.tasks.map((task, index) => (
                  <li key={index} className="py-3 flex items-start">
                    <FiCheckSquare className="mt-0.5 mr-2 h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-gray-500 text-sm">{task.description}</p>
                      )}
                      {task.assignedTo && (
                        <p className="text-gray-500 text-sm mt-1">Assigned to: {task.assignedTo}</p>
                      )}
                    </div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No tasks have been added to this event yet.</p>
            )}
          </div>

          {/* Notes section */}
          {event.notes && (
            <div className="card bg-white shadow-sm">
              <div className="flex items-center mb-4">
                <FiFileText className="mr-2 h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-semibold">Notes</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-line">{event.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client information */}
          <div className="card bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Client</h2>
            
            {client ? (
              <div>
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-lg">
                    {client.firstName?.[0]}{client.lastName?.[0]}
                  </div>
                  <div className="ml-3">
                    <p className="text-gray-900 font-medium">{client.firstName} {client.lastName}</p>
                    <p className="text-gray-500 text-sm">{client.company || 'No company'}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {client.email && (
                    <p className="flex items-center">
                      <span className="text-gray-500 mr-2">Email:</span>
                      <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                        {client.email}
                      </a>
                    </p>
                  )}
                  
                  {client.phone && (
                    <p className="flex items-center">
                      <span className="text-gray-500 mr-2">Phone:</span>
                      <a href={`tel:${client.phone}`} className="text-primary hover:underline">
                        {client.phone}
                      </a>
                    </p>
                  )}
                </div>
                
                <div className="mt-4">
                  <Link to={`/clients/${client.id}`} className="text-primary hover:underline text-sm font-medium">
                    
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No client information available.</p>
            )}
          </div>

          {/* Vendors section */}
          <div className="card bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Vendors</h2>
              <button className="text-primary hover:text-primary-dark text-sm font-medium">
                Add Vendor
              </button>
            </div>
            
            {vendors.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {vendors.map(vendor => (
                  <li key={vendor.id} className="py-3">
                    <div className="flex items-center">
                      <FiUsers className="mr-2 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-gray-900 font-medium">{vendor.name}</p>
                        <p className="text-gray-500 text-sm">{vendor.type}</p>
                      </div>
                    </div>
                    <div className="mt-2 ml-7 space-y-1 text-sm">
                      {vendor.contactName && (
                        <p className="flex items-center">
                          <FiUser className="mr-2 h-4 w-4 text-gray-400" />
                          <span>{vendor.contactName}</span>
                        </p>
                      )}
                      {vendor.email && (
                        <p>
                          <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">
                            {vendor.email}
                          </a>
                        </p>
                      )}
                      {vendor.phone && (
                        <p>
                          <a href={`tel:${vendor.phone}`} className="text-primary hover:underline">
                            {vendor.phone}
                          </a>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No vendors assigned to this event.</p>
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
                      Delete Event
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the event "{event.title}"? This action cannot be undone.
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

export default EventDetail;