# Fix 500 Error on Root Route (/)

## The Problem
Your application is running in **production mode** with debug disabled, which hides error details.

## Quick Fix Steps

### Step 1: Update Your .env File

Open `.env` file in the project root and make sure these settings are correct:

```env
APP_NAME="WESMG System"
APP_ENV=local
APP_KEY=base64:YOUR_KEY_HERE
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

# Database Configuration (for Laragon)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=capstone_project2
DB_USERNAME=root
DB_PASSWORD=
```

### Step 2: Clear All Caches

Run these commands in PowerShell:

```powershell
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear
```

### Step 3: Check Database Connection

Make sure:
1. Laragon is running
2. MySQL is started in Laragon
3. Your database `capstone_project2` exists

Test connection:
```powershell
php artisan tinker
# Then type: DB::connection()->getPdo();
# If it works, you'll see connection info. If not, you'll see an error.
```

### Step 4: Check for Missing Dependencies

```powershell
composer install
npm install
npm run build
```

### Step 5: Check the Actual Error

After setting `APP_DEBUG=true`, refresh the page and you'll see the exact error message.

## Common Issues

### Issue 1: Database Connection Failed
**Error:** `SQLSTATE[HY000] [2002] php_network_getaddresses: getaddrinfo for mysql failed`

**Fix:**
- Make sure MySQL is running in Laragon
- Check `.env` has `DB_HOST=127.0.0.1` (not `mysql`)
- Verify database name matches your actual database

### Issue 2: Missing APP_KEY
**Error:** `No application encryption key has been specified`

**Fix:**
```powershell
php artisan key:generate
```

### Issue 3: Storage Link Missing
**Error:** Files not found

**Fix:**
```powershell
php artisan storage:link
```

### Issue 4: Session/Cache Driver Issues
If using database for sessions/cache, make sure tables exist:

```powershell
php artisan migrate
```

## After Fixing

1. Set `APP_DEBUG=true` in `.env`
2. Clear caches: `php artisan optimize:clear`
3. Refresh browser
4. You should now see the detailed error page instead of 500

## Still Getting 500?

1. Check `storage/logs/laravel.log` for the latest error
2. Run: `.\debug-500-error.ps1`
3. Check browser console (F12) for JavaScript errors
4. Make sure your server is running: `php artisan serve` or Laragon is active

