export const STORAGE_KEYS = {
  MESSAGES: 'kazi_chat_messages',
  SUGGESTED_QUESTIONS: 'kazi_suggested_questions',
  ATTACHMENTS: 'kazi_attachments',
  CONVERSATION_ATTEMPTS: 'kazi_conversation_attempts',
  TICKETS: 'kazi_support_tickets'
};

export const initialMessages = [
  {
    id: '1',
    text: 'Hello! I\'m Kazi Assistant. How can I help you today with your internet, billing, or technical issues?',
    sender: 'bot',
    timestamp: new Date(),
    seen: true,
  }
];

export const initialSuggestedQuestions = [
  "Internet not working",
  "Slow internet speed",
  "Billing question",
  "Service outage"
];

export const CATEGORIES = [
  'Internet Connection',
  'Slow Speed',
  'Billing/Payment',
  'Service Outage',
  'Account Management',
  'General Inquiry'
];

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

export const TROUBLESHOOTING_GUIDES = {
  'Internet Connection': [
    'Restart your modem/router (unplug for 30s)',
    'Check cable connections',
    'Test on another device',
    'Try wired connection',
    'Check for outages in your area'
  ],
  'Slow Speed': [
    'Run speed test at speedtest.net',
    'Disconnect unused devices',
    'Move closer to router',
    'Change WiFi channel',
    'Update router firmware'
  ],
  'Billing/Payment': [
    'Check latest bill in app',
    'Verify payment method',
    'Review billing cycle',
    'Look for auto-payments',
    'Contact billing support'
  ]
};

export const FAQ_RESOURCES = {
  'Internet Connection': [
    'How to reset modem',
    'Router placement guide',
    'WiFi troubleshooting',
    'Modem lights explained'
  ],
  'Slow Speed': [
    'Improving WiFi speed',
    'Understanding speeds',
    'Bandwidth optimization'
  ]
};

export const getFileIcon = (type) => {
  switch (type) {
    case 'image': return 'image';
    case 'video': return 'videocam';
    default: return 'document';
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const categorizeIssue = (input) => {
  const text = input.toLowerCase();
  if (text.includes('internet') || text.includes('wifi') || text.includes('connection')) return 'Internet Connection';
  if (text.includes('slow') || text.includes('speed') || text.includes('lag')) return 'Slow Speed';
  if (text.includes('bill') || text.includes('payment') || text.includes('charge')) return 'Billing/Payment';
  if (text.includes('outage') || text.includes('down')) return 'Service Outage';
  if (text.includes('account') || text.includes('login') || text.includes('password')) return 'Account Management';
  return 'General Inquiry';
};

export const suggestTroubleshootingSteps = (category) => TROUBLESHOOTING_GUIDES[category] || [];

export const getFAQResources = (category) => FAQ_RESOURCES[category] || [];

export const getDynamicQuestions = (input, category, attempts) => {
  if (attempts >= 3) {
    return ["Still having issues?", "Need more help?", "Create support ticket?"];
  }
  switch (category) {
    case 'Internet Connection':
      return ["Have you restarted your modem?", "Is it all devices or specific ones?", "Wired or WiFi issue?"];
    case 'Slow Speed':
      return ["What's your speed test result?", "All devices affected?", "Wired or WiFi?"];
    case 'Billing/Payment':
      return ["Incorrect amount?", "Payment not reflecting?", "Need invoice copy?"];
    default:
      return ["Can you provide more details?", "When did it start?", "Any error messages?"];
  }
};

export const getBotResponse = (input, category, attempts, previousMessages) => {
  const text = input.toLowerCase().trim();
  const empathy = attempts > 1
    ? ["I'm sorry you're facing this.", "I understand how frustrating this is.", "Thanks for your patience."][Math.floor(Math.random() * 3)] + " "
    : "";

  const isFrustrated = text.includes('still') || text.includes('not working') || text.includes("didn't work") || text.includes('again');

  if (isFrustrated && attempts >= 2) {
    return `${empathy}It looks like the issue persists. At this point I recommend creating a support ticket so our technical team can investigate further.`;
  }

  switch (category) {
    case 'Internet Connection':
      return `${empathy}Let's troubleshoot your connection:\n\n` +
             `1. Restart your modem/router (unplug for 30 seconds)\n` +
             `2. Check if other devices are affected\n` +
             `3. Try forgetting the WiFi network and reconnecting\n` +
             `4. Test with a wired connection if possible\n\n` +
             `Which step have you already tried?`;
    case 'Slow Speed':
      return `${empathy}Slow speeds can have many causes. Could you:\n\n` +
             `1. Run a speed test at speedtest.net\n` +
             `2. Tell me how many devices are connected\n` +
             `3. Say if it's slow on WiFi only or wired too\n\n` +
             `Your results will help me guide you better.`;
    case 'Billing/Payment':
      return `${empathy}Happy to help with billing questions.\n\n` +
             `Common topics include:\n` +
             `• Unexpected charges\n` +
             `• Payment not showing\n` +
             `• Plan changes\n\n` +
             `What exactly are you seeing on your bill?`;
    case 'Service Outage':
      return `${empathy}No internet is really inconvenient. Let me check...\n\n` +
             `There may be a local issue. Our team is working on it (ETA: ~4 hours).\n` +
             `Are your modem lights showing red or amber?`;
    default:
      return `${empathy}Thanks for reaching out! To help you quickly, could you tell me:\n\n` +
             `• What’s happening?\n` +
             `• When did it start?\n` +
             `• Any error messages?\n\n` +
             `The more details, the better I can assist.`;
  }
};