import {
  setNavigator,
  setNavigationLocation,
  getNavigationLocation,
  navigateTo,
} from '../navigation';

describe('navigation', () => {
  beforeEach(() => {
    // Reset the module state before each test
    setNavigator(null);
    setNavigationLocation(null);
  });

  describe('setNavigator and navigateTo', () => {
    it('should set navigator function', () => {
      const mockNavigate = jest.fn();
      setNavigator(mockNavigate);

      const result = navigateTo('/test');

      expect(result).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/test', {});
    });

    it('should navigate with options', () => {
      const mockNavigate = jest.fn();
      setNavigator(mockNavigate);

      navigateTo('/test', { replace: true });

      expect(mockNavigate).toHaveBeenCalledWith('/test', { replace: true });
    });

    it('should return false when navigator is not set', () => {
      const result = navigateTo('/test');

      expect(result).toBe(false);
    });
  });

  describe('setNavigationLocation and getNavigationLocation', () => {
    it('should set and get navigation location', () => {
      const location = { pathname: '/test', search: '?id=123' };

      setNavigationLocation(location);

      expect(getNavigationLocation()).toEqual(location);
    });

    it('should return null initially', () => {
      expect(getNavigationLocation()).toBe(null);
    });

    it('should update location', () => {
      setNavigationLocation({ pathname: '/first' });
      expect(getNavigationLocation()).toEqual({ pathname: '/first' });

      setNavigationLocation({ pathname: '/second' });
      expect(getNavigationLocation()).toEqual({ pathname: '/second' });
    });
  });
});
