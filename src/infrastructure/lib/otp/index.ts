import { generate } from 'otp-generator';

export const OtpGenerator = () => {
  return generate(5, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    alphabets: false,
    digits: true,
  });
};
