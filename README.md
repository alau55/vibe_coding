# Vacation Rental Reservation System

A modern, full-featured vacation rental booking platform built with React, Vite, and Supabase. This application provides a complete property management and reservation system with user authentication, availability tracking, and real-time updates.

## Features

### User Authentication
- Secure user registration and login with Supabase Auth
- Session management with automatic token refresh
- Protected routes for authenticated users
- Email verification support

### Property Management
- Browse vacation rental properties with rich details
- Advanced search and filtering by:
  - Location and property name
  - Price range (Budget, Moderate, Luxury)
  - Amenities
- Property detail pages with image galleries
- Comprehensive property information (amenities, capacity, pricing)

### Availability & Booking
- Interactive calendar showing available and booked dates
- Visual date selection for check-in/check-out
- Automatic conflict detection to prevent double-booking
- Real-time availability checking
- Price calculation based on number of nights
- Guest count validation

### Reservation Management
- User dashboard for managing reservations
- Filter reservations by status (All, Upcoming, Past)
- Reservation details including:
  - Property information
  - Dates and guest count
  - Total price
  - Special requests
- Cancel reservations (for upcoming bookings)
- Reservation status tracking (Pending, Confirmed, Cancelled)

### User Interface
- Clean, modern design with Tailwind CSS
- Fully responsive mobile-first layout
- Toast notifications for user feedback
- Loading states and error handling
- Image galleries with thumbnail navigation

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase
  - PostgreSQL Database
  - Authentication (JWT)
  - Storage (Property Images)
  - Row Level Security (RLS)
