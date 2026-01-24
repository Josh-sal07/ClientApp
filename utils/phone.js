// utils/phone.js

export const formatPhoneDisplay = (number) => {
  const cleaned = number.replace(/\D/g, "");
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
};

export const encryptPhoneNumber = (number) => {
  const cleaned = number.replace(/\D/g, "");
  if (cleaned.length === 10) {
    const firstThree = cleaned.slice(0, 3);
    const lastThree = cleaned.slice(7, 10);
    return `+63 ${firstThree.slice(0, 1)}** *** ${lastThree}`;
  }
  return `+63 ${cleaned}`;
};
