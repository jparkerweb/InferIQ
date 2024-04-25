// ==========================================================================
// ==  Description: This file is used to judge the anwers in the database. ==
// ==  It reads the messages, questions, and questions from the database.  ==
// ==  Calls are make to the fetchChatCompletion function to get the       ==
// ==  evaluation of the answers from the LLM, and updates rating for each ==
// ==  in the database.                                                    ==
// ==========================================================================

import {
    getDatasetToJudge, updateJudgedDataset,
    getDatasetToCalculateBERTScore, updateOnnxBERTScoreDataset,
    getDatasetToCalculateBERTScoreGroundedTruth, updateOnnxBERTScoreGroundedTruthDataset
} from './db.js';
import { fetchChatCompletion } from './llm-api.js';
import { computeBERTScore } from './bert.js';
import { roundToNearestTenth } from './utils.js';
import {
    PROMPT_JUDGE_PREFIX,
    PROMT_JUDGE_SUFFIX
} from '../_vars.js';


// --------------------------------------------------
// -- loop through each dataset to judge           --
// -- call LLM and update the db with the response --
// --------------------------------------------------
export async function judgeGeneratedDataset(sendEvent, context) {
    // ---------------------------------
    // -- evaluate judgeModel dataset --
    // ---------------------------------
    let dataset = await getDatasetToJudge();

    // calculate total number of iterations
    let total = dataset.length;
    let count = 0;
    
    // loop through each dataset and judge it
    for (let i = 0; i < dataset.length; i++) {
        if (!context.shouldContinue) { break; }

        const thisDataset = dataset[i];
        const id = thisDataset.id;
        const url = thisDataset.url;
        const apiKey = thisDataset.apiKey;
        const apiName = thisDataset.apiName;
        const judgeModel = thisDataset.jModel;
        const judgeModelStopTokens = thisDataset.jModelStopTokens;

        count++;
        const progress = Math.round((count / total) * 100);
        sendEvent({
            progress: progress,
            message: `Judging ${count} of ${total} question/answers...`,
            currentMessageCount: thisDataset.messageId,
            model: thisDataset.chatModel,
            judgeModel: `${apiName} > ${judgeModel}`,
            questionLabel: thisDataset.questionLabel
        });

        // create the judge prompt
        let judgePrompt = [];
        judgePrompt.push({ role: 'system', content: `${PROMPT_JUDGE_PREFIX}` });
        judgePrompt.push({ role: 'user', content: `user_question:::\nanswer the following question using this context:\n${thisDataset.message}\n\nQuestion:\n${thisDataset.question}`});
        judgePrompt.push({ role: 'assistant', content: `system_answer:::\nAnswer:\n${thisDataset.answer}` });
        judgePrompt.push({ role: 'system', content: `${PROMT_JUDGE_SUFFIX}` });

        // call LLM and wait for answer
        const judgeFullResponse = await fetchChatCompletion(
            url,
            apiKey,
            judgeModel,
            judgeModelStopTokens,
            judgePrompt
        )

        // Use regular expressions to parse the input string
        const ratingRegex = /Total rating:\s(\d+)/;
        const reasonRegex = /^(?:Feedback:::\n)?(?:\w+:\s)?([\s\S]+?)\n[\n\s\S]*/gm;

        // Extract the rating
        const ratingMatch = judgeFullResponse.llmResponseText.match(ratingRegex);
        const judgeRating = ratingMatch ? parseInt(ratingMatch[1], 10) : -1;

        // Extract the reason
        const judgeReasoning = judgeFullResponse.llmResponseText.replace(reasonRegex, `$1`)

        // update the database with the judged answer
        console.log(judgeFullResponse.llmResponseText);
        await updateJudgedDataset(id, judgeModel, judgeRating, judgeReasoning, judgeFullResponse.llmResponseText);
    }
    console.log('judgeModel dataset complete')

    // puase for 500ms
    await new Promise(resolve => setTimeout(resolve, 1000));

    // ------------------------------------
    // -- evaluate onnxBERTModel dataset --
    // ------------------------------------
    dataset = await getDatasetToCalculateBERTScore();

    // calculate total number of iterations
    total = dataset.length;
    count = 0;

    // loop through each dataset and create a onnxBERTScore
    for (let i = 0; i < dataset.length; i++) {
        if (!context.shouldContinue) { break; }

        const thisDataset = dataset[i];
        const id = thisDataset.id;
        const message = thisDataset.message;
        const answer = thisDataset.answer;
        const onnxBERTModel = thisDataset.LookupOnnxBERTModel;
        const onnxBERTModelQuantized = thisDataset.LookupOnnxBERTModelQuantized;

        // call LLM and wait for answer
        let onnxBERTScore = await computeBERTScore(
            message,
            answer,
            {
                model: onnxBERTModel,
                quantized: onnxBERTModelQuantized
            }
        )

        // round the onnxBERTScore to the nearest tenth
        onnxBERTScore = await roundToNearestTenth(onnxBERTScore);

        // update the database with the onnxBERTScore
        console.log(onnxBERTScore);
        await updateOnnxBERTScoreDataset(id, onnxBERTModel, onnxBERTScore);

        count++;
        const progress = Math.round((count / total) * 100);
        sendEvent({
            progress: progress,
            message: `Judging ${count} of ${total} summaries...`,
            currentMessageCount: thisDataset.messageId,
            model: thisDataset.chatModel,
            judgeModel: onnxBERTModel,
            questionLabel: thisDataset.questionLabel
        });
    }
    console.log('onnxBERTModel dataset complete')


    // ----------------------------------------------------------
    // -- evaluate onnxBERTModel dataset using Grounded Truths --
    // ----------------------------------------------------------
    dataset = await getDatasetToCalculateBERTScoreGroundedTruth();

    // calculate total number of iterations
    total = dataset.length;
    count = 0;

    // loop through each dataset and create a onnxBERTScore
    for (let i = 0; i < dataset.length; i++) {
        if (!context.shouldContinue) { break; }

        const thisDataset = dataset[i];
        const id = thisDataset.id;
        const groundedTruthSummary = thisDataset.groundedTruthSummary;
        const answer = thisDataset.answer;
        const onnxBERTModel = thisDataset.LookupOnnxBERTModel;
        const onnxBERTModelQuantized = thisDataset.LookupOnnxBERTModelQuantized;

        // call LLM and wait for answer
        let onnxBERTGroundedTruthScore = await computeBERTScore(
            groundedTruthSummary,
            answer,
            {
                model: onnxBERTModel,
                quantized: onnxBERTModelQuantized
            }
        )

        // round the onnxBERTGroundedTruthScore to the nearest tenth
        onnxBERTGroundedTruthScore = await roundToNearestTenth(onnxBERTGroundedTruthScore);

        // update the database with the onnxBERTScore
        console.log(onnxBERTGroundedTruthScore);
        await updateOnnxBERTScoreGroundedTruthDataset(id, onnxBERTModel, onnxBERTGroundedTruthScore);

        count++;
        const progress = Math.round((count / total) * 100);
        sendEvent({
            progress: progress,
            message: `Judging ${count} of ${total} summaries with grounded truth...`,
            currentMessageCount: thisDataset.messageId,
            model: thisDataset.chatModel,
            judgeModel: onnxBERTModel,
            questionLabel: thisDataset.questionLabel
        });
    }
    console.log('onnxBERTModel with grounded truth dataset complete')

    sendEvent({ message: 'Judging complete' }); // do not change this message as it is used to stop the judging in public/judge-dataset-answers.js
}
