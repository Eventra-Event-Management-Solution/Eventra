import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiCalendar, FiUsers, FiShoppingBag, FiFileText, 
  FiLogOut, FiMenu, FiX, FiHome
} from 'react-icons/fi';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', icon: FiHome, href: '/' },
    { name: 'Events', icon: FiCalendar, href: '/events' },
    { name: 'Clients', icon: FiUsers, href: '/clients' },
    { name: 'Vendors', icon: FiShoppingBag, href: '/vendors' },
    { name: 'Invoices', icon: FiFileText, href: '/invoices' },
  ];

  const userNavigation = [
    
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Eventra Logo" className="w-8 h-8 mr-2" />
            <span className="text-xl font-semibold text-primary">Eventra</span>
          </Link>
          <button 
            className="p-1 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 py-6">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Account
            </p>
            <nav className="mt-2 space-y-1">
              {userNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    {item.name}
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                <FiLogOut className="mr-3 h-5 w-5 text-gray-500" />
                Sign out
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="p-1 text-gray-500 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu className="w-6 h-6" />
            </button>

            <div className="flex items-center">
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {user?.photoURL ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.photoURL}
                        alt={user?.displayName || 'User'}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-700">
                      {user?.displayName || user?.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;