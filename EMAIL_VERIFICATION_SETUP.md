# Email Verification Setup Guide

## Current Status

The verification code is currently displayed prominently in the UI for testing purposes. The code is generated and stored in Firestore, but **email sending is not yet configured**.

## How It Works Now

1. User enters email address
2. System generates a 6-digit verification code
3. Code is stored in Firestore (`verificationCodes` collection)
4. **Code is displayed prominently in a blue box** on the verification screen
5. User enters the code to complete registration

## Setting Up Email Service

To send verification codes via email, you need to integrate an email service. Here are recommended options:

### Option 1: Firebase Extensions (Easiest)

1. Go to Firebase Console > Extensions
2. Install "Trigger Email" extension
3. Configure it to send emails when documents are created in `verificationCodes` collection
4. The extension will automatically send emails with the verification code

### Option 2: SendGrid

1. Sign up for SendGrid account
2. Get API key
3. Create a Cloud Function (Firebase Functions) to send emails
4. Trigger function when verification code is created

### Option 3: AWS SES

1. Set up AWS SES
2. Verify your domain/email
3. Create a Cloud Function to send emails via SES API
4. Trigger function when verification code is created

### Option 4: Nodemailer (Simple SMTP)

1. Install nodemailer: `npm install nodemailer`
2. Configure SMTP settings (Gmail, Outlook, etc.)
3. Create a Cloud Function to send emails
4. Trigger function when verification code is created

## Code Location

The verification code generation happens in:
- `src/components/AdminRegistrationModal.tsx` (line ~62)
- `src/components/HRRegistrationModal.tsx` (line ~62)

The code is stored in Firestore at:
- Collection: `verificationCodes`
- Document ID: email address (lowercase)
- Fields: `code`, `email`, `role`, `createdAt`, `expiresAt`

## Next Steps

1. Choose an email service provider
2. Set up Cloud Functions (if needed)
3. Modify the `sendVerificationCode` function to call your email service
4. Remove the prominent code display (or keep it for testing)
5. Test email delivery

## Testing

For now, the verification code is displayed in a prominent blue box on the verification screen. This allows you to test the registration flow without setting up email service first.

