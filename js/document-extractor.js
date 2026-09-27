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
    if (str.length > 0 && !textBlocks.includes(str)) textBlocks.push(str);
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
    if (clean.length > 0 && !textBlocks.includes(clean)) textBlocks.push(clean);
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

    // Section terminators
    if (/^(?:grading|grade\s*distribution|evaluation\s*scheme|textbooks?|reference\s*books?|recommended\s*books?|course\s*policy|academic\s*integrity)/i.test(line)) {
      inCLOSection = false;
      inPlanSection = false;
      inDescSection = false;
      continue;
    }

    // Section triggers
    if (/course\s*learning\s*outcomes|learning\s*outcomes|\bclos\b|\bintended\s*learning\s*outcomes\b|\bobjectives\b/i.test(line)) {
      inCLOSection = true;
      inPlanSection = false;
      inDescSection = false;
      continue;
    }
    if (/course\s*plan|weekly\s*(?:plan|breakdown|schedule)|topical\s*outline|course\s*content|course\s*outline|lecture\s*schedule|topics\s*covered/i.test(line)) {
      inPlanSection = true;
      inCLOSection = false;
      inDescSection = false;
      continue;
    }
    if (/course\s*(?:description|scope|overview|catalog)|about\s*the\s*course|course\s*aims/i.test(line)) {
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
        // Detect explicit PLO tag: e.g. [PLO-1], (PLO 2), PLO-3
        const ploMatch = line.match(/(?:PLO|PO|SO)[-_ ]?(\d+)/i);
        const detectedPLO = ploMatch ? `PLO-${ploMatch[1]}` : `PLO-${(clos.length % 5) + 1}`;

        // Detect explicit Bloom tag: e.g. [C4], (Bloom: C3), C6
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

        // Clean trailing tags from cloText
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
      planLines.push(line);
    } else if (inDescSection) {
      descLines.push(line);
    } else {
      if (/^(?:week\s*\d+|module\s*\d+|lecture\s*\d+|session\s*\d+|ch(?:apter)?\s*\d+)/i.test(line)) {
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

  // Fallback for Course Plan
  if (planLines.length > 0) {
    coursePlan = planLines.join('\n');
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
