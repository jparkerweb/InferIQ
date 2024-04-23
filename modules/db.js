import sqlite3 from 'sqlite3';
import { seedMessages } from '../data/seedMessages.js';
import { seedQuestions} from '../data/seedQuestions.js';
import { seedChatModels } from '../data/seedChatModels.js';
import { seedJudgeModels } from '../data/seedJudgeModels.js';
import { seedOnnxBERTModels } from '../data/seedOnnxBERTModels.js';
import { seedOpenaiAPIs } from '../data/seedOpenaiAPIs.js';
import { seedOpenaiAPISettings } from '../data/seedOpenaiAPISettings.js';

// --------------------------------------------
// -- create inital DB connection and tables --
// --------------------------------------------
const initializeDatabase = () => {
    let db = new sqlite3.Database('./data/InferIQ.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.error(err.message);
            return;
        } else {
            console.log('Connected to the SQLite database.');

            // Use serialize to ensure that database operations are executed in sequence
            db.serialize(() => {
                // -----------------------
                // -- create dataset table --
                // -----------------------
                db.run(`CREATE TABLE IF NOT EXISTS dataset (
                    id                               INTEGER PRIMARY KEY AUTOINCREMENT,
                    chatModelId                      INTEGER,
                    chatModel                        TEXT,
                    messageId                        INTEGER,
                    message                          TEXT,
                    groundedTruthSummary             TEXT,
                    questionType                     TEXT,
                    questionLabel                    TEXT,
                    question                         TEXT,
                    answer                           TEXT,
                    inferenceTimeSeconds             NUMERIC,
                    inferenceTimeToFirstTokenSeconds NUMERIC,
                    inferenceTimeAPIName             TEXT,
                    fullPrompt                       TEXT,
                    judgeModelId                     INTEGER,
                    judgeModel                       TEXT,
                    judgeRating                      NUMERIC,
                    judgeReasoning                   TEXT,
                    judgeFullResponse                TEXT,
                    onnxBERTModelId                  INTEGER,
                    onnxBERTModel                    TEXT,
                    onnxBERTScore                    NUMERIC,
                    onnxBERTGroundedTruthScore       NUMERIC
                )`, (err) => {
                    if (err) {
                        console.error("Error creating dataset table", err.message);
                    } else {
                        console.log("Dataset table created successfully.");
                    }
                });

                // ---------------------------
                // -- create messages table --
                // ---------------------------
                db.run(`CREATE TABLE IF NOT EXISTS messages (
                    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                    message              TEXT,
                    groundedTruthSummary TEXT
                )`, (err) => {
                    if (err) {
                        console.error("Error creating messages table", err.message);
                    } else {
                        console.log("Messages table created successfully.");
                    }
                });

                // ----------------------------
                // -- create questions table --
                // ----------------------------
                db.run(`CREATE TABLE IF NOT EXISTS questions (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    questionType  TEXT NOT NULL,
                    questionLabel TEXT UNIQUE NOT NULL,
                    question      TEXT NOT NULL
                )`, (err) => {
                    if (err) {
                        console.error("Error creating questions table", err.message);
                    } else {
                        console.log("Questions table created successfully.");
                    }
                });

                // ------------------------------------
                // -- create openaiAPISettings table --
                // ------------------------------------
                db.run(`CREATE TABLE IF NOT EXISTS openaiAPISettings (
                    temperature       NUMERIC DEFAULT (0.1),
                    maxResponseTokens INTEGER DEFAULT (2500),
                    rateLimit         INTEGER DEFAULT (500)                    
                )`, (err) => {
                    if (err) {
                        console.error("Error creating openaiAPISettings table", err.message);
                    } else {
                        console.log("openaiAPISettings table created successfully.");
                    }
                });

                // -----------------------------
                // -- create openaiAPIs table --
                // -----------------------------
                db.run(`CREATE TABLE IF NOT EXISTS openaiAPIs (
                    id     INTEGER PRIMARY KEY AUTOINCREMENT,
                    url    TEXT,
                    apiKey TEXT,
                    name   TEXT
                )`, (err) => {
                    if (err) {
                        console.error("Error creating openaiAPIs table", err.message);
                    } else {
                        console.log("openaiAPIs table created successfully.");
                    }
                });

                // ------------------------------
                // -- create Chat Models table --
                // ------------------------------
                db.run(`CREATE TABLE IF NOT EXISTS chatModels (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    chatModel   TEXT,
                    stopTokens  TEXT,
                    openaiAPIId INTEGER REFERENCES openaiAPIs (id)
                )`, (err) => {
                    if (err) {
                        console.error("Error creating Chat Models table", err.message);
                    } else {
                        console.log("Chat Models table created successfully.");
                    }
                });

                // ----------------------------------
                // -- create QA Judge Models table --
                // ----------------------------------
                db.run(`CREATE TABLE IF NOT EXISTS judgeModels (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    judgeModel  TEXT,
                    stopTokens  TEXT,
                    openaiAPIId INTEGER REFERENCES openaiAPIs (id)
                )`, (err) => {
                    if (err) {
                        console.error("Error creating Jude Models table", err.message);
                    } else {
                        console.log("Judge Models table created successfully.");
                    }
                });

                // ---------------------------------
                // -- create onnxBERTModels table --
                // ----------------------------------
                db.run(`CREATE TABLE IF NOT EXISTS onnxBERTModels (
                    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
                    onnxBERTModel          TEXT,
                    onnxBERTModelQuantized INTEGER
                )`, (err) => {
                    if (err) {
                        console.error("Error creating onnxBERTModel table", err.message);
                    } else {
                        console.log("onnxBERTModels table created successfully.");
                    }
                });

                setTimeout(() => {
                    console.log("Database tables created, inserting seed data.");
                }, 500);

                // -------------------------------------------------------------------------------------------
                // -- if messages table is empty, loop through data/seedMessages.js and insert each message --
                // -------------------------------------------------------------------------------------------
                db.all('SELECT id FROM messages', [], (err, rows) => {
                    if (err) {
                        console.error("Error selecting from messages table", err.message);
                    } else if (rows.length === 0) {
                        // Use serialize to ensure that database operations are executed in sequence
                        db.serialize(() => {
                            seedMessages.forEach((message) => {
                                const insert = 'INSERT INTO messages (message, groundedTruthSummary) VALUES (?, ?)';
                                db.run(insert, [message.message, message.groundedTruthSummary], function(err) {
                                    if (err) {
                                        console.error("Error inserting into messages table", err);
                                    } else {
                                        console.log(`A message has been inserted with rowid ${this.lastID}`);
                                    }
                                });
                            });
                        });
                    }
                });

                // ----------------------------------------------------------------------------------------------
                // -- if questions table is empty, loop through data/seedQuestions.js and insert each question --
                // ----------------------------------------------------------------------------------------------
                db.all('SELECT id FROM questions', [], (err, rows) => {
                    if (err) {
                        console.error("Error selecting from questions table", err.message);
                    } else if (rows.length === 0) {
                        seedQuestions.forEach((question) => {
                            const insert = 'INSERT INTO questions (questionType, questionLabel, question) VALUES (?, ?, ?)';
                            db.run(insert, [question.type, question.label, question.question], function(err) {
                                if (err) {
                                    console.error("Error inserting into questions table", err);
                                } else {
                                    console.log(`A question has been inserted with rowid ${this.lastID}`);
                                }
                            });
                        });
                    }
                });

                // -------------------------------------------------------------------------------------------------
                // -- if chatModels table is empty, loop through data/seedChatModels.js and insert each chatModel --
                // -------------------------------------------------------------------------------------------------
                db.all('SELECT id FROM chatModels', [], (err, rows) => {
                    if (err) {
                        console.error("Error selecting from Chat Models table", err.message);
                    } else if (rows.length === 0) {
                        seedChatModels.forEach((chatModel) => {
                            const stopTokens = JSON.stringify(chatModel.stopTokens);
                            const insert = 'INSERT INTO chatModels (chatModel, stopTokens, openaiAPIId) VALUES (?, ?, ?)';
                            db.run(insert, [chatModel.chatModel, stopTokens, chatModel.openaiAPIId], function(err) {
                                if (err) {
                                    console.error("Error inserting into Chat Models table", err);
                                } else {
                                    console.log(`A chatModel has been inserted with rowid ${this.lastID}`);
                                }
                            });
                        });
                    }
                });

                // ----------------------------------------------------------------------------------------------------
                // -- if judgeModels table is empty, loop through data/seedJudgeModels.js and insert each judgeModel --
                // ----------------------------------------------------------------------------------------------------
                db.all('SELECT id FROM judgeModels', [], (err, rows) => {
                    if (err) {
                        console.error("Error selecting from Judge Models table", err.message);
                    } else if (rows.length === 0) {
                        seedJudgeModels.forEach((judgeModel) => {
                            const stopTokens = JSON.stringify(judgeModel.stopTokens);
                            const insert = 'INSERT INTO judgeModels (judgeModel, stopTokens, openaiAPIId) VALUES (?, ?, ?)';
                            db.run(insert, [judgeModel.judgeModel, stopTokens, judgeModel.openaiAPIId], function(err) {
                                if (err) {
                                    console.error("Error inserting into Judge Models table", err);
                                } else {
                                    console.log(`A judgeModel has been inserted with rowid ${this.lastID}`);
                                }
                            });
                        });
                    }
                });

                // -------------------------------------------------------------------------------------------------------------
                // -- if onnxBERTModels table is empty, loop through data/seedOnnxBERTModels.js and insert each onnxBERTModel --
                // -------------------------------------------------------------------------------------------------------------
                db.all('SELECT id FROM onnxBERTModels', [], (err, rows) => {
                    if (err) {
                        console.error("Error selecting from onnxBERTModels table", err.message);
                    } else if (rows.length === 0) {
                        seedOnnxBERTModels.forEach((onnxBERTModel) => {
                            const insert = 'INSERT INTO onnxBERTModels (onnxBERTModel, onnxBERTModelQuantized) VALUES (?, ?)';
                            db.run(insert, [onnxBERTModel.onnxBERTModel, onnxBERTModel.onnxBERTModelQuantized], function(err) {
                                if (err) {
                                    console.error("Error inserting into onnxBERTModels table", err);
                                } else {
                                    console.log(`A onnxBERTModel has been inserted with rowid ${this.lastID}`);
                                }
                            });
                        });
                    }
                });

                // ---------------------------------------------------------------------------------------------------------
                // -- if openaiAPISettings table is empty, loop through data/seedOpenaiAPISettings.js and insert defaults --
                // ---------------------------------------------------------------------------------------------------------
                db.all('SELECT * FROM openaiAPISettings', [], (err, rows) => {
                    if (err) {
                        console.error("Error selecting from openaiAPISettings table", err.message);
                    } else if (rows.length === 0) {
                        seedOpenaiAPISettings.forEach((apiSetting) => {
                            const insert = 'INSERT INTO openaiAPISettings (temperature, maxResponseTokens, rateLimit) VALUES (?, ?, ?)';
                            db.run(insert, [apiSetting.temperature, apiSetting.maxResponseTokens, apiSetting.rateLimit], function(err) {
                                if (err) {
                                    console.error("Error inserting into openaiAPISettings table", err);
                                } else {
                                    console.log(`An openaiAPI has been inserted with rowid ${this.lastID}`);
                                }
                            });
                        });
                    }
                });

                // ---------------------------------------------------------------------------------------------
                // -- if openaiAPIs table is empty, loop through data/seedOpenaiAPIs.js and insert each API --
                // ---------------------------------------------------------------------------------------------
                db.all('SELECT id FROM openaiAPIs', [], (err, rows) => {
                    if (err) {
                        console.error("Error selecting from openaiAPIs table", err.message);
                    } else if (rows.length === 0) {
                        seedOpenaiAPIs.forEach((api) => {
                            const insert = 'INSERT INTO openaiAPIs (name, url, apiKey) VALUES (?, ?, ?)';
                            db.run(insert, [api.name, api.url, api.apiKey], function(err) {
                                if (err) {
                                    console.error("Error inserting into openaiAPIs table", err);
                                } else {
                                    console.log(`An openaiAPI has been inserted with rowid ${this.lastID}`);
                                }
                            });
                        });
                    }
                });
            });
        }
    });

    return db;
};



