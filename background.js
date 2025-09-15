// Background service worker for monitoring courses
let monitoringInterval = null;
let isMonitoring = false;

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Course Seat Monitor installed');
  
  // Create notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Course Seat Monitor',
    message: 'Extension installed! Click the extension icon to start monitoring courses.'
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startMonitoring':
      startMonitoring(request.courses, request.interval, request.portalUrl);
      sendResponse({ status: 'started' });
      break;
    case 'stopMonitoring':
      stopMonitoring();
      sendResponse({ status: 'stopped' });
      break;
    case 'checkNow':
      checkCourses(request.courses, request.portalUrl);
      sendResponse({ status: 'checking' });
      break;
    case 'courseCheckComplete':
      handleCourseCheckComplete(request.courseData, request.result);
      sendResponse({ status: 'received' });
      break;
    default:
      sendResponse({ status: 'unknown_action' });
      break;
  }
  return false; // All responses are synchronous
});

async function handleCourseCheckComplete(courseData, result) {
  console.log('📋 Course check complete for:', courseData, result);
  
  // Get current course status before updating
  const data = await chrome.storage.sync.get(['courses']);
  const courses = data.courses || [];
  const existingCourse = courses.find(c => c.fullCourseId === courseData.fullCourseId);
  const previousStatus = existingCourse ? existingCourse.status : 'Unknown';
  
  console.log(`🔄 Previous status for ${courseData.fullCourseId}: ${previousStatus}`);
  console.log(`🔄 New availability: ${result.available} seats`);
  
  // Update course status in storage
  await updateCourseStatus(courseData.fullCourseId, result);
  
  // Only notify if course changed from Full to Available
  if (previousStatus === 'Full' && result.available > 0) {
    console.log(`🎉 Course ${courseData.fullCourseId} became available! Sending notification...`);
    sendNotification(courseData.fullCourseId, result.available);
  } else if (result.available > 0) {
    console.log(`✅ Course ${courseData.fullCourseId} still available: ${result.available} seats`);
  } else {
    console.log(`❌ Course ${courseData.fullCourseId} is full`);
  }
}

async function updateCourseStatus(fullCourseId, result) {
  try {
    const data = await chrome.storage.sync.get(['courses', 'lastActivity']);
    const courses = data.courses || [];
    const lastActivity = data.lastActivity || [];
    
    // Find and update the course
    const courseIndex = courses.findIndex(c => c.fullCourseId === fullCourseId);
    if (courseIndex !== -1) {
      courses[courseIndex].lastChecked = new Date().toISOString();
      
      // Fix the status logic - check if available > 0, not just if available exists
      const isAvailable = result.available > 0;
      courses[courseIndex].status = isAvailable ? 'Available' : 'Full';
      courses[courseIndex].available = result.available || 0;
      courses[courseIndex].enrolled = result.enrolled;
      courses[courseIndex].capacity = result.capacity;
      
      console.log(`📊 Course status update for ${fullCourseId}:`);
      console.log(`   Available: ${result.available}, Enrolled: ${result.enrolled}, Capacity: ${result.capacity}`);
      console.log(`   Status set to: ${isAvailable ? 'Available' : 'Full'}`);
      
      // Add to activity log
      const activity = {
        timestamp: new Date().toISOString(),
        course: fullCourseId,
        status: isAvailable ? 'Available' : 'Full',
        available: result.available || 0,
        enrolled: result.enrolled,
        capacity: result.capacity,
        message: result.message || `${result.available || 0} seats available`
      };
      
      lastActivity.unshift(activity);
      if (lastActivity.length > 50) {
        lastActivity.splice(50);
      }
      
      await chrome.storage.sync.set({ courses, lastActivity });
      console.log('✅ Updated course status and activity');
      
      // Notify popup of course status update
      try {
        chrome.runtime.sendMessage({
          action: 'courseStatusUpdate',
          courseId: fullCourseId,
          status: isAvailable ? 'Available' : 'Full',
          available: result.available || 0,
          enrolled: result.enrolled,
          capacity: result.capacity
        });
        
        chrome.runtime.sendMessage({
          action: 'activityUpdate'
        });
      } catch (error) {
        // Popup might be closed, ignore error
        console.log('Could not send message to popup (popup may be closed)');
      }
    }
  } catch (error) {
    console.error('❌ Error updating course status:', error);
  }
}

