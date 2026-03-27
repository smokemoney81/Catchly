// Shim für @/functions/premiumStatus
import { base44 } from '@/api/base44Client';
const fn = (payload) => base44.functions.invoke('premiumStatus', payload);
export default fn;
export { fn as premiumStatus };
