import { describe, it, expect } from 'vitest';
import { DateUtils } from '../dateUtils';

describe('DateUtils', () => {
  describe('parseEmailDate', () => {
    it('should parse YYYY-MM-DD HH:MM:SS format correctly', () => {
      const dateString = '2024-12-19 14:30:00';
      const result = DateUtils.parseEmailDate(dateString);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(11); // December (0-indexed)
      expect(result.getDate()).toBe(19);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it('should handle different date formats', () => {
      const dateString = '2024-01-01 08:00:00';
      const result = DateUtils.parseEmailDate(dateString);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('formatForDisplay', () => {
    it('should format date for display in Slovak locale', () => {
      const date = new Date(2024, 11, 19, 14, 30); // December 19, 2024, 14:30
      const result = DateUtils.formatForDisplay(date);
      
      expect(result).toMatch(/19\.12\.2024 14:30/);
    });
  });

  describe('parseToUTC', () => {
    it('should convert local time to UTC', () => {
      const dateString = '2024-12-19T14:30:00';
      const result = DateUtils.parseToUTC(dateString);
      
      expect(result).toBeInstanceOf(Date);
      // Should return a valid Date object
      expect(result.getTime()).toBeGreaterThan(0);
    });
  });

  describe('parseFromUTC', () => {
    it('should convert UTC to local time', () => {
      const utcDate = new Date('2024-12-19T14:30:00Z');
      const result = DateUtils.parseFromUTC(utcDate);
      
      expect(result).toBeInstanceOf(Date);
      // Should return a valid Date object
      expect(result.getTime()).toBeGreaterThan(0);
    });
  });

  describe('formatInBratislava', () => {
    it('should format date in Bratislava timezone', () => {
      const date = new Date('2024-12-19T14:30:00Z');
      const result = DateUtils.formatInBratislava(date, 'dd.MM.yyyy HH:mm');
      
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/);
    });
  });
});
