'use strict';
const Alexa = require('alexa-sdk');

//MESSAGES

const WELCOME_MESSAGE = "Welcome to three six nine. You can play three six nine with just me or with friends. Examples are play, play with three people, or help for how to play.";
const START_GAME_MESSAGE = "OK. I will start!";
const HELP_MESSAGE = "Three six nine is a game where we take turns counting up from one. If the number is divisible by three, you're going to say quack. If the number has a three, six, or nine anywhere, you're going to say quack. If the number contains more than one digit that contains either a three, six, or nine, then you're going to say quack quack";
const exitSkillMessage = ["Better luck next time!", "You'll get it next time!", "Good effort", "See you again", "Let's play again"];
const speechConsWrong = ["Argh", "Aw man", "Blarg", "Blast", "Boo", "Bummer", "Darn", "D'oh", "Dun dun dun", "Eek", "Honk", "Le sigh",
"Mamma mia", "Oh boy", "Oh dear", "Oof", "Ouch", "Ruh roh", "Shucks", "Uh oh", "Wah wah", "Whoops a daisy", "Yikes"];

const states = {
    START: "_START",
    GAME: "_GAME"
};

//GAME VARIABLES

var counter = 1; 
var numPlayers = 1; //By default is one

//HANDLERS 

const handlers = {
    //Game goes straight to play currently 
     "LaunchRequest": function() {
        this.handler.state = states.START;
        this.emitWithState("Start");
     },
    "PlayIntent": function() {
        this.handler.state = states.GAME;
        this.emitWithState("Game");
    },
    "PlayWithFriends": function() { 
         const itemSlot = this.event.request.intent.slots.numFriends.value; 
         if (isNaN(itemSlot)){
             let speechOutput = itemSlot + " is not a number. Try again";
             this.response.speak(speechOutput);
             this.emit(':responseReady');
         }
         numPlayers = itemSlot;
         numPlayers++; //account for Alexa
         this.handler.state = states.GAME; 
         this.emitWithState("Game"); 
    },
    "AMAZON.HelpIntent": function() {
        this.response.speak(HELP_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "Unhandled": function() {
        this.handler.state = states.START;
        this.emitWithState("Start");
    }
};


//When skill is in START state
const startHandlers = Alexa.CreateStateHandler(states.START,{
    "Start": function() {
        this.response.speak(WELCOME_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "PlayIntent": function() {
        this.handler.state = states.GAME;
        this.emitWithState("Game");
    },
     "PlayWithFriends": function() { 
         const itemSlot = this.event.request.intent.slots.numFriends.value; 
         if (isNaN(itemSlot)){
             let speechOutput = itemSlot + " is not a number. Try again";
             this.response.speak(speechOutput);
             this.emit(':responseReady');
         }
         numPlayers = itemSlot;
         numPlayers++; //account for Alexa
         this.handler.state = states.GAME; 
         this.emitWithState("Game"); 
    },
    "AMAZON.StopIntent": function() {
        let exitMessage = getExitSkillMessage();
        this.response.speak(exitMessage);
        endGame();
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent": function() {
        let exitMessage = getExitSkillMessage();
        this.response.speak(exitMessage);
        endGame(); 
        this.emit(":responseReady");
    },
    "AMAZON.HelpIntent": function() {
        this.response.speak(HELP_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "Unhandled": function() {
        this.emitWithState("Start");
    }
});


const gameHandlers = Alexa.CreateStateHandler(states.GAME,{
    "Game": function() {
        let speech = ""; 
        let turnDivisible = (counter-1) % (numPlayers); 
        if (turnDivisible == 0) {
            this.emitWithState("NextNumber");    
        } else { 
            this.emit(":ask", speech);
        }
    },
    "NextNumber": function() {
        let speech = " ";
        //If the counter is at 1, the game is beginning with Alexa 
        if (counter == 1) {
            speech += START_GAME_MESSAGE + " ";
        } else { 
            this.attributes.response = " ";    
        }
        
        //check if number contains three, six, nine or divisible by nine
        let divisible = counter % 3; 
        let counterString = counter.toString(); 
        speech += checkQuack(counterString, divisible); 
        //update variables 
        counter++;
        this.emit(":ask", speech);
    },
    "AnswerIntent": function() {
        let correct = checkAnswer(this.event.request.intent.slots, counter);
        //Game continues when you get the correct value
        if (correct) {
            counter++;
            this.emitWithState("Game");
        }
        //Game ends when the value is incorrect
        else {
            let speechOutput = endGame();
            this.response.speak(speechOutput);
            this.emit(":responseReady"); 
        }
    },
    "AMAZON.StopIntent": function() {
        let exitMessage = getExitSkillMessage();
        this.response.speak(exitMessage);
        endGame();
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent": function() {
        let exitMessage = getExitSkillMessage();
        this.response.speak(exitMessage);
        endGame();
        this.emit(":responseReady");
    },
    "AMAZON.HelpIntent": function() {
        this.response.speak(HELP_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "Unhandled": function() {
        let speechOutput = endGame();
        this.response.speak(speechOutput);
        this.emit(":responseReady"); 
    }
});


//FUNCTIONS

//Returns whether the inputted answer is correct (User)  
function checkAnswer(slots, value)
{
        for (var slot in slots) {  
        if (slots[slot].value !== undefined) {
            let slotValue = slots[slot].value.toString().toLowerCase(); 
            let counterValue = value.toString();
            let divisible = value % 3; 
            return (slotValue == checkQuack(counterValue, divisible));
        } 
}
    return false;
    
}
 
//Returns what the correct input/output should be according to game rules (Alexa and User)
function checkQuack(counterString, divisible) { 
    //counter for how many times three, six, nine occurs in the digits of counterString
    let count = 0; 
    while (counterString.indexOf('3') > -1 || counterString.indexOf('6') > -1 || counterString.indexOf('9') > -1) { 
        if (counterString.indexOf('3') > - 1) { 
            let index = counterString.indexOf('3'); 
            count += 1; 
            if (index != 0) { 
                counterString = counterString.slice(0, index) + counterString.slice(index+1); 
            } else { 
                counterString = counterString.slice(index+1);    
            }
        }
        if (counterString.indexOf('6') > - 1) { 
            let index = counterString.indexOf('6'); 
            count += 1; 
            if (index != 0) { 
                counterString = counterString.slice(0, index) + counterString.slice(index+1); 
            } else { 
                counterString = counterString.slice(index+1);    
            } 
        }
        if (counterString.indexOf('9') > - 1) { 
            let index = counterString.indexOf('9'); 
            count += 1; 
            if (index != 0) { 
                counterString = counterString.slice(0, index) + counterString.slice(index+1); 
            } else { 
                counterString = counterString.slice(index+1);    
            }
        }
    }
            
    if (count > 1) { 
        return "quack quack"; 
    } 
    else if (count == 1){
        return "quack"; 
    }
    else if (divisible == 0) {
        return "quack"; 
    }
    else {
        return counterString; 
    }
}

//when the game ends, reset variables, and return message. 
function endGame() { 
    let speechOutput = "";
    let response = getSpeechCon(false);
    response += "your final score is " + counter;
    let exitMessage = getExitSkillMessage();
    speechOutput = response + ". " + exitMessage;
    //Reset variables here 
    counter = 1; 
    numPlayers = 1; 
    return speechOutput; 
}

//Get randomized lost message
function getSpeechCon(type) {
    return "<say-as interpret-as='interjection'>" + speechConsWrong[getRandom(0, speechConsWrong.length-1)] + " </say-as><break strength='strong'/>";
}

function getExitSkillMessage() { 
    return exitSkillMessage[getRandom(0, exitSkillMessage.length-1)]; 
}

//Get random for getSpeechCon function
function getRandom(min, max) {
    return Math.floor(Math.random() * (max-min+1)+min);
}



exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    //alexa.appId = APP_ID;
    alexa.registerHandlers(handlers, startHandlers, gameHandlers);
    alexa.execute();
};
