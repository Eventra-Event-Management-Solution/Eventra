import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { collection, doc, getDoc, setDoc, updateDoc, query, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { v4 as uuidv4 } from 'uuid';
import { 
  FiSave, 
  FiX, 
  FiAlertCircle, 
  FiCheckCircle,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiDollarSign,
  FiTag
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const EventForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [initialValues, setInitialValues] = useState({
    title: '',
    type: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    clientId: '',
    clientName: '',
    budget: '',
    status: 'tentative',
    vendorIds: [],
    tasks: [],
    notes: ''
  });

  // Validation schema
  const validationSchema = Yup.object({
    title: Yup.string().required('Title is required'),
    type: Yup.string().required('Event type is required'),
    date: Yup.date().required('Date is required'),
    startTime: Yup.string().required('Start time is required'),
    location: Yup.string().required('Location is required'),
    clientId: Yup.string().required('Client is required'),
    budget: Yup.number().typeError('Budget must be a number').min(0, 'Budget cannot be negative'),
    status: Yup.string().required('Status is required')
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const clientsQuery = query(collection(db, 'users', user.uid, 'clients'));
        const clientsSnapshot = await getDocs(clientsQuery);
        const clientsList = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClients(clientsList);

        // Fetch vendors from user's collection
        const vendorsQuery = query(collection(db, 'users', user.uid, 'vendors'));
        const vendorsSnapshot = await getDocs(vendorsQuery);
        const vendorsList = vendorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVendors(vendorsList);

        // If editing, fetch event data from user's collection
        if (mode === 'edit' && id) {
          const eventDoc = await getDoc(doc(db, 'users', user.uid, 'events', id));
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            const date = eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date);
            // Format date and times for form inputs
            const formattedDate = date.toISOString().split('T')[0];
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const formattedStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            // Calculate end time (default to 2 hours after start if not specified)
            let endHours = hours + 2;
            let endMinutes = minutes;
            if (eventData.endTime) {
              const endDate = eventData.endTime?.toDate ? eventData.endTime.toDate() : new Date(eventData.endTime);
              endHours = endDate.getHours();
              endMinutes = endDate.getMinutes();
            }
            const formattedEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
            
            setInitialValues({
              ...initialValues,
              ...eventData,
              date: formattedDate,
              startTime: formattedStartTime,
              endTime: formattedEndTime,
              budget: eventData.budget?.toString() || '',
              vendorIds: eventData.vendorIds || [],
              tasks: eventData.tasks || [],
              notes: eventData.notes || ''
            });
          } else {
            setError('Event not found');
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
  }, [id, mode]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null);
      setSuccess(false);
      
      // Format date and times
      const [hours, minutes] = values.startTime.split(':');
      const eventDate = new Date(values.date);
      eventDate.setHours(parseInt(hours, 10));
      eventDate.setMinutes(parseInt(minutes, 10));
      
      // Format end time if provided
      let endDate = null;
      if (values.endTime) {
        const [endHours, endMinutes] = values.endTime.split(':');
        endDate = new Date(values.date);
        endDate.setHours(parseInt(endHours, 10));
        endDate.setMinutes(parseInt(endMinutes, 10));
      }
      
      // Get client name from selected client
      const selectedClient = clients.find(client => client.id === values.clientId);
      const clientName = selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : '';
      
      // Prepare event data
      const eventData = {
        title: values.title,
        type: values.type,
        date: eventDate,
        endTime: endDate,
        location: values.location,
        description: values.description,
        clientId: values.clientId,
        clientName,
        budget: values.budget ? parseFloat(values.budget) : 0,
        status: values.status,
        vendorIds: values.vendorIds,
        tasks: values.tasks,
        notes: values.notes,
        updatedAt: new Date()
      };
      
      if (mode === 'create') {
        // Add created timestamp and userId for new events
        eventData.createdAt = new Date();
        eventData.userId = user.uid; // Add user ID to the document
        
        // Generate a new ID or use Firebase auto-ID
        const eventId = id || uuidv4();
        
        // Create in the nested structure
        const eventRef = doc(db, `users/${user.uid}/events`, eventId);
        await setDoc(eventRef, eventData);
        setSuccess(true);
        
        // Redirect after short delay
        setTimeout(() => {
          navigate(`/events/${eventId}`);
        }, 1500);
      } else {
        // Update existing event
        await updateDoc(doc(db, 'users', user.uid, 'events', id), eventData);
        setSuccess(true);
        
        // Redirect after short delay
        setTimeout(() => {
          navigate(`/events/${id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/events');
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
          {mode === 'create' ? 'Create New Event' : 'Edit Event'}
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
          <span>{mode === 'create' ? 'Event created successfully!' : 'Event updated successfully!'}</span>
        </div>
      )}

      <div className="card bg-white shadow-sm">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Title */}
                <div>
                  <label htmlFor="title" className="label">Event Title</label>
                  <Field name="title" type="text" className="input" />
                  <ErrorMessage name="title" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Event Type */}
                <div>
                  <label htmlFor="type" className="label">Event Type</label>
                  <Field name="type" as="select" className="input">
                    <option value="">Select Event Type</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Conference">Conference</option>
                    <option value="Gala">Gala</option>
                    <option value="Festival">Festival</option>
                    <option value="Other">Other</option>
                  </Field>
                  <ErrorMessage name="type" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Date */}
                <div>
                  <label htmlFor="date" className="label">Date</label>
                  <Field name="date" type="date" className="input" />
                  <ErrorMessage name="date" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="label">Start Time</label>
                    <Field name="startTime" type="time" className="input" />
                    <ErrorMessage name="startTime" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="label">End Time</label>
                    <Field name="endTime" type="time" className="input" />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="label">Location</label>
                  <Field name="location" type="text" className="input" />
                  <ErrorMessage name="location" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Client */}
                <div>
                  <label htmlFor="clientId" className="label">Client</label>
                  <Field name="clientId" as="select" className="input">
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="clientId" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Budget */}
                <div>
                  <label htmlFor="budget" className="label">Budget</label>
                  <Field name="budget" type="text" className="input" />
                  <ErrorMessage name="budget" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="label">Status</label>
                  <Field name="status" as="select" className="input">
                    <option value="tentative">Tentative</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </Field>
                  <ErrorMessage name="status" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="label">Description</label>
                <Field name="description" as="textarea" rows="4" className="input" />
              </div>

              {/* Vendors */}
              <div>
                <label className="label">Vendors</label>
                <div className="mt-2 space-y-2">
                  {vendors.length > 0 ? (
                    vendors.map(vendor => (
                      <div key={vendor.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`vendor-${vendor.id}`}
                          checked={values.vendorIds.includes(vendor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFieldValue('vendorIds', [...values.vendorIds, vendor.id]);
                            } else {
                              setFieldValue(
                                'vendorIds',
                                values.vendorIds.filter(id => id !== vendor.id)
                              );
                            }
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor={`vendor-${vendor.id}`} className="ml-2 block text-sm text-gray-900">
                          {vendor.name} ({vendor.type})
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No vendors available. Add vendors in the Vendors section.</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="label">Notes</label>
                <Field name="notes" as="textarea" rows="4" className="input" />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
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
                  {isSubmitting ? (
                    <span className="inline-flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Saving...
                    </span>
                  ) : (
                    <>
                      <FiSave className="-ml-1 mr-2 h-5 w-5" />
                      {mode === 'create' ? 'Create Event' : 'Update Event'}
                    </>
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EventForm;