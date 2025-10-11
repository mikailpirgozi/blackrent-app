const { v4: uuidv4 } = require('uuid');

// Testové dáta pre začiatok
const testData = {
  vehicles: [
    {
      id: uuidv4(),
      brand: 'BMW',
      model: 'X5',
      licensePlate: 'BA123AB',
      company: 'ABC Rent',
      pricing: [
        { id: '1', minDays: 0, maxDays: 1, pricePerDay: 80 },
        { id: '2', minDays: 2, maxDays: 3, pricePerDay: 75 },
        { id: '3', minDays: 4, maxDays: 7, pricePerDay: 70 },
        { id: '4', minDays: 8, maxDays: 14, pricePerDay: 65 },
        { id: '5', minDays: 15, maxDays: 30, pricePerDay: 60 }
      ],
      commission: { type: 'percentage', value: 15 },
      status: 'available'
    },
    {
      id: uuidv4(),
      brand: 'Mercedes',
      model: 'E-Class',
      licensePlate: 'BA456CD',
      company: 'Premium Cars',
      pricing: [
        { id: '1', minDays: 0, maxDays: 1, pricePerDay: 90 },
        { id: '2', minDays: 2, maxDays: 3, pricePerDay: 85 },
        { id: '3', minDays: 4, maxDays: 7, pricePerDay: 80 },
        { id: '4', minDays: 8, maxDays: 14, pricePerDay: 75 },
        { id: '5', minDays: 15, maxDays: 30, pricePerDay: 70 }
      ],
      commission: { type: 'percentage', value: 18 },
      status: 'available'
    },
    {
      id: uuidv4(),
      brand: 'Audi',
      model: 'A4',
      licensePlate: 'BA789EF',
      company: 'City Rent',
      pricing: [
        { id: '1', minDays: 0, maxDays: 1, pricePerDay: 65 },
        { id: '2', minDays: 2, maxDays: 3, pricePerDay: 60 },
        { id: '3', minDays: 4, maxDays: 7, pricePerDay: 55 },
        { id: '4', minDays: 8, maxDays: 14, pricePerDay: 50 },
        { id: '5', minDays: 15, maxDays: 30, pricePerDay: 45 }
      ],
      commission: { type: 'percentage', value: 12 },
      status: 'available'
    }
  ],
  
  customers: [
    {
      id: uuidv4(),
      name: 'Ján Novák',
      email: 'jan.novak@email.com',
      phone: '+421901234567',
      createdAt: new Date('2025-01-10')
    },
    {
      id: uuidv4(),
      name: 'Mária Svobodová',
      email: 'maria.svobodova@email.com',
      phone: '+421907654321',
      createdAt: new Date('2025-01-12')
    },
    {
      id: uuidv4(),
      name: 'Peter Horváth',
      email: 'peter.horvath@email.com',
      phone: '+421905111222',
      createdAt: new Date('2025-01-15')
    }
  ],
  
  companies: [
    {
      id: uuidv4(),
      name: 'ABC Rent',
      description: 'Profesionálne prenájmy vozidiel'
    },
    {
      id: uuidv4(),
      name: 'Premium Cars',
      description: 'Luxusné vozidlá na prenájom'
    },
    {
      id: uuidv4(),
      name: 'City Rent',
      description: 'Mestské prenájmy za výhodné ceny'
    }
  ],
  
  insurers: [
    {
      id: uuidv4(),
      name: 'Allianz',
      description: 'Poisťovňa Allianz'
    },
    {
      id: uuidv4(),
      name: 'Generali',
      description: 'Generali Poisťovňa'
    }
  ]
};

