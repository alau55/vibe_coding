import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                VacationRentals
              </span>
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Properties
              </Link>

              {user && (
                <Link
                  to="/my-reservations"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600"
                >
                  My Reservations
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Hello, {userProfile?.full_name || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
          >
            Properties
          </Link>
          {user && (
            <Link
              to="/my-reservations"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
            >
              My Reservations
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