// ----------------------
// -- get all messages --
// ----------------------
export function getAllMessages() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM messages';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// -------------------
// -- list messages --
// -------------------
export function listMessages(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM messages LIMIT ? OFFSET ?';
        const countSql = 'SELECT COUNT(*) AS total FROM messages';

        db.get(countSql, [], (err, countResult) => {
            if (err) {
                reject(err.message);
            } else {
                db.all(sql, [limit, offset], (err, rows) => {
                    if (err) {
                        reject(err.message);
                    } else {
                        resolve({ 
                            messages: rows,
                            total: countResult.total
                        });
                    }
                });
            }
        });
    });
}

// ---------------------------------------------
// -- add a new message to the messages table --
// ---------------------------------------------
export function addMessage(message, groundedTruthSummary) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO messages (message, groundedTruthSummary) VALUES (?, ?)';
        db.run(sql, [message, groundedTruthSummary], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
    });
}

// --------------------------------------------
// -- update a message in the messages table --
// --------------------------------------------
export function updateMessage(id, message, groundedTruthSummary) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE messages SET message = ?, groundedTruthSummary = ? WHERE id = ?';
        db.run(sql, [message, groundedTruthSummary, id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Message updated with id: ${id}`);
            }
        });
    });
}

// ----------------------------------------------
// -- delete a message from the messages table --
// ----------------------------------------------
export function deleteMessage(id) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM messages WHERE id = ?';
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Row(s) deleted: ${this.changes}`);
            }
        });
    });
}


