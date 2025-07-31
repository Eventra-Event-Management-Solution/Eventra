import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiSave, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const VendorForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchVendor();
    }
  }, [mode, id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const vendorDoc = await getDoc(doc(db, 'vendors', id));
      
      if (vendorDoc.exists()) {
        setVendor({ id: vendorDoc.id, ...vendorDoc.data() });
      } else {
        setError('Vendor not found');
        navigate('/vendors');
      }
    } catch (err) {
      console.error('Error fetching vendor:', err);
      setError('Failed to load vendor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initialValues = {
    name: vendor?.name || '',
    contactName: vendor?.contactName || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    address: vendor?.address || '',
    city: vendor?.city || '',
    state: vendor?.state || '',
    zipCode: vendor?.zipCode || '',
    type: vendor?.type || '',
    rate: vendor?.rate || '',
    notes: vendor?.notes || '',
    website: vendor?.website || ''
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Vendor name is required'),
    email: Yup.string().email('Invalid email address'),
    phone: Yup.string().matches(
      /^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/,
      'Invalid phone number format'
    ),
    rate: Yup.number().typeError('Rate must be a number').min(0, 'Rate cannot be negative'),
    website: Yup.string().url('Invalid URL format')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null);
      setSuccess(false);
      
      const vendorData = {
        ...values,
        rate: values.rate ? parseFloat(values.rate) : null,
        updatedAt: serverTimestamp()
      };
      
      if (mode === 'edit' && id) {
        // Update existing vendor
        await setDoc(doc(db, 'vendors', id), vendorData, { merge: true });
        setSuccess(true);
        setTimeout(() => {
          navigate(`/vendors/${id}`);
        }, 1500);
      } else {
        // Create new vendor
        vendorData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'vendors'), vendorData);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/vendors/${docRef.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving vendor:', err);
      setError('Failed to save vendor. Please try again.');
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
          {mode === 'edit' ? 'Edit Vendor' : 'Create Vendor'}
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
          <span>{mode === 'edit' ? 'Vendor updated successfully!' : 'Vendor created successfully!'}</span>
        </div>
      )}

      <div className="card bg-white shadow-sm">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, touched, errors }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vendor Name */}
                <div>
                  <label htmlFor="name" className="label">
                    Vendor Name *
                  </label>
                  <Field
                    type="text"
                    id="name"
                    name="name"
                    className={`input ${touched.name && errors.name ? 'border-red-500' : ''}`}
                  />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Contact Name */}
                <div>
                  <label htmlFor="contactName" className="label">
                    Contact Person
                  </label>
                  <Field
                    type="text"
                    id="contactName"
                    name="contactName"
                    className="input"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="label">
                    Email
                  </label>
                  <Field
                    type="email"
                    id="email"
                    name="email"
                    className={`input ${touched.email && errors.email ? 'border-red-500' : ''}`}
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="label">
                    Phone
                  </label>
                  <Field
                    type="text"
                    id="phone"
                    name="phone"
                    className={`input ${touched.phone && errors.phone ? 'border-red-500' : ''}`}
                  />
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="label">
                    Website
                  </label>
                  <Field
                    type="text"
                    id="website"
                    name="website"
                    className={`input ${touched.website && errors.website ? 'border-red-500' : ''}`}
                  />
                  <ErrorMessage name="website" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Vendor Type */}
                <div>
                  <label htmlFor="type" className="label">
                    Vendor Type
                  </label>
                  <Field
                    as="select"
                    id="type"
                    name="type"
                    className="input"
                  >
                    <option value="">Select a type</option>
                    <option value="Catering">Catering</option>
                    <option value="Venue">Venue</option>
                    <option value="Photography">Photography</option>
                    <option value="Videography">Videography</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Decoration">Decoration</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Other">Other</option>
                  </Field>
                </div>

                {/* Rate */}
                <div>
                  <label htmlFor="rate" className="label">
                    Hourly Rate (₹)
                  </label>
                  <Field
                    type="text"
                    id="rate"
                    name="rate"
                    className={`input ${touched.rate && errors.rate ? 'border-red-500' : ''}`}
                  />
                  <ErrorMessage name="rate" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Address */}
                <div>
                  <label htmlFor="address" className="label">
                    Address
                  </label>
                  <Field
                    type="text"
                    id="address"
                    name="address"
                    className="input"
                  />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="label">
                    City
                  </label>
                  <Field
                    type="text"
                    id="city"
                    name="city"
                    className="input"
                  />
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="label">
                    State
                  </label>
                  <Field
                    type="text"
                    id="state"
                    name="state"
                    className="input"
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <label htmlFor="zipCode" className="label">
                    Zip Code
                  </label>
                  <Field
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    className="input"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="label">
                  Notes
                </label>
                <Field
                  as="textarea"
                  id="notes"
                  name="notes"
                  rows="4"
                  className="input"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/vendors')}
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
                  {isSubmitting ? 'Saving...' : 'Save Vendor'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default VendorForm;