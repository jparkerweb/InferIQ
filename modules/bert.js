import { env, pipeline } from '@xenova/transformers';

// model environment variables
env.localModelPath = 'models/';
env.cacheDir = 'models/';
env.allowRemoteModels = true;

// generateEmbedding global variables
let generateEmbedding;
let pipelineCreated = false;

// parameters for BERT model
const ONNX_EMBEDDING_MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const ONNX_EMBEDDING_MODEL_QUANTIZED = true;


// ------------------------------------------------------
// -- Function to compute BERT score between two texts --
// ------------------------------------------------------
export async function computeBERTScore(
    textA,
    textB,
    {
        model = ONNX_EMBEDDING_MODEL,
        quantized = ONNX_EMBEDDING_MODEL_QUANTIZED,
    } = {}) {
    await loadBERTModel(model, quantized);

    // Get embeddings or features from BERT model
    const textAEmbedding = await createEmbedding(textA);
    const textBEmbedding = await createEmbedding(textB);

    // Compute BERT Score (e.g., using cosine similarity between embeddings)
    const score = cosineSimilarity(textAEmbedding, textBEmbedding);

    return score;
}


// ---------------------------------
// -- Function to load BERT model --
// ---------------------------------
async function loadBERTModel(model, quantized) {
    if (!pipelineCreated) {
        console.log("Setting up BERT model pipeline...");
    
        // Create the embedding pipeline
        generateEmbedding = await pipeline('feature-extraction', model, {
            quantized: quantized,
        });
    
        pipelineCreated = true;
    }
}


// -------------------------------------
// -- Function to generate embeddings --
// -------------------------------------
async function createEmbedding(text) {
    const embeddings = await generateEmbedding(text, {
        pooling: 'mean',
        normalize: true,
    });

    return embeddings.data;
}


// -----------------------------------------------------
// -- Calculate cosine similarity between two vectors --
// -----------------------------------------------------
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] ** 2;
      normB += vecB[i] ** 2;
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0; // To avoid division by zero
    } else {
      return dotProduct / (normA * normB);
    }
}

async function test(textA, textB) {
    console.log('');
    const score = await computeBERTScore(textA, textB);
    console.log(`BERT Score between "${textA}" and "${textB}" is: ${score}`);
}

// await test("I love apples", "I love oranges");
// await test("I love apples", "I hate oranges");
// await test("I love apples", "I love apples");
// await test("I love apples", "I love apples and oranges");
// await test("I love apples", "I love apples and oranges and bananas");
// await test("I love apples", "I love apples and oranges and bananas and grapes");
// await test("I love apples", "I love apples and oranges and bananas and grapes and pears");
// await test("I love apples", "I love apples and oranges and bananas and grapes and pears and peaches");
// await test("I love apples", "I love apples and oranges and bananas and grapes and pears and peaches and cherries");
// await test("I love apples", "I love apples and oranges and bananas and grapes and pears and peaches and cherries and plums");
