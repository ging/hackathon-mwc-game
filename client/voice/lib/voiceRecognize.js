var VOICE = VOICE || {};

// It has been developed by GING (New Generation Internet Group) in
// the Technical University of Madrid.
VOICE.AUTHORS = 'UPM';


VOICE = (function (VO, undefined) {
	
	var recognizeSpeech;		  
    
    recognizeSpeech = function() { 
    	console.log("checking Web Speech API support");
			if (!('webkitSpeechRecognition' in window)) {
  			upgrade();
			} else {
			  var recognition = new webkitSpeechRecognition();
			  recognition.continuous = true;
			  recognition.interimResults = true;	
			  
			  recognition.onstart = function() {console.log('listening')};
			
			  recognition.onresult = function(e) {
			  	console.log('results');
			    var interim_transcript = '';
			
			    for (var i = event.resultIndex; i < event.results.length; ++i) {
			      if (event.results[i].isFinal) {
			        final_transcript += event.results[i][0].transcript;
			      } else {
			        interim_transcript += event.results[i][0].transcript;
			      }
			    }
			    final_transcript = capitalize(final_transcript);
			    final_span.innerHTML = linebreak(final_transcript);
			    interim_span.innerHTML = linebreak(interim_transcript);
			  };
			}
			  //recognition.onerror = function(event) { ... }
			 // recognition.onend = function() { ... }
			
			
			  	
    }
    
    return {
    	recognizeSpeech : recognizeSpeech    	
    }

}(VOICE));

