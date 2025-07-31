import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiUser, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .required('Full name is required')
    .min(2, 'Name is too short'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const Register = () => {
  const { register, loginWithGoogle, error } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsLoading(true);
      setAuthError('');
      await register(values.email, values.password, values.name);
      navigate('/');
    } catch (error) {
      setAuthError(error.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setAuthError('');
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      setAuthError(error.message || 'Failed to register with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-medium text-center mb-6">Create your account</h3>
      
      {(authError || error) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{authError || error}</span>
        </div>
      )}

      <Formik
        initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
        validationSchema={RegisterSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, touched, errors }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Full name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={`input pl-10 ${touched.name && errors.name ? 'border-red-500' : ''}`}
                  placeholder="John Doe"
                />
              </div>
              <ErrorMessage name="name" component="div" className="mt-1 text-sm text-red-600" />
            </div>

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
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className={`input pl-10 ${touched.password && errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <Field
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`input pl-10 ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
              </div>
              <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            <div className="mt-6">
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
                    Creating account...
                  </>
                ) : 'Create account'}
              </button>
            </div>
          </Form>
        )}
      </Formik>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <FcGoogle className="h-5 w-5 mr-2" />
            Google
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;