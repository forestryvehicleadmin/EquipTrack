'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting the most appropriate category for an inventory item.
 *
 * The flow takes an item name and description as input and returns a category suggestion.
 *
 * @interface SuggestItemCategoryInput - The input type for the suggestItemCategory function.
 * @interface SuggestItemCategoryOutput - The output type for the suggestItemCategory function.
 * @function suggestItemCategory - A function that suggests the most appropriate category for an item.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestItemCategoryInputSchema = z.object({
  name: z.string().describe('The name of the inventory item.'),
  description: z.string().describe('The description of the inventory item.'),
});
export type SuggestItemCategoryInput = z.infer<typeof SuggestItemCategoryInputSchema>;

const SuggestItemCategoryOutputSchema = z.object({
  category: z.string().describe('The suggested category for the inventory item.'),
});
export type SuggestItemCategoryOutput = z.infer<typeof SuggestItemCategoryOutputSchema>;

export async function suggestItemCategory(input: SuggestItemCategoryInput): Promise<SuggestItemCategoryOutput> {
  return suggestItemCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestItemCategoryPrompt',
  input: {schema: SuggestItemCategoryInputSchema},
  output: {schema: SuggestItemCategoryOutputSchema},
  prompt: `Given the name and description of an inventory item, suggest the most appropriate category for it.\n\nName: {{{name}}}\nDescription: {{{description}}}\n\nCategory: `,
});

const suggestItemCategoryFlow = ai.defineFlow(
  {
    name: 'suggestItemCategoryFlow',
    inputSchema: SuggestItemCategoryInputSchema,
    outputSchema: SuggestItemCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
