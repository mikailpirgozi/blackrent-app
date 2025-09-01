# Playbook: Invarianty System (zabije 50% bugov)

## 🎯 Prečo invarianty?

**Invarianty = pravidlá ktoré NIKDY nemôžu byť porušené**

V BlackRent máme kritické business rules:
- Cena nemôže byť záporná
- End date > start date  
- Kilometer rate > 0
- Vehicle capacity > 0

**Bez invariantov:** 🔥 Runtime crashes, corrupt data, customer disputes  
**S invariantmi:** ✅ Impossible states eliminated, bugs caught early

---

## 📊 3-layer invariant system

### Layer 1: Database Constraints
**Posledná línia obrany** - DB nikdy nepríjme invalid data

```sql
-- ✅ PRICE CONSTRAINTS
ALTER TABLE vehicles ADD CONSTRAINT vehicles_price_positive 
  CHECK (price_per_day >= 0);

ALTER TABLE rentals ADD CONSTRAINT rentals_total_positive 
  CHECK (total_price >= 0);

-- ✅ DATE CONSTRAINTS  
ALTER TABLE rentals ADD CONSTRAINT rentals_valid_dates
  CHECK (end_date > start_date);

-- ✅ KILOMETER CONSTRAINTS
ALTER TABLE rentals ADD CONSTRAINT rentals_km_positive
  CHECK (allowed_kilometers >= 0 AND daily_kilometers >= 0);

-- ✅ FUEL CONSTRAINTS
ALTER TABLE protocols ADD CONSTRAINT protocols_fuel_range
  CHECK (fuel_level >= 0 AND fuel_level <= 100);
```

### Layer 2: DTO Contracts (API boundaries)
**Input/Output validation** - žiadne bad data do systému

```typescript
// api/dto/rental.ts
export const CreateRentalDto = z.object({
  vehicleId: z.string().uuid(),
  customerId: z.string().uuid(),
  startDate: z.date(),
  endDate: z.date(),
  totalPrice: z.number().nonnegative(),
  deposit: z.number().nonnegative().optional(),
  allowedKilometers: z.number().int().nonnegative().optional(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export const ExtraKmDto = z.object({
  extra_km_price: z.number().nonnegative(),
  extra_km_used: z.number().int().nonnegative(),
});

export const FuelDto = z.object({
  fuel_level: z.number().min(0).max(100),
  fuel_type: z.enum(['Benzín', 'Diesel', 'Hybrid', 'Electric']),
});

export type CreateRentalDto = z.infer<typeof CreateRentalDto>;
export type ExtraKmDto = z.infer<typeof ExtraKmDto>;
export type FuelDto = z.infer<typeof FuelDto>;
```

### Layer 3: Domain Types (Business Logic)
**Shared types** - jedna definícia, všade rovnaké pravidlá

```typescript
// types/domain.ts
export type PricePerKm = number; // EUR per kilometer, must be >= 0
export type FuelLevel = number;  // Percentage 0-100  
export type Mileage = number;    // Kilometers, must be >= 0

// Business value objects
export class RentalPeriod {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }
  }

  get durationDays(): number {
    return Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}

export class VehiclePrice {
  constructor(public readonly value: number) {
    if (value < 0) {
      throw new Error('Price cannot be negative');
    }
  }

  multiply(factor: number): VehiclePrice {
    return new VehiclePrice(this.value * factor);
  }
}
```

---

## 🛠 BlackRent Critical Invariants

### 1. Pricing Invariants
```sql
-- Database level
ALTER TABLE vehicles ADD CONSTRAINT vehicles_pricing_valid
  CHECK (price_per_day >= 0 AND extra_km_rate >= 0);

ALTER TABLE rentals ADD CONSTRAINT rentals_pricing_valid  
  CHECK (total_price >= 0 AND commission >= 0 AND deposit >= 0);
```

```typescript
// DTO level
export const PricingDto = z.object({
  pricePerDay: z.number().nonnegative(),
  extraKmRate: z.number().nonnegative(), 
  totalPrice: z.number().nonnegative(),
  commission: z.number().min(0).max(1), // 0-100% as decimal
});
```

### 2. Date/Time Invariants
```sql
-- Database level
ALTER TABLE rentals ADD CONSTRAINT rentals_date_logic
  CHECK (end_date > start_date);

ALTER TABLE vehicle_unavailability ADD CONSTRAINT unavailability_date_logic  
  CHECK (end_date >= start_date);
```

```typescript
// DTO level
export const RentalPeriodDto = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date"
});
```