// --------------------
// -- list questions --
// --------------------
export function listQuestions() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM questions';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}
// ----------------------------------------
// -- list questions of a sepecific type --
// ----------------------------------------
export function listQuestionsOfType(questionType) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM questions WHERE questionType = ?';
        db.all(sql, [questionType], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// -----------------------------------------------
// -- add a new question to the questions table --
// -----------------------------------------------
export function addQuestion(questionType, questionLabel, question) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO questions (questionType, questionLabel, question) VALUES (?, ?, ?)';
        db.run(sql, [questionType, questionLabel, question], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`A row has been inserted with rowid ${this.lastID}`);
            }
        });
    });
}

// ----------------------------------------------
// -- update a question in the questions table --
// ----------------------------------------------
export function updateQuestion(id, questionType, questionLabel, question) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE questions SET questionType = ?, questionLabel = ?, question = ? WHERE id = ?';
        db.run(sql, [questionType, questionLabel, question, id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Question updated with id: ${id}`);
            }
        });
    });
}

// ------------------------------------------------
// -- delete a question from the questions table --
// ------------------------------------------------
export function deleteQuestion(id) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM questions WHERE id = ?';
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Row(s) deleted: ${this.changes}`);
            }
        });
    });
}


// ---------------------
// -- list chatModels --
// ---------------------
export function listChatModels() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT chatModels.*, openaiAPIs.name as openaiAPIs_name,
                openaiAPIs.url as openaiAPIs_url, openaiAPIs.apiKey as openaiAPIs_apiKey
            FROM chatModels
            LEFT JOIN openaiAPIs ON chatModels.openaiAPIId = openaiAPIs.id
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// -------------------------------------------------
// -- add a new chatModel to the chatModels table --
// -------------------------------------------------
export function addChatModel(chatModel, stopTokens, openaiAPIId) {
    return new Promise((resolve, reject) => {
        // First, check if the chatModel already exists in the table
        const checkSql = `
            SELECT 1 FROM chatModels
            WHERE chatModel = ? AND openaiAPIId = ?
        `;
        db.get(checkSql, [chatModel, openaiAPIId], (err, row) => {
            if (err) {
                reject(err.message);
            } else if (row) {
                resolve("A row with the same chatModel and openaiAPIId already exists.");
            } else {
                // Insert the new row if the combination doesn't exist
                const sql = 'INSERT INTO chatModels (chatModel, stopTokens, openaiAPIId) VALUES (?, ?, ?)';
                db.run(sql, [chatModel, stopTokens, openaiAPIId], function(err) {
                    if (err) {
                        reject(err.message);
                    } else {
                        resolve(`A Chat Model has been inserted with rowid ${this.lastID}`);
                    }
                });
            }
        });
    });
}

