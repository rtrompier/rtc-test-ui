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

  @ViewChild('myVideo') public myVideo: ElementRef;
  @ViewChild('videoCandidate') public candidateVideo: ElementRef;

  constructor(private socketService: SocketService) { }

  public ngOnInit() {

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      this.myVideo.nativeElement.srcObject = stream;

      // Pass video element to service
      this.socketService.init(this.myVideo.nativeElement, this.candidateVideo.nativeElement);

      this.socketService.socket.emit('broadcaster');
    }).catch(error => console.error(error));


    // this.socketService.socket.on('candidate', (id, candidate) => {
    //   this.peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
    // });

    // this.socketService.socket.on('bye', (id) => {
    //   if (this.peerConnections[id]) { this.peerConnections[id].close(); }
    //   delete this.peerConnections[id];
    // });
  }

}
