function createPeerConnection() {
    var pc_config;
    var pc_constraints;
    // Force the use of a number IP STUN server for Firefox.
    try {
      // Create an RTCPeerConnection via the polyfill (adapter.js).
      pc = new webkitRTCPeerConnection(pc_config, pc_constraints);
      pc.onicecandidate = onIceCandidate;
      console.log("Created RTCPeerConnnection with:\n" + 
                  "  config: \"" + JSON.stringify(pc_config) + "\";\n" + 
                  "  constraints: \"" + JSON.stringify(pc_constraints) + "\".");
    } catch (e) {
      console.log("Failed to create PeerConnection, exception: " + e.message);
      alert("Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.");
        return;
    }

    pc.onaddstream = onRemoteStreamAdded;
    pc.onremovestream = onRemoteStreamRemoved;
  }

  var sdpConstraints = {'mandatory': {
                          'OfferToReceiveAudio':true, 
                          'OfferToReceiveVideo':true }};

   function doAnswer() {
    console.log("Sending answer to peer.");
    pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
  }

  function processSignalingMessage(message) {
    var msg = JSON.parse(message);

    if (msg.type === 'offer') {
      

      pc.setRemoteDescription(new RTCSessionDescription(msg));
      doAnswer();
    } else if (msg.type === 'answer' && started) {
      pc.setRemoteDescription(new RTCSessionDescription(msg));
    } else if (msg.type === 'candidate' && started) {
      var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label,
                                           candidate:msg.candidate});
      pc.addIceCandidate(candidate);
    } else if (msg.type === 'bye' && started) {
      onRemoteHangup();
    }
  }



  function onIceCandidate(event) {
    if (event.candidate) {
      sendMessage({type: 'candidate',
                   label: event.candidate.sdpMLineIndex,
                   id: event.candidate.sdpMid,
                   candidate: event.candidate.candidate});
    } else {
      console.log("End of candidates.");
    }
  }

  function onRemoteStreamAdded(e) {
    
    var stream = e.stream;
    var url = webkitURL.createObjectURL(stream);
    document.getElementById('remoteView').src = url;

  }
  function onRemoteStreamRemoved(event) {
    console.log("Remote stream removed.");
  }


  function doCall() {
    var constraints  = {
        'mandatory': {
            'OfferToReceiveVideo': 'true',
            'OfferToReceiveAudio': 'true'
        }
    };
 
    console.log("Sending offer to peer, with constraints: \n" +
                "  \"" + JSON.stringify(constraints) + "\".")
    pc.createOffer(setLocalAndSendMessage, null, constraints);
  }

  function setLocalAndSendMessage(sessionDescription) {
    // Set Opus as the preferred codec in SDP if Opus is present.
    sessionDescription.sdp = preferOpus(sessionDescription.sdp);
    pc.setLocalDescription(sessionDescription);
    sendMessage(sessionDescription);
  }

  function preferOpus(sdp) {
    var sdpLines = sdp.split('\r\n');

    // Search for m line.
    for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=audio') !== -1) {
          var mLineIndex = i;
          break;
        } 
    }
    if (mLineIndex === null)
      return sdp;

    // If Opus is available, set it as the default in m line.
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('opus/48000') !== -1) {        
        var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
        if (opusPayload)
          sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
        break;
      }
    }

    // Remove CN in m line and sdp.
    sdpLines = removeCN(sdpLines, mLineIndex);

    sdp = sdpLines.join('\r\n');
    return sdp;
  }

   function extractSdp(sdpLine, pattern) {
    var result = sdpLine.match(pattern);
    return (result && result.length == 2)? result[1]: null;
  }


 function setDefaultCodec(mLine, payload) {
    var elements = mLine.split(' ');
    var newLine = new Array();
    var index = 0;
    for (var i = 0; i < elements.length; i++) {
      if (index === 3) // Format of media starts from the fourth.
        newLine[index++] = payload; // Put target payload to the first.
      if (elements[i] !== payload)
        newLine[index++] = elements[i];
    }
    return newLine.join(' ');
  }

   function removeCN(sdpLines, mLineIndex) {
    var mLineElements = sdpLines[mLineIndex].split(' ');
    // Scan from end for the convenience of removing an item.
    for (var i = sdpLines.length-1; i >= 0; i--) {
      var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
      if (payload) {
        var cnPos = mLineElements.indexOf(payload);
        if (cnPos !== -1) {
          // Remove CN payload from m line.
          mLineElements.splice(cnPos, 1);
        }
        // Remove CN line in sdp
        sdpLines.splice(i, 1);
      }
    }

    sdpLines[mLineIndex] = mLineElements.join(' ');
    return sdpLines;
  }

   function sendMessage(message) {
    var msgString = JSON.stringify(message);
    console.log('C->S: ' + msgString);
    
    socket.emit('sdp', msgString);

  }