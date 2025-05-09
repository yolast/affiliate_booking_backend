export const generatePartnerId = (state, country) => {
  const stateCode = state.slice(0, 2).toUpperCase();
  const countryCode = country.slice(0, 2).toUpperCase();
  const randomAlpha = Math.random().toString(36).substring(2, 6).toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${countryCode}${stateCode}${randomAlpha}${randomNum}`;
};
