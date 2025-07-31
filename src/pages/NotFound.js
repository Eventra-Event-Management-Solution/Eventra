import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <FiAlertTriangle className="mx-auto h-16 w-16 text-yellow-500" />
          <h1 className="mt-6 text-4xl font-extrabold text-gray-900 tracking-tight">
            404
          </h1>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Page Not Found
          </h2>
          <p className="mt-2 text-base text-gray-500">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to="/"
            className="btn btn-primary inline-flex items-center"
          >
            <FiHome className="-ml-1 mr-2 h-5 w-5" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary inline-flex items-center"
          >
            <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;