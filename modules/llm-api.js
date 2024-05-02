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
    const rateLimit = openaiAPISettings[0].rateLimit;
    const maxResponseTokens = openaiAPISettings[0].maxResponseTokens;
    const temperature = openaiAPISettings[0].temperature;

    // wait for the rate limit delay before making the request
    await new Promise(resolve => setTimeout(resolve, rateLimit));

    if (typeof prompt === 'string') {
        prompt = JSON.parse(prompt);
    }
    if (typeof stopTokens === 'string') {
        stopTokens = JSON.parse(stopTokens);
    }

    let llmResponseText = "";
    const startTime = performance.now();
    let endTime;

    const openai = new OpenAI({
        baseURL: url,
        apiKey: apiKey,
    });
    const chatCompletion = await openai.chat.completions.create({
        messages: prompt,
        model: model,
        max_tokens: maxResponseTokens,
        stop: stopTokens,
        temperature: temperature,
        top_p: 0.7,
        stream: true,
    })
    for await (const chunk of chatCompletion) {
        if (!endTime) { endTime = performance.now(); }
        llmResponseText += chunk.choices[0]?.delta?.content || "";
        console.log(chunk.choices[0]?.delta?.content)
        const finished = chunk.choices[0]?.finish_reason === "stop";
        if (finished) {
            console.log("Finished");
        }
    }

    let inferenceTimeToFirstTokenSeconds = (endTime - startTime) / 1000;
    inferenceTimeToFirstTokenSeconds =  parseFloat(inferenceTimeToFirstTokenSeconds.toFixed(2));
    
    const llmResponse = {
        llmResponseText: llmResponseText,
        inferenceTimeToFirstTokenSeconds: inferenceTimeToFirstTokenSeconds,
    }

    return llmResponse;
}
