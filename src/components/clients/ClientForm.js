import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { v4 as uuidv4 } from 'uuid';
import { FiSave, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const ClientForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [initialValues, setInitialValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    type: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    notes: ''
  });

  // Validation schema
  const validationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().matches(
      /^[\d\s\+\-\(\)]+$/,
      'Phone number can only contain digits, spaces, and the following characters: + - ( )'
    ),
    zipCode: Yup.string().matches(
      /^[\d\s\-]+$/,
      'Zip code can only contain digits, spaces, and hyphens'
    )
  });

  useEffect(() => {
    const fetchClient = async () => {
      if (mode === 'edit' && id) {
        try {
          const clientDoc = await getDoc(doc(db, 'clients', id));
          if (clientDoc.exists()) {
            setInitialValues({
              ...initialValues,
              ...clientDoc.data()
            });
          } else {
            setError('Client not found');
          }
        } catch (err) {
          console.error('Error fetching client:', err);
          setError('Failed to load client data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    if (mode === 'edit') {
      fetchClient();
    }
  }, [id, mode]);

  const { user } = useAuth();
  
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null);
      setSuccess(false);
      
      // Prepare client data
      const clientData = {
        ...values,
        name: `${values.firstName} ${values.lastName}`.trim(), // Add a combined name field
        updatedAt: new Date(),
        userId: user.uid // Add the user ID
      };
      
      if (mode === 'create') {
        // Add created timestamp for new clients
        clientData.createdAt = new Date();
        
        // Generate a new ID or use Firebase auto-ID
        const clientId = id || uuidv4();
        await setDoc(doc(db, 'clients', clientId), clientData);
        setSuccess(true);
        
        // Redirect after short delay
        setTimeout(() => {
          navigate(`/clients/${clientId}`);
        }, 1500);
      } else {
        // Update existing client
        await updateDoc(doc(db, 'clients', id), clientData);
        setSuccess(true);
        
        // Redirect after short delay
        setTimeout(() => {
          navigate(`/clients/${id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving client:', err);
      setError('Failed to save client. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/clients');
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
          {mode === 'create' ? 'Create New Client' : 'Edit Client'}
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
          <span>{mode === 'create' ? 'Client created successfully!' : 'Client updated successfully!'}</span>
        </div>
      )}

      <div className="card bg-white shadow-sm">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="label">First Name</label>
                  <Field name="firstName" type="text" className="input" />
                  <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="label">Last Name</label>
                  <Field name="lastName" type="text" className="input" />
                  <ErrorMessage name="lastName" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <Field name="email" type="email" className="input" />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="label">Phone</label>
                  <Field name="phone" type="text" className="input" />
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Company */}
                <div>
                  <label htmlFor="company" className="label">Company</label>
                  <Field name="company" type="text" className="input" />
                </div>

                {/* Client Type */}
                <div>
                  <label htmlFor="type" className="label">Client Type</label>
                  <Field name="type" as="select" className="input">
                    <option value="">Select Client Type</option>
                    <option value="Individual">Individual</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Non-profit">Non-profit</option>
                    <option value="Government">Government</option>
                    <option value="Other">Other</option>
                  </Field>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 pt-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Address */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="label">Address</label>
                  <Field name="address" type="text" className="input" />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="label">City</label>
                  <Field name="city" type="text" className="input" />
                </div>

                {/* State/Province */}
                <div>
                  <label htmlFor="state" className="label">State/Province</label>
                  <Field name="state" type="text" className="input" />
                </div>

                {/* Zip/Postal Code */}
                <div>
                  <label htmlFor="zipCode" className="label">Zip/Postal Code</label>
                  <Field name="zipCode" type="text" className="input" />
                  <ErrorMessage name="zipCode" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" className="label">Country</label>
                  <Field name="country" type="text" className="input" />
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
                      {mode === 'create' ? 'Create Client' : 'Update Client'}
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

export default ClientForm;