// Shim für @/functions/getFishingRecommendation
import { base44 } from '@/api/base44Client';
const fn = (payload) => base44.functions.invoke('getFishingRecommendation', payload);
export default fn;
export { fn as getFishingRecommendation };
