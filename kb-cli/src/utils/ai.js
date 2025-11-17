import Anthropic from '@anthropic-ai/sdk';
import store from '../storage/store.js';

class AIAnalyzer {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      const apiKey = store.getApiKey();
      if (!apiKey) {
        throw new Error(
          'Anthropic API key not found. Set it using:\n' +
          '  kb config --api-key YOUR_KEY\n' +
          '  or set ANTHROPIC_API_KEY environment variable'
        );
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  async analyzeContentAndSuggestTags(content, existingTags = []) {
    const client = this.getClient();

    const prompt = this.buildPrompt(content, existingTags);

    try {
      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].text;
      return this.parseTagSuggestions(response);
    } catch (error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  buildPrompt(content, existingTags) {
    let prompt = `Analyze the following content and suggest relevant tags for a knowledge base system.

Content to analyze:
"""
${content}
"""

Instructions:
1. Extract key concepts, topics, and themes from the content
2. Suggest 3-7 concise, descriptive tags (single words or short phrases)
3. Tags should be lowercase and use hyphens for multi-word tags (e.g., "python", "machine-learning", "web-development")
4. Consider both broad categories and specific topics`;

    if (existingTags.length > 0) {
      prompt += `\n5. Here are existing tags in the knowledge base - prefer reusing these if they match:\n   ${existingTags.map(t => t.name).join(', ')}`;
    }

    prompt += `

Respond with a JSON object in this exact format:
{
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "reasoning": "Brief explanation of why these tags were chosen"
}`;

    return prompt;
  }

  parseTagSuggestions(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suggestedTags: parsed.suggested_tags || [],
          reasoning: parsed.reasoning || ''
        };
      }

      // Fallback: try to parse the entire response
      const parsed = JSON.parse(response);
      return {
        suggestedTags: parsed.suggested_tags || [],
        reasoning: parsed.reasoning || ''
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}\nResponse: ${response}`);
    }
  }

  async extractKeywords(content) {
    const client = this.getClient();

    const prompt = `Extract the 5-10 most important keywords or key phrases from this content. Return only a comma-separated list.

Content:
"""
${content}
"""`;

    try {
      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].text;
      return response.split(',').map(k => k.trim().toLowerCase());
    } catch (error) {
      throw new Error(`Keyword extraction failed: ${error.message}`);
    }
  }
}

export default new AIAnalyzer();
