const express = require('express');
const router = express.Router();
const eventController = require('./eventController');
const subscriptionController = require('./subscriptionController');

// Meeting 
router.post('/meeting/create', eventController.createMeeting);
router.post('/meeting/transcription', eventController.updateTranscription);
router.post('/meeting/status', eventController.updateMeetingStatus);
router.post('/meeting/upload', eventController.uploadMeetingFile);
router.get('/meeting/:meetingId', eventController.getMeeting);
router.get('/meeting/calendar/:idCalendar', eventController.getMeetingById);
router.post('/meeting/messages', eventController.saveMeetingMessages);
router.get('/meeting/messages/:meetingId', eventController.getMeetingMessages);

// Calendar
router.post('/calendar', eventController.createEvent);
router.post('/calendar/status', eventController.updateEventStatus);
router.delete('/calendar/deleteone/:id', eventController.deleteOneEvent);
router.delete('/calendar/deleteday/:id/:date', eventController.deleteDayEvent);
router.delete('/calendar/deletegroup/:date/:startTime/:endTime/:provider', eventController.deleteGroupEvent);
router.get('/calendar/date/:date/:provider', eventController.getEventsByDate);
router.get('/calendar/range/:startDate/:endDate/:provider', eventController.getEventsByDateRange);

// Prontuario
router.get('/calendar/prontuario/:sender/:provider', eventController.getProntuarioByContact);
router.post('/calendar/prontuario', eventController.updateProntuario);

// Usuários
router.get('/user/:id', eventController.getUser);

// Messages
router.get('/messages/contact/:sender/:provider', eventController.getMessagesByContact);
router.get('/messages/contacts/:provider', eventController.getContacts);
router.get('/messages/reset/:contact', eventController.resetContact);
router.post('/messages/addcontact', eventController.addContact);

// Subscription
router.post('/subscription/checkout', subscriptionController.createCheckoutSession);
router.post('/subscription/confirm', subscriptionController.confirmSubscription);
router.post('/subscription/check', subscriptionController.checkSubscription);
router.post('/subscription/cancel', subscriptionController.cancelSubscription);

// Profile
router.get('/profile/:id', eventController.getProfile);
router.get('/profile/photo/:howPhoto/:id', eventController.getPhoto);
router.post('/profile/profile', eventController.updateProfile);
router.post('/profile/modality/vector', eventController.updateModalityVector);
router.post('/profile/photo', eventController.updatePhoto);

// Provider
router.get('/provider/:phone', eventController.verifyProvider);
router.post('/provider/create', eventController.createProvider);
router.post('/provider/status', eventController.updateStatusProvider);
router.get('/provider/resetpassword/:token', eventController.verifyTokenProvider);
router.post('/provider/resetpassword', eventController.updatePasswordProvider);
router.post('/provider/createsubscription', eventController.createSubscription);

// Finance
router.post('/finance', eventController.createFinance);
router.delete('/finance/deleteone/:id', eventController.deleteOneFinance);
router.get('/finance/range/:client/:startDate/:endDate/:provider', eventController.getFinanceByDateRange);
router.post('/finance/status', eventController.updateFinanceStatus);

// Modality
router.get('/modality/:id_provider/:id_category', eventController.getModality);
router.get('/modality/qty/:id_provider/:id_category', eventController.getQtyModality);
router.get('/modality/:id_provider', eventController.getModalityByProvider);
router.post('/modality/addmodality', eventController.createModality);
router.delete('/modality/:id', eventController.deleteModality);

// Embedding
router.post('/embedding', eventController.createEmbeddingOpenAI);

// WhatsApp
router.post('/whatsapp/sendmessagesoniah', eventController.sendMessageSoniah);
router.post('/whatsapp/sendmessagesofiah', eventController.sendMessageSofiah);

//AI
router.post('/ai/agent', eventController.askAIAgent);

// CEP
router.get('/cep/:cep', eventController.getCoordinatesByCep);

module.exports = router;

