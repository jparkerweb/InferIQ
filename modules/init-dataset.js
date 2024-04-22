// ==================================================================================
// ==  Description: This file is used to initialize the dataset in the database.   ==
// ==  It reads the messages and questions from JSON files, loops through each     ==
// ==  message and question, calls the fetchChatCompletion function to get the     ==
// ==  answer from the LLM, and inserts the result into the database.              ==
// ==================================================================================

import { fetchChatCompletion } from './llm-api.js';
import { QUESTION_INSTRUCTIONS } from '../_vars.js';
import {
    getDatasetToAnswer,
    getAllMessages, listQuestionsOfType,
    updateAllDatasetAnswersById,
    createDatasetWithJudgeModel, createDatasetWithOnnxBERTModel,
    listChatModels, listJudgeModels, listOnnxBERTModels
} from './db.js';


// --------------------------------------------
// -- Initialize the dataset in the database --
// --------------------------------------------
export async function initializeDataset(sendEvent, context) {
    // load chat models from database
    const chatModels = await listChatModels();

    // load judge models from database
    const judgeModels = await listJudgeModels();

    // load sample messages from the database
    const messages = await getAllMessages();

    // load questions from the database
    const questionsQA = await listQuestionsOfType("qa");

    // ------------------
    // -- QA questions --
    // ------------------
    // calculate total number of iterations
    let total = chatModels.length * messages.length * questionsQA.length * judgeModels.length;
    let count = 0;

    // loop through each chat model, message, question, and judge model
    
    // ⇢ modesl
    for (let m = 0; m < chatModels.length; m++) {
        if (!context.shouldContinue) { break; }

        const modelId = chatModels[m].id;
        const model = chatModels[m].chatModel;
        const stopTokens = chatModels[m].stopTokens;
        
        // ⇢ messages
        for (let i = 0; i < messages.length; i++) {
            if (!context.shouldContinue) { break; }

            const message = messages[i];
            const messageBody = message.message;
            const messageId = message.id;
            
            // ⇢ questionsQA
            for (let j = 0; j < questionsQA.length; j++) {
                if (!context.shouldContinue) { break; }

                const questionType = questionsQA[j].questionType;
                const questionLabel = questionsQA[j].questionLabel;
                const question = questionsQA[j].question;
                const promptMessages = [
                    { role: 'system', content: `${QUESTION_INSTRUCTIONS} ${messageBody}`},
                    { role: 'user', content: `${question}` }
                ]
                const fullPrompt = JSON.stringify(promptMessages);

                // ⇢ judge models
                for (let z = 0; z < judgeModels.length; z++) {
                    if (!context.shouldContinue) { break; }

                    const judgeModelId = judgeModels[z].id;
                    createDatasetWithJudgeModel(
                        modelId,
                        messageId,
                        messageBody,
                        questionType,
                        questionLabel,
                        question,
                        fullPrompt,
                        judgeModelId
                    );

                    count++;
                    const progress = Math.round((count / total) * 100);
                    sendEvent({
                        progress: progress,
                        feedback: `Creating ${count} of ${total} questions...`,
                        messageId: messageId,
                        model: model,
                        questionLabel: questionLabel
                    });
                }
            }
        }
    }
    console.log("QA Done")

    // load onnxBERT models from database
    const onnxBERTModels = await listOnnxBERTModels();

    // load questions from the database
    const questionsSummary = await listQuestionsOfType("summary");
    
    // -----------------------
    // -- Summary questions --
    // ------------------------
    // calculate total number of iterations
    total = chatModels.length * messages.length * questionsSummary.length * onnxBERTModels.length;
    count = 0;

    // loop through each chat model, message, question, and judge model
    
    // ⇢ modesl
    for (let m = 0; m < chatModels.length; m++) {
        if (!context.shouldContinue) { break; }

        const modelId = chatModels[m].id;
        const model = chatModels[m].chatModel;
        const stopTokens = chatModels[m].stopTokens;
        
        // ⇢ messages
        for (let i = 0; i < messages.length; i++) {
            if (!context.shouldContinue) { break; }

            const message = messages[i];
            const messageBody = message.message;
            const groundedTruthSummary = message.groundedTruthSummary === '' ? null : message.groundedTruthSummary;
            const messageId = message.id;
            
            // ⇢ questionsSummary
            for (let j = 0; j < questionsSummary.length; j++) {
                if (!context.shouldContinue) { break; }

                const questionType = questionsSummary[j].questionType;
                const questionLabel = questionsSummary[j].questionLabel;
                const question = questionsSummary[j].question;
                const promptMessages = [
                    { role: 'system', content: `${QUESTION_INSTRUCTIONS} ${messageBody}`},
                    { role: 'user', content: `${question}` }
                ]
                const fullPrompt = JSON.stringify(promptMessages);

                // ⇢ onnxBERT models
                for (let z = 0; z < onnxBERTModels.length; z++) {
                    if (!context.shouldContinue) { break; }

                    const onnxBERTModelId = onnxBERTModels[z].id;
                    createDatasetWithOnnxBERTModel(
                        modelId,
                        messageId,
                        messageBody,
                        groundedTruthSummary,
                        questionType,
                        questionLabel,
                        question,
                        fullPrompt,
                        onnxBERTModelId
                    );

                    count++;
                    const progress = Math.round((count / total) * 100);
                    sendEvent({
                        progress: progress,
                        feedback: `Creating ${count} of ${total} questions...`,
                        messageId: messageId,
                        model: model,
                        questionLabel: questionLabel
                    });
                }
            }
        }
    }
    console.log("Summary Done")

    // pause for a moment before answering questions
    await new Promise(resolve => setTimeout(resolve, 1000));

    // select and loop through each question and get target LLM answers
    const dataset = await getDatasetToAnswer();
    count = 0;
    total = dataset.length;
    for (let x = 0; x < dataset.length; x++) {
        if (!context.shouldContinue) { break; }

        const thisDataset = dataset[x];
        const id = thisDataset.id;
        const model = thisDataset.cModel;
        const stopTokens = thisDataset.cModelStopTokens;
        const url = thisDataset.url;
        const apiKey = thisDataset.apiKey;
        const apiName = thisDataset.apiName;
        const inferenceTimeAPIName = apiName;
        const messageId = thisDataset.messageId;
        const questionLabel = thisDataset.questionLabel;
        const fullPrompt = thisDataset.fullPrompt;

        count++;
        const progress = Math.round((count / total) * 100);
        sendEvent({
            progress: progress,
            feedback: `Answering ${count} of ${total} questions...`,
            messageId: messageId,
            model: `${inferenceTimeAPIName} > ${model}`,
            questionLabel: questionLabel
        });

        const startTime = performance.now(); 
        const answer = await fetchChatCompletion(
            url,
            apiKey,
            model,
            stopTokens,
            fullPrompt,
        );
        const endTime = performance.now();
        let inferenceTimeSeconds = (endTime - startTime) / 1000;
        inferenceTimeSeconds =  parseFloat(inferenceTimeSeconds.toFixed(2));

        console.log(answer);
        updateAllDatasetAnswersById(
            id,
            model,
            answer.llmResponseText,
            inferenceTimeSeconds,
            answer.inferenceTimeToFirstTokenSeconds,
            inferenceTimeAPIName,
        );
    }
    console.log("Answered Done")

    sendEvent({ message: 'Datase Initialization complete' }); // do not change this message as it is used in the public/init-dataset.js file
}
