// Document Extractor & Syllabus Parser for OBE-ICAS Platform
// Supports Word (.docx), PDF (.pdf), Plain Text (.txt, .md, .rtf, .csv)
// Zero-dependency pure client-side extraction with fallback support

/**
 * Extracts raw text from an uploaded File object
 */
export async function extractTextFromFile(file) {
  const fileName = file.name.toLowerCase();
  
  // 1. Plain text formats
  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv') || fileName.endsWith('.json') || fileName.endsWith('.rtf') || file.type.startsWith('text/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result || '');
      reader.onerror = (e) => reject(new Error('Failed to read text file.'));
      reader.readAsText(file);
    });
  }

  // 2. Word documents (.docx)
  if (fileName.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const docxText = await extractTextFromDocx(arrayBuffer);
      if (docxText && docxText.trim().length > 10) {
        return docxText;
      }
    } catch (err) {
      console.warn('Docx extraction error, trying fallback:', err);
    }
  }

  // 3. PDF documents (.pdf)
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Try PDF.js if available
      if (typeof window !== 'undefined' && window.pdfjsLib) {
        const text = await extractTextFromPdfJs(arrayBuffer);
        if (text && text.trim().length > 10) return text;
      }
      // Pure JS stream fallback with decompression
      const streamText = await extractTextFromPdfStreams(arrayBuffer);
      if (streamText && streamText.trim().length > 10) return streamText;
    } catch (err) {
      console.warn('PDF extraction error:', err);
    }
  }

  return '';
}

/**
 * Pure JavaScript extractor for .docx (Word) archives
 * Parses ZIP local headers and decompresses word/document.xml
 */
export async function extractTextFromDocx(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let offset = 0;

  while (offset <= bytes.length - 30) {
    // Check for PK\x03\x04
    if (bytes[offset] === 0x50 && bytes[offset + 1] === 0x4B && bytes[offset + 2] === 0x03 && bytes[offset + 3] === 0x04) {
      const view = new DataView(arrayBuffer, offset);
      const method = view.getUint16(8, true);
      const compSize = view.getUint32(18, true);
      const uncompSize = view.getUint32(22, true);
      const nameLen = view.getUint16(26, true);
      const extraLen = view.getUint16(28, true);
      
      const nameBytes = bytes.slice(offset + 30, offset + 30 + nameLen);
      const name = new TextDecoder('latin1').decode(nameBytes);
      const dataStart = offset + 30 + nameLen + extraLen;

      if (name === 'word/document.xml') {
        const compBytes = bytes.slice(dataStart, dataStart + compSize);
        let xmlString = '';

        if (method === 0) { // Stored (uncompressed)
          xmlString = new TextDecoder('utf-8').decode(compBytes);
        } else if (method === 8 && typeof DecompressionStream !== 'undefined') {
          try {
            const ds = new DecompressionStream('deflate-raw');
            const writer = ds.writable.getWriter();
            writer.write(compBytes);
            writer.close();
            const decompressedBuf = await new Response(ds.readable).arrayBuffer();
            xmlString = new TextDecoder('utf-8').decode(decompressedBuf);
          } catch (e) {
            console.warn('DecompressionStream failed:', e);
          }
        }

        if (xmlString) {
          return parseDocxXmlText(xmlString);
        }
      }

      offset = dataStart + compSize;
    } else {
      offset++;
    }
  }

  // Fallback: search for <w:t> tags in raw text if stored or partial
  try {
    const rawStr = new TextDecoder('latin1').decode(bytes);
    return parseDocxXmlText(rawStr);
  } catch (e) {
    return '';
  }
}

/**
 * Parses XML text from word/document.xml into paragraphs
 */
function parseDocxXmlText(xmlString) {
  // Extract all <w:p> paragraphs
  const paragraphs = [];
  const pRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/gi;
  let pMatch;

  while ((pMatch = pRegex.exec(xmlString)) !== null) {
    const pContent = pMatch[1];
    const tRegex = /<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/gi;
    let tMatch;
    let line = '';
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      line += tMatch[1];
    }
    if (line.trim()) {
      paragraphs.push(line.trim());
    }
  }

  if (paragraphs.length > 0) {
    return paragraphs.join('\n');
  }

  // Generic fallback if <w:p> wrapper was altered
  const allTexts = [];
  const tRegex = /<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/gi;
  let match;
  while ((match = tRegex.exec(xmlString)) !== null) {
    if (match[1].trim()) allTexts.push(match[1].trim());
  }
  return allTexts.join('\n');
}

/**
 * Extracts text from PDF using PDF.js when loaded
 */
async function extractTextFromPdfJs(arrayBuffer) {
  if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions?.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageTexts = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageStr = textContent.items.map(item => item.str).join(' ');
    if (pageStr.trim()) pageTexts.push(pageStr.trim());
  }

  return pageTexts.join('\n\n');
}

/**
 * Fallback stream text extractor for PDF files with in-browser stream decompression
 */
