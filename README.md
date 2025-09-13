# University Course Seat Monitor - Chrome Extension

A Chrome extension that monitors your university's advising portal for available course seats and notifies you when seats become available in the courses you're tracking.

## Features

- 🎓 **Course Monitoring**: Add courses with specific sections to monitor
- 🔄 **Automatic Refresh**: Continuously checks for seat availability at customizable intervals
- 🔔 **Smart Notifications**: Get instant notifications when seats become available
- 📊 **Real-time Status**: See current seat availability status for all monitored courses
- 🎨 **Modern UI**: Beautiful, responsive interface with gradient design
- ⚙️ **Customizable Settings**: Adjust check intervals and portal URL

## Installation

1. **Download the Extension**
   - Clone or download this repository to your local machine

2. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the extension folder
   - The extension icon should appear in your Chrome toolbar

3. **Set Up Your Portal**
   - Click the extension icon to open the popup
   - Enter your university's advising portal URL
   - Set your preferred check interval (in minutes)

## Usage

### Adding Courses to Monitor

1. Click the extension icon in your Chrome toolbar
2. Fill in the course information:
   - **Course Code**: e.g., CSE101, MATH205, ENG110
   - **Course Name**: Optional, for easier identification
   - **Section**: e.g., 01, 02, A, B, etc.
3. Click "Add Course"

### Starting Monitoring

1. Make sure you have added at least one course
2. Enter your university's advising portal URL
3. Click "Start Monitoring"
4. The extension will automatically check for seat availability at the specified interval

### Managing Courses

- **View Status**: Each course shows its current status (Available, Full, Checking, Error)
- **Remove Courses**: Click the "×" button next to any course to remove it
- **Manual Check**: Click "Check Now" to immediately check all courses

## How It Works

The extension uses several methods to detect course availability:

1. **Table Analysis**: Searches for course information in HTML tables
2. **Container Detection**: Looks for course data in divs and other containers
3. **Text Pattern Matching**: Uses regex patterns to find course codes and availability status
4. **Smart Notifications**: Only notifies when status changes from "Full" to "Available"

## Customization

### Adapting to Your University's Portal

The extension is designed to work with most university portals, but you may need to customize the content script (`content.js`) for your specific portal:

1. **Identify Course Elements**: Use browser developer tools to inspect how courses are displayed
2. **Update Selectors**: Modify the CSS selectors in `content.js` to match your portal's structure
3. **Adjust Text Patterns**: Update regex patterns to match your portal's text format

### Common Portal Patterns

The extension recognizes these common patterns:
- Course codes: CSE101, MATH205, ENG110A
- Sections: 01, 02, A, B, Lab01
- Status indicators: "Open", "Available", "Full", "Closed", "Waitlist"
- Seat counts: "5 seats available", "Available: 3", "15/25"

## Settings

- **Check Interval**: How often to check for updates (1-60 minutes)
- **Portal URL**: Your university's course registration/advising portal
- **Notification Preferences**: Managed through Chrome's notification settings

## Troubleshooting

### Extension Not Working?

1. **Check Portal URL**: Ensure you've entered the correct URL for your university's portal
2. **Course Not Found**: Verify the course code and section format matches what's shown on the portal
3. **No Notifications**: Check Chrome's notification permissions for the extension
4. **Permission Issues**: Make sure the extension has permission to access your university's domain

### Common Issues

- **"Course not found"**: The course might not be displayed on the current page, or the format doesn't match
- **"Error" status**: There might be a network issue or the portal structure has changed
- **No notifications**: Check that notifications are enabled in Chrome settings

## Privacy & Security

- **Local Storage**: All course data is stored locally in your browser
- **No Data Collection**: The extension doesn't send any data to external servers
- **Portal Access**: Only accesses pages you explicitly visit or configure
- **Minimal Permissions**: Requests only necessary permissions for functionality

## Development

### File Structure

```
AdvisingExtension/
├── manifest.json         # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js             # Popup functionality
├── background.js        # Background service worker
├── content.js           # Content script for portal interaction
├── icons/               # Extension icons
└── README.md           # This file
```

### Key Technologies

- **Manifest V3**: Latest Chrome extension format
- **Service Worker**: Background processing for monitoring
- **Content Scripts**: Interact with university portal pages
- **Chrome Storage API**: Persist user data locally
- **Chrome Notifications API**: Alert users of available seats

## Contributing

Feel free to contribute improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with your university's portal
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter issues or need help adapting the extension for your university's portal, please:

1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Create an issue with details about your university's portal structure

---

**Note**: This extension is designed to help students monitor course availability. Please use it responsibly and in accordance with your university's terms of service and policies regarding automated access to their systems.
