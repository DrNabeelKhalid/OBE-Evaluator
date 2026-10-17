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
 * Parses XML text from word/document.xml into paragraphs and pipe-delimited table rows
 */
function parseDocxXmlText(xmlString) {
  // 1. If DOMParser is available (browser environment), perform structured DOM traversal
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      const body = doc.getElementsByTagName('w:body')[0] || doc.querySelector('body') || doc.documentElement;
      if (body) {
        const lines = [];
        const children = body.children;
        for (let i = 0; i < children.length; i++) {
          const node = children[i];
          const tag = (node.localName || node.nodeName || '').replace(/^.*:/, '').toLowerCase();
          if (tag === 'p') {
            const tNodes = node.getElementsByTagName('w:t');
            let pText = '';
            for (let j = 0; j < tNodes.length; j++) pText += tNodes[j].textContent || '';
            pText = pText.trim();
            if (pText) lines.push(pText);
          } else if (tag === 'tbl') {
            const trNodes = node.getElementsByTagName('w:tr');
            for (let r = 0; r < trNodes.length; r++) {
              const tr = trNodes[r];
              const tcNodes = tr.getElementsByTagName('w:tc');
              const cells = [];
              for (let c = 0; c < tcNodes.length; c++) {
                const tc = tcNodes[c];
                const tNodes = tc.getElementsByTagName('w:t');
                let cellText = '';
                for (let j = 0; j < tNodes.length; j++) cellText += tNodes[j].textContent || '';
                cells.push(cellText.trim().replace(/\s+/g, ' '));
              }
              if (cells.some(c => c.length > 0)) {
                lines.push(cells.join(' | '));
              }
            }
          }
        }
        if (lines.length > 0) return lines.join('\n');
      }
    } catch (e) {
      console.warn('DOMParser failed for docx, using regex fallback:', e);
    }
  }

  // 2. High-fidelity Regex fallback: sequentially processes <w:tbl> and <w:p>
  const pattern = /(<w:tbl[\s>][\s\S]*?<\/w:tbl>|<w:p[\s>][\s\S]*?<\/w:p>)/gi;
  const tRegex = /<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/gi;
  const trRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/gi;
  const tcRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/gi;
  const lines = [];
  let chunkMatch;

  while ((chunkMatch = pattern.exec(xmlString)) !== null) {
    const chunk = chunkMatch[1];
    if (chunk.startsWith('<w:tbl')) {
      let trMatch;
      while ((trMatch = trRegex.exec(chunk)) !== null) {
        const tr = trMatch[0];
        const cells = [];
        let tcMatch;
        while ((tcMatch = tcRegex.exec(tr)) !== null) {
          const tc = tcMatch[0];
          let cellText = '';
          let tMatch;
          while ((tMatch = tRegex.exec(tc)) !== null) {
            cellText += tMatch[1];
          }
          cells.push(cellText.trim().replace(/\s+/g, ' '));
        }
        if (cells.some(c => c.length > 0)) {
          lines.push(cells.join(' | '));
        }
      }
    } else {
      let pText = '';
      let tMatch;
      while ((tMatch = tRegex.exec(chunk)) !== null) {
        pText += tMatch[1];
      }
      pText = pText.trim().replace(/\s+/g, ' ');
      if (pText) lines.push(pText);
    }
  }

  if (lines.length > 0) return lines.join('\n');

  // 3. Flat fallback
  const allTexts = [];
  let match;
  while ((match = tRegex.exec(xmlString)) !== null) {
    if (match[1].trim()) allTexts.push(match[1].trim());
  }
  return allTexts.join('\n');
}

/**
 * Extracts text from PDF using PDF.js with 2D spatial coordinate line and table reconstruction
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
    if (!textContent || !textContent.items || textContent.items.length === 0) continue;

    // Filter items with valid text
    const items = textContent.items.filter(item => item.str && item.str.trim().length > 0);
    if (items.length === 0) continue;

    // Sort items vertically from top of page to bottom of page (PDF Y is ascending from bottom)
    // with horizontal tie-breaker left to right (ascending X)
    items.sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) > 3.5) {
        return yB - yA;
      }
      return a.transform[4] - b.transform[4];
    });

    // Group items into physical visual lines
    const visualLines = [];
    let currentLine = [];
    let currentY = null;

    for (const item of items) {
      const y = item.transform[5];
      if (currentY === null || Math.abs(currentY - y) <= 3.5) {
        currentLine.push(item);
        if (currentY === null) currentY = y;
      } else {
        visualLines.push(currentLine);
        currentLine = [item];
        currentY = y;
      }
    }
    if (currentLine.length > 0) visualLines.push(currentLine);

    // Format each line: detect column gaps and delimit table cells with ' | '
    const formattedLines = [];
    for (const lineItems of visualLines) {
      lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
      let lineStr = '';
      let prevRight = null;

      for (let j = 0; j < lineItems.length; j++) {
        const item = lineItems[j];
        const x = item.transform[4];
        const str = item.str.trim();
        if (!str) continue;

        if (prevRight !== null) {
          const gap = x - prevRight;
          if (gap > 18) {
            lineStr += ' | ' + str;
          } else if (gap > 2) {
            lineStr += ' ' + str;
          } else {
            lineStr += (lineStr.endsWith(' ') ? '' : ' ') + str;
          }
        } else {
          lineStr = str;
        }
        prevRight = x + (item.width || str.length * 6);
      }

      if (lineStr.trim()) {
        formattedLines.push(lineStr.trim());
      }
    }

    if (formattedLines.length > 0) {
      pageTexts.push(formattedLines.join('\n'));
    }
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
 * High-fidelity CLO table & section extractor.
 * Handles:
 * 1. Multi-line wrapped table cells in PDFs (where statements wrap across 2-5 lines and numbers are centered).
 * 2. Pipe-delimited single-line table rows in Word (.docx) documents.
 * 3. Multi-PLO extraction (e.g. "3, 5" -> "PLO-3, PLO-5").
 * 4. Full Bloom taxonomy parsing (C1-C6, P1-P7, A1-A5).
 * 5. Automatic hyphenated word stitching (e.g. "synchro-" + "nization" -> "synchronization").
 */
