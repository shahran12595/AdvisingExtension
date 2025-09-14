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
      break;
    case 'stopMonitoring':
      stopMonitoring();
      break;
    case 'checkNow':
      checkCourses(request.courses, request.portalUrl);
      break;
    case 'courseCheckComplete':
      handleCourseCheckComplete(request.courseData, request.result);
      sendResponse({ status: 'received' });
      break;
  }
});

function handleCourseCheckComplete(courseData, result) {
  console.log('Course check complete for:', courseData, result);
  
  // Update course status in storage
  updateCourseStatus(courseData.fullCourseId, result);
  
  // If seats are available, send notification
  if (result.available > 0) {
    sendNotification(courseData.fullCourseId, result.available);
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
      courses[courseIndex].status = result.available > 0 ? 'Available' : 'Full';
      courses[courseIndex].available = result.available;
      courses[courseIndex].enrolled = result.enrolled;
      courses[courseIndex].capacity = result.capacity;
      
      // Add to activity log
      const activity = {
        timestamp: new Date().toISOString(),
        course: fullCourseId,
        status: result.available > 0 ? 'Available' : 'Full',
        available: result.available,
        enrolled: result.enrolled,
        capacity: result.capacity,
        message: result.message || `${result.available} seats available`
      };
      
      lastActivity.unshift(activity);
      if (lastActivity.length > 50) {
        lastActivity.splice(50);
      }
      
      await chrome.storage.sync.set({ courses, lastActivity });
      console.log('Updated course status and activity');
    }
  } catch (error) {
    console.error('Error updating course status:', error);
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
  chrome.storage.local.set({
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
  chrome.storage.local.set({ isMonitoring: false });
  
  console.log('Stopped monitoring courses');
}

async function performScheduledCheck() {
  if (!isMonitoring) return;
  
  const data = await chrome.storage.local.get(['monitoringCourses', 'portalUrl']);
  if (data.monitoringCourses && data.portalUrl) {
    checkCourses(data.monitoringCourses, data.portalUrl);
  }
}

async function checkCourses(courses, portalUrl) {
  console.log('Checking courses for seat availability...');
  
  try {
    // Check if we have an active tab with the portal
    const tabs = await chrome.tabs.query({ url: `${portalUrl}*` });
    
    let activeTab = null;
    if (tabs.length > 0) {
      // Use existing tab
      activeTab = tabs[0];
      console.log('Using existing portal tab:', activeTab.id);
    } else {
      // Create new tab to check
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
            console.log('Portal tab loaded');
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      });
    }
    
    for (const course of courses) {
      try {
        console.log(`Checking course: ${course.code}.${course.section}`);
        await checkCourseInTab(activeTab.id, course);
        
        // Add delay between course checks to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error checking course ${course.code}:`, error);
        updateCourseStatus(course.id, 'error');
      }
    }
    
  } catch (error) {
    console.error('Error in checkCourses:', error);
  }
  
  // Notify popup that check is complete
  try {
    chrome.runtime.sendMessage({ action: 'checkComplete' });
  } catch (error) {
    // Popup might be closed, ignore error
  }
}

async function checkCourseInTab(tabId, course) {
  try {
    console.log(`Checking ${course.code}.${course.section} in tab ${tabId}`);
    
    // Force refresh the page first to get latest data
    await chrome.tabs.reload(tabId);
    
    // Wait for page to fully reload
    await new Promise(resolve => {
      const listener = (updatedTabId, info) => {
        if (updatedTabId === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      
      // Fallback timeout in case listener doesn't fire
      setTimeout(resolve, 5000);
    });
    
    // Execute content script to check course
    let result;
    try {
      result = await chrome.tabs.sendMessage(tabId, {
        action: 'checkCourse',
        courseCode: course.code,
        section: course.section
      });
    } catch (error) {
      console.error(`Failed to send message to tab ${tabId}:`, error);
      updateCourseStatus(course.id, 'error', 0, null, null, 'Could not communicate with portal page');
      return;
    }
    
    console.log(`Course check result for ${course.code}.${course.section}:`, result);
    
    if (result && result.success) {
      if (result.available > 0) {
        console.log(`SEAT AVAILABLE! ${course.code}.${course.section}: ${result.available} seats`);
        
        // Show notification
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon128.png',
          title: 'Seat Available!',
          message: `${course.code}.${course.section} has ${result.available} seat(s) available!`
        });
        
        updateCourseStatus(course.id, 'available', result.available, result.enrolled, result.capacity);
      } else {
        console.log(`${course.code}.${course.section}: Full (${result.enrolled}/${result.capacity})`);
        updateCourseStatus(course.id, 'full', 0, result.enrolled, result.capacity);
      }
    } else {
      console.log(`Failed to check ${course.code}.${course.section}:`, result?.message || 'Unknown error');
      updateCourseStatus(course.id, 'error', 0, null, null, result?.message || 'Could not find course');
    }
    
  } catch (error) {
    console.error(`Error checking course in tab:`, error);
    updateCourseStatus(course.id, 'error', 0, null, null, error.message);
  }
}