// ------------------------------------------------
// -- update a chatModel in the chatModels table --
// ------------------------------------------------
export function updateChatModel(id, chatModel, stopTokens, openaiAPIId) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE chatModels SET chatModel = ?, stopTokens = ?, openaiAPIId = ? WHERE id = ?';
        db.run(sql, [chatModel, stopTokens, openaiAPIId, id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Chat model updated with id: ${id}`);
            }
        });
    });
}

// --------------------------------------------------
// -- delete a chatModel from the chatModels table --
// --------------------------------------------------
export function deleteChatModel(id) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM chatModels WHERE id = ?';
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Row(s) deleted: ${this.changes}`);
            }
        });
    });
}


// ----------------------
// -- list judgeModels --
// ----------------------
export function listJudgeModels() {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT judgeModels.*, openaiAPIs.name as openaiAPIs_name,
            openaiAPIs.url as openaiAPIs_url, openaiAPIs.apiKey as openaiAPIs_apiKey
        FROM judgeModels
        LEFT JOIN openaiAPIs ON judgeModels.openaiAPIId = openaiAPIs.id
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// ---------------------------------------------------
// -- add a new judgeModel to the judgeModels table --
// ---------------------------------------------------
export function addJudgeModel(judgeModel, stopTokens, openaiAPIId) {
    return new Promise((resolve, reject) => {
        // First, check if the judgeModel already exists in the table
        const checkSql = `
            SELECT 1 FROM judgeModels
            WHERE judgeModel = ? AND openaiAPIId = ?
        `;
        db.get(checkSql, [judgeModel, openaiAPIId], (err, row) => {
            if (err) {
                reject(err.message);
            } else if (row) {
                resolve("A row with the same judgeModel and openaiAPIId already exists.");
            } else {
                // Insert the new row if the combination doesn't exist
                const sql = 'INSERT INTO judgeModels (judgeModel, stopTokens, openaiAPIId) VALUES (?, ?, ?)';
                db.run(sql, [judgeModel, stopTokens, openaiAPIId], function(err) {
                    if (err) {
                        reject(err.message);
                    } else {
                        resolve(`A Judge Model has been inserted with rowid ${this.lastID}`);
                    }
                });
            }
        });
    });
}

// --------------------------------------------------
// -- update a judgeModel in the judgeModels table --
// --------------------------------------------------
export function updateJudgeModel(id, judgeModel, stopTokens, openaiAPIId) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE judgeModels SET judgeModel = ?, stopTokens = ?, openaiAPIId = ? WHERE id = ?';
        db.run(sql, [judgeModel, stopTokens, openaiAPIId, id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Judge model updated with id: ${id}`);
            }
        });
    });
}

// --------------------------------------------------
// -- delete a judgeModel from the judgeModels table --
// --------------------------------------------------
export function deleteJudgeModel(id) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM judgeModels WHERE id = ?';
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Row(s) deleted: ${this.changes}`);
            }
        });
    });
}


// -------------------------
// -- list onnxBERTModels --
// -------------------------
export function listOnnxBERTModels() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM onnxBERTModels';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// ---------------------------------------------------------
// -- add a new onnxBERTModel to the onnxBERTModels table --
// ---------------------------------------------------------
export function addOnnxBERTModel(onnxBERTModel, onnxBERTModelQuantized) {
    return new Promise((resolve, reject) => {
        // First, check if the onnxBERTModel already exists in the table
        const checkSql = `
            SELECT 1 FROM onnxBERTModels
            WHERE onnxBERTModel = ?
        `;
        db.get(checkSql, [onnxBERTModel], (err, row) => {
            if (err) {
                reject(err.message);
            } else if (row) {
                resolve("A row with the same onnxBERTModel already exists.");
            } else {
                // Insert the new row if the combination doesn't exist
                const sql = 'INSERT INTO onnxBERTModels (onnxBERTModel, onnxBERTModelQuantized) VALUES (?, ?)';
                db.run(sql, [onnxBERTModel, onnxBERTModelQuantized], function(err) {
                    if (err) {
                        reject(err.message);
                    } else {
                        resolve(`An onnxBERTModel has been inserted with rowid ${this.lastID}`);
                    }
                });
            }
        });
    });
}

