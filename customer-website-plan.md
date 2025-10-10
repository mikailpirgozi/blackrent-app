# 🚗 BLACKRENT CUSTOMER WEBSITE - IMPLEMENTATION PLAN

## 🎯 PROJECT STRUCTURE

```
blackrent-customer/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local
├── .env.example
├── public/
│   ├── images/
│   │   ├── vehicles/
│   │   ├── hero/
│   │   └── testimonials/
│   ├── icons/
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage
│   │   ├── vehicles/
│   │   │   ├── page.tsx        # Vehicle catalog
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx    # Vehicle detail
│   │   │   └── loading.tsx
│   │   ├── booking/
│   │   │   ├── page.tsx        # Booking flow
│   │   │   ├── confirmation/
│   │   │   └── payment/
│   │   ├── customer/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── dashboard/
│   │   │   └── bookings/
│   │   ├── about/
│   │   ├── contact/
│   │   └── api/                # API routes
│   │       ├── vehicles/
│   │       ├── bookings/
│   │       ├── payments/
│   │       └── auth/
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── DatePicker.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── vehicles/
│   │   │   ├── VehicleCard.tsx
│   │   │   ├── VehicleFilters.tsx
│   │   │   ├── VehicleGallery.tsx
│   │   │   └── AvailabilityCalendar.tsx
│   │   ├── booking/
│   │   │   ├── BookingForm.tsx
│   │   │   ├── PriceCalculator.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   └── BookingConfirmation.tsx
│   │   └── customer/
│   │       ├── LoginForm.tsx
│   │       ├── RegisterForm.tsx
│   │       ├── Profile.tsx
│   │       └── BookingHistory.tsx
│   ├── hooks/
│   │   ├── useVehicles.ts
│   │   ├── useBooking.ts
│   │   ├── useAvailability.ts
│   │   ├── useAuth.ts
│   │   └── usePayment.ts
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── auth.ts             # Authentication
│   │   ├── stripe.ts           # Payment processing
│   │   ├── validations.ts      # Zod schemas
│   │   └── utils.ts            # Utility functions
│   ├── types/
│   │   ├── customer.ts
│   │   ├── booking.ts
│   │   ├── payment.ts
│   │   └── api.ts
│   └── styles/
│       └── globals.css
```

## 🎨 CUSTOMER-SPECIFIC TYPES

```typescript
// types/customer.ts
export interface PublicVehicle {
  id: string;
  brand: string;
  model: string;
  year?: number;
  category: VehicleCategory;
  images: string[];
  features: string[];
  specifications: {
    seats: number;
    doors: number;
    transmission: 'manual' | 'automatic';
    fuel: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    engine?: string;
  };
  pricing: {
    dailyRate: number;
    weeklyRate?: number;
    monthlyRate?: number;
    deposit: number;
    mileageLimit: number;
    extraMileageRate: number;
  };
  availability: {
    isAvailable: boolean;
    nextAvailableDate?: string;
    blockedDates: string[];
  };
  location: {
    pickupAddress: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

// types/booking.ts
export interface CustomerBooking {
  id: string;
  vehicleId: string;
  vehicle: PublicVehicle;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    driverLicense: {
      number: string;
      expiryDate: string;
      issuedCountry: string;
    };
  };
  rental: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    pickupLocation: string;
    returnLocation: string;
    totalDays: number;
    estimatedMileage?: number;
  };
  pricing: {
    basePrice: number;
    extraServices: Array<{
      name: string;
      price: number;
    }>;
    taxes: number;
    deposit: number;
    totalPrice: number;
  };
  payment: {
    method: 'card' | 'bank_transfer' | 'cash';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    stripePaymentIntentId?: string;
    paidAt?: string;
  };
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  documents?: Array<{
    type: 'driver_license' | 'id_card' | 'insurance';
    url: string;
    uploadedAt: string;
  }>;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VehicleSearchParams {
  category?: VehicleCategory;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  features?: string[];
  seats?: number;
  transmission?: 'manual' | 'automatic';
  fuel?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
}
```

## 🚀 IMPLEMENTATION PHASES

### PHASE 1: FOUNDATION (Week 1-2)
- [ ] Setup Next.js project with TypeScript
- [ ] Configure Tailwind CSS and UI components
- [ ] Create basic layout (Header, Footer, Navigation)
- [ ] Implement responsive design system
- [ ] Setup API client and authentication

### PHASE 2: VEHICLE CATALOG (Week 3-4)
- [ ] Vehicle listing page with filters
- [ ] Vehicle detail page with image gallery
- [ ] Availability calendar integration
- [ ] Search functionality
- [ ] Price calculator

### PHASE 3: BOOKING SYSTEM (Week 5-6)
- [ ] Multi-step booking form
- [ ] Customer registration/login
- [ ] Payment integration (Stripe)
- [ ] Booking confirmation system
- [ ] Email notifications

