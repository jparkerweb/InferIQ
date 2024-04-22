import { fetchChatCompletion } from './llm-api.js';

export async function adHocInference(url, apiKey, model, stopTokens, prompt) {
 
    // create the prompt
    let llmPrompt = [];
    llmPrompt.push({ role: 'user', content: `${prompt}`});

    // call LLM and wait for answer
    const adHocResponse = await fetchChatCompletion(
        url,
        apiKey,
        model,
        stopTokens,
        llmPrompt
    )

    return adHocResponse;
}