// --------------------------------------------------------
// -- update a onnxBERTModel in the onnxBERTModels table --
// ---------------------------------------------------------
export function updateOnnxBERTModel(id, onnxBERTModel, onnxBERTModelQuantized) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE onnxBERTModels SET onnxBERTModel = ?, onnxBERTModelQuantized = ? WHERE id = ?';
        db.run(sql, [onnxBERTModel, onnxBERTModelQuantized, id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`onnxBERTModel updated with id: ${id}`);
            }
        });
    });
}

// ----------------------------------------------------------
// -- delete a onnxBERTModel from the onnxBERTModels table --
// ----------------------------------------------------------
export function deleteOnnxBERTModel(id) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM onnxBERTModels WHERE id = ?';
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Row(s) deleted: ${this.changes}`);
            }
        });
    });
}

// ---------------------------
// -- get openaiAPISettings --
// ---------------------------
export function getOpenaiAPISettings() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM openaiAPISettings';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// ------------------------------------
// -- update openaiAPISettings table --
// ------------------------------------
export function updateOpenaiAPISettings(temperature, maxResponseTokens, rateLimit) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE openaiAPISettings SET temperature = ?, maxResponseTokens = ?, rateLimit = ?';
        db.run(sql, [temperature, maxResponseTokens, rateLimit], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`openaiAPISettings have been updated.`);
            }
        });
    });
}


// ---------------------
// -- list openaiAPIs --
// ---------------------
export function listOpenaiAPIs() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM openaiAPIs';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// -------------------------------------------
// -- add a new API to the openaiAPIs table --
// -------------------------------------------
export function addOpenaiAPI(name, url, apiKey) {
    return new Promise((resolve, reject) => {
        // First, check if the openaiAPI already exists in the table
        const checkSql = `
            SELECT 1 FROM openaiAPIs
            WHERE name = ?
        `;
        db.get(checkSql, [name], (err, row) => {
            if (err) {
                reject(err.message);
            } else if (row) {
                resolve("A row with the same openaiAPI already exists.");
            } else {
                // Insert the new row if the combination doesn't exist
                const sql = 'INSERT INTO openaiAPIs (name, url, apiKey) VALUES (?, ?, ?)';
                db.run(sql, [name, url, apiKey], function(err) {
                    if (err) {
                        reject(err.message);
                    } else {
                        resolve(`An openaiAPI has been inserted with rowid ${this.lastID}`);
                    }
                });
            }
        });
    });
}

// ------------------------------------------------
// -- update a openaiAPI in the openaiAPIs table --
// ------------------------------------------------
export function updateOpenaiAPI(id, name, url, apiKey) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE openaiAPIs SET name = ?, url = ?, apiKey = ? WHERE id = ?';
        db.run(sql, [name, url, apiKey, id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`openaiAPI updated with id: ${id}`);
            }
        });
    });
}

// --------------------------------------------------
// -- delete a openaiAPI from the openaiAPIs table --
// --------------------------------------------------
export function deleteOpenaiAPI(id) {
    return new Promise(async (resolve, reject) => {
        db.serialize(async () => {
            try {
                // First, check if the openaiAPI is in use by a chatModel
                let checkSql = 'SELECT 1 FROM chatModels WHERE openaiAPIId = ?';
                let row = await new Promise((res, rej) => {
                    db.get(checkSql, [id], (err, row) => {
                        if (err) rej(err);
                        else res(row);
                    });
                });

                if (row) {
                    console.log("Unable to Delete; This OpenAI API is linked to a Chat Model.");
                    return reject(`
                        ⛔ This OpenAI API is linked to a Chat Model.
                        Unlink the API from the Manage Chat Models page and try again.
                    `);
                }

                // Next, check if the openaiAPI is in use by a judgeModel
                checkSql = 'SELECT 1 FROM judgeModels WHERE openaiAPIId = ?';
                row = await new Promise((res, rej) => {
                    db.get(checkSql, [id], (err, row) => {
                        if (err) rej(err);
                        else res(row);
                    });
                });

                if (row) {
                    console.log("Unable to Delete; This OpenAI API is linked to a Judge Model.");
                    return reject(`
                        Unable to Delete; This OpenAI API is linked to a Judge Model.
                        Unlink the API from the Manage Judge Models page and try again.
                    `);
                }

                // Finally, delete the openaiAPI if it is not in use
                const sql = 'DELETE FROM openaiAPIs WHERE id = ?';
                await new Promise((res, rej) => {
                    db.run(sql, [id], function(err) {
                        if (err) rej(err);
                        else {
                            console.log(`Row(s) deleted: ${this.changes}`);
                            res(`Row(s) deleted: ${this.changes}`);
                        }
                    });
                });

                resolve("Deletion successful.");
            } catch (error) {
                console.error(error.message);
                reject(error.message);
            }
        });
    });
}


// ------------------------------------------
// -- list all models for ad-hoc inference --
// ------------------------------------------
export function listAllModelsForAdHocInference() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                chatModels.chatModel AS model, chatModels.stopTokens,
                openaiAPIs.name as apiName, openaiAPIs.url as apiUrl, openaiAPIs.apiKey
            FROM chatModels
            LEFT OUTER JOIN openaiAPIs
                on chatModels.openaiAPIId = openaiAPIs.id
        
            UNION ALL
        
            SELECT
                judgeModels.judgeModel AS model, judgeModels.stopTokens,
                openaiAPIs.name as apiName, openaiAPIs.url as apiUrl, openaiAPIs.apiKey
            FROM judgeModels
            LEFT OUTER JOIN openaiAPIs
                on judgeModels.openaiAPIId = openaiAPIs.id
            
            ORDER BY
                model ASC,
                apiName ASC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}



// ----------------------------
// -- list generated dataset --
// ----------------------------
export function listGeneratedDataset(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT * FROM dataset
            WHERE judgeRating IS NOT NULL OR onnxBERTScore IS NOT NULL
            ORDER BY onnxBERTScore DESC, judgeRating DESC
            LIMIT ? OFFSET ?
        `;
        const countSql = `
            SELECT COUNT(*) AS total
            FROM dataset
            WHERE judgeRating IS NOT NULL OR onnxBERTScore IS NOT NULL
        `;

        db.get(countSql, [], (err, countDataset) => {
            if (err) {
                reject(err.message);
            } else {
                db.all(sql, [limit, offset], (err, rows) => {
                    if (err) {
                        reject(err.message);
                    } else {
                        resolve({ 
                            generatedDataset: rows,
                            total: countDataset.total
                        });
                    }
                });
            }
        });
    });
}
// ---------------------------------
// -- get generated dataset by id --
// ---------------------------------
export function getGeneratedDatasetById(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM dataset WHERE id = ?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(row);
            }
        });
    });
}