// Listen for alarms (for periodic checking)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'courseCheck') {
    performScheduledCheck();
  }
});

function startMonitoring(courses, interval, portalUrl) {
  isMonitoring = true;
  
  // Clear existing alarm
  chrome.alarms.clear('courseCheck');
  
  // Create new alarm for periodic checking (convert seconds to minutes for alarm API)
  const intervalMinutes = interval / 60; // Convert seconds to minutes
  chrome.alarms.create('courseCheck', {
    delayInMinutes: intervalMinutes,
    periodInMinutes: intervalMinutes
  });
  
  // Store monitoring data
  chrome.storage.sync.set({
    monitoringCourses: courses,
    monitoringInterval: interval,
    portalUrl: portalUrl,
    isMonitoring: true
  });
  
  console.log(`Started monitoring ${courses.length} courses with ${interval} second intervals`);
  
  // Perform initial check
  checkCourses(courses, portalUrl);
}

function stopMonitoring() {
  isMonitoring = false;
  
  // Clear alarm
  chrome.alarms.clear('courseCheck');
  
  // Update storage
  chrome.storage.sync.set({ isMonitoring: false });
  
  console.log('Stopped monitoring courses');
}

async function performScheduledCheck() {
  if (!isMonitoring) return;
  
  const data = await chrome.storage.sync.get(['monitoringCourses', 'portalUrl']);
  if (data.monitoringCourses && data.portalUrl) {
    checkCourses(data.monitoringCourses, data.portalUrl);
  }
}

async function checkCourses(courses, portalUrl) {
  console.log('🔍 Starting course check for', courses.length, 'courses');
  
  try {
    // Check if we have an active tab with the portal
    const tabs = await chrome.tabs.query({ url: `${portalUrl}*` });
    
    let activeTab = null;
    if (tabs.length > 0) {
      // Use existing tab
      activeTab = tabs[0];
      console.log('Using existing portal tab:', activeTab.id);
      // Refresh the tab to get latest data
      await chrome.tabs.reload(activeTab.id);
      
      // Wait for reload to complete
      await new Promise(resolve => {
        const listener = (tabId, info) => {
          if (tabId === activeTab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
        setTimeout(resolve, 5000); // Fallback timeout
      });
    } else {
      // Create new tab
      console.log('Creating new portal tab...');
      activeTab = await chrome.tabs.create({ 
        url: portalUrl, 
        active: false 
      });
      
      // Wait for tab to load
      await new Promise(resolve => {
        const listener = (tabId, info) => {
          if (tabId === activeTab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
        setTimeout(resolve, 10000); // Longer timeout for initial load
      });
    }
    
    console.log('Portal tab ready, checking courses...');
    
    // Check each course
    for (const course of courses) {
      try {
        console.log(`Checking course: ${course.fullCourseId}`);
        
        // Send message to content script
        const response = await chrome.tabs.sendMessage(activeTab.id, {
          action: 'checkCourse',
          courseCode: course.code,
          section: course.section
        });
        
        console.log(`Content script response:`, response);
        
        // The actual result will come via the courseCheckComplete message
        // which is handled by handleCourseCheckComplete function
        
      } catch (error) {
        console.error(`Error checking course ${course.fullCourseId}:`, error);
        
        // Update with error status
        await updateCourseStatus(course.fullCourseId, {
          found: false,
          available: 0,
          enrolled: null,
          capacity: null,
          message: `Error: ${error.message}`
        });
      }
      
      // Small delay between course checks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('Error in checkCourses:', error);
  }
}

// Send notification when seats become available
function sendNotification(courseId, availableSeats) {
  const message = availableSeats === 'Unknown' ? 
    `Seats are now available!` : 
    `${availableSeats} seat(s) available!`;
    
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: `Course Available: ${courseId}`,
    message: message,
    priority: 2
  });
  
  console.log(`Notification sent for ${courseId}: ${message}`);
}
