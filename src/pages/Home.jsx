import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import PropertyCard from '../components/PropertyCard';
import toast from 'react-hot-toast';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [selectedAmenity, setSelectedAmenity] = useState('all');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchTerm, priceRange, selectedAmenity, properties]);

  const fetchProperties = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error.message);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];

    // Filter by search term (location or name)
    if (searchTerm) {
      filtered = filtered.filter(
        (property) =>
          property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by price range
    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'budget':
          filtered = filtered.filter((p) => p.price_per_night <= 200);
          break;
        case 'moderate':
          filtered = filtered.filter(
            (p) => p.price_per_night > 200 && p.price_per_night <= 400
          );
          break;
        case 'luxury':
          filtered = filtered.filter((p) => p.price_per_night > 400);
          break;
        default:
          break;
      }
    }

    // Filter by amenity
    if (selectedAmenity !== 'all') {
      filtered = filtered.filter((property) => {
        const amenities =
          typeof property.amenities === 'string'
            ? JSON.parse(property.amenities)
            : property.amenities || [];
        return amenities.includes(selectedAmenity);
      });
    }

    setFilteredProperties(filtered);
  };

  // Extract unique amenities from all properties
  const getAllAmenities = () => {
    const amenitiesSet = new Set();
    properties.forEach((property) => {
      const amenities =
        typeof property.amenities === 'string'
          ? JSON.parse(property.amenities)
          : property.amenities || [];
      amenities.forEach((amenity) => amenitiesSet.add(amenity));
    });
    return Array.from(amenitiesSet).sort();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Vacation Rental
          </h1>
          <p className="text-xl text-blue-100">
            Discover amazing properties for your next getaway
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search Location or Name
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g., Malibu, Beach Villa"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Price Range */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Price Range
              </label>
              <select
                id="price"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Prices</option>
                <option value="budget">Budget ($0 - $200)</option>
                <option value="moderate">Moderate ($200 - $400)</option>
                <option value="luxury">Luxury ($400+)</option>
              </select>
            </div>

            {/* Amenities */}
            <div>
              <label
                htmlFor="amenity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Amenities
              </label>
              <select
                id="amenity"
                value={selectedAmenity}
                onChange={(e) => setSelectedAmenity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Amenities</option>
                {getAllAmenities().map((amenity) => (
                  <option key={amenity} value={amenity}>
                    {amenity}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredProperties.length} of {properties.length}{' '}
            {filteredProperties.length === 1 ? 'property' : 'properties'}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProperties.length === 0 && (
          <div className="text-center py-12">
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No properties found
            </h3>
            <p className="mt-2 text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Properties Grid */}
        {!loading && filteredProperties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
