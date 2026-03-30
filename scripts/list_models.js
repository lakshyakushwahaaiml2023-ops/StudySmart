require("dotenv").config({ path: ".env.local" });
const Groq = require("groq-sdk");
async function main() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const models = await groq.models.list();
  models.data.forEach(m => console.log(m.id));
}
main();
