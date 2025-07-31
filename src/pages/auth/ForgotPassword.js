import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiMail, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword = () => {
  const { resetPassword, error } = useAuth();
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);
      setAuthError('');
      setSuccessMessage('');
      await resetPassword(values.email);
      setSuccessMessage(`Password reset email sent to ${values.email}. Please check your inbox.`);
      resetForm();
    } catch (error) {
      setAuthError(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-medium text-center mb-6">Reset your password</h3>
      <p className="text-sm text-gray-600 text-center mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      {(authError || error) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{authError || error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
          <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <Formik
        initialValues={{ email: '' }}
        validationSchema={ForgotPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, touched, errors }) => (
          <Form className="space-y-6">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`input pl-10 ${touched.email && errors.email ? 'border-red-500' : ''}`}
                  placeholder="you@example.com"
                />
              </div>
              <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="btn btn-primary w-full flex justify-center items-center"
              >
                {(isSubmitting || isLoading) ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending reset link...
                  </>
                ) : 'Send reset link'}
              </button>
            </div>
          </Form>
        )}
      </Formik>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;