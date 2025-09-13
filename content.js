// Content script that runs on university portal pages
// This script helps with course detection and monitoring

(function() {
  'use strict';
  
  console.log('Course Seat Monitor content script loaded');
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkCourseAvailability') {
      const result = checkCourseAvailability(request.courseCode, request.section);
      sendResponse(result);
    } else if (request.action === 'getPageCourses') {
      const courses = extractCoursesFromPage();
      sendResponse(courses);
    }
    return true; // Keep message channel open
  });
  
  // Enhanced course availability checking function
  function checkCourseAvailability(courseCode, section) {
    try {
      console.log(`Checking availability for ${courseCode} Section ${section}`);
      
      // NSU Portal specific: Look for course pattern like "CSE498R.11"
      const fullCourseId = `${courseCode}.${section}`;
      console.log(`Looking for: ${fullCourseId}`);
      
      // Method 1: Direct text search for NSU format
      const pageText = document.body.innerText || document.body.textContent || '';
      console.log('Page text length:', pageText.length);
      
      const nsuResult = checkNSUFormat(pageText, fullCourseId, courseCode, section);
      if (nsuResult.found) {
        console.log('Found course in NSU format:', nsuResult);
        return nsuResult;
      }
      
      // Method 2: Look for elements containing the course
      const courseElements = document.querySelectorAll('*');
      console.log(`Checking ${courseElements.length} elements for course`);
      
      for (const element of courseElements) {
        const elementText = element.innerText || element.textContent || '';
        if (elementText.includes(fullCourseId)) {
          console.log('Found element with full course ID:', elementText.substring(0, 100));
          const result = analyzeNSUElement(element, elementText, fullCourseId);
          if (result.found) {
            console.log('Successfully analyzed element:', result);
            return result;
          }
        }
      }
      
      // Method 3: More flexible search
      const flexibleResult = flexibleCourseSearch(pageText, courseCode, section);
      if (flexibleResult.found) {
        console.log('Found course via flexible search:', flexibleResult);
        return flexibleResult;
      }
      
      console.log('Course not found on page');
      return {
        available: false,
        seats: 0,
        found: false,
        error: `Course ${fullCourseId} not found on current page. Check if you're on the correct page.`
      };
      
    } catch (error) {
      console.error('Error checking course availability:', error);
      return {
        available: false,
        seats: 0,
        found: false,
        error: `Error: ${error.message}`
      };
    }
  }
  
  // NSU-specific function to parse course availability format like "CSE498R.11    44(45)"
  function checkNSUFormat(pageText, fullCourseId, courseCode, section) {
    // Look for patterns like "CSE498R.11    44(45)" or "EEE111.2    34(35)"
    // Format: enrolled(capacity) - need to calculate available = capacity - enrolled
    const patterns = [
      // Full course ID with enrollment: "CSE498R.11    44(45)"
      new RegExp(`${fullCourseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)\\((\\d+)\\)`, 'gi'),
      // Course code and section separately: "CSE498R" ... "11" ... "44(45)"
      new RegExp(`${courseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?${section}.*?(\\d+)\\((\\d+)\\)`, 'gi')
    ];
    
    for (const pattern of patterns) {
      const match = pattern.exec(pageText);
      if (match) {
        const enrolled = parseInt(match[1]) || 0;  // Currently enrolled students
        const capacity = parseInt(match[2]) || 0;  // Total capacity
        const available = capacity - enrolled;     // Available seats = capacity - enrolled
        
        return {
          available: available > 0,
          seats: available,
          enrolled: enrolled,
          capacity: capacity,
          found: true,
          method: 'nsu_text_pattern',
          matchText: match[0]
        };
      }
    }
    
    return { found: false };
  }
  
  // Analyze NSU portal elements
  function analyzeNSUElement(element, elementText, fullCourseId) {
    // Look for NSU format: enrolled(capacity) like "44(45)", "35(35)", "30(45)"
    const enrollmentPattern = /(\\d+)\\((\\d+)\\)/g;
    const matches = [...elementText.matchAll(enrollmentPattern)];
    
    if (matches.length > 0) {
      // Take the first match (should be the enrollment info)
      const match = matches[0];
      const enrolled = parseInt(match[1]) || 0;   // Currently enrolled
      const capacity = parseInt(match[2]) || 0;   // Total capacity
      const available = capacity - enrolled;      // Available = capacity - enrolled
      
      return {
        available: available > 0,
        seats: available,
        enrolled: enrolled,
        capacity: capacity,
        found: true,
        method: 'nsu_element_analysis',
        elementText: elementText.substring(0, 200)
      };
    }
    
    return { found: false };
  }

  function checkTableForCourse(table, courseCode, section) {
    
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th');
      if (cells.length === 0) continue;
      
      const rowText = Array.from(cells).map(cell => cell.textContent || '').join(' ');
      
      // Check if this row contains our course
      const courseRegex = new RegExp(courseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const sectionRegex = new RegExp(`\\b${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      
      if (courseRegex.test(rowText) && sectionRegex.test(rowText)) {
        return analyzeCourseRow(row, rowText);
      }
    }
    
    return { found: false };
  }
  
  function checkContainerForCourse(container, courseCode, section) {
    const containerText = container.textContent || container.innerText || '';
    
    const courseRegex = new RegExp(courseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const sectionRegex = new RegExp(`\\b${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    
    if (courseRegex.test(containerText) && sectionRegex.test(containerText)) {
      return analyzeContainerText(containerText);
    }
    
    return { found: false };
  }
  
  function searchPageText(courseCode, section) {
    const bodyText = document.body.textContent || document.body.innerText || '';
    
    // Create more flexible regex patterns
    const patterns = [
      new RegExp(`${courseCode}[\\s\\S]*?${section}[\\s\\S]*?(?:seat|available|full|open|closed|waitlist)`, 'gi'),
      new RegExp(`${section}[\\s\\S]*?${courseCode}[\\s\\S]*?(?:seat|available|full|open|closed|waitlist)`, 'gi')
    ];
    
    for (const pattern of patterns) {
      const matches = bodyText.match(pattern);
      if (matches && matches.length > 0) {
        return analyzeContainerText(matches[0]);
      }
    }
    
    return { found: false };
  }
  
  function analyzeCourseRow(row, rowText) {
    const cells = row.querySelectorAll('td, th');
    let seatInfo = { available: false, seats: 0, found: true };
    
    // Look for seat information in individual cells
    for (const cell of cells) {
      const cellText = (cell.textContent || '').trim().toLowerCase();
      
      // Check for status indicators
      if (cellText.includes('open') || cellText.includes('available')) {
        seatInfo.available = true;
      } else if (cellText.includes('full') || cellText.includes('closed') || cellText.includes('waitlist')) {
        seatInfo.available = false;
        seatInfo.seats = 0;
        break;
      }
      
      // Look for seat numbers
      const seatMatch = cellText.match(/(\d+)\s*(?:seat|spot|space|available|remaining|open)/);
      if (seatMatch) {
        seatInfo.seats = parseInt(seatMatch[1]);
        seatInfo.available = seatInfo.seats > 0;
      }
      
      // Look for enrollment format like "15/25"
      const enrollmentMatch = cellText.match(/(\d+)\s*\/\s*(\d+)/);
      if (enrollmentMatch) {
        const enrolled = parseInt(enrollmentMatch[1]);
        const capacity = parseInt(enrollmentMatch[2]);
        seatInfo.seats = capacity - enrolled;
        seatInfo.available = seatInfo.seats > 0;
      }
    }
    
    // If no specific seat count found but marked as available
    if (seatInfo.available && seatInfo.seats === 0) {
      seatInfo.seats = 'Unknown';
    }
    
    return seatInfo;
  }
  
  function analyzeContainerText(text) {
    const lowerText = text.toLowerCase();
    let seatInfo = { available: false, seats: 0, found: true };
    
    // Check for status indicators
    if (lowerText.includes('full') || lowerText.includes('closed') || lowerText.includes('waitlist')) {
      seatInfo.available = false;
      seatInfo.seats = 0;
    } else if (lowerText.includes('open') || lowerText.includes('available')) {
      seatInfo.available = true;
    }
    
    // Look for seat numbers with various patterns
    const seatPatterns = [
      /(\d+)\s*(?:seat|spot|space)s?\s*(?:available|open|remaining)/gi,
      /available[:\s]*(\d+)/gi,
      /open[:\s]*(\d+)/gi,
      /seats?[:\s]*(\d+)/gi,
      /remaining[:\s]*(\d+)/gi,
      /(\d+)\s*\/\s*(\d+)/g  // enrollment format
    ];
    
    for (const pattern of seatPatterns) {
      const match = pattern.exec(text);
      if (match) {
        if (pattern.source.includes('\\/')) {
          // Enrollment format
          const enrolled = parseInt(match[1]);
          const capacity = parseInt(match[2]);
          seatInfo.seats = capacity - enrolled;
          seatInfo.available = seatInfo.seats > 0;
        } else {
          seatInfo.seats = parseInt(match[1]);
          seatInfo.available = seatInfo.seats > 0;
        }
        break;
      }
    }
    
    // If marked as available but no seat count found
    if (seatInfo.available && seatInfo.seats === 0) {
      seatInfo.seats = 'Unknown';
    }
    
    return seatInfo;
  }
  
  // Flexible search for courses
  function flexibleCourseSearch(pageText, courseCode, section) {
    console.log(`Flexible search for ${courseCode} section ${section}`);
    
    // Look for any occurrence of course code and section with enrollment pattern
    const lines = pageText.split('\n');
    for (const line of lines) {
      if (line.includes(courseCode) && line.includes(section)) {
        console.log('Found line with course:', line.trim());
        
        // Look for enrollment pattern in this line
        const enrollmentMatch = line.match(/(\d+)\((\d+)\)/);
        if (enrollmentMatch) {
          const enrolled = parseInt(enrollmentMatch[1]) || 0;
          const capacity = parseInt(enrollmentMatch[2]) || 0;
          const available = capacity - enrolled;
          
          return {
            available: available > 0,
            seats: available,
            enrolled: enrolled,
            capacity: capacity,
            found: true,
            method: 'flexible_line_search',
            matchText: line.trim()
          };
        }
      }
    }
    
    return { found: false };
  }
  
  // Extract all courses visible on the current page
  function extractCoursesFromPage() {
    const courses = [];
    
    // Try to find course tables
    const tables = document.querySelectorAll('table');
    for (const table of tables) {
      const tableText = table.textContent || '';
      if (tableText.toLowerCase().includes('course') || tableText.toLowerCase().includes('class')) {
        const rows = table.querySelectorAll('tr');
        for (const row of rows) {
          const course = extractCourseFromRow(row);
          if (course) courses.push(course);
        }
      }
    }
    
    return courses;
  }
  
  function extractCourseFromRow(row) {
    const cells = row.querySelectorAll('td, th');
    if (cells.length < 2) return null;
    
    const rowText = Array.from(cells).map(cell => cell.textContent || '').join(' ');
    
    // Look for course code pattern (e.g., CSE101, MATH205, etc.)
    const courseCodeMatch = rowText.match(/\b([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\b/i);
    if (!courseCodeMatch) return null;
    
    // Look for section pattern
    const sectionMatch = rowText.match(/(?:section|sec)[\s:]*([A-Z0-9]{1,3})/i) || 
                        rowText.match(/\b([A-Z0-9]{1,2})\b(?=.*(?:seat|available|full))/i);
    
    if (courseCodeMatch && sectionMatch) {
      return {
        code: courseCodeMatch[1].replace(/\s+/g, '').toUpperCase(),
        section: sectionMatch[1].toUpperCase(),
        fullText: rowText.trim()
      };
    }
    
    return null;
  }
  
  // Auto-detect when page content changes (for single-page applications)
  const observer = new MutationObserver((mutations) => {
    // Notify background script that page content has changed
    chrome.runtime.sendMessage({ action: 'pageContentChanged' }).catch(() => {
      // Extension context might be invalidated, ignore error
    });
  });
  
  // Start observing page changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Notify that content script is ready
  chrome.runtime.sendMessage({ action: 'contentScriptReady' }).catch(() => {
    // Extension context might be invalidated, ignore error
  });
  
})();