// Testové prenájmy
function createTestRentals(vehicles, customers) {
  const rentals = [];
  
  // Prenájom 1
  rentals.push({
    id: uuidv4(),
    vehicleId: vehicles[0].id,
    vehicle: vehicles[0],
    customerName: customers[0].name,
    customerId: customers[0].id,
    startDate: new Date('2025-01-10'),
    endDate: new Date('2025-01-13'),
    totalPrice: 240, // 3 dni * 80€
    commission: 36, // 15% z 240€
    paymentMethod: 'bank_transfer',
    paid: true,
    confirmed: true,
    handoverPlace: 'Bratislava - Hlavná stanica',
    createdAt: new Date('2025-01-08')
  });
  
  // Prenájom 2
  rentals.push({
    id: uuidv4(),
    vehicleId: vehicles[1].id,
    vehicle: vehicles[1],
    customerName: customers[1].name,
    customerId: customers[1].id,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-20'),
    totalPrice: 400, // 5 dní * 80€
    commission: 72, // 18% z 400€
    paymentMethod: 'cash',
    paid: false,
    confirmed: true,
    handoverPlace: 'Bratislava - Letisko',
    createdAt: new Date('2025-01-13')
  });
  
  // Prenájom 3
  rentals.push({
    id: uuidv4(),
    vehicleId: vehicles[2].id,
    vehicle: vehicles[2],
    customerName: customers[2].name,
    customerId: customers[2].id,
    startDate: new Date('2025-01-20'),
    endDate: new Date('2025-01-25'),
    totalPrice: 275, // 5 dní * 55€
    commission: 33, // 12% z 275€
    paymentMethod: 'vrp',
    paid: true,
    confirmed: false,
    handoverPlace: 'Košice - Centrum',
    createdAt: new Date('2025-01-18')
  });
  
  return rentals;
}

// Testové náklady
function createTestExpenses(vehicles) {
  return [
    {
      id: uuidv4(),
      description: 'Tankovanie',
      amount: 65.50,
      date: new Date('2025-01-12'),
      category: 'fuel',
      company: 'ABC Rent',
      vehicleId: vehicles[0].id,
      note: 'Plná nádrž pred prenájmom'
    },
    {
      id: uuidv4(),
      description: 'Umytie vozidla',
      amount: 15.00,
      date: new Date('2025-01-14'),
      category: 'maintenance',
      company: 'Premium Cars',
      vehicleId: vehicles[1].id,
      note: 'Externé umytie'
    },
    {
      id: uuidv4(),
      description: 'Servis - výmena oleja',
      amount: 85.00,
      date: new Date('2025-01-16'),
      category: 'maintenance',
      company: 'City Rent',
      vehicleId: vehicles[2].id,
      note: 'Pravidelný servis'
    }
  ];
}

async function insertTestData() {
  try {
    console.log('🔄 Vkladanie testových dát...');
    
    // Importovanie databázy
    const { Database } = require('./src/models/postgres-database');
    const db = new Database();
    
    // Počkať na inicializáciu databázy
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Vloženie firiem
    for (const company of testData.companies) {
      await db.createCompany(company);
    }
    console.log('✅ Firmy vložené');
    
    // Vloženie poisťovní
    for (const insurer of testData.insurers) {
      await db.createInsurer(insurer);
    }
    console.log('✅ Poisťovne vložené');
    
    // Vloženie vozidiel
    for (const vehicle of testData.vehicles) {
      await db.createVehicle(vehicle);
    }
    console.log('✅ Vozidlá vložené');
    
    // Vloženie zákazníkov
    for (const customer of testData.customers) {
      await db.createCustomer(customer);
    }
    console.log('✅ Zákazníci vložení');
    
    // Vloženie prenájmov
    const rentals = createTestRentals(testData.vehicles, testData.customers);
    for (const rental of rentals) {
      await db.createRental(rental);
    }
    console.log('✅ Prenájmy vložené');
    
    // Vloženie nákladov
    const expenses = createTestExpenses(testData.vehicles);
    for (const expense of expenses) {
      await db.createExpense(expense);
    }
    console.log('✅ Náklady vložené');
    
    console.log('🎉 Všetky testové dáta úspešne vložené!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Chyba pri vkladaní testových dát:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  insertTestData();
}

module.exports = { testData, createTestRentals, createTestExpenses }; 