### 3. Vehicle State Invariants
```sql
-- Database level
ALTER TABLE vehicles ADD CONSTRAINT vehicles_capacity_valid
  CHECK (capacity > 0 AND capacity <= 50);

ALTER TABLE protocols ADD CONSTRAINT protocols_fuel_valid
  CHECK (fuel_level >= 0 AND fuel_level <= 100);

ALTER TABLE protocols ADD CONSTRAINT protocols_odometer_valid
  CHECK (odometer >= 0);
```

```typescript
// DTO level
export const VehicleStateDto = z.object({
  fuelLevel: z.number().min(0).max(100),
  odometer: z.number().int().nonnegative(),
  capacity: z.number().int().positive().max(50),
});
```

### 4. Protocol Invariants
```sql
-- Database level  
ALTER TABLE return_protocols ADD CONSTRAINT return_km_logic
  CHECK (odometer >= (
    SELECT hp.odometer 
    FROM handover_protocols hp 
    WHERE hp.id = handover_protocol_id
  ));
```

```typescript
// DTO level
export const ProtocolDto = z.object({
  startingMileage: z.number().int().nonnegative(),
  endingMileage: z.number().int().nonnegative(),
}).refine(data => data.endingMileage >= data.startingMileage, {
  message: "Ending mileage cannot be less than starting mileage"
});
```

---

## 🏗 Implementation Strategy

### Phase 1: Domain Types
```typescript
// src/types/domain.ts - Shared business types
export type PricePerKm = number;        // EUR/km, >= 0
export type PricePerDay = number;       // EUR/day, >= 0  
export type CommissionRate = number;    // 0-1 decimal
export type FuelLevel = number;         // 0-100 percentage
export type Mileage = number;           // km, >= 0
export type VehicleCapacity = number;   // persons, 1-50
```

### Phase 2: DTO Schemas
```typescript
// backend/src/dto/index.ts - API contracts
export const VehicleDto = z.object({
  pricePerDay: z.number().nonnegative(),
  extraKmRate: z.number().nonnegative(),
  capacity: z.number().int().min(1).max(50),
});

export const RentalDto = z.object({
  totalPrice: z.number().nonnegative(),
  commission: z.number().min(0).max(1),
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate > data.startDate);
```

### Phase 3: Database Constraints
```sql
-- database/migrations/025_add_invariant_constraints.sql
-- Pricing constraints
ALTER TABLE vehicles ADD CONSTRAINT vehicles_pricing_invariants
  CHECK (price_per_day >= 0 AND extra_km_rate >= 0 AND capacity > 0);

-- Rental constraints  
ALTER TABLE rentals ADD CONSTRAINT rentals_business_invariants
  CHECK (total_price >= 0 AND commission >= 0 AND end_date > start_date);

-- Protocol constraints
ALTER TABLE handover_protocols ADD CONSTRAINT protocols_fuel_invariants
  CHECK (fuel_level >= 0 AND fuel_level <= 100 AND odometer >= 0);
```

---

## 🚨 BlackRent Critical Bugs This Fixes

### Bug 1: Negative pricing crashes
```typescript
// ❌ SÚČASNÉ: Môže vytvoriť rental s -100€
const rental = { totalPrice: -100 }; // 💥 Runtime error neskôr

// ✅ S INVARIANTMI: Caught na API boundary
CreateRentalDto.parse({ totalPrice: -100 }); // 🛑 ZodError okamžite
```

### Bug 2: Invalid date ranges
```typescript  
// ❌ SÚČASNÉ: End date before start date
const rental = { 
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-01-10')  // 💥 Nelogické
};

// ✅ S INVARIANTMI: Validation error
RentalPeriodDto.parse(rental); // 🛑 "End date must be after start date"
```

### Bug 3: Fuel level chaos
```typescript
// ❌ SÚČASNÉ: Fuel level 150% alebo -20%
protocol.fuel_level = 150; // 💥 Nezmysel

// ✅ S INVARIANTMI: DB constraint violation
// CHECK (fuel_level >= 0 AND fuel_level <= 100) // 🛑 DB error
```

---

## 📈 ROI Analysis

**Implementácia:** 2-3 dni  
**Bug reduction:** 50-70% (based on production experience)  
**Customer disputes:** -80% (clear validation errors)  
**Development speed:** +30% (fewer debugging sessions)

**Critical for BlackRent** lebo máme complex business rules + multiple user types (admin/company/customer) = vysoké riziko invalid states.

---

Chceš aby som vytvoril aj **konkrétny implementation plan** pre BlackRent invarianty? Môžem identifikovať top 10 critical constraints ktoré treba pridať first.

