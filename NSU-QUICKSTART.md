# 🎓 NSU Course Seat Monitor - Quick Setup Guide

## ⚡ **Optimized for North South University**

This Chrome extension is specifically configured for NSU's advising portal with **3-second refresh intervals** for super fast course monitoring!

### 🚀 **Quick Setup (2 Minutes)**

1. **Install Extension**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → Select the `AdvisingExtension` folder
   - Pin the extension to your toolbar

2. **Test First** (Recommended)
   - Open `nsu-test-portal.html` in Chrome
   - Use this URL in extension settings to test functionality
   - Add test courses like `CSE498R` section `11` or `EEE111` section `3`

3. **Use with Real NSU Portal**
   - Portal URL is pre-configured: `https://rds3.northsouth.edu/students/advising`
   - Check interval is set to **3 seconds** for instant notifications
   - Add your courses in NSU format (e.g., `CSE498R` section `11`)

### 📝 **Adding Courses**

**NSU Format Examples:**
- **Course Code:** `CSE498R`, **Section:** `11`
- **Course Code:** `EEE111`, **Section:** `2`
- **Course Code:** `MAT120`, **Section:** `5`

**What the extension detects:**
- `CSE498R.11    39(45)` = 6 seats available (45 capacity - 39 enrolled = 6 available)
- `EEE111.2    35(35)` = Full (35 capacity - 35 enrolled = 0 available)
- `MAT120.5    30(45)` = 15 seats available (45 capacity - 30 enrolled = 15 available)

### ⚡ **Super Fast Monitoring**

- **3-second intervals** = Almost instant notifications!
- **Smart detection** for NSU's enrolled(capacity) format
- **Immediate alerts** when enrolled count decreases (= seats open up!)

### 🔔 **Getting Notifications**

1. Extension detects format like `39(45)`, `35(35)`, etc. (enrolled/capacity)
2. When enrollment decreases: `45(45)` → `44(45)` = 1 seat opens up → 🎉 **NOTIFICATION!**
3. When enrollment increases: `44(45)` → `45(45)` = seat taken (no notification)
4. Click notification to quickly go register!

### 🧪 **Testing Steps**

1. Open `nsu-test-portal.html`
2. Add `CSE498R` section `14` (shows as full: 45(45))
3. Click "Start Monitoring"
4. Click "Simulate Seat Change" button (changes to 44(45) = 1 seat available)
5. Watch for instant notification! 🎉

### ⚠️ **Important Notes**

- **Keep Chrome running** for continuous monitoring
- **Log into NSU portal** first, then start monitoring
- **Respect the servers** - 3 seconds is already very fast
- **Maximum 5-10 courses** recommended for best performance

### 🎯 **Pro Tips**

1. **Pre-login:** Always log into NSU portal before starting monitoring
2. **Priority courses:** Monitor only courses you absolutely need
3. **Quick action:** Have registration page ready in another tab
4. **Backup plan:** Keep manual checking as backup

---

**Ready to never miss a seat again? Start monitoring! 🚀**