export function extractCLOsFromDocument(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const verbBloomMap = {
    'remember': 'C1', 'define': 'C1', 'list': 'C1', 'state': 'C1', 'identify': 'C1', 'recall': 'C1', 'name': 'C1', 'label': 'C1',
    'understand': 'C2', 'explain': 'C2', 'describe': 'C2', 'discuss': 'C2', 'classify': 'C2', 'summarize': 'C2', 'interpret': 'C2', 'illustrate': 'C2', 'comprehend': 'C2',
    'apply': 'C3', 'calculate': 'C3', 'solve': 'C3', 'demonstrate': 'C3', 'implement': 'C3', 'execute': 'C3', 'operate': 'C3', 'compute': 'C3', 'determine': 'C3',
    'analyze': 'C4', 'analyse': 'C4', 'differentiate': 'C4', 'compare': 'C4', 'investigate': 'C4', 'diagnose': 'C4', 'distinguish': 'C4', 'model': 'C4', 'examine': 'C4',
    'evaluate': 'C5', 'appraise': 'C5', 'judge': 'C5', 'critique': 'C5', 'justify': 'C5', 'validate': 'C5', 'assess': 'C5', 'verify': 'C5',
    'design': 'C6', 'create': 'C6', 'develop': 'C6', 'formulate': 'C6', 'synthesize': 'C6', 'construct': 'C6', 'devise': 'C6', 'optimize': 'C6'
  };

  const actionVerbRe = /^\s*(?:(?:The\s+students\s+(?:will\s+)?(?:be\s+able\s+to\s+)?|Students\s+will\s+(?:be\s+able\s+to\s+|comprehend\b)?)|(?:Apply|Analyze|Analyse|Design|Evaluate|Compute|Understand|Formulate|Demonstrate|Solve|Calculate|Investigate|Develop|Explain|Differentiate|Construct|Implement|Identify|Comprehend))\b/i;
  const taxDescRe = /^\s*\(\s*(?:mechanism|apply|analyze|analyse|design|evaluate|create|understand|recall|remember|guided\s*response|adaptation|origination|perception|set|receiving|responding|valuing|organization|characterization|cognitive|affective|psycho-?motor)\s*\)\s*$/i;

  // 1. Locate CLO section header
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const clean = lines[i].trim().toLowerCase();
    if (/\bclo\b/.test(clean) && (clean.includes('statement') || clean.includes('plo') || clean.includes('taxonomy'))) {
      headerIdx = i;
      break;
    } else if (clean.includes('course learning outcomes') || clean.includes('intended learning outcomes')) {
      for (let k = i + 1; k < Math.min(i + 20, lines.length); k++) {
        const kClean = lines[k].trim().toLowerCase();
        if (/\bclo\b/.test(kClean) && (kClean.includes('statement') || kClean.includes('plo') || kClean.includes('taxonomy'))) {
          headerIdx = k;
          break;
        }
      }
      if (headerIdx !== -1) break;
      if (headerIdx === -1) headerIdx = i;
    }
  }

  if (headerIdx === -1) return [];

  // 2. Locate end of CLO section
  let endIdx = lines.length;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const clean = lines[i].trim();
    if (/\bclo\s*(?:no\.?|statement)?\b/i.test(clean) && /(?:statement|plo|taxonomy)/i.test(clean)) continue;
    if (/^\s*(?:(?:\d+[\.\)]\s*)?(?:course\s*books?|text\s*books?|reference\s*books?|recommended\s*books?|reading\s*materials?|readings?|student\s*assessment|assessment\s*(?:tools?|criteria|policy)?|grading\s*policy|evaluation\s*scheme|marks\s*distribution|practical\s*applications?|weekly\s*plan|course\s*plan|schedule\s*of\s*lectures|topical\s*outline)\b)/i.test(clean)) {
      endIdx = i;
      break;
    }
    if (/^\s*\d+[\.\)]\s+[A-Z]/.test(clean) && !/CLO|Outcome/i.test(clean)) {
      endIdx = i;
      break;
    }
  }

  const rawSectionLines = lines.slice(headerIdx + 1, endIdx);
  const tableLines = [];
  for (const l of rawSectionLines) {
    const s = l.trim();
    if (!s) continue;
    if (/^\s*\*\s*[CPA]\s*[–-]/i.test(s)) continue;
    if (/^(?:Taxonomy\s*Level\*?|Level\*?|Bloom\'?s\s*Taxonomy\s*Level)$/i.test(s)) continue;
    if (/^(?:CLO\s*No\.?|CLO|Outcome\s*No\.?)\s+(?:CLO\s*Statement|Statement)/i.test(s)) continue;
    tableLines.push(l);
  }

  // 3. Find start indices of each CLO inside tableLines
  const starts = [];
  for (let idx = 0; idx < tableLines.length; idx++) {
    const l = tableLines[idx];
    const clean = l.trim();
    const prevClean = idx > 0 ? tableLines[idx - 1].trim() : '';
    const isContinuation = /\b(?:to|and|or|of|for|with|in|by|including|using|-)$/i.test(prevClean);

    if (/^\s*(?:CLO|CO|LO|Outcome)\s*[-_#]?\s*\d+[:.\-–\s]/i.test(clean)) {
      starts.push(idx);
      continue;
    }

    if (!isContinuation && actionVerbRe.test(clean)) {
      starts.push(idx);
    } else {
      const numMatch = l.match(/^\s*(?:CLO\s*[-_#]?\s*)?(\d{1,2})\s*(?:\||\s{2,})/);
      if (numMatch && (starts.length === 0 || idx > starts[starts.length - 1])) {
        if (starts.length > 0) {
          const lastStart = starts[starts.length - 1];
          const hasVerbInLast = actionVerbRe.test(tableLines[lastStart].trim());
          const hasNumInLast = tableLines.slice(lastStart, idx).some(prev => /^\s*(?:CLO\s*[-_#]?\s*)?\d{1,2}\s*(?:\||\s{2,})/.test(prev));
          if (hasVerbInLast && !hasNumInLast) {
            continue;
          }
        }
        starts.push(idx);
      }
    }
  }

  if (starts.length === 0) {
    for (let idx = 0; idx < tableLines.length; idx++) {
      if (/^\s*(?:CLO\s*[-_#]?\s*)?\d{1,2}[.)\s|]/i.test(tableLines[idx])) {
        starts.push(idx);
      }
    }
  }

  const clos = [];
  for (let sIdx = 0; sIdx < starts.length; sIdx++) {
    const start = starts[sIdx];
    const end = (sIdx + 1 < starts.length) ? starts[sIdx + 1] : tableLines.length;
    const block = tableLines.slice(start, end);

    let cloId = sIdx + 1;
    const plos = [];
    const taxes = [];
    const stmtPieces = [];

    for (const l of block) {
      const taxMatches = l.match(/\b([CPA][1-7])\b/gi);
      if (taxMatches) {
        for (const t of taxMatches) {
          const tUp = t.toUpperCase();
          if (!taxes.includes(tUp)) taxes.push(tUp);
        }
      }

      let cols = [];
      if (l.includes('|') || l.includes('\t')) {
        cols = l.split(/[|\t]/).map(c => c.trim()).filter(Boolean);
      } else if (/\s{3,}/.test(l)) {
        cols = l.split(/\s{3,}/).map(c => c.trim()).filter(Boolean);
      } else {
        cols = [l.trim()];
      }

      const digitMatch = l.match(/^\s*(?:CLO\s*[-_#]?\s*)?(\d{1,2})\b/i);
      if (digitMatch && cols.length > 1) {
        cloId = parseInt(digitMatch[1]);
      }

      for (let cIdx = 0; cIdx < cols.length; cIdx++) {
        const c = cols[cIdx];
        if (cIdx === 0 && /^(?:CLO\s*[-_#]?\s*)?\d{1,2}$/i.test(c)) {
          continue;
        }
        if (/^(?:(?:PLO|PO|SO)[-_ ]?)?\d{1,2}(?:\s*[,&/]\s*(?:(?:PLO|PO|SO)[-_ ]?)?\d{1,2})*$/i.test(c)) {
          const pNums = c.match(/\b\d{1,2}\b/g);
          if (pNums) {
            for (const p of pNums) {
              const ploTag = 'PLO-' + p;
              if (!plos.includes(ploTag)) plos.push(ploTag);
            }
          }
          continue;
        }
        if (/^[CPA][1-7](?:\s*\([^)]*\))?(?:\s*[,&/]\s*[CPA][1-7](?:\s*\([^)]*\))?)*$/i.test(c) || taxDescRe.test(c)) {
          const tCodes = c.match(/\b([CPA][1-7])\b/gi);
          if (tCodes) {
            for (const t of tCodes) {
              const tUp = t.toUpperCase();
              if (!taxes.includes(tUp)) taxes.push(tUp);
            }
          }
          continue;
        }

        let cleanC = c;
        cleanC = cleanC.replace(/^\s*(?:CLO|CO|LO|Outcome)\s*[-_#]?\s*\d+[:.\-–\s]+/i, '');
        cleanC = cleanC.replace(/^\s*\d{1,2}[.)\-]\s+/, '');
        cleanC = cleanC.replace(/\[\s*(?:PLO|PO|SO)[^\]]*\]|\(\s*(?:PLO|PO|SO)[^)]*\)/gi, '');
        cleanC = cleanC.replace(/\[\s*[CPA][1-7][^\]]*\]/gi, '');
        cleanC = cleanC.replace(/\b[CPA][1-7](?:\s*\([^)]*\))?/gi, '');
        cleanC = cleanC.replace(taxDescRe, '');
        cleanC = cleanC.trim();

        if (cleanC.length > 0) {
          stmtPieces.push(cleanC);
        }
      }
    }

    let fullStmt = '';
    for (const piece of stmtPieces) {
      if (!fullStmt) {
        fullStmt = piece;
      } else if (fullStmt.endsWith('-')) {
        const prefix = fullStmt.slice(0, -1);
        const knownHyphen = /(?:^|[\s\-])(?:real|on|high|low|time|multi|general|single|three|inter|object|built|cross|non|state)$/i.test(prefix.trim());
        if (knownHyphen) {
          fullStmt = fullStmt + piece;
        } else {
          fullStmt = prefix + piece;
        }
      } else {
        fullStmt += ' ' + piece;
      }
    }

    fullStmt = fullStmt.replace(/\s+/g, ' ').trim();

    let finalTax = taxes[0] || '';
    if (!finalTax) {
      const words = fullStmt.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
      for (const w of words.slice(0, 5)) {
        if (verbBloomMap[w]) {
          finalTax = verbBloomMap[w];
          break;
        }
      }
    }
    if (!finalTax) finalTax = 'C3';

    const finalPLO = plos.length > 0 ? plos.join(', ') : `PLO-${cloId}`;

    if (fullStmt.length >= 15) {
      clos.push({
        id: cloId,
        statement: fullStmt,
        plo: finalPLO,
        taxonomy: finalTax
      });
    }
  }

  return clos;
}

/**
 * Dedicated high-fidelity Course Plan & Weekly Topics extractor.
 * Handles:
 * 1. Strict start boundary detection (Weekly Plan, Schedule of Lectures, etc.), explicitly ignoring 'Sample Course Plan' template headers.
 * 2. Strict section terminators: Complex Engineering Problem, Counseling Hours, Course Time Table, Office Hours, Class Schedule, etc.
 * 3. Discards day-of-week rows, venue rows, and timetable serial number rows.
 * 4. Dual-mode parsing:
 *    - Mode A: Single-line table rows (e.g. Word .docx tables: "1 | Introduction to Embedded Systems...")
 *    - Mode B: Multi-line wrapped tables (e.g. PDF.js & LaTeX layouts: Topic title, wrapped bullets, week numbers, Midterm/Final Exams).
 * 5. Automatic word hyphen stitching ("computa-" + "tional" -> "computational").
 */
export function extractCoursePlanFromDocument(rawText) {
  if (!rawText || !rawText.trim()) return '';

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Common filters & classifiers
  const citationRe = /(?:[A-Za-z]+:\s*Ch(?:apter)?[- ]?[\d,\s–-]+|\b(?:Goodrich|Weiss|Stallings|Deitel|Tanenbaum|Mazidi|Cormen|Silberschatz|Patterson|Pressman|Sommerville|Sedgewick|Knuth|Haykin|Oppenheim|Proakis|Boylestad|Floyd|Nilsson|Chapra|Kreyszig)\b|•?\s*(?:ref|reference|book|textbook)\b|\bCh(?:apter)?\.?\s*[-–]?\s*\d+)/i;
  const activityRe = /^(?:quiz|assignment|homework|project|review|all|exam|lab)\b/i;
  const outcomeRe = /^(?:clo|plo|so|po)[-_ ]?\d+|[cpa][1-7]$|\d+\s*\/\s*(?:clo|plo|so|po)[-_ ]?\d+/i;
  const dayNamesRe = /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;

  function isMetadataCol(col) {
    if (!col) return true;
    const c = col.trim();
    if (!c) return true;
    if (/^(?:weeks?\s*[-_#]?\s*)?\d{1,2}$/i.test(c)) return true;
    if (outcomeRe.test(c) || /^(?:clo|plo|so|po)[-_ ]?\d+/i.test(c)) return true;
    if (activityRe.test(c)) return true;
    if (citationRe.test(c)) return true;
    if (dayNamesRe.test(c)) return true;
    if (/^\d+(?:,\s*\d+)*$/.test(c)) return true;
    if (/^[•\-*]$/.test(c)) return true;
    return false;
  }

  // 1. Locate start of Weekly Plan section
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Explicitly ignore 'Sample Course Plan' header on page 1
    if (/sample\s*course\s*plan/i.test(l)) continue;

    if (/^\s*(?:\d+[\.\)]\s*)?(?:weekly\s*(?:course\s*)?plan|schedule\s*of\s*(?:lectures|classes)|course\s*schedule|topical\s*(?:outline|breakdown)|lecture\s*schedule|topics\s*to\s*be\s*covered)\b/i.test(l)) {
      startIdx = i;
      break;
    }
    if (/\b(?:week\s*no\.?|week)\b.*\b(?:topics?|contents?)\b/i.test(l)) {
      startIdx = i;
      break;
    }
  }

  // Fallback: Check if document directly starts with week entries (e.g. pasted topics)
  if (startIdx === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*weeks?\s*\d+/i.test(lines[i])) {
        startIdx = Math.max(0, i - 1);
        break;
      }
    }
  }

  if (startIdx === -1) return '';

  // 2. Locate end of Weekly Plan section
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i];
    // Immediate terminators: Complex Engineering Problem, Counseling Hours, Time Table, etc.
    if (/^\s*(?:\d+[\.\)]\s*)?(?:complex\s*engineering\s*problem|cep\b|counseling\s*hours|counselling\s*hours|course\s*time\s*table|time\s*table|timetable|office\s*hours|class\s*schedule|teaching\s*assistant|grading\s*policy|grade\s*distribution|evaluation\s*scheme|academic\s*integrity|plagiarism\s*policy|course\s*policies?)\b/i.test(l)) {
      endIdx = i;
      break;
    }
    // Subsequent numbered section header: e.g. '8. Complex...', '9. Counseling...', '10. Time Table...'
    if (/^\s*(?:[8-9]|\d{2,})[\.\)]\s+[A-Z]/i.test(l)) {
      endIdx = i;
      break;
    }
    // Timetable table header
    if (/\bsr\.?\s*no\.?\b.*\b(?:day|venue|time)\b/i.test(l)) {
      endIdx = i;
      break;
    }
  }

  const rawSectionLines = lines.slice(startIdx + 1, endIdx);

  // Common filters: Day names, Timetable rows, Serial numbers
  const timeSlotRe = /\b\d{1,2}:\d{2}\s*(?:am|pm)?\s*[-–]\s*\d{1,2}:\d{2}\s*(?:am|pm)?/i;
  const venueRe = /\b(?:venue|room\s*no\.?|[a-z]-\d{3,4}|building\s*[a-z]|lab\s*\d+)\b/i;

  const validLines = [];
  for (const l of rawSectionLines) {
    if (dayNamesRe.test(l) && (timeSlotRe.test(l) || venueRe.test(l) || /sr\.?\s*no\.?/i.test(l))) {
      continue;
    }
    if (/^\s*(?:sr\.?\s*no\.?|day|time|venue|contact|office)\s*$/i.test(l)) {
      continue;
    }
    if (/^\s*(?:week\s*no\.?|week|topics?|reference|activity|clo)\s*(?:\|\s*(?:topics?|reference|activity|clo)\s*)+$/i.test(l)) {
      continue;
    }
    if (/^\s*week\s*(?:no\.?)?\s*topics?\b/i.test(l)) {
      continue;
    }
    if (/^\s*(?:page\s*\d+|\d+\s*of\s*\d+)\s*$/i.test(l)) {
      continue;
    }
    if (/^\s*\d{1,2}\s*$/.test(l) && parseInt(l.trim()) > 18) {
      continue; // lone page numbers
    }
    validLines.push(l);
  }

  // Check if this is a clean single-line table (e.g. Word docx where EVERY row is "1 | Introduction to Embedded Systems...")
  let singleLineCount = 0;
  for (const l of validLines) {
    if (l.includes('|')) {
      const parts = l.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2 && /^(?:weeks?\s*[-_#]?\s*)?(\d{1,2})$/i.test(parts[0])) {
        const topic = parts[1];
        if (topic.length > 5 && !topic.startsWith('•') && !isMetadataCol(topic)) {
          singleLineCount++;
        }
      }
    }
  }

  if (singleLineCount >= 8) {
    // Single-line table mode (like Word .docx)
    const result = [];
    for (const l of validLines) {
      if (/mid-?term\s*exam(?:ination)?/i.test(l)) {
        result.push('Mid-Term Examination');
        continue;
      }
      if (/final\s*exam(?:ination)?/i.test(l)) {
        result.push('Final Examination');
        continue;
      }
      if (l.includes('|')) {
        const parts = l.split('|').map(p => p.trim()).filter(Boolean);
        const m = parts[0].match(/^(?:weeks?\s*[-_#]?\s*)?(\d{1,2}(?:\s*[-–]\s*\d{1,2})?)$/i);
        if (m && parts.length >= 2) {
          const wNum = m[1];
          let topic = parts[1].replace(/^week\s*\d+[:\-–\s]*/i, '').trim();
          if (topic.length > 3 && !isMetadataCol(topic)) {
            result.push(`Week ${wNum}: ${topic}`);
          }
        }
      }
    }
    return result.join('\n');
  }

  // Multi-line table mode (PDF.js / LaTeX)
  const rawItems = [];
  let nextIsBullet = false;

  for (const l of validLines) {
    if (/^\s*(?:mid-?term\s*exam(?:ination)?)\s*$/i.test(l)) {
      rawItems.push({ type: 'exam', text: 'Midterm Examination' });
      nextIsBullet = false;
      continue;
    }
    if (/^\s*(?:final\s*exam(?:ination)?)\s*$/i.test(l)) {
      rawItems.push({ type: 'exam', text: 'Final Examination' });
      nextIsBullet = false;
      continue;
    }

    // Check if line is solely a bullet character
    if (/^[•\-*]$/.test(l.trim())) {
      nextIsBullet = true;
      continue;
    }

    let lineText = '';
    let foundWeekNum = null;

    if (l.includes('|')) {
      const parts = l.split('|').map(p => p.trim()).filter(Boolean);
      if (/^(?:weeks?\s*[-_#]?\s*)?(\d{1,2})$/i.test(parts[0])) {
        foundWeekNum = parseInt(parts[0].match(/\d+/)[0]);
      }
      if (parts.some(p => /^[•\-*]$/.test(p))) {
        nextIsBullet = true;
      }
      const nonMeta = parts.filter(p => !isMetadataCol(p));
      if (nonMeta.length > 0) {
        lineText = nonMeta.join(' ');
      }
    } else {
      const loneDigit = l.match(/^(\d{1,2})$/);
      if (loneDigit) {
        const val = parseInt(loneDigit[1]);
        if (val >= 1 && val <= 18) foundWeekNum = val;
      } else {
        if (!isMetadataCol(l)) {
          lineText = l;
        }
      }
    }

    lineText = lineText.trim();
    if (lineText) {
      // Strip trailing CLO fragments glued by table cells: e.g. "BST deletion 2/CLO-3" -> "BST deletion"
      lineText = lineText.replace(/\s*(?:(?:CLO|PLO|SO|PO)[-_ ]?\d*|\d+\s*\/\s*(?:CLO|PLO|SO|PO)[-_ ]?\d*|[CPA][1-7])$/i, '').trim();
      lineText = lineText.replace(/\s*,\s*$/, '').trim();

      if (isMetadataCol(lineText)) continue;
      if (/^week\s*(?:no\.?)?\s*topics?\b/i.test(lineText)) continue;

      let isBullet = nextIsBullet || lineText.startsWith('•') || lineText.startsWith('-') || lineText.startsWith('*');
      lineText = lineText.replace(/^[•\-*]\s*/, '').trim();
      nextIsBullet = false;

      rawItems.push({ type: 'text', text: lineText, week: foundWeekNum, isBullet });
    }
  }

  // Stitch lines into Title vs Bullets
  const weeks = [];
  let currentTitle = '';
  let currentBullets = [];

  function flushWeek() {
    if (currentTitle || currentBullets.length > 0) {
      weeks.push({
        title: currentTitle.trim(),
        bullets: [...currentBullets]
      });
      currentTitle = '';
      currentBullets = [];
    }
  }

  for (let i = 0; i < rawItems.length; i++) {
    const it = rawItems[i];
    if (it.type === 'exam') {
      flushWeek();
      weeks.push({ type: 'exam', text: it.text });
      continue;
    }

    let text = it.text.trim();

    if (it.isBullet) {
      currentBullets.push(text);
    } else {
      if (currentBullets.length > 0) {
        const lastBullet = currentBullets[currentBullets.length - 1];
        const isHyphenContinuation = lastBullet.endsWith('-');
        const isLower = /^[a-z0-9]/.test(text);
        const isContinuationPhrase = /^(?:and|or|in|to|with|for|of|by|using|vers|against|from)\b/i.test(text);
        const prevEndsWithPrep = /\b(?:in|and|or|of|for|with|between|versus|to|using|a|an|the|-)$/i.test(lastBullet.trim());
        const isAbbr = /^\((?:ADTs?|PCBs?|BSTs?|C\+\+|I\/O)\)/i.test(text) || /^(?:C\+\+|ADTs?|PCBs?|BSTs?)$/i.test(text);
        const isSingleWordNonTopic = text.split(/\s+/).length === 1 && !/^(?:Stacks|Queues|Graphs|Heaps|Recursion|Concurrency|Deadlocks)$/i.test(text);

        if (isHyphenContinuation) {
          currentBullets[currentBullets.length - 1] = lastBullet.slice(0, -1) + text;
        } else if (isLower || isContinuationPhrase || prevEndsWithPrep || isAbbr || isSingleWordNonTopic) {
          currentBullets[currentBullets.length - 1] = lastBullet + ' ' + text;
        } else {
          // This is a NEW WEEK's Title!
          flushWeek();
          currentTitle = text;
        }
      } else {
        // No bullets yet in this week: it's part of the Title!
        if (!currentTitle) {
          currentTitle = text;
        } else if (currentTitle.endsWith('-')) {
          currentTitle = currentTitle.slice(0, -1) + text;
        } else {
          currentTitle += ' ' + text;
        }
      }
    }
  }
  flushWeek();

  // Format final plan
  const outLines = [];
  let wNum = 1;
  for (const w of weeks) {
    if (w.type === 'exam') {
      outLines.push(`\n--- ${w.text.toUpperCase()} ---\n`);
      continue;
    }
    const title = w.title || `Module ${wNum}`;
    outLines.push(`Week ${wNum}: ${title}`);
    for (const b of w.bullets) {
      outLines.push(`  • ${b}`);
    }
    wNum++;
  }

  const finalPlan = outLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  // Sanity check: Ensure plan is not solely citations or empty
  if (finalPlan.length < 20 || (finalPlan.match(/Week \d+:/g) || []).length < 2) {
    return '';
  }
  return finalPlan;
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

  // Run dedicated high-fidelity CLO extractor
  const structuredCLOs = extractCLOsFromDocument(rawText);
  if (structuredCLOs && structuredCLOs.length > 0) {
    clos.push(...structuredCLOs);
  }

  // Run dedicated high-fidelity Course Plan extractor
  const structuredPlan = extractCoursePlanFromDocument(rawText);
  if (structuredPlan && structuredPlan.trim().length > 15) {
    coursePlan = structuredPlan;
  }

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

  const cloRegex = /^\s*(?:CLO|CO|LO|Outcome)\s*[-_#]?\s*(\d+)[:.\-–\s]+(.+)/i;
  let inCLOSection = false;
  let inPlanSection = false;
  let inDescSection = false;

  const planLines = [];
  const descLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ignore sample course plan header on page 1
    if (/^\s*sample\s*course\s*plan/i.test(line)) {
      continue;
    }

    // Section terminators (only when line starts explicitly with these headings)
    if (/^\s*(?:grading\s*policy|grade\s*distribution|evaluation\s*scheme|course\s*policy|academic\s*integrity|plagiarism\s*policy|practical\s*applications|course\s*books|text\s*books|reference\s*books|recommended\s*books|student\s*assessment|complex\s*engineering\s*problem|cep\b|counseling\s*hours|counselling\s*hours|course\s*time\s*table|time\s*table|timetable|office\s*hours|class\s*schedule|\b(?:[8-9]|\d{2,})[\.\)]\s+[A-Z]|\b(?:3|4|5|6|7)\.\s*(?:course\s*books|text\s*books|student\s*assessment|practical\s*applications))\b/i.test(line) || /\bsr\.?\s*no\.?\b.*\b(?:day|venue|time)\b/i.test(line)) {
      inCLOSection = false;
      inPlanSection = false;
      inDescSection = false;
      continue;
    }

    // Section triggers via headings
    if (/^\s*(?:(?:\d+[\.\)]\s*)?(?:course\s*learning\s*outcomes|learning\s*outcomes|\bclos\b|\bintended\s*learning\s*outcomes\b|\bcourse\s*objectives\b|\bobjectives\b))\b/i.test(line)) {
      inCLOSection = true;
      inPlanSection = false;
      inDescSection = false;
      continue;
    }
    if (/^\s*(?:(?:\d+[\.\)]\s*)?(?:course\s*plan|weekly\s*(?:plan|breakdown|schedule|outline)|topical\s*(?:outline|breakdown|syllabus)|course\s*content[s]?|course\s*outline|lecture\s*schedule|detailed\s*syllabus|topics\s*to\s*be\s*covered))\b/i.test(line)) {
      inPlanSection = true;
      inCLOSection = false;
      inDescSection = false;
      continue;
    }
    if (/^\s*(?:(?:\d+[\.\)]\s*)?(?:course\s*(?:description|scope|overview|catalog)|about\s*the\s*course|course\s*aims|course\s*introduction))\b/i.test(line)) {
      inDescSection = true;
      inCLOSection = false;
      inPlanSection = false;
      continue;
    }

    // Section triggers via table header detection
    if (/\bclo\s*no\.?|\bclo\b.*\b(?:statement|outcome|plo|bloom|taxonomy)\b/i.test(line)) {
      inCLOSection = true;
      inPlanSection = false;
      inDescSection = false;
      continue;
    }
    if (/\bweek\s*no\.?|\bweek\b.*\b(?:topic|content|lecture|activity|reference)\b/i.test(line)) {
      inPlanSection = true;
      inCLOSection = false;
      inDescSection = false;
      continue;
    }

    // Process table row lines (pipe-delimited or multi-space column separated)
    let processedLine = line;
    if (!processedLine.includes('|') && !processedLine.includes('\t') && /\s{3,}/.test(processedLine)) {
      processedLine = processedLine.replace(/\s{3,}/g, ' | ');
    }

    if (processedLine.includes('|') || processedLine.includes('\t')) {
      const parts = processedLine.split(/[|\t]/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // Skip header rows
        if (/^(?:week\s*no\.?|week|wk|no\.?|s\.?no\.?)$/i.test(parts[0]) && /^(?:topics?|contents?|reference|activity|lecture|module)/i.test(parts[1])) {
          inPlanSection = true;
          inCLOSection = false;
          continue;
        }
        if (/^(?:clo\s*no\.?|clo|outcome\s*no\.?|no\.?)$/i.test(parts[0]) && /^(?:clo\s*statement|statement|outcome|learning\s*outcome|plo|bloom|taxonomy)/i.test(parts[1])) {
          inCLOSection = true;
          inPlanSection = false;
          continue;
        }

        // 1. CLO Table Row fallback (only if structured extractor did not find CLOs)
        if (clos.length === 0) {
          const cloDigitMatch = parts[0].match(/^(?:CLO\s*[-_#]?\s*)?(\d{1,2})$/i);
          const hasTaxInRow = /\b([CPA][1-7])\b/i.test(processedLine);
          if (cloDigitMatch && parts.length >= 3 && (inCLOSection || (hasTaxInRow && !inPlanSection))) {
            let statement = parts[1];
            if (statement.length > 10 && !/^(?:topics?|reference|activity|week|clo\s*statement|contents?)/i.test(statement)) {
              const bloomMatch = processedLine.match(/\b([CPA][1-7])\b/i);
              let detectedTax = bloomMatch ? bloomMatch[1].toUpperCase() : '';
              if (!detectedTax) {
                const cleanWords = statement.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
                for (const w of cleanWords.slice(0, 4)) {
                  if (verbBloomMap[w]) {
                    detectedTax = verbBloomMap[w];
                    break;
                  }
                }
              }
              if (!detectedTax) detectedTax = 'C3';

              // Extract PLO from parts[2] or line (supporting multi-PLO)
              const plos = [];
              const pMatches = parts[2].match(/\b\d{1,2}\b/g) || (processedLine.match(/\b(?:PLO|PO|SO)[-_ ]?(\d{1,2})\b/gi) || []).map(p => p.replace(/[^\d]/g, ''));
              if (pMatches) {
                for (const p of pMatches) {
                  const pTag = 'PLO-' + p;
                  if (!plos.includes(pTag)) plos.push(pTag);
                }
              }
              const detectedPLO = plos.length > 0 ? plos.join(', ') : `PLO-${cloDigitMatch[1]}`;

              statement = statement.replace(/\[\s*(?:PLO|PO|SO)[^\]]*\]|\(\s*(?:PLO|PO|SO)[^)]*\)/gi, '').trim();
              statement = statement.replace(/\[\s*[CPA][1-7][^\]]*\]|\(\s*[CPA][1-7][^)]*\)/gi, '').trim();

              clos.push({
                id: parseInt(cloDigitMatch[1]),
                statement: statement,
                plo: detectedPLO,
                taxonomy: detectedTax
              });
              continue;
            }
          }
        }

        // 2. Weekly Plan Table Row: e.g. 1 | Introduction to Embedded Systems... | Chapter 1... | -
        const weekDigitMatch = parts[0].match(/^(?:weeks?\s*[-_#]?\s*)?(\d{1,2}(?:\s*[-–]\s*\d{1,2})?)$/i);
        if (weekDigitMatch && parts.length >= 2 && inPlanSection) {
          const wNum = weekDigitMatch[1];
          let topic = parts[1];
          const daysOfWeekRe = /^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
          if (!daysOfWeekRe.test(topic) && topic.length > 3 && !/^(?:topics?|reference|activity|week|-|nil|clo\s*statement)$/i.test(topic) && !/^(?:clo|plo|so|po)[-_ ]?\d+/i.test(topic)) {
            const cleanTopic = topic.replace(/^week\s*\d+[:\-–\s]*/i, '').trim();
            planLines.push(`Week ${wNum}: ${cleanTopic}`);
            continue;
          }
        }
      }
    }

    // Try parsing explicit CLO format fallback (only if clos is empty): CLO-1: ... or CO 1: ...
    if (clos.length === 0) {
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
    }

    if (inPlanSection) {
      // Exclude pure page numbers, timetable entries, and stray section artifacts
      const daysOfWeekRe = /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
      const isTimetableLine = daysOfWeekRe.test(line) && (/\d{1,2}:\d{2}/.test(line) || /venue|room|sr\.?\s*no\.?/i.test(line));
      const isPostPlanHeader = /^\s*(?:\d+[\.\)]\s*)?(?:complex\s*engineering|counseling|course\s*time\s*table|timetable|office\s*hours)/i.test(line);

      if (isPostPlanHeader || isTimetableLine) {
        inPlanSection = false;
        continue;
      }

      if (line.length > 3 && !/^(?:page\s*\d+|\d+\s*of\s*\d+|confidential|week\s*no\.?|topics?|reference|activity|-|nil)$/i.test(line)) {
        if (/^week\s*\d+/i.test(line)) {
          planLines.push(line);
        } else if (!/^(?:quizzes|assignments|mid\s*term|final\s*term|\d+%)$/i.test(line) && !/^(?:textbook|reference\s*book|author)/i.test(line) && !daysOfWeekRe.test(line)) {
          planLines.push(line);
        }
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

  // Fallback 3 for Course Plan: Synthesize authentic topical outline tailored to courseName if not already extracted
  if (!coursePlan) {
    if (planLines.length > 0) {
      const cleanPlanLines = planLines.filter(l => !/^(?:week\s*no\.?|topics?|reference|activity|-|nil)$/i.test(l.trim()));
      coursePlan = cleanPlanLines.join('\n');
    } else {
      coursePlan = synthesizeDefaultOutlineForCourse(courseName, courseDescription);
    }
  }



  // Fallback CLOs detection across entire text if still empty
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

/**
 * High-accuracy client-side assessment question extractor for exam, quiz, and test papers
 * Parses Word (.docx), PDF (.pdf), and text documents into structured questions with marks, mapped CLO, and target taxonomy
 */
export function extractQuestionsFromDocument(rawText = '', activeCLOs = ['CLO-1', 'CLO-2', 'CLO-3']) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return { questions: [], courseTitle: null, assessmentTitle: null, totalMarks: 0 };
  }

  // 1. Truncate answer keys, solutions, marking rubrics, and end-of-exam markers
  const cutoffRegex = /(?:\b(?:instructor['’]?s?\s+)?answer\s*key\b|\bmarking\s*(?:guide|scheme|rubric)\b|\bsolutions?\s*(?:to\s*questions?|section)?\b|\bmodel\s*answers?\b|\bend\s*of\s*(?:quiz|paper|exam|test)\b)/i;
  const cutoffMatch = rawText.search(cutoffRegex);
  const examText = (cutoffMatch > 100) ? rawText.slice(0, cutoffMatch) : rawText;

  // Clean form feeds, repetitive page headers, and doc artifacts
  const cleanText = examText
    .replace(/\f[^\n]*\n?/g, '\n')
    .replace(/(?:page\s+\d+\s+of\s+\d+|page\s+\d+)/gi, '')
    .trim();

  // 2. Extract course title and assessment title hints from preamble
  let courseTitle = null;
  let assessmentTitle = null;

  const courseMatch = cleanText.match(/(?:^|\n)\s*(?:Course(?:\s*Title|\s*Name|\s*Code)?:?\s*)?([A-Z]{2,5}\s*[-–]?\s*\d{3,4}[A-Za-z]?\s*[:\-–]\s*[^\n\r]+)/i);
  if (courseMatch) {
    courseTitle = courseMatch[1].trim();
  }

  const examMatch = cleanText.match(/(?:^|\n)\s*(Quiz\s*[-–#]?\s*\d+|Mid\s*Term(?:\s*Examination|\s*Exam)?|Final\s*Term(?:\s*Examination|\s*Exam)?|Assignment\s*[-–#]?\s*\d+|Test\s*[-–#]?\s*\d+)/i);
  if (examMatch) {
    assessmentTitle = examMatch[1].trim();
  }

  // 3. Detect any global CLO and Bloom's mapping in preamble (e.g., CLO-1 -> PLO-2 -> Bloom's Taxonomy C3)
  const preambleCLOMap = {};
  const globalCloMatch = cleanText.match(/\b(CLO[-_\s]?\d+)\s*(?:→|->|mapped to|to)\s*(?:PLO[-_\s]?\d+\s*(?:→|->|to)\s*)?(?:Bloom(?:'s)?\s*(?:Taxonomy)?)?\s*([CPA]\d)/i);
  let defaultGlobalCLO = globalCloMatch ? globalCloMatch[1].toUpperCase().replace(/\s+/g, '-') : (activeCLOs[0] || 'CLO-1');
  let defaultGlobalTax = globalCloMatch ? globalCloMatch[2].toUpperCase() : 'C3';

  // 4. Detect Question-wise Assessment Mapping tables in preamble
  // Matches e.g. (a) Apply array processing ... CLO-1 (C3) 1
  const tableMappings = {};
  const tableRowRegex = /(?:^|\n)\s*\(?([a-z]|\d+)\)?\s+.*?\b(CLO[-_\s]?\d+)\s*(?:\(([CPA]\d)\))?\s+(\d+)/gi;
  let tMatch;
  while ((tMatch = tableRowRegex.exec(cleanText)) !== null) {
    const key = tMatch[1].toLowerCase();
    tableMappings[key] = {
      clo: tMatch[2].toUpperCase().replace(/\s+/g, '-'),
      taxonomy: tMatch[3] ? tMatch[3].toUpperCase() : '',
      marks: parseInt(tMatch[4], 10) || 1
    };
  }

  // 5. Taxonomy & Marks inference helpers
  const inferTaxonomyFromVerb = (txt) => {
    const lower = txt.toLowerCase();
    if (/\b(design|formulate|synthesize|devise|create|architect|construct|develop)\b/.test(lower)) return 'C6';
    if (/\b(evaluate|critique|assess|appraise|justify|judge|defend)\b/.test(lower)) return 'C5';
    if (/\b(analyze|analyse|diagnose|differentiate|investigate|distinguish|compare|contrast|examine|troubleshoot)\b/.test(lower)) return 'C4';
    if (/\b(calculate|compute|solve|apply|implement|derive|determine|find|execute|demonstrate)\b/.test(lower)) return 'C3';
    if (/\b(explain|describe|interpret|discuss|summarize|illustrate|why|differentiate between)\b/.test(lower)) return 'C2';
    if (/\b(define|list|state|identify|name|recall|mention|what\s+is|write\s+down)\b/.test(lower)) return 'C1';
    return defaultGlobalTax;
  };

  const inferMarks = (txt, fallbackMarks = 10) => {
    const markMatch = txt.match(/[\(\[]\s*(\d+)\s*(?:marks?|pts?|points?)?\s*[\)\]]/i);
    if (markMatch) return parseInt(markMatch[1], 10);
    const altMarkMatch = txt.match(/\b(\d+)\s*(?:marks|pts|points)\b/i);
    if (altMarkMatch) return parseInt(altMarkMatch[1], 10);
    return fallbackMarks;
  };

  const inferCLO = (txt, fallbackCLO) => {
    const cloMatch = txt.match(/\bCLO[-_\s]?(\d+)\b/i);
    if (cloMatch) return `CLO-${cloMatch[1]}`;
    return fallbackCLO;
  };

  const inferTaxFromText = (txt) => {
    const match = txt.match(/[\(\[]\s*([CPA][1-7])\s*[\)\]]/i) || txt.match(/\bBloom(?:'s)?\s*(?:Taxonomy)?\s*[:\-–]?\s*([CPA][1-7])\b/i);
    if (match) return match[1].toUpperCase();
    return null;
  };

  const cleanPromptText = (txt) => {
    return txt
      .replace(/^(?:Question\s*(?:No\.?)?\s*\d+|Q(?:uestion)?\s*[-–\.:#]?\s*\d+|Problem\s*\d+|\d+[\.\)])[^\n:]*[:\.\-–]?\s*/i, '')
      .replace(/^\s*\(\s*(?:Allocated\s*)?Marks\s*\)/i, '')
      .replace(/[\(\[]\s*\d+\s*(?:marks?|pts?|points?)?\s*[\)\]]/gi, '')
      .replace(/[\(\[]\s*CLO[-_\s]?\d+[^\]\)]*[\)\]]/gi, '')
      .replace(/[\(\[]\s*[CPA][1-7]\s*[\)\]]/gi, '')
      .replace(/\s*(?:Quiz\s*[-–#]?\s*\d+|Mid\s*Term(?:\s*Examination|\s*Exam)?|Final\s*Term(?:\s*Examination|\s*Exam)?|Assignment\s*[-–#]?\s*\d+)\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 6. Split text into Question Blocks
  const qSplitRegex = /(?:^|\n)\s*(?:Question\s*(?:No\.?)?\s*(\d+)|Q(?:uestion)?\s*[-–\.:#]?\s*(\d+)|Problem\s*(\d+))\s*[:\.\-–]?\s*/gi;
  let qMatches = [];
  let m;
  while ((m = qSplitRegex.exec(cleanText)) !== null) {
    qMatches.push({ index: m.index, num: m[1] || m[2] || m[3] || (qMatches.length + 1) });
  }

  // Fallback 1: Numbered questions like "1. ... 2. ... 3. ..."
  if (qMatches.length === 0) {
    const numSplitRegex = /(?:^|\n)\s*(\d+)[\.\)]\s+/g;
    while ((m = numSplitRegex.exec(cleanText)) !== null) {
      const lineSnippet = cleanText.slice(m.index, m.index + 80);
      if (!/week\s*\d|page\s*\d|\d+\s*marks?|semester|spring|fall|clo\s*-\s*\d/i.test(lineSnippet)) {
        qMatches.push({ index: m.index, num: m[1] });
      }
    }
  }

  const questions = [];

  if (qMatches.length > 0) {
    for (let i = 0; i < qMatches.length; i++) {
      const start = qMatches[i].index;
      const end = (i + 1 < qMatches.length) ? qMatches[i + 1].index : cleanText.length;
      const qNum = qMatches[i].num;
      const block = cleanText.slice(start, end).trim();

      const defaultCloForQ = (activeCLOs.length > 0) ? activeCLOs[i % activeCLOs.length] : defaultGlobalCLO;

      // Check for subparts e.g. a) ... b) ... or (a) ... (b) ...
      const subpartRegex = /(?:^|\n)\s*(?:\(([a-z])\)|([a-z])\))\s+/gi;
      const subMatches = [];
      let sm;
      while ((sm = subpartRegex.exec(block)) !== null) {
        subMatches.push({ index: sm.index, letter: (sm[1] || sm[2]).toLowerCase() });
      }

      if (subMatches.length >= 2) {
        // Multi-part question with subparts
        const stemBlock = block.slice(0, subMatches[0].index);
        let cleanStem = cleanPromptText(stemBlock);
        if (cleanStem.length > 200) {
          cleanStem = cleanStem.slice(0, 197) + '...';
        }

        for (let j = 0; j < subMatches.length; j++) {
          const pStart = subMatches[j].index;
          const pEnd = (j + 1 < subMatches.length) ? subMatches[j + 1].index : block.length;
          const letter = subMatches[j].letter;
          let partText = block.slice(pStart, pEnd);
          partText = partText.replace(/^\s*(?:\([a-z]\)|[a-z]\))\s*/i, '').trim();

          const tableInfo = tableMappings[letter] || {};
          const marks = inferMarks(partText, tableInfo.marks || 1);
          const clo = tableInfo.clo || inferCLO(partText, defaultCloForQ);
          const tax = tableInfo.taxonomy || inferTaxFromText(partText) || inferTaxonomyFromVerb(partText);
          const prompt = cleanPromptText(partText);

          questions.push({
            id: questions.length + 1,
            qNumber: `Q${qNum}(${letter})`,
            text: prompt,
            marks: marks,
            mappedCLO: clo,
            targetTaxonomy: tax
          });
        }
      } else {
        // Single monolithic question block
        const marks = inferMarks(block, 10);
        const clo = inferCLO(block, defaultCloForQ);
        const tax = inferTaxFromText(block) || inferTaxonomyFromVerb(block);
        const prompt = cleanPromptText(block);

        if (prompt.length > 5) {
          questions.push({
            id: questions.length + 1,
            qNumber: `Q${qNum}`,
            text: prompt,
            marks: marks,
            mappedCLO: clo,
            targetTaxonomy: tax
          });
        }
      }
    }
  }

  // Fallback 2: If no structured question numbers were found, split by question marks or double newlines
  if (questions.length === 0) {
    const rawParagraphs = cleanText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 15);
    rawParagraphs.forEach((para, idx) => {
      // Ignore header/metadata paragraphs
      if (/^(?:student\s*name|registration|time\s*allowed|total\s*marks|department\s*of|faculty\s*of|session\s*20)/i.test(para)) {
        return;
      }
      const prompt = cleanPromptText(para);
      if (prompt.length > 10) {
        const clo = (activeCLOs.length > 0) ? activeCLOs[idx % activeCLOs.length] : defaultGlobalCLO;
        questions.push({
          id: questions.length + 1,
          qNumber: `Q${idx + 1}`,
          text: prompt,
          marks: inferMarks(para, 10),
          mappedCLO: inferCLO(para, clo),
          targetTaxonomy: inferTaxFromText(para) || inferTaxonomyFromVerb(prompt)
        });
      }
    });
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return {
    questions,
    courseTitle,
    assessmentTitle,
    totalMarks
  };
}