### PHASE 4: CUSTOMER PORTAL (Week 7-8)
- [ ] Customer dashboard
- [ ] Booking history and management
- [ ] Profile settings
- [ ] Document upload
- [ ] Support chat integration

### PHASE 5: OPTIMIZATION (Week 9-10)
- [ ] SEO optimization (meta tags, sitemap, robots.txt)
- [ ] Performance optimization (image optimization, caching)
- [ ] Analytics integration (Google Analytics, conversion tracking)
- [ ] Security hardening
- [ ] Testing and bug fixes

## 🔧 BACKEND API EXTENSIONS

### New Public Endpoints:
```typescript
// Public vehicle endpoints
GET    /api/public/vehicles              # Vehicle catalog with availability
GET    /api/public/vehicles/:id          # Vehicle details
POST   /api/public/vehicles/search       # Advanced search
GET    /api/public/vehicles/:id/availability # Availability calendar

// Customer authentication
POST   /api/public/auth/register         # Customer registration
POST   /api/public/auth/login            # Customer login
POST   /api/public/auth/refresh          # Refresh token
POST   /api/public/auth/forgot-password  # Password reset
POST   /api/public/auth/reset-password   # Password reset confirmation

// Booking management
POST   /api/public/bookings              # Create booking
GET    /api/public/bookings              # Customer's bookings
GET    /api/public/bookings/:id          # Booking details
PUT    /api/public/bookings/:id          # Update booking
DELETE /api/public/bookings/:id          # Cancel booking

// Payment processing
POST   /api/public/payments/intent       # Create payment intent
POST   /api/public/payments/confirm      # Confirm payment
POST   /api/public/payments/webhook      # Stripe webhook
GET    /api/public/payments/:id          # Payment status

// File uploads
POST   /api/public/uploads/documents     # Upload customer documents
GET    /api/public/uploads/:id           # Download document
```

## 🎨 DESIGN SYSTEM

### Color Palette:
```css
:root {
  --primary: #1976d2;      /* BlackRent blue */
  --primary-dark: #1565c0;
  --primary-light: #42a5f5;
  --secondary: #ff9800;     /* Orange accent */
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
  --background: #fafafa;
  --surface: #ffffff;
  --text-primary: #212121;
  --text-secondary: #757575;
}
```

### Typography Scale:
```css
.text-h1 { font-size: 3rem; font-weight: 700; }
.text-h2 { font-size: 2.5rem; font-weight: 600; }
.text-h3 { font-size: 2rem; font-weight: 600; }
.text-h4 { font-size: 1.5rem; font-weight: 500; }
.text-body { font-size: 1rem; font-weight: 400; }
.text-small { font-size: 0.875rem; font-weight: 400; }
```

## 📱 RESPONSIVE BREAKPOINTS

```css
/* Mobile First Approach */
.container {
  @apply px-4 mx-auto;
  max-width: 100%;
}

@media (min-width: 640px) {  /* sm */
  .container { max-width: 640px; }
}

@media (min-width: 768px) {  /* md */
  .container { max-width: 768px; }
}

@media (min-width: 1024px) { /* lg */
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) { /* xl */
  .container { max-width: 1280px; }
}
```

## 🔒 SECURITY CONSIDERATIONS

### Customer Data Protection:
- GDPR compliance for EU customers
- Data encryption at rest and in transit
- Secure file upload with virus scanning
- Rate limiting on public endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Payment Security:
- PCI DSS compliance through Stripe
- No card data storage on servers
- Secure webhook verification
- Fraud detection integration
- 3D Secure authentication

## 📊 ANALYTICS & TRACKING

### Key Metrics to Track:
- Vehicle page views and conversion rates
- Booking funnel completion rates
- Payment success/failure rates
- Customer acquisition costs
- Customer lifetime value
- Popular vehicle categories
- Seasonal booking patterns

### Tools Integration:
- Google Analytics 4 for general analytics
- Google Tag Manager for event tracking
- Hotjar for user behavior analysis
- Sentry for error monitoring
- Vercel Analytics for performance metrics

## 🚀 DEPLOYMENT STRATEGY

### Development Environment:
- Local development with hot reload
- Staging environment for testing
- Preview deployments for each PR

### Production Deployment:
- Vercel for frontend hosting (automatic SSL, CDN)
- Railway for backend API (existing setup)
- Cloudflare R2 for file storage (existing setup)
- Custom domain: blackrent.sk

### CI/CD Pipeline:
- GitHub Actions for automated testing
- Automatic deployment on main branch
- Database migrations handling
- Environment variable management

## 📈 FUTURE ENHANCEMENTS

### Phase 2 Features:
- Mobile app (React Native)
- Advanced booking management
- Loyalty program
- Referral system
- Multi-language support
- Integration with car sharing platforms

### Phase 3 Features:
- AI-powered vehicle recommendations
- Dynamic pricing based on demand
- Fleet management dashboard
- Advanced analytics and reporting
- Third-party integrations (insurance, GPS tracking)