function updateCourseStatus(courseId, status, available = 0, enrolled = null, capacity = null, errorMessage = null) {
  // Update course status in storage
  chrome.storage.local.get(['courses'], (data) => {
    const courses = data.courses || [];
    const course = courses.find(c => c.id === courseId);
    if (course) {
      course.status = status;
      course.available = available;
      course.enrolled = enrolled;
      course.capacity = capacity;
      course.errorMessage = errorMessage;
      course.lastChecked = Date.now();
      chrome.storage.local.set({ courses: courses });
      
      console.log(`Updated course ${course.code}.${course.section} status to: ${status}${available > 0 ? ` (${available} available)` : enrolled !== null ? ` (${enrolled}/${capacity})` : errorMessage ? ` - ${errorMessage}` : ''}`);
      
      // Notify popup of status update
      try {
        chrome.runtime.sendMessage({
          action: 'courseStatusUpdate',
          courseId: courseId,
          status: status,
          available: available,
          enrolled: enrolled,
          capacity: capacity,
          errorMessage: errorMessage
        });
      } catch (error) {
        // Popup might be closed, ignore error
      }
    }
  });
}

function sendAvailabilityNotification(course, result) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: '🎉 Seat Available!',
    message: `${course.code} Section ${course.section} has ${result.seats} seat(s) available!`,
    priority: 2
  });
  
  // Play notification sound by creating a tab briefly
  chrome.tabs.create({ 
    url: 'data:text/html,<audio autoplay><source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBDuX4PLReC4GMYfN8+SHYB+t" type="audio/wav"></audio>', 
    active: false 
  }).then(tab => {
    setTimeout(() => chrome.tabs.remove(tab.id), 1000);
  });
}

// Function to be injected into the page to check course availability
function checkCourseAvailability(courseCode, section) {
  // This function will be customized based on your university's portal structure
  // Below is a generic implementation that you'll need to adapt
  
  try {
    // Common selectors that might contain course information
    const possibleSelectors = [
      `[data-course-code="${courseCode}"]`,
      `[data-section="${section}"]`,
      '.course-row',
      '.course-item',
      '.class-section',
      'tr[class*="course"]',
      'div[class*="course"]'
    ];
    
    let courseElement = null;
    
    // Try to find the course element
    for (const selector of possibleSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.innerText || element.textContent || '';
        if (text.includes(courseCode) && text.includes(section)) {
          courseElement = element;
          break;
        }
      }
      if (courseElement) break;
    }
    
    if (!courseElement) {
      // Fallback: search entire page for course code and section
      const pageText = document.body.innerText || document.body.textContent || '';
      const courseRegex = new RegExp(`${courseCode}.*?${section}.*?(?:seat|available|full|open|closed)`, 'gi');
      const match = pageText.match(courseRegex);
      
      if (match) {
        const matchText = match[0].toLowerCase();
        const available = !matchText.includes('full') && 
                         !matchText.includes('closed') && 
                         (matchText.includes('open') || matchText.includes('available'));
        
        return {
          available: available,
          seats: available ? 'Unknown' : 0,
          found: true,
          method: 'text_search'
        };
      }
      
      return {
        available: false,
        seats: 0,
        found: false,
        error: 'Course not found on page'
      };
    }
    
    // Extract seat information from the course element
    const elementText = courseElement.innerText || courseElement.textContent || '';
    
    // Common patterns for seat availability
    const seatPatterns = [
      /(\d+)\s*(?:seat|spot|space)s?\s*(?:available|open|remaining)/gi,
      /available:\s*(\d+)/gi,
      /open:\s*(\d+)/gi,
      /seats?:\s*(\d+)/gi,
      /(\d+)\s*\/\s*(\d+)/g  // e.g., "5/25" format
    ];
    
    let seats = 0;
    let available = false;
    
    // Check for "FULL", "CLOSED", "WAITLIST" indicators
    const fullIndicators = /(?:full|closed|waitlist|no\s*seat)/gi;
    const openIndicators = /(?:open|available|seat)/gi;
    
    if (fullIndicators.test(elementText)) {
      available = false;
      seats = 0;
    } else if (openIndicators.test(elementText)) {
      available = true;
      
      // Try to extract actual number of seats
      for (const pattern of seatPatterns) {
        const match = pattern.exec(elementText);
        if (match) {
          seats = parseInt(match[1]) || 1;
          break;
        }
      }
      
      if (seats === 0) seats = 'Unknown';
    }
    
    return {
      available: available,
      seats: seats,
      found: true,
      method: 'element_analysis',
      elementText: elementText.substring(0, 200) // For debugging
    };
    
  } catch (error) {
    return {
      available: false,
      seats: 0,
      found: false,
      error: error.message
    };
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
