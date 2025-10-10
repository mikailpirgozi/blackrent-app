# 📧 Email System

Kompletná dokumentácia email systému pre BlackRent.

## 📂 Obsah

### Setup & Configuration
- **[EMAIL-SETUP-GUIDE.md](./EMAIL-SETUP-GUIDE.md)** - Email setup guide
- **[FINAL-EMAIL-SETUP-SUMMARY.md](./FINAL-EMAIL-SETUP-SUMMARY.md)** - Finálne email setup zhrnutie
- **[EMAIL-ACTIVATION-STEPS.md](./EMAIL-ACTIVATION-STEPS.md)** - Email aktivačné kroky

### Protocol & Integration
- **[EMAIL-PROTOCOL-SUMMARY.md](./EMAIL-PROTOCOL-SUMMARY.md)** - Email protocol zhrnutie
- **[RENTAL_EMAIL_MATCHING_COMPLETE_REPORT.md](./RENTAL_EMAIL_MATCHING_COMPLETE_REPORT.md)** - Rental email matching report

---

## 🎯 Email System Overview

BlackRent používa vlastný SMTP/IMAP email systém pre:
- Automatické notifikácie
- Protocol doručovanie
- Rental confirmation emails
- Customer communication
- Monitoring incoming emails

### Email Account
- **Email:** blackrent@blackrent.sk
- **Provider:** Active 24
- **SMTP Port:** 465 (SSL)
- **IMAP Port:** 993 (SSL)

---

## 🚀 Quick Setup

### 1. Environment Variables
```env
# SMTP Configuration (Outgoing)
SMTP_HOST=smtp.active24.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=blackrent@blackrent.sk
SMTP_PASS=Hesloheslo11

# IMAP Configuration (Incoming)
IMAP_HOST=imap.active24.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=blackrent@blackrent.sk
IMAP_PASS=Hesloheslo11

# Email Settings
EMAIL_FROM=blackrent@blackrent.sk
EMAIL_FROM_NAME=BlackRent
```

### 2. Test Connection
```bash
# Test SMTP connection
npm run test:email:smtp

# Test IMAP connection
npm run test:email:imap

# Test full email functionality
npm run test:email:full
```

---

## 📨 Sending Emails

### Basic Email Sending
```typescript
import { sendEmail } from '@/services/email';

await sendEmail({
  to: 'customer@example.com',
  subject: 'Rental Confirmation',
  text: 'Your rental has been confirmed.',
  html: '<h1>Rental Confirmed</h1><p>Your rental has been confirmed.</p>',
});
```

### Email with Attachments
```typescript
import { sendEmailWithAttachment } from '@/services/email';

await sendEmailWithAttachment({
  to: 'customer@example.com',
  subject: 'Protocol PDF',
  text: 'Please find attached your protocol PDF.',
  attachments: [
    {
      filename: 'protocol.pdf',
      path: '/path/to/protocol.pdf',
      contentType: 'application/pdf',
    },
  ],
});
```

### Protocol Email Sending
```typescript
import { sendProtocolEmail } from '@/services/protocolEmail';

await sendProtocolEmail({
  rentalId: 'rental-uuid',
  protocolId: 'protocol-uuid',
  type: 'handover', // or 'return'
  customerEmail: 'customer@example.com',
  pdfUrl: 'https://r2.blackrent.sk/protocols/protocol.pdf',
});
```

---

## 📥 Receiving Emails

### IMAP Monitoring
```typescript
import { startEmailMonitoring } from '@/services/emailMonitoring';

// Start monitoring for incoming emails
startEmailMonitoring({
  interval: 60000, // Check every 60 seconds
  onNewEmail: async (email) => {
    console.log('New email received:', email);
    // Process email
  },
});
```

### Email Parsing
```typescript
import { parseEmail } from '@/utils/emailParser';

const parsed = parseEmail(rawEmail);
// {
//   from: 'customer@example.com',
//   subject: 'Rental Inquiry',
//   body: '...',
//   attachments: [...],
// }
```

### Rental Email Matching
```typescript
import { matchEmailToRental } from '@/services/rentalEmailMatcher';

const rental = await matchEmailToRental({
  subject: 'Re: Rental #12345',
  from: 'customer@example.com',
});

if (rental) {
  console.log('Email matched to rental:', rental.id);
}
```

---

## 📧 Email Templates

### Template Structure
```typescript
// templates/rentalConfirmation.ts
export const rentalConfirmationTemplate = (data: RentalData) => {
  return {
    subject: `Rental Confirmation - ${data.vehicleName}`,
    html: `
      <h1>Rental Confirmed</h1>
      <p>Dear ${data.customerName},</p>
      <p>Your rental has been confirmed.</p>
      <h2>Rental Details:</h2>
      <ul>
        <li>Vehicle: ${data.vehicleName}</li>
        <li>Start Date: ${data.startDate}</li>
        <li>End Date: ${data.endDate}</li>
        <li>Total Price: €${data.totalPrice}</li>
      </ul>
    `,
    text: `
      Rental Confirmed
      
      Dear ${data.customerName},
      Your rental has been confirmed.
      
      Rental Details:
      - Vehicle: ${data.vehicleName}
      - Start Date: ${data.startDate}
      - End Date: ${data.endDate}
      - Total Price: €${data.totalPrice}
    `,
  };
};
```

