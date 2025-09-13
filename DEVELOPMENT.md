# Development and Testing Guide

## Testing the Extension

### 1. Local Testing Setup
1. Load the extension in Chrome (see SETUP.md)
2. Open Chrome DevTools (F12)
3. Check the Console for any error messages
4. Test with your university's portal

### 2. Testing Course Detection
```javascript
// Open your university portal in Chrome
// Open DevTools Console
// Run this test script:

// Test if content script loaded
console.log('Testing course detection...');

// Test course availability check
chrome.runtime.sendMessage({
  action: 'checkCourseAvailability',
  courseCode: 'CSE101',  // Replace with actual course
  section: '01'          // Replace with actual section
}, (response) => {
  console.log('Course check result:', response);
});
```

### 3. Background Script Testing
```javascript
// Test background script communication
chrome.runtime.sendMessage({
  action: 'checkNow',
  courses: [{
    id: 'test1',
    code: 'CSE101',
    section: '01',
    name: 'Test Course'
  }],
  portalUrl: 'https://your-university-portal.edu'
});
```

## Debugging Common Issues

### Issue: "Course not found"
**Possible Causes:**
- Course code format doesn't match portal
- Section format is incorrect
- Course not visible on current page
- Portal uses dynamic loading

**Debugging Steps:**
1. Open portal in Chrome
2. Navigate to course search/listing page
3. Open DevTools and run:
```javascript
// Find all text containing your course code
const courseCode = 'CSE101'; // Replace with your course
const allText = document.body.innerText;
const regex = new RegExp(courseCode, 'gi');
const matches = allText.match(regex);
console.log('Course code found:', matches?.length || 0, 'times');

// Find course-related elements
const elements = document.querySelectorAll('*');
let courseElements = [];
elements.forEach(el => {
  if (el.innerText && el.innerText.includes(courseCode)) {
    courseElements.push(el);
  }
});
console.log('Elements containing course code:', courseElements);
```

### Issue: Status Not Updating
**Check:**
1. Background script permissions
2. Alarm creation success
3. Storage persistence

**Debug Commands:**
```javascript
// Check stored data
chrome.storage.local.get(null, (data) => {
  console.log('Stored data:', data);
});

// Check active alarms
chrome.alarms.getAll((alarms) => {
  console.log('Active alarms:', alarms);
});
```

### Issue: No Notifications
**Check:**
1. Chrome notification permissions
2. Notification creation success
3. System notification settings

**Test Notification:**
```javascript
// Test notification manually
chrome.notifications.create({
  type: 'basic',
  iconUrl: 'icons/icon48.png',
  title: 'Test Notification',
  message: 'This is a test notification'
});
```

## Customizing for Your University

### 1. Analyze Portal Structure
Use these DevTools commands to understand your portal:

```javascript
// Find all tables (common for course listings)
const tables = document.querySelectorAll('table');
console.log('Found', tables.length, 'tables');
tables.forEach((table, i) => {
  console.log(`Table ${i}:`, table.innerText.substring(0, 200));
});

// Find elements with course-related classes/IDs
const courseElements = document.querySelectorAll('[class*="course"], [id*="course"], [class*="class"], [id*="class"]');
console.log('Course-related elements:', courseElements);

// Search for common status indicators
const statusWords = ['open', 'closed', 'full', 'available', 'waitlist'];
statusWords.forEach(word => {
  const regex = new RegExp(word, 'gi');
  const matches = document.body.innerText.match(regex);
  console.log(`"${word}" found:`, matches?.length || 0, 'times');
});
```

### 2. Update Content Script
Based on your analysis, modify `content.js`:

1. **Add Portal-Specific Selectors:**
```javascript
// Add to checkTableForCourse function
const portalSpecificSelectors = [
  'your-university-specific-selector',
  '.course-row-custom',
  '#course-table-custom tr'
];
```

2. **Update Status Keywords:**
```javascript
// Modify analyzeContainerText function
const customStatusIndicators = {
  available: ['your-portal-open-text', 'available-seats'],
  full: ['your-portal-full-text', 'no-availability']
};
```

### 3. Test Changes
1. Reload the extension
2. Test with known available and full courses
3. Check console for debug output
4. Verify notifications work

## Performance Optimization

### 1. Reduce Server Load
- Minimum 2-3 minute intervals
- Maximum 10-15 courses monitored
- Implement smart refresh (only check changed pages)

### 2. Improve Detection Accuracy
- Cache portal structure analysis
- Learn from successful detections
- Implement confidence scoring

### 3. Error Handling
- Retry failed checks with backoff
- Detect portal changes/maintenance
- Graceful degradation

## Production Considerations

### 1. University Compliance
- Check university's terms of service
- Respect rate limiting
- Consider contacting IT department

### 2. User Experience
- Clear error messages
- Helpful setup instructions
- Responsive interface

### 3. Maintenance
- Monitor for portal changes
- Update selectors as needed
- Collect user feedback

## Extension Packaging

### For Distribution:
1. Remove development files (this guide, test scripts)
2. Optimize icons (proper PNG files)
3. Test thoroughly with multiple courses
4. Create user documentation
5. Consider publishing to Chrome Web Store

### Version Control:
- Use semantic versioning (1.0.0, 1.1.0, etc.)
- Update manifest.json version
- Document changes in release notes

---

For more help, check the browser console for error messages or create an issue with details about your university's portal structure.
