// Configuration helper for different university portal types
const PortalConfigs = {
  // Common configurations for popular university systems
  
  // Banner/Self-Service systems (very common)
  banner: {
    name: "Banner Self-Service",
    urlPatterns: [
      "*://*/ssb/*",
      "*://*/StudentRegistrationSsb/*",
      "*://*/banner/*"
    ],
    courseSelectors: [
      'table[summary*="course"] tr',
      '.pagebodydiv table tr',
      'table.datadisplaytable tr'
    ],
    statusKeywords: {
      available: ['open', 'available', 'seats available'],
      full: ['full', 'closed', 'waitlist', 'wait list']
    },
    courseCodePattern: /([A-Z]{2,4}\s*\d{3,4}[A-Z]?)/,
    sectionPattern: /(?:section|sec)[\s:]*([A-Z0-9]{1,3})/i
  },
  
  // PeopleSoft systems
  peoplesoft: {
    name: "PeopleSoft",
    urlPatterns: [
      "*://*/psp/*",
      "*://*/peoplesoft/*",
      "*://*/ps/*"
    ],
    courseSelectors: [
      '.PSLEVEL1GRIDNBO tr',
      '.PSGROUPBOXNBO table tr',
      'table[id*="CLASS"] tr'
    ],
    statusKeywords: {
      available: ['open', 'available'],
      full: ['closed', 'full', 'wait list']
    },
    courseCodePattern: /([A-Z]{2,4}\d{3,4}[A-Z]?)/,
    sectionPattern: /([A-Z0-9]{1,3})/
  },
  
  // Blackboard/WebAdvisor systems
  blackboard: {
    name: "Blackboard WebAdvisor",
    urlPatterns: [
      "*://*/webadvisor/*",
      "*://*/WebAdvisor/*"
    ],
    courseSelectors: [
      'table.dataDisplayTable tr',
      '.complexTable tr'
    ],
    statusKeywords: {
      available: ['available', 'open'],
      full: ['full', 'closed', 'not available']
    },
    courseCodePattern: /([A-Z]{2,4}\s*\d{3,4})/,
    sectionPattern: /section[\s:]*([A-Z0-9]{1,3})/i
  },
  
  // Generic/Custom systems
  generic: {
    name: "Generic System",
    urlPatterns: ["*://*/*"],
    courseSelectors: [
      'tr[class*="course"]',
      'div[class*="course"]',
      'tr[class*="class"]',
      'div[class*="class"]',
      '.course-row',
      '.class-row'
    ],
    statusKeywords: {
      available: ['open', 'available', 'seats available', 'not full'],
      full: ['full', 'closed', 'waitlist', 'wait list', 'no seats']
    },
    courseCodePattern: /([A-Z]{2,4}\s*\d{3,4}[A-Z]?)/,
    sectionPattern: /(?:section|sec)[\s:]*([A-Z0-9]{1,3})/i
  }
};

// Auto-detect portal type based on URL
function detectPortalType(url) {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('ssb') || lowerUrl.includes('banner')) {
    return PortalConfigs.banner;
  } else if (lowerUrl.includes('peoplesoft') || lowerUrl.includes('/psp/') || lowerUrl.includes('/ps/')) {
    return PortalConfigs.peoplesoft;
  } else if (lowerUrl.includes('webadvisor')) {
    return PortalConfigs.blackboard;
  } else {
    return PortalConfigs.generic;
  }
}

// University-specific configurations
const UniversityConfigs = {
  // Add specific configurations for known universities
  // Format: domain -> config overrides
  
  "university.edu": {
    courseCodePattern: /([A-Z]{3}\s*\d{3})/,  // Three letters, three numbers
    sectionPattern: /([0-9]{2})/,              // Two digit sections
    statusKeywords: {
      available: ['seats open'],
      full: ['course full']
    }
  },
  
  "state.edu": {
    courseCodePattern: /([A-Z]{4}\d{4})/,     // Four letters, four numbers
    sectionPattern: /([A-Z])/,                 // Single letter sections
  }
  
  // Add more universities as needed
};

// Get configuration for a specific URL
function getPortalConfig(url) {
  const domain = new URL(url).hostname.toLowerCase();
  const baseConfig = detectPortalType(url);
  const universityOverrides = UniversityConfigs[domain] || {};
  
  // Merge configurations
  return {
    ...baseConfig,
    ...universityOverrides,
    statusKeywords: {
      ...baseConfig.statusKeywords,
      ...(universityOverrides.statusKeywords || {})
    }
  };
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PortalConfigs, getPortalConfig, detectPortalType };
} else if (typeof window !== 'undefined') {
  window.PortalConfigs = PortalConfigs;
  window.getPortalConfig = getPortalConfig;
  window.detectPortalType = detectPortalType;
}
