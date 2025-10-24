import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { differenceInDays, format } from 'date-fns';

const ReservationForm = ({ property, checkInDate, checkOutDate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);

  if (!checkInDate || !checkOutDate) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Book This Property</h3>
        <p className="text-gray-600">
          Please select your check-in and check-out dates on the calendar to continue.
        </p>
      </div>
    );
  }

  const nights = differenceInDays(checkOutDate, checkInDate);
  const totalPrice = nights * parseFloat(property.price_per_night);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to make a reservation');
      navigate('/login');
      return;
    }

    if (guestCount > property.max_guests) {
      toast.error(`This property can accommodate a maximum of ${property.max_guests} guests`);
      return;
    }

    setLoading(true);

    try {
      // Check availability one more time before booking
      const { data: existingReservations, error: checkError } = await supabase
        .from('reservations')
        .select('*')
        .eq('property_id', property.id)
        .neq('status', 'cancelled')
        .or(
          `and(check_in_date.lte.${format(checkInDate, 'yyyy-MM-dd')},check_out_date.gt.${format(checkInDate, 'yyyy-MM-dd')}),` +
          `and(check_in_date.lt.${format(checkOutDate, 'yyyy-MM-dd')},check_out_date.gte.${format(checkOutDate, 'yyyy-MM-dd')}),` +
          `and(check_in_date.gte.${format(checkInDate, 'yyyy-MM-dd')},check_out_date.lte.${format(checkOutDate, 'yyyy-MM-dd')})`
        );

      if (checkError) throw checkError;

      if (existingReservations && existingReservations.length > 0) {
        toast.error('Sorry, this property is no longer available for the selected dates');
        setLoading(false);
        return;
      }

      // Create the reservation
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            user_id: user.id,
            property_id: property.id,
            check_in_date: format(checkInDate, 'yyyy-MM-dd'),
            check_out_date: format(checkOutDate, 'yyyy-MM-dd'),
            total_price: totalPrice,
            guest_count: guestCount,
            special_requests: specialRequests,
            status: 'confirmed',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Reservation confirmed! Check your reservations page for details.');
      navigate('/my-reservations');
    } catch (error) {
      console.error('Error creating reservation:', error.message);
      toast.error('Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
      <h3 className="text-xl font-semibold mb-4">Reservation Details</h3>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Price per night:</span>
          <span className="font-semibold">${property.price_per_night}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">
            {nights} {nights === 1 ? 'night' : 'nights'}:
          </span>
          <span className="font-semibold">
            ${property.price_per_night} x {nights}
          </span>
        </div>
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-lg font-bold text-blue-600">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mr-2 mt-0.5"
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
          <div>
            <p className="text-sm text-gray-700">
              <strong>Check-in:</strong> {format(checkInDate, 'MMM dd, yyyy')}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Check-out:</strong> {format(checkOutDate, 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="guestCount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Number of Guests
          </label>
          <input
            type="number"
            id="guestCount"
            min="1"
            max={property.max_guests}
            value={guestCount}
            onChange={(e) => setGuestCount(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum {property.max_guests} guests
          </p>
        </div>

        <div>
          <label
            htmlFor="specialRequests"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Special Requests (Optional)
          </label>
          <textarea
            id="specialRequests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any special requirements or requests..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !user}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : user ? 'Confirm Reservation' : 'Sign In to Book'}
        </button>

        {!user && (
          <p className="text-sm text-gray-500 text-center">
            Please{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:underline"
            >
              sign in
            </button>{' '}
            to make a reservation
          </p>
        )}
      </form>
    </div>
  );
};

export default ReservationForm;
