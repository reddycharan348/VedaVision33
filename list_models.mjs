import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyA245LbKfw7uHql6RVfojpqJ67wxKuPuLk";
const ai = new GoogleGenAI({ apiKey });

async function list() {
    try {
        const models = await ai.models.list();
        console.log(JSON.stringify(models, null, 2));
    } catch (e) {
        console.error(e);
    }
}

list();
