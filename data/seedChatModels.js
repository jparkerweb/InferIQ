export const seedChatModels = [
    {
        "chatModel": "mistralai/Mixtral-8x7B-Instruct-v0.1",
        "stopTokens": ["[/INST]", "</s>"],
        "openaiAPIId": 1
    },
    {
        "chatModel": "mistral.mixtral-8x7b-instruct-v0:1",
        "stopTokens": ["[/INST]", "</s>"],
        "openaiAPIId": 2
    },
    {
        "chatModel": "mistral.mixtral-8x7b-instruct-v0:1",
        "stopTokens": ["[/INST]", "</s>"],
        "openaiAPIId": 3
    },
    {
        "chatModel": "meta-llama/Llama-3-70b-chat-hf",
        "stopTokens": ["<|eot_id|>"],
        "openaiAPIId": 1
    },
    {
        "chatModel": "meta-llama/Llama-3-8b-chat-hf",
        "stopTokens": ["<|eot_id|>"],
        "openaiAPIId": 1
    },
    {
        "chatModel": "teknium/OpenHermes-2p5-Mistral-7B",
        "stopTokens": ["<|im_end|>", "<|im_start|>"],
        "openaiAPIId": 1
    },
];