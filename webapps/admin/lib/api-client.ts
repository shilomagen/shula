'server only';

import { Configuration } from '@/generated/http-clients/backend';
import {
  GroupsApi,
  SystemMessagesApi,
  WhatsAppStatusApi,
  GroupMetricsApi,
  ParticipantsApi,
  ParticipantConsentsApi,
  ConversationsApi,
  PersonsApi,
  FaceRecognitionApi,
} from '@/generated/http-clients/backend/api';

const apiConfig = new Configuration({
  basePath: process.env.BACKEND_URL,
});

// Create API clients
export const groupsApi = new GroupsApi(apiConfig);
export const systemMessagesApi = new SystemMessagesApi(apiConfig);
export const whatsAppStatusApi = new WhatsAppStatusApi(apiConfig);
export const groupMetricsApi = new GroupMetricsApi(apiConfig);
export const participantsApi = new ParticipantsApi(apiConfig);
export const participantConsentsApi = new ParticipantConsentsApi(apiConfig);
export const conversationsApi = new ConversationsApi(apiConfig);
export const personsApi = new PersonsApi(apiConfig);
export const faceRecognitionApi = new FaceRecognitionApi(apiConfig);
