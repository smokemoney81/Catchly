// Shim für @/functions/catchgbtChat
import { base44 } from '@/api/base44Client';
const fn = (payload) => base44.functions.invoke('catchgbtChat', payload);
export default fn;
export { fn as catchgbtChat };
