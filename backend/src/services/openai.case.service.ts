import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { StructuredOutputParser } from "langchain/output_parsers";

@Injectable()
export class OpenAICaseService {
  private openai: OpenAI;
  private caseParser: StructuredOutputParser<any>;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.openai = new OpenAI({ apiKey });

    // Define the schema for case output
    const caseSchema = z.object({
      case_info: z.object({
        court: z.string(),
        decision_date: z.string(), // Will be converted to Date later
        citation: z.string(),
        holding_summary: z.string(),
        tags: z.array(z.string())
      })
    });

    this.caseParser = StructuredOutputParser.fromZodSchema(caseSchema);
  }
  async analyzeCaseDocument(documentText: string) {
    console.log('Starting case document analysis...');
    const formatInstructions = this.caseParser.getFormatInstructions();
    console.log('Format instructions prepared');

    // Truncate document if it's too long
    const maxLength = 14000; // GPT-4 has a context limit
    const truncatedText = documentText.length > maxLength 
      ? documentText.substring(0, maxLength) + "..."
      : documentText;

    const prompt = `
    You are a legal expert. Analyze this legal case document and extract the required information in JSON format.
    Focus on identifying these key elements:
    1. The court name
    2. The decision date (in YYYY-MM-DD format)
    3. The case citation
    4. A concise summary of the court's holding/decision
    5. Relevant legal topics and keywords as tags

    ${formatInstructions}

    Required format example:
    {
      "case_info": {
        "court": "Supreme Court of Example State",
        "decision_date": "2024-01-15",
        "citation": "123 F.3d 456 (2024)",
        "holding_summary": "The court held that...",
        "tags": ["constitutional law", "due process", "criminal procedure"]
      }
    }

    Document text:
    ${truncatedText}`;

    try {
      console.log('Sending request to OpenAI...');
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ 
          role: "system", 
          content: "You are a legal expert assistant that analyzes legal cases and extracts structured information."
        },
        { 
          role: "user", 
          content: prompt 
        }],
        temperature: 0.3, // Lower temperature for more focused outputs
        max_tokens: 1000
      });

      console.log('Received response from OpenAI');
      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new Error('No response content from OpenAI');
      }
      console.log('OpenAI response:', text);

      // Parse the response using the structured parser
      const parsedOutput = await this.caseParser.parse(text);
      const caseInfo = (parsedOutput as any).case_info;      // Ensure we have all required fields
      if (!caseInfo.court || !caseInfo.decision_date || !caseInfo.citation || !caseInfo.holding_summary) {
        throw new Error('Missing required case information in OpenAI response');
      }

      // Validate the date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(caseInfo.decision_date)) {
        throw new Error('Invalid date format in OpenAI response. Expected YYYY-MM-DD');
      }

      return {
        case_info: {
          court: caseInfo.court,
          decision_date: caseInfo.decision_date,
          citation: caseInfo.citation,
          holding_summary: caseInfo.holding_summary,
          tags: Array.isArray(caseInfo.tags) ? caseInfo.tags : []
        }
      };

    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`Failed to analyze case document: ${error.message}`);
    }
  }
}
