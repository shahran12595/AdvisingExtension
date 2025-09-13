# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select this folder
4. Pin the extension to your toolbar

### Step 2: Test with Sample Portal
1. Open `test-portal.html` in Chrome (double-click the file)
2. Copy the URL from the address bar
3. Click the extension icon and paste the URL in "Portal URL"
4. Set check interval to 1 minute for testing

### Step 3: Add Test Courses
Add these courses from the test portal:
- **Course Code:** CSE101, **Section:** 01 (Available)
- **Course Code:** CSE101, **Section:** 02 (Full)
- **Course Code:** MATH205, **Section:** A (Available)

### Step 4: Start Monitoring
1. Click "Start Monitoring"
2. Click "Check Now" to test immediately
3. Watch the status updates

### Step 5: Test Notifications
1. On the test portal page, click "Simulate Status Change"
2. This changes CSE101-01 from Available to Full
3. Your extension should detect this change

## 🎓 Using with Your University Portal

### Find Your Portal Information
1. Log into your university's student portal
2. Navigate to course registration/search
3. Copy the URL (e.g., `https://portal.youruni.edu/registration`)
4. Note the format of course codes and sections

### Common Course Formats
- **Course Codes:** CSE101, MATH 205, ENG-110, etc.
- **Sections:** 01, 02, A, B, L01, Lab-01, etc.
- **Status:** Open, Available, Full, Closed, Waitlist

### Testing Tips
1. Start with one course you know is available
2. Add one course you know is full
3. Test "Check Now" before starting monitoring
4. If courses aren't found, check the browser console for errors

## 🔧 Troubleshooting

### "Course not found" Error
- Check course code format (spacing, case)
- Verify section format matches portal exactly
- Make sure you're on the course listing page

### No Notifications
- Check Chrome notification permissions
- Test with the test portal first
- Look for notification icon in system tray

### Extension Won't Load
- Make sure all files are in the folder
- Check Chrome developer console for errors
- Try reloading the extension

## 📞 Need Help?

1. **Read the guides:** README.md, SETUP.md, DEVELOPMENT.md
2. **Check console:** Open DevTools and look for error messages
3. **Test portal:** Use test-portal.html to verify functionality
4. **University specific:** Check DEVELOPMENT.md for customization

## 🎯 What's Next?

1. **Customize for your university:** Update selectors in content.js
2. **Add proper icons:** Replace placeholder icons with PNG files
3. **Fine-tune settings:** Adjust check intervals and keywords
4. **Share with classmates:** Help others set up the extension

---

**Remember:** Use this extension responsibly and respect your university's terms of service. Happy course hunting! 🎓
