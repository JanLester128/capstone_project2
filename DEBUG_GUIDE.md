# How to Debug 500 Errors in Local Development

## Step 1: Enable Debug Mode

1. Open your `.env` file in the project root
2. Find the line `APP_DEBUG=false` and change it to:
   ```
   APP_DEBUG=true
   ```
3. Also ensure you're in local environment:
   ```
   APP_ENV=local
   ```

## Step 2: Clear Configuration Cache

After changing `.env`, run these commands in your terminal:

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

## Step 3: View Errors

### Option A: Browser Error Page
When `APP_DEBUG=true`, Laravel will show a detailed error page in your browser when you visit the page that's causing the 500 error.

### Option B: Check Laravel Logs
View the latest errors in the log file:

**Windows PowerShell:**
```powershell
Get-Content storage\logs\laravel.log -Tail 50
```

**Or open the file directly:**
- Navigate to: `storage/logs/laravel.log`
- Scroll to the bottom to see the most recent errors

### Option C: Browser Developer Console
1. Open your browser (Chrome/Firefox/Edge)
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Look for red error messages
5. Go to the **Network** tab
6. Refresh the page
7. Click on the failed request (usually shows in red)
8. Check the **Response** tab to see the error details

## Step 4: Common Issues and Fixes

### Database Connection Error
If you see database connection errors:
- Make sure your database server is running (MySQL/MariaDB)
- Check your `.env` file has correct database credentials:
  ```
  DB_CONNECTION=mysql
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_DATABASE=your_database_name
  DB_USERNAME=root
  DB_PASSWORD=your_password
  ```

### Missing Dependencies
Run:
```bash
composer install
npm install
```

### Clear All Caches
```bash
php artisan optimize:clear
```

## Step 5: Test the Faculty Page

1. Make sure your server is running:
   ```bash
   php artisan serve
   ```
   Or if using Laragon, make sure it's running

2. Visit: `http://127.0.0.1:8000/registrar/faculty`

3. If you see an error page, it will show:
   - The exact error message
   - The file and line number where it occurred
   - A stack trace

## Quick Debug Commands

```bash
# Check if routes are working
php artisan route:list --name=faculty

# Test database connection
php artisan tinker
# Then in tinker: DB::connection()->getPdo();

# Check for syntax errors
php artisan about

# View environment
php artisan env
```

## If You Still Can't See Errors

1. Check `storage/logs/laravel.log` file permissions
2. Make sure `storage/logs/` directory is writable
3. Try accessing the page in an incognito/private browser window
4. Check your browser's console for JavaScript errors

