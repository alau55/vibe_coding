-- Seed Data for Vacation Rental System
-- This file contains sample property data for testing and demonstration

-- ============================================
-- SAMPLE PROPERTIES
-- ============================================

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE public.reservations CASCADE;
-- TRUNCATE public.properties CASCADE;

-- Insert sample vacation rental properties
INSERT INTO public.properties (
  id,
  name,
  description,
  location,
  price_per_night,
  amenities,
  image_urls,
  max_guests,
  bedrooms,
  bathrooms
) VALUES
(
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Luxury Beachfront Villa',
  'Experience paradise in this stunning beachfront villa with panoramic ocean views. This luxurious property features modern amenities, a private pool, and direct beach access. Perfect for families or groups seeking an unforgettable coastal getaway.',
  'Malibu, California',
  450.00,
  '["WiFi", "Pool", "Beach Access", "Ocean View", "Air Conditioning", "Parking", "Kitchen", "Washer/Dryer", "BBQ Grill", "Patio"]'::JSONB,
  ARRAY[
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
  ],
  8,
  4,
  3.5
),
(
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'Cozy Mountain Cabin',
  'Escape to the mountains in this charming rustic cabin surrounded by pine forests. Enjoy breathtaking mountain views, a stone fireplace, and peaceful seclusion. Ideal for couples or small families looking for a nature retreat.',
  'Aspen, Colorado',
  280.00,
  '["WiFi", "Fireplace", "Mountain View", "Hiking Trails", "Heating", "Parking", "Kitchen", "Hot Tub", "Deck", "Pet Friendly"]'::JSONB,
  ARRAY[
    'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800',
    'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
  ],
  6,
  3,
  2.0
),
(
  'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  'Downtown Urban Loft',
  'Modern and stylish loft in the heart of the city. Walking distance to restaurants, shopping, and entertainment. Features exposed brick, high ceilings, and contemporary design. Perfect for urban explorers and business travelers.',
  'New York, New York',
  320.00,
  '["WiFi", "City View", "Air Conditioning", "Elevator", "Gym Access", "Kitchen", "Workspace", "Smart TV", "Washer/Dryer"]'::JSONB,
  ARRAY[
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
  ],
  4,
  2,
  2.0
),
(
  'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
  'Lakeside Retreat House',
  'Beautiful lakeside property with private dock and stunning water views. Enjoy swimming, kayaking, and fishing right from your doorstep. Spacious deck perfect for morning coffee or evening sunsets. Great for families and water enthusiasts.',
  'Lake Tahoe, Nevada',
  380.00,
  '["WiFi", "Lake View", "Private Dock", "Kayaks", "Fireplace", "Parking", "Kitchen", "BBQ Grill", "Fire Pit", "Deck"]'::JSONB,
  ARRAY[
    'https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?w=800',
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
  ],
  10,
  5,
  3.0
),
(
  'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
  'Tropical Paradise Bungalow',
  'Immerse yourself in island living with this tropical bungalow surrounded by lush gardens. Open-air design, private pool, and tropical landscaping create a serene oasis. Just minutes from pristine beaches and local attractions.',
  'Maui, Hawaii',
  425.00,
  '["WiFi", "Pool", "Garden View", "Outdoor Shower", "Air Conditioning", "Parking", "Kitchen", "Beach Gear", "Lanai", "Tropical Garden"]'::JSONB,
  ARRAY[
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
  ],
  6,
  3,
  2.5
),
(
  'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c',
  'Historic Charleston Home',
  'Step back in time in this beautifully restored historic home in the heart of Charleston. Original hardwood floors, modern updates, and Southern charm throughout. Walking distance to historic sites, restaurants, and galleries.',
  'Charleston, South Carolina',
  295.00,
  '["WiFi", "Historic Architecture", "Garden", "Porch", "Air Conditioning", "Parking", "Kitchen", "Fireplace", "Walking Distance to Downtown"]'::JSONB,
  ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
  ],
  5,
  3,
  2.0
),
(
  'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d',
  'Ski-In/Ski-Out Chalet',
  'Ultimate ski vacation home with direct slope access. Luxury finishes, floor-to-ceiling windows, and mountain views. Features include heated floors, ski storage, and a game room. Perfect for winter sports enthusiasts.',
  'Park City, Utah',
  520.00,
  '["WiFi", "Ski Access", "Mountain View", "Hot Tub", "Fireplace", "Heated Floors", "Parking", "Kitchen", "Game Room", "Ski Storage"]'::JSONB,
  ARRAY[
    'https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=800',
    'https://images.unsplash.com/photo-1580041065738-e72023775cdc?w=800',
    'https://images.unsplash.com/photo-1526880792616-4217a28725c8?w=800'
  ],
  12,
  6,
  4.5
),
(
  'b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e',
  'Desert Oasis Retreat',
  'Modern architectural masterpiece in the desert landscape. Floor-to-ceiling glass walls, infinity pool, and panoramic mountain views. Contemporary design meets natural beauty in this unique property.',
  'Scottsdale, Arizona',
  395.00,
  '["WiFi", "Pool", "Mountain View", "Modern Design", "Air Conditioning", "Parking", "Kitchen", "Outdoor Living", "Fire Pit", "Smart Home"]'::JSONB,
  ARRAY[
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
    'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800'
  ],
  8,
  4,
  3.0
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify data was inserted
-- SELECT COUNT(*) as property_count FROM public.properties;

-- View all properties with their amenities
-- SELECT id, name, location, price_per_night, max_guests, bedrooms, bathrooms
-- FROM public.properties
-- ORDER BY name;

-- ============================================
-- NOTES
-- ============================================
-- The image URLs use placeholder images from Unsplash
-- In production, you would upload actual property images to Supabase Storage
-- and update the image_urls arrays with the storage URLs
--
-- Example storage URL format:
-- https://[your-project-ref].supabase.co/storage/v1/object/public/property-images/[filename]