// ---------------------------------------------------
// -- add new dataset to be answered with judgeModel  --
// ----------------------------------------------------
export function createDatasetWithJudgeModel(
    chatModelId,
    messageId,
    message,
    questionType,
    questionLabel,
    question,
    fullPrompt,
    judgeModelId
) {
    return new Promise((resolve, reject) => {
        // First, check if the combination already exists in the table
        const checkSql = `
            SELECT 1 FROM dataset 
            WHERE chatModelId = ? AND questionLabel = ? AND messageId = ? AND judgeModelId = ?
        `;
        db.get(checkSql, [chatModelId, questionLabel, messageId, judgeModelId], (err, row) => {
            if (err) {
                reject(err.message);
            } else if (row) {
                resolve("A row with the same chatModel, questionLabel, messageId, and judgeModel already exists.");
            } else {
                // Insert the new row if the combination doesn't exist
                const sql = `
                    INSERT INTO dataset (chatModelId, messageId, message, questionType, questionLabel, question, fullPrompt, judgeModelId)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.run(sql, [chatModelId, messageId, message, questionType, questionLabel, question, fullPrompt, judgeModelId], function(err) {
                    if (err) {
                        reject(err.message);
                    } else {
                        resolve(`An dataset has been inserted with rowid ${this.lastID}`);
                    }
                });
            }
        });
    });
}


// --------------------------------------------------------
// -- add new dataset to be answered with onnxBERTModel  --
// --------------------------------------------------------
export function createDatasetWithOnnxBERTModel(
    chatModelId,
    messageId,
    message,
    groundedTruthSummary,
    questionType,
    questionLabel,
    question,
    fullPrompt,
    onnxBERTModelId
) {
    return new Promise((resolve, reject) => {
        // First, check if the combination already exists in the table
        const checkSql = `
            SELECT 1 FROM dataset 
            WHERE chatModelId = ? AND questionLabel = ? AND messageId = ? AND onnxBERTModelId = ?
        `;
        db.get(checkSql, [chatModelId, questionLabel, messageId, onnxBERTModelId], (err, row) => {
            if (err) {
                reject(err.message);
            } else if (row) {
                resolve("A row with the same chatModel, questionLabel, messageId, and onnxBERTModel already exists.");
            } else {
                // Insert the new row if the combination doesn't exist
                const sql = `
                    INSERT INTO dataset (chatModelId, messageId, message, groundedTruthSummary, questionType, questionLabel, question, fullPrompt, onnxBERTModelId)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.run(sql, [chatModelId, messageId, message, groundedTruthSummary, questionType, questionLabel, question, fullPrompt, onnxBERTModelId], function(err) {
                    if (err) {
                        reject(err.message);
                    } else {
                        resolve(`An dataset has been inserted with rowid ${this.lastID}`);
                    }
                });
            }
        });
    });
}


// --------------------------------------
// -- get all questions to be answered --
// --------------------------------------
export function getDatasetToAnswer() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                dataset.*, 
                chatModels.chatModel as cModel, chatModels.stopTokens as cModelStopTokens,
                openaiAPIs.url, openaiAPIs.apiKey, openaiAPIs.name as apiName
            FROM dataset
            JOIN chatModels on dataset.chatModelId = chatModels.id
            JOIN openaiAPIs on openaiAPIs.id = chatModels.openaiAPIId
            WHERE dataset.answer IS NULL
            ORDER BY dataset.messageId ASC, dataset.id ASC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}


