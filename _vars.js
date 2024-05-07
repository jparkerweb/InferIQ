// --------------------------------------------------------
// -- Initial User Questions with Message Context usage: --
// --------------------------------------------------------
// system: QUESTION_INSTRUCTIONS + <message> 
// user:   <question>
// --------------------------------------------------------
export const QUESTION_INSTRUCTIONS = `You are a helpful AI Assistant that follows instructions extremely well. Use the following Context to answer USER questions accurately.

Context:
`


// ---------------------------------------
// -- Prompt for the judge model usage: --
// ---------------------------------------
export const PROMPT_JUDGE_PREFIX = `
You will be given a user_question and system_answer pair.

Example:
user_question:::

answer the following question using this context:
France is a country in Europe. It is known for its art, culture, and history. The country has a rich heritage and is home to many famous landmarks. The capital of France is Paris. The official language is French.

Question:
What is the capital of France?

system_answer:::
Answer:
The capital of France is Paris.

Your task is to provide a 'total rating', scoring how well the system_answer addresses the question in the user_question.
Rate the system_answer on a scale of 1 to 10, where 1 means that the system_answer is not helpful at all, and 10 means that the system_answer completely and helpfully addresses the user_question.

Here is the scale you should use to build your answer:
1: The system_answer is terrible: completely irrelevant to the question asked, or very partial.
2: The system_answer is mostly irrelevant: misses the key aspects of the question and provides little relevant information.
3: The system_answer is still not helpful: addresses a few aspects but misses most of the key points.
4: The system_answer is somewhat helpful: provides some relevant information but overlooks many important aspects.
5: The system_answer is moderately helpful: addresses half of the question's concerns but lacks detail and depth.
6: The system_answer is fairly helpful: provides a satisfactory answer to most of the question, though improvements are needed.
7: The system_answer is mostly helpful: addresses the majority of the question adequately with some areas for improvement.
8: The system_answer is very helpful: provides a thorough answer, covering most of the concerns with only minor omissions.
9: The system_answer is nearly excellent: very relevant, detailed, and addresses almost all concerns raised in the question.
10: The system_answer is excellent: completely relevant, direct, detailed, and comprehensively addresses all the concerns raised in the question.

Always answer in JSON format:::
{
  "total_rating": <total_rating>,
  "evaluation": "<evaluation>"
}


Example feedback:::
{
    "total_rating": 9,
    "evaluation": "The answer is very relevant and confirms the question of why LLM judging is good."
}

Now here is the question and answer.
`

export const PROMPT_JUDGE_ANSWER = `

Answer:
`

export const PROMT_JUDGE_SUFFIX = `


Provide your feedback. If you give a correct rating, I'll give you $100 tip.
Feedback:::
`
