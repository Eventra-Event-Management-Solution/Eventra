import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  where,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import {
  FiUsers,
  FiPlusCircle,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEdit,
  FiEye,
  FiAlertCircle,
  FiCheckCircle,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const { user } = useAuth();

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const clientsRef = collection(db, "clients");
      // Add where clause to filter by user ID
      const clientsQuery = query(
        clientsRef,
        where("userId", "==", user.uid),
        orderBy("lastName")
      );
      const clientsSnapshot = await getDocs(clientsQuery);

      const clientsList = clientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClients(clientsList);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Failed to load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      await deleteDoc(doc(db, "clients", clientToDelete.id));
      setClients(clients.filter((client) => client.id !== clientToDelete.id));
      setShowDeleteModal(false);
      setClientToDelete(null);
      setSuccessMessage("Client deleted successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error deleting client:", err);
      setError("Failed to delete client. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setClientToDelete(null);
  };

  // Filter and search clients
  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm);

    const matchesType = filterType === "all" || client.type === filterType;

    return matchesSearch && matchesType;
  });

  // Get unique client types for filter
  const clientTypes = [
    "all",
    ...new Set(clients.map((client) => client.type).filter(Boolean)),
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Link
          to="/clients/create"
          className="btn btn-primary inline-flex items-center"
        >
          <FiPlusCircle className="-ml-1 mr-2 h-5 w-5" />
          New Client
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
              placeholder="Search clients..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {clientTypes.length > 1 && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="input pl-10 pr-10 appearance-none"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                {clientTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Company
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-lg">
                          {client.firstName?.[0]}
                          {client.lastName?.[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.firstName} {client.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.email && (
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <FiMail className="mr-1 h-4 w-4" />
                          <a
                            href={`mailto:${client.email}`}
                            className="hover:text-primary"
                          >
                            {client.email}
                          </a>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <FiPhone className="mr-1 h-4 w-4" />
                          <a
                            href={`tel:${client.phone}`}
                            className="hover:text-primary"
                          >
                            {client.phone}
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.company || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.type ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {client.type}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/clients/${client.id}`}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FiEye className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/clients/${client.id}/edit`}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FiEdit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(client)}
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
            <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No clients found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {clients.length === 0
                ? "Get started by creating a new client."
                : "Try adjusting your search or filter to find what you're looking for."}
            </p>
            {clients.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/clients/create"
                  className="btn btn-primary inline-flex items-center"
                >
                  <FiPlusCircle className="-ml-1 mr-2 h-5 w-5" />
                  New Client
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
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

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
                        Are you sure you want to delete{" "}
                        {clientToDelete?.firstName} {clientToDelete?.lastName}?
                        This action cannot be undone.
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

export default Clients;
