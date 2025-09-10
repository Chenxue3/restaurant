import { EmailClient } from '@azure/communication-email';

const getEmailClient = () => {
  const connectionString = process.env.EMAIL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Azure email connection string is not configured');
  }
  
  return new EmailClient(connectionString);
};

export { getEmailClient };

export const sendVerificationEmail = async (email, code) => {
  try {
    const emailClient = getEmailClient();
    
    const emailMessage = {
      senderAddress: process.env.EMAIL_FROM,
      content: {
        subject: 'SmartSavor Verification Code',
        plainText: `Your verification code is: ${code}`,
        html: `
          <h1>SmartSavor Email Verification</h1>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `
      },
      recipients: {
        to: [{ address: email }]
      }
    };
    
    const poller = await emailClient.beginSend(emailMessage);
    const response = await poller.pollUntilDone();
    return response;
  } catch (error) {
    console.error(`Failed to send verification email: ${error.message}`);
    throw error;
  }
};

export default {
  getEmailClient,
  sendVerificationEmail
}; 