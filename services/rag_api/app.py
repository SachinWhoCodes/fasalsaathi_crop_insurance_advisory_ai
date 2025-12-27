from flask import Flask, jsonify, request
from src.helper import download_hugging_face_embeddings
from langchain_pinecone import PineconeVectorStore
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from src.prompt import *
import os
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

embeddings = download_hugging_face_embeddings()

index_name = "fasalsaathi-expert-ai" 
docsearch = PineconeVectorStore.from_existing_index(
    index_name=index_name,
    embedding=embeddings
)

retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k": 3})

chatModel = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    temperature=0.7,
    convert_system_message_to_human=True
)

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        ("human", "{input}"),
    ]
)

question_answer_chain = create_stuff_documents_chain(chatModel, prompt)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)

@app.route("/get", methods=["POST"])
def chat():
    data = request.get_json()
    msg = data.get("msg")
    if not msg:
        return jsonify({"error": "No message provided"}), 400
    
    response = rag_chain.invoke({"input": msg})
    return jsonify({"answer": response["answer"]})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=False)
