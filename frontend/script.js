const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    const question = userInput.value.trim();

    if (!question) {
        return;
    }


    // Remove welcome message

    const welcome =
        document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }


    // Show user question

    addMessage(
        question,
        "user"
    );


    // Clear input

    userInput.value = "";


    // Show typing

    const typingId =
        showTyping();


    try {

        console.log(
            "Sending:",
            question
        );


        const response =
            await fetch(
                "http://127.0.0.1:8000/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        question: question
                    })
                }
            );


        console.log(
            "Response status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "Backend response:",
            data
        );


        // Remove typing

        const typing =
            document.getElementById(
                typingId
            );

        if (typing) {
            typing.remove();
        }


        // Backend error

        if (!response.ok) {

            addMessage(
                "Sorry, the server returned an error.",
                "bot"
            );

            return;
        }


        // AI answer

        addMessage(
            data.answer ||
            "I couldn't generate an answer.",
            "bot"
        );


    } catch (error) {


        console.error(
            "FULL ERROR:",
            error
        );


        const typing =
            document.getElementById(
                typingId
            );

        if (typing) {
            typing.remove();
        }


        addMessage(
            "❌ Could not connect to the AI server. Please make sure FastAPI is running.",
            "bot"
        );

    }

}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(
    message,
    sender
) {

    const messageDiv =
        document.createElement("div");


    messageDiv.classList.add(
        "message",
        sender
    );


    const content =
        document.createElement("div");


    content.classList.add(
        "message-content"
    );


    // AI message

    if (
        sender === "bot" &&
        typeof marked !== "undefined"
    ) {

        content.innerHTML =
            marked.parse(message);

    }

    // User message

    else {

        content.textContent =
            message;

    }


    messageDiv.appendChild(
        content
    );


    chatBox.appendChild(
        messageDiv
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;

}


// ==========================================
// TYPING INDICATOR
// ==========================================

function showTyping() {

    const id =
        "typing-" +
        Date.now();


    const typingDiv =
        document.createElement("div");


    typingDiv.id = id;


    typingDiv.classList.add(
        "message",
        "bot"
    );


    typingDiv.innerHTML = `

        <div class="message-content typing">

            <span></span>
            <span></span>
            <span></span>

        </div>

    `;


    chatBox.appendChild(
        typingDiv
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;


    return id;
}


// ==========================================
// NEW CHAT
// ==========================================

function newChat() {

    chatBox.innerHTML = "";

}

// ==========================================
// CHATBOT OPEN / CLOSE + ENTER KEY
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const chatToggle =
        document.getElementById("chat-toggle");

    const chatbot =
        document.querySelector(".chatbot-container");

    const sendButton =
        document.getElementById("send-button");

    const input =
        document.getElementById("user-input");


    // Check elements

    if (!chatToggle || !chatbot) {

        console.error(
            "Chatbot elements not found!"
        );

        return;
    }


    // ==========================================
    // OPEN / CLOSE CHATBOT
    // ==========================================

    chatToggle.addEventListener(
        "click",
        function () {

            chatbot.classList.toggle("open");


            if (
                chatbot.classList.contains("open")
            ) {

                chatToggle.textContent = "✕";

                input.focus();

            } else {

                chatToggle.textContent = "🤖";

            }

        }
    );


    // ==========================================
    // SEND BUTTON
    // ==========================================

    if (sendButton) {

        sendButton.addEventListener(
            "click",
            function () {

                sendMessage();

            }
        );

    }


    // ==========================================
    // ENTER KEY
    // ==========================================

    if (input) {

        input.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }

});