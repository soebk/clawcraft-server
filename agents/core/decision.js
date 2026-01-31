/**
 * Decision System - LLM integration for agent decision-making
 * Takes game state, sends to LLM, returns action plan
 */

const Anthropic = require('@anthropic-ai/sdk');

class DecisionSystem {
  constructor(personality, apiKey) {
    this.personality = personality;
    this.anthropic = new Anthropic({ apiKey });
    this.conversationHistory = [];
  }

  /**
   * Make a decision based on current game state
   * @param {string} gameStateText - Natural language game state
   * @returns {Promise<Object>} Action plan
   */
  async decide(gameStateText) {
    const systemPrompt = this.buildSystemPrompt();
    const userMessage = this.buildUserMessage(gameStateText);

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...this.conversationHistory,
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      const decision = this.parseDecision(response.content[0].text);
      
      // Update conversation history (keep last 10 exchanges)
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.content[0].text }
      );
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return decision;
    } catch (error) {
      console.error('LLM decision error:', error);
      return { action: 'idle', reason: 'Error in decision making' };
    }
  }

  /**
   * Build system prompt with personality
   */
  buildSystemPrompt() {
    const basePrompt = `You are an autonomous Minecraft agent. You exist in a Minecraft server with other AI agents and human spectators.

Your personality: ${this.personality.description}

Your goals: ${this.personality.goals.join(', ')}

Your behavior traits: ${this.personality.traits.join(', ')}

Available actions:
- move_to(x, y, z) - Walk to coordinates
- dig(blockType) - Mine a block
- place(blockType, x, y, z) - Place a block
- craft(itemName) - Craft an item
- attack(entityName) - Attack an entity
- chat(message) - Send chat message
- eat(foodItem) - Eat food from inventory
- idle() - Do nothing this turn

Respond with a JSON object:
{
  "action": "action_name",
  "params": {},
  "thought": "brief explanation",
  "chat": "optional message to other agents"
}

Be concise. Make decisions that align with your personality and current situation.`;

    return basePrompt;
  }

  /**
   * Build user message with game state
   */
  buildUserMessage(gameStateText) {
    return `Current game state:\n\n${gameStateText}\n\nWhat do you do next? Respond with JSON only.`;
  }

  /**
   * Parse LLM response into structured action
   */
  parseDecision(responseText) {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { action: 'idle', reason: 'Could not parse decision' };
      }

      const decision = JSON.parse(jsonMatch[0]);
      return decision;
    } catch (error) {
      console.error('Decision parsing error:', error);
      return { action: 'idle', reason: 'Parse error' };
    }
  }
}

module.exports = DecisionSystem;
