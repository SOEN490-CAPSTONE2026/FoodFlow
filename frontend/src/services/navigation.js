let navigateFn = null;
let currentLocation = null;

export const setNavigator = navigate => {
  navigateFn = navigate;
};

export const setNavigationLocation = location => {
  currentLocation = location;
};

export const getNavigationLocation = () => currentLocation;

export const navigateTo = (to, options = {}) => {
  if (!navigateFn) {
    return false;
  }
  navigateFn(to, options);
  return true;
};