- **Routing**: React Router v6
- **Date Handling**: date-fns
- **Notifications**: react-hot-toast
- **API Client**: @supabase/supabase-js

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- A Supabase account (free tier available at https://supabase.com)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd vibe_coding
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be provisioned

#### Get Your Supabase Credentials

1. In your Supabase project dashboard, go to Settings → API
2. Copy your project URL and anon/public key
3. You'll need these for the next step

#### Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste and run the SQL in the SQL Editor
4. This will create:
   - Tables: `user_profiles`, `properties`, `reservations`
   - Row Level Security policies
   - Helper functions for availability checking
   - Storage bucket for property images
   - Automatic triggers for user profile creation

#### Load Sample Data (Optional)

1. In the SQL Editor, copy the contents of `seed-data.sql`
2. Paste and run the SQL
3. This will populate the database with 8 sample vacation properties

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
/vibe_coding
  /src
    /components
      - Navbar.jsx                 # Navigation bar with auth state
      - PropertyCard.jsx           # Property listing card
      - AvailabilityCalendar.jsx   # Interactive date selection calendar
      - ReservationForm.jsx        # Booking form with validation
    /pages
      - Home.jsx                   # Property listings with search/filter
      - Login.jsx                  # User login page
      - Register.jsx               # User registration page
      - PropertyDetail.jsx         # Detailed property view
      - MyReservations.jsx         # User reservation dashboard
    /lib
      - supabaseClient.js          # Supabase client configuration
    /context
      - AuthContext.jsx            # Authentication context provider
    - App.jsx                      # Main app component with routing
    - main.jsx                     # Application entry point
    - index.css                    # Global styles with Tailwind
  - supabase-schema.sql            # Database schema and RLS policies
  - seed-data.sql                  # Sample property data
  - package.json
  - vite.config.js
  - tailwind.config.js
  - .env.example
  - README.md
```

## Database Schema

### Tables

#### `user_profiles`
Extended user profile information linked to Supabase Auth users.
- `id` (UUID, FK to auth.users)
- `email` (TEXT)
- `full_name` (TEXT)
- `created_at` (TIMESTAMP)

#### `properties`
Vacation rental property information.
- `id` (UUID, Primary Key)
- `name` (TEXT)
- `description` (TEXT)
- `location` (TEXT)
- `price_per_night` (NUMERIC)
- `amenities` (JSONB)
- `image_urls` (TEXT[])
- `max_guests` (INTEGER)
- `bedrooms` (INTEGER)
- `bathrooms` (NUMERIC)
- `created_at` (TIMESTAMP)

#### `reservations`
Booking reservations made by users.
- `id` (UUID, Primary Key)
- `user_id` (UUID, FK to auth.users)
- `property_id` (UUID, FK to properties)
- `check_in_date` (DATE)
- `check_out_date` (DATE)
- `total_price` (NUMERIC)
- `guest_count` (INTEGER)
- `special_requests` (TEXT)
- `status` (TEXT: 'pending', 'confirmed', 'cancelled')
- `created_at` (TIMESTAMP)

### Row Level Security (RLS) Policies

All tables have RLS enabled with the following policies:

**user_profiles:**
- Users can only view, insert, and update their own profile

**properties:**
- Anyone (including anonymous users) can view properties
- Only authenticated users can insert properties

**reservations:**
- Users can only view their own reservations
- Only authenticated users can create reservations
- Users can only update/delete their own reservations

### Helper Functions

**`check_property_availability()`**
- Checks if a property is available for given dates
- Prevents double-booking
- Excludes cancelled reservations

**`get_property_booked_dates()`**
- Returns all non-cancelled bookings for a property
- Used for calendar visualization

## Usage Guide

### Creating an Account

1. Click "Sign Up" in the navigation bar
2. Fill in your full name, email, and password
3. Check your email for verification (if email verification is enabled)
4. Sign in with your credentials

### Browsing Properties

1. The home page displays all available properties
2. Use the search bar to filter by location or property name
3. Filter by price range: Budget ($0-$200), Moderate ($200-$400), Luxury ($400+)
4. Filter by specific amenities
5. Click on any property card to view details

### Making a Reservation

1. Click on a property to view details
2. Use the calendar to select check-in and check-out dates
   - Dates with a strikethrough are unavailable
   - Selected dates appear highlighted in blue
3. Enter the number of guests
4. Add any special requests (optional)
5. Click "Confirm Reservation"
6. You'll be redirected to your reservations page

### Managing Reservations

1. Click "My Reservations" in the navigation bar
2. View all your bookings with tabs:
   - All Reservations
   - Upcoming (active bookings)
   - Past (completed or cancelled)
3. Cancel upcoming reservations if needed

## Security Features

- All database operations protected by Row Level Security (RLS)
- Users can only access their own data
- JWT token-based authentication
- Automatic session management
- Secure password handling via Supabase Auth
- Input validation on all forms
- Protection against double-booking

## Customization

### Adding New Properties

To add properties programmatically:

```javascript
const { data, error } = await supabase
  .from('properties')
  .insert([
    {
      name: 'Your Property Name',
      description: 'Property description',
      location: 'City, State',
      price_per_night: 300,
      amenities: ['WiFi', 'Pool', 'Parking'],
      image_urls: ['url1', 'url2'],
      max_guests: 6,
      bedrooms: 3,
      bathrooms: 2
    }
  ]);
```

### Uploading Property Images

Images can be uploaded to Supabase Storage:

```javascript
import { uploadPropertyImage } from './lib/supabaseClient';

const filePath = await uploadPropertyImage(file);
// Use filePath in the image_urls array
```

### Modifying Amenities

Amenities are stored as JSONB arrays. To modify the amenity filter:

1. Edit `src/pages/Home.jsx`
2. Update the `getAllAmenities()` function
3. Add custom amenity categories or filters

## Troubleshooting

### Environment Variables Not Loading

- Ensure `.env` file is in the root directory
- Variables must start with `VITE_` prefix
- Restart the dev server after changing `.env`

### Database Connection Issues

- Verify Supabase credentials in `.env`
- Check that your Supabase project is active
- Ensure RLS policies are set up correctly

### Authentication Not Working

- Confirm Supabase Auth is enabled in your project
- Check email confirmation settings in Supabase dashboard
- Verify auth policies in the database

### Images Not Displaying

- Check that the `property-images` bucket exists in Supabase Storage
- Verify storage policies allow public read access
- Ensure image URLs are valid

## Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

### Deploy to Production

You can deploy to various platforms:

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

Make sure to set environment variables in your hosting platform's settings.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

- Built with [Supabase](https://supabase.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons from [Heroicons](https://heroicons.com)
- Sample images from [Unsplash](https://unsplash.com)

---

**Enjoy building your vacation rental platform!** 🏖️
