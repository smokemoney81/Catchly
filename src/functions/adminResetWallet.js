// Shim für @/functions/adminResetWallet
import { base44 } from '@/api/base44Client';
const fn = (payload) => base44.functions.invoke('adminResetWallet', payload);
export default fn;
export { fn as adminResetWallet };
