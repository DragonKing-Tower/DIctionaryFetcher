document.addEventListener("DOMContentLoaded", () => {
	//put event listeners in here to allow content to load first

	//button to submit form
	const form = document.querySelector("#user-form");
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		submitHandler();
	});

	//light/darkmode button
	const modeButton = document.querySelector("#change-mode");
	modeButton.addEventListener("click", () => {
		const body = document.querySelector("body");
		if (body.classList.contains("lightmode")) {
			body.classList = "darkmode";
			modeButton.textContent = "Light Mode";
		} else if (body.classList.contains("darkmode")) {
			body.classList = "lightmode";
			modeButton.textContent = "Dark Mode";
		} else {
			errorHandler({ title: "Unable to determine current mode" });
		}
	});
});

//Global Defines
const previousSearchArray = []; //has to be global to persist as long as page does

//Functions
//Read and Display input from API
async function submitHandler() {
	const input = document.getElementById("user-input").value.trim();

	if (input === "") {
		errorHandler(input); //other errors(like bad names) are handled and returned by API
		return; //if this happens, kill function here to prevent wasted time
	}

	let response;
	let data; //define these outside of the try-catch so that we can read them later

	try {
		//use try catch to find network errors
		response = await fetch(
			//wait for the data to get back because we need it for the next thing
			`https://api.dictionaryapi.dev/api/v2/entries/en/${input}`
		);
		data = await response.json(); //process data to make it readable
	} catch (error) {
		errorHandler({ title: "Unable to reach dictionary or parse data" });
		return; //if this happens, kill function here to prevent wasted time
	}

	if (data.title) {
		errorHandler(data); //meaning that an error was found
		return; //if this happens, kill function here to prevent wasted time
	}

	displayData(data[0]);
	//the resspons is an array with 1 object inside, so we directly reference it to make the other function easier to use
}

//does the actual displaying of the data, then calls for it to be stylized
function displayData(data) {
	cleanDisplay(); //remove what was dynamically displayed earlier
	previousSearchArray.push(data.word); //add the word to the history
	const display = document.querySelector("#definitions");

	//make the elements
	const container = document.createElement("div");
	const wordElement = document.createElement("h3");
	const meaningsElement = document.createElement("ol");
	const phoneticsElement = document.createElement("div");

	//display the word
	wordElement.textContent = data.word;

	//generate the meanings to go inside of the meanings element
	for (let index = 0; index < data.meanings.length; index++) {
		const currentMeaning = data.meanings[index]; //named for ease of use

		//make the elements
		const meaningContainer = document.createElement("ul");
		const partOfSpeechElement = document.createElement("li");
		const definitionsElement = document.createElement("ol");

		/*definitions is an array that can have multiple definitions with each having
         their own text. We therefore generate an unknown number of definitions before 
         placing them in definitionsElement*/
		for (
			let inindex = 0;
			inindex < currentMeaning.definitions.length;
			inindex++
		) {
			const currentDefinition = currentMeaning.definitions[inindex]; //named for ease of use

			//see if there is an example
			if (!currentDefinition.example) {
				//make the definition element
				const definitionContainer = document.createElement("ul"); //leave this here for consistency
				const definitionElement = document.createElement("li");

				//place text in element from data
				definitionElement.textContent = `Definition: ${currentDefinition.definition}`;

				//put space over container for better ui
				definitionContainer.classList.add("seperated");

				//put the definition together
				definitionContainer.append(definitionElement);
				definitionsElement.append(definitionContainer);
			} else {
				//make the definition elements
				const definitionContainer = document.createElement("ul");
				const exampleElement = document.createElement("li");
				const definitionElement = document.createElement("li");

				//place text in elements from data
				definitionElement.textContent = `Definition: ${currentDefinition.definition}`;
				exampleElement.textContent = `Example: ${currentDefinition.example}`;

				//put space over container for better ui
				definitionContainer.classList.add("seperated");

				//put the definition together
				definitionContainer.append(definitionElement, exampleElement);
				definitionsElement.append(definitionContainer);
			}
		}

		//place text in elements from data
		partOfSpeechElement.textContent = currentMeaning.partOfSpeech;

		//put meaning together, then add it to meanings
		meaningContainer.append(partOfSpeechElement, definitionsElement);
		meaningsElement.append(meaningContainer);
	} // can't make them functions beause we need different types and numbers of items each time we use them

	//there can be multiple phonetic pornouciations, so we add a button for each with audio or a span without
	for (let index = 0; index < data.phonetics.length; index++) {
		const currentPhonetic = data.phonetics[index]; //ease of use

		//check for audio
		if (currentPhonetic.audio) {
			//create needed elements
			const phoneticAudio = document.createElement("audio");
			const phoneticButtonELement = document.createElement("button");

			//add content to elements
			phoneticAudio.src = currentPhonetic.audio;
			phoneticButtonELement.textContent = currentPhonetic.text;

			//add event listener to button for it to play audio
			phoneticButtonELement.addEventListener("click", () => {
				phoneticAudio.play();
			});

			phoneticsElement.append(phoneticButtonELement, phoneticAudio);
		} else {
			//If no audio, create a span and add it instead
			const phoneticSpan = document.createElement("span");
			phoneticSpan.textContent = currentPhonetic.text;
			phoneticsElement.append(phoneticSpan);
		}
	}

	container.append(wordElement, phoneticsElement, meaningsElement);
	display.append(container);
	stylizeSection(display);
}

