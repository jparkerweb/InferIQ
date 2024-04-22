import fs from 'fs';
import path from 'path';
import markdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItPrism from 'markdown-it-prism';
import dedent from 'dedent';
import express from 'express';
import { adHocInference } from './modules/ad-hoc-inference.js';
import { initializeDataset } from './modules/init-dataset.js';
import { judgeGeneratedDataset } from './modules/judge-dataset-answers.js';
import { deleteAllDBDatasets } from './modules/delete-dataset.js';
import { fileURLToPath } from 'url';
import {
    listMessages, addMessage, updateMessage, deleteMessage,
    listQuestions, addQuestion, updateQuestion, deleteQuestion,
    getOpenaiAPISettings, updateOpenaiAPISettings,
    listOpenaiAPIs, addOpenaiAPI, updateOpenaiAPI, deleteOpenaiAPI,
    listChatModels, addChatModel, updateChatModel, deleteChatModel,
    listJudgeModels, addJudgeModel, updateJudgeModel, deleteJudgeModel,
    listOnnxBERTModels, addOnnxBERTModel, updateOnnxBERTModel, deleteOnnxBERTModel,
    listAllModelsForAdHocInference,
    ratingByModel, avgRatingByModel,
    avgInferenceTimeSecondsByModel, avgInferenceTimeToFirstTokenSecondsByModel,
    modelGroupingByBERTScore, avgBERTScoreByModel,
    modelGroupingByBERTGroundedTruthScore, avgBERTGroundedTruthScoreByModel,
    listGeneratedDataset, getGeneratedDatasetById,
    dropTables, resetDatabase,
} from './modules/db.js';

const app = express();
const port = 3000;

// Define the directory where the server.js file is located
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware to include the navigation bar in all pages
const navPath = path.join(__dirname, 'public', '/nav.html');
let navContent = fs.readFileSync(navPath, 'utf8');
app.use((req, res, next) => {
    res.locals.nav = navContent;
    next();
});

// Middleware to parse JSON bodies
app.use(express.json()); // This won't break existing functionality

// Serve static files (e.g., HTML, CSS, JS) from a specified directory
app.use(express.static(path.join(__dirname, 'public')));


// -------------------
// -- action routes --
// -------------------

// Context object to hold shared state
const appContext = {
    shouldContinue: true
};

