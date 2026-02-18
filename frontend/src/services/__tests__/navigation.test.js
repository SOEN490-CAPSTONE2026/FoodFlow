import {
  setNavigator,
  setNavigationLocation,
  getNavigationLocation,
  navigateTo,
} from '../navigation';

describe('navigation service', () => {
  beforeEach(() => {
    setNavigator(null);
    setNavigationLocation(null);
  });

  it('returns false when navigator is not set', () => {
    expect(navigateTo('/donor/dashboard')).toBe(false);
  });

  it('navigates and returns true when navigator is set', () => {
    const mockNavigate = jest.fn();
    setNavigator(mockNavigate);

    const result = navigateTo('/donor/list', { replace: true });

    expect(result).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('/donor/list', {
      replace: true,
    });
  });

  it('stores and returns current location', () => {
    const location = { pathname: '/donor/impact' };
    setNavigationLocation(location);

    expect(getNavigationLocation()).toEqual(location);
  });
});
