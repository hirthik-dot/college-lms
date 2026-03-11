const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { generateGmail, generateStaffCode } = require('./gmailGenerator');

const HOUR_TIMES = {
    1: { start: '09:15', end: '10:05' },
    2: { start: '10:05', end: '10:55' },
    3: { start: '11:15', end: '12:05' },
    4: { start: '12:05', end: '12:55' },
    5: { start: '14:00', end: '14:50' },
    6: { start: '14:50', end: '15:40' },
    7: { start: '15:40', end: '16:30' },
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const NON_TEACHING_SLOTS = ['TWM', 'LIB', 'SEMINAR', 'LIBRARY', 'MEETING', 'FREE'];

function isValidClassName(name) {
  if (!name || typeof name !== 'string') return false;
  
  const cleaned = name.trim();
  
  // Must match pattern: [Roman numeral] [DEPT] [optional section]
  // Valid: "II CSE A", "III AI&DS", "IV CSE C", "I CSE B"
  const validPattern = /^(I{1,3}V?|IV)\s+(CSE|AI&DS|AIDS|ECE)(\s+[A-C])?(\s*[&]\s*(CSE|AI&DS|AIDS)?\s*([A-C])?)?$/i;
  
  // Also allow combined patterns
  const combinedPattern = /^(I{1,3}V?|IV)\s+(CSE|AI&DS)\s+[A-C]\s*[&]\s*(AI&DS|CSE|B|C|A)?\s*[A-C]?$/i;
  
  return validPattern.test(cleaned) || combinedPattern.test(cleaned);
}

function normalizeClassName(raw) {
  let name = raw.trim()
    .replace(/\s*-\s*/g, ' ')    // "II CSE - B" → "II CSE B"
    .replace(/\s+/g, ' ')         // multiple spaces → single space
    .replace(/AIDS/gi, 'AI&DS')   // "AIDS" → "AI&DS"
    .replace(/&\s*AIDS/gi, '& AI&DS') // normalize
    .toUpperCase();
  
  // Fix Roman numeral extraction errors
  name = name.replace(/^I\s+(II|III|IV)\s+/, '$1 ');
  name = name.replace(/^(II|III|IV)\s+I\s+/, '$1 ');
  name = name.replace(/^(I{1,3}V?|IV)\s+\1\s+/, '$1 ');
  name = name.replace(/^I\s+PRACTICAL\s+/i, '');
  
  // Title case the result
  return name
    .replace('CSEA', 'CSE A')
    .replace('CSEB', 'CSE B')
    .replace('CSEC', 'CSE C');
}

function parseClassName(rawClassName) {
    if (!rawClassName) return [];
    const name = rawClassName.trim();
    const cleaned = name.replace(/\s*\((?:Main|Lab|Practical|Theory)\)\s*/gi, '').trim();

    const sectionSplit = cleaned.match(/^(I{1,4}V?|IV|III|II|I)\s+(CSE|AI&DS|AIDS)\s+([A-C])\s*&\s*([A-C])$/i);
    if (sectionSplit) {
        const [, year, dept, sec1, sec2] = sectionSplit;
        return [
            { name: `${year} ${dept} ${sec1}`, year, department: dept, section: sec1 },
            { name: `${year} ${dept} ${sec2}`, year, department: dept, section: sec2 }
        ];
    }

    const deptSplit = cleaned.match(/^(I{1,4}V?|IV|III|II|I)\s+CSE\s+([A-C])\s*&\s*(AI&DS|AIDS)$/i);
    if (deptSplit) {
        const [, year, sec] = deptSplit;
        return [
            { name: `${year} CSE ${sec}`, year, department: 'CSE', section: sec },
            { name: `${year} AI&DS`, year, department: 'AI&DS', section: '' }
        ];
    }

    const shortSplit = cleaned.match(/^(I{1,4}V?|IV|III|II|I)\s+([A-C])\s*&\s*(AI&DS|AIDS)$/i);
    if (shortSplit) {
        const [, year, sec] = shortSplit;
        return [
            { name: `${year} CSE ${sec}`, year, department: 'CSE', section: sec },
            { name: `${year} AI&DS`, year, department: 'AI&DS', section: '' }
        ];
    }

    const simpleMatch = cleaned.match(/^(I{1,4}V?|IV|III|II|I)\s+(\w+(?:&\w+)?)\s*([A-C])?\s*$/i);
    if (simpleMatch) {
        const [, year, dept, sec] = simpleMatch;
        return [{
            name: sec ? `${year} ${dept} ${sec}` : `${year} ${dept}`,
            year,
            department: dept,
            section: sec || ''
        }];
    }

    return [{ name: cleaned || name, year: 0, department: '', section: '' }];
}

function yearToInt(year) {
    if (typeof year === 'number' && !isNaN(year)) return year;
    const s = String(year || '').toUpperCase().trim();
    const map = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
    if (map[s] !== undefined) return map[s];
    const n = parseInt(s, 10);
    return isNaN(n) ? 1 : n;
}

function yearToSemester(year, semType = 'ODD') {
    const y = yearToInt(year);
    const base = (y - 1) * 2;
    return semType === 'ODD' ? base + 1 : base + 2;
}

function isCrossDept(className) {
    const dept = className.toUpperCase();
    return dept.includes('ECE') || dept.includes('EEE') || dept.includes('MECH') ||
        dept.includes('CIVIL') || dept.includes('BME') || dept.includes('IT ');
}

class TimetableParser {
  async parsePDF(input) {
    let pdfData;
    if (typeof input === 'string') {
        pdfData = new Uint8Array(fs.readFileSync(input));
    } else {
        pdfData = new Uint8Array(input);
    }
    
    // Silence pdf.js warnings
    const loadingTask = pdfjsLib.getDocument({ 
        data: pdfData,
        standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
        disableFontFace: true 
    });
    
    const pdf = await loadingTask.promise;
    const facultyList = [];
    const errors = [];
    let staffCodeIndex = 0;
    const existingGmails = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const facultyData = await this.parseFacultyPage(pdf, pageNum);
        if (facultyData) {
            staffCodeIndex++;
            facultyData.gmail = generateGmail(facultyData.full_name, existingGmails);
            existingGmails.push(facultyData.gmail);
            facultyData.staff_code = generateStaffCode('CSE', staffCodeIndex);
            facultyData.isHod = /prof\s*&?\s*head/i.test(facultyData.designation || '');
            facultyList.push(facultyData);
        }
      } catch (err) {
        errors.push({ page: pageNum, error: err.message });
      }
    }
    
    for (const f of facultyList) {
        if (f.slots.length < 3) {
            errors.push({ page: 'post-parse', staff: f.full_name, error: `Only ${f.slots.length} slots parsed (expected 10-42). Possible incomplete grid.` });
        }
    }

    const codes = new Set();
    for(const f of facultyList) {
        for(const s of f.subjects) {
            codes.add(s.code.toUpperCase());
        }
    }

    return { 
        faculty: facultyList,
        totalStaff: facultyList.length,
        totalSlots: facultyList.reduce((acc, f)=>acc+f.slots.length, 0),
        totalSubjects: codes.size,
        errors 
    };
  }

  async parseFacultyPage(pdf, pageNum) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const items = textContent.items
      .map(item => ({
        text: item.str.trim(),
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        width: Math.round(item.width)
      }))
      .filter(item => item.text.length > 0);
      
    const facultyNameItem = items.find(item => 
      item.text.includes('Faculty Name') || item.text.includes('Faculty  Name')
    );
    if (!facultyNameItem) return null;
    
    const faculty = this.extractFacultyName(items);
    if (!faculty || !faculty.full_name) return null;
    
    const columnBoundaries = this.detectColumnBoundaries(items);
    
    const rawGrid = this.parseGridFromCoordinates(items, columnBoundaries);
    
    const summaryData = this.parseSummaryTable(items);
    
    const resolvedGrid = this.resolveTextLabels(rawGrid, summaryData);
    
    const finalGrid = this.detectPracticalSpans(resolvedGrid);
    
    const slots = this.gridToSlots(finalGrid, summaryData);
    
    return {
      ...faculty,
      slots,
      subjects: summaryData,
      rawGrid: finalGrid
    };
  }

  extractFacultyName(items) {
    const sorted = [...items].sort((a,b) => {
        if (Math.abs(a.y - b.y) > 5) return b.y - a.y; 
        return a.x - b.x; 
    });
    
    let lines = [];
    if (sorted.length === 0) return null;
    let currentLine = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        if (Math.abs(sorted[i].y - currentLine[0].y) < 5) {
            currentLine.push(sorted[i]);
        } else {
            lines.push(currentLine.map(x=>x.text).join(' '));
            currentLine = [sorted[i]];
        }
    }
    if (currentLine.length) lines.push(currentLine.map(x=>x.text).join(' '));

    let nameLine = '';
    for(const l of lines) {
        const m = l.match(/Faculty\s*Name\s*:\s*(.+)/i);
        if (m) {
            nameLine = m[1].trim();
            break;
        }
    }
    
    if (!nameLine) {
        for(let i=0; i<items.length; i++){
            if(/faculty\s*name\s*:/i.test(items[i].text)){
                nameLine = items[i].text.replace(/.*?faculty\s*name\s*:/i, '').trim();
                // If it is empty, meaning next item is the name
                if(!nameLine && i+1 < items.length) {
                    nameLine = items[i+1].text;
                }
                break;
            }
        }
    }

    if (!nameLine) return null;

    let full_name, designation = '';
    const commaIdx = nameLine.indexOf(',');
    if (commaIdx > 0) {
        full_name = nameLine.substring(0, commaIdx).trim();
        designation = nameLine.substring(commaIdx + 1).trim();
    } else {
        const dMatch = nameLine.match(/(.+?)\s+((?:AP|ASP|Prof|HOD|Asst|Assoc)[\/\w\s&]*)/i);
        if (dMatch) {
            full_name = dMatch[1].trim();
            designation = dMatch[2].trim();
        } else {
            full_name = nameLine;
            designation = '';
        }
    }

    if (full_name && designation.length > 50) designation = designation.substring(0, 50);

    return { full_name, designation };
  }

  detectColumnBoundaries(items) {
    const hourItems = items.filter(item => 
      /^[1-7]$/.test(item.text) && 
      items.some(other => 
        Math.abs(other.y - item.y) < 5 && 
        /^[1-7]$/.test(other.text) &&
        other.text !== item.text
      )
    );
    
    const boundaries = {};
    const sorted = hourItems.sort((a,b) => parseInt(a.text) - parseInt(b.text));
    
    const uniqueHours = [];
    const seen = new Set();
    for (const item of sorted) {
        if (!seen.has(item.text)) {
            seen.add(item.text);
            uniqueHours.push(item);
        }
    }
    
    for (let i = 0; i < uniqueHours.length; i++) {
      const hour = parseInt(uniqueHours[i].text);
      // Adjusted minX to catch text that starts slightly before the column header center
      const minX = uniqueHours[i].x - 35;
      const maxX = i < uniqueHours.length - 1 ? uniqueHours[i+1].x - 35 : uniqueHours[i].x + 100;
      boundaries[hour] = { min: minX, max: maxX };
    }
    
    return boundaries;
  }

  getHourFromX(x, columnBoundaries) {
    for (const [hour, bounds] of Object.entries(columnBoundaries)) {
      if (x >= bounds.min && x <= bounds.max) return parseInt(hour);
    }
    return null;
  }

  parseGridFromCoordinates(items, columnBoundaries) {
    const dayRows = {};
    for (const item of items) {
      if (DAYS.includes(item.text)) {
        dayRows[item.text] = item.y;
      }
    }
    
    // Row spacing is ~28px. Tolerance must be less than half (14) to avoid merging adjacent days.
    const ROW_HEIGHT = 14;
    const grid = {};
    
    for (const [day, dayY] of Object.entries(dayRows)) {
      grid[day] = {};
      
      const rowItems = items.filter(item => 
        Math.abs(item.y - dayY) < ROW_HEIGHT &&
        item.text !== day
      );
      
      for (const item of rowItems) {
        const hour = this.getHourFromX(item.x, columnBoundaries);
        if (!hour) continue;
        
        if (!grid[day][hour]) {
            grid[day][hour] = {
              code: '',
              rawText: '',
              hasLeftArrow: false,
              hasRightArrow: false,
              x: item.x,
              y: item.y
            };
        }
        
        grid[day][hour].rawText += ' ' + item.text;
        if (/[←⬅<\uF0DF]/.test(item.text)) grid[day][hour].hasLeftArrow = true;
        if (/[→➡>\uF0E0]/.test(item.text)) grid[day][hour].hasRightArrow = true;
      }
      
      // Merge adjacent orphan cells that only contain arrows or partial numbers back to the left
      for(let h=1; h<=6; h++) {
          if(!grid[day][h] || !grid[day][h+1]) continue;
          
          const nextText = grid[day][h+1].rawText.trim();
          // If the next cell is just an arrow, or short digits + arrow, and doesn't contain a full subject code
          if (nextText && !this.extractSubjectCode(nextText)) {
              if (/^[0-9\s←→⬅➡><\-\\uF0DF\uF0E0]+$/.test(nextText)) {
                  grid[day][h].rawText += ' ' + nextText;
                  if (grid[day][h+1].hasLeftArrow) grid[day][h].hasLeftArrow = true;
                  if (grid[day][h+1].hasRightArrow) grid[day][h].hasRightArrow = true;
                  
                  // clear the next cell
                  grid[day][h+1].rawText = '';
                  grid[day][h+1].hasLeftArrow = false;
                  grid[day][h+1].hasRightArrow = false;
              }
          }
      }

      // Merge from left to right if left is orphan (e.g. only contains ←)
      for(let h=7; h>=2; h--) {
          if(!grid[day][h] || !grid[day][h-1]) continue;
          
          const prevText = grid[day][h-1].rawText.trim();
          if (prevText && !this.extractSubjectCode(prevText)) {
              if (/^[0-9\s←→⬅➡><\-\\uF0DF\uF0E0]+$/.test(prevText)) {
                  grid[day][h].rawText = prevText + ' ' + grid[day][h].rawText;
                  if (grid[day][h-1].hasLeftArrow) grid[day][h].hasLeftArrow = true;
                  if (grid[day][h-1].hasRightArrow) grid[day][h].hasRightArrow = true;
                  
                  grid[day][h-1].rawText = '';
                  grid[day][h-1].hasLeftArrow = false;
                  grid[day][h-1].hasRightArrow = false;
              }
          }
      }
      
      for(let h=1; h<=7; h++) {
          if(!grid[day][h]) continue;
          const extractedCode = this.extractSubjectCode(grid[day][h].rawText);
          if (extractedCode) {
              grid[day][h].code = extractedCode;
          } else {
              delete grid[day][h]; // Invalid/empty cell
          }
      }
    }
    
    return grid;
  }

  extractSubjectCode(cellText) {
    const clean = cellText.replace(/[←→⬅➡><\-\s\uF0DF\uF0E0]/g, '').trim();
    if (!clean) return null;
    
    // We expect exactly 3 trailing digits.
    const codeMatch = clean.match(/\d{2}[A-Z]{2,4}\d{3}/);
    if (codeMatch) return codeMatch[0];
    
    const ntUpper = clean.toUpperCase();
    if (NON_TEACHING_SLOTS.some(kw => ntUpper.includes(kw))) {
        return NON_TEACHING_SLOTS.find(kw => ntUpper.includes(kw));
    }
    
    const textLabels = {
      'JAVA': null,
      'DATASTRUCTURES': null,
      'DS': null,
      'PYTHON': null,
      'CPROGRAMMING': null,
      'CPROG': null
    };
    if (textLabels.hasOwnProperty(clean.toUpperCase())) {
      return clean.toUpperCase();
    }
    
    return null;
  }

  parseSummaryTable(items) {
    const sorted = [...items].sort((a,b) => {
        if (Math.abs(a.y - b.y) > 5) return b.y - a.y;
        return a.x - b.x;
    });
    
    let lines = [];
    if (sorted.length === 0) return [];
    let currentLine = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        if (Math.abs(sorted[i].y - currentLine[0].y) < 5) {
            currentLine.push(sorted[i]);
        } else {
            lines.push(currentLine.map(t=>t.text).join('   '));
            currentLine = [sorted[i]];
        }
    }
    if (currentLine.length) lines.push(currentLine.map(t=>t.text).join('   '));
    
    const text = lines.join('\n');
    const subjects = [];
    const parsedLines = text.split(/\n|\r/).map(l => l.trim()).filter(l => l);

    let currentSection = null;

    for (const line of parsedLines) {
        const upper = line.toUpperCase();

        if (upper.includes('THEORY') && !upper.match(/\d{2}[A-Z]{2}\d{3}/)) {
            currentSection = 'theory';
            continue;
        }
        if (upper.includes('PRACTICAL') && !upper.match(/\d{2}[A-Z]{2}\d{3}/)) {
            currentSection = 'practical';
            continue;
        }
        if ((upper.includes('OTHERS') || upper.includes('OTHER')) && !upper.match(/\d{2}[A-Z]{2}\d{3}/)) {
            currentSection = 'others';
            continue;
        }

        const subjectMatch = line.match(/(\d{2}[A-Z]{2,4}\d{2,4})\s+(.+?)\s+((?:I{1,3}|IV)\s+\w+.*?)\s+(\d+)\s*$/i);
        if (subjectMatch) {
            const code = subjectMatch[1].trim();
            let name = subjectMatch[2].trim().replace(/\s*\(Main\)\s*/gi, '');
            let className = subjectMatch[3].trim();
            const hours = parseInt(subjectMatch[4]);
            
            className = normalizeClassName(className);
            if (!isValidClassName(className)) {
                console.warn(`Class name validation failed: "${className}" from row: ${line}`);
                className = '';
            }

            subjects.push({ code, name, class_name: className, hours, type: currentSection || 'theory' });
            continue;
        }

        const altMatch = line.match(/(\d{2}[A-Z]{2,4}\d{2,4})\s+(.+)/i);
        if (altMatch && currentSection) {
            const parts = altMatch[2].split(/\s{2,}|\t/).map(p => p.trim()).filter(p => p);
            if (parts.length >= 2) {
                const code = altMatch[1].trim();
                let name = parts[0].replace(/\s*\(Main\)\s*/gi, '');
                let className = parts.length >= 3 ? parts[1] : '';
                const hours = parseInt(parts[parts.length - 1]) || 0;

                if (className) {
                    className = normalizeClassName(className);
                    if (!isValidClassName(className)) {
                        console.warn(`Class name validation failed: "${className}" from row: ${line}`);
                        className = '';
                    }
                }
                
                subjects.push({ code, name, class_name: className, hours, type: currentSection });
            }
        }

        if (currentSection === 'others') {
            const ntMatch = line.match(/(TWM|LIB(?:RARY)?|SEMINAR)\s+(.*?)\s+(\d+)\s*$/i);
            if (ntMatch) {
                subjects.push({
                    code: ntMatch[1].toUpperCase(),
                    name: ntMatch[2].trim() || ntMatch[1].toUpperCase(),
                    class_name: '',
                    hours: parseInt(ntMatch[3]),
                    type: 'others',
                });
            }
        }
    }
    return subjects;
  }

  resolveTextLabels(grid, summaryData) {
    const subjectNameToCode = {};
    for (const subj of summaryData) {
        const cleanName = subj.name.replace(/\s+/g,'').toUpperCase();
        subjectNameToCode[cleanName] = subj.code;

        if (cleanName.includes('JAVA')) subjectNameToCode['JAVA'] = subj.code;
        if (cleanName.includes('DATASTRUCTURE')) {
            subjectNameToCode['DATASTRUCTURES'] = subj.code;
            subjectNameToCode['DS'] = subj.code;
        }
        if (cleanName.includes('PROGRAMMINGINC') || cleanName.includes('CPROG')) {
            subjectNameToCode['CPROGRAMMING'] = subj.code;
            subjectNameToCode['CPROG'] = subj.code;
        }
        if (cleanName.includes('PYTHON')) subjectNameToCode['PYTHON'] = subj.code;
    }

    if (!subjectNameToCode['JAVA']) {
        const subj = summaryData.find(s => s.name.toUpperCase().includes('JAVA'));
        if (subj) subjectNameToCode['JAVA'] = subj.code;
    }
    if (!subjectNameToCode['DATASTRUCTURES']) {
        const subj = summaryData.find(s => s.name.toUpperCase().includes('DATA STRUCTURE'));
        if (subj) {
            subjectNameToCode['DATASTRUCTURES'] = subj.code;
            subjectNameToCode['DS'] = subj.code;
        }
    }

    for (const [day, hours] of Object.entries(grid)) {
      for (const [hour, slot] of Object.entries(hours)) {
        if (!slot) continue;
        if (!slot.code.match(/\d{2}[A-Z]{2,4}\d{2,4}/) && !NON_TEACHING_SLOTS.includes(slot.code)) {
            const resolved = subjectNameToCode[slot.code]; // exact match
            if (resolved) {
                slot.code = resolved;
            }
        }
      }
    }
    
    return grid;
  }

  detectPracticalSpans(grid) {
    for (const [day, hours] of Object.entries(grid)) {
      for (const [hour, slot] of Object.entries(hours)) {
        if (!slot) continue;
        
        const h = parseInt(hour);
        
        // Case 1/3: "CODE→" or "←CODE→" is the start of a span for an N-hour span (typically 2). Maps to h+1.
        if ((slot.hasRightArrow && !slot.hasLeftArrow) || (slot.hasLeftArrow && slot.hasRightArrow)) {
          slot.is_practical_span = true;
          slot.practical_pair_hour = h + 1;
          slot.is_span_start = true;
          // create end slot if not exists, or connect
          if (!grid[day][h+1]) grid[day][h+1] = { code: slot.code, rawText: slot.code, hasLeftArrow: true, hasRightArrow: false, x: 0, y: 0 };
          grid[day][h+1].is_practical_span = true;
          grid[day][h+1].practical_pair_hour = h;
          grid[day][h+1].is_span_end = true;
          grid[day][h+1].code = slot.code;
        }
        
        // Case 2: "←CODE" = practical end (only if standalone and unhandled)
        if (slot.hasLeftArrow && !slot.hasRightArrow && !slot.is_span_end) {
            slot.is_practical_span = true;
            slot.practical_pair_hour = h - 1;
            slot.is_span_end = true;
            if (!grid[day][h-1]) grid[day][h-1] = { code: slot.code, rawText: slot.code, hasLeftArrow: false, hasRightArrow: true, x: 0, y: 0 };
            grid[day][h-1].is_practical_span = true;
            grid[day][h-1].practical_pair_hour = h;
            grid[day][h-1].is_span_start = true;
            grid[day][h-1].code = slot.code;
        }
      }
    }
    return grid;
  }

  gridToSlots(grid, summaryData) {
    const slots = [];
    const subjectMap = {};
    for (const subj of summaryData) {
        subjectMap[subj.code.toUpperCase()] = subj;
    }

    for (const day of DAYS) {
        if (!grid[day]) continue;
        for (let h = 1; h <= 7; h++) {
            const cell = grid[day][h];
            if (!cell) continue;
            
            const code = cell.code;
            const isNonTeaching = NON_TEACHING_SLOTS.includes(code);
            const times = HOUR_TIMES[h];
            
            const slot = {
                day,
                hour: h,
                subject_code: code,
                subject_name: subjectMap[code] ? subjectMap[code].name : '',
                class_name: subjectMap[code] ? subjectMap[code].class_name : '',
                slot_type: isNonTeaching ? 'others' : (cell.is_practical_span ? 'practical' : 'theory'),
                is_practical_span: !!cell.is_practical_span,
                is_non_teaching: isNonTeaching,
                practical_pair_hour: cell.practical_pair_hour || null,
                start_time: times.start,
                end_time: times.end,
            };
            slots.push(slot);
        }
    }
    return slots;
  }
}

/**
 * Parse a timetable PDF file.
 * @param {string|Buffer} input - file path or buffer
 * @returns {Promise<Object>} parsed timetable data
 */
async function parseTimetablePDF(input) {
    const parser = new TimetableParser();
    return parser.parsePDF(input);
}

module.exports = { 
  parseTimetablePDF: (input) => new TimetableParser().parsePDF(input), 
  TimetableParser,
  parseClassName,
  yearToSemester,
  yearToInt,
  isCrossDept,
  isValidClassName,
  normalizeClassName,
  HOUR_TIMES, 
  DAYS,
  NON_TEACHING_SLOTS,
};
