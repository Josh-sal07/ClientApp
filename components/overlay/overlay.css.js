// overlay.css.js
import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const scaleSize = (size) => {
  return size * (width / 375);
};

export const styles = StyleSheet.create({
  // Floating button styles
  floatingButton: {
    position: 'absolute',
    bottom: scaleSize(30),
    right: scaleSize(20),
    width: scaleSize(60),
    height: scaleSize(60),
    borderRadius: scaleSize(30),
    backgroundColor: '#00afa1ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9999,
  },
  
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  keyboardAvoid: {
    flex: 1,
  },

  // Header styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  backButton: {
    marginRight: scaleSize(12),
  },
  
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  logo: {
    width: scaleSize(36),
    height: scaleSize(36),
    marginRight: scaleSize(12),
  },
  
  titleContainer: {
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: scaleSize(18),
    fontWeight: 'bold',
    color: '#333',
  },
  
  headerStatus: {
    fontSize: scaleSize(12),
    color: '#00afa1ff',
    marginTop: 2,
  },
  
  headerSubtitle: {
    fontSize: scaleSize(14),
    color: '#666',
  },
  
  headerActions: {
    flexDirection: 'row',
  },
  
  headerButton: {
    marginLeft: scaleSize(16),
    padding: scaleSize(8),
  },

  // Chat container styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  
  chatList: {
    flex: 1,
  },
  
  chatContent: {
    padding: scaleSize(16),
    paddingBottom: scaleSize(100),
  },

  // Message styles
  messageContainer: {
    marginBottom: scaleSize(12),
  },
  
  userMessage: {
    alignItems: 'flex-end',
  },
  
  botMessage: {
    alignItems: 'flex-start',
  },
  
  messageBubble: {
    maxWidth: '80%',
    borderRadius: scaleSize(18),
    padding: scaleSize(12),
  },
  
  userBubble: {
    backgroundColor: '#00afa1ff',
    borderBottomRightRadius: scaleSize(4),
  },
  
  botBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: scaleSize(4),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  messageText: {
    fontSize: scaleSize(16),
    lineHeight: scaleSize(22),
  },
  
  userMessageText: {
    color: '#ffffff',
  },
  
  botMessageText: {
    color: '#333',
  },
  
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleSize(4),
  },
  
  timestamp: {
    fontSize: scaleSize(12),
  },
  
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  
  botTimestamp: {
    color: '#999',
  },
  
  seenText: {
    fontSize: scaleSize(11),
    color: 'rgba(255,255,255,0.7)',
    marginLeft: scaleSize(8),
  },

  // Attachment styles
  attachmentContainer: {
    marginBottom: scaleSize(8),
    position: 'relative',
  },
  
  attachmentImage: {
    width: scaleSize(200),
    height: scaleSize(150),
    borderRadius: scaleSize(12),
  },
  
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    width: scaleSize(250),
  },
  
  fileInfo: {
    flex: 1,
    marginLeft: scaleSize(12),
  },
  
  fileName: {
    fontSize: scaleSize(14),
    fontWeight: '500',
    color: '#333',
  },
  
  fileSize: {
    fontSize: scaleSize(12),
    color: '#666',
    marginTop: scaleSize(2),
  },
  
  removeAttachmentButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  
  messageAttachments: {
    marginTop: scaleSize(8),
  },
  
  sentAttachment: {
    marginBottom: scaleSize(8),
  },
  
  sentAttachmentImage: {
    width: scaleSize(180),
    height: scaleSize(120),
    borderRadius: scaleSize(8),
  },
  
  sentFileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: scaleSize(8),
    borderRadius: scaleSize(8),
    width: scaleSize(180),
  },
  
  sentFileName: {
    fontSize: scaleSize(13),
    marginLeft: scaleSize(8),
    flex: 1,
  },

  // Input area styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: scaleSize(16),
    paddingTop: scaleSize(12),
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  
  attachButton: {
    padding: scaleSize(10),
    marginRight: scaleSize(8),
  },
  
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    borderRadius: scaleSize(20),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(10),
    maxHeight: scaleSize(100),
    fontSize: scaleSize(16),
    color: '#333',
  },
  
  sendButton: {
    backgroundColor: '#00afa1ff',
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: scaleSize(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scaleSize(8),
  },
  
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },

  // Suggestions styles
  suggestionsContainer: {
    marginTop: scaleSize(16),
  },
  
  suggestionsTitle: {
    fontSize: scaleSize(14),
    fontWeight: '600',
    color: '#666',
    marginBottom: scaleSize(8),
  },
  
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -scaleSize(4),
  },
  
  suggestionButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(8),
    borderRadius: scaleSize(16),
    margin: scaleSize(4),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  suggestionText: {
    fontSize: scaleSize(14),
    color: '#333',
  },
  
  loadingContainer: {
    alignItems: 'center',
    padding: scaleSize(16),
  },
  
  loadingText: {
    fontSize: scaleSize(14),
    color: '#666',
    marginTop: scaleSize(8),
  },

  // Ticket suggestion button
  ticketSuggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9500',
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(20),
    marginTop: scaleSize(12),
    alignSelf: 'flex-start',
  },
  
  ticketSuggestionText: {
    color: '#fff',
    fontSize: scaleSize(14),
    fontWeight: '600',
    marginLeft: scaleSize(8),
  },
  
  createTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff9500',
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(12),
    borderRadius: scaleSize(25),
    marginTop: scaleSize(16),
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  
  createTicketText: {
    color: '#fff',
    fontSize: scaleSize(16),
    fontWeight: 'bold',
    marginLeft: scaleSize(8),
  },

  // Attachment modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: scaleSize(20),
    borderTopRightRadius: scaleSize(20),
    padding: scaleSize(20),
    paddingBottom: Platform.OS === 'ios' ? scaleSize(40) : scaleSize(20),
  },
  
  modalTitle: {
    fontSize: scaleSize(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scaleSize(20),
    textAlign: 'center',
  },
  
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  modalOptionText: {
    fontSize: scaleSize(16),
    color: '#333',
    marginLeft: scaleSize(16),
  },
  
  modalCancel: {
    paddingVertical: scaleSize(16),
    alignItems: 'center',
    marginTop: scaleSize(8),
  },
  
  modalCancelText: {
    fontSize: scaleSize(16),
    color: '#ff3b30',
    fontWeight: '600',
  },

  // Ticket modal styles
  ticketModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  ticketModalContent: {
    flex: 1,
  },
  
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  ticketBackButton: {
    marginRight: scaleSize(16),
  },
  
  ticketTitle: {
    fontSize: scaleSize(18),
    fontWeight: 'bold',
    color: '#333',
  },
  
  ticketForm: {
    padding: scaleSize(20),
  },
  
  formGroup: {
    marginBottom: scaleSize(20),
  },
  
  formLabel: {
    fontSize: scaleSize(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: scaleSize(8),
  },
  
  formInput: {
    backgroundColor: '#f5f5f7',
    borderRadius: scaleSize(12),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
    fontSize: scaleSize(16),
    color: '#333',
  },
  
  textArea: {
    minHeight: scaleSize(100),
    textAlignVertical: 'top',
  },
  
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -scaleSize(4),
  },
  
  categoryButton: {
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(8),
    borderRadius: scaleSize(20),
    backgroundColor: '#f0f0f0',
    margin: scaleSize(4),
  },
  
  categoryButtonActive: {
    backgroundColor: '#00afa1ff',
  },
  
  categoryText: {
    fontSize: scaleSize(14),
    color: '#666',
  },
  
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -scaleSize(4),
  },
  
  priorityButton: {
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(8),
    borderRadius: scaleSize(20),
    backgroundColor: '#f0f0f0',
    margin: scaleSize(4),
  },
  
  priorityButtonActive: {
    backgroundColor: '#ff9500',
  },
  
  priorityText: {
    fontSize: scaleSize(14),
    color: '#666',
  },
  
  priorityTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  checkbox: {
    width: scaleSize(24),
    height: scaleSize(24),
    borderRadius: scaleSize(6),
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: scaleSize(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  checkboxChecked: {
    backgroundColor: '#00afa1ff',
    borderColor: '#00afa1ff',
  },
  
  checkboxLabel: {
    fontSize: scaleSize(14),
    color: '#333',
    flex: 1,
  },
  
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00afa1ff',
    paddingVertical: scaleSize(16),
    borderRadius: scaleSize(12),
    marginTop: scaleSize(20),
  },
  
  submitButtonText: {
    color: '#fff',
    fontSize: scaleSize(16),
    fontWeight: 'bold',
    marginLeft: scaleSize(8),
  },
  
  ticketDisclaimer: {
    fontSize: scaleSize(12),
    color: '#666',
    textAlign: 'center',
    marginTop: scaleSize(20),
    lineHeight: scaleSize(18),
  },

  // Attachments preview
  attachmentsPreview: {
    position: 'absolute',
    bottom: scaleSize(70),
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: scaleSize(16),
    maxHeight: scaleSize(200),
  },
});