//styleizes section, then checks for history matches
function stylizeSection(targetSection) {
	targetSection.classList.add("contentYes"); //update the container to have some styling now that they exist

	//go through previous and current searches and highlight the searched word

	const totalTextInHTML = targetSection.innerHTML;
	//take all of the HTML in a section of a DOM and truns it into a string so we can read/change it

	/*This is something that I had look up. Essentially there is no other good way to go through
        a string checking for multiple potential matches and replacing them: .split(" ") then iterating
        through the array and replacing each match would be prone to errors around grammatical
        syntax like periods. That would also run through the string several times adding
        unneeded complexity*/
	const matchingExpression = new RegExp(
		`\\b(${previousSearchArray.join(`|`)})\\b`,
		"gi"
	);
	/*What this does is create an expression that can match any part of the string without 
        much hassle. \\b(checker)\\b lets us ignore surrounding syntax while still avoiding false
        positives from our target being part of another word or being capitalized. Taking the array
        and joining it with | allow the regular expression to check all of string for every string
        in the array, this improves effeciency. */

	//this is the expression being used to find and then replace the strings
	const highlightedTextInHTML = totalTextInHTML.replace(
		matchingExpression,
		(correctString) => {
			return `<span class = "highlighted">${correctString}</span>`;
		}
	);

	targetSection.innerHTML = highlightedTextInHTML; //return updated HTML
}

//function that checks errors and updates users on erros that have occured
function errorHandler(potentialError) {
	cleanDisplay(); //removes pevious dynamic content
	const errorSection = document.querySelector("#error-display"); //for ease of use

	if (potentialError === "") {
		//checks for the empty input
		errorSection.textContent = "ERROR: Please enter a word";
		stylizeSection(errorSection);
		return false;
	} else if (potentialError.title) {
		//API returns .title if there is error it knows
		errorSection.textContent = `ERROR: ${potentialError.title}`;
		stylizeSection(errorSection);
		return false;
	} else {
		//nothing found
		return true;
	}
}

//function to remove styling and content from the display
function cleanDisplay() {
	const displaySection = document.querySelector("#definitions");
	const errorSection = document.querySelector("#error-display"); //get the displays

	displaySection.classList.remove("contentYes");
	errorSection.classList.remove("contentYes"); //remove the styling

	displaySection.innerHTML = "";
	errorSection.innerHTML = ""; //remove the content
}
