 let divSelectRoom = document.getElementById("selectRoom")
let divConsultingRoom = document.getElementById("consultingRoom")
let inputRoomNumber = document.getElementById("roomNumber")
let btnGoRoom = document.getElementById("btnGoRoom")
 let localVideos = document.getElementById("localVideo")
 let remoteVideo = document.getElementById("remoteVideo")

 let roomNumber,localStream,remoteStream,rtcPeerConnection,isCaller;

 const iceServers ={
     'iceServer':[

        {'urls':'stun:stun.services.mozilla.com'},
        { 'urls': 'stun:stun.l.google.com:19302' }
     ]
     
 }
 const streamConstraints={
     audio:true,
     video:true
 }

const socket=io()

console.log("btnGoRoom", btnGoRoom)

btnGoRoom.addEventListener("click", () => {
     if(inputRoomNumber.value === ''){
         alert("Please enter Room Number")
     }
     else{
         roomNumber=inputRoomNumber.value
         socket.emit('CreateOrJoin',roomNumber)
         divSelectRoom.style="display:none";
         divConsultingRoom.style="display:block";
     }
 } )

socket.on("created",room=>{
     navigator.mediaDevices.getUserMedia(streamConstraints)
     .then(stream=>{
         localStream=stream
         localVideo.srcObject=stream
         isCaller=true
     })
     .catch(err=>{
         console.log('An error ccuurd',err)
     })
   

 } )


//handler for other 
socket.on("joined", room => {
    navigator.mediaDevices.getUserMedia(streamConstraints)
        .then(stream => {
            localStream = stream
            localVideo.srcObject = stream
            socket.emit('ready',roomNumber)
        })
        .catch(err => {
            console.log('An error ccuurd', err)
        })


})
//handler for ready function
socket.on('ready',()=>{
    if(isCaller){
        rtcPeerConnection=new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate=onIceCandidate
        rtcPeerConnection.ontrack=onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerConnection.addTrack(localStream.getTracks([1],localStream))
        //creating offer
        rtcPeerConnection.createOffer()
            .then(sessionDescription=>{
                rtcPeerConnection.serLocalDescription(sessionDescription)
                socket.emit('offer',{
                    type:offer,
                    sdp:sessionDescription,
                    room:roomNumber
                })
            })
            .catch(err =>{
                console.log('Error occures',err)
            })
    }
})

//handler for offer
socket.on('offer', (event) => {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerConnection.addTrack(localStream.getTracks([1], localStream))
        //remote description
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))

        //creating answer
        rtcPeerConnection.createAnswerr()
            .then(sessionDescription => {
                rtcPeerConnection.serLocalDescription(sessionDescription)
                socket.emit('answer', {
                    type: answer ,
                    sdp: sessionDescription,
                    room: roomNumber
                })
            })
            .catch(err => {
                console.log('Error occures', err)
            })
    }
})
socket.on('answer',event=>{
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))

})

socket.on('candidate',event=>{
    const candidate=new RTCIceCandidate({
        sdpMLineIndex:event.label,
        candidate:event.candidate
    })
    rtcPeerConnection.onIceCandidate(candidate)
})

function onAddStream(event){
    remoteVideo.srcObject=event.streams[0]
    remoteStream=event.streams[0]
}
function onIceCandidate(event){
    if(event.candidate){
        console.log('sending icd candidate',event.candidate)
        socket.emit('candidate',{
            type:'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMId,
            candidate: event.candidate.candidate,
            room:roomNumber

        })
    }
}