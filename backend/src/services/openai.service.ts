import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { StructuredOutputParser } from "langchain/output_parsers";

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private parser: StructuredOutputParser<any>;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.openai = new OpenAI({ apiKey });

    // Define the schema for structured output
    const schema = z.object({
      jurisdiction: z.string().min(1),
      clauses: z.array(z.object({
        clause_type: z.string(),
        risk_level: z.string(),
        clause_text: z.string(),
        language_variant: z.string().nullable()
      }))
    });

    this.parser = StructuredOutputParser.fromZodSchema(schema);
  }

  async analyzeDocumentClauses(documentText: string, contractId: number) {
    const formatInstructions = this.parser.getFormatInstructions();

    const prompt = `
    Analyze the following document and extract structured information.
    
    ${formatInstructions}

    Additional requirements:
    - Clauses are the points and lists mentioned in the document
    - jurisdiction: Must identify the governing law
    - clause_type: The exact type/category from the document
    - risk_level: Must be one of: ["Low", "Medium", "High"]
    - clause_text: The complete verbatim text of the clause
    - language_variant: Specify language variant or null if standard

    Document text:
    ${documentText}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 4000,
      });

      const text = completion.choices[0].message.content;
      if (!text) {
        throw new Error('No response from OpenAI');
      }

      // Parse the response using the structured parser
      const parsedOutput = await this.parser.parse(text);

      // Transform to match your existing return format
      return parsedOutput.clauses.map(clause => ({
        contract_id: contractId,
        clause_type: clause.clause_type,
        clause_text: clause.clause_text,
        risk_level: clause.risk_level,
        jurisdiction: parsedOutput.jurisdiction,
        language_variant: clause.language_variant || '',
        notes: ''
      }));

    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  }
}