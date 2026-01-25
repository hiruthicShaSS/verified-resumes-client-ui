# Google OAuth Setup Guide

## Common Issues and Solutions

### 1. "Access Token Error" or "Authorization Blocked"

This usually happens due to incorrect Google OAuth configuration. Follow these steps:

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name

### Step 2: Enable Google+ API

1. Navigate to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity Services"
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace account)
3. Fill in the required information:
   - App name: "Verified Resumes"
   - User support email: Your email
   - Developer contact information: Your email
4. Click **Save and Continue**
5. Add scopes (if needed):
   - `email`
   - `profile`
   - `openid`
6. Click **Save and Continue**
7. Add test users (if app is in Testing mode):
   - Add your email address
   - Add any other test emails
8. Click **Save and Continue**

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Verified Resumes Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:3001` (if using different port)
     - Your production URL (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - `http://localhost:3000`
     - `http://localhost:3001` (if using different port)
     - Your production URL (e.g., `https://yourdomain.com`)
5. Click **Create**
6. Copy the **Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### Step 5: Configure Environment Variable

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add your Client ID:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
3. **Important**: Replace `your-client-id-here` with your actual Client ID
4. Save the file
5. **Restart your development server** (stop and start `npm start`)

### Step 6: Verify Configuration

1. Make sure your `.env` file is in the project root (same level as `package.json`)
2. Check that the Client ID doesn't have quotes around it
3. Restart the dev server after creating/updating `.env`
4. Check browser console for any errors

### Common Mistakes to Avoid

1. ❌ **Don't** put quotes around the Client ID in `.env`
   - Wrong: `REACT_APP_GOOGLE_CLIENT_ID="your-id"`
   - Right: `REACT_APP_GOOGLE_CLIENT_ID=your-id`

2. ❌ **Don't** forget to add `http://localhost:3000` to authorized origins

3. ❌ **Don't** use `https://localhost:3000` (use `http://` for local development)

4. ❌ **Don't** forget to restart the dev server after changing `.env`

5. ❌ **Don't** commit your `.env` file to git (it's already in `.gitignore`)

### Troubleshooting

#### Error: "Access blocked: This app's request is invalid"
- Check that your Client ID is correct
- Verify authorized JavaScript origins include your current URL
- Make sure you're using `http://` not `https://` for localhost

#### Error: "popup_closed_by_user"
- User closed the popup window
- This is normal if user cancels

#### Error: "idpiframe_initialization_failed"
- Check that your Client ID is valid
- Verify the Google OAuth library is loaded
- Check browser console for more details

#### Still having issues?
1. Clear browser cache and cookies
2. Try in incognito/private mode
3. Check browser console for detailed error messages
4. Verify your Client ID in Google Cloud Console
5. Make sure the OAuth consent screen is properly configured

### Testing

1. Start your app: `npm start`
2. Navigate to `http://localhost:3000`
3. Click "Sign in with Google"
4. You should see Google's sign-in popup
5. Select your Google account
6. Grant permissions
7. You should be redirected to the home page

### Production Deployment

When deploying to production:

1. Add your production URL to **Authorized JavaScript origins**
2. Add your production URL to **Authorized redirect URIs**
3. Update `.env.production` with your Client ID
4. Make sure OAuth consent screen is published (not in Testing mode) if you want all users to access it