// ---------------------------------
// -- update dataset with answers --
// ---------------------------------
export function updateAllDatasetAnswersById(id, model, answer, inferenceTimeSeconds, inferenceTimeToFirstTokenSeconds, inferenceTimeAPIName) {
    return new Promise((resolve, reject) => {
        const sql =`
            UPDATE dataset
            SET chatModel = ?, answer = ?, inferenceTimeSeconds = ?, inferenceTimeToFirstTokenSeconds = ?, inferenceTimeAPIName = ?
            WHERE id = ?
        `;
        db.run(sql, [model, answer, inferenceTimeSeconds, inferenceTimeToFirstTokenSeconds, inferenceTimeAPIName, id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Row(s) updated: ${this.changes}`);
            }
        });
    });
}


// -------------------------------------------------------
// -- get all questions to be evaluated with judgeModel --
// -------------------------------------------------------
export function getDatasetToJudge() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                dataset.*,
                judgeModels.judgeModel as jModel, judgeModels.stopTokens as jModelStopTokens,
                openaiAPIs.url, openaiAPIs.apiKey, openaiAPIs.name as apiName
            FROM dataset
            JOIN judgeModels on dataset.judgeModelId = judgeModels.id
            JOIN openaiAPIs on openaiAPIs.id = judgeModels.openaiAPIId
            WHERE
                dataset.questionType = 'qa' AND
                dataset.answer IS NOT NULL AND
                dataset.judgeRating IS NULL AND
                dataset.judgeModelId IS NOT NULL
            ORDER BY dataset.messageId ASC, dataset.id ASC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}


// ---------------------------------------------------------
// -- update dataset with judgeRating, and judgeReasoning --
// ---------------------------------------------------------
export function updateJudgedDataset(id, judgeModel, judgeRating, judgeReasoning, judgeFullResponse) {
    return new Promise((resolve, reject) => {
        const sql =`
            UPDATE dataset
            SET judgeModel = ?, judgeRating = ?, judgeReasoning = ?, judgeFullResponse = ?
            WHERE id = ?
        `;
        db.run(sql, [judgeModel, judgeRating, judgeReasoning, judgeFullResponse, id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Row(s) updated: ${this.changes}`);
            }
        });
    });
}


// -------------------------------------------------------
// -- get all questions to have a BERT Score calculated --
// -------------------------------------------------------
export function getDatasetToCalculateBERTScore() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                dataset.*,
                onnxBERTModels.onnxBERTModel as LookupOnnxBERTModel,
                onnxBERTModels.onnxBERTModelQuantized as LookupOnnxBERTModelQuantized
            FROM dataset
            JOIN onnxBERTModels on dataset.onnxBERTModelId = onnxBERTModels.id
            WHERE
                dataset.questionType = 'summary' AND
                dataset.answer IS NOT NULL AND
                dataset.onnxBERTScore IS NULL AND
                dataset.onnxBERTModelId IS NOT NULL
            ORDER BY id ASC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}


