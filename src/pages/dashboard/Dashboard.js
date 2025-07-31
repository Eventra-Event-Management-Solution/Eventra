import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import { 
  FiCalendar, FiUsers, FiDollarSign, FiClock, 
  FiCheckCircle, FiPlusCircle, FiArrowRight 
} from 'react-icons/fi';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const { formatCurrency, getCurrencySymbol } = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalClients: 0,
    totalRevenue: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentClients, setRecentClients] = useState([]);

  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Revenue',
        data: [],
        backgroundColor: '#6366F1',
      },
    ],
  });

  const [eventTypeData, setEventTypeData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#0EA5E9', '#F43F5E', '#A855F7', '#14B8A6', '#F97316'],
        borderWidth: 0,
      },
    ],
  });

  const [clientGrowthData, setClientGrowthData] = useState({
    labels: [],
    datasets: [
      {
        label: 'New Clients',
        data: [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get current date for filtering upcoming events
        const now = new Date();
        
        // Fetch events
        const eventsRef = collection(db, 'events');
        // Add where clause to filter by user ID
        const eventsQuery = query(eventsRef, where("userId", "==", user.uid), orderBy('date', 'desc'));
        const eventsSnapshot = await getDocs(eventsQuery);
        const allEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter upcoming events
        const upcoming = allEvents.filter(event => {
          const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
          return eventDate >= now;
        }).sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateA - dateB;
        }).slice(0, 5);
        
        // Fetch clients
        const clientsRef = collection(db, 'clients');
        // Add where clause to filter by user ID
        const clientsQuery = query(clientsRef, where("userId", "==", user.uid), orderBy('createdAt', 'desc'), limit(5));
        const clientsSnapshot = await getDocs(clientsQuery);
        const recentClientsList = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch all clients for client growth chart
        const allClientsQuery = query(clientsRef, where("userId", "==", user.uid), orderBy('createdAt', 'asc'));
        const allClientsSnapshot = await getDocs(allClientsQuery);
        const allClients = allClientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
        }));
        
        // Fetch invoices for revenue calculation and chart
        const invoicesRef = collection(db, 'invoices');
        // Add where clause to filter by user ID
        const invoicesQuery = query(invoicesRef, where("userId", "==", user.uid));
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const invoices = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          issueDate: doc.data().issueDate?.toDate ? doc.data().issueDate.toDate() : new Date(doc.data().issueDate)
        }));
        
        const totalRevenue = invoices
          .map(invoice => invoice.amount || 0)
          .reduce((sum, amount) => sum + amount, 0);
        
        // Update state with fetched data
        setStats({
          totalEvents: allEvents.length,
          upcomingEvents: upcoming.length,
          totalClients: allClientsSnapshot.size,
          totalRevenue,
        });
        
        setUpcomingEvents(upcoming);
        setRecentClients(recentClientsList);
        
        // Process data for event type chart
        const eventTypes = {};
        allEvents.forEach(event => {
          if (event.type) {
            eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
          }
        });
        
        setEventTypeData({
          labels: Object.keys(eventTypes),
          datasets: [
            {
              data: Object.values(eventTypes),
              backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#0EA5E9', '#F43F5E', '#A855F7', '#14B8A6', '#F97316'].slice(0, Object.keys(eventTypes).length),
              borderWidth: 0,
            },
          ],
        });
        
        // Process data for revenue chart (monthly revenue for the last 6 months)
        const revenueByMonth = {};
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        
        // Initialize all months with 0
        for (let i = 0; i < 6; i++) {
          const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthKey = month.toLocaleString('default', { month: 'short' }) + ' ' + month.getFullYear();
          revenueByMonth[monthKey] = 0;
        }
        
        // Sum up revenue by month
        invoices.forEach(invoice => {
          if (invoice.issueDate && invoice.issueDate >= sixMonthsAgo && invoice.amount) {
            const monthKey = invoice.issueDate.toLocaleString('default', { month: 'short' }) + ' ' + invoice.issueDate.getFullYear();
            if (revenueByMonth[monthKey] !== undefined) {
              revenueByMonth[monthKey] += invoice.amount;
            }
          }
        });
        
        // Convert to arrays for chart.js
        const monthLabels = Object.keys(revenueByMonth).reverse();
        const monthData = monthLabels.map(month => revenueByMonth[month]);
        
        setRevenueData({
          labels: monthLabels,
          datasets: [
            {
              label: 'Revenue',
              data: monthData,
              backgroundColor: '#6366F1',
            },
          ],
        });
        
        // Process data for client growth chart (monthly new clients for the last 6 months)
        const clientsByMonth = {};
        
        // Initialize all months with 0
        for (let i = 0; i < 6; i++) {
          const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthKey = month.toLocaleString('default', { month: 'short' }) + ' ' + month.getFullYear();
          clientsByMonth[monthKey] = 0;
        }
        
        // Count clients by month of creation
        allClients.forEach(client => {
          if (client.createdAt && client.createdAt >= sixMonthsAgo) {
            const monthKey = client.createdAt.toLocaleString('default', { month: 'short' }) + ' ' + client.createdAt.getFullYear();
            if (clientsByMonth[monthKey] !== undefined) {
              clientsByMonth[monthKey] += 1;
            }
          }
        });
        
        // Convert to arrays for chart.js
        const clientMonthLabels = Object.keys(clientsByMonth).reverse();
        const clientMonthData = clientMonthLabels.map(month => clientsByMonth[month]);
        
        setClientGrowthData({
          labels: clientMonthLabels,
          datasets: [
            {
              label: 'New Clients',
              data: clientMonthData,
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // We're now using the dynamic data prepared in useEffect
  // The static sample data is no longer needed as we're using state variables
  // revenueData, eventTypeData, and clientGrowthData are now coming from state

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, {user?.displayName || 'User'}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-white shadow-sm flex items-center">
          <div className="p-3 rounded-full bg-primary/10 mr-4">
            <FiCalendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Events</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalEvents}</p>
          </div>
        </div>
        
        <div className="card bg-white shadow-sm flex items-center">
          <div className="p-3 rounded-full bg-secondary/10 mr-4">
            <FiClock className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.upcomingEvents}</p>
          </div>
        </div>
        
        <div className="card bg-white shadow-sm flex items-center">
          <div className="p-3 rounded-full bg-accent/10 mr-4">
            <FiUsers className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Clients</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalClients}</p>
          </div>
        </div>
        
        <div className="card bg-white shadow-sm flex items-center">
          <div className="p-3 rounded-full bg-success/10 mr-4">
            <FiDollarSign className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Revenue Overview</h2>
          <div className="h-64">
            <Bar 
              data={revenueData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      display: true,
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                    ticks: {
                      callback: (value) => formatCurrency(value),
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }} 
            />
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Event Types</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut 
              data={eventTypeData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                    },
                  },
                },
                cutout: '70%',
              }} 
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium mb-4">Client Growth</h2>
        <div className="h-64">
          <Line 
            data={clientGrowthData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)',
                  },
                  ticks: {
                    precision: 0,
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            }} 
          />
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Upcoming Events</h2>
          <Link to="/events" className="text-sm text-primary hover:text-primary/80 flex items-center">
            View all <FiArrowRight className="ml-1" />
          </Link>
        </div>
        
        {upcomingEvents.length > 0 ? (
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
                    Client
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
                {upcomingEvents.map((event) => {
                  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
                  
                  return (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">{event.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{format(eventDate, 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-gray-500">{format(eventDate, 'h:mm a')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.clientName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Confirmed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/events/${event.id}`} className="text-primary hover:text-primary/80">
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
            <div className="mt-6">
              <Link to="/events/create" className="btn btn-primary inline-flex items-center">
                <FiPlusCircle className="-ml-1 mr-2 h-5 w-5" />
                New Event
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Recent Clients */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent Clients</h2>
          <Link to="/clients" className="text-sm text-primary hover:text-primary/80 flex items-center">
            View all <FiArrowRight className="ml-1" />
          </Link>
        </div>
        
        {recentClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
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
                {recentClients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {client.name?.charAt(0) || 'C'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        <FiCheckCircle className="mr-1" /> Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/clients/${client.id}`} className="text-primary hover:text-primary/80">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new client.</p>
            <div className="mt-6">
              <Link to="/clients/create" className="btn btn-primary inline-flex items-center">
                <FiPlusCircle className="-ml-1 mr-2 h-5 w-5" />
                New Client
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;