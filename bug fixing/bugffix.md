The timetable PDF parser has 3 critical bugs causing completely wrong output.
Here is the exact diagnosis and required fix:

---

## ROOT CAUSE 1: PDF text extraction loses column structure

pdf-parse extracts text as a flat string per page, losing the grid/table
column positions. When the parser tries to split by columns, adjacent cells
get concatenated:
  "← 24AD401→" and "TWM" become "24AD401TWM"
  "←22AD505→" and "22CS512" become "22AD505→22CS512"

THE FIX: Switch from pdf-parse text extraction to coordinate-based extraction
using pdfjs-dist which gives us x,y coordinates for every text item.

Install: npm install pdfjs-dist

Replace the grid parsing approach entirely:
```javascript
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractPageWithCoordinates(pdfPath, pageNum) {
  const pdf = await pdfjsLib.getDocument(pdfPath).promise;
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  
  // Each item has: str, transform[4]=x, transform[5]=y, width, height
  const items = textContent.items.map(item => ({
    text: item.str.trim(),
    x: Math.round(item.transform[4]),
    y: Math.round(item.transform[5]),
    width: Math.round(item.width)
  })).filter(item => item.text.length > 0);
  
  return items;
}
```

---

## ROOT CAUSE 2: Column boundary detection is wrong

The timetable grid has these approximate X-coordinate boundaries
(these vary slightly per PDF but follow this pattern):
Column boundaries (approximate X positions):
Day label:  x = 50-130
Hour 1:     x = 130-215  (9.15-10.05)
Hour 2:     x = 215-305  (10.05-10.55)
BREAK col:  x = 305-340  (skip this)
Hour 3:     x = 340-430  (11.15-12.05)
Hour 4:     x = 430-520  (12.05-12.55)
LUNCH col:  x = 520-560  (skip this - vertical text)
Hour 5:     x = 560-650  (2.00-2.50)
Hour 6:     x = 650-740  (2.50-3.40)
Hour 7:     x = 740-830  (3.40-4.30)

THE FIX: Use coordinate-based column assignment:
```javascript
function getHourFromX(x, columnBoundaries) {
  // columnBoundaries detected dynamically from header row
  // Find which hour column this x coordinate falls in
  for (const [hour, bounds] of Object.entries(columnBoundaries)) {
    if (x >= bounds.min && x <= bounds.max) return parseInt(hour);
  }
  return null; // BREAK or LUNCH column - skip
}

function detectColumnBoundaries(items) {
  // Find the header row containing "1", "2", "3"... hour numbers
  // These headers tell us exactly where each column starts
  
  // Look for items with text "1" through "7" at similar Y positions
  // The X position of each number = start of that hour column
  
  const hourItems = items.filter(item => 
    /^[1-7]$/.test(item.text) && 
    items.some(other => 
      Math.abs(other.y - item.y) < 5 && 
      /^[1-7]$/.test(other.text) &&
      other.text !== item.text
    )
  );
  
  // Build column map: hour number → {min_x, max_x}
  const boundaries = {};
  const sorted = hourItems.sort((a,b) => parseInt(a.text) - parseInt(b.text));
  
  for (let i = 0; i < sorted.length; i++) {
    const hour = parseInt(sorted[i].text);
    const minX = sorted[i].x - 10;
    const maxX = i < sorted.length - 1 ? sorted[i+1].x - 10 : sorted[i].x + 100;
    boundaries[hour] = { min: minX, max: maxX };
  }
  
  return boundaries;
}
```

---

## ROOT CAUSE 3: Grid cells not being read — only summary table used

The parser is reading subject codes ONLY from the summary table at the bottom,
then trying to guess slot positions. It must instead read cells directly from 
the grid using Y-coordinate row detection.

