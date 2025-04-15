export async function InvokeLLM({ prompt, response_json_schema }) {
    
    // const apiendpoint = "https://get-portfolio-from-user.openai.azure.com/"; // ✅ yours

    const apiKey = process.env.REACT_APP_API_KEY; // subscriptionKey
    const endpoint = process.env.REACT_APP_ENDPOINT;
    const deploymentName = "gpt-35-turbo-1106"; // the name you gave it when deploying
    const apiVersion = "2024-02-15-preview";

    const url = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a financial data parser." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        tools: [
          {
            type: "function",
            function: {
              name: "parse_portfolio",
              description: "Parses user portfolio input",
              parameters: response_json_schema
            }
          }
        ],
        tool_choice: "auto"
      })
    });
  
    const json = await response.json();
    const functionCall = json.choices?.[0]?.message?.tool_calls?.[0]?.function;
    if (!functionCall) throw new Error("Failed to parse result");
  
    return JSON.parse(functionCall.arguments);
  }
  
//   TODO: Implement the actual API call