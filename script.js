const status = document.getElementById("status");
const response = document.getElementById("response");
const command = document.getElementById("command");
const mic = document.getElementById("mic");
const send = document.getElementById("send");

let geminiKey = "";
let busy = false;

const history = [
    {
        role: "system",
        content: "Du bist JARVIS, ein intelligenter persönlicher Assistent. Antworte auf Deutsch, professionell, freundlich und präzise. Sprich deinen Benutzer mit Sir an."
    }
];

function speak(text) {
    response.textContent = text;

    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = "de-DE";
    voice.rate = 0.95;
    voice.pitch = 0.8;
    const markus = speechSynthesis.getVoices().find(v => v.name.includes("Markus"));
if (markus) {
    voice.voice = markus;
}
    speechSynthesis.cancel();
speechSynthesis.resume();
    status.textContent = "SYSTEM SPEAKING";

    voice.onend = () => {
        status.textContent = "SYSTEM ONLINE";
    };

    voice.onerror = () => {
        status.textContent = "SYSTEM ONLINE";
    };

    speechSynthesis.speak(voice);
}


async function askAI(text) {
    if (busy) return;

    if (!geminiKey) {
        geminiKey = prompt("Google Gemini API-Schlüssel eingeben:")?.trim() || "";
    }

    if (!geminiKey) {
        speak("Kein API-Schlüssel vorhanden, Sir.");
        return;
    }

    busy = true;
    status.textContent = "SYSTEM THINKING";
    response.textContent = "Analysiere Anfrage...";

    try {
        const result = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": geminiKey
                },
                body: JSON.stringify({
                    tools: [{ google_search: {} }],
                    contents: [{
                        parts: [{
                            text: "Du bist JARVIS. Antworte auf Deutsch, professionell und präzise. Sprich mich mit Sir an. " + text
                        }]
                    }]
                })
            }
        );

        const data = await result.json();

        if (!result.ok) {
            throw new Error(JSON.stringify(data.error));
        }

        const answer = data.candidates?.[0]?.content?.parts
            ?.map(p => p.text || "").join("");

        speak(answer || "Keine Antwort erhalten, Sir.");

    } catch (error) {
        speak("Systemfehler: " + error.message);
    } finally {
        busy = false;
    }
}


async function processCommand(text) {

    text = text.trim();

    if (!text || busy) return;

    command.value = "";

    const input = text.toLowerCase();

    if (input === "hallo") {
        speak("Guten Tag, Sir. Wie kann ich Ihnen helfen?");
    }

    else if (input === "uhrzeit" ||
             input === "wie spät ist es" ||
             input === "wie spät ist es?") {

        const time = new Date().toLocaleTimeString(
            "de-DE",
            {hour: "2-digit", minute: "2-digit"}
        );

        speak("Es ist " + time + " Uhr, Sir.");
    }

    else if (input === "datum") {
        speak("Heute ist der " +
            new Date().toLocaleDateString("de-DE"));
    }

    else if (input === "wer bist du" ||
             input === "wer bist du?") {
        speak("Ich bin JARVIS, Ihr persönlicher intelligenter Assistent.");
    }

    else if (input === "systemstatus") {
        speak("Alle grundlegenden Systeme sind einsatzbereit, Sir.");
    }

    else {
        await askAI(text);
    }
}

send.addEventListener("click", () => {
    processCommand(command.value);
});

command.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        processCommand(command.value);
    }
});

const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

mic.addEventListener("click", () => {

    if (busy) return;

    if (!Recognition) {
        speak("Die Spracherkennung wird von diesem Browser nicht unterstützt.");
        return;
    }

    const recognition = new Recognition();

    recognition.lang = "de-DE";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        status.textContent = "SYSTEM LISTENING";
    };

    recognition.onresult = (event) => {
        processCommand(event.results[0][0].transcript);
    };

    recognition.onerror = () => {
        status.textContent = "MICROPHONE ERROR";
    };

    recognition.onend = () => {
        if (!busy && !speechSynthesis.speaking) {
            status.textContent = "SYSTEM ONLINE";
        }
    };

    try {
        recognition.start();
    } catch (error) {
        status.textContent = "MICROPHONE ERROR";
    }
});
