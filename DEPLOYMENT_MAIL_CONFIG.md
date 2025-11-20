# Mail Configuration for Laravel Cloud Deployment

## Important: .env File is NOT Pushed to Git

The `.env` file is in `.gitignore` (line 3), which means it **will NOT be pushed** to your repository. You must configure environment variables directly in Laravel Cloud.

## Required Environment Variables

In your **Laravel Cloud Dashboard**, go to your project's **Environment Variables** section and add/update the following:

### ⚠️ CRITICAL: Application URL

**This must be set first!** Without this, email links will point to localhost instead of your deployed site.

```env
APP_URL=https://onstsshs-main-h0918r.laravel.cloud
```

**Important**: 
- Use `https://` (not `http://`)
- Do NOT include a trailing slash
- This URL is used in all email links (login buttons, password reset links, etc.)

## Required Environment Variables for Email

### Basic SMTP Configuration (Recommended)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="ONSTS Student Management System"
```

### Alternative: Using Gmail App Password

If using Gmail:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated app password as `MAIL_PASSWORD`

### Alternative: Using Other Mail Services

#### Mailgun
```env
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=your-domain.mailgun.org
MAILGUN_SECRET=your-mailgun-secret
MAILGUN_ENDPOINT=api.mailgun.net
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="ONSTS Student Management System"
```

#### Postmark
```env
MAIL_MAILER=postmark
POSTMARK_TOKEN=your-postmark-token
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="ONSTS Student Management System"
```

#### SendGrid
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="ONSTS Student Management System"
```

## Current Default Behavior

Based on `config/mail.php` line 17:
- **Default**: `env('MAIL_MAILER', 'log')` 
- If `MAIL_MAILER` is not set, it defaults to `'log'`
- **'log' driver** = Emails are written to log files instead of being sent
- This is why emails weren't sending on deployment!

## Steps to Fix Email on Laravel Cloud

1. **Log into Laravel Cloud Dashboard**
2. **Navigate to your project**
3. **Go to "Environment Variables" or "Settings" → "Environment"**
4. **Add/Update the mail configuration variables** (see above)
5. **Save the changes**
6. **Redeploy your application** (if required by Laravel Cloud)

## Testing Email Configuration

After setting the environment variables, test by:
1. Creating a new faculty member in the system
2. Check if the email is sent (not just logged)
3. Check Laravel Cloud logs if email fails

## Verification Checklist

- [ ] **`APP_URL` is set to `https://onstsshs-main-h0918r.laravel.cloud`** (CRITICAL!)
- [ ] `MAIL_MAILER` is set (NOT 'log' or 'array')
- [ ] `MAIL_HOST` is set (if using SMTP)
- [ ] `MAIL_USERNAME` is set (if using SMTP)
- [ ] `MAIL_PASSWORD` is set (if using SMTP)
- [ ] `MAIL_ENCRYPTION` is set (usually 'tls' for port 587)
- [ ] `MAIL_FROM_ADDRESS` is set
- [ ] `MAIL_FROM_NAME` is set
- [ ] Environment variables are saved in Laravel Cloud
- [ ] Application has been redeployed (if required by Laravel Cloud)

## Common Issues

### Issue: Emails still not sending
**Solution**: Check Laravel Cloud logs for mail errors. Verify SMTP credentials are correct.

### Issue: "Connection timeout" errors
**Solution**: Check if Laravel Cloud allows outbound SMTP connections. Some hosting providers block port 25/587. Consider using Mailgun, Postmark, or SendGrid instead.

### Issue: "Authentication failed" errors
**Solution**: 
- For Gmail: Use App Password, not regular password
- Verify username/password are correct
- Check if 2FA is enabled (required for Gmail App Passwords)

### Issue: Email links point to localhost (127.0.0.1:8000)
**Solution**: 
- **Set `APP_URL=https://onstsshs-main-h0918r.laravel.cloud` in Laravel Cloud environment variables**
- Make sure there's no trailing slash
- Redeploy the application after setting APP_URL
- The email templates now use `config('app.url')` which reads from APP_URL

## Notes

- **Never commit `.env` to git** - it contains sensitive credentials
- **`.env.example`** is just a template - it doesn't contain real values
- **Laravel Cloud** manages environment variables separately from your code repository
- The application code already has proper error handling and logging for mail failures (see `RegistrarController::storeFaculty`)

