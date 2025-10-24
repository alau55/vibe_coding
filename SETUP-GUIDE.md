# Quick Setup Guide - Vacation Rental System

This guide will help you get the vacation rental system up and running in minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Enter project details and wait for provisioning

## Step 3: Set Up Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" to execute
5. Verify tables were created in **Table Editor**

## Step 4: Load Sample Data (Optional)

1. In SQL Editor, create another new query
2. Copy and paste the entire contents of `seed-data.sql`
3. Click "Run" to execute
4. Verify 8 properties were created in the `properties` table

## Step 5: Get API Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy:
   - Project URL (looks like: `https://xxxxx.supabase.co`)
   - `anon` `public` key (long JWT token)

## Step 6: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
   ```

## Step 7: Run the Application

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

## Testing the Application

### Test User Registration
1. Click "Sign Up"
2. Enter: Full Name, Email, Password
3. Click "Create account"
4. (Note: Check Supabase → Authentication → Users to see if email confirmation is required)

### Test Property Browsing
1. Browse properties on the home page
2. Use search filters (location, price, amenities)
3. Click on a property to see details

### Test Booking
1. Sign in if not already logged in
2. Click on a property
3. Select check-in and check-out dates on the calendar
4. Enter number of guests
5. Click "Confirm Reservation"
6. View your reservation in "My Reservations"

## Common Issues

### Build Error with Tailwind CSS
✅ Already fixed! We're using `@tailwindcss/postcss`

### Environment Variables Not Loading
- Restart the dev server after changing `.env`
- Variables must start with `VITE_` prefix

### "Missing Supabase environment variables" Warning
- Make sure you've set up `.env` correctly
- Double-check the URL and key from Supabase dashboard

### Database Connection Errors
- Verify your Supabase project is active
- Check that you ran `supabase-schema.sql`
- Ensure RLS policies were created

### Authentication Not Working
- Check Supabase → Authentication settings
- Email confirmation might be required
- Check user table in Supabase

## What's Included

✅ **Complete Authentication System**
- User registration and login
- Session management
- Protected routes

✅ **Property Management**
- Search and filter properties
- View property details
- Image galleries

✅ **Booking System**
- Interactive availability calendar
- Date selection
- Prevent double-booking
- Price calculation

✅ **User Dashboard**
- View all reservations
- Filter by status
- Cancel bookings

✅ **Modern UI**
- Responsive design
- Mobile-friendly
- Toast notifications
- Loading states

## Next Steps

### Customize Properties
Add your own properties using the SQL Editor:

```sql
INSERT INTO public.properties (
  name, description, location, price_per_night,
  amenities, image_urls, max_guests, bedrooms, bathrooms
) VALUES (
  'Your Property',
  'Amazing property description',
  'City, State',
  350.00,
  '["WiFi", "Pool", "Kitchen"]'::jsonb,
  ARRAY['https://image-url.com/photo.jpg'],
  6, 3, 2.0
);
```

### Upload Property Images
1. Go to Supabase → Storage
2. Open `property-images` bucket
3. Upload images
4. Copy the public URL
5. Add to `image_urls` array in properties table

### Customize Styling
- Edit `tailwind.config.js` for theme customization
- Modify components in `src/components/`
- Update colors, fonts, spacing

### Deploy to Production

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

Don't forget to set environment variables in your hosting platform!

## Support

- Check `README.md` for detailed documentation
- Review `supabase-schema.sql` for database structure
- Check Supabase documentation: https://supabase.com/docs

---

**Happy coding!** 🚀
