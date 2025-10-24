import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ReservationForm from '../components/ReservationForm';
import toast from 'react-hot-toast';

const PropertyDetail = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchProperty();
    fetchBookedDates();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setProperty(data);
    } catch (error) {
      console.error('Error fetching property:', error.message);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedDates = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('check_in_date, check_out_date, status')
        .eq('property_id', id)
        .neq('status', 'cancelled')
        .gte('check_out_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      setBookedDates(
        data.map((reservation) => ({
          check_in: reservation.check_in_date,
          check_out: reservation.check_out_date,
        }))
      );
    } catch (error) {
      console.error('Error fetching booked dates:', error.message);
    }
  };

  const handleDateSelect = (checkIn, checkOut) => {
    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Property Not Found
          </h2>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const amenitiesList =
    typeof property.amenities === 'string'
      ? JSON.parse(property.amenities)
      : property.amenities || [];

  const images = property.image_urls || [];
  const currentImage = images[selectedImageIndex] || 'https://via.placeholder.com/800x600?text=No+Image';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link to="/" className="text-blue-600 hover:underline">
            Properties
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-700">{property.name}</span>
        </nav>

        {/* Property Images */}
        <div className="mb-8">
          <div className="bg-white rounded-lg overflow-hidden shadow-lg mb-4">
            <img
              src={currentImage}
              alt={property.name}
              className="w-full h-96 object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative rounded-lg overflow-hidden ${
                    selectedImageIndex === index
                      ? 'ring-4 ring-blue-600'
                      : 'ring-1 ring-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${property.name} ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.name}
              </h1>

              <div className="flex items-center text-gray-600 mb-4">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {property.location}
              </div>

              <div className="flex items-center space-x-6 text-gray-700 border-t border-b py-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>{property.max_guests} Guests</span>
                </div>

                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span>{property.bedrooms} Bedrooms</span>
                </div>

                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span>{property.bathrooms} Bathrooms</span>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-2xl font-bold text-blue-600">
                  ${property.price_per_night}
                  <span className="text-base text-gray-600 font-normal"> / night</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">About This Property</h2>
              <p className="text-gray-700 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 gap-4">
                {amenitiesList.map((amenity, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <svg
                      className="w-5 h-5 mr-3 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {amenity}
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Calendar */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Select Your Dates</h2>
              <AvailabilityCalendar
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                onDateSelect={handleDateSelect}
                bookedDates={bookedDates}
              />
            </div>
          </div>

          {/* Reservation Form */}
          <div className="lg:col-span-1">
            <ReservationForm
              property={property}
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
