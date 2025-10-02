import { format, parseISO, differenceInDays, differenceInHours, addDays, isAfter, isBefore } from 'date-fns';
import { sk } from 'date-fns/locale';
// Date utilities
export const formatDate = (date, formatStr = 'dd.MM.yyyy') => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: sk });
};
export const formatDateTime = (date) => {
    return formatDate(date, 'dd.MM.yyyy HH:mm');
};
export const formatTime = (date) => {
    return formatDate(date, 'HH:mm');
};
export const calculateRentalDays = (startDate, endDate) => {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    return differenceInDays(end, start) + 1; // +1 to include both start and end day
};
export const calculateRentalHours = (startDate, endDate) => {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    return differenceInHours(end, start);
};
export const isDateInFuture = (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isAfter(dateObj, new Date());
};
export const isDateInPast = (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isBefore(dateObj, new Date());
};
export const addDaysToDate = (date, days) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addDays(dateObj, days);
};
export const getMinimumBookingDate = () => {
    // Minimum 2 hours from now
    return addDaysToDate(new Date(), 0);
};
export const getMaximumBookingDate = () => {
    // Maximum 1 year from now
    return addDaysToDate(new Date(), 365);
};
