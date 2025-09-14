// Content script that runs on university portal pages
// This script helps with course detection and monitoring

(function() {
  'use strict';
  
  console.log('Course Seat Monitor content script loaded');
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'checkCourse' || request.action === 'checkCourseAvailability') {
      // Send immediate response
      sendResponse({ status: 'processing', message: 'Starting course check' });
      
      // Handle async course checking without blocking the message channel
      setTimeout(async () => {
        try {
          const result = await checkCourseAvailability(request.courseCode, request.section);
          console.log('Course check completed:', result);
          
          // Send result back via chrome.runtime.sendMessage
          chrome.runtime.sendMessage({
            action: 'courseCheckComplete',
            courseData: {
              fullCourseId: `${request.courseCode}.${request.section}`,
              courseCode: request.courseCode,
              section: request.section
            },
            result: result
          }).catch(error => {
            console.log('Failed to send course check result:', error);
          });
          
        } catch (error) {
          console.error('Error checking course:', error);
          
          chrome.runtime.sendMessage({
            action: 'courseCheckComplete',
            courseData: {
              fullCourseId: `${request.courseCode}.${request.section}`,
              courseCode: request.courseCode,
              section: request.section
            },
            result: {
              success: false,
              error: error.message,
              message: `Error checking course: ${error.message}`,
              available: 0,
              enrolled: null,
              capacity: null,
              found: false
            }
          }).catch(sendError => {
            console.log('Failed to send error result:', sendError);
          });
        }
      }, 100);
      
      return false; // Synchronous response sent
      
    } else if (request.action === 'getPageCourses') {
      try {
        const courses = extractCoursesFromPage();
        sendResponse(courses);
      } catch (error) {
        console.error('Error extracting courses:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      }
    } else {
      // Unknown action
      sendResponse({
        success: false,
        error: 'Unknown action',
        message: `Unknown action: ${request.action}`
      });
    }
    
    return false; // All responses are now synchronous
  });
  
  // Enhanced course availability checking function with auto-scrolling
  async function checkCourseAvailability(courseCode, section) {
    try {
      console.log(`Checking availability for ${courseCode} Section ${section}`);
      
      // NSU Portal specific: Look for course pattern like "ACT201.1"
      const fullCourseId = `${courseCode}.${section}`;
      console.log(`Looking for: ${fullCourseId}`);
      
      // Method 1: Check for NSU course list container first
      const courseListResult = checkNSUCourseList(fullCourseId, courseCode, section);
      if (courseListResult.found) {
        console.log('Found course in NSU course list:', courseListResult);
        return courseListResult;
      }
      
      // Method 2: Quick check without scrolling first
      const pageText = document.body.innerText || document.body.textContent || '';
      console.log('Page text length:', pageText.length);
      
      const quickResult = checkNSUFormat(pageText, fullCourseId, courseCode, section);
      if (quickResult.found) {
        console.log('Found course without scrolling:', quickResult);
        return quickResult;
      }
      
      // Method 3: Auto-scroll and search progressively with pagination support
      console.log('Course not found in current view, starting enhanced auto-scroll search...');
      return await performScrollingSearchWithPagination(fullCourseId, courseCode, section);
      
    } catch (error) {
      console.error('Error checking course availability:', error);
      return {
        success: false,
        available: 0,
        enrolled: null,
        capacity: null,
        found: false,
        message: `Error: ${error.message}`
      };
    }
  }

  // Check NSU course list specifically (right side of portal)
  function checkNSUCourseList(fullCourseId, courseCode, section) {
    console.log(`Checking NSU course list for ${fullCourseId}`);
    
    // Look for elements that might contain the course list
    const possibleContainers = [
      ...document.querySelectorAll('div[style*="color:red"]'), // Red course entries
      ...document.querySelectorAll('div[style*="color:black"]'), // Black course entries  
      ...document.querySelectorAll('td'), // Table cells
      ...document.querySelectorAll('div'), // General divs
      ...document.querySelectorAll('span') // Spans
    ];
    
    for (const container of possibleContainers) {
      const containerText = container.textContent || container.innerText || '';
      
      // Check if this container has our course
      if (containerText.includes(fullCourseId) || 
          (containerText.includes(courseCode) && containerText.includes(`.${section}`))) {
        
        console.log(`Found course in container: ${containerText.substring(0, 100)}`);
        
        // Look for enrollment pattern in this container
        const enrollmentMatch = containerText.match(/(\d+)\((\d+)\)/);
        if (enrollmentMatch) {
          const enrolled = parseInt(enrollmentMatch[1]) || 0;
          const capacity = parseInt(enrollmentMatch[2]) || 0;
          const available = capacity - enrolled;
          
          console.log(`Found enrollment: ${enrollmentMatch[0]}, Available: ${available}`);
          
          // Highlight the found course
          container.style.cssText += 'background-color: yellow !important; border: 2px solid blue !important;';
          container.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            container.style.backgroundColor = '';
            container.style.border = '';
          }, 3000);
          
          return {
            success: true,
            available: available,
            enrolled: enrolled,
            capacity: capacity,
            found: true,
            method: 'nsu_course_list_container',
            matchText: containerText.trim()
          };
        }
      }
    }
    
    return { found: false };
  }

  // Auto-scrolling search function
  async function performScrollingSearch(fullCourseId, courseCode, section) {
    return new Promise((resolve) => {
      let scrollAttempts = 0;
      const maxScrollAttempts = 10; // Limit scrolling attempts
      let lastScrollPosition = 0;
      
      console.log('Starting auto-scroll search...');
      
      function scrollAndSearch() {
        // Scroll down by viewport height
        window.scrollBy(0, window.innerHeight * 0.8);
        scrollAttempts++;
        
        // Wait for content to load after scroll
        setTimeout(() => {
          const currentScrollPosition = window.scrollY;
          console.log(`Scroll attempt ${scrollAttempts}, position: ${currentScrollPosition}`);
          
          // Check if we found the course at current position
          const pageText = document.body.innerText || document.body.textContent || '';
          const result = checkNSUFormat(pageText, fullCourseId, courseCode, section);
          
          if (result.found) {
            console.log('Course found after scrolling!');
            // Scroll the found course into view
            highlightAndScrollToCourse(fullCourseId);
            resolve(result);
            return;
          }
          
          // Method 2: Check visible elements
          const visibleElements = getVisibleElements();
          for (const element of visibleElements) {
            const elementText = element.innerText || element.textContent || '';
            if (elementText.includes(fullCourseId)) {
              console.log('Found course element after scrolling:', elementText.substring(0, 100));
              const elementResult = analyzeNSUElement(element, elementText, fullCourseId);
              if (elementResult.found) {
                // Scroll to found element
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                resolve(elementResult);
                return;
              }
            }
          }
          
          // Check if we've reached the bottom or max attempts
          if (scrollAttempts >= maxScrollAttempts || 
              currentScrollPosition === lastScrollPosition || 
              (currentScrollPosition + window.innerHeight) >= document.body.scrollHeight) {
            
            console.log('Reached end of page or max attempts, course not found');
            // Scroll back to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            resolve({
              success: false,
              available: 0,
              enrolled: null,
              capacity: null,
              found: false,
              message: `Course ${fullCourseId} not found after scrolling through entire page`
            });
            return;
          }
          
          lastScrollPosition = currentScrollPosition;
          
          // Continue scrolling
          setTimeout(scrollAndSearch, 1000); // Wait 1 second between scrolls
          
        }, 800); // Wait for content to load
      }
      
      // Start scrolling search
      scrollAndSearch();
    });
  }

  // Get elements currently visible in viewport
  function getVisibleElements() {
    const elements = document.querySelectorAll('*');
    const visibleElements = [];
    
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0 && 
          rect.left < window.innerWidth && rect.right > 0) {
        visibleElements.push(element);
      }
    }
    
    return visibleElements;
  }

  // Highlight and scroll to found course
  function highlightAndScrollToCourse(fullCourseId) {
    const elements = document.querySelectorAll('*');
    for (const element of elements) {
      const elementText = element.innerText || element.textContent || '';
      if (elementText.includes(fullCourseId)) {
        // Highlight the course temporarily
        const originalStyle = element.style.cssText;
        element.style.cssText += 'background-color: yellow !important; border: 2px solid red !important;';
        
        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          element.style.cssText = originalStyle;
        }, 3000);
        
        console.log('Course highlighted and scrolled into view');
        break;
      }
    }
  }
  
  // NSU-specific function to parse course availability format like "ACT201.1    40(40)"
  function checkNSUFormat(pageText, fullCourseId, courseCode, section) {
    console.log(`Searching for course: ${fullCourseId} (${courseCode} section ${section})`);
    
    // Look for patterns like "ACT201.1    40(40)" or "EEE111.2    34(35)"
    // Format: enrolled(capacity) - need to calculate available = capacity - enrolled
    const patterns = [
      // Full course ID with enrollment: "ACT201.1    40(40)"
      new RegExp(`${fullCourseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)\\((\\d+)\\)`, 'gi'),
      // Course code and section separately with flexible spacing
      new RegExp(`${courseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.${section}\\s+(\\d+)\\((\\d+)\\)`, 'gi'),
      // More flexible pattern with word boundaries
      new RegExp(`\\b${courseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.${section}\\b[\\s\\S]*?(\\d+)\\((\\d+)\\)`, 'gi')
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = pattern.exec(pageText);
      if (match) {
        const enrolled = parseInt(match[1]) || 0;  // Currently enrolled students
        const capacity = parseInt(match[2]) || 0;  // Total capacity
        const available = capacity - enrolled;     // Available seats = capacity - enrolled
        
        console.log(`Found course with pattern ${i + 1}: ${match[0]}, Enrolled: ${enrolled}, Capacity: ${capacity}, Available: ${available}`);
        
        return {
          success: true,
          available: available,
          enrolled: enrolled,
          capacity: capacity,
          found: true,
          method: `nsu_text_pattern_${i + 1}`,
          matchText: match[0]
        };
      }
    }
    
    // Try a more flexible search for just the course code and section pattern
    const flexiblePattern = new RegExp(`${courseCode}\\.${section}`, 'gi');
    if (flexiblePattern.test(pageText)) {
      console.log(`Found course code ${courseCode}.${section} but couldn't extract enrollment data`);
      // Look for any enrollment pattern near this course
      const lines = pageText.split('\n');
      for (const line of lines) {
        if (line.includes(`${courseCode}.${section}`)) {
          const enrollmentMatch = line.match(/(\d+)\((\d+)\)/);
          if (enrollmentMatch) {
            const enrolled = parseInt(enrollmentMatch[1]) || 0;
            const capacity = parseInt(enrollmentMatch[2]) || 0;
            const available = capacity - enrolled;
            
            console.log(`Found enrollment in line: ${line.trim()}, Available: ${available}`);
            
            return {
              success: true,
              available: available,
              enrolled: enrolled,
              capacity: capacity,
              found: true,
              method: 'nsu_line_search',
              matchText: line.trim()
            };
          }
        }
      }
    }
    
    return { found: false };
  }
  
  // Analyze NSU portal elements
  function analyzeNSUElement(element, elementText, fullCourseId) {
    console.log(`Analyzing element for ${fullCourseId}, text: ${elementText.substring(0, 100)}`);
    
    // Look for NSU format: enrolled(capacity) like "40(40)", "35(45)", "30(45)"
    const enrollmentPattern = /(\d+)\((\d+)\)/g;
    const matches = [...elementText.matchAll(enrollmentPattern)];
    
    if (matches.length > 0) {
      // Take the first match (should be the enrollment info)
      const match = matches[0];
      const enrolled = parseInt(match[1]) || 0;   // Currently enrolled
      const capacity = parseInt(match[2]) || 0;   // Total capacity
      const available = capacity - enrolled;      // Available = capacity - enrolled
      
      console.log(`Found enrollment data: ${match[0]}, Enrolled: ${enrolled}, Capacity: ${capacity}, Available: ${available}`);
      
      return {
        success: true,
        available: available,
        enrolled: enrolled,
        capacity: capacity,
        found: true,
        method: 'nsu_element_analysis',
        elementText: elementText.substring(0, 200)
      };
    }
    
    // If we found the course but no enrollment pattern, it might be structured differently
    if (elementText.includes(fullCourseId)) {
      console.log(`Found course ${fullCourseId} but no enrollment pattern in element`);
      return {
        success: false,
        available: 0,
        enrolled: null,
        capacity: null,
        found: true,
        method: 'nsu_element_found_no_enrollment',
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
  
  // Flexible search for courses with improved scrolling support
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
            success: true,
            available: available,
            enrolled: enrolled,
            capacity: capacity,
            found: true,
            method: 'flexible_line_search',
            matchText: line.trim()
          };
        }
        
        // Alternative patterns for different formats
        const altPatterns = [
          /(\d+)\s*\/\s*(\d+)\s*available/i,  // "5/30 available"
          /(\d+)\s*seats?\s*available/i,      // "5 seats available"
          /available:\s*(\d+)/i,              // "Available: 5"
          /open.*?(\d+)/i                     // "OPEN - 5"
        ];
        
        for (const pattern of altPatterns) {
          const match = line.match(pattern);
          if (match) {
            const available = parseInt(match[1]) || 0;
            return {
              success: true,
              available: available,
              enrolled: null,
              capacity: null,
              found: true,
              method: 'flexible_pattern_search',
              matchText: line.trim()
            };
          }
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
  
  // Check for infinite scroll or pagination
  function checkForInfiniteScroll() {
    // Look for common pagination/load more indicators
    const loadMoreButtons = document.querySelectorAll('[class*="load"], [class*="more"], [id*="load"], [id*="more"]');
    const nextButtons = document.querySelectorAll('[class*="next"], [class*="page"], [id*="next"], [id*="page"]');
    const spinners = document.querySelectorAll('[class*="spin"], [class*="load"], [class*="progress"]');
    
    return {
      hasLoadMore: loadMoreButtons.length > 0,
      hasNext: nextButtons.length > 0,
      hasSpinners: spinners.length > 0,
      buttons: [...loadMoreButtons, ...nextButtons]
    };
  }

  // Auto-click load more or next page buttons
  function tryLoadMoreContent() {
    const scrollInfo = checkForInfiniteScroll();
    
    if (scrollInfo.hasLoadMore || scrollInfo.hasNext) {
      console.log('Found load more/next buttons, attempting to click...');
      
      for (const button of scrollInfo.buttons) {
        if (button.offsetParent !== null && // Element is visible
            !button.disabled &&
            button.innerText.toLowerCase().includes('more') ||
            button.innerText.toLowerCase().includes('next') ||
            button.innerText.toLowerCase().includes('load')) {
          
          console.log('Clicking button:', button.innerText);
          button.click();
          return true;
        }
      }
    }
    
    return false;
  }

  // Enhanced scrolling search with pagination support
  async function performScrollingSearchWithPagination(fullCourseId, courseCode, section) {
    return new Promise((resolve) => {
      let scrollAttempts = 0;
      let pageLoadAttempts = 0;
      const maxScrollAttempts = 15;
      const maxPageLoadAttempts = 5;
      let lastScrollPosition = 0;
      let searchComplete = false;
      
      console.log('Starting enhanced auto-scroll search with pagination support...');
      
      // Add timeout protection
      const timeoutId = setTimeout(() => {
        if (!searchComplete) {
          console.log('Search timed out after 30 seconds');
          searchComplete = true;
          window.scrollTo({ top: 0, behavior: 'smooth' });
          resolve({
            success: false,
            available: 0,
            enrolled: null,
            capacity: null,
            found: false,
            message: `Course ${fullCourseId} search timed out after 30 seconds`
          });
        }
      }, 30000); // 30 second timeout
      
      function scrollAndSearch() {
        if (searchComplete) return;
        
        // First try to load more content if available
        if (pageLoadAttempts < maxPageLoadAttempts && tryLoadMoreContent()) {
          pageLoadAttempts++;
          console.log(`Attempted to load more content (attempt ${pageLoadAttempts})`);
          
          // Wait longer for content to load
          setTimeout(() => {
            checkCurrentView();
          }, 2000);
          return;
        }
        
        // Normal scrolling
        window.scrollBy(0, window.innerHeight * 0.8);
        scrollAttempts++;
        
        setTimeout(() => {
          checkCurrentView();
        }, 800);
      }
      
      function checkCurrentView() {
        if (searchComplete) return;
        
        const currentScrollPosition = window.scrollY;
        console.log(`Check view - Scroll: ${scrollAttempts}, Page loads: ${pageLoadAttempts}, Position: ${currentScrollPosition}`);
        
        // Check if we found the course at current position
        const pageText = document.body.innerText || document.body.textContent || '';
        const result = checkNSUFormat(pageText, fullCourseId, courseCode, section);
        
        if (result.found) {
          console.log('Course found after scrolling/pagination!');
          searchComplete = true;
          clearTimeout(timeoutId);
          highlightAndScrollToCourse(fullCourseId);
          resolve(result);
          return;
        }
        
        // Check visible elements for course information
        const visibleElements = getVisibleElements();
        for (const element of visibleElements) {
          const elementText = element.innerText || element.textContent || '';
          if (elementText.includes(fullCourseId) || 
              (elementText.includes(courseCode) && elementText.includes(`.${section}`))) {
            console.log('Found course element after scrolling:', elementText.substring(0, 100));
            const elementResult = analyzeNSUElement(element, elementText, fullCourseId);
            if (elementResult.found) {
              searchComplete = true;
              clearTimeout(timeoutId);
              
              // Highlight and scroll to the found element
              element.style.cssText += 'background-color: yellow !important; border: 2px solid blue !important;';
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Remove highlight after 3 seconds
              setTimeout(() => {
                element.style.backgroundColor = '';
                element.style.border = '';
              }, 3000);
              
              resolve(elementResult);
              return;
            }
          }
        }
        
        // Check if we should continue
        const reachedBottom = (currentScrollPosition + window.innerHeight) >= document.body.scrollHeight;
        const noMoreScrolling = currentScrollPosition === lastScrollPosition;
        const maxAttemptsReached = scrollAttempts >= maxScrollAttempts;
        
        if (reachedBottom || noMoreScrolling || maxAttemptsReached) {
          console.log('Search complete - course not found');
          console.log(`Bottom: ${reachedBottom}, No scroll: ${noMoreScrolling}, Max: ${maxAttemptsReached}`);
          
          searchComplete = true;
          clearTimeout(timeoutId);
          
          // Scroll back to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          resolve({
            success: false,
            available: 0,
            enrolled: null,
            capacity: null,
            found: false,
            message: `Course ${fullCourseId} not found after comprehensive search (${scrollAttempts} scrolls, ${pageLoadAttempts} page loads)`
          });
          return;
        }
        
        lastScrollPosition = currentScrollPosition;
        
        // Continue searching
        setTimeout(scrollAndSearch, 1000);
      }
      
      // Start the search
      scrollAndSearch();
    });
  }
  
  // Check if we are on a course details page
  function isCourseDetailsPage() {
    const urlPath = window.location.pathname;
    // Example patterns for course details pages
    return urlPath.includes('/course/') || urlPath.includes('/class/') || urlPath.includes('/details/');
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
