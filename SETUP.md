# Installation and Setup Guide

## Prerequisites
- Google Chrome browser
- Access to your university's online advising/course registration portal

## Step-by-Step Installation

### 1. Prepare the Extension Files
1. Download or clone this repository to your computer
2. Make sure all files are in a single folder named `AdvisingExtension`

### 2. Enable Chrome Developer Mode
1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Toggle on "Developer mode" in the top-right corner

### 3. Load the Extension
1. Click "Load unpacked" button
2. Navigate to and select the `AdvisingExtension` folder
3. The extension should now appear in your extensions list
4. Pin the extension to your toolbar for easy access

### 4. Configure for Your University

#### Find Your Portal URL
1. Log into your university's student portal
2. Navigate to the course registration/class search page
3. Copy the URL (e.g., `https://portal.youruni.edu/registration`)

#### Set Up the Extension
1. Click the extension icon in your Chrome toolbar
2. Enter your portal URL in the "Advising Portal URL" field
3. Set your preferred check interval (recommended: 5-10 minutes)

### 5. Add Courses to Monitor
1. Find the courses you want to monitor on your university portal
2. Note the exact course code format (e.g., "CSE 101" vs "CSE101")
3. Note the section format (e.g., "01", "A", "Lab-01")
4. Add each course using the extension popup

## University-Specific Setup

### Common Portal Types

#### Banner/Self-Service Systems
- URL usually contains "ssb" or "banner"
- Course codes typically: "SUBJ 1234" format
- Sections usually: "001", "002", "L01" format

#### PeopleSoft Systems
- URL usually contains "peoplesoft" or "ps"
- Course codes typically: "SUBJ1234" format
- Sections usually: "A", "B", "01" format

#### Custom University Systems
- Varies by institution
- Check your portal's course search page for formatting

### Testing the Setup
1. Add one test course first
2. Click "Check Now" to verify it can find the course
3. Check the status - it should show "Available", "Full", or "Checking"
4. If it shows "Error" or "Course not found", the format may need adjustment

## Customization for Your Portal

If the extension doesn't work immediately, you may need to customize it:

### 1. Inspect Your Portal Structure
1. Go to your university's course search page
2. Right-click on a course entry and select "Inspect"
3. Look for patterns in the HTML structure

### 2. Common Adjustments Needed
- Course code format (spaces, case sensitivity)
- Section format
- Status indicator text ("Open" vs "Available" vs "Not Full")
- Seat count format

### 3. Getting Help
If you need help customizing for your specific portal:
1. Take screenshots of your portal's course listing
2. Note the exact URL structure
3. Check the browser console for any error messages
4. Contact support with these details

## Troubleshooting

### Extension Won't Load
- Make sure Developer mode is enabled
- Check that all files are in the extension folder
- Try refreshing the extensions page

### Can't Find Courses
- Verify course code and section format exactly match the portal
- Check that you're on the correct page URL
- Try different course status (search for both available and full courses)

### No Notifications
- Check Chrome notification permissions
- Look for the extension in Chrome Settings > Privacy > Notifications
- Make sure your computer's notification settings allow Chrome notifications

### Portal Access Issues
- Make sure you're logged into your university portal
- Some portals require you to be on the course search page
- Check if your university blocks automated access

## Best Practices

### Responsible Usage
- Don't set check intervals too frequently (minimum 2-3 minutes)
- Monitor only courses you actually plan to register for
- Be aware of your university's policies on automated access

### Optimal Settings
- **Check Interval**: 5-10 minutes for popular courses, 15-30 minutes for others
- **Course Limit**: Monitor 5-10 courses maximum for best performance
- **Browser**: Keep Chrome running for continuous monitoring

### Security Notes
- All data is stored locally in your browser
- The extension only accesses pages you configure
- No personal information is transmitted externally

## Advanced Configuration

### Multiple Portals
If your university uses different portals for different functions:
1. You may need to adjust the portal URL as needed
2. Some universities have separate systems for course search vs registration

### Scheduling
- The extension works best when Chrome is running
- Consider your computer's sleep/hibernate settings
- Mobile Chrome doesn't support extensions

### Backup Your Settings
Your course list is stored in Chrome's local storage:
- Export/import not currently supported
- Settings are tied to your Chrome profile
- Consider keeping a manual list of monitored courses

---

For additional help or questions, refer to the main README.md file or create an issue in the project repository.
