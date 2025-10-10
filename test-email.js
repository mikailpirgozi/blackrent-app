const API_BASE = 'http://localhost:3001/api';

async function testEmail() {
  try {
    console.log('🔐 Prihlasujem sa...');
    
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Black123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Prihlásenie zlyhalo: ' + loginData.error);
    }
    
    const token = loginData.token;
    console.log('✅ Prihlásenie úspešné');
    
    // Získanie prvého rental
    const rentalsResponse = await fetch(`${API_BASE}/rentals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const rentalsData = await rentalsResponse.json();
    if (!rentalsData.success || !rentalsData.data?.length) {
      throw new Error('Žiadne rentals nenájdené');
    }
    
    const rental = rentalsData.data[0];
    console.log('✅ Používam rental ID:', rental.id);
    
    // Vytvorenie protokol dát
    const protocolData = {
      rentalId: rental.id,
      type: 'handover',
      status: 'completed',
      location: 'Test Location',
      vehicleCondition: {
        fuelLevel: 100,
        odometer: 50000,
        fuelType: 'gasoline',
        exteriorCondition: 'good',
        interiorCondition: 'good',
        notes: 'Test condition'
      },
      vehicleImages: [],
      vehicleVideos: [],
      documentImages: [],
      documentVideos: [],
      damageImages: [],
      damageVideos: [],
      damages: [],
      signatures: [],
      rentalData: {
        orderNumber: 'TEST001',
        vehicle: rental.vehicle,
        customer: {
          id: 'test-customer',
          name: 'Test Customer',
          email: 'pirgozi1@gmail.com',
          phone: '+421900000000',
          createdAt: new Date()
        },
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: 100,
        deposit: 50,
        currency: 'EUR'
      },
      createdBy: 'test-user',
      notes: 'Test protocol',
      quickMode: false
    };
    
    console.log('📄 Vytváram handover protokol...');
    
    const protocolResponse = await fetch(`${API_BASE}/protocols/handover`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(protocolData)
    });
    
    const protocolResult = await protocolResponse.json();
    if (protocolResult.success) {
      console.log('✅ Handover protokol úspešne vytvorený!');
      console.log('📧 Email by sa mal poslať na: pirgozi1@gmail.com');
      console.log('🆔 Protocol ID:', protocolResult.protocol?.id);
      
      // Počkajme chvíľu a skontrolujme email status
      setTimeout(async () => {
        const checkResponse = await fetch(`${API_BASE}/protocols/handover/${protocolResult.protocol.id}`);
        const checkData = await checkResponse.json();
        console.log('📧 Email status:', checkData.emailSent ? '✅ Poslaný' : '❌ Neposlaný');
      }, 2000);
      
    } else {
      console.log('❌ Chyba pri vytváraní protokolu:', protocolResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test zlyhal:', error.message);
  }
}

testEmail();
