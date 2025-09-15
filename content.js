// Content script that runs on university portal pages
// This script helps with course detection and monitoring

(function() {
  'use strict';
  
  console.log('Course Seat Monitor content script loaded');
  
  // Simple test function to verify script is working
  window.testExtension = function() {
    console.log('✅ Extension content script is working!');
    return 'Extension is loaded and working';
  };
  
  // Debug function to test course parsing
  window.debugCourseSearch = function(courseCode, section) {
    console.log(`🔍 Debug: Testing course search for ${courseCode}.${section}`);
    
    // Get all text content
    const pageText = document.body.innerText || document.body.textContent || '';
    console.log(`📄 Page has ${pageText.length} characters`);
    
    // Look for the course ID anywhere in the page
    const fullCourseId = `${courseCode}.${section}`;
    if (pageText.includes(fullCourseId)) {
      console.log(`✅ Found course ID "${fullCourseId}" in page text`);
      
      // Find the line containing the course
      const lines = pageText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(fullCourseId)) {
          console.log(`📍 Found on line ${i}: "${line.trim()}"`);
          
          // Test enrollment pattern on this specific line
          const enrollmentPattern = /(\d+)\s*\(\s*(\d+)\s*\)/g;
          const match = enrollmentPattern.exec(line);
          if (match) {
            console.log(`🔢 Enrollment match found: "${match[0]}"`);
            console.log(`   Group 1 (enrolled): ${match[1]}`);
            console.log(`   Group 2 (capacity): ${match[2]}`);
            console.log(`   Available would be: ${parseInt(match[2]) - parseInt(match[1])}`);
          }
        }
      }
    } else {
      console.log(`❌ Course ID "${fullCourseId}" not found in page text`);
    }
    
    // Test the container search
    const containers = document.querySelectorAll('*');
    let foundContainers = 0;
    for (const container of containers) {
      const text = container.textContent || '';
      if (text.includes(fullCourseId)) {
        foundContainers++;
        console.log(`📦 Container ${foundContainers}: "${text.trim()}" (tag: ${container.tagName})`);
        if (foundContainers >= 5) break; // Limit output
      }
    }
    
    return `Debug complete. Found ${foundContainers} containers with course ID.`;
  };
  
  // Add this to global scope for testing
  // Emergency debug function to find EXACTLY where 140 and 40 are coming from
  window.emergencyDebug = function(courseId) {
    console.log(`🚨 EMERGENCY DEBUG for ${courseId}`);
    
    const pageText = document.body.innerText || document.body.textContent || '';
    
    // Look for the course line specifically
    const lines = pageText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(courseId)) {
        console.log(`\n📍 FOUND COURSE LINE ${i}:`);
        console.log(`"${line}"`);
        
        // Show 5 lines before and after for context
        console.log('\n📄 CONTEXT:');
        for (let j = Math.max(0, i-3); j <= Math.min(lines.length-1, i+3); j++) {
          const marker = j === i ? '>>> ' : '    ';
          console.log(`${marker}Line ${j}: "${lines[j]}"`);
        }
        
        // Find ALL numbers in this specific line
        const allNumbers = line.match(/\d+/g);
        console.log(`\n🔢 ALL NUMBERS in this line: [${allNumbers ? allNumbers.join(', ') : 'none'}]`);
        
        // Find ALL patterns that look like enrollment
        const patterns = [
          /(\d+)\s*\(\s*(\d+)\s*\)/g,
          /(\d+)\s*\/\s*(\d+)/g,
          /\(\s*(\d+)\s*\/\s*(\d+)\s*\)/g
        ];
        
        patterns.forEach((pattern, idx) => {
          pattern.lastIndex = 0; // Reset
          let match;
          while ((match = pattern.exec(line)) !== null) {
            console.log(`\n🎯 Pattern ${idx+1} found: "${match[0]}" at position ${match.index}`);
            console.log(`   Numbers: ${match[1]} and ${match[2]}`);
          }
        });
      }
    }
    
    // Also search for where 140 and 40 might be coming from
    console.log(`\n🔍 Searching for "140" in page:`);
    const lines140 = pageText.split('\n').filter(line => line.includes('140'));
    lines140.forEach((line, idx) => {
      console.log(`   Line with 140: "${line.trim()}"`);
    });
    
    console.log(`\n🔍 Searching for "40" in page:`);
    const lines40 = pageText.split('\n').filter(line => line.includes('40'));
    lines40.slice(0, 5).forEach((line, idx) => { // Limit to first 5 to avoid spam
      console.log(`   Line with 40: "${line.trim()}"`);
    });
    
    return 'Emergency debug complete';
  };

  window.testCourseCheck = async function(courseCode, section) {
    return await checkCourseAvailability(courseCode, section);
  };
  
  // Emergency debug function to find EXACTLY where 140 and 40 are coming from
  window.emergencyDebug = function(courseId) {
    console.log(`🚨 EMERGENCY DEBUG for ${courseId}`);
    
    const pageText = document.body.innerText || document.body.textContent || '';
    
    // Look for the course line specifically
    const lines = pageText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(courseId)) {
        console.log(`\n📍 FOUND COURSE LINE ${i}:`);
        console.log(`"${line}"`);
        
        // Show 5 lines before and after for context
        console.log('\n� CONTEXT:');
        for (let j = Math.max(0, i-3); j <= Math.min(lines.length-1, i+3); j++) {
          const marker = j === i ? '>>> ' : '    ';
          console.log(`${marker}Line ${j}: "${lines[j]}"`);
        }
        
        // Find ALL numbers in this specific line
        const allNumbers = line.match(/\d+/g);
        console.log(`\n🔢 ALL NUMBERS in this line: [${allNumbers ? allNumbers.join(', ') : 'none'}]`);
        
        // Find ALL patterns that look like enrollment
        const patterns = [
          /(\d+)\s*\(\s*(\d+)\s*\)/g,
          /(\d+)\s*\/\s*(\d+)/g,
          /\(\s*(\d+)\s*\/\s*(\d+)\s*\)/g
        ];
        
        patterns.forEach((pattern, idx) => {
          pattern.lastIndex = 0; // Reset
          let match;
          while ((match = pattern.exec(line)) !== null) {
            console.log(`\n🎯 Pattern ${idx+1} found: "${match[0]}" at position ${match.index}`);
            console.log(`   Numbers: ${match[1]} and ${match[2]}`);
          }
        });
      }
    }
    
    // Also search for where 140 and 40 might be coming from
    console.log(`\n🔍 Searching for "140" in page:`);
    const lines140 = pageText.split('\n').filter(line => line.includes('140'));
    lines140.forEach((line, idx) => {
      console.log(`   Line with 140: "${line.trim()}"`);
    });
    
    console.log(`\n🔍 Searching for "40" in page:`);
    const lines40 = pageText.split('\n').filter(line => line.includes('40'));
    lines40.slice(0, 5).forEach((line, idx) => { // Limit to first 5 to avoid spam
      console.log(`   Line with 40: "${line.trim()}"`);
    });
    
    return 'Emergency debug complete';
  };
  
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
      console.log(`🔍 Starting availability check for ${courseCode} Section ${section}`);
      
      // NSU Portal specific: Look for course pattern like "ACT201.1"
      const fullCourseId = `${courseCode}.${section}`;
      console.log(`🎯 Target course ID: ${fullCourseId}`);
      
      // Method 1: Check for NSU course list container first
      console.log(`📋 Method 1: Checking NSU course list containers...`);
      const courseListResult = checkNSUCourseList(fullCourseId, courseCode, section);
      if (courseListResult.found) {
        console.log(`✅ Found course in NSU course list:`, courseListResult);
        return courseListResult;
      }
      
      // Method 2: Quick check without scrolling first
      console.log(`📄 Method 2: Quick page text search...`);
      const pageText = document.body.innerText || document.body.textContent || '';
      console.log(`📏 Page text length: ${pageText.length} characters`);
      
      const quickResult = checkNSUFormat(pageText, fullCourseId, courseCode, section);
      if (quickResult.found) {
        console.log(`✅ Found course without scrolling:`, quickResult);
        return quickResult;
      }
      
      // Method 3: Auto-scroll and search progressively with pagination support
      console.log(`🔄 Method 3: Starting enhanced auto-scroll search...`);
      return await performScrollingSearchWithPagination(fullCourseId, courseCode, section);
      
    } catch (error) {
      console.error(`❌ Error checking course availability:`, error);
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
    
    // Look for elements that might contain the course list with more specific targeting
    const possibleContainers = [
      ...document.querySelectorAll('div[style*="color:red"]'), // Red course entries (usually full)
      ...document.querySelectorAll('div[style*="color:black"]'), // Black course entries (usually available)  
      ...document.querySelectorAll('td'), // Table cells
      ...document.querySelectorAll('div'), // General divs
      ...document.querySelectorAll('span'), // Spans
      ...document.querySelectorAll('*') // All elements as last resort
    ];
    
    console.log(`Found ${possibleContainers.length} possible containers to search`);
    
    for (const container of possibleContainers) {
      const containerText = container.textContent || container.innerText || '';
      
      // Check if this container has our course - be more specific about matching
      if (containerText.trim().startsWith(fullCourseId) || 
          containerText.includes(fullCourseId + ' ') ||
          containerText.includes(fullCourseId + '\t') ||
          (containerText.includes(courseCode) && containerText.includes(`.${section}`) && containerText.match(/(\d+)\((\d+)\)/))) {
        
        console.log(`Found potential course match in container: "${containerText.trim()}"`);
        
        // Look for enrollment pattern in this container - be more precise
        const enrollmentMatch = containerText.match(/(\d+)\s*\(\s*(\d+)\s*\)/);
        if (enrollmentMatch) {
          const enrolled = parseInt(enrollmentMatch[1]) || 0;
          const capacity = parseInt(enrollmentMatch[2]) || 0;
          const available = capacity - enrolled;
          
          console.log(`Parsed enrollment data: ${enrollmentMatch[0]} -> Enrolled: ${enrolled}, Capacity: ${capacity}, Available: ${available}`);
          
          // Verify this is actually our course by checking the full context
          if (containerText.includes(fullCourseId) || 
              (containerText.includes(courseCode) && containerText.includes(`.${section}`))) {
            
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
    console.log(`Page text sample: ${pageText.substring(0, 500)}...`);
    
    // Look for patterns like "ACT201.1    40(40)" or "EEE111.2    34(35)"
    // NSU format might be: capacity(enrolled) OR enrolled(capacity) - we need to test both
    const patterns = [
      // Exact match: "ACT201.1    40(40)" with whitespace
      new RegExp(`${fullCourseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)\\s*\\(\\s*(\\d+)\\s*\\)`, 'gi'),
      // Course code with dot and section: "ACT201.1" followed by enrollment
      new RegExp(`${courseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.${section}\\s+(\\d+)\\s*\\(\\s*(\\d+)\\s*\\)`, 'gi'),
      // More flexible pattern allowing for extra characters
      new RegExp(`\\b${courseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.${section}\\b[\\s\\S]{0,50}(\\d+)\\s*\\(\\s*(\\d+)\\s*\\)`, 'gi')
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      console.log(`Testing pattern ${i + 1}: ${pattern.source}`);
      
      // Reset pattern for fresh search
      pattern.lastIndex = 0;
      const match = pattern.exec(pageText);
      
        if (match) {
          const num1 = parseInt(match[1]) || 0;  // First number
          const num2 = parseInt(match[2]) || 0;  // Second number (in parentheses)
          
          console.log(`✅ Found course with pattern ${i + 1}:`);
          console.log(`   Match: "${match[0]}"`);
          console.log(`   Number 1: ${num1}, Number 2: ${num2}`);
          console.log(`   RAW MATCH ARRAY:`, match);
          
          // EMERGENCY DEBUG: Let's see the surrounding text
          const matchIndex = pageText.indexOf(match[0]);
          const before = pageText.substring(Math.max(0, matchIndex - 100), matchIndex);
          const after = pageText.substring(matchIndex + match[0].length, Math.min(pageText.length, matchIndex + match[0].length + 100));
          console.log(`   CONTEXT BEFORE: "${before}"`);
          console.log(`   CONTEXT AFTER: "${after}"`);
          
          // Determine which interpretation makes sense
          // If num1 > num2, then likely format is capacity(enrolled)
          // If num2 > num1, then likely format is enrolled(capacity)
          let enrolled, capacity, available;
          
          if (num1 >= num2) {
            // Format: capacity(enrolled)
            capacity = num1;
            enrolled = num2;
            available = capacity - enrolled;
            console.log(`   Interpreting as capacity(enrolled): ${capacity}(${enrolled})`);
          } else {
            // Format: enrolled(capacity) 
            enrolled = num1;
            capacity = num2;
            available = capacity - enrolled;
            console.log(`   Interpreting as enrolled(capacity): ${enrolled}(${capacity})`);
          }
          
          console.log(`   Final: Enrolled: ${enrolled}, Capacity: ${capacity}, Available: ${available}`);        return {
          success: true,
          available: Math.max(0, available), // Ensure non-negative
          enrolled: enrolled,
          capacity: capacity,
          found: true,
          method: `nsu_text_pattern_${i + 1}`,
          matchText: match[0]
        };
      } else {
        console.log(`❌ Pattern ${i + 1} did not match`);
      }
    }
    
    // Try a more flexible line-by-line search
    console.log(`Trying line-by-line search for ${courseCode}.${section}`);
    const lines = pageText.split('\n');
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (line.includes(`${courseCode}.${section}`)) {
        console.log(`Found course in line ${lineIndex}: "${line.trim()}"`);
        
        const enrollmentMatch = line.match(/(\d+)\s*\(\s*(\d+)\s*\)/);
        if (enrollmentMatch) {
          const num1 = parseInt(enrollmentMatch[1]) || 0;
          const num2 = parseInt(enrollmentMatch[2]) || 0;
          
          let enrolled, capacity, available;
          
          if (num1 >= num2) {
            // Format: capacity(enrolled)
            capacity = num1;
            enrolled = num2;
            available = capacity - enrolled;
            console.log(`   Line interpreting as capacity(enrolled): ${capacity}(${enrolled})`);
          } else {
            // Format: enrolled(capacity)
            enrolled = num1;
            capacity = num2;
            available = capacity - enrolled;
            console.log(`   Line interpreting as enrolled(capacity): ${enrolled}(${capacity})`);
          }
          
          console.log(`   Line result: Enrolled: ${enrolled}, Capacity: ${capacity}, Available: ${available}`);
          
          return {
            success: true,
            available: Math.max(0, available),
            enrolled: enrolled,
            capacity: capacity,
            found: true,
            method: 'nsu_line_search',
            matchText: line.trim()
          };
        }
      }
    }
    
    console.log(`❌ Course ${fullCourseId} not found in page text`);
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
