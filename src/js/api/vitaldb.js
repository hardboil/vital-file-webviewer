/**
 * VitalDB API Client
 * Fetches case lists and vital files from VitalDB Open Dataset
 */

import pako from 'pako';
import { VITALDB } from '../config.js';

/**
 * VitalDB Client class
 */
export class VitalDBClient {
  /**
   * @param {string} baseUrl - API base URL
   */
  constructor(baseUrl = VITALDB.apiBase) {
    this.baseUrl = baseUrl;
    this.casesCache = null;
  }

  /**
   * Fetch case list
   * @returns {Promise<Array>} - Array of case objects
   */
  async getCases() {
    if (this.casesCache) {
      return this.casesCache;
    }

    try {
      const response = await fetch(`${this.baseUrl}/cases`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      // Response is gzip-compressed CSV
      const arrayBuffer = await response.arrayBuffer();
      let csvText;

      try {
        // Try to decompress
        const decompressed = pako.inflate(new Uint8Array(arrayBuffer));
        csvText = new TextDecoder().decode(decompressed);
      } catch {
        // Maybe not compressed
        csvText = new TextDecoder().decode(arrayBuffer);
      }

      this.casesCache = this.parseCSV(csvText);
      return this.casesCache;
    } catch (err) {
      console.error('Failed to fetch cases:', err);
      throw err;
    }
  }

  /**
   * Fetch track list
   * @returns {Promise<Array>} - Array of track objects
   */
  async getTracks() {
    try {
      const response = await fetch(`${this.baseUrl}/trks`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      let csvText;

      try {
        const decompressed = pako.inflate(new Uint8Array(arrayBuffer));
        csvText = new TextDecoder().decode(decompressed);
      } catch {
        csvText = new TextDecoder().decode(arrayBuffer);
      }

      return this.parseCSV(csvText);
    } catch (err) {
      console.error('Failed to fetch tracks:', err);
      throw err;
    }
  }

  /**
   * Get download URL for a case
   * @param {number|string} caseId - Case ID
   * @returns {string} - Download URL
   */
  getDownloadUrl(caseId) {
    const paddedId = String(caseId).padStart(4, '0');
    return `${this.baseUrl}/${paddedId}.vital`;
  }

  /**
   * Download vital file
   * @param {number|string} caseId - Case ID
   * @returns {Promise<ArrayBuffer>}
   */
  async downloadVital(caseId) {
    const url = this.getDownloadUrl(caseId);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Parse CSV text to array of objects
   * @param {string} csvText - CSV content
   * @returns {Array}
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = this.parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = values[j];
      }
      data.push(obj);
    }

    return data;
  }

  /**
   * Parse a single CSV line handling quoted values
   * @param {string} line - CSV line
   * @returns {Array<string>}
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Get unique departments from cases
   * @param {Array} cases - Case list
   * @returns {Array<string>}
   */
  getDepartments(cases) {
    const depts = new Set();
    for (const c of cases) {
      if (c.department) {
        depts.add(c.department);
      }
    }
    return [...depts].sort();
  }

  /**
   * Filter cases by search query and filters
   * @param {Array} cases - Case list
   * @param {Object} filters - Filter options
   * @returns {Array}
   */
  filterCases(cases, filters = {}) {
    let result = cases;

    // Search by case ID or operation name
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(c =>
        String(c.caseid).includes(search) ||
        (c.opname && c.opname.toLowerCase().includes(search))
      );
    }

    // Filter by department
    if (filters.department) {
      result = result.filter(c => c.department === filters.department);
    }

    // Filter by sex
    if (filters.sex) {
      result = result.filter(c => c.sex === filters.sex);
    }

    // Filter by age range
    if (filters.ageMin !== undefined && filters.ageMin !== '' && parseInt(filters.ageMin) > 0) {
      const minAge = parseInt(filters.ageMin);
      result = result.filter(c => parseInt(c.age) >= minAge);
    }
    if (filters.ageMax !== undefined && filters.ageMax !== '' && parseInt(filters.ageMax) < 100) {
      const maxAge = parseInt(filters.ageMax);
      result = result.filter(c => parseInt(c.age) <= maxAge);
    }

    // Filter by ASA
    if (filters.asa !== undefined && filters.asa !== '') {
      const asaValue = parseInt(filters.asa);
      result = result.filter(c => parseInt(c.asa) === asaValue);
    }

    return result;
  }
}

/**
 * Format case for display
 * @param {Object} caseData - Case object
 * @returns {Object}
 */
export function formatCaseDisplay(caseData) {
  const sex = caseData.sex === 'M' ? 'M' : 'F';
  const age = caseData.age || '?';

  return {
    id: caseData.caseid,
    label: `Case ${String(caseData.caseid).padStart(4, '0')}`,
    meta: `${sex}/${age} | ${caseData.department || 'Unknown'} | ${caseData.opname || ''}`.substring(0, 60)
  };
}
