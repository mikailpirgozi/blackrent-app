const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

// Webhook receiver pre AI asistenta
app.post('/ai-webhook', (req, res) => {
    const { type, ...data } = req.body;
    
    console.log(`🔔 AI Webhook received: ${type}`);
    console.log('📊 Data:', JSON.stringify(data, null, 2));
    
    // Spracovanie rôznych typov notifikácií
    switch (type) {
        case 'deployment':
            handleDeployment(data);
            break;
        case 'alert':
            handleAlert(data);
            break;
        case 'performance':
            handlePerformance(data);
            break;
        case 'error_alert':
            handleErrorAlert(data);
            break;
        case 'db_health':
            handleDatabaseHealth(data);
            break;
        default:
            console.log('Unknown webhook type:', type);
    }
    
    res.status(200).json({ status: 'received' });
});

function handleDeployment(data) {
    console.log('🚀 Deployment notification:', data);
    // AI môže automaticky reagovať na deployment
}

function handleAlert(data) {
    console.log('⚠️  Alert:', data);
    // AI môže automaticky diagnostikovať problém
}

function handlePerformance(data) {
    console.log('⚡ Performance data:', data);
    // AI môže analyzovať performance trendy
}

function handleErrorAlert(data) {
    console.log('🐛 Error alert:', data);
    // AI môže automaticky začať debugging
}

function handleDatabaseHealth(data) {
    console.log('🗄️ Database health:', data);
    // AI môže optimalizovať databázu
}

app.listen(port, () => {
    console.log(`🤖 AI Webhook receiver running on port ${port}`);
});
