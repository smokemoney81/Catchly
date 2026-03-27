// Shim für @/functions/generateBathymetricMap
import { base44 } from '@/api/base44Client';
const fn = (payload) => base44.functions.invoke('generateBathymetricMap', payload);
export default fn;
export { fn as generateBathymetricMap };
