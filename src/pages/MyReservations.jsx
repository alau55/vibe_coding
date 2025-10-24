import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';

const MyReservations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchReservations();
  }, [user, navigate]);

  const fetchReservations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          properties (
            id,
            name,
            location,
            image_urls,
            price_per_night
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error.message);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId)
        .eq('user_id', user.id); // Security: ensure user owns this reservation

      if (error) throw error;

      toast.success('Reservation cancelled successfully');
      fetchReservations(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling reservation:', error.message);
      toast.error('Failed to cancel reservation');
    }
  };

  const getFilteredReservations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return reservations.filter((reservation) => {
      const checkOutDate = parseISO(reservation.check_out_date);

      if (filter === 'upcoming') {
        return !isPast(checkOutDate) && reservation.status !== 'cancelled';
      } else if (filter === 'past') {
        return isPast(checkOutDate) || reservation.status === 'cancelled';
      }

      return true; // all
    });
  };

  const filteredReservations = getFilteredReservations();

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reservations</h1>
          <p className="mt-2 text-gray-600">
            View and manage your vacation rental bookings
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`${
                filter === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All Reservations
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {reservations.length}
              </span>
            </button>

            <button
              onClick={() => setFilter('upcoming')}
              className={`${
                filter === 'upcoming'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Upcoming
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {
                  reservations.filter(
                    (r) => !isPast(parseISO(r.check_out_date)) && r.status !== 'cancelled'
                  ).length
                }
              </span>
            </button>

            <button
              onClick={() => setFilter('past')}
              className={`${
                filter === 'past'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Past
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {
                  reservations.filter(
                    (r) => isPast(parseISO(r.check_out_date)) || r.status === 'cancelled'
                  ).length
                }
              </span>
            </button>
          </nav>
        </div>

        {/* Empty State */}
        {filteredReservations.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No reservations found
            </h3>
            <p className="mt-2 text-gray-600">
              {filter === 'all'
                ? 'You haven\'t made any reservations yet.'
                : filter === 'upcoming'
                ? 'You don\'t have any upcoming reservations.'
                : 'You don\'t have any past reservations.'}
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Properties
            </Link>
          </div>
        )}

        {/* Reservations List */}
        {filteredReservations.length > 0 && (
          <div className="space-y-6">
            {filteredReservations.map((reservation) => {
              const property = reservation.properties;
              const imageUrl =
                property?.image_urls?.[0] ||
                'https://via.placeholder.com/400x300?text=No+Image';
              const checkInDate = parseISO(reservation.check_in_date);
              const checkOutDate = parseISO(reservation.check_out_date);
              const isUpcoming = !isPast(checkOutDate);
              const canCancel =
                reservation.status !== 'cancelled' &&
                isUpcoming &&
                !isPast(checkInDate);

              return (
                <div
                  key={reservation.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <Link to={`/property/${property.id}`}>
                        <img
                          src={imageUrl}
                          alt={property.name}
                          className="w-full h-64 md:h-full object-cover"
                        />
                      </Link>
                    </div>

                    <div className="md:w-2/3 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Link
                            to={`/property/${property.id}`}
                            className="text-2xl font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {property.name}
                          </Link>
                          <p className="text-gray-600 mt-1">{property.location}</p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                            reservation.status
                          )}`}
                        >
                          {reservation.status.charAt(0).toUpperCase() +
                            reservation.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Check-in</p>
                          <p className="font-semibold">
                            {format(checkInDate, 'MMM dd, yyyy')}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Check-out</p>
                          <p className="font-semibold">
                            {format(checkOutDate, 'MMM dd, yyyy')}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Guests</p>
                          <p className="font-semibold">{reservation.guest_count}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Total Price</p>
                          <p className="font-semibold text-blue-600">
                            ${parseFloat(reservation.total_price).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {reservation.special_requests && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Special Requests</p>
                          <p className="text-gray-800">{reservation.special_requests}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <p className="text-sm text-gray-500">
                          Booked on {format(parseISO(reservation.created_at), 'MMM dd, yyyy')}
                        </p>

                        {canCancel && (
                          <button
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Cancel Reservation
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservations;
