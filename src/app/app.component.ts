import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SocketService } from './socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private peerConnections = [];
  public peerConnection: any;

  @ViewChild('video') public video: ElementRef;
  @ViewChild('videoClient') public video2: ElementRef;

  constructor(private socketService: SocketService) { }

  public ngOnInit() {

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      this.video.nativeElement.srcObject = stream;
      this.socketService.socket.emit('broadcaster');
    }).catch(error => console.error(error));

    this.socketService.socket.on('answer', (id, description) => {
      this.peerConnections[id].setRemoteDescription(description);
    });

    this.socketService.socket.on('watcher', (id) => {
      const peerConnection = new RTCPeerConnection();
      this.peerConnections[id] = peerConnection;
      const stream = this.video.nativeElement.srcObject;
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

      peerConnection.createOffer()
      .then(sdp => peerConnection.setLocalDescription(sdp))
      .then(() => {
        this.socketService.socket.emit('offer', id, peerConnection.localDescription);
      });
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socketService.socket.emit('candidate', id, event.candidate);
        }
      };
    });

    this.socketService.socket.on('offer', (id, description) => {
      this.peerConnection = new RTCPeerConnection();
      this.peerConnection.setRemoteDescription(description)
      .then(() => this.peerConnection.createAnswer())
      .then(sdp => this.peerConnection.setLocalDescription(sdp))
      .then(() => {
        this.socketService.socket.emit('answer', id, this.peerConnection.localDescription);
      });
      this.peerConnection.ontrack = (event) => {
        this.video2.nativeElement.srcObject = event.streams[0];
      };
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socketService.socket.emit('candidate', id, event.candidate);
        }
      };
    });

    this.socketService.socket.on('connect', () => {
      this.socketService.socket.emit('watcher');
    });

    this.socketService.socket.on('broadcaster', () => {
      this.socketService.socket.emit('watcher');
    });

    // this.socketService.socket.on('candidate', (id, candidate) => {
    //   this.peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
    // });

    this.socketService.socket.on('bye', (id) => {
      if (this.peerConnections[id]) { this.peerConnections[id].close(); }
      delete this.peerConnections[id];
    });
  }

}