export async function extractTextFromPdfStreams(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const latin1Decoder = new TextDecoder('latin1');
  const textBlocks = [];

  // 1. Scan for stream ... endstream blocks in PDF binary bytes
  // ASCII codes: 'stream' = [115, 116, 114, 101, 97, 109], 'endstream' = [101, 110, 100, 115, 116, 114, 101, 97, 109]
  let offset = 0;
  while (offset < bytes.length - 20) {
    if (bytes[offset] === 115 && bytes[offset + 1] === 116 && bytes[offset + 2] === 114 && bytes[offset + 3] === 101 && bytes[offset + 4] === 97 && bytes[offset + 5] === 109) {
      let dataStart = offset + 6;
      if (bytes[dataStart] === 13) dataStart++;
      if (bytes[dataStart] === 10) dataStart++;

      // Scan for 'endstream'
      let endPos = -1;
      const searchLimit = Math.min(bytes.length - 9, dataStart + 2000000);
      for (let j = dataStart; j < searchLimit; j++) {
        if (bytes[j] === 101 && bytes[j + 1] === 110 && bytes[j + 2] === 100 && bytes[j + 3] === 115 && bytes[j + 4] === 116 && bytes[j + 5] === 114 && bytes[j + 6] === 101 && bytes[j + 7] === 97 && bytes[j + 8] === 109) {
          endPos = j;
          break;
        }
      }

      if (endPos > dataStart) {
        let dataEnd = endPos;
        if (bytes[dataEnd - 1] === 10) dataEnd--;
        if (bytes[dataEnd - 1] === 13) dataEnd--;

        const chunk = bytes.slice(dataStart, dataEnd);
        let streamStr = '';

        if (typeof DecompressionStream !== 'undefined' && chunk.length > 2) {
          try {
            const ds = new DecompressionStream('deflate');
            const writer = ds.writable.getWriter();
            writer.write(chunk);
            writer.close();
            const decompBuf = await new Response(ds.readable).arrayBuffer();
            streamStr = latin1Decoder.decode(decompBuf);
          } catch (e1) {
            try {
              const ds = new DecompressionStream('deflate-raw');
              const writer = ds.writable.getWriter();
              writer.write(chunk);
              writer.close();
              const decompBuf = await new Response(ds.readable).arrayBuffer();
              streamStr = latin1Decoder.decode(decompBuf);
            } catch (e2) {}
          }
        }

        if (!streamStr) {
          streamStr = latin1Decoder.decode(chunk);
        }

        if (streamStr) {
          extractPdfOperators(streamStr, textBlocks);
        }

        offset = endPos + 9;
        continue;
      }
    }
    offset++;
  }

  // 2. Also extract from uncompressed objects in the file
  const fullRaw = latin1Decoder.decode(bytes);
  extractPdfOperators(fullRaw, textBlocks);

  return textBlocks.join('\n');
}

function extractPdfOperators(text, textBlocks) {
  // Tj: (text) Tj
  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(text)) !== null) {
    const str = match[1].replace(/\\([()\\])/g, '$1').trim();
    if (str.length > 0) {
      if (textBlocks.length === 0 || textBlocks[textBlocks.length - 1] !== str) {
        textBlocks.push(str);
      }
    }
  }

  // TJ: [ (text1) 12 (text2) ] TJ
  const arrayTjRegex = /\[(.*?)\]\s*TJ/gs;
  while ((match = arrayTjRegex.exec(text)) !== null) {
    const subRegex = /\(([^)]+)\)/g;
    let subMatch;
    let phrase = '';
    while ((subMatch = subRegex.exec(match[1])) !== null) {
      phrase += subMatch[1].replace(/\\([()\\])/g, '$1') + ' ';
    }
    const clean = phrase.trim();
    if (clean.length > 0) {
      if (textBlocks.length === 0 || textBlocks[textBlocks.length - 1] !== clean) {
        textBlocks.push(clean);
      }
    }
  }
}

/**
 * Intelligent Syllabus Parser
 * Extracts Course Code & Title, Description, Weekly Outline, and CLOs from raw syllabus text
 */
