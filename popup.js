// Popup script for managing courses and settings
document.addEventListener('DOMContentLoaded', function() {
  const addCourseBtn = document.getElementById('add-course');
  const courseSectionInput = document.getElementById('course-section');
  const courseList = document.getElementById('course-list');
  const toggleMonitoringBtn = document.getElementById('toggle-monitoring');
  const refreshNowBtn = document.getElementById('refresh-now');
  const checkIntervalInput = document.getElementById('check-interval');
  const portalUrlInput = document.getElementById('portal-url');
  const statusMessage = document.getElementById('status-message');
  const activityLog = document.getElementById('activity-log');
  const clearActivityBtn = document.getElementById('clear-activity');

  let isMonitoring = false;
  let courses = [];
  let activityHistory = [];

  // Load saved data
  loadData();
  loadActivityHistory();

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'courseStatusUpdate') {
      // Update course status in real-time
      const course = courses.find(c => c.fullCourseId === message.courseId);
      if (course) {
        course.status = message.status;
        course.available = message.available;
        course.enrolled = message.enrolled;
        course.capacity = message.capacity;
        course.lastChecked = new Date().toISOString();
        displayCourses();
        saveCourses();
      }
    } else if (message.action === 'activityUpdate') {
      // Reload activity history when background script updates it
      loadActivityHistory();
    }
  });

  // Event listeners
  addCourseBtn.addEventListener('click', addCourse);
  toggleMonitoringBtn.addEventListener('click', toggleMonitoring);
  refreshNowBtn.addEventListener('click', refreshNow);
  checkIntervalInput.addEventListener('change', saveSettings);
  portalUrlInput.addEventListener('change', saveSettings);
  clearActivityBtn.addEventListener('click', clearActivityLog);

  // Listen for updates from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'courseStatusUpdate' || message.action === 'activityUpdate') {
      // Reload data when course status changes
      loadData();
      loadActivityHistory();
    }
  });

  // Allow Enter key to add course
  courseSectionInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addCourse();
    }
  });

  function addCourse() {
    const courseSection = courseSectionInput.value.trim();

    if (!courseSection) {
      showMessage('Please enter course code with section (e.g., CSE498R.11)', 'error');
      return;
    }

    // Parse course code and section from input like "CSE498R.11" or "EEE111.4"
    const match = courseSection.match(/^([A-Z]+\d+)\.(\d+)$/i);
    if (!match) {
      showMessage('Invalid format. Use format like CSE498R.11 or EEE111.4', 'error');
      return;
    }

    const code = match[1].toUpperCase();
    const section = match[2];
    const fullCourseId = `${code}.${section}`;

    // Check if course already exists
    const exists = courses.some(course => 
      course.fullCourseId === fullCourseId
    );

    if (exists) {
      showMessage('This course and section is already being monitored', 'error');
      return;
    }

    const course = {
      fullCourseId: fullCourseId,
      code: code,
      section: section,
      status: 'Checking',
      available: 0,
      enrolled: null,
      capacity: null,
      lastChecked: null
    };

    courses.push(course);
    saveCourses();
    displayCourses();
    
    // Clear input
    courseSectionInput.value = '';
    
    showMessage('Course added successfully!', 'success');
  }

  function removeCourse(fullCourseId) {
    courses = courses.filter(course => course.fullCourseId !== fullCourseId);
    saveCourses();
    displayCourses();
    showMessage('Course removed', 'info');
  }

  function displayCourses() {
    if (courses.length === 0) {
      courseList.innerHTML = '<p style="text-align: center; opacity: 0.7; font-style: italic;">No courses added yet</p>';
      return;
    }

    courseList.innerHTML = courses.map(course => {
      let statusText = course.status || 'Unknown';
      let statusDetail = '';
      
      if (course.status === 'Available' && course.available > 0) {
        statusDetail = `(${course.available} seat${course.available > 1 ? 's' : ''} available)`;
      } else if (course.status === 'Full' && course.enrolled !== null && course.capacity !== null) {
        statusDetail = `(${course.enrolled}/${course.capacity})`;
      } else if (course.status === 'Checking') {
        statusDetail = '';
        statusText = 'CHECKING';
      }
      
      return `
        <div class="course-item">
          <div class="course-info">
            <div class="course-title">${course.fullCourseId}</div>
            ${course.lastChecked ? `<div class="course-section">Last checked: ${new Date(course.lastChecked).toLocaleTimeString()}</div>` : ''}
            ${statusDetail ? `<div class="course-section">${statusDetail}</div>` : ''}
          </div>
          <div>
            <span class="status ${(course.status || '').toLowerCase()}">${statusText}</span>
            <button class="delete-btn" data-course-id="${course.fullCourseId}">×</button>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        removeCourse(this.dataset.courseId);
      });
    });
  }

  function toggleMonitoring() {
    isMonitoring = !isMonitoring;
    
    if (isMonitoring) {
      if (courses.length === 0) {
        showMessage('Please add courses to monitor first', 'error');
        isMonitoring = false;
        return;
      }
      
      if (!portalUrlInput.value.trim()) {
        showMessage('Please enter the advising portal URL', 'error');
        isMonitoring = false;
        return;
      }
      
      startMonitoring();
    } else {
      stopMonitoring();
    }
    
    updateMonitoringButton();
    saveMonitoringState();
  }

  function startMonitoring() {
    const interval = parseInt(checkIntervalInput.value) || 3;
    
    chrome.runtime.sendMessage({
      action: 'startMonitoring',
      courses: courses,
      interval: interval,
      portalUrl: portalUrlInput.value.trim()
    });
    
    showMessage('Monitoring started!', 'success');
  }

  function stopMonitoring() {
    chrome.runtime.sendMessage({
      action: 'stopMonitoring'
    });
    
    showMessage('Monitoring stopped', 'info');
  }

  function refreshNow() {
    if (courses.length === 0) {
      showMessage('No courses to check', 'error');
      return;
    }
    
    if (!portalUrlInput.value.trim()) {
      showMessage('Please enter the advising portal URL', 'error');
      return;
    }
    
    chrome.runtime.sendMessage({
      action: 'checkNow',
      courses: courses,
      portalUrl: portalUrlInput.value.trim()
    });
    
    showMessage('Checking courses...', 'info');
  }

  function updateMonitoringButton() {
    if (isMonitoring) {
      toggleMonitoringBtn.textContent = 'Stop Monitoring';
      toggleMonitoringBtn.classList.add('monitoring');
    } else {
      toggleMonitoringBtn.textContent = 'Start Monitoring';
      toggleMonitoringBtn.classList.remove('monitoring');
    }
  }

  function showMessage(text, type = 'info') {
    statusMessage.textContent = text;
    statusMessage.style.background = type === 'error' ? 'rgba(244, 67, 54, 0.3)' : 
                                   type === 'success' ? 'rgba(76, 175, 80, 0.3)' : 
                                   'rgba(255, 255, 255, 0.1)';
    
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.style.background = 'rgba(255, 255, 255, 0.1)';
    }, 3000);
  }

  function saveCourses() {
    chrome.storage.sync.set({ courses: courses });
  }

  function saveSettings() {
    chrome.storage.sync.set({
      checkInterval: parseInt(checkIntervalInput.value) || 3,
      portalUrl: portalUrlInput.value.trim()
    });
  }

  function saveMonitoringState() {
    chrome.storage.sync.set({ isMonitoring: isMonitoring });
  }

  function loadData() {
    chrome.storage.sync.get(['courses', 'checkInterval', 'portalUrl', 'isMonitoring'], function(result) {
      courses = result.courses || [];
      checkIntervalInput.value = result.checkInterval || 3;
      portalUrlInput.value = result.portalUrl || 'https://rds3.northsouth.edu/students/advising';
      isMonitoring = result.isMonitoring || false;
      
      displayCourses();
      updateMonitoringButton();
    });
  }

  // Listen for updates from background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'courseStatusUpdate') {
      // Update course status in the UI
      const course = courses.find(c => c.id === request.courseId);
      if (course) {
        const oldStatus = course.status;
        course.status = request.status;
        course.available = request.available || 0;
        course.enrolled = request.enrolled;
        course.capacity = request.capacity;
        course.errorMessage = request.errorMessage;
        course.lastChecked = Date.now();
        
        // Log activity
        logActivity(course, request);
        
        // Stop monitoring if seat becomes available
        if (request.status === 'available' && request.available > 0) {
          showMessage(`🎉 SEAT FOUND! ${course.code}.${course.section} has ${request.available} seat(s)! Monitoring stopped.`, 'success');
          stopMonitoring();
        }
        
        displayCourses();
        saveCourses();
      }
      // Always send response to prevent message channel error
      sendResponse({received: true});
      return false; // Indicate synchronous response
    } else if (request.action === 'checkComplete') {
      showMessage('Course check completed', 'info');
      sendResponse({received: true});
      return false; // Indicate synchronous response
    } else if (request.action === 'monitoringStarted') {
      // Log monitoring start activity
      const timestamp = new Date().toLocaleTimeString();
      activityHistory.unshift({
        message: `🚀 Started monitoring ${request.coursesCount} course(s) every ${request.interval} seconds`,
        timestamp,
        statusClass: 'info',
        courseCode: 'SYSTEM'
      });
      displayActivityLog();
      saveActivityHistory();
      sendResponse({received: true});
      return false; // Indicate synchronous response
    } else if (request.action === 'seatFound') {
      // Handle seat found notification
      showMessage(`🎉 SEAT AVAILABLE! Monitoring stopped automatically.`, 'success');
      stopMonitoring();
      sendResponse({received: true});
      return false; // Indicate synchronous response
    }
    
    // Return false to indicate all responses are synchronous
    return false;
  });

  // Activity logging functions
  function logActivity(course, statusData) {
    const timestamp = new Date().toLocaleTimeString();
    let message, statusClass;
    
    if (statusData.status === 'available' && statusData.available > 0) {
      message = `🎉 ${course.code}.${course.section} - ${statusData.available} SEAT(S) AVAILABLE!`;
      statusClass = 'available';
    } else if (statusData.status === 'full') {
      message = `❌ ${course.code}.${course.section} - SEAT FULL (${statusData.enrolled}/${statusData.capacity})`;
      statusClass = 'full';
    } else if (statusData.status === 'error') {
      message = `⚠️ ${course.code}.${course.section} - ERROR: ${statusData.errorMessage || 'Unknown error'}`;
      statusClass = 'error';
    } else if (statusData.status === 'checking') {
      message = `🔍 ${course.code}.${course.section} - Checking for available seats...`;
      statusClass = 'info';
    } else {
      message = `🔍 ${course.code}.${course.section} - Status: ${statusData.status}`;
      statusClass = 'info';
    }
    
    activityHistory.unshift({
      message,
      timestamp,
      statusClass,
      courseCode: `${course.code}.${course.section}`
    });
    
    // Keep only last 100 entries for better history
    if (activityHistory.length > 100) {
      activityHistory = activityHistory.slice(0, 100);
    }
    
    displayActivityLog();
    saveActivityHistory();
  }

  function displayActivityLog() {
    if (activityHistory.length === 0) {
      activityLog.innerHTML = '<p class="no-activity">No monitoring activity yet</p>';
      return;
    }
    
    activityLog.innerHTML = activityHistory.map(activity => `
      <div class="activity-item ${activity.statusClass}">
        <div class="activity-text">${activity.message}</div>
        <div class="activity-time">${activity.timestamp}</div>
      </div>
    `).join('');
    
    // Auto-scroll to top for latest activity
    activityLog.scrollTop = 0;
  }

  function clearActivityLog() {
    activityHistory = [];
    displayActivityLog();
    saveActivityHistory();
    showMessage('Activity log cleared', 'info');
  }

  function saveActivityHistory() {
    chrome.storage.sync.set({ lastActivity: activityHistory });
  }

  function loadActivityHistory() {
    chrome.storage.sync.get(['lastActivity'], (data) => {
      activityHistory = data.lastActivity || [];
      displayActivityLog();
    });
  }

  function stopMonitoring() {
    isMonitoring = false;
    toggleMonitoringBtn.textContent = 'Start Monitoring';
    toggleMonitoringBtn.classList.remove('monitoring');
    
    // Tell background to stop monitoring
    chrome.runtime.sendMessage({ action: 'stopMonitoring' });
  }
});