THE FIX: Complete grid reading algorithm:
```javascript
function parseGridFromCoordinates(items, columnBoundaries) {
  const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  
  // Step 1: Find Y coordinates of each day row
  // Look for items whose text is a day name
  const dayRows = {};
  for (const item of items) {
    if (DAY_NAMES.includes(item.text)) {
      dayRows[item.text] = item.y;
    }
  }
  
  // Step 2: For each day, find all items within that row's Y range
  // Row height is approximately 25-40px
  const ROW_HEIGHT = 35;
  
  const grid = {}; // grid[day][hour] = subjectCode
  
  for (const [day, dayY] of Object.entries(dayRows)) {
    grid[day] = {};
    
    // Get all items in this day's row (within ROW_HEIGHT pixels of day Y)
    const rowItems = items.filter(item => 
      Math.abs(item.y - dayY) < ROW_HEIGHT &&
      item.text !== day  // exclude the day label itself
    );
    
    // Step 3: For each item in the row, determine which hour column it's in
    for (const item of rowItems) {
      const hour = getHourFromX(item.x, columnBoundaries);
      if (!hour) continue; // skip BREAK/LUNCH items
      
      // Step 4: Clean the cell text to extract subject code
      const code = extractSubjectCode(item.text);
      if (code) {
        grid[day][hour] = {
          code,
          rawText: item.text,
          hasLeftArrow: item.text.includes('←'),
          hasRightArrow: item.text.includes('→'),
          x: item.x,
          y: item.y
        };
      }
    }
  }
  
  return grid;
}

function extractSubjectCode(cellText) {
  // Remove arrows
  const clean = cellText.replace(/[←→←→\-\s]/g, '').trim();
  
  // Match subject code pattern: digits + letters + digits
  // e.g., 22IT403, 24AD401, 22CS512
  const codeMatch = clean.match(/\d{2}[A-Z]{2,3}\d{3}/);
  if (codeMatch) return codeMatch[0];
  
  // Match non-teaching codes
  if (['TWM','LIB','SEMINAR'].includes(clean.toUpperCase())) {
    return clean.toUpperCase();
  }
  
  // Match text labels (JAVA, DATA STRUCTURES, DS)
  const textLabels = {
    'JAVA': null,           // resolve later from summary
    'DATASTRUCTURES': null, // resolve later from summary
    'DS': null,
    'PYTHON': null,
    'CPROGRAMMING': null
  };
  if (textLabels.hasOwnProperty(clean.replace(/\s/g,''))) {
    return clean; // return as-is, resolve in post-processing
  }
  
  return null;
}
```

---

## ROOT CAUSE 4: Practical span detection broken

Practical slots like "←24AD401→" span 2 hours. Currently these
are either dropped or merged with adjacent cells.

THE FIX: After building the grid, detect and handle practical spans:
```javascript
function detectPracticalSpans(grid) {
  for (const [day, hours] of Object.entries(grid)) {
    for (const [hour, slot] of Object.entries(hours)) {
      if (!slot) continue;
      
      const h = parseInt(hour);
      
      // Case 1: "CODE→" = practical start, spans to h+1
      if (slot.hasRightArrow && !slot.hasLeftArrow) {
        slot.is_practical_span = true;
        slot.practical_pair_hour = h + 1;
        slot.is_span_start = true;
        // Mark the next hour as span end
        if (grid[day][h+1]) {
          grid[day][h+1].is_practical_span = true;
          grid[day][h+1].practical_pair_hour = h;
          grid[day][h+1].is_span_end = true;
        }
      }
      
      // Case 2: "←CODE" = practical end (already handled above)
      // Case 3: "←CODE→" = middle of span (3-hour practicals, rare)
      if (slot.hasLeftArrow && slot.hasRightArrow) {
        slot.is_practical_span = true;
        slot.practical_pair_hour = h - 1; // links to previous
      }
    }
  }
  return grid;
}
```

---

## COMPLETE REWRITE OF timetableParser.js

