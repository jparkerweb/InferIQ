// -----------------------------------------
// -- Import the OpenAI API  and Settings --
// -----------------------------------------
import { getOpenaiAPISettings } from './db.js';
import OpenAI from 'openai';


// ---------------------------------------------------
// -- Function to fetch the completion from the LLM --
// ---------------------------------------------------
export async function fetchChatCompletion(url, apiKey, model, stopTokens, prompt) {
    const openaiAPISettings = await getOpenaiAPISettings();
    const openai = new OpenAI({
        baseURL: url,
        apiKey: apiKey,
    });

    // wait for the rate limit delay before making the request
    await new Promise(resolve => setTimeout(resolve, openaiAPISettings[0].rateLimit));

    if (typeof prompt === 'string') {
        prompt = JSON.parse(prompt);
    }
    if (typeof stopTokens === 'string') {
        stopTokens = JSON.parse(stopTokens);
    }

    let llmResponseText = "";
    const startTime = performance.now();
    let endTime;

    const chatCompletion = await openai.chat.completions.create({
        messages: prompt,
        model: model,
        max_tokens: openaiAPISettings[0].maxResponseTokens,
        stop: stopTokens,
        temperature: openaiAPISettings[0].temperature,
        top_p: 0.7,
        stream: true,
    })
    for await (const chunk of chatCompletion) {
        if (!endTime) { endTime = performance.now(); }
        llmResponseText += chunk.choices[0]?.delta?.content || "";
    }

    let inferenceTimeToFirstTokenSeconds = (endTime - startTime) / 1000;
    inferenceTimeToFirstTokenSeconds =  parseFloat(inferenceTimeToFirstTokenSeconds.toFixed(2));
    
    const llmResponse = {
        llmResponseText: llmResponseText,
        inferenceTimeToFirstTokenSeconds: inferenceTimeToFirstTokenSeconds,
    }

    return llmResponse;
}
