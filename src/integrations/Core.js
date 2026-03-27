// Compatibility shim für alte @/integrations/Core imports
import { base44 } from '@/api/base44Client';

export const InvokeLLM = base44.integrations.Core.InvokeLLM.bind(base44.integrations.Core);
export const UploadFile = base44.integrations.Core.UploadFile.bind(base44.integrations.Core);
export const SendEmail = base44.integrations.Core.SendEmail.bind(base44.integrations.Core);
export const SendSMS = base44.integrations.Core.SendSMS.bind(base44.integrations.Core);
export const GenerateImage = base44.integrations.Core.GenerateImage.bind(base44.integrations.Core);
export const ExtractDataFromUploadedFile = base44.integrations.Core.ExtractDataFromUploadedFile.bind(base44.integrations.Core);
export const CreateFileSignedUrl = base44.integrations.Core.CreateFileSignedUrl.bind(base44.integrations.Core);