Rewrite the entire parser file with this structure:
```javascript
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

class TimetableParser {
  
  async parsePDF(filePath) {
    const pdf = await pdfjsLib.getDocument(filePath).promise;
    const results = [];
    const errors = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const facultyData = await this.parseFacultyPage(pdf, pageNum);
        if (facultyData) results.push(facultyData);
      } catch (err) {
        errors.push({ page: pageNum, error: err.message });
      }
    }
    
    return { results, errors };
  }
  
  async parseFacultyPage(pdf, pageNum) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Extract items with coordinates
    const items = textContent.items
      .map(item => ({
        text: item.str.trim(),
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5])
      }))
      .filter(item => item.text.length > 0);
    
    // Check if this is a valid faculty page
    const facultyNameItem = items.find(item => 
      item.text.includes('Faculty Name') || item.text.includes('Faculty  Name')
    );
    if (!facultyNameItem) return null;
    
    // Extract faculty details
    const faculty = this.extractFacultyName(items);
    if (!faculty) return null;
    
    // Detect column boundaries from header row
    const columnBoundaries = this.detectColumnBoundaries(items);
    
    // Parse the grid
    const rawGrid = this.parseGridFromCoordinates(items, columnBoundaries);
    
    // Parse summary table
    const summaryData = this.parseSummaryTable(items);
    
    // Resolve text labels to subject codes using summary data
    const resolvedGrid = this.resolveTextLabels(rawGrid, summaryData);
    
    // Detect practical spans
    const finalGrid = this.detectPracticalSpans(resolvedGrid);
    
    // Convert grid to slot array
    const slots = this.gridToSlots(finalGrid, summaryData);
    
    return {
      ...faculty,
      slots,
      subjects: summaryData,
      rawGrid: finalGrid
    };
  }
  
  extractFacultyName(items) {
    // Find "Faculty Name:" text and extract name + designation
    // Handle: "Faculty Name:", "Faculty Name :", "Faculty  Name:"
    for (const item of items) {
      if (/faculty\s*name\s*:/i.test(item.text)) {
        // Name might be in same item or next item
        const nameMatch = item.text.match(
          /faculty\s*name\s*:\s*(.+?),?\s*((?:Dr|Mr|Ms|Mrs)\.?.+?),\s*(.+\/CSE)/i
        );
        // ... extract and return
      }
    }
  }
  
  // ... all other methods as defined above
}

module.exports = new TimetableParser();
```

---

## VERIFICATION: After rewriting, test against Dr.S.Ramasamy page

Dr.S.Ramasamy's page should produce EXACTLY these slots:
```javascript
const expectedSlots = [
  { day: 'Monday',    hour: 2, code: '24AD401', type: 'theory',    class: 'II AI&DS B' },
  { day: 'Monday',    hour: 7, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
  { day: 'Tuesday',   hour: 1, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
  { day: 'Tuesday',   hour: 3, code: '24AD401', type: 'practical', class: 'II AI&DS B', span_start: true, pair: 4 },
  { day: 'Tuesday',   hour: 4, code: '24AD401', type: 'practical', class: 'II AI&DS B', span_end: true,   pair: 3 },
  { day: 'Tuesday',   hour: 5, code: 'TWM',     type: 'others',    class: 'IV CSE C',   non_teaching: true },
  { day: 'Wednesday', hour: 1, code: '22AD505', type: 'practical', class: 'IV CSE A&B', span_start: true, pair: 2 },
  { day: 'Wednesday', hour: 2, code: '22AD505', type: 'practical', class: 'IV CSE A&B', span_end: true,   pair: 1 },
  { day: 'Wednesday', hour: 3, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
  { day: 'Wednesday', hour: 6, code: '24AD401', type: 'theory',    class: 'II AI&DS B' },
  { day: 'Wednesday', hour: 7, code: 'LIB',     type: 'others',    class: 'IV CSE C',   non_teaching: true },
  { day: 'Thursday',  hour: 1, code: '24CS402', type: 'practical', class: 'II CSE C',   span_start: true, pair: 2 },
  { day: 'Thursday',  hour: 2, code: '24CS402', type: 'practical', class: 'II CSE C',   span_end: true,   pair: 1 },
  { day: 'Thursday',  hour: 3, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
  { day: 'Thursday',  hour: 5, code: '24AD401', type: 'theory',    class: 'II AI&DS B' },
  { day: 'Friday',    hour: 4, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
  { day: 'Saturday',  hour: 5, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
];
// Total: 17 slots (15 hours + 2 practical pair duplicates)
```

Write a test function that:
1. Parses just Dr.S.Ramasamy's page
2. Compares output against expectedSlots above
3. Prints PASS/FAIL per slot
4. Only proceeds to full seed if ALL slots pass

Do not proceed to seeding until Ramasamy test passes 100%.