// ---------------------------------------
// -- update dataset with onnxBERTScore --
// ---------------------------------------
export function updateOnnxBERTScoreDataset(id, onnxBERTModel, onnxBERTScore) {
    return new Promise((resolve, reject) => {
        const sql =`
            UPDATE dataset
            SET onnxBERTModel = ?, onnxBERTScore = ?
            WHERE id = ?
        `;
        db.run(sql, [onnxBERTModel, onnxBERTScore, id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Row(s) updated: ${this.changes}`);
            }
        });
    });
}


// ---------------------------------------------------------------------------
// -- get all questions to have a BERT Score calculated for Grounded Truths --
// ---------------------------------------------------------------------------
export function getDatasetToCalculateBERTScoreGroundedTruth() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                dataset.*,
                onnxBERTModels.onnxBERTModel as LookupOnnxBERTModel,
                onnxBERTModels.onnxBERTModelQuantized as LookupOnnxBERTModelQuantized
            FROM dataset
            JOIN onnxBERTModels on dataset.onnxBERTModelId = onnxBERTModels.id
            WHERE
                dataset.questionType = 'summary' AND
                dataset.groundedTruthSummary IS NOT NULL AND
                dataset.answer IS NOT NULL AND
                dataset.onnxBERTGroundedTruthScore IS NULL AND
                dataset.onnxBERTModelId IS NOT NULL
            ORDER BY id ASC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}


// ---------------------------------------
// -- update dataset with onnxBERTScore --
// ---------------------------------------
export function updateOnnxBERTScoreGroundedTruthDataset(id, onnxBERTModel, onnxBERTGroundedTruthScore) {
    return new Promise((resolve, reject) => {
        const sql =`
            UPDATE dataset
            SET onnxBERTModel = ?, onnxBERTGroundedTruthScore = ?
            WHERE id = ?
        `;
        db.run(sql, [onnxBERTModel, onnxBERTGroundedTruthScore, id], function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`Row(s) updated: ${this.changes}`);
            }
        });
    });
}


// -------------------------
// -- delete all datasets --
// -------------------------
export async function deleteAllDatasets() {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM dataset';
        db.run(sql, function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(`All rows deleted. Changes: ${this.changes}`);
            }
        });
    });
}


// ---------------------
// -- drop all tables --
// ---------------------
export async function dropTables() {
    return new Promise((resolve, reject) => {
        const sql = `
            DROP TABLE IF EXISTS dataset;
            DROP TABLE IF EXISTS messages;
            DROP TABLE IF EXISTS questions;
            DROP TABLE IF EXISTS chatModels;
            DROP TABLE IF EXISTS judgeModels;
            DROP TABLE IF EXISTS onnxBERTModels;
            DROP TABLE IF EXISTS openaiAPIs;
            DROP TABLE IF EXISTS openaiAPISettings;
        `;
        db.exec(sql, function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve('All tables have been dropped.');
            }
        });
    });
}



// <---------------------------------->
// <--- Charting and Data Analysis --->
// <---------------------------------->

// -------------------
// -- ratingByModel --
// -------------------
export function ratingByModel() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                inferenceTimeAPIName || ' > ' || chatModel as chatModel,
                judgeRating,
                COUNT(*) as count
            FROM dataset
            WHERE
                judgeRating IS NOT NULL AND
                judgeRating > 0 AND
                inferenceTimeAPIName IS NOT NULL
            GROUP BY
                inferenceTimeAPIName || ' > ' || chatModel,
                judgeRating
            ORDER BY chatModel, judgeRating
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// ----------------------
// -- avgRatingByModel --
// ----------------------
export function avgRatingByModel() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                inferenceTimeAPIName || ' > ' || chatModel as chatModel,
                AVG(judgeRating) as avgRating
            FROM dataset
            WHERE judgeRating IS NOT NULL AND judgeRating > 0
            GROUP BY inferenceTimeAPIName || ' > ' || chatModel
            ORDER BY avgRating DESC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// ------------------------------------
// -- avgInferenceTimeSecondsByModel --
// ------------------------------------
export function avgInferenceTimeSecondsByModel() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                inferenceTimeAPIName || ' > ' || chatModel as chatModel,
                AVG(inferenceTimeSeconds) as avgInferenceTimeSeconds
            FROM dataset
            WHERE
                answer IS NOT NULL AND
                inferenceTimeSeconds IS NOT NULL AND
                inferenceTimeAPIName IS NOT NULL
            GROUP BY
                inferenceTimeAPIName || ' > ' || chatModel,
                chatModelId
            ORDER BY avgInferenceTimeSeconds ASC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// ------------------------------------
// -- avgInferenceTimeToFirstTokenSecondsByModel --
// ------------------------------------
export function avgInferenceTimeToFirstTokenSecondsByModel() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                inferenceTimeAPIName || ' > ' || chatModel as chatModel,
                AVG(inferenceTimeToFirstTokenSeconds) as avgInferenceTimeToFirstTokenSeconds
            FROM dataset
            WHERE
                answer IS NOT NULL AND
                inferenceTimeToFirstTokenSeconds IS NOT NULL AND
                inferenceTimeAPIName IS NOT NULL
            GROUP BY
                inferenceTimeAPIName || ' > ' || chatModel,
                chatModelId
            ORDER BY avgInferenceTimeToFirstTokenSeconds ASC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// ------------------------------
// -- modelGroupingByBERTScore --
// ------------------------------
export function modelGroupingByBERTScore() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                inferenceTimeAPIName || ' > ' || chatModel as chatModel,
                onnxBERTScore,
                COUNT(*) as count
            FROM dataset
            WHERE
                onnxBERTScore IS NOT NULL AND
                onnxBERTScore >= -1
                AND onnxBERTScore <= 1
            GROUP BY
                inferenceTimeAPIName || ' > ' || chatModel,
                onnxBERTScore
            ORDER BY chatModel, onnxBERTScore
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// -------------------------
// -- avgBERTScoreByModel --
// -------------------------
export function avgBERTScoreByModel() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                inferenceTimeAPIName || ' > ' || chatModel as chatModel,
                AVG(onnxBERTScore) as avgBERTScore
            FROM dataset
            WHERE
                onnxBERTScore IS NOT NULL AND
                onnxBERTScore >= -1
                AND onnxBERTScore <= 1
            GROUP BY inferenceTimeAPIName || ' > ' || chatModel
            ORDER BY avgBERTScore DESC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}


// -------------------------------------------
// -- modelGroupingByBERTGroundedTruthScore --
// -------------------------------------------
export function modelGroupingByBERTGroundedTruthScore() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                inferenceTimeAPIName || ' > ' || chatModel as chatModel,
                onnxBERTGroundedTruthScore,
                COUNT(*) as count
            FROM dataset
            WHERE
                onnxBERTGroundedTruthScore IS NOT NULL AND
                onnxBERTGroundedTruthScore >= -1 AND
                onnxBERTGroundedTruthScore <= 1
            GROUP BY
                inferenceTimeAPIName || ' > ' || chatModel,
                onnxBERTGroundedTruthScore
            ORDER BY
                chatModel,
                onnxBERTGroundedTruthScore
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

// --------------------------------------
// -- avgBERTGroundedTruthScoreByModel --
// --------------------------------------
export function avgBERTGroundedTruthScoreByModel() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                inferenceTimeAPIName || ' > ' || chatModel as chatModel,
                AVG(onnxBERTGroundedTruthScore) as avgBERTGroundedTruthScore
            FROM dataset
            WHERE
                onnxBERTGroundedTruthScore IS NOT NULL AND
                onnxBERTGroundedTruthScore >= -1 AND
                onnxBERTGroundedTruthScore <= 1
            GROUP BY inferenceTimeAPIName || ' > ' || chatModel
            ORDER BY onnxBERTGroundedTruthScore DESC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}


// < ----------------------------------- >
// < ----------------------------------- >
// < ----------------------------------- >

let db = initializeDatabase();

export const resetDatabase = () => {
    db.close();  // Close the existing connection
    db = initializeDatabase();  // Reinitialize the database
};

export default db;