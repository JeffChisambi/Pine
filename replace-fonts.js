const fs = require('fs');
const path = require('path');

const files = [
  'app/login.tsx',
  'app/signup.tsx',
  'app/phone-number.tsx',
  'app/verify-code.tsx',
  'app/forgot-password.tsx',
  'app/deposit.tsx',
  'app/withdraw.tsx',
  'app/create-pin.tsx',
  'app/onboarding-3.tsx',
  'app/(tabs)/portfolio.tsx',
  'app/(tabs)/market.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/news.tsx',
  'app/stock-search.tsx',
  'app/stock/[ticker].tsx',
  'app/trade/buy.tsx',
  'app/trade/sell.tsx',
  'app/trade/exchange.tsx',
  'app/trade/payment.tsx',
  'app/trade/confirm.tsx',
  'app/trade/success.tsx',
  'app/trade/history.tsx',
  'app/profile/notifications.tsx',
  'app/profile/personal-data.tsx',
  'app/profile/push-notifications.tsx',
  'app/kyc/verify-success.tsx',
  'app/kyc/upload-id.tsx',
  'app/kyc/upload-id-selfie.tsx',
  'app/kyc/upload-proof-of-residency.tsx',
  'app/kyc/proof-of-residency.tsx',
];

const replacements = [
  ['Inter_700Bold', 'Poppins_700Bold'],
  ['Inter_600SemiBold', 'Poppins_600SemiBold'],
  ['Inter_500Medium', 'Poppins_500Medium'],
  ['Inter_400Regular', 'Poppins_400Regular'],
  ['@expo-google-fonts/inter', '@expo-google-fonts/poppins'],
];

let updated = 0;
for (const rel of files) {
  const fullPath = path.join(__dirname, rel);
  if (!fs.existsSync(fullPath)) { console.log('MISSING:', rel); continue; }
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Updated:', rel);
    updated++;
  } else {
    console.log('No change:', rel);
  }
}
console.log(`\nDone. ${updated} files updated.`);
