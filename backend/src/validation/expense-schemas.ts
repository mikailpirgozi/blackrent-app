import { z } from 'zod';

// ===============================================
// EXPENSE VALIDATION SCHEMAS
// ===============================================
// Všetky input validácie pre expenses sekciu
// Používa Zod pre type-safe validácie
// ===============================================

export const CreateExpenseSchema = z.object({
  description: z.string()
    .min(1, 'Popis je povinný')
    .max(500, 'Popis je príliš dlhý (max 500 znakov)')
    .trim(),
  
  amount: z.number()
    .min(0, 'Suma nemôže byť záporná')
    .max(999999, 'Suma je príliš veľká (max 999,999€)')
    .finite('Suma musí byť konečné číslo'),
  
  date: z.coerce.date()
    .min(new Date('2020-01-01'), 'Dátum nemôže byť pred 2020')
    .max(new Date('2030-12-31'), 'Dátum nemôže byť po 2030'),
  
  category: z.string()
    .min(1, 'Kategória je povinná')
    .max(50, 'Kategória je príliš dlhá'),
  
  company: z.string()
    .min(1, 'Firma je povinná')
    .max(255, 'Názov firmy je príliš dlhý')
    .trim(),
  
  vehicleId: z.string().uuid('Neplatné ID vozidla').optional(),
  
  note: z.string()
    .max(1000, 'Poznámka je príliš dlhá (max 1000 znakov)')
    .optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.extend({
  id: z.string().uuid('Neplatné ID nákladu'),
});

export const CreateRecurringExpenseSchema = z.object({
  name: z.string()
    .min(1, 'Názov je povinný')
    .max(255, 'Názov je príliš dlhý (max 255 znakov)')
    .trim(),
  
  description: z.string()
    .min(1, 'Popis je povinný')
    .max(500, 'Popis je príliš dlhý (max 500 znakov)')
    .trim(),
  
  amount: z.number()
    .min(0.01, 'Suma musí byť väčšia ako 0')
    .max(999999, 'Suma je príliš veľká (max 999,999€)')
    .finite('Suma musí byť konečné číslo'),
  
  category: z.string()
    .min(1, 'Kategória je povinná')
    .max(50, 'Kategória je príliš dlhá'),
  
  company: z.string()
    .min(1, 'Firma je povinná')
    .max(255, 'Názov firmy je príliš dlhý'),
  
  vehicleId: z.string().uuid('Neplatné ID vozidla').optional(),
  
  note: z.string()
    .max(1000, 'Poznámka je príliš dlhá (max 1000 znakov)')
    .optional(),
  
  frequency: z.enum(['monthly', 'quarterly', 'yearly'], {
    message: 'Frekvencia musí byť monthly, quarterly alebo yearly'
  }),
  
  startDate: z.coerce.date()
    .min(new Date('2020-01-01'), 'Počiatočný dátum nemôže byť pred 2020')
    .max(new Date('2030-12-31'), 'Počiatočný dátum nemôže byť po 2030'),
  
  endDate: z.coerce.date()
    .min(new Date('2020-01-01'), 'Koncový dátum nemôže byť pred 2020')
    .max(new Date('2035-12-31'), 'Koncový dátum nemôže byť po 2035')
    .optional(),
  
  dayOfMonth: z.number()
    .int('Deň musí byť celé číslo')
    .min(1, 'Deň musí byť medzi 1-28')
    .max(28, 'Deň musí byť medzi 1-28'),
  
  isActive: z.boolean().default(true),
  
  createdBy: z.string().uuid('Neplatné ID používateľa').optional(),
}).refine(
  (data) => {
    // Validácia: endDate musí byť po startDate
    if (data.endDate && data.startDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: 'Koncový dátum musí byť po počiatočnom dátume',
    path: ['endDate'],
  }
);

export const UpdateRecurringExpenseSchema = CreateRecurringExpenseSchema.extend({
  id: z.string().uuid('Neplatné ID pravidelného nákladu'),
});

// Export types pre TypeScript
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type CreateRecurringExpenseInput = z.infer<typeof CreateRecurringExpenseSchema>;
export type UpdateRecurringExpenseInput = z.infer<typeof UpdateRecurringExpenseSchema>;

