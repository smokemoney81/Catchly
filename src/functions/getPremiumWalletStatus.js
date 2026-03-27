// Shim für @/functions/getPremiumWalletStatus
import { base44 } from '@/api/base44Client';
const fn = (payload) => base44.functions.invoke('getPremiumWalletStatus', payload);
export default fn;
export { fn as getPremiumWalletStatus };
