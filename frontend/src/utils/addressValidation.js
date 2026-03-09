const GEOCODE_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json';

const getAddressComponent = (components, type) =>
  components.find(component => component.types?.includes(type));

const normalizeText = value =>
  String(value || '')
    .trim()
    .toLowerCase();

const normalizeForCompare = value =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const textMatches = (input, ...candidates) => {
  const normalizedInput = normalizeForCompare(input);
  if (!normalizedInput) {
    return true;
  }

  return candidates.some(candidate => {
    const normalizedCandidate = normalizeForCompare(candidate);
    if (!normalizedCandidate) {
      return false;
    }
    return (
      normalizedInput === normalizedCandidate ||
      normalizedInput.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedInput)
    );
  });
};

const postalCodeMatches = (input, candidate) => {
  const normalizedInput = normalizeForCompare(input);
  const normalizedCandidate = normalizeForCompare(candidate);

  if (!normalizedInput) {
    return true;
  }
  if (!normalizedCandidate) {
    return false;
  }

  return (
    normalizedInput === normalizedCandidate ||
    normalizedCandidate.startsWith(normalizedInput) ||
    normalizedInput.startsWith(normalizedCandidate)
  );
};

export const validateAndNormalizeAddressWithGoogle = async addressData => {
  if (process.env.NODE_ENV === 'test') {
    return {
      isValid: true,
      normalizedAddress: addressData,
    };
  }

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      isValid: true,
      normalizedAddress: addressData,
    };
  }

  const fullAddress = [
    addressData.streetAddress,
    addressData.unit ? `Unit ${addressData.unit}` : '',
    addressData.city,
    addressData.province,
    addressData.postalCode,
    addressData.country,
  ]
    .filter(Boolean)
    .join(', ');

  if (!fullAddress) {
    return { isValid: false };
  }

  try {
    const response = await fetch(
      `${GEOCODE_ENDPOINT}?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
    );
    const data = await response.json();

    if (
      data.status !== 'OK' ||
      !Array.isArray(data.results) ||
      data.results.length === 0
    ) {
      return { isValid: false };
    }

    const bestResult =
      data.results.find(result => result.types?.includes('street_address')) ||
      data.results[0];

    const components = bestResult.address_components || [];
    const streetNumber = getAddressComponent(components, 'street_number');
    const route = getAddressComponent(components, 'route');
    const city =
      getAddressComponent(components, 'locality') ||
      getAddressComponent(components, 'postal_town') ||
      getAddressComponent(components, 'sublocality_level_1') ||
      getAddressComponent(components, 'administrative_area_level_2');
    const province = getAddressComponent(
      components,
      'administrative_area_level_1'
    );
    const postalCode = getAddressComponent(components, 'postal_code');
    const country = getAddressComponent(components, 'country');

    const hasStreetLevelAddress = Boolean(streetNumber && route);
    const inputCountry = normalizeText(addressData.country);
    const matchedCountryLong = normalizeText(country?.long_name);
    const matchedCountryShort = normalizeText(country?.short_name);
    const countryMatches =
      !inputCountry ||
      inputCountry === matchedCountryLong ||
      inputCountry === matchedCountryShort;
    const cityMatches = textMatches(
      addressData.city,
      city?.long_name,
      city?.short_name
    );
    const provinceMatches = textMatches(
      addressData.province,
      province?.long_name,
      province?.short_name
    );
    const postalMatches = postalCodeMatches(
      addressData.postalCode,
      postalCode?.long_name || postalCode?.short_name
    );

    const normalizedAddress = {
      ...addressData,
      streetAddress:
        `${streetNumber?.long_name || ''} ${route?.long_name || ''}`.trim() ||
        addressData.streetAddress,
      city: city?.long_name || addressData.city,
      province: province?.long_name || addressData.province,
      postalCode: postalCode?.long_name || addressData.postalCode,
      country: country?.long_name || addressData.country,
    };

    if (
      !hasStreetLevelAddress ||
      !country ||
      !countryMatches ||
      !cityMatches ||
      !provinceMatches ||
      !postalMatches
    ) {
      return {
        isValid: false,
        normalizedAddress,
        mismatches: {
          streetAddress: !hasStreetLevelAddress,
          city: !cityMatches,
          province: !provinceMatches,
          postalCode: !postalMatches,
          country: !countryMatches || !country,
        },
      };
    }

    return {
      isValid: true,
      normalizedAddress,
    };
  } catch (error) {
    console.error('Address validation failed:', error);
    return { isValid: false };
  }
};
