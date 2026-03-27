// Shim für @/functions/processDepthData
import { base44 } from '@/api/base44Client';
const fn = (payload) => base44.functions.invoke('processDepthData', payload);
export default fn;
export { fn as processDepthData };