export function parseSyllabusText(rawText, fileName = '') {
  if (!rawText || !rawText.trim()) return null;

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let courseName = '';
  let courseDescription = '';
  let coursePlan = '';
  const clos = [];

  // 1. Dual Detection: Course Code & Course Title
  let detectedCode = '';
  let detectedTitle = '';

  const codeRegex = /\b([A-Z]{2,5}[ -]?\d{3,4}[A-Z]?)\b/i;
  const codeHeaderRegex = /(?:Course\s*Code|Course\s*No\.?|Subject\s*Code|Code)\s*[:\-–]\s*([A-Z0-9\s\-]+)/i;
  const titleHeaderRegex = /(?:Course\s*(?:Title|Name)?|Subject\s*(?:Title|Name)?|Subject)\s*[:\-–]\s*([^\n\r]+)/i;

  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const line = lines[i];

    // Check for explicit Course Code header: e.g. "Course Code: EE-312"
    if (!detectedCode) {
      const codeHeaderMatch = line.match(codeHeaderRegex);
      if (codeHeaderMatch) {
        const cm = codeHeaderMatch[1].trim().match(codeRegex);
        if (cm) detectedCode = cm[1].trim().toUpperCase();
      }
    }

    // Check for explicit Course Title header: e.g. "Course Title: Microcontroller & Embedded Systems" or "Course: CS-101 Programming Fundamentals"
    if (!detectedTitle) {
      const titleHeaderMatch = line.match(titleHeaderRegex);
      if (titleHeaderMatch && titleHeaderMatch[1].trim().length > 3) {
        let t = titleHeaderMatch[1].trim();
        if (!/department|faculty|university|semester|credit|instructor/i.test(t)) {
          const inlineCode = t.match(codeRegex);
          if (inlineCode && !detectedCode) {
            detectedCode = inlineCode[1].trim().toUpperCase();
          }
          detectedTitle = t;
        }
      }
    }

    // Check for inline combo: e.g. "EE-312: Microcontroller & Embedded Systems" or "CS-101 - ..."
    if (!detectedTitle && !detectedCode) {
      const combo = line.match(/\b([A-Z]{2,5}[ -]?\d{3,4}[A-Z]?)\s*[:\-–]\s*([A-Za-z0-9\s&,/-]{4,})/);
      if (combo) {
        detectedCode = combo[1].trim().toUpperCase();
        detectedTitle = combo[2].trim();
      }
    }
  }

  // Fallback scan for Course Code in early lines if not found yet
  if (!detectedCode) {
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i];
      if (/department|faculty|university|semester|credit|page|iso|ieee/i.test(line)) continue;
      const cm = line.match(codeRegex);
      if (cm) {
        detectedCode = cm[1].trim().toUpperCase();
        break;
      }
    }
    if (!detectedCode && fileName) {
      const fileCode = fileName.match(codeRegex);
      if (fileCode) detectedCode = fileCode[1].trim().toUpperCase();
    }
  }

  // Fallback scan for Course Title around detectedCode
  if (detectedCode && !detectedTitle) {
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i];
      if (/department|faculty|university|semester|credit|instructor|prerequisite|session|academic/i.test(line)) continue;
      const clean = line.replace(codeRegex, '').replace(/course\s*(?:code|title|name)?/gi, '').replace(/[:\-–]/g, '').trim();
      if (clean.length >= 4 && clean.length <= 75 && !/^\d+$/.test(clean)) {
        detectedTitle = clean;
        break;
      }
    }
  }

  // Synthesize Course Name & Code together
  if (detectedCode && detectedTitle) {
    const cleanTitle = detectedTitle.replace(new RegExp('^' + detectedCode.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '[:\\-–\\s]*', 'i'), '').trim();
    if (cleanTitle) {
      courseName = `${detectedCode}: ${cleanTitle}`;
    } else {
      courseName = detectedTitle;
    }
  } else if (detectedTitle) {
    courseName = detectedTitle;
  } else if (detectedCode) {
    let fallbackTitle = '';
    if (fileName) {
      fallbackTitle = fileName.replace(/\.[^/.]+$/, "").replace(codeRegex, '').replace(/[-_]/g, ' ').trim();
    }
    courseName = fallbackTitle ? `${detectedCode}: ${fallbackTitle}` : detectedCode;
  } else if (lines.length > 0) {
    for (let j = 0; j < Math.min(lines.length, 5); j++) {
      if (lines[j].length > 4 && lines[j].length < 80 && !/department|faculty|university|syllabus|course outline/i.test(lines[j])) {
        courseName = lines[j];
        break;
      }
    }
    if (!courseName && fileName) {
      courseName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    }
  }

  // 2. Bloom action verb map
  const verbBloomMap = {
    'remember': 'C1', 'define': 'C1', 'list': 'C1', 'state': 'C1', 'identify': 'C1', 'recall': 'C1', 'name': 'C1', 'label': 'C1',
    'understand': 'C2', 'explain': 'C2', 'describe': 'C2', 'discuss': 'C2', 'classify': 'C2', 'summarize': 'C2', 'interpret': 'C2', 'illustrate': 'C2',
    'apply': 'C3', 'calculate': 'C3', 'solve': 'C3', 'demonstrate': 'C3', 'implement': 'C3', 'execute': 'C3', 'operate': 'C3', 'compute': 'C3', 'determine': 'C3',
    'analyze': 'C4', 'analyse': 'C4', 'differentiate': 'C4', 'compare': 'C4', 'investigate': 'C4', 'diagnose': 'C4', 'distinguish': 'C4', 'model': 'C4', 'examine': 'C4',
    'evaluate': 'C5', 'appraise': 'C5', 'judge': 'C5', 'critique': 'C5', 'justify': 'C5', 'validate': 'C5', 'assess': 'C5', 'verify': 'C5',
    'design': 'C6', 'create': 'C6', 'develop': 'C6', 'formulate': 'C6', 'synthesize': 'C6', 'construct': 'C6', 'devise': 'C6', 'optimize': 'C6'
  };

  const cloRegex = /(?:CLO|CO|LO|Outcome)\s*[-_#]?\s*(\d+)[:.\-–]?\s*(.+)/i;
  let inCLOSection = false;
  let inPlanSection = false;
  let inDescSection = false;

  const planLines = [];
  const descLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Section terminators (only when line starts explicitly with these headings)
    if (/^(?:grading\s*policy|grade\s*distribution|evaluation\s*scheme|course\s*policy|academic\s*integrity|plagiarism\s*policy)/i.test(line)) {
      inCLOSection = false;
      inPlanSection = false;
      inDescSection = false;
      continue;
    }

    // Section triggers
    if (/course\s*learning\s*outcomes|learning\s*outcomes|\bclos\b|\bintended\s*learning\s*outcomes\b|\bcourse\s*objectives\b|\bobjectives\b/i.test(line)) {
      inCLOSection = true;
      inPlanSection = false;
      inDescSection = false;
      continue;
    }
    if (/course\s*plan|weekly\s*(?:plan|breakdown|schedule|outline)|topical\s*(?:outline|breakdown|syllabus)|course\s*content[s]?|course\s*outline|lecture\s*schedule|topics\s*covered|syllabus\s*details|detailed\s*syllabus|course\s*syllabus|list\s*of\s*topics|lecture\s*(?:plan|topics)|teaching\s*(?:plan|schedule)|module\s*breakdown|course\s*topics|table\s*of\s*contents|schedule\s*of\s*(?:lectures|classes|topics)|curriculum\s*content[s]?|\btopics\s*to\s*be\s*covered\b/i.test(line)) {
      inPlanSection = true;
      inCLOSection = false;
      inDescSection = false;
      continue;
    }
    if (/course\s*(?:description|scope|overview|catalog)|about\s*the\s*course|course\s*aims|course\s*introduction/i.test(line)) {
      inDescSection = true;
      inCLOSection = false;
      inPlanSection = false;
      continue;
    }

    // Try parsing explicit CLO format: CLO-1: ... or CO 1: ...
    const matchCLO = line.match(cloRegex);
    if (matchCLO) {
      let cloText = matchCLO[2].trim();
      if (cloText.length > 8) {
        const ploMatch = line.match(/(?:PLO|PO|SO)[-_ ]?(\d+)/i);
        const detectedPLO = ploMatch ? `PLO-${ploMatch[1]}` : `PLO-${(clos.length % 5) + 1}`;

        const bloomMatch = line.match(/\b([CPA][1-7])\b/i);
        let detectedTax = bloomMatch ? bloomMatch[1].toUpperCase() : '';

        if (!detectedTax) {
          const cleanWords = cloText.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
          for (const w of cleanWords.slice(0, 4)) {
            if (verbBloomMap[w]) {
              detectedTax = verbBloomMap[w];
              break;
            }
          }
        }
        if (!detectedTax) detectedTax = 'C3';

        cloText = cloText.replace(/\[\s*(?:PLO|PO|SO)[^\]]*\]|\(\s*(?:PLO|PO|SO)[^)]*\)/gi, '').trim();
        cloText = cloText.replace(/\[\s*[CPA][1-7][^\]]*\]|\(\s*[CPA][1-7][^)]*\)/gi, '').trim();

        clos.push({
          id: clos.length + 1,
          statement: cloText,
          plo: detectedPLO,
          taxonomy: detectedTax
        });
        continue;
      }
    }

    // Numbered item inside CLO section: e.g. 1. Design a system...
    if (inCLOSection) {
      const numberedMatch = line.match(/^\d+[.)\-]\s*([A-Z][a-zA-Z\s].+)/);
      if (numberedMatch) {
        let cloText = numberedMatch[1].trim();
        if (cloText.length > 10) {
          const ploMatch = line.match(/(?:PLO|PO|SO)[-_ ]?(\d+)/i);
          const detectedPLO = ploMatch ? `PLO-${ploMatch[1]}` : `PLO-${(clos.length % 5) + 1}`;

          const bloomMatch = line.match(/\b([CPA][1-7])\b/i);
          let detectedTax = bloomMatch ? bloomMatch[1].toUpperCase() : '';

          if (!detectedTax) {
            const cleanWords = cloText.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
            for (const w of cleanWords.slice(0, 4)) {
              if (verbBloomMap[w]) {
                detectedTax = verbBloomMap[w];
                break;
              }
            }
          }
          if (!detectedTax) detectedTax = 'C3';

          cloText = cloText.replace(/\[\s*(?:PLO|PO|SO)[^\]]*\]|\(\s*(?:PLO|PO|SO)[^)]*\)/gi, '').trim();
          cloText = cloText.replace(/\[\s*[CPA][1-7][^\]]*\]|\(\s*[CPA][1-7][^)]*\)/gi, '').trim();

          clos.push({
            id: clos.length + 1,
            statement: cloText,
            plo: detectedPLO,
            taxonomy: detectedTax
          });
          continue;
        }
      }
    }

    if (inPlanSection) {
      // Exclude pure page numbers or empty artifacts
      if (line.length > 3 && !/^(?:page\s*\d+|\d+\s*of\s*\d+|confidential)$/i.test(line)) {
        planLines.push(line);
      }
    } else if (inDescSection) {
      if (line.length > 5 && !/^(?:page\s*\d+|\d+\s*of\s*\d+)$/i.test(line)) {
        descLines.push(line);
      }
    } else {
      // Global outline detector outside explicit section triggers
      if (/^(?:week\s*\d+|wk\s*\d+|module\s*\d+|unit\s*\d+|chapter\s*\d+|lecture\s*\d+|session\s*\d+|exp(?:eriment)?\s*\d+|lab\s*\d+)/i.test(line)) {
        planLines.push(line);
      }
    }
  }

  // Fallback for Description
  if (descLines.length > 0) {
    courseDescription = descLines.join(' ');
  } else if (!courseDescription && lines.length > 1) {
    for (let j = 1; j < Math.min(lines.length, 10); j++) {
      if (lines[j].length > 40 && !/week|clo|module|outcome|lecture|schedule/i.test(lines[j])) {
        courseDescription = lines[j];
        break;
      }
    }
  }

  // Fallback 1 for Course Plan: Look for numbered topic outlines across the document if planLines is still small
  if (planLines.length < 3) {
    const candidateTopicLines = [];
    for (const l of lines) {
      if (/^\s*(?:\d+[.)\-]|•|\*|-|–)\s+([A-Z][a-zA-Z0-9\s&,/\-–]{5,85})$/.test(l)) {
        if (!/^(?:clo|plo|co|lo|outcome|prerequisite|textbook|reference|credit|hour|grading)/i.test(l)) {
          candidateTopicLines.push(l.trim());
        }
      }
    }
    if (candidateTopicLines.length >= 3) {
      planLines.length = 0;
      planLines.push(...candidateTopicLines);
    }
  }

  // Fallback 2 for Course Plan: Parse topic clauses from Course Description
  if (planLines.length === 0 && courseDescription) {
    const matchInclude = courseDescription.match(/(?:topics\s*include|covers|coverage\s*includes|focuses\s*on|syllabus\s*includes)[:\s]+([^.]+)/i);
    if (matchInclude) {
      const items = matchInclude[1].split(/[,;]/).map(s => s.trim().replace(/^and\s+/i, '')).filter(s => s.length > 4);
      if (items.length >= 3) {
        items.forEach((item, idx) => {
          planLines.push(`Module ${idx + 1}: ${item}`);
        });
      }
    }
  }

  // Fallback 3 for Course Plan: Synthesize authentic topical outline tailored to courseName
  if (planLines.length > 0) {
    coursePlan = planLines.join('\n');
  } else {
    coursePlan = synthesizeDefaultOutlineForCourse(courseName, courseDescription);
  }

  // Fallback CLOs detection across entire text if inCLOSection missed
  if (clos.length === 0) {
    const cloActionVerbs = ['design', 'develop', 'analyze', 'evaluate', 'apply', 'calculate', 'explain', 'implement', 'formulate', 'construct'];
    for (const line of lines) {
      const numMatch = line.match(/^\d+[.)\-]\s*([A-Z][a-z]+ .+)/);
      if (numMatch && numMatch[1].length > 20) {
        const firstWord = numMatch[1].split(' ')[0].toLowerCase();
        if (cloActionVerbs.includes(firstWord)) {
          const plo = `PLO-${(clos.length % 5) + 1}`;
          const tax = verbBloomMap[firstWord] || 'C3';
          clos.push({
            id: clos.length + 1,
            statement: numMatch[1].trim(),
            plo: plo,
            taxonomy: tax
          });
          if (clos.length >= 6) break;
        }
      }
    }
  }

  return {
    courseName,
    courseDescription,
    coursePlan,
    clos
  };
}

