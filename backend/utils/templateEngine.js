const fs = require('fs').promises;
const path = require('path');

/**
 * Simple template engine for email templates
 * Supports basic variable substitution and conditional blocks
 */
class TemplateEngine {
  constructor(templateDir = null) {
    this.templateDir = templateDir || path.join(__dirname, '../templates/email');
  }

  /**
   * Load and render a template with provided data
   * @param {string} templateName - Name of the template file (without .html extension)
   * @param {object} data - Data to substitute in the template
   * @param {string} baseTemplate - Base template to use (defaults to 'base')
   * @returns {Promise<string>} Rendered HTML content
   */
  async render(templateName, data = {}, baseTemplate = 'base') {
    try {
      // Load the content template
      const contentTemplate = await this.loadTemplate(`${templateName}.html`);
      
      // Render the content with data
      const renderedContent = this.substitute(contentTemplate, data);
      
      // If no base template requested, return content directly
      if (!baseTemplate) {
        return renderedContent;
      }
      
      // Load the base template
      const baseTemplateContent = await this.loadTemplate(`${baseTemplate}.html`);
      
      // Prepare base template data
      const baseData = {
        ...data,
        content: renderedContent,
        actionButton: data.actionButton || ''
      };
      
      // Render the complete email
      return this.substitute(baseTemplateContent, baseData);
      
    } catch (error) {
      console.error(`[TEMPLATE ERROR] Failed to render template ${templateName}:`, error.message);
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  /**
   * Load a template file from the template directory
   * @param {string} filename - Template filename
   * @returns {Promise<string>} Template content
   */
  async loadTemplate(filename) {
    const templatePath = path.join(this.templateDir, filename);
    
    try {
      const content = await fs.readFile(templatePath, 'utf8');
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Template file not found: ${filename}`);
      }
      throw error;
    }
  }

  /**
   * Substitute variables in template content
   * Supports:
   * - {{variable}} - Simple variable substitution
   * - {{#if condition}}...{{/if}} - Conditional blocks
   * @param {string} template - Template content
   * @param {object} data - Data for substitution
   * @returns {string} Processed template
   */
  substitute(template, data) {
    let result = template;

    // Handle conditional blocks first
    result = this.processConditionals(result, data);

    // Handle simple variable substitution
    result = result.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      const value = data[variable];
      if (value === undefined || value === null) {
        console.warn(`[TEMPLATE WARNING] Variable ${variable} is undefined`);
        return '';
      }
      return String(value);
    });

    return result;
  }

  /**
   * Process conditional blocks in templates
   * Supports: {{#if variable}}content{{/if}}
   * @param {string} template - Template content
   * @param {object} data - Data for condition evaluation
   * @returns {string} Processed template
   */
  processConditionals(template, data) {
    return template.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      const value = data[condition];
      
      // Consider truthy values, non-empty strings, and non-zero numbers as true
      const isTrue = value && (
        (typeof value === 'boolean' && value) ||
        (typeof value === 'string' && value.trim() !== '') ||
        (typeof value === 'number' && value !== 0) ||
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === 'object' && Object.keys(value).length > 0)
      );
      
      return isTrue ? content : '';
    });
  }

  /**
   * Generate action button HTML
   * @param {string} url - Button URL
   * @param {string} text - Button text
   * @param {string} className - CSS class (defaults to 'button')
   * @returns {string} Button HTML
   */
  generateActionButton(url, text, className = 'button') {
    if (!url || !text) {
      return '';
    }
    
    return `<a href="${url}" class="${className}">${text}</a>`;
  }

  /**
   * Escape HTML in user data to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (typeof text !== 'string') {
      return text;
    }
    
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    
    return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
  }

  /**
   * Sanitize user data before template rendering
   * @param {object} data - Raw data object
   * @returns {object} Sanitized data object
   */
  sanitizeData(data) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Escape HTML but preserve basic formatting
        sanitized[key] = this.escapeHtml(value);
      } else if (value !== null && value !== undefined) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '';
      }
    }
    
    return sanitized;
  }

  /**
   * Get list of available templates
   * @returns {Promise<string[]>} Array of template names (without .html extension)
   */
  async getAvailableTemplates() {
    try {
      const files = await fs.readdir(this.templateDir);
      return files
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
    } catch (error) {
      console.error('[TEMPLATE ERROR] Failed to list templates:', error.message);
      return [];
    }
  }

  /**
   * Validate template exists
   * @param {string} templateName - Template name to check
   * @returns {Promise<boolean>} True if template exists
   */
  async templateExists(templateName) {
    try {
      await this.loadTemplate(`${templateName}.html`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = TemplateEngine;
