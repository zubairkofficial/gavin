import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { StructuredOutputParser } from "langchain/output_parsers";
import { ConfigService } from '@nestjs/config';
import { config } from 'process';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private parser: StructuredOutputParser<any>;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      });

      const response = await result.response;
      const text = response.text();

      // Parse the response using the structured parser
      const parsedOutput = await this.parser.parse(text);

      // Transform to match your existing return format
      return (parsedOutput as any).clauses.map((clause: any) => ({
        contract_id: contractId,
        clause_type: clause.clause_type,
        clause_text: clause.clause_text,
        risk_level: clause.risk_level,
        jurisdiction: (parsedOutput as any).jurisdiction,
        language_variant: clause.language_variant || '',
        notes: ''
      }));

    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  }
}