/**
 * Synthesizes a disciplined, accredited 5-module course outline tailored to the specific course title and domain
 */
export function synthesizeDefaultOutlineForCourse(courseName = '', courseDescription = '') {
  const name = (courseName || '').toLowerCase();
  const desc = (courseDescription || '').toLowerCase();
  const text = `${name} ${desc}`;

  // 1. Civil / Structural / Environmental
  if (text.includes('fluid') || text.includes('hydraul') || text.includes('hydro')) {
    return [
      'Week 1-3: Fluid Properties, Pressure Distributions & Manometry (Fluid statics, hydrostatic thrust, buoyancy and stability)',
      'Week 4-6: Fluid Kinematics & Conservation Equations (Continuity, Bernoulli energy equation, momentum theorem for control volumes)',
      'Week 7-9: Navier-Stokes Formulations & Laminar/Turbulent Viscous Flows (Boundary layer theory, velocity profiles, shear stresses)',
      'Week 10-12: Dimensional Analysis, Similitude & Closed-Conduit Pipe Flows (Moody chart, Darcy-Weisbach head losses, pipe networks)',
      'Week 13-16: Open Channel Hydraulics & Hydraulic Machinery (Specific energy, hydraulic jump, centrifugal pumps and reaction turbines)'
    ].join('\n');
  }

  if (text.includes('concrete') || text.includes('reinforced concrete')) {
    return [
      'Week 1-3: Mechanics of Reinforced Concrete & Limit State Design (Concrete compressive stress-strain, steel reinforcement yielding)',
      'Week 4-6: Flexural Analysis and Design of Singly & Doubly Reinforced Beams (Ultimate moment capacity, balanced section, ductility)',
      'Week 7-9: Shear, Diagonal Tension & Bond Anchorage Design (Stirrups spacing, development length, crack width control)',
      'Week 10-12: Analysis & Design of One-Way and Two-Way Slab Systems (Direct design method, equivalent frame analysis, serviceability)',
      'Week 13-16: Axially and Eccentrically Loaded Reinforced Concrete Columns & Footings (Interaction diagrams, short vs slender columns)'
    ].join('\n');
  }

  if (text.includes('structure') || text.includes('structural analysis') || text.includes('structural design')) {
    return [
      'Week 1-3: Determinacy, Stability & Influence Lines for Statically Determinate Trusses and Beams',
      'Week 4-6: Deflection Analysis using Virtual Work, Castigliano Theorem, and Moment-Area Methods',
      'Week 7-9: Indeterminate Structure Analysis: Force Method (Method of Consistent Deformations)',
      'Week 10-12: Displacement Methods: Slope Deflection Equations and Moment Distribution Method',
      'Week 13-16: Direct Stiffness Matrix Formulation for Skeletal Frames and Computer-Aided Structural Modeling'
    ].join('\n');
  }

  if (text.includes('soil') || text.includes('geotech') || text.includes('foundation')) {
    return [
      'Week 1-3: Soil Composition, Phase Relationships, Index Properties & Soil Classification Systems (USCS/AASHTO)',
      'Week 4-6: Soil Compaction, Capillarity & Permeability (Darcy law, 2D seepage flow nets, uplift pressure)',
      'Week 7-9: In-Situ Stresses, Effective Stress Concept & 1D Consolidation Settlement Theory (Terzaghi theory)',
      'Week 10-12: Shear Strength of Cohesive and Cohesionless Soils (Direct shear test, triaxial compression, Mohr-Coulomb failure criteria)',
      'Week 13-16: Lateral Earth Pressures (Rankine/Coulomb) & Shallow Foundation Bearing Capacity (Terzaghi equations)'
    ].join('\n');
  }

  if (text.includes('survey') || text.includes('geomatics')) {
    return [
      'Week 1-3: Principles of Surveying, Distance Measurements & Error Theory (Taping, EDM corrections, traverse computations)',
      'Week 4-6: Leveling Techniques, Differential Leveling & Profile Contour Generation (Curvature and refraction adjustments)',
      'Week 7-9: Theodolite and Total Station Operations (Horizontal and vertical angle measurements, coordinate geometry)',
      'Week 10-12: Horizontal Circular Curves and Vertical Transition Curves Design for Highway Alignments',
      'Week 13-16: Global Positioning Systems (GPS/GNSS), Remote Sensing & Geographic Information Systems (GIS) Mapping'
    ].join('\n');
  }

  // 2. Mechanical / Mechatronics
  if (text.includes('thermodynamic') || text.includes('thermal')) {
    return [
      'Week 1-3: Fundamental Thermodynamic Properties, State Equations & Pure Substance Phase Diagrams',
      'Week 4-6: First Law of Thermodynamics for Closed and Open Steady-Flow Control Volumes (Enthalpy, internal energy)',
      'Week 7-9: Second Law of Thermodynamics, Carnot Principles & Entropy Balance Calculations',
      'Week 10-12: Gas Power Cycles & Vapor Power Cycles (Air-standard Otto, Diesel, Brayton and Rankine steam cycles)',
      'Week 13-16: Refrigeration Cycles, Psychrometry & Moist Air HVAC Processes (Vapor compression, heat pumps, psychrometric charts)'
    ].join('\n');
  }

  if (text.includes('heat transfer')) {
    return [
      'Week 1-3: Steady-State 1D & 2D Conduction Mechanisms (Fourier law, thermal resistance networks, extended surfaces/fins)',
      'Week 4-6: Transient Conduction & Lumped Capacitance Models (Heisler charts, finite-difference numerical solutions)',
      'Week 7-9: Forced and Natural Convection Boundary Layers (Reynolds analogy, empirical Nusselt number correlations)',
      'Week 10-12: Thermal Radiation Principles, Blackbody Laws & Surface View Factor Geometry',
      'Week 13-16: Heat Exchanger Design & Thermal Sizing (Log Mean Temperature Difference LMTD and NTU-effectiveness methods)'
    ].join('\n');
  }

  if (text.includes('mechanics of materials') || text.includes('strength of materials')) {
    return [
      'Week 1-3: Normal and Shear Stress-Strain Relationships, Axial Deformations & Thermal Stresses',
      'Week 4-6: Torsion of Circular and Non-Circular Shafts (Angle of twist, elastic-plastic torsion, power transmission)',
      'Week 7-9: Flexural Bending and Transverse Shear Stresses in Beams (Flexure formula, shear flow in built-up members)',
      'Week 10-12: Transformation of Plane Stress and Plane Strain (Mohr circle, principal stresses, failure theories)',
      'Week 13-16: Beam Deflection using Integration/Superposition Methods & Euler Column Buckling Instability'
    ].join('\n');
  }

  if (text.includes('dynamics') || text.includes('kinematics') || text.includes('machine design')) {
    return [
      'Week 1-3: Kinematics of Particles & Rigid Bodies (Rectilinear, curvilinear, planar relative motion analysis)',
      'Week 4-6: Kinetics of Rigid Bodies: Force-Acceleration, Work-Energy & Impulse-Momentum Principles',
      'Week 7-9: Mechanisms, Linkages & Velocity/Acceleration Polygon Synthesis (Grashof criteria, instantaneous centers)',
      'Week 10-12: Mechanical Power Transmission Elements (Spur/helical gear trains, belt drives, and cam profiles)',
      'Week 13-16: Machine Element Failure Prevention Under Static & Dynamic Fatigue Loading (S-N curve, Goodman diagram)'
    ].join('\n');
  }

  // 3. Computing / Software Engineering / IT
  if (text.includes('data structure') || text.includes('algorithm')) {
    return [
      'Week 1-3: Algorithm Complexity, Asymptotic Big-O Notation & Dynamic Arrays/Linked Lists',
      'Week 4-6: Stacks, Queues, Recursion & Tree Topologies (Binary Search Trees, AVL Trees, balance factors)',
      'Week 7-9: Priority Queues, Binary Heaps & Hash Tables (Collision resolution strategies, load factors)',
      'Week 10-12: Graph Data Structures & Traversals (BFS, DFS, Dijkstra shortest path, Minimum Spanning Trees)',
      'Week 13-16: Advanced Algorithmic Paradigms (Divide-and-conquer, greedy algorithms, dynamic programming, NP-completeness)'
    ].join('\n');
  }

  if (text.includes('database') || text.includes('sql')) {
    return [
      'Week 1-3: Relational Database Concepts, Entity-Relationship (ER) & Enhanced ER Data Modeling',
      'Week 4-6: Relational Algebra & Advanced SQL Query Formulations (Joins, aggregations, nested subqueries, views)',
      'Week 7-9: Relational Schema Normalization & Functional Dependencies (1NF, 2NF, 3NF, BCNF, lossless joins)',
      'Week 10-12: Transaction Management, ACID Properties & Concurrency Control Protocols (Two-Phase Locking, isolation levels)',
      'Week 13-16: Database Indexing Topologies (B+ Trees, hashing), Query Optimization & NoSQL Document Stores'
    ].join('\n');
  }

  if (text.includes('operating system')) {
    return [
      'Week 1-3: Operating System Structures, System Calls, Dual-Mode Operation & Hardware Interrupts',
      'Week 4-6: Process Management, Threads & CPU Scheduling Algorithms (Preemptive vs non-preemptive, multi-level queues)',
      'Week 7-9: Process Synchronization & Concurrency (Critical section problem, semaphores, mutexes, classical IPC problems)',
      'Week 10-12: Deadlock Characterization, Prevention, Avoidance (Banker algorithm) & Detection/Recovery',
      'Week 13-16: Memory Management Topologies (Paging, virtual memory, demand paging, page replacement algorithms, file systems)'
    ].join('\n');
  }

  if (text.includes('network') || text.includes('communication network')) {
    return [
      'Week 1-3: Computer Networking Architecture, Layered Models (OSI 7-Layer & TCP/IP Protocol Stack)',
      'Week 4-6: Application Layer Protocols (HTTP, DNS, SMTP, socket programming) & Transport Layer Fundamentals (TCP/UDP, flow control)',
      'Week 7-9: TCP Congestion Control, Reliability Mechanisms & Congestion Avoidance Algorithms',
      'Week 10-12: Network Layer Data Plane & Control Plane (IPv4/IPv6 addressing, subnetting, CIDR, OSPF, BGP routing)',
      'Week 13-16: Link Layer Protocols, Medium Access Control (CSMA/CD, CSMA/CA, Ethernet switching) & Network Security Fundamentals'
    ].join('\n');
  }

  if (text.includes('artificial intelligence') || text.includes('machine learning') || text.includes(' ai ') || name.endsWith(' ai') || name.startsWith('ai ')) {
    return [
      'Week 1-3: Intelligent Agents, State-Space Search Paradigms (A*, heuristic search, minimax with alpha-beta pruning)',
      'Week 4-6: Supervised Machine Learning Algorithms (Linear/Logistic regression, decision trees, support vector machines)',
      'Week 7-9: Unsupervised Learning & Clustering Topologies (K-Means, hierarchical clustering, Principal Component Analysis PCA)',
      'Week 10-12: Neural Networks & Deep Learning Foundations (Multilayer perceptrons, backpropagation, activation functions)',
      'Week 13-16: Model Evaluation, Regularization, Overfitting Mitigation & Ethical AI Deployment Guidelines'
    ].join('\n');
  }

  if (text.includes('programming') || text.includes('object-oriented') || text.includes('oop')) {
    return [
      'Week 1-3: Syntax, Control Flow Structures, Functions, Modular Decomposition & Memory References',
      'Week 4-6: Object-Oriented Principles: Encapsulation, Classes, Constructors, Destructors & Member Visibility',
      'Week 7-9: Inheritance Hierarchies, Polymorphism, Dynamic Dispatch & Abstract Base Classes',
      'Week 10-12: Generic Programming, Templates, Exception Handling & Standard Template Library (STL) Collections',
      'Week 13-16: File Stream I/O Operations, Pointer Mechanics, Dynamic Memory Allocation & Object-Oriented Design Patterns'
    ].join('\n');
  }

  // 4. Electrical / Power / Electronics
  if (text.includes('circuit') || text.includes('network analysis')) {
    return [
      'Week 1-3: Fundamental Circuit Laws, Node Voltage & Mesh Current Systematic Analysis (Ohm law, KCL, KVL)',
      'Week 4-6: Circuit Analysis Theorems (Thevenin, Norton, Superposition, Maximum Power Transfer)',
      'Week 7-9: Transient Response of First-Order (RC, RL) and Second-Order (RLC) Dynamic Circuits',
      'Week 10-12: AC Sinusoidal Steady-State Analysis, Phasors, Impedance & AC Power Calculations (Real, reactive, apparent power, power factor)',
      'Week 13-16: Three-Phase Balanced Systems, Resonance Topologies (Series/Parallel) & Magnetically Coupled Inductive Circuits'
    ].join('\n');
  }

  if (text.includes('power system') || text.includes('high voltage')) {
    return [
      'Week 1-3: Structure of Modern Electric Power Systems, Single-Line Diagrams & Per-Unit Normalization System',
      'Week 4-6: Transmission Line Modeling Parameters (Resistance, inductance, capacitance, ABCD matrix representations)',
      'Week 7-9: Power Flow Formulations & Numerical Solvers (Gauss-Seidel, Newton-Raphson load flow methods)',
      'Week 10-12: Symmetrical and Unsymmetrical Fault Analysis using Symmetrical Components (Sequence networks)',
      'Week 13-16: Power System Stability (Rotor angle dynamics, swing equation, equal area criterion) & Protective Relaying'
    ].join('\n');
  }

  if (text.includes('power electronic') || text.includes('drives')) {
    return [
      'Week 1-3: Power Semiconductor Switching Devices (MOSFET, IGBT, Thyristor dynamic switching losses and SOA)',
      'Week 4-6: Non-Isolated DC-DC Converters (Buck, Boost, Buck-Boost in continuous and discontinuous conduction modes)',
      'Week 7-9: Isolated SMPS Topologies (Flyback, Forward, Push-Pull transformers and snubber circuit design)',
      'Week 10-12: DC-AC Inverter Topologies & Sinusoidal / Space-Vector Pulse Width Modulation (PWM) Schemes',
      'Week 13-16: Harmonic Distortion Mitigation (IEEE 519), Input Power Factor Correction & Closed-Loop Motor Drive Control'
    ].join('\n');
  }

  if (text.includes('control system') || text.includes('automation') || text.includes('feedback')) {
    return [
      'Week 1-3: Mathematical Modeling of Physical Dynamic Systems (Differential equations, Laplace transfer functions, block diagrams)',
      'Week 4-6: Time-Domain Transient and Steady-State Response Characterization (Error constants, damping ratio, natural frequency)',
      'Week 7-9: Closed-Loop Stability Analysis: Routh-Hurwitz Stability Criterion & Root Locus Graphical Synthesis',
      'Week 10-12: Frequency-Domain Analysis: Bode Plots, Nyquist Stability Criterion, Gain and Phase Stability Margins',
      'Week 13-16: Controller Synthesis: Lead-Lag Phase Compensators, PID Tuning (Ziegler-Nichols) & State-Space Feedback'
    ].join('\n');
  }

  if (text.includes('signal') || text.includes('dsp') || text.includes('digital signal')) {
    return [
      'Week 1-3: Continuous and Discrete-Time Signals, Linear Time-Invariant (LTI) Systems, Convolution Sum & Difference Equations',
      'Week 4-6: Z-Transform Analysis, Region of Convergence (ROC), Pole-Zero System Representations & Transfer Functions',
      'Week 7-9: Discrete Fourier Transform (DFT), Fast Fourier Transform (FFT) Algorithms & Spectral Leakage Minimization',
      'Week 10-12: Digital Finite Impulse Response (FIR) Filter Design (Windowing techniques, linear phase constraints)',
      'Week 13-16: Digital Infinite Impulse Response (IIR) Filter Synthesis (Bilinear transformation, Butterworth/Chebyshev) & Quantization Effects'
    ].join('\n');
  }

  if (text.includes('electromagnet') || text.includes('antenna') || text.includes('microwave')) {
    return [
      'Week 1-3: Vector Calculus, Coordinate Transformations, Electrostatics & Magnetostatics (Gauss, Ampere, Biot-Savart laws)',
      'Week 4-6: Time-Varying Fields, Faraday Law, Displacement Current & Complete Differential/Integral Maxwell Equations',
      'Week 7-9: Uniform Plane Wave Propagation in Lossless, Lossy, and Conducting Media (Poynting power vector, skin depth)',
      'Week 10-12: Transmission Line Wave Equations, Characteristic Impedance, Voltage Reflection Coefficient & Smith Chart Matching',
      'Week 13-16: Waveguide Boundary Conditions (TE/TM modes) & Fundamental Radiation Characteristics of Dipole Antennas'
    ].join('\n');
  }

  // 5. Default Engineering Curriculum Outline
  const cleanTitle = (courseName || 'Engineering Course').replace(/^[A-Z]{2,5}[ -]?\d{3,4}[:\-–\s]*/i, '').trim();
  return [
    `Week 1-3: Fundamental Principles, Mathematical Formulations & Governing Laws of ${cleanTitle}`,
    `Week 4-6: Analytical Modeling, Theoretical System Representations & Diagnostic Parameter Evaluation`,
    `Week 7-9: System Implementation, Experimental Investigations & Modern Computer-Aided Simulation Verification`,
    `Week 10-12: Advanced Analytical Methods, Performance Trade-Off Optimization & Technical Standards Compliance`,
    `Week 13-16: Comprehensive Engineering Design Synthesis, Safety Margins & Capstone Case Study Deliverables`
  ].join('\n');
}
