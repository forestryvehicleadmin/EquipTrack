'use server';

import { suggestItemCategory } from '@/ai/flows/suggest-item-category';

type SuggestionResult = {
  category?: string;
  error?: string;
};

export async function suggestCategoryAction(
  name: string,
  description: string
): Promise<SuggestionResult> {
  if (!name || !description) {
    return { error: 'Name and description are required for a suggestion.' };
  }

  try {
    const result = await suggestItemCategory({ name, description });
    return { category: result.category };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to get suggestion from AI.' };
  }
}
