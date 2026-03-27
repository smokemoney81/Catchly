import { base44 } from '@/api/base44Client';
const fn = (payload) => base44.functions.invoke('loadWaterBodies', payload);
export default fn;
export const loadWaterBodies = fn;
