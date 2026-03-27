import { base44 } from '@/api/base44Client';
const fn = (payload) => base44.functions.invoke('generateCatchReport', payload);
export default fn;
export const generateCatchReport = fn;