// *********************
// ** Message Dataset **
// *********************
// -- list messages (paged) --
app.get('/admin/messages', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const { messages, total } = await listMessages(page, limit);
        res.send({ messages, total });
    } catch (err) {
        res.status(500).send(err);
    }
});
// -- add message --
app.post('/admin/messages', async (req, res) => {
    const { message, groundedTruthSummary } = req.body;
    try {
        let feedback = await addMessage(message, groundedTruthSummary);
        res.status(200).json({ feedback: feedback });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// -- update message --
app.put('/admin/messages/:id', async (req, res) => {
    const { id } = req.params;
    const { message, groundedTruthSummary } = req.body;
    try {
        const feedback = await updateMessage(id, message, groundedTruthSummary);
        res.status(200).json({ feedback });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -- delete message --
app.delete('/admin/messages/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await deleteMessage(id);
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// *********************


// **********************
// ** Question Dataset **
// **********************
// -- list questions --
app.get('/admin/questions', async (req, res) => {
    try {
        const data = await listQuestions();
        res.send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});
// -- add question --
app.post('/admin/questions', async (req, res) => {
    const {
        questionType,
        questionLabel,
        question
    } = req.body;
    try {
        const feedback = await addQuestion(
            questionType,
            questionLabel,
            question
        );
        res.status(200).json({ feedback: feedback });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// -- update question --
app.put('/admin/questions/:id', async (req, res) => {
    const { id } = req.params;
    const { questionType, questionLabel, question } = req.body;
    try {
        const feedback = await updateQuestion(id, questionType, questionLabel, question);
        res.status(200).json({ feedback });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -- delete question --
app.delete('/admin/questions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await deleteQuestion(id);
        res.status(200).json({ question: 'Question deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// **********************


// ************************
// ** Manage Chat Models **
// ************************
// -- list chatModels --
app.get('/admin/chatModels', async (req, res) => {
    try {
        const data = await listChatModels();
        res.send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});
// -- add chatModel --
app.post('/admin/chatModels', async (req, res) => {
    const { chatModel, stopTokens, openaiAPIId } = req.body;
    try {
        const feedback = await addChatModel(chatModel, stopTokens, openaiAPIId);
        res.status(200).json({ feedback: feedback });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// -- update chatModel --
app.put('/admin/chatModels/:id', async (req, res) => {
    const { id } = req.params;
    const { chatModel, stopTokens, openaiAPIId } = req.body;
    try {
        const feedback = await updateChatModel(id, chatModel, stopTokens, openaiAPIId);
        res.status(200).json({ feedback });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -- delete chatModel --
app.delete('/admin/chatModels/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await deleteChatModel(id);
        res.status(200).json({ chatModel: 'Chat Model deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// ************************


// *************************
// ** Manage Judge Models **
// *************************
// -- list judgeModels --
app.get('/admin/judgeModels', async (req, res) => {
    try {
        const data = await listJudgeModels();
        res.send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});
// -- add judgeModel --
app.post('/admin/judgeModels', async (req, res) => {
    const { judgeModel, stopTokens, openaiAPIId } = req.body;
    try {
        const feedback = await addJudgeModel(judgeModel, stopTokens, openaiAPIId);
        res.status(200).json({ feedback: feedback });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// -- update judgeModel --
app.put('/admin/judgeModels/:id', async (req, res) => {
    const { id } = req.params;
    const { judgeModel, stopTokens, openaiAPIId } = req.body;
    try {
        const feedback = await updateJudgeModel(id, judgeModel, stopTokens, openaiAPIId);
        res.status(200).json({ feedback });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -- delete judgeModel --
app.delete('/admin/judgeModels/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await deleteJudgeModel(id);
        res.status(200).json({ feedback: 'Judge Model deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// *************************


// ************************
// ** Manage BERT Models **
// ************************
// -- list onnxBERTModels --
app.get('/admin/onnxBERTModels', async (req, res) => {
    try {
        const data = await listOnnxBERTModels();
        res.send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});
// -- add onnxBERTModel --
app.post('/admin/onnxBERTModels', async (req, res) => {
    const {
        onnxBERTModel,
        onnxBERTModelQuantized,
    } = req.body;
    try {
        const feedback = await addOnnxBERTModel(
            onnxBERTModel,
            onnxBERTModelQuantized
        );
        res.status(200).json({ feedback: feedback });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// -- update onnxBERTModel --
app.put('/admin/onnxBERTModels/:id', async (req, res) => {
    const { id } = req.params;
    const { onnxBERTModel, onnxBERTModelQuantized } = req.body;
    try {
        const feedback = await updateOnnxBERTModel(id, onnxBERTModel, onnxBERTModelQuantized);
        res.status(200).json({ feedback });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -- delete onnxBERTModel --
app.delete('/admin/onnxBERTModels/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await deleteOnnxBERTModel(id);
        res.status(200).json({ feedback: 'ONNX BERT Model deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// *************************


// ******************************
// ** Manage openaiAPISettings **
// ******************************
// -- get openaiAPISettings --
app.get('/admin/openaiAPISettings', async (req, res) => {
    try {
        const data = await getOpenaiAPISettings();
        res.send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});
// -- update openaiAPISettings --
app.put('/admin/openaiAPISettings', async (req, res) => {
    const { temperature, maxResponseTokens, rateLimit, } = req.body;
    try {
        const feedback = await updateOpenaiAPISettings(temperature, maxResponseTokens, rateLimit);
        res.status(200).json({ feedback });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// *************************


// ***********************
// ** Manage openaiAPIs **
// ***********************
// -- list openaiAPIs --
app.get('/admin/openaiAPIs', async (req, res) => {
    try {
        const data = await listOpenaiAPIs();
        res.send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});
// -- add openaiAPI --
app.post('/admin/openaiAPIs', async (req, res) => {
    const { openaiAPIName, openaiAPIUrl, openaiAPIAPIKey, } = req.body;
    try {
        const feedback = await addOpenaiAPI(openaiAPIName, openaiAPIUrl, openaiAPIAPIKey);
        res.status(200).json({ feedback: feedback });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// -- update openaiAPI --
app.put('/admin/openaiAPIs/:id', async (req, res) => {
    const { id } = req.params;
    const { openaiAPIName, openaiAPIUrl, openaiAPIAPIKey, } = req.body;
    try {
        const feedback = await updateOpenaiAPI(id, openaiAPIName, openaiAPIUrl, openaiAPIAPIKey);
        res.status(200).json({ feedback });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -- delete openaiAPI --
app.delete('/admin/openaiAPIs/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const feedback = await deleteOpenaiAPI(id);
        res.status(200).json({ feedback });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// *************************


// **********************
// ** Ad Hoc Inference **
// **********************
// -- list models for ad-hoc inference --
app.get('/ad-hoc-inference/models', async (req, res) => {
    try {
        const data = await listAllModelsForAdHocInference();
        res.send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});
app.post('/ad-hoc-inference', async (req, res) => {
    const { apiUrl, apiKey, modelName, stopTokens, prompt } = req.body;
    try {
        let feedback = await adHocInference(apiUrl, apiKey, modelName, stopTokens, prompt)
        res.status(200).json({ feedback: feedback });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// **********************


// ************************
// ** Initialize Dataset **
// ************************
// -- initialize dataset --
app.get('/init-dataset', async (req, res) => {
    appContext.shouldContinue = true; // Reset the shared state
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        sendEvent({ message: 'Initialization started...' });
        await initializeDataset(sendEvent, appContext);
    } catch (err) {
        sendEvent({ message: 'Error during initialization', details: err.message });
        console.error(err);
        res.end();
    }
});
// -- stop initialize dataset --
app.post('/stop-init-dataset', (req, res) => {
    appContext.shouldContinue = false;
    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    sendEvent({ message: 'Stopping Initialize Dataset...' });
});
// *************************


// ***************************
// ** JUdge Dataset Answers **
// ***************************
// -- judge questions/answers generated dataset --
app.get('/judge-dataset-answers', async (req, res) => {
    appContext.shouldContinue = true; // Reset the shared state
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        sendEvent({ message: 'Judging started...' });
        await judgeGeneratedDataset(sendEvent, appContext);
    } catch (err) {
        sendEvent({ message: 'Error during judging', details: err.message });
        console.error(err);
    } finally {
        res.end();
    }
});
// -- stop judging questions/answers generated dataset --
app.post('/stop-judging-generated-dataset', (req, res) => {
    appContext.shouldContinue = false;
    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    sendEvent({ message: 'Stopping Judging process...' });
});
// ***************************


// ********************************
// ** Model Grouping by QA Score **
// ********************************
// -- scores/ratings by model --
app.get('/ratings-by-model', async (req, res) => {
    try {
        const data = await ratingByModel();
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// ********************************


// *******************************
// ** Average QA Score by Model **
// *******************************
// -- average score/rating by model --
app.get('/avg-rating-by-model', async (req, res) => {
    try {
        const data = await avgRatingByModel();
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// *******************************


// *************************************
// ** Average Inference Time by Model **
// *************************************
// -- average inference time in seconds by model --
app.get('/avg-inference-time-by-model', async (req, res) => {
    try {
        const data = await avgInferenceTimeSecondsByModel();
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// *******************************


// ****************************************************
// ** Average Inference Time to First Token by Model **
// ****************************************************
// -- average inference time to first token in seconds by model --
app.get('/avg-inference-time-to-first-token-by-model', async (req, res) => {
    try {
        const data = await avgInferenceTimeToFirstTokenSecondsByModel();
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// *******************************


// **********************************
// ** Model Grouping by BERT Score **
// **********************************
app.get('/model-grouping-by-bert-score', async (req, res) => {
    try {
        const data = await modelGroupingByBERTScore();
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// *********************************

// *********************************
// ** Average BERT Score by Model **
// *********************************
// -- average BERT score by model --
app.get('/avg-bert-score-by-model', async (req, res) => {
    try {
        const data = await avgBERTScoreByModel();
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// // *******************************


// *************************************************
// ** Model Grouping by BERT Grounded Truth Score **
// *************************************************
app.get('/model-grouping-by-bert-grounded-truth-score', async (req, res) => {
    try {
        const data = await modelGroupingByBERTGroundedTruthScore();
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// ********************************

// ************************************************
// ** Average BERT Grounded Truth Score by Model **
// ************************************************
app.get('/avg-bert-grounded-truth-score-by-model', async (req, res) => {
    try {
        const data = await avgBERTGroundedTruthScoreByModel();
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// // ****************************


// ***********************
// ** Generated Dataset **
// ***********************
// -- list generated dataset (paged) --
app.get('/admin/generatedDataset', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const { generatedDataset, total } = await listGeneratedDataset(page, limit);
        res.send({ generatedDataset, total });
    } catch (err) {
        res.status(500).send(err);
    }
});
// -- get generated dataset by id --
app.get('/admin/generatedDataset/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const dataset = await getGeneratedDatasetById(id);
        res.json({ dataset });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// ****************************
// ** Reset Existing Dataset **
// ****************************
// -- delete all database datasets --
app.get('/delete-db-dataset', async (req, res) => {
    try {
        const data = await deleteAllDBDatasets();
        res.send(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// -- delete datasets --
app.get('/delete-dataset', async (req, res) => {
    try {
        const data = await deleteAllDatasets();
        res.json(data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// ********************************


// *********************
// ** Delete Database **
// *********************
// -- delete all database records --
app.get('/delete-db', async (req, res) => {
    try {
        await dropTables();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await resetDatabase();
        res.send("Database records deleted successfully.");
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// *********************


// Initialize markdown-it with the markdown-it-attrs plugin
const md = markdownIt({
    html: true,
})
    .use(markdownItAttrs)
    .use(markdownItPrism)

// ------------------------------------
// -- Route to render Markdown files --
// ------------------------------------
app.get('/docs/:docName', (req, res) => {
    const docName = req.params.docName.toLowerCase();
    const markdownPath = path.join(__dirname, 'docs', `${docName}.md`);
    const navPath = path.join(__dirname, 'public', 'nav.html');
    let backLink;

    if (docName !== 'index') { backLink = `<a href="index" class="docs__back-link">⇠ back</a>`; }

    fs.readFile(navPath, 'utf8', (err, navHtml) => {
        if (err) {
            console.error('Error reading nav.html:', err);
            res.status(500).send('Error loading navigation');
            return;
        }

        fs.readFile(markdownPath, 'utf8', (err, markdownContent) => {
            if (err) {
                res.status(404).send('Document not found');
                return;
            }

            const htmlContent = md.render(markdownContent);
            const fullHtml = dedent`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Document</title>
                    <link rel="stylesheet" href="/style.css">
                    <link href="https://prismjs.com/themes/prism-okaidia.css" rel="stylesheet" />
                </head>
                <body>
                    ${navHtml}
                    <div class="markdown-body wrapper docs">
                        ${backLink || ''}
                        ${htmlContent}
                    </div>
                </body>
                </html>
            `;

            res.send(fullHtml);
        });
    });
});


// ---------------------
// -- web page routes --
// ---------------------
// ROOT
app.get('/', (req, res) => {
    console.log("Serving home page with navigation");
    const pagePath = path.join(__dirname, 'public', 'home.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// MESSAGE DATASET
app.get('/page-message-dataset', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'message-dataset.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// QUESTION DATASET
app.get('/page-question-dataset', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'question-dataset.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// MODEL MANAGEMENT
app.get('/page-model-management', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'model-management.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// OPENAI API SETTINGS
app.get('/page-manage-open-ai-api-settings', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'model-management/manage-open-ai-api-settings.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// OPENAI APIS
app.get('/page-manage-open-ai-apis', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'model-management/manage-open-ai-apis.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// CHAT MODELS
app.get('/page-manage-chat-models', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'model-management/manage-chat-models.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// BERT MODELS
app.get('/page-manage-bert-models', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'model-management/manage-bert-models.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// JUDGE MODELS
app.get('/page-manage-judge-models', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'model-management/manage-judge-models.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// AD HOC INFERENCe
app.get('/page-ad-hoc-inference', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'model-management/ad-hoc-inference.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// INIT DATASET
app.get('/page-init-dataset', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'init-dataset.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// JUDGE DATASET Answers
app.get('/page-judge-dataset-answers', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'judge-dataset-answers.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// CHART SCORES
app.get('/page-chart-scores', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'chart-scores.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// CHARTS - MODEL GROUPING BY QA SCORE
app.get('/chart-model-grouping-by-qa-score', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'chart-scores/chart-model-grouping-by-qa-score.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// CHARTS - AVERAGE QA SCORE BY MODEL
app.get('/chart-avg-qa-score-by-model', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'chart-scores/chart-avg-qa-score-by-model.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// CHARTS - AVERAGE INFERENCE TIME BY MODEL
app.get('/chart-avg-inference-time-seconds-by-model', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'chart-scores/chart-avg-inference-time-seconds-by-model.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// CHARTS - AVERAGE INFERENCE TIME BY MODEL
app.get('/chart-avg-inference-time-to-first-token-seconds-by-model', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'chart-scores/chart-avg-inference-time-to-first-token-seconds-by-model.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// CHARTS - MODEL GROUPING BY BERT SCORE
app.get('/chart-model-grouping-by-bert-score', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'chart-scores/chart-model-grouping-by-bert-score.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// CHARTS - AVERAGE BERT SCORE BY MODEL
app.get('/chart-avg-bert-score-by-model', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'chart-scores/chart-avg-bert-score-by-model.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// CHARTS - MODEL GROUPING BY BERT GROUNDED TRUTH SCORE
app.get('/chart-model-grouping-by-bert-grounded-truth-score', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'chart-scores/chart-model-grouping-by-bert-grounded-truth-score.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// CHARTS - AVERAGE BERT GROUNDED TRUTH SCORE BY MODEL
app.get('/chart-avg-bert-grounded-truth-score-by-model', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'chart-scores/chart-avg-bert-grounded-truth-score-by-model.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// GENERATED DATASET
app.get('/page-generated-dataset', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'generated-dataset.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// RESET DATASET
app.get('/page-reset-dataset', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'reset-dataset.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});
// DELETE/RESET DATABASE
app.get('/page-delete-db', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'delete-db.html');
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    pageContent = pageContent.replace('<!--nav-->', res.locals.nav);
    res.send(pageContent);
});


// Start the server on the specified port
app.listen(port, () => {
    console.log('\n\n\n');
    console.log(`Server running on port ${port}`);
    console.log(`http://localhost:${port}`);
    console.log('\n\n');
});