### Available Templates
- **rentalConfirmation** - Rental potvrdenie
- **protocolHandover** - Handover protocol email
- **protocolReturn** - Return protocol email
- **paymentReminder** - Platobné pripomienky
- **rentalReminder** - Rental pripomienky
- **welcomeEmail** - Uvítací email

---

## 🔄 Email Workflow

### Rental Confirmation Flow
1. **Rental Created** → Trigger email event
2. **Generate Email** → Use template
3. **Send Email** → Via SMTP
4. **Log Email** → Save to database
5. **Monitor Delivery** → Check SMTP response

### Protocol Email Flow
1. **Protocol Completed** → Generate PDF
2. **Upload PDF** → To Cloudflare R2
3. **Generate Email** → With PDF link/attachment
4. **Send Email** → To customer & employee
5. **Track Email** → Monitor open/read status

---

## 🛠️ API Endpoints

### Email API
```
POST   /api/email/send                    # Send email
POST   /api/email/send-protocol           # Send protocol email
POST   /api/email/test                    # Test email configuration
GET    /api/email/status/:emailId         # Get email status
GET    /api/email/history                 # Email history
```

### IMAP API
```
GET    /api/email/inbox                   # Get inbox emails
GET    /api/email/inbox/:emailId          # Get specific email
POST   /api/email/match-rental            # Match email to rental
GET    /api/email/monitoring/status       # IMAP monitoring status
```

---

## 📊 Email Monitoring & Stats

### Dashboard Metrics
- **Emails Sent Today:** 42
- **Emails Received Today:** 18
- **Delivery Rate:** 98.5%
- **Open Rate:** 65%
- **Failed Emails:** 2

### Email History
```typescript
import { useEmailHistory } from '@/lib/react-query/hooks/useEmail';

const { data: emailHistory } = useEmailHistory({
  limit: 50,
  filter: 'sent',
});
```

---

## 🐛 Common Issues & Solutions

### Issue: SMTP connection timeout
**Solution:**
1. Verify SMTP credentials in `.env`
2. Check firewall settings (port 465)
3. Test connection: `npm run test:email:smtp`

### Issue: IMAP authentication failed
**Solution:**
1. Verify IMAP credentials
2. Check if IMAP is enabled on Active24
3. Test connection: `npm run test:email:imap`

### Issue: Emails going to spam
**Solution:**
1. Setup SPF record: `v=spf1 include:active24.com ~all`
2. Setup DKIM signing
3. Setup DMARC policy
4. Use proper email headers

### Issue: Large attachments failing
**Solution:**
1. Check attachment size limit (max 10MB)
2. Use R2 links instead of attachments
3. Compress PDFs before sending

---

## 🔒 Security Best Practices

### Email Security
- ✅ Always use SSL/TLS
- ✅ Never log email credentials
- ✅ Sanitize email content
- ✅ Validate email addresses
- ✅ Rate limit email sending
- ✅ Monitor for spam/abuse

### Credential Management
```typescript
// ❌ BAD - Hardcoded credentials
const smtp = {
  user: 'blackrent@blackrent.sk',
  pass: 'Hesloheslo11',
};

// ✅ GOOD - Environment variables
const smtp = {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
};
```

---

## 📈 Performance Optimization

### Email Queue System
```typescript
import { queueEmail } from '@/services/emailQueue';

// Queue email for async sending
await queueEmail({
  to: 'customer@example.com',
  subject: 'Rental Confirmation',
  template: 'rentalConfirmation',
  data: rentalData,
});

// Process queue
import { processEmailQueue } from '@/services/emailQueue';
await processEmailQueue();
```

### Batch Sending
```typescript
import { sendBatchEmails } from '@/services/email';

await sendBatchEmails([
  { to: 'customer1@example.com', subject: '...', html: '...' },
  { to: 'customer2@example.com', subject: '...', html: '...' },
  // ...
], {
  delay: 1000, // 1 second delay between emails
  maxRetries: 3,
});
```

---

## 🧪 Testing

### Test Email Sending
```bash
# Send test email
npm run test:email:send

# Test protocol email
npm run test:email:protocol

# Test with attachment
npm run test:email:attachment
```

### Test Email Receiving
```bash
# Test IMAP connection
npm run test:email:imap

# Test email parsing
npm run test:email:parse

# Test rental matching
npm run test:email:match
```

---

## 🔗 Súvisiace Dokumenty

- [Protocol Email Strategy](../features/PROTOCOL-EMAIL-STRATEGY.md)
- [Email Monitoring Automation](../features/EMAIL-MONITORING-AUTOMATION.md)
- [Production Email Fix](../PRODUCTION-EMAIL-FIX.md)

---

**Tip:** Vždy testuj email funkcionalitu na staging prostredí s test email adresami pred production použitím!

