import { z } from 'zod';
// Validation utilities
export const emailSchema = z.string().email('Neplatný email formát');
export const passwordSchema = z
    .string()
    .min(6, 'Heslo musí mať aspoň 6 znakov')
    .max(100, 'Heslo je príliš dlhé');
export const phoneSchema = z
    .string()
    .regex(/^(\+421|0)[0-9]{9}$/, 'Neplatné slovenské telefónne číslo');
export const nameSchema = z
    .string()
    .min(1, 'Meno je povinné')
    .max(50, 'Meno je príliš dlhé')
    .regex(/^[a-zA-ZáčďéíĺľňóôŕšťúýžÁČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ\s-]+$/, 'Meno obsahuje neplatné znaky');
export const addressSchema = z
    .string()
    .min(5, 'Adresa je príliš krátka')
    .max(200, 'Adresa je príliš dlhá');
export const coordinatesSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});
export const dateRangeSchema = z.object({
    startDate: z.string().datetime('Neplatný dátum začiatku'),
    endDate: z.string().datetime('Neplatný dátum konca'),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'Dátum konca musí byť neskôr ako dátum začiatku',
    path: ['endDate'],
});
// Common validation schemas
export const commonSchemas = {
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema,
    name: nameSchema,
    address: addressSchema,
    coordinates: coordinatesSchema,
    dateRange: dateRangeSchema,
};
