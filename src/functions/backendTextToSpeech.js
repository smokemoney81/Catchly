// Shim für @/functions/backendTextToSpeech
import { base44 } from '@/api/base44Client';
const fn = (payload) => base44.functions.invoke('backendTextToSpeech', payload);
export default fn;
export { fn as backendTextToSpeech };
