import {
  formatPhoneForSms,
  normalizePhone,
  phoneLookupVariants,
  phoneToEmail,
} from './phone.util';

describe('phone.util', () => {
  describe('normalizePhone', () => {
    it('canonicalizes Libyan mobiles to 09xxxxxxxx', () => {
      expect(normalizePhone('0928855406')).toBe('0928855406');
      expect(normalizePhone('+218928855406')).toBe('0928855406');
      expect(normalizePhone('218928855406')).toBe('0928855406');
      expect(normalizePhone('928855406')).toBe('0928855406');
      expect(normalizePhone('00218928855406')).toBe('0928855406');
      expect(normalizePhone('092 885 5406')).toBe('0928855406');
    });
  });

  describe('phoneLookupVariants', () => {
    it('includes legacy stored forms', () => {
      const variants = phoneLookupVariants('+218928855406');
      expect(variants).toEqual(
        expect.arrayContaining([
          '0928855406',
          '928855406',
          '218928855406',
        ]),
      );
    });
  });

  describe('formatPhoneForSms', () => {
    it('emits 2189xxxxxxxx for gateway', () => {
      expect(formatPhoneForSms('0928855406')).toBe('218928855406');
      expect(formatPhoneForSms('+218928855406')).toBe('218928855406');
    });
  });

  describe('phoneToEmail', () => {
    it('uses canonical phone', () => {
      expect(phoneToEmail('+218928855406')).toBe('0928855406@phone.raqi');
    });
  });
});
