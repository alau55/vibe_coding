import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store data in user's home directory
const KB_DIR = path.join(os.homedir(), '.kb-cli');
const ENTRIES_FILE = path.join(KB_DIR, 'entries.json');
const TAGS_FILE = path.join(KB_DIR, 'tags.json');
const CONFIG_FILE = path.join(KB_DIR, 'config.json');

class Store {
  constructor() {
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(KB_DIR)) {
      fs.mkdirSync(KB_DIR, { recursive: true });
    }

    // Initialize files if they don't exist
    if (!fs.existsSync(ENTRIES_FILE)) {
      fs.writeFileSync(ENTRIES_FILE, JSON.stringify([], null, 2));
    }

    if (!fs.existsSync(TAGS_FILE)) {
      fs.writeFileSync(TAGS_FILE, JSON.stringify([], null, 2));
    }

    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2));
    }
  }

  // Entries
  getEntries() {
    const data = fs.readFileSync(ENTRIES_FILE, 'utf-8');
    return JSON.parse(data);
  }

  saveEntries(entries) {
    fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2));
  }

  addEntry(entry) {
    const entries = this.getEntries();
    const newEntry = {
      id: this.generateId(),
      content: entry.content,
      tags: entry.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    entries.push(newEntry);
    this.saveEntries(entries);
    return newEntry;
  }

  updateEntry(id, updates) {
    const entries = this.getEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error(`Entry with id ${id} not found`);
    }
    entries[index] = {
      ...entries[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveEntries(entries);
    return entries[index];
  }

  deleteEntry(id) {
    const entries = this.getEntries();
    const filtered = entries.filter(e => e.id !== id);
    if (filtered.length === entries.length) {
      throw new Error(`Entry with id ${id} not found`);
    }
    this.saveEntries(filtered);
  }

  searchEntries(query) {
    const entries = this.getEntries();
    const lowerQuery = query.toLowerCase();
    return entries.filter(entry => {
      return entry.content.toLowerCase().includes(lowerQuery) ||
             entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
    });
  }

  getEntriesByTag(tag) {
    const entries = this.getEntries();
    return entries.filter(entry => entry.tags.includes(tag));
  }

  // Tags
  getTags() {
    const data = fs.readFileSync(TAGS_FILE, 'utf-8');
    return JSON.parse(data);
  }

  saveTags(tags) {
    fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2));
  }

  addTag(tagName) {
    const tags = this.getTags();
    if (!tags.find(t => t.name === tagName)) {
      tags.push({
        name: tagName,
        count: 0,
        createdAt: new Date().toISOString()
      });
      this.saveTags(tags);
    }
  }

  incrementTagCount(tagName) {
    const tags = this.getTags();
    const tag = tags.find(t => t.name === tagName);
    if (tag) {
      tag.count++;
    } else {
      tags.push({
        name: tagName,
        count: 1,
        createdAt: new Date().toISOString()
      });
    }
    this.saveTags(tags);
  }

  // Config
  getConfig() {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  }

  saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  setApiKey(apiKey) {
    const config = this.getConfig();
    config.anthropicApiKey = apiKey;
    this.saveConfig(config);
  }

  getApiKey() {
    const config = this.getConfig();
    return config.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  }

  // Utilities
  generateId() {
    return `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats() {
    const entries = this.getEntries();
    const tags = this.getTags();
    return {
      totalEntries: entries.length,
      totalTags: tags.length,
      dataDir: KB_DIR
    };
  }
}

export default